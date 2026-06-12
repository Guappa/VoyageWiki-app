---
tab: "ai"
section: "summarization"
title: "Story Memory"
kind: "schema"
summary: "Custom guidance for how the AI summarizes recent and past story context. Use it to name the world-specific details summaries should preserve for long-term continuity, so key facts are not forgotten or garbled. Newly author-editable."
order: 335
advanced: true
uiLocation: "AI Tasks → Advanced → Story Memory"
uiSubtitle: "\"Custom Memory Summarization Instructions\""
editor: "Graphical form (textarea)"
related: "generateStory - the primary narration task; storySettings - world background context; worldLore - durable lore that complements run-specific memory"
---

## Schema

```json
{
  "aiInstructions": {
    "summarization": {
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "summarization": {
      "custom": "Track the player's growth, learning, cultivation of new skills and power, and how this changes their identity and relationships with the world and society."
    }
  }
}
```


## Fields

### custom

The only key — free-form guidance for what world-specific details the summaries must preserve for long-term continuity. Like every other `aiInstructions` task, it is layered on top of the engine's base summarization instructions.

## Authoring pattern

The engine summarizes recent and past story context on its own; `custom` tells it what not to lose. The guiding question: describe what would be jarring if an NPC forgot it or mixed up the details — "in my world, *this* is important, do not lose it."

What matters depends on the genre:

- Relationship-driven worlds — who is related to whom, who is involved with whom, and which of those ties are secret.
- Military or war worlds — ranks, when and why characters were promoted, the chain of command, who was wounded in which battle.
- Progression or leveling worlds — when and why a character levels, learns a new skill, or undergoes an evolution.
- Worlds where alignment matters — an act that shifts a character's alignment is a critical beat, not just another dice roll, and must not drop out of the summary.

Keep it focused on what must be preserved; name the load-bearing facts rather than restating the whole world.
