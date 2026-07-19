import { NextResponse } from "next/server";
import { createLogger } from "./logger";

const logger = createLogger("api");

export function success<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status: number, context?: string) {
  if (status >= 500) {
    logger.error(message, { context, status });
  }
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown, context: string): NextResponse {
  const message = err instanceof Error ? err.message : "Error desconocido";
  logger.error(`Unhandled error in ${context}`, { message, stack: err instanceof Error ? err.stack : undefined });
  return error("Error interno del servidor", 500, context);
}
