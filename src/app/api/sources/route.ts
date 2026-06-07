import { NextRequest, NextResponse } from "next/server";
import { readSourcesAsync, writeSources } from "@/lib/data";

export async function GET() {
  try {
    const sources = await readSourcesAsync();
    return NextResponse.json(sources);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    await writeSources(data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
