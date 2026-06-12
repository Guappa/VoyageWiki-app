import {
  AI_TASK_DESCRIPTIONS, ENTITY_SECTIONS, HIGH_COMBAT_TIERS, SEQUENTIAL_SUFFIX_PATTERNS,
} from "./constants";
import { addRecommendation, asArray, asDict, isObj } from "./helpers";
import type { ValidationContext, World } from "./types";

function collectStartingItemsRecs(world: World, context: ValidationContext): void {
  for (const [ssKey, storyStart] of Object.entries(asDict(world.storyStarts))) {
    if (!isObj(storyStart)) continue;
    const items = asArray(storyStart.startingItems);
    if (items.length > 0) {
      addRecommendation(context, "storyStarts." + ssKey + ".startingItems",
        "these items apply to every player and get separate inventory IDs from `trait`/`itemSettings` items of the same name, which breaks `item-remove` operations — fix: move them to `trait.startingItems` (per-class loadouts) or `itemSettings.startingItems` (universal inventory)\nSafe to ignore if your world never runs `item-remove` trigger operations on these items.");
    }
  }
}

function collectQuestActivationRecs(world: World, context: ValidationContext): void {
  const triggers = asDict(world.triggers);
  const quests   = asDict(world.quests);
  const activated = new Set<string>();
  for (const t of Object.values(triggers)) {
    if (!isObj(t)) continue;
    for (const eff of asArray(t.effects)) {
      if (isObj(eff) && eff.type === "quest-init") activated.add((eff.value ?? "") as string);
    }
  }
  for (const storyStart of Object.values(asDict(world.storyStarts))) {
    if (!isObj(storyStart)) continue;
    for (const q of asArray(storyStart.startingQuests)) {
      if (typeof q === "string") activated.add(q);
    }
  }
  for (const questName of Object.keys(quests)) {
    if (!activated.has(questName)) {
      addRecommendation(context, "quests." + questName,
        "no `quest-init` trigger or `storyStart.startingQuests` entry activates this quest — it stays permanently hidden and journal/XP/completion never fire — " +
        "fix: add a trigger with a `quest-init` effect whose value is `" + questName + "`, or list it in a `storyStart.startingQuests` array");
    }
  }
}

function collectTriggerPatternRecs(world: World, context: ValidationContext): void {
  const triggers = asDict(world.triggers);
  const allWrittenFlags = new Set<string>();
  for (const t of Object.values(triggers)) {
    if (!isObj(t)) continue;
    for (const eff of asArray(t.effects)) {
      if (isObj(eff) && eff.type === "write-boolean" && typeof eff.key === "string") {
        allWrittenFlags.add(eff.key);
      }
    }
  }
  for (const [triggerName, trigger] of Object.entries(triggers)) {
    if (!isObj(trigger)) continue;
    const conditions = asArray(trigger.conditions);
    const effects    = asArray(trigger.effects);
    const hasScript  = !!((trigger.script ?? "") as string).trim();
    const conditionTypes  = new Set(conditions.map((c) => (isObj(c) ? c.type : undefined)).filter(Boolean));

    if (conditionTypes.has("party-location") && effects.some((e) => isObj(e) && e.type === "quest-init")) {
      addRecommendation(context, "triggers." + triggerName,
        "this arrival trigger fires `quest-init` directly, which can surface a quest before the narrative is ready — fix: split it into a `start_` trigger (sets a `write-boolean` flag) and a `discover_` trigger (gated on `read-boolean` + a `story` condition)\nSafe to ignore for instant-reveal quests where no narrative gating is wanted.");
    }

    if (triggerName.startsWith("discover_")) {
      if (!conditionTypes.has("read-boolean")) {
        addRecommendation(context, "triggers." + triggerName,
          "this `discover_` trigger has no `read-boolean` condition — it should gate on the flag its matching `start_` trigger sets — fix: add a `read-boolean` condition on that flag key");
      }
      if (!conditionTypes.has("story")) {
        addRecommendation(context, "triggers." + triggerName,
          "this `discover_` trigger has no `story` condition — without one its `quest-init` fires on the first tick instead of at an organic in-narration moment — fix: add a `story` condition describing when the reveal should happen");
      }
      for (const condition of conditions) {
        if (isObj(condition) && condition.type === "read-boolean") {
          const flagKey = (condition.key ?? "") as string;
          if (flagKey && !allWrittenFlags.has(flagKey)) {
            addRecommendation(context, "triggers." + triggerName,
              "reads boolean flag `" + flagKey + "` that no trigger sets via `write-boolean` — the flag may never become true, so this trigger may never fire — fix: add a `write-boolean` effect that sets `" + flagKey + "`");
          }
        }
      }
    }

    if (triggerName.startsWith("start_")) {
      if (!effects.some((e) => isObj(e) && e.type === "write-boolean")) {
        addRecommendation(context, "triggers." + triggerName,
          "this `start_` trigger writes no boolean flag, but the paired `discover_` trigger reads one — fix: add a `write-boolean` effect that sets the same flag key the `discover_` trigger reads");
      }
    }

    if (effects.length === 0 && !hasScript) {
      addRecommendation(context, "triggers." + triggerName,
        "this trigger has no `effects` and no `script`, so it does nothing — fix: add at least one effect or a `script` body, or remove the trigger");
    }
  }
}

