// Warnings = "might break at runtime". Quality nudges go to recommendations.ts instead.
import { addError, addWarning, asArray, asDict, isObj } from "./helpers";
import { DEFAULT_DAMAGE_TYPES } from "./constants";
import type { ValidationContext, World } from "./types";

export function collectAllWarnings(world: World, context: ValidationContext): void {
  for (const [questName, quest] of Object.entries(asDict(world.quests))) {
    if (!isObj(quest)) continue;
    const qLoc = ((quest.questLocation ?? "") as string).trim();
    if (!qLoc) {
      if (quest.detailType === "detailed") {
        addError(context, "quests." + questName + ".questLocation",
          "`detailType` is `detailed` but `questLocation` is empty — the engine cannot resolve a target location and the quest will misfire — fix: set `questLocation` to a defined location key, or switch `detailType` to `basic` with a `spatialRelationship`");
      } else if (!(quest.detailType === "basic" && ((quest.spatialRelationship ?? "") as string).trim())) {
        addWarning(context, "quests." + questName + ".questLocation",
          "`questLocation` is empty and `detailType` is not `basic` with a `spatialRelationship` — the quest cannot resolve a location at runtime — fix: set to a defined location key, or use `detailType`=`basic` with a `spatialRelationship`");
      }
    }
    if (!((quest.completionCondition ?? "") as string).trim()) {
      addWarning(context, "quests." + questName + ".completionCondition",
        "`completionCondition` is empty — the engine throws a Zod error when this field is empty — " +
        "fix: write the condition the AI uses to judge that the quest objective has been met");
    }
  }

  const itemSettings = asDict(world.itemSettings);
  const definedSlots = new Set<string>();
  for (const s of asArray(itemSettings.itemSlots)) {
    if (isObj(s) && typeof s.slot === "string") definedSlots.add(s.slot);
  }
  const definedCategories = new Set(asArray(itemSettings.itemCategories) as string[]);
  const allItems = asDict(world.items);
  if (Object.keys(allItems).length > 0) {
    const usedCats = new Set<string>();
    const usedSlots = new Set<string>();
    for (const it of Object.values(allItems)) {
      if (!isObj(it)) continue;
      if (it.category) usedCats.add(it.category as string);
      if (it.slot) usedSlots.add(it.slot as string);
    }
    if (usedCats.size > 0 && definedCategories.size === 0) {
      addWarning(context, "itemSettings.itemCategories",
        "`itemCategories` is empty but items use categories: " + [...usedCats].sort().slice(0, 6).join(", ") +
        " — fix: populate `itemSettings.itemCategories` with the categories your items use");
    }
    if (usedSlots.size > 0 && definedSlots.size === 0) {
      addWarning(context, "itemSettings.itemSlots",
        "`itemSlots` is empty but items use slots: " + [...usedSlots].sort().join(", ") +
        " — fix: populate `itemSettings.itemSlots` with the slots your items use");
    }
  }
  for (const [itemName, item] of Object.entries(allItems)) {
    if (!isObj(item)) continue;
    const slot = item.slot;
    if (definedSlots.size > 0 && typeof slot === "string" && slot !== "" && !definedSlots.has(slot)) {
      addWarning(context, "items." + itemName + ".slot",
        "slot " + JSON.stringify(slot) + " is not defined in `itemSettings.itemSlots` — fix: use one of: " + [...definedSlots].sort().join(", "));
    }
    const category = (item.category ?? "") as string;
    if (definedCategories.size > 0 && category && !definedCategories.has(category)) {
      addWarning(context, "items." + itemName + ".category",
        "category " + JSON.stringify(category) + " is not defined in `itemSettings.itemCategories` — fix: use one of: " + [...definedCategories].sort().join(", "));
    }
  }

  const declaredDamage = asArray(asDict(world.combatSettings).damageTypes).filter((t): t is string => typeof t === "string");
  const baseDamage = declaredDamage.length > 0 ? declaredDamage : [...DEFAULT_DAMAGE_TYPES];
  // The engine matches npc/npcType v/r/i against BOTH skill names and damage types, so either is valid.
  const validProfile = new Set([...baseDamage, ...Object.keys(asDict(world.skills))]);
  for (const [section, entities] of [["npcs", asDict(world.npcs)], ["npcTypes", asDict(world.npcTypes)]] as const) {
    for (const [entityName, entity] of Object.entries(entities)) {
      if (!isObj(entity)) continue;
      for (const field of ["vulnerabilities", "resistances", "immunities"] as const) {
        asArray(entity[field]).forEach((value, i) => {
          if (typeof value === "string" && value && !validProfile.has(value)) {
            addWarning(context, section + "." + entityName + "." + field + "[" + i + "]",
              "`" + value + "` is neither a defined damage type nor a skill name — the engine ignores unrecognized " + field + " entries — fix: use a value from `combatSettings.damageTypes` or a `skills` key");
          }
        });
      }
    }
  }

  for (const [resourceName, resource] of Object.entries(asDict(world.resourceSettings))) {
    if (!isObj(resource)) continue;
    const color = resource.color;
    if (typeof color === "string" && color !== "" && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      addWarning(context, "resourceSettings." + resourceName + ".color",
        "`" + color + "` is not a valid hex color — the UI bar color falls back to a default — fix: use a `#RRGGBB` hex value (e.g. `#3b82f6`)");
    }
  }
}
