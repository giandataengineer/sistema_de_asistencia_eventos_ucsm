import { NextRequest, NextResponse } from "next/server";
import { reniecService } from "@/services/reniec.service";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request);
  if (isGuardError(guard)) return guard;

  try {
    const dni = new URL(request.url).searchParams.get("dni");
    if (!dni || !/^\d{8}$/.test(dni)) {
      return NextResponse.json({ error: "DNI invalido" }, { status: 400 });
    }

    const result = await reniecService.consultarDni(dni);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    return handleApiError(err, "GET /api/reniec");
  }
}
