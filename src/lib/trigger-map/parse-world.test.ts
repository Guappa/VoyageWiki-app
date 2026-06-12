import { describe, it, expect } from "vitest";
import { parseWorld } from "./parse-world";
import { nodeId } from "./types";

const world = {
  quests: { "Find the Key": { name: "Find the Key" } },
  locations: { "E-Rantel": { name: "E-Rantel" } },
  factions: { "Adventurers Guild": { name: "Adventurers Guild" } },
  npcs: { "Ainz": { name: "Ainz" } },
  traits: { "Ainz's Regalia": { name: "Ainz's Regalia" } },
  triggers: {
    start: {
      name: "start",
      recurring: false,
      conditions: [
        { type: "party-location", operator: "equals", value: "E-Rantel" },
        { type: "player-traits", operator: "contains", value: "Ainz's Regalia" },
        { type: "read-boolean", key: "intro_done", operator: "equals", value: true },
      ],
      effects: [
        { type: "quest-init", value: "Find the Key" },
        { type: "known-entity", entity: "Adventurers Guild", operator: "set", value: true },
        { type: "write-boolean", key: "intro_done", operator: "set", value: true },
      ],
      script: "",
    },
  },
};

describe("parseWorld structured edges", () => {
  it("creates a trigger node and one edge per structured reference", () => {
    const g = parseWorld(world);
    const ids = new Set(g.nodes.map((n) => n.id));
    expect(ids.has(nodeId("trigger", "start"))).toBe(true);
    expect(ids.has(nodeId("quest", "Find the Key"))).toBe(true);
    expect(ids.has(nodeId("location", "E-Rantel"))).toBe(true);
    expect(ids.has(nodeId("faction", "Adventurers Guild"))).toBe(true);
    expect(ids.has(nodeId("trait", "Ainz's Regalia"))).toBe(true);
    expect(ids.has(nodeId("storage-key", "intro_done"))).toBe(true);

    const rels = g.edges.filter((e) => e.origin === "structured").map((e) => e.relation).sort();
    expect(rels).toEqual(["known-entity", "party-location", "player-traits", "quest-init", "reads", "writes"]);
  });

  it("does not duplicate a storage-key node referenced by both read and write", () => {
    const g = parseWorld(world);
    expect(g.nodes.filter((n) => n.kind === "storage-key").length).toBe(1);
  });
});

describe("parseWorld connects string/array storage and quests-completed", () => {
  it("draws edges for read-string, write-array, and quests-completed", () => {
    const w = {
      quests: { "The Mole": { name: "The Mole" } },
      triggers: {
        t: {
          name: "t",
          conditions: [
            { type: "read-string", key: "phase", operator: "equals", value: "x" },
            { type: "quests-completed", operator: "contains", value: "The Mole" },
          ],
          effects: [{ type: "write-array", key: "log", operator: "add", value: "y" }],
          script: "",
        },
      },
    };
    const g = parseWorld(w);
    const triggerId = nodeId("trigger", "t");
    const rels = g.edges.filter((e) => e.source === triggerId).map((e) => `${e.relation}->${e.target}`);
    expect(rels).toContain(`reads->${nodeId("storage-key", "phase")}`);
    expect(rels).toContain(`writes->${nodeId("storage-key", "log")}`);
    expect(rels).toContain(`quests-completed->${nodeId("quest", "The Mole")}`);
  });
});

describe("parseWorld known-entity condition", () => {
  it("produces a structured edge when known-entity appears in conditions", () => {
    const w = {
      factions: { "Dark Young": { name: "Dark Young" } },
      npcs: { "Renner": { name: "Renner" } },
      triggers: {
        entity_check: {
          name: "entity_check",
          conditions: [
            { type: "known-entity", operator: "equals", entity: "Dark Young", value: true },
            { type: "known-entity", operator: "equals", entity: "Renner", value: true },
          ],
          effects: [],
          script: "",
        },
      },
    };
    const g = parseWorld(w);
    const triggerId = nodeId("trigger", "entity_check");

    const condEdges = g.edges.filter(
      (e) => e.source === triggerId && e.relation === "known-entity" && e.origin === "structured",
    );
    expect(condEdges.length).toBe(2);
    expect(condEdges.map((e) => e.target).sort()).toEqual(
      [nodeId("faction", "Dark Young"), nodeId("npc", "Renner")].sort(),
    );
  });
});

describe("parseWorld script edges", () => {
  it("extracts storage and trigger references from script text as script-origin edges", () => {
    const w = {
      triggers: {
        mon: {
          name: "mon",
          conditions: [],
          effects: [],
          script: "storage.standing_a = 0; if (storage['flag']) { delete triggers['start']; }",
        },
        start: { name: "start", conditions: [], effects: [], script: "" },
      },
    };
    const g = parseWorld(w);
    const monId = nodeId("trigger", "mon");
    const scriptEdges = g.edges.filter((e) => e.origin === "script" && e.source === monId);
    const targets = scriptEdges.map((e) => e.target).sort();
    expect(targets).toEqual(
      [nodeId("storage-key", "flag"), nodeId("storage-key", "standing_a"), nodeId("trigger", "start")].sort(),
    );
  });
});

describe("parseWorld structured-wins-over-script invariant", () => {
  it("keeps the structured edge when the same storage key appears in both a write-boolean effect and the script", () => {
    // "writes" and "script-storage" are different relations so both edges coexist, but structured must win the id race
    const w = {
      triggers: {
        gate: {
          name: "gate",
          conditions: [],
          effects: [{ type: "write-boolean", key: "flag", operator: "set", value: true }],
          script: "storage.flag = true;",
        },
      },
    };
    const g = parseWorld(w);
    const triggerId = nodeId("trigger", "gate");
    const storageId = nodeId("storage-key", "flag");

    const structuredEdge = g.edges.find(
      (e) => e.source === triggerId && e.target === storageId && e.origin === "structured",
    );
    expect(structuredEdge).toBeDefined();
    expect(structuredEdge!.relation).toBe("writes");

    const writesEdges = g.edges.filter(
      (e) => e.source === triggerId && e.target === storageId && e.relation === "writes",
    );
    expect(writesEdges.length).toBe(1);
  });
});

describe("parseWorld unknown known-entity fallback", () => {
  it("renders an unknown known-entity value as a faction node so the edge is never dropped", () => {
    const w = {
      factions: {},
      npcs: {},
      triggers: {
        haunted: {
          name: "haunted",
          conditions: [{ type: "known-entity", operator: "equals", entity: "Ghost", value: true }],
          effects: [],
          script: "",
        },
      },
    };
    const g = parseWorld(w);
    const triggerId = nodeId("trigger", "haunted");
    const fallbackId = nodeId("faction", "Ghost");

    expect(g.nodes.some((n) => n.id === fallbackId)).toBe(true);
    const edge = g.edges.find(
      (e) => e.source === triggerId && e.target === fallbackId && e.relation === "known-entity" && e.origin === "structured",
    );
    expect(edge).toBeDefined();
  });
});
