import {
  VALID_AI_TASKS, VALID_REQ_TYPES, NO_OP_TYPES, CONDITION_OP_MAP, ALL_CONDITION_OPS, RE_CHECK_TYPE, RE_EFFECTS_IDX, RE_EFFECTS_PSH, RE_SKIP_UNCOND, RE_SKIP_IN_IF, VALID_CONDITION_TYPES,
  NUMBER_EFFECT_OPS, BOOLEAN_EFFECT_OPS, ARRAY_EFFECT_OPS, NUMBER_EFFECT_TYPES, SET_REQUIRED_EFFECT_TYPES,
} from "../constants";
import {
  addError, asArray, asDict, compactJsonLen, isObj, prettyJsonLen, quotedList, repr, sectionSize, strLimit, typeName, withThousands,
} from "../helpers";
import type { ValidationContext, World } from "../types";
import { enforcedLimit, displayLimit } from "~/data/size-limits";

export function checkAiInstructionLimits(world: World, context: ValidationContext): void {
  const casefoldToCanonical = new Map<string, string>();
  for (const task of VALID_AI_TASKS) casefoldToCanonical.set(task.toLowerCase(), task);
  for (const [sectionKey, section] of Object.entries(asDict(world.aiInstructions))) {
    if (!VALID_AI_TASKS.has(sectionKey)) {
      const canonical = casefoldToCanonical.get(sectionKey.toLowerCase());
      if (canonical) {
        addError(context, "aiInstructions." + sectionKey,
          "case mismatch on aiInstructions task key — engine task keys are case-sensitive, so `" + sectionKey + "` is silently ignored — fix: rename to `" + canonical + "`");
      } else {
        addError(context, "aiInstructions." + sectionKey,
          "unknown aiInstructions task key — silently ignored by the engine — fix: rename to one of " +
          quotedList(VALID_AI_TASKS) + ", or remove the key");
      }
      continue;
    }
    if (!isObj(section)) continue;
    let taskTotal = 0;
    for (const [leafKey, leafVal] of Object.entries(section)) {
      strLimit(context, leafVal, "aiInstructions." + sectionKey + "." + leafKey, enforcedLimit("aiInstructionIndividual"));
      if (typeof leafVal === "string") taskTotal += leafVal.length;
    }
    // Engine caps each task's instructions individually (per the editor's "AI task X exceeds" error), not the section as a whole.
    const perTaskCap = enforcedLimit("aiInstructionPerTask");
    if (taskTotal > perTaskCap) {
      addError(context, "aiInstructions." + sectionKey,
        "aiInstructions." + sectionKey + " instructions total " + withThousands(taskTotal) +
        " chars — exceeds the " + withThousands(displayLimit("aiInstructionPerTask")) + "-char per-task limit — fix: trim " +
        withThousands(taskTotal - perTaskCap) + " chars from this task's instructions");
    }
  }
}

function checkTriggerCondition(context: ValidationContext, triggerName: string, index: number, condition: Record<string, unknown>): void {
  strLimit(context, condition.text ?? "", "triggers." + triggerName + ".conditions[" + index + "].text", enforcedLimit("triggerConditionText"));
  const conditionType = (condition.type ?? "") as string;
  const operator = condition.operator;
  const conditionValue = condition.value ?? "";
  if (!NO_OP_TYPES.has(conditionType)) {
    const validOperators = CONDITION_OP_MAP[conditionType] || ALL_CONDITION_OPS;
    if (operator !== undefined && operator !== null && typeof operator === "string" && !validOperators.has(operator)) {
      addError(context, "triggers." + triggerName + ".conditions[" + index + "].operator",
        "operator `" + operator + "` is not valid for condition type `" + conditionType +
        "` — fix: change it to one of " + quotedList(validOperators, true));
    }
  }
  if (conditionType === "read-boolean" && typeof conditionValue !== "boolean") {
    addError(context, "triggers." + triggerName + ".conditions[" + index + "].value",
      "expected boolean (JSON true or false literal), got " + typeName(conditionValue) + " (" + repr(conditionValue) +
      ") — fix: change the value to the JSON boolean literal true or false, not the string forms");
  } else {
    strLimit(context, conditionValue, "triggers." + triggerName + ".conditions[" + index + "].value", enforcedLimit("triggerConditionValue"));
  }
}

