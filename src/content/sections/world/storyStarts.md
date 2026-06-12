---
tab: "world"
section: "storyStarts"
title: "Story Starts"
kind: "schema"
summary: "Story starts are the selectable opening scenarios players choose from at the start of a game. Each defines the initial scene, what the player has, and the first narration. A scenario needs at least one start; most have two or three."
order: 30
advanced: false
uiLocation: "World → Story Starts"
uiSubtitle: "\"Directions for the AI to start the story\""
editor: "JSON + ADD ITEM"
related: "locations - `locationAreas` values must match area names defined there; quests - quests can be activated at story start"
---

## Example

```json
{
  "The Road to the Capital": {
    "name": "The Road to the Capital",
    "description": "You arrive in the capital city as the political situation teeters. Factions are maneuvering, information is currency, and everyone seems to be waiting for the first move.",
    "storyStart": "[ The capital has looked the same for a century, but something beneath the surface has shifted. ] You arrived on the morning coach, carrying your reputation and not much else. You are on the main thoroughfare. A courier cuts across your path and gives you the quick measuring look of someone who trades in information: 'You look useful. Are you looking for work?'",
    "firstQuest": "Find out what is really happening in the capital and decide who, if anyone, you can trust.",
    "locations": ["The Capital"],
    "locationAreas": ["Market Quarter"],
    "isDefault": true,
    "startingQuests": [],
    "startingPartyNPCs": ["Edra Vane"],
    "questGenerationGuidance": "Quests in the Capital should turn on information leverage and factional pressure. Avoid pure dungeon-crawl framings -- the city's tension is political. Player capability surface to use: navigation, persuasion, knowledge, observation."
  }
}
```

## Fields

Keyed map. Outer key must exactly match inner `name`.

### storyStart

The field is named `storyStart`, not `narrative`. A field named `narrative` is silently ignored by the engine.

The field supports two distinct authoring patterns:

- **Embedded prose** (example above): draft narration text the AI expands from, using `[ ]` brackets for narrator prologue and present-tense for the active scene. The AI treats this as a base to build on.
- **Director instruction**: imperative AI prompt describing *what to generate* rather than pre-writing the text. No embedded prose; the AI produces all output from scratch. Example:

```text
THE SITUATION — The city has been without its ruling council for six days following a sudden vacancy. Three factions are maneuvering to fill the gap and none of them will move openly until they understand where the player stands.

THE PLACE — Establish the players arriving at the main thoroughfare of the Capital. Early morning, market not yet open. The tension of a city holding its breath.

THE MOMENT — A courier approaches and makes first contact with a specific request: deliver a sealed message to the guild quarter before the council bell rings. No explanation given. Payment offered upfront.

Use the character's Background and Class to shape how they are approached and what they notice first.
```

Both patterns are valid. Director-instruction storyStarts give the author more control over the opening shape; embedded-prose storyStarts give the AI more of the specific language to work from.

**Tense rule:** events happening *right now* use present tense; backstory uses past tense. Getting it wrong causes the AI to open the session after the event has already occurred. Test every story start before publishing.

### description

Player-facing blurb shown in the story start selector UI, before the player begins. This is the one field in `storyStarts` that the player reads directly. Keep it to one to three sentences: what kind of opening this is, what situation the character is in, the tone. In production worlds this often opens with a genre or situation tag ("A political intrigue start", "Tutorial", "Combat-focused") followed by a sentence of context.

### firstQuest

Keep vague by default. It blends with whatever backstory the player writes during character creation. "Find out what is really happening in the capital" is about as specific as you should go — treat it as a thematic seed, not a quest description.

`firstQuest` can hold more than a vague thematic seed when the story start has a predefined first arc. For starts with a specific opening quest chain, `firstQuest` can carry detailed arc-seeding instructions — secrets to surface, location pins to establish, expected arc conclusions — running several hundred characters. Keep it vague when the start is open-ended; use it for detailed setup only when the first arc is authored and the guidance won't conflict with the player's character choices.

### startingQuests

Array of quest name strings set to `available` status at game start, before any trigger fires. Use it when a story start has immediate objectives the player should see from turn one. Use `[]` (and `quest-init` triggers instead) when quests should be discovered gradually through play.

### startingItems

> **⚠️ Warning:** `startingItems` on story starts applies the same item to **every** player of that start regardless of their class, background, or any other character-creation choice. For combat gear, professional equipment, or anything that should vary by character build, put it on traits or [`itemSettings.startingItems`](/mechanics/itemSettings) instead. The legitimate use is small narrative hook [items](/world/items) that belong to the story start itself — a letter of introduction, a sealed message, a key the player picks up in the opening scene — where universality is the point. If you find yourself listing weapons, armour, or class kit here, you want a trait.

### questGenerationGuidance

