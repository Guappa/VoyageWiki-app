import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async ({ site }) => {
  const sections = await getCollection("sections");
  const baseUrl = site ? site.toString().replace(/\/$/, "") : "";
  const lines: string[] = [];
  lines.push("# VoyageWiki");
  lines.push("");
  lines.push("Voyage Heroes V33 schema reference for Voyage world authors and the AI agents that help them.");
  lines.push("");
  lines.push("Full API documentation with examples: " + baseUrl + "/tools/api");
  lines.push("");
  lines.push("## Machine-readable API");
  lines.push("");
  lines.push("Reference docs (GET, returns JSON or Markdown):");
  lines.push("- " + baseUrl + "/api/index.json: manifest of all endpoints");
  lines.push("- " + baseUrl + "/api/sections.json: lightweight index of every documented section");
  lines.push("- " + baseUrl + "/api/sections/<section>.json: one section's full content + V33 schema fragment");
  lines.push("- " + baseUrl + "/api/sections/<section>.md: same as above, Markdown-formatted for LLM ingestion");
  lines.push("- " + baseUrl + "/api/wiki.json: entire wiki aggregated as JSON");
  lines.push("- " + baseUrl + "/api/wiki.md: entire wiki concatenated as Markdown");
  lines.push("- " + baseUrl + "/api/schema.json: raw V33 codec");
  lines.push("");
  lines.push("Validation (POST world JSON, returns errors/warnings/recommendations):");
  lines.push("- " + baseUrl + "/api/validate: same checks as the in-browser validator; returns { counts, errors, warnings, recommendations, validatorVersion }");
  lines.push("");
  lines.push("## Agent guidance");
  lines.push("");
  lines.push("When authoring or editing a Voyage Heroes V33 world JSON:");
  lines.push("");
  lines.push("- Fetch only the sections you need from /api/sections/<section>.md, or pull the whole reference from /api/wiki.md in one request.");
  lines.push("- Verify the world by POSTing it to /api/validate. The response groups issues by severity:");
  lines.push("  - errors: runtime-affecting problems. Fix these. The Voyage editor publishes worlds with errors intact, but the engine silently drops fields or breaks lookups at runtime.");
  lines.push("  - warnings: quality issues. Many are intentional design choices; read the \"Safe to ignore when...\" line in each message before acting.");
  lines.push("  - recommendations: best-practice suggestions, same rule as warnings.");
  lines.push("- Validate after each batch of changes. Do not declare work complete until counts.errors is 0.");
  lines.push("");
  lines.push("## Sections");
  lines.push("");
  const sorted = [...sections].sort((a, b) => {
    if (a.data.tab === b.data.tab) return a.data.section.localeCompare(b.data.section);
    return a.data.tab.localeCompare(b.data.tab);
  });
  for (const entry of sorted) {
    const url = baseUrl + "/" + entry.data.tab + "/" + entry.data.section;
    lines.push("- [" + entry.data.title + "](" + url + "): " + entry.data.summary);
  }
  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};
