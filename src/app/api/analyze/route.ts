import { NextRequest } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  const { title, description, source, category } = await req.json() as {
    title: string;
    description: string;
    source: string;
    category: string;
  };

  const result = streamText({
    model: google("gemini-2.5-flash"),
    prompt: `Sos un analista político-económico de élite. Analizá en profundidad la siguiente noticia.

NOTICIA:
Título: ${title}
Fuente: ${source} | Categoría: ${category}
Descripción: ${description}

ESTRUCTURA DEL ANÁLISIS:
1. **Qué pasó**: Explicá el hecho en 2-3 oraciones claras.
2. **Contexto**: ¿Qué antecedentes o situación previa explican este hecho?
3. **Por qué importa**: Consecuencias inmediatas y de mediano plazo.
4. **Actores clave**: Quiénes ganan, quiénes pierden, qué intereses están en juego.
5. **Para seguir**: Qué señales o eventos próximos habría que monitorear.

Escribí en español, tono analítico y directo, sin sensacionalismo. Usá markdown para el formato.`,
  });

  return result.toTextStreamResponse();
}
