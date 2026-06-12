---
tab: "ai"
section: "generateStory"
title: "Story"
kind: "schema"
summary: "The primary narration task. Fires most frequently during active play — keep instructions tight and protect this budget first."
order: 110
advanced: false
uiLocation: "AI Tasks → Story"
uiSubtitle: "\"Story Instructions\""
editor: "Graphical form (labeled textareas)"
related: "narratorStyle - overarching voice persona applied across all AI tasks; aiInstructions - overview of all tasks, firing order, and budget priority"
---

## Schema

```json
{
  "aiInstructions": {
    "generateStory": {
      "Victory and Downtime": "string",
      "Character Behavior": "string",
      "Style Principles": "string",
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateStory": {
      "Victory and Downtime": "## Pacing\nDo not introduce a new threat, rival, betrayal, or ticking clock just to maintain tension.\nIf the player has won, escaped, rested, or resolved the immediate pressure — let that land before adding complications.\n\n## Downtime\nFocus the entire turn on the moment. Rest is rest. Do not seed the next problem in the same paragraph as the resolution.",
      "Character Behavior": "## Knowledge\nNPCs know only what their background, role, and circumstances make plausible. Before any NPC speaks to or about the player: have they met? If not — no name, no reputation, no recognition. Strangers are strangers by default.\nNPCs do not know the player character's name unless it has been spoken aloud or formally introduced in this scene.\n\n## Resistance\nNPCs do not melt at flattery or agree to be agreeable. They hold their positions. They pursue their own goals between scenes and are not waiting for the player to act first.\n\n## Escalation\nNPC hostility escalates one step at a time — calm, wary, hostile — and only when justified by what the player actually did. When the player de-escalates, the NPC comes down too.",
      "Style Principles": "## Prose\nThird person, present tense. Short sentences, strong verbs. Concrete and specific. Do not re-describe what has already been established.\n\n## Never use these words\ncatch the light, step closer, echo, whisper, crystal, lower voice, eyes gleaming, filled with, a mix of, somehow, suddenly, you realize, it seems\n\n## Never do these\nUnattributed atmospheric noises with no source. Scholar NPCs delivering exposition. Repeating the same spatial description in consecutive turns. NPCs making speeches about their own motivations.",
      "custom": "## Currency\n[Example: 1 Gold = 10 Silver = 100 Copper. Day wage: 2sp. Inn room: 5sp/night. Replace with your world's values.]\n\n## World constraints\n[Add: species population norms by location, magic system narrative rules, technology level, any equipment or social restrictions.]"
    }
  }
}
```


## Fields

### Victory and Downtime

Tells the AI not to inject new threats or complications when players are resting or celebrating a resolved win. Without this key there is no explicit constraint against escalation during downtime.

### Character Behavior

Turn-by-turn NPC voice, dialog habits, social resistance rules, faction loyalty, memory across sessions. Cover: how NPCs remember past actions, hold their ground, use natural speech fragments, keep to what their position actually knows.

### Style Principles

Persistent prose constraints (sentence structure, vocabulary, atmosphere). Include two layers of bans: (1) a **vocabulary list** of specific words and phrases the engine overuses (`suddenly`, `echo`, `crystal`, `catch the light`), and (2) a **structural failures list** of compositional habits to prohibit (unattributed atmospheric noises, exposition-delivering NPCs, repeated spatial descriptions). Both layers are necessary.

### custom

World-specific runtime rules that fire on every story turn. **Currency is the most critical content here** — without an explicit price table the engine invents inconsistent values across sessions. Also add: species population norms (which non-human types appear in which locations), magic narrative rules, and world technology or social constraints.

## Authoring pattern

**Budget priority within `generateStory`:** protect `Character Behavior` and `Style Principles` first when space is tight. `Victory and Downtime` is next. `custom` is lowest — move less-critical rules to the affected NPC's `hiddenInfo` or region's `hiddenInfo` instead.
