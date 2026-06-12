---
tab: "other"
section: "encounterElements"
title: "Encounter Elements (Advanced)"
kind: "schema"
summary: "These define the encounter palette - a curated menu of possible scenarios the AI draws from when generating random encounters. Short entries work; longer entries are more specific."
order: 110
advanced: true
uiLocation: "Other → Advanced → Encounter Elements"
uiSubtitle: "\"Encounter elements for Encounter generation\""
editor: "JSON only (key → string map)"
related: "triggers - encounter triggers reference these elements; locations - encounters occur within location areas"
---

## Example

```json
{
  "Bandit Patrol": "A group of opportunistic criminals operating in the area. They are looking for easy targets — whether they find one depends on how the player presents.",
  "Faction Checkpoint": "A patrol or guard post demanding identification and papers. How cooperative they are depends on who you appear to be.",
  "Informant Contact": "A low-level operative conducting business in the open, confident in their cover. They will not reveal their purpose unless cornered.",
  "Wandering Merchant": "A trader with a single cart moving between settlements, alert for trouble but willing to deal. Stock skews toward what the last village wanted that this one might pay for.",
  "Wounded Traveller": "A person on the road with a visible injury, asking for help, possibly truthful. The wound is real either way; the story behind it may not be.",
  "Refugee Group": "A small number of people displaced by something — fighting, fire, a faction sweep. Carrying what they could fit on their backs and short on every resource.",
  "Hunting Party": "A small group with bows or traps, working a known game trail. They are hostile only to people who interfere with their hunt; otherwise neutral and useful for direction.",
  "Lone Sentry": "A single armed watcher posted at a sightline. Reports up the chain whether the player is seen or not. Killing them creates a missing-sentry problem within hours.",
  "Strange Sign": "Markings, tracks, or evidence of recent activity that does not match the local pattern. Worth investigating; worth being careful about who else has noticed.",
  "Abandoned Camp": "Recently used and recently left. Whether the previous occupants left voluntarily and whether they will return is for the player to discover.",
  "Caravan in Trouble": "A trade caravan stopped on the road — broken axle, sick draft animal, raider scouts in the treeline. The traders pay well for help and remember those who give it.",
  "Faction Recruiter": "Someone whose job is to assess passing travellers as potential recruits. The pitch is friendly; the assessment is real."
}
```

## Behaviour

### Encounter palette

`encounterElements` provides a pool the AI draws from when framing random encounters, a "thematic palette" feeding encounter generation. Specific filtering, weighting, or blending behaviour is not formally documented.