import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "ucsm-asistencia-secret-change-in-production"
);
const TOKEN_NAME = "ucsm_asistencia_token";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/health"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  const token = request.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, SECRET_KEY);
    return addSecurityHeaders(NextResponse.next());
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sesion expirada" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(TOKEN_NAME);
    return response;
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
