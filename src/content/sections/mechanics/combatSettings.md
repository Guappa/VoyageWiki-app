---
tab: "mechanics"
section: "combatSettings"
title: "Combat Settings (Advanced)"
kind: "schema"
summary: "Numeric tuning for the combat system: XP rewards for defeating enemies, ability recharge timing, ability effectiveness bonus, NPC daily healing, and the canonical list of valid damage types for your world."
order: 110
advanced: true
uiLocation: "Mechanics → Advanced → Combat Settings"
uiSubtitle: "\"Combat settings and their mechanics\""
editor: "JSON only"
related: "skills - damage types must align with skill names; abilities - ability bonuses interact with combat resolution; npcs - NPC tier controls HP multipliers and damage output"
---

## Example

```json
{
  "minCombatXP": 1,
  "baseCombatXP": 100,
  "abilityCooldown": 20,
  "abilityBonus": 10,
  "npcDailyHealingAmount": 999,
  "damageTypes": [
    "piercing", "slashing", "bludgeoning", "poisoning",
    "fire", "lightning", "wind", "water",
    "arcane", "light", "dark", "psychic"
  ]
}
```

## Fields

### abilityCooldown

global multiplier applied to every ability's per-ability `cooldown` value. The engine resolves cooldown as `effectiveCooldown = cooldown * combatSettings.abilityCooldown`. Setting `abilityCooldown: 0` means every ability is effectively cooldown-free no matter what each ability's own `cooldown` field says -- raise the global modifier (and set non-zero per-ability `cooldown` values) to introduce timing pressure. Balanced default: `20`.

### abilityBonus

global multiplier applied to every ability's per-ability `bonus` value. The engine resolves the contribution as `effectiveBonus = bonus * combatSettings.abilityBonus`. This contribution participates in the same success cap as skills, attribute bonuses, and context modifiers via `skillSettings.maxSkillSuccessLevel` -- a high `abilityBonus` does not bypass the cap, it consumes space within it. When designing ability bonuses, keep the sum of a typical ability `bonus * abilityBonus` plus expected skill and attribute contributions well below `maxSkillSuccessLevel`. Balanced default: `10`.

### npcDailyHealingAmount

> **📋 Note (`npcDailyHealingAmount`):** Health NPCs recover by this amount per in-game day -- not tied to the Long Rest mechanic specifically. Setting this to a high value (e.g. 999) effectively means any NPC recovers fully between encounters, preventing NPCs from remaining at low HP permanently across sessions.

> **📋 Note (`isHealth`):** The codec-validated way to designate the health resource is `isHealth: true` on the resource entry in [`resourceSettings`](/mechanics/resourceSettings) - the engine reads that flag to identify the primary HP pool.

### damageTypes

> **📋 Note (`Custom damage types`):** Adding a type like `"radiant"` or `"necrotic"` to `damageTypes` makes it a valid value in `npcTypes` `vulnerabilities`, `resistances`, and `immunities`. The engine math - increased or decreased damage for matching types - applies there. Beyond that, the damage type has no automatic behavior: it does not change how abilities deal damage, does not trigger elemental effects, and does not carry secondary rules (e.g. `"poison"` does not automatically inflict a poisoned condition). Any secondary behavior has to be defined explicitly in ability `description` text and narrator instructions in `generateActionInfo`.

> **🐛 Common mistake (matching is case-sensitive and unnormalized):** Damage type matching against `npcTypes` `vulnerabilities`, `resistances`, and `immunities` is exact and case-sensitive — `"Fire"` and `"fire"` are different types, and a mismatch fails silently (full damage, no warning). Use the same lowercase ASCII strings everywhere you reference a damage type, and avoid accented or non-ASCII characters, which break matching the same silent way.