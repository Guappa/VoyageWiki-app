---
tab: "mechanics"
section: "skills"
title: "Skills"
kind: "schema"
summary: "Skills are the rolled actions characters attempt. Each skill connects to one attribute (which contributes to the check total), has a `type` string for difficulty bonuses, and a description that defines what it covers."
order: 30
advanced: false
uiLocation: "Mechanics → Skills"
uiSubtitle: "\"Available skills and their mechanics\""
editor: "JSON + ADD ITEM"
related: "abilities - ability `requirements` reference skill names and thresholds; traits - trait bonuses add to skill rolls; triggers - trigger conditions can reference skill keys"
---

## Example

```json
{
  "acrobatics": {
    "name": "acrobatics",
    "type": "utility",
    "attribute": "dexterity",
    "description": "Tumbling, balancing, escaping restraints. DC 10: basic balance. DC 15: combat tumbling. DC 20: acrobatic attacks. DC 25: impossible-seeming feats of agility.",
    "startingItems": [
      { "item": "leather boots", "quantity": 1 }
    ],
    "abilities": ["Tumble", "Recover Footing"]
  },
  "athletics": {
    "name": "athletics",
    "type": "combat",
    "attribute": "strength",
    "description": "Melee combat, climbing, swimming, grappling. DC 10: basic attacks and physical tasks. DC 20: powerful strikes, scaling walls. DC 30: exceptional feats of strength. DC 40+: legendary physical achievements.",
    "startingItems": [
      { "item": "Shortsword", "quantity": 1 }
    ],
    "abilities": ["Precision Strike", "Whirlwind"]
  }
}
```

## Fields

### type

Must match a key in `skillTypeDifficultyBonus`. Types are entirely world-defined — only `"none"` (with a bonus of 0) is a documented default; any other type strings you use must be defined in `skillTypeDifficultyBonus`. Conventional values are `"combat"` (anything that deals damage) and `"utility"` (everything else). "Only use utility if you **never** plan to deal damage with it. If it's a hybrid skill, make it combat." Note `acrobatics` above is utility — it describes movement and escape, but if a player wanted to deal damage with an acrobatic maneuver, they'd roll `athletics` instead.

> **📋 Note (`"combat"` is mechanically special):** Beyond the difficulty bonus, the exact type string `"combat"` is the only type that adds damage. When an attack uses a `type: "combat"` skill, it gains a flat bonus scaling with that skill's linked `attribute`: `max(0, floor((effectiveAttribute - 6) / 2))` added to damage — i.e. +1 per 2 attribute points above 6, so an attribute of 14 adds +4. Skills of any other type deal no attribute-scaled damage. Give an attack skill `type: "combat"` if you want it to scale damage with its attribute. This is the per-skill bonus referenced under [Attributes → attributeDamageModifiers](/mechanics/attributeSettings#attributedamagemodifiers); the global `attributeDamageModifiers` percentage stacks on top of it.

### attribute

Governs the attribute contribution to the check total. **Must match a name in `attributeSettings.attributeNames`** — the validator enforces this cross-reference. Recommend a fairly even mix of skills per attribute; 1–3 attributes per character class is a good target. A D&D-style scenario typically maps to `strength`, `dexterity`, `intelligence`, `wisdom`, and `charisma`.

### description

**The primary AI guidance for this skill.** Include: what actions it covers, difficulty thresholds for specific tasks, how powerful effects are. This is the field the AI reads as its primary reference for this skill during play. DC thresholds serve dual purpose: as the target numbers for resolving checks, and as narrative scaling guidance — a roll of 12 on a skill with "DC 10: basic success, DC 20: powerful strike" produces a solid functional outcome described as clearly short of the masterful tier.

### startingItems

[items](/world/items) given to players who start with this skill at character creation. "If you give someone the swordsmanship skill, it's nice to give them a sword too." Use `[]` if no starting gear is attached.

