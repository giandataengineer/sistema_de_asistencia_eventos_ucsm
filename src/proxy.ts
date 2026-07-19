import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limiter";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimitConfig(pathname: string, method: string) {
  if (pathname.startsWith("/api/auth")) return RATE_LIMITS.auth;
  if (pathname.includes("/exportar")) return RATE_LIMITS.export;
  if (method === "POST" || method === "PUT" || method === "DELETE") return RATE_LIMITS.write;
  return RATE_LIMITS.api;
}

function applyHeaders(response: NextResponse, extra?: Record<string, string>): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const ip = getClientIP(request);
    const config = getRateLimitConfig(pathname, request.method);
    const key = `${ip}:${pathname.split("/").slice(0, 4).join("/")}`;
    const result = checkRateLimit(key, config);
    const rlHeaders = rateLimitHeaders(config, result.remaining, result.retryAfter);

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." },
        { status: 429 }
      );
      return applyHeaders(response, rlHeaders);
    }

    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return applyHeaders(NextResponse.next(), rlHeaders);
    }

    const token = request.cookies.get("ucsm_asistencia_token")?.value;

    if (!token) {
      return applyHeaders(
        NextResponse.json({ error: "No autorizado" }, { status: 401 }),
        rlHeaders
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return applyHeaders(
        NextResponse.json({ error: "Token expirado" }, { status: 401 }),
        rlHeaders
      );
    }

    return applyHeaders(NextResponse.next(), rlHeaders);
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return applyHeaders(NextResponse.next());
  }

  const token = request.cookies.get("ucsm_asistencia_token")?.value;

  if (!token) {
    return applyHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("ucsm_asistencia_token");
    return applyHeaders(response);
  }

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
