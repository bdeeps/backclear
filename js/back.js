// BackClear's shared models and numbers.
//
// 1. makeBack(): a ghosted torso seen from behind with the back muscles laid on it as flexible
//    bands whose ends follow the bones. Arms and shoulder blades can be posed, so the same model
//    shows the anatomy, every pull and row, and which muscles get shorter.
// 2. makeSide(): a side-on figure (joints in one plane) with a lumbar spine, erector spinae and a
//    barbell, posed by angles. The hinge chapter solves its pose so the hands reach the bar.
// 3. The physics: pull and row loads, the deadlift lever about the L5/S1 disc, and balance.
//
// Orientation for makeBack: +x = the person's left, +y = up, +z = forwards. We look from behind
// (camera at -z), so their right is on your right. One model unit is 10 cm; the figure is about
// 1.75 m tall with its feet on the floor (y = 0), as in MuscleClear, so the figures line up.
// Anatomy (origins, insertions, actions) follows Gray's Anatomy (42nd ed.), Moore's Clinically
// Oriented Anatomy (8th ed.) and the StatPearls/Kenhub summaries of each muscle.
import { THREE, clamp, lerp, smooth } from './kit.js';

export const RED = 0xd4424e, TENDON = 0xf1ead8, BONE = 0xe8e2d0, GOLD = 0xffd166, CYAN = 0x8ef0ff, DISC = 0x9db4ff, NERVE = 0xffd166;
const DEG = Math.PI / 180;
export const g0 = 9.81;

// ---------------------------------------------------------------- shared numbers
// Body segments as fractions of standing height H (Winter, Biomechanics and Motor Control of
// Human Movement, 4th ed., 2009, fig. 4.1, after Drillis & Contini 1966): ankle 0.039 H, knee
// 0.285 H, hip 0.530 H, shoulder 0.818 H, upper arm 0.186 H, forearm 0.146 H, hand 0.108 H.
export const SEG = { ankle: 0.039, shank: 0.246, thigh: 0.245, trunk: 0.288, head: 0.182, uarm: 0.186, farm: 0.146, grip: 0.05, foot: 0.152 };
// Mass above the lowest lumbar disc (L5/S1): head, arms and trunk minus the pelvis, about 60% of
// body mass, with its centre of mass about 25 cm up the trunk from L5/S1 in a 1.75 m adult. These
// are the same numbers SkeletonClear's spine model uses (Winter 2009, table 4.1: HAT 67.8%).
export const UPPER = { frac: 0.6, com: 0.25, pelvis: 0.078, thighs: 0.2, shanks: 0.122 };
// Lever arm of the back extensor muscles at L5/S1: about 5–6 cm (McGill, Low Back Disorders,
// 3rd ed., 2016). Cholewicki, McGill & Norman (Med Sci Sports Exerc 23:1179, 1991) used 6 cm;
// SkeletonClear uses 5.5 cm. We use 5.5 cm.
export const EXT_ARM = 0.055;
// Cholewicki et al. 1991: 57 national-level powerlifters; estimated L4/L5 compression up to
// about 17,200 N (17,192 N), peak L4/L5 moment about 988 N·m. Sumo style cut the moment ~10%.
export const LIFTERS = { comp: 17192, moment: 988 };

// Whole-body centre of mass is about 55–57% of height above the floor (Winter 2009). For a
// straight body pivoting on its heels with the shoulders at 0.818 H, the share of body weight on
// the hands is (0.56 / 0.818) × cos(angle) when the arms pull at right angles to the body.
export const COM_H = 0.56;

// Load in a pull or row, in kg-force. ex: exercise key; o: { body, band, stack, angle, p }.
//  - pull-up and chin-up: your whole body weight hangs from your hands; a loop band under the
//    feet or knees helps most at the bottom, where it is stretched most. A band is a linear
//    spring here: stretched about 1.1 m at the bottom and 0.6 m at the top (an illustration, not
//    a product rating), so its help falls to 55% at the top.
//  - pulldown and cable row: the cable carries the stack weight (friction ignored).
//  - inverted row: a straight body pivoting on the heels.
export function pullLoad(ex, o) {
  if (ex === 'pullup' || ex === 'chinup') {
    const help = o.band * (1.1 - 0.5 * o.p) / 1.1;
    return { kg: Math.max(0, o.body - help), help, of: 'your body weight' };
  }
  if (ex === 'inverted') return { kg: o.body * (COM_H / SEG.shoulderFrac) * Math.cos(o.angle * DEG), help: 0, of: 'body weight on your hands' };
  return { kg: o.stack, help: 0, of: 'the weight stack' };
}
SEG.shoulderFrac = 0.818;

// ---------------------------------------------------------------- the hinge (side view, metres)
// Exercise settings: knee bend at the bottom and at the top (degrees) and the bar height at the
// bottom (a 45 cm plate puts the bar 22.5 cm off the floor). The good morning sets the trunk lean
// directly, because the bar sits on the upper back rather than in the hands.
export const HINGE = {
  deadlift: { label: 'Deadlift', kneeLo: 82, kneeHi: 0, barLo: 0.225 },
  rdl: { label: 'Romanian deadlift', kneeLo: 28, kneeHi: 3, barLo: 0.4 },
  goodmorning: { label: 'Good morning', kneeLo: 16, kneeHi: 2, trunkLo: 75 },
  backext: { label: 'Back extension' },
};
export const MIDFOOT = 0.07, HEEL = -0.06, TOE = 0.2;   // metres from the ankle joint

