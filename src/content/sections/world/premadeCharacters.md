---
tab: "world"
section: "premadeCharacters"
title: "Premade Characters"
kind: "schema"
summary: "Pre-built character templates a player can select at session start instead of building one from scratch. JSON-only field with no dedicated editor panel - edit it via the full-world JSON tab."
order: 40
advanced: false
editor: "JSON only (no dedicated editor panel - edit via the full-world JSON tab)"
related: "storyStarts - both define what the player encounters at session start; npcs - a premade can replace an NPC via `replacesNpc`; traits - premades reference trait keys to inherit attributes, skills, resources, abilities, and starting items"
---

## Example

```json
[
  {
    "name": "Edra Vane",
    "gender": "female",
    "description": "A former city archivist who left the guild under unclear circumstances. She knows where the bodies are buried - metaphorically and otherwise - and has the patience to find out what she is missing. Edra spent a decade cataloguing documents others assumed were unimportant. When she found records contradicting the official history of a land dispute, her supervisor reassigned her before she could finish the analysis. She kept copies. She does not know yet what they prove.",
    "traits": ["Human", "Scholar", "Investigator", "Neutral Good"],
    "portraitUrl": "https://world-assets.example/premade/edra-vane.webp",
    "voiceTag": "female commanding refined"
  }
]
```

## Fields

### description

**`description`** serves two roles simultaneously: it's what the player reads at character selection, and it's the `Background:` field sent to the story AI every turn. Lead with a hook that sells the character, then expand into history, motivation, and voice.

### traits

**`traits`** is how the premade gets its attributes, skills, resources, abilities, and starting items — via the normal trait pipeline.

### replacesNpc

**`replacesNpc`** — when this premade is selected, the named NPC is fully removed from game state. Nothing from the original NPC is inherited (description, location, faction, abilities, equipment all come from the premade). Use only when the premade canonically IS that NPC.

> **⚠️ Warning (`replacesNpc` and dependencies):** Because the named NPC is fully removed from game state, do not target an NPC that a quest or trigger depends on. Anything referencing that NPC — quest objectives, trigger conditions, dialogue gates — is left pointing at an entity that no longer exists, which can break the quest or trigger when the premade is chosen. Reserve `replacesNpc` for NPCs nothing else relies on.

### voiceTag

**`voiceTag`** — TTS voice profile (extra-codec). See the [Voice Catalog](/appendix/voice-catalog) for valid values.

### Do not include

**Do not include:** `backstory` (redundant with `description` — if both are set, `backstory` overrides `description` in the `Background:` slot); `attributes` (use `traits` instead).

## Selection lifecycle

**Selection lifecycle.** Each entry becomes a selectable card in the character-creation UI (use `[]` to skip this feature). When a player selects a premade the engine:

1. Copies `name` and `gender` directly.
2. Resolves `traits` through the normal pipeline (modifiers, starting items, abilities). Unknown trait names are silently skipped. `excludedBy` mutual-exclusion is bypassed — premades can combine traits that would normally conflict.
3. Uses `portraitUrl` as-is, skipping portrait generation.
4. If `replacesNpc` is set, removes the matching NPC from game state at session start and any mid-game join.
5. If the player customizes the premade in character creation, both `description` and `backstory` are replaced by an AI-generated profile seeded from the player's edits.

> **📋 Note:** Custom `portraitUrl` values work today but are not an officially supported feature — the engine loads them without moderation enforcement. A native portrait-generation pipeline with mandatory automatic AI content moderation (the same review applied before a world can be published) is in active development and will replace this slot. Treat custom URLs as a temporary affordance; expect them to be restricted once the native feature ships.
