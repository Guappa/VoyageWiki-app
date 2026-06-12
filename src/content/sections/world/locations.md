---
tab: "world"
section: "locations"
title: "Locations"
kind: "schema"
summary: "Locations are the named places on the map - cities, ruins, dungeons, waypoints. Each has a `basicInfo` description for the narrator, optional `hiddenInfo`, named `areas` inside it with their own descriptions, and `paths` to adjacent `locations`."
order: 100
advanced: false
uiLocation: "World → Locations"
uiSubtitle: "\"Specific places within regions (cities, dungeons, etc.)\""
editor: "JSON + MAP EDITOR + ADD ITEM"
related: "regions - each location belongs to a region via `regionId`; storyStarts - `locationAreas` references area names defined here; quests - `questLocation` must be a location key"
---

## Example

```json
{
  "The Capital": {
    "name": "The Capital",
    "basicInfo": "The largest city in the realm. A walled city of towers, markets, and bureaucracy. The ruling council's seat dominates the skyline. Gatekeepers at every entrance, petitioners in every corridor, and information that costs money to obtain.",
    "x": -27,
    "y": 5,
    "radius": 6,
    "region": "The Heartland",
    "complexityType": "complex",
    "detailType": "detailed",
    "difficultyTier": "intermediate",
    "hiddenInfo": "A criminal syndicate has an active cell operating in the lower district. The mage guild's restricted archive holds three documents officially declared destroyed.",
    "areas": {
      "Council Hall": {
        "description": "The formal chamber of the ruling council. Stone galleries and tiered seating for petitioners, every surface worn smooth from centuries of use. The air carries the smell of old paper and lamp oil. Guards at every door watch the visitors more than the council members.",
        "paths": ["Market Quarter", "Academy Gate"]
      },
      "Market Quarter": {
        "description": "The city's commercial heart — a permanent noise of competing vendors, loaded carts, and shouted prices. Dense enough that a conversation can happen three feet from a city watchman without being overheard. Merchants here know where information is bought and sold as well as goods.",
        "paths": ["Council Hall", "Lower District", "Academy Gate"]
      }
    },
    "factions": ["The Merchant Council", "The Mage Guild", "The City Watch"],
    "known": true
  }
}
```

Simple location (no areas):

```json
{
  "Border Watchtower": {
    "name": "Border Watchtower",
    "basicInfo": "One of the frontier's forward observation posts. Manned by a rotating garrison detachment. Sparse, functional, and chronically under-supplied.",
    "x": 12,
    "y": -8,
    "radius": 2,
    "region": "The Frontier",
    "complexityType": "simple",
    "detailType": "basic",
    "areas": {},
    "factions": ["The Border Watch"],
    "hiddenInfo": "The garrison rotation is on a fortnight cycle and the next swap is two days late. The current crew know it; the Border Watch command does not.",
    "known": true
  }
}
```

## Fields

Each location must be a **plain object with all fields merged** (not an array or split objects).

> **📋 Note:** Validator errors show `locations.key.0.fieldName` — the `.0`/`.1` are io-ts union/intersection branch indices. Value must be a plain object.

> **📋 Note:** `hiddenInfo` is available to the AI during play but players never see it directly. The AI uses it to stay consistent with the world's secrets - dropping hints in atmosphere and description rather than stating secrets outright. This pattern applies consistently across locations, NPCs, [factions](/world/factions), and regions: `basicInfo` is the surface, `hiddenInfo` is what drives the AI's behavior beneath it.

### complexityType

`"simple"` | `"complex"` | `"wilderness"`. **The correct field name is `complexityType`, not `complexity`.** Using the shortened form `complexity` is not a valid schema field and is ignored by the codec. **`"linear"` is NOT a valid value. Use `"complex"` for any location with multiple areas.**

### detailType

`"basic"` or `"detailed"` — **required field (codec-enforced).** Determines whether quests use `spatialRelationship` or `questLocation`. Omitting it causes a validation error.

### areas

`areas` use `description` **not** `basicInfo`. Production area descriptions run 200–400 chars — significantly longer than a single sentence. A strong area description covers three things: (1) physical character of the space, (2) what function or activity happens here, (3) one atmospheric or sensory detail that makes the area distinct. The third element — a smell, a sound, a social rule, a visual anomaly — is what makes areas feel inhabited rather than labelled.

**Area keys must be display names, not snake_case.** The area key is what the game displays to the player — `"Council Hall"` not `"council_hall"`. Using snake_case produces ugly output like "The Capital - Council_hall" in the location bar. The key is also referenced directly in `paths`, [`npcs.currentArea`](/world/npcs), and `storyStarts.locationAreas` — a rename requires updating all three, so get the names right from the start.

> **⚠️ Warning:** Location area objects use `"description"`, not `"basicInfo"`. Using `basicInfo` in an area object causes silent failure — the area appears but with no description. The correct field is `"description"`.

### paths

**Required key in every area object.** Every area must include `"paths": []` even if it has no connections. Paths must reference **sibling area keys** that exist within the same location. Do not reference keys from other locations — paths are intra-location only. For cross-location travel, use triggers (`party-location` effect) instead and leave the source area's `paths` empty if it has no intra-location connections. Deleted areas must have their `paths` references removed from all other areas. Paths must be symmetric: if area A lists area B, area B must list area A back.

### factions

Optional `Array<string>`. Array of faction display-name strings associated with this location. Names must exactly match faction keys. Tells the narrator which factions have a presence here, influencing NPC affiliations and political framing in the scene.

### difficultyTier

