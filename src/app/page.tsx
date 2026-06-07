"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { NewsCard } from "@/components/NewsCard";
import { ProfileEditor } from "@/components/ProfileEditor";
import { AnalysisModal } from "@/components/AnalysisModal";
import { SummaryHistory } from "@/components/SummaryHistory";
import { SourcesEditor } from "@/components/SourcesEditor";
import type { NewsItem, SummaryEntry, SourcesData } from "@/lib/data";

type Tab = "summary" | "news" | "history";

function formatDate() {
  return new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("summary");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsStatus, setNewsStatus] = useState<string>("");
  const [perfil, setPerfil] = useState<string>("");
  const [sources, setSources] = useState<SourcesData>({ categories: {} });
  const [profileOpen, setProfileOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<SummaryEntry[]>([]);
  const [analyzingItem, setAnalyzingItem] = useState<NewsItem | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/perfil").then((r) => r.json()),
      fetch("/api/summary").then((r) => r.json()),
      fetch("/api/sources").then((r) => r.json()),
    ]).then(([cache, p, summaryData, src]) => {
      if (cache.items?.length) setNews(cache.items);
      if (p.intereses) setPerfil(p.intereses);
      if (summaryData.current?.content) setSummary(summaryData.current.content);
      if (summaryData.history) setSummaryHistory(summaryData.history);
      if (src.categories) setSources(src);
    });
  }, []);

  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.scrollTop = summaryRef.current.scrollHeight;
    }
  }, [summary]);

  async function handleUpdateNews() {
    setLoadingNews(true);
    setNewsStatus("Procesando feeds RSS...");
    try {
      const res = await fetch("/api/news", { method: "POST" });
      const data = await res.json() as { total: number; approved: number; items: NewsItem[]; error?: string };
      if (data.error) {
        setNewsStatus(`Error: ${data.error}`);
      } else {
        setNews(data.items);
        setNewsStatus(`${data.approved} seleccionadas de ${data.total}`);
      }
    } catch {
      setNewsStatus("Error de conexión");
    } finally {
      setLoadingNews(false);
    }
  }

  async function handleGenerateSummary() {
    setSummaryLoading(true);
    setSummary("");
    try {
      const res = await fetch("/api/summary", { method: "POST" });
      if (!res.ok) { setSummary(`Error: ${await res.text()}`); return; }
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setSummary(fullText);
      }
      // Guardar en Redis al terminar
      await fetch("/api/summary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fullText }),
      });
      // Actualizar historial local
      const newEntry: SummaryEntry = {
        date: new Date().toISOString().split("T")[0],
        content: fullText,
        generatedAt: new Date().toISOString(),
      };
      setSummaryHistory((prev) => [newEntry, ...prev.filter((h) => h.date !== newEntry.date)].slice(0, 7));
    } catch (err) {
      setSummary("Error al conectar con el servidor.");
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  }

  const handleFeedback = useCallback(async (item: NewsItem, action: "like" | "dislike") => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: item.title, description: item.description, action }),
    });
    const res = await fetch("/api/perfil");
    const data = await res.json() as { intereses: string };
    if (data.intereses) setPerfil(data.intereses);
  }, []);

  async function handleSavePerfil(newPerfil: string) {
    await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intereses: newPerfil }),
    });
    setPerfil(newPerfil);
  }

  async function handleSaveSources(data: SourcesData) {
    await fetch("/api/sources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSources(data);
  }

  function renderMarkdown(text: string) {
    return text
      .replace(/^## (.+)$/gm, '<h2 style="font-size:1rem;font-weight:700;color:#dde3f0;margin:1.75rem 0 0.5rem;letter-spacing:-0.01em;">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="font-size:0.875rem;font-weight:600;color:#b0bdd4;margin:1.25rem 0 0.375rem;">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#dde3f0;font-weight:600;">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em style="color:#8a96b0;">$1</em>')
      .replace(/^- (.+)$/gm, '<li style="color:#8a96b0;font-size:0.8125rem;margin:0.25rem 0;">$1</li>')
      .replace(/\n\n/g, '</p><p style="color:#8a96b0;font-size:0.8125rem;line-height:1.75;margin-bottom:0.75rem;">')
      .replace(/\n/g, "<br/>");
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "summary", label: "Resumen del Día" },
    { id: "news", label: `Noticias${news.length ? ` · ${news.length}` : ""}` },
    { id: "history", label: `Historial${summaryHistory.length ? ` · ${summaryHistory.length}` : ""}` },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg)" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 sm:px-6 py-3"
        style={{ background: "rgba(7,9,15,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>Smart News</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(79,142,247,0.12)", color: "var(--accent)" }}>AI</span>
            </div>
            <p className="text-[11px] mt-0.5 capitalize" style={{ color: "var(--muted)" }}>{formatDate()}</p>
          </div>

          <div className="flex items-center gap-2">
            {newsStatus && <span className="text-[11px] hidden sm:block" style={{ color: "var(--muted)" }}>{newsStatus}</span>}
            <button
              onClick={handleUpdateNews}
              disabled={loadingNews}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              <span style={{ display: "inline-block", animation: loadingNews ? "spin 1s linear infinite" : "none" }}>⟳</span>
              <span className="hidden sm:inline">{loadingNews ? "Actualizando..." : "Actualizar"}</span>
            </button>
            <button
              onClick={() => setSourcesOpen(true)}
              title="Gestionar fuentes RSS"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              📡
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              title="Editar perfil"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 sm:px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex-1 sm:flex-none px-4 py-3 text-xs font-medium transition-colors text-center"
              style={{ color: tab === t.id ? "var(--text)" : "var(--muted)" }}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "var(--accent)" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-10">

        {/* Summary Tab */}
        {tab === "summary" && (
          <div className="relative">
            <div
              ref={summaryRef}
              className="rounded-2xl p-5 sm:p-7 min-h-80 max-h-[72vh] overflow-y-auto"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {!summary && !summaryLoading && (
                <div className="flex flex-col items-center justify-center h-60 gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.15)" }}>📰</div>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Resumen editorial del día</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {news.length > 0 ? `${news.length} noticias listas para analizar` : "Primero actualizá las noticias"}
                    </p>
                  </div>
                </div>
              )}
              {summaryLoading && !summary && (
                <div className="flex items-center gap-2 py-4" style={{ color: "var(--muted)" }}>
                  <span className="animate-pulse text-xs" style={{ color: "var(--accent)" }}>●</span>
                  <span className="text-xs">Generando análisis editorial...</span>
                </div>
              )}
              {summary && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: `<p style="color:#8a96b0;font-size:0.8125rem;line-height:1.75;margin-bottom:0.75rem;" class="${summaryLoading ? "cursor-blink" : ""}">${renderMarkdown(summary)}</p>`,
                  }}
                />
              )}
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading || news.length === 0}
              className="fab-bottom fixed bottom-6 right-4 sm:right-6 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: summaryLoading ? "var(--surface)" : "linear-gradient(135deg, #4f8ef7, #7c6af7)",
                color: "#fff",
                boxShadow: summaryLoading ? "none" : "0 8px 24px rgba(79,142,247,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {summaryLoading ? <><span className="animate-spin inline-block">⟳</span> Analizando...</> : <>✦ Generar Resumen</>}
            </button>
          </div>
        )}

        {/* News Tab */}
        {tab === "news" && (
          <>
            {news.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>📡</div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Sin noticias cargadas</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Presioná "Actualizar" en la barra superior</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {news.map((item, i) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    index={i}
                    onFeedback={handleFeedback}
                    onAnalyze={setAnalyzingItem}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {tab === "history" && <SummaryHistory history={summaryHistory} />}
      </main>

      {/* Modals */}
      <ProfileEditor isOpen={profileOpen} onClose={() => setProfileOpen(false)} perfil={perfil} onSave={handleSavePerfil} />
      <SourcesEditor isOpen={sourcesOpen} onClose={() => setSourcesOpen(false)} sources={sources} onSave={handleSaveSources} />
      <AnalysisModal item={analyzingItem} onClose={() => setAnalyzingItem(null)} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
