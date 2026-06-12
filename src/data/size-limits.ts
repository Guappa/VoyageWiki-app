// Typed accessor for size-limits.json, the single source of truth for V33 limits (enforced = what the validator checks, display = the rounded figure shown in docs).
import limitsData from "./size-limits.json";

export type LimitMeasure = "rawChars" | "prettyJson" | "compactJson" | "count";

export interface SizeLimit {
  id: string;
  label: string;
  group: string;
  sections?: string[];
  enforced?: number;
  display?: number;
  measure?: LimitMeasure;
  unit?: string;
  note?: string;
}

export const SIZE_LIMITS: SizeLimit[] = (limitsData as { limits: SizeLimit[] }).limits;

const BY_ID = new Map(SIZE_LIMITS.map((limit) => [limit.id, limit]));

export function limitById(id: string): SizeLimit {
  const limit = BY_ID.get(id);
  if (!limit) throw new Error(`size-limits: no limit with id '${id}'`);
  return limit;
}

// The boundary the validator checks against.
export function enforcedLimit(id: string): number {
  const value = limitById(id).enforced;
  if (value === undefined) throw new Error(`size-limits: limit '${id}' has no numeric enforced value`);
  return value;
}

// The rounded figure shown to authors in docs and validator messages.
export function displayLimit(id: string): number {
  const value = limitById(id).display;
  if (value === undefined) throw new Error(`size-limits: limit '${id}' has no numeric display value`);
  return value;
}

// The rounded figure formatted with thousands separators, for prose tokens.
export function displayLimitText(id: string): string {
  return displayLimit(id).toLocaleString("en-US");
}

const LIMIT_TOKEN = /\{limit:([A-Za-z]+)\}/g;

// Replace {limit:<id>} tokens in any text with the rounded display figure (shared by the remark plugin and the API).
export function resolveLimitTokens(text: string): string {
  return text.replace(LIMIT_TOKEN, (_match, id: string) => displayLimitText(id));
}

function measureWord(measure: LimitMeasure | undefined): string {
  if (measure === "compactJson") return "compact";
  if (measure === "prettyJson") return "pretty";
  return "";
}

// Render the doc-facing limit string from the canonical numbers so tables never hardcode a figure.
export function formatLimit(limit: SizeLimit): string {
  if (limit.note) return limit.note;
  const display = (limit.display ?? 0).toLocaleString("en-US");
  if (limit.measure === "count") return limit.unit ? `${display} ${limit.unit}` : display;
  const base = `${display} chars`;
  if (limit.enforced !== undefined && limit.display !== undefined && limit.enforced !== limit.display) {
    return `${base} (nominal; engine first fails at ${limit.enforced.toLocaleString("en-US")} ${measureWord(limit.measure)} chars)`;
  }
  return base;
}

// --- Doc-facing shapes, derived from the canonical data so there is one source ---

export interface SizeLimitEntry {
  field: string;
  limit: string;
  sections?: string[];
}

export interface SizeLimitGroup {
  title: string;
  intro?: string;
  entries: SizeLimitEntry[];
}

export const LIMIT_GROUPS: SizeLimitGroup[] = (() => {
  const groups: SizeLimitGroup[] = [];
  for (const limit of SIZE_LIMITS) {
    let group = groups.find((candidate) => candidate.title === limit.group);
    if (!group) {
      group = { title: limit.group, entries: [] };
      groups.push(group);
    }
    group.entries.push({ field: limit.label, limit: formatLimit(limit), sections: limit.sections });
  }
  return groups;
})();

export function getLimitsForSection(slug: string): SizeLimitEntry[] {
  const result: SizeLimitEntry[] = [];
  for (const group of LIMIT_GROUPS) {
    for (const entry of group.entries) {
      if (entry.sections && entry.sections.includes(slug)) result.push(entry);
    }
  }
  return result;
}

export function getLimitsSummary(slug: string): string {
  const entries = getLimitsForSection(slug);
  if (entries.length === 0) return "";
  return entries.map((entry) => `${entry.field} ${entry.limit}`).join(" · ");
}
