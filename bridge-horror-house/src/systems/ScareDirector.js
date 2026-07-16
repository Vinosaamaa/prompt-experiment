import * as THREE from 'three';

// Coordinates scripted one-shot scares, ambient randomness and the storm.
export class ScareDirector {
  constructor({ house, ghost, audio, hud, onChaseStart }) {
    this.house = house;
    this.ghost = ghost;
    this.audio = audio;
    this.hud = hud;
    this.onChaseStart = onChaseStart;
    this.reset();
  }

  reset() {
    this.fired = {};
    this.prevRoom = null;
    this.lightningT = 4 + Math.random() * 6;
    this.hardFlicker = 0;
    this.chairSlide = null;
    this.chase = false;
    this.timeouts = [];
  }

  _later(fn, ms) { const id = setTimeout(fn, ms); this.timeouts.push(id); return id; }
  clearTimers() { this.timeouts.forEach(clearTimeout); this.timeouts = []; }

  // ---- storm ----
  _lightning() {
    this.hud.lightning();
    for (const l of this.house.moonLights) {
      const base = 0.7;
      l.intensity = 5.0;
      this._later(() => { l.intensity = 5.5; }, 90);
      this._later(() => { l.intensity = base; }, 200);
    }
    const delay = 300 + Math.random() * 1800; // sound travels
    this._later(() => this.audio.playThunder(), delay);
  }

  // ---- entry-based scares ----
  _onEnterRoom(room, playerPos) {
    if (room === 'living' && !this.fired.living) {
      this.fired.living = true;
      this.audio.playKnock();
      this._later(() => this.audio.playWhisper(), 700);
      this.hud.toast('...a thump from somewhere deep in the house.');
    }
    if (room === 'hallway' && !this.fired.hallway) {
      this.fired.hallway = true;
      this.hardFlicker = 1.6;
      this.audio.playBang();
      this._later(() => { this.house.bedroomDoor.slam(); this.audio.playDoorCreak(); }, 250);
      this.hud.shake(0.6);
    }
    if (room === 'kitchen' && !this.fired.kitchen) {
      this.fired.kitchen = true;
      this.audio.playBang();
      this.audio.playStinger();
      this.hud.shake(0.5);
      // a chair slides on its own
      this.chairSlide = { t: 0, from: this.house.kitchenChair.position.z, to: this.house.kitchenChair.position.z + 0.9 };
      this._later(() => this.audio.playCreak(), 120);
    }
    if (room === 'bedroom' && !this.fired.bedroom) {
      this.fired.bedroom = true;
      this._later(() => { this.house.bedroomDoor.slam(); this.audio.playBang(); this.hud.shake(0.7); }, 350);
      this.hud.toast('The door slams shut behind you.');
    }
  }

  // ---- key-based escalation ----
  keyTaken(room, keysFound, playerPos) {
    if (keysFound >= 3) {
      this._finalSequence(playerPos);
    } else if (keysFound === 2) {
      this.audio.playGrowl();
      this.hud.toast('Something has started moving.');
      this.ghost.startStalking();
      this.audio.setBreathing(0.4);
    } else if (keysFound === 1) {
      if (room === 'study') {
        // entity appears in the doorway behind you, then gone
        this._later(() => {
          this.ghost.appearAt(-6.75, -2.9, 'neutral', 1.3);
          this.audio.playStinger();
          this.hud.shake(0.4);
        }, 250);
      } else {
        this._later(() => this.audio.playWhisper(), 300);
      }
    }
  }

  _finalSequence(playerPos) {
    this.chase = true;
    this.hud.toast('THE LAST LOCK. RUN.');
    this.hud.blackout(1.1);
    this._later(() => this.audio.playScream(), 750);
    this._later(() => {
      this.ghost.startChase(playerPos.clone());
      this.audio.startChase();
      this.audio.setBreathing(1.0);
      this.audio.setHeartRate(2.2);
      if (this.onChaseStart) this.onChaseStart();
    }, 1150);
  }

  update(dt, room, playerPos, keysFound) {
    // storm
    this.lightningT -= dt;
    if (this.lightningT <= 0) {
      this._lightning();
      this.lightningT = (this.chase ? 3 : 8) + Math.random() * (this.chase ? 4 : 12);
    }

    // room entry
    if (room && room !== this.prevRoom) {
      this._onEnterRoom(room, playerPos);
      this.prevRoom = room;
    }

    // hard flicker window
    if (this.hardFlicker > 0) {
      this.hardFlicker -= dt;
      const b = this.house.bulbs;
      const v = Math.random() < 0.5 ? 0.02 : 0.5;
      b.foyerBulb.intensity = v; b.hallBulb.intensity = Math.random() * 0.5; b.hallBulb2.intensity = Math.random() * 0.5;
    }

    // chair slide animation
    if (this.chairSlide) {
      this.chairSlide.t += dt;
      const k = Math.min(1, this.chairSlide.t / 0.7);
      const e = 1 - Math.pow(1 - k, 3);
      this.house.kitchenChair.position.z = THREE.MathUtils.lerp(this.chairSlide.from, this.chairSlide.to, e);
      if (k >= 1) this.chairSlide = null;
    }

    // heartbeat/breathing ramps with proximity during stalking & chase
    if (this.ghost.state === 'chase') {
      const d = Math.hypot(playerPos.x - this.ghost.pos.x, playerPos.z - this.ghost.pos.z);
      const danger = THREE.MathUtils.clamp(1 - d / 10, 0, 1);
      this.audio.setHeartRate(1.4 + danger * 2.4);
      this.audio.setBreathing(0.5 + danger * 0.7);
    } else if (this.ghost.state === 'stalking' && this.ghost.manifest) {
      const d = Math.hypot(playerPos.x - this.ghost.pos.x, playerPos.z - this.ghost.pos.z);
      this.audio.setHeartRate(0.9 + THREE.MathUtils.clamp(1 - d / 8, 0, 1) * 1.0);
    }
  }
}
