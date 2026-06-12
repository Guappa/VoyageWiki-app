import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateWorld } from "~/lib/validator";
import { composeMessage } from "~/lib/validator/report";

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: npm run validate <world.json> [more.json ...]");
  process.exit(2);
}

const NL = String.fromCharCode(10);
let anyErrors = false;

for (const target of targets) {
  const worldPath = resolve(target);
  let result;
  try {
    result = validateWorld(JSON.parse(readFileSync(worldPath, "utf-8")));
  } catch (err) {
    console.error(`${target}: could not read or parse — ${(err as Error).message}`);
    anyErrors = true;
    continue;
  }

  const lines: string[] = [];
  for (const issue of result.errors)          lines.push("ERROR    [" + issue.path + "]  " + composeMessage(issue));
  for (const issue of result.warnings)        lines.push("WARNING  [" + issue.path + "]  " + composeMessage(issue));
  for (const issue of result.recommendations) lines.push("REC      [" + issue.path + "]  " + composeMessage(issue));

  if (targets.length > 1) console.log(`=== ${target} ===`);
  if (lines.length) console.log(lines.join(NL));
  console.log(`counts: errors=${result.errors.length} warnings=${result.warnings.length} recommendations=${result.recommendations.length}`);
  if (result.errors.length) anyErrors = true;
}

process.exit(anyErrors ? 1 : 0);
