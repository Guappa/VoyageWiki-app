---
tab: "ai"
section: "generateLocationDetails"
title: "Location Details"
kind: "schema"
summary: "Generates location descriptions, areas, and paths. Low priority: a well-written basicInfo carries most of the load. Use custom to add sensory layers, archetype integration rules, and atmosphere guidance."
order: 160
advanced: false
uiLocation: "AI Tasks → Location Details"
uiSubtitle: "\"Location Details Instructions\""
editor: "Graphical form (labeled textareas)"
related: "locations - the location records this task operates on; locationArchetypes - archetypes this task draws from"
---

## Schema

```json
{
  "aiInstructions": {
    "generateLocationDetails": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateLocationDetails": {
      "custom": "## First Entry\nEstablish three layers on entry: what the player sees, what they hear, what the atmosphere feels like. One detail per layer — weave them into the description, don't list them.\n\n## Archetype Integration\nThe location archetype is the generative spine. Every area should express a different facet of its core tension."
    }
  }
}
```


## Fields

### custom

The only key — free-form rules layered on top of each location's `basicInfo`.

## Authoring pattern

Cover in `custom`:

- Three sensory layers on first entry: sight, sound, atmosphere — one detail each, woven into the prose.
- `detailType` interpretation guidance for your world's location archetypes.
- Atmosphere rules specific to location types (e.g. how dungeons feel vs. cities vs. wilderness).
