---
tab: "ai"
section: "generateCharacterBackground"
title: "Character Background"
kind: "schema"
summary: "Fires on demand when a player inspects a character's detailed profile. Generates biographical history — distinct from basicInfo/hiddenInfo. Because it fires on demand rather than continuously, it suits detailed backstory constraints that would waste budget in `generateStory`."
order: 130
advanced: false
uiLocation: "AI Tasks → Character Background"
uiSubtitle: "\"Character Background Instructions\""
editor: "Graphical form (labeled textareas)"
related: "generateNPCDetails - NPC detail fill-in on first scene appearance (distinct task); npcs - basicInfo and hiddenInfo are the in-play fields"
---

## Schema

```json
{
  "aiInstructions": {
    "generateCharacterBackground": {
      "prompt": "string",
      "custom": "string"
    }
  }
}
```


## Example

```json
{
  "aiInstructions": {
    "generateCharacterBackground": {
      "prompt": "Write a character profile in two sections.\n\nBackground (6–8 sentences): Who they are now, where they're from, what shaped them, how they gained their abilities. End with forward momentum.\n\nAppearance (3 sentences): Height and build, coloration, one distinctive permanent feature. No clothing, gear, or interpretive language ('wise-looking', 'mysterious').",
      "custom": "## Tone\nHeroic optimism. Frame hardship as a source of strength. These are characters at the start of their story, not the end of it."
    }
  }
}
```


## Fields

### prompt

The full background generation prompt. Three states:

| State | Effect |
|-------|--------|
| Omit `prompt` | Use the engine default |
| Set to your custom string | Replace the default wholesale |
| Set to `" "` (a single space) | Disable the default without replacing it |

### custom

Appended AFTER `prompt` as additional guidance. Does not replace the default, regardless of what `prompt` contains.

## Authoring pattern

Because this task fires on demand rather than continuously, it suits detailed backstory constraints that would waste budget in `generateStory`.

**Legacy keys** (backwards-compatible, do not use in new worlds): `character_profile_generator`, `character_profile_background`, `character_profile_appearance`, `do_not_include`, `style`, `structure`, `context`, `final_notes`. These are accepted by the engine for older worlds but should not be authored in new content.
