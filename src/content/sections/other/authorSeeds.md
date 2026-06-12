---
tab: "other"
section: "authorSeeds"
title: "NPC Author Seeds"
kind: "schema"
summary: "Named NPC-writing-tone presets. Each key is a display label; the value is a multi-line directive injected into `generateNPCDetails` when that seed is selected."
order: 70
advanced: true
uiLocation: "Other → Advanced → NPC Author Seeds"
uiSubtitle: "\"Author styles for NPC Details generation\""
editor: "JSON only (key → string map)"
related: "npcs - author seeds shape the NPC Details generation task for specific NPCs"
---

## Example

```json
{
  "Joe Abercrombie": "You show characters through their dark view of life and painful past\nYou focus on scars, limps, and old wounds\nYou create characters who joke about terrible things\nYou build characters who make excuses for doing bad things\nYou reveal character through how they fight or survive",
  "The Wounded": "You show characters through loss that still shapes them\nYou focus on what they've learned from hard experience\nYou include small moments where old pain surfaces\nYou create characters whose caution or drive stems from past hurt\nYou reveal character through how they've adapted to survive",
  "Gothic Horror": "Write the NPC's basicInfo and hiddenInfo in dense, atmospheric prose. Their appearance carries the past as texture — old scars, faded heirlooms, a stillness in the eyes. Beauty and decay coexist in the same paragraph."
}
```

## Behaviour

### Scope

> **Scope:** `authorSeeds` only shape how an NPC's authored fields (`basicInfo`, `hiddenInfo`, `personality`) get written during `generateNPCDetails`. They are not used by the story narrator, combat resolution, or any other task. One seed is picked at random per `generateNPCDetails` run, and selection within the task is only invoked for strong / elite / boss / mythic-tier NPCs — lower-tier NPCs go through `generateNPCDetails` without consulting author seeds or archetypes. Use `{}` to skip this feature.

## Authoring tips

### Seed patterns

Three seed patterns can be mixed in the same pool:

- **Author-voice presets** — keyed to a published author's name, written as five second-person directives in that author's register. Gives NPC prose a recognisable shape.
- **Generic trope presets** — keyed to a character disposition (`The Wounded`, `The Loyal`, etc.). Useful as a safety net inside an author-heavy pool.
- **Tone-register presets** — keyed to a genre tone (`Grimdark`, `Gothic Horror`, etc.), instructing the AI on the register for NPC profiles. Useful when the world has a strong house style.

### Five-line directive format

**Five-line directive format** for author-voice and trope seeds:

- **You show characters through [...]** — the primary lens for revealing them
- **You focus on [...]** — the recurring detail the prose returns to
- **You include [...]** — the specific small things to plant
- **You create characters who [...]** — the behavioural pattern to author
- **You reveal character through [...]** — the diagnostic moment that exposes them

> **Community resource:** A pool of ~30 ready-made seeds contributed by `ElunaGabriel` on the [Voyage Discord](https://discord.com/invite/HB2YBZYjyf) is a good reference for the five-line format.

### Recommended entry counts

**Recommended entry counts** (below these the AI may repeat the same archetype across consecutive calls):

| Section | Target |
|---|---|
| `authorSeeds` | 10–20 |
| `characterArchetypes` | 15–25 |
| `locationArchetypes` | 10–15 |
| `regionArchetypes` | 15–30 |
| `encounterElements` | 15–25 |
