---
tab: "other"
section: "randomNames"
title: "Random Character Names (Advanced)"
kind: "schema"
summary: "Name pools the engine draws from when generating character names. Used by the randomize button in character creation and by AI-generated NPC names."
order: 120
advanced: true
uiLocation: "Other → Advanced → Random Character Names"
uiSubtitle: "\"Names used for the randomize button in character creation\""
editor: "JSON only"
related: "nameFilterSettings - filters and substitutes generated names; npcs - the engine pulls from these pools when generating NPC names"
---

## Example

```json
{
  "male": ["Arden", "Bram", "Corvin", "Dalen", "Ewin", "Faros", "Greld", "Holt", "Idric", "Jarren"],
  "female": ["Aela", "Bryn", "Cara", "Deva", "Erin", "Fael", "Gwen", "Hale", "Isra", "Jora"]
}
```

Define separate lists for `male` and `female`. No gameplay effect. Use names that match your world's phonetic register. Keep at least 10 per gender to avoid repetition. If you want surnames, include them within the `male` / `female` entries (e.g. `"Arden Voss"`); there is no separate `last` array -- it appeared in earlier wiki examples but is not in the schema.