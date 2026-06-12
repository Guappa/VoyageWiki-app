---
tab: "world"
section: "worldLore"
title: "World Lore"
kind: "schema"
summary: "`worldLore` is ambient context the AI draws on when generating narration and NPCs. It is not player-visible - players never read these entries directly. Think of it as the set of facts the narrator considers true about the world."
order: 20
advanced: false
uiLocation: "World → World Lore"
uiSubtitle: "\"Details about your setting for the AI\""
editor: "JSON only"
related: "storySettings - top-level world context; regions - region-level detail belongs there; factions - faction background belongs here"
---

## Example

```json
{
  "The Old War": {
    "text": "The Old War ended sixty years ago but its consequences define every political relationship in the realm. Three kingdoms fought over the Thornfield Basin for a generation. No party won outright; a ceasefire was signed when all three crowns ran out of soldiers. Contested borders, unresolved grievances, and two generations raised to distrust their neighbors are its legacy."
  },
  "Gnoll": {
    "text": "Gnolls are hyena-headed scavengers and opportunist raiders operating in competing packs across the frontier regions. Average combatant tier: strong. They avoid pitched battles against organised resistance, preferring ambushes of isolated travellers and undefended settlements. Pack alphas carry crude but effective weapons; rank-and-file gnolls fight with clubs, stolen gear, and numbers."
  },
  "Guest Right": {
    "text": "Guest right is among the most sacred obligations in the realm — any guest who has eaten food or drunk water under a host's roof is protected from harm for the duration of their stay, and the host is equally protected. Violating guest right is considered a profound moral transgression that damages reputation across all factions. The protection ends when the guest formally departs or the host formally ends the relationship."
  }
}
```

## Fields

### text

The lore content. No title field — the outer key is effectively the title, but it is never shown to players directly.

**Do NOT wrap in an array.** Value must be a plain `{text}` object — `[{"text":"..."}]` is invalid.

> **📋 Note:** Validator errors show `worldLore.key.0` and `worldLore.key.1`. These are io-ts union branch indices, not array indices.

## Engine behavior

### World lore is not region-filtered

NPC and location memories are filtered by the party's current region during retrieval — world lore is not. Every `worldLore` entry is always a candidate for retrieval regardless of where the player is. This makes it the right place for global world rules, cross-regional history, and facts that should be accessible anywhere in the world.

## Authoring tips

### Key naming

Use Title Case with natural spacing — `"The Old War"`, `"Guest Right"`, `"Gnoll"`. The engine is case-insensitive for retrieval; the key exists only for authoring clarity since it never reaches the AI.

Two approaches to the "key title not in context" problem both work in practice:

- **Grammatical subject opener:** make the subject name the first word of the first sentence (`"Guest right is among the most sacred..."`) — clean prose, no redundancy.
- **Inline colon notation:** open with `"Subject Name: description..."` embedded in the text itself (`"Gnoll: Hyena-headed scavengers..."`) — explicit, impossible to miss, reads mechanically.

**Type-prefix pattern for keys** (`"Creature: Hollow"`, `"Hazard: Black Tide"`) is a viable alternative that aids semantic matching in large libraries where bare nouns might collide. The prefix is invisible to players since the key is never in context.

### What belongs in worldLore

The most consistently valuable entry categories across well-developed worlds:

- **Historical events** — wars, catastrophes, founding moments whose consequences still shape current politics or culture. Keep to current consequences, not blow-by-blow chronicles.
- **Creature and monster ecology** — appearance, behavior, power tier, habitat, and combat relevance. First sentence must name the creature and state its tier.
- **Magic and technology systems** — how the system works, its costs and limits, who can use it. Make it narratable, not just named.
- **Social customs and institutions** — behavioral rules the AI must know: hospitality codes, honor obligations, religious taboos, feudal duties, trial procedures. This is the most underused high-value category. Entries that teach the AI "what happens when X occurs" produce more consistent world behavior than entries that only describe what X is.
- **Faction mirrors (mandatory)** — every entry in `factions` must also have a worldLore entry whose key matches the faction key and whose `text` is identical to the faction's `basicInfo`. This is not redundancy: it gives the same content two retrieval pathways (semantic search via worldLore, exact key lookup via faction). See the [Faction + World Lore sync rule](/world/factions) on the factions page.
- **Faction depth beyond basicInfo** — internal structure, rank systems, secret operations, historical origin. Use a *separately keyed* worldLore entry for content that exceeds what a faction's `basicInfo` can hold; do not overwrite the mirror entry.

### What does not belong here

- Location descriptions that belong in `locations.basicInfo` — short geography stubs add noise with minimal retrieval value.
- NPC personality and backstory that belongs in `npcs.basicInfo` / `hiddenInfo` — duplicating NPC content in worldLore creates maintenance inconsistency with no retrieval benefit.

### Entry length

A good lore entry is dense and self-contained - assume the AI might only read it once per session, so don't reference other entries. The practical sweet spot is 500–800 characters for a single topic. System-level entries (a magic system, an organization's hierarchy) can justify 1,000–2,000 chars. Entries above 3,000 chars are almost always covering multiple topics that would retrieve better as separate entries.

### Entry count and context pressure

WorldLore is not region-filtered, so every entry competes for retrieval in every scene. A library of 50–100 tightly scoped entries retrieves more accurately than 300+ broad or overlapping entries. Quality and specificity matter more than coverage.

### First-sentence rules

The first sentence is the most important. It must:

- Establish the subject explicitly so the entry reads as a self-contained fact
- Function as a diagnostic summary including the most retrieval-relevant property
- For creatures: include tier/power and key capability
- For institutions: role and leverage
- For hazards or [locations](/world/locations): what it is and why it matters

### Narrator-only secrets

For information the AI should know but not surface prematurely, frame the entry explicitly as narrator-only context:

> "Lord Aldric is working for the enemy. He passes information through his servant Marcus. The player should not learn this until they find evidence themselves."

The narrator uses these for consistent behind-the-scenes behavior but will not state them directly until the story supports it.
