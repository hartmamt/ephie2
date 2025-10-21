# Arena Shooter Game

A top-down arena shooter built with HTML5 Canvas and JavaScript. Survive waves of enemies, collect XP, level up, and choose powerful upgrades!

## 🎮 Quick Start - Play Now!

### Option 1: Direct File Open (Easiest)
1. Navigate to the project folder
2. **Double-click `index.html`** - it will open in your default browser
3. Start playing!

### Option 2: From File Explorer
- **Windows**: Right-click `index.html` → Open with → Chrome/Firefox/Edge
- **Mac**: Right-click `index.html` → Open With → Chrome/Firefox/Safari
- **Linux**: Right-click `index.html` → Open With → Browser

### Option 3: Using a Local Server (Optional)
If the game doesn't work with direct file opening, you can run a simple server:

```bash
# If you have Python 3 installed:
python -m http.server 8000

# Then open in browser:
# http://localhost:8000
```

## How to Play

1. Choose your game mode:
   - **Single Player** - Play alone
   - **Local Multiplayer** - Play with a friend on the same computer
   - **Network Multiplayer** - (Basic implementation) Host or join games across computers

## Controls

### Player 1
- **Movement**: WASD
- **Auto-fire**: Automatic when enemies are in range
- **Dash** (if chosen): SPACE
- **Laser Blade** (if chosen): Q

### Player 2 (Local Multiplayer)
- **Movement**: Arrow Keys
- **Auto-fire**: Automatic when enemies are in range
- **Dash** (if chosen): ENTER
- **Laser Blade** (if chosen): SHIFT

## Game Features

### Starting Abilities
Choose one permanent ability at the start:

- **Dash** - Quick speed burst on cooldown
- **Turret** - Deploy a turret for 7 seconds that fires at 150% of your stats
- **Drone** - Permanent companion that fires at 40% of your stats
- **Phase Shield** - Stand still for 2 seconds to gain an overshield
- **Large** - 50% larger, 75% more damage/health, 25% more range, 50% slower
- **Small** - 40% faster, 30% smaller
- **Laser Blade** - Create a high-damage ring for 1.5 seconds

### Upgrades
Level up by collecting XP from defeated enemies. Choose from 3 random upgrades:

#### Stat Boosts
- +10% Max Health
- +10% Move Speed
- +10% Damage
- +10% Fire Rate
- +10% Fire Range
- +20% XP Gain
- +50% Pickup Range

#### Special Abilities
- **Homing Shots** - Your bullets track enemies
- **Poison Bullets** - Deal damage over time

#### Ability Upgrades
- Dash: -25% Cooldown
- Turret: +3s Duration
- Drone: +15% Damage
- Phase Shield: +20% HP
- Large: +20% Damage
- Small: +Speed & Fire Rate
- Laser Blade: +Damage

### Enemy Types

| Enemy | Color | Behavior | HP |
|-------|-------|----------|-----|
| Basic | Red | Standard chase | Low |
| Fast | Dark Blue | Quick but fragile | Very Low |
| Tank | Green | Slow, high HP | High |
| Ranged | Purple | Shoots from distance | Medium |
| Boss | Black | Massive HP, spawns minions | Very High |

### Orb System
- **XP Orbs** (Orange) - Dropped by enemies for leveling up
- **Healing Orbs** (Green) - 20% drop rate, heals 15% of max health (shared in multiplayer)

### World Scaling
- World Level increases every 30 seconds
- Enemy stats increase by 8% per world level
- Enemies spawn more frequently as the game progresses
- Boss spawns every 60 seconds

## Multiplayer Features

### Local Multiplayer
- Two players on the same keyboard
- Shared XP and upgrades
- Player 1 selects upgrades (Player 2 waits)
- Enemies can target either player
- Shared healing orbs

### Network Multiplayer
- Host creates a room and gets a code
- Client joins using the room code
- Basic implementation (placeholder for WebRTC/WebSocket)

## Game Over
The game ends when all players are defeated. Your survival time and world level reached will be displayed.

## Technical Details
- Built with vanilla JavaScript (no frameworks)
- HTML5 Canvas for rendering
- 60 FPS game loop
- Infinite scrolling map
- Smooth camera following players

## Credits
Created as a fun arena shooter with roguelike progression elements!

Enjoy the game and see how long you can survive!
