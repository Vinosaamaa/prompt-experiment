import * as THREE from 'three';
import {
  makeWoodFloor, makeWallpaper, makeCeiling, makeFurnitureWood,
  makeDoorWood, makePortrait, makeCobweb, makeRug,
} from './Textures.js';

// House extents (metres)
export const HOUSE = {
  minX: -10, maxX: 10, minZ: -8, maxZ: 8, wallH: 3, wallT: 0.2,
  xW: -3.5, xE: 3.5,      // vertical dividers
  zN: -3, zS: 2,          // horizontal dividers
};

export const ROOMS = {
  study:   { minX: -10, maxX: -3.5, minZ: -8, maxZ: -3, cx: -6.75, cz: -5.5 },
  bedroom: { minX: -3.5, maxX: 3.5, minZ: -8, maxZ: -3, cx: 0,    cz: -5.5 },
  kitchen: { minX: 3.5,  maxX: 10,  minZ: -8, maxZ: -3, cx: 6.75, cz: -5.5 },
  hallway: { minX: -10,  maxX: 10,  minZ: -3, maxZ: 2,  cx: 0,    cz: -0.5 },
  living:  { minX: -10,  maxX: -3.5, minZ: 2, maxZ: 8,  cx: -6.75, cz: 5 },
  foyer:   { minX: -3.5, maxX: 3.5, minZ: 2,  maxZ: 8,  cx: 0,    cz: 5 },
  dining:  { minX: 3.5,  maxX: 10,  minZ: 2,  maxZ: 8,  cx: 6.75, cz: 5 },
};

function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

