---
tab: "ai"
section: "generateEncounters"
title: "Encounters"
kind: "schema"
summary: "Fires when framing an encounter. Low priority: `encounterElements` in Other provides the source palette. Use custom to set difficulty mix, creature behavior rules, and non-combat resolution conditions."
order: 190
advanced: false
uiLocation: "AI Tasks → Encounters"
uiSubtitle: "\"Encounters Instructions\""
editor: "Graphical form (labeled textareas)"
related: "encounterElements - the palette of encounter components this task draws from"
---

## Schema

```json
{
  "aiInstructions": {
    "generateEncounters": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateEncounters": {
      "custom": "## Structure\nFrame encounters as situations, not ambushes. Give the player a moment to observe before committing. Every encounter has a non-combat resolution path.\n\n## Mix\nTwo of five options should involve conflict or danger. Three should offer interaction, exploration, or opportunity."
    }
  }
}
```


## Fields

### custom

The only key — free-form encounter-framing rules. The `encounterElements` section supplies the raw palette this task draws from.

## Authoring pattern

Cover in `custom`:

- Difficulty tiers and how they map to enemy strength or environmental danger in your setting.
- Creature type behavior rules for the monster categories in your world.
- Non-combat resolution conditions that are specific to your world's tone and genre.
- Encounter mix guidance — the ratio of dangerous to non-dangerous options appropriate for your world.
