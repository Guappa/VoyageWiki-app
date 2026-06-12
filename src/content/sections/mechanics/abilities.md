---
tab: "mechanics"
section: "abilities"
title: "Abilities"
kind: "schema"
summary: "Abilities are named actions characters can attempt - magical powers, combat techniques, special manoeuvres. Each ability is gated by skill or trait `requirements` and modifies how the engine resolves the resulting roll."
order: 80
advanced: false
uiLocation: "Mechanics → Abilities"
uiSubtitle: "\"Character abilities\""
editor: "JSON + ADD ITEM"
related: "skills - abilities unlock when a skill reaches a threshold defined in `requirements`; traits - traits can grant abilities directly via `abilities[]`"
---

## Example

```json
{
  "Precision Strike": {
    "name": "Precision Strike",
    "description": "Drive the blade into an exposed joint, throat gap, or visor seam — the technique trades power for placement. The strike bypasses armour entirely and delivers damage directly to the opponent underneath it. Most effective against heavily-armoured opponents where a direct exchange would otherwise favour them. Moderately increases the effectiveness of your next attack action and ignores armour bonuses.",
    "requirements": [
      { "type": "skill", "variable": "athletics", "amount": 30 }
    ],
    "bonus": 30,
    "cooldown": 0
  },
  "Whirlwind": {
    "name": "Whirlwind",
    "description": "Pivot on the back foot and drive a sweeping arc through every opponent within reach, momentum carrying the weapon through multiple targets in a single motion. The follow-through leaves the attacker briefly open — the tradeoff is reach and simultaneous coverage. Slightly increases the effectiveness of your next attack action against all adjacent targets.",
    "requirements": [
      { "type": "skill", "variable": "athletics", "amount": 55 }
    ],
    "bonus": 55,
    "cooldown": 0
  },
  "Magic Arrow": {
    "name": "Magic Arrow",
    "description": "Condense raw arcane force into a bolt that ignores the physical difference between armour and flesh — it does not cut or bludgeon, it transfers energy directly. No arc, no wind correction, reliable at any range. Slightly increases the effectiveness of your next arcane attack action.",
    "requirements": [
      { "type": "skill", "variable": "arcana", "amount": 10 }
    ],
    "bonus": 10,
    "cooldown": 0
  }
}
```

## Fields

### requirements

Max 10 per ability. All requirements in the array use AND logic — all must be satisfied simultaneously.

The `variable` field is validated differently per type. Using an invalid variable triggers a validator warning on import.

- `skill` — `variable` must be a key in the world's `skills` dict. `amount` is the minimum skill level required.
- `attribute` — `variable` must be a value from [`attributeSettings.attributeNames`](/mechanics/attributeSettings) (e.g. `"strength"`, `"intelligence"`). `amount` is the minimum attribute value.
- `resource` — `variable` must be a key in [`resourceSettings`](/mechanics/resourceSettings). `amount` is the minimum current resource value.
- `trait` — `variable` must be a key in the world's `traits` dict. `amount` is typically `1`.
- `characterLevel` — **no `variable` field** (codec rejects it). Only `type` and `amount` are valid; `amount` is the minimum character level required.

`'ability'` is **not** a valid requirement type. Only `resource`, `attribute`, `skill`, `characterLevel`, `trait` are accepted.

### bonus

Check bonus added to the skill check total when the ability is used. This contribution is capped by `skillSettings.maxSkillSuccessLevel` alongside skill bonuses, attribute bonuses, and context modifiers — authoring a `bonus` above that cap is silently wasted. Note that `Whirlwind` above trades raw bonus for AOE coverage (lower bonus, higher skill requirement).

### cooldown

Turns before the ability can be used again. Default to `0` — most abilities should be freely usable. Only add a non-zero cooldown for abilities that would trivialize gameplay if spammed (instant full-health restore, guaranteed escape, auto-win combat effects).

### Name matching

Case-insensitive. Player input `"Fireball"`, `"fireball"`, and `"FIREBALL"` all match an ability named `Fireball`. Whitespace is also normalized. Pick whichever capitalization reads best for the world.

### Global scaling

`bonus` and `cooldown` are scaled globally by `combatSettings.abilityBonus` and `combatSettings.abilityCooldown`:

```text
effectiveBonus    = bonus    * combatSettings.abilityBonus
effectiveCooldown = cooldown * combatSettings.abilityCooldown
```

`abilityBonus: 0` makes every ability silent. `abilityCooldown: 0` makes every ability cooldown-free regardless of the per-ability `cooldown` field. Raise the global modifier (or set non-zero per-ability cooldowns) to introduce timing pressure.

### What the schema natively supports