// Pose for a hinge at phase p (0 = bottom, 1 = standing). The arms hang straight down, so the
// bar sits under the shoulders; `drift` (metres) moves the bar forwards from over the middle of
// the foot. With the knee bend set by the phase, we solve the shin angle so the hips sit where a
// trunk of fixed length can reach the shoulders. If the shins would be in the bar's way, the bar
// rides forwards to touch them. Returns joints (x forwards, y up, metres; ankle joint at x = 0).
export function hingePose(ex, p, drift, H = 1.7, rounded = false) {
  const E = HINGE[ex];
  const L = { shank: SEG.shank * H, thigh: SEG.thigh * H, trunk: SEG.trunk * H, reach: (SEG.uarm + SEG.farm + SEG.grip) * H };
  const ankle = [0, SEG.ankle * H];
  const s = smooth(p);
  const go = (q, a, l) => [q[0] + Math.sin(a * DEG) * l, q[1] + Math.cos(a * DEG) * l];
  if (ex === 'backext') {
    // A flat back-extension bench: hips on a pad 0.9 m up, legs level behind, feet hooked.
    // The trunk swings from hanging straight down (p = 0) to level with the legs (p = 1).
    const hip = [0, 0.9], knee = [-L.thigh, 0.9], ank = [-L.thigh - L.shank, 0.9];
    const theta = 180 - 90 * s;
    return finish({ ankle: ank, knee, hip, shoulder: go(hip, theta, L.trunk), theta, bar: null, reach: true, kneeDeg: 0, H, L, ex, rounded, lying: true });
  }
  const kneeDeg = lerp(E.kneeLo, E.kneeHi, s);
  const legs = (a) => { const knee = go(ankle, a, L.shank); return { knee, hip: go(knee, a - kneeDeg, L.thigh) }; };
  if (ex === 'goodmorning') {
    const theta = lerp(E.trunkLo, 0, s);
    const { knee, hip } = legs(kneeDeg * 0.45 - theta * 0.1);       // hips drift back to balance
    const sh = go(hip, theta, L.trunk);
    const bar = [sh[0] - 0.035 * Math.cos(theta * DEG), sh[1] + 0.035 * Math.sin(theta * DEG)];   // on the upper back
    return finish({ ankle, knee, hip, shoulder: sh, theta, bar, reach: true, kneeDeg, H, L, ex, rounded });
  }
  const yTop = SEG.shoulderFrac * H - L.reach - 0.01;
  const yb = lerp(E.barLo, yTop, s);
  const front = (y, knee, hip) => {
    if (y <= knee[1]) { const k = (y - ankle[1]) / (knee[1] - ankle[1]); return lerp(ankle[0], knee[0], k) + 0.05; }
    const k = (y - knee[1]) / (hip[1] - knee[1]); return lerp(knee[0], hip[0], clamp(k, 0, 1)) + 0.075;
  };
  let xb = MIDFOOT, sol = null, reach = true;
  for (let it = 0; it < 4; it++) {
    const sh = [xb, yb + L.reach];
    const f = (a) => { const { hip } = legs(a); return Math.hypot(sh[0] - hip[0], sh[1] - hip[1]) - L.trunk; };
    // Scan from hips-far-back forwards for the first angle where the trunk just reaches.
    let prev = f(-30), best = -30, bestF = Math.abs(prev); sol = null;
    for (let a = -29; a <= 40; a++) {
      const v = f(a);
      if (Math.abs(v) < bestF) { bestF = Math.abs(v); best = a; }
      if (prev > 0 && v <= 0) { let lo = a - 1, hi = a; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; } sol = (lo + hi) / 2; break; }
      prev = v;
    }
    reach = sol !== null; if (!reach) sol = best;
    const { knee, hip } = legs(sol);
    const need = front(yb, knee, hip) + 0.016;
    if (xb >= need - 1e-4) break;
    xb = need;
  }
  const { knee, hip } = legs(sol);
  const sh = reach ? [xb, yb + L.reach] : go(hip, Math.atan2(xb - hip[0], yb + L.reach - hip[1]) / DEG, L.trunk);
  const theta = Math.atan2(sh[0] - hip[0], sh[1] - hip[1]) / DEG;
  // Drift: the body stays put and the bar swings forwards on straight arms.
  const bx = xb + drift, bar = [bx, sh[1] - Math.sqrt(Math.max(0, L.reach * L.reach - (bx - sh[0]) ** 2))];
  const shinGap = bx - 0.016 - front(bar[1], knee, hip);
  return finish({ ankle, knee, hip, shoulder: sh, theta, bar, reach, kneeDeg, shankDeg: sol, shinGap, H, L, ex, rounded });
}

function finish(P) {
  const t = P.theta * DEG, dir = [Math.sin(t), Math.cos(t)], back = [-Math.cos(t), Math.sin(t)];
  // L5/S1 sits about 12 cm up the trunk line from the hip joint and 3–4 cm behind it.
  P.l5 = [P.hip[0] + dir[0] * 0.07 * P.H + back[0] * 0.02 * P.H, P.hip[1] + dir[1] * 0.07 * P.H + back[1] * 0.02 * P.H];
  P.com = [P.l5[0] + dir[0] * UPPER.com * P.H / 1.75, P.l5[1] + dir[1] * UPPER.com * P.H / 1.75];
  P.dir = dir; P.back = back;
  return P;
}

// Loads about L5/S1 for a pose. M = g × (upper-body mass × its horizontal distance + bar mass ×
// the bar's horizontal distance). The back extensors, 5.5 cm behind the disc, must pull M / 0.055;
// the disc is squeezed by that pull plus the weight pressing down the spine. A simple static,
// one-muscle model: it leaves out the abdominal muscles, which co-contract and add compression,
// and the pressure inside the belly, which may take a little off.
export function hingeLoads(P, bodyKg, barKg) {
  const mU = UPPER.frac * bodyKg;
  const dU = P.com[0] - P.l5[0];
  let dB = 0, mB = barKg;
  if (P.bar) dB = P.bar[0] - P.l5[0];
  if (P.ex === 'backext') { // plate hugged to the chest, about 30 cm up the trunk from L5/S1
    const t = P.theta * DEG; dB = Math.sin(t) * (0.3 * P.H / 1.75 + 0.07 * P.H);
  }
  const Mu = g0 * mU * dU, Mb = g0 * mB * dB, M = Mu + Mb;
  const F = Math.max(0, M) / EXT_ARM;
  const axial = g0 * (mU + mB) * Math.abs(Math.cos(P.theta * DEG));
  const comp = F + axial;
  // Whole-body balance: centre of mass of body + bar against the foot (heel −6 cm, toes +20 cm).
  let cx = null, over = 'mid';
  if (!P.lying) {
    const mid = (a, b) => (a[0] + b[0]) / 2;
    const m = [[mU, P.com[0]], [UPPER.pelvis * bodyKg, P.hip[0]], [UPPER.thighs * bodyKg, mid(P.hip, P.knee)], [UPPER.shanks * bodyKg, mid(P.knee, P.ankle)], [mB, P.bar ? P.bar[0] : 0]];
    const tot = m.reduce((a, [k]) => a + k, 0);
    cx = m.reduce((a, [k, x]) => a + k * x, 0) / tot;
    over = cx > TOE ? 'toes' : cx < HEEL ? 'heels' : Math.abs(cx - MIDFOOT) < 0.06 ? 'mid' : cx > MIDFOOT ? 'front' : 'back';
  }
  return { M, Mu, Mb, F, comp, dU, dB, mU, cx, over };
}

