---
tab: "world"
section: "factions"
title: "Factions"
kind: "schema"
summary: "Factions are the named organizations in your world - governing bodies, guilds, cults, criminal networks, or any group with shared goals. Each has a public face (`basicInfo`), a hidden agenda (`hiddenInfo`), and a type (major or minor)."
order: 60
advanced: false
uiLocation: "World → Factions"
uiSubtitle: "\"Pre-defined factions\""
editor: "JSON + ADD ITEM"
related: "npcs - NPCs reference factions via `faction`; worldLore - faction background and history belongs there; triggers - faction-based conditions and reputation mechanics"
---

## Example

```json
{
  "The Merchant Council": {
    "name": "The Merchant Council",
    "factionType": "major",
    "basicInfo": "The Merchant Council is the city's formal governing body, holding authority over trade licensing, taxation, city watch funding, and judicial appointments within the Capital. In practice its decisions are made through committee deals and tightly managed consensus — the public sessions are theater for motions already decided in private. Members are appointed by hereditary merchant houses, making the body self-perpetuating; no councillor has ever been removed by election. To the city's general population they represent stability, predictable law, and moderate taxation — an institution too useful to overthrow and too boring to threaten. To those who understand the city's actual power structures, they represent something different: a set of negotiable positions held by people with expensive tastes and finite leverage.",
    "hiddenInfo": "The council chair has been in a directed arrangement with a criminal syndicate for three years — not merely ignoring illegal operations but actively redirecting city watch patrols away from specific warehouse districts on scheduled nights. She believes the arrangement is a controlled exposure she can end at any time. The syndicate knows this is not true and has prepared documentation sufficient to destroy her position. A junior colleague entered the same arrangement two years later and does not know the full scope of what the chair committed to at the outset; he believes the arrangement is smaller than it is and has recently begun showing visible anxiety. The syndicate is preparing to expand its demands, using both councillors' exposure as leverage for permanent allocation of dockside authority. Neither councillor knows this is coming. A copy of the incriminating documents, believed destroyed, sits in the Old Customs Vault.",
    "known": true
  }
}
```

## Fields

### factionType

`"major"` (multi-region, lots of resources) or `"minor"` (small local group). Use `major` for primary civilisation-level factions and `minor` for cells, guilds, or local groups. **Minor factions get procedural details generated more aggressively than major ones** - the engine produces richer on-the-fly NPC and location context for minor factions when the party interacts with them.

### detailType

Auto-set at runtime -- do not author.

### known

Boolean (optional, defaults to `true`). Set to `false` for secret organisations the player must discover through play. Use a `known-entity` trigger effect to flip the switch at an authored discovery moment. The narrator will still describe the faction's NPCs and activities when `known: false`, but will not name the faction - instead describing "a hooded figure with an obsidian blade" rather than "a Shadow Guild operative."

> **⚠️ Verbatim-name discovery requirement (`known: false`):** Discovery only triggers when the faction's **full name appears verbatim** in story narration. Partial references, paraphrases, or descriptions that talk around the faction do **not** trigger discovery. Author the discovery moment with a `known-entity` trigger rather than relying on the narrator to surface the name organically.

### basicInfo

**`basicInfo` format:** 4-8 sentences, 400-800 chars. Three sentences is insufficient — it produces shallow factions. A useful faction `basicInfo` covers: what the faction is and its reach, how it operates, how outsiders perceive it, and any visible contradiction between stated purpose and actual behaviour. The last element is optional for minor factions but essential for major ones.

Template: What + How + Perception + Contradiction (if any).

### hiddenInfo

Strong faction `hiddenInfo` covers four things: the truth that contradicts `basicInfo`, the internal schism or pressure that secret creates, what different ranks of the faction actually know, and something **actively happening right now** that the player can discover and engage with. The last element is what turns backstory into a live situation — without it, the AI has history but no current hook to surface through play. Length should roughly match `basicInfo`: 400-900 chars for major factions.

## Authoring tips

### The basicInfo/hiddenInfo split

The `basicInfo`/`hiddenInfo` split is where factions get interesting. `basicInfo` is the public face — what you'd read in a political pamphlet. `hiddenInfo` is what's actually driving the faction's decisions. Make them contradict each other specifically: not just "they're secretly evil" but "they genuinely believe they're doing the right thing while doing something that would horrify their public supporters."

### Faction + World Lore sync rule

Every faction must have a corresponding `worldLore` entry whose key exactly matches the faction key. The world lore `text` must be **identical** to the faction `basicInfo`. This is not redundancy - it gives the same information two retrieval pathways: semantic search (worldLore) and exact key lookup (faction). If they diverge the narrator may surface inconsistent descriptions.

> For a worked example of tracking faction standing through triggers see [Faction Reputation Tracker](/appendix/scripting-patterns#faction-reputation-tracker-worked-example) in the Authoring Guide.