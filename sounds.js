// Sound Effect System using Web Audio API
class SoundSystem {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3; // 30% volume
    }

    // Weapon firing sounds
    playShoot(weaponType) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        switch(weaponType) {
            case 'light':
                osc.frequency.value = 800;
                gain.gain.setValueAtTime(0.1 * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                osc.type = 'square';
                break;
            case 'medium':
                osc.frequency.value = 400;
                gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                osc.type = 'sawtooth';
                break;
            case 'heavy':
                osc.frequency.value = 200;
                gain.gain.setValueAtTime(0.25 * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                osc.type = 'triangle';
                break;
        }

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    // XP orb pickup sound - satisfying hum
    playOrbPickup(type) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        if (type === 'heal') {
            // Healing sound - brighter
            osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, this.audioContext.currentTime);
        } else {
            // XP sound - warm hum
            osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
        }

        osc.type = 'sine';
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    // Enemy death sound - short quiet "ahhh"
    playEnemyDeath() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Falling frequency for "ahhh" effect
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);

        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.08 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    // Weapon switch sound
    playWeaponSwitch() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

        osc.type = 'square';
        gain.gain.setValueAtTime(0.12 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // Level up sound
    playLevelUp() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.3);

        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.4);
    }

    // Damage taken sound
    playHit() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 150;
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.08);
    }
}
