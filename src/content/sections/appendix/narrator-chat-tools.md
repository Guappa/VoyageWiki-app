---
tab: "appendix"
section: "narrator-chat-tools"
title: "Narrator Chat Tools"
kind: "guide"
summary: "Read and modify tools the narrator can call through the in-game chat. Listing of every tool and what it returns or changes."
order: 50
advanced: false
---

The narrator chat interface (the chat icon while playing) works like any AI chat - you write plain prose requests and the narrator interprets them. The key constraint is that the narrator can only act on your request using the tools listed below. If a change isn't expressible through one of these tools, the narrator cannot make it happen regardless of how you phrase the request. The tools are the full extent of what narrator chat can do.

#### Read Tools

When you ask the narrator for information, it uses these tools to read game state and relay the results back to you in prose.

| Tool | What it returns |
|---|---|
| `getPlayerState` | Full character state: resources, inventory, [skills](/mechanics/skills), [traits](/mechanics/traits), attributes, and level |
| `getPartyLocation` | Current realm, region, location, and area; nearby [locations](/world/locations) and travel distances |
| `getLocationInfo` | Historical and geographical details for a specific realm, region, or location |
| `getNearbyNPCs` | All NPCs present in the current area |
| `getSceneNPCs` | NPCs currently active in the narrative scene (subset of nearby) |
| `getNPCState` | Deep profile for a specific NPC: personality, hidden info, relationship status |
| `getCombatLogs` | Recent combat events, damage calculations, and ability effects |
| `getActiveQuests` | Current objectives and available quests |
| `getWorldInfo` | World-level settings: valid attributes, stats, and item categories |
| [`getMoreStory`](/ai/aiInstructions#story) | Earlier story history that has been truncated from the active context |
| `getMoreChat` | Earlier chat history that has been truncated from the active context |

#### Modify Tools

When you ask the narrator to change something, it applies the change by calling one of these tools. The narrator interprets your request and decides which tool fits - you do not call them directly.

**Characters and resources**

| Tool | What it does |
|---|---|
| `modifyResource` | Set or adjust a resource value (health, mana, stamina, etc.) for the player or an NPC |
| `editCharacter` | Modify core attributes, level, or status effects |
| `addSkill` / `updateSkill` / `removeSkill` | Manage skill levels and XP |
| `addAbility` / `removeAbility` / `getPlayerAbilities` | Manage unlocked [abilities](/mechanics/abilities) |
| `addTrait` / `removeTrait` / `listTraits` | Manage permanent traits and their modifiers |
| `changeCharacterVoice` | Directly change the TTS voice profile for a player or NPC. Pass the voice tag in the same format used by the `voiceTag` field -- see [Voice Catalog](/appendix/voice-catalog) for the full list of valid tags and audio previews |

**Inventory**

| Tool | What it does |
|---|---|
| `addItem` | Add an item to the player inventory |
| `removeItem` | Remove an item from the player inventory |

**NPCs**

| Tool | What it does |
|---|---|
| `newNPC` | Create a new NPC in the current area |
| `editNPC` | Change an NPC's name, description, personality, or status |
| `addNPCToScene` | Bring an NPC into the active narrative scene |
| `removeNPC` | Remove an NPC from the active scene |
| `listRemovedNPCs` | List NPCs that have been removed from the scene (for restoration) |
| `updateNPCLocation` | Move an NPC to a specific location and area |
| `regenerateNPCPortrait` | Queue a portrait regeneration for a named NPC. Usage: `regenerateNPCPortrait <NPC name>`. Queues successfully but reported to have mixed results in practice - portrait may or may not update visibly. |

**World**

| Tool | What it does |
|---|---|
| `moveParty` | Relocate the player and party to a different existing location |
| `createArea` | Create a new sub-area within the current location |

**Story**

| Tool | What it does |
|---|---|
| `rewriteLastStory` | Correct errors in the most recent narrative post (replaces the previous story beat) |
| `openFeedbackModal` | Open the bug report form (requires explicit request) |