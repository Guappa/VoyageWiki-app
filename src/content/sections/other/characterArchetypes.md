---
tab: "other"
section: "characterArchetypes"
title: "NPC Archetypes (Advanced)"
kind: "schema"
summary: "Keyed personality scaffolds for character background generation. Each archetype is a structured prompt block with **Drives, Traits, Morality, and Relationships** sections."
order: 80
advanced: true
uiLocation: "Other → Advanced → NPC Archetypes"
uiSubtitle: "\"Character archetypes for NPC Details generation\""
editor: "JSON only (key → string map)"
related: "npcs - archetypes are referenced when generating NPC Details for unnamed NPCs"
---

## Example

```json
{
  "Survivor": "Drives: stay alive; keep the people they have chosen to care about alive.\nTraits: pragmatic, observant, slow to trust.\nMorality: situational — lines drawn by experience, not principle.\nRelationships: distrusts institutions; trusts demonstrated competence.",
  "Scholar": "Drives: understand how the world works; preserve knowledge that power would prefer buried.\nTraits: intellectually confident, practically underequipped.\nMorality: believes understanding is inherently valuable regardless of consequence.\nRelationships: loyalty runs to ideas more than to people.",
  "Operator": "Drives: get the job done, get paid, move on before complications follow.\nTraits: professional, efficient, allergic to drama.\nMorality: contractual — the client and the agreement define the limit.\nRelationships: respects competence; resents amateurs; networks deliberately.",
  "True Believer": "Drives: serve a cause larger than the self; expand its reach.\nTraits: focused, articulate, hard to discourage.\nMorality: derived from the cause; ranks principles above persons.\nRelationships: warm to fellow believers, instructive to potential converts, dismissive of the indifferent.",
  "Opportunist": "Drives: position for the next advantage; avoid being on the wrong side when the music stops.\nTraits: charming, observant of leverage, willing to discard plans for better ones.\nMorality: instrumental — every rule has an exception for the right price.\nRelationships: cultivates many shallow ties; deep loyalty to almost no one."
}
```

## Behaviour

### Population DNA

Archetypes serve as the population "DNA" for the world -- consulted on the fly when generating unnamed characters, not a per-NPC assignment. The more entries you define, the more varied the character population feels. Worlds typically define 15 or more archetypes to avoid a homogeneous feel.

### Pairing with playable builds

Pair with `traits`, `skills`, and `premadeCharacters` for playable builds. Archetypes are personality templates, not full PCs.

### Empty-section crash

> **⚠️ Warning:** Leaving `characterArchetypes` empty (`{}`) causes a hard engine crash when `generateNPCDetails` fires for a **strong / elite / boss / mythic** tier NPC. The same applies to `locationArchetypes` (`generateLocationDetails`) and `regionArchetypes` (`generateRegionDetails`). The engine throws if any of these are empty when it tries to pick a random entry. The schema does not warn for this. Define at least one entry in each section.

### Tier gate

> **📋 Note (`characterArchetypes` tier gate):** Archetype selection is only invoked for `strong` / `elite` / `boss` / `mythic` tier NPCs during `generateNPCDetails`, not for `trivial` / `weak` / `average` tier NPCs. Ordinary-tier NPCs draw their personality from trait quirks and `aiInstructions.generateNPCDetails.custom` instead. Worlds with only low-tier NPCs will not hit the empty-archetype crash even if `characterArchetypes` is left empty -- but the validator still recommends defining at least one entry as defence-in-depth against later content additions.

### Override and suppression

> **📋 Note:** To override or fully ignore the engine-selected archetype inside `generateNPCDetails`, see [Behavior suppression and archetype override](/appendix/ai-advanced-techniques#behavior-suppression-and-archetype-override) in the Advanced AI Techniques appendix.