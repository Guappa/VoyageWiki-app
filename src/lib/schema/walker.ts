type SchemaNode = Record<string, unknown>;

export function findFieldDefinition(
  schema: SchemaNode,
  section: string,
  path: string
): SchemaNode | null {
  const sectionNode = schema[section];
  if (!isObject(sectionNode)) return null;

  const fieldRoot = resolveSectionFieldRoot(sectionNode);
  if (!fieldRoot) return null;

  return walkPath(fieldRoot, path.split("."));
}

function walkPath(node: SchemaNode, segments: string[]): SchemaNode | null {
  if (segments.length === 0) return node;
  const [head, ...rest] = segments;
  const child = node[head];
  if (!isObject(child)) return null;
  if (rest.length === 0) return child;

  const childFieldRoot = resolveSectionFieldRoot(child);
  return walkPath(childFieldRoot ?? child, rest);
}

function resolveSectionFieldRoot(node: SchemaNode): SchemaNode | null {
  const items = node.items;
  if (isObject(items) && isObject(items.properties)) return items.properties;
  const properties = node.properties;
  if (isObject(properties)) return properties;
  return null;
}

function isObject(value: unknown): value is SchemaNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
