---
tab: "mechanics"
section: "traits"
title: "Traits"
kind: "schema"
summary: "Traits are the character creation choices - race, class, background, and any other categories you define. Each trait is a bucket of `skills`, attributes, resources, `items`, and `abilities` the chosen character receives."
order: 40
advanced: false
uiLocation: "Mechanics → Traits"
uiSubtitle: "\"Character traits\""
editor: "JSON + ADD ITEM"
related: "traitCategories - traits are grouped into categories for character creation; abilities - traits can unlock abilities via `abilities[]`; items - traits can grant `startingItems`"
---

## Example

```json
{
  "Human": {
    "name": "Human",
    "category": "Race",
    "description": "Humans are adaptable and ambitious. Quick to learn and equally quick to scheme. They dominate the central territories politically and commercially.",
    "skills": [
      { "skill": "persuasion", "modifier": 10 },
      { "skill": "history", "modifier": 10 }
    ],
    "attributes": [
      { "attribute": "charisma", "modifier": 1 },
      { "attribute": "intelligence", "modifier": 1 }
    ],
    "resources": [
      { "resource": "stamina", "modifier": 10 }
    ],
    "quirk": "You are Human. Humans are adaptable and opportunistic — no environment is entirely foreign, and no skill tree is completely closed off. When you attempt something outside your established capabilities, apply a subtle edge of competence that reflects a lifetime of picking things up from context. NPCs from other species may underestimate you initially; humans read as ordinary, which they use. In social situations where your background would be unknown, default to being underestimated rather than recognised.",
    "startingItems": [
      { "item": "leather boots", "quantity": 1 }
    ],
    "abilities": ["Determined Stand"],
    "unlockedBy": [],
    "excludedBy": ["Elf", "Dwarf", "Halfling"]
  }
}
```

## Fields

### Required arrays

These four fields must be present on every trait, even when empty:

- `startingItems` - `Array<{item, quantity}>` - required even if `[]`. A **negative** `quantity` removes that many of the item instead of granting it (useful for backgrounds that strip default gear); `0` is a no-op
- `abilities` - `Array<string>` - required even if `[]`
- `unlockedBy` - `Array<string>` - required even if `[]`
- `excludedBy` - `Array<string>` - required even if `[]`

### category and type

- `category` - must match a key in `traitCategories`. Not in the formal schema - the validator won't reject a trait missing this field - but without it the trait cannot be assigned to a category and won't appear in the character creator.
- `type` - extra-codec, not in the official schema. String classification hint, typically `"class"` or `"background"`. Omit unless you have a specific reason to use it.

### Attribute modifiers

The `attribute` string must exactly match one of the names defined in [`attributeSettings.attributeNames`](/mechanics/attributeSettings). Using a name that does not appear there causes a validation warning. Always cross-check against your world's attribute list before authoring trait modifiers.

### Skill modifiers

Start at +10 for frequently used skills, +20 for rarely used ones. Negative modifiers are valid for tradeoff builds.

> **📋 Note (trait `skills` array):** Granting a skill via a trait is a mechanical unlock. If the player did not already have the skill, the engine creates it on their sheet at Level 1. If the character already had the skill, only the modifier applies.

### Quirks

`quirk` is the AI narrator's reference for the trait during play. When a character has a trait, the narrator reads `quirk` as the active instruction for how that trait affects the world — how NPCs treat the character, what the character can and cannot do, what behavioral constraints apply. A King trait with `quirk: "The player is a king. NPCs recognize and treat them as royalty."` makes the character actually function as a king in play. A Turned trait with a detailed behavioral specification produces a character who cannot speak, cannot reason, and draws NPC fear reactions consistently across every scene. Write `quirk` as an instruction to the narrator, not as player-facing flavor.

### description vs quirk

`description` is shown to the player in the selection UI — write it to be readable and informative for someone choosing a trait. `quirk` is read by the AI narrator during play — write it as a directive that tells the narrator what is true and how to behave.

In practice, `description` and `quirk` serve different audiences and should be written differently:

- **`quirk` for non-species traits** (classes, backgrounds, expertise): a behavioral directive in second-person. "You [behavioral consequence or habit this trait produces]." State what the trait makes the character do or perceive, how NPCs react, and any mechanical constraints the narrator should enforce. Keep it tight — one to three sentences.
- **`quirk` for species traits** (races): a narrator-instruction block. Lead with "You are a [Species]." then expand with behavioral norms, how NPCs react to the species, sensory or social consequences of the species' nature. Species quirks run longer than class or background quirks because the narrator needs more context to portray the species consistently across all scenes.

### resources

Adjusts resource pool maximums or starting values at character creation.

```json
"resources": [
  { "resource": "health", "modifier": 20 },
  { "resource": "mana", "modifier": -10 }
]
```

Use for races or classes that should have significantly more or less of a given resource pool. Positive values increase the pool max; negative values reduce it.

### Trait design philosophy

"Think of traits as a bucket that can contain any number of skills, attributes, resources, abilities, startingItems, and a quirk." Races and classes use the exact same structure. The world creator decides how much mechanical weight each carries.

