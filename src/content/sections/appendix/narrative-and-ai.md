---
tab: "appendix"
section: "narrative-and-ai"
title: "Narrative & AI Authoring"
kind: "guide"
summary: "Cross-cutting authoring guidance for the narrator AI."
order: 30
advanced: false
---

### Narrative Bridge

The engine resolves every player action to a result - success, partial success, or failure. The narrator then chooses the **path**: the specific scene moment that delivers that result. The narrator does not announce "you failed" - it constructs a contextually appropriate explanation for why the outcome happened, drawing on everything it knows about the scene.

> **📋 Note:** The engine provides the roll result; the narrator independently selects the reactive outcome (an NPC dodge, a social rebuff, an environmental hazard giving way) based on scene context. No schema field is required for this behaviour.

**What governs the choice**

The narrator uses a hierarchy of world truths when selecting a reactive outcome:

- **NPC `personality` and `status`** - Character [traits](/mechanics/traits) shape the flavor of every NPC reaction. An "Arrogant" NPC dismisses; a "Fearful" NPC bolts; a "Pragmatic" NPC redirects to the mission without explanation.
- **World tone** - The overall register of the world influences consequence severity. Grimdark worlds produce injury and loss on failure; heroic worlds produce setbacks or humorous mishaps.
- **Margin of failure** - The narrator scales consequence to the gap between roll and threshold. A near-miss produces a soft reaction; a catastrophic failure produces a hard one (the NPC calls the guards, the item breaks).

**How creators steer the outcome**

While the narrator has full discretion over the specific flavor of a reactive outcome, creators can narrow that discretion using these fields:

- **`aiInstructions`** (strongest tool) - Explicit failure-handling rules override narrator defaults. Example:

> "When the player fails a stealth check in the Vault District, always emphasize audible consequences - armor clatter, a snapping twig - rather than visual ones."
- **NPC `personality` and `hiddenInfo`** - Character traits are read directly when generating reactive behavior. A well-defined NPC reacts in-character without additional instructions.
- **Location `visualTags`** - Tags such as `"unstable"` or `"cramped"` make environmental reactive outcomes more likely. The narrator treats these as physical truths of the space.

The schema defines the **physics** of the world; `aiInstructions` defines the **director's notes**. The narrator follows both, then fills in the specific "how" based on the current scene.

The Narrative Bridge applies to more than just failure outcomes. The narrator also handles several persistent behaviors without explicit instruction: combat sequencing uses a fair initiative-free structure, and equipment used outside a character's proficiency produces natural narrative friction rather than a hard block. See the Custom Mechanics Patterns section above for the full breakdown of what the narrator handles by default versus what requires explicit construction.

### Narrative Quality - Prose and Character Principles

These principles come from comparative analysis of a high-quality V33 scenario that produces noticeably better narration. Apply them in [`generateStory`](/ai/aiInstructions#story) and `generateInitialStart`.

---

**Victory and Downtime**

Add a dedicated `Victory and Downtime` key in `generateStory` to explicitly define how celebration and rest scenes should be handled:

> After a party win (fight won, escape succeeded, goal achieved), if the players are resting, celebrating, or enjoying the moment - focus the entire turn on that celebration. Do not narrate new threats, ticking clocks, betrayals, or escalations. When players rest, slow time down to a crawl.

Pair with a general narrative rhythm rule: not every moment needs stakes. Some scenes are best as a drink in a good tavern, a conversation with a companion, watching the sun rise over the hills. These moments make high-stakes scenes land harder.

---

**Describing Characters - Prohibit Clichéd Physical Description**

Add a section to `generateStory`'s `custom` key with a banned list and description rules:

- Banned gestures list: jaw clench, grip tighter, knuckles whiten, hand on hilt, exchange glances, eyes widen, step closer, etc.
- Banned words: weathered, calloused, practiced efficiency, calculating, resonate, pulse with energy, echo, whisper, crystal catching light.
- Rule for new characters: describe directly (height, build, coloration, one permanent distinctive feature - what you would see in a photograph).
- Rule for established characters: show them acting ("She looks up from her work, frowning") - not the narrator labeling their reaction.

---

**Show, Don't Tell**

Include in the same `custom` section:
> When a character does something, do not explain why or what it means. Actions speak for themselves. Show emotions - do not explain their causes. Let unexplained emotion be the story. Do not describe what a character is *like*. Describe what they do and say.

---

**Scene Shape - Dialogue Without Narration**

By default, the AI inserts a narrator paragraph between every line of dialogue. Add a scene shape section to `generateStory`'s `custom` key:

> Dialogue can run for two, three, four lines in a row with no narrator interjection - this is normal and good. A narrator line between dialogue lines must earn its place: someone moves, something physically changes. "She looked at him with interest" does not earn a narrator line. When a character's dialogue already shows their emotion, do not have the narrator describe the emotion too.

---

**NPC Social Resistance**

Include in `Character Behavior`:

> NPCs do not melt at the first compliment, agree with the player to be agreeable, or become allies after one conversation. Trust, respect, and affection are earned through sustained engagement. NPCs can say no, change the subject, be unimpressed, or simply be busy - not every NPC is available and eager. Resistance makes eventual connection feel earned.

---

**Intent Quality Gates (generateNPCIntents)**

Before generating an intent for any NPC not directly addressed by the player, the AI should verify three things:
1. Can the NPC perceive what they'd react to?
2. Does the NPC have reason to act *right now* (not just something they could say)?
3. Is any other NPC already covering the same beat?

Escalation must be gradual (calm → annoyed → confrontational → hostile, one step per justified provocation). De-escalation is mirrored: when the player de-escalates, NPCs come back down.

---

**Resource Costs (generateActionInfo + usageInstructions)**

Ability descriptions are the wrong place for resource cost rules — put them in `usageInstructions` on the resource itself, or in `generateActionInfo.custom`.

Include resource cost rules in `generateActionInfo.custom`. Without explicit rules, the AI invents resource costs inconsistently. A well-structured entry follows this pattern:

| Effect | Mana cost |
|---|---|
| Trivial magic (cantrip-level) | 0–2 |
| Moderate magic (combat spells, useful illusions) | 5–10 |
| Major magic (large destruction, terrain, powerful summons) | 15–25 |
| Legendary magic (world-altering, ritual-scale) | 30–50 |

Failed spells still cost Mana - the power was drawn even though the effect failed. Include health damage ranges (minor −1 to −15%, solid −5 to −25%, severe −15 to −50%) and explicit "do not deduct when" rules (past-turn wound mentions, looking around, sleeping).

---

**questGenerationGuidance - Shape Every Engine-Generated Quest**

The [`storySettings.questGenerationGuidance`](/world/storySettings) field shapes the quality and style of every engine-generated quest for the duration of a session. Populate it with a brief covering:
- What situations make good quests (physical, actionable, grounded in specific people and places)
- Language to avoid (modern framing, scientific terminology, abstract goals)
- Arc structure (antagonist with a base of operations; early secrets describe visible effects, late secrets converge on a confrontation point)
- Tone (heroic adventure, not generic errand)
- Explicit constraints: standalone-by-default, content bans, arc creation criteria

A well-written `questGenerationGuidance` makes engine-generated quests feel like they belong in the world.