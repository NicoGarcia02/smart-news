"use client";

import { useState } from "react";
import type { SummaryEntry } from "@/lib/data";

interface Props {
  history: SummaryEntry[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

function renderMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm, '<h2 style="font-size:0.9rem;font-weight:700;color:#dde3f0;margin:1.25rem 0 0.375rem;">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:0.825rem;font-weight:600;color:#b0bdd4;margin:1rem 0 0.25rem;">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#dde3f0;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#8a96b0;">$1</em>')
    .replace(/\n\n/g, '</p><p style="color:#8a96b0;font-size:0.8rem;line-height:1.75;margin-bottom:0.5rem;">')
    .replace(/\n/g, "<br/>");
}

export function SummaryHistory({ history }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          🗂️
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Sin historial todavía</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Los resúmenes que generes se guardarán acá (hasta 7 días)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((entry) => (
        <div
          key={entry.date}
          className="rounded-xl overflow-hidden border transition-all duration-200"
          style={{ background: "var(--surface)", borderColor: expanded === entry.date ? "var(--border-hover)" : "var(--border)" }}
        >
          <button
            onClick={() => setExpanded(expanded === entry.date ? null : entry.date)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <p className="text-sm font-semibold capitalize" style={{ color: "var(--text)" }}>
                {formatDate(entry.date)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Generado a las {new Date(entry.generatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <span
              className="text-lg transition-transform duration-200"
              style={{
                color: "var(--muted)",
                transform: expanded === entry.date ? "rotate(180deg)" : "rotate(0deg)",
                display: "inline-block",
              }}
            >
              ⌄
            </span>
          </button>

          {expanded === entry.date && (
            <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--border)" }}>
              <div
                className="pt-4"
                dangerouslySetInnerHTML={{
                  __html: `<p style="color:#8a96b0;font-size:0.8rem;line-height:1.75;margin-bottom:0.5rem;">${renderMarkdown(entry.content)}</p>`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
