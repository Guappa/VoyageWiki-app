import schemaData from "~/data/generated/schema.json";

export interface SchemaNode {
  _type?: string;
  fields?: Record<string, unknown>;
  parts?: unknown[];
  domain?: unknown;
  codomain?: unknown;
  of?: unknown[];
  value?: unknown;
  element?: unknown;
}

function isObj(value: unknown): value is SchemaNode {
  return typeof value === "object" && value !== null;
}

export interface TopLevelEntry {
  schema: unknown;
  required: boolean;
}

export const SCHEMA_TOP_LEVEL: Record<string, TopLevelEntry> = (() => {
  const root = schemaData as SchemaNode;
  const out: Record<string, TopLevelEntry> = {};
  if (!isObj(root)) return out;
  if (root._type === "intersection" && Array.isArray(root.parts)) {
    for (const part of root.parts) {
      if (!isObj(part) || !isObj(part.fields ?? {})) continue;
      const fields = (part.fields ?? {}) as Record<string, unknown>;
      const required = part._type === "required";
      for (const [k, v] of Object.entries(fields)) {
        out[k] = { schema: v, required };
      }
    }
    return out;
  }
  const directFields = (root.fields ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(directFields)) {
    out[k] = { schema: v, required: root._type === "required" };
  }
  return out;
})();

export const SCHEMA_FIELDS: Record<string, unknown> = Object.fromEntries(
  Object.entries(SCHEMA_TOP_LEVEL).map(([k, v]) => [k, v.schema])
);
