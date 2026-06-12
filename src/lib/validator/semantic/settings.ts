import {
  REQUIRED_XP_SIZE_KEYS,
} from "../constants";
import {
  addError, asArray, asDict, isObj, normalizeText, quotedList, repr, typeName,
} from "../helpers";
import type { ValidationContext, World } from "../types";

export function checkNameFilterSettings(world: World, context: ValidationContext): void {
  const nameFilterSettings = world.nameFilterSettings;
  if (nameFilterSettings === undefined || nameFilterSettings === null) return;
  if (!isObj(nameFilterSettings)) {
    addError(context, "nameFilterSettings",
      "expected a keyed map of `{name: {replacements: []}}`, got " + typeName(nameFilterSettings) +
      " — fix: use the form " + JSON.stringify({Marcus: {replacements: ["Alex", "Owen"]}}));
    return;
  }
  for (const [key, value] of Object.entries(nameFilterSettings)) {
    const path = "nameFilterSettings." + key;
    if (!isObj(value)) {
      addError(context, path, "expected an `{replacements: string[]}` object, got " + typeName(value) +
        " — fix: make each entry an object, e.g. " + JSON.stringify({replacements: []}));
    } else if (!("replacements" in value)) {
      addError(context, path, "missing required `replacements` field — fix: add " + JSON.stringify("replacements") +
        " as a string array (use `[]` to block the name with no substitution)");
    } else if (!Array.isArray(value.replacements)) {
      addError(context, path + ".replacements", "`replacements` must be an array of strings, got " + typeName(value.replacements) + " — fix: change it to a string array");
    } else {
      value.replacements.forEach((r, i) => {
        if (typeof r !== "string") {
          addError(context, path + ".replacements[" + i + "]",
            "expected a string, got " + typeName(r) + " (" + repr(r) + ") — fix: make every `replacements` entry a string");
        }
      });
    }
  }
}

export function checkAttributeSettings(world: World, context: ValidationContext): void {
  const attrSettings = asDict(world.attributeSettings);
  const validAttrLower = new Set(
    (asArray(attrSettings.attributeNames) as string[]).map((n) => n.toLowerCase()),
  );
  const resourceKeysNormalized = new Set(Object.keys(asDict(world.resourceSettings)).map(normalizeText));
  const validResourcesDisplay  = Object.keys(asDict(world.resourceSettings)).sort();

  for (const attrName of asArray(attrSettings.attributeNames)) {
    if (typeof attrName === "string" && attrName !== attrName.toLowerCase()) {
      addError(context, "attributeSettings.attributeNames",
        "`" + attrName + "` must be lowercase — mixed-case attribute names cause silent failures in skills, traits, and item bonuses — fix: rename it to all-lowercase");
    }
  }

  for (const mapName of ["attributeDamageModifiers", "attributeDamageReductionModifiers"]) {
    const modifierMap = attrSettings[mapName];
    if (!isObj(modifierMap)) continue;
    for (const attrKey of Object.keys(modifierMap)) {
      if (!validAttrLower.has(attrKey.toLowerCase())) {
        addError(context, "attributeSettings." + mapName + "." + attrKey,
          "`" + attrKey + "` is not a defined attribute — fix: change it to one of " +
          (validAttrLower.size ? quotedList(validAttrLower, true) : "an entry in `attributeSettings.attributeNames`"));
      }
    }
  }

  const modifiers = attrSettings.attributeStatModifiers;
  if (!isObj(modifiers)) return;
  for (const [attrKey, modifier] of Object.entries(modifiers)) {
    const modPath = "attributeSettings.attributeStatModifiers." + attrKey;
    if (!validAttrLower.has(attrKey.toLowerCase())) {
      addError(context, modPath,
        "`" + attrKey + "` is not a defined attribute — fix: change it to one of " +
        (validAttrLower.size ? quotedList(validAttrLower, true) : "an entry in `attributeSettings.attributeNames`"));
    }
    if (typeof modifier === "string") {
      addError(context, modPath,
        "expected an `{variable, amount}` object, got string " + repr(modifier) + " — fix: use `{\"variable\": \"<resource>\", \"amount\": <number>}`");
      continue;
    }
    if (!isObj(modifier)) {
      addError(context, modPath,
        "expected an `{variable, amount}` object, got " + typeName(modifier) + " — fix: use `{\"variable\": \"<resource>\", \"amount\": <number>}`");
      continue;
    }
    if (!("amount" in modifier)) {
      addError(context, modPath + ".amount", "missing required `amount` field — fix: add `amount` (a number)");
    } else if (typeof modifier.amount !== "number" || typeof modifier.amount === "boolean") {
      addError(context, modPath + ".amount", "`amount` must be a number, got " + typeName(modifier.amount) + " — fix: change it to a number");
    }
    if (!("variable" in modifier)) {
      addError(context, modPath + ".variable", "missing required `variable` field — fix: add `variable` (a resource name)");
    } else if (typeof modifier.variable !== "string") {
      addError(context, modPath + ".variable", "`variable` must be a string, got " + typeName(modifier.variable) + " — fix: change it to a resource-name string");
    } else if (resourceKeysNormalized.size > 0 && !resourceKeysNormalized.has(normalizeText(modifier.variable))) {
      addError(context, modPath + ".variable",
        "unknown resource `" + modifier.variable + "` — fix: change this `variable` to one of the existing resource keys. Valid resources: " +
        JSON.stringify(validResourcesDisplay));
    }
  }
}

