---
tab: "other"
section: "tipSettings"
title: "Tip Settings (Advanced)"
kind: "schema"
summary: "Tips are player-facing messages shown periodically during play - the only section of the scenario that speaks directly to a human player rather than to the AI. Use them to surface mechanical rules the player might forget or set tonal expectations."
order: 50
advanced: true
uiLocation: "Other → Advanced → Tip Settings"
uiSubtitle: "\"Settings for displaying helpful tips to players\""
editor: "JSON + ADD ITEM"
related: "otherSettings - shares the Other → Advanced UI tab; aiInstructions - tips are the only player-facing channel, distinct from narrator instruction tasks"
---

## Example

```json
{
  "tips": [
    "Skills grow through use. The more you attempt something, the better you become at it.",
    "Faction relationships shift with your choices. How you treat an organisation's members affects how that faction sees you.",
    "Not every conflict needs to be resolved through combat. Social skills open paths that violence closes permanently.",
    "Some quests only become available after you have met the right NPCs. Exploration and conversation unlock new options.",
    "Your party NPCs have their own knowledge and perspectives. Talking to them before major decisions can reveal context you would otherwise miss.",
    "Reputation travels. A bad reputation arrives at the next safe stop before you do.",
    "Most NPCs will tell you what they want if you ask directly. Most will not volunteer it.",
    "Wounds heal slowly. A serious untreated injury becomes a worse problem within days. Find someone with the Medicine skill, or learn it yourself.",
    "Money matters less than supplies in places where the supply chain has broken. Read the room before you offer to pay.",
    "If a stranger is too friendly too fast, treat them like a stranger anyway. Trust earned is trust kept.",
    "Quests are usually time-flexible, but a few have hard deadlines spelled out by the giver. Pay attention when an NPC says when something must happen.",
    "Carrying capacity is real. A full pack slows you down and tires you out faster than an empty one."
  ],
  "tipDisplayEnabled": true,
  "tipTurnInterval": 15,
  "tipMinimumTurns": 5,
  "tipMaximumTurns": 30
}
```

## Authoring tips

### Purpose

Use them to surface mechanical rules the player might forget, hint at non-obvious choices, or set tonal expectations. This section defines the tip pool and controls display timing.

### Writing effective tips

The "Not every conflict needs to be resolved through combat" tip above is doing work: it reframes the player's default assumption before they've encountered a situation where it matters, nudging toward the scenario's intended design space.