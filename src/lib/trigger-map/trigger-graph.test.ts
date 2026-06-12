import { describe, it, expect } from "vitest";
import { buildTriggerGraph } from "./trigger-graph";
import { parseWorld } from "./parse-world";
import { nodeId } from "./types";

describe("buildTriggerGraph dependency edges", () => {
  it("links a flag writer to its reader", () => {
    const world = {
      triggers: {
        a: { name: "a", conditions: [], effects: [{ type: "write-boolean", key: "flag", operator: "set", value: true }], script: "" },
        b: { name: "b", conditions: [{ type: "read-boolean", key: "flag", operator: "equals", value: true }], effects: [], script: "" },
      },
    };
    const g = buildTriggerGraph(parseWorld(world), world);
    const dep = g.edges.find((e) => e.source === nodeId("trigger", "a") && e.target === nodeId("trigger", "b"));
    expect(dep?.kind).toBe("flag");
    expect(dep?.via).toBe("flag: flag");
  });

  it("links a quest-init to a quests-completed gate", () => {
    const world = {
      quests: { "The Mole": { name: "The Mole" } },
      triggers: {
        starter: { name: "starter", conditions: [], effects: [{ type: "quest-init", operator: "set", value: "The Mole" }], script: "" },
        next: { name: "next", conditions: [{ type: "quests-completed", operator: "contains", value: "The Mole" }], effects: [], script: "" },
      },
    };
    const g = buildTriggerGraph(parseWorld(world), world);
    const dep = g.edges.find((e) => e.source === nodeId("trigger", "starter") && e.target === nodeId("trigger", "next"));
    expect(dep?.kind).toBe("quest");
  });

  it("does not create a self-dependency when one trigger both writes and reads a key", () => {
    const world = {
      triggers: {
        loop: {
          name: "loop",
          recurring: true,
          conditions: [{ type: "read-number", key: "n", operator: "lessThan", value: 3 }],
          effects: [{ type: "write-number", key: "n", operator: "add", value: 1 }],
          script: "",
        },
      },
    };
    const g = buildTriggerGraph(parseWorld(world), world);
    expect(g.edges.filter((e) => e.source === e.target)).toEqual([]);
  });
});

describe("buildTriggerGraph role classification", () => {
  const role = (world: any, key: string) =>
    buildTriggerGraph(parseWorld(world), world).roles.get(nodeId("trigger", key));

  it("flags a tick-gated trigger as entry", () => {
    const world = { triggers: { init: { name: "init", conditions: [{ type: "game-tick", operator: "equals", value: 1 }], effects: [], script: "" } } };
    expect(role(world, "init")).toBe("entry");
  });

  it("flags a recurring read+write of the same key as accumulator", () => {
    const world = {
      triggers: {
        c: { name: "c", recurring: true, conditions: [{ type: "read-number", key: "n", operator: "lessThan", value: 5 }], effects: [{ type: "write-number", key: "n", operator: "add", value: 1 }], script: "" },
      },
    };
    expect(role(world, "c")).toBe("accumulator");
  });

  it("classifies a writer as entry and its reader as terminal", () => {
    const world = {
      triggers: {
        a: { name: "a", conditions: [], effects: [{ type: "write-boolean", key: "f", operator: "set", value: true }], script: "" },
        b: { name: "b", conditions: [{ type: "read-boolean", key: "f", operator: "equals", value: true }], effects: [], script: "" },
      },
    };
    expect(role(world, "a")).toBe("entry");
    expect(role(world, "b")).toBe("terminal");
  });

  it("marks a trigger with no dependencies as isolated", () => {
    const world = { triggers: { lonely: { name: "lonely", conditions: [{ type: "story", query: "x" }], effects: [{ type: "story", instruction: "y" }], script: "" } } };
    expect(role(world, "lonely")).toBe("isolated");
  });
});
