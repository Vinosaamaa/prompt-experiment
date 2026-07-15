export class HUD {
  constructor() {
    this.hud = document.getElementById('hud');
    this.objective = document.getElementById('objective');
    this.torchfill = document.getElementById('torchfill');
    this.burnwrap = document.getElementById('burnwrap');
    this.burnfill = document.getElementById('burnfill');
    this.toastEl = document.getElementById('toast');
    this.promptEl = document.getElementById('prompt');
    this.flashEl = document.getElementById('flash');
    this.damageEl = document.getElementById('damage');
    this.jumpface = document.getElementById('jumpface');

    this.death = document.getElementById('death');
    this.win = document.getElementById('win');
    this.note = document.getElementById('note');
    this.noteTitle = document.getElementById('noteTitle');
    this.noteBody = document.getElementById('noteBody');
    this.winTime = document.getElementById('winTime');
    this.winBanish = document.getElementById('winBanish');

    // black overlay for blackout beats
    this.black = document.createElement('div');
    Object.assign(this.black.style, {
      position: 'fixed', inset: '0', background: '#000', opacity: '0',
      pointerEvents: 'none', zIndex: '33', transition: 'opacity 300ms ease',
    });
    document.body.appendChild(this.black);

    this.trauma = 0;
    this._toastTimer = null;
  }

  showHUD(on) { this.hud.style.display = on ? 'block' : 'none'; }

  setObjective(text, keys) {
    this.objective.innerHTML = `${text} <span class="keys">Keys ${keys} / 3</span>`;
  }

  setBattery(frac) {
    const pct = Math.max(0, Math.min(1, frac)) * 100;
    this.torchfill.style.width = pct + '%';
    this.torchfill.classList.toggle('low', frac < 0.2);
  }

  showBurn(frac) {
    if (frac == null) { this.burnwrap.style.display = 'none'; return; }
    this.burnwrap.style.display = 'block';
    this.burnfill.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
  }

  prompt(text) {
    if (!text) { this.promptEl.style.opacity = '0'; return; }
    this.promptEl.innerHTML = text;
    this.promptEl.style.opacity = '1';
  }

  toast(msg, ms = 3200) {
    this.toastEl.textContent = msg;
    this.toastEl.style.opacity = '1';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { this.toastEl.style.opacity = '0'; }, ms);
  }

  flash(color = '#fff', strength = 0.8, fade = 220) {
    this.flashEl.style.transition = 'opacity 60ms ease-out';
    this.flashEl.style.background = color;
    this.flashEl.style.opacity = String(strength);
    setTimeout(() => {
      this.flashEl.style.transition = `opacity ${fade}ms ease-out`;
      this.flashEl.style.opacity = '0';
    }, 40);
  }

  lightning() {
    this.flash('#cdd6ff', 0.55, 260);
    setTimeout(() => this.flash('#eef2ff', 0.35, 200), 110);
  }

  damage(strength = 1) {
    this.damageEl.style.boxShadow = `inset 0 0 220px 70px rgba(140,0,0,${0.55 * strength})`;
    setTimeout(() => { this.damageEl.style.boxShadow = 'inset 0 0 220px 60px rgba(120,0,0,0)'; }, 160);
  }

  blackout(seconds = 1) {
    this.black.style.opacity = '1';
    setTimeout(() => { this.black.style.opacity = '0'; }, seconds * 1000);
  }

  shake(amount = 0.5) { this.trauma = Math.min(1, this.trauma + amount); }

  getShakeOffset() {
    const t = this.trauma * this.trauma;
    return {
      x: (Math.random() * 2 - 1) * 0.12 * t,
      y: (Math.random() * 2 - 1) * 0.12 * t,
      roll: (Math.random() * 2 - 1) * 0.05 * t,
    };
  }

  update(dt) { this.trauma = Math.max(0, this.trauma - dt * 1.4); }

  showNote(title, body) {
    this.noteTitle.textContent = title;
    this.noteBody.textContent = body;
    this.note.style.display = 'flex';
  }
  hideNote() { this.note.style.display = 'none'; }

  // fullscreen procedural jumpscare face
  jumpScare() {
    const cvs = document.createElement('canvas');
    const w = window.innerWidth, h = window.innerHeight;
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    // pale face
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#c9c4c0'); g.addColorStop(0.7, '#4a4744'); g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.72, R, 0, 0, Math.PI * 2); ctx.fill();
    // eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx - R * 0.32, cy - R * 0.2, R * 0.2, R * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + R * 0.32, cy - R * 0.2, R * 0.2, R * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2a12'; ctx.shadowColor = '#ff2a12'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(cx - R * 0.32, cy - R * 0.16, R * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + R * 0.32, cy - R * 0.16, R * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // screaming mouth
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.45, R * 0.22, R * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6a1a1a'; ctx.lineWidth = 4;
    for (let i = -3; i <= 3; i++) { const x = cx + i * R * 0.06; ctx.beginPath(); ctx.moveTo(x, cy + R * 0.1); ctx.lineTo(x, cy + R * 0.28); ctx.stroke(); }
    // blood veins
    ctx.strokeStyle = 'rgba(120,0,0,0.5)';
    for (let i = 0; i < 40; i++) { ctx.lineWidth = Math.random() * 2; ctx.beginPath(); let x = cx + (Math.random() - 0.5) * R, y = cy + (Math.random() - 0.5) * R; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.5) * 30; ctx.lineTo(x, y); } ctx.stroke(); }

    this.jumpface.innerHTML = '';
    this.jumpface.appendChild(cvs);
    this.jumpface.style.display = 'flex';
    // violent shake via CSS
    cvs.style.animation = 'shudder 0.08s infinite';
  }
  hideJump() { this.jumpface.style.display = 'none'; this.jumpface.innerHTML = ''; }

  showDeath() { this.death.classList.remove('hidden'); }
  hideDeath() { this.death.classList.add('hidden'); }

  showWin(timeStr, banish) {
    this.winTime.textContent = timeStr;
    this.winBanish.textContent = String(banish);
    this.win.classList.remove('hidden');
  }
  hideWin() { this.win.classList.add('hidden'); }
}
