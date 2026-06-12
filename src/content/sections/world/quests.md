---
tab: "world"
section: "quests"
title: "Quests (Advanced)"
kind: "schema"
summary: "Quests are pre-authored story objectives that start hidden and become visible only when a trigger fires `quest-init`. Every quest needs at least one trigger pointing to it - `quests` with no trigger are permanently unreachable."
order: 110
advanced: true
uiLocation: "World → Advanced → Quests"
uiSubtitle: "\"Quests that can be used by story starts or triggers\""
editor: "JSON + ADD ITEM"
related: "triggers - every quest needs at least one `quest-init` trigger to become reachable"
---

## Example

```json
{
  "The Missing Documents": {
    "name": "The Missing Documents",
    "questType": "side",
    "questSource": "Archivist Sera Vane",
    "questStatement": "Side quest. Vane is a guild archivist who has identified a set of classified records being quietly prepared for destruction — documents that contradict the official history of a major land dispute. She cannot retrieve them herself without triggering a mandatory audit of her clearance. She needs an outside agent to enter the restricted archive during the next scheduled maintenance window and remove the records before they are incinerated.",
    "mainObjective": "Recover the classified documents from the guild archive and deliver them to Vane's contact at the docks.",
    "completionCondition": "The documents have been physically delivered to the dock contact and confirmed received.",
    "detailType": "detailed",
    "questLocation": "The Capital",
    "questDesignBrief": "Vane is trusting the player with materials the guild would destroy. Frame this as a genuine trust exchange - she cannot do this herself. The documents matter; do not reduce the retrieval to a single skill check. Let the risk of exposure feel real."
  },
  "The Final Reckoning": {
    "name": "The Final Reckoning",
    "questType": "main",
    "questSource": "The Resistance",
    "questStatement": "Main quest — final arc. The evidence gathered across the investigation is complete: financial records, witness depositions, and the incriminating vault documents. The Resistance has secured access to the tribunal hall and a sympathetic magistrate willing to hear a formal case. The player must present the full evidence cache at a scheduled tribunal session and hold the case together under cross-examination by council-appointed advocates.",
    "mainObjective": "Bring the full evidence cache to the tribunal hall and formally present the case against the council.",
    "completionCondition": "The evidence has been presented at the tribunal and the verdict delivered.",
    "detailType": "detailed",
    "questLocation": "The Tribunal",
    "questDesignBrief": "The primary ending. The tribunal is the culmination of everything gathered across the scenario. Give it weight - let the verdict land with gravity. Do not compress the resolution."
  }
}
```

## Fields

### completionCondition

**Required.** Missing it causes a deeply nested Zod error like `quests.Name.1.0.0.completionCondition`.

Detailed quests auto-generate a completion trigger from `completionCondition`. Basic quests need manual triggers. If `completionCondition` is empty, no auto-trigger is created for either type. (Documented in the upstream quests skill.)

### detailType

Determines which location field is required and how the AI handles quest location:

| `detailType` | Location source | What the AI does |
|---|---|---|
| `"detailed"` | `questLocation` (required) -- exact pre-built location name | Quest is pinned to that location; AI generates quest content there |
| `"basic"` | `spatialRelationship` (required) -- spatial hint enum | AI generates a location on the fly based on the spatial hint |

**Valid `detailType` values:** Only `"basic"` and `"detailed"`. `"brief"` is **not** valid — using it causes a Zod error listing every expected field. The error message is misleading (it looks like the whole quest schema is wrong) but the root cause is always the invalid `detailType` string.

### questLocation

Required when `detailType` is `"detailed"`. **Must be a location name, not a region name.** Must exactly match a key in [`locations`](/world/locations) — a specific location display name like `"Capital City Docks"`, not its parent region name like `"The Capital Region"`. Region names cause "Invalid questLocation" warnings. Always use the specific location, not its parent region.

### spatialRelationship

Required when `detailType` is `"basic"`. Codec enum with five accepted values:

`existingLocalArea | newLocalArea | nearbyNewLocation | distantNewLocation | existingLocationNewAreas`

What each tells the narrator to construct: `existingLocalArea` - the quest stays in the current area (no travel needed); `newLocalArea` - moving to a new part of the current location that didn't previously exist (e.g. a hidden basement); `nearbyNewLocation` - travel within the same region, framed as a short trip; `distantNewLocation` - a journey to a different region or far-off part of the world; `existingLocationNewAreas` - returning to a known location and discovering entirely new sections of it.

> **For `basic` quests, use `existingLocalArea`** (or make the quest `detailType: "detailed"` with a `questLocation`). The location-generating values `nearbyNewLocation` and `distantNewLocation` resolve a new location *relative to the player's current position*, which can fail when the quest is accepted — the engine aborts with "Failed to accept quest". This bites starting quests (accepted at spawn, before any movement) and arc/chained quests offered before the player has travelled. Anchor the quest at the player's area and let outward travel emerge through play; reserve named destinations for `detailType: "detailed"` + `questLocation`.

### questStatement

In practice carries most of the AI guidance load for individual quests — not just "the situation that creates the quest" but the full scene context: who is involved, what the player must do, where the encounter happens, and how success is judged. A well-written `questStatement` runs 100–500 characters. For authored quest chains, many authors open `questStatement` with a category label on its own line (`Premade Questline: Arc Name`, `AI Generated Quest`) before the narrative setup paragraph — this helps the AI understand the quest's origin and treat it accordingly.

> **📋 Note:** `questStatement` and the global [`storySettings.questGenerationGuidance`](/world/storySettings) work as a general-to-specific pair. The global guidance carries world-wide quest tone so any quest feels like it belongs in the scenario; `questStatement` carries the mission-specific context so the objective lands with the right weight. `questDesignBrief` adds tone and feel guidance on top of that when the quest's emotional register is non-obvious from the other fields.

