---
tab: "ai"
section: "generateLearnedAbilities"
title: "Learned Abilities"
kind: "schema"
summary: "Evaluates story events for opportunities to grant new `abilities`. Low priority: most turns produce no output. Use custom to define the world's learnable ability families and acquisition methods."
order: 340
advanced: true
uiLocation: "AI Tasks → Advanced → Learned Abilities"
uiSubtitle: "\"Learned Abilities Instructions\""
editor: "Graphical form (labeled textareas)"
related: "abilities - the abilities this task can produce; generateNPCDetails - NPC ability fill-in on first encounter"
---

## Schema

```json
{
  "aiInstructions": {
    "generateLearnedAbilities": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateLearnedAbilities": {
      "custom": "## Learnable Abilities\nThis world admits four families: arcane spells, martial disciplines, crafting techniques, and social arts. Each requires a teacher, an apprenticeship arc, or a moment of revelation. Avoid raw 'X gains ability Y' jumps."
    }
  }
}
```


## Fields

### custom

The only key — free-form rules for what is learnable in this world and how it is acquired.

## Authoring pattern

Cover in `custom`:

- What families of abilities exist in this world (magical schools, martial techniques, social arts, crafting trades).
- The rough boundary between learnable and impossible — what the world's logic rules out.
- How abilities are typically acquired: teachers, training arcs, moments of revelation, finding ancient texts.
