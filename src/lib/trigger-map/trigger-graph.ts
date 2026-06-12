import type { GraphModel } from "./types";
import { triggerKeyFromId } from "./types";
import { asDict, asArray } from "../validator/helpers";

export type TriggerRole = "entry" | "link" | "terminal" | "accumulator" | "recurring" | "isolated";

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  via: string;
  kind: "flag" | "quest" | "script";
}

export interface TriggerGraph {
  triggerIds: string[];
  edges: DependencyEdge[];
  roles: Map<string, TriggerRole>;
}

// A dependency exists wherever one trigger reads what another produced, via the shared key or quest.
export function buildTriggerGraph(model: GraphModel, world: unknown): TriggerGraph {
  const triggerIds = model.nodes.filter((n) => n.kind === "trigger").map((n) => n.id);

  const writers = new Map<string, string[]>();
  const readers = new Map<string, string[]>();
  const questInit = new Map<string, string[]>();
  const questGate = new Map<string, string[]>();
  const push = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };

  const edges: DependencyEdge[] = [];
  const seen = new Set<string>();
  const addEdge = (source: string, target: string, via: string, kind: DependencyEdge["kind"]) => {
    if (source === target) return;
    const id = `${source}->${target}:${via}`;
    if (seen.has(id)) return;
    seen.add(id);
    edges.push({ id, source, target, via, kind });
  };

  for (const e of model.edges) {
    if (e.relation === "writes") push(writers, e.target, e.source);
    else if (e.relation === "reads") push(readers, e.target, e.source);
    else if (e.relation === "quest-init") push(questInit, e.target, e.source);
    else if (e.relation === "quests-completed") push(questGate, e.target, e.source);
    else if (e.relation === "gates") addEdge(e.source, e.target, "script", "script");
  }

  for (const [keyId, ws] of writers) {
    const rs = readers.get(keyId) ?? [];
    const label = `flag: ${keyId.slice("storage-key:".length)}`;
    for (const w of ws) for (const r of rs) addEdge(w, r, label, "flag");
  }
  for (const [questIdKey, inits] of questInit) {
    const gates = questGate.get(questIdKey) ?? [];
    const label = `quest: ${questIdKey.slice("quest:".length)}`;
    for (const i of inits) for (const g of gates) addEdge(i, g, label, "quest");
  }

  const roles = classifyRoles(triggerIds, edges, world);
  return { triggerIds, edges, roles };
}

function classifyRoles(triggerIds: string[], edges: DependencyEdge[], world: unknown): Map<string, TriggerRole> {
  const inDeg = new Map<string, number>();
  const outDeg = new Map<string, number>();
  for (const id of triggerIds) { inDeg.set(id, 0); outDeg.set(id, 0); }
  for (const e of edges) {
    outDeg.set(e.source, (outDeg.get(e.source) ?? 0) + 1);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  }

  const triggers = asDict(asDict(world).triggers);
  const roles = new Map<string, TriggerRole>();

  for (const id of triggerIds) {
    const trigger = asDict(triggers[triggerKeyFromId(id)]);
    const recurring = trigger.recurring === true;
    const inbound = inDeg.get(id) ?? 0;
    const outbound = outDeg.get(id) ?? 0;

    if (recurring && incrementsOwnCounter(trigger)) roles.set(id, "accumulator");
    else if (recurring) roles.set(id, "recurring");
    else if (firesAtStart(trigger)) roles.set(id, "entry");
    else if (inbound === 0 && outbound === 0) roles.set(id, "isolated");
    else if (inbound === 0) roles.set(id, "entry");
    else if (outbound === 0) roles.set(id, "terminal");
    else roles.set(id, "link");
  }
  return roles;
}

// A counter loop reads and writes the same storage key, so detect that overlap on the trigger itself.
function incrementsOwnCounter(trigger: Record<string, unknown>): boolean {
  const readKeys = new Set<string>();
  for (const c of asArray(trigger.conditions)) {
    const item = asDict(c);
    if (typeof item.key === "string") readKeys.add(item.key);
  }
  for (const e of asArray(trigger.effects)) {
    const item = asDict(e);
    if (typeof item.key === "string" && readKeys.has(item.key)) return true;
  }
  return false;
}

function firesAtStart(trigger: Record<string, unknown>): boolean {
  for (const c of asArray(trigger.conditions)) {
    const item = asDict(c);
    if (item.type !== "game-tick") continue;
    const op = item.operator;
    const value = typeof item.value === "number" ? item.value : NaN;
    if ((op === "equals" && value <= 1) || (op === "lessThanOrEqual" && value <= 1)) return true;
  }
  return false;
}
