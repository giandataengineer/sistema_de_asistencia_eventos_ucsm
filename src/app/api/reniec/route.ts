import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reniecService } from "@/services/reniec.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dni = new URL(request.url).searchParams.get("dni");
  if (!dni || !/^\d{8}$/.test(dni)) {
    return NextResponse.json({ error: "DNI invalido" }, { status: 400 });
  }

  const result = await reniecService.consultarDni(dni);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.data);
}
