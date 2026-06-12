import type { CollectionEntry } from "astro:content";
import { SCHEMA_FIELDS } from "~/lib/schema-root";
import { getLimitsForSection, resolveLimitTokens, type SizeLimitEntry } from "~/data/size-limits";
const NEWLINE = String.fromCharCode(10);

export interface SectionPayload {
  tab: string;
  section: string;
  title: string;
  summary: string;
  uiLocation?: string;
  uiSubtitle?: string;
  editor?: string;
  sizeLimits: SizeLimitEntry[];
  related?: string;
  wikiUrl: string;
  schema: unknown;
  body: string;
}

export function buildSectionPayload(entry: CollectionEntry<"sections">): SectionPayload {
  const sectionKey = entry.data.section;
  return {
    tab: entry.data.tab,
    section: sectionKey,
    title: entry.data.title,
    summary: entry.data.summary,
    uiLocation: entry.data.uiLocation,
    uiSubtitle: entry.data.uiSubtitle,
    editor: entry.data.editor,
    sizeLimits: getLimitsForSection(entry.data.tab + "/" + sectionKey),
    related: entry.data.related,
    wikiUrl: "/" + entry.data.tab + "/" + sectionKey,
    schema: SCHEMA_FIELDS[sectionKey] ?? null,
    body: resolveLimitTokens(entry.body ?? "")
  };
}

function yamlScalar(value: string): string {
  const escaped = value.split(String.fromCharCode(34)).join(String.fromCharCode(92) + String.fromCharCode(34)).split(NEWLINE).join(" ").trim();
  return String.fromCharCode(34) + escaped + String.fromCharCode(34);
}

function frontmatter(payload: SectionPayload): string {
  const lines: string[] = ["---"];
  lines.push("tab: " + yamlScalar(payload.tab));
  lines.push("section: " + yamlScalar(payload.section));
  lines.push("title: " + yamlScalar(payload.title));
  lines.push("summary: " + yamlScalar(payload.summary));
  if (payload.uiLocation) lines.push("uiLocation: " + yamlScalar(payload.uiLocation));
  if (payload.uiSubtitle) lines.push("uiSubtitle: " + yamlScalar(payload.uiSubtitle));
  if (payload.editor) lines.push("editor: " + yamlScalar(payload.editor));
  if (payload.sizeLimits.length > 0) {
    lines.push("sizeLimits:");
    for (const entry of payload.sizeLimits) {
      lines.push("  - field: " + yamlScalar(entry.field));
      lines.push("    limit: " + yamlScalar(entry.limit));
    }
  }
  if (payload.related) lines.push("related: " + yamlScalar(payload.related));
  lines.push("wikiUrl: " + yamlScalar(payload.wikiUrl));
  lines.push("---");
  return lines.join(NEWLINE);
}

export function sectionToMarkdown(payload: SectionPayload): string {
  const parts: string[] = [];
  parts.push(frontmatter(payload));
  parts.push("");
  parts.push("# " + payload.title);
  parts.push("");
  parts.push(payload.body.trim());
  if (payload.schema !== null) {
    parts.push("");
    parts.push("## Schema");
    parts.push("");
    parts.push("```json");
    parts.push(JSON.stringify(payload.schema, null, 2));
    parts.push("```");
  }
  return parts.join(NEWLINE) + NEWLINE;
}
