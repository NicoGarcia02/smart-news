import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { fetchAllNews } from "@/lib/rss";
import { readPerfil, writeCache, type NewsItem } from "@/lib/data";
import crypto from "crypto";

const FilterSchema = z.object({
  kept: z.array(z.number()),
});

export async function POST() {
  try {
    const perfil = await readPerfil();
    const rawNews = await fetchAllNews();

    console.log(`[NEWS] Total artículos RSS: ${rawNews.length}`);

    if (rawNews.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron noticias recientes en los feeds." },
        { status: 404 }
      );
    }

    const candidates = rawNews.slice(0, 60);
    const titleList = candidates
      .map((item, i) => `${i}: ${item.title} [${item.source}]`)
      .join("\n");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: FilterSchema,
      prompt: `Sos un curador de noticias. Devolvé en "kept" los ÍNDICES de las noticias relevantes para este perfil.

PERFIL:
${perfil.intereses}

NOTICIAS:
${titleList}

REGLA: Incluí todo lo de economía, finanzas, política, Argentina, geopolítica, tecnología, IA, fútbol.
Excluí SOLO chimento, farándula, entretenimiento. Ante la duda, INCLUÍ.`,
    });

    console.log(`[NEWS] Gemini aprobó ${object.kept.length}/${candidates.length}`);

    const approved: NewsItem[] = object.kept
      .filter((i) => i >= 0 && i < candidates.length)
      .map((i) => {
        const item = candidates[i];
        return {
          id: crypto.randomUUID(),
          title: item.title,
          description: item.description,
          link: item.link,
          pubDate: item.pubDate,
          source: item.source,
          category: item.category,
          relevanceReason: "Seleccionada según tu perfil de intereses",
        };
      });

    const today = new Date().toISOString().split("T")[0];
    await writeCache({ date: today, items: approved });

    return NextResponse.json({
      total: rawNews.length,
      approved: approved.length,
      items: approved,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("[NEWS] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { readCache } = await import("@/lib/data");
    const cache = await readCache();
    return NextResponse.json(cache);
  } catch {
    return NextResponse.json({ date: "", items: [] });
  }
}
