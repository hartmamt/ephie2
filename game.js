// Arena Shooter Game - v4.0.9
// MAJOR UPDATE: Risk of Rain Content + Boss Upgrades

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Sound system
        this.soundSystem = new SoundSystem();

        // Set canvas size
        this.canvas.width = 1200;
        this.canvas.height = 800;

        // Game state
        this.state = 'menu'; // menu, ability-select, playing, paused, game-over
        this.players = [];
        this.enemies = [];
        this.projectiles = [];
        this.orbs = [];
        this.entities = []; // Turrets, drones, etc.

        // World & Camera
        this.worldX = 0;
        this.worldY = 0;
        this.cameraX = 0;
        this.cameraY = 0;
        this.worldLevel = 1;
        this.worldLevelTimer = 0;
        this.worldLevelInterval = 30000; // 30 seconds

        // Game stats
        this.survivalTime = 0;
        this.xp = 0;
        this.xpToLevel = 100;
        this.level = 1;
        this.xpGainMultiplier = 1.0;
        this.pickupRange = 80; // Increased from 50 for better feel

        // Spawning
        this.spawnTimer = 0;
        this.spawnInterval = 1000; // Spawn every 1 second (was 2)
        this.bossSpawnTimer = 0;
        this.bossSpawnInterval = 60000; // Boss every 60 seconds
        this.currentBossType = 0; // Rotates through boss types
        this.bossTypes = ['Hydra', 'Golem', 'Necromancer'];

        // Multiplayer
        this.multiplayerMode = null; // 'local', 'host', 'client'
        this.roomCode = null;
        this.connection = null;

        // Custom background
        this.backgroundImage = null;
        this.backgroundPattern = null;

        // Player customization
        this.playerColor = '#00ffff'; // Default cyan
        this.riskOfRainContent = false; // Risk of Rain abilities toggle

        // Highscores - load from localStorage
        this.loadHighscores();

        // Input
        this.keys = {};
        this.setupInput();
        this.setupSettings();

        // Available upgrades pool
        this.upgradePool = [
            { type: 'health', name: '+10% Max Health', value: 0.1 },
            { type: 'speed', name: '+10% Move Speed', value: 0.1 },
            { type: 'damage', name: '+10% Damage', value: 0.1 },
            { type: 'fireRate', name: '+10% Fire Rate', value: 0.1 },
            { type: 'range', name: '+10% Fire Range', value: 0.1 },
            { type: 'xpGain', name: '+20% XP Gain', value: 0.2 },
            { type: 'pickupRange', name: '+50% Pickup Range', value: 0.5 },
            { type: 'homingShots', name: 'Homing Shots', value: 1 },
            { type: 'poisonBullets', name: 'Poison Bullets', value: 1 }
        ];

        this.lastTime = 0;
        this.showMenu();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Weapon cycling - Q for P1, / for P2
            if (e.key.toLowerCase() === 'q' && this.players[0] && !e.repeat) {
                this.players[0].cycleWeapon();
            }
            if (e.key === '/' && this.players[1] && !e.repeat) {
                this.players[1].cycleWeapon();
            }

            // Special abilities - SPACE for P1, SHIFT for P2
            if (e.key === ' ' && this.players[0] && !e.repeat) {
                e.preventDefault(); // Prevent page scroll
                this.players[0].useAbility();
            }
            if (e.key === 'Shift' && this.players[1] && !e.repeat) {
                this.players[1].useAbility();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    setupSettings() {
        // Sound toggle
        const soundToggle = document.getElementById('sound-toggle');
        soundToggle.addEventListener('change', (e) => {
            this.soundSystem.setEnabled(e.target.checked);
        });

        // Risk of Rain content toggle
        const rorToggle = document.getElementById('ror-toggle');
        rorToggle.addEventListener('change', (e) => {
            this.riskOfRainContent = e.target.checked;
        });

        // Player color picker
        const colorPicker = document.getElementById('player-color');
        const colorInput = document.getElementById('color-input');

        colorPicker.addEventListener('input', (e) => {
            this.playerColor = e.target.value;
            colorInput.value = e.target.value;
        });

        colorInput.addEventListener('input', (e) => {
            let value = e.target.value.trim();

            // Add # if missing
            if (value && !value.startsWith('#')) {
                value = '#' + value;
                e.target.value = value;
            }

            // Validate hex color (3 or 6 digits)
            if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
                this.playerColor = value;
                colorPicker.value = value;
            }
        });

        // Background image upload
        const bgUpload = document.getElementById('bg-upload');
        bgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.backgroundImage = img;
                        // Create a tiled pattern from the image
                        this.backgroundPattern = this.ctx.createPattern(img, 'repeat');
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    clearCustomBackground() {
        this.backgroundImage = null;
        this.backgroundPattern = null;
        document.getElementById('bg-upload').value = '';
    }

    loadHighscores() {
        const saved = localStorage.getItem('armoryHighscores');
        if (saved) {
            const data = JSON.parse(saved);
            this.highscores = data;
        } else {
            // Initialize default highscores
            this.highscores = {
                bestTime: 0,
                bestWorldLevel: 1,
                totalRuns: 0
            };
        }
    }

    saveHighscores() {
        localStorage.setItem('armoryHighscores', JSON.stringify(this.highscores));
    }

    updateHighscores() {
        let updated = false;

        // Update best time
        if (this.survivalTime > this.highscores.bestTime) {
            this.highscores.bestTime = this.survivalTime;
            updated = true;
        }

        // Update best world level
        if (this.worldLevel > this.highscores.bestWorldLevel) {
            this.highscores.bestWorldLevel = this.worldLevel;
            updated = true;
        }

        // Increment total runs
        this.highscores.totalRuns++;

        // Save if anything was updated
        this.saveHighscores();

        return updated;
    }

    showMenu() {
        document.getElementById('multiplayer-setup').classList.remove('hidden');
    }

    startSinglePlayer() {
        this.multiplayerMode = 'local';
        document.getElementById('multiplayer-setup').classList.add('hidden');
        this.initPlayer(0);
    }

    startLocalMultiplayer() {
        this.multiplayerMode = 'local';
        document.getElementById('multiplayer-setup').classList.add('hidden');

        // Create both players first
        const p1 = new Player(this.canvas.width / 2 - 50, this.canvas.height / 2, 0, this, this.playerColor);
        const p2 = new Player(this.canvas.width / 2 + 50, this.canvas.height / 2, 1, this);
        this.players[0] = p1;
        this.players[1] = p2;

        // Start with Player 1's ability selection
        this.showAbilitySelection(0);
    }

    hostNetworkGame() {
        this.multiplayerMode = 'host';
        this.roomCode = Math.random().toString(36).substring(7).toUpperCase();
        alert(`Room Code: ${this.roomCode}\nShare this code with Player 2!`);
        document.getElementById('multiplayer-setup').classList.add('hidden');
        this.initPlayer(0);
        // In a real implementation, you'd set up WebRTC or WebSocket here
    }

    joinNetworkGame() {
        const code = document.getElementById('room-code').value.toUpperCase();
        if (!code) {
            alert('Please enter a room code!');
            return;
        }
        this.multiplayerMode = 'client';
        this.roomCode = code;
        document.getElementById('multiplayer-setup').classList.add('hidden');
        this.initPlayer(1);
        // In a real implementation, you'd connect to host via WebRTC or WebSocket
    }

    initPlayer(index) {
        const x = this.canvas.width / 2 + (index === 0 ? -50 : 50);
        const y = this.canvas.height / 2;
        const color = index === 0 ? this.playerColor : null;
        const player = new Player(x, y, index, this, color);
        this.players[index] = player;
        this.showAbilitySelection(index);
    }

    showAbilitySelection(playerIndex) {
        const player = this.players[playerIndex];
        const modal = document.getElementById('ability-selection');
        const optionsContainer = document.getElementById('ability-options');
        const header = modal.querySelector('h2');

        // Update header to show which player is selecting
        header.textContent = `Player ${playerIndex + 1}: Choose Your Starting Ability`;

        optionsContainer.innerHTML = '';

        const abilities = [
            {
                name: 'Dash',
                description: 'Quick speed burst on cooldown. Press SPACE (P1) or SHIFT (P2) to dash.',
                effect: () => new DashAbility(player)
            },
            {
                name: 'Turret',
                description: 'Deploy a turret for 7 seconds. Fires at 150% of your stats. Press SPACE/SHIFT.',
                effect: () => new TurretAbility(player, this)
            },
            {
                name: 'Drone',
                description: 'Permanent drone companion. Fires at 40% of your stats.',
                effect: () => new DroneAbility(player, this)
            },
            {
                name: 'Phase Shield',
                description: 'Stand still for 2 seconds to gain an overshield that absorbs damage.',
                effect: () => new PhaseShieldAbility(player)
            },
            {
                name: 'Explosive',
                description: 'Fires 3 large orange explosive balls in a spread. Massive AOE damage! Press SPACE/SHIFT.',
                effect: () => new ExplosiveAbility(player, this)
            },
            {
                name: 'Large',
                description: '50% larger size, 75% more damage, 75% more health, 25% more range, -50% speed.',
                effect: () => new LargeAbility(player)
            },
            {
                name: 'Small',
                description: '40% faster, 30% smaller size.',
                effect: () => new SmallAbility(player)
            },
            {
                name: 'Laser Blade',
                description: 'Press SPACE/SHIFT to create a high-damage ring for 1.5 seconds.',
                effect: () => new LaserBladeAbility(player, this)
            }
        ];

        // Add Risk of Rain abilities if enabled
        if (this.riskOfRainContent) {
            abilities.push(
                {
                    name: 'Commando',
                    description: 'Roll a short distance and fire high powered shots for 2 seconds. Press SPACE/SHIFT.',
                    effect: () => new CommandoAbility(player, this)
                },
                {
                    name: 'Mercenary',
                    description: 'Slash a sword 3 times, going medium distance with high damage. Press SPACE/SHIFT.',
                    effect: () => new MercenaryAbility(player, this)
                },
                {
                    name: 'Operator',
                    description: '3 drones follow you. Each fires at 13% power. One drone heals you. Passive ability.',
                    effect: () => new OperatorAbility(player, this)
                },
                {
                    name: 'Void Fiend',
                    description: 'Fire a large purple energy beam dealing massive damage. Press SPACE/SHIFT.',
                    effect: () => new VoidFiendAbility(player, this)
                },
                {
                    name: 'Railgunner',
                    description: 'Shoot a narrow high-power beam at the enemy with the most health. Press SPACE/SHIFT.',
                    effect: () => new RailgunnerAbility(player, this)
                },
                {
                    name: 'Acrid',
                    description: 'You are 30% larger and spit acid pools that damage enemies. Press SPACE/SHIFT.',
                    effect: () => new AcridAbility(player, this)
                }
            );
        }

        abilities.forEach(ability => {
            const card = document.createElement('div');
            card.className = 'ability-card';
            card.innerHTML = `
                <h3>${ability.name}</h3>
                <p>${ability.description}</p>
            `;
            card.onclick = () => {
                player.ability = ability.effect();
                player.ability.apply();
                modal.classList.add('hidden');

                // Check if there's another player that needs to select
                const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
                const otherPlayer = this.players[otherPlayerIndex];

                if (otherPlayer && !otherPlayer.ability) {
                    // Show ability selection for the other player
                    setTimeout(() => {
                        this.showAbilitySelection(otherPlayerIndex);
                    }, 100);
                    return;
                }

                // Start game when all players have selected
                this.state = 'playing';
                this.start();
            };
            optionsContainer.appendChild(card);
        });

        modal.classList.remove('hidden');
    }

    start() {
        this.lastTime = performance.now();

        // Initialize camera to player position first
        this.updateCamera();

        // Spawn initial enemies so player has something to shoot immediately
        for (let i = 0; i < 8; i++) {
            this.spawnEnemy();
        }

        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === 'playing') {
            this.update(deltaTime);
        }

        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update survival time
        this.survivalTime += deltaTime;

        // World level progression
        this.worldLevelTimer += deltaTime;
        if (this.worldLevelTimer >= this.worldLevelInterval) {
            this.worldLevel++;
            this.worldLevelTimer = 0;
        }

        // Update players
        this.players.forEach(player => {
            if (player) {
                player.update(deltaTime, this.keys);

                // Collect orbs
                this.orbs = this.orbs.filter(orb => {
                    const dx = orb.x - player.x;
                    const dy = orb.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < this.pickupRange) {
                        if (orb.type === 'xp') {
                            this.xp += orb.value * this.xpGainMultiplier;
                            this.soundSystem.playOrbPickup('xp');
                        } else if (orb.type === 'heal') {
                            this.players.forEach(p => {
                                if (p) p.heal(orb.value);
                            });
                            this.soundSystem.playOrbPickup('heal');
                        }
                        return false;
                    }
                    return true;
                });
            }
        });

        // Update camera to follow players
        this.updateCamera();

        // Check for level up
        if (this.xp >= this.xpToLevel) {
            this.levelUp();
        }

        // Update entities (turrets, drones)
        this.entities = this.entities.filter(entity => {
            entity.update(deltaTime);
            return entity.alive;
        });

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            const target = this.getNearestPlayer(enemy.x, enemy.y);
            enemy.update(deltaTime, target);
            return enemy.alive;
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.update(deltaTime);
            return proj.alive && this.isOnScreen(proj.x, proj.y, 100);
        });

        // Update orbs (move toward players)
        this.orbs.forEach(orb => {
            const target = this.getNearestPlayer(orb.x, orb.y);
            if (target) {
                const dx = target.x - orb.x;
                const dy = target.y - orb.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const attractionRange = this.pickupRange * 4; // Larger attraction zone

                if (dist < attractionRange) {
                    // Once attracted, orb locks onto player
                    if (!orb.attracted) {
                        orb.attracted = true;
                        orb.speed = 0;
                    }

                    // Accelerate toward player (gets faster as it gets closer)
                    const acceleration = 800; // Fast acceleration
                    orb.speed += acceleration * (deltaTime / 1000);
                    orb.speed = Math.min(orb.speed, 1200); // Max speed cap

                    // Fly directly to player
                    if (dist > 0) {
                        orb.x += (dx / dist) * orb.speed * (deltaTime / 1000);
                        orb.y += (dy / dist) * orb.speed * (deltaTime / 1000);
                    }
                }
            }
        });

        // Spawn enemies
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            // Spawn 2-3 enemies at once early game
            const spawnCount = this.worldLevel < 3 ? 2 : 1;
            for (let i = 0; i < spawnCount; i++) {
                this.spawnEnemy();
            }
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(500, 1000 - (this.worldLevel * 30));
        }

        // Spawn boss
        this.bossSpawnTimer += deltaTime;
        if (this.bossSpawnTimer >= this.bossSpawnInterval) {
            this.spawnBoss();
            this.bossSpawnTimer = 0;
        }

        // Collision detection
        this.checkCollisions(deltaTime);

        // Check game over
        if (this.players.every(p => !p || p.health <= 0)) {
            this.gameOver();
        }
    }

    updateCamera() {
        // Calculate average position of alive players
        let avgX = 0;
        let avgY = 0;
        let count = 0;

        this.players.forEach(player => {
            if (player && player.health > 0) {
                avgX += player.x;
                avgY += player.y;
                count++;
            }
        });

        if (count > 0) {
            avgX /= count;
            avgY /= count;

            // Smooth camera movement (unless it's the first update)
            const smoothing = (this.cameraX === 0 && this.cameraY === 0) ? 1.0 : 0.1;
            this.cameraX += (avgX - this.canvas.width / 2 - this.cameraX) * smoothing;
            this.cameraY += (avgY - this.canvas.height / 2 - this.cameraY) * smoothing;
        }
    }

    toScreenX(worldX) {
        return worldX - this.cameraX;
    }

    toScreenY(worldY) {
        return worldY - this.cameraY;
    }

    toWorldX(screenX) {
        return screenX + this.cameraX;
    }

    toWorldY(screenY) {
        return screenY + this.cameraY;
    }

    spawnEnemy() {
        const types = ['basic', 'basic', 'fast', 'tank', 'ranged'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Get player position for reference
        const player = this.players.find(p => p && p.health > 0);
        if (!player) return;

        // Spawn around player position (not camera, for more reliable spawning)
        const side = Math.floor(Math.random() * 4);
        let x, y;

        const spawnDistance = 200; // Distance from player

        switch(side) {
            case 0: // top
                x = player.x + (Math.random() - 0.5) * 400;
                y = player.y - spawnDistance;
                break;
            case 1: // right
                x = player.x + spawnDistance;
                y = player.y + (Math.random() - 0.5) * 400;
                break;
            case 2: // bottom
                x = player.x + (Math.random() - 0.5) * 400;
                y = player.y + spawnDistance;
                break;
            case 3: // left
                x = player.x - spawnDistance;
                y = player.y + (Math.random() - 0.5) * 400;
                break;
        }

        const enemy = new Enemy(x, y, type, this);
        this.enemies.push(enemy);
        console.log(`Spawned ${type} enemy at (${Math.round(x)}, ${Math.round(y)}). Total enemies: ${this.enemies.length}`);
    }

    spawnBoss() {
        // Spawn boss above camera view
        const x = this.cameraX + this.canvas.width / 2;
        const y = this.cameraY - 100;

        const bossType = this.bossTypes[this.currentBossType];

        switch(bossType) {
            case 'Hydra':
                this.enemies.push(new HydraBoss(x, y, this));
                break;
            case 'Golem':
                this.enemies.push(new GolemBoss(x, y, this));
                break;
            case 'Necromancer':
                this.enemies.push(new NecromancerBoss(x, y, this));
                break;
        }

        // Rotate to next boss type
        this.currentBossType = (this.currentBossType + 1) % this.bossTypes.length;
    }

    checkCollisions(deltaTime) {
        // Player projectiles vs enemies
        this.projectiles.forEach(proj => {
            if (proj.friendly) {
                this.enemies.forEach(enemy => {
                    if (this.circleCollision(proj.x, proj.y, proj.radius, enemy.x, enemy.y, enemy.size)) {
                        enemy.takeDamage(proj.damage, proj);
                        if (!proj.piercing) proj.alive = false;
                    }
                });
            }
        });

        // Enemy projectiles vs players
        this.projectiles.forEach(proj => {
            if (!proj.friendly) {
                this.players.forEach(player => {
                    if (player && this.circleCollision(proj.x, proj.y, proj.radius, player.x, player.y, player.size)) {
                        player.takeDamage(proj.damage);
                        proj.alive = false;
                    }
                });
            }
        });

        // Enemies vs players (contact damage)
        this.enemies.forEach(enemy => {
            this.players.forEach(player => {
                if (player && player.health > 0 && this.circleCollision(enemy.x, enemy.y, enemy.size, player.x, player.y, player.size)) {
                    // Apply damage per second, scaled by deltaTime
                    player.takeDamage(enemy.contactDamage * (deltaTime / 1000));

                    // Push enemy away slightly to prevent sticking
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        const pushStrength = 50;
                        enemy.x += (dx / dist) * pushStrength * (deltaTime / 1000);
                        enemy.y += (dy / dist) * pushStrength * (deltaTime / 1000);
                    }
                }
            });
        });

        // Laser blade vs enemies
        this.entities.forEach(entity => {
            if (entity.type === 'laserBlade') {
                this.enemies.forEach(enemy => {
                    if (this.circleCollision(entity.x, entity.y, entity.radius, enemy.x, enemy.y, enemy.size)) {
                        enemy.takeDamage(entity.damage);
                    }
                });
            }
        });

        // Player projectiles vs purple minions
        this.projectiles.forEach(proj => {
            if (proj.friendly) {
                this.entities.forEach(entity => {
                    if (entity.type === 'purpleMinion' && entity.alive) {
                        if (this.circleCollision(proj.x, proj.y, proj.radius, entity.x, entity.y, entity.size)) {
                            entity.takeDamage(proj.damage);
                            if (!proj.piercing) proj.alive = false;
                        }
                    }
                });
            }
        });
    }

    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < r1 + r2;
    }

    getNearestPlayer(x, y) {
        let nearest = null;
        let nearestDist = Infinity;

        this.players.forEach(player => {
            if (player && player.health > 0) {
                const dx = player.x - x;
                const dy = player.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = player;
                }
            }
        });

        return nearest;
    }

    isOnScreen(x, y, margin = 0) {
        return x >= -margin && x <= this.canvas.width + margin &&
               y >= -margin && y <= this.canvas.height + margin;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToLevel;
        this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
        this.soundSystem.playLevelUp();
        this.showUpgradeSelection();
    }

    showUpgradeSelection() {
        this.state = 'paused';
        const modal = document.getElementById('upgrade-selection');
        const optionsContainer = document.getElementById('upgrade-options');

        optionsContainer.innerHTML = '';

        // Get 3 random upgrades
        const available = [...this.upgradePool];

        // Add ability-specific upgrades if applicable
        this.players.forEach(player => {
            if (player && player.ability) {
                const abilityUpgrades = player.ability.getUpgrades();
                if (abilityUpgrades) {
                    available.push(...abilityUpgrades);
                }
            }
        });

        const upgrades = [];
        for (let i = 0; i < 3 && available.length > 0; i++) {
            const index = Math.floor(Math.random() * available.length);
            upgrades.push(available[index]);
            available.splice(index, 1);
        }

        upgrades.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description || ''}</p>
            `;
            card.onclick = () => {
                this.applyUpgrade(upgrade);
                modal.classList.add('hidden');
                this.state = 'playing';
            };
            optionsContainer.appendChild(card);
        });

        modal.classList.remove('hidden');
    }

    applyUpgrade(upgrade) {
        this.players.forEach(player => {
            if (!player) return;

            switch(upgrade.type) {
                case 'health':
                    player.maxHealth *= (1 + upgrade.value);
                    player.health *= (1 + upgrade.value);
                    break;
                case 'speed':
                    player.speed *= (1 + upgrade.value);
                    break;
                case 'damage':
                    player.damage *= (1 + upgrade.value);
                    break;
                case 'fireRate':
                    player.fireRate *= (1 + upgrade.value);
                    break;
                case 'range':
                    player.range *= (1 + upgrade.value);
                    break;
                case 'xpGain':
                    this.xpGainMultiplier *= (1 + upgrade.value);
                    break;
                case 'pickupRange':
                    this.pickupRange *= (1 + upgrade.value);
                    break;
                case 'homingShots':
                    player.homingShots = true;
                    break;
                case 'poisonBullets':
                    player.poisonBullets = true;
                    break;
                case 'abilityUpgrade':
                    if (player.ability && upgrade.apply) {
                        upgrade.apply(player.ability);
                    }
                    break;
            }
        });
    }

    gameOver() {
        if (this.state === 'game-over') return; // Prevent multiple calls

        this.state = 'game-over';

        // Update highscores
        const newRecord = this.updateHighscores();

        // Display stats
        document.getElementById('final-time').textContent = this.formatTime(this.survivalTime);
        document.getElementById('final-level').textContent = this.worldLevel;
        document.getElementById('best-time').textContent = this.formatTime(this.highscores.bestTime);
        document.getElementById('best-level').textContent = this.highscores.bestWorldLevel;
        document.getElementById('total-runs').textContent = this.highscores.totalRuns;

        // Show new record indicator if applicable
        const newRecordEl = document.getElementById('new-record');
        if (newRecord && newRecordEl) {
            newRecordEl.classList.remove('hidden');
        } else if (newRecordEl) {
            newRecordEl.classList.add('hidden');
        }

        document.getElementById('game-over').classList.remove('hidden');
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    render() {
        // Clear canvas with background
        if (this.backgroundPattern) {
            // Use custom tiled pattern
            this.ctx.save();
            this.ctx.translate(-this.cameraX, -this.cameraY);
            this.ctx.fillStyle = this.backgroundPattern;
            this.ctx.fillRect(
                this.cameraX,
                this.cameraY,
                this.canvas.width,
                this.canvas.height
            );
            this.ctx.restore();
        } else {
            // Default light gray
            this.ctx.fillStyle = '#d0d0d0';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.state === 'menu') return;

        // Save context state
        this.ctx.save();

        // Draw grid
        this.drawGrid();

        // Draw orbs
        this.orbs.forEach(orb => orb.render(this.ctx, this));

        // Draw entities
        this.entities.forEach(entity => entity.render(this.ctx, this));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx, this));

        // Draw projectiles
        this.projectiles.forEach(proj => proj.render(this.ctx, this));

        // Draw players
        this.players.forEach(player => {
            if (player) player.render(this.ctx, this);
        });

        // Restore context
        this.ctx.restore();

        // Draw HUD (no camera offset)
        this.drawHUD();
    }

    drawGrid() {
        const gridSize = 50;
        const offsetX = this.cameraX % gridSize;
        const offsetY = this.cameraY % gridSize;

        if (this.backgroundImage) {
            // Draw tiled images in each grid cell
            for (let x = -offsetX; x < this.canvas.width + gridSize; x += gridSize) {
                for (let y = -offsetY; y < this.canvas.height + gridSize; y += gridSize) {
                    this.ctx.drawImage(this.backgroundImage, x, y, gridSize, gridSize);
                }
            }
        } else {
            // Draw default grid lines
            this.ctx.strokeStyle = '#aaaaaa';
            this.ctx.lineWidth = 1;

            for (let x = -offsetX; x < this.canvas.width; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }

            for (let y = -offsetY; y < this.canvas.height; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
        }
    }

    drawHUD() {
        const padding = 20;
        const barHeight = 20;
        const barWidth = 200;

        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#000';

        // World Level
        this.ctx.fillText(`World Level: ${this.worldLevel}`, padding, padding + 20);

        // Survival Time
        this.ctx.fillText(`Time: ${this.formatTime(this.survivalTime)}`, padding, padding + 45);

        // Boss Timer - centered at top
        const timeUntilBoss = Math.max(0, this.bossSpawnInterval - this.bossSpawnTimer);
        const bossSeconds = Math.ceil(timeUntilBoss / 1000);
        const nextBoss = this.bossTypes[this.currentBossType];

        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`BOSS IN ${bossSeconds}s`, this.canvas.width / 2, padding + 25);
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(`Next: ${nextBoss}`, this.canvas.width / 2, padding + 48);
        this.ctx.textAlign = 'left';

        // XP Bar
        const xpPercent = this.xp / this.xpToLevel;
        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(padding, padding + 60, barWidth, barHeight);
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.fillRect(padding, padding + 60, barWidth * xpPercent, barHeight);
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(padding, padding + 60, barWidth, barHeight);

        this.ctx.fillStyle = '#000';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Level ${this.level}`, padding + barWidth / 2 - 25, padding + 75);

        // Player health bars
        let yOffset = padding + 100;
        this.players.forEach((player, index) => {
            if (player) {
                const healthPercent = player.health / player.maxHealth;

                this.ctx.fillStyle = '#000';
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`P${index + 1}`, padding, yOffset);

                this.ctx.fillStyle = '#888';
                this.ctx.fillRect(padding + 30, yOffset - 15, barWidth, barHeight);
                this.ctx.fillStyle = player.color;
                this.ctx.fillRect(padding + 30, yOffset - 15, barWidth * healthPercent, barHeight);
                this.ctx.strokeStyle = '#000';
                this.ctx.strokeRect(padding + 30, yOffset - 15, barWidth, barHeight);

                // Shield bar
                if (player.shield > 0) {
                    const shieldPercent = player.shield / player.maxShield;
                    this.ctx.fillStyle = '#00aaff';
                    this.ctx.fillRect(padding + 30, yOffset - 15, barWidth * shieldPercent, barHeight);
                }

                // Weapon indicator - NEW in v2.0.3!
                this.ctx.fillStyle = player.currentWeapon.color;
                this.ctx.font = '14px Arial';
                this.ctx.fillText(`Weapon: ${player.currentWeapon.name}`, padding + 30, yOffset + 10);

                yOffset += 45; // Increased spacing for weapon display
            }
        });

        // Highscore display - top right
        this.ctx.fillStyle = '#000';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Best Time: ${this.formatTime(this.highscores.bestTime)}`, this.canvas.width - padding, padding + 20);
        this.ctx.fillText(`Best Level: ${this.highscores.bestWorldLevel}`, this.canvas.width - padding, padding + 40);
        this.ctx.textAlign = 'left';

        // Version display
        this.ctx.fillStyle = '#00000040';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('v4.0.9', this.canvas.width - 100, this.canvas.height - 10);
    }
}

// Player Class
class Player {
    constructor(x, y, index, game, customColor = null) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.game = game;
        this.size = 10;
        // Use custom color for P1, default orange for P2
        this.color = index === 0 ? (customColor || '#00ffff') : '#ff8800';

        // Stats
        this.maxHealth = 150; // Increased from 100
        this.health = 150;
        this.speed = 200;
        this.homingShots = false;
        this.poisonBullets = false;

        // Weapon System - NEW in v2.0.3!
        this.weapons = [
            {
                name: 'Light',
                damage: 8,
                fireRate: 12, // Fast shooting
                range: 500,
                color: '#ffff00',
                type: 'light'
            },
            {
                name: 'Medium',
                damage: 15,
                fireRate: 6, // Medium
                range: 500,
                color: '#ff8800',
                type: 'medium'
            },
            {
                name: 'Heavy',
                damage: 35,
                fireRate: 2, // Slow but powerful
                range: 500,
                color: '#ff0000',
                type: 'heavy'
            }
        ];
        this.currentWeaponIndex = 0;
        this.currentWeapon = this.weapons[0];

        // Legacy properties (for compatibility)
        this.damage = this.currentWeapon.damage;
        this.fireRate = this.currentWeapon.fireRate;
        this.range = this.currentWeapon.range;

        // Damage feedback
        this.damageFlash = 0;

        // Shield
        this.maxShield = 0;
        this.shield = 0;

        // Firing
        this.fireTimer = 0;

        // Ability
        this.ability = null;

        // Movement tracking for phase shield
        this.lastX = x;
        this.lastY = y;
        this.stillTime = 0;
    }

    update(deltaTime, keys) {
        const dt = deltaTime / 1000;

        // Movement
        let dx = 0;
        let dy = 0;

        if (this.index === 0) {
            if (keys['w']) dy -= 1;
            if (keys['s']) dy += 1;
            if (keys['a']) dx -= 1;
            if (keys['d']) dx += 1;
        } else {
            if (keys['arrowup']) dy -= 1;
            if (keys['arrowdown']) dy += 1;
            if (keys['arrowleft']) dx -= 1;
            if (keys['arrowright']) dx += 1;
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Apply movement
        if (dx !== 0 || dy !== 0) {
            this.x += dx * this.speed * dt;
            this.y += dy * this.speed * dt;
            this.stillTime = 0;
        } else {
            this.stillTime += deltaTime;
        }

        // No bounds in infinite world!

        // Auto-fire (using current weapon stats)
        this.fireTimer += deltaTime;

        // Safety check: ensure currentWeapon exists
        if (!this.currentWeapon) {
            this.currentWeapon = this.weapons[0];
        }

        const fireInterval = 1000 / this.currentWeapon.fireRate;

        if (this.fireTimer >= fireInterval) {
            this.fire();
            this.fireTimer = 0;
        }

        // Update ability
        if (this.ability) {
            this.ability.update(deltaTime);
        }

        // Update damage flash
        if (this.damageFlash > 0) {
            this.damageFlash -= deltaTime;
        }
    }

    fire() {
        // Safety check: ensure currentWeapon exists
        if (!this.currentWeapon) {
            console.error('No weapon equipped! Resetting to default.');
            this.currentWeapon = this.weapons[0];
            return;
        }

        // Find nearest enemy in range
        let target = null;
        let nearestDist = Infinity;

        this.game.enemies.forEach(enemy => {
            // Skip dead or invalid enemies
            if (!enemy || !enemy.alive || enemy.health <= 0) return;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < nearestDist) {
                nearestDist = dist;
                target = enemy;
            }
        });

        // Only fire if target is within range
        if (target && nearestDist <= this.currentWeapon.range) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);

            // Create projectile with current weapon stats
            const projectile = new Projectile(
                this.x, this.y, angle, this.currentWeapon.damage, true, this.game,
                this.homingShots, this.poisonBullets, target
            );

            // Set projectile color to match weapon
            projectile.color = this.currentWeapon.color;

            // Add to game projectiles array
            this.game.projectiles.push(projectile);

            // Play weapon sound effect!
            this.game.soundSystem.playShoot(this.currentWeapon.type);
        }
    }

    cycleWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        this.currentWeapon = this.weapons[this.currentWeaponIndex];

        // Update legacy properties
        this.damage = this.currentWeapon.damage;
        this.fireRate = this.currentWeapon.fireRate;
        this.range = this.currentWeapon.range;

        // CRITICAL FIX: Reset fire timer to allow immediate firing with new weapon
        // This prevents the bug where switching weapons breaks shooting
        this.fireTimer = 0;

        // Play weapon switch sound!
        this.game.soundSystem.playWeaponSwitch();

        console.log(`Switched to ${this.currentWeapon.name} weapon - Ready to fire!`);
    }

    takeDamage(amount) {
        if (amount > 0) {
            this.damageFlash = 200; // Flash for 200ms
            this.game.soundSystem.playHit();
        }

        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.health += this.shield; // Overflow damage
                this.shield = 0;
            }
        } else {
            this.health -= amount;
        }

        this.health = Math.max(0, this.health);
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    useAbility() {
        if (this.ability) {
            this.ability.use();
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw player (flash red when taking damage)
        if (this.damageFlash > 0) {
            ctx.fillStyle = '#ff0000';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw range circle (more visible)
        ctx.strokeStyle = this.color + '40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.range, 0, Math.PI * 2);
        ctx.stroke();

        // Draw crosshair to nearest enemy
        let nearestEnemy = null;
        let nearestDist = Infinity;
        game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist && dist <= this.range) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        });

        if (nearestEnemy) {
            const targetScreenX = game.toScreenX(nearestEnemy.x);
            const targetScreenY = game.toScreenY(nearestEnemy.y);

            // Draw line to target
            ctx.strokeStyle = this.color + '60';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(targetScreenX, targetScreenY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw ability indicator
        if (this.ability) {
            this.ability.renderIndicator(ctx, screenX, screenY);
        }
    }
}

// Enemy Class
class Enemy {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        this.alive = true;

        // Apply world level scaling
        const scale = 1 + (game.worldLevel - 1) * 0.08;

        switch(type) {
            case 'basic':
                this.size = 8;
                this.color = '#ff0000';
                this.maxHealth = 20 * scale;
                this.speed = 80;
                this.damage = 2 * scale;
                this.contactDamage = 1.5 * scale; // Further reduced
                this.xpValue = 10;
                break;
            case 'fast':
                this.size = 6;
                this.color = '#0044ff';
                this.maxHealth = 10 * scale;
                this.speed = 150;
                this.damage = 1.5 * scale;
                this.contactDamage = 1 * scale; // Further reduced
                this.xpValue = 8;
                break;
            case 'tank':
                this.size = 15;
                this.color = '#00ff00';
                this.maxHealth = 80 * scale;
                this.speed = 40;
                this.damage = 4 * scale;
                this.contactDamage = 5 * scale; // Further reduced
                this.xpValue = 30;
                break;
            case 'ranged':
                this.size = 7;
                this.color = '#aa00ff';
                this.maxHealth = 15 * scale;
                this.speed = 60;
                this.damage = 3 * scale;
                this.contactDamage = 1 * scale; // Further reduced
                this.xpValue = 15;
                this.fireRate = 1;
                this.fireTimer = 0;
                this.range = 300;
                break;
            case 'boss':
                this.size = 30;
                this.color = '#000000';
                this.maxHealth = 500 * scale;
                this.speed = 30;
                this.damage = 8 * scale;
                this.contactDamage = 10 * scale; // Further reduced
                this.xpValue = 200;
                this.fireRate = 2;
                this.fireTimer = 0;
                this.range = 400;
                this.spawnTimer = 0;
                this.spawnInterval = 5000;
                break;
        }

        this.health = this.maxHealth;
        this.poisonStacks = 0;
        this.poisonTimer = 0;
    }

    update(deltaTime, target) {
        if (!target) return;

        const dt = deltaTime / 1000;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Move toward target
        if (this.type === 'ranged') {
            // Ranged enemies keep distance
            if (dist > this.range * 0.7) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            } else if (dist < this.range * 0.5) {
                this.x -= (dx / dist) * this.speed * dt;
                this.y -= (dy / dist) * this.speed * dt;
            }
        } else {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Fire projectiles (ranged and boss)
        if ((this.type === 'ranged' || this.type === 'boss') && dist < this.range) {
            this.fireTimer += deltaTime;
            const fireInterval = 1000 / this.fireRate;

            if (this.fireTimer >= fireInterval) {
                const angle = Math.atan2(dy, dx);
                this.game.projectiles.push(
                    new Projectile(this.x, this.y, angle, this.damage, false, this.game)
                );
                this.fireTimer = 0;
            }
        }

        // Boss spawns minions
        if (this.type === 'boss') {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 / 3) * i;
                    const spawnX = this.x + Math.cos(angle) * 50;
                    const spawnY = this.y + Math.sin(angle) * 50;
                    this.game.enemies.push(new Enemy(spawnX, spawnY, 'basic', this.game));
                }
                this.spawnTimer = 0;
            }
        }

        // Poison damage
        if (this.poisonStacks > 0) {
            this.poisonTimer += deltaTime;
            if (this.poisonTimer >= 1000) {
                this.health -= this.poisonStacks;
                this.poisonTimer = 0;
            }
        }

        // Remove if dead
        if (this.health <= 0) {
            this.die();
        }
    }

    takeDamage(amount, projectile) {
        this.health -= amount;

        // Apply poison
        if (projectile && projectile.poison) {
            this.poisonStacks = Math.min(10, this.poisonStacks + 1);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.game.soundSystem.playEnemyDeath();

        // Drop orbs
        const xpOrbs = Math.floor(this.xpValue / 5);
        for (let i = 0; i < xpOrbs; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 30;
            const x = this.x + Math.cos(angle) * dist;
            const y = this.y + Math.sin(angle) * dist;

            const isHeal = Math.random() < 0.2;
            this.game.orbs.push(new Orb(x, y, isHeal ? 'heal' : 'xp', isHeal ? 15 : 5));
        }

        // Remove from array
        const index = this.game.enemies.indexOf(this);
        if (index > -1) {
            this.game.enemies.splice(index, 1);
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar
        const barWidth = this.size * 2.5;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 10;

        ctx.fillStyle = '#666';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border for health bar
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Poison indicator
        if (this.poisonStacks > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '10px Arial';
            ctx.fillText(`☠${this.poisonStacks}`, screenX + this.size, screenY - this.size);
        }
    }
}

// Projectile Class
class Projectile {
    constructor(x, y, angle, damage, friendly, game, homing = false, poison = false, target = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.friendly = friendly;
        this.game = game;
        this.homing = homing;
        this.poison = poison;
        this.target = target;

        this.speed = 500; // Faster projectiles
        this.radius = 5; // Bigger and more visible
        this.color = friendly ? '#ffff00' : '#ff0000';
        this.alive = true;
        this.piercing = false;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;

        // Homing
        if (this.homing && this.target && this.target.alive) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);

            // Gradually turn toward target
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            this.angle += angleDiff * 5 * dt;
        }

        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        ctx.fillStyle = this.color;

        if (this.poison) {
            ctx.fillStyle = '#00ff00';
        }

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Orb Class
class Orb {
    constructor(x, y, type, value) {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp' or 'heal'
        this.value = value;
        this.radius = type === 'heal' ? 6 : 4;
        this.color = type === 'heal' ? '#00ff00' : '#ffaa00';

        // Movement properties
        this.attracted = false;
        this.speed = 0;
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw trail if attracted
        if (this.attracted) {
            ctx.fillStyle = this.color + '40';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect (stronger when attracted)
        const glowAlpha = this.attracted ? 'FF' : '88';
        ctx.strokeStyle = this.color + glowAlpha;
        ctx.lineWidth = this.attracted ? 3 : 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ===== ABILITIES =====

class DashAbility {
    constructor(player) {
        this.name = 'Dash';
        this.player = player;
        this.cooldown = 3000;
        this.timer = 0;
        this.duration = 200;
        this.dashTimer = 0;
        this.dashSpeed = 800;
    }

    apply() {
        // Passive ability, no initial effect
    }

    use() {
        if (this.timer <= 0) {
            this.dashTimer = this.duration;
            this.timer = this.cooldown;
        }
    }

    update(deltaTime) {
        if (this.timer > 0) {
            this.timer -= deltaTime;
        }

        if (this.dashTimer > 0) {
            this.dashTimer -= deltaTime;
            const dt = deltaTime / 1000;

            // Move in current direction
            const keys = this.player.game.keys;
            let dx = 0, dy = 0;

            if (this.player.index === 0) {
                if (keys['w']) dy -= 1;
                if (keys['s']) dy += 1;
                if (keys['a']) dx -= 1;
                if (keys['d']) dx += 1;
            } else {
                if (keys['arrowup']) dy -= 1;
                if (keys['arrowdown']) dy += 1;
                if (keys['arrowleft']) dx -= 1;
                if (keys['arrowright']) dx += 1;
            }

            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            this.player.x += dx * this.dashSpeed * dt;
            this.player.y += dy * this.dashSpeed * dt;
        }
    }

    renderIndicator(ctx, x, y) {
        const ready = this.timer <= 0;
        ctx.strokeStyle = ready ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.player.size + 5, 0, Math.PI * 2);
        ctx.stroke();

        if (!ready) {
            const percent = 1 - (this.timer / this.cooldown);
            ctx.strokeStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(x, y, this.player.size + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
            ctx.stroke();
        }
    }

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Dash: -25% Cooldown',
                description: 'Reduces dash cooldown by 25%',
                apply: (ability) => {
                    ability.cooldown *= 0.75;
                }
            }
        ];
    }
}

class TurretAbility {
    constructor(player, game) {
        this.name = 'Turret';
        this.player = player;
        this.game = game;
        this.cooldown = 10000;
        this.timer = 0;
        this.duration = 7000;
    }

    apply() {}

    use() {
        if (this.timer <= 0) {
            const turret = new Turret(this.player.x, this.player.y, this.player, this.game, this.duration);
            this.game.entities.push(turret);
            this.timer = this.cooldown;
        }
    }

    update(deltaTime) {
        if (this.timer > 0) {
            this.timer -= deltaTime;
        }
    }

    renderIndicator(ctx, x, y) {
        const ready = this.timer <= 0;
        ctx.fillStyle = ready ? '#00ff00' : '#ff0000';
        ctx.font = '10px Arial';
        ctx.fillText('T', x - 3, y - this.player.size - 5);
    }

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Turret: +3s Duration',
                description: 'Increases turret duration by 3 seconds',
                apply: (ability) => {
                    ability.duration += 3000;
                }
            }
        ];
    }
}

class Turret {
    constructor(x, y, owner, game, duration) {
        this.type = 'turret';
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.game = game;
        this.duration = duration;
        this.timer = 0;
        this.alive = true;
        this.size = 12;

        this.fireRate = owner.fireRate * 1.5;
        this.fireTimer = 0;
        this.damage = owner.damage * 1.5;
        this.range = owner.range;
    }

    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer >= this.duration) {
            this.alive = false;
            return;
        }

        // Fire at enemies
        this.fireTimer += deltaTime;
        const fireInterval = 1000 / this.fireRate;

        if (this.fireTimer >= fireInterval) {
            let target = null;
            let nearestDist = this.range;

            this.game.enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = enemy;
                }
            });

            if (target) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                const proj = new Projectile(this.x, this.y, angle, this.damage, true, this.game);
                proj.color = this.owner.color;
                this.game.projectiles.push(proj);
            }

            this.fireTimer = 0;
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        ctx.fillStyle = this.owner.color;
        ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);

        // Duration bar
        const percent = 1 - (this.timer / this.duration);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2 - 5, this.size * percent, 2);
    }
}

class DroneAbility {
    constructor(player, game) {
        this.name = 'Drone';
        this.player = player;
        this.game = game;
    }

    apply() {
        const drone = new Drone(this.player, this.game);
        this.game.entities.push(drone);
    }

    use() {}

    update(deltaTime) {}

    renderIndicator(ctx, x, y) {}

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Drone: +15% Damage',
                description: 'Increases drone damage by 15%',
                apply: (ability) => {
                    // Find drone entity and boost it
                    ability.game.entities.forEach(entity => {
                        if (entity.type === 'drone' && entity.owner === ability.player) {
                            entity.damageMultiplier *= 1.15;
                        }
                    });
                }
            }
        ];
    }
}

class Drone {
    constructor(owner, game) {
        this.type = 'drone';
        this.owner = owner;
        this.game = game;
        this.alive = true;
        this.size = 6;
        this.x = owner.x;
        this.y = owner.y;

        this.orbitAngle = 0;
        this.orbitRadius = 40;
        this.damageMultiplier = 0.4;

        this.fireRate = owner.fireRate * 0.4;
        this.fireTimer = 0;
    }

    update(deltaTime) {
        // Orbit around owner
        this.orbitAngle += deltaTime / 500;
        this.x = this.owner.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.owner.y + Math.sin(this.orbitAngle) * this.orbitRadius;

        // Fire at enemies
        this.fireTimer += deltaTime;
        const fireInterval = 1000 / this.fireRate;

        if (this.fireTimer >= fireInterval) {
            let target = null;
            let nearestDist = this.owner.range;

            this.game.enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = enemy;
                }
            });

            if (target) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                const damage = this.owner.damage * this.damageMultiplier;
                const proj = new Projectile(this.x, this.y, angle, damage, true, this.game);
                proj.color = this.owner.color;
                this.game.projectiles.push(proj);
            }

            this.fireTimer = 0;
        }

        // Die if owner dies
        if (this.owner.health <= 0) {
            this.alive = false;
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        ctx.fillStyle = this.owner.color + 'aa';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class PhaseShieldAbility {
    constructor(player) {
        this.name = 'Phase Shield';
        this.player = player;
        this.requiredStillTime = 2000;
        this.shieldAmount = 50;
    }

    apply() {
        this.player.maxShield = this.shieldAmount;
    }

    use() {}

    update(deltaTime) {
        if (this.player.stillTime >= this.requiredStillTime && this.player.shield === 0) {
            this.player.shield = this.player.maxShield;
        }
    }

    renderIndicator(ctx, x, y) {
        if (this.player.stillTime >= this.requiredStillTime || this.player.shield > 0) {
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, this.player.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Phase Shield: +20% HP',
                description: 'Increases shield capacity by 20%',
                apply: (ability) => {
                    ability.shieldAmount *= 1.2;
                    ability.player.maxShield = ability.shieldAmount;
                }
            }
        ];
    }
}

class LargeAbility {
    constructor(player) {
        this.name = 'Large';
        this.player = player;
    }

    apply() {
        this.player.size *= 1.5;
        this.player.damage *= 1.75;
        this.player.maxHealth *= 1.75;
        this.player.health *= 1.75;
        this.player.range *= 1.25;
        this.player.speed *= 0.5;
    }

    use() {}
    update(deltaTime) {}
    renderIndicator(ctx, x, y) {}

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Large: +20% Damage',
                description: 'Increases damage by an additional 20%',
                apply: (ability) => {
                    ability.player.damage *= 1.2;
                }
            }
        ];
    }
}

class SmallAbility {
    constructor(player) {
        this.name = 'Small';
        this.player = player;
    }

    apply() {
        this.player.size *= 0.7;
        this.player.speed *= 1.4;
    }

    use() {}
    update(deltaTime) {}
    renderIndicator(ctx, x, y) {}

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Small: +Speed & Fire Rate',
                description: 'Increases speed and fire rate by 10%',
                apply: (ability) => {
                    ability.player.speed *= 1.1;
                    ability.player.fireRate *= 1.1;
                }
            }
        ];
    }
}

class LaserBladeAbility {
    constructor(player, game) {
        this.name = 'Laser Blade';
        this.player = player;
        this.game = game;
        this.cooldown = 5000;
        this.timer = 0;
        this.duration = 1500;
        this.damage = 50;
    }

    apply() {}

    use() {
        if (this.timer <= 0) {
            const blade = new LaserBlade(this.player.x, this.player.y, this.damage, this.game, this.duration);
            this.game.entities.push(blade);
            this.timer = this.cooldown;
        }
    }

    update(deltaTime) {
        if (this.timer > 0) {
            this.timer -= deltaTime;
        }
    }

    renderIndicator(ctx, x, y) {
        const ready = this.timer <= 0;
        ctx.strokeStyle = ready ? '#ff00ff' : '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, this.player.size + 15, 0, Math.PI * 2);
        ctx.stroke();
    }

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Laser Blade: +Damage',
                description: 'Increases laser blade damage by 50%',
                apply: (ability) => {
                    ability.damage *= 1.5;
                }
            }
        ];
    }
}

class LaserBlade {
    constructor(x, y, damage, game, duration) {
        this.type = 'laserBlade';
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.game = game;
        this.duration = duration;
        this.timer = 0;
        this.alive = true;
        this.radius = 40;

        this.hitEnemies = new Set();
    }

    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer >= this.duration) {
            this.alive = false;
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        const alpha = 1 - (this.timer / this.duration);
        ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class ExplosiveAbility {
    constructor(player, game) {
        this.name = 'Explosive';
        this.player = player;
        this.game = game;
        this.cooldown = 5000; // 5 second cooldown
        this.timer = 0;
        this.damage = 80; // High damage per explosion
        this.explosionRadius = 100; // Large explosion radius
    }

    apply() {
        // Passive ability, no initial effect
    }

    use() {
        if (this.timer <= 0) {
            // Fire 3 explosive balls in a spread
            const spreadAngles = [-0.3, 0, 0.3]; // Spread in radians (~17 degrees apart)

            // Find nearest enemy to aim at
            let target = null;
            let nearestDist = Infinity;
            this.game.enemies.forEach(enemy => {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = enemy;
                }
            });

            // Determine base angle
            let baseAngle = 0;
            if (target) {
                baseAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
            } else {
                // Fire towards mouse or forward
                baseAngle = 0;
            }

            // Create 3 explosive balls
            spreadAngles.forEach(angleOffset => {
                const angle = baseAngle + angleOffset;
                const ball = new ExplosiveBall(
                    this.player.x,
                    this.player.y,
                    angle,
                    this.damage,
                    this.explosionRadius,
                    this.game
                );
                this.game.entities.push(ball);
            });

            // Play a loud explosion sound
            this.game.soundSystem.playShoot('heavy');

            this.timer = this.cooldown;
        }
    }

    update(deltaTime) {
        if (this.timer > 0) {
            this.timer -= deltaTime;
        }
    }

    renderIndicator(ctx, x, y) {
        const ready = this.timer <= 0;
        ctx.strokeStyle = ready ? '#ff8800' : '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, this.player.size + 12, 0, Math.PI * 2);
        ctx.stroke();

        if (!ready) {
            const percent = 1 - (this.timer / this.cooldown);
            ctx.strokeStyle = '#ff8800';
            ctx.beginPath();
            ctx.arc(x, y, this.player.size + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * percent);
            ctx.stroke();
        }
    }

    getUpgrades() {
        return [
            {
                type: 'abilityUpgrade',
                name: 'Explosive: +50% Damage',
                description: 'Increases explosion damage by 50%',
                apply: (ability) => {
                    ability.damage *= 1.5;
                }
            },
            {
                type: 'abilityUpgrade',
                name: 'Explosive: +Radius',
                description: 'Increases explosion radius by 30%',
                apply: (ability) => {
                    ability.explosionRadius *= 1.3;
                }
            }
        ];
    }
}

class ExplosiveBall {
    constructor(x, y, angle, damage, explosionRadius, game) {
        this.type = 'explosiveBall';
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.explosionRadius = explosionRadius;
        this.game = game;
        this.alive = true;
        this.radius = 15; // Large orange ball
        this.speed = 250;
        this.lifetime = 2000; // Explode after 2 seconds if nothing hit
        this.timer = 0;
        this.hasExploded = false;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;

        // Move forward
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        this.timer += deltaTime;

        // Check collision with enemies
        this.game.enemies.forEach(enemy => {
            if (this.alive && !this.hasExploded) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.radius + enemy.size) {
                    this.explode();
                }
            }
        });

        // Explode after lifetime
        if (this.timer >= this.lifetime && !this.hasExploded) {
            this.explode();
        }
    }

    explode() {
        this.hasExploded = true;
        this.alive = false;

        // Create explosion effect
        const explosion = new Explosion(this.x, this.y, this.explosionRadius, this.damage, this.game);
        this.game.entities.push(explosion);

        // Damage all enemies in radius
        this.game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.explosionRadius) {
                enemy.takeDamage(this.damage);
            }
        });

        // Play explosion sound
        this.game.soundSystem.playEnemyDeath(); // Reuse this for explosion
    }

    render(ctx, game) {
        if (this.hasExploded) return;

        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw large orange ball
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Inner highlight
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 3, this.radius / 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Explosion {
    constructor(x, y, radius, damage, game) {
        this.type = 'explosion';
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.damage = damage;
        this.game = game;
        this.alive = true;
        this.radius = 10;
        this.duration = 300; // 0.3 second explosion animation
        this.timer = 0;
    }

    update(deltaTime) {
        this.timer += deltaTime;

        // Expand explosion
        this.radius = (this.timer / this.duration) * this.maxRadius;

        if (this.timer >= this.duration) {
            this.alive = false;
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        const alpha = 1 - (this.timer / this.duration);

        // Outer ring
        ctx.strokeStyle = `rgba(255, 136, 0, ${alpha})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// BOSS CLASSES - v3.0.6

