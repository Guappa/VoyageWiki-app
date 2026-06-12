---
tab: "ai"
section: "generateRegionDetails"
title: "Region Details"
kind: "schema"
summary: "Generates region descriptions, `factions`, and `locations`. A content-generation task — not narration. Use custom to shape geographic identity, faction character, and location types for generated `regions`."
order: 170
advanced: false
uiLocation: "AI Tasks → Region Details"
uiSubtitle: "\"Region Details Instructions\""
editor: "Graphical form (labeled textareas)"
related: "regions - the region records this task operates on; locationArchetypes - archetypes drawn on during generation; regionArchetypes - archetypes drawn on during generation"
---

## Schema

```json
{
  "aiInstructions": {
    "generateRegionDetails": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateRegionDetails": {
      "custom": "## Region Generation\nEach region should have a dominant geographic identity — don't generate generic 'wilderness'. Reflect the realm's political state in the region's faction presence and location naming. Minor factions should have a clear operational purpose (patrol, extraction, refuge, control). Locations should be 3–5 per region: one settlement, one wilderness site, one site of conflict or history."
    }
  }
}
```


## Fields

### custom

The only key — free-form rules for content generated into new regions.

## Authoring pattern

Cover in `custom`:

- The dominant geographic and atmospheric identity for regions in this world.
- How minor factions are named, structured, and motivated in your setting.
- Location naming conventions and what types of sites are appropriate for the genre.
- How realm politics and world history should colour newly generated regions.
