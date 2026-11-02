// Chapter 2: pulling. Pick a pull or a row; the arms and shoulder blades move through the rep
// and each back muscle's origin-to-insertion length is measured on the model, so you can see
// which ones shorten (and so do the work). The readout gives the load you actually move.
// Kinematics (simplified from published shoulder studies; McClure et al., J Shoulder Elbow Surg
// 10:269, 2001, for scapular motion): when the arm goes overhead the shoulder blade turns
// upwards about 40–60° and lifts; pulling down reverses that and the blade tips down and in.
// Rows move the arm in front of the body and squeeze the blades together (retraction).
// Loads:
//  - pull-up / chin-up: all of your body weight hangs from the bar; a loop band takes some off,
//    most at the bottom where it is stretched most (linear spring, illustrative).
//  - lat pulldown and cable row: the cable carries the stack weight (pulley friction ignored).
//  - inverted row: a straight body pivoting on the heels; the share of body weight on the hands
//    is (centre-of-mass height ÷ shoulder height) × cos(body angle), about 0.56 H / 0.818 H × cos
//    (Winter 2009 segment data), so about two thirds of your weight when level.
import { THREE, M, approach, clamp, lerp, smooth } from '../kit.js';
import { makeBack, pullLoad, fitNarrow, compactReadout, inReel, tint, BACK_NAMES, armDir } from '../back.js';

const UP = [0, 1, 0], FWD = [0, 0, 1];
const EX = {
  pullup: { label: 'Pull-up', grip: 'wide grip, palms away', mode: 'hang', pole: UP, a: { e: 165, phi: 15, k: 6, ret: -0.1, elev: 0.75, rot: 38 }, b: { e: 32, phi: 15, k: 112, ret: 0.65, elev: -0.45, rot: 2 } },
  chinup: { label: 'Chin-up', grip: 'shoulder-width, palms towards you', mode: 'hang', pole: UP, a: { e: 168, phi: 78, k: 5, ret: 0, elev: 0.75, rot: 40 }, b: { e: 12, phi: 78, k: 135, ret: 0.45, elev: -0.45, rot: 2 } },
  pulldown: { label: 'Lat pulldown', grip: 'wide bar, seated, thighs under a pad', mode: 'seat', pole: UP, a: { e: 165, phi: 15, k: 6, ret: -0.1, elev: 0.75, rot: 38 }, b: { e: 32, phi: 15, k: 112, ret: 0.65, elev: -0.45, rot: 2 } },
  row: { label: 'Cable row', grip: 'elbows tucked to your sides', mode: 'seat', pole: FWD, a: { e: 82, phi: 90, k: 4, ret: -0.75, elev: 0.05, rot: 12 }, b: { e: -28, phi: 90, k: 100, ret: 1, elev: -0.1, rot: 0 } },
  flared: { label: 'Wide row', grip: 'elbows out wide', mode: 'seat', pole: FWD, a: { e: 82, phi: 90, k: 4, ret: -0.75, elev: 0.05, rot: 12 }, b: { e: 84, phi: -18, k: 92, ret: 1, elev: 0.05, rot: 4 } },
  inverted: { label: 'Inverted row', grip: 'body straight under a low bar', mode: 'invert', pole: FWD, a: { e: 88, phi: 90, k: 4, ret: -0.6, elev: 0, rot: 10 }, b: { e: -22, phi: 90, k: 105, ret: 1, elev: -0.1, rot: 0 } },
};
const SHOW = ['lats', 'teres', 'trapM', 'rhomb', 'trapL', 'delt', 'trapU'];
const NICE = { lats: 'Lats', teres: 'Teres major', trapM: 'Middle trapezius', rhomb: 'Rhomboids', trapL: 'Lower trapezius', delt: 'Rear deltoid', trapU: 'Upper trapezius' };
const lerpPose = (A, B, k) => { const o = {}; for (const key of Object.keys(A)) o[key] = lerp(A[key], B[key], k); return o; };

