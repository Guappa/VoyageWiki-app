import dagre from "@dagrejs/dagre";
import type { GraphModel, GraphNode } from "./types";

// Dimensions match the default Svelte Flow node size so dagre spacing is accurate
const NODE_W = 180;
const NODE_H = 56;

export function layout(model: GraphModel): GraphModel {
  const dagreGraph = new dagre.graphlib.Graph();
  // marginx/marginy ensure no node lands at (0,0), keeping canvas edges clear
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 70, ranksep: 120, marginx: 40, marginy: 40 });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  for (const node of model.nodes) dagreGraph.setNode(node.id, { width: NODE_W, height: NODE_H });
  for (const edge of model.edges) dagreGraph.setEdge(edge.source, edge.target);

  dagre.layout(dagreGraph);

  // dagre centers each node; subtract half-dimensions to get the top-left origin Svelte Flow expects
  const nodes: GraphNode[] = model.nodes.map((node) => {
    const position = dagreGraph.node(node.id);
    return { ...node, position: { x: position.x - NODE_W / 2, y: position.y - NODE_H / 2 } };
  });

  return { nodes, edges: model.edges };
}
