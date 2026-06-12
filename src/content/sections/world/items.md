---
tab: "world"
section: "items"
title: "Items"
kind: "schema"
summary: "Items are the objects players can carry, equip, and use. During play all `items` are AI-generated, but every item that can appear in a `startingItems` list - on a trait, story start, or `itemSettings` - must be defined here first."
order: 50
advanced: false
uiLocation: "World → Items"
uiSubtitle: "\"Pre-defined items\""
editor: "JSON + ADD ITEM"
related: "traits - traits can grant `startingItems`; itemSettings - governs equipment slots and currency"
---

## Example

Equippable item (weapon — has `slot` and `bonuses`):

```json
{
  "Iron Longsword": {
    "name": "Iron Longsword",
    "category": "Weapon",
    "description": "A well-balanced military sword of standard construction. Reliable and unadorned.",
    "bonuses": [
      { "type": "stat",  "variable": "damage",    "value": 3 },
      { "type": "skill", "variable": "athletics", "value": 5 }
    ],
    "slot": "Weapon"
  }
}
```

Readable item (book — has `mediaContent`, no `slot` or `bonuses`):

```json
{
  "Petitioner's Ledger": {
    "name": "Petitioner's Ledger",
    "category": "Readable",
    "description": "A clothbound journal showing wear at the spine and corners. The ink on the visible pages has faded unevenly, as if the book has been opened to the same passages many times.",
    "bonuses": [],
    "mediaContent": "Entry, third week of the rains. Two more petitions today, both refused at the gate before they reached the council. The clerks now sort them by district before forwarding -- meaning Lower District grievances never leave the antechamber. I have begun keeping copies. If anyone asks, I am compiling a clerical reference."
  }
}
```

## Fields

### Bonus types

| type | variable | effect |
|---|---|---|
| `skill` | skill name - must match a key in [`skills`](/mechanics/skills) | adds to skill roll |
| `attribute` | attribute name - must match a name in [`attributeSettings.attributeNames`](/mechanics/attributeSettings) | adds to attribute score |
| `resource` | resource name - must match a key in [`resourceSettings`](/mechanics/resourceSettings) | adds to resource max |
| `stat` | `damage` | +10% damage output per point (1 damage = +10%, 10 damage = +100%). Use small values. |
| `stat` | `armor` | reduces incoming damage by `armor / 1000` per point (each point = 0.1% reduction), capped at 90%. 900 armor reaches the cap; values above 900 are wasted. Use small values. |

> **📋 Note:** `"armor"` and `"damage"` are the only valid `stat` values.

> **📋 Note:** Custom stats (dodge, crit rate, block, initiative, etc.) have no native schema field. If you want a dodge or parry mechanic, document the rule in the item's `description` and reinforce it in `aiInstructions.generateActionInfo`. The narrator will honor it in play. The difference from native `stat` bonuses is that no engine math backs it - the narrator is making all the judgment calls.

> **⚠️ Warning:** `bonus.variable` values are cross-checked against the relevant collection. An attribute bonus with `"variable": "strenght"` (typo) will fail validation.

### category

Must match a value in `itemSettings.itemCategories`.

### slot

Optional. Must match a slot in `itemSettings.itemSlots` when present. For most items, slot and category match. Exception: armor uses `category: "Armor"` with a body-region slot. The conventional 7-slot armor vocabulary is `"head"`, `"chest"`, `"shoulders"`, `"hands"`, `"waist"`, `"legs"`, `"feet"` (lowercase). Not engine-enforced -- slot strings remain world-defined -- but it is the layout authoring tooling assumes and the inventory UI groups cleanly when used consistently.

### mediaContent

Conditional string. Required for `Readable` items (books, letters, scrolls). Contains the full text the player sees when they read or inspect the item. Leave absent for all other item categories. Item names on Readable items must be precise so the engine can match them at read time.

### Item stacking

Currency items (whose `name` matches `itemSettings.currencyName`) stack by name and category only - the engine ignores bonus values when merging currency stacks. Non-currency items must match all properties (name, category, bonuses, effects) to stack. Two swords with different bonus values are separate inventory entries even if both are named "Iron Sword." Items do not need to be equipped to be *used*, but only equipped items grant mechanical bonuses.

### Key/name match

Item outer keys must be the exact display name string, identical to the inner `name` field. `"Iron Longsword"` not `"iron_longsword"`. Using snake_case or slug keys causes "Key/name mismatch" errors for every affected item. When building items programmatically, always use `{item["name"]: item}` to key the dict — never generate slugs. A mismatch does not break JSON validity but causes the editor to reject the import.

> All outer keys in every keyed map must exactly equal the inner `name` display string. This applies to items, [npcs](/world/npcs), quests, traits, [traitCategories](/mechanics/traitCategories), [factions](/world/factions), [locations](/world/locations), [regions](/world/regions), and npcTypes.

