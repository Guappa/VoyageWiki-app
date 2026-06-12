---
tab: "ai"
section: "generateInitialStart"
title: "Initial Start"
kind: "schema"
summary: "Fires on the first scene of a new game only. Controls how the opening scene is constructed: structure, pacing, and first impressions."
order: 120
advanced: false
uiLocation: "AI Tasks → Initial Start"
uiSubtitle: "\"Initial Start Instructions\""
editor: "Graphical form (labeled textareas)"
related: "generateStory - ongoing narration task; storyStarts - the starting situation these instructions frame"
---

## Schema

```json
{
  "aiInstructions": {
    "generateInitialStart": {
      "Opening Structure": "string",
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
    "generateInitialStart": {
      "Opening Structure": "## Structure\nBeat 1 — WHO: establish who the character is right now through action or presence, not backstory.\nBeat 2 — WHERE: set the scene through their senses — what they see and hear.\nBeat 3 — SITUATION: one active situation already in motion. Do not front-load lore or world history.\n\n## Sensory rules\nVisual and auditory description only. No smell. Olfactory detail is overused — exclude it from the opening scene.\n\n## Pacing\nMatch the register of the storyStart text. Follow the situation as written — do not force conflict into a calm opening or calm into a high-stakes one.",
      "Style Principles": "## Style\nSimple, direct, concrete language. Present tense, third person. Strong verbs, specific nouns. Vary sentence length. Prefer dialogue and action over description.",
      "custom": "## World introduction\nIntroduce world-specific proper nouns with context on first use: 'the merchant guild known as the Silver Scale' — not just 'the Silver Scale'. Assume no prior world knowledge from the player."
    }
  }
}
```


## Fields

### Opening Structure

How the first scene is constructed: three-beat structure (WHO → WHERE → one active situation), pacing guardrails (follow the starting situation; don't force problems into a calm opening). Include a sensory restriction: **visual and auditory description only — no smell**. Olfactory scene-setting is an overused AI cliché in opening scenes; explicitly banning it here consistently suppresses it.

### Style Principles

Prose rules specific to the opening scene. May differ from the ongoing narration style in `generateStory`.

### custom

First-scene-only instructions: world introduction pacing, proper noun contextualisation, session opening variety.

## Authoring pattern

> **Common issue — NPCs using the player's name on first meeting.** The AI reads the character sheet and will have NPCs address the player by name even before they've introduced themselves. Fix: add to `"custom"`: *"NPCs do not know the player character's name unless it has been spoken aloud or the character has introduced themselves in the current scene."* Also add the same rule to `generateStory` → `"Character Behavior"` so it persists beyond the first scene.

> **📋 Note:** To mandate a literal opening line or framing device (narrator introduction, in-universe preamble) at the start of every new game, see [Mandated opening content](/appendix/ai-advanced-techniques#mandated-opening-content) in the Advanced AI Techniques appendix.
