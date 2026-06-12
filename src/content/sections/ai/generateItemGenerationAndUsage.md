---
tab: "ai"
section: "generateItemGenerationAndUsage"
title: "Item Generation/Usage"
kind: "schema"
summary: "Provides context to generateItemDefinitions (newly created `items`) and generateItemUpdates (inventory changes). Not included for `generateActionInfo` or `generateStory`. The JSON key is `ItemGenerationAndUsage` — non-standard casing."
order: 200
advanced: false
uiLocation: "AI Tasks → Item Generation/Usage"
uiSubtitle: "\"Item Generation/Usage Instructions\""
editor: "Graphical form (labeled textareas)"
related: "items - the item records this task shapes; generateActionInfo - put item-use combat rules here, not in this task"
---

## Schema

```json
{
  "aiInstructions": {
    "ItemGenerationAndUsage": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "ItemGenerationAndUsage": {
      "custom": "## Inventory changes\nADD: item physically enters possession — picked up, looted, gifted, crafted, or found.\nREMOVE: item physically leaves — consumed, handed over, destroyed, stolen, or lost.\n\nNEVER update for items merely seen, discussed, offered, displayed, inspected, or nearby. Awareness is not possession.\n\n## Transaction rule\nA purchase requires two conditions in sequence: (1) a price is stated, AND (2) the player explicitly pays or agrees AFTER hearing the price. Do not add a purchased item until both conditions occur in the same scene.\n\n## Loot tiers\nCommon enemies: consumables and coin only. Named enemies: one item appropriate to their role. Elite or boss: one item worth keeping long-term, plus coin."
    }
  }
}
```


## Fields

### custom

The only key, under the non-standard-cased `ItemGenerationAndUsage`. **Asymmetric injection:** `generateItemDefinitions` reads the full block; `generateItemUpdates` reads **only the `.custom` subkey** — other named keys you add under `ItemGenerationAndUsage` do not reach `generateItemUpdates`.

## Authoring pattern

Cover in `custom`:

- **Inventory trigger rules and the transaction gate are the most critical content in this key.** Without them the engine adds items when the player browses a shop or hears an item described, and completes purchases before the player agrees.
- Loot rarity guidance and how drops should scale with enemy tier.
- Item description framing: what level of detail new item definitions should have.
- World economy calibration: relative cost of goods, how scarce certain item types are.
- How newly materialized items should be framed (flavour first, mechanics second).

> **Combat rules belong in `generateActionInfo`.** Item-use rules that must affect combat resolution (e.g. "this potion heals 20 HP mid-combat") belong in [`generateActionInfo`](/ai/generateActionInfo), not here.
