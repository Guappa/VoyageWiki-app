import type { APIRoute } from "astro";
import schema from "~/data/generated/schema.json";

export const GET: APIRoute = () => new Response(JSON.stringify(schema, null, 2), {
  headers: { "Content-Type": "application/json" }
});
