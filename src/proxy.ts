import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("asistepro_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Token expirado" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("asistepro_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
