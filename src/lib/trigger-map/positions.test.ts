import { describe, it, expect } from "vitest";
import { seedPositions, resolvePosition } from "./positions";
import type { GraphModel } from "./types";

const laid: GraphModel = {
  nodes: [{ id: "trigger:a", kind: "trigger", key: "a", label: "a", position: { x: 10, y: 20 } }],
  edges: [],
};

describe("positions store", () => {
  it("seedPositions captures every laid-out node position", () => {
    const store = seedPositions(laid);
    expect(store.get("trigger:a")).toEqual({ x: 10, y: 20 });
  });
  it("resolvePosition returns the stored position when present", () => {
    const store = new Map([["trigger:a", { x: 5, y: 6 }]]);
    expect(resolvePosition(store, { id: "trigger:a", kind: "trigger", key: "a", label: "a", position: { x: 0, y: 0 } }, [])).toEqual({ x: 5, y: 6 });
  });
  it("resolvePosition places a new node near a connected node, else at origin-ish", () => {
    const store = new Map([["trigger:a", { x: 100, y: 100 }]]);
    const edges = [{ id: "e", source: "trigger:a", target: "quest:q", relation: "quest-init", origin: "structured" as const }];
    const pos = resolvePosition(store, { id: "quest:q", kind: "quest", key: "q", label: "q", position: { x: 0, y: 0 } }, edges);
    expect(pos.x).not.toBe(0); // offset from the connected trigger, not left at 0,0
  });
});
