---
tab: "world"
section: "npcTypes"
title: "NPC Types (Advanced)"
kind: "schema"
summary: "NPC types define behavior templates for categories of NPCs. Each type lists `vulnerabilities`, `resistances`, and `immunities` to `skills` and damage types."
order: 120
advanced: true
uiLocation: "World → Advanced → NPC Types"
uiSubtitle: "\"Optional pre-defined NPC types that the AI references for variety\""
editor: "JSON + ADD ITEM"
related: "npcs - individual NPCs reference a type via `type`"
---

## Example

```json
{
  "character": {
    "name": "character",
    "vulnerabilities": [],
    "resistances": [],
    "immunities": [],
    "description": "A mortal being - human, elf, dwarf, or other standard species. Standard damage, social, and effect rules apply."
  },
  "humanoid_enemy": {
    "name": "humanoid_enemy",
    "vulnerabilities": ["persuasion", "intimidation", "deception"],
    "resistances": [],
    "immunities": [],
    "description": "Mortal adversaries - bandits, rogue soldiers, corrupt officials. Fully subject to social manipulation and fear. Standard combat tactics apply. Can be talked down, bribed, or scared off."
  },
  "undead_shambling": {
    "name": "undead_shambling",
    "vulnerabilities": ["holy magic", "fire"],
    "resistances": ["slashing", "bludgeoning"],
    "immunities": ["intimidation", "persuasion", "deception", "medicine"],
    "description": "Mindless undead - skeletons, zombies, revenants without will. Immune to social effects and fear. Vulnerable to consecrated attacks and fire. Cannot be reasoned with or bargained with."
  },
  "humanoid_cultist": {
    "name": "humanoid_cultist",
    "vulnerabilities": ["arcana", "insight"],
    "resistances": ["persuasion"],
    "immunities": ["intimidation"],
    "description": "Devoted fanatics. Their belief makes them immune to fear and resistant to conventional persuasion. Arcane knowledge can exploit gaps in their ritual understanding; Insight can expose internal doubts."
  }
}
```

## Fields

### description

`description` - baseline behavior summary: how this creature type behaves socially and in combat, what motivates it, and how it perceives the player. This is the template the narrator applies to every NPC of this type before the individual NPC's `basicInfo` supplements it.

> **📋 Note (`npcType.description` as a `generateNPCDetails` instruction channel):** Because `npcType.description` is read by the narrator during `generateNPCDetails`, it functions as an instruction channel for that task across every NPC of the type. Directives embedded in the description -- such as formatting rules, required detail categories, or generation constraints -- apply consistently to all NPCs of that type without repeating them in each individual NPC's `basicInfo`. This is additive to the behavioral template role: the same field can describe how the type behaves and instruct how its detail generation should be structured.

## Behaviour

### When to create a type

**Create an NPC type only when:**

- Multiple NPCs share the same damage profile (vulnerabilities / resistances / immunities), or
- The type represents a species, creature category, or profession that more than one NPC will inhabit

No baseline type is required. A world where every NPC is a unique individual (no shared damage profiles) is fine with zero `npcTypes` entries and `type: ""` on every NPC. The section is optional.

### Damage multipliers

| Category | Multiplier | Effect |
|----------|------------|--------|
| `vulnerabilities` | 1.5x | +50% damage taken |
| `resistances` | 0.5x | -50% damage taken |
| `immunities` | 0x | No damage taken |

### Damage type inheritance

An NPC with `type: "goblin"` looks up `npcTypes.goblin` and receives the **union** of the type's damage arrays plus its own:

- effective vulnerabilities = `npcType.vulnerabilities ∪ npc.vulnerabilities`
- effective resistances = `npcType.resistances ∪ npc.resistances`
- effective immunities = `npcType.immunities ∪ npc.immunities`

NPCs with `type: ""` use only their own arrays -- no inheritance happens. Use a typed NPC for shared damage profiles, and a typeless NPC when a one-off character needs a unique profile.

### Resistance stacking

Multiple resistances against the same damage type **multiply** rather than add. A 0.5x resistance from the npcType combined with a 0.5x resistance on the NPC itself equals `0.5 × 0.5 = 0.25x` total damage taken (75% reduction). The same multiplicative rule applies to vulnerabilities and immunities.

> **🐛 Common mistake:** Values in `vulnerabilities`, `resistances`, and `immunities` must match strings verbatim from `combatSettings.damageTypes`. Approximate matches do not work -- `"poison"` is not valid if `"poisoning"` is in the list; `"frost"` is not valid if only `"ice"` is defined. Always copy the exact strings from your `damageTypes` list. Entries that don't match are silently ignored.

### Species ability inheritance

When you define a creature species as both an `npcType` (so NPCs can be assigned to it via `type`) and a `trait` (so players can choose it at character creation), the species trait should include 3 abilities representing that species' innate capabilities. NPCs assigned that `type` should also have those same 3 abilities in their `abilities` array. This keeps species mechanics consistent between player and NPC versions of the same species - a player Elf and an NPC Elf both have access to the same innate abilities.

> For guidance on populating vulnerabilities/resistances/immunities see [Authoring Guide > NPC Types](/world/npcTypes#npc-types-vulnerabilities-resistances-immunities).

## Authoring tips

### NPC Types - Vulnerabilities, Resistances, Immunities

The `vulnerabilities`, `resistances`, and `immunities` arrays on `npcTypes` are matched by the AI against two specific vocabularies during combat and challenge resolution:

1. The **skill names** defined in your world's `skills` collection.
2. The **damage type** strings listed in `combatSettings.damageTypes`.

The AI cannot infer custom categories. A value like `"blade combat"` or `"ranged combat"` will not match anything unless those exact strings exist as skill names or damage types -- the matching is literal, not semantic. **Populate these arrays with values that already exist in your skills or damage types, or the arrays will have no mechanical effect.**

How you stock those skills/damage types is entirely a world-design choice. A high-fantasy scenario will use a different skill vocabulary than a modern slice-of-life world, which uses a different one than a sci-fi or superhero scenario. Build the skill set that fits your scenario's genre first, then design NPC type vulnerabilities/resistances around it.

**Example: a D&D-flavored fantasy skill set** (illustrative -- not the recommended default, just one workable configuration among many):

| Type | Vulnerable to | Resistant to | Immune to |
|---|---|---|---|
| character | - | - | - |
| beast | athletics, nature | - | arcana |
| undead | religion, radiant | necrotic, cold | poison, persuasion |
| construct | crafting, arcana | physical | charm, poison |
| elemental | (element-specific) | (element-specific) | exhaustion |
| spirit | arcana, religion | physical | poison, charm |
| humanoid_enemy | intimidation, deception | - | - |
| humanoid_cult | religion | arcana | - |

A modern slice-of-life world might leave these arrays empty entirely (combat is rare or absent) or carry social vulnerabilities -- e.g. a celebrity NPC vulnerable to `social_media`, resistant to `intimidation`. A sci-fi world might have a `cybernetic_soldier` type vulnerable to `hacking` and resistant to `kinetic`. The pattern is the same; the vocabulary changes with the genre.