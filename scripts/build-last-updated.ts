import { execSync } from "node:child_process";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const wikiAppRoot = join(here, "..");
const sectionsDir = join(wikiAppRoot, "src", "content", "sections");

// Wiki-app-relative source paths so hand-rolled Astro pages get a timestamp whether wiki-app is the repo root or nested in the parent workspace.
const specialPages: Record<string, string[]> = {
  "tools/validator": [
    "src/pages/tools/validator.astro",
    "src/components/islands/Validator.svelte",
    "src/lib/validator",
    "scripts/validate.ts",
  ],
  "tools/api": [
    "src/pages/tools/api.astro",
    "functions/api/validate.ts",
    "src/pages/api",
  ],
};

function walkMd(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkMd(full, acc);
    else if (entry.endsWith(".md")) acc.push(full);
  }
  return acc;
}

function gitLastCommitTs(filePath: string, cwd?: string): string | null {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: "utf-8",
      cwd,
    }).trim();
    return iso || null;
  } catch {
    return null;
  }
}

function latestMtimeIso(absPath: string): string | null {
  let max: Date | null = null;
  const consider = (path: string): void => {
    try {
      const s = statSync(path);
      if (s.isDirectory()) {
        for (const entry of readdirSync(path)) consider(join(path, entry));
      } else if (!max || s.mtime > max) {
        max = s.mtime;
      }
    } catch { /* ignore unreadable paths */ }
  };
  consider(absPath);
  return max ? (max as Date).toISOString() : null;
}

function maxIso(values: Array<string | null>): string | null {
  let max: string | null = null;
  let maxMs = -Infinity;
  for (const v of values) {
    if (!v) continue;
    const ms = Date.parse(v);
    if (!Number.isNaN(ms) && ms > maxMs) {
      maxMs = ms;
      max = v;
    }
  }
  return max;
}

const files = walkMd(sectionsDir, []);
const perPage: Record<string, string> = {};
let mostRecent: string | null = null;
const trackMostRecent = (value: string | null): void => {
  if (!value) return;
  mostRecent = maxIso([mostRecent, value]);
};

for (const file of files) {
  const relativePath = relative(sectionsDir, file).split(sep).join("/").replace(/\.md$/, "");
  // Prefer the git commit time (stable per commit); mtime only as a fallback so checkouts/pulls don't churn the file.
  const latest = gitLastCommitTs(file) ?? latestMtimeIso(file);
  if (latest) {
    perPage[relativePath] = latest;
    trackMostRecent(latest);
  }
}

for (const [pageKey, sourcePaths] of Object.entries(specialPages)) {
  const timestamps: Array<string | null> = [];
  for (const p of sourcePaths) {
    timestamps.push(gitLastCommitTs(p, wikiAppRoot) ?? latestMtimeIso(join(wikiAppRoot, p)));
  }
  const latest = maxIso(timestamps);
  if (latest) {
    perPage[pageKey] = latest;
    trackMostRecent(latest);
  }
}

const outDir = join(wikiAppRoot, "src", "data", "generated");
const outFile = join(outDir, "last-updated.json");
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify({
  wikiUpdatedAt: mostRecent || new Date().toISOString(),
  perPage
}, null, 2));
console.log(`last-updated.json: ${Object.keys(perPage).length} per-page timestamps, latest ${mostRecent}`);
