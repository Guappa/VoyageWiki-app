import type { TriggerGraph } from "./trigger-graph";
import { triggerKeyFromId } from "./types";

export interface DependencyFlow {
  flowNodes: any[];
  flowEdges: any[];
}

export function toDependencyFlow(
  graph: TriggerGraph,
  positions: Map<string, { x: number; y: number }>,
  selectedId: string | null,
): DependencyFlow {
  const flowNodes = graph.triggerIds.map((id) => ({
    id,
    position: positions.get(id) ?? { x: 0, y: 0 },
    data: { label: triggerKeyFromId(id) },
    class: `tm-node tm-dep-${graph.roles.get(id) ?? "isolated"}`,
  }));

  const flowEdges = graph.edges.map((e) => {
    const isActive = selectedId != null && (e.source === selectedId || e.target === selectedId);
    const classes = [e.kind === "script" ? "tm-edge-script" : "", isActive ? "tm-edge-active" : ""]
      .filter(Boolean)
      .join(" ");
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      deletable: false,
      data: { relation: e.via, origin: "derived" },
      ...(classes ? { class: classes } : {}),
    };
  });

  return { flowNodes, flowEdges };
}
