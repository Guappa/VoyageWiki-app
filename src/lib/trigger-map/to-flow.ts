import type { GraphModel, NodeKind } from "./types";

export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  class: string;
}

// data carries relation + origin so delete/reconnect handlers never need to re-query the model
export interface FlowEdgeData {
  relation: string;
  origin: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  deletable: boolean;
  data: FlowEdgeData;
  animated?: boolean;
  class?: string;
  labelStyle?: string;
}

// Edge labels live in a separate DOM layer, beyond the reach of edge-scoped CSS.
const ACTIVE_LABEL_STYLE = "border: 1px solid var(--color-accent); border-radius: 4px; background: var(--color-bg); color: var(--color-accent); padding: 0 4px;";

export interface FlowGraph {
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
}

export interface ToFlowOpts {
  hiddenKinds?: Set<NodeKind>;
  hideScriptEdges?: boolean;
  selectedId?: string | null;
}

export function toFlow(model: GraphModel, opts: ToFlowOpts = {}): FlowGraph {
  const { hiddenKinds, hideScriptEdges, selectedId } = opts;

  const visibleNodes = hiddenKinds?.size
    ? model.nodes.filter((n) => !hiddenKinds.has(n.kind))
    : model.nodes;

  const visibleIds = new Set(visibleNodes.map((n) => n.id));

  const flowNodes: FlowNode[] = visibleNodes.map((n) => ({
    id: n.id,
    position: n.position,
    data: { label: n.label },
    class: `tm-node tm-${n.kind}`,
  }));

  const flowEdges: FlowEdge[] = [];
  for (const e of model.edges) {
    if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) continue;

    const isScript = e.origin === "script";
    if (isScript && hideScriptEdges) continue;

    const isActive = selectedId != null && (e.source === selectedId || e.target === selectedId);

    let edgeClass: string | undefined;
    if (isScript && isActive) edgeClass = "tm-edge-script tm-edge-active";
    else if (isScript) edgeClass = "tm-edge-script";
    else if (isActive) edgeClass = "tm-edge-active";

    flowEdges.push({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.relation,
      // only structured edges can be deleted; script edges are read-only graph annotations
      deletable: e.origin === "structured",
      data: { relation: e.relation, origin: e.origin },
      // animated dashes + class needed because Svelte Flow wraps the path in a div the CSS targets
      ...(isScript ? { animated: true } : {}),
      ...(edgeClass !== undefined ? { class: edgeClass } : {}),
      ...(isActive ? { labelStyle: ACTIVE_LABEL_STYLE } : {}),
    });
  }

  return { flowNodes, flowEdges };
}
