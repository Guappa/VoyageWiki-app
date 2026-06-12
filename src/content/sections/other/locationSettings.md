---
tab: "other"
section: "locationSettings"
title: "Location Settings (Advanced)"
kind: "schema"
summary: "Controls the map and travel system parameters: region size, location radii, travel distances, how many `factions` the engine places in AI-generated `regions`, and whether new `regions` and encounters can be created during play."
order: 40
advanced: true
uiLocation: "Other → Advanced → Location Settings"
uiSubtitle: "\"World generation settings like region size, travel distances, etc.\""
editor: "JSON + ADD ITEM"
related: "regions - region size parameters defined here; locations - travel distances and visibility settings apply to these"
---

## Example

```json
{
  "locationDifficultyTiers": ["beginner", "intermediate", "advanced", "expert", "mythic", "legendary"],
  "regionSize": 100,
  "simpleRadius": 2,
  "complexRadius": 5,
  "regionLocationCount": 8,
  "avgTravelDistance": 30,
  "minTravelDistance": 5,
  "regionFactionCount": 4,
  "newRegionGenerationEnabled": true,
  "encountersEnabled": false
}
```

## Fields

"Keep the default values unless you decide you want them to be different."

### locationDifficultyTiers

**Extra-codec field.** Array of tier name strings that defines the valid difficulty labels the narrator uses when determining encounter power and obstacle complexity for locations.

### regionSize

the width of each region in internal coordinate units. Location `x`/`y` offsets are relative to this; the default of `100` means locations range from −50 to +50 within a region.

### simpleRadius

the map footprint (in coordinate units) of a `complexityType: "simple"` location. Determines when the player is considered "at" vs "near" that location during map travel.

### complexRadius

same as `simpleRadius` but for `complexityType: "complex"` locations, which are larger on the map.

### regionLocationCount

target density for AI-generated regions: how many points of interest the engine generates to make a region feel populated. For authored regions, the narrator uses this as a density reference rather than a hard cap.

### avgTravelDistance

`avgTravelDistance` must be ≤ `regionSize`. Critical note: "If your region is 10km wide but avgTravelDistance is 20km, the player will overshoot every destination."

`avgTravelDistance` default of 20 works for small maps (5–6 regions). For larger maps (10+ regions with a wide coordinate spread), raise it to 25–35 proportionally. If it's set too low relative to your coordinate space, players overshoot every destination.

### minTravelDistance

minimum distance between locations. Prevents locations from spawning so close together that travel is instantaneous.

### regionFactionCount

factions placed in AI-generated regions. **Required.**

### newRegionGenerationEnabled

whether AI can create new regions during play. **Required.**

### encountersEnabled

enables random encounter system. **Required.**

### regionMapBorderFeatheringEnabled

whether region map images render with feathered, rounded borders. Defaults to feathered; set `false` to render region maps as flat square tiles. **Optional.**