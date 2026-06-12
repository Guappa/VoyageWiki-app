import {
  KEY_NAME_SECTIONS, KNOWN_TOP_LEVEL, VALID_COMPLEXITY_TYPES, VALID_DETAIL_TYPES, HIGH_COMBAT_TIERS,
} from "../constants";
import {
  addError, addWarning, addRecommendation, asArray, asDict, isObj, quotedList, typeName,
} from "../helpers";
import type { ValidationContext, World } from "../types";

export function checkKeyNameConsistency(world: World, context: ValidationContext): void {
  for (const section of KEY_NAME_SECTIONS) {
    const dict = asDict(world[section]);
    for (const [key, value] of Object.entries(dict)) {
      if (!isObj(value)) continue;
      if (!("name" in value)) {
        if (section === "triggers") {
          addError(context, section + "." + key + ".name",
            'missing required name field — fix: add "name": "<same as outer key>" inside the trigger object so engine can identify it (snake_case, matching the map key exactly)');
        } else if (section === "items") {
          addError(context, section + "." + key + ".name",
            'missing required name field — fix: add "name": "<same as outer key>" inside the item object (the outer key and the inner name field must be byte-identical)');
        }
      } else if (value.name !== key) {
        addError(context, section + "." + key + ".name",
          "outer key `" + key + "` does not match inner `name` `" + String(value.name) + "` — fix: rename the outer key to the display name so the two are byte-identical");
      }
      if (section === "items" && !value.category) {
        addError(context, "items." + key + ".category",
          'missing required category field — fix: set "category" to one of the strings listed in itemSettings.itemCategories (Weapon, Armor, Consumable, etc.)');
      }
    }
  }
}

export function checkLocationFields(world: World, context: ValidationContext): void {
  for (const [locationName, location] of Object.entries(asDict(world.locations))) {
    if (!isObj(location)) continue;
    const complexityType = (location.complexityType ?? "") as string;
    if (complexityType && !VALID_COMPLEXITY_TYPES.has(complexityType)) {
      addError(context, "locations." + locationName + ".complexityType",
        "`" + complexityType + "` is not a valid `complexityType` — fix: change to one of " +
        quotedList(VALID_COMPLEXITY_TYPES));
    }
    const detailType = (location.detailType ?? "") as string;
    if (detailType && !VALID_DETAIL_TYPES.has(detailType)) {
      addError(context, "locations." + locationName + ".detailType",
        "`" + detailType + "` is not a valid `detailType` — fix: change to one of " +
        quotedList(VALID_DETAIL_TYPES));
    }
  }
}

export function checkWorldLoreFields(world: World, context: ValidationContext): void {
  for (const [loreKey, loreEntry] of Object.entries(asDict(world.worldLore))) {
    if (isObj(loreEntry) && !("text" in loreEntry)) {
      addError(context, "worldLore." + loreKey + ".text", "missing required `text` field — fix: add a `text` key holding the lore entry string");
    }
  }
}