export function buildHouse(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const colliders = [];       // static AABBs {minX,maxX,minZ,maxZ}
  const doors = [];
  const interactables = [];    // meshes with userData
  const flickerLights = [];    // {light, base, jitter}
  const candleFlames = [];     // meshes for bloom flicker

  const addCollider = (minX, maxX, minZ, maxZ) => colliders.push({ minX, maxX, minZ, maxZ });

  // ----------------------------- materials --------------------------------
  const floorTex = makeWoodFloor();
  const wallTex = makeWallpaper();
  const ceilTex = makeCeiling();
  const furnTex = makeFurnitureWood();
  const doorTex = makeDoorWood();

  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex.map, bumpMap: floorTex.bump, bumpScale: 0.04, roughness: 0.92, metalness: 0.02 });
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex.map, bumpMap: wallTex.bump, bumpScale: 0.03, roughness: 0.96, metalness: 0.0 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex.map, bumpMap: ceilTex.bump, bumpScale: 0.03, roughness: 1.0, metalness: 0.0 });
  const furnMat = new THREE.MeshStandardMaterial({ map: furnTex.map, bumpMap: furnTex.bump, bumpScale: 0.05, roughness: 0.7, metalness: 0.08, color: 0x8a8a8a });
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTex.map, bumpMap: doorTex.bump, bumpScale: 0.06, roughness: 0.8, metalness: 0.05 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x2a2430, roughness: 0.95 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.35, metalness: 0.9, emissive: 0x3a2400, emissiveIntensity: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x6a6a70, roughness: 0.5, metalness: 0.7 });

  const W = HOUSE.maxX - HOUSE.minX;
  const D = HOUSE.maxZ - HOUSE.minZ;

  // ----------------------------- floor & ceiling --------------------------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  group.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, HOUSE.wallH, 0);
  ceil.receiveShadow = true;
  group.add(ceil);

  // ----------------------------- wall builders ----------------------------
  const t = HOUSE.wallT;
  const h = HOUSE.wallH;

  // segments along X at constant z, skipping gaps [{c,w}]
  function wallAlongX(z, x0, x1, gaps = []) {
    const solids = subtract(x0, x1, gaps);
    for (const [a, b] of solids) {
      const len = b - a;
      if (len <= 0.001) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, t), wallMat);
      m.position.set((a + b) / 2, h / 2, z);
      m.castShadow = true; m.receiveShadow = true;
      group.add(m);
      addCollider(a, b, z - t / 2, z + t / 2);
    }
  }
  // segments along Z at constant x, skipping gaps
  function wallAlongZ(x, z0, z1, gaps = []) {
    const solids = subtract(z0, z1, gaps);
    for (const [a, b] of solids) {
      const len = b - a;
      if (len <= 0.001) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(t, h, len), wallMat);
      m.position.set(x, h / 2, (a + b) / 2);
      m.castShadow = true; m.receiveShadow = true;
      group.add(m);
      addCollider(x - t / 2, x + t / 2, a, b);
    }
  }
  function subtract(start, end, gaps) {
    let ranges = [[start, end]];
    for (const g of gaps) {
      const ga = g.c - g.w / 2, gb = g.c + g.w / 2;
      const next = [];
      for (const [a, b] of ranges) {
        if (gb <= a || ga >= b) { next.push([a, b]); continue; }
        if (ga > a) next.push([a, ga]);
        if (gb < b) next.push([gb, b]);
      }
      ranges = next;
    }
    return ranges;
  }

  // header (lintel) above a door/arch gap so there is no hole to the void
  function lintel(kind, pos, gapW) {
    const hh = h - 2.2; // height above 2.2m opening
    if (kind === 'x') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(gapW, hh, t), wallMat);
      m.position.set(pos.x, 2.2 + hh / 2, pos.z);
      group.add(m);
    } else {
      const m = new THREE.Mesh(new THREE.BoxGeometry(t, hh, gapW), wallMat);
      m.position.set(pos.x, 2.2 + hh / 2, pos.z);
      group.add(m);
    }
  }

  // perimeter
  wallAlongX(HOUSE.minZ, HOUSE.minX, HOUSE.maxX);              // north
  wallAlongX(HOUSE.maxZ, HOUSE.minX, HOUSE.maxX, [{ c: 0, w: 1.6 }]); // south + front door gap
  wallAlongZ(HOUSE.minX, HOUSE.minZ, HOUSE.maxZ);              // west
  wallAlongZ(HOUSE.maxX, HOUSE.minZ, HOUSE.maxZ);              // east

  // north divider (rooms <-> hallway) with three openings
  const nGaps = [{ c: -6.75, w: 1.3 }, { c: 0, w: 1.3 }, { c: 6.75, w: 1.5 }];
  wallAlongX(HOUSE.zN, HOUSE.minX, HOUSE.maxX, nGaps);
  nGaps.forEach((g) => lintel('x', { x: g.c, z: HOUSE.zN }, g.w));

  // south divider (hallway <-> south rooms) with three archways
  const sGaps = [{ c: -6.75, w: 1.8 }, { c: 0, w: 2.2 }, { c: 6.75, w: 1.8 }];
  wallAlongX(HOUSE.zS, HOUSE.minX, HOUSE.maxX, sGaps);
  sGaps.forEach((g) => lintel('x', { x: g.c, z: HOUSE.zS }, g.w));

  // vertical interior dividers (solid)
  wallAlongZ(HOUSE.xW, HOUSE.minZ, HOUSE.zN);   // study|bedroom
  wallAlongZ(HOUSE.xE, HOUSE.minZ, HOUSE.zN);   // bedroom|kitchen
  wallAlongZ(HOUSE.xW, HOUSE.zS, HOUSE.maxZ);   // living|foyer
  wallAlongZ(HOUSE.xE, HOUSE.zS, HOUSE.maxZ);   // foyer|dining

  // baseboards (thin dark strips) around perimeter for detail
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x120d0a, roughness: 0.8 });
  const mkBase = (w, d, x, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), baseMat);
    b.position.set(x, 0.09, z); group.add(b);
  };
  mkBase(W, 0.06, 0, HOUSE.minZ + 0.05);
  mkBase(W, 0.06, 0, HOUSE.maxZ - 0.05);

  // ----------------------------- hinged doors -----------------------------
  function makeHingedDoor(gapCenterX, z, gapW, hingeSide = -1, name = 'door', locked = false) {
    const pivot = new THREE.Group();
    const doorW = gapW - 0.06;
    const doorH = 2.2;
    pivot.position.set(gapCenterX + hingeSide * (gapW / 2 - 0.03), 0, z);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.07), doorMat);
    panel.position.set(-hingeSide * doorW / 2, doorH / 2, 0);
    panel.castShadow = true; panel.receiveShadow = true;
    panel.userData = { kind: 'door', ref: name };
    pivot.add(panel);
    interactables.push(panel);

    // brass knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), brassMat);
    knob.position.set(-hingeSide * (doorW - 0.16), doorH / 2, 0.06);
    pivot.add(knob);

    lintel('x', { x: gapCenterX, z }, gapW);
    group.add(pivot);

    const door = {
      name, pivot, panel, hingeSide, gapCenterX, z, gapW, locked,
      isOpen: false, angle: 0, target: 0,
      collider: { minX: gapCenterX - gapW / 2, maxX: gapCenterX + gapW / 2, minZ: z - 0.12, maxZ: z + 0.12, active: true },
      setOpen(open, immediate = false) {
        this.isOpen = open;
        this.target = open ? hingeSide * -1.7 : 0; // ~97 degrees
        this.collider.active = !open;
        if (immediate) { this.angle = this.target; this.pivot.rotation.y = this.angle; this.collider.active = !open; }
      },
      slam() { this.setOpen(false); this.angle = hingeSide * -1.7; this.pivot.rotation.y = this.angle; },
      update(dt) {
        if (Math.abs(this.angle - this.target) > 0.001) {
          this.angle += (this.target - this.angle) * Math.min(1, dt * 9);
          this.pivot.rotation.y = this.angle;
          this.collider.active = Math.abs(this.angle) < 0.4;
        }
      },
    };
    doors.push(door);
    return door;
  }

  const studyDoor = makeHingedDoor(-6.75, HOUSE.zN, 1.3, 1, 'study');
  const bedroomDoor = makeHingedDoor(0, HOUSE.zN, 1.3, -1, 'bedroom');
  const frontDoor = makeHingedDoor(0, HOUSE.maxZ, 1.6, -1, 'front', true);

  // ----------------------------- furniture --------------------------------
  function box(w, hh, d, x, y, z, mat = furnMat, collide = true, cast = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat);
    m.position.set(x, y, z);
    if (cast) { m.castShadow = true; }
    m.receiveShadow = true;
    group.add(m);
    if (collide) addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
    return m;
  }

  function table(x, z, w = 1.4, d = 0.9, top = 0.9) {
    box(w, 0.08, d, x, top, z);
    const lx = w / 2 - 0.1, lz = d / 2 - 0.1;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(0.09, top, 0.09, x + sx * lx, top / 2, z + sz * lz, furnMat, false);
    }
    // one collider block for the leg area
    addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
    return { x, z, top };
  }

  function chair(x, z, rot = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = rot;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.44), furnMat);
    seat.position.y = 0.5; seat.castShadow = true; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.06), furnMat);
    back.position.set(0, 0.78, -0.19); back.castShadow = true; g.add(back);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), furnMat);
      leg.position.set(sx * 0.18, 0.25, sz * 0.18); g.add(leg);
    }
    group.add(g);
    addCollider(x - 0.28, x + 0.28, z - 0.28, z + 0.28);
    return g;
  }

  function portraitOnWall(x, y, z, rotY) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x140d06, roughness: 0.6, metalness: 0.2 }));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 1.02),
      new THREE.MeshStandardMaterial({ map: makePortrait(), roughness: 0.9 }));
    frame.position.set(x, y, z); frame.rotation.y = rotY;
    pic.position.set(x, y, z); pic.rotation.y = rotY;
    pic.translateZ(0.035);
    group.add(frame); group.add(pic);
  }

  function candle(x, z, y = 0.92) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0xcbb88a, roughness: 0.6 }));
    stick.position.set(x, y + 0.11, z); group.add(stick);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb04a }));
    flame.position.set(x, y + 0.26, z); flame.scale.y = 1.8; group.add(flame);
    const l = new THREE.PointLight(0xff9440, 0.5, 3.2, 2);
    l.position.set(x, y + 0.28, z); group.add(l);
    flickerLights.push({ light: l, base: 0.5, jitter: 0.35 });
    candleFlames.push(flame);
    return flame;
  }

  function cobweb(x, y, z, rotY, scale = 1) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1 * scale, 1.1 * scale),
      new THREE.MeshBasicMaterial({ map: makeCobweb(), transparent: true, opacity: 0.28, depthWrite: false }));
    m.position.set(x, y, z); m.rotation.y = rotY; group.add(m);
  }

  function rug(x, z, w = 3, d = 2) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ map: makeRug(), roughness: 1 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); m.receiveShadow = true; group.add(m);
  }

  // ---- STUDY: desk, bookshelves, chair, portraits, candle, cobwebs -------
  const studyDesk = table(-8.2, -6, 1.6, 0.8, 0.78);
  chair(-8.2, -5.0, Math.PI);
  box(0.4, 2.2, 2.4, -9.6, 1.1, -6.5); // bookshelf against west wall
  box(0.4, 2.2, 2.0, -4.0, 1.1, -6.8); // bookshelf against divider
  portraitOnWall(-6.75, 1.8, -7.85, 0);
  candle(-8.9, -6, 0.78);
  cobweb(-9.7, 2.6, -7.7, Math.PI / 4);
  rug(-6.75, -5, 3, 2.2);

  // ---- BEDROOM: bed, dresser, nightstand, portrait -----------------------
  box(2.0, 0.5, 2.6, 0, 0.25, -6.4, clothMat);      // bed base
  box(2.0, 0.25, 2.6, 0, 0.62, -6.4, new THREE.MeshStandardMaterial({ color: 0x3a2030, roughness: 0.95 }), false); // mattress+sheets
  box(0.2, 1.1, 2.6, -1.05, 0.55, -6.4);            // headboard
  const nightstand = table(1.4, -7.4, 0.6, 0.5, 0.55);
  box(1.4, 1.2, 0.5, 2.6, 0.6, -7.6);               // dresser (kitchen-side wall)
  portraitOnWall(2.9, 1.8, -7.85, 0);
  cobweb(-3.6, 2.6, -7.7, -Math.PI / 4);

  // ---- KITCHEN: counters, cabinets (chair that slides), stove ------------
  box(3.0, 0.95, 0.7, 6.5, 0.48, -7.5);             // counter (north)
  box(0.7, 1.9, 3.0, 9.5, 0.95, -6.0);              // tall cabinets (east)
  box(0.9, 0.95, 0.7, 4.4, 0.48, -7.5, metalMat);   // stove
  const kitchenTable = table(6.75, -4.3, 1.2, 0.8, 0.78);
  const kitchenChair = chair(6.75, -3.7, Math.PI); // will slide during scare
  candle(4.2, -7.5, 0.95);
  cobweb(9.6, 2.6, -7.7, -Math.PI / 4);

  // ---- LIVING ROOM: sofa, coffee table, bookshelf, portrait --------------
  box(2.4, 0.7, 0.9, -6.75, 0.35, 7.3, clothMat);   // sofa base
  box(2.4, 0.5, 0.4, -6.75, 0.7, 7.65, clothMat, false); // sofa back
  const coffee = table(-6.75, 5.6, 1.3, 0.7, 0.45);
  box(0.4, 2.2, 2.2, -9.6, 1.1, 4.5);               // bookshelf
  portraitOnWall(-9.0, 1.8, 3.6, Math.PI / 2 - 0.0001 + 0); // on... keep simple below
  candle(-6.75, 5.6, 0.45);
  rug(-6.75, 6.0, 3.4, 2.4);
  cobweb(-9.7, 2.6, 7.7, Math.PI * 0.75);

  // ---- FOYER: central table (note), coat stand, chandelier (dead) --------
  const foyerTable = table(0, 5.0, 1.1, 0.7, 0.85);
  box(0.5, 1.7, 0.5, -2.8, 0.85, 7.2);              // cabinet
  candle(0.7, 5.0, 0.85);
  rug(0, 5.5, 2.6, 3.2);

  // ---- DINING: long table, chairs, cabinet, portrait ---------------------
  const diningTable = table(6.75, 5.0, 2.4, 1.1, 0.78);
  for (const dz of [-0.9, 0.9]) { chair(5.6, 5.0 + dz, Math.PI / 2); chair(7.9, 5.0 + dz, -Math.PI / 2); }
  box(1.6, 1.5, 0.5, 6.75, 0.75, 7.6);              // sideboard
  portraitOnWall(6.75, 1.8, 7.75, Math.PI);
  candle(6.75, 5.0, 0.78);
  cobweb(9.6, 2.6, 7.7, Math.PI * 1.25);

  // ----------------------------- item placement ---------------------------
  const keyAnchors = {
    kitchen: [{ x: 6.75, y: kitchenTable.top + 0.06, z: -4.3 }, { x: 6.5, y: 1.0, z: -7.5 }, { x: 9.4, y: 1.0, z: -6.0 }],
    study:   [{ x: studyDesk.x, y: studyDesk.top + 0.06, z: studyDesk.z }, { x: -9.4, y: 1.05, z: -6.5 }, { x: -8.9, y: 0.2, z: -4.2 }],
    bedroom: [{ x: 1.4, y: nightstand.top + 0.06, z: -7.4 }, { x: 0, y: 0.78, z: -6.4 }, { x: 2.6, y: 1.25, z: -7.6 }],
  };

  function makeKey(pos, roomName) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 20), brassMat);
    ring.rotation.x = Math.PI / 2; g.add(ring);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8), brassMat);
    shaft.position.set(0, -0.14, 0); g.add(shaft);
    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), brassMat);
    bit.position.set(0.03, -0.23, 0); g.add(bit);
    g.position.set(pos.x, pos.y + 0.12, pos.z);
    g.castShadow = true;
    const glint = new THREE.PointLight(0xffd27a, 0.35, 1.4, 2);
    glint.position.set(0, 0, 0); g.add(glint);
    flickerLights.push({ light: glint, base: 0.35, jitter: 0.12 });
    group.add(g);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(g.position);
    hit.userData = { kind: 'key', ref: g, room: roomName };
    group.add(hit);
    interactables.push(hit);
    return { group: g, hit, room: roomName, taken: false };
  }

  const keys = [];
  for (const room of ['kitchen', 'study', 'bedroom']) {
    keys.push(makeKey(pick(keyAnchors[room]), room));
  }

  function makeBattery(x, y, z) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x1f6f3a, roughness: 0.5, metalness: 0.3, emissive: 0x0a3a1a, emissiveIntensity: 0.4 }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 10), metalMat);
    cap.position.y = 0.12; g.add(body); g.add(cap);
    g.position.set(x, y + 0.12, z); g.castShadow = true; group.add(g);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(g.position);
    hit.userData = { kind: 'battery', ref: g };
    group.add(hit); interactables.push(hit);
    return { group: g, hit, taken: false };
  }

  const batteries = [
    makeBattery(coffee.x - 0.3, coffee.top, coffee.z),         // living room
    makeBattery(diningTable.x - 0.6, diningTable.top, diningTable.z), // dining
    makeBattery(-2.0, 0.2, -0.5),                              // hallway floor
    makeBattery(4.4, 0.98, -7.5),                              // kitchen stove
  ];

  function makeNote(x, y, z, title, body) {
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xcabf98, roughness: 1, emissive: 0x2a2416, emissiveIntensity: 0.3 }));
    paper.rotation.x = -Math.PI / 2; paper.position.set(x, y + 0.02, z); group.add(paper);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(x, y + 0.15, z);
    hit.userData = { kind: 'note', title, body };
    group.add(hit); interactables.push(hit);
    return { hit, title, body };
  }

  const notes = [
    makeNote(foyerTable.x, foyerTable.top, foyerTable.z, 'A torn page',
      'The doors won\u2019t open. I\u2019ve counted three locks — three keys, scattered where I used to feel safe: the kitchen, the study, the bedroom. Find them all and the front door is yours. Don\u2019t stop moving. It hates the light but it learns.'),
    makeNote(studyDesk.x, studyDesk.top, studyDesk.z, 'A shaking scrawl',
      'It flinches from the beam. Hold the light on it — really hold it — and it burns away screaming. But it always comes back. In the end you cannot kill it. You can only buy seconds. Use them to run.'),
  ];

  // ----------------------------- lighting ---------------------------------
  const ambient = new THREE.AmbientLight(0x0a0d16, 0.22);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x11141f, 0x05060a, 0.18);
  scene.add(hemi);

  // cold blue moonlight at the windows (non-shadow), + window meshes
  const winMat = new THREE.MeshStandardMaterial({ color: 0x223a55, emissive: 0x1a2f4a, emissiveIntensity: 0.8, roughness: 0.4, transparent: true, opacity: 0.6 });
  const moonLights = [];
  function window3(x, z, rotY) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 0.7 }));
    frame.position.set(x, 1.7, z); frame.rotation.y = rotY; group.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), winMat);
    glass.position.set(x, 1.7, z); glass.rotation.y = rotY; group.add(glass);
    // muntins
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x0c0a08 }));
    bar.position.set(x, 1.7, z); bar.rotation.y = rotY; bar.translateZ(0.02); group.add(bar);
    const l = new THREE.PointLight(0x3a6ea5, 0.7, 6, 2);
    l.position.set(x, 1.8, z); group.add(l);
    moonLights.push(l);
  }
  window3(-6.75, HOUSE.minZ + 0.06, 0);
  window3(0, HOUSE.minZ + 0.06, 0);
  window3(6.75, HOUSE.minZ + 0.06, 0);

  // warm flickering bulbs in foyer + hallway
  function bulb(x, z, y = 2.7) {
    const l = new THREE.PointLight(0xffb060, 0.55, 6.5, 2);
    l.position.set(x, y, z); group.add(l);
    const fix = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffcaa0 }));
    fix.position.set(x, y, z); group.add(fix);
    flickerLights.push({ light: l, base: 0.55, jitter: 0.5, bulb: true });
    return l;
  }
  const foyerBulb = bulb(0, 5.5);
  const hallBulb = bulb(0, -0.5);
  const hallBulb2 = bulb(-5, -0.5, 2.7);

  // ----------------------------- public API -------------------------------
  const dynamicCollider = (out) => {
    for (const d of doors) if (d.collider.active) out.push(d.collider);
  };

  function roomAt(x, z) {
    for (const [name, r] of Object.entries(ROOMS)) {
      if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return name;
    }
    return null;
  }

  // circle-vs-AABB resolution against walls, furniture and closed doors
  const _dyn = [];
  function resolveCircle(x, z, r) {
    _dyn.length = 0;
    dynamicCollider(_dyn);
    const all = colliders.concat(_dyn);
    for (let iter = 0; iter < 2; iter++) {
      for (const c of all) {
        const nx = Math.max(c.minX, Math.min(x, c.maxX));
        const nz = Math.max(c.minZ, Math.min(z, c.maxZ));
        const dx = x - nx, dz = z - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 < r * r) {
          if (d2 > 1e-6) {
            const d = Math.sqrt(d2);
            x = nx + (dx / d) * r;
            z = nz + (dz / d) * r;
          } else {
            // center inside box: push out along least penetration axis
            const pxL = x - c.minX, pxR = c.maxX - x, pzL = z - c.minZ, pzR = c.maxZ - z;
            const m = Math.min(pxL, pxR, pzL, pzR);
            if (m === pxL) x = c.minX - r;
            else if (m === pxR) x = c.maxX + r;
            else if (m === pzL) z = c.minZ - r;
            else z = c.maxZ + r;
          }
        }
      }
    }
    return { x, z };
  }

  function update(dt) {
    for (const d of doors) d.update(dt);
  }

  return {
    group, colliders, doors, interactables, keys, batteries, notes,
    flickerLights, candleFlames, moonLights,
    bulbs: { foyerBulb, hallBulb, hallBulb2 },
    kitchenChair, kitchenChairSlid: false,
    studyDoor, bedroomDoor, frontDoor,
    resolveCircle, roomAt, update,
    startPosition: new THREE.Vector3(0, 1.6, 6.6),
  };
}