### Size limit

The entire `items` section (pretty-printed with `indent=2`) must be under **{limit:itemsSection} characters**. Stay within budget by:

- Keeping `description` fields under 150 characters for common items; unique or special items can run 250-350 characters
- Measure before import: `len(json.dumps(d["items"], indent=2))` must be < {limit:itemsSection}

## Authoring tips

### Description prose

The `description` is what the AI uses when the item appears in play — it should read like a narrator would say it, not like a tooltip. "A well-balanced military sword, standard issue for the city guard" gives the AI setting context and narrative flavor. "Deals 1d8 piercing damage" does nothing useful because the AI already knows how swords work. Keep descriptions short and evocative; the mechanics live in `bonuses`.

Items that aren't in `startingItems` anywhere still exist and can appear organically in AI narration. The difference is you can't guarantee players will find them. Pre-defining items matters most for starting gear and any item with specific mechanical bonuses you need to be precise about.

### Equippable item rules

Equippable items must have a `slot` field. Non-equippable items (consumables, currency, miscellaneous) omit it.

Skill and attribute bonuses on equippable items are common — cloaks, boots, and gloves granting +1 to stealth or perception are standard practice. Not all equippable items need to use the `armor` stat type.

### Armor formula and tier values

Common armor values by tier: light (leather, cloth) 5-15, medium (chain, scale) 20-50, heavy (full plate) 60-100+. The formula reduces incoming damage by `armor / 1000` per point — a value of 100 means 10% reduction. Values above 900 are wasted.

### Level-difference damage reduction

When attacker and defender are at different `level` values, the engine grants additional damage reduction to the higher-level side on top of `armor`. The per-level step diminishes (5% at +1, 4.5% at +2, ..., 0.5% at +10) and is clamped at +11; cumulative cap is **27.5%** at a 10-level gap.

| Level diff | Per-step | Cumulative |
|---|---|---|
| 1 | 5.0% | 5.0% |
| 2 | 4.5% | 9.5% |
| 3 | 4.0% | 13.5% |
| 4 | 3.5% | 17.0% |
| 5 | 3.0% | 20.0% |
| 6 | 2.5% | 22.5% |
| 7 | 2.0% | 24.5% |
| 8 | 1.5% | 26.0% |
| 9 | 1.0% | 27.0% |
| 10 | 0.5% | 27.5% |
| 11+ | 0% (clamped) | 27.5% |

Practical consequence: a high-level NPC shrugs off attacks from lower-level players (and vice versa) by up to 27.5%, but the bonus stops growing once the gap reaches 10 levels — so a level-30 NPC takes the same level-based reduction from a level-20 attacker as from a level-1 attacker.

### Hidden damage variance

On top of `armor` and level-difference reduction, the engine applies a hidden variance step to each hit — not a literal dice roll, but functionally the same — that can shave off up to 40 from the incoming damage. The result is that two otherwise-identical hits can land for noticeably different amounts of damage even when no other modifiers change. Plan damage values with this swing in mind; a weapon that needs to one-shot something at full bonus probably won't reliably do so once the variance subtracts from it.

### Impact

Every attack carries an **impact** value from 50 to 200 (100 = normal) that the AI assigns per-attack based on how the action is described, then multiplies the attack's damage by `impact / 100`. It applies to both player and NPC attacks, so a vividly described heavy blow lands harder than a glancing one.

| Impact | Multiplier |
|--------|------------|
| 50 | 0.5x |
| 100 | 1.0x |
| 150 | 1.5x |
| 200 | 2.0x |

### Evasion (defend action)

A character that takes a **defend / evade action** on a turn reduces the incoming damage of attacks against them that turn. The reduction scales with how well the defend roll succeeds; a reduction of 1.0 or higher fully nullifies the hit (it lands but deals 0). This is an active, per-turn choice driven by the defend roll, not a passive stat — and a successful player defend also degrades the attacking NPC's success roll.

### Damage values

+1-3 for common weapons, +5-10 for named/enchanted weapons, +15-25 for legendary items. These are flat bonuses to damage output percentage (each point = +10%).

### Starting items

- Give each character-creation trait (whatever your world calls them -- Race, Class, Background, Profession, Origin, Faction, etc.) its own `startingItems`. Players should feel their choices materialize in inventory immediately.
- Match the items to the trait's identity. In a D&D-style fantasy world that might mean a sword and shield for a fighter, a spellbook for a wizard, lockpicks for a rogue. In a modern scenario it might be a smartphone and press pass for a journalist, a toolbox for a mechanic, a sidearm and badge for a cop. The pattern is "items signal role at first sight" -- the genre vocabulary is whatever fits your world.
- Avoid giving the same item across multiple traits -- redundant items waste inventory space.