function collectRegionRecs(world: World, context: ValidationContext): void {
  const locationCountByRegion: Record<string, number> = {};
  for (const regionName of Object.keys(asDict(world.regions))) {
    locationCountByRegion[regionName] = 0;
  }
  for (const location of Object.values(asDict(world.locations))) {
    if (!isObj(location)) continue;
    const key = (location.region ?? "") as string;
    if (key in locationCountByRegion) locationCountByRegion[key]++;
  }
  for (const [regionName, count] of Object.entries(locationCountByRegion)) {
    if (count < 3) {
      addRecommendation(context, "regions." + regionName,
        "only " + count + " location(s) in this region — fewer than 3 feels sparse — fix: add 2+ locations (settlement, wilderness site, ruin, landmark) so the player has somewhere to explore\nSafe to ignore for small specialized regions (tutorial pocket, boss arena, intro vignette).");
    }
  }
  for (const [regionName, region] of Object.entries(asDict(world.regions))) {
    if (!isObj(region)) continue;
    if (!("npcLevelRange" in region)) {
      addRecommendation(context, "regions." + regionName + ".npcLevelRange",
        "`npcLevelRange` is not set — the engine falls back to a default range — fix: set `npcLevelRange` to keep starter and frontier zones on the intended difficulty curve\nSafe to ignore if the engine fallback range matches your intent.");
    }
  }
}

function collectNpcQualityRecs(world: World, context: ValidationContext): void {
  let npcMissingVoice = 0;
  for (const [npcName, npc] of Object.entries(asDict(world.npcs))) {
    if (!isObj(npc)) continue;
    const detailType = (npc.detailType ?? "") as string;
    const hasBasic = !!((npc.basicInfo ?? "") as string).trim();
    const hasAbilities = asArray(npc.abilities).length > 0;
    const tier = (npc.tier ?? "") as string;
    if (hasBasic && hasAbilities && detailType !== "detailed") {
      const dtRepr = detailType ? "`" + detailType + "`" : "unset";
      addRecommendation(context, "npcs." + npcName + ".detailType",
        "has `basicInfo` and `abilities` but `detailType` is " + dtRepr +
        " — fix: set `detailType` to `detailed` so the engine uses the authored content instead of regenerating it");
    }
    if (HIGH_COMBAT_TIERS.has(tier) && !hasAbilities) {
      addRecommendation(context, "npcs." + npcName + ".abilities",
        "`tier` is `" + tier + "` but the `abilities` array is empty — combat-relevant NPCs play better with authored abilities — fix: add a few abilities\nSafe to ignore if you rely on AI-generated abilities at fight time.");
    }
    if (detailType === "detailed" && !((npc.voiceTag ?? "") as string)) {
      npcMissingVoice++;
    }
  }
  if (npcMissingVoice > 0) {
    addRecommendation(context, "npcs",
      npcMissingVoice + " authored NPC(s) have no `voiceTag` — `voiceTag` controls the TTS narration voice — " +
      "fix: set `npcs.<name>.voiceTag` to a Voice Catalog string like `male baritone warm` or " +
      "`female warm soft` (full list with audio previews: https://voyagewiki.pages.dev/appendix/voice-catalog)\nSafe to ignore for silent NPCs, non-TTS worlds, or worlds that intentionally use the default voice everywhere.");
  }
}