A check bonus (`bonus`) and a cooldown. Everything else is narrator-interpreted from the `description` text. Save DCs, area-of-effect targeting, status effects (blind, stun, poison, fear), knockback, persistent auras — none of these have dedicated schema fields. Write them as plain-language instructions in `description` and the narrator applies them during play. The more precisely you write the effect, the more consistently the narrator honors it. Vague ("applies a debuff") produces inconsistent results; specific ("the target cannot take reactions until the start of your next turn") does not.

### Abilities don't scale in power

For systems with progression (spell tiers, martial-arts ladders, magic schools), author a sequence of escalating abilities tied to ascending skill thresholds. For grounded worlds, a flat set of distinct named techniques works fine — no ladder required.

## Authoring tips

### Abilities are optional

Most worlds don't need one for every skill. A skill works on its own: the AI resolves narrated actions through skill checks based on the world's existing skill + attribute + difficulty math. The 28 skills in a grounded scenario do not need 28 corresponding abilities. Abilities are an *additional* layer for discrete trained techniques worth naming — they're at their most useful when you have a tier-gated system (spell tiers, martial-arts progressions, magic-tradition ladders), or when an action's mechanical effect cannot be reached through a normal skill check (armour bypass, AOE, status effects). Grounded-realistic worlds typically author 30-80 abilities for the techniques worth naming and leave the other skills to resolve via prose + skill checks alone. Tier-gated systems (high fantasy, hard magic) typically author hundreds, with most skills serving as the gate variable for a ladder of named techniques.

### What stops the player from just using the raw skill?

Nothing — the player can always attempt the same action through ordinary play and the AI resolves it as a skill check. The ability is an opt-in unlock. Choosing the ability gives the character (a) the check `bonus` on top of the raw skill result, and (b) access to mechanical effects the skill alone cannot produce — armour bypass, AOE targeting, named status effects, narrator-honoured constraints written into the `description`. If an ability's effect is identical to what the raw skill already accomplishes, it adds no value and the player will skip it.

### Design advice

"Avoid abilities that just let you do what your skill already allows." Think of an ability as "permission to do something you normally couldn't" — `Precision Strike` isn't just +10 to an attack roll, it *bypasses armor entirely* on a hit. That's a qualitatively different outcome from a naked skill check. Abilities with narrative versatility have more longevity: a `Burning Blade` ability is useful in combat, lighting caves, cooking in the field, and cauterizing wounds — four different contexts where it could be invoked.

### Tiered ability system

Abilities unlock as a skill rises naturally — no ability chains or prerequisites between abilities. A six-tier structure works well:

| Tier | Skill amount | Character stage |
|---|---|---|
| 1 - Novice | 10 | Early game |
| 2 - Apprentice | 20–25 | Early–mid |
| 3 - Competent | 35 | Mid game |
| 4 - Expert | 50–55 | Mid–late |
| 5 - Master | 65 | Late game |
| 6 - Legendary | 80 | Endgame |

Set `bonus` equal to the skill level requirement — if the ability requires skill level 35, set `bonus: 35`. Lower is acceptable for AOE, passive, or broadly versatile abilities. Default `cooldown` to `0`; reserve non-zero values for abilities that would trivialize gameplay if spammed.

A player's skill naturally rises with use — as it crosses each threshold, new abilities in that tier become available to unlock. The player does not need to complete one ability to access the next; the skill level itself is the only gate.

### Class-gated abilities

Can use either `trait` requirements (one entry per class trait) or `skill` requirements calibrated to class starting levels. Trait gates are direct and clear; skill gates are useful when the same ability should be unlockable through training even by characters of other classes, or when the class itself shouldn't strictly limit access. Some abilities require two skills simultaneously (e.g., `Hazy Mist` requiring both `blood magic 6` and `acrobatics 6`).

### Adding new abilities

1. Identify which tier slot is missing for the target skill — don't stack multiple abilities at the same level unless they serve different functions.
2. Set `bonus` equal to the skill level requirement. Lower is acceptable for AOE, passive, or broadly versatile abilities.
3. Cooldown 0 is valid for passive or out-of-combat abilities (`Detect Magic`, `Keen Eye`, `Beast Mastery`).
4. Every class's ability access is determined by which skill bonuses that class grants — not by trait requirements on abilities (which are not enforced). Ensure the class grants the right skill bonus family and at the right starting level to reach the intended first ability threshold.
5. Write descriptions as 1-2 sentences that integrate the narrative moment and the mechanical effect — not two separate sentences but one flowing description that naturally concludes with what changes. End with a plain-language effect statement: "Bypasses armor and deals enhanced damage", "Moderately increases the effectiveness of your next attack action." No numbers or dice notation — natural language only. The AI reads this as its instruction for what the ability produces.
