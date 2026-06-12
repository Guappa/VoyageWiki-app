---
tab: "other"
section: "characterCreationMusic"
title: "Character Creation Music"
kind: "schema"
summary: "Selects which background music track Voyage plays during the character creation flow. Top-level enum field accepting `fantasy` or `nonfantasy`. Omit the field to play no music during character creation."
order: 30
advanced: false
uiLocation: "Other → Character Creation Music"
uiSubtitle: "\"Selects the background music used during character creation.\""
editor: "Dropdown (two-value enum)"
related: "tipSettings - also UI flavor; storyStarts - what plays after character creation completes"
---

## Example

```json
{
  "characterCreationMusic": "fantasy"
}
```

## Values

- `"fantasy"` selects the default high-fantasy music bed appropriate for sword-and-sorcery, classic medieval, mythic, or magical worlds.
- `"nonfantasy"` selects an alternate bed for modern, sci-fi, contemporary, historical-non-magical, or any world that would feel mismatched with orchestral fantasy themes.
- Only these two literals are accepted. Anything else (including an empty string) is treated as a codec error by the validator.
- This field affects character creation UI only. In-game music is driven by `partyState.musicMood` and individual scene context, not by this setting.