function collectWorldGuidanceRecs(world: World, context: ValidationContext): void {
  const guidance = (asDict(world.storySettings).questGenerationGuidance ?? "") as string;
  if (guidance.trim().length < 100) {
    addRecommendation(context, "storySettings.questGenerationGuidance",
      "no custom `questGenerationGuidance` set — this field shapes engine-generated quests — fix: write guidance on quest tone and structure\nSafe to ignore if you rely on engine defaults for quest generation.");
  }
  if (!world.authorSeeds || (Array.isArray(world.authorSeeds) && world.authorSeeds.length === 0) ||
      (isObj(world.authorSeeds) && Object.keys(world.authorSeeds).length === 0)) {
    addRecommendation(context, "authorSeeds",
      "`authorSeeds` is empty — seeds give the AI authorial direction across different scene types — fix: add named narrator-register seeds (8-12 words each)\nSafe to ignore if you want the AI to pick narrator register freely.");
  }
  const ai = asDict(world.aiInstructions);
  for (const [sectionKey, note] of Object.entries(AI_TASK_DESCRIPTIONS)) {
    const section = ai[sectionKey];
    let hasContent = false;
    if (isObj(section)) {
      for (const v of Object.values(section)) {
        if (typeof v === "string" && v.trim()) { hasContent = true; break; }
      }
    }
    if (!hasContent) {
      addRecommendation(context, "aiInstructions." + sectionKey, {
        title: "no custom instructions set for this task",
        detail: note + "\nSafe to ignore if you rely on engine defaults for this task.",
        fix: "add instructions for this task",
      });
    }
  }
}

function collectNameSimilarityRecs(world: World, context: ValidationContext): void {
  for (const [sectionKey, entityLabel] of ENTITY_SECTIONS) {
    const entityNames = Object.keys(asDict(world[sectionKey]));
    if (entityNames.length < 2) continue;

    const lowercaseSeen: Record<string, string> = {};
    for (const name of entityNames) {
      const lower = name.toLowerCase();
      if (lower in lowercaseSeen) {
        addRecommendation(context, sectionKey + "." + name,
          "name matches `" + lowercaseSeen[lower] + "` except for case — the engine may confuse these " + entityLabel +
          "s during retrieval — fix: rename one so they differ by more than case");
      } else {
        lowercaseSeen[lower] = name;
      }
    }

    const baseGroups: Record<string, Array<[string, number]>> = {};
    for (const name of entityNames) {
      for (const pattern of SEQUENTIAL_SUFFIX_PATTERNS) {
        const match = name.match(pattern);
        if (match) {
          const base = match[1].trim().toLowerCase();
          const number = parseInt(match[2], 10);
          (baseGroups[base] ??= []).push([name, number]);
          break;
        }
      }
    }
    for (const group of Object.values(baseGroups)) {
      if (group.length >= 2) {
        group.sort((a, b) => a[1] - b[1]);
        const names = group.slice(0, 4).map(([n]) => "`" + n + "`").join(", ");
        const more = group.length > 4 ? " (+" + (group.length - 4) + " more)" : "";
        addRecommendation(context, sectionKey, {
          title: "sequentially numbered names: " + names + more,
          detail: "the engine conflates sequentially numbered " + entityLabel + "s",
          fix: "use distinct descriptive names",
        });
      }
    }
  }
}

