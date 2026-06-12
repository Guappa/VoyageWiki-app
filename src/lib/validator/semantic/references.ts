import {
  VALID_NPC_TIERS, VALID_FACTION_TYPES, VALID_BONUS_TYPES,
} from "../constants";
import {
  addError, addWarning, asArray, asDict, isObj, quotedList, refError, repr, typeName,
} from "../helpers";
import type { ValidationContext, World } from "../types";

export function checkNpcRefs(world: World, context: ValidationContext): void {
  const locations = asDict(world.locations);
  const factions  = asDict(world.factions);
  for (const [npcName, npc] of Object.entries(asDict(world.npcs))) {
    if (!isObj(npc)) continue;
    const currentLocation = (npc.currentLocation ?? "") as string;
    const currentArea     = (npc.currentArea ?? "") as string;
    refError(context, currentLocation, locations, "npcs." + npcName + ".currentLocation", "location");
    if (currentArea && currentLocation) {
      const locationAreas = asDict(isObj(locations[currentLocation]) ? (locations[currentLocation] as Record<string, unknown>).areas : {});
      if (!(currentArea in locationAreas)) {
        addError(context, "npcs." + npcName + ".currentArea",
          "unknown area `" + currentArea + "` in location `" + currentLocation +
          "` — fix: either add the area to that location's `areas` map, change `currentArea` to an existing area key, or leave `currentArea` empty if the NPC has no specific area");
      }
    }
    refError(context, (npc.faction ?? "") as string, factions, "npcs." + npcName + ".faction", "faction");
    const npcTier = (npc.tier ?? "") as string;
    if (npcTier && !VALID_NPC_TIERS.has(npcTier)) {
      addError(context, "npcs." + npcName + ".tier",
        "`" + npcTier + "` is not a valid `tier` — fix: change to one of " +
        quotedList(VALID_NPC_TIERS));
    }
  }
}

export function checkLocationRefs(world: World, context: ValidationContext): void {
  const locations = asDict(world.locations);
  const regions   = asDict(world.regions);
  const realms    = asDict(world.realms);

  for (const [questName, quest] of Object.entries(asDict(world.quests))) {
    if (!isObj(quest)) continue;
    refError(context, (quest.questLocation ?? "") as string, locations,
      "quests." + questName + ".questLocation", "location");
  }

  const FACTION_VALID = new Set([
    "name", "basicInfo", "factionType", "hiddenInfo", "known", "detailType",
    "embeddingId",
  ]);
  for (const [factionName, faction] of Object.entries(asDict(world.factions))) {
    if (!isObj(faction)) continue;
    for (const field of Object.keys(faction)) {
      if (!FACTION_VALID.has(field)) {
        addError(context, "factions." + factionName + "." + field,
          "`" + field + "` is not a recognised faction field — fix: remove it (valid author keys: name, basicInfo, factionType, hiddenInfo, known); put the information in basicInfo or hiddenInfo");
      }
    }
    const factionType = faction.factionType;
    if (typeof factionType === "string" && factionType && VALID_FACTION_TYPES.size > 0 && !VALID_FACTION_TYPES.has(factionType)) {
      addError(context, "factions." + factionName + ".factionType",
        "`" + factionType + "` is not a valid factionType — fix: change it to one of " +
        quotedList(VALID_FACTION_TYPES));
    }
  }

  for (const [regionName, region] of Object.entries(regions)) {
    if (!isObj(region)) continue;
    if (!((region.realm ?? "") as string).trim()) {
      addWarning(context, "regions." + regionName + ".realm",
        "region has no realm — map navigation requires every region to reference a realm; " +
        "regions without one may not appear on the map or be reachable by players — " +
        "fix: add a `realm` key referencing an entry in the `realms` section. " +
        "Safe to ignore only if map navigation is intentionally unused in this world.");
    }
    refError(context, (region.realm ?? "") as string, realms, "regions." + regionName + ".realm", "realm");
    if ("locations" in region) {
      addError(context, "regions." + regionName + ".locations",
        "regions." + regionName + ".locations is not a valid field — fix: remove regions." +
        regionName + ".locations and instead set each location region field (locations.<each>.region = " +
        "`" + regionName + "`); the region-to-location relationship is stored on the child");
    }
  }

  const factionKeys = asDict(world.factions);
  for (const [locationName, location] of Object.entries(locations)) {
    if (!isObj(location)) continue;
    refError(context, (location.region ?? "") as string, regions, "locations." + locationName + ".region", "region");
    asArray(location.factions).forEach((factionKey, i) => {
      if (typeof factionKey === "string")
        refError(context, factionKey, factionKeys, "locations." + locationName + ".factions[" + i + "]", "faction");
    });
  }

  for (const [regionName, region] of Object.entries(regions)) {
    if (!isObj(region)) continue;
    asArray(region.factions).forEach((factionKey, i) => {
      if (typeof factionKey === "string")
        refError(context, factionKey, factionKeys, "regions." + regionName + ".factions[" + i + "]", "faction");
    });
  }
}

