---
tab: "world"
section: "regions"
title: "Regions"
kind: "schema"
summary: "Regions are the geographic map units - the named zones that appear as cells on the player's interactive map. A realm contains all `regions`; `locations` are the specific points of interest inside a region."
order: 80
advanced: false
uiLocation: "World → Regions"
uiSubtitle: "\"The next level of organization in your setting (land, country, etc.). Contains locations\""
editor: "JSON + MAP EDITOR modal + ADD ITEM"
related: "locations - locations belong to a region via `regionId`; worldLore - nation and political context belongs there, not in region descriptions"
---

## Example

```json
{
  "The Heartland": {
    "name": "The Heartland",
    "basicInfo": "The central heartland of the realm — a patchwork of managed farmland, well-maintained roads, and market towns spaced a day's travel apart. The terrain is flat to gently rolling with no significant natural obstacles; what defences exist are man-made. Climate is temperate with reliable summer harvests and mild winters, making this the most economically productive region in the realm. The ruling administration maintains visible presence here: tax collectors, licensed guild representatives, and city watch detachments at major crossroads. Beneath the administered surface the region is contested: three major trade families have unresolved disputes over road tolls, and the intelligence apparatus has more active operations here than its published mandate suggests.",
    "x": 0,
    "y": 4,
    "realm": "The Compact",
    "factions": ["Ruling Council", "Mage Academy", "Rangers", "Merchant Guild"],
    "known": true,
    "npcLevelRange": { "min": 1, "max": 25 }
  }
}
```

## Fields

> **📋 Note:** Validator errors show `regions.Name.0.fieldName`. The `.0`/`.1` are io-ts union/intersection branch indices (required vs optional field groups), not array indices. Value must be a plain object.

### npcLevelRange

Each region declares the min and max levels the engine should target when generating ambient NPCs inside that region. The pair shapes the difficulty curve: a starter zone might use `{ min: 1, max: 10 }`, a contested mid-tier zone `{ min: 15, max: 45 }`, an endgame frontier `{ min: 60, max: 100 }`. Both fields are integers. The engine treats missing `npcLevelRange` as a default range (Voyage import does not reject worlds without it), but setting it explicitly is the supported way to keep starter areas and tougher zones on their intended curve. Fixed-level authored NPCs continue to use their authored `level`; this field only constrains AI-generated NPCs in that region.

> **📋 Note:** `npcLevelRange` is also accepted on **individual locations** (same `{ min, max }` shape). Location-level entries override the parent region's range for NPCs generated inside that specific location. Use this for outlier locations -- a high-tier dungeon inside a low-tier region, or a starter-friendly hub inside a high-tier region. See [Locations](/world/locations) for the location-level field.

### hiddenInfo

Do not use on regions. The field exists in the schema and the editor exposes it, but it has no documented function for regions at runtime. Region secrets belong in the `hiddenInfo` of individual locations or NPCs instead. Omit or leave as `""`.

### realm

Must match a key in `realms`. Omitting it is valid but the region will not appear in the realm map view. Almost always set.

### factions

Display-name strings of factions with a broad, region-wide presence (patrols, political control, cultural influence). Names must match faction keys. For site-specific faction presence use `locations.*.factions` instead.

### imageUrl

Extra-codec optional string. URL of a banner or map image shown in the region view. Custom image URLs work today but are not an officially supported feature; the engine loads them without moderation enforcement. A native image-generation pipeline with mandatory automatic AI content moderation (the same review applied before a world can be published) is in active development and will replace this slot. Treat custom URLs as a temporary affordance; expect them to be restricted once the native feature ships.

## Map coordinate system

"You can plan out the shape of your realm and arrange the regions in whatever order you want." The realm is always rectangular — undefined coordinates between placed regions get filled in.

Region and location coordinates use completely different systems.

### Region x/y (grid cell position)

- Each integer unit represents one full region cell (regionSize=100 units wide)
- Adjacent regions should differ by exactly 1 in x or y (e.g., (0,1) and (1,1) are side-by-side)
- **Within a realm, all regions must form a connected grid — no isolated regions.** Adjacent means sharing an edge (not diagonal). A region with no edge-neighbor in the same realm is invalid.
- A gap of 2+ between coordinates = empty random-terrain cells between regions
- DO NOT use large values like 95, 220, 555 — these place regions thousands of cells apart, making the map unnavigable
- x increases eastward, y increases northward: north is `+y`, south is `-y`, east is `+x`, west is `-x` (positive y renders upward on the map)

