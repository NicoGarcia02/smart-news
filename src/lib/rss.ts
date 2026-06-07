import Parser from "rss-parser";
import { readSourcesAsync } from "./data";

export interface RawNewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// Acepta artículos de las últimas 48 horas
function isRecent(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const hoursAgo = (Date.now() - d.getTime()) / 1000 / 3600;
    return hoursAgo <= 48;
  } catch {
    return true;
  }
}

export async function fetchAllNews(): Promise<RawNewsItem[]> {
  const sources = await readSourcesAsync();
  const results: RawNewsItem[] = [];

  for (const [category, feeds] of Object.entries(sources.categories)) {
    for (const feed of feeds) {
      try {
        const parsed = await parser.parseURL(feed.url);
        let added = 0;
        let skipped = 0;
        for (const item of parsed.items.slice(0, 20)) {
          if (!item.title || !item.link) continue;
          const pubDate =
            item.pubDate ?? item.isoDate ?? new Date().toISOString();
          if (!isRecent(pubDate)) { skipped++; continue; }

          results.push({
            title: stripHtml(item.title ?? ""),
            description: stripHtml(
              item.contentSnippet ?? item.content ?? item.summary ?? ""
            ).slice(0, 400),
            link: item.link ?? "",
            pubDate,
            source: feed.name,
            category,
          });
          added++;
        }
        console.log(`[RSS] OK: ${feed.name} → ${added} recientes, ${skipped} viejas (total feed: ${parsed.items.length})`);
      } catch (err) {
        console.warn(`[RSS] Error al leer ${feed.name}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  // Deduplicar por título similar
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