export function checkAreaPaths(world: World, context: ValidationContext): void {
  const locations = asDict(world.locations);
  const locationKeys = new Set(Object.keys(locations));
  for (const [locationName, location] of Object.entries(locations)) {
    const areas = asDict(isObj(location) ? location.areas : {});
    for (const [areaName, area] of Object.entries(areas)) {
      if (!isObj(area)) continue;
      if (!("paths" in area)) {
        addError(context, "locations." + locationName + ".areas." + areaName + ".paths",
          "missing required `paths` field — fix: add `\"paths\": []` (an empty array if the area has no connections)");
      }
      for (const pathRef of asArray(area.paths)) {
        const target = "locations." + locationName + ".areas." + areaName + ".paths";
        if (typeof pathRef === "string" && locationKeys.has(pathRef)) {
          addWarning(context, target,
            "`" + pathRef + "` is a location name, not an area name — area paths only connect sibling areas within the same location, so this entry creates no traversable path at runtime — fix: replace it with a sibling area key, or leave `paths` empty `[]` if cross-location travel is handled by triggers");
        } else if (typeof pathRef === "string" && !(pathRef in areas)) {
          addError(context, target,
            "unknown area `" + pathRef + "` — fix: either add the area to this location's `areas` map, or change the path target to an existing area key (or remove this path entry)");
        }
      }
    }
    // Asymmetric paths are valid (trap rooms, drop chutes, sealed entries, escape-only exits) and do not break runtime traversal, so they surface as recommendations, grouped per location.
    const pairs: Array<[string, string]> = [];
    const seenPairs = new Set<string>();
    for (const [areaName, area] of Object.entries(areas)) {
      if (!isObj(area)) continue;
      for (const pathRef of asArray(area.paths)) {
        if (typeof pathRef !== "string" || !(pathRef in areas)) continue;
        const reverse = asArray(asDict(areas[pathRef]).paths);
        if (!reverse.includes(areaName)) {
          const pairKey = [areaName, pathRef].sort().join("\0");
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            pairs.push([areaName, pathRef]);
          }
        }
      }
    }
    if (pairs.length === 1) {
      const [a, b] = pairs[0];
      addRecommendation(context, "locations." + locationName + ".areas." + b + ".paths",
        "`" + a + "` → `" + b + "` is a one-way path with no reverse entry — one-way paths are valid for trap rooms, drop chutes, sealed entries, or escape-only exits — fix: if unintentional, add `" + a + "` to this area's `paths` to make it bidirectional");
    } else if (pairs.length > 1) {
      const pairStrs = pairs.slice(0, 5).map(([a, b]) => "`" + a + "` → `" + b + "`");
      if (pairs.length > 5) pairStrs.push("+" + (pairs.length - 5) + " more");
      addRecommendation(context, "locations." + locationName + ".areas",
        pairs.length + " one-way paths with no reverse entry: " + pairStrs.join(", ") +
        " — one-way paths are valid for traps, drop chutes, sealed entries, or escape-only exits — fix: if unintentional, add the missing reverse entry to each area to make the paths bidirectional");
    }
  }
}

function coordsOutOfBounds(x: number, y: number, radius: number, halfSize: number): boolean {
  return (
    x - radius < -halfSize || x + radius > halfSize ||
    y - radius < -halfSize || y + radius > halfSize
  );
}

export function checkLocationCoordinates(world: World, context: ValidationContext): void {
  const locations = asDict(world.locations);
  if (Object.keys(locations).length === 0) return;
  for (const [locationName, location] of Object.entries(locations)) {
    if (!isObj(location)) continue;
    for (const field of ["x", "y", "radius"] as const) {
      const fieldValue = location[field];
      if (fieldValue !== undefined && fieldValue !== null && typeof fieldValue !== "number") {
        addError(context, "locations." + locationName + "." + field,
          "expected a number, got " + typeName(fieldValue) +
          " — fix: set `" + field + "` to a numeric grid value");
      }
    }
  }
  const regionSize = asDict(world.locationSettings).regionSize as number | undefined;
  if (typeof regionSize !== "number" || regionSize <= 0) return;
  const halfSize = regionSize / 2;
  for (const [locationName, location] of Object.entries(locations)) {
    if (!isObj(location)) continue;
    const x = location.x, y = location.y, radius = (location.radius as number) || 0;
    if (typeof x !== "number" || typeof y !== "number") continue;
    if (coordsOutOfBounds(x, y, radius, halfSize)) {
      addError(context, "locations." + locationName,
        "coordinates (" + x + ", " + y + ") with radius " + radius +
        " extend beyond region bounds (half-size " + halfSize +
        ") — fix: move the centre inward so |x|+radius and |y|+radius both stay <= " + halfSize +
        ", or raise `locationSettings.regionSize`");
    }
  }
}

export function checkNpcTypeFields(world: World, context: ValidationContext): void {
  const required = ["immunities", "resistances", "vulnerabilities"];
  for (const [typeKey, npcType] of Object.entries(asDict(world.npcTypes))) {
    if (!isObj(npcType)) continue;
    for (const field of required) {
      if (!(field in npcType)) {
        addError(context, "npcTypes." + typeKey + "." + field, "missing required `" + field + "` array — fix: add `\"" + field + "\": []` (an empty array if none)");
      } else if (!Array.isArray(npcType[field])) {
        addError(context, "npcTypes." + typeKey + "." + field,
          "`" + field + "` must be an array, got " + typeName(npcType[field]) + " — fix: change it to an array (use `[]` if none)");
      }
    }
  }
}

