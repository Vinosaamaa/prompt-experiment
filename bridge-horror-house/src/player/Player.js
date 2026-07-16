import * as THREE from 'three';
import { makeFlashlightCookie } from '../world/Textures.js';

export class Player {
  constructor(camera, domElement, house) {
    this.camera = camera;
    this.dom = domElement;
    this.house = house;

    this.radius = 0.32;
    this.height = 1.62;
    this.walkSpeed = 3.0;
    this.sprintSpeed = 5.6;
    this.sensitivity = 0.0022;

    this.euler = new THREE.Euler(0, 0, 0, 'YXZ'); // face into the house (north, -z)
    this.velocity = new THREE.Vector3();
    this.pos = house.startPosition.clone();
    this.camera.position.copy(this.pos);
    this.camera.quaternion.setFromEuler(this.euler);

    this.keys = {};
    this.locked = false;
    this.enabled = false;
    this.canMove = true;

    this.bob = 0;
    this.swayX = 0; this.swayY = 0;
    this.targetSwayX = 0; this.targetSwayY = 0;

    // ---- flashlight -----------------------------------------------------
    this.battery = 1.0;
    this.baseDrain = 1 / 150;   // full charge lasts ~150s of use
    this.on = true;
    this.flickerT = 0;

    const spot = new THREE.SpotLight(0xfff0d6, 6.5, 22, Math.PI / 7, 0.55, 1.4);
    spot.position.set(0.15, -0.12, 0.1);
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.camera.near = 0.2;
    spot.shadow.camera.far = 24;
    spot.shadow.bias = -0.0006;
    spot.shadow.normalBias = 0.02;
    spot.shadow.focus = 1;
    spot.map = makeFlashlightCookie();
    this.spot = spot;
    this.spotBaseIntensity = 6.5;

    this.spotTarget = new THREE.Object3D();
    this.spotTarget.position.set(0, 0, -1);
    spot.target = this.spotTarget;

    camera.add(spot);
    camera.add(this.spotTarget);

    // a soft short "eye" light so the immediate foreground is not pure black
    this.fill = new THREE.PointLight(0xbfd0ff, 0.12, 2.4, 2);
    camera.add(this.fill);

    this._onKeyDown = (e) => this._key(e, true);
    this._onKeyUp = (e) => this._key(e, false);
    this._onMouseMove = (e) => this._mouse(e);
    this._onLockChange = () => { this.locked = document.pointerLockElement === this.dom; };
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onLockChange);
  }

  disable() {
    this.enabled = false;
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onLockChange);
    this.keys = {};
  }

  requestLock() { this.dom.requestPointerLock?.(); }

  _key(e, down) {
    const c = e.code;
    this.keys[c] = down;
    if (down && c === 'KeyF') this.toggleLight();
  }

  toggleLight() {
    if (this.battery <= 0) return;
    this.on = !this.on;
  }

  _mouse(e) {
    if (!this.locked || !this.canMove) return;
    this.euler.y -= e.movementX * this.sensitivity;
    this.euler.x -= e.movementY * this.sensitivity;
    const lim = Math.PI / 2 - 0.05;
    this.euler.x = Math.max(-lim, Math.min(lim, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
    // flashlight lag/sway responds to look velocity
    this.targetSwayX = THREE.MathUtils.clamp(-e.movementX * 0.02, -0.35, 0.35);
    this.targetSwayY = THREE.MathUtils.clamp(e.movementY * 0.02, -0.25, 0.25);
  }

  addBattery(amount = 0.45) {
    this.battery = Math.min(1, this.battery + amount);
    if (!this.on && this.battery > 0) this.on = true;
  }

  // extra drain requested by the burn mechanic
  burnDrain(dt) { this.battery = Math.max(0, this.battery - dt * (1 / 22)); }

  getBeam() {
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    return { on: this.on && this.battery > 0 && this.litNow, origin, dir };
  }

  update(dt) {
    // ---- movement ----
    let speed = 0;
    if (this.canMove) {
      const forward = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);
      const strafe = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
      const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
      const max = sprint ? this.sprintSpeed : this.walkSpeed;

      const sinY = Math.sin(this.euler.y), cosY = Math.cos(this.euler.y);
      // forward is -z in local space
      let vx = (-sinY * forward + cosY * strafe);
      let vz = (-cosY * forward - sinY * strafe);
      const len = Math.hypot(vx, vz);
      if (len > 0) { vx = vx / len * max; vz = vz / len * max; speed = max; }

      let nx = this.pos.x + vx * dt;
      let nz = this.pos.z + vz * dt;
      const res = this.house.resolveCircle(nx, nz, this.radius);
      this.pos.x = res.x; this.pos.z = res.z;
    }

    // ---- head bob ----
    this.bob += dt * speed * 1.9;
    const bobAmt = speed > 0 ? 0.045 : 0;
    const bobY = Math.sin(this.bob) * bobAmt;
    const bobX = Math.cos(this.bob * 0.5) * bobAmt * 0.6;
    this.camera.position.set(this.pos.x + Math.cos(this.euler.y) * bobX, this.height + bobY, this.pos.z - Math.sin(this.euler.y) * bobX);

    // ---- flashlight sway + flicker ----
    this.swayX += (this.targetSwayX - this.swayX) * Math.min(1, dt * 6);
    this.swayY += (this.targetSwayY - this.swayY) * Math.min(1, dt * 6);
    this.targetSwayX *= 0.9; this.targetSwayY *= 0.9;
    // idle drift
    const idle = Math.sin(performance.now() * 0.0011) * 0.03;
    this.spotTarget.position.set(this.swayX + idle, this.swayY + Math.cos(performance.now() * 0.0009) * 0.02, -1);

    // battery drain while on
    if (this.on && this.battery > 0) {
      this.battery = Math.max(0, this.battery - dt * this.baseDrain);
    }
    if (this.battery <= 0) this.on = false;

    // sputter below 20%
    this.flickerT += dt;
    let intensity = this.on ? this.spotBaseIntensity : 0;
    let fillOn = this.on ? 0.12 : 0.0;
    if (this.on && this.battery < 0.2) {
      const sput = (Math.sin(this.flickerT * 30) * 0.5 + 0.5);
      const chance = Math.random() < 0.06 ? 0.15 : 1;
      intensity *= (0.35 + 0.65 * sput) * chance;
    }
    this.spot.intensity = intensity;
    this.fill.intensity = fillOn;
    this.litNow = intensity > 1.5;

    return { speed };
  }

  reset() {
    this.pos.copy(this.house.startPosition);
    this.euler.set(0, 0, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
    this.battery = 1.0;
    this.on = true;
    this.velocity.set(0, 0, 0);
    this.canMove = true;
  }
}
