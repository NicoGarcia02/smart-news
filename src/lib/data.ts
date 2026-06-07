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

// ─── Sources (always from file — es config estático) ──────────────────────────

const dataDir = path.join(process.cwd(), "src/data");

export function readSources(): SourcesData {
  const raw = fs.readFileSync(path.join(dataDir, "sources.json"), "utf-8");
  return JSON.parse(raw) as SourcesData;
}

// ─── Storage adapter ─────────────────────────────────────────────────────────
// En desarrollo usa archivos JSON locales.
// En producción (Vercel) usa Upstash Redis.

const isDev = process.env.NODE_ENV === "development";

// --- File helpers (dev only) --------------------------------------------------

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

// --- Redis helper (prod only) ------------------------------------------------

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return Redis.fromEnv();
}

// ─── Public API ──────────────────────────────────────────────────────────────

const DEFAULT_PERFIL: PerfilData = {
  intereses:
    "Le interesan la macroeconomía argentina y global, la política argentina, la geopolítica internacional, la tecnología y la inteligencia artificial. No le interesan la farándula ni el chimento.",
  historial: [],
};

const DEFAULT_CACHE: NewsCache = { date: "", items: [] };

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

export async function readCache(): Promise<NewsCache> {
  if (isDev) return readJson<NewsCache>("news_cache.json", DEFAULT_CACHE);
  const redis = await getRedis();
  return (await redis.get<NewsCache>("news_cache")) ?? DEFAULT_CACHE;
}

export async function writeCache(data: NewsCache): Promise<void> {
  if (isDev) { writeJson("news_cache.json", data); return; }
  const redis = await getRedis();
  // TTL de 30 horas para que el cache expire solo
  await redis.set("news_cache", data, { ex: 30 * 60 * 60 });
}
