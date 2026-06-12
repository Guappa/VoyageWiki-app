import { describe, it, expect } from "vitest";
import { addStructuredRef, removeStructuredRef, relationChoicesForKind, updateStructuredEntry, removeEntryAt, appendEntry, setRecurring, renameTrigger } from "./authoring";
import { parseWorld } from "./parse-world";
import { nodeId } from "./types";

interface TestTrigger { name: string; conditions: unknown[]; effects: unknown[]; script: string; recurring?: boolean }
const baseWorld = () => ({
  quests: { Q: { name: "Q" } },
  locations: { L: { name: "L" } },
  factions: { Guild: { name: "Guild" } },
  traits: { Brave: { name: "Brave" } },
  triggers: { t: { name: "t", conditions: [], effects: [], script: "" } as TestTrigger },
});

describe("relationChoicesForKind", () => {
  it("is unambiguous for quest/location/trait and multi for faction/storage", () => {
    expect(relationChoicesForKind("quest")).toEqual(["quest-init"]);
    expect(relationChoicesForKind("location")).toEqual(["party-location"]);
    expect(relationChoicesForKind("trait")).toEqual(["player-traits"]);
    expect(relationChoicesForKind("faction")).toEqual(["known-entity-effect", "known-entity-condition"]);
    expect(relationChoicesForKind("storage-key")).toEqual(["read-boolean", "read-number", "write-boolean", "write-number"]);
    expect(relationChoicesForKind("trigger")).toEqual([]);
  });
});

describe("addStructuredRef round-trips through parseWorld", () => {
  it("adds a quest-init effect that parseWorld then sees as an edge", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "quest-init", "Q");
    expect(w.triggers.t.effects).toEqual([{ type: "quest-init", value: "Q" }]);
    const edge = parseWorld(w).edges.find((e) => e.target === nodeId("quest", "Q"));
    expect(edge?.relation).toBe("quest-init");
    expect(edge?.origin).toBe("structured");
  });
  it("adds a player-traits condition that parseWorld then sees as an edge", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "player-traits", "Brave");
    expect(w.triggers.t.conditions).toEqual([{ type: "player-traits", operator: "contains", value: "Brave" }]);
    const edge = parseWorld(w).edges.find((e) => e.target === nodeId("trait", "Brave"));
    expect(edge?.relation).toBe("player-traits");
    expect(edge?.origin).toBe("structured");
  });
  it("adds a known-entity-effect entry (entity field) that parseWorld then sees as an edge", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "known-entity-effect", "Guild");
    expect(w.triggers.t.effects).toEqual([{ type: "known-entity", entity: "Guild", operator: "set", value: true }]);
    const edge = parseWorld(w).edges.find((e) => e.target === nodeId("faction", "Guild"));
    expect(edge?.relation).toBe("known-entity");
    expect(edge?.origin).toBe("structured");
  });
  it("adds a party-location condition", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "party-location", "L");
    expect(w.triggers.t.conditions).toEqual([{ type: "party-location", operator: "equals", value: "L" }]);
  });
  it("adds a write-boolean effect for a storage key", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "write-boolean", "flag");
    expect(w.triggers.t.effects).toEqual([{ type: "write-boolean", key: "flag", operator: "set", value: true }]);
  });
});

