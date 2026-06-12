---
tab: "world"
section: "realms"
title: "Realms (Advanced)"
kind: "schema"
summary: "A realm is the top-level container for your `regions` - the world, country, or dimension the story takes place in. Most scenarios need exactly one. Use multiple `realms` only for true planar or dimensional scenarios."
order: 130
advanced: true
uiLocation: "World → Advanced → Realms"
uiSubtitle: "\"The highest level of organization in your setting (world, plane of reality, etc.)\""
editor: "JSON + ADD ITEM"
related: "triggers - realm travel requires a two-step trigger pair"
---

## Example

```json
{
  "The Compact": {
    "name": "The Compact",
    "basicInfo": "The Compact is the largest of several post-war successor realms, ruled from the Capital by the Merchant Council since the end of the Old War sixty years ago. Most of its population live in the Heartland between the Capital and the Coast; the Frontier to the north is contested woodland still mapped from before the war. Stable enough that ordinary people travel its roads without armed escort, brittle enough that everyone who pays attention is quietly preparing for the day the Council loses its grip.",
    "known": true
  }
}
```

## Fields

### known

**Realm access:** players can only access [locations](/world/locations) inside **known** realms. Realms default to `known: true` unless the config explicitly sets `known: false`. Use `known: false` for realms the player must discover through gameplay. Revealing a realm does not also reveal its regions or locations.

## Structure

### Realm reference rule

Every `realm` string referenced in your `regions` objects must have a corresponding entry here.

### Parallel realms

**Parallel realms:** regions at the same `(x, y)` coordinates in different realms can represent parallel locations -- a place and its shadow reflection, a city and its dream-state mirror. The grid is per-realm, so the same coordinate is reusable across realms.

## Behaviour

### Realm travel

> **⚠️ Warning:** Moving players between realms requires a two-step trigger pair, not a simple effect. See [Realm Travel Pattern](/mechanics/triggers#realm-travel-pattern) on the Triggers page for three documented methods (intent override + realm_sync, two-trigger portal, route-map).

### Revealing or hiding a realm via trigger

**Revealing or hiding a realm via trigger** -- two effect types work:

```json
{ "type": "known-entity", "entity": "Shadow Realm", "operator": "set", "value": true }
```

```json
{ "type": "party-realm", "operator": "set", "value": "Shadow Realm" }
```

The `party-realm` effect moves the party into the realm directly and auto-reveals it.

### Per-realm AI behaviour

> **📋 Note:** Multi-realm worlds where AI generation needs to behave fundamentally differently per realm (different geography rules, factions, creatures) can branch on `currentRealm` directly inside `aiInstructions` tasks. See [Conditional game-state routing](/appendix/ai-advanced-techniques#conditional-game-state-routing) in the Advanced AI Techniques appendix.