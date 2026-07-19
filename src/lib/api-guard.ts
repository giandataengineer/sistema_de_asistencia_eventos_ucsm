import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./auth";
import { checkRateLimit, rateLimitHeaders, type RateLimitConfig, RATE_LIMITS } from "./rate-limiter";
import { createLogger } from "./logger";
import type { JWTPayload } from "@/interfaces/usuario.interface";

const logger = createLogger("api-guard");

const MAX_BODY_SIZE = 1_048_576;

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

interface GuardOptions {
  rateLimit?: RateLimitConfig;
  maxBodySize?: number;
}

interface GuardResult {
  session: JWTPayload;
  ip: string;
}

export async function apiGuard(
  request: NextRequest,
  options: GuardOptions = {}
): Promise<GuardResult | NextResponse> {
  const ip = getClientIp(request);
  const rateConfig = options.rateLimit ?? RATE_LIMITS.api;
  const rl = checkRateLimit(`${ip}:${request.nextUrl.pathname}`, rateConfig);

  if (!rl.allowed) {
    logger.warn("Rate limit exceeded", { ip, path: request.nextUrl.pathname });
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intente mas tarde." },
      {
        status: 429,
        headers: rateLimitHeaders(rateConfig, rl.remaining, rl.retryAfter),
      }
    );
  }

  const contentLength = request.headers.get("content-length");
  const maxSize = options.maxBodySize ?? MAX_BODY_SIZE;
  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud excede el tamano maximo permitido" },
      { status: 413 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return { session, ip };
}

export function isGuardError(result: GuardResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