export function checkSkillFields(world: World, context: ValidationContext): void {
  for (const [skillKey, skill] of Object.entries(asDict(world.skills))) {
    if (!isObj(skill)) continue;
    if (!("startingItems" in skill)) {
      addError(context, "skills." + skillKey + ".startingItems",
        "missing required `startingItems` array — fix: add `\"startingItems\": []` (an empty array if none)");
    } else if (!Array.isArray(skill.startingItems)) {
      addError(context, "skills." + skillKey + ".startingItems",
        "`startingItems` must be an array, got " + typeName(skill.startingItems) + " — fix: change it to an array (use `[]` if none)");
    }
  }
}

export function checkNpcLevelRangeShape(world: World, context: ValidationContext): void {
  function check(path: string, rng: unknown): void {
    if (!isObj(rng)) {
      addError(context, path, "expected an `{min, max}` object, got " + typeName(rng) +
        " — fix: replace it with " + JSON.stringify({min: "<int>", max: "<int>"}));
      return;
    }
    const lo = rng.min, hi = rng.max;
    if (typeof lo !== "number" || !Number.isInteger(lo) || typeof lo === "boolean") {
      addError(context, path + ".min", "`min` must be an integer, got " + typeName(lo) +
        " — fix: set `min` to a whole number");
      return;
    }
    if (typeof hi !== "number" || !Number.isInteger(hi) || typeof hi === "boolean") {
      addError(context, path + ".max", "`max` must be an integer, got " + typeName(hi) +
        " — fix: set `max` to a whole number");
      return;
    }
    if (lo > hi) {
      addError(context, path, "`min` (" + lo + ") is greater than `max` (" + hi + ") — fix: swap them or correct one of the values");
      return;
    }
    if (lo < 1 || hi > 100) {
      addError(context, path,
        "level range " + lo + "–" + hi + " is outside the valid 1–100 range" +
        " — fix: clamp both endpoints to 1–100");
    }
  }
  for (const [regionName, region] of Object.entries(asDict(world.regions))) {
    if (!isObj(region) || region.npcLevelRange === undefined || region.npcLevelRange === null) continue;
    check("regions." + regionName + ".npcLevelRange", region.npcLevelRange);
  }
  for (const [locationName, location] of Object.entries(asDict(world.locations))) {
    if (!isObj(location) || location.npcLevelRange === undefined || location.npcLevelRange === null) continue;
    check("locations." + locationName + ".npcLevelRange", location.npcLevelRange);
  }
}

export function checkArchetypes(world: World, context: ValidationContext): void {
  const isEmpty = (v: unknown) => !v || (Array.isArray(v) && v.length === 0) || (isObj(v) && Object.keys(v).length === 0);
  const hasHighTier = Object.values(asDict(world.npcs)).some((npc) => {
    if (!isObj(npc)) return false;
    return HIGH_COMBAT_TIERS.has((npc.tier ?? "") as string);
  });
  const add = hasHighTier ? addError : addRecommendation;
  const consequence = hasHighTier ? "the engine hard-crashes when " : "the engine throws when ";
  const caveat = hasHighTier ? "" : " (no high-tier NPCs exist yet so it may not fire, but defining one is defence-in-depth)";
  if (isEmpty(world.characterArchetypes)) {
    add(context, "characterArchetypes", {
      title: "`characterArchetypes` is empty",
      detail: consequence + "generateNPCDetails fires for a strong/elite/boss/mythic tier NPC" + caveat,
      fix: "add at least one entry (key: archetype name, value: short trait/role descriptor string)",
    });
  }
  if (isEmpty(world.locationArchetypes)) {
    add(context, "locationArchetypes", {
      title: "`locationArchetypes` is empty",
      detail: consequence + "generateLocationDetails fires" + caveat,
      fix: "add at least one entry (key: archetype name, value: short evocative description)",
    });
  }
  if (isEmpty(world.regionArchetypes)) {
    add(context, "regionArchetypes", {
      title: "`regionArchetypes` is empty",
      detail: consequence + "generateRegionDetails fires" + caveat,
      fix: "add at least one entry (key: archetype name, value: short geographical/cultural descriptor)",
    });
  }
}

export function checkTopLevelKeys(world: World, context: ValidationContext): void {
  for (const key of Object.keys(world)) {
    if (!KNOWN_TOP_LEVEL.has(key)) {
      addError(context, key,
        "unexpected top-level key — not a valid V33 field — fix: remove the key entirely (the editor will keep rendering yellow warnings until removed; engine ignores the field at runtime)");
    }
  }
}
