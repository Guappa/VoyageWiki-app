import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const constantsPath = join(here, "..", "schema", "WorldConfigV33_validation_limits.json");
const limitsPath = join(here, "..", "src", "data", "size-limits.json");

// Maps each size-limits.json id to its WORLD_CONFIG_SIZE_LIMITS constant; offset absorbs the stable gap between the engine constant and what the validator measures (per-entry rows count the entry alone, the engine counts it in-context).
const EXTRACTOR_MAP: Record<string, { key: string; offset?: number }> = {
  aiInstructionIndividual: { key: "aiInstruction" },
  aiInstructionPerTask: { key: "aiTaskInstructions" },
  worldLoreSection: { key: "worldLore" },
  worldLoreEntry: { key: "worldLoreText" },
  gameModesSection: { key: "gameModes" },
  storyStartsCount: { key: "storyStartCount" },
  storyStartEntry: { key: "storyStart", offset: 8 },
  itemsSection: { key: "items" },
  itemDescription: { key: "itemDescription" },
  factionsSection: { key: "factions" },
  factionBasicInfo: { key: "factionText" },
  factionHiddenInfo: { key: "factionText" },
  npcTypesSection: { key: "npcTypes" },
  npcTypeDescription: { key: "npcTypeDescription" },
  npcsSection: { key: "npcs" },
  npcEntry: { key: "npc", offset: -4 },
  realmBasicInfo: { key: "realmBasicInfo" },
  regionsSection: { key: "regions" },
  regionBasicInfo: { key: "regionText" },
  regionHiddenInfo: { key: "regionText" },
  locationsSection: { key: "locations" },
  locationBasicInfo: { key: "locationText" },
  locationHiddenInfo: { key: "locationText" },
  areaDescription: { key: "areaDescription" },
  traitDescription: { key: "traitDescription" },
  traitCategoriesSection: { key: "traitCategories" },
  deathInstructions: { key: "deathInstructions" },
  itemSettingsSection: { key: "itemSettings" },
  abilitiesCount: { key: "abilityCount" },
  abilityDescription: { key: "abilityDescription" },
  abilityRequirements: { key: "abilityRequirements" },
  narratorStyle: { key: "narratorStyle" },
  gameModeName: { key: "gameModeName" },
  gameModeDescription: { key: "gameModeDescription" },
  gameModeInstructions: { key: "gameModeInstructions" },
  gameModeAskTheNarratorPrompt: { key: "gameModeAskTheNarratorPrompt" },
  worldConfigTotal: { key: "worldConfig" },
};

// Constants present in the extract that intentionally have no size-limits row, with the reason.
const ACKNOWLEDGED_UNMAPPED: Record<string, string> = {
  storyText: "5,000-char storySettings text cap; worldBackground/questGenerationGuidance enforce it via hand-set rows until confirmed identical to this constant",
};

if (!existsSync(constantsPath)) {
  console.log("sync-limits: validation_limits.json not found (standalone build) — skipping value sync");
  process.exit(0);
}

const namedConstants = JSON.parse(readFileSync(constantsPath, "utf-8")).namedConstants as Record<string, number>;
const originalText = readFileSync(limitsPath, "utf-8");
let text = originalText;
const changes: string[] = [];
const missingConstant: string[] = [];
const rowlessMappings: string[] = [];

function setNumber(line: string, field: string, value: number): string {
  const pattern = new RegExp(`("${field}":\\s*)\\d+`);
  if (!pattern.test(line)) return line;
  return line.replace(pattern, `$1${value}`);
}

for (const [id, { key, offset }] of Object.entries(EXTRACTOR_MAP)) {
  const constant = namedConstants[key];
  if (constant === undefined) {
    missingConstant.push(`${id} -> ${key}`);
    continue;
  }
  const enforced = constant + (offset ?? 0);
  const linePattern = new RegExp(`^.*"id": "${id}".*$`, "m");
  const line = text.match(linePattern)?.[0];
  if (!line) {
    rowlessMappings.push(`${id} -> ${key} = ${enforced}`);
    continue;
  }
  let updated = setNumber(line, "enforced", enforced);
  updated = setNumber(updated, "display", constant);
  if (updated !== line) {
    text = text.replace(line, updated);
    changes.push(`${id}: enforced=${enforced} display=${constant} (from ${key})`);
  }
}

const referencedKeys = new Set(Object.values(EXTRACTOR_MAP).map((entry) => entry.key));
const unmappedConstants = Object.keys(namedConstants).filter(
  (key) => !referencedKeys.has(key) && !(key in ACKNOWLEDGED_UNMAPPED),
);

if (text !== originalText) {
  writeFileSync(limitsPath, text);
  console.log(`sync-limits: applied ${changes.length} value update(s) from WORLD_CONFIG_SIZE_LIMITS:`);
  for (const change of changes) console.log(`  updated  ${change}`);
} else {
  console.log("sync-limits: enforced limits already match WORLD_CONFIG_SIZE_LIMITS — no changes");
}

if (rowlessMappings.length > 0) {
  console.log("sync-limits: EXTRACTOR_MAP maps these to size-limits ids that have no row yet — add the rows:");
  for (const entry of rowlessMappings) console.log(`  NO ROW   ${entry}`);
}

if (missingConstant.length > 0) {
  console.log("sync-limits: mapped ids whose constant vanished from the extract (Voyage renamed/removed) — reconcile EXTRACTOR_MAP:");
  for (const entry of missingConstant) console.log(`  MISSING  ${entry}`);
}

if (unmappedConstants.length > 0) {
  console.log(`sync-limits: ${unmappedConstants.length} extracted constant(s) not mapped to a size-limits row (document them or confirm intentionally unenforced):`);
  for (const key of unmappedConstants) console.log(`  unmapped ${key} = ${namedConstants[key]}`);
}
