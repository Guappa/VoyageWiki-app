---
tab: "world"
section: "storySettings"
title: "Story Overview"
kind: "schema"
summary: "`storySettings` contains the world background and quest generation guidance for your scenario. `worldBackground` is the canonical world description; `questGenerationGuidance` is a targeted brief for dynamically-generated `quests`."
order: 10
advanced: false
uiLocation: "World → Story Overview"
uiSubtitle: "\"A high-level overview of your setting for the AI\""
editor: "JSON only"
related: "worldLore - companion context field; storyStarts - each start uses this as its world backdrop"
---

## Example

A working practical example you can adapt — replace the world-specific details with your own:

```json
{
  "worldBackground": "GENRE: Low-magic medieval fantasy with political intrigue and survival pressure. The supernatural exists but is uncommon, costly to use, and feared by most ordinary people.\n\nThe Compact is the largest of several successor realms that emerged after the Old War ended sixty years ago without a clear victor. Its seat of power is the Capital, a working trade city of about 90,000 governed by the Merchant Council — a body of hereditary merchant houses that has held the city through the post-war decades by managing rather than ruling. The Heartland around the Capital is rich farmland and reliable trade roads; the Frontier to the north is contested woodland still mapped from before the war; the Coast trades quietly with foreign powers everyone pretends not to notice.\n\nThe player enters this world as a newcomer to the Capital — a traveller, retainer, refugee, or someone arriving on the morning coach with reputation and not much else. They have no inherited seat, no patron yet, and the political situation is not their problem until it becomes their problem. The world rewards players who pick a side, pay attention to who owes whom what, and learn to read the gap between what the Council says in session and what gets done after the session ends.\n\nMost of the realm's people are human; elder races — elves, dwarves, halflings — maintain their own communities at the edges of human settlement and through long-standing pacts with the Compact, but ordinary travellers go weeks at a time without meeting one. None of the elder races are themselves mages by default; their reputation rests on craft, longevity, and memory of the time before the Old War.\n\nMagic is real but rare. Practitioners are licensed by the Council and most settlements have at most one. Untrained or unlicensed use carries criminal penalties. Combat is grounded — armour, training, and numbers matter more than tactical brilliance, and a serious wound takes weeks to heal even with the best care available.",
  "questGenerationGuidance": "## Quest Situations\nGround quests in concrete physical situations: specific people who need things done, named creatures or persons causing documented problems, objects that need to be found or delivered, locations that need to be cleared, escorted, or defended. Avoid abstract research tasks, philosophical objectives, and scholarly fetch-quests unless the player has explicitly signalled academic interests.\n\n## Quest Source Distribution\nMost quests should come from named NPCs the player can meet, talk to, and form opinions about. A minority can come from posted bills, faction quartermasters, or rumour at the inn. Avoid framing where 'the village' or 'the people' collectively give a quest — there is always one specific person who needs the work done and one specific person who pays.\n\n## Language and Register\nUse the register of the world throughout — period-appropriate vocabulary, no modern professional jargon, no game-mechanic language in NPC dialogue. NPCs say 'I need a strong arm and a quiet mouth', not 'I require an applicant with combat and stealth experience'.\n\n## Arc Structure\nMost multi-step arcs should have an opposing group with a base of operations the player can reach. Early arc beats describe visible consequences (a missing person, a burned farm, a strange disappearance from the market). Middle beats reveal the responsible party. Late beats converge on the confrontation point. Standalone single-quest jobs are fine and should not all chain into arcs.\n\n## Tone and Stakes\nScale quest weight to player experience, faction standing, and current world state. A new player should not be handed kingdom-threatening conspiracies in turn one. A player who has demonstrated they can handle hard work should not be sent to find lost cats. Match the offer to what the giver can plausibly know about the player's capabilities.\n\n## Quest Length and Pacing\nMost quests resolve in 3-10 player turns. Multi-quest arcs typically run 3-5 individual quests linked by shared stakes. Avoid generating extremely long arcs — players lose track and the AI loses the thread."
}
```

## Fields

### worldBackground

**`worldBackground`** is always in the AI's context — every story turn, every NPC generation, every quest. Unlike `worldLore` (retrieved by semantic search only when relevant), this field is never filtered out. Every word competes for attention with the live scene; treat the budget accordingly.

**Format:** 2-8 paragraphs depending on world complexity. Simple worlds with a single central conflict can be 1,200-1,500 chars. Worlds with multiple factions, regions, and power structures typically run 3,000-5,000 chars across more paragraphs. The core areas to cover:

1. **Core premise** -- kind of world, genre, fundamental hook
2. **Current state** -- what is happening now (politics, recent events, tensions)
3. **Power structures and geography** (for complex worlds) -- who controls what, where the meaningful conflict zones are
4. **Tone and atmosphere** *(optional)* -- how the world should feel
5. **The player's entry point** *(optional)* -- what role the player occupies and what they have access to at the start

### questGenerationGuidance

**`questGenerationGuidance`** is the primary lever for the structure and tone of engine-generated quests. `worldBackground` describes what the world *is*; `questGenerationGuidance` describes what the world *wants the player to do*. A directive like "emphasize political intrigue over monster hunting" steers all new quest generation.

**`questGenerationGuidance` most valuable use:** explicitly define when the engine should create a quest arc vs. a standalone quest — what situation warrants a multi-quest chain, and what should remain self-contained. Without this rule the engine makes arbitrary arc decisions that may not fit the world's pacing or scope.

## How the fields fit together

### Field comparison

| Setting | Purpose | When Used |
|---------|---------|-----------|
| `worldBackground` | Core premise, always in context | Every generation task |
| [`narratorStyle`](/other/narratorStyle) | Voice/tone override | All narrative output |
| `worldLore` | Detailed background info | Retrieved by semantic search when relevant |
| `aiInstructions` | Per-task behavior | Fine-tuning specific AI tasks |