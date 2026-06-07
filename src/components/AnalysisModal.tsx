"use client";

import { useState, useEffect, useRef } from "react";
import type { NewsItem } from "@/lib/data";

interface Props {
  item: NewsItem | null;
  onClose: () => void;
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

export function AnalysisModal({ item, onClose }: Props) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!item) return;
    setAnalysis("");
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            description: item.description,
            source: item.source,
            category: item.category,
          }),
        });
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setAnalysis((prev) => prev + decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        console.error(err);
        setAnalysis("Error al generar el análisis.");
      } finally {
        setLoading(false);
      }
    })();
  }, [item]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [analysis]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-hover)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
              Análisis en profundidad
            </p>
            <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>
              {item.title}
            </h3>
            <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{item.source}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ background: "var(--border)", color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-5"
          style={{ minHeight: "200px", maxHeight: "60vh" }}
        >
          {loading && !analysis && (
            <div className="flex items-center gap-2 py-4" style={{ color: "var(--muted)" }}>
              <span className="animate-pulse text-xs" style={{ color: "var(--accent)" }}>●</span>
              <span className="text-xs">Analizando con Gemini...</span>
            </div>
          )}
          {analysis && (
            <div
              dangerouslySetInnerHTML={{
                __html: `<p style="color:#8a96b0;font-size:0.8rem;line-height:1.75;margin-bottom:0.5rem;" class="${loading ? "cursor-blink" : ""}">${renderMarkdown(analysis)}</p>`,
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors"
            style={{ color: "var(--accent)" }}
          >
            Leer nota completa →
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--border)", color: "var(--muted)" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