// ---------------------------------------------------------------- label and board helpers
const TINT = { red: '#ff8a8a', gold: '#ffd166', side: '#8ef0ff', cyan: '#8ef0ff', good: '#6ee7a8', pink: '#ff9fc0', purple: '#c9a7ff', blue: '#9db4ff', white: '#e8eef8', orange: '#ffb070' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage the readout covers the upper left: re-centre once, unless orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !inReel()) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
export function board(ct, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function panel(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.88)'; rrect(g, 0, 0, w, h, 20); g.fill(); }
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- geometry helpers
export const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));
export function capsule(a, b, r, mat) {
  const A = V(a), B = V(b), len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
export function blob(r, pos, mat, seg = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), mat);
  m.scale.set(...r); m.position.set(...pos);
  return m;
}
// A limb that can be re-aimed every frame: a unit cylinder stretched between two points.
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
export function limb(r, mat) {
  const m = new THREE.Mesh(UNIT_CYL, mat);
  m.userData.r = r;
  m.castShadow = true;
  return m;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function place(m, A, B, r = m.userData.r) {
  _a.set(...A); _b.set(...B);
  const len = Math.max(1e-4, _a.distanceTo(_b));
  m.position.copy(_a).add(_b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, _b.sub(_a).normalize());
  m.scale.set(r, len, r);
}

// Fibre-direction texture for the muscles: fine lengthwise grain.
function grainTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#c24552'; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 46; i++) { const y = rnd(i) * 64; g.fillStyle = i % 2 ? 'rgba(255,170,170,.3)' : 'rgba(90,10,20,.38)'; g.fillRect(0, y, 256, 1 + rnd(i + 9) * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// A flexible muscle band through 2–4 control points: flattened across `out`, fat in the belly and
// tapering to the tendons. update() re-shapes it in place, so it can follow moving bones.
const NS = 18, NR = 10;
export class Band {
  constructor(mat) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array((NS + 1) * (NR + 1) * 3), uv = new Float32Array((NS + 1) * (NR + 1) * 2), idx = [];
    for (let i = 0; i <= NS; i++) for (let j = 0; j <= NR; j++) { const k = i * (NR + 1) + j; uv[k * 2] = i / NS; uv[k * 2 + 1] = j / NR; }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + NR + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.castShadow = true;
    this.curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]);
    this.len = 0; this.mid = new THREE.Vector3();
  }
  update(pts, w, t, out, offset = null, sheet = 0) {
    const P = pts.map((p) => (offset ? V(p).add(offset) : V(p)));
    this.curve.points = P.length === 2 ? [P[0], P[0].clone().lerp(P[1], 0.5), P[1]] : P;
    this.curve.updateArcLengths?.();
    const pos = this.mesh.geometry.attributes.position.array, o = V(out).normalize();
    const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    let len = 0, prev = null;
    for (let i = 0; i <= NS; i++) {
      const u = i / NS;
      this.curve.getPoint(u, C); this.curve.getTangent(u, T);
      if (prev) len += prev.distanceTo(C); prev = C.clone();
      N.copy(o).addScaledVector(T, -o.dot(T)); if (N.lengthSq() < 1e-6) N.set(0, 0, -1); N.normalize();
      B.crossVectors(T, N).normalize();
      const sn = Math.sin(Math.PI * clamp(u, 0, 1)), sp = lerp(0.12 + 0.88 * Math.pow(sn, 0.6), 0.3 + 0.7 * Math.pow(sn, 0.3), sheet);
      for (let j = 0; j <= NR; j++) {
        const a = (j / NR) * Math.PI * 2, k = (i * (NR + 1) + j) * 3;
        const cw = Math.cos(a) * w * sp, ct = Math.sin(a) * t * sp;
        pos[k] = C.x + B.x * cw + N.x * ct; pos[k + 1] = C.y + B.y * cw + N.y * ct; pos[k + 2] = C.z + B.z * cw + N.z * ct;
      }
      if (i === NS / 2) this.mid.copy(C);
    }
    this.len = len;
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.computeBoundingSphere();
    return len;
  }
}

// ---------------------------------------------------------------- the back figure
const TORSO = [[15.1, 0.02], [15.0, 0.55], [14.75, 1.45], [14.35, 1.8], [13.6, 1.72], [12.4, 1.55], [11.3, 1.32], [10.4, 1.35], [9.6, 1.55], [9.0, 1.5], [8.55, 1.05], [8.4, 0.02]];
export function torsoR(y) {
  for (let i = 1; i < TORSO.length; i++) if (y >= TORSO[i][0]) { const [y0, r0] = TORSO[i - 1], [y1, r1] = TORSO[i]; return lerp(r0, r1, (y0 - y) / (y0 - y1)); }
  return 0.02;
}
const DEPTH = 0.62;
// z of the back surface at (x, y), pushed in by `inset` (positive = deeper).
export function backZ(x, y, inset = 0) { const r = Math.max(torsoR(y), Math.abs(x) + 0.05); return -DEPTH * Math.sqrt(Math.max(0.02, r * r - x * x)) + inset; }
const spineZ = (y) => backZ(0, y, 0.12);

// Scapula landmarks (person's left), resting position, and its centre of rotation.
const SCAP = {
  sup: [0.72, 14.55, -1.0], inf: [0.95, 12.15, -0.95], acr: [1.78, 14.8, -0.45], gle: [1.72, 14.3, -0.35],
  root: [0.78, 14.02, -1.05], smid: [1.2, 14.4, -0.95], slat: [1.55, 14.6, -0.75], c: [1.1, 13.6],
};
// Arm direction for elevation e (0 = hanging, 180 = overhead) in a plane phi (0 = out to the side,
// 90 = straight forwards; negative e behind you when phi = 90).
export function armDir(eDeg, phiDeg, sx = 1) {
  const e = eDeg * DEG, p = phiDeg * DEG;
  return new THREE.Vector3(sx * Math.sin(e) * Math.cos(p), -Math.cos(e), Math.sin(e) * Math.sin(p));
}

// Default pose: arms hanging, shoulder blades neutral, elbows straight.
export const POSE0 = { e: 8, phi: 0, k: 8, pole: [0, 0, 1], ret: 0, elev: 0, rot: 0 };

export const BACK_NAMES = {
  lats: 'Latissimus dorsi', trapU: 'Trapezius, upper', trapM: 'Trapezius, middle', trapL: 'Trapezius, lower', rhomb: 'Rhomboids',
  teres: 'Teres major', delt: 'Rear deltoid', erector: 'Erector spinae', multi: 'Multifidus',
};
// Layers, from the skin in: 1 superficial, 2 intermediate, 3 deep, 4 deepest.
const LAYER = { trapU: 1, trapM: 1, trapL: 1, lats: 1, delt: 1, rhomb: 2, teres: 2, erector: 3, multi: 4 };

