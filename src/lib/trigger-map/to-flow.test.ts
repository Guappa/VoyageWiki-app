import { describe, it, expect } from "vitest";
import { toFlow } from "./to-flow";
import type { GraphModel } from "./types";

const model: GraphModel = {
  nodes: [
    { id: "trigger:a", kind: "trigger", key: "a", label: "a", position: { x: 5, y: 7 } },
    { id: "quest:q",   kind: "quest",   key: "q", label: "q", position: { x: 0, y: 0 } },
    { id: "storage-key:s", kind: "storage-key", key: "s", label: "s", position: { x: 1, y: 1 } },
  ],
  edges: [
    { id: "trigger:a->quest:q:quest-init", source: "trigger:a", target: "quest:q", relation: "quest-init", origin: "structured" },
    { id: "trigger:a->storage-key:s:script-storage", source: "trigger:a", target: "storage-key:s", relation: "script-storage", origin: "script" },
  ],
};

describe("toFlow", () => {
  it("maps nodes with per-kind class and preserves position/label", () => {
    const { flowNodes } = toFlow(model);
    const a = flowNodes.find((n) => n.id === "trigger:a")!;
    expect(a.class).toBe("tm-node tm-trigger");
    expect(a.position).toEqual({ x: 5, y: 7 });
    expect(a.data.label).toBe("a");
    // a non-trigger kind too, so a typo or new NodeKind in the class string is caught
    expect(flowNodes.find((n) => n.id === "storage-key:s")!.class).toBe("tm-node tm-storage-key");
  });

  it("marks script-origin edges as animated with the tm-edge-script class; structured edges are plain", () => {
    const { flowEdges } = toFlow(model);
    const structured = flowEdges.find((e) => e.id.endsWith("quest-init"))!;
    const script = flowEdges.find((e) => e.id.endsWith("script-storage"))!;
    expect(script.animated).toBe(true);
    expect(script.class).toBe("tm-edge-script");
    expect(structured.animated ?? false).toBe(false);
    expect(structured.class ?? "").toBe("");
    expect(structured.label).toBe("quest-init");
  });

  it("sets deletable:true for structured edges and deletable:false for script edges", () => {
    const { flowEdges } = toFlow(model);
    const structured = flowEdges.find((e) => e.id.endsWith("quest-init"))!;
    const script = flowEdges.find((e) => e.id.endsWith("script-storage"))!;
    expect(structured.deletable).toBe(true);
    expect(script.deletable).toBe(false);
  });

  it("carries relation and origin in edge.data for both edge kinds", () => {
    const { flowEdges } = toFlow(model);
    const structured = flowEdges.find((e) => e.id.endsWith("quest-init"))!;
    const script = flowEdges.find((e) => e.id.endsWith("script-storage"))!;
    expect(structured.data).toEqual({ relation: "quest-init", origin: "structured" });
    expect(script.data).toEqual({ relation: "script-storage", origin: "script" });
  });

  it("drops nodes of a hidden kind and their incident edges", () => {
    const { flowNodes, flowEdges } = toFlow(model, { hiddenKinds: new Set(["storage-key"]) });
    expect(flowNodes.find((n) => n.id === "storage-key:s")).toBeUndefined();
    // the script edge that targets the hidden node must also be dropped
    expect(flowEdges.find((e) => e.id.endsWith("script-storage"))).toBeUndefined();
    // unrelated nodes and edges survive
    expect(flowNodes.find((n) => n.id === "trigger:a")).toBeDefined();
    expect(flowEdges.find((e) => e.id.endsWith("quest-init"))).toBeDefined();
  });

  it("drops script-origin edges when hideScriptEdges is true", () => {
    const { flowEdges } = toFlow(model, { hideScriptEdges: true });
    expect(flowEdges.find((e) => e.id.endsWith("script-storage"))).toBeUndefined();
    expect(flowEdges.find((e) => e.id.endsWith("quest-init"))).toBeDefined();
  });

  it("adds tm-edge-active class to edges incident to the selected node", () => {
    const { flowEdges } = toFlow(model, { selectedId: "trigger:a" });
    // both edges have trigger:a as source, so both get the active class
    const structured = flowEdges.find((e) => e.id.endsWith("quest-init"))!;
    const script = flowEdges.find((e) => e.id.endsWith("script-storage"))!;
    expect(structured.class).toContain("tm-edge-active");
    expect(script.class).toContain("tm-edge-active");
    // script edge keeps its original class alongside the active class
    expect(script.class).toContain("tm-edge-script");
  });

  it("does not add tm-edge-active when the selected node is not incident to the edge", () => {
    const { flowEdges } = toFlow(model, { selectedId: "quest:q" });
    // The script edge isn't incident to quest:q, so it must not get the active class.
    const script = flowEdges.find((e) => e.id.endsWith("script-storage"))!;
    expect(script.class ?? "").not.toContain("tm-edge-active");
  });
});