### unlockedBy and excludedBy (reserved, not yet enforced)

> **📋 Note (`unlockedBy` / `excludedBy` intent):** `unlockedBy` was designed as a prerequisite gate (OR logic) - a trait with `"unlockedBy": ["Race A"]` would only become selectable after the player chooses Race A. `excludedBy` was designed as mutual exclusion - a trait with `"excludedBy": ["Race A", "Race B"]` would become unselectable once either race is chosen. Together they were meant to enforce canonical trait combinations and prevent illogical builds.

> **⚠️ Warning (not yet implemented):** Per the engine's field documentation, both fields are explicitly marked **NOT YET IMPLEMENTED IN UI**. Neither field has any mechanical effect in the character creator today - all traits remain fully visible and selectable regardless of what other traits the player has chosen. A player can freely combine a Race, an Origin excluded by that Race, and a Class gated behind an Origin they did not select - no block, no warning, no visual greying occurs. The fields are reserved for future enforcement; populate them with the correct values so the constraint activates automatically if Latitude ships UI enforcement.

> **📋 Note:** Both fields still have value as authorial intent markers - they document which combinations are canonical and the AI narrator may use them as context. Include them for that purpose, but treat them as soft signals rather than gates. If Latitude ships enforcement for these fields, the JSON already contains the correct data and will work as intended without any changes.

> **📋 Note:** Do not use `excludedBy` on Class traits to prevent multi-class picks - the category's single-selection limit already handles that, and `excludedBy` adds nothing.

The only hard character-creation constraint that actually works is the category selection limit (a required category with max 1 enforces pick-exactly-one).

### Editor caveats

> **⚠️ Warning:** The following trait fields have no graphical controls in the editor (only editable via the JSON tab): `startingItems`, `abilities`, `unlockedBy`, `excludedBy`. All four are required - omitting any causes Zod validation errors even when the array is empty. The `traitCategories.traits` array (listing trait names per category) is also required. (`category` is not in the formal schema — omitting it does not cause a Zod error, but the trait will not appear in the character creator.)

### traitCategories.traits and trait.category must agree

`traitCategories.traits` is the array-of-names that controls which traits appear under each category in the character creator UI. `trait.category` is the string that identifies the trait's category for the AI. Keep them consistent: if you move a trait between categories, update both. A mismatch means the two fields describe different categories for the same trait.

### Trait removal at runtime

Via `player-traits` trigger effect:

- Attribute modifiers subtracted
- Skill modifiers subtracted
- Resource modifiers subtracted (current resource value may drop if it sat above the new max)
- Abilities removed if no other source still grants them

### Dynamic trait changes via triggers

