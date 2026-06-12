---
tab: "other"
section: "locationArchetypes"
title: "Location Archetypes (Advanced)"
kind: "schema"
summary: "These strings go to the AI when it needs to describe or expand a location. Write them as tone directions, not encyclopedia entries - the AI doesn't need a lore summary, it needs to know what makes this type of place feel distinct."
order: 90
advanced: true
uiLocation: "Other → Advanced → Location Archetypes"
uiSubtitle: "\"Location archetypes for Location Details generation\""
editor: "JSON only (key → string map)"
related: "locations - archetypes are referenced when generating Location Details"
---

## Example

```json
{
  "Power Asymmetry": "Atmosphere:\n- Someone here holds authority that others cannot openly challenge\n- Deference is performed, not felt\n- The gap between official rank and actual leverage is visible if you know where to look\n\nTensions:\n- Every interaction carries the question of who is watching and what will be reported\n- Requests that look like requests are actually orders\n\nPatterns:\n- People speak carefully and move with purpose\n- Waiting is treated as a show of deference, not inefficiency\n\nSecrets:\n- The visible authority figure is not the one making the real decisions",
  "Transit Point": "Atmosphere:\n- People here are passing through, not staying\n- Relationships are brief and transactional\n- The place exists to facilitate movement, not to be a destination\n\nTensions:\n- No one is accountable to anyone else here; the normal rules of social consequence do not apply\n- Someone is always watching the exits\n\nPatterns:\n- Strangers share tables but not names\n- The people who work here know everything about everyone passing through\n\nSecrets:\n- One regular here is not what they appear to be"
}
```

## Authoring tips

### Write tone directions, not lore

Write each entry as a short thematic atmosphere direction, not an encyclopedia entry or location-type description. The AI doesn't need a lore summary; it needs to know what makes this type of place feel distinct.

### Four-section entry structure

A well-structured entry uses four sections: `Atmosphere` (the mood and sensory register), `Tensions` (what social forces are active and unresolved), `Patterns` (observable behaviors that repeat in this type of place), and `Secrets` (one thing true here that isn't visible). Not every section needs the same length — Atmosphere typically gets 3 bullets, the others 1-2 each. The four-section structure gives the AI distinct material for description, NPC behavior, and hidden content simultaneously.

### Use thematic keys, not location types

Keys should be thematic labels ("Power Asymmetry", "Sanctuary", "Uneasy Alliance") not location-type labels ("Capital City", "Forest", "Dungeon"). Since one archetype is randomly applied to any location, thematic labels produce useful flavor regardless of what kind of place is being generated. (`visualTags` are used for image caching, not archetype targeting.)

### Do not leave empty

> **⚠️ Warning:** Leaving this section empty causes a hard engine crash when `generateLocationDetails` fires (which happens for locations with `detailType: "basic"` when the player first visits them). Worlds where every location has `detailType: "detailed"` and pre-authored basicInfo will not invoke this code path, but defining at least one entry is recommended as defence-in-depth against later content additions.

> **📋 Note:** To override or fully ignore the engine-selected archetype inside `generateLocationDetails`, see [Behavior suppression and archetype override](/appendix/ai-advanced-techniques#behavior-suppression-and-archetype-override) in the Advanced AI Techniques appendix.