import { describe, it, expect } from "vitest";
import { findReferencingTriggers } from "./references";
import type { GraphModel } from "./types";

const model: GraphModel = {
  nodes: [],
  edges: [
    { id: "1", source: "trigger:start", target: "quest:Q", relation: "quest-init", origin: "structured" },
    { id: "2", source: "trigger:mon",   target: "quest:Q", relation: "gates",      origin: "script" },
    { id: "3", source: "trigger:start", target: "location:L", relation: "party-location", origin: "structured" },
  ],
};

describe("findReferencingTriggers", () => {
  it("returns triggers whose edges target the node, with relation and origin", () => {
    const refs = findReferencingTriggers(model, "quest:Q");
    expect(refs).toEqual([
      { trigger: "start", relation: "quest-init", origin: "structured", triggerNodeId: "trigger:start" },
      { trigger: "mon",   relation: "gates",      origin: "script",     triggerNodeId: "trigger:mon" },
    ]);
  });
  it("returns an empty array when nothing references the node", () => {
    expect(findReferencingTriggers(model, "quest:Unused")).toEqual([]);
  });
});
