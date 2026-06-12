---
tab: "world"
section: "npcs"
title: "NPCs"
kind: "schema"
summary: "`basicInfo` is what the narrator reads during play, so any appearance you want described in play must live here; it is also the image generator's source when `visualDescription` is empty. `hiddenInfo` is what the player has not yet discovered (revealed only through play). `visualDescription` is read only by the image generator (never the narrator) and takes priority over `basicInfo` for portraits, so use it alongside `basicInfo` only for image-specific appearance the narrator should not describe."
order: 70
advanced: false
uiLocation: "World → NPCs"
uiSubtitle: "\"Specific named pre-defined NPCs\""
editor: "JSON + NPC EDITOR modal + ADD NPC"
related: "factions - NPCs link to factions via `faction`; quests - NPCs serve as quest givers and targets; npcTypes - type templates NPCs can inherit from; triggers - NPC-specific trigger conditions"
---

## Example

```json
{
  "Councillor Maren Halst": {
    "name": "Councillor Maren Halst",
    "type": "character",
    "currentLocation": "The Capital",
    "currentArea": "Council Hall",
    "tier": "elite",
    "gender": "female",
    "faction": "The Merchant Council",
    "basicInfo": "Current chair of the Merchant Council and its most senior member by tenure. Silver-streaked hair worn severely back, pale eyes that assess before they greet — she enters a room and immediately establishes which exit she would use. Formal council robes, understated jewelry that costs more than it appears to. She has held her seat for nine years and has not lost a vote of consequence in four.",
    "hiddenInfo": "In a directed arrangement with a criminal syndicate for three years — not merely looking away but actively redirecting city watch patrols away from specific warehouses on scheduled nights. She believes this is a controlled exposure she can end at any moment. The syndicate has prepared documentation sufficient to destroy her and is planning to expand their demands, using her exposure as leverage for permanent council access. A junior colleague is in the same arrangement and does not know the full scope of what she committed to at the outset; he has recently begun showing anxiety. She is watching him and will move first if she concludes he is about to break. A copy of the incriminating documents she declared destroyed last session sits in the Old Customs Vault with a syndicate intermediary who does not know their significance.",
    "personality": [
      "treats warmth as a tool to deploy, not a state to inhabit",
      "weighs every conversation for what can be extracted from it before the other person has finished speaking",
      "comfortable holding silence until the other side fills it past their position",
      "will distance herself from a compromised ally the moment the calculation changes",
      "precise with language — completes every sentence, closes every door before starting the next",
      "reads anxiety in others as information to be filed, not empathy to be offered"
    ],
    "abilities": [
      "Civic Authority: as council chair she commands procedural compliance from the senior bureaucracy. Useful for opening doors closed to outsiders. Loses force outside the Capital's institutional context.",
      "Negotiation: reads counterparties for leverage faster than they read her. Comfortable holding silence until the other side speaks past their position. Most effective when she controls the venue.",
      "Public Speaking: command of the council chamber and the public square. Calibrates tone between conciliation and rebuke without breaking pace. Has not lost a vote of consequence in four years.",
      "Investigation: maintains a private network of informants among clerks, dockworkers, and household staff. Knows about most political moves a week before they surface. Keeps the network entirely off the council's books.",
      "Self-Preservation: trained instinct for distancing herself from compromised allies before exposure. The Dockside Brotherhood arrangement is the first time this instinct has failed her, though she does not yet know that.",
      "\nfighting style: Maren does not fight directly. She wins through institutional position, prepared evidence, and the credible threat of consequences delivered through other people. In a physical confrontation she would be a liability rather than an asset, and she knows it -- her bodyguards are not for show. Her Self-Preservation instinct is the most dangerous thing about her in a crisis: she will sacrifice an ally to a council inquiry the moment she calculates the alliance is no longer net-positive. She adapts to new threats by acquiring new informants, not by changing methods. The deeper a problem goes, the further she retreats into procedural cover."
    ],
    "vulnerabilities": ["psychic"],
    "resistances": ["bludgeoning"],
    "immunities": ["fear"],
    "level": 10,
    "hpMax": 60,
    "portraitUrl": "https://world-assets.example/npc/maren-halst.webp",
    "known": true
  },
  "Inkwell": {
    "name": "Inkwell",
    "properName": "Davan Mosse",
    "type": "character",
    "currentLocation": "The Capital",
    "currentArea": "Lower District Tavern",
    "tier": "average",
    "gender": "male",
    "faction": "",
    "basicInfo": "A city watch informant who operates under the street name Inkwell, known only by reputation to most of his contacts. Lean build, early forties, a permanent ink stain on his right hand from a scribing job he uses as cover. Cheap working clothes, nothing that marks him as notable.",
    "hiddenInfo": "His real name is Davan Mosse. He has been feeding information to both the watch and the syndicate for two years, carefully balancing what each side learns to prevent either from burning him. The watch believes they own him exclusively. The syndicate does not know he is an informant. He knows approximately three things that would destroy each side's current operations if surfaced to the other, and is aware that this is the only reason he is still alive.",
    "personality": [
      "reads every room before committing to a position",
      "appears to remember nothing and forgets nothing",
      "charges for information but gives it at face value once paid",
      "speaks quietly, never repeats himself"
    ],
    "abilities": [
      "Street Intelligence: knows the current state of most active criminal operations in the lower district within a week's lag. Will share for coin or equivalent favour.",
      "Cover Maintenance: the scribing job is real and provides a plausible reason to be almost anywhere in the city at most hours.",
      "Evasion: experienced at moving through the city without being followed. Not a fighter; won't engage if there is any alternative.",
      "Double Channel: maintains separate credible relationships with the watch and the syndicate without either knowing about the other.",
      "Document Access: can obtain or forge minor official documents through his scribing contacts. Takes time and costs extra.",
      "\nfighting style: Inkwell does not fight. He runs, hides, or surrenders. His survival strategy is to never be in a situation where fighting is the only option, and he has been successful at this for two years. If cornered, he will immediately offer information as currency."
    ],
    "level": 1,
    "hpMax": 30,
    "known": true
  }
}
```

