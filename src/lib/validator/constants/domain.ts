// Knowledge the engine enforces but does not expose in any extractable schema; kept hand-curated and sourced.

// Sections whose outer key must equal the inner `name` field; the engine matches entries by key.
export const KEY_NAME_SECTIONS = [
  "npcs", "items", "quests", "traits", "traitCategories", "factions",
  "locations", "regions", "skills", "abilities", "npcTypes", "triggers", "storyStarts",
  "resourceSettings", "attributeSettings",
];

// Condition types the validator intentionally skips operator-checking: story/action carry no operator, read-* are left to the engine.
export const NO_OP_TYPES = new Set<string>(["story", "action", "read-boolean", "read-string", "read-number", "read-array"]);

export const NUMBER_EFFECT_OPS  = new Set<string>(["add", "subtract", "multiply", "divide", "set"]);
// write-boolean accepts set/toggle per the engine; the JSON-schema declares no operator enum for it, so this stays hand-curated.
export const BOOLEAN_EFFECT_OPS = new Set<string>(["set", "toggle"]);
export const ARRAY_EFFECT_OPS   = new Set<string>(["set", "add", "remove"]);
export const NUMBER_EFFECT_TYPES = new Set<string>(["player-resource", "write-number"]);
// party-* movement effects must carry operator "set"; the engine ignores the effect otherwise.
export const SET_REQUIRED_EFFECT_TYPES = new Set<string>(["party-location", "party-area", "party-region", "party-realm"]);

// Engine's built-in damage vocabulary, used when a world defines no combatSettings.damageTypes of its own.
export const DEFAULT_DAMAGE_TYPES = new Set<string>([
  "piercing", "slashing", "bludgeoning", "poisoning", "fire", "lightning",
  "wind", "water", "arcane", "light", "dark", "psychic",
]);

// No single scrape gives the full set: the codec union is resource|attribute|skill|trait, while characterLevel only appears as a separate json-schema branch, so the union stays hand-kept.
export const VALID_REQ_TYPES   = new Set<string>(["skill", "trait", "resource", "attribute", "characterLevel"]);
export const HIGH_COMBAT_TIERS = new Set<string>(["strong", "elite", "boss", "mythic"]);
export const REQUIRED_XP_SIZE_KEYS = new Set<string>(["small", "medium", "large", "huge"]);

export const AI_TASK_DESCRIPTIONS: Record<string, string> = {
  "generateStory":               "primary narration task; runs every scene",
  "generateInitialStart":        "session opening; sets tone for the entire run",
  "generateNPCIntents":          "controls NPC goal selection each turn",
  "generateNPCDetails":          "drives NPC consistency during active scenes",
  "generateNPCUpdates":          "controls how NPCs are damaged, killed, renamed, and how relationship updates are processed",
  "generateActionInfo":          "governs action resolution and combat",
  "generateEncounters":          "frames all encounters; empty means fully generic enemy selection",
  "generateLearnedAbilities":    "guidance for what kinds of learned abilities fit this world",
  "ItemGenerationAndUsage":      "controls item creation and inventory logic",
  "generateCharacterBackground": "shapes the backstory the AI writes during character creation",
  "generateNewNPC":              "controls how the engine creates ambient and emergent NPCs",
  "generateLocationDetails":     "guides area and hiddenInfo generation for complex locations",
  "generateRegionDetails":       "shapes region generation — terrain, mood, ambient population",
  "generateFactionDetails":      "controls how faction detail is elaborated during play",
  "summarization":               "custom guidance for how recent and past story context is summarized for long-term memory (Story Memory)",
};

export const VALID_AI_TASKS = new Set<string>(Object.keys(AI_TASK_DESCRIPTIONS));

// Suffix shapes the recommender treats as sequential entity naming ("Cave-1", "Cave 2", "Cave (3)").
export const SEQUENTIAL_SUFFIX_PATTERNS = [
  /^(.*)-(\d+)$/,
  /^(.*)\s+(\d+)$/,
  /^(.*)\((\d+)\)$/,
];

export const ENTITY_SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ["locations",   "location"],
  ["npcs",        "NPC"],
  ["factions",    "faction"],
  ["items",       "item"],
  ["storyStarts", "story start"],
];
