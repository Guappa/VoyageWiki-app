---
tab: "other"
section: "gameModes"
title: "Game Modes"
kind: "schema"
summary: "Player-selectable modes chosen during character creation. Each mode is a named bundle of story instructions, with an optional difficulty preset and an optional opening narrator message."
order: 35
advanced: false
uiLocation: "Other → Game Modes"
uiSubtitle: "\"User-selectable game modes with custom instructions for the storyteller\""
editor: "JSON object"
---

## Example

```json
{
  "gameModes": {
    "Adventure Mode": {
      "name": "Adventure Mode",
      "description": "A proactive run that frames the world as danger and opportunity, feeding the party concrete hooks when scenes go quiet while leaving chosen downtime alone.",
      "instructions": "## Core Feel\n- Treat the world as a place full of danger, need, wonder, and opportunity\n- Let people plausibly recognize the party as capable of helping with the kinds of problems ordinary people cannot easily solve\n\n## Pacing and Hooks\n- When the scene is open, slow, or exploratory, give the players one subtle, concrete hook they can act on\n- Prefer practical, concrete, legible hooks such as a warning, request for help, obstacle, rumor, clue, hint, missing person, monster problem, or risky opportunity\n- Favor problems with clear actors and stakes: theft, raids, missing people, local gangs, cult activity, dangerous beasts, faction disputes, armed skirmishes, personal feuds, or innocent people being threatened or harmed\n- Prefer hooks grounded in the story and existing worldlore\n- Let hooks come from local people, visible danger, player choices, existing threats, or consequences already in motion\n- Do not interrupt chosen downtime, social scenes, romance, shopping, recovery, or celebration with unrelated hooks\n- Do not insist on the same hook if it goes unpursued; follow the rule of \"one and done\"\n\n## Arrival in Mission Contexts\n- When the party arrives somewhere new, not recently described, on a job, mission, or exploration, establish what matters for play: what is visible, who is present, what looks useful, what invites investigation\n- In those job, mission, or exploration contexts, add one adventure-relevant detail when appropriate, rather than leaving the narration without forward momentum\n- Keep arrival details grounded in the location. Do not add random threats or mysteries just to create momentum\n\n## Characters and Opportunities\n- Let characters have real problems, limits, jobs, fears, loyalties, and practical needs\n- Characters may ask for help, offer paid work, share warnings, point toward trouble, or test whether the party is trustworthy\n- Keep opportunities optional. If the players decline or ignore a lead, let the scene move on\n- Respect is earned through action, but opportunity should be available to people willing to put themselves on the line"
    },
    "Survival": {
      "name": "Survival",
      "description": "A harsher run. Resources are scarce, enemies hit harder, and mistakes carry forward.",
      "instructions": "Keep tension high throughout. Make threats credible, keep resources limited, and let failures carry forward instead of resetting them.",
      "difficulty": "hard",
      "askTheNarratorPrompt": "The cold's already in your bones and the last town is two days behind you. What's the first move?"
    }
  }
}
```

## Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Display name shown to the player when selecting a mode. Matches the entry key by convention, as elsewhere in the config. |
| `description` | Yes | Short summary shown to the player alongside the name during selection. |
| `instructions` | Yes | Story instructions for the mode, appended as a user message to initial-start and story generation so they stay active for the whole run. |
| `difficulty` | No | Pre-selects a level in the shared Difficulty control when the mode is chosen. Must be one of `very easy`, `easy`, `medium`, `hard`, `very hard` (lowercase, case-sensitive). |
| `askTheNarratorPrompt` | No | The opening message the narrator posts in the narrator chat when the session begins. |

> **⚠️ Warning:** Each field has its own hard character cap, enforced by the editor on top of the whole-section limit: `name` {limit:gameModeName}, `description` {limit:gameModeDescription}, `instructions` {limit:gameModeInstructions}, `askTheNarratorPrompt` {limit:gameModeAskTheNarratorPrompt}. A field over its cap fails validation.


## Behaviour

### Overview

A mode is really just a set of instructions handed to the storyteller, so it can carry whatever axis of variation suits the world: a difficulty ladder (a gentler run versus a punishing one), or a tonal or genre shift (a grim, serious telling versus a comedic one) of the same setting. Set `gameModes` to `{}` or omit it to offer no custom modes.

### Selection

The player picks a mode in the Game Settings step of character creation, before choosing a story start, and can change it later from the in-game settings. Modes are shown as cards listing their `name` and `description`. A mode does not replace or rename the narrator; the in-game narrator is always "Narrator" regardless of which mode is chosen.

### instructions

`instructions` are appended as a **user message** to both initial-start and story generation, not as a system prompt override, so they steer narration for the entire run rather than only the opening scene. Write it as a full multi-section markdown brief stored as a single string (newlines written as `\n`), not a one-line summary.

> **📋 Note:** `instructions` carries real weight and accepts markdown. Author it as a focused, structured brief (sections, bullets, explicit do and do-not rules), closer to an [`aiInstructions.generateStory`](/ai/aiInstructions) block than a tagline. A one-sentence mode steers almost nothing.

### askTheNarratorPrompt

`askTheNarratorPrompt` is the first message the narrator posts in the narrator chat once the game opens, after character creation. The character already exists by then, so use it to set tone or hand the player a first hook to act on, not to ask what character they are bringing.

### difficulty

`difficulty` pre-selects a level in the shared Difficulty control shown next to the mode selector. It must be one of five exact lowercase strings: `very easy`, `easy`, `medium`, `hard`, or `very hard`. The match is case-sensitive, so `Hard` or `veryHard` are silently ignored and pre-select nothing; an omitted value falls back to Medium. The player can still change the level afterwards. The level itself determines how hard skill checks are to pass (the numbers a roll needs to clear); harder levels make good results rarer. That effect is engine-side and not configurable per world.

The schema only types `difficulty` as a string; the five accepted values and their case-sensitivity come from the engine, not the world config, and are not enforced by validation.