## Fields

### type

The NPC's [`npcTypes`](/world/npcTypes) key — required (codec-enforced). The value must be a key defined in your world's `npcTypes` dict, or an empty string (`""`) for fully unique NPCs that don't share a damage profile with any type. Use a named type when this NPC shares a damage profile (`vulnerabilities` / `resistances` / `immunities`) with a defined species, creature category, or profession. Damage-profile arrays declared directly on the NPC **union** with the type's arrays — they add to it rather than replacing it.

### tier

Controls intent complexity, health scaling, and damage output. See [Combat mechanics](#combat-mechanics) for the full tier tables.

| Tier | When to use |
|---|---|
| `trivial` | Fodder, ambient crowd, zero-stakes |
| `weak` | Minor obstacles |
| `average` | Standard encounter NPCs |
| `strong` | Named story NPCs |
| `elite` | Named story NPCs, faction leaders |
| `boss` | Major antagonists |
| `mythic` | World-level threats |

`generateNPCDetails` fires for any NPC where `detailType: "basic"` and `needsDetailGeneration: true` — not gated by tier. Tier controls whether `characterArchetypes` and `authorSeeds` are consulted within the task (strong / elite / boss / mythic only).

### detailType

Usually omit (auto-set at runtime). Defaults to `"detailed"` when omitted, so authored NPCs do not need to set it. `"detailed"` prevents `generateNPCDetails` from running for this NPC (authored content is preserved permanently); `"basic"` allows the engine to flesh out or overwrite NPC detail dynamically, and may reset detail that has not been encountered for an extended period.

### level

Set explicitly for any NPC who should be stronger than the party — an explicit value is used as-is. If omitted, the engine rolls a level near the party average **at the moment the NPC first becomes visible** (so it tracks the party's level at that point), then clamps it into the `npcLevelRange` of the NPC's location, or the region's range if the location defines none. Each NPC level adds +2 to the NPC's base damage.

### healthMultiplier

Per-NPC scalar on the NPC's *calculated* maximum HP -- the value derived from `level` and `tier`. Default `1.0`; `0.5` halves the pool, `2.0` doubles it, with values clamped to the `0.1`–`100` range. Affects the HP pool only, not damage output. Ignored when `hpMax` is set explicitly -- use one or the other, not both.

### personality

Must be an `Array<string>`, not a single string. The editor textarea auto-converts to an array on save, but JSON authored directly must already be an array or validation fails. Keep entries behavioral ("calculates every conversation for leverage") not adjectival ("smart, ruthless, charming").

### abilities

Narrative context for the AI, not references to the top-level `abilities` section. They are not validated against that section and cannot be used by the player. Each entry is a prose capability description; the final entry is a fighting-style summary. See [abilities format](#abilities-format) under Authoring tips for the writing conventions.

> **📋 Note (exposure and per-turn sampling):** `abilities` (along with `basicInfo` and `hiddenInfo`) reach the AI only when the NPC is `detailType: "detailed"`. They feed the combat-intent and detail-generation tasks but are **not** sent to the story narration. When generating combat intents the engine samples about 3 of the NPC's abilities at random each turn, re-sampling every turn — so a long ability list surfaces variety over a fight rather than all at once.

### aliases

Alternate names and titles this NPC also answers to (e.g. `"the captain"`, `"Reed"`). They are used **only to match player input and dialogue back to this NPC** during speaker attribution — they are never sent to the AI, so they shape recognition, not what the narrator writes. Include only forms a player or another character would actually type or say.

### vulnerabilities, resistances, immunities

These **union** with the NPC's `npcType` arrays; the engine merges both. Use only when this specific NPC needs a damage profile beyond what its type provides.

### visualDescription

Read only by the image generator, never by the story narrator. The generator uses `visualDescription` when it is set and falls back to `basicInfo` when it is empty. Because the narrator never reads `visualDescription`, any appearance you want described in play must live in `basicInfo` regardless — the narrator has nothing else to draw from. So `basicInfo` always carries the narrated appearance, and `visualDescription` is an optional companion for portrait-only details: leave it empty and the portrait falls back to `basicInfo` (the simple default), or set both when you want the image to show specifics the narrator should not lock in.

There is one legitimate reason to populate `visualDescription`: when you want appearance prose fed *only* to the image model and explicitly *not* to the story narrator. Example: the story AI describes a character as "dressed plainly" without locking in colors or patterns every scene, but the image generator sees "faded blue tunic with patched sleeves, leather belt, scuffed boots" so portraits come out consistent across regenerations. In that case the split is the point. Outside that narrow case, leave the field empty.

### known

Set to `false` for NPCs the player must discover. Use a `known-entity` trigger effect to reveal them at the right story moment. The narrator will still describe the NPC's visible behavior when `known: false`, but will not name them or expose their identity.

### currentLocation and currentArea

Must reference existing location keys and area keys respectively, or validation warnings appear. **If a location has no areas defined (`"areas": {}`), any NPC placed there must omit `currentArea` entirely** — setting it to any string value will produce a validation error because no valid area key exists to match against. The fix is to add areas to the location first, then assign NPCs to those areas.

> **📋 Note:**
> - These fields are `currentLocation` and `currentArea` (confirmed by the UI labels "CURRENT LOCATION" and "CURRENT AREA") - not `lastLocation`/`lastArea`.
> - The `type` field (e.g. `"character"`) is required.
> - `personality` must be an `Array<string>`, not a plain string.

### Key/name match

NPC outer keys must exactly equal the inner `name` display string. `"Common Thug"` not `"common_thug"`. This applies identically to [items](/world/items), quests, traits, and all other keyed maps. Always build with `{npc["name"]: npc}`.

## Combat mechanics

`tier` controls three things at combat time: HP, damage output, and intent complexity. The HP scaling derives from `(npcHealthPerLevel * level + npcMinHealth) * tierHPModifier`.

### HP multipliers

Applied to the NPC's level-derived base HP.

| Tier | HP multiplier |
|------|---------------|
| trivial | 0.15x |
| weak | 0.5x |
| average | 1.0x |
| strong | 1.25x |
| elite | 1.5x |
| boss | 1.7x |
| mythic | 1.85x |

### Damage multipliers

Applied to NPC damage output.

| Tier | Damage multiplier |
|------|-------------------|
| trivial | 0.65x |
| weak | 0.8x |
| average | 1.0x |
| strong | 1.12x |
| elite | 1.25x |
| boss | 1.4x |
| mythic | 1.55x |

NPC base damage scales at a flat **+2.0 per level** with no milestone bonuses, before the tier multiplier above. Players scale at +2.5 per level *plus* the every-5-levels milestone bonus, so an equal-level player slightly out-damages an `average`-tier NPC by design.

### NPC success rolls

NPCs have no skills or attributes to roll, so each NPC attack's success level is fixed RNG every turn:

| Outcome | Chance |
|---------|--------|
| critical success | 10% |
| great success | 20% |
| success | 40% |
| basic success | 30% |

The only thing that pushes an NPC attack below `basic success` is **combat conflict**: when a player's defend action succeeds, it degrades the attacking NPC's outcome (a strong defense can turn the NPC's attack into a failure).

### Encounter difficulty multipliers

Encounter difficulty scales NPC damage and health by engine constants (not configurable), applied on top of the tier multipliers:

| Difficulty | NPC damage | NPC health |
|------------|------------|------------|
| very easy | 0.7x | 0.5x |
| easy | 0.85x | 0.75x |
| medium | 1.0x | 1.0x |
| hard | 1.15x | 1.25x |
| very hard | 1.3x | 1.5x |

### Combat intent complexity

| Tier | Intents per turn | Behavior |
|------|-----------------|----------|
| trivial / weak | 1 | Simple, direct actions |
| average | 1-2 | Basic tactics |
| strong | 2 | Uses abilities when appropriate |
| elite / boss / mythic | 2-3 | Tactical and dramatic |

### Death countdown

NPCs with tier `elite`, `boss`, or `mythic` — and party member NPCs — use a 3-turn [death](/mechanics/death) countdown rather than dying instantly at 0 HP:

| Turn | Status | Description |
|------|--------|-------------|
| 1 | `near death` | Just went down - can still be healed or stabilized |
| 2 | `dying` | Slipping closer to death |
| 3 | `dead` | Permanently dead, cannot be revived |

Standard tiers (`trivial`, `weak`, `average`, `strong`) die instantly at 0 HP. This makes elite+ NPCs dramatically survivable for boss fight purposes.

A party-member NPC below `elite` is automatically promoted to `elite` when it levels up alongside the party, so long-term companions become major NPCs over time — gaining the death countdown and the higher HP and damage modifiers rather than dying instantly.

## Authoring tips

- Use `detailType: "detailed"` for story NPCs you've carefully defined. The AI won't overwrite them. Use `"basic"` for background NPCs who can be lightly improvised.
- **Starting zones must contain no character NPCs.** Place all story NPCs in a non-starting area of the same location. Starting zones should contain only generic `humanoid_enemy` or ambient types with no faction.
- **`basicInfo` must not reference a different area than `currentArea`.** `basicInfo` may name no location area at all, or must name only the NPC's actual `currentArea`. Remove any cross-area references.

> **📋 Note:** `currentArea` is the field of record for scene population - the narrator uses it as the definitive source for which NPCs are physically present in a location, and `basicInfo` is treated as purely narrative description. If the two fields conflict, the NPC appears in `currentArea` and `basicInfo` is read as outdated background text. The schema reflects this: `currentArea` is required on every NPC, `basicInfo` is optional.

### basicInfo format

One to several sentences integrating role, one specific appearance detail, and current situation. The most effective entries fuse these into a paragraph that reads as continuous narrative rather than a checklist. Length scales with NPC importance — minor NPCs can be a single sentence, named story NPCs warrant a full paragraph (250–600 chars).

Two techniques that distinguish memorable entries from flat ones:
- **Behavioral contradiction embedded in appearance:** "An easy slouch that straightens faster than it should. Grins too easily but watches too carefully." The contradiction signals hidden depth without stating it.
- **Current situation for major NPCs:** What are they doing or trying to do *right now*, not just what they generally are. "Studying maps and watching newcomers" tells the narrator more than "a strategic planner."

### hiddenInfo structure

`hiddenInfo` carries the full interior life of an NPC — what the narrator knows that the player doesn't. A single "secret that contradicts basicInfo" is the minimum. For named story NPCs, strong hiddenInfo addresses several layers:

1. **The contradiction** — what is false or incomplete about `basicInfo`
2. **Real motivation** — what the NPC is actually trying to achieve
3. **Mechanism of concealment** — how they maintain the facade, who else knows, how they operate
4. **Leverage point** — their vulnerability, pressure point, or the thing that can change their behavior
5. **Connections** — which other NPCs or factions know what about them

For minor NPCs a single sentence per layer is enough. For named story NPCs, 400–1500 characters is the production norm — this is the field the AI reads when the player digs into the character, and sparse entries produce flat behavior under scrutiny.

### personality format

4-10 entries of behavioral phrases, labeled descriptions, or short behavioral sentences. The core principle: **behavioral, not adjectival**. "Calculates every conversation for leverage" is better than "calculating." "Remembers every slight, names none of them" is better than "holds grudges." Each entry should describe something specific and observable.

Three formats that all work in practice:
- **Phrase fragments** (dense, vivid): `"warmth indistinguishable from genuine compassion"`, `"watches exits before faces"`
- **Label: explanation** (readable): `"Conflict Avoidant: seeks peaceful resolution before escalation"`, `"Forest Guardian: deep connection to the wilds"`
- **Behavior sentences** (comprehensive): `"Acts far more feeble than actually is"`, `"Maintains secret vanity about appearance"`

A speaking-style entry is optional but useful for NPCs with dialogue: include it when the NPC's voice pattern is distinctive enough to warrant consistent enforcement.

### abilities format

Recommended for combat-relevant NPCs: at least five abilities followed by a fighting-style summary as the final entry.

Each ability entry is a string in this shape:

```text
"Ability Name: 3 sentences - what it is, what it does, how it can be used."
```

The fighting-style entry is longer and more detailed, and starts with a literal `\n` character so the engine renders it on a fresh line in the abilities list:

```text
"\nfighting style: [5 sentences covering combat approach, ability synergies, emotional tone in combat, tactical preferences, adaptation]"
```

Sample ability array shape:

```json
"abilities": [
  "Investigation: constructs and pursues evidence chains; comfortable working with incomplete information. Tracks contradictions across statements; follows leads to their source. Useful for any scene requiring deduction or interrogation.",
  "Combat Reflexes: trained to react before deciding. Reduces hesitation in ambush situations and chaotic melee. Lets her engage from a non-ideal starting stance without penalty.",
  "Streetwise: reads the political weather of any neighborhood within minutes. Identifies who matters, what protections are in place, and which doors are open to her. Useful for navigating cities cold.",
  "Intimidation: uses presence rather than threats. Makes people decide cooperation is the easier option without any specific pressure being applied. Loses effectiveness against opponents who outrank her socially.",
  "Patience: outwaits an opponent's first move. Comfortable holding position for hours until conditions favor her. The longer she's been in a stakeout, the harder she is to displace.",
  "\nfighting style: She fights like an investigator who happens to be armed -- patient, observant, looking for the moment when an opponent commits. Her Combat Reflexes pair with Patience for ambush kills, but she will pivot to Intimidation if a fight can be settled without one. She is unhurried under pressure and does not telegraph her intentions, making her hard to read in the early rounds. Against multiple opponents she falls back to terrain and lets them sort themselves out before engaging. She adapts more readily to new opponents than most fighters because she treats every fight as a problem to solve, not a routine to execute."
]
```

Writing rules:

- **Ability descriptions directly influence NPC combat behavior.** The AI references abilities by name and uses their descriptions to generate varied actions. Vague descriptions produce repetitive output.
- **Each entry should cover a range of related actions, not one narrow technique.** `"Investigation: constructs and pursues evidence chains; comfortable working with incomplete information"` is more useful than three entries each describing a single specific deductive action.
- **For higher-tier NPCs (`elite`, `boss`, `mythic`)** that take 2-3 intents per turn, cover 4-5 genuinely different situational domains: combat, social, institutional, domain-specific expertise, sensory/attunement. Breadth across domains matters more than depth within any single one, because the AI will otherwise repeat the same ability entries.
- **Magic-capable NPCs:** use the form `"<Type of magic> - Sub-capability: specific application"` to telegraph the magical school the AI should reach for.
- **Species ability inheritance:** when an NPC is assigned a species `type`, copy that species' three [skills](/mechanics/skills) (from the corresponding `traits` entry) into the NPC's `abilities` array verbatim, then add 2+ unique entries for the individual, then close with the fighting-style summary.

> For all valid `voiceTag` values and audio previews, see [Voice Catalog](/appendix/voice-catalog).

### Tier guidance

- Most named story NPCs → `elite`
- Regular background NPCs → `average` or `strong`
- Boss-tier enemies → `boss`, unique monsters → `mythic`
- Civilians and non-combatants → `trivial`
- Bandit lookouts, minor creatures → `weak`
- Standard guards, common enemies → `average`
- Veteran soldiers, mid-tier enemies → `strong`
- Zone bosses, major antagonists → `boss`
- Unique world-defining entities → `mythic` (use sparingly)

### generateNPCDetails override

The `custom` key in `generateNPCDetails` (and other AI tasks) is appended after all named sub-tasks. Prefacing it with `OVERRIDE: All instructions above are replaced by the rules below.` effectively demotes the platform's default NPC detail instructions and replaces them entirely with your own. This gives you precise control over what the engine outputs when building NPC state — exact labeled fields, format, content requirements. Use sparingly and only when the default output format is structurally wrong for your world.
