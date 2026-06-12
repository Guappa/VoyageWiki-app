import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildSectionPayload } from "~/lib/api-section";

export const GET: APIRoute = async () => {
  const sections = await getCollection("sections");
  const sorted = [...sections].sort((a, b) => {
    if (a.data.tab === b.data.tab) return a.data.section.localeCompare(b.data.section);
    return a.data.tab.localeCompare(b.data.tab);
  });
  const data = sorted.map(buildSectionPayload);
  return new Response(JSON.stringify({
    version: "V33",
    sectionCount: data.length,
    sections: data
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
};