export function checkTriggerRefs(world: World, context: ValidationContext): void {
  const quests    = asDict(world.quests);
  const locations = asDict(world.locations);
  for (const [triggerName, trigger] of Object.entries(asDict(world.triggers))) {
    if (!isObj(trigger)) continue;
    for (const effect of asArray(trigger.effects)) {
      if (isObj(effect) && effect.type === "quest-init") {
        refError(context, (effect.value ?? "") as string, quests,
          "triggers." + triggerName + ".effects", "`quest-init` value");
      }
    }
    for (const condition of asArray(trigger.conditions)) {
      if (isObj(condition) && condition.type === "party-location") {
        refError(context, (condition.value ?? "") as string, locations,
          "triggers." + triggerName + ".conditions", "`party-location` value");
      }
    }
  }
}

export function checkTraitRefs(world: World, context: ValidationContext): void {
  const abilities       = asDict(world.abilities);
  const skills          = asDict(world.skills);
  const traits          = asDict(world.traits);
  const traitCategories = asDict(world.traitCategories);
  const validAttributes = new Set(asArray(asDict(world.attributeSettings).attributeNames) as string[]);
  const resourceNames   = new Set(Object.keys(asDict(world.resourceSettings)));

  const listedInCategory: Record<string, string> = {};
  for (const [categoryName, category] of Object.entries(traitCategories)) {
    if (!isObj(category)) continue;
    for (const traitRef of asArray(category.traits)) {
      if (typeof traitRef === "string") listedInCategory[traitRef] = categoryName;
    }
  }

  for (const [traitName, trait] of Object.entries(traits)) {
    if (!isObj(trait)) continue;
    const declaredCategory = (trait.category ?? "") as string;
    refError(context, declaredCategory, traitCategories, "traits." + traitName + ".category", "traitCategory");
    if (declaredCategory && traitName in listedInCategory) {
      const actual = listedInCategory[traitName];
      if (actual !== declaredCategory) {
        addError(context, "traits." + traitName + ".category",
          "traits." + traitName + ".category=`" + declaredCategory +
          "` but the trait is listed under traitCategories." + repr(actual) +
          ".traits — fix: either change traits." + traitName + ".category to `" + actual +
          "`, OR move `" + traitName + "` into traitCategories.`" + declaredCategory + "`.traits");
      }
    } else if (declaredCategory && !(traitName in listedInCategory)) {
      const catTraits = asArray(asDict(traitCategories[declaredCategory]).traits);
      if (catTraits.length > 0) {
        addError(context, "traits." + traitName + ".category",
          "declares category `" + declaredCategory +
          "` but is not listed in that category's traits — fix: add `" + traitName +
          "` to `traitCategories." + declaredCategory + ".traits`");
      }
    }
    for (const ability of asArray(trait.abilities)) {
      if (typeof ability === "string") {
        refError(context, ability, abilities, "traits." + traitName + ".abilities", "ability");
      }
    }
    asArray(trait.skills).forEach((skillEntry, i) => {
      if (typeof skillEntry === "string") {
        addError(context, "traits." + traitName + ".skills[" + i + "]",
          "skill entry " + repr(skillEntry) + " is a plain string — fix: wrap it as `{\"skill\": \"" + skillEntry +
          "\", \"modifier\": <number>}` (entries need both a name and a numeric modifier)");
      } else if (isObj(skillEntry)) {
        refError(context, (skillEntry.skill ?? "") as string, skills,
          "traits." + traitName + ".skills[" + i + "]", "skill");
      }
    });
    if (validAttributes.size > 0) {
      asArray(trait.attributes).forEach((attrEntry, i) => {
        const attrName = isObj(attrEntry) ? ((attrEntry.attribute ?? "") as string) : (attrEntry as string);
        if (attrName && !validAttributes.has(attrName)) {
          addError(context, "traits." + traitName + ".attributes." + i + ".attribute",
            "attribute `" + attrName + "` is not in `attributeSettings.attributeNames` — fix: change it to one of " +
            quotedList(validAttributes, true) + ", or add `" + attrName.toLowerCase() +
            "` to `attributeSettings.attributeNames` (lowercase)");
        }
      });
    }
    if (resourceNames.size > 0) {
      asArray(trait.resources).forEach((resourceEntry, i) => {
        if (!isObj(resourceEntry)) return;
        const resourceName = (resourceEntry.resource ?? "") as string;
        if (resourceName && !resourceNames.has(resourceName)) {
          addWarning(context, "traits." + traitName + ".resources." + i + ".resource",
            "unknown resource `" + resourceName + "` — the engine silently drops a modifier that targets a resource which does not exist — fix: either add `" + resourceName +
            "` to `resourceSettings`, or change this modifier to reference an existing resource key");
        }
      });
    }
  }

  for (const [categoryName, category] of Object.entries(traitCategories)) {
    if (!isObj(category)) continue;
    for (const traitRef of asArray(category.traits)) {
      if (typeof traitRef === "string") {
        refError(context, traitRef, traits, "traitCategories." + categoryName + ".traits", "trait");
      }
    }
  }
}