function checkTriggerEffect(context: ValidationContext, triggerName: string, index: number, effect: Record<string, unknown>): void {
  strLimit(context, effect.text ?? "", "triggers." + triggerName + ".effects[" + index + "].text", enforcedLimit("triggerEffectText"));
  const effectValue = effect.value ?? "";
  if (effect.type === "write-boolean" && typeof effectValue !== "boolean") {
    addError(context, "triggers." + triggerName + ".effects[" + index + "].value",
      "expected a JSON boolean, got " + typeName(effectValue) + " (" + repr(effectValue) + ") — fix: set the value to the literal `true` or `false`");
  } else {
    strLimit(context, effectValue, "triggers." + triggerName + ".effects[" + index + "].value", enforcedLimit("triggerEffectValue"));
  }
  const effectType = (effect.type ?? "") as string;
  const operator = effect.operator;
  const operatorPath = "triggers." + triggerName + ".effects[" + index + "].operator";
  if (SET_REQUIRED_EFFECT_TYPES.has(effectType)) {
    if (operator === undefined || operator === null) {
      addError(context, operatorPath, "`" + effectType + "` effects require an operator but none is set — fix: add `\"operator\": \"set\"`");
    } else if (operator !== "set") {
      addError(context, operatorPath, "`" + effectType + "` effects must use operator `set`, got `" + String(operator) + "` — fix: change the operator to `set`");
    }
  } else if (typeof operator === "string") {
    const validOps = NUMBER_EFFECT_TYPES.has(effectType) ? NUMBER_EFFECT_OPS
      : effectType === "write-boolean" ? BOOLEAN_EFFECT_OPS
      : effectType === "write-array" ? ARRAY_EFFECT_OPS
      : null;
    if (validOps && !validOps.has(operator)) {
      addError(context, operatorPath,
        "operator `" + operator + "` is not valid for effect type `" + effectType + "` — fix: change it to one of " + quotedList(validOps, true));
    }
  }
}

function checkTriggerScript(context: ValidationContext, triggerName: string, trigger: Record<string, unknown>, effects: unknown[]): void {
  const script = (trigger.script ?? "") as string;
  if (!script) return;
  let match: RegExpExecArray | null;
  const checkTypeRegex = new RegExp(RE_CHECK_TYPE.source, "g");
  while ((match = checkTypeRegex.exec(script)) !== null) {
    const conditionType = match[1];
    if (!VALID_CONDITION_TYPES.has(conditionType)) {
      addError(context, "triggers." + triggerName + ".script",
        "trigger script `check()` uses unknown condition type `" + conditionType +
        "` — fix: replace it with one of " + quotedList(VALID_CONDITION_TYPES));
    }
  }
  const effectsPushRegex = new RegExp(RE_EFFECTS_PSH.source, "g");
  const pushCount = (script.match(effectsPushRegex) || []).length;
  const effectsIndexRegex = new RegExp(RE_EFFECTS_IDX.source, "g");
  const indexWrites: number[] = [];
  let indexMatch: RegExpExecArray | null;
  while ((indexMatch = effectsIndexRegex.exec(script)) !== null) indexWrites.push(parseInt(indexMatch[1], 10));
  const maxIndexWrite = indexWrites.length ? Math.max(...indexWrites) + 1 : 0;
  const scriptMaxEffects = Math.max(effects.length + pushCount, maxIndexWrite);
  if (scriptMaxEffects > enforcedLimit("triggerEffects")) {
    addError(context, "triggers." + triggerName + ".script",
      "triggers." + triggerName + " script may push up to " + scriptMaxEffects +
      " effects (typed + script combined) — engine silently drops any beyond " + displayLimit("triggerEffects") + " — fix: reduce effects.push() calls in the script, or split this trigger into a chain that spreads effects across turns");
  }
  const isRecurring = !!trigger.recurring;
  if (!isRecurring && RE_SKIP_UNCOND.test(script) && !RE_SKIP_IN_IF.test(script)) {
    addError(context, "triggers." + triggerName + ".script",
      "unconditional skip = true on a non-recurring trigger — fires once, skips all effects, then gets consumed without effect — fix: either remove the skip, gate it on a condition, or set recurring: true so the trigger gets re-tried");
  }
}

