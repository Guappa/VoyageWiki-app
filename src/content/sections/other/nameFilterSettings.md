---
tab: "other"
section: "nameFilterSettings"
title: "Name Filter Settings"
kind: "schema"
summary: "Keyed map of name replacement rules. Each key is a name (or name fragment); its value provides a list of allowed replacements. When a generated name matches a key, the AI substitutes one from the replacements array."
order: 20
advanced: false
uiLocation: "Other → Name Filter Settings"
uiSubtitle: "\"Settings for filtering names in the world\""
editor: "JSON + ADD ITEM (empty `{}` by default)"
related: "randomNames - the name pools generators draw from before this filter applies; npcs - replacements substitute at NPC name generation time"
---

## Example

```json
{
  "Marcus": {
    "replacements": ["Alex", "Ethan", "Jason", "Ryan", "Owen", "Nathaniel", "Adrian", "Colin"]
  },
  "Elara": {
    "replacements": ["Thea", "Cora", "Nova", "Vega", "Astra", "Selene", "Orion", "Cassie"]
  },
  "Ironfoot": {
    "replacements": ["Anvildrang", "Broadback", "Coalvein", "Cragmor", "Deepholm", "Redforge"]
  }
}
```

## Entry shapes

Leave as `{}` if you have no naming constraints. There are two entry shapes:

- **Name replacement:** map a banned name to lore-appropriate substitutes. The engine substitutes during narration.
- **Word/phrase deletion:** set `replacements` to `[""]` to delete a phrase outright instead of replacing it. Useful for stripping recurring AI tics or undesired in-world phrases.
