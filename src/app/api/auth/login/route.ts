import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/validators/auth.validator";
import { authService } from "@/services/auth.service";
import { getTokenCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espere un momento." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues ?? parsed.error;
      const msg = Array.isArray(issues) ? issues[0]?.message : "Datos invalidos";
      return NextResponse.json(
        { error: msg || "Datos invalidos" },
        { status: 400 }
      );
    }

    const result = await authService.login(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const response = NextResponse.json({
      usuario: result.usuario,
    });

    const cookieOpts = getTokenCookieOptions();
    response.cookies.set(cookieOpts.name, result.token!, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
