import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

export const GET: APIRoute = async () => {
  const sections = await getCollection("sections");

  const data = sections.map((s: CollectionEntry<"sections">) => ({
    tab: s.data.tab,
    section: s.data.section,
    title: s.data.title,
    summary: s.data.summary,
    kind: s.data.kind,
    url: "/" + s.data.tab + "/" + s.data.section,
    apiUrl: "/api/sections/" + s.data.section + ".json"
  }));

  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
};
