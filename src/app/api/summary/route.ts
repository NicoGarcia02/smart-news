import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { readCache, readPerfil } from "@/lib/data";

export async function POST() {
  const cache = await readCache();
  const perfil = await readPerfil();

  if (cache.items.length === 0) {
    return new Response(
      "No hay noticias filtradas para hoy. Primero actualizá las noticias.",
      { status: 404 }
    );
  }

  const newsBlock = cache.items
    .map(
      (item, i) =>
        `[${i + 1}] ${item.category.toUpperCase()} | ${item.source}\nTítulo: ${item.title}\nDescripción: ${item.description}`
    )
    .join("\n\n");

  const result = streamText({
    model: google("gemini-2.5-flash"),
    prompt: `Eres un analista editorial de élite que redacta resúmenes diarios de noticias ultra-personalizados.

PERFIL DEL LECTOR:
${perfil.intereses}

NOTICIAS SELECCIONADAS DEL DÍA (${cache.date}):
${newsBlock}

INSTRUCCIONES:
1. Comenzá con un párrafo de "## Panorama del Día" que sintetice el clima general.
2. Organizá en secciones temáticas con títulos ## en negrita.
3. Analizá con profundidad: no solo describas, conectá causas, consecuencias e implicancias.
4. Tono analítico, directo, sin sensacionalismo. Como un buen periodista de análisis político-económico.
5. Terminá con "## Para Seguir de Cerca" con 2-3 temas que merecen atención en los próximos días.
6. Escribí en español, en prosa fluida con markdown.`,
  });

  return result.toTextStreamResponse();
}