function checkStartingItems(
  context: ValidationContext,
  itemsDict: Record<string, unknown>,
  entries: unknown[],
  basePath: string,
): void {
  entries.forEach((entry, i) => {
    if (typeof entry === "string") {
      addError(context, basePath + "[" + i + "]",
        "expected an `{item, quantity}` object, got plain string " + repr(entry) + " — fix: wrap it as `{\"item\": " + repr(entry) + ", \"quantity\": 1}`");
    } else if (isObj(entry)) {
      refError(context, (entry.item ?? "") as string, itemsDict, basePath + "[" + i + "].item", "item");
    }
  });
}

export function checkStoryStartRefs(world: World, context: ValidationContext): void {
  const locations = asDict(world.locations);
  const npcs      = asDict(world.npcs);
  const quests    = asDict(world.quests);
  const itemsDict = asDict(world.items);
  // locationAreas may reference areas from any location, not only the start's own `locations`.
  const allAreaNames = new Set<string>();
  for (const location of Object.values(locations)) {
    if (isObj(location)) for (const areaName of Object.keys(asDict(location.areas))) allAreaNames.add(areaName);
  }

  for (const [storyStartKey, storyStart] of Object.entries(asDict(world.storyStarts))) {
    if (!isObj(storyStart)) continue;
    const storyStartLocations = asArray(storyStart.locations) as string[];
    for (const location of storyStartLocations) {
      refError(context, location, locations, "storyStarts." + storyStartKey + ".locations", "location");
    }
    for (const npc of asArray(storyStart.startingPartyNPCs) as string[]) {
      refError(context, npc, npcs, "storyStarts." + storyStartKey + ".startingPartyNPCs", "NPC");
    }
    for (const quest of asArray(storyStart.startingQuests) as string[]) {
      refError(context, quest, quests, "storyStarts." + storyStartKey + ".startingQuests", "quest");
    }
    for (const area of asArray(storyStart.locationAreas) as string[]) {
      if (!allAreaNames.has(area)) {
        addError(context, "storyStarts." + storyStartKey + ".locationAreas",
          "storyStarts." + storyStartKey + ".locationAreas: area `" + area +
          "` does not exist under any location — fix: add it to a location's `areas`, or change locationAreas to reference an existing area");
      }
    }
    checkStartingItems(context, itemsDict, asArray(storyStart.startingItems), "storyStarts." + storyStartKey + ".startingItems");
  }

  for (const [questName, quest] of Object.entries(quests)) {
    if (!isObj(quest) || quest.detailType !== "basic") continue;
    const spatial = (quest.spatialRelationship ?? "") as string;
    if (spatial === "nearbyNewLocation" || spatial === "distantNewLocation") {
      addError(context, "quests." + questName + ".spatialRelationship", {
        title: "basic quest uses a relative-location spatialRelationship",
        value: spatial,
        detail: "it generates a location relative to the player's position and can fail to resolve when the quest is accepted (\"Failed to accept quest\")",
        fix: "use `existingLocalArea`, or `detailType: \"detailed\"` with a `questLocation`",
      });
    }
  }

  for (const [traitName, trait] of Object.entries(asDict(world.traits))) {
    if (!isObj(trait)) continue;
    checkStartingItems(context, itemsDict, asArray(trait.startingItems), "traits." + traitName + ".startingItems");
  }
  checkStartingItems(context, itemsDict, asArray(asDict(world.itemSettings).startingItems), "itemSettings.startingItems");
}

