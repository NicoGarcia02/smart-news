"use client";

import { useState } from "react";
import type { NewsItem } from "@/lib/data";

interface Props {
  item: NewsItem;
  index?: number;
  onFeedback: (item: NewsItem, action: "like" | "dislike") => Promise<void>;
  onAnalyze: (item: NewsItem) => void;
}

const CATEGORY_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  default:         { text: "#6b7aaa", bg: "rgba(107,122,170,0.1)", dot: "#6b7aaa" },
  macroeconomía:   { text: "#fbbf24", bg: "rgba(251,191,36,0.1)",  dot: "#fbbf24" },
  finanzas:        { text: "#fbbf24", bg: "rgba(251,191,36,0.1)",  dot: "#fbbf24" },
  mercados:        { text: "#f59e0b", bg: "rgba(245,158,11,0.1)",  dot: "#f59e0b" },
  economía:        { text: "#fbbf24", bg: "rgba(251,191,36,0.1)",  dot: "#fbbf24" },
  "política argentina": { text: "#60a5fa", bg: "rgba(96,165,250,0.1)",  dot: "#60a5fa" },
  argentina:       { text: "#60a5fa", bg: "rgba(96,165,250,0.1)",  dot: "#60a5fa" },
  geopolítica:     { text: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  internacional:   { text: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  tecnología:      { text: "#34d399", bg: "rgba(52,211,153,0.1)",  dot: "#34d399" },
  "inteligencia artificial": { text: "#34d399", bg: "rgba(52,211,153,0.1)", dot: "#34d399" },
  fútbol:          { text: "#a78bfa", bg: "rgba(167,139,250,0.1)", dot: "#a78bfa" },
  deportes:        { text: "#a78bfa", bg: "rgba(167,139,250,0.1)", dot: "#a78bfa" },
};

function getCategoryStyle(category: string) {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_COLORS.default;
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const hours = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (hours < 1) return "Hace menos de 1h";
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  } catch {
    return "";
  }
}

export function NewsCard({ item, index = 0, onFeedback, onAnalyze }: Props) {
  const [status, setStatus] = useState<"idle" | "like" | "dislike" | "loading">("idle");
  const style = getCategoryStyle(item.category);

  async function handleFeedback(action: "like" | "dislike") {
    setStatus("loading");
    await onFeedback(item, action);
    setStatus(action);
  }

  return (
    <article
      className="card-enter group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300"
      style={{
        animationDelay: `${index * 40}ms`,
        background: "var(--surface)",
        borderColor: status === "like"
          ? "rgba(52,211,153,0.4)"
          : status === "dislike"
          ? "rgba(248,113,113,0.3)"
          : "var(--border)",
        boxShadow: status === "like"
          ? "0 0 20px rgba(52,211,153,0.06)"
          : status === "dislike"
          ? "0 0 20px rgba(248,113,113,0.06)"
          : "none",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${style.dot}08 0%, transparent 70%)` }}
      />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: style.text, background: style.bg }}
          >
            {item.category}
          </span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>
            {timeAgo(item.pubDate)}
          </span>
        </div>

        {/* Title */}
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold leading-snug line-clamp-3 transition-colors duration-200"
          style={{ color: "var(--text)" }}
          onMouseEnter={e => (e.currentTarget.style.color = style.text)}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text)")}
        >
          {item.title}
        </a>

        {/* Description */}
        {item.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
            {item.description}
          </p>
        )}

        {/* Source + Analyze */}
        <div className="flex items-center justify-between mt-auto">
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>{item.source}</p>
          <button
            onClick={() => onAnalyze(item)}
            className="text-[10px] font-medium transition-colors"
            style={{ color: "var(--accent)" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Analizar →
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)" }} />

      {/* Feedback buttons */}
      <div className="flex">
        <button
          onClick={() => handleFeedback("like")}
          disabled={status !== "idle"}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-200 disabled:opacity-40"
          style={{
            color: status === "like" ? "#34d399" : "var(--muted)",
            background: status === "like" ? "rgba(52,211,153,0.08)" : "transparent",
          }}
          onMouseEnter={e => {
            if (status === "idle") e.currentTarget.style.color = "#34d399";
          }}
          onMouseLeave={e => {
            if (status === "idle") e.currentTarget.style.color = "var(--muted)";
          }}
        >
          {status === "loading" ? "·" : "👍"} <span>Interesa</span>
        </button>

        <div style={{ width: "1px", background: "var(--border)" }} />

        <button
          onClick={() => handleFeedback("dislike")}
          disabled={status !== "idle"}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-200 disabled:opacity-40"
          style={{
            color: status === "dislike" ? "#f87171" : "var(--muted)",
            background: status === "dislike" ? "rgba(248,113,113,0.08)" : "transparent",
          }}
          onMouseEnter={e => {
            if (status === "idle") e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={e => {
            if (status === "idle") e.currentTarget.style.color = "var(--muted)";
          }}
        >
          {status === "loading" ? "·" : "👎"} <span>No interesa</span>
        </button>
      </div>
    </article>
  );
}
