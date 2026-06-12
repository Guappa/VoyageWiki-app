---
tab: "other"
section: "narratorStyle"
title: "Narrator Style"
kind: "schema"
summary: "A dedicated prose style field separate from `aiInstructions`. It shapes sentence rhythm, tense, person, vocabulary register, and sensory detail level. Leave the value as `\"\"` to use default narration."
order: 10
advanced: false
uiLocation: "Other → Narrator Style"
uiSubtitle: "\"Settings for the narrator style\""
editor: "JSON only"
related: "aiInstructions - per-task instruction overrides; narratorStyle sets the overarching persona, aiInstructions controls per-task behavior"
---

## Example

```json
{
  "narratorStyle": "Third person, present tense. Short sentences, strong verbs. Prose is concrete and specific — no adjective-heavy description, no atmospheric padding that delays the scene.\n\nNPC behavioral defaults: guards are doing a shift, not performing a role. Strangers are strangers — they do not volunteer information, do not know the player's name unless spoken aloud in this scene, and do not treat the player as significant until earned. Incidental NPCs have their own concerns; the player is an interruption to their day, not the center of it.\n\nPacing: follow the player's lead. If they push forward, match the pace. If they rest or reflect, let the scene breathe. Do not inject a new threat or complication into a resolved moment.\n\nNever: NPC exposition deliveries. Characters explaining their own motivations unprompted. Rescuing the player from the consequences of their choices. Adding a twist, reveal, or complication when the scene has earned a quiet beat."
}
```

## Fields

### narratorStyle

> **⚠️ Warning:** The correct schema is `{ "narratorStyle": "" }` - an object with a single string field. It is **not** an empty object `{}`.

> **⚠️ Warning:** Common nesting trap - the top-level `narratorStyle` field must be a **plain string**. If you accidentally wrap it in an extra object - `"narratorStyle": { "narratorStyle": "..." }` - the validator throws a confusing error: `Invalid value at "narratorStyle.0": expected string, got object`. The fix is to unwrap the value so the top-level field is the string directly: `"narratorStyle": "..."`.

## What to direct

Use this field to direct:

### Tense and person

Tense and person (second person present tense is the V33 default - override here if desired)

### Feel of magic, violence, and atmosphere

How magic, violence, and atmosphere should *feel* on the page

### Vocabulary register

Vocabulary register (archaic, elevated, grounded, clinical)

### NPC behavioral defaults

**NPC behavioral defaults** — how strangers, guards, and incidental NPCs should speak and behave by default. Without explicit guidance the narrator leans on archetypes (the helpful innkeeper, the gruff guard). Specifying "a guard is doing a shift, not performing a gatekeeper role" or "strangers don't volunteer information" produces more grounded behavior across all NPCs, not just authored ones.

### Pacing and momentum

**Pacing and momentum** — whether the narrator leads or follows player energy, when it's appropriate to slow down vs. press forward, whether quiet moments are allowed to breathe.

### Explicit prohibitions

**Explicit prohibitions** — what the narrator must never do. Production worlds use this to suppress defaults: unsolicited twists, NPCs delivering exposition, rescuing the player from consequences, injecting complications into resolved scenes. Negative rules are often more effective than positive ones in this field.

> **📋 Note:** `narratorStyle` shapes the narrator's overall voice (tone, personality, register). [`aiInstructions.generateStory > Style Principles`](/ai/aiInstructions#story) carries prose rules and world-specific constraints. They reach the narrator at different positions in the prompt: `aiInstructions.generateStory.*` is part of the system instructions, while `narratorStyle` rides in the per-tick user prompt closer to the actual generation, which gives it stronger effective recency during inference and makes it the better slot for voice/tone directives that need to hold under load.

> For prose principles and character voice guidelines see Authoring Guide > [Narrative Quality](/appendix/narrative-and-ai).