import { mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const schemaSource = join(here, "..", "schema", "WorldConfigV33_live_schema.json");
const targetPath = join(here, "..", "src", "data", "generated", "schema.json");
const templateSource = join(here, "..", "..", "tools", "templates", "default-world.json");
const templateDownloadPath = join(here, "..", "public", "downloads", "default-world.json");

function syncSchema(): void {
  const raw = readFileSync(schemaSource, "utf-8");
  const parsed = JSON.parse(raw);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, JSON.stringify(parsed, null, 2));
  console.log(`Synced schema (src/data): ${raw.length} chars`);

  // Refresh the downloadable starter template when the private authoring tools are present; the public repo ships a committed copy.
  if (existsSync(templateSource)) {
    copyFileSync(templateSource, templateDownloadPath);
    console.log(`Synced default template (downloads): ${templateDownloadPath}`);
  }
}

syncSchema();
