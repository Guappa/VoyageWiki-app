import { getCollection } from "astro:content";

export interface SectionMeta {
  id: string;
  title: string;
  path: string;
  tab: string;
  summary: string;
}

let cache: Map<string, SectionMeta> | null = null;

export async function loadSectionRegistry(): Promise<Map<string, SectionMeta>> {
  if (cache) return cache;
  const sections = await getCollection("sections");
  const map = new Map<string, SectionMeta>();
  for (const entry of sections) {
    const id = entry.data.section;
    map.set(id, {
      id,
      title: entry.data.title,
      path: "/" + entry.data.tab + "/" + id,
      tab: entry.data.tab,
      summary: entry.data.summary,
    });
  }
  cache = map;
  return map;
}

export async function getSectionMeta(id: string): Promise<SectionMeta | null> {
  const reg = await loadSectionRegistry();
  return reg.get(id) ?? null;
}

export interface ResolvedRelatedItem {
  id: string;
  title: string;
  path: string;
  description: string;
}

export async function resolveRelated(text: string | undefined): Promise<ResolvedRelatedItem[]> {
  if (!text) return [];
  const registry = await loadSectionRegistry();
  const result: ResolvedRelatedItem[] = [];
  for (const segment of text.split(/;\s+/)) {
    const match = segment.match(/^([a-zA-Z][\w-]*)(?:\s*-\s*(.*))?$/);
    if (!match) continue;
    const id = match[1];
    const description = (match[2] || "").trim();
    const meta = registry.get(id);
    if (meta) {
      result.push({ id, title: meta.title, path: meta.path, description });
    }
  }
  return result;
}