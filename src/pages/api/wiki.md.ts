import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildSectionPayload, sectionToMarkdown } from "~/lib/api-section";

export const GET: APIRoute = async () => {
  const sections = await getCollection("sections");
  const sorted = [...sections].sort((a, b) => {
    if (a.data.tab === b.data.tab) return a.data.section.localeCompare(b.data.section);
    return a.data.tab.localeCompare(b.data.tab);
  });
  const NEWLINE = String.fromCharCode(10);
  const docs = sorted.map((entry) => sectionToMarkdown(buildSectionPayload(entry)));
  const separator = NEWLINE + NEWLINE + "---" + NEWLINE + NEWLINE;
  const header = "# VoyageWiki - V33 reference" + NEWLINE + NEWLINE + "Sections: " + docs.length + NEWLINE;
  return new Response(header + separator + docs.join(separator), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
};