describe("removeStructuredRef", () => {
  it("removes a previously added effect so parseWorld no longer emits the edge", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "quest-init", "Q");
    removeStructuredRef(w, "t", "quest-init", "Q");
    expect(w.triggers.t.effects).toEqual([]);
    expect(parseWorld(w).edges.find((e) => e.target === nodeId("quest", "Q"))).toBeUndefined();
  });
  it("removes known-entity from both conditions and effects when both exist for the same key", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "known-entity-effect", "Guild");
    addStructuredRef(w, "t", "known-entity-condition", "Guild");
    removeStructuredRef(w, "t", "known-entity", "Guild");
    const hasKnownEntityEffect = (w.triggers.t.effects as unknown[]).some(
      (e) => (e as Record<string, unknown>).type === "known-entity",
    );
    const hasKnownEntityCondition = (w.triggers.t.conditions as unknown[]).some(
      (e) => (e as Record<string, unknown>).type === "known-entity",
    );
    expect(hasKnownEntityEffect).toBe(false);
    expect(hasKnownEntityCondition).toBe(false);
  });
  it("listOverride:conditions removes only the condition row and leaves the effect intact", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "known-entity-effect", "Guild");
    addStructuredRef(w, "t", "known-entity-condition", "Guild");
    removeStructuredRef(w, "t", "known-entity", "Guild", "conditions");
    const hasEffect = (w.triggers.t.effects as unknown[]).some(
      (e) => (e as Record<string, unknown>).type === "known-entity",
    );
    const hasCondition = (w.triggers.t.conditions as unknown[]).some(
      (e) => (e as Record<string, unknown>).type === "known-entity",
    );
    expect(hasEffect).toBe(true);
    expect(hasCondition).toBe(false);
  });
});

describe("updateStructuredEntry", () => {
  it("writes a single field on the entry at the given index", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "read-boolean", "flag");
    updateStructuredEntry(w, "t", "conditions", 0, "value", false);
    updateStructuredEntry(w, "t", "conditions", 0, "operator", "notEquals");
    expect(w.triggers.t.conditions).toEqual([{ type: "read-boolean", key: "flag", operator: "notEquals", value: false }]);
  });
  it("ignores an out-of-range index", () => {
    const w = baseWorld();
    addStructuredRef(w, "t", "read-boolean", "flag");
    updateStructuredEntry(w, "t", "conditions", 5, "value", false);
    expect((w.triggers.t.conditions[0] as Record<string, unknown>).value).toBe(true);
  });
});

describe("setRecurring", () => {
  it("toggles the trigger's recurring flag", () => {
    const w = baseWorld();
    setRecurring(w, "t", true);
    expect(w.triggers.t.recurring).toBe(true);
    setRecurring(w, "t", false);
    expect(w.triggers.t.recurring).toBe(false);
  });
});

describe("appendEntry", () => {
  it("appends an arbitrary entry to the chosen list", () => {
    const w = baseWorld();
    appendEntry(w, "t", "effects", { type: "story", instruction: "x" });
    expect(w.triggers.t.effects).toEqual([{ type: "story", instruction: "x" }]);
  });
});

describe("removeEntryAt", () => {
  it("removes any entry by index, including non-connectable types", () => {
    const w = baseWorld();
    w.triggers.t.conditions = [{ type: "game-tick", operator: "greaterThan", value: 0 }, { type: "story", query: "q" }] as any;
    removeEntryAt(w, "t", "conditions", 0);
    expect(w.triggers.t.conditions).toEqual([{ type: "story", query: "q" }]);
  });
});

describe("renameTrigger", () => {
  it("moves the key, updates the name field, and rewrites script references", () => {
    const w = {
      triggers: {
        a: { name: "a", conditions: [], effects: [], script: "delete triggers['a'];" },
        b: { name: "b", conditions: [], effects: [], script: "if (check(triggers[ \"a\" ])) {}" },
      },
    };
    expect(renameTrigger(w, "a", "a2")).toBe(true);
    expect(Object.keys(w.triggers)).toEqual(["a2", "b"]);
    expect((w.triggers as any).a2.name).toBe("a2");
    expect((w.triggers as any).a2.script).toBe("delete triggers['a2'];");
    expect((w.triggers as any).b.script).toBe("if (check(triggers[ \"a2\" ])) {}");
  });
  it("refuses empty, unchanged, or colliding names", () => {
    const w = { triggers: { a: { name: "a", script: "" }, b: { name: "b", script: "" } } };
    expect(renameTrigger(w, "a", "")).toBe(false);
    expect(renameTrigger(w, "a", "a")).toBe(false);
    expect(renameTrigger(w, "a", "b")).toBe(false);
    expect(Object.keys(w.triggers)).toEqual(["a", "b"]);
  });
});
