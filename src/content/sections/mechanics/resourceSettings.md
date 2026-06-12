---
tab: "mechanics"
section: "resourceSettings"
title: "Resources"
kind: "schema"
summary: "Resources are the tracked bars in your game - `health` is required, everything else (mana, stamina, corruption, etc.) is optional. Each resource defines a current/max value, UI bar color, recharge rate, and usage instructions for the narrator."
order: 20
advanced: false
uiLocation: "Mechanics → Resources"
uiSubtitle: "\"Character resources like health, mana, etc.\""
editor: "JSON + ADD ITEM"
related: "abilities - abilities can have resource costs; triggers - triggers can gain or drain resources; Death) - HP resource governs the death threshold"
---

## Example

```json
{
  "health": {
    "name": "health",
    "initialValue": 80,
    "maxValue": 80,
    "rechargeRate": 1,
    "restRechargeMultiplier": 1,
    "color": "#ef4444",
    "gainPerLevel": 10,
    "isHealth": true,
    "usageInstructions": "### Health\nHealth is lost when the character takes a direct physical strike or injury — not for environmental atmosphere or narrative lingering.\n\n### Deduct when\n- Minor wound: 5-15\n- Serious wound: 15-35\n- Near-fatal injury: 35-60\n\n### Do not deduct when\n- The scene describes wounds aching or lingering from a prior turn without a new strike\n- The environment is dangerous but no specific hit connects\n- The character is unconscious, being carried, or stabilized\n- An NPC is describing past damage\n\n### Recovery\n- Rest in a safe location: 50-80% restored\n- Medical treatment: additional 10-30 on top of rest"
  },
  "mana": {
    "name": "mana",
    "initialValue": 40,
    "maxValue": 100,
    "rechargeRate": 0,
    "replenishOnLongRest": true,
    "restRechargeMultiplier": 1,
    "canCost": true,
    "color": "#8b5cf6",
    "gainPerLevel": 5,
    "isHealth": false,
    "usageInstructions": "### Mana\nMana is spent when actively channeling or casting — not when magic is mentioned, discussed, or witnessed.\n\n### Cost by scale\n- Minor cantrip or passive effect: 0\n- Standard spell or ability: 5-10\n- Powerful multi-target or sustained effect: 15-25\n- Legendary or world-altering: 30+\n\n### Do not deduct when\n- The character perceives, identifies, or describes magic in the environment\n- An NPC casts a spell at the character\n- Magic is discussed in conversation without active use\n\n### Recovery\n- Full recovery on long rest\n- Half recovery on short rest for primary magic class only\n- Overdrawing (below 0): the character takes 2d6 damage and cannot cast until they rest"
  }
}
```

## Fields

### name

string. Display name.

### initialValue

number. Starting value before attribute modifiers.

### maxValue

number. Hard cap. **Avoid `0`** - setting `maxValue: 0` on any resource may cause NaN XP on quest completion, which collapses to null and triggers a level-up every turn. Unconfirmed engine bug, but observed in worlds with zero-max resources. Use a non-zero value even for resources not intended to be spent.

### rechargeRate

**integer**. Per-turn recovery. Codec type is `Int` - must be a whole number, not a float. **Negative values produce a confirmed drain effect** - the resource decreases by that amount each turn. Useful for status effects and passive resource decay.

### replenishOnLongRest

boolean. Mechanically refills the resource to its max when a Long Rest action is completed. Extra-codec - accepted but not validated.

> **📋 Note (`replenishOnLongRest`):** Extra-codec - not in the formal schema but accepted by the engine. The codec-validated equivalent is `restRechargeMultiplier` (a number): `1.0` = full refill, `0.5` = half, `0` = no rest recovery. Use `restRechargeMultiplier` as the primary mechanism. State the same rule in `usageInstructions` ("Refills to maximum on Long Rest.") for prose-level clarity.

### restRechargeMultiplier

