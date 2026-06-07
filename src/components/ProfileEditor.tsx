"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  perfil: string;
  onSave: (newPerfil: string) => Promise<void>;
}

export function ProfileEditor({ isOpen, onClose, perfil, onSave }: Props) {
  const [text, setText] = useState(perfil);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    await onSave(text);
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col gap-5 p-6 shadow-2xl"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-hover)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Perfil de Intereses
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              La IA usa esto para filtrar y redactar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ color: "var(--muted)", background: "var(--border)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
          >
            ✕
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-xl px-3 py-3 text-sm resize-none focus:outline-none transition-colors leading-relaxed"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--border-hover)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg transition-colors"
            style={{ color: "var(--muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs rounded-lg font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {saving ? "Guardando..." : "Guardar Perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}