export function checkTriggerLimits(world: World, context: ValidationContext): void {
  let semantic = 0, mechanical = 0;
  for (const [triggerName, trigger] of Object.entries(asDict(world.triggers))) {
    if (!isObj(trigger)) continue;
    if (trigger.type === "semantic") semantic++; else mechanical++;
    const conditions = asArray(trigger.conditions);
    const effects    = asArray(trigger.effects);
    if (conditions.length > enforcedLimit("triggerConditions")) {
      addError(context, "triggers." + triggerName + ".conditions",
        conditions.length + " conditions — exceeds " + displayLimit("triggerConditions") + " condition limit");
    }
    if (effects.length > enforcedLimit("triggerEffects")) {
      addError(context, "triggers." + triggerName + ".effects",
        effects.length + " effects — exceeds " + displayLimit("triggerEffects") + " effect limit");
    }
    conditions.forEach((condition, index) => { if (isObj(condition)) checkTriggerCondition(context, triggerName, index, condition); });
    effects.forEach((effect, index)       => { if (isObj(effect)) checkTriggerEffect(context, triggerName, index, effect); });
    const triggerSize = compactJsonLen(trigger);
    if (triggerSize >= enforcedLimit("triggerSize")) {
      addError(context, "triggers." + triggerName,
        "triggers." + triggerName + " is " + withThousands(triggerSize) +
        " chars (compact JSON) — exceeds the " + withThousands(displayLimit("triggerSize")) + "-char per-trigger limit — fix: trim the script body (most common culprit), shorten semantic query strings, or remove unused conditions/effects");
    }
    checkTriggerScript(context, triggerName, trigger, effects);
  }
  if (mechanical > enforcedLimit("mechanicalTriggers")) {
    addError(context, "triggers", mechanical +
      " mechanical triggers — exceeds the " + displayLimit("mechanicalTriggers") + "-trigger engine budget — fix: consolidate overlapping triggers, delete already-fired one-shots, or fold logic into trigger scripts that handle multiple cases");
  }
  if (semantic > enforcedLimit("semanticTriggers")) {
    addError(context, "triggers", semantic +
      " semantic (story/action) triggers — exceeds the " + displayLimit("semanticTriggers") + "-trigger engine budget — fix: replace semantic queries with typed conditions where possible, or consolidate overlapping detectors");
  }
}

function checkAbilityRequirement(
  context: ValidationContext, abilityName: string, index: number, requirement: Record<string, unknown>,
  skillNames: Set<string>, traitNames: Set<string>, resourceNames: Set<string>, attrNames: Set<string>,
): void {
  const requirementType = (requirement.type ?? "") as string;
  const variable = (requirement.variable ?? "") as string;
  const requirementPath = "abilities." + abilityName + ".requirements[" + index + "]";
  if (requirementType && !VALID_REQ_TYPES.has(requirementType)) {
    addError(context, requirementPath + ".type",
      "`" + requirementType + "` is not a valid requirement type — fix: change it to one of " + quotedList(VALID_REQ_TYPES));
    return;
  }
  if (requirementType === "skill" && !skillNames.has(variable)) {
    addError(context, requirementPath + ".variable",
      "unknown skill `" + variable + "` — fix: either define `" + variable +
      "` in the world's `skills` section, or change this requirement to reference an existing skill key");
  } else if (requirementType === "trait" && !traitNames.has(variable)) {
    addError(context, requirementPath + ".variable",
      "unknown trait `" + variable + "` — fix: either define `" + variable +
      "` in the world's `traits` section, or change this requirement to reference an existing trait key");
  } else if (requirementType === "resource" && !resourceNames.has(variable)) {
    addError(context, requirementPath + ".variable",
      "unknown resource `" + variable + "` — fix: either add `" + variable +
      "` to `resourceSettings`, or change this requirement to reference an existing resource key");
  } else if (requirementType === "attribute" && !attrNames.has(variable)) {
    addError(context, requirementPath + ".variable",
      "unknown attribute `" + variable +
      "` — `attribute` requirements must reference a valid attribute name. Valid attributes: " +
      [...attrNames].sort().join(", "));
  }
}

