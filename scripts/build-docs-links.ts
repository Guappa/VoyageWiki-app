import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import jsYaml from "js-yaml";

const SECTIONS_DIR  = join(import.meta.dirname, "../src/content/sections");
const LINKS_FILE    = join(import.meta.dirname, "../src/data/generated/docs-links.json");
const ANCHORS_FILE  = join(import.meta.dirname, "../src/data/generated/docs-anchors.json");

// Mirrors github-slugger's defaults (Astro's MDX anchor slugifier).
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const mapping: Record<string, string> = {};
const anchors: Record<string, string[]> = {};

for (const tab of readdirSync(SECTIONS_DIR)) {
  const tabDir = join(SECTIONS_DIR, tab);
  for (const file of readdirSync(tabDir)) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
    const content = readFileSync(join(tabDir, file), "utf8");
    // Tolerate CRLF — Windows checkouts keep \r\n and the regex silently skips them otherwise.
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) continue;
    const frontmatter = jsYaml.load(frontmatterMatch[1]) as Record<string, unknown>;
    if (typeof frontmatter.section !== "string" || typeof frontmatter.tab !== "string") continue;
    mapping[frontmatter.section] = `/${frontmatter.tab}/${frontmatter.section}`;

    const sectionAnchors = new Set<string>();
    for (const headingMatch of content.matchAll(/^#{2,6}\s+(.+?)\s*$/gm)) {
      sectionAnchors.add(slugify(headingMatch[1]));
    }
    anchors[frontmatter.section] = [...sectionAnchors].sort();
  }
}

writeFileSync(LINKS_FILE, JSON.stringify(mapping, null, 2));
writeFileSync(ANCHORS_FILE, JSON.stringify(anchors, null, 2));
console.log(`docs-links: wrote ${Object.keys(mapping).length} sections, ${Object.values(anchors).reduce((n, a) => n + a.length, 0)} anchors`);
