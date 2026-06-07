import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { readPerfil, writePerfil } from "@/lib/data";

export async function POST(req: NextRequest) {
  try {
    const { title, description, action } = await req.json() as {
      title: string;
      description: string;
      action: "like" | "dislike";
    };

    if (!title || !action) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    const perfil = await readPerfil();
    const accion = action === "like" ? "le interesó" : "no le interesó";

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Eres un sistema de aprendizaje de preferencias de usuario.

PERFIL ACTUAL:
${perfil.intereses}

FEEDBACK:
Al usuario ${accion} esta noticia:
Título: ${title}
Descripción: ${description}

TAREA: Actualizá y refiná el perfil para reflejar mejor sus gustos reales.
- Si le gustó: reforzá o agregá ese tipo de tema.
- Si no le gustó: notá qué evitar.
- Perfil en lenguaje natural, máximo 2 párrafos, en español.
- Devolvé SOLO el texto del nuevo perfil, sin prefacios.`,
    });

    const nuevoPerfil = {
      intereses: text.trim(),
      historial: [
        ...perfil.historial.slice(-19),
        { fecha: new Date().toISOString(), accion: action, titulo: title.slice(0, 80) },
      ],
    };

    await writePerfil(nuevoPerfil);

    return NextResponse.json({ ok: true, perfil: nuevoPerfil.intereses });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
