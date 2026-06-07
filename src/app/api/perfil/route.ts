import { NextRequest, NextResponse } from "next/server";
import { readPerfil, writePerfil } from "@/lib/data";

export async function GET() {
  try {
    const perfil = await readPerfil();
    return NextResponse.json(perfil);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { intereses } = await req.json() as { intereses: string };
    if (!intereses?.trim()) {
      return NextResponse.json({ error: "El perfil no puede estar vacío" }, { status: 400 });
    }
    const perfil = await readPerfil();
    await writePerfil({ ...perfil, intereses: intereses.trim() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
