# Castle Eidolon 🏰

A brutal Metroidvania roguelike with permanent difficulty escalation. You are an eternal challenger facing the living fortress of Eidolon Castle, where every death and victory makes the castle stronger through the mysterious **Castle Pressure Index (CPI)**.

## 🎮 Game Overview

Castle Eidolon is a side-scrolling action platformer that combines Metroidvania exploration with roguelike permanent progression. The castle adapts relentlessly to your power through the CPI system - a measure of how much your progress threatens its dominion.

**Core Features:**
- **No Checkpoints** - Death returns you to the castle entrance
- **Permanent Difficulty** - CPI never resets, only increases
- **5 Unique Layers** - Each with distinct environments and enemies
- **Hub System** - NPCs for upgrades, lore, and progression
- **Multiple Weapon Types** - Choose your combat style
- **Deep Progression** - Eidolon Cores, Sigils, and milestone rewards

## 🚀 How to Play

### Installation & Launch

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

### Controls

**Movement:**
- `A` / `D` - Move left/right
- `W` / `Space` - Jump
- `S` - Climb down (on chains)

**Combat:**
- `Mouse Click` - Attack toward cursor
- `F` - Block (drains stamina)
- `Shift` - Roll/Dodge (grants invincibility frames)

**Interaction:**
- `E` - Interact with NPCs and doors

## 🏰 Game Structure

### The Hub
Your safe haven between delves. Here you'll find:

- **Blacksmith** 🔨 - Upgrade and reforge weapons
- **Archivist** 📚 - Study the Grimoire, learn enemy weaknesses
- **Merchant** 💰 - Buy materials and blueprints
- **Warden's Spirit** 👻 - Quests, hints, and rare aid

### Castle Layers

1. **Outer Halls** - Ancient entry corridors
   - Enemies: Crypt Shades, Iron Guards
   - Boss: Warden of Halls

2. **Crypts** - Tomb-filled depths
   - Enemies: Crypt Shades, Iron Guards, Arcane Familiars
   - Boss: Warden of Crypts

3. **Iron Chapel** - Corrupted sanctuary
   - Enemies: Astral Sentinels, Mirror Wraiths, Iron Chapel Acolytes
   - Boss: Warden of Chapel

4. **Astral Sanctum** - Reality-warped chambers
   - Enemies: Advanced variants with CPI mutations
   - Boss: Warden of Sanctum

5. **Eidolon Core** - The heart of corruption
   - Enemies: Void Knights, Eidolon Heralds
   - Boss: Warden of Core

## ⚔️ Combat System

### Weapon Types

| Type | Description | Damage | Speed | Range |
|------|-------------|--------|-------|-------|
| **Light** | Swift Dagger - Fast, precise strikes | Low | Very Fast | Short |
| **Balanced** | Knight Sword - Versatile and reliable | Medium | Medium | Medium |
| **Heavy** | War Hammer - Slow, powerful strikes | High | Slow | Short |
| **Ranged** | Mystic Bow - Attack from distance | Medium | Fast | Long |
| **Hybrid** | Enchanted Blade - Melee & magic mix | High | Medium | Medium-Long |

### Combat Mechanics

- **Rolling** - Dodge attacks with invincibility frames (i-frames)
- **Blocking** - Reduces damage by 70%, drains stamina
- **Chain Climbing** - Vertical traversal for tactical positioning
- **Weapon Cooldowns** - Each weapon has attack speed limits

## 📊 Castle Pressure Index (CPI)

The CPI is the core difficulty system that creates permanent escalation:

### How CPI Increases
- **Death:** +3 CPI per death
- **Layer Progress:** +2 CPI per layer entered
- **Never Decreases** - Your struggle is permanent

### CPI Effects
- **Enemy Stats:** +2% health/damage per CPI point
- **Enemy Speed:** +20% at CPI 50+
- **Enemy Health:** +50% at CPI 80+
- **Mutations:** New abilities and behaviors at high CPI
- **Loot Quality:** Better rewards at higher CPI

### CPI Threat Levels

| CPI Range | Color | Threat Level |
|-----------|-------|--------------|
| 0-20 | Green | Novice |
| 20-40 | Yellow-Green | Challenging |
| 40-60 | Yellow | Dangerous |
| 60-80 | Orange | Brutal |
| 80-100 | Red-Orange | Extreme |
| 100+ | Red | Impossible |

## 🏆 Progression & Rewards

### CPI Milestone Rewards

| CPI | Reward | Effect |
|-----|--------|--------|
| 10 | Weapon Upgrade Token | Enhance weapon stats |
| 25 | Additional Sigil Slot | More build diversity |
| 40 | Skill Point | Unlock new abilities |
| 60 | Unique Weapon | Rare weapon type |
| 80 | Combat Technique | Advanced moves |
| 100 | Eidolon Core | Major permanent boost |
| 120+ | Cosmetics & Titles | Prestige rewards |