export function checkAbilityLimits(world: World, context: ValidationContext): void {
  const abilities = asDict(world.abilities);
  if (Object.keys(abilities).length > enforcedLimit("abilitiesCount")) {
    addError(context, "abilities", Object.keys(abilities).length +
      " ability entries — exceeds the " + withThousands(displayLimit("abilitiesCount")) + "-entry engine limit — fix: remove unused abilities, or consolidate similar capabilities into broader entries");
  }
  const attrNames     = new Set(asArray(asDict(world.attributeSettings).attributeNames) as string[]);
  const skillNames    = new Set(Object.keys(asDict(world.skills)));
  const resourceNames = new Set(Object.keys(asDict(world.resourceSettings)));
  const traitNames    = new Set(Object.keys(asDict(world.traits)));
  const maxSkillSuccess = (asDict(world.skillSettings).maxSkillSuccessLevel as number) ?? 999;

  for (const [abilityName, ability] of Object.entries(abilities)) {
    if (!isObj(ability)) continue;
    strLimit(context, ability.description ?? "", "abilities." + abilityName + ".description", enforcedLimit("abilityDescription"));
    const bonus = ability.bonus;
    if (typeof bonus === "number" && bonus > maxSkillSuccess) {
      addError(context, "abilities." + abilityName + ".bonus",
        "bonus value " + bonus + " exceeds `skillSettings.maxSkillSuccessLevel` (" + maxSkillSuccess +
        ") — Voyage clamps the applied contribution to the cap, so excess is wasted — fix: either reduce the bonus to " +
        maxSkillSuccess + " or raise `skillSettings.maxSkillSuccessLevel`");
    }
    const requirements = ability.requirements;
    if (Array.isArray(requirements) && requirements.length > enforcedLimit("abilityRequirements")) {
      addError(context, "abilities." + abilityName + ".requirements",
        requirements.length + " requirement entries on this ability — exceeds the " + displayLimit("abilityRequirements") + "-entry limit (engine ignores any beyond) — fix: reduce to ten or fewer by combining or removing redundant requirements");
    }
    asArray(requirements).forEach((requirement, index) => {
      if (isObj(requirement)) checkAbilityRequirement(context, abilityName, index, requirement, skillNames, traitNames, resourceNames, attrNames);
    });
  }
}