export function checkResourceSettings(world: World, context: ValidationContext): void {
  const resourceSettings = asDict(world.resourceSettings);
  const combatSettings   = asDict(world.combatSettings);
  let healthKey: string = (combatSettings.healthResourceName as string) || "health";
  for (const [name, r] of Object.entries(resourceSettings)) {
    if (isObj(r) && r.isHealth) { healthKey = name; break; }
  }
  for (const [resourceName, resource] of Object.entries(resourceSettings)) {
    if (resourceName === healthKey) continue;
    if (!isObj(resource)) continue;
    if (!("gainPerLevel" in resource)) {
      addError(context, "resourceSettings." + resourceName + ".gainPerLevel",
        "missing required `gainPerLevel` — fix: set it to a number (use `0` for non-scaling resources)");
    }
  }
}

export function checkResourceSettingsCollisions(world: World, context: ValidationContext): void {
  const resourceSettings = asDict(world.resourceSettings);
  const seenKeys: Record<string, string> = {};
  const seenNames: Record<string, string> = {};
  for (const [resourceKey, resource] of Object.entries(resourceSettings)) {
    const normalizedKey = normalizeText(resourceKey);
    if (normalizedKey in seenKeys) {
      addError(context, "resourceSettings." + resourceKey,
        "resource key `" + resourceKey + "` normalizes to the same value as `" +
        seenKeys[normalizedKey] + "` — the engine refuses ambiguous resource updates silently — fix: rename one so the keys differ after lowercasing and trimming");
    } else {
      seenKeys[normalizedKey] = resourceKey;
    }
    if (!isObj(resource)) continue;
    const displayName = (resource.name ?? "") as string;
    if (!displayName) continue;
    const normalizedName = normalizeText(displayName);
    if (normalizedName in seenNames) {
      addError(context, "resourceSettings." + resourceKey + ".name",
        "resource name `" + displayName + "` normalizes to the same value as `" +
        seenNames[normalizedName] + "` — the engine refuses ambiguous resource updates silently — fix: rename one so the names differ after lowercasing and trimming");
    } else {
      seenNames[normalizedName] = displayName;
    }
  }
}

export function checkSkillCoverage(world: World, context: ValidationContext): void {
  const xp = asDict(asDict(world.skillSettings).skillXPRewards);
  for (const key of REQUIRED_XP_SIZE_KEYS) {
    if (!(key in xp)) {
      addError(context, "skillSettings.skillXPRewards",
        "`skillSettings.skillXPRewards` is missing required size-category key " + repr(key) +
        " — engine looks up XP by these keys and produces NaN when one is absent — fix: add " +
        repr(key) + ": <number> to `skillSettings.skillXPRewards` (typical values: small=1, medium=3, large=10, huge=30)");
    }
  }
}

export function checkGameModes(world: World, context: ValidationContext): void {
  const gameModes = (world as Record<string, unknown>).gameModes;
  if (!gameModes) return;
  if (typeof gameModes !== "object" || Array.isArray(gameModes)) {
    addError(context, "gameModes", "must be an object — fix: set gameModes to a dict of mode-key → {name, description, instructions}");
    return;
  }
  for (const [modeKey, mode] of Object.entries(gameModes as Record<string, unknown>)) {
    if (typeof mode !== "object" || mode === null || Array.isArray(mode)) {
      addError(context, `gameModes.${modeKey}`, "each game mode must be an object with required fields: name, description, instructions — fix: replace the value with a valid object");
      continue;
    }
    const modeObject = mode as Record<string, unknown>;
    for (const field of ["name", "description", "instructions"] as const) {
      if (typeof modeObject[field] !== "string") {
        addError(context, `gameModes.${modeKey}.${field}`,
          `required string field missing or wrong type — fix: set gameModes.${modeKey}.${field} to a string`);
      }
    }
    for (const field of ["difficulty", "askTheNarratorPrompt"] as const) {
      if (field in modeObject && typeof modeObject[field] !== "string") {
        addError(context, `gameModes.${modeKey}.${field}`,
          "must be a string when present — fix: set to a string or remove the key");
      }
    }
    if (typeof modeObject["name"] === "string" && modeObject["name"] !== modeKey) {
      addError(context, `gameModes.${modeKey}.name`,
        "outer key `" + modeKey + "` does not match inner `name` `" + (modeObject["name"] as string) + "` — fix: rename the outer key to the display name so the two are byte-identical");
    }
  }
}