### Eidolon Cores
Permanent meta-progression earned from defeating Wardens and reaching high CPI milestones. These provide:
- Increased base stats
- Unlock new starting weapons
- Permanent passive bonuses
- Access to advanced Sigils

### Sigils System
Equippable modifiers that change your playstyle:
- Damage boosts
- Elemental effects
- Defensive buffs
- Movement enhancements
- Special abilities

## 🎨 Visual Design

### Layer Environments

Each layer has a unique color palette:

- **Hub:** Dark blue-gray (#1a1a2e)
- **Outer Halls:** Dark red (#2a1a1a)
- **Crypts:** Dark green (#1a2a1a)
- **Iron Chapel:** Deep blue (#1a1a3a)
- **Astral Sanctum:** Purple (#3a1a3a)
- **Eidolon Core:** Black void (#0a0a0a)

### UI Elements
- **CPI Meter** - Color-coded threat level display
- **Layer Indicator** - Current location name
- **Health Bar** - Real-time player health
- **Weapon Info** - Current weapon and damage
- **Stamina** - For rolling and blocking

## 👾 Enemy Bestiary

### Layer 1 Enemies

**Crypt Shade**
- Ghostly teleporting wraith
- Low health, medium speed
- Behavior: Short-range teleportation

**Iron Guard**
- Rusted armored soldier
- High health, slow movement
- Behavior: Tank, heavy contact damage

**Arcane Familiar**
- Glowing magic construct
- Low health, ranged attacks
- Behavior: Keeps distance, fires projectiles

### Layer 3+ Enemies

**Astral Sentinel**
- Floating rune-covered armor
- Teleports and fires magic blasts
- Behavior: Teleport + ranged hybrid

**Mirror Wraith**
- Reflective, phasing entity
- Medium health, fast movement
- Behavior: Phase through terrain

**Iron Chapel Acolyte**
- Cursed chain-wielding priest
- Medium-high health, melee + curse
- Behavior: Aggressive melee with debuffs

### Wardens (Bosses)

Each layer ends with a Warden boss battle:
- **Massive health pools** (300-800+ HP, scaling with CPI)
- **Ranged + melee attacks**
- **Spawn minions**
- **Grant 200-400 XP**
- **Drop Eidolon Core fragments**

## 💾 Persistent Progression

The game saves to browser `localStorage`:
- Total CPI (from deaths + progress)
- Max layer reached
- Total deaths
- Eidolon Cores collected
- Milestone rewards unlocked

**Death is permanent progress** - Even when you die and return to the hub, the CPI increase remains forever.

## 🎯 Strategy Tips

1. **Master Rolling** - I-frames are crucial for surviving high CPI
2. **Use Terrain** - Platforms and chains provide tactical advantages
3. **Block Wisely** - Blocking drains stamina; use it strategically
4. **Study Enemies** - Visit the Archivist to learn weaknesses
5. **Upgrade Smart** - Focus on weapon upgrades early
6. **CPI Management** - Every death makes future runs harder
7. **Explore the Hub** - NPCs offer valuable upgrades
8. **Chain Climbing** - Vertical movement is key for dodging

## 🔧 Technical Details

### Architecture
- **Engine:** Vanilla JavaScript with HTML5 Canvas
- **Server:** Express.js
- **Rendering:** 2D Canvas with camera system
- **Physics:** Custom gravity and collision detection
- **Save System:** Browser localStorage

### Game Loop
60 FPS target with delta-time smoothing for consistent physics across framerates.

### Platform Collision
One-way platform system - fall through from below, land on from above.

## 📝 Lore

*Legends say the castle was built to imprison a primordial force.*

*Wardens, corrupted guardians, seek to end intruders with brutal efficiency.*

*The Castle Pressure Index measures how much your power threatens the castle's dominion.*

*Every death, every advance, every victory feeds the castle's corruption.*

*Your goal: Delve deeper, defeat Wardens, harness Eidolon Cores - sources of immense power.*

*The castle is eternal. Are you?*

## 🚀 Future Enhancements

Potential additions for expanded gameplay:

- **More Weapon Types** - Whips, spells, crossbows
- **Deeper Sigil System** - Synergies and set bonuses
- **Procedural Generation** - Randomized layer layouts
- **More Enemies** - 20+ unique enemy types
- **Boss Variations** - Multiple phases and attack patterns
- **Grimoire Completion** - Full enemy encyclopedia
- **Challenge Rooms** - Optional high-risk/high-reward areas
- **Meta-Upgrades** - Permanent unlocks using Eidolon Cores
- **Sound & Music** - Atmospheric audio design
- **Visual Effects** - Particles, screen shake, damage numbers

## 🎓 Credits

Game Design: Based on the Castle Eidolon design document
Implementation: Built with vanilla JavaScript
Art Style: Minimalist geometric with dark fantasy palette
Inspired by: Dark Souls, Hollow Knight, Dead Cells, Hades

## 📜 License

MIT License - Feel free to fork and expand!

---

**Castle Eidolon** - *No checkpoints. Only mastery.*
