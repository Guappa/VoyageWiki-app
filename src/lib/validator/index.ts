import schemaData from "~/data/generated/schema.json";
import { validateShape } from "./shape";
import * as S from "./semantic";
import { collectAllWarnings } from "./warnings";
import { collectAllRecommendations } from "./recommendations";
import { isObj } from "./helpers";
import type { Issue, ValidationContext, ValidationResult, World } from "./types";

export type { Issue, ValidationResult, Severity } from "./types";

export function validateWorld(parsedJson: unknown): ValidationResult {
  const context: ValidationContext = { errors: [], warnings: [], recommendations: [] };

  if (!isObj(parsedJson)) {
    context.errors.push({
      path: "$",
      severity: "error",
      title: "root must be an object, got " + typeof parsedJson,
      fix: "provide the world config as a JSON object",
    });
    return { errors: context.errors, warnings: [], recommendations: [] };
  }

  const world = parsedJson as World;

  validateShape(world, schemaData, context);

  S.checkKeyNameConsistency(world, context);
  S.checkAreaPaths(world, context);
  S.checkLocationFields(world, context);
  S.checkWorldLoreFields(world, context);
  S.checkNpcRefs(world, context);
  S.checkNpcTypes(world, context);
  S.checkLocationRefs(world, context);
  S.checkTriggerRefs(world, context);
  S.checkSkillRefs(world, context);
  S.checkTraitRefs(world, context);
  S.checkStoryStartRefs(world, context);
  S.checkPremadeCharacterRefs(world, context);
  S.checkVariableRefs(world, context);
  S.checkAttributeSettings(world, context);
  S.checkResourceSettings(world, context);
  S.checkResourceSettingsCollisions(world, context);
  S.checkNpcTypeFields(world, context);
  S.checkSkillFields(world, context);
  S.checkNpcLevelRangeShape(world, context);
  S.checkLocationCoordinates(world, context);
  S.checkSkillCoverage(world, context);
  S.checkNameFilterSettings(world, context);
  S.checkArchetypes(world, context);
  S.checkTopLevelKeys(world, context);
  S.checkGameModes(world, context);
  S.checkSizeLimits(world, context);

  collectAllWarnings(world, context);
  collectAllRecommendations(world, context);

  // Sort each list by path so output is stable and diff-friendly across runs.
  const byPath = (a: Issue, b: Issue) => a.path.localeCompare(b.path);
  return {
    errors: context.errors.slice().sort(byPath),
    warnings: context.warnings.slice().sort(byPath),
    recommendations: context.recommendations.slice().sort(byPath),
  };
}
