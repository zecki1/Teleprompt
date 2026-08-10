import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cache = new Map<string, { image: string; expiry: number }>();
const CACHE_TTL = 60 * 60 * 1000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function isSafeUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return false;
  }
  return true;
}

function looksLikeDirectImage(url: string): boolean {
  const path = url.split(/[?#]/)[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|avif|svg|bmp)$/.test(path);
}

function resolveUrl(raw: string, base: string): string {
  try {
    return new URL(raw, base).href;
  } catch {
    return raw;
  }
}

function extractMetaImage(html: string, baseUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return resolveUrl(m[1], baseUrl);
  }
  return null;
}

async function resolveImageFromHtml(target: string): Promise<string | null> {
  try {
    const res = await fetch(target, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.startsWith("image/")) return target;
    const html = await res.text();
    return extractMetaImage(html, res.url || target);
  } catch {
    return null;
  }
}

async function resolveViaMicrolink(target: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(target)}&meta=true&image.width=800`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const img = data?.data?.image?.url;
    if (img && isSafeUrl(img)) return img;
    return null;
  } catch {
    return null;
  }
}

async function resolveImageUrl(target: string): Promise<string | null> {
  if (looksLikeDirectImage(target)) return target;
  const direct = await resolveImageFromHtml(target);
  if (direct) return direct;
  return resolveViaMicrolink(target);
}

async function proxyImage(imageUrl: string): Promise<Response | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/*, */*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const body = await res.arrayBuffer();
    const type = res.headers.get("content-type") || "image/jpeg";
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url")?.trim();
  if (!target || !isSafeUrl(target)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  let cached = cache.get(target);
  if (!cached || Date.now() > cached.expiry) {
    const image = await resolveImageUrl(target);
    if (!image || !isSafeUrl(image)) {
      return NextResponse.json({ error: "No image found" }, { status: 404 });
    }
    cached = { image, expiry: Date.now() + CACHE_TTL };
    cache.set(target, cached);
  }

  const raw = searchParams.get("raw");
  if (raw === "1") {
    const proxied = await proxyImage(cached.image);
    if (proxied) return proxied;
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  return NextResponse.json({ image: cached.image, url: target });
}
