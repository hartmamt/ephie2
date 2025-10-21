// Castle Eidolon - Metroidvania Roguelike

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = 1200;
        this.canvas.height = 800;

        // Game state
        this.state = 'menu'; // menu, hub, playing, paused, game-over
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.platforms = [];
        this.chains = [];
        this.doors = [];
        this.npcs = [];

        // Castle Pressure Index (CPI) - permanent difficulty
        this.cpi = 0;
        this.cpiFromDeaths = 0;
        this.cpiFromProgress = 0;
        this.totalDeaths = 0;

        // Layer progression
        this.currentLayer = 0; // 0 = Hub, 1+ = Castle Layers
        this.maxLayerReached = 0;
        this.layerEnvironments = [
            { name: 'Hub', bgColor: '#1a1a2e', floorColor: '#3a3a4e' },
            { name: 'Outer Halls', bgColor: '#2a1a1a', floorColor: '#4a2a2a' },
            { name: 'Crypts', bgColor: '#1a2a1a', floorColor: '#2a4a2a' },
            { name: 'Iron Chapel', bgColor: '#1a1a3a', floorColor: '#2a2a5a' },
            { name: 'Astral Sanctum', bgColor: '#3a1a3a', floorColor: '#5a2a5a' },
            { name: 'Eidolon Core', bgColor: '#0a0a0a', floorColor: '#2a0a0a' }
        ];

        // Camera
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraSmooth = 0.1;

        // Progression
        this.eidolonCores = 0;
        this.unlockedAbilities = [];
        this.grimoire = {}; // Enemy knowledge

        // Hub NPCs
        this.hubNPCs = [];

        // Input
        this.keys = {};
        this.setupInput();

        // Persistent save data (simulated with localStorage)
        this.loadPersistentData();

        this.lastTime = 0;
        this.showMenu();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Player actions
            if (this.player && this.state === 'playing') {
                if (e.key === ' ' || e.key.toLowerCase() === 'w') {
                    this.player.jump();
                }
                if (e.key.toLowerCase() === 'e') {
                    this.player.interact();
                }
                if (e.key === 'Shift') {
                    this.player.roll();
                }
                if (e.key.toLowerCase() === 'f') {
                    this.player.block();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;

            if (this.player) {
                if (e.key === 'Shift') {
                    this.player.isRolling = false;
                }
                if (e.key.toLowerCase() === 'f') {
                    this.player.isBlocking = false;
                }
            }
        });
    }

    showMenu() {
        document.getElementById('multiplayer-setup').classList.remove('hidden');
    }

    startGame() {
        document.getElementById('multiplayer-setup').classList.add('hidden');
        this.enterHub();
        this.state = 'hub';
        this.start();
    }

    enterHub() {
        this.currentLayer = 0;
        this.state = 'hub';
        this.enemies = [];
        this.projectiles = [];

        // Create hub layout
        this.createHubLayout();

        // Create/reset player at hub spawn
        if (!this.player) {
            this.player = new Player(200, 500, this);
        } else {
            this.player.x = 200;
            this.player.y = 500;
            this.player.health = this.player.maxHealth;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
        }
    }

    createHubLayout() {
        this.platforms = [];
        this.npcs = [];
        this.doors = [];
        this.chains = [];

        // Main floor
        this.platforms.push(new Platform(0, 700, 1200, 100));

        // Platforms for NPCs
        this.platforms.push(new Platform(100, 600, 200, 20));
        this.platforms.push(new Platform(400, 550, 200, 20));
        this.platforms.push(new Platform(700, 600, 200, 20));
        this.platforms.push(new Platform(1000, 550, 200, 20));

        // NPCs
        this.npcs.push(new NPC(200, 570, 'blacksmith', 'Blacksmith', this));
        this.npcs.push(new NPC(500, 520, 'archivist', 'Archivist', this));
        this.npcs.push(new NPC(800, 570, 'merchant', 'Merchant', this));
        this.npcs.push(new NPC(1100, 520, 'warden', "Warden's Spirit", this));

        // Door to Layer 1
        this.doors.push(new Door(600, 630, 1, this));
    }

    enterLayer(layer) {
        this.currentLayer = layer;
        this.maxLayerReached = Math.max(this.maxLayerReached, layer);
        this.state = 'playing';
        this.enemies = [];
        this.projectiles = [];
        this.npcs = [];
        this.doors = [];

        // Increase CPI from progress
        this.cpiFromProgress += 2;
        this.cpi = this.cpiFromDeaths + this.cpiFromProgress;
        this.savePersistentData();

        // Create layer layout
        this.createLayerLayout(layer);

        // Reset player position
        this.player.x = 100;
        this.player.y = 500;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
    }

    createLayerLayout(layer) {
        this.platforms = [];
        this.chains = [];
        this.enemies = [];
        this.doors = [];

        // Main floor
        this.platforms.push(new Platform(0, 700, 2400, 100));

        // Create platforms and obstacles based on layer
        const platformCount = 5 + layer * 2;
        for (let i = 0; i < platformCount; i++) {
            const x = 200 + Math.random() * 1800;
            const y = 300 + Math.random() * 300;
            const width = 100 + Math.random() * 200;
            this.platforms.push(new Platform(x, y, width, 20));
        }

        // Add chains for vertical traversal
        const chainCount = 2 + layer;
        for (let i = 0; i < chainCount; i++) {
            const x = 300 + Math.random() * 1600;
            const y = 200;
            const length = 200 + Math.random() * 200;
            this.chains.push(new Chain(x, y, length));
        }

        // Spawn enemies based on layer
        this.spawnLayerEnemies(layer);

        // Add exit door at end
        this.doors.push(new Door(2200, 630, layer + 1, this));

        // Add return to hub door
        this.doors.push(new Door(50, 630, 0, this));
    }

    spawnLayerEnemies(layer) {
        const enemyTypes = this.getEnemyTypesForLayer(layer);
        const enemyCount = 3 + layer * 2;

        for (let i = 0; i < enemyCount; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const x = 400 + Math.random() * 1600;
            const y = 500;
            this.enemies.push(new Enemy(x, y, type, this));
        }

        // Spawn Warden boss at layer end
        const wardenType = this.getWardenTypeForLayer(layer);
        this.enemies.push(new Enemy(2000, 500, wardenType, this));
    }

    getEnemyTypesForLayer(layer) {
        const enemyPools = {
            1: ['cryptShade', 'ironGuard'],
            2: ['cryptShade', 'ironGuard', 'arcaneFamiliar'],
            3: ['astralSentinel', 'mirrorWraith', 'ironChapelAcolyte'],
            4: ['astralSentinel', 'mirrorWraith', 'ironChapelAcolyte'],
            5: ['voidKnight', 'eidolonHerald']
        };
        return enemyPools[Math.min(layer, 5)] || enemyPools[1];
    }

    getWardenTypeForLayer(layer) {
        const wardens = {
            1: 'wardenOfHalls',
            2: 'wardenOfCrypts',
            3: 'wardenOfChapel',
            4: 'wardenOfSanctum',
            5: 'wardenOfCore'
        };
        return wardens[layer] || 'wardenOfHalls';
    }

    start() {
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === 'playing' || this.state === 'hub') {
            this.update(deltaTime);
        }

        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update player
        if (this.player) {
            this.player.update(deltaTime, this.keys);
        }

        // Update camera
        this.updateCamera();

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.update(deltaTime);
            return proj.alive && this.isNearCamera(proj.x, proj.y, 200);
        });

        // Collision detection
        this.checkCollisions();

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.alive);

        // Check player death
        if (this.player && this.player.health <= 0) {
            this.playerDeath();
        }

        // Check CPI milestones
        this.checkCPIMilestones();
    }

    updateCamera() {
        if (this.player) {
            // Side-scrolling camera - follow player horizontally, keep vertical centered
            const targetX = this.player.x - this.canvas.width / 2;
            const targetY = this.player.y - this.canvas.height / 2;

            this.cameraX += (targetX - this.cameraX) * this.cameraSmooth;
            this.cameraY += (targetY - this.cameraY) * this.cameraSmooth;
        }
    }

    checkCollisions() {
        if (!this.player) return;

        // Player vs platforms
        this.platforms.forEach(platform => {
            if (platform.checkCollision(this.player)) {
                // Player landed on platform
                if (this.player.velocityY > 0) {
                    this.player.onGround = true;
                }
            }
        });

        // Player vs chains
        this.chains.forEach(chain => {
            if (chain.checkCollision(this.player)) {
                this.player.onChain = true;
            }
        });

        // Player vs enemies
        this.enemies.forEach(enemy => {
            if (this.circleCollision(this.player.x, this.player.y, this.player.size,
                                     enemy.x, enemy.y, enemy.size)) {
                if (!this.player.isRolling && !this.player.iframes > 0) {
                    if (!this.player.isBlocking) {
                        this.player.takeDamage(enemy.contactDamage * (deltaTime / 1000));
                    } else {
                        // Blocked - reduced damage
                        this.player.takeDamage(enemy.contactDamage * 0.3 * (deltaTime / 1000));
                    }
                }
            }
        });

        // Player projectiles vs enemies
        this.projectiles.forEach(proj => {
            if (proj.friendly) {
                this.enemies.forEach(enemy => {
                    if (this.circleCollision(proj.x, proj.y, proj.radius,
                                             enemy.x, enemy.y, enemy.size)) {
                        enemy.takeDamage(proj.damage);
                        proj.alive = false;
                    }
                });
            }
        });

        // Enemy projectiles vs player
        this.projectiles.forEach(proj => {
            if (!proj.friendly) {
                if (this.circleCollision(proj.x, proj.y, proj.radius,
                                         this.player.x, this.player.y, this.player.size)) {
                    if (!this.player.isBlocking && this.player.iframes <= 0) {
                        this.player.takeDamage(proj.damage);
                        proj.alive = false;
                    } else if (this.player.isBlocking) {
                        // Blocked projectile
                        proj.alive = false;
                    }
                }
            }
        });

        // Player vs doors
        this.doors.forEach(door => {
            if (Math.abs(this.player.x - door.x) < 50 &&
                Math.abs(this.player.y - door.y) < 80) {
                door.playerNearby = true;
            } else {
                door.playerNearby = false;
            }
        });

        // Player vs NPCs
        this.npcs.forEach(npc => {
            if (Math.abs(this.player.x - npc.x) < 40 &&
                Math.abs(this.player.y - npc.y) < 60) {
                npc.playerNearby = true;
            } else {
                npc.playerNearby = false;
            }
        });
    }

    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < r1 + r2;
    }

    isNearCamera(x, y, margin = 0) {
        return x >= this.cameraX - margin &&
               x <= this.cameraX + this.canvas.width + margin &&
               y >= this.cameraY - margin &&
               y <= this.cameraY + this.canvas.height + margin;
    }

    playerDeath() {
        this.totalDeaths++;
        this.cpiFromDeaths += 3;
        this.cpi = this.cpiFromDeaths + this.cpiFromProgress;
        this.savePersistentData();

        // Return to hub
        this.enterHub();
    }

    checkCPIMilestones() {
        const milestones = [10, 25, 40, 60, 80, 100, 120];

        milestones.forEach(milestone => {
            if (this.cpi >= milestone && !this.reachedMilestones.includes(milestone)) {
                this.reachedMilestones.push(milestone);
                this.grantMilestoneReward(milestone);
            }
        });
    }

    grantMilestoneReward(milestone) {
        // Grant rewards based on milestone
        const rewards = {
            10: { type: 'weaponUpgrade', value: 1 },
            25: { type: 'sigilSlot', value: 1 },
            40: { type: 'skill', value: 1 },
            60: { type: 'weapon', value: 'unique' },
            80: { type: 'technique', value: 'doubleJump' },
            100: { type: 'eidolonCore', value: 1 },
            120: { type: 'cosmetic', value: 'prestigeAura' }
        };

        const reward = rewards[milestone];
        if (reward) {
            this.applyReward(reward);
        }
    }

    applyReward(reward) {
        switch(reward.type) {
            case 'weaponUpgrade':
                this.player.weaponUpgradeTokens += reward.value;
                break;
            case 'sigilSlot':
                this.player.maxSigils += reward.value;
                break;
            case 'eidolonCore':
                this.eidolonCores += reward.value;
                break;
        }
    }

    loadPersistentData() {
        try {
            const data = localStorage.getItem('castleEidolonSave');
            if (data) {
                const save = JSON.parse(data);
                this.cpi = save.cpi || 0;
                this.cpiFromDeaths = save.cpiFromDeaths || 0;
                this.cpiFromProgress = save.cpiFromProgress || 0;
                this.totalDeaths = save.totalDeaths || 0;
                this.maxLayerReached = save.maxLayerReached || 0;
                this.eidolonCores = save.eidolonCores || 0;
                this.reachedMilestones = save.reachedMilestones || [];
            } else {
                this.reachedMilestones = [];
            }
        } catch (e) {
            this.reachedMilestones = [];
        }
    }

    savePersistentData() {
        const save = {
            cpi: this.cpi,
            cpiFromDeaths: this.cpiFromDeaths,
            cpiFromProgress: this.cpiFromProgress,
            totalDeaths: this.totalDeaths,
            maxLayerReached: this.maxLayerReached,
            eidolonCores: this.eidolonCores,
            reachedMilestones: this.reachedMilestones
        };
        localStorage.setItem('castleEidolonSave', JSON.stringify(save));
    }

    toScreenX(worldX) {
        return worldX - this.cameraX;
    }

    toScreenY(worldY) {
        return worldY - this.cameraY;
    }

    render() {
        // Get environment colors
        const env = this.layerEnvironments[this.currentLayer] || this.layerEnvironments[0];

        // Clear with environment background
        this.ctx.fillStyle = env.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'menu') return;

        this.ctx.save();

        // Draw platforms
        this.platforms.forEach(platform => platform.render(this.ctx, this, env.floorColor));

        // Draw chains
        this.chains.forEach(chain => chain.render(this.ctx, this));

        // Draw doors
        this.doors.forEach(door => door.render(this.ctx, this));

        // Draw NPCs
        this.npcs.forEach(npc => npc.render(this.ctx, this));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx, this));

        // Draw projectiles
        this.projectiles.forEach(proj => proj.render(this.ctx, this));

        // Draw player
        if (this.player) {
            this.player.render(this.ctx, this);
        }

        this.ctx.restore();

        // Draw HUD
        this.drawHUD();
    }

    drawHUD() {
        const padding = 20;

        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#fff';

        // Layer name
        const env = this.layerEnvironments[this.currentLayer] || this.layerEnvironments[0];
        this.ctx.fillText(env.name, padding, padding + 20);

        // CPI Display with threat level
        const cpiColor = this.getCPIColor();
        this.ctx.fillStyle = cpiColor;
        this.ctx.fillText(`Castle Pressure: ${this.cpi}`, padding, padding + 50);

        // CPI Bar
        const barWidth = 200;
        const barHeight = 20;
        const cpiPercent = Math.min(1, this.cpi / 120);

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(padding, padding + 60, barWidth, barHeight);
        this.ctx.fillStyle = cpiColor;
        this.ctx.fillRect(padding, padding + 60, barWidth * cpiPercent, barHeight);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(padding, padding + 60, barWidth, barHeight);

        // Player health bar
        if (this.player) {
            const healthPercent = this.player.health / this.player.maxHealth;

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Health', padding, padding + 110);

            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(padding, padding + 120, barWidth, barHeight);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(padding, padding + 120, barWidth * healthPercent, barHeight);
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(padding, padding + 120, barWidth, barHeight);

            // Weapon info
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Weapon: ${this.player.weapon.name}`, padding, padding + 160);
            this.ctx.fillText(`Damage: ${Math.floor(this.player.weapon.damage)}`, padding, padding + 180);
        }

        // Instructions
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '14px Arial';
        const instructions = [
            'A/D: Move',
            'SPACE/W: Jump',
            'SHIFT: Roll',
            'F: Block',
            'E: Interact',
            'Mouse: Attack'
        ];

        let yOffset = this.canvas.height - 140;
        instructions.forEach(instr => {
            this.ctx.fillText(instr, padding, yOffset);
            yOffset += 20;
        });
    }

    getCPIColor() {
        if (this.cpi < 20) return '#00ff00';
        if (this.cpi < 40) return '#88ff00';
        if (this.cpi < 60) return '#ffff00';
        if (this.cpi < 80) return '#ffaa00';
        if (this.cpi < 100) return '#ff6600';
        return '#ff0000';
    }
}

// Player Class
class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.size = 15;
        this.color = '#00ffff';

        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.stamina = 100;
        this.maxStamina = 100;

        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 200;
        this.jumpPower = 400;
        this.gravity = 1200;
        this.friction = 0.85;
        this.onGround = false;
        this.onChain = false;

        // Combat
        this.weapon = new Weapon('balanced', this);
        this.sigils = [];
        this.maxSigils = 2;
        this.weaponUpgradeTokens = 0;

        // Actions
        this.isRolling = false;
        this.rollTimer = 0;
        this.rollCooldown = 1000;
        this.rollDuration = 300;
        this.rollSpeed = 400;

        this.isBlocking = false;
        this.blockStaminaCost = 20; // per second

        this.isClimbing = false;
        this.climbSpeed = 150;

        this.iframes = 0; // Invincibility frames
        this.iframeDuration = 500;

        // Mouse for attacking
        this.canvas = game.canvas;
        this.setupMouseInput();
    }

    setupMouseInput() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.game.state === 'playing' || this.game.state === 'hub') {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left + this.game.cameraX;
                const mouseY = e.clientY - rect.top + this.game.cameraY;
                this.attack(mouseX, mouseY);
            }
        });
    }

    update(deltaTime, keys) {
        const dt = deltaTime / 1000;

        // Reset states
        this.onGround = false;
        this.onChain = false;

        // Handle rolling
        if (this.isRolling) {
            this.rollTimer -= deltaTime;
            if (this.rollTimer <= 0) {
                this.isRolling = false;
            }
            // Rolling gives iframes
            this.iframes = this.rollDuration;
        }

        // Decrease iframes
        if (this.iframes > 0) {
            this.iframes -= deltaTime;
        }

        // Stamina regen
        if (!this.isBlocking && this.stamina < this.maxStamina) {
            this.stamina += 30 * dt;
        }

        // Blocking stamina cost
        if (this.isBlocking && this.stamina > 0) {
            this.stamina -= this.blockStaminaCost * dt;
            if (this.stamina <= 0) {
                this.isBlocking = false;
            }
        }

        // Movement
        let moveSpeed = this.speed;
        if (this.isBlocking) moveSpeed *= 0.5;
        if (this.isRolling) moveSpeed = this.rollSpeed;

        if (keys['a']) {
            this.velocityX = -moveSpeed;
        } else if (keys['d']) {
            this.velocityX = moveSpeed;
        } else {
            this.velocityX *= this.friction;
        }

        // Apply gravity if not on ground or chain
        if (!this.onGround && !this.onChain) {
            this.velocityY += this.gravity * dt;
        } else {
            if (this.velocityY > 0) this.velocityY = 0;
        }

        // Chain climbing
        if (this.onChain) {
            this.velocityY = 0;
            if (keys['w']) {
                this.velocityY = -this.climbSpeed;
            } else if (keys['s']) {
                this.velocityY = this.climbSpeed;
            }
        }

        // Apply velocities
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        // Weapon cooldown
        this.weapon.update(deltaTime);
    }

    jump() {
        if (this.onGround && !this.isRolling && !this.isBlocking) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
        }
    }

    roll() {
        if (this.rollCooldown <= 0 && !this.isRolling && this.stamina >= 20) {
            this.isRolling = true;
            this.rollTimer = this.rollDuration;
            this.rollCooldown = 1000;
            this.stamina -= 20;
        }
    }

    block() {
        if (this.stamina > 0) {
            this.isBlocking = true;
        }
    }

    attack(targetX, targetY) {
        if (this.isBlocking || this.isRolling) return;

        this.weapon.fire(targetX, targetY);
    }

    interact() {
        // Check for nearby NPCs
        this.game.npcs.forEach(npc => {
            if (npc.playerNearby) {
                npc.interact(this);
            }
        });

        // Check for nearby doors
        this.game.doors.forEach(door => {
            if (door.playerNearby) {
                door.use();
            }
        });
    }

    takeDamage(amount) {
        if (this.iframes > 0) return;

        this.health -= amount;
        this.health = Math.max(0, this.health);

        // Brief iframes after taking damage
        this.iframes = 200;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Flash if iframes active
        if (this.iframes > 0 && Math.floor(this.iframes / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw player
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw blocking indicator
        if (this.isBlocking) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw rolling indicator
        if (this.isRolling) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }
}

// Weapon Class
class Weapon {
    constructor(type, owner) {
        this.owner = owner;
        this.type = type;
        this.level = 1;
        this.ascension = 0;

        // Set stats based on type
        this.setStatsForType(type);

        this.cooldownTimer = 0;
    }

    setStatsForType(type) {
        const types = {
            light: {
                name: 'Swift Dagger',
                damage: 8,
                cooldown: 300,
                range: 150,
                speed: 700,
                description: 'Fast, precise strikes'
            },
            balanced: {
                name: 'Knight Sword',
                damage: 15,
                cooldown: 500,
                range: 200,
                speed: 600,
                description: 'Versatile and reliable'
            },
            heavy: {
                name: 'War Hammer',
                damage: 30,
                cooldown: 1000,
                range: 180,
                speed: 400,
                description: 'Slow, powerful strikes'
            },
            ranged: {
                name: 'Mystic Bow',
                damage: 12,
                cooldown: 400,
                range: 500,
                speed: 800,
                description: 'Attack from distance'
            },
            hybrid: {
                name: 'Enchanted Blade',
                damage: 18,
                cooldown: 600,
                range: 250,
                speed: 650,
                description: 'Mix of melee and magic'
            }
        };

        const stats = types[type] || types.balanced;
        this.name = stats.name;
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.range = stats.range;
        this.speed = stats.speed;
        this.description = stats.description;
    }

    update(deltaTime) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= deltaTime;
        }
    }

    fire(targetX, targetY) {
        if (this.cooldownTimer > 0) return;

        const dx = targetX - this.owner.x;
        const dy = targetY - this.owner.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check range
        if (dist > this.range) return;

        const angle = Math.atan2(dy, dx);

        // Create projectile
        const proj = new Projectile(
            this.owner.x,
            this.owner.y,
            angle,
            this.damage,
            true,
            this.owner.game,
            this.speed
        );

        this.owner.game.projectiles.push(proj);
        this.cooldownTimer = this.cooldown;
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

        // Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 1200;
        this.onGround = false;

        // Set stats based on type and CPI
        this.setStatsForType(type);
        this.applyCPIScaling();

        this.health = this.maxHealth;
        this.fireTimer = 0;
    }

    setStatsForType(type) {
        const types = {
            // Layer 1
            cryptShade: {
                size: 12,
                color: '#9999ff',
                maxHealth: 30,
                speed: 120,
                contactDamage: 5,
                xpValue: 20,
                behavior: 'teleport'
            },
            ironGuard: {
                size: 18,
                color: '#888888',
                maxHealth: 60,
                speed: 60,
                contactDamage: 10,
                xpValue: 30,
                behavior: 'tank'
            },
            arcaneFamiliar: {
                size: 10,
                color: '#ff88ff',
                maxHealth: 20,
                speed: 100,
                contactDamage: 3,
                damage: 8,
                fireRate: 2,
                range: 300,
                xpValue: 25,
                behavior: 'ranged'
            },
            // Layer 2-3
            astralSentinel: {
                size: 16,
                color: '#4444ff',
                maxHealth: 80,
                speed: 80,
                contactDamage: 12,
                damage: 10,
                fireRate: 1.5,
                range: 250,
                xpValue: 40,
                behavior: 'teleport_ranged'
            },
            mirrorWraith: {
                size: 14,
                color: '#ccccff',
                maxHealth: 50,
                speed: 140,
                contactDamage: 8,
                xpValue: 35,
                behavior: 'phase'
            },
            ironChapelAcolyte: {
                size: 15,
                color: '#666666',
                maxHealth: 70,
                speed: 90,
                contactDamage: 15,
                xpValue: 45,
                behavior: 'curse'
            },
            // Wardens
            wardenOfHalls: {
                size: 40,
                color: '#ff0000',
                maxHealth: 300,
                speed: 50,
                contactDamage: 20,
                damage: 15,
                fireRate: 1,
                range: 400,
                xpValue: 200,
                behavior: 'boss'
            },
            wardenOfCrypts: {
                size: 45,
                color: '#00ff00',
                maxHealth: 500,
                speed: 60,
                contactDamage: 25,
                damage: 18,
                fireRate: 1.5,
                range: 450,
                xpValue: 300,
                behavior: 'boss'
            },
            wardenOfChapel: {
                size: 50,
                color: '#0000ff',
                maxHealth: 800,
                speed: 70,
                contactDamage: 30,
                damage: 22,
                fireRate: 2,
                range: 500,
                xpValue: 400,
                behavior: 'boss'
            }
        };

        const stats = types[type] || types.cryptShade;
        Object.assign(this, stats);
    }

    applyCPIScaling() {
        const cpiMultiplier = 1 + (this.game.cpi * 0.02);

        this.maxHealth *= cpiMultiplier;
        this.contactDamage *= cpiMultiplier;
        if (this.damage) this.damage *= cpiMultiplier;

        // High CPI mutations
        if (this.game.cpi > 50) {
            this.speed *= 1.2;
        }
        if (this.game.cpi > 80) {
            this.maxHealth *= 1.5;
        }
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;

        if (!this.game.player) return;

        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Basic AI - move toward player
        if (this.behavior === 'tank' || this.behavior === 'boss' || this.behavior === 'curse') {
            if (dist > 50) {
                this.velocityX = (dx / dist) * this.speed;
            } else {
                this.velocityX = 0;
            }
        } else if (this.behavior === 'ranged' || this.behavior === 'teleport_ranged') {
            // Keep distance
            if (dist < 200) {
                this.velocityX = -(dx / dist) * this.speed;
            } else if (dist > 300) {
                this.velocityX = (dx / dist) * this.speed;
            } else {
                this.velocityX = 0;
            }
        } else {
            // Default chase behavior
            this.velocityX = (dx / dist) * this.speed;
        }

        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity * dt;
        } else {
            if (this.velocityY > 0) this.velocityY = 0;
        }

        // Apply movement
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;

        // Check platform collisions
        this.onGround = false;
        this.game.platforms.forEach(platform => {
            if (platform.checkCollision(this)) {
                this.onGround = true;
            }
        });

        // Fire projectiles
        if (this.fireRate && dist < this.range) {
            this.fireTimer += deltaTime;
            const fireInterval = 1000 / this.fireRate;

            if (this.fireTimer >= fireInterval) {
                const angle = Math.atan2(dy, dx);
                this.game.projectiles.push(
                    new Projectile(this.x, this.y, angle, this.damage, false, this.game, 500)
                );
                this.fireTimer = 0;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        // Could drop loot here
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Draw enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barWidth = this.size * 2;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 10, barWidth, barHeight);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 10, barWidth * healthPercent, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(screenX - barWidth / 2, screenY - this.size - 10, barWidth, barHeight);
    }
}

// Projectile Class
class Projectile {
    constructor(x, y, angle, damage, friendly, game, speed = 500) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.friendly = friendly;
        this.game = game;
        this.speed = speed;
        this.radius = 5;
        this.alive = true;
        this.color = friendly ? '#00ffff' : '#ff0000';
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Platform Class
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    checkCollision(entity) {
        // Simple AABB collision
        if (entity.x + entity.size > this.x &&
            entity.x - entity.size < this.x + this.width &&
            entity.y + entity.size > this.y &&
            entity.y - entity.size < this.y + this.height) {

            // Check if falling onto platform from above
            if (entity.velocityY > 0 && entity.y < this.y + this.height / 2) {
                entity.y = this.y - entity.size;
                entity.velocityY = 0;
                return true;
            }
        }
        return false;
    }

    render(ctx, game, color = '#4a4a4a') {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Edge highlight
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, this.width, this.height);
    }
}

// Chain Class (for climbing)
class Chain {
    constructor(x, y, length) {
        this.x = x;
        this.y = y;
        this.length = length;
    }

    checkCollision(player) {
        if (Math.abs(player.x - this.x) < 20 &&
            player.y > this.y &&
            player.y < this.y + this.length) {
            player.x = this.x; // Snap to chain
            return true;
        }
        return false;
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX, screenY + this.length);
        ctx.stroke();

        // Chain links
        for (let i = 0; i < this.length; i += 20) {
            ctx.fillStyle = '#666';
            ctx.fillRect(screenX - 5, screenY + i, 10, 8);
        }
    }
}

// Door Class
class Door {
    constructor(x, y, targetLayer, game) {
        this.x = x;
        this.y = y;
        this.targetLayer = targetLayer;
        this.game = game;
        this.playerNearby = false;
        this.width = 60;
        this.height = 80;
    }

    use() {
        if (this.targetLayer === 0) {
            this.game.enterHub();
        } else {
            this.game.enterLayer(this.targetLayer);
        }
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // Door frame
        ctx.fillStyle = this.playerNearby ? '#ffff00' : '#333';
        ctx.fillRect(screenX - this.width / 2, screenY - this.height, this.width, this.height);

        ctx.strokeStyle = this.playerNearby ? '#ffff00' : '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX - this.width / 2, screenY - this.height, this.width, this.height);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const label = this.targetLayer === 0 ? 'Hub' : `Layer ${this.targetLayer}`;
        ctx.fillText(label, screenX, screenY - this.height / 2);

        if (this.playerNearby) {
            ctx.fillText('Press E', screenX, screenY - 10);
        }

        ctx.textAlign = 'left';
    }
}

// NPC Class
class NPC {
    constructor(x, y, type, name, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.name = name;
        this.game = game;
        this.playerNearby = false;
        this.size = 20;
    }

    interact(player) {
        // Open NPC-specific interface
        switch(this.type) {
            case 'blacksmith':
                this.openBlacksmithMenu(player);
                break;
            case 'archivist':
                this.openArchivistMenu(player);
                break;
            case 'merchant':
                this.openMerchantMenu(player);
                break;
            case 'warden':
                this.openWardenMenu(player);
                break;
        }
    }

    openBlacksmithMenu(player) {
        alert(`Blacksmith: Upgrade your weapons here!\nYou have ${player.weaponUpgradeTokens} tokens.`);
        // Would open proper UI in full implementation
    }

    openArchivistMenu(player) {
        alert('Archivist: Study the Grimoire to learn enemy weaknesses.');
    }

    openMerchantMenu(player) {
        alert('Merchant: Buy and sell items.');
    }

    openWardenMenu(player) {
        alert("Warden's Spirit: Seek guidance and rare aid.");
    }

    render(ctx, game) {
        const screenX = game.toScreenX(this.x);
        const screenY = game.toScreenY(this.y);

        // NPC colors
        const colors = {
            blacksmith: '#ff6600',
            archivist: '#6666ff',
            merchant: '#ffff00',
            warden: '#ff00ff'
        };

        ctx.fillStyle = colors[this.type] || '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Name label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenX, screenY - this.size - 5);

        if (this.playerNearby) {
            ctx.fillText('Press E', screenX, screenY + this.size + 15);
        }

        ctx.textAlign = 'left';
    }
}

// Initialize game
let game;
window.onload = () => {
    game = new Game();

    // Override multiplayer buttons to just start the game
    document.querySelector('button[onclick="game.startSinglePlayer()"]').onclick = () => {
        game.startGame();
    };
    document.querySelector('button[onclick="game.startLocalMultiplayer()"]').onclick = () => {
        game.startGame();
    };
};
