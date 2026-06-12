import { describe, it, expect } from "vitest";
import { entryFieldSpec, entryTypesFor, buildDefaultEntry } from "./entry-fields";

describe("entryFieldSpec", () => {
  it("treats read-boolean as a keyed boolean with equality operators", () => {
    const spec = entryFieldSpec("conditions", "read-boolean");
    expect(spec?.keyField).toEqual({ field: "key", control: "text" });
    expect(spec?.value).toEqual({ control: "bool" });
    expect(spec?.operators).toEqual(["equals", "notEquals"]);
  });

  it("covers the array, resource, and quest-progress types from the wiki reference", () => {
    expect(entryFieldSpec("effects", "write-array")?.operators).toEqual(["set", "add", "remove", "clear"]);
    expect(entryFieldSpec("effects", "write-array")?.value).toEqual({ control: "json" });
    expect(entryFieldSpec("conditions", "player-resource")?.keyField).toEqual({ field: "resource", control: "text" });
    expect(entryFieldSpec("effects", "quest-progress")?.keyField).toEqual({ field: "questId", control: "ref", node: "quest" });
    expect(entryFieldSpec("conditions", "story-text")?.value).toEqual({ control: "text" });
  });

  it("treats a value that points at a node as a ref of that kind", () => {
    expect(entryFieldSpec("effects", "quest-init")?.value).toEqual({ control: "ref", node: "quest" });
    expect(entryFieldSpec("conditions", "party-location")?.value).toEqual({ control: "ref", node: "location" });
  });

  it("gives the same type direction-specific operators", () => {
    expect(entryFieldSpec("conditions", "player-traits")?.operators).toEqual(["contains", "notContains"]);
    expect(entryFieldSpec("effects", "player-traits")?.operators).toEqual(["add", "remove", "set"]);
  });

  it("marks story/action as operator-less prose fields", () => {
    expect(entryFieldSpec("conditions", "story")).toMatchObject({ operators: null, prose: "query" });
    expect(entryFieldSpec("effects", "story")).toMatchObject({ operators: null, prose: "instruction" });
  });

  it("models known-entity with an entity field and boolean value (matching the wiki)", () => {
    const spec = entryFieldSpec("effects", "known-entity");
    expect(spec?.keyField).toEqual({ field: "entity", control: "combo", nodes: ["npc", "faction", "location"] });
    expect(spec?.value).toEqual({ control: "bool" });
    expect(spec?.operators).toEqual(["set", "toggle"]);
  });

  it("returns null for an unknown type so the editor can fall back to heuristics", () => {
    expect(entryFieldSpec("conditions", "totally-made-up")).toBeNull();
  });
});

describe("entryTypesFor / buildDefaultEntry", () => {
  it("lists effect types and excludes condition-only ones", () => {
    const effects = entryTypesFor("effects");
    expect(effects).toContain("story");
    expect(effects).toContain("quest-progress");
    expect(effects).not.toContain("game-tick");
  });

  it("seeds a default entry with the first operator and a typed value", () => {
    expect(buildDefaultEntry("conditions", "game-tick")).toEqual({ type: "game-tick", operator: "equals", value: 0 });
    expect(buildDefaultEntry("effects", "write-boolean")).toEqual({ type: "write-boolean", key: "", operator: "set", value: true });
    expect(buildDefaultEntry("conditions", "story")).toEqual({ type: "story", query: "" });
    expect(buildDefaultEntry("effects", "quest-progress")).toEqual({ type: "quest-progress", questId: "" });
  });
});