// Anti-context-explosion caps the engine added on settings/roster fields (count + length).
export function checkSettingsAndRosterLimits(world: World, context: ValidationContext): void {
  const damageTypes = asArray(asDict(world.combatSettings).damageTypes);
  if (damageTypes.length > enforcedLimit("damageTypesCount")) {
    addError(context, "combatSettings.damageTypes", damageTypes.length +
      " damage types — exceeds the " + displayLimit("damageTypesCount") + "-entry limit — fix: remove or consolidate damage types");
  }
  damageTypes.forEach((dt, i) => strLimit(context, dt, "combatSettings.damageTypes[" + i + "]", enforcedLimit("damageTypeEntry")));

  const itemSettings = asDict(world.itemSettings);
  const itemCategories = asArray(itemSettings.itemCategories);
  if (itemCategories.length > enforcedLimit("itemCategoriesCount")) {
    addError(context, "itemSettings.itemCategories", itemCategories.length +
      " item categories — exceeds the " + displayLimit("itemCategoriesCount") + "-entry limit — fix: remove or consolidate categories");
  }
  itemCategories.forEach((c, i) => strLimit(context, c, "itemSettings.itemCategories[" + i + "]", enforcedLimit("itemCategoryEntry")));
  const itemSlots = asArray(itemSettings.itemSlots);
  if (itemSlots.length > enforcedLimit("itemSlotsCount")) {
    addError(context, "itemSettings.itemSlots", itemSlots.length +
      " item slots — exceeds the " + displayLimit("itemSlotsCount") + "-slot limit — fix: remove unused slots");
  }
  itemSlots.forEach((slot, i) => {
    if (isObj(slot)) {
      strLimit(context, slot.slot ?? "", "itemSettings.itemSlots[" + i + "].slot", enforcedLimit("itemSlotName"));
      strLimit(context, slot.category ?? "", "itemSettings.itemSlots[" + i + "].category", enforcedLimit("itemSlotCategory"));
    } else {
      strLimit(context, slot, "itemSettings.itemSlots[" + i + "]", enforcedLimit("itemSlotName"));
    }
  });
  strLimit(context, itemSettings.currencyName ?? "", "itemSettings.currencyName", enforcedLimit("currencyName"));

  const attributeNames = asArray(asDict(world.attributeSettings).attributeNames);
  if (attributeNames.length > enforcedLimit("attributeNamesCount")) {
    addError(context, "attributeSettings.attributeNames", attributeNames.length +
      " attribute names — exceeds the " + displayLimit("attributeNamesCount") + "-entry limit — fix: reduce to " + displayLimit("attributeNamesCount") + " or fewer");
  }
  attributeNames.forEach((a, i) => strLimit(context, a, "attributeSettings.attributeNames[" + i + "]", enforcedLimit("attributeNameEntry")));

  const nameFilterSettings = asDict(world.nameFilterSettings);
  sectionSize(context, nameFilterSettings, "nameFilterSettings", enforcedLimit("nameFilterSettingsSection"));
  for (const [groupKey, group] of Object.entries(nameFilterSettings)) {
    asArray(asDict(group).replacements).forEach((r, i) =>
      strLimit(context, r, "nameFilterSettings." + groupKey + ".replacements[" + i + "]", enforcedLimit("nameFilterReplacement")));
  }

  sectionSize(context, asDict(world.realms), "realms", enforcedLimit("realmsSection"));

  const premades = asArray(world.premadeCharacters);
  if (premades.length > enforcedLimit("premadeCharactersCount")) {
    addError(context, "premadeCharacters", premades.length +
      " premade characters — exceeds the " + displayLimit("premadeCharactersCount") + "-entry limit — fix: remove some premades");
  }
  premades.forEach((pc, i) => {
    const size = compactJsonLen(pc);
    if (size > enforcedLimit("premadeCharacterEntry")) {
      const name = isObj(pc) && typeof pc.name === "string" ? pc.name : String(i);
      addError(context, "premadeCharacters[" + i + "]", "premadeCharacters." + name + " is " + withThousands(size) +
        " chars (compact JSON) — exceeds the " + withThousands(displayLimit("premadeCharacterEntry")) +
        "-char per-character limit — fix: trim the description and other fields on this entry");
    }
  });
}

// Per-field caps inside each gameModes entry, on top of the whole-section cap.
export function checkGameModeLimits(world: World, context: ValidationContext): void {
  const fieldLimits = [
    ["name", "gameModeName"],
    ["description", "gameModeDescription"],
    ["instructions", "gameModeInstructions"],
    ["askTheNarratorPrompt", "gameModeAskTheNarratorPrompt"],
  ] as const;
  for (const [modeName, mode] of Object.entries(asDict((world as Record<string, unknown>).gameModes))) {
    if (!isObj(mode)) continue;
    for (const [field, limitId] of fieldLimits) {
      strLimit(context, mode[field] ?? "", "gameModes." + modeName + "." + field, enforcedLimit(limitId));
    }
  }
}