class HydraBoss {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.type = 'hydra';
        this.isBoss = true;
        this.alive = true;
        this.size = 25;
        this.color = '#00dd00';

        const scale = 1 + (game.worldLevel - 1) * 0.08;
        this.maxHealth = 600 * scale; // Buffed from 400
        this.health = this.maxHealth;
        this.speed = 50;
        this.damage = 6 * scale;
        this.contactDamage = 8 * scale;
        this.xpValue = 250;

        this.fireRate = 0.8; // Buffed from 0.5 - shoots more often
        this.fireTimer = 0;
        this.range = 500;

        this.poisonStacks = 0;
        this.poisonTimer = 0;
    }

    update(deltaTime, target) {
        if (!target) return;

        const dt = deltaTime / 1000;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Move toward target
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;

        // Fire 8-way spread
        if (dist < this.range) {
            this.fireTimer += deltaTime;
            const fireInterval = 1000 / this.fireRate;

            if (this.fireTimer >= fireInterval) {
                const angleToTarget = Math.atan2(dy, dx);

                // Shoot 8 projectiles in a spread
                for (let i = 0; i < 8; i++) {
                    const angle = angleToTarget + (Math.PI * 2 / 8) * i;
                    this.game.projectiles.push(
                        new Projectile(this.x, this.y, angle, this.damage, false, this.game)
                    );
                }
                this.game.soundSystem.playShoot('heavy');
                this.fireTimer = 0;
            }
        }

        // Poison damage
        if (this.poisonStacks > 0) {
            this.poisonTimer += deltaTime;
            if (this.poisonTimer >= 1000) {
                this.health -= this.poisonStacks;
                this.poisonTimer = 0;
            }
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    takeDamage(amount, projectile) {
        this.health -= amount;

        if (projectile && projectile.poison) {
            this.poisonStacks = Math.min(10, this.poisonStacks + 1);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.game.soundSystem.playEnemyDeath();

        // Drop orbs
        const xpOrbs = Math.floor(this.xpValue / 5);
        for (let i = 0; i < xpOrbs; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 40;
            const x = this.x + Math.cos(angle) * dist;
            const y = this.y + Math.sin(angle) * dist;
            this.game.orbs.push(new Orb(x, y, 'xp', 5));
        }

        // Instant level up!
        this.game.levelUp();

        const index = this.game.enemies.indexOf(this);
        if (index > -1) {
            this.game.enemies.splice(index, 1);
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw Hydra (green boss)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw multiple heads (8 smaller circles around)
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const headX = screenX + Math.cos(angle) * (this.size * 0.7);
            const headY = screenY + Math.sin(angle) * (this.size * 0.7);
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(headX, headY, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar
        const barWidth = this.size * 3;
        const barHeight = 6;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 15;

        ctx.fillStyle = '#666';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HYDRA', screenX, barY - 5);
        ctx.textAlign = 'left';
    }
}

class GolemBoss {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.type = 'golem';
        this.isBoss = true;
        this.alive = true;
        this.size = 35;
        this.color = '#8b4513';

        const scale = 1 + (game.worldLevel - 1) * 0.08;
        this.maxHealth = 900 * scale; // Buffed from 600
        this.health = this.maxHealth;
        this.speed = 30;
        this.damage = 12 * scale;
        this.contactDamage = 15 * scale;
        this.xpValue = 300;

        this.fireRate = 0.5; // Buffed from 0.3 - shoots more often
        this.fireTimer = 0;
        this.range = 600;

        this.poisonStacks = 0;
        this.poisonTimer = 0;
    }

    update(deltaTime, target) {
        if (!target) return;

        const dt = deltaTime / 1000;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Move toward target slowly
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;

        // Fire massive balls
        if (dist < this.range) {
            this.fireTimer += deltaTime;
            const fireInterval = 1000 / this.fireRate;

            if (this.fireTimer >= fireInterval) {
                const angle = Math.atan2(dy, dx);
                this.game.entities.push(new MassiveBall(this.x, this.y, angle, this.damage, this.game));
                this.game.soundSystem.playShoot('heavy');
                this.fireTimer = 0;
            }
        }

        // Poison damage
        if (this.poisonStacks > 0) {
            this.poisonTimer += deltaTime;
            if (this.poisonTimer >= 1000) {
                this.health -= this.poisonStacks;
                this.poisonTimer = 0;
            }
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    takeDamage(amount, projectile) {
        this.health -= amount;

        if (projectile && projectile.poison) {
            this.poisonStacks = Math.min(10, this.poisonStacks + 1);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.game.soundSystem.playEnemyDeath();

        const xpOrbs = Math.floor(this.xpValue / 5);
        for (let i = 0; i < xpOrbs; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 50;
            const x = this.x + Math.cos(angle) * dist;
            const y = this.y + Math.sin(angle) * dist;
            this.game.orbs.push(new Orb(x, y, 'xp', 5));
        }

        // Instant level up!
        this.game.levelUp();

        const index = this.game.enemies.indexOf(this);
        if (index > -1) {
            this.game.enemies.splice(index, 1);
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw Golem (brown/tan, rectangular)
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - this.size, screenY - this.size, this.size * 2, this.size * 2);

        // Draw rocky details
        ctx.fillStyle = '#654321';
        ctx.fillRect(screenX - this.size * 0.6, screenY - this.size * 0.6, this.size * 0.4, this.size * 0.4);
        ctx.fillRect(screenX + this.size * 0.2, screenY + this.size * 0.2, this.size * 0.5, this.size * 0.5);

        // Health bar
        const barWidth = this.size * 3;
        const barHeight = 6;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 15;

        ctx.fillStyle = '#666';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GOLEM', screenX, barY - 5);
        ctx.textAlign = 'left';
    }
}

class NecromancerBoss {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.type = 'necromancer';
        this.isBoss = true;
        this.alive = true;
        this.size = 18;
        this.color = '#9933ff';

        const scale = 1 + (game.worldLevel - 1) * 0.08;
        this.maxHealth = 300 * scale; // Buffed from 200
        this.health = this.maxHealth;
        this.speed = 70; // Medium speed
        this.damage = 4 * scale; // Weak damage
        this.contactDamage = 5 * scale;
        this.xpValue = 200;

        this.summonRate = 2.0; // Buffed from 1.5 - summons more often
        this.summonTimer = 0;
        this.range = 400;

        this.poisonStacks = 0;
        this.poisonTimer = 0;
    }

    update(deltaTime, target) {
        if (!target) return;

        const dt = deltaTime / 1000;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Keep distance from player (ranged behavior)
        if (dist > this.range * 0.8) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else if (dist < this.range * 0.5) {
            this.x -= (dx / dist) * this.speed * dt;
            this.y -= (dy / dist) * this.speed * dt;
        }

        // Summon purple minions
        this.summonTimer += deltaTime;
        const summonInterval = 1000 / this.summonRate;

        if (this.summonTimer >= summonInterval) {
            // Summon 2 purple minions
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spawnDist = 40;
                const spawnX = this.x + Math.cos(angle) * spawnDist;
                const spawnY = this.y + Math.sin(angle) * spawnDist;
                this.game.entities.push(new PurpleMinion(spawnX, spawnY, this.game));
            }
            this.game.soundSystem.playShoot('medium');
            this.summonTimer = 0;
        }

        // Poison damage
        if (this.poisonStacks > 0) {
            this.poisonTimer += deltaTime;
            if (this.poisonTimer >= 1000) {
                this.health -= this.poisonStacks;
                this.poisonTimer = 0;
            }
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    takeDamage(amount, projectile) {
        this.health -= amount;

        if (projectile && projectile.poison) {
            this.poisonStacks = Math.min(10, this.poisonStacks + 1);
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.game.soundSystem.playEnemyDeath();

        const xpOrbs = Math.floor(this.xpValue / 5);
        for (let i = 0; i < xpOrbs; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 30;
            const x = this.x + Math.cos(angle) * dist;
            const y = this.y + Math.sin(angle) * dist;
            this.game.orbs.push(new Orb(x, y, 'xp', 5));
        }

        // Instant level up!
        this.game.levelUp();

        const index = this.game.enemies.indexOf(this);
        if (index > -1) {
            this.game.enemies.splice(index, 1);
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw Necromancer (purple with aura)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Purple aura
        ctx.strokeStyle = '#cc66ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size + 5, 0, Math.PI * 2);
        ctx.stroke();

        // Health bar
        const barWidth = this.size * 3;
        const barHeight = 6;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 15;

        ctx.fillStyle = '#666';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NECROMANCER', screenX, barY - 5);
        ctx.textAlign = 'left';
    }
}

// Golem's Massive Ball projectile
class MassiveBall {
    constructor(x, y, angle, damage, game) {
        this.type = 'massiveBall';
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.game = game;
        this.alive = true;
        this.radius = 25; // Huge!
        this.speed = 150; // Slow
        this.lifetime = 5000;
        this.timer = 0;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        this.timer += deltaTime;
        if (this.timer >= this.lifetime) {
            this.alive = false;
        }

        // Check collision with players
        this.game.players.forEach(player => {
            if (!player || player.health <= 0) return;

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.radius + player.size) {
                player.takeDamage(this.damage);
                this.alive = false;
            }
        });
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw massive brown ball
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Darker outline
        ctx.strokeStyle = '#3d2713';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Necromancer's Purple Minion
class PurpleMinion {
    constructor(x, y, game) {
        this.type = 'purpleMinion';
        this.x = x;
        this.y = y;
        this.game = game;
        this.alive = true;
        this.size = 8;
        this.color = '#9933ff';
        this.maxHealth = 15;
        this.health = this.maxHealth;
        this.speed = 70;
        this.damage = 3;
        this.contactDamage = 2;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;

        // Find nearest player
        let target = null;
        let nearestDist = Infinity;
        this.game.players.forEach(player => {
            if (!player || player.health <= 0) return;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                target = player;
            }
        });

        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;

            // Contact damage
            if (dist < this.size + target.size) {
                target.takeDamage(this.contactDamage);
                this.alive = false;
            }
        }

        if (this.health <= 0) {
            this.alive = false;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.alive = false;
            this.game.soundSystem.playEnemyDeath();
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Purple ball
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// RISK OF RAIN ABILITIES - v4.0.9

class CommandoAbility {
    constructor(player, game) {
        this.name = 'Commando';
        this.player = player;
        this.game = game;
        this.cooldown = 6000;
        this.timer = 0;
        this.empoweredDuration = 2000;
        this.empoweredTimer = 0;
        this.rollDistance = 150;
    }

    apply() {}

    use() {
        if (this.timer <= 0) {
            // Roll in current direction
            const keys = this.game.keys;
            let dx = 0, dy = 0;

            if (this.player.index === 0) {
                if (keys['w']) dy -= 1;
                if (keys['s']) dy += 1;
                if (keys['a']) dx -= 1;
                if (keys['d']) dx += 1;
            } else {
                if (keys['arrowup']) dy -= 1;
                if (keys['arrowdown']) dy += 1;
                if (keys['arrowleft']) dx -= 1;
                if (keys['arrowright']) dx += 1;
            }

            if (dx === 0 && dy === 0) dy = -1; // Default forward if no input

            const dist = Math.sqrt(dx * dx + dy * dy);
            this.player.x += (dx / dist) * this.rollDistance;
            this.player.y += (dy / dist) * this.rollDistance;

            // Enable empowered shots
            this.empoweredTimer = this.empoweredDuration;
            this.timer = this.cooldown;
            this.game.soundSystem.playShoot('heavy');
        }
    }

    update(deltaTime) {
        if (this.timer > 0) this.timer -= deltaTime;
        if (this.empoweredTimer > 0) {
            this.empoweredTimer -= deltaTime;
            // Boost damage while empowered
            if (!this.originalDamage) {
                this.originalDamage = this.player.currentWeapon.damage;
            }
            this.player.currentWeapon.damage = this.originalDamage * 2;
        } else if (this.originalDamage) {
            this.player.currentWeapon.damage = this.originalDamage;
            this.originalDamage = null;
        }
    }

    renderIndicator(ctx, x, y) {
        const ready = this.timer <= 0;
        ctx.strokeStyle = ready ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.player.size + 10, 0, Math.PI * 2);
        ctx.stroke();

        // Show empowered state
        if (this.empoweredTimer > 0) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('POWER!', x - 15, y - this.player.size - 10);
        }
    }

    getUpgrades() {
        return [];
    }
}

class MercenaryAbility {
    constructor(player, game) {
        this.name = 'Mercenary';
        this.player = player;
        this.game = game;
        this.cooldown = 5000;
        this.timer = 0;
        this.slashCount = 0;
        this.slashing = false;
        this.slashDelay = 200;
        this.slashTimer = 0;
        this.slashDamage = 80;
        this.slashDistance = 60;
    }

    apply() {}

    use() {
        if (this.timer <= 0 && !this.slashing) {
            this.slashing = true;
            this.slashCount = 0;
            this.slashTimer = 0;
        }
    }

    update(deltaTime) {
        if (this.timer > 0) this.timer -= deltaTime;

        if (this.slashing) {
            this.slashTimer += deltaTime;

            if (this.slashTimer >= this.slashDelay && this.slashCount < 3) {
                this.performSlash();
                this.slashCount++;
                this.slashTimer = 0;

                if (this.slashCount >= 3) {
                    this.slashing = false;
                    this.timer = this.cooldown;
                }
            }
        }
    }

    performSlash() {
        // Find nearest enemy
        let target = null;
        let nearestDist = Infinity;

        this.game.enemies.forEach(enemy => {
            if (!enemy || !enemy.alive) return;
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                target = enemy;
            }
        });

        // Dash toward target
        if (target) {
            const dx = target.x - this.player.x;
            const dy = target.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.player.x += (dx / dist) * this.slashDistance;
            this.player.y += (dy / dist) * this.slashDistance;
        }

        // Damage nearby enemies
        this.game.enemies.forEach(enemy => {
            if (!enemy || !enemy.alive) return;
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 80) {
                enemy.takeDamage(this.slashDamage);
            }
        });

        this.game.soundSystem.playShoot('medium');
    }

    renderIndicator(ctx, x, y) {
        const ready = this.timer <= 0 && !this.slashing;
        ctx.strokeStyle = ready ? '#00ffff' : '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.player.size + 10, 0, Math.PI * 2);
        ctx.stroke();

        if (this.slashing) {
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 10px Arial';
            ctx.fillText(`SLASH ${this.slashCount}/3`, x - 20, y - this.player.size - 10);
        }
    }

    getUpgrades() {
        return [];
    }
}

class OperatorAbility {
    constructor(player, game) {
        this.name = 'Operator';
        this.player = player;
        this.game = game;
    }

    apply() {
        // Spawn 3 drones
        for (let i = 0; i < 3; i++) {
            const isHealer = i === 0; // First drone heals
            const drone = new OperatorDrone(this.player, this.game, i, isHealer);
            this.game.entities.push(drone);
        }
    }

    use() {}
    update(deltaTime) {}
    renderIndicator(ctx, x, y) {}
    getUpgrades() {
        return [];
    }
}

class OperatorDrone {
    constructor(owner, game, index, isHealer) {
        this.type = 'operatorDrone';
        this.owner = owner;
        this.game = game;
        this.index = index;
        this.isHealer = isHealer;
        this.alive = true;
        this.size = 6;
        this.x = owner.x;
        this.y = owner.y;

        this.orbitAngle = (Math.PI * 2 / 3) * index;
        this.orbitRadius = 50;
        this.damageMultiplier = 0.13;

        this.fireRate = owner.fireRate * 0.3; // Buffed from 0.13
        this.fireTimer = 0;
        this.healRate = 1; // Heal once per second
        this.healTimer = 0;
        this.healAmount = 1; // Nerfed from 2
    }

    update(deltaTime) {
        // Orbit around owner
        this.orbitAngle += deltaTime / 600;
        this.x = this.owner.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.owner.y + Math.sin(this.orbitAngle) * this.orbitRadius;

        if (this.isHealer) {
            // Heal owner
            this.healTimer += deltaTime;
            if (this.healTimer >= 1000 / this.healRate) {
                this.owner.heal(this.healAmount);
                this.healTimer = 0;
            }
        } else {
            // Fire at enemies
            this.fireTimer += deltaTime;
            const fireInterval = 1000 / this.fireRate;

            if (this.fireTimer >= fireInterval) {
                let target = null;
                let nearestDist = this.owner.range;

                this.game.enemies.forEach(enemy => {
                    if (!enemy || !enemy.alive) return;
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < nearestDist) {
                        nearestDist = dist;
                        target = enemy;
                    }
                });

                if (target) {
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    const damage = this.owner.currentWeapon.damage * this.damageMultiplier;
                    this.game.projectiles.push(
                        new Projectile(this.x, this.y, angle, damage, true, this.game)
                    );
                    this.fireTimer = 0;
                }
            }
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        ctx.fillStyle = this.isHealer ? '#00ff00' : '#0088ff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add a border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class VoidFiendAbility {
    constructor(player, game) {
        this.name = 'Void Fiend';
        this.player = player;
        this.game = game;
        this.cooldown = 8000;
        this.timer = 0;
        this.beamDuration = 1000;
        this.beamWidth = 30;
        this.beamLength = 400;
        this.beamDamage = 200;
    }

    apply() {}

    use() {
        if (this.timer <= 0) {
            // Find nearest enemy
            let target = null;
            let nearestDist = Infinity;

            this.game.enemies.forEach(enemy => {
                if (!enemy || !enemy.alive) return;
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = enemy;
                }
            });

            let angle = 0;
            if (target) {
                angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
            }

            const beam = new VoidBeam(
                this.player.x, this.player.y, angle,
                this.beamLength, this.beamWidth, this.beamDamage,
                this.beamDuration, this.game
            );
            this.game.entities.push(beam);

            this.timer = this.cooldown;
            this.game.soundSystem.playShoot('heavy');
        }
    }

    update(deltaTime) {
        if (this.timer > 0) this.timer -= deltaTime;
    }

    renderIndicator(ctx, x, y) {
        const ready = this.timer <= 0;
        ctx.strokeStyle = ready ? '#9933ff' : '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, this.player.size + 12, 0, Math.PI * 2);
        ctx.stroke();
    }

    getUpgrades() {
        return [];
    }
}

class VoidBeam {
    constructor(x, y, angle, length, width, damage, duration, game) {
        this.type = 'voidBeam';
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = length;
        this.width = width;
        this.damage = damage;
        this.duration = duration;
        this.game = game;
        this.alive = true;
        this.timer = 0;
        this.hitEnemies = new Set();
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if (this.timer >= this.duration) {
            this.alive = false;
            return;
        }

        // Damage enemies in beam
        this.game.enemies.forEach(enemy => {
            if (!enemy || !enemy.alive) return;
            if (this.hitEnemies.has(enemy)) return;

            // Check if enemy is in beam path
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.length) return;

            const enemyAngle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(enemyAngle - this.angle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            const maxAngleDiff = Math.atan(this.width / dist);

            if (angleDiff < maxAngleDiff) {
                enemy.takeDamage(this.damage);
                this.hitEnemies.add(enemy);
            }
        });
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        const alpha = 1 - (this.timer / this.duration);

        // Draw beam
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // Outer glow
        ctx.fillStyle = `rgba(153, 51, 255, ${alpha * 0.3})`;
        ctx.fillRect(0, -this.width, this.length, this.width * 2);

        // Inner beam
        ctx.fillStyle = `rgba(204, 102, 255, ${alpha * 0.8})`;
        ctx.fillRect(0, -this.width / 2, this.length, this.width);

        // Bright core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, -this.width / 4, this.length, this.width / 2);

        ctx.restore();
    }
}

class RailgunnerAbility {
    constructor(player, game) {
        this.name = 'Railgunner';
        this.player = player;
        this.game = game;
        this.cooldown = 4000;
        this.timer = 0;
        this.beamDuration = 800;
        this.beamWidth = 15; // Narrow beam
        this.beamLength = 600; // Long range
        this.beamDamage = 250; // High damage
    }

    apply() {}

    use() {
        if (this.timer <= 0) {
            // Find enemy with most health
            let target = null;
            let maxHealth = 0;

            this.game.enemies.forEach(enemy => {
                if (!enemy || !enemy.alive) return;
                if (enemy.health > maxHealth) {
                    maxHealth = enemy.health;
                    target = enemy;
                }
            });

            let angle = 0;
            if (target) {
                angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
            } else {
                // Default to right if no enemies
                angle = 0;
            }

            const beam = new RailgunBeam(
                this.player.x, this.player.y, angle,
                this.beamLength, this.beamWidth, this.beamDamage,
                this.beamDuration, this.game
            );
            this.game.entities.push(beam);
            this.timer = this.cooldown;
            this.game.soundSystem.playShoot('heavy');
        }
    }

    update(deltaTime) {
        if (this.timer > 0) this.timer -= deltaTime;
    }

    renderIndicator(ctx, x, y) {
        const cooldownPercent = Math.max(0, this.timer / this.cooldown);
        ctx.fillStyle = cooldownPercent > 0 ? '#ff0000' : '#00ffff';
        ctx.fillText(`RAILGUN: ${cooldownPercent > 0 ? (this.timer / 1000).toFixed(1) + 's' : 'READY'}`, x, y);
    }

    getUpgrades() {
        return [];
    }
}

class RailgunBeam {
    constructor(x, y, angle, length, width, damage, duration, game) {
        this.type = 'railgunBeam';
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = length;
        this.width = width;
        this.damage = damage;
        this.duration = duration;
        this.timer = 0;
        this.game = game;
        this.alive = true;
        this.hitEnemies = new Set();
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if (this.timer >= this.duration) {
            this.alive = false;
            return;
        }

        // Damage enemies in beam
        this.game.enemies.forEach(enemy => {
            if (!enemy || !enemy.alive) return;
            if (this.hitEnemies.has(enemy)) return;

            // Check if enemy is in beam path
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.length) return;

            const enemyAngle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(enemyAngle - this.angle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            const maxAngleDiff = Math.atan(this.width / dist);

            if (angleDiff < maxAngleDiff) {
                enemy.takeDamage(this.damage);
                this.hitEnemies.add(enemy);
            }
        });
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        const alpha = 1 - (this.timer / this.duration);

        // Draw beam
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // Outer glow - cyan
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
        ctx.fillRect(0, -this.width, this.length, this.width * 2);

        // Inner beam - bright cyan
        ctx.fillStyle = `rgba(100, 255, 255, ${alpha * 0.8})`;
        ctx.fillRect(0, -this.width / 2, this.length, this.width);

        // Bright core - white
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, -this.width / 4, this.length, this.width / 2);

        ctx.restore();
    }
}

class AcridAbility {
    constructor(player, game) {
        this.name = 'Acrid';
        this.player = player;
        this.game = game;
        this.cooldown = 3000;
        this.timer = 0;
        this.sizeMultiplier = 1.3; // 30% larger
        this.acidDamage = 15;
        this.acidDuration = 5000; // Acid pools last 5 seconds
    }

    apply() {
        // Make player 30% larger
        this.player.size *= this.sizeMultiplier;
    }

    use() {
        if (this.timer <= 0) {
            // Spit acid pool in front of player
            // Find direction to nearest enemy or default direction
            let angle = 0;
            let target = null;
            let nearestDist = Infinity;

            this.game.enemies.forEach(enemy => {
                if (!enemy || !enemy.alive) return;
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    target = enemy;
                }
            });

            if (target) {
                angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
            }

            // Spawn acid pool 80px in front of player
            const acidX = this.player.x + Math.cos(angle) * 80;
            const acidY = this.player.y + Math.sin(angle) * 80;

            const acidPool = new AcidPool(
                acidX, acidY, this.acidDamage, this.acidDuration, this.game
            );
            this.game.entities.push(acidPool);
            this.timer = this.cooldown;
            this.game.soundSystem.playShoot('normal');
        }
    }

    update(deltaTime) {
        if (this.timer > 0) this.timer -= deltaTime;
    }

    renderIndicator(ctx, x, y) {
        const cooldownPercent = Math.max(0, this.timer / this.cooldown);
        ctx.fillStyle = cooldownPercent > 0 ? '#ff0000' : '#00ff00';
        ctx.fillText(`ACID: ${cooldownPercent > 0 ? (this.timer / 1000).toFixed(1) + 's' : 'READY'}`, x, y);
    }

    getUpgrades() {
        return [];
    }
}

class AcidPool {
    constructor(x, y, damage, duration, game) {
        this.type = 'acidPool';
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.duration = duration;
        this.timer = 0;
        this.game = game;
        this.alive = true;
        this.radius = 40;
        this.damageInterval = 500; // Damage every 0.5 seconds
        this.damageTimer = 0;
    }

    update(deltaTime) {
        this.timer += deltaTime;

        if (this.timer >= this.duration) {
            this.alive = false;
            return;
        }

        // Damage enemies in pool
        this.damageTimer += deltaTime;
        if (this.damageTimer >= this.damageInterval) {
            this.game.enemies.forEach(enemy => {
                if (!enemy || !enemy.alive) return;

                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.radius + enemy.size) {
                    enemy.takeDamage(this.damage);
                }
            });
            this.damageTimer = 0;
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        const alpha = 1 - (this.timer / this.duration);

        // Draw acid pool
        ctx.save();

        // Outer glow - green
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Main pool - toxic green
        ctx.fillStyle = `rgba(50, 255, 50, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner pool - bright green
        ctx.fillStyle = `rgba(100, 255, 100, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Start game when page loads
let game;
window.onload = () => {
    game = new Game();
};