export function makeBack(stage, opts = {}) {
  const o = { legs: true, labels: true, nerves: false, ...opts };
  const root = new THREE.Group();
  const G = { skin: new THREE.Group(), bones: new THREE.Group(), muscles: new THREE.Group(), nerves: new THREE.Group() };
  Object.values(G).forEach((g) => root.add(g));

  // ---- skin (ghost)
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a47e, transparent: true, opacity: 0.14, roughness: 0.65, depthWrite: false, side: THREE.DoubleSide });
  G.skin.add(blob([0.78, 1.0, 0.88], [0, 16.45, 0.05], skinMat));
  G.skin.add(capsule([0, 14.9, -0.02], [0, 15.6, 0.0], 0.42, skinMat));
  const tg = new THREE.LatheGeometry(TORSO.map(([y, r]) => new THREE.Vector2(r, y)), 48); tg.scale(1, 1, DEPTH); tg.computeVertexNormals();
  G.skin.add(new THREE.Mesh(tg, skinMat));
  const armSkin = [], legsG = new THREE.Group(); G.skin.add(legsG);
  for (const sx of [1, -1]) {
    const up = limb(0.4, skinMat), fo = limb(0.31, skinMat), hand = blob([0.22, 0.42, 0.14], [0, 0, 0], skinMat, 16);
    G.skin.add(up, fo, hand); armSkin.push({ up, fo, hand, sx });
    if (o.legs) {
      legsG.add(capsule([sx * 0.8, 9.0, 0], [sx * 0.95, 4.8, 0], 0.64, skinMat));
      legsG.add(capsule([sx * 0.95, 4.8, 0], [sx * 0.97, 0.75, -0.05], 0.46, skinMat));
      legsG.add(blob([0.34, 0.2, 0.62], [sx * 1.0, 0.24, 0.35], skinMat));
    }
  }

  // ---- bones
  const boneMat = new THREE.MeshStandardMaterial({ color: BONE, transparent: true, opacity: 0.6, roughness: 0.6 });
  const discMat = new THREE.MeshStandardMaterial({ color: DISC, transparent: true, opacity: 0.8, roughness: 0.4, emissive: 0x2a3a70, emissiveIntensity: 0.4 });
  const verts = [];
  // 7 neck, 12 chest and 5 lower-back vertebrae: lumbar ones are the biggest (they carry most).
  const levels = [];
  for (let i = 0; i < 7; i++) levels.push({ n: `C${i + 1}`, y: lerp(16.0, 15.15, i / 6), r: 0.15 });
  for (let i = 0; i < 12; i++) levels.push({ n: `T${i + 1}`, y: lerp(14.95, 11.25, i / 11), r: lerp(0.17, 0.24, i / 11) });
  for (let i = 0; i < 5; i++) levels.push({ n: `L${i + 1}`, y: lerp(10.95, 9.55, i / 4), r: lerp(0.27, 0.3, i / 4) });
  const vGeo = new THREE.CylinderGeometry(1, 1, 1, 18);
  levels.forEach((L, i) => {
    const next = levels[i + 1], h = next ? (L.y - next.y) * 0.72 : 0.26;
    const z = spineZ(L.y) + 0.45;
    const body = new THREE.Mesh(vGeo, boneMat); body.scale.set(L.r, h, L.r * 0.85); body.position.set(0, L.y, z); G.bones.add(body);
    const sp = capsule([0, L.y, z - L.r * 0.7], [0, L.y - h * 0.4, spineZ(L.y) - 0.02], 0.045, boneMat); G.bones.add(sp);      // spinous process
    const tp = capsule([-L.r * 1.9, L.y, z - L.r * 0.4], [L.r * 1.9, L.y, z - L.r * 0.4], 0.035, boneMat); G.bones.add(tp);     // transverse processes
    verts.push({ ...L, mesh: body, z });
    if (next) { const d = new THREE.Mesh(vGeo, discMat); d.scale.set(L.r * 0.95, (L.y - next.y) * 0.26, L.r * 0.8); d.position.set(0, (L.y + next.y) / 2 - h * 0.01, (z + spineZ(next.y) + 0.45) / 2); G.bones.add(d); }
  });
  { const d = new THREE.Mesh(vGeo, discMat); d.scale.set(0.29, 0.1, 0.24); d.position.set(0, 9.33, spineZ(9.33) + 0.45); G.bones.add(d); }      // L5/S1 disc
  const sacrum = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.0, 16), boneMat); sacrum.rotation.x = Math.PI; sacrum.scale.z = 0.5; sacrum.position.set(0, 8.75, spineZ(8.8) + 0.35); G.bones.add(sacrum);
  const pel = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.1, 10, 32), boneMat); pel.rotation.x = Math.PI / 2 - 0.5; pel.scale.set(1.2, 0.75, 1); pel.position.set(0, 9.1, -0.1); G.bones.add(pel);
  for (let k = 0; k < 10; k++) {                                                          // ribs (ghost)
    const y = 14.2 - k * 0.32, R = torsoR(y) * 0.86;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 40), new THREE.MeshStandardMaterial({ color: BONE, transparent: true, opacity: 0.25, depthWrite: false }));
    rib.rotation.x = Math.PI / 2 - 0.25; rib.scale.set(R, R * DEPTH, 1); rib.position.set(0, y, -0.05); G.bones.add(rib);
  }
  // shoulder blades (rebuilt each pose), humerus, forearm
  const scapMat = new THREE.MeshStandardMaterial({ color: BONE, transparent: true, opacity: 0.85, roughness: 0.6, side: THREE.DoubleSide });
  const side = [];
  for (const sx of [1, -1]) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); g.setIndex(sx > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
    const plate = new THREE.Mesh(g, scapMat); G.bones.add(plate);
    const ridge = limb(0.05, boneMat); G.bones.add(ridge);
    const hum = limb(0.1, boneMat), rad = limb(0.06, boneMat), head = blob([0.24, 0.24, 0.24], [0, 0, 0], boneMat, 16);
    G.bones.add(hum, rad, head);
    side.push({ sx, plate, ridge, hum, rad, head, L: {} });
  }

  // ---- muscles
  const grain = grainTexture();
  const mMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, map: grain, roughness: 0.55, emissive: RED, emissiveIntensity: 0.1, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const list = [];   // { k, sx, band, mat, layer, rest }
  const addBand = (k, sx) => { const mat = mMat(), band = new Band(mat); band.mesh.userData.muscle = { k, sx }; G.muscles.add(band.mesh); const e = { k, sx, band, mat, layer: LAYER[k], rest: 0, len: 0 }; list.push(e); return e; };
  const NB = { lats: 5, trapU: 2, trapM: 2, trapL: 2, rhomb: 3, teres: 1, delt: 1, erector: 3, multi: 3 };
  for (const sx of [1, -1]) for (const [k, n] of Object.entries(NB)) for (let i = 0; i < n; i++) { const e = addBand(k, sx); e.i = i; }

  // ---- nerves (sciatic path down the back of each leg, for the safety chapter)
  const nerveMat = new THREE.MeshStandardMaterial({ color: NERVE, emissive: NERVE, emissiveIntensity: 0.2, transparent: true, opacity: 0.9 });
  const nerves = [];
  if (o.nerves) {
    for (const sx of [1, -1]) {
      const pts = [[sx * 0.25, 9.6, spineZ(9.6) + 0.5], [sx * 0.5, 9.0, -0.6], [sx * 0.75, 8.3, -0.75], [sx * 0.85, 6.5, -0.5], [sx * 0.92, 4.9, -0.35], [sx * 0.97, 2.8, -0.35], [sx * 0.98, 0.8, -0.1]];
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => V(p)));
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.06, 8), nerveMat.clone());
      G.nerves.add(m); nerves.push({ sx, mesh: m, curve });
    }
  }

  // ---- labels
  const labels = {};
  const L = (k, html, cls = 'red') => { labels[k] = tint(stage.label(html, [0, 0, 0], root), cls); return labels[k]; };
  if (o.labels) {
    L('trapU', 'Trapezius (upper)'); L('trapM', 'Trapezius (middle)'); L('trapL', 'Trapezius (lower)');
    L('lats', 'Latissimus dorsi'); L('rhomb', 'Rhomboids'); L('teres', 'Teres major'); L('delt', 'Rear deltoid');
    L('erector', 'Erector spinae'); L('multi', 'Multifidus'); L('spine', 'Spine and discs', 'blue'); L('scap', 'Shoulder blade', 'white');
  }

  // ---- posing
  const S = { L: {}, R: {} };
  const tf = (p, sc, sx) => {   // scapula transform for one side
    const c = SCAP.c, a = sc.rot * DEG;
    const x = p[0] - c[0], y = p[1] - c[1];
    const rx = c[0] + x * Math.cos(a) - y * Math.sin(a), ry = c[1] + x * Math.sin(a) + y * Math.cos(a);
    const wrap = Math.max(0, -sc.ret) * 0.3;
    return [sx * (rx - 0.32 * sc.ret), ry + 0.32 * sc.elev, p[2] + wrap * clamp((p[0] - 0.6) / 1.2, 0, 1) + 0.04 * Math.max(0, sc.ret)];
  };
  let explode = 0, curPose = { ...POSE0 };
  const api = {
    root, G, list, labels, verts, nerves, side, legs: legsG, skinMat,
    pose(P, P2 = P) {
      // P for the person's left side, P2 for the right (mirrored).
      curPose = P;
      for (const sd of side) {
        const pp = sd.sx > 0 ? P : P2, sx = sd.sx;
        const T = (k) => tf(SCAP[k], pp, sx);
        const sup = T('sup'), inf = T('inf'), acr = T('acr'), gle = T('gle');
        const arr = sd.plate.geometry.attributes.position.array;
        [sup, inf, gle, acr].forEach((q, i) => { arr[i * 3] = q[0]; arr[i * 3 + 1] = q[1]; arr[i * 3 + 2] = q[2]; });
        sd.plate.geometry.attributes.position.needsUpdate = true; sd.plate.geometry.computeVertexNormals(); sd.plate.geometry.computeBoundingSphere();
        place(sd.ridge, T('root'), acr);
        const S0 = V(gle).add(new THREE.Vector3(sx * 0.15, 0, 0.18));
        const u = armDir(pp.e, pp.phi, sx);
        const elbow = S0.clone().addScaledVector(u, 3.0);
        const pole = V(pp.pole); pole.x *= sx;
        const w = pole.clone().addScaledVector(u, -pole.dot(u)); if (w.lengthSq() < 1e-6) w.set(0, 0, 1); w.normalize();
        const k = pp.k * DEG, f = u.clone().multiplyScalar(Math.cos(k)).addScaledVector(w, Math.sin(k));
        const wrist = elbow.clone().addScaledVector(f, 2.55), grip = elbow.clone().addScaledVector(f, 3.05);
        place(sd.hum, S0.toArray(), elbow.toArray()); sd.head.position.copy(S0);
        place(sd.rad, elbow.toArray(), wrist.toArray());
        const as = armSkin.find((a) => a.sx === sx);
        place(as.up, S0.toArray(), elbow.toArray()); place(as.fo, elbow.toArray(), wrist.toArray());
        as.hand.position.copy(wrist.clone().addScaledVector(f, 0.42)); as.hand.quaternion.setFromUnitVectors(_up, f);
        Object.assign(sd.L, { S0, u, elbow, f, wrist, grip, sup, inf, acr, gle, root: T('root'), smid: T('smid'), slat: T('slat') });
        (sx > 0 ? S.L : S.R).grip = grip;
      }
      this.shape();
      return S;
    },
    hand(sx) { return side.find((d) => d.sx === sx).L.grip; },
    // Re-shape every band from the current bones.
    shape() {
      const ex = explode;
      for (const e of list) {
        const sd = side.find((d) => d.sx === e.sx), Ls = sd.L, sx = e.sx, i = e.i;
        const H = (t, fwd = 0, lat = 0) => Ls.S0.clone().addScaledVector(Ls.u, t).add(new THREE.Vector3(sx * lat, 0, fwd));
        const sp = (y, inset = 0) => [sx * 0.06, y, spineZ(y) + inset];
        const sf = (x, y, inset) => [sx * x, y, backZ(x, y, inset)];
        let pts, w = 0.3, t = 0.08, out = [sx * 0.15, 0, -1], sheet = 0;
        switch (e.k) {
          case 'lats': {
            const oy = [12.7, 11.7, 10.7, 9.8, 9.35][i], ox = [0.06, 0.06, 0.06, 0.06, 0.8][i];
            const wy = lerp(12.9, 11.9, i / 4);
            pts = [i < 4 ? sp(oy, -0.02) : sf(ox, oy, -0.03), sf(1.38, wy, -0.06), H(0.55, 0.18, -0.12).toArray()];
            w = 0.62; t = 0.05; sheet = 1; out = [sx * 0.5, 0, -1]; break;
          }
          case 'trapU': pts = i ? [[sx * 0.12, 15.6, -0.5], [sx * 0.95, 15.15, -0.62], Ls.acr] : [[sx * 0.1, 16.05, -0.62], [sx * 0.6, 15.5, -0.58], Ls.acr]; w = 0.32; t = 0.05; sheet = 1; out = [sx * 0.2, 0.5, -1]; break;
          case 'trapM': pts = [sp(i ? 14.35 : 15.0, -0.12), i ? Ls.smid : Ls.slat]; w = 0.42; t = 0.05; sheet = 1; break;
          case 'trapL': pts = [sp([12.9, 11.6][i], -0.13), sf(0.55, 13.0 + i * 0.1, -0.14), V(Ls.root).add(new THREE.Vector3(0, 0, -0.08)).toArray()]; w = 0.42; t = 0.045; sheet = 1; break;
          case 'rhomb': {
            const k = [0.12, 0.5, 0.88][i];
            pts = [sp([15.0, 14.35, 13.7][i], 0.05), Ls.sup.map((v, j) => lerp(v, Ls.inf[j], k)).map((v, j) => (j === 2 ? v - 0.02 : v))];
            w = 0.3; t = 0.06; sheet = 0.8; break;
          }
          case 'teres': pts = [Ls.inf, H(0.45, 0.12, -0.08).toArray()]; w = 0.2; t = 0.12; out = [sx * 0.3, -0.3, -1]; break;
          case 'delt': pts = [Ls.slat, H(0.25, -0.05, 0.1).toArray(), H(1.45, -0.05, 0.08).toArray()]; w = 0.22; t = 0.13; out = [sx * 0.6, 0, -1]; break;
          case 'erector': {
            const x = [0.2, 0.48, 0.82][i], top = [14.9, 14.7, 14.0][i];
            pts = [sf(x * 0.7, 8.9, 0.14), sf(x, 10.4, 0.16), sf(x, 12.4, 0.2), sf(x * 0.9, top, 0.22)];
            w = [0.12, 0.16, 0.14][i]; t = 0.1; break;
          }
          case 'multi': { const y0 = [8.85, 9.55, 10.25][i]; pts = [sf(0.16, y0, 0.3), sf(0.15, y0 + 1.5, 0.3)]; w = 0.09; t = 0.08; break; }
        }
        // explode: superficial layers lift off furthest
        const off = ex > 0 ? new THREE.Vector3(sx * 0.15 * ex, 0, -ex * (5 - e.layer) * 0.55) : null;
        e.len = e.band.update(pts, w, t, out, off, sheet);
        if (!e.rest) e.rest = e.len;
      }
      // labels: each beside its muscle, half on each side of the body so they don't pile up.
      // side: +1 = the person's left (your left), −1 = their right. off: outward, up.
      const LP = { trapU: [-1, 1.6, 0.9], trapM: [1, 2.4, 0.5], trapL: [-1, 2.6, -0.3], lats: [1, 2.6, -1.0], rhomb: [-1, 2.9, 0.4], teres: [1, 2.4, 0.1], delt: [-1, 1.6, 0.2], erector: [1, 2.9, -1.7], multi: [-1, 3.0, -2.3] };
      const pos = {};
      for (const e of list) { const lp = LP[e.k]; if (!lp || e.sx !== lp[0]) continue; (pos[e.k] ||= []).push(e.band.mid); }
      for (const [k, arr] of Object.entries(pos)) {
        const l = labels[k]; if (!l) continue;
        const m = arr.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / arr.length), lp = LP[k];
        l.position.set(lp[0] * Math.max(Math.abs(m.x) + lp[1], 1.8 + lp[1] * 0.6), m.y + lp[2], m.z - 0.6);
      }
      if (labels.spine) labels.spine.position.set(-2.6, 9.6, -1.2 - ex * 0.2);
      if (labels.scap) { const sd = side.find((d) => d.sx > 0); labels.scap.position.set(sd.L.inf[0] + 2.2, sd.L.inf[1] - 0.2, sd.L.inf[2] - 0.4); }
    },
    setExplode(k) { explode = smooth(clamp(k, 0, 1)); this.shape(); },
    // X-ray: 0 = skin, 1 = all muscles, 2 = superficial peeled, 3 = deep only, 4 = bones.
    setLayer(k) {
      skinMat.opacity = lerp(0.55, 0.1, clamp(k, 0, 1)); skinMat.depthWrite = k < 0.3;
      for (const e of list) {
        const gone = clamp(k - e.layer, 0, 1);            // layer n fades between k = n and n+1
        const op = k < 1 ? 0.35 + 0.65 * k : 1 - 0.9 * gone;
        e.mat.opacity = op; e.mat.depthWrite = op > 0.9; e.band.mesh.visible = op > 0.03;
      }
      boneMat.opacity = lerp(0.35, 0.95, clamp(k - 2, 0, 2) / 2); scapMat.opacity = lerp(0.6, 0.95, clamp(k - 2, 0, 2) / 2);
    },
    // Colour each muscle: fn(e) → 0 (dim) .. 1 (glowing).
    glow(fn) {
      for (const e of list) {
        const a = fn(e);
        if (a === null || a === undefined) { e.mat.color.setHex(0xffffff); e.mat.emissive.setHex(RED); e.mat.emissiveIntensity = 0.1; continue; }
        e.mat.color.setHex(a > 0.05 ? 0xffffff : 0x7a6266);
        e.mat.emissive.setHex(a > 0.05 ? 0xff5a4a : RED);
        e.mat.emissiveIntensity = 0.04 + 0.7 * clamp(a, 0, 1);
      }
    },
    showLabels(on, keys = null) { Object.entries(labels).forEach(([k, l]) => { l.visible = on && (!keys || keys.includes(k)); }); },
    // Origin-to-insertion length of a muscle (both sides averaged), in model units.
    length(k) { const a = list.filter((e) => e.k === k); return a.reduce((s, e) => s + e.len, 0) / a.length; },
    restLength(k) { const a = list.filter((e) => e.k === k); return a.reduce((s, e) => s + e.rest, 0) / a.length; },
    get poseNow() { return curPose; },
  };
  api.pose(POSE0);
  list.forEach((e) => { e.rest = e.len; });
  api.setLayer(1);
  return api;
}

