---
tab: "mechanics"
section: "death"
title: "Death Rules"
kind: "schema"
summary: "Defines what happens when a character's health hits zero. `permadeath` controls whether `death` is permanent; `instructions` is prose fed directly to the narrator describing the downing and recovery process."
order: 60
advanced: false
uiLocation: "Mechanics → Death Rules"
uiSubtitle: "\"What happens when characters die\""
editor: "JSON only"
related: "resourceSettings - HP is a resource; when it reaches 0 these death rules apply; triggers - triggers can intercept or modify death events"
---

## Example

```json
{
  "permadeath": false,
  "instructions": "When health reaches 0, the character is downed but not immediately dead. An ally may stabilize them with a DC 10 Medicine check or a Healer's Battlefield Medicine ability. If no ally is present, a Con save DC 10 may allow the character to stabilize on their own. Recovery costs narrative time and may shift faction standings. If the character is captured rather than killed, describe the capture cinematically. True death requires a second triggering event while already downed, or a dramatically appropriate final moment."
}
```

> **📋 Note:** `death.instructions` carries the rules for this world's consequences of failure - whether downing leads to capture, a mercy round, permadeath, or something else. Treat it as director's notes for the dramatic moment of a playthrough; the exact firing semantics are not formally documented.

**Design note:** The two-stage downing pattern above (downed → possible capture → true death only on a second event) creates story texture: it gives you scenes of imprisonment, interrogation, and escape rather than immediate game-over. Keep `permadeath: true` only for challenge-mode scenarios where the tension of real stakes is the whole point.

**Size limit:** `death.instructions` is capped at **{limit:deathInstructions} characters**.