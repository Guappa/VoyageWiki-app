import type { GraphModel, GraphNode, GraphEdge, NodeKind, EdgeOrigin } from "./types";
import { nodeId } from "./types";
import { asDict, asArray } from "../validator/helpers";

const STORAGE_RE = /storage(?:\.([A-Za-z_$][\w$]*)|\[\s*['"]([^'"]+)['"]\s*\])/g;

const TRIGGER_RE = /triggers\[\s*['"]([^'"]+)['"]\s*\]/g;

interface RefSpec {
  types: string[];
  field: "value" | "key" | "entity" | "questId";
  kind: NodeKind | ((key: string) => NodeKind);
  relation: string;
}

export function parseWorld(world: unknown): GraphModel {
  const worldDict = asDict(world);
  const factions = asDict(worldDict.factions);
  const npcs = asDict(worldDict.npcs);
  const locations = asDict(worldDict.locations);

  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const addNode = (kind: NodeKind, key: string): string => {
    const id = nodeId(kind, key);
    if (!nodes.has(id)) nodes.set(id, { id, kind, key, label: key, position: { x: 0, y: 0 } });
    return id;
  };

  // structured edges run first so a duplicate id always keeps the structured one
  const addEdge = (source: string, target: string, relation: string, origin: EdgeOrigin = "structured"): void => {
    const id = `${source}->${target}:${relation}`;
    if (!edges.has(id)) edges.set(id, { id, source, target, relation, origin });
  };

  // known-entity names span npc/faction/location; unknown keys fall back to faction so refs are never dropped
  const resolveEntityKind = (key: string): NodeKind =>
    key in factions ? "faction" : key in npcs ? "npc" : key in locations ? "location" : "faction";

  const CONDITION_SPECS: RefSpec[] = [
    { types: ["party-location"],            field: "value", kind: "location",           relation: "party-location" },
    { types: ["player-traits"],             field: "value", kind: "trait",              relation: "player-traits"  },
    { types: ["quests-completed"],          field: "value", kind: "quest",              relation: "quests-completed" },
    { types: ["read-boolean", "read-number", "read-string", "read-array"], field: "key", kind: "storage-key", relation: "reads" },
    { types: ["known-entity"],              field: "entity", kind: resolveEntityKind,    relation: "known-entity"   },
  ];

  const EFFECT_SPECS: RefSpec[] = [
    { types: ["quest-init"],                field: "value",   kind: "quest",            relation: "quest-init"     },
    { types: ["quest-progress"],            field: "questId", kind: "quest",            relation: "quest-progress" },
    { types: ["known-entity"],              field: "entity", kind: resolveEntityKind,    relation: "known-entity"   },
    { types: ["write-boolean", "write-number", "write-string", "write-array"], field: "key", kind: "storage-key", relation: "writes" },
  ];

  const addStructuredEdges = (triggerId: string, items: unknown[], specs: RefSpec[]): void => {
    for (const itemRaw of items) {
      const item = asDict(itemRaw);
      const itemType = typeof item.type === "string" ? item.type : "";
      const spec = specs.find((s) => s.types.includes(itemType));
      if (!spec) continue;
      const refKey = typeof item[spec.field] === "string" ? (item[spec.field] as string) : null;
      if (!refKey) continue;
      const kind = typeof spec.kind === "function" ? spec.kind(refKey) : spec.kind;
      addEdge(triggerId, addNode(kind, refKey), spec.relation);
    }
  };

  for (const [triggerName, triggerRaw] of Object.entries(asDict(worldDict.triggers))) {
    const trigger = asDict(triggerRaw);
    const triggerId = addNode("trigger", triggerName);

    addStructuredEdges(triggerId, asArray(trigger.conditions), CONDITION_SPECS);
    addStructuredEdges(triggerId, asArray(trigger.effects), EFFECT_SPECS);

    const script = typeof trigger.script === "string" ? trigger.script : "";

    // Reset lastIndex before each exec loop (regexes are reused across triggers)
    STORAGE_RE.lastIndex = 0;
    for (let match: RegExpExecArray | null; (match = STORAGE_RE.exec(script)); ) {
      const key = match[1] ?? match[2];
      if (key) addEdge(triggerId, addNode("storage-key", key), "script-storage", "script");
    }

    TRIGGER_RE.lastIndex = 0;
    for (let match: RegExpExecArray | null; (match = TRIGGER_RE.exec(script)); ) {
      // skip self-references; a trigger gating itself is not a meaningful graph edge
      if (match[1] && match[1] !== triggerName) addEdge(triggerId, addNode("trigger", match[1]), "gates", "script");
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
