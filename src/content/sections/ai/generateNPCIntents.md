---
tab: "ai"
section: "generateNPCIntents"
title: "NPC Intents"
kind: "schema"
summary: "Fires when the AI chooses NPC goals for a turn. Medium priority: near-constant in NPC-heavy play. Controls quality gates, escalation pacing, and per-scene-type intent logic. Supports multiple named keys for scene-type-specific behavior."
order: 320
advanced: true
uiLocation: "AI Tasks → Advanced → NPC Intents"
uiSubtitle: "\"NPC Intents Instructions\""
editor: "Graphical form (labeled textareas)"
related: "npcs - the NPCs whose goals this task controls; generateStory - Character Behavior key for persistent NPC voice rules"
---

## Schema

```json
{
  "aiInstructions": {
    "generateNPCIntents": {
      "Classifier": "string",
      "Combat Brain": "string",
      "Social Brain": "string",
      "custom": "string"
    }
  }
}
```

Any key names work — `Classifier`, `Combat Brain`, and `Social Brain` are conventions, not schema constraints.


## Example

A worked pattern — replace the world-specific tokens with your own:

```json
{
  "aiInstructions": {
    "generateNPCIntents": {
      "Classifier": "## SCENE CLASSIFICATION (MANDATORY)\nAssign exactly one before generating any intent:\n- SOCIAL: active conversation or interaction\n- PASSIVE SOCIAL: shared space, observation, light interaction\n- TENSION: argument, rivalry, emotional pressure, pre-conflict\n- DOWNTIME: resting, traveling, training lightly, routine activity\n- AFTERMATH: situation resolved, tension fading\n- COMBAT: active combat engagement\nMost scenes are SOCIAL or PASSIVE SOCIAL unless escalation occurs.",
      "Who Gets Intents": "## WHO GETS INTENTS\nNPCs must be present and aware. Automatic: NPCs directly interacting with the player. Others must pass ALL three gates:\n- URGENCY: a reason to act now\n- IMPACT: the action changes the moment\n- RELEVANCE: connected to the scene\nIf any gate fails, no intent. Background NPCs stay background.",
      "Escalation Ladder": "## ESCALATION LADDER\nneutral → aware → engaged → tense → confrontational → combat. Move one step at a time. Escalate only from player action, NPC personality, authority context, or quest state. De-escalation is common; never skip a step on the way down either. After resolution, return to a stable state naturally.",
      "Presence by Rank": "## PRESENCE BY RANK\n[Replace these tiers with your world's authority/skill ladder.]\n- Low: hesitant, reactive\n- Mid: controlled, situational\n- High: assertive, commanding\n- Elite: dominant, decisive\nPresence dictates who speaks first, who controls flow, who escalates or shuts down conflict.",
      "Scene Rules": "## SCENE RULES BY TYPE\nSOCIAL / PASSIVE SOCIAL: dialogue, reaction, minor movement; no exposition dumping.\nTENSION: verbal or social conflict first; may escalate or resolve without combat.\nDOWNTIME: supports the current activity only; no forced conflict; calm stays calm.\nAFTERMATH: no new escalation; reaction, recovery, or silence.\nCOMBAT: generate 3-5 unique intents per turn; never repeat within an encounter.",
      "Scene Integrity": "## SCENE INTEGRITY\n- Every intent must connect to something already established in Recent Story; no new threats or crises invented through intents.\n- Calm scenes stay calm; routine moments are not escalated into emergencies.\n- Urgency requires active, immediate, in-scene danger; vague caution and preemptive warnings are not valid.\n- Do not invent time pressure or impose deadlines unless an active threat demands it.\n- HiddenInfo shapes personality, not scene content; do not surface it as warnings, hints, or quest hooks in low-pressure moments.",
      "Dialogue": "## DIALOGUE RULES\n- Natural, direct tone matching the world's register.\n- No exposition, forced explanation, or cryptic speech.\n- NPCs in casual scenes talk like normal people; no briefing-style dialogue.",
      "Final Rule": "## FINAL RULE\nEach intent must be unique. Never repeat intents within the same combat sequence."
    }
  }
}
```


## Fields

### custom

The catch-all key. As the [Schema](#schema) note states, the key names here are free-form conventions rather than fixed fields — any named slot you add (the example uses `Classifier`, `Escalation Ladder`, `Scene Rules`, and others) is read as part of this task.

## Authoring pattern

The structure above sits behind several patterns worth lifting verbatim into your own world:

- **Mandatory scene classification before any logic runs.** Forcing the AI to pick a category first prevents the wrong behavior rules from firing in the wrong context. The classifier itself is short; the value comes from making it the first thing the AI commits to.
- **A three-gate filter on who gets intents.** URGENCY + IMPACT + RELEVANCE collapses "everyone in earshot reacts" into "only NPCs whose action matters right now." Without an explicit filter the model defaults to over-populating reactions.
- **Escalation ladder with one-step-at-a-time discipline.** Naming the rungs prevents jumps from `neutral` straight to `hostile` on weak provocation. The rule "never skip a step" applies both up and down the ladder.
- **Per-scene-type rule blocks.** Each scene category gets its own short rule set, anchored to the classifier. Easier for the AI to apply than a single block trying to cover every case.
- **Scene integrity rules.** The strongest defense against AI invention: "every intent must connect to something already established in Recent Story." Pair with "no new threats invented through intents" and "calm scenes stay calm" to suppress reflexive escalation.

The full set of keys ends with a one-line **Final Rule** the model treats as a hard constraint. Use this slot for the single rule you most want enforced (uniqueness, no spam, no out-of-character action).

- **Intent quality gate (universal):** before generating any intent, verify the NPC can perceive the trigger and has a reason to act *right now*, not just opportunity. No other NPC should be covering the same beat simultaneously.
