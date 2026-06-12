---
tab: "other"
section: "otherSettings"
title: "Other Settings (Advanced)"
kind: "schema"
summary: "XP thresholds, level cap, and NPC health scaling for your scenario."
order: 60
advanced: true
uiLocation: "Other → Advanced → Other Settings"
uiSubtitle: "\"General game settings like XP, health, combat, etc.\""
editor: "JSON only"
related: "attributeSettings - level-up XP thresholds tie to attribute progression; resourceSettings - NPC health scaling interacts with resource maximums"
---

## Example

```json
{
  "startingCharacterLevelUpRequirement": 1000,
  "extraRequiredXPPerCharacterLevel": 400,
  "maxCharacterLevel": 100,
  "npcHealthPerLevel": 12,
  "npcMinHealth": 66
}
```

> **📋 Note:** `npcHealthPerLevel` is the per-level HP scaling for NPCs. The exact arithmetic the engine applies is not formally documented.