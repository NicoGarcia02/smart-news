import { NextRequest, NextResponse } from "next/server";
import { writeCurrentSummary, addToSummaryHistory } from "@/lib/data";

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json() as { content: string };
    if (!content?.trim()) {
      return NextResponse.json({ error: "Sin contenido" }, { status: 400 });
    }
    await Promise.all([
      writeCurrentSummary(content),
      addToSummaryHistory(content),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
