import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/s/",
  "/tp/",
];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/projects",
  "/editor",
  "/admin",
  "/relatorio",
  "/activities",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
  if (isPublic) {
    return securityHeaders(NextResponse.next());
  }

  // Rotas protegidas - por enquanto só adiciona headers
  // TODO: Verificar session cookie (Firebase Admin SDK) para auth server-side real
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected) {
    // Futuro: const session = request.cookies.get("__session")?.value;
    //         if (!session) return NextResponse.redirect(new URL("/login", request.url));
    return securityHeaders(NextResponse.next());
  }

  // Demais rotas: adiciona headers de segurança
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