export default {
  id: 'pulling',
  short: 'Pulling',
  title: 'Pull-ups, pulldowns and rows',
  subtitle: 'Where your elbows travel decides which back muscles shorten and do the work.',
  view: { pos: [-5.5, 16.5, -25], target: [3.0, 14.6, 0] },
  learn: `<p>A muscle works by <b>shortening</b> while it pulls. So to see which back muscles a pull trains, watch which ones get shorter. The model measures each one from end to end as you move.</p>
    <p><b>Pulling down</b> (pull-ups, chin-ups, pulldowns): your arm starts overhead and your elbow sweeps down to your side. That shortens the <b>lats</b> and <b>teres major</b> a lot, and the shoulder blades tip down and in. <b>Pulling back</b> (rows): your elbow travels from in front of you to behind you. With elbows <b>tucked</b>, the lats still shorten and the <b>rhomboids</b> and <b>middle trapezius</b> squeeze the blades together. With elbows <b>out wide</b>, the lats barely change and the <b>rear deltoids</b> and upper back take over. The <b>biceps</b> bends your elbow in every pull (see <a href="/bicepsclear/">BicepsClear</a>).</p>
    <p>The load is different too. In a <b>pull-up</b> you lift <b>all your body weight</b>. A <b>pulldown</b> lets you pick any weight, so it is a good way in. Other ways to build up to a pull-up: a loop <b>band</b> that helps most at the bottom; <b>negatives</b>, where you jump or step to the top and lower yourself slowly, because muscles can lower more than they can lift; and <b>inverted rows</b> under a low bar, where the more upright your body, the less you lift.</p>
    <p>At the top, pull your shoulder blades <b>down and back</b> rather than shrugging up to your ears, and lower all the way under control. Your shoulders get their own box: <a href="/shouldersclear/">ShouldersClear</a>.</p>
    <p class="tip"><b>Try it:</b> pick "Cable row" and then "Wide row" and compare the lats. Then pick "Inverted row" and tilt your body up: watch the load fall.</p>`,
  terms: [
    { t: 'Pull-up', d: 'Hanging from a bar with palms away and pulling your chin over it. You lift your whole body weight.' },
    { t: 'Chin-up', d: 'A pull-up with palms facing you; the biceps helps more.' },
    { t: 'Lat pulldown', d: 'Sitting under a cable and pulling a bar down to your chest. You choose the weight.' },
    { t: 'Row', d: 'Pulling a weight towards your body from in front of you, squeezing the shoulder blades together.' },
    { t: 'Scapular retraction', d: 'Pulling the shoulder blades towards the spine.' },
    { t: 'Negative (eccentric)', d: 'The lowering half of a rep, when the muscle lengthens while it still pulls.' },
  ],
  defaults: { ex: 'pullup', p: 0, auto: true, tempo: 'full', body: 60, band: 0, stack: 40, angle: 20 },
  controls: [
    { key: 'ex', type: 'seg', label: 'Exercise', options: Object.entries(EX).map(([v, e]) => ({ v, label: e.label })), fmt: (v) => EX[v].grip },
    { key: 'auto', type: 'toggle', label: 'Do reps' },
    { key: 'tempo', type: 'seg', label: 'Reps', options: [{ v: 'full', label: 'Up and down' }, { v: 'neg', label: 'Negatives only' }] },
    { key: 'p', type: 'range', label: 'Rep position', min: 0, max: 1, step: 0.01, ends: ['arms long', 'pulled in'], fmt: (v) => Math.round(v * 100) + '%', hint: 'Turn off "Do reps" to hold any point.' },
    { key: 'body', type: 'range', label: 'Body weight', min: 30, max: 120, step: 1, fmt: (v) => Math.round(v) + ' kg' },
    { key: 'band', type: 'range', label: 'Band help at the bottom (pull-ups)', min: 0, max: 40, step: 1, fmt: (v) => (v ? Math.round(v) + ' kg' : 'none') },
    { key: 'stack', type: 'range', label: 'Weight stack (machines)', min: 5, max: 120, step: 5, fmt: (v) => Math.round(v) + ' kg' },
    { key: 'angle', type: 'range', label: 'Body angle (inverted row)', min: 0, max: 60, step: 1, ends: ['level', 'upright'], fmt: (v) => Math.round(v) + '°' },
  ],
  onChange(s, key) { if (key === 'p') s.auto = false; },
  quiz: [
    { q: 'In a pull-up, how much weight do your arms and back lift?', options: ['About half your body weight', 'All of your body weight', 'Only the weight of your arms', 'None, the bar does it'], answer: 1, why: 'You hang from your hands, so your whole body weight is lifted. A band or a pulldown lets you lift less.' },
    { q: 'You row with your elbows out wide instead of tucked in. What changes?', options: ['The lats do more', 'The lats barely shorten, so the rear shoulders and upper back do more', 'Nothing changes', 'Only the biceps work'], answer: 1, why: 'The lats pull the arm down and back towards the hip. With elbows wide, the arm moves sideways and back, so the rear deltoids, rhomboids and middle trapezius take over.' },
    { q: 'How does an inverted row get easier?', options: ['Make your body more upright', 'Make your body more level', 'Hold the bar wider', 'Bend your elbows less'], answer: 0, why: 'The more upright you are, the more of your weight rests on your heels: the share on your hands falls with the cosine of the angle.' },
  ],
  reel: [
    { ms: 5600, caption: 'In a pull-up you lift your whole body: the lats sweep your elbows down to your sides.', set: { ex: 'pullup', auto: false, p: 0, body: 60, band: 0, tempo: 'full' }, anim: { p: [0, 1] }, view: { pos: [-2.9, 15.8, -7.1], target: [0.4, 15.6, 0.0] }, spin: 0.3 },
    { ms: 5400, caption: 'Rows pull your elbows back and squeeze your shoulder blades together.', set: { ex: 'row', auto: false, p: 0, stack: 40 }, anim: { p: [0, 1] }, view: { pos: [-3.3, 13.5, -5.7], target: [0.4, 12.4, 1.0] }, spin: 0.35 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const fig = new THREE.Group(); root.add(fig);
    const body = makeBack(stage, { labels: false });
    fig.add(body.root);
    const steel = M.metal(0xb9bec8), dark = M.matte(0x2a2f3a), pad = M.matte(0x3a3f4c);
    // pull-up bar on two posts
    const rig = new THREE.Group(); root.add(rig);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 9, 16), steel); bar.rotation.z = Math.PI / 2; rig.add(bar);
    for (const x of [-4.4, 4.4]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 22, 12), dark); post.position.set(x, -11, 0); bar.parent.add(post); post.userData.post = true; }
    // machine: seat, cable, pulley, weight stack (in front of the person)
    const mach = new THREE.Group(); root.add(mach);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 3.6), pad); seat.position.set(0, 7.9, 0.9); mach.add(seat);
    const seatLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.6, 0.5), dark); seatLeg.position.set(0, 3.8, 0.9); mach.add(seatLeg);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 6.4, 12), steel); handle.rotation.z = Math.PI / 2; mach.add(handle);
    const stackG = new THREE.Group(); mach.add(stackG);
    const plates = [];
    const pink = M.matte(0xff6b9a), dark2 = M.matte(0x343a48);
    for (let i = 0; i < 24; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.32, 1.2), i % 2 ? dark : dark2); pl.position.set(0, 0.2 + i * 0.36, 0); pl.userData.base = pl.material; stackG.add(pl); plates.push(pl); }
    const cableMat = new THREE.LineBasicMaterial({ color: 0xe8eef8 });
    const cableGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    const cable = new THREE.Line(cableGeo, cableMat); mach.add(cable);
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 8, 24), steel); mach.add(pulley);
    const floorPad = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 2), pad); floorPad.position.set(0, 0.1, 0); root.add(floorPad);

    const lens0 = {};
    const loadL = tint(stage.label('', [0, 0, 0], root), 'gold');
    const fit = fitNarrow(stage, { pos: [-2.5, 14.6, -15], target: [0.4, 13.6, 0] });
    let ex = null, p = 0, phase = 0, dir = 1, topHang = 0, topInv = null;

    const poseAt = (E, k) => { const q = lerpPose(E.a, E.b, k); return { ...q, pole: E.pole }; };

    function setup(key) {
      ex = key; const E = EX[key];
      body.pose(poseAt(E, 0));
      for (const k of SHOW) lens0[k] = body.length(k);
      topHang = body.hand(1).y;
      body.pose(poseAt(E, 1)); topInv = body.hand(1).clone();
      const hang = E.mode === 'hang', seatM = E.mode === 'seat', inv = E.mode === 'invert';
      body.legs.visible = !seatM;
      rig.visible = hang || inv; mach.visible = seatM; floorPad.visible = inv;
      rig.children.forEach((c) => { if (c.userData.post) c.visible = hang; });
      if (!inReel() && !stage.moved) {
        if (inv) stage.setView([-24, 8, -1], [2.5, 6.0, -6], 1.0);
        else if (seatM) stage.setView([-6.5, 15.0, -20], [3.0, 12.8, 2], 1.0);
        else stage.setView([-5.5, 16.5, -25], [3.0, 14.6, 0], 1.0);
      }
    }

    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        if (s.ex !== ex) setup(s.ex);
        const E = EX[s.ex];
        // rep timing: about 1.2 s up, 1.8 s down; negatives jump to the top then lower over 4 s
        if (s.auto && !inReel()) {
          if (s.tempo === 'neg') { phase += dt; const T = 5; const u = (phase % T) / T; p = u < 0.12 ? smooth(u / 0.12) : 1 - smooth((u - 0.12) / 0.8); dir = u < 0.12 ? 1 : -1; if (u > 0.92) p = 0; }
          else { phase += dt; const T = 3.6, u = (phase % T) / T; p = u < 0.38 ? smooth(u / 0.38) : u < 0.45 ? 1 : 1 - smooth((u - 0.45) / 0.5); dir = u < 0.45 ? 1 : -1; if (u > 0.95) p = 0; }
          s.p = p;
        } else { const np = approach(p, s.p, 8, dt); dir = np >= p ? 1 : -1; p = np; }
        body.pose(poseAt(E, p));
        // which muscles shorten: glow by how much shorter than at the start of the rep
        const d = {}; for (const k of SHOW) d[k] = (body.length(k) - lens0[k]) / lens0[k];
        body.glow((e) => (d[e.k] === undefined ? (e.k === 'erector' || e.k === 'multi' ? 0.08 : 0) : clamp(-d[e.k] / 0.25, 0, 1)));
        // place the body / equipment
        const hL = body.hand(1), hR = body.hand(-1), mid = hL.clone().add(hR).multiplyScalar(0.5);
        fig.rotation.set(0, 0, 0); fig.position.set(0, 0, 0);
        if (E.mode === 'hang') {
          // the bar stays put and the body rises: bar 1 unit above the hands at the start
          const barY = topHang + 0.6;
          fig.position.y = barY - mid.y;
          rig.position.set(0, barY, mid.z);
        } else if (E.mode === 'invert') {
          // lying back under a low bar, heels on the floor; the body turns about the heels so the
          // hands stay on the bar. s.angle is the body's angle above level at the top of the rep.
          const top = topInv;
          const a0 = -(90 - s.angle) * Math.PI / 180;
          const Yb = top.y * Math.cos(a0) - top.z * Math.sin(a0), Zb = top.y * Math.sin(a0) + top.z * Math.cos(a0);
          // solve the angle that puts these hands at the bar height, then slide the heels to match
          let lo = -Math.PI / 2, hi = 0; const f = (a) => mid.y * Math.cos(a) - mid.z * Math.sin(a) - Yb;
          for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if ((f(m) > 0) === (f(hi) > 0)) hi = m; else lo = m; }
          const a = (lo + hi) / 2;
          fig.rotation.x = a; fig.position.z = Zb - (mid.y * Math.sin(a) + mid.z * Math.cos(a));
          rig.position.set(0, Yb, Zb);
          s._ang = 90 + a * 180 / Math.PI;
        } else {
          handle.position.copy(mid);
          handle.scale.y = E === EX.row || E === EX.flared ? Math.max(0.5, Math.abs(hL.x - hR.x) / 6.4 + 0.05) : 1;
          const kg = s.stack, n = clamp(Math.round(kg / 5), 1, 24);
          // the selected plates (taken from the top of the stack) rise as the cable is pulled
          const lift = p * 3.2;
          if (E.pole === UP) {
            stackG.position.set(0, 0, 7.5);
            pulley.position.set(0, 22.5, 1.5); pulley.rotation.set(0, Math.PI / 2, 0);
            const pts = [mid, new THREE.Vector3(0, 22.5, mid.z), new THREE.Vector3(0, 22.5, 7.5), new THREE.Vector3(0, 0.4 + 24 * 0.36 + lift, 7.5)];
            cableGeo.setFromPoints(pts);
          } else {
            stackG.position.set(0, 0, 9.5);
            pulley.position.set(0, mid.y, 9.0); pulley.rotation.set(0, Math.PI / 2, 0);
            const pts = [mid, new THREE.Vector3(0, hL.y, 9.0), new THREE.Vector3(0, 12, 9.0), new THREE.Vector3(0, 0.4 + 24 * 0.36 + lift, 9.5)];
            cableGeo.setFromPoints(pts);
          }
          plates.forEach((pl, i) => { const on = i >= 24 - n; pl.position.y = 0.2 + i * 0.36 + (on ? lift : 0); pl.material = on ? pink : pl.userData.base; });
        }
        const L = pullLoad(s.ex, { body: s.body, band: s.band, stack: s.stack, angle: s._ang ?? s.angle, p });
        loadL.element.innerHTML = `${Math.round(L.kg)} kg`;
        const wp = mid.clone(); fig.localToWorld(wp);
        loadL.position.set(wp.x - 3.2, wp.y + 1.2, wp.z);
        const narrow = fit();
        loadL.visible = !inReel() && !narrow;
        s._d = d; s._p = p; s._dir = dir;
      },
      readout: (s) => {
        const E = EX[s.ex], L = pullLoad(s.ex, { body: s.body, band: s.band, stack: s.stack, angle: s._ang ?? s.angle, p: s._p ?? s.p });
        const d = s._d || {};
        const top = SHOW.filter((k) => d[k] !== undefined).sort((a, b) => d[a] - d[b]).slice(0, 3);
        const pct = (k) => `${d[k] > 0 ? '+' : '−'}${Math.abs(Math.round(d[k] * 100))}%`;
        const share = Math.round((L.kg / s.body) * 100);
        const going = (s._dir ?? 1) > 0 ? 'pulling: the working muscles shorten' : 'lowering: they lengthen while still pulling';
        return `<div class="big">${E.label}: ${Math.round(L.kg)} kg</div>
          <div class="row"><span>Load</span><b>${E.mode === 'seat' ? `${s.stack} kg stack (${share}% of you)` : `${share}% of your ${Math.round(s.body)} kg`}</b></div>
          ${s.ex === 'pullup' || s.ex === 'chinup' ? `<div class="row"><span>Band helps</span><b>${s.band ? Math.round(L.help) + ' kg here' : 'no band'}</b></div>` : ''}
          ${s.ex === 'inverted' ? `<div class="row"><span>Body angle</span><b>${Math.round(s._ang ?? s.angle)}° above level</b></div>` : ''}
          ${top.map((k) => `<div class="row"><span>${NICE[k]}</span><b>${pct(k)} length</b></div>`).join('')}
          <small>${s.auto ? going.charAt(0).toUpperCase() + going.slice(1) + '.' : 'Glowing muscles are shorter than at the start of the rep.'} Lengths are end to end on the model.</small>`;
      },
      dispose() { stage.controls.autoRotate = false; },
    });
  },
};
void armDir; void BACK_NAMES;
