import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/validators/auth.validator";
import { authService } from "@/services/auth.service";
import { getTokenCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const LOCKOUT_THRESHOLD = 10;
const WINDOW_MS = 60_000;
const LOCKOUT_MS = 15 * 60_000;
const attempts = new Map<string, { count: number; resetAt: number; locked: boolean }>();

function checkLoginLimit(ip: string): { allowed: boolean; locked: boolean } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS, locked: false });
    return { allowed: true, locked: false };
  }

  if (record.locked) {
    return { allowed: false, locked: true };
  }

  if (record.count >= LOCKOUT_THRESHOLD) {
    record.locked = true;
    record.resetAt = now + LOCKOUT_MS;
    return { allowed: false, locked: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, locked: false };
  }

  record.count++;
  return { allowed: true, locked: false };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  const limit = checkLoginLimit(ip);
  if (!limit.allowed) {
    const message = limit.locked
      ? "Cuenta bloqueada temporalmente por multiples intentos fallidos. Espere 15 minutos."
      : "Demasiados intentos. Espere un momento.";
    return NextResponse.json({ error: message }, { status: 429 });
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
