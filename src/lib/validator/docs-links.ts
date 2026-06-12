import mapping from "~/data/generated/docs-links.json";
import anchorRegistry from "~/data/generated/docs-anchors.json";

interface IssueLike { path: string; docsAnchor?: string }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function resolveAnchor(candidate: string, knownAnchors: Set<string>): string | null {
  if (knownAnchors.has(candidate)) return candidate;
  // Catch descriptive headings like "### basicInfo format" → "basicinfo-format".
  const prefix = candidate + "-";
  const prefixMatches = [...knownAnchors].filter((a) => a.startsWith(prefix));
  if (prefixMatches.length === 0) return null;
  prefixMatches.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return prefixMatches[0];
}

export function getDocsUrl(input: IssueLike | string): string | null {
  const path = typeof input === "string" ? input : input.path;
  if (!path) return null;
  const sectionMatch = path.match(/^([A-Za-z][A-Za-z0-9_-]*)/);
  if (!sectionMatch) return null;
  const sectionKey = sectionMatch[1];
  const sectionUrl = (mapping as Record<string, string>)[sectionKey];
  if (!sectionUrl) return null;

  const knownAnchors = new Set((anchorRegistry as Record<string, string[]>)[sectionKey] ?? []);

  const candidates: string[] = [];
  if (typeof input !== "string" && input.docsAnchor) {
    candidates.push(slugify(input.docsAnchor));
  } else {
    // Walk last-to-first so leaf paths fall back to a parent field when the leaf has no heading.
    const segments = path.split(".");
    for (let i = segments.length - 1; i >= 1; i--) {
      const segment = segments[i].replace(/\[\d+\]$/, "");
      if (/^[a-z][A-Za-z0-9]*$/.test(segment)) candidates.push(segment.toLowerCase());
    }
  }

  for (const candidate of candidates) {
    const anchor = resolveAnchor(candidate, knownAnchors);
    if (anchor) return `${sectionUrl}#${anchor}`;
  }
  return sectionUrl;
}
