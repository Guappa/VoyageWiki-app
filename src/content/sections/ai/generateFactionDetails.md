---
tab: "ai"
section: "generateFactionDetails"
title: "Faction Details"
kind: "schema"
summary: "Generates faction details — hidden agendas, operating methods, and the gap between stated purpose and actual practice. Use custom to shape how `factions` are portrayed beneath their public face."
order: 180
advanced: false
uiLocation: "AI Tasks → Faction Details"
uiSubtitle: "\"Faction Details Instructions\""
editor: "Graphical form (labeled textareas)"
related: "factions - the faction records this task operates on"
---

## Schema

```json
{
  "aiInstructions": {
    "generateFactionDetails": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateFactionDetails": {
      "custom": "## Presentation\nDistinguish public face from operating reality. A faction's stated purpose and its actual methods are rarely identical. Member NPCs embody faction values through behavior and priorities — not explicit declarations of loyalty."
    }
  }
}
```


## Fields

### custom

The only key — free-form rules for how factions read beneath their public face.

## Authoring pattern

Cover in `custom`:

- Public face vs. operating reality per faction — the stated purpose and the actual methods are rarely the same.
- How member NPCs reflect faction values: through behavior and priorities, not by making loyalty statements.
