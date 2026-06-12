# VoyageWiki

A Voyage Heroes V33 schema reference for world authors and AI agents. Static site built with [Astro](https://astro.build) and Svelte islands. The build output (`dist/`) is plain static files that deploy to any static host.

The wiki documents the V33 world-config schema generically: what each section is, its shape, a worked example, and per-field guidance. It also ships authoring tools (a validator, a schema explorer, a trigger-graph editor) and a machine-readable API so AI agents can consume the same reference.

## How it stays current: one source of truth

Everything mechanical is generated from five JSON files in [`schema/`](schema/) — the V33 schema as extracted from the live engine:

| File | Contents |
|------|----------|
| `WorldConfigV33_live_schema.json` | The io-ts codec tree (every section's shape, required/optional, types, enums) |
| `WorldConfigV33_json_schema.json` | JSON-Schema form with enums (trigger condition/effect types and their operators) |
| `WorldConfigV33_validation_limits.json` | The engine's named size/count caps |
| `WorldConfigV33_cross_refs.json` | Which fields must reference a key in another section |
| `WorldConfigV33_errors.json` | The live catalogue of every editor error/warning code |

**Producer contract:** anything that can produce those files is a valid source. Drop them in `schema/`, run `npm run build`, and the validator, the per-page schema blocks, the size-limit figures, and the enum checks all regenerate. You never hand-edit a generated value. (`cross_refs.json` backs a validator coverage test that asserts every engine-declared cross-reference is enforced; `errors.json` is extracted as reference data with no live consumer.)

The data flows one way:

```
schema/*.json  →  scripts/{sync,gen}-*.ts  →  src/data/generated/*  →  validator + pages
```

| Generator | Reads | Writes | Feeds |
|-----------|-------|--------|-------|
| `sync:schema` | `live_schema.json` | `generated/schema.json` | auto Schema blocks, schema explorer, validator shape/enums |
| `sync:limits` | `validation_limits.json` | values into `src/data/size-limits.json` | validator caps, `{limit:<id>}` doc tokens, size-limit tables |
| `gen:enums` | `json_schema.json` | `generated/enums.json` | validator condition/effect/faction/bonus types + operator maps |

Humans edit only two things: the **prose** in section pages, and the small hand-curated layers the engine does not expose (presentational limit metadata in `src/data/size-limits.json`, and engine knowledge not in any schema in `src/lib/validator/constants/domain.ts`). `sync:limits` reports any extracted constant it can't map to a documented row, so a new engine limit surfaces on the next build.

## Quick start

Requires Node 20.3+ or 22+ (the runtimes Astro 5 supports).

    npm install
    npm run build          # generate data, build the static site to dist/
    npm run dev            # http://localhost:4321

Run `npm run build` once after cloning: it populates `src/data/generated/` (gitignored), which `dev` and the tests read.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server with hot reload |
| `npm run build` | Full pipeline: generate all data, build static site to `dist/`, index search (see [Build pipeline](#build-pipeline)) |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run sync:schema` | Regenerate `generated/schema.json` from `schema/` |
| `npm run sync:limits` | Sync enforced size-limit values from `schema/` into `src/data/size-limits.json`; report unmapped constants |
| `npm run gen:enums` | Regenerate the validator enum data from `json_schema.json` |
| `npm run validate <world.json>` | Validate one or more world files headlessly (exits `0` clean, `1` on errors, `2` on usage) |
| `npm test` | Run the unit suite (Vitest) |
| `npm run check` | Type-check with `astro check` |
| `npm run audit` | CVE check of the dependencies that ship (production-only; the deployed site is static so this is the surface that matters) |
| `npm run smoke` | Post-build link/route smoke check (`smoke:local` against the dev server) |

## How content works

### Section pages

Every wiki page is a single Markdown/MDX file under `src/content/sections/<tab>/<section>.md`. The file owns its full content: edit it directly and re-run `npm run dev` to preview. There is no monolithic source and no merge step.

Pages are an Astro content collection defined in `src/content/config.ts`. The frontmatter carries the metadata:

```yaml
---
tab: "world"               # which top-level nav tab this belongs to
section: "npcs"            # the schema key / URL slug
title: "NPCs"
kind: "schema"             # "schema" (a config section) or "guide" (a how-to)
summary: "..."             # one-line summary; drives the hero AND field-name hover tooltips
order: 70                  # sort order within the tab
uiLocation: "World → NPCs" # optional: where it lives in the Voyage editor
editor: "JSON + NPC EDITOR modal"
related: "factions - ...; quests - ..."
---
```

`kind` controls rendering:
- **`schema`** — a config section. Gets the section hero (metadata) and the auto-generated Schema block (below).
- **`guide`** — a reference/how-to. Gets a simpler header, no auto Schema.

The `summary` is load-bearing: besides the hero, it feeds the field-name hover tooltips elsewhere in the wiki (generated by `scripts/build-field-tips.ts`). Keep it accurate.

### The uniform page layout

Every `kind: schema` page renders top-to-bottom as:

**Metadata (hero)** → **Schema (auto)** → **Example** → **field/topic sections**

So a section's Markdown body starts at `## Example` and is followed by the field documentation. Use `## Fields` with one `### <fieldName>` per field (see `mechanics/skills.md` or `mechanics/attributeSettings.md` as the pattern), plus further `## ` sections (`## Behaviour`, `## Authoring tips`) where content is conceptual. Those `##`/`###` headings populate the page's table-of-contents rail. Genuinely tiny pages (e.g. `mechanics/death.md`) are intentionally left flat — a ToC there is just noise.

### The auto-generated Schema block

**Do not hand-write a `## Schema` block.** It is generated from the live schema at render time, so it can never desync. The mechanism:

- `src/lib/schema-root.ts` reads `src/data/generated/schema.json` and exposes `SCHEMA_TOP_LEVEL` (every top-level config key → its schema node).
- `src/lib/schema-shape.ts` turns a section's schema node into an example-shape JSON (`"field": "string"`, enums rendered inline as `"a | b | c"`, free-key maps as `"<key>"`).
- `src/components/static/SchemaBlock.astro` renders it through the shared `CodeBlock` component.
- `src/layouts/SectionLayout.astro` injects it (and a "Schema" ToC entry) for any `kind: schema` page whose `section` maps to a schema node. AI-task sub-pages (e.g. `ai/generateStory.md`), whose `section` is not a top-level schema key, keep their hand-written illustrative blocks.

When the schema changes, the Schema block on every page updates automatically on the next build. Authors maintain only the **Example** and the prose.

### Adding a new page

Create one file: `src/content/sections/<tab>/<new-section>.md` with valid frontmatter. That's it — the route (`/<tab>/<section>`) and the sidebar entry are derived automatically. No registration step.

### Sidebar and navigation

The sidebar is derived from page frontmatter (`tab`, `order`, `title`), not hand-maintained. Tab order and labels live in `src/data/nav-tabs.ts`. The only time you touch navigation config is to add a brand-new **tab** (add it to `nav-tabs.ts` and to the `tab` enum in `src/content/config.ts`).

## The validator

One TypeScript engine in `src/lib/validator/`, shared by three surfaces so a rule change updates all of them:

1. The in-browser tool at **`/tools/validator`** (`Validator.svelte`).
2. The **`POST /api/validate`** endpoint (`functions/api/`).
3. The headless **`npm run validate <world.json>`** CLI (`scripts/validate.ts`).

Module map:
- `shape.ts` — generic schema-driven structural/type/enum/literal checks; reads `generated/schema.json`, so required fields, types, and enums need no hand-maintenance.
- `semantic/` — everything shape can't express, split for onboarding: `references.ts` (cross-refs), `fields.ts` (per-field/enum + coordinates), `settings.ts` (settings sections), `limits.ts` (size/count caps), behind an `index.ts` barrel.
- `warnings.ts` (might-break-at-runtime), `recommendations.ts` (quality advice), `helpers.ts`, `index.ts` (orchestrator, the public `validateWorld`).
- `constants/` — split by provenance so it is obvious what is automatic vs hand-kept: `derived.ts` (condition/effect types + operator maps from `generated/enums.json`; complexity/detail/tier enums from `generated/schema.json`), `domain.ts` (engine knowledge not in any schema, each line sourced), `regexes.ts` (trigger-script parsing patterns). `index.ts` re-exports all three.

Every message follows one rendered contract — ``<problem, with `backtick chips`> — fix: <action>`` — so it renders uniformly in the in-browser tool, the Copy-as-Markdown export, and the API. `message-format.test.ts` enforces this over a deliberately-malformed fixture, so a new check can't drift.

To add a check: put it in the matching `semantic/` module (or `shape.ts` if it's pure structure), register it in `index.ts`, run `npm run validate` against a real world, and update the relevant section page. The public `validateWorld` signature stays stable.

## Agent-first API

The same reference is exposed as machine-readable routes for AI agents (under `src/pages/api/` and `src/pages/llms.txt.ts`):

| Route | Returns |
|---|---|
| `/llms.txt` | Agent entry point / index |
| `/api/index.json` | API map |
| `/api/sections.json` | All sections (metadata) |
| `/api/sections/<section>.json` / `.md` | One section as JSON or Markdown |
| `/api/schema.json` | The live V33 schema |
| `/api/wiki.json` / `/api/wiki.md` | The whole wiki as one document |
| `POST /api/validate` | Validate a world (the serverless surface of the validator) |

## Build pipeline

`npm run build` runs, in order:

1. `sync:schema` — `generated/schema.json` from `schema/`.
2. `sync:limits` — sync size-limit values into `src/data/size-limits.json`.
3. `gen:enums` — the validator enum data.
4. `build:last-updated` — per-page timestamps from git history.
5. `build:field-tips` — field-name hover tooltips from section summaries.
6. `build:docs-links` — validator→docs deep links.
7. `astro build` — render the static site to `dist/`.
8. `pagefind --site dist` — build the search index.
9. `build:beautify` — prettify the emitted HTML.
10. `sync:pagefind-to-public` — copy the search index into `public/` so `dev` has it.

All generated outputs land in `src/data/generated/` (gitignored) except the size-limit values, which sync into the committed `src/data/size-limits.json`.

## Deploy

`npm run build` writes a fully static site to `dist/`. Serve that directory from any static host (Cloudflare Pages, Netlify, GitHub Pages, S3, nginx) — no server runtime is required for the wiki itself.

One optional feature needs a serverless runtime: the public `POST /api/validate` endpoint, implemented as a host function under `functions/api/`. It is written for Cloudflare Pages Functions; on another platform, port that single handler to the host's function format, or omit it — the in-browser validator at `/tools/validator` works without it. Everything else is static.

## Project structure

| Path | Contents |
|------|----------|
| `schema/` | The five extracted V33 JSONs — the app's single source of truth |
| `scripts/` | The `sync:*` / `gen:*` generators, the build helpers, and the `validate` CLI |
| `src/content/sections/<tab>/` | Canonical MDX section reference (the wiki's words). One file per section. |
| `src/content/config.ts` | Content-collection schema (frontmatter shape) |
| `src/layouts/` | `SectionLayout` (hero + auto Schema + ToC), `BaseLayout` |
| `src/components/` | Astro static components + Svelte islands (`SchemaBlock`, `CodeBlock`, `Validator`, trigger map, …) |
| `src/pages/[tab]/[slug].astro` | Dynamic section routing (one route for every section page) |
| `src/pages/tools/` | Validator, schema explorer, field reference, trigger-map, API docs |
| `src/pages/api/`, `src/pages/llms.txt.ts` | Machine-readable JSON + Markdown endpoints |
| `src/lib/validator/` | The single V33 validator engine (three surfaces) |
| `src/lib/schema-root.ts`, `schema-shape.ts` | Schema parsing + auto Schema-block generation |
| `src/lib/trigger-map/` | Trigger-graph parsing, layout, and authoring |
| `src/plugins/` | remark/rehype plugins: `remark-size-limit` (`{limit:}` token), `rehype-validator-link`, `rehype-field-tooltip`, etc. |
| `src/data/generated/` | Machine-written data (gitignored, regenerated each build) |
| `src/data/` | Hand-authored data: `size-limits.{json,ts}` (values synced), `nav-tabs.ts` |
| `functions/api/` | Serverless function for the public `/api/validate` endpoint |
| `public/downloads/` | Downloadable starter world templates |