export function checkSizeLimits(world: World, context: ValidationContext): void {
  checkAiInstructionLimits(world, context);
  checkTriggerLimits(world, context);
  checkAbilityLimits(world, context);
  checkSettingsAndRosterLimits(world, context);
  checkGameModeLimits(world, context);

  const worldTotalCap = enforcedLimit("worldConfigTotal");
  const worldTotal = prettyJsonLen(world);
  if (worldTotal > worldTotalCap) {
    addError(context, "",
      "entire world config is " + withThousands(worldTotal) +
      " chars (pretty JSON) — exceeds the " + withThousands(displayLimit("worldConfigTotal")) +
      "-char total limit — fix: trim the largest sections (usually npcs, locations, or worldLore)");
  }

  const storySettings = asDict(world.storySettings);
  for (const field of ["worldBackground", "questGenerationGuidance"]) {
    strLimit(context, storySettings[field] ?? "", "storySettings." + field, enforcedLimit(field));
  }
  const worldLore = asDict(world.worldLore);
  sectionSize(context, worldLore, "worldLore", enforcedLimit("worldLoreSection"));
  for (const [loreName, lore] of Object.entries(worldLore)) {
    if (isObj(lore)) strLimit(context, lore.text ?? "", "worldLore." + loreName + ".text", enforcedLimit("worldLoreEntry"));
  }
  const storyStarts = asDict(world.storyStarts);
  if (Object.keys(storyStarts).length > enforcedLimit("storyStartsCount")) {
    addError(context, "storyStarts", Object.keys(storyStarts).length +
      " story start entries — exceeds the " + displayLimit("storyStartsCount") + "-entry limit — fix: consolidate similar starts or remove unused ones");
  }
  for (const [storyStartName, storyStartEntry] of Object.entries(storyStarts)) {
    const entrySize = prettyJsonLen(storyStartEntry);
    if (entrySize >= enforcedLimit("storyStartEntry")) {
      addError(context, "storyStarts." + storyStartName,
        "storyStarts." + storyStartName + " is " + withThousands(entrySize) +
        " chars (pretty JSON) — exceeds the " + withThousands(displayLimit("storyStartEntry")) + "-char per-entry limit — fix: shorten the storyStart prose, description, firstQuest, or questGenerationGuidance fields on this entry");
    }
  }
  for (const [itemName, item] of Object.entries(asDict(world.items))) {
    if (isObj(item)) strLimit(context, item.description ?? "", "items." + itemName + ".description", enforcedLimit("itemDescription"));
  }
  for (const [factionName, faction] of Object.entries(asDict(world.factions))) {
    if (!isObj(faction)) continue;
    for (const [field, limitId] of [["basicInfo", "factionBasicInfo"], ["hiddenInfo", "factionHiddenInfo"]] as const) {
      strLimit(context, faction[field] ?? "", "factions." + factionName + "." + field, enforcedLimit(limitId));
    }
  }
  for (const [npcTypeName, npcType] of Object.entries(asDict(world.npcTypes))) {
    if (isObj(npcType)) strLimit(context, npcType.description ?? "", "npcTypes." + npcTypeName + ".description", enforcedLimit("npcTypeDescription"));
  }
  for (const [npcName, npc] of Object.entries(asDict(world.npcs))) {
    const compactSize = compactJsonLen(npc);
    if (compactSize >= enforcedLimit("npcEntry")) {
      addError(context, "npcs." + npcName,
        "npcs." + npcName + " serializes to " + withThousands(compactSize) +
        " chars (compact JSON) — exceeds the " + withThousands(displayLimit("npcEntry")) + "-char per-entry limit — fix: trim " +
        withThousands(compactSize - displayLimit("npcEntry")) +
        "+ chars; usual targets are abilities array entries, hiddenInfo, and the closing fighting-style entry");
    }
  }
  for (const [realmName, realm] of Object.entries(asDict(world.realms))) {
    if (isObj(realm)) strLimit(context, realm.basicInfo ?? "", "realms." + realmName + ".basicInfo", enforcedLimit("realmBasicInfo"));
  }
  for (const [regionName, region] of Object.entries(asDict(world.regions))) {
    if (!isObj(region)) continue;
    for (const [field, limitId] of [["basicInfo", "regionBasicInfo"], ["hiddenInfo", "regionHiddenInfo"]] as const) {
      strLimit(context, region[field] ?? "", "regions." + regionName + "." + field, enforcedLimit(limitId));
    }
  }
  for (const [locationName, location] of Object.entries(asDict(world.locations))) {
    if (!isObj(location)) continue;
    for (const [field, limitId] of [["basicInfo", "locationBasicInfo"], ["hiddenInfo", "locationHiddenInfo"]] as const) {
      strLimit(context, location[field] ?? "", "locations." + locationName + "." + field, enforcedLimit(limitId));
    }
    for (const [areaName, area] of Object.entries(asDict(location.areas))) {
      if (isObj(area)) {
        strLimit(context, area.description ?? "",
          "locations." + locationName + ".areas." + areaName + ".description", enforcedLimit("areaDescription"));
      }
    }
  }
  for (const [traitName, trait] of Object.entries(asDict(world.traits))) {
    if (isObj(trait)) strLimit(context, trait.description ?? "", "traits." + traitName + ".description", enforcedLimit("traitDescription"));
  }

  sectionSize(context, asDict(world.npcTypes),        "npcTypes",        enforcedLimit("npcTypesSection"));
  sectionSize(context, asDict(world.npcs),            "npcs",            enforcedLimit("npcsSection"));
  sectionSize(context, asDict(world.locations),       "locations",       enforcedLimit("locationsSection"));
  sectionSize(context, asDict(world.factions),        "factions",        enforcedLimit("factionsSection"));
  sectionSize(context, asDict(world.regions),         "regions",         enforcedLimit("regionsSection"));
  sectionSize(context, asDict(world.items),           "items",           enforcedLimit("itemsSection"));
  sectionSize(context, asDict(world.traitCategories), "traitCategories", enforcedLimit("traitCategoriesSection"));
  sectionSize(context, asDict(world.itemSettings),    "itemSettings",    enforcedLimit("itemSettingsSection"));
  sectionSize(context, asDict((world as Record<string, unknown>).gameModes), "gameModes", enforcedLimit("gameModesSection"));
  strLimit(context, asDict(world.death).instructions ?? "", "death.instructions", enforcedLimit("deathInstructions"));
  strLimit(context, world.narratorStyle ?? "", "narratorStyle", enforcedLimit("narratorStyle"));

  // Engine caps each imagePromptConfiguration field and their combined length.
  const imagePromptConfig = world.imagePromptConfiguration;
  if (isObj(imagePromptConfig)) {
    let combinedLength = 0;
    for (const promptField of ["npcs", "locations", "regions"] as const) {
      const fieldValue = (imagePromptConfig as Record<string, unknown>)[promptField];
      if (typeof fieldValue === "string") {
        strLimit(context, fieldValue, "imagePromptConfiguration." + promptField, enforcedLimit("imagePromptField"));
        combinedLength += fieldValue.length;
      }
    }
    const combinedCap = enforcedLimit("imagePromptCombined");
    if (combinedLength > combinedCap) {
      addError(context, "imagePromptConfiguration",
        "imagePromptConfiguration combined length is " + combinedLength.toLocaleString() +
        " chars — exceeds " + withThousands(displayLimit("imagePromptCombined")) + "-char total limit across `npcs` + `locations` + `regions`" +
        " — fix: trim " + (combinedLength - combinedCap).toLocaleString() +
        " chars from one or more of the three fields");
    }
  }
}