export function checkVariableRefs(world: World, context: ValidationContext): void {
  const validAttributes = new Set(asArray(asDict(world.attributeSettings).attributeNames) as string[]);
  const resourceNames   = new Set(Object.keys(asDict(world.resourceSettings)));
  const validBonusTargets = new Set<string>([
    ...validAttributes, ...resourceNames, ...Object.keys(asDict(world.skills)),
  ]);
  const skillTypeKeys = new Set(Object.keys(asDict(asDict(world.skillSettings).skillTypeDifficultyBonus)));
  if (validBonusTargets.size > 0) {
    for (const [itemName, item] of Object.entries(asDict(world.items))) {
      if (!isObj(item)) continue;
      const bonuses = item.bonuses;
      if (bonuses && !Array.isArray(bonuses)) {
        addError(context, "items." + itemName + ".bonuses",
          "`bonuses` must be an array of `{type, variable, value}` objects, got " + typeName(bonuses) + " — fix: change `bonuses` to an array (use `[]` if the item has no bonuses)");
        continue;
      }
      asArray(bonuses).forEach((bonus, j) => {
        if (!isObj(bonus)) return;
        const bonusVariable = (bonus.variable ?? "") as string;
        const bonusType = bonus.type;
        if (typeof bonusType === "string" && bonusType && VALID_BONUS_TYPES.size > 0 && !VALID_BONUS_TYPES.has(bonusType)) {
          addError(context, "items." + itemName + ".bonuses[" + j + "].type",
            "`" + bonusType + "` is not a valid bonus type — fix: change it to one of " +
            quotedList(VALID_BONUS_TYPES));
        }
        if (bonusVariable && bonusType !== "stat" && !validBonusTargets.has(bonusVariable)) {
          addError(context, "items." + itemName + ".bonuses[" + j + "].variable",
            "items." + itemName + ".bonuses[" + j + "].variable " + repr(bonusVariable) +
            " not in attributes/skills/resources — fix: change to an existing attribute/skill/resource key, or set bonus type to stat if variable is the engine-defined damage or armor");
        }
      });
    }
    for (const [skillName, skill] of Object.entries(asDict(world.skills))) {
      if (!isObj(skill)) continue;
      const skillAttribute = (skill.attribute ?? "") as string;
      if (skillAttribute && !validAttributes.has(skillAttribute)) {
        addError(context, "skills." + skillName + ".attribute",
          "unknown attribute `" + skillAttribute + "` — fix: either add `" + skillAttribute.toLowerCase() +
          "` to `attributeSettings.attributeNames` (all lowercase), or change this field to an existing attribute");
      }
      const skillType = (skill.type ?? "") as string;
      if (skillType && skillTypeKeys.size > 0 && !skillTypeKeys.has(skillType)) {
        addWarning(context, "skills." + skillName + ".type",
          "unknown skill type `" + skillType + "` — the engine looks up its difficulty bonus by this key in `skillSettings.skillTypeDifficultyBonus` and finds none, so the skill gets no type bonus — fix: set `type` to one of " +
          quotedList(skillTypeKeys, true) + ", or add `" + skillType + "` to `skillSettings.skillTypeDifficultyBonus`");
      }
    }
  }
}

export function checkSkillRefs(world: World, context: ValidationContext): void {
  const itemsDict = asDict(world.items);
  if (Object.keys(itemsDict).length === 0) return;
  function walk(obj: unknown, path: string): void {
    if (isObj(obj)) {
      if ("item" in obj && typeof obj.item === "string") {
        refError(context, obj.item, itemsDict, path + ".item", "item");
      }
      for (const [k, v] of Object.entries(obj)) {
        if (k !== "item") walk(v, path + "." + k);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((entry, i) => walk(entry, path + "[" + i + "]"));
    }
  }
  for (const [skillName, skill] of Object.entries(asDict(world.skills))) {
    walk(skill, "skills." + skillName);
  }
}

export function checkPremadeCharacterRefs(world: World, context: ValidationContext): void {
  const npcs   = asDict(world.npcs);
  const traits = asDict(world.traits);
  asArray(world.premadeCharacters).forEach((character, i) => {
    if (!isObj(character)) return;
    const name = (character.name ?? ("[" + i + "]")) as string;
    const replaces = (character.replacesNpc ?? "") as string;
    if (replaces && !(replaces in npcs)) {
      addError(context, "premadeCharacters[" + i + "].replacesNpc",
        "unknown NPC `" + replaces + "` referenced by `replacesNpc` — fix: either add `" + replaces +
        "` to the world's `npcs` section, or change `replacesNpc` to an existing NPC key");
    }
    for (const traitRef of asArray(character.traits)) {
      if (typeof traitRef === "string" && !(traitRef in traits)) {
        addError(context, "premadeCharacters[" + i + "].traits",
          "premadeCharacters " + name + ": trait " + repr(traitRef) +
          " not in traits dict — fix: either define this trait in the traits section, or change the premade trait reference to an existing trait key");
      }
    }
  });
}

export function checkNpcTypes(world: World, context: ValidationContext): void {
  const npcTypes = asDict(world.npcTypes);
  for (const [npcName, npc] of Object.entries(asDict(world.npcs))) {
    if (!isObj(npc)) continue;
    const npcType = (npc.type ?? "") as string;
    if (npcType && !(npcType in npcTypes)) {
      addError(context, "npcs." + npcName + ".type",
        "unknown npcType `" + npcType + "` — fix: either define `" + npcType +
        "` as an `npcTypes` entry (with `immunities`/`resistances`/`vulnerabilities`/`description` fields), or change this field to an existing npcType key");
    }
  }
}
