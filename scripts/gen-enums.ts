import { readSchemaFile, writeGenerated } from "./lib/source";

const SOURCE = "WorldConfigV33_json_schema.json";
const extracted = readSchemaFile(SOURCE);
if (!extracted) {
  console.log(`gen-enums: ${SOURCE} absent — skipping`);
  process.exit(0);
}

type Branch = { properties?: { type?: { enum?: string[]; const?: string }; operator?: { enum?: string[] } } };

function branchesOf(node: any): Branch[] {
  const items = node?.items ?? {};
  return items.oneOf ?? items.anyOf ?? [];
}

function typeOf(branch: Branch): string | null {
  const typeNode = branch.properties?.type;
  return typeNode?.const ?? typeNode?.enum?.[0] ?? null;
}

// Rebuilds the condition type list and per-type operator vocabulary from the trigger condition oneOf node.
function readConditionEnum(node: any) {
  const types: string[] = [];
  const operators: Record<string, string[]> = {};
  for (const branch of branchesOf(node)) {
    const name = typeOf(branch);
    if (!name) continue;
    types.push(name);
    const ops = branch.properties?.operator?.enum;
    if (ops?.length) operators[name] = ops;
  }
  return { types, operators };
}

const triggers = extracted.schema?.properties?.triggers?.additionalProperties?.properties ?? {};
const conditions = readConditionEnum(triggers.conditions);

// item bonus `type` shares the generic field name `type`, so it can't be looked up by name in the codec; read it by path here.
const bonusTypeNode = extracted.schema?.properties?.items?.additionalProperties?.properties?.bonuses?.items?.properties?.type ?? {};
const bonusTypes: string[] = bonusTypeNode.enum ?? (bonusTypeNode.const ? [bonusTypeNode.const] : []);

console.log(`gen-enums: ${conditions.types.length} condition types, ${bonusTypes.length} bonus types`);
writeGenerated("enums.json", {
  conditionTypes: conditions.types,
  conditionOperators: conditions.operators,
  bonusTypes,
});
