---
tab: "mechanics"
section: "traitCategories"
title: "Trait Categories"
kind: "schema"
summary: "Categories group `traits` together and control how many the player can pick from each group. Each category must be defined before `traits` can be assigned to it - the `traits` array lists which trait names belong to this category."
order: 50
advanced: false
uiLocation: "Mechanics → Trait Categories"
uiSubtitle: "\"Trait categories\""
editor: "JSON + ADD ITEM"
related: "traits - traits are assigned to categories via `category`"
---

## Example

```json
{
  "Race": {
    "name": "Race",
    "description": "Your ancestral heritage. Shapes base capabilities and how the world sees you.",
    "maxSelections": 1,
    "traits": ["Human", "Elf", "Dwarf", "Halfling"]
  },
  "Class": {
    "name": "Class",
    "description": "Your trained vocation. Determines starting equipment and which abilities are most readily available.",
    "maxSelections": 1,
    "traits": ["Soldier", "Scholar", "Scout", "Healer", "Merchant"]
  },
  "Background": {
    "name": "Background",
    "description": "Where you come from and what shaped you before adventuring. Adjusts base skills and gives one starting item.",
    "maxSelections": 1,
    "traits": ["Noble Household", "Working Family", "Frontier Town", "Coastal Port"]
  },
  "Perks": {
    "name": "Perks",
    "description": "Edge traits — small advantages from biology, habit, or hard-won experience. Pick up to two.",
    "maxSelections": 2,
    "traits": ["Iron Stomach", "Light Sleeper", "Sharp-Eyed", "Quick Learner", "Bookish", "Patient", "Cool Head", "Lucky"]
  }
}
```

## Fields

### maxSelections

how many traits from this category the player can choose. Set to `1` for mutually exclusive categories or to the desired multi-select cap. **`0` is empirically broken in the live UI -- the category renders 'Selected 0/0' and no traits can be picked.** For "pick everything that applies" categories, set `maxSelections` equal to the number of traits in the category. Typical values: `1` (single-pick), `3-N` (multi-select).

### traits

**required** `Array<string>`. Lists all trait names in this category. Validator errors if absent.

> **📋 Note:** The validator checks `name`, `maxSelections`, and `traits` on traitCategory entries.

> See [Authoring Guide > Traits](/mechanics/traits#traits-character-creation-depth-and-clarity) for the pattern on hiding trigger-only system traits from the character creator.