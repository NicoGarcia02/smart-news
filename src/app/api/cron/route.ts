import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { fetchAllNews } from "@/lib/rss";
import { readPerfil, writeCache, type NewsItem } from "@/lib/data";
import crypto from "crypto";

// Vercel cron jobs envían Authorization: Bearer ${CRON_SECRET}
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // en dev sin secret, permitir
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Iniciando actualización automática de noticias...");
    const perfil = await readPerfil();
    const rawNews = await fetchAllNews();

    if (rawNews.length === 0) {
      return NextResponse.json({ ok: false, error: "Sin noticias RSS" });
    }

    const candidates = rawNews.slice(0, 60);
    const titleList = candidates
      .map((item, i) => `${i}: ${item.title} [${item.source}]`)
      .join("\n");

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({ kept: z.array(z.number()) }),
      prompt: `Sos un curador de noticias. Devolvé en "kept" los ÍNDICES de las noticias relevantes para este perfil.

PERFIL:
${perfil.intereses}

NOTICIAS:
${titleList}

REGLA: Incluí economía, finanzas, política, Argentina, geopolítica, tecnología, IA, fútbol. Excluí SOLO chimento y farándula.`,
    });

    const approved: NewsItem[] = object.kept
      .filter((i) => i >= 0 && i < candidates.length)
      .map((i) => ({
        id: crypto.randomUUID(),
        title: candidates[i].title,
        description: candidates[i].description,
        link: candidates[i].link,
        pubDate: candidates[i].pubDate,
        source: candidates[i].source,
        category: candidates[i].category,
        relevanceReason: "Seleccionada por el cron diario",
      }));

    const today = new Date().toISOString().split("T")[0];
    await writeCache({ date: today, items: approved });

    console.log(`[CRON] Completado: ${approved.length}/${rawNews.length} noticias guardadas`);
    return NextResponse.json({ ok: true, total: rawNews.length, approved: approved.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[CRON] Error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