### abilities (extra-codec)

Array of ability name strings associated with this skill. The editor displays these to show which abilities are unlockable through this skill. Strings should match keys in `abilities`. Does not replace the `requirements` field on individual abilities — this is a display association, not the unlock gate.

## Task resolution

### Skill check formula

```text
total = baseRoll
      + (skillLevel * skillBonusModifier)
      + ((attributeValue - 10) * attributeBonusModifier)
      + skillTypeDifficultyBonus[skillType]
      + earlyGameBonus              // +10 if gameTick < 50, else 0
      + contextModifiers
```

Compare `total` against the difficulty target. The bands of success (critical / success / partial / failure / critical failure) are determined by how far the total exceeds or falls short of the target.

### baseRoll is a finite deck

Voyage does not use a D20-style dice system. The engine draws one card without replacement from a fixed pool, modulated by global difficulty. At medium difficulty the pool is `[-40, -20, -10, 0, 10, 20, 20, 40]` (8 cards). Easier difficulties add positive cards (`very easy` adds `[15, 20, 25, 30]`, `easy` adds `[10, 15, 20]`); harder difficulties add negatives (`hard` adds `[-20, -15, -10]`, `very hard` adds `[-30, -25, -20, -15]`). When the pool empties it refills to the full set, so streaks of bad luck are bounded and the distribution averages out over a handful of checks. Each drawn card is also clamped to ± `maxSkillSuccessLevel`. Practically: tune DC thresholds against this specific distribution, and expect occasional swings of ±40 (or larger at extreme difficulties) rather than uniform variance.

### maxSkillSuccessLevel cap

`skillSettings.maxSkillSuccessLevel` (engine default 25) caps the absolute contribution any single skill, attribute, ability, random roll, or context modifier can add to a check. Most authored worlds raise this to 80–100 to give skill investment headroom; the default of 25 keeps swings tight in tutorial-style scenarios.

## Progression

### Skill XP rewards

In `skillSettings.skillXPRewards`:

| Size | Balanced XP |
|------|-------------|
| `small` | 40 |
| `medium` | 60 |
| `large` | 100 |
| `huge` | 150 |

### XP to next skill level

```text
xpToNextLevel = startingXPToLevelUpSkill + (currentLevel * additionalXPRequiredPerSkillLevel)
```

With balanced settings (`startingXPToLevelUpSkill: 100`, `additionalXPRequiredPerSkillLevel: 40`): level 1 = 100 XP, level 10 = 460 XP, level 30 = 1,260 XP. `skillSettings.maxSkillLevel` (engine default 25) caps how high any skill can climb; most authored worlds raise this to 100 for deeper progression.

### Learning new skills

When a character uses a skill they don't have:

```text
chanceToLearn = baseChanceToLearnNewSkill + (attributeValue * skillLearningBonusModifier)
```

If the roll succeeds, the skill is added at level 0, the character gains `xpFromNewSkill` (balanced 200) character XP, and the skill's `startingItems` are added to inventory. Set `baseChanceToLearnNewSkill: 1` and `skillLearningBonusModifier: 1` to allow learning new skills, or both `0` to lock the skill set at character creation.

### Training

Players can train skills between uses, with cooldown `skillSettings.trainingCooldown` (balanced 10) ticks between sessions. Training adds skill XP directly.

## Authoring tips

### Balance advice

- Don't create multiple overlapping skills (e.g., 4 sword-fighting styles). Skills level through use — spreading XP across many similar skills weakens all of them.
- XP rewards: use `skillXPRewards` size buckets (`small`/`medium`/`large`/`huge`) to weight skills used in combat vs. skills used rarely.

### Attribute distribution

Aim for 1–3 primary attributes per class. A good distribution avoids any single attribute dominating every class, and gives utility skills (social, knowledge) roughly equal representation to combat skills. The complete skill list for your scenario should be documented in your scenario's registry.