Extra-codec. String tag indicating the challenge level of this location. Used by the narrator to calibrate enemy power and encounter intensity. The field is a free string (not schema-enforced), but use the standard five-tier vocabulary: `"beginner"`, `"intermediate"`, `"advanced"`, `"expert"`, `"master"`. Omit if not needed.

### npcLevelRange

Optional `{ min, max }` integer band constraining the levels of AI-generated NPCs in this specific location. Takes priority over the parent region's `npcLevelRange` for NPCs generated here. Use it for outliers -- a high-tier dungeon inside a low-tier region, or a starter-friendly hub inside a high-tier region. NPCs with an explicit authored `level` ignore the band; only level-less generated NPCs are rolled near party level and then clamped into it. Omit to inherit the region's band (or the engine default when the region has none).

### imageUrl

Optional string. URL of a banner or map image for this location, displayed in the location view. Works the same as `regions.*.imageUrl`: accepted but not officially supported. A native image-generation pipeline with mandatory automatic AI content moderation (the same review applied before a world can be published) is in active development and will replace this slot. Treat custom URLs as a temporary affordance; expect them to be restricted once the native feature ships.

### Runtime / engine-managed fields

- `lastVisitedTick`: runtime field written by the engine recording the game tick when the party last visited this location. Omit when authoring; preserve the value when importing an existing save file.
- `visitedAreas`: always `[]` — engine-managed. **Extra-codec field — accepted by the validator but not enforced.**

### basicInfo

The public-facing description of a location. It should answer: what is this place, who is here, and what is the dominant feeling of being in it? Keep it to 2–3 sentences.

### hiddenInfo

The truth beneath the surface. Strong location `hiddenInfo` covers: a hidden faction presence or active operation, a historical or structural secret, specific character secrets attached to this place, and — most importantly — something **actively happening right now** that the player can discover. Static backstory is less useful than a live situation. Length: 400–1,600 chars for complex locations; shorter is fine for simple ones.

## Movement and engine behavior

### Movement types

Four distinct movement modes the engine recognizes:

| Type | Scope | Behavior |
|---|---|---|
| **MOVE** | Within a location | Moves between areas using `paths`. Respects the path graph. |
| **TRAVEL** | Between locations | Moves between locations within a region via map coordinates. Distance and travel time apply. |
| **TELEPORT** | Anywhere | Bypasses all distance, path, and travel constraints. Instant. |
| **FAST TRAVEL** | Anywhere | Like teleport with explicit targeting — bypasses constraints but player must name a destination. |

MOVE is the default within a complex location. TRAVEL is the default between locations. TELEPORT and FAST TRAVEL are special-case modes that [abilities](/mechanics/abilities) and triggers can invoke.

### generateLocationDetails trigger

`generateLocationDetails` generates `areas` (with descriptions and `paths`) and `hiddenInfo` for locations that don't yet have that detail. It reads the existing `basicInfo` as its creative foundation. Only applies to `complexityType: "complex"` locations — `simple` and `wilderness` locations are not processed. Locations with `detailType: "detailed"` and fully authored content skip this task.

### Wilderness fallback

When the party ends a scene in untracked space and no permanent settlement is established, the engine falls back to a synthetic location named `Wilderness` with area `Wilderness`. Parsing is case-insensitive on the AI side, so `wilderness`, `Wilderness`, and `WILDERNESS` all canonicalize to the same `Wilderness` location.

## Authoring tips

### Simple vs complex

- `complexityType: "simple"` — a single point of interest with no internal navigation. Good for taverns, shrines, waypoints.
- `complexityType: "complex"` — multiple areas connected by `paths`. Use for dungeons, cities, estates, major landmarks.

### Complex location design

- Give 4–6 areas minimum for a dungeon or major landmark.
- Make sure `paths` are bidirectional where logical (if you can walk from A to B, usually you can walk back).
- Put different encounters, NPCs, or [items](/world/items) in each area — don't duplicate.
- Use `hiddenInfo` at the location level for secrets that only reveal after exploration or specific quest progress.

### Areas inside a complex location

`areas` within a complex location define the navigable sub-zones. A city needs at minimum a public space and a private one — the distinction creates social texture. `paths` should be symmetric: if `Market Quarter` lists `Council Hall` as a path, then `Council Hall` should list `Market Quarter` back.

### Settlements need a social area

Settlements (locations with NPCs, quest hooks, or hospitality) should include at least one social gathering area — a tavern, market, plaza, parlor, or equivalent — where the player can seek information and quests.

### Endgame locations

- Be `known: false` initially — they're discovered, not given.
- Have 3–5 areas forming a linear or branching progression.
- Have their own `hiddenInfo` that recontextualises something the player thought they knew.
- Be tied to at least 2–3 quests (discovery quest, objective quest, resolution/ending quest).

### Region coverage

Every region should have 3+ locations. A region with 1 location has no internal exploration. Minimum: one settlement/hub, one wilderness/danger site, one ruin/secret site.

### Map and radius

On `radius`: "A 3 square radius will be 6 squares wide but only go about 2 squares diagonally." Don't overlap circles.

There is no street view in the game — players cannot navigate inside a location visually. Use `areas` within a complex location to represent navigable sub-zones. Multiple separate location circles in a region can make a dense area (like a city) feel more navigable on the map.

**Packing tip:** You can fit more locations together by offsetting their y-coordinates. Two locations with radius 3 can sit adjacent without overlapping if one is shifted vertically, since the diagonal distance between circles is ~1.5× the horizontal distance.

**City design choice:** A city can be one large complex location (single circle, many areas) or multiple smaller complex locations filling a region. Multiple circles are more map-readable; a single circle with many areas gives deeper internal navigation.