function collectQuestTypeRecs(world: World, context: ValidationContext): void {
  const missing = Object.entries(asDict(world.quests))
    .filter(([, q]) => isObj(q) && !((q.questType ?? "") as string).trim())
    .map(([n]) => n);
  if (missing.length === 0) return;
  const preview = missing.slice(0, 5).join(", ") + (missing.length > 5 ? " (+" + (missing.length - 5) + " more)" : "");
  addRecommendation(context, "quests", {
    title: missing.length + " quest(s) missing `questType`",
    detail: "a category label helps the AI frame each quest in the journal. Affected: " + preview + "\nSafe to ignore for uncategorized freeform quests.",
    fix: "add `questType` (`main`, `side`, `task`, `investigation`, `defense`, `infiltration`, `progression`) to every quest",
    docsAnchor: "questType",
  });
}

function collectVisualDescriptionRecs(world: World, context: ValidationContext): void {
  const affected = Object.entries(asDict(world.npcs))
    .filter(([, npc]) => isObj(npc) && ((npc.visualDescription ?? "") as string).trim())
    .map(([name]) => name);
  if (affected.length > 0) {
    const preview = affected.slice(0, 5).join(", ") + (affected.length > 5 ? " (+" + (affected.length - 5) + " more)" : "");
    addRecommendation(context, "npcs", {
      title: affected.length + " NPC(s) have `visualDescription` set",
      detail: "it is read only by the image generator (which otherwise falls back to `basicInfo`) and never by the narrator. Affected: " + preview + "\nSafe to ignore if the image-only detail is intentional.",
      fix: "keep it only for portrait-specific appearance the narrator should not describe; if it just repeats `basicInfo`, clear it",
      docsAnchor: "visualDescription",
    });
  }
}

function collectFactionWorldLoreRecs(world: World, context: ValidationContext): void {
  const worldLore = asDict(world.worldLore);
  for (const factionName of Object.keys(asDict(world.factions))) {
    if (!(factionName in worldLore)) {
      addRecommendation(context, "factions." + factionName,
        "no `worldLore` entry matches faction key `" + factionName + "` — pairing them gives faction context two retrieval pathways — " +
        "fix: add a `worldLore` entry keyed `" + factionName + "` whose text matches the faction `basicInfo`");
    }
  }
}

function collectStartingZoneNpcRecs(world: World, context: ValidationContext): void {
  const npcs = asDict(world.npcs);
  for (const [ssKey, storyStart] of Object.entries(asDict(world.storyStarts))) {
    if (!isObj(storyStart)) continue;
    const ssLocations = new Set(asArray(storyStart.locations) as string[]);
    const ssAreas = new Set(asArray(storyStart.locationAreas) as string[]);
    for (const [npcName, npc] of Object.entries(npcs)) {
      if (!isObj(npc)) continue;
      if (npc.type === "character" &&
          ssLocations.has((npc.currentLocation ?? "") as string) &&
          ssAreas.has((npc.currentArea ?? "") as string)) {
        addRecommendation(context, "storyStarts." + ssKey,
          "character NPC `" + npcName + "` sits in the starting zone " +
          "(location `" + ((npc.currentLocation ?? "") as string) + "`, area `" + ((npc.currentArea ?? "") as string) + "`) — " +
          "starting zones should contain no character NPCs, or every run opens with the same NPC in the same spot — " +
          "fix: move `" + npcName + "` to a non-starting area of the same location\nSafe to ignore for scripted openings where that NPC always greets the player intentionally.");
        break; // one rec per story start is enough
      }
    }
  }
}

