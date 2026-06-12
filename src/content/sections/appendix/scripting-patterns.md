---
tab: "appendix"
section: "scripting-patterns"
title: "Scripting Patterns"
kind: "guide"
summary: "Mechanics that go beyond the schema. Trigger scripts, persistent state, and worked recipes."
order: 10
advanced: false
---

> **📋 Note:** For trigger-script-specific patterns (Realm Travel, Race Evolution, the Trigger Script Primitives API), see [Triggers](/mechanics/triggers#trigger-scripts) on the mechanics page. This page covers mechanics patterns more broadly.

Mechanics that go beyond the schema's native support. The narrator handles many things implicitly - status effects, faction attitudes, equipment friction - but anything requiring exact numeric thresholds, persistent counters, or guaranteed enforcement needs scripts. The patterns below cover the design choice (what to author with) and full worked recipes (how to wire it up).

> Trigger script syntax, the `check()` API, and the `effects.push()` / `skip` rules are documented under Trigger Scripts in the Authoring Guide. This section assumes that vocabulary.

---

### Custom Mechanics Patterns

The table below covers the full range: some entries are narrator-interpreted by default (the narrator handles them without any instruction), others require explicit construction via `description`, `effects`, or `aiInstructions`. For narrator-interpreted entries, the DIY path is only needed if you want precise mechanical control beyond the narrator's defaults.

| What you want | Native schema support | DIY path |
|---|---|---|
| Critical hits or fumbles | No native field - mechanical rules require explicit instruction | Ability `description` text (e.g. "On a natural 20, double damage and apply a wound effect") + `generateActionInfo` |
| Initiative / turn order | No native field - default behaviour is whatever the narrator improvises | `generateActionInfo` custom for a named initiative system with a visible turn order. Script-driven alternative: persist a shuffled combatant list in `storage`, advance it with a `recurring: true` trigger, and push `story` effects each round. See [Script Examples for Common Mechanics](/appendix/scripting-patterns#script-examples-for-common-mechanics). |
| Status effects (blind, stun, poison, fear) | No native tracking - narrator persistence across turns is ad-hoc | Ability or item `description`/`effects` text for precise mechanical control: exact damage per turn, exact turn count, stacking rules, specific cure conditions. Script-driven alternative: store a turn counter in `storage`, decrement it with a `recurring: true` trigger, and push a `story` effect each tick until it reaches zero. See Script Examples for Common Mechanics. |
| Equipment use restrictions (class-based) | No native field - explicit rules in `aiInstructions.generateActionInfo` are required for hard enforcement | `aiInstructions.generateActionInfo` Equipment Restrictions for hard enforcement (e.g. "Mages cannot wield medium or heavy weapons - refuse the action outright") |
| Faction / reputation tracking | No schema field. Without explicit construction the narrator may improvise faction attitudes from context, but persistence is not guaranteed | Two options: (1) Custom resource (`canCost: false`) + `usageInstructions` for a visible player-facing bar with narrator-driven gain/loss. (2) Script-driven tracker: `write-number` effects on event triggers modify `storage.*` counters; a `recurring: true` monitor trigger script categorizes values into named bands and pushes `story` effects via `effects.push()` when a band changes. Option 2 is invisible to the player but supports precise multi-faction threshold logic and triggered narrative consequences. See [Faction Reputation Tracker](/appendix/scripting-patterns#faction-reputation-tracker-worked-example) (Worked Example) below. |
| Short rest resource recovery | `restRechargeMultiplier` (global fraction) | `usageInstructions` prose - describe class-specific or conditional partial recovery |
| Conditional resource recovery | None | `usageInstructions` prose ("cannot recover inside the Scar Zone"; "only recovers if the player meditates"). Script-driven alternative: gate recovery on a `read-boolean` condition stored in `storage` (e.g. `in_safe_zone`) and push a `story` effect explaining why recovery is blocked or allowed. See Script Examples for Common Mechanics. |
| Custom damage type side effects (poison condition, burn, freeze) | None - `damageTypes` only registers the type name | Ability/item `description` text + `generateActionInfo` describing secondary effects per type. Script-driven alternative: ability script sets a `storage` flag (e.g. `storage.apply_poison = true`); a `recurring: true` monitor trigger reads the flag, initialises a turn counter, and pushes a `story` effect. Decrement the counter each tick as with status effects. See Script Examples for Common Mechanics. |
| Calendar / time tracking | Tick counter only | Custom resource with `rechargeRate: 1` (ticks up each turn) + `usageInstructions` defining in-world time conversion. Script-driven alternative: read the engine tick with `check({ type: 'game-tick' })`, track a `time_period` string in `storage`, and push a `story` effect only when the period changes. See Script Examples for Common Mechanics. |
| Multiclassing / hybrid builds | No dedicated field | Multiple `trait` requirements on [abilities](/mechanics/abilities); `aiInstructions` describing interaction rules |
| Passive always-on abilities | `cooldown: 0` + `description` written as a persistent condition ("the bearer permanently...") | Script-driven enforcement: a `recurring: true` trigger with no condition pushes a `story` effect every tick reinforcing the passive rule. More reliable than relying on the narrator remembering the ability description across a long session. Stackable: each passive gets its own trigger. See Script Examples for Common Mechanics. |
| Per-location DC scaling | No native field for per-location DC | `generateActionInfo` DC table for precise numerical calibration (specific target numbers keyed to difficulty values) |

#### Faction Reputation Tracker (Worked Example)

A script-driven multi-faction standing system. Uses `storage.*` directly for numeric scores, a `recurring: true` monitor trigger to detect band changes, and `effects.push()` to inject narrator instructions when standing shifts. No custom resource required - nothing is shown to the player.

**Architecture:**

- **Init trigger** (`recurring: false`, gated on `game-tick > 0`) - initializes all faction scores and band labels in `storage` via script; sets a `standing_init_done` boolean via `write-boolean` effect so the monitor trigger can gate on it cleanly. The tick gate avoids the tick-0 case where `story` effects do not reach the initial scene.
- **Monitor trigger** (`recurring: true`, gates on `standing_init_done`) - runs every tick; script compares current score to stored band label; if the band changed, updates the label and pushes a `story` effect instructing the narrator how all NPCs of that faction should now behave. Uses `skip = true` when no band changed to suppress the trigger entirely.
- **Event triggers** - standard triggers for quest completions, location arrivals, key NPC interactions etc., each with a `write-number add N` effect on the relevant faction's storage key. No script required on these.
- **Consequence triggers** - `read-number lessThanOrEqual / greaterThanOrEqual` threshold checks that fire one-time `story` effects for major faction events (assassination orders, alliance offers, trade embargoes).

**Init trigger script:**

```javascript
if (storage.standing_kingdom === undefined) {
  storage.standing_kingdom = 0;
  storage.standing_empire  = 0;
  storage.standing_guild   = 0;
  storage.standing_cult    = 0;
  storage.threshold_kingdom = 'neutral';
  storage.threshold_empire  = 'neutral';
  storage.threshold_guild   = 'neutral';
  storage.threshold_cult    = 'neutral';
}
```

Replace `kingdom`, `empire`, `guild`, `cult` with your world's faction keys. One `standing_*` number and one `threshold_*` string per faction.

**Monitor trigger script:**

```javascript
const band = (v) => {
  if (v >= 50)  return 'allied';
  if (v >= 10)  return 'cooperative';
  if (v >= -9)  return 'neutral';
  if (v >= -49) return 'hostile';
  return 'war';
};

const factions = [
  { standing: 'standing_kingdom', threshold: 'threshold_kingdom', name: 'The Kingdom'   },
  { standing: 'standing_empire',  threshold: 'threshold_empire',  name: 'The Empire'    },
  { standing: 'standing_guild',   threshold: 'threshold_guild',   name: 'The Guild'     },
  { standing: 'standing_cult',    threshold: 'threshold_cult',    name: 'The Cult'      }
];

const posture = {
  allied:      'has moved to open alliance - active cooperation and goodwill at all levels',
  cooperative: 'now maintains a cautiously cooperative stance',
  neutral:     'has settled into a wait-and-see position - no active hostility, no commitment',
  hostile:     'is now working actively against the player - expect obstruction and quiet aggression',
  war:         'has entered total opposition - coordinated strikes and open aggression should be expected'
};

let fired = false;
for (const f of factions) {
  const current = storage[f.standing] ?? 0;
  const prev    = storage[f.threshold] ?? band(current);
  const now     = band(current);
  if (now !== prev) {
    storage[f.threshold] = now;
    if (!fired) {
      effects.push({ type: 'story', instruction: f.name + ' ' + posture[now] + '. Adjust how all ' + f.name + ' NPCs and agents behave this scene and going forward.' });
      fired = true;
    }
  }
}

if (!fired) { skip = true; }
```

**Notes:**

- Only one band-change notification fires per tick (the `fired` flag). If two factions cross bands simultaneously, the second is caught the following tick.
- `skip = true` suppresses the trigger entirely when no band changed - the narrator receives no instruction and the turn is unaffected.
- `storage.*` is written directly in scripts, but `write-boolean` and `write-number` effects on the init and event triggers keep the gate logic clean and don't require scripts on those triggers.
- Band thresholds are symmetric for readability but can be asymmetric (e.g. hostile requires -50 to enter but -30 to exit) - just track the label separately from the number.

**Calibrating increment values (N):**

The bands span a total range of roughly 100 points (-50 to +50). Neutral alone is 18 points wide (-9 to +9); hostile and cooperative are 40 points each. N on each event trigger should be sized relative to that scale and to how many triggers of the same tier will realistically fire in a session.

A practical approach is to define three tiers before writing any event triggers:

- **Minor** (+2 to +3) - brief NPC interactions, small favors, incidental help
- **Moderate** (+6 to +8) - completing a side task, defending a faction member, a notable act of goodwill
- **Major** (+12 to +15) - completing a faction quest arc, a significant sacrifice on their behalf

Then audit total possible gain per tier: if 6 minor triggers all fire they contribute +12 to +18 combined. A single major adds another +12 to +15. That gives a realistic ceiling per session before approaching the allied threshold at 50 - which is the intended shape. If all triggers firing in one session can push standing from neutral to allied, the increments are too large.

#### Script Examples for Common Mechanics

Script triggers unlock precise mechanical control for patterns that are otherwise narrator-interpreted. The examples below illustrate the concept behind each pattern -- the trigger names, storage keys, and numeric values are placeholders to make the logic readable, not prescriptions for how to implement them in a real world.

##### Status Effect with Duration Countdown

Trigger: `Poison Tick` -- `recurring: true`, condition `read-number poison_turns greaterThan 0`. Set `storage.poison_turns = N` from an ability or item script when the condition is inflicted. To also clear an `is_poisoned` flag when the counter expires, push a `write-boolean` effect inside the zero-check.

```javascript
storage.poison_turns -= 1;
if (storage.poison_turns > 0) {
  effects.push({ type: 'story', instruction: 'The player takes ongoing poison damage this turn (' + storage.poison_turns + ' turns remaining).' });
} else {
  storage.poison_turns = 0;
  effects.push({ type: 'story', instruction: 'The poison runs its course. The player takes the final tick of damage and the poisoned condition clears.' });
}
```

##### Passive Ability Enforcement

Trigger: `Passive Enforcer` -- `recurring: true`, no conditions. Set `storage.passive_regen = 5` from the ability or init trigger when the passive is granted. Set it to `0` to remove it without deleting the trigger.

```javascript
const amount = storage.passive_regen ?? 0;
if (amount > 0) {
  effects.push({ type: 'story', instruction: 'Regeneration passive: the character recovers ' + amount + ' HP at the start of this turn before any other actions resolve.' });
} else {
  skip = true;
}
```

For a **timed buff** (N turns, then expire) -- same pattern with a decrement and a condition gate. Trigger: `Haste Buff` -- `recurring: true`, condition `read-number haste_turns greaterThan 0`. Set `storage.haste_turns = 5` from the ability that grants it; the condition prevents the trigger firing once it reaches zero.

```javascript
storage.haste_turns -= 1;
if (storage.haste_turns > 0) {
  effects.push({ type: 'story', instruction: 'Haste is active (' + storage.haste_turns + ' turns remaining): the character acts first this turn and moves at double speed.' });
} else {
  storage.haste_turns = 0;
  effects.push({ type: 'story', instruction: 'Haste has expired. Normal action speed resumes.' });
}
```

##### Calendar / Day-Night Cycle

Trigger: `Time Advance` -- `recurring: true`, no conditions. `TICKS_PER_DAY` controls how many turns make up one in-world day -- 24 means each tick represents roughly one hour. `check({ type: 'game-tick' })` returns the engine's own tick counter so no manual counter is needed. `skip = true` prevents a story push on every tick when the period hasn't changed.

```javascript
const TICKS_PER_DAY = 24;
const tick = check({ type: 'game-tick' });

const hour = tick % TICKS_PER_DAY;
const prev = storage.time_period || '';
var now = '';
if (hour < 6)       now = 'night';
else if (hour < 12) now = 'morning';
else if (hour < 18) now = 'afternoon';
else                now = 'evening';

if (now !== prev) {
  storage.time_period = now;
  effects.push({ type: 'story', instruction: 'It is now ' + now + '. Adjust lighting, ambient activity, and NPC availability accordingly.' });
} else {
  skip = true;
}
```

##### Named Initiative / Turn Order

Two triggers: `Combat Init` (`recurring: false`, `story` condition fires when combat starts) builds and shuffles the order. `Combat Advance` (`recurring: true`, `read-boolean combat_active` condition) steps through it each turn. Replace the `combatants` array with the actual participants for each encounter.

```javascript
const combatants = ['Player', 'Enemy A', 'Enemy B'];
for (var i = combatants.length - 1; i > 0; i--) {
  var j = Math.floor(Math.random() * (i + 1));
  var temp = combatants[i];
  combatants[i] = combatants[j];
  combatants[j] = temp;
}
storage.initiative = combatants;
storage.initiative_index = 0;
effects.push({ type: 'story', instruction: 'Combat begins. Initiative order: ' + combatants.join(' → ') + '. Start with ' + combatants[0] + '.' });
```

```javascript
const order = storage.initiative ?? [];
if (order.length > 0) {
  const idx = (storage.initiative_index + 1) % order.length;
  storage.initiative_index = idx;
  effects.push({ type: 'story', instruction: 'It is now ' + order[idx] + "'s turn." });
} else {
  skip = true;
}
```

##### Damage Type Side Effect Application

Two triggers working together: an ability trigger sets `storage.pending_poison` when the condition is inflicted; `Poison Application Monitor` (`recurring: true`) picks it up and feeds the Status Effect countdown trigger above. Stacking works naturally -- each hit adds to `pending_poison` before the monitor resolves it into the active counter.

```javascript
storage.pending_poison = (storage.pending_poison ?? 0) + 3;
```

```javascript
if ((storage.pending_poison ?? 0) > 0) {
  storage.poison_turns = (storage.poison_turns ?? 0) + storage.pending_poison;
  storage.pending_poison = 0;
  effects.push({ type: 'story', instruction: 'Poison has been applied. Target is now poisoned for ' + storage.poison_turns + ' turns.' });
} else {
  skip = true;
}
```

**Notes:**

- `effects.push()` is the only way to dynamically add effects from a script. Static `effects` array entries are pre-populated before the script runs; pushed entries are appended. Maximum 5 effects apply per trigger total - both static and pushed combined.
- `skip = true` suppresses all effects and prevents a non-recurring trigger from being consumed - use it when a recurring trigger has nothing to do this tick.
- `storage.*` persists across ticks within a session. It is the correct place for any value a script needs to remember between turns.
- Do not use `return` at the top level of a script - scripts do not run inside a function body. Use `if/else` or `skip = true` to control flow instead.
- `Math.random()` is confirmed to work. Array destructuring (`[a, b] = [b, a]`) is not confirmed -- use a manual swap variable instead (as in the Named Initiative example above).

**Narrator-driven state changes**: well-placed `aiInstructions` prose can shape mechanical outcomes, not just narrative ones - but reliability varies by task. Instructions in `generateActionInfo` govern action resolution and are the more reliable place for resource cost rules; instructions in [`generateStory`](/ai/aiInstructions#story) compete for attention with the full narrative and are less reliable. For anything that must always happen, use a trigger. For dynamic consequences that tolerate occasional misses, prose instructions in the right task are a viable fallback. See the full breakdown under [aiInstructions](/ai/aiInstructions).

---

**Using `damageTypes` as an AI Context Channel**

`damageTypes` is an array of strings used by `vulnerabilities`, `resistances`, and `immunities`. The validator accepts any string in this array - the codec only checks that the value is a string, not that it names a real damage type. Some authors use this as a side channel for injecting full instruction blocks into combat-related AI context; this is an unsupported pattern. Use `aiInstructions` for rules that must fire in combat.

