import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// The in-tree source of truth: any producer (our extractor or a fork's own derivation) drops the schema files here.
const SCHEMA_DIR = join(here, "..", "..", "schema");
const GENERATED_DIR = join(here, "..", "..", "src", "data", "generated");

// Returns the parsed source file, or null when absent so a generator can skip in a standalone checkout.
export function readSchemaFile(filename: string): any {
  const path = join(SCHEMA_DIR, filename);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : null;
}

// Writes a generated artifact only when its content changed, so re-runs stay no-ops and git diffs stay clean.
export function writeGenerated(filename: string, value: unknown): void {
  mkdirSync(GENERATED_DIR, { recursive: true });
  const path = join(GENERATED_DIR, filename);
  const next = JSON.stringify(value, null, 2) + "\n";
  const previous = existsSync(path) ? readFileSync(path, "utf-8") : null;
  if (previous === next) {
    console.log(`  ${filename}: no changes`);
    return;
  }
  writeFileSync(path, next);
  console.log(`  ${filename}: ${previous === null ? "created" : "updated"} (${next.length} chars)`);
}
