import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/s/",
  "/tp/",
  "/api/",
];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/projects",
  "/editor",
  "/admin",
  "/relatorio",
  "/activities",
  "/profile",
];

const TOKEN_COOKIE = "tp_token";
const DEMO_COOKIE = "tp_demo";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
  if (isPublic) {
    return securityHeaders(NextResponse.next());
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const demoView = request.cookies.get(DEMO_COOKIE)?.value;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected && !token && !(demoView === "admin" || demoView === "tecnico")) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/login") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return securityHeaders(NextResponse.next());
}

function securityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?|map)$).*)",
  ],
};
