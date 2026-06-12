import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SECTIONS_ROOT = join(here, "..", "src", "content", "sections");
const OUT_PATH = join(here, "..", "src", "data", "generated", "field-tips.json");

interface FieldTip { field: string; title: string; summary: string; path: string; }

const HEADER_PATH = "/getting-started/editor-ui#info-tab-fields-json-side-scenario-header";

const HEADER_FIELDS: FieldTip[] = [
  { field: "configVersion", title: "configVersion", summary: "Schema version of this scenario - always 'V33' for current Voyage Heroes scenarios.", path: HEADER_PATH },
  { field: "heroesVersion", title: "heroesVersion", summary: "Voyage Heroes engine version this scenario targets - currently 33.", path: HEADER_PATH },
  { field: "mods", title: "mods (installed)", summary: "Installed-mods array - populated automatically when a player installs mods on top of this scenario; not edited by hand.", path: HEADER_PATH },
  // Alias: the actual JSON key uses non-standard casing; the section slug is generateItemGenerationAndUsage.
  { field: "ItemGenerationAndUsage", title: "Item Generation/Usage", summary: "Provides context to generateItemDefinitions (newly created `items`) and generateItemUpdates (inventory changes). Not included for `generateActionInfo` or `generateStory`.", path: "/ai/generateItemGenerationAndUsage" },
];

const NON_FIELD_SLUGS = new Set([
  "editor-ui",
  "validation-and-size-limits",
  "modding",
  "voice-catalog",
  "scripting-patterns",
  "narrative-and-ai",
  "narrator-chat-tools",
  "map-editor",
]);

function readSectionTip(filePath: string): FieldTip | null {
  const rawContent = readFileSync(filePath, "utf-8");
  // Tolerate CRLF line endings
  const frontmatterMatch = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) return null;
  const frontmatter = frontmatterMatch[1];
  const readFrontmatterField = (key: string): string | null => {
    const fieldPattern = new RegExp("^" + key + ':\\s*"((?:[^"\\\\]|\\\\.)*)"', "m");
    const match = frontmatter.match(fieldPattern);
    if (!match) return null;
    return match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  };
  const tab = readFrontmatterField("tab");
  const section = readFrontmatterField("section");
  const title = readFrontmatterField("title");
  const summary = readFrontmatterField("summary");
  if (!tab || !section || !title || !summary) return null;
  return { field: section, title, summary, path: "/" + tab + "/" + section };
}

function walkSections(dir: string): FieldTip[] {
  const tips: FieldTip[] = [];
  for (const entry of readdirSync(dir)) {
    const entryPath = join(dir, entry);
    if (statSync(entryPath).isDirectory()) {
      tips.push(...walkSections(entryPath));
    } else if (entryPath.endsWith(".md") || entryPath.endsWith(".mdx")) {
      const tip = readSectionTip(entryPath);
      if (tip) tips.push(tip);
    }
  }
  return tips;
}

function main(): void {
  const sectionTips = walkSections(SECTIONS_ROOT);
  const byField = new Map<string, FieldTip>();
  for (const tip of sectionTips) byField.set(tip.field, tip);
  for (const tip of HEADER_FIELDS) byField.set(tip.field, tip);
  const cleaned: Record<string, FieldTip> = {};
  for (const [field, tip] of byField.entries()) {
    if (NON_FIELD_SLUGS.has(field)) continue;
    cleaned[field] = tip;
  }
  if (!existsSync(dirname(OUT_PATH))) mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(cleaned, null, 2));
  console.log("Wrote " + OUT_PATH + " with " + Object.keys(cleaned).length + " field tips");
}

main();