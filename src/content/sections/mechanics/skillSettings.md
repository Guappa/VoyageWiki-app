---
tab: "mechanics"
section: "skillSettings"
title: "Skill Settings (Advanced)"
kind: "schema"
summary: "Global skill mechanics — XP costs for leveling, skill learning chance, maximum skill level, and the difficulty check thresholds that translate difficulty labels (Easy/Hard/etc.) into numeric bonuses."
order: 100
advanced: true
uiLocation: "Mechanics → Advanced → Skill Settings"
uiSubtitle: "\"Skill system tuning\""
editor: "JSON only"
related: "skills - individual skill definitions; combatSettings - combat-specific numeric settings; abilities - ability bonus is capped by maxSkillSuccessLevel"
---

## Example

```json
{
  "maxSkillLevel": 100,
  "maxSkillSuccessLevel": 100,
  "skillXPRewards": { "small": 40, "medium": 60, "large": 100, "huge": 150 },
  "startingXPToLevelUpSkill": 100,
  "additionalXPRequiredPerSkillLevel": 40,
  "skillBonusModifier": 1,
  "xpFromNewSkill": 200,
  "newSkillGenerationEnabled": true,
  "baseChanceToLearnNewSkill": 0.1,
  "skillLearningBonusModifier": 0.01,
  "trainingCooldown": 10,
  "charXPPerSkillLevel": 5,
  "baseXPFromSkillUpgrade": 125,
  "skillTypeDifficultyBonus": { "none": 0, "combat": 0, "utility": 0, "magic": 0 }
}
```

## Fields

### maxSkillLevel

**`maxSkillLevel` and `maxSkillSuccessLevel` must match.** Both cap the same thing from different directions — `maxSkillLevel` caps how high a skill can be trained, `maxSkillSuccessLevel` caps how much any single contribution can add to a check. Setting them to different values produces incoherent results: a character whose skill exceeds `maxSkillSuccessLevel` is investing XP that produces no effect. Always set both to the same value.

### skillXPRewards

**`skillXPRewards`** assigns XP gained per successful skill use by size category. Each `skills[*]` entry carries no numeric XP value itself — the XP amount is read from this table. Assign skills to size buckets: `small` for high-frequency combat skills, `large` or `huge` for skills used rarely. The effect is that rarely-used skills level faster per use, which compensates for fewer opportunities.

### skillTypeDifficultyBonus

**`skillTypeDifficultyBonus`** — flat bonus applied to all checks for skills of that type. Keys must match values in `skills[*].type`. Setting all to `0` means type has no mechanical effect beyond categorization. Non-zero values effectively make some skill types globally easier or harder regardless of the check's own difficulty.

### baseChanceToLearnNewSkill

**`baseChanceToLearnNewSkill`** — probability of gaining a new skill the first time a character attempts it without having it. `0.1` = 10% chance. Set both this and `skillLearningBonusModifier` to `0` to lock the skill set to character creation.

### newSkillGenerationEnabled

**`newSkillGenerationEnabled`** — whether Voyage may invent entirely new skills during play. `true` keeps the prior behavior (new skills can be generated); `false` locks characters to the skills already defined in the world config. **Required** -- the editor rejects a config that omits it. (The per-attempt chance of *learning* a new skill is configured by `baseChanceToLearnNewSkill` and `skillLearningBonusModifier`.)

### additionalXPRequiredPerSkillLevel

**`additionalXPRequiredPerSkillLevel`** — additional XP required per level beyond the starting threshold. With `startingXPToLevelUpSkill: 100` and `additionalXPRequiredPerSkillLevel: 40`: level 1 requires 100 XP, level 2 requires 140, level 3 requires 180, and so on. Higher values make later skill levels progressively harder to reach, which steepens the progression curve.