// Quality nudges reclassified from warnings per Sephii's framework (warning = might break, rec = might improve).
function collectQualityRecs(world: World, context: ValidationContext): void {
  asArray(world.premadeCharacters).forEach((character, i) => {
    if (!isObj(character)) return;
    const name = (character.name ?? ("[" + i + "]")) as string;
    if (!asArray(character.traits).length) {
      addRecommendation(context, "premadeCharacters[" + i + "].traits",
        "premade character `" + name + "` has an empty `traits` array — fix: add at least one trait key (e.g. `Race`, `Origin`, `Class`)");
    }
    if (!((character.description ?? "") as string).trim()) {
      addRecommendation(context, "premadeCharacters[" + i + "].description",
        "premade character `" + name + "` has an empty `description` — fix: write the character's player-facing background");
    }
  });

  for (const [npcName, npc] of Object.entries(asDict(world.npcs))) {
    if (!isObj(npc)) continue;
    if (!asArray(npc.personality).length) {
      addRecommendation(context, "npcs." + npcName + ".personality",
        "`personality` is empty — fix: add 4+ behavioral entries (e.g. a positive trait, a neutral trait, a negative trait, a speaking style)");
    }
    if (!((npc.basicInfo ?? "") as string).trim()) {
      addRecommendation(context, "npcs." + npcName + ".basicInfo",
        "`basicInfo` is empty — fix: write ~3 sentences covering role/species/gender, appearance, and what they wear or carry");
    }
    if (npc.detailType === "detailed" && !((npc.hiddenInfo ?? "") as string).trim()) {
      addRecommendation(context, "npcs." + npcName + ".hiddenInfo",
        "this authored NPC has no `hiddenInfo`, so the AI plays it without interior life — fix: write the contradiction between what others see and what is actually true, plus something actively happening\nSafe to ignore for flat character NPCs (the friendly innkeeper, the helpful shopkeeper) who genuinely have no hidden depth.");
    }
  }

  for (const [factionName, faction] of Object.entries(asDict(world.factions))) {
    if (!isObj(faction)) continue;
    if (!((faction.basicInfo ?? "") as string).trim()) {
      addRecommendation(context, "factions." + factionName + ".basicInfo",
        "`basicInfo` is empty — fix: write a 2-3 sentence public-facing description of who the faction is and what they do");
    }
    if (!((faction.hiddenInfo ?? "") as string).trim()) {
      addRecommendation(context, "factions." + factionName + ".hiddenInfo",
        "`hiddenInfo` is empty — fix: write a paragraph of GM-only context (true motives, secrets, internal rifts)\nSafe to ignore for fully transparent factions.");
    }
  }

  for (const [questName, quest] of Object.entries(asDict(world.quests))) {
    if (!isObj(quest)) continue;
    if (!((quest.questStatement ?? "") as string).trim()) {
      addRecommendation(context, "quests." + questName + ".questStatement",
        "`questStatement` is empty — the AI has no briefing and will improvise the objective — fix: write the situation, who is involved, what the player must do, and how success is judged (100–500 chars is typical)");
    }
  }

  for (const [ssKey, storyStart] of Object.entries(asDict(world.storyStarts))) {
    if (!isObj(storyStart)) continue;
    if (!((storyStart.description ?? "") as string).trim()) {
      addRecommendation(context, "storyStarts." + ssKey + ".description",
        "`description` is empty — fix: write 1-2 player-facing sentences shown in the story-start selector UI");
    }
    if (!((storyStart.storyStart ?? "") as string).trim()) {
      addRecommendation(context, "storyStarts." + ssKey + ".storyStart",
        "`storyStart` is empty — fix: write the opening prose injected at session start");
    }
  }

  for (const [regionName, region] of Object.entries(asDict(world.regions))) {
    if (!isObj(region)) continue;
    for (const axis of ["x", "y"] as const) {
      const value = region[axis];
      if (typeof value === "number" && Math.abs(value) > 20) {
        addRecommendation(context, "regions." + regionName + "." + axis,
          "`" + axis + "` = " + value +
          " is large for a region grid coordinate — region x/y are cell indices where adjacent regions differ by 1, so values like 95 or 220 place regions thousands of cells apart and break map navigation — fix: use small adjacent integers forming a connected grid, not absolute or regionSize-scaled coordinates");
      }
    }
    if (isObj(region) && ((region.hiddenInfo ?? "") as string).trim()) {
      addRecommendation(context, "regions." + regionName + ".hiddenInfo",
        "`hiddenInfo` on a region has no documented runtime function — fix: move region secrets into a location or NPC `hiddenInfo` instead, then clear this field");
    }
  }

  for (const [locationName, location] of Object.entries(asDict(world.locations))) {
    if (!isObj(location)) continue;
    if (location.complexityType === "complex" && location.detailType === "detailed" &&
        !((location.hiddenInfo ?? "") as string).trim()) {
      addRecommendation(context, "locations." + locationName + ".hiddenInfo",
        "this complex authored location has no `hiddenInfo` — fix: write faction presence, buried secrets, or something actively happening the player can discover (400–1,600 chars)\nSafe to ignore for pure-utility locations (transit hubs, generic shops) that genuinely have nothing hidden.");
    }
  }

  const shortPersonality = Object.entries(asDict(world.npcs))
    .filter(([, npc]) => {
      if (!isObj(npc)) return false;
      const personality = Array.isArray(npc.personality) ? npc.personality : [];
      return personality.length >= 1 && personality.length < 4;
    })
    .map(([n]) => n);
  if (shortPersonality.length > 0) {
    const preview = shortPersonality.slice(0, 5).join(", ") + (shortPersonality.length > 5 ? " (+" + (shortPersonality.length - 5) + " more)" : "");
    addRecommendation(context, "npcs", {
      title: shortPersonality.length + " NPC(s) have fewer than 4 `personality` entries",
      detail: "Affected: " + preview + "\nSafe to ignore for minor walk-on NPCs.",
      fix: "expand to 4–10 behavioral phrases (e.g. a positive trait, a neutral trait, a negative trait, a speaking style)",
      docsAnchor: "personality",
    });
  }
}