Layers on top of `storySettings.questGenerationGuidance`. Use it when one story start has a distinctly different tone or quest cadence from the rest of the world. In practice, most worlds put all quest guidance into the global `storySettings.questGenerationGuidance` and leave this field empty.

## Initialization order

When a player starts a game with a story start, the engine runs these steps in order:

1. **Quest registration** — all world quests created with status `hidden`; quests in `startingQuests` flipped to `available`; on turn 0 the AI also injects `firstQuest` as a quest generation instruction if set
2. **Location selection** — pick from `locations` (or random region/location if empty), then filter `locationAreas`, then pick one area
3. **Party NPC setup** — for each NPC key in `startingPartyNPCs`: move to chosen starting location/area, add to `partyState.partyMembers`, set `npc.known = true`
4. **Starting items** — combined in priority order: `itemSettings.startingItems` (global) + trait `startingItems` (deduplicated) + story-start `startingItems` + skill `startingItems`. Items auto-equip when valid slots are open.
5. **Party state init:**

```text
partyState.currentLocation     = location.name
partyState.currentLocationArea = chosen area
partyState.currentRegion       = location.region
partyState.currentRealm        = region.realm
partyState.currentCoordinates  = [location.x, location.y]
partyState.day                 = 1
partyState.timeOfDay           = ''
partyState.musicMood           = 'peaceful'
```

6. **Initial narrative** — `generateInitialStart` runs, using `storyStart.storyStart` as base, plus party NPCs, location/area details, character backgrounds, and [`narratorStyle`](/other/narratorStyle)

## Authoring tips

### Three-part structure

Each story start should have a `storyStart` text with three distinct parts:

1. **Narrator prologue** (in `[ ]` brackets) — factual world context the player always sees. Who the player character is, what the stakes of this start are, what the nearby NPCs' names and roles are. Prevents the AI from inventing contradictory context.
2. **Character backstory** — 2–3 sentences of how this character got here. First person or second person, past tense.
3. **In-scene action** — present tense, drops the player into an active moment. Something is happening right now.

Include a `Session Opening` section in `aiInstructions` telling the AI to personalise the opening further using the player's chosen Race/Background/Class/Alignment. Static storyStart text + dynamic AI personalisation = best of both approaches.

### Opening variety (avoid identical runs)

**The problem:** Without explicit guidance, the AI tends to open every run of a story start with the same prominent NPC in the same starting area — same scene, same NPC, same tone regardless of which character archetype the player chose.

The fix is two parts:

**Part 1: Add labelled hooks to `storyStart` text.** At the end of the `storyStart` field, append a bracketed hooks block listing 4-5 different opening moments keyed to whatever trait categories define identity in your world — Class, Background, Profession, Origin, Faction, Era, etc. The AI picks the best match for the character that just rolled in.

D&D-style hooks example:

```text
[Opening hooks - pick the one that best fits this character's Background, Class, and Alignment.]
• Criminal / Rogue: ...
• Scholar / Mage: ...
• Soldier / Fighter: ...
• Folk Hero / Healer: ...
• Default: ...
```

Modern slice-of-life hooks example:

```text
[Opening hooks - pick the one that best fits this character's Profession and Background.]
• Journalist: ...
• Bartender: ...
• Teacher: ...
• Off-duty cop: ...
• Default: ...
```

The pattern — one hook per dominant trait, plus a default fallback — holds in any genre. Swap the categories for whatever your world uses.

**Part 2: Update `aiInstructions.generateInitialStart.Opening Structure`** with an explicit variety rule. The wording below uses D&D-style categories; replace with your world's trait names:

> *"Use the character's specific combination of [Race, Background, Class, Alignment, or whatever your world's trait categories are] to select the opening hook from the story start's hook list. Two characters with different category picks starting from the same story start should open in entirely different moments. Do not default to the most prominent NPC at the location. The same player running the same story start twice should encounter a different opening scene."*

Both pieces are needed: the hooks in the data, and an explicit instruction to use them.

### locationAreas must match defined areas

**The problem:** A story start's `locationAreas` places the player inside a specific area of the starting location. If that area doesn't exist (because the location has no `areas` defined, or you used a name that doesn't match), the engine has no room to put the player — behaviour is undefined.

**The problem also appears with NPC placement.** If an NPC's `currentArea` matches a story start's `locationAreas`, that NPC always appears in the opening scene — every single run, same character. This makes the opening feel scripted and repetitive.

**Rules:**

- `locationAreas` must exactly match an area key defined in that location's `areas` object.
- If the location has no `areas` (e.g. `complexityType: "simple"`), leave `locationAreas` empty or omit it.
- Before wiring a story start, check which NPCs have `currentArea` matching the intended starting area. If a major NPC lives there, every run begins with them front and centre. This may be intentional (a companion, a briefing officer) or a mistake — know which.
- For open or free-agent starts, pick a starting area that fits the character archetype, not just the most prominent location in the city. A street-level criminal should not open in the political chamber; a scout recruit should not open in the throne room.

