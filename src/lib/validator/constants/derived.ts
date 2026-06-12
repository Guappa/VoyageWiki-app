import schemaData from "~/data/generated/schema.json";
import enumsData from "~/data/generated/enums.json";

type SchemaNode = Record<string, unknown>;

// Top-level config keys, read from the live schema's root intersection so a schema bump updates the allowlist with no hand-edit.
function topLevelKeys(node: unknown): Set<string> {
  const keys = new Set<string>();
  if (node && typeof node === "object") {
    const schemaNode = node as SchemaNode;
    if (schemaNode._type === "intersection") {
      for (const part of (schemaNode.parts as unknown[]) ?? []) for (const key of topLevelKeys(part)) keys.add(key);
    } else if (schemaNode._type === "required" || schemaNode._type === "partial") {
      for (const key of Object.keys((schemaNode.fields as object) ?? {})) keys.add(key);
    }
  }
  return keys;
}

// Finds the first union-of-string-literals named fieldName anywhere in the codec and returns its allowed values.
function schemaEnum(node: unknown, fieldName: string): Set<string> {
  let result: string[] | null = null;
  const walk = (current: unknown): void => {
    if (result) return;
    if (Array.isArray(current)) { for (const item of current) walk(item); return; }
    if (current && typeof current === "object") {
      for (const [key, value] of Object.entries(current as SchemaNode)) {
        if (key === fieldName && value && typeof value === "object" && (value as SchemaNode)._type === "union") {
          const values = (((value as SchemaNode).of as SchemaNode[]) ?? [])
            .filter((option) => option?._type === "literal")
            .map((option) => option.value);
          if (values.length && values.every((entry) => typeof entry === "string")) { result = values as string[]; return; }
        }
        walk(value);
      }
    }
  };
  walk(node);
  return new Set(result ?? []);
}

export const KNOWN_TOP_LEVEL = topLevelKeys(schemaData);
export const VALID_COMPLEXITY_TYPES = schemaEnum(schemaData, "complexityType");
export const VALID_DETAIL_TYPES     = schemaEnum(schemaData, "detailType");
export const VALID_NPC_TIERS        = schemaEnum(schemaData, "tier");

export const VALID_CONDITION_TYPES = new Set<string>(enumsData.conditionTypes);
export const VALID_FACTION_TYPES   = schemaEnum(schemaData, "factionType");
export const VALID_BONUS_TYPES     = new Set<string>(enumsData.bonusTypes);

// Per-condition-type operator vocabulary, rebuilt from the live trigger schema's oneOf branches.
export const CONDITION_OP_MAP: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(enumsData.conditionOperators as Record<string, string[]>).map(([type, ops]) => [type, new Set(ops)]),
);
// Fallback union of every condition operator, used when a type carries no explicit operator list.
export const ALL_CONDITION_OPS = new Set<string>(
  Object.values(enumsData.conditionOperators as Record<string, string[]>).flat(),
);
