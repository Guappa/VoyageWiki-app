import type { APIRoute } from "astro";

const manifest = {
  name: "VoyageWiki API",
  version: "0.1.0",
  description: "V33 schema reference for AI agents authoring Voyage worlds. Every section endpoint is self-contained: prose, per-field explanations, and the V33 schema fragment for that section.",
  formats: ["json", "md"],
  endpoints: [
    { path: "/api/index.json", purpose: "This manifest" },
    { path: "/api/sections.json", purpose: "Lightweight index of all sections" },
    { path: "/api/sections/{section}.json", purpose: "One section - metadata + prose + field explanations + schema fragment (JSON)" },
    { path: "/api/sections/{section}.md", purpose: "One section - same content as JSON, formatted as Markdown" },
    { path: "/api/wiki.json", purpose: "Entire wiki - all sections aggregated (JSON)" },
    { path: "/api/wiki.md", purpose: "Entire wiki - all sections concatenated (Markdown)" },
    { path: "/api/schema.json", purpose: "Raw V33 schema JSON" }
  ]
};

export const GET: APIRoute = () => new Response(JSON.stringify(manifest, null, 2), {
  headers: { "Content-Type": "application/json" }
});
