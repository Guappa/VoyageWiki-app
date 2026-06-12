// Shares the in-browser validator's TS modules so endpoint output stays byte-for-byte identical.
import { validateWorld } from "../../src/lib/validator";
import { composeMessage } from "../../src/lib/validator/report";
import type { Issue } from "../../src/lib/validator/types";
import lastUpdated from "../../src/data/generated/last-updated.json";

// Structured fields for new consumers + a composed `message` string so existing agents keep working.
function serializeIssue(issue: Issue) {
  const out: Record<string, unknown> = { path: issue.path, title: issue.title, fix: issue.fix, message: composeMessage(issue) };
  if (issue.detail) out.detail = issue.detail;
  if (issue.value) out.value = issue.value;
  return out;
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age":       "86400",
};

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json; charset=utf-8" };

const validatorVersion =
  (lastUpdated as { perPage?: Record<string, string>; wikiUpdatedAt?: string })
    .perPage?.["tools/validator"] ??
  (lastUpdated as { wikiUpdatedAt?: string }).wikiUpdatedAt ??
  null;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

interface RequestContext {
  request: Request;
}

// CORS preflight for cross-origin agent calls (e.g. a chat UI posting directly).
export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: CORS });

// GET returns API documentation so agents can discover the contract from the URL alone.
export const onRequestGet = async (): Promise<Response> =>
  jsonResponse({
    name: "VoyageWiki V33 Validator API",
    validatorVersion,
    method: "POST",
    contentType: "application/json",
    body: "The world JSON object to validate (the same JSON you would paste into the Voyage editor).",
    response: {
      counts: { errors: "number", warnings: "number", recommendations: "number" },
      errors: "Array of { path, title, fix, detail?, value?, message }",
      warnings: "Array of { path, title, fix, detail?, value?, message }",
      recommendations: "Array of { path, title, fix, detail?, value?, message }",
      validatorVersion: "ISO-8601 timestamp of the validator deploy",
    },
    example: "curl -X POST https://voyagewiki.pages.dev/api/validate -H 'Content-Type: application/json' --data-binary @world.json",
  });

// Largest published world is ~4.4 MB near every limit; 10 MB gives 2x headroom.
const MAX_BODY_BYTES = 10 * 1024 * 1024;

// Per-PoP rate limit: a hammering IP routes to one edge node, so this catches real abuse without Cache-API write quotas.
const RATE_LIMIT_PER_WINDOW = 60;
const RATE_WINDOW_MS = 60_000;

interface RateState { count: number; expiresAt: number }

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request("https://rl.voyagewiki.internal/" + encodeURIComponent(ip));
  const cached = await cache.match(cacheKey);
  const now = Date.now();
  let state: RateState;
  if (cached) {
    state = await cached.json() as RateState;
    if (state.expiresAt < now) state = { count: 0, expiresAt: now + RATE_WINDOW_MS };
  } else {
    state = { count: 0, expiresAt: now + RATE_WINDOW_MS };
  }
  state.count++;
  const remainingS = Math.max(1, Math.ceil((state.expiresAt - now) / 1000));
  await cache.put(
    cacheKey,
    new Response(JSON.stringify(state), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + remainingS },
    }),
  );
  if (state.count > RATE_LIMIT_PER_WINDOW) {
    return { allowed: false, retryAfter: remainingS };
  }
  return { allowed: true, retryAfter: 0 };
}

export const onRequestPost = async ({ request }: RequestContext): Promise<Response> => {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded", retryAfterSeconds: rl.retryAfter }),
      { status: 429, headers: { ...JSON_HEADERS, "Retry-After": String(rl.retryAfter) } },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    return jsonResponse(
      { error: "Body too large", limitBytes: MAX_BODY_BYTES, receivedBytes: contentLength },
      413,
    );
  }

  let world: unknown;
  try {
    world = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  try {
    const result = validateWorld(world);
    return jsonResponse({
      validatorVersion,
      counts: {
        errors:          result.errors.length,
        warnings:        result.warnings.length,
        recommendations: result.recommendations.length,
      },
      errors:          result.errors.map(serializeIssue),
      warnings:        result.warnings.map(serializeIssue),
      recommendations: result.recommendations.map(serializeIssue),
    });
  } catch (err) {
    return jsonResponse(
      { error: "Validator crashed", detail: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
};
