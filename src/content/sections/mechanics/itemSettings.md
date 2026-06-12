---
tab: "mechanics"
section: "itemSettings"
title: "Item Settings"
kind: "schema"
summary: "Defines the equipment system: the name of your currency, the item categories that exist, the equipment slots characters have, and the `items` given to every player at the start of every game regardless of trait or story start."
order: 70
advanced: false
uiLocation: "Mechanics → Item Settings"
uiSubtitle: "\"Item settings and their mechanics\""
editor: "JSON only"
related: "items - items must be pre-defined there before being referenced here; storyStarts - `startingItems` on starts and traits draw from the items catalog; traits - traits can also grant `startingItems`"
---

## Example

```json
{
  "currencyName": "Gold",
  "itemCategories": ["Armor", "Consumable", "Focus", "Helmet", "Offhand", "Tool", "Trinket", "Weapon"],
  "itemSlots": [
    { "slot": "Weapon", "category": "Weapon", "quantity": 1 },
    { "slot": "chest", "category": "Armor", "quantity": 1 },
    { "slot": "head", "category": "Helmet", "quantity": 1 },
    { "slot": "offhand", "category": "Offhand", "quantity": 1 },
    { "slot": "tool", "category": "Tool", "quantity": 2 },
    { "slot": "Focus", "category": "Focus", "quantity": 1 },
    { "slot": "trinket", "category": "Trinket", "quantity": 2 },
    { "slot": "pouch", "category": "Consumable", "quantity": 4 }
  ],
  "startingItems": [
    { "item": "Gold", "quantity": 50 }
  ]
}
```

## Fields

### itemSlots

slot and category usually match. Exception: the `pouch` slot above uses `category: "Consumable"` - they diverge when a physical slot name (pouch, chest, head) maps to a logical item category.

### startingItems

items given to ALL players regardless of trait/start selection.

## Authoring tips

### Equipping items

"You don't have to equip an item to use it. There are 2 reasons to make an item equippable: (1) magic bonuses only apply when equipped; (2) NPCs comment on equipped items." A dedicated `Focus` or `Trinket` slot is useful for items you want NPCs to notice and react to.

### Slot count

Creative note: "If you are making a game about being a spider that can put knives on its feet, you can let yourself have 8 weapon slots."

## Behaviour

### Slot eviction

When equipping a new item into a slot whose `quantity` is full, the engine unequips the first item already in that slot (and removes its bonuses), then equips the new item. Categories must match the slot's `category`.

### Currency stacking

items whose **`name`** matches `itemSettings.currencyName` stack on `name + category` only -- the engine ignores `bonuses` when deciding currency stacks. Non-currency items must match all properties (name, category, bonuses, effects) to stack.