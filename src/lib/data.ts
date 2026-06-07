import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  relevanceReason: string;
}

export interface NewsCache {
  date: string;
  items: NewsItem[];
}

export interface PerfilData {
  intereses: string;
  historial: { fecha: string; accion: string; titulo: string }[];
}

export interface SourcesData {
  categories: Record<string, { name: string; url: string }[]>;
}

export interface SummaryEntry {
  date: string;
  content: string;
  generatedAt: string;
}

// ─── File helpers (dev) ───────────────────────────────────────────────────────

const dataDir = path.join(process.cwd(), "src/data");
const isDev = process.env.NODE_ENV === "development";

function readJson<T>(filename: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(path.join(dataDir, filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filename: string, data: unknown): void {
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2), "utf-8");
}

// ─── Redis helper (prod) ──────────────────────────────────────────────────────

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? "").replace(/^["']|["']$/g, "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").replace(/^["']|["']$/g, "").trim();
  return new Redis({ url, token });
}

// ─── Sources ──────────────────────────────────────────────────────────────────

export function readSources(): SourcesData {
  return readJson<SourcesData>("sources.json", { categories: {} });
}

export async function readSourcesAsync(): Promise<SourcesData> {
  if (isDev) return readSources();
  try {
    const redis = await getRedis();
    const override = await redis.get<SourcesData>("sources");
    return override ?? readSources();
  } catch {
    return readSources();
  }
}

export async function writeSources(data: SourcesData): Promise<void> {
  if (isDev) { writeJson("sources.json", data); return; }
  const redis = await getRedis();
  await redis.set("sources", data);
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

const DEFAULT_PERFIL: PerfilData = {
  intereses:
    "Le interesan la macroeconomía argentina y global, la política argentina, la geopolítica internacional, la tecnología y la inteligencia artificial. No le interesan la farándula ni el chimento.",
  historial: [],
};

export async function readPerfil(): Promise<PerfilData> {
  if (isDev) return readJson<PerfilData>("perfil.json", DEFAULT_PERFIL);
  const redis = await getRedis();
  return (await redis.get<PerfilData>("perfil")) ?? DEFAULT_PERFIL;
}

export async function writePerfil(data: PerfilData): Promise<void> {
  if (isDev) { writeJson("perfil.json", data); return; }
  const redis = await getRedis();
  await redis.set("perfil", data);
}

// ─── News cache ───────────────────────────────────────────────────────────────

const DEFAULT_CACHE: NewsCache = { date: "", items: [] };

export async function readCache(): Promise<NewsCache> {
  if (isDev) return readJson<NewsCache>("news_cache.json", DEFAULT_CACHE);
  const redis = await getRedis();
  return (await redis.get<NewsCache>("news_cache")) ?? DEFAULT_CACHE;
}

export async function writeCache(data: NewsCache): Promise<void> {
  if (isDev) { writeJson("news_cache.json", data); return; }
  const redis = await getRedis();
  await redis.set("news_cache", data, { ex: 30 * 60 * 60 });
}

// ─── Resumen del día ──────────────────────────────────────────────────────────

export async function readCurrentSummary(): Promise<SummaryEntry | null> {
  if (isDev) return readJson<SummaryEntry | null>("current_summary.json", null);
  const redis = await getRedis();
  return await redis.get<SummaryEntry>("current_summary");
}

export async function writeCurrentSummary(content: string): Promise<void> {
  const entry: SummaryEntry = {
    date: new Date().toISOString().split("T")[0],
    content,
    generatedAt: new Date().toISOString(),
  };
  if (isDev) { writeJson("current_summary.json", entry); return; }
  const redis = await getRedis();
  await redis.set("current_summary", entry, { ex: 30 * 60 * 60 });
}

// ─── Historial de resúmenes ───────────────────────────────────────────────────

export async function readSummaryHistory(): Promise<SummaryEntry[]> {
  if (isDev) return readJson<SummaryEntry[]>("summary_history.json", []);
  const redis = await getRedis();
  return (await redis.get<SummaryEntry[]>("summary_history")) ?? [];
}

export async function addToSummaryHistory(content: string): Promise<void> {
  const entry: SummaryEntry = {
    date: new Date().toISOString().split("T")[0],
    content,
    generatedAt: new Date().toISOString(),
  };

  const history = await readSummaryHistory();
  // Reemplazar si ya existe uno de hoy, si no agregar al inicio
  const filtered = history.filter((h) => h.date !== entry.date);
  const updated = [entry, ...filtered].slice(0, 7); // máx 7 días

  if (isDev) { writeJson("summary_history.json", updated); return; }
  const redis = await getRedis();
  await redis.set("summary_history", updated);
}
