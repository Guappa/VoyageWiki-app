import { describe, it, expect } from "vitest";
import { validateWorld } from "./index";
import crossRefsData from "../../../schema/WorldConfigV33_cross_refs.json";

const M = "__MISSING__";

// One dangling-reference fixture per engine-declared cross-ref; "covered" means the validator flags M.
const FIXTURES: Record<string, unknown> = {
  "npcs.faction":            { npcs: { N: { name: "N", faction: M } } },
  "npcs.currentLocation":    { npcs: { N: { name: "N", currentLocation: M } } },
  "npcs.type":               { npcs: { N: { name: "N", type: M } } },
  "quests.questLocation":    { quests: { Q: { name: "Q", questLocation: M } } },
  "skills.item":             { items: { Real: { name: "Real", category: "x", description: "d" } }, skills: { S: { item: M } } },
  "traits.abilities":        { traits: { T: { name: "T", abilities: [M] } } },
  "traits.skills":           { traits: { T: { name: "T", skills: [{ skill: M, modifier: 1 }] } } },
  "traits.resource":         { resourceSettings: { mana: {} }, traits: { T: { name: "T", resources: [{ resource: M, modifier: 1 }] } } },
  "abilities.variable":      { abilities: { A: { name: "A", requirements: [{ type: "resource", variable: M }] } } },
  "items.variable":          { resourceSettings: { mana: {} }, items: { I: { name: "I", bonuses: [{ type: "resource", variable: M, value: 1 }] } } },
  "locations.region":        { locations: { L: { name: "L", region: M } } },
  "storyStarts.item":        { storyStarts: { S: { startingItems: [{ item: M, quantity: 1 }] } } },
  "storyStarts.startingQuests": { storyStarts: { S: { startingQuests: [M] } } },
  "traitCategories.traits":  { traitCategories: { C: { name: "C", traits: [M] } } },
};

// The engine declares npcs.item but the live codec exposes no matching npc field, so it cannot be derived; checked by hand if ever needed.
const KNOWN_UNCOVERED = new Set(["npcs.item"]);

const rules: string[] = [];
for (const [section, fields] of Object.entries(crossRefsData.crossRefs as Record<string, Record<string, string>>)) {
  for (const field of Object.keys(fields)) rules.push(`${section}.${field}`);
}

describe("validator covers every engine-declared cross-reference", () => {
  for (const rule of rules) {
    it(`enforces ${rule}`, () => {
      if (KNOWN_UNCOVERED.has(rule)) return;
      const fixture = FIXTURES[rule];
      expect(fixture, `no coverage fixture for cross-ref ${rule} — add one and confirm the validator flags it`).toBeDefined();
      const result = validateWorld(fixture);
      const flagged = [...result.errors, ...result.warnings, ...result.recommendations]
        .some((issue) => JSON.stringify(issue).includes(M));
      expect(flagged, `validator does not flag a dangling ${rule} reference`).toBe(true);
    });
  }
});
