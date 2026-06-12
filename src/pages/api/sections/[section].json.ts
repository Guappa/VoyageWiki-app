import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { buildSectionPayload } from "~/lib/api-section";

export async function getStaticPaths() {
  const sections = await getCollection("sections");
  return sections.map((entry: CollectionEntry<"sections">) => ({ params: { section: entry.data.section }, props: { entry } }));
}

interface Props { entry: CollectionEntry<"sections"> }

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as Props;
  const payload = buildSectionPayload(entry);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
};
