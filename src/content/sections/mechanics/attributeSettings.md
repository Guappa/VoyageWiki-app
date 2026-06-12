---
tab: "mechanics"
section: "attributeSettings"
title: "Attributes"
kind: "schema"
summary: "Attributes are the core stats of your system - strength, dexterity, intelligence, or whatever names fit your world. They drive skill-roll modifiers and optionally scale resource pools."
order: 10
advanced: false
uiLocation: "Mechanics → Attributes"
uiSubtitle: "\"Character attributes\""
editor: "JSON only"
related: "skills - attributes feed into skill checks; traits - traits can grant attribute bonuses; npcs - NPC entries include attribute scores"
---

## Example

```json
{
  "attributeNames": ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
  "maxStartingAttribute": 16,
  "startingAttributeValue": 8,
  "lowAttributeThreshold": 2,
  "lowAttributeTraits": {
    "strength": "Frail",
    "constitution": "Sickly",
    "intelligence": "Slow Learner",
    "charisma": "Off-Putting"
  },
  "attributeBonusModifier": 2.5,
  "attributeStatModifiers": {
    "strength": { "amount": 2, "variable": "health" },
    "constitution": { "amount": 1, "variable": "health" },
    "wisdom": { "amount": 2, "variable": "mana" },
    "intelligence": { "amount": 1, "variable": "mana" }
  },
  "startingAttributePoints": 27,
  "attributeDamageModifiers": {
    "strength": 2
  },
  "attributeDamageReductionModifiers": {
    "dexterity": 1
  }
}
```

## Fields

### attributeNames

Can be fully renamed or expanded. Attribute names inform how the AI decides which is relevant to an action. **All attribute name strings must be lowercase.** The engine normalises attribute lookups to lowercase internally; using mixed or title case (e.g. `"Intellect"` instead of `"intellect"`) causes silent mismatches with `skills[*].attribute` and `attributeStatModifiers` lookups. The same lowercase strings must be used consistently everywhere attributes are referenced: `attributeSettings.attributeNames`, `attributes` dict keys, `skills[*].attribute`, `traits[*].attributes[*].attribute`, `items[*].bonuses[*].variable` (when `type: "attribute"`), and `attributeSettings.attributeStatModifiers` keys.

### startingAttributeValue

Base value before point buy. **Required.**

### lowAttributeThreshold

Attribute score below which a character is considered "low" in that attribute.

### lowAttributeTraits

Keyed map of traits automatically applied to characters whose score falls below `lowAttributeThreshold`. Can be used to add narrative or mechanical penalties for dump stats. Leave `{}` to disable.

### attributeStatModifiers

Maps each attribute to a resource boost. Each entry requires `variable` (the resource name) and `amount` (the boost per attribute point). No `type` field is needed.

- `variable` in modifiers: `health`, or any custom resource name.
- `amount: 2` = "for every 1 point of this attribute, boost the resource by 2."

> **⚠️ Warning (`attributeStatModifiers` does NOT take a `type` field):** Each entry has only `variable` (the resource name) and `amount` (the bonus per attribute point above 10). Adding `type: "characterResources"` or any other type field is silently ignored — the entry still parses, but the extra field has no effect.

### attributeDamageModifiers

Optional. Maps attribute names to a percentage bonus applied to the player's outgoing damage. `{ "strength": 2 }` gives +2% damage per strength point — a character with strength 12 deals +24% damage. Multiple configured attributes stack multiplicatively. Negative values are ignored. Calculated on buffed attribute values.

> **📋 Note (damage modifier stacking):** `attributeDamageModifiers` applies a global percentage multiplier to all outgoing damage and stacks with — but does not replace — the existing per-skill attribute damage bonus for combat skills. The per-skill bonus is `max(0, floor((effectiveAttr - 6) / 2))` added directly to damage, calculated from whichever attribute the skill uses. The global modifier applies on top of that. Both scale with the same buffed attribute value.

### attributeDamageReductionModifiers

Optional. Maps attribute names to a percentage reduction in incoming damage to the player. `{ "dexterity": 1 }` gives -1% incoming damage per dexterity point — a character with dexterity 14 takes 14% less damage. Multiple attributes stack multiplicatively. Negative values are ignored.

> **📋 Note (renamed field):** This field was previously called `attributeEvasionModifiers`. The behaviour is identical; only the key name changed. Update any older world that still uses the old key.

Keys in both modifier maps must match an entry in `attributeNames` exactly. A misspelled or unknown key (e.g. `strenght`) is silently ignored by the engine and contributes nothing, so the validator flags any key not found in `attributeNames`.