For the canonical worked example of swapping one race trait for another mid-game (with the transformation delivered as a present-tense scene interrupt), see [Race Evolution Pattern](/mechanics/triggers#race-evolution-pattern) on the Triggers page. The [branching-paths variant](/mechanics/triggers#race-evolution-pattern--branching-paths-player-choice) handles player-choice trait progression.

```json
{ "type": "player-traits", "operator": "add",    "value": "Cursed" }
{ "type": "player-traits", "operator": "remove", "value": "Cursed" }
```

The same modifier pipeline runs as during character creation, so stat changes flow through automatically.

## Authoring tips

### 3-tier trait chain (Race → Origin → Class)

- Origin traits: `"unlockedBy": ["Human"]` (or relevant race)
- Class traits: `"unlockedBy": ["City Guard Background"]` (or relevant origin)
- Competing origins: `"excludedBy": ["Other Origin 1", "Other Origin 2"]`

### Ability-granting and class design patterns

**`abilities` is the primary ability-granting mechanism — not ability `requirements`.** Abilities listed in a trait's `abilities` array are granted directly to any character who takes that trait, bypassing the ability's `requirements` field entirely. This is the correct and reliable way to give characters class-specific or character-specific starting abilities. The `requirements` field on an ability controls what can be learned during play (and only `skill` type requirements are enforced). Do not rely on ability `requirements` to prevent a trait from granting an ability — if the trait's `abilities` array contains it, the character gets it regardless.

#### Character-exclusive abilities

Create a trait specific to that character (e.g. `"Merlin's Gifts"`) and list the exclusive abilities in its `abilities` array. Do NOT place those abilities on a generic class trait (e.g. `"Archmage"`) that other characters might also take — any character with the generic trait receives all abilities in that trait's `abilities` array. The `abilities` array bypasses requirements entirely, so listing an ability on a generic class trait grants it to all characters with that trait. The exclusive trait must also be absent from all `traitCategories` so custom characters cannot select it in the character creator.

#### Two tiers of ability within a character-specific trait

- **Abilities with no learnable skill path** — truly exclusive. If no skill threshold in the world would let a player naturally reach an ability, the only way to have it is via the trait `abilities` array. Use this for abilities that define the character's uniqueness and must never be learnable by any other character during play.
- **Skill-threshold requirement** — learnable by any character. An ability with `{"type": "skill", ...}` requirements will appear in any character's learnable pool once they meet the threshold, regardless of what trait it is also listed on. Listing it on a trait grants it at character creation for premade characters, but it remains universally learnable during play. Do not use skill-threshold requirements to try to restrict an ability to a single character.

When designing a character-specific trait: use abilities with no reachable skill path for defining uniqueness. Use skill-threshold requirements for abilities strongly associated with that character archetype but legitimate for any sufficiently trained character.

#### Class-based ability isolation

The trait `skills` array is the real gate for which ability trees a class can access. If a magic class trait grants no `martial arts` skill bonus, mage characters have 0 in that skill and cannot reach any martial arts threshold regardless of what abilities exist in the world. Keep skill bonus families strictly separated by class type — cross-contamination in the `skills` array allows characters to unlock abilities from the wrong tree through ordinary skill progression.

#### Tiered power via class variants

To gate high-tier content to premium characters only, give the relevant high-tier skill bonuses exclusively to premium class traits. Base-tier class traits max out at lower skill bonuses, so their characters cannot reach higher ability thresholds. Premium-tier class traits add the higher skill bonuses, unlocking those abilities for premium characters only. The skill threshold system enforces the gate automatically. Race traits may legitimately add cross-class skill bonuses; class traits should stay within their ability domain.

### Multi-axis character creation

A well-defined character has 3-5 distinct trait axes the player chooses from at creation. Each axis is its own `traitCategory` and contributes different things to the character. The D&D-style four-axis layout is well-tested and the AI handles it natively out of the box:

1. Race - physical/biological traits
2. Background - history and starting skills
3. Class - combat/profession role
4. Alignment - moral compass (D&D 9-alignment system or equivalent)

It is not the only working layout. A modern scenario might use Profession + Origin + Personality; a sci-fi setting might use Species + Faction + Specialization + Era; a slice-of-life world might use just Background + Personality + Defining Relationship; a horror world might collapse to Era + Survival Background + Mental State. Pick the axes that produce meaningful choices in your genre, then design traits within each. The schema is genre-agnostic — the structure is whatever your world needs.

### Trait design rules

Illustrated D&D-style; the rules generalize to other axis structures.

- Give each trait a `quirk` that instructs the narrator on the trait's signature features and behavioral constraints (e.g., "This character has Second Wind: once per short rest they can recover HP as a bonus action. The narrator should apply this and similar class features consistently."). The `description` field is what players read in the selection UI; `quirk` is what the AI narrator reads during play. The same applies to non-class traits — a Background, Profession, Faction, etc. can carry a `quirk` describing how that origin colors the character.
- Include `startingItems` that fit the trait's role and any weight/equipment restrictions you want signalled at character creation.
- Do not use `excludedBy` to prevent same-category multi-selection (e.g. two classes, two [factions](/world/factions)) — `excludedBy` has no enforcement in the UI. The category's single-selection limit already ensures one pick per category.
- Skill bonuses come in two patterns depending on design intent: **focus traits** (+15 to one defining skill, no secondary) for archetypes or specializations where the trait defines a single capability; **class traits** (+5 flat across 2-4 relevant skills) for broadly-skilled characters where the trait represents a role. Both are valid. The +15 single-skill pattern rewards focused investment; the +5 multi-skill pattern distributes the bonus across a wider capability surface. Choose based on how tight you want the class identity to be.
- Attribute bonuses for race traits: +1 to +3 per attribute, typically 2-3 positive stats. Including negative modifiers on race traits (offset by higher positive values) is a valid tradeoff approach. Background/origin traits typically grant smaller attribute bonuses (+1/+1) than racial traits.

### Equipment restrictions via aiInstructions

The trait system enforces starting items but not ongoing use restrictions. If your world wants ongoing restrictions (e.g. "mages can only use light weapons", "civilians can't carry firearms", "common-tier characters can't wield Tier 3 equipment", "non-pilots can't operate mechs"), add an `Equipment Restrictions` section to [`aiInstructions.generateStory`](/ai/aiInstructions#story) defining who can use what.

D&D-style example:

```text
Mages (Wizard, Sorcerer, Warlock): light implements only. Cannot wield swords, axes, or medium/heavy armour.
Fighters: all weapon types. Cannot cast spells without a multiclass.
```

Modern example:

```text
Civilians: cannot equip firearms or military gear.
Trained Operators: may equip any class of firearm; subject to ammo availability.
```

The mechanism is genre-agnostic — the restrictions are however your world frames "appropriate gear".

### Hiding trigger-only traits from the character creator

If you have traits that are assigned exclusively by triggers (status effects, hidden states, condition stages, etc.) and should not be player-selectable, the correct pattern is:

1. **Do not create a traitCategory entry for them.** Any entry in `traitCategories` - even with an empty `traits` array - renders a tab in the character creator.
2. **Do not put a `category` field on those traits.** Without a traitCategory entry to reference, the validator will error on any `category` value pointing to a missing category. Either omit `category` entirely or remove it.

The traits still exist in the `traits` dict and are fully functional - triggers can assign them by key name at any point during play. They simply have no character-creator presence.