**Example 11-region grid layout:**

```text
        x=0           x=1           x=2           x=3           x=4
y=2  [safe NW]    [mid NE]      [random]      [random]      [random]
y=1  [safe W]     [mid W]       [mid C]       [frontier E]  [frontier FE]
y=0  [coastal S]  [random]      [danger C]    [danger E]    [endgame]
```

Each region's playable area is its ±50 local grid. The map editor shows all regions on a global grid for editing. Players navigate between regions via in-game travel commands; the map shows their current region's local view.

### Location x/y (local offset)

Location coordinates are a **local offset from the parent region's center**, not global.

- Range: ±50 (since regionSize=100 → each region spans 50 units in each direction from center)
- A location at (0,0) appears at the region center; (-23,25) is 23 units west, 25 units north
- The location editor shows e.g. x=-23, y=25, and the pin appears correctly inside the region box

### Realm vs region

**Realm ≠ geographic zone.** A realm is the top-level container — roughly equivalent to a world, country, or plane of existence. Most scenarios should have exactly **one realm** containing all regions. Regions are the actual geographic map units visible on the interactive player map. Do NOT split a single world into multiple realms as if they were continents or zones — use regions for that.

### Cross-region travel

When players travel past a region boundary, coordinates wrap into the adjacent region. With `locationSettings.regionSize: 100`:

```text
From location (95, 50) in region (2, 2)
Travel +10 in x direction
→ Arrive at (5, 50) in region (3, 2)
```

The `regionSize` setting in `locationSettings` determines the float coordinate space within each region (default 100).

## Authoring tips

### What belongs in region basicInfo

A region describes a **geographic area** — the physical terrain, climate, landmarks, and who lives there. It does not describe a nation, political entity, or cultural tradition. Those belong in `worldLore`.

`basicInfo` **should** describe:
- Terrain type (plains, mountains, coast, forest, desert, urban)
- Climate and weather (temperature, rainfall, seasonal variation)
- Physical landmarks (rivers, peaks, coasts, notable formations)
- Who inhabits it (sparse vs dense, what kind of settlement)
- Local flavour (what makes this patch of land distinct to look at)

`basicInfo` should **NOT** describe:
- Full national history, dynastic succession, or political lore — that belongs in `worldLore`
- Cultural traditions, religious practices, or economic systems in depth
- School reputations, sports results, or institutional standing

A brief note on current political or military situation is appropriate — who controls this land and whether that control is contested helps the AI understand the region's mood and NPC loyalties. Keep it to one sentence; the details belong in `worldLore`.

### basicInfo template (3-aspect pattern)

One paragraph covering three aspects:

1. **Geography** — terrain, landmarks, natural features
2. **Climate / atmosphere** — weather patterns, sensory details, mood
3. **Inhabitant hints** — who or what lives here, without full faction details

Pattern: `"[Terrain description]. [Climate and atmospheric details]. [Brief mention of inhabitants or dangers]."`

### Region scope

Regions are large geographic areas containing 3-8 locations. Think a forest (not a single grove), a mountain range (not a single peak), a coastal stretch (not a single beach), a district or quarter (not a single building).

### One region per geographic zone, not per country

A large nation with 10+ locations should be split into geographic sub-regions (northern highlands, southern plains, capital valley, coastal zone). Put the nation's political and cultural identity in `worldLore` under that nation's entry. The region just describes what the land looks like and who lives on it.

**Example:** Instead of "France: Beauxbatons Academy in the Pyrenees. Strong magical tradition.", write "A high granite mountain range forming the natural border between France and Spain. Permanent snowfields at elevation, forested mid-slopes, and glacial valleys. Climate is continental at altitude — cold and dry. The Pyrenean passes are the primary overland route between the two nations."

### Geographic layout tip

The x/y coordinates are purely visual. Arrange regions spatially to hint at geography — e.g. safe starting regions on the west, dangerous frontier regions on the east, coastal regions in the south. This makes the map feel coherent without requiring any additional config.

### Coverage targets

| Region type | Minimum locations | Notes |
|---|---|---|
| Safe starting region | 3–4 | Hub town, wilderness, minor dungeon |
| Mid-game region | 3–4 | Faction base, contested site, ruin |
| Frontier/dangerous region | 3–4 | Outpost, hazard zone, hidden location |
| Endgame region | 3 | Entry point, lore location, final confrontation |

Never ship an endgame region with only 1 location. Players reaching the endgame expect an arc, not a single room.