number. Fraction restored on rest: `1`=full, `0.5`=half, `0`=none.

### canCost

boolean. `false` = engine and UI prevent this resource from being selected as a cost for abilities. Use for trackers that accumulate rather than get spent. Extra-codec - accepted but not validated.

> **📋 Note (`canCost`):** Extra-codec - not in the formal schema but accepted by the engine. Set `false` to mark a resource as accumulation-only (cannot be spent by ability costs). Reinforce the rule in `usageInstructions` for prose clarity ("This resource only ever increases - it cannot be spent or reduced by ability costs.").

### color

string. Hex color for UI bar.

### gainPerLevel

number. Max increase per level-up. **Required for custom resources - use `0` if non-scaling.**

### isHealth

boolean. Optional. `true` for the HP bar only. Extra-codec on non-health resources.

### usageInstructions

string. Optional. Markdown given to AI explaining behavior. Include: what raises/lowers it, threshold consequences.

"You can add up to 9 resource bars." Any additional resources (like `mana`) are added as sibling entries inside `resourceSettings`.

## Authoring tips

### Writing usageInstructions

**On `usageInstructions`:** This is the most important field in a resource definition — it's the prose that actually reaches the AI. A well-structured entry follows a consistent three-part pattern:

1. **Scope sentence** — what actions consume this resource. "Mana is consumed when actively channeling magical energy." "Stamina is spent on physically demanding actions."
2. **Cost tiers** — a bulleted list mapping action types to numeric ranges. Minor / Moderate / Major / Extreme is a standard set; use whatever fits the resource.
3. **"Do not deduct when" list** — explicit guard rails. Without this, the AI may subtract health for passive atmosphere ("the wound aches as you walk"), subtract mana for mentioning magic, or drain stamina for a light conversation. List the specific non-triggering conditions: "when unconscious or carried," "when environment is generally dangerous but no specific strike occurs," "during dialogue with no physical exertion."

Recovery rules belong in `usageInstructions` prose for anything beyond the simple schema fields — partial rest recovery, conditional recovery zones, overdraw penalties.

### Recovery mechanics not natively supported

**Recovery mechanics the schema does not support natively:** short rest recovery (partial, class-specific), conditional recovery (only if the player meditates / only in a safe zone), overflow (gaining more than max and banking the excess), and spending one resource to restore another. All of these are achievable via `usageInstructions` - write the rule as plain prose and the narrator applies it. Example: "Recovers fully on Long Rest. Recovers 50% on Short Rest for the primary magic class only. Cannot recover inside the Scar Zone." The engine won't enforce it mechanically, but the narrator reads and follows it.

### Thematic tracker resources

**Thematic tracker resources** (Influence, Reputation, Luck, Favour) use a specific pattern: `rechargeRate: 0`, `restRechargeMultiplier: 0`, `canCost: false`, and `usageInstructions` describing what narrative events increase or decrease the value. These are not "bars" in the traditional sense — they are narrative state trackers that the AI manages through events rather than spending. Define how they increase, what they represent at different values, and what happens when they hit floor or ceiling.

## Player HP formula

**Player HP formula:** When a resource has `isHealth: true`, the engine derives player HP from its codec fields plus an engine-constant milestone bonus:

```text
Player HP at level L = maxValue + gainPerLevel * (L - 1) + milestoneHealthBonus
milestoneHealthBonus = floor(L / 5) * 5    // engine constant; not configurable
```

`maxValue` is the level-1 maximum, not an absolute cap; per-level growth comes from `gainPerLevel`, and every 5 character levels grants an additional `+5 HP` milestone. Players also receive `+2 damage` on the same milestone schedule (engine constant; lives in combat math, not a resource field).

Example: with `maxValue: 80`, `gainPerLevel: 10`, level 20 → `80 + 10*19 + floor(20/5)*5 = 80 + 190 + 20 = 290 HP`.