"use client";

import { useState } from "react";
import type { SourcesData } from "@/lib/data";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sources: SourcesData;
  onSave: (data: SourcesData) => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  finanzas: "💰 Finanzas",
  argentina: "🇦🇷 Argentina",
  geopolitica: "🌍 Geopolítica",
  tecnologia: "💻 Tecnología",
};

export function SourcesEditor({ isOpen, onClose, sources, onSave }: Props) {
  const [data, setData] = useState<SourcesData>(
    JSON.parse(JSON.stringify(sources))
  );
  const [saving, setSaving] = useState(false);
  const [newFeed, setNewFeed] = useState<Record<string, { name: string; url: string }>>({});

  if (!isOpen) return null;

  function removeFeed(category: string, index: number) {
    setData((prev) => ({
      categories: {
        ...prev.categories,
        [category]: prev.categories[category].filter((_, i) => i !== index),
      },
    }));
  }

  function addFeed(category: string) {
    const feed = newFeed[category];
    if (!feed?.name?.trim() || !feed?.url?.trim()) return;
    setData((prev) => ({
      categories: {
        ...prev.categories,
        [category]: [...(prev.categories[category] ?? []), { name: feed.name.trim(), url: feed.url.trim() }],
      },
    }));
    setNewFeed((prev) => ({ ...prev, [category]: { name: "", url: "" } }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(data);
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-hover)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Fuentes RSS</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Agregá o quitá feeds por categoría</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "var(--border)", color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">
          {Object.entries(data.categories).map(([cat, feeds]) => (
            <div key={cat}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="flex flex-col gap-1.5 mb-2">
                {feeds.map((feed, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{feed.name}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{feed.url}</p>
                    </div>
                    <button
                      onClick={() => removeFeed(cat, i)}
                      className="shrink-0 text-xs px-2 py-1 rounded transition-colors"
                      style={{ color: "#f87171", background: "rgba(248,113,113,0.08)" }}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
              {/* Agregar nuevo feed */}
              <div className="flex gap-2">
                <input
                  placeholder="Nombre"
                  value={newFeed[cat]?.name ?? ""}
                  onChange={(e) => setNewFeed((p) => ({ ...p, [cat]: { ...p[cat], name: e.target.value } }))}
                  className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg focus:outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <input
                  placeholder="URL del feed RSS"
                  value={newFeed[cat]?.url ?? ""}
                  onChange={(e) => setNewFeed((p) => ({ ...p, [cat]: { ...p[cat], url: e.target.value } }))}
                  className="flex-[2] min-w-0 text-xs px-2 py-1.5 rounded-lg focus:outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button
                  onClick={() => addFeed(cat)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={{ background: "rgba(79,142,247,0.15)", color: "var(--accent)" }}
                >
                  + Agregar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2 shrink-0" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg" style={{ color: "var(--muted)" }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs rounded-lg font-semibold disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {saving ? "Guardando..." : "Guardar Fuentes"}
          </button>
        </div>
      </div>
    </div>
  );
}