### questDesignBrief

Optional string — authoring notes about how the quest should feel and be run. Not player-visible. Include it for quests where the tone or pacing is non-obvious from the other fields alone.

```json
"questDesignBrief": "Direct confrontation with the mastermind at their stronghold. They are willing to negotiate - this should feel like a revelation, not an automatic fight. No violence unless the player chooses it. Their account should answer questions and raise new ones."
```

### questType

Extra-codec string. Category label used by the AI to frame the quest in the journal and in narration. Common values: `"main"`, `"side"`, `"task"`, `"investigation"`, `"defense"`, `"infiltration"`, `"progression"`. Not in the formal schema, but widely used and present in the editor UI. Include it on every quest.

### npcs (extra-codec)

Array of strings. NPC name keys central to this quest. Used by the engine to resolve "NPC X is not referenced by any quest" warnings in the editor. List every NPC the player will interact with during the quest. Strings must exactly match keys in [`npcs`](/world/npcs).

### description (extra-codec)

Player-facing summary shown in the quest log detail view. One to three sentences describing the situation and what the player needs to do. Different from `questDesignBrief` which is internal AI guidance only.

### Validation gotchas

> **⚠️ Warning:**
> - `completionCondition` is required - omitting it causes a deeply nested Zod error.
> - The correct trigger effect format for `quest-init` is `{ "type": "quest-init", "operator": "set", "value": "Quest Name" }` - `"operator": "set"` must be present.
> - `questLocation` must be a **location** name (a key in `locations`), not a region name. Region names produce "Invalid questLocation" warnings.
> - `detailType` accepts only `"basic"` and `"detailed"` - `"brief"` is invalid.

## Quest lifecycle

### Status flow

Hidden → (trigger fires `quest-init`) → Available → Accepted → **Phase 1: `goToLocation`** (move to the quest's region/location) → **Phase 2: `goToArea`** (move to the specific area within that location) → **Phase 3: `completeObjectives`** (player completes `mainObjective`) → Completed.

From Available the player may also `reject` the offer (→ `rejected`) or the quest may `expire`. From Accepted the player may `abandon` (→ `abandoned`).

Valid quest statuses: `hidden`, `available`, `accepted`, `completed`, `abandoned`, `rejected`, `expired`.

### Expiry conditions

From `available` state, a quest expires when:
- Expiry tick reached (3 ticks after offer)
- Party leaves the location where the quest was offered
- Quest giver dies, becomes incapacitated, or is no longer near the party

Acceptance and rejection are immediate — there is no pending state between offer and decision.

### Quest chains

Use a `quests-completed` trigger condition to detect completion, then fire `quest-init` for the next quest.

### acceptQuest UI prompt

When a quest becomes available, the engine surfaces an accept prompt to the player as a UI element after the turn ends — accepted quests are tracked in the journal (top-left in the game). Use `quest-init` triggers with `story` conditions for quest discovery logic rather than relying on prose dialogue.

### Trigger naming convention

Use the pattern `{questId}_objective` or `{questId}_objective_N` (e.g. `the_missing_documents_objective`, `the_missing_documents_objective_2`) to name objective-phase triggers consistently. Triggers named with this pattern are automatically filtered out of the active pool while the quest is unaccepted or abandoned — they will not fire unless the quest is in an accepted state.

## Authoring tips

### Coverage requirement

**Every quest must have at least one trigger with a `quest-init` effect pointing to it, or it will never become available to the player.** Quests without triggers remain permanently in the `Hidden` state — they exist in the data but can never be discovered or accepted. This is the most common cause of "quests not showing up." Ensure 100% coverage: one trigger per quest at minimum.

### Quality checklist

- `questStatement` — reads as a briefing: who, what, where, why, and how success is judged. One sentence to a full paragraph depending on quest complexity. For authored quest chains, consider opening with a category label (`Premade Quest`, `AI Generated Quest`) on its own line before the narrative setup.
- `mainObjective` — starts with an imperative verb. The engine parses this to evaluate completion.
- `completionCondition` — write what "done" looks like in plain language. Be specific.
- `detailType: "detailed"` + `questLocation` for pre-built locations; `detailType: "basic"` + `spatialRelationship` for AI-generated locations.

### Discovery pattern (first quests at a location)

1. Arrival trigger (`start_[location]`) sets scene and writes a boolean flag — no `quest-init`.
2. Discovery trigger (`discover_[quest_slug]`) checks the flag + a `story` AI condition ("has the player spoken with the quest-giver?") → fires `quest-init`.
3. The quest appears in the player's journal only after they have organically encountered the hook.

### Chain pattern (multi-step storylines)

1. Quest A surfaces via the two-step discovery pattern above.
2. Quest B trigger has condition `quests-completed contains "Quest A"` — fires only after A is done.
3. Quest C trigger chains from B in the same way.

This creates a natural investigation/escalation arc without the player being handed everything at once.

### Encounter quests

For encounter/spawn-able enemies: create one quest per enemy faction with `questSource: "Regional Danger"`. These quests don't need complex objectives — they serve as AI context for encounter spawning.

### NPC reference warnings

The editor shows "NPC X is not referenced by any story start or quest" for NPCs that have no structural linkage in the scenario. The quest schema has no built-in NPC linkage field — `questSource` is intentionally a plain string. To resolve these warnings, add every NPC to the `npcs` array of at least one quest. For enemy/encounter NPCs, create dedicated encounter quests (`questSource: "Regional Danger"`) with an `npcs` array listing the enemies. These quests give the AI context for encounter spawning and resolve the warnings entirely.