// ---------------------------------------------------------------- the side figure
// Joints in the x–y plane (x forwards), metres; drawn in 10 cm model units. Angles are segment
// directions measured from straight up towards the front (degrees). The lumbar spine is drawn
// as five vertebrae with discs between L5/S1 and T12, with the erector spinae behind it.
export function makeSide(stage, opts = {}) {
  const o = { bar: true, H: 1.7, ...opts };
  const U = 10;            // metres → model units
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a47e, transparent: true, opacity: 0.3, roughness: 0.6, depthWrite: false });
  const skinNear = new THREE.MeshStandardMaterial({ color: 0xd9a47e, transparent: true, opacity: 0.42, roughness: 0.6, depthWrite: false });
  const boneMat = new THREE.MeshStandardMaterial({ color: BONE, roughness: 0.55 });
  const discMat = new THREE.MeshStandardMaterial({ color: DISC, emissive: 0x3050a0, emissiveIntensity: 0.4, roughness: 0.4 });
  const ercMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: grainTexture(), emissive: RED, emissiveIntensity: 0.2, roughness: 0.5 });
  const ligMat = new THREE.MeshStandardMaterial({ color: TENDON, emissive: 0x806030, emissiveIntensity: 0.1, roughness: 0.4 });
  const glutMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: grainTexture(), emissive: RED, emissiveIntensity: 0.15, roughness: 0.5, transparent: true, opacity: 0.9 });
  const braceMat = new THREE.MeshStandardMaterial({ color: 0x8ef0ff, emissive: 0x8ef0ff, emissiveIntensity: 0.3, transparent: true, opacity: 0, depthWrite: false });
  const parts = {};
  const mk = (k, r, mat) => { const m = limb(r, mat); root.add(m); parts[k] = m; return m; };
  for (const z of [1, -1]) {
    const mat = z > 0 ? skinNear : skin;
    mk('shank' + z, 0.45, mat); mk('thigh' + z, 0.62, mat); mk('uarm' + z, 0.38, mat); mk('farm' + z, 0.3, mat); mk('foot' + z, 0.3, mat);
    mk('ham' + z, 0.32, glutMat);
  }
  const trunk = blob([1, 1, 1], [0, 0, 0], skinNear, 28); root.add(trunk);
  const pelvisM = blob([1, 1, 1], [0, 0, 0], skin, 20); root.add(pelvisM);
  const head = blob([0.95, 1.1, 0.85], [0, 0, 0], skinNear, 24); root.add(head);
  const neck = mk('neck', 0.38, skinNear);
  const glute = blob([0.75, 0.85, 0.75], [0, 0, 0], glutMat, 20); root.add(glute);
  const brace = blob([1, 1, 1], [0, 0, 0], braceMat, 24); root.add(brace);
  // lumbar spine
  const vGeo = new THREE.BoxGeometry(1, 1, 1);
  const lum = [], discs = [];
  for (let i = 0; i < 5; i++) { const v = new THREE.Mesh(vGeo, boneMat); v.castShadow = true; root.add(v); lum.push(v); const d = new THREE.Mesh(vGeo, discMat); root.add(d); discs.push(d); }
  const sacrum = new THREE.Mesh(vGeo, boneMat); root.add(sacrum);
  const thor = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V([0, 0, 0]), V([0, 1, 0])]), 20, 0.22, 8), boneMat); root.add(thor);
  const erc = new Band(ercMat); root.add(erc.mesh);
  const lig = limb(0.06, ligMat); root.add(lig);
  // barbell: a generic 20 kg, 2.2 m bar with 45 cm plates (or smaller ones for light loads)
  const bar = new THREE.Group(); root.add(bar);
  const steel = new THREE.MeshStandardMaterial({ color: 0xb9bec8, metalness: 0.9, roughness: 0.3 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 22, 16), steel); shaft.rotation.x = Math.PI / 2; bar.add(shaft);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.6, metalness: 0.2 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xff6b9a, roughness: 0.5, emissive: 0x3a1020, emissiveIntensity: 0.4 });
  const plates = [];
  const plateNear = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.6, metalness: 0.2, transparent: true, opacity: 0.35, depthWrite: false });
  for (const z of [1, -1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 1, 40), z > 0 ? plateNear : plateMat); p.rotation.x = Math.PI / 2; bar.add(p); const r = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.06, 6, 40), rimMat); bar.add(r); plates.push({ p, r, z }); }
  bar.visible = o.bar;
  const Z = 1.15;          // half the hip/shoulder width in model units, for the near and far limbs

  const P3 = (p, z = 0) => [p[0] * U, p[1] * U, z];
  const api = {
    root, bar, erc, lum, discs, lig, brace, braceMat, ercMat, ligMat, glutMat, parts, head,
    // Set from absolute joint positions (metres): ankle, knee, hip, shoulder, plus optional elbow,
    // hand, neck direction and lumbar curve (positive = arched/lordosis, negative = rounded).
    set(J) {
      const H = o.H;
      const dir = [J.shoulder[0] - J.hip[0], J.shoulder[1] - J.hip[1]], tl = Math.hypot(...dir), d = [dir[0] / tl, dir[1] / tl];
      const rr = [-d[1], d[0]];   // d turned 90°: for an upright figure facing +x this points behind (−x)
      const curve = J.curve ?? 0.15;
      for (const z of [1, -1]) {
        const zz = z * 0.55;
        place(parts['shank' + z], P3(J.ankle, zz), P3(J.knee, zz));
        place(parts['thigh' + z], P3(J.knee, zz), P3(J.hip, zz));
        const toe = J.toe || [J.ankle[0] + 0.19, J.ankle[1] - 0.04];
        place(parts['foot' + z], P3([J.ankle[0] - 0.04, J.ankle[1] - 0.02], zz), P3(toe, zz));
        const td = [J.hip[0] - J.knee[0], J.hip[1] - J.knee[1]], tdl = Math.hypot(...td), tr = [-td[1] / tdl, td[0] / tdl]; // thigh's rear side
        place(parts['ham' + z], P3([J.knee[0] + tr[0] * 0.04 + td[0] * 0.15, J.knee[1] + tr[1] * 0.04 + td[1] * 0.15], zz), P3([J.hip[0] + tr[0] * 0.05 - td[0] * 0.08, J.hip[1] + tr[1] * 0.05 - td[1] * 0.08], zz));
        const sh = J.shoulder, el = J.elbow || [lerp(sh[0], J.hand[0], 0.5), lerp(sh[1], J.hand[1], 0.5)];
        place(parts['uarm' + z], P3(sh, z * Z), P3(el, z * Z));
        place(parts['farm' + z], P3(el, z * Z), P3(J.hand, z * Z));
      }
      // trunk: an ellipsoid along hip→shoulder
      const mid = [J.hip[0] + d[0] * tl * 0.52, J.hip[1] + d[1] * tl * 0.52];
      trunk.position.set(...P3(mid)); trunk.scale.set(1.2, tl * U * 0.56, 1.5);
      trunk.quaternion.setFromUnitVectors(_up, new THREE.Vector3(d[0], d[1], 0));
      pelvisM.position.set(...P3([J.hip[0] + d[0] * 0.04, J.hip[1] + d[1] * 0.04])); pelvisM.scale.set(1.25, 1.0, 1.6);
      brace.position.set(...P3([J.hip[0] + d[0] * 0.16 - rr[0] * 0.02, J.hip[1] + d[1] * 0.16 - rr[1] * 0.02])); brace.scale.set(1.05, 1.35, 1.3);
      brace.quaternion.copy(trunk.quaternion);
      const gl = [J.hip[0] + rr[0] * 0.07 - d[0] * 0.02, J.hip[1] + rr[1] * 0.07 - d[1] * 0.02];
      glute.position.set(...P3(gl)); glute.quaternion.copy(trunk.quaternion);
      // head and neck
      const nd = J.neckDir || d, c7 = [J.shoulder[0] + rr[0] * 0.02, J.shoulder[1] + rr[1] * 0.02];
      const hc = [c7[0] + nd[0] * 0.2, c7[1] + nd[1] * 0.2];
      place(neck, P3(c7), P3([c7[0] + nd[0] * 0.12, c7[1] + nd[1] * 0.12]));
      head.position.set(...P3(hc)); head.quaternion.setFromUnitVectors(_up, new THREE.Vector3(nd[0], nd[1], 0));
      // lumbar spine: from L5/S1 up 18 cm (scaled), bent by `curve` radians in total, set
      // behind the trunk line by 2% of height; thoracic spine continues to C7.
      const l5 = J.l5 || [J.hip[0] + d[0] * 0.07 * H + rr[0] * 0.02 * H, J.hip[1] + d[1] * 0.07 * H + rr[1] * 0.02 * H];
      const seg = 0.036 * H / 1.7, base = Math.atan2(d[0], d[1]);
      let p = [...l5], a = base - curve * 0.6;   // start leaning so the curve's chord follows the trunk
      const pts = [p];
      for (let i = 0; i < 5; i++) {
        const a1 = a + curve / 5;
        const q = [p[0] + Math.sin(a1) * seg, p[1] + Math.cos(a1) * seg];
        const c = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        lum[i].position.set(...P3(c)); lum[i].scale.set(0.42, seg * U * 0.7, 0.5); lum[i].rotation.set(0, 0, -a1);
        discs[i].position.set(...P3(p)); discs[i].scale.set(0.4, seg * U * 0.25, 0.46); discs[i].rotation.set(0, 0, -a);
        p = q; a = a1; pts.push(p);
      }
      sacrum.position.set(...P3([l5[0] - Math.sin(base - 0.5) * 0.05, l5[1] - Math.cos(base - 0.5) * 0.05])); sacrum.scale.set(0.5, 1.0, 0.6); sacrum.rotation.set(0, 0, -(base - 0.6));
      // thoracic: curve from T12 to C7 (kyphosis grows when rounded)
      const t12 = p, kyph = 0.25 - Math.min(0, curve) * 0.4;
      const c7b = [J.shoulder[0] + rr[0] * 0.035 * H / 1.7, J.shoulder[1] + rr[1] * 0.035 * H / 1.7];
      const midT = [lerp(t12[0], c7b[0], 0.5) + rr[0] * 0.03 * (1 + kyph * 3), lerp(t12[1], c7b[1], 0.5) + rr[1] * 0.03 * (1 + kyph * 3)];
      const curveT = new THREE.CatmullRomCurve3([V(P3(t12)), V(P3(midT)), V(P3(c7b))]);
      thor.geometry.dispose(); thor.geometry = new THREE.TubeGeometry(curveT, 16, 0.2, 8);
      // erector spinae: 5.5 cm behind the spine (its lever arm), from the sacrum to the ribs
      const off = (q, k) => [q[0] + rr[0] * k, q[1] + rr[1] * k];
      const arm = EXT_ARM * (1 + Math.max(0, -curve) * 0.15);
      const ePts = [off([l5[0] - d[0] * 0.05, l5[1] - d[1] * 0.05], arm * 0.9), off(pts[2], arm), off(t12, arm), off(midT, arm * 0.7), off(c7b, arm * 0.4)].map((q) => P3(q));
      erc.update(ePts, 0.34, 0.2, [0, 0, 1]);
      // posterior ligaments (they tighten when the spine rounds)
      place(lig, P3(off(l5, 0.03)), P3(off(t12, 0.03)));
      // barbell
      if (J.bar) { bar.position.set(...P3(J.bar)); bar.visible = o.bar; } else bar.visible = false;
      this.pts = pts; this.l5 = l5;
    },
    setPlates(kg) {
      // 20 kg bar; the rest split between two sides. Light loads use smaller plates.
      const side = Math.max(0, (kg - 20) / 2);
      plates.forEach(({ p, r, z }) => {
        const th = 0.15 + side * 0.012, R = side < 10 ? lerp(1.4, 2.25, side / 10) : 2.25;
        p.scale.set(R / 2.25, Math.max(0.1, th), R / 2.25); p.position.z = z * (7.6 + th / 2);
        r.scale.setScalar(R / 2.25); r.position.z = z * (7.6 + th + 0.02);
        p.visible = r.visible = kg > 20.5; p.position.z = z * (6.55 + th / 2); r.position.z = z * (6.55 + th + 0.02);
      });
    },
  };
  return api;
}

// Pose angles → joint positions for makeSide (metres). a: segment directions from vertical.
export function chain(anchor, A, H = 1.7) {
  const L = { shank: SEG.shank * H, thigh: SEG.thigh * H, trunk: SEG.trunk * H, uarm: SEG.uarm * H, farm: (SEG.farm + SEG.grip) * H };
  const go = (p, a, l) => [p[0] + Math.sin(a * DEG) * l, p[1] + Math.cos(a * DEG) * l];
  const ankle = anchor, knee = go(ankle, A.shank, L.shank), hip = go(knee, A.thigh, L.thigh), shoulder = go(hip, A.trunk, L.trunk);
  const elbow = go(shoulder, A.uarm, L.uarm), hand = go(elbow, A.farm, L.farm);
  const toe = A.foot !== undefined ? go(ankle, A.foot, 0.19) : undefined;
  return { ankle, knee, hip, shoulder, elbow, hand, toe, curve: A.curve, neckDir: A.neck !== undefined ? [Math.sin(A.neck * DEG), Math.cos(A.neck * DEG)] : undefined };
}