function collectLocationOverlapRecs(world: World, context: ValidationContext): void {
  const locations = asDict(world.locations);
  if (Object.keys(locations).length === 0) return;
  const byRegion: Record<string, Array<[string, number, number, number]>> = {};
  for (const [locationName, location] of Object.entries(locations)) {
    if (!isObj(location)) continue;
    const x = location.x, y = location.y;
    const radius = (location.radius as number) || 0;
    if (typeof x !== "number" || typeof y !== "number") continue;
    const regionKey = (location.region ?? "") as string;
    (byRegion[regionKey] ??= []).push([locationName, x, y, radius]);
  }
  for (const regionLocs of Object.values(byRegion)) {
    for (let i = 0; i < regionLocs.length; i++) {
      const [nameA, xA, yA, rA] = regionLocs[i];
      for (let j = i + 1; j < regionLocs.length; j++) {
        const [nameB, xB, yB, rB] = regionLocs[j];
        const distance = Math.sqrt((xB - xA) ** 2 + (yB - yA) ** 2);
        const combined = rA + rB;
        if (distance < combined) {
          const overlap = (combined - distance).toFixed(1);
          addRecommendation(context, "locations." + nameA, {
            title: "location circle overlaps another",
            value: nameB + " (by " + overlap + " units)",
            detail: "overlapping location circles can confuse placement\nSafe to ignore if the overlap is intentional.",
            fix: "if unintentional, move one centre apart or shrink one radius until distance ≥ combined radii",
          });
        }
      }
    }
  }
}

export function collectAllRecommendations(world: World, context: ValidationContext): void {
  collectStartingItemsRecs(world, context);
  collectQuestActivationRecs(world, context);
  collectTriggerPatternRecs(world, context);
  collectRegionRecs(world, context);
  collectNpcQualityRecs(world, context);
  collectWorldGuidanceRecs(world, context);
  collectNameSimilarityRecs(world, context);
  collectQuestTypeRecs(world, context);
  collectVisualDescriptionRecs(world, context);
  collectFactionWorldLoreRecs(world, context);
  collectStartingZoneNpcRecs(world, context);
  collectQualityRecs(world, context);
  collectLocationOverlapRecs(world, context);
}
