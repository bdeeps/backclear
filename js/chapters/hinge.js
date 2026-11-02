// Chapter 3: the hip hinge and the spine. A side-on lifter does a deadlift, Romanian deadlift,
// good morning or back extension. We work out the turning effect (moment) about the lowest
// lumbar disc (L5/S1) from the horizontal distances of the bar and of the upper body, the pull
// the back extensor muscles need on their short lever, and the squeeze on the disc.
// Model (see back.js for constants and sources):
//  - segment lengths from Winter (2009); mass above L5/S1 = 60% of body mass, centre of mass
//    25 cm up the trunk (as SkeletonClear); extensor lever arm 5.5 cm (McGill 2016; Cholewicki
//    et al. 1991 used 6 cm);
//  - M = g (m_upper × d_upper + m_bar × d_bar); extensor pull = M / 0.055 m;
//    disc squeeze ≈ extensor pull + the weight pressing along the spine;
//  - a static model: it ignores speed, the abdominal muscles (which co-contract and add
//    squeeze) and pressure in the belly. Real estimates for elite powerlifters reach about
//    17,000 N at L4/L5 and moments near 1,000 N·m (Cholewicki, McGill & Norman, Med Sci Sports
//    Exerc 23:1179, 1991).
// Rounded back: at full forward bend the erector spinae can fall electrically quiet and the
// stretched ligaments and the back of the discs take the moment instead: "flexion-relaxation"
// (Floyd & Silver, J Physiol 129:184, 1955; McGill 2016). We show that as a shift in colour,
// not a number. A 2020 systematic review found no clear evidence that bending the lumbar spine
// while lifting is linked to low back pain (Saraceni et al., J Orthop Sports Phys Ther 50:121).
// Bracing: holding the breath and tightening the trunk raises pressure in the belly and stiffens
// the trunk; it also drives blood pressure very high for a moment: MacDougall et al. (J Appl
// Physiol 58:785, 1985) measured a mean of 320/250 mmHg in a heavy double-leg press, over
// 480/350 in one person.
import { THREE, M, approach, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { makeSide, hingePose, hingeLoads, HINGE, LIFTERS, fitNarrow, compactReadout, inReel, tint, board, panel, g0 } from '../back.js';

const U = 10;
const EXL = { deadlift: 'Deadlift', rdl: 'Romanian deadlift', goodmorning: 'Good morning', backext: 'Back extension' };

function drawChart(g, w, h, st) {
  panel(g, w, h);
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('Lower-back moment through one lift', 26, 46);
  const L = 92, R = w - 30, T = 82, B = h - 70, max = st.max;
  const X = (p) => L + p * (R - L), Y = (v) => B - (v / max) * (B - T);
  g.font = '22px sans-serif';
  const step = max > 600 ? 200 : max > 300 ? 100 : 50;
  for (let v = 0; v <= max + 1; v += step) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(String(v), 22, Y(v) + 7); }
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('N·m', 22, T - 14);
  g.fillText('bottom', L, h - 30); g.fillText('standing', R - 96, h - 30);
  const line = (arr, col, wd, dash) => { g.strokeStyle = col; g.lineWidth = wd; g.setLineDash(dash || []); g.beginPath(); arr.forEach((v, i) => { const x = X(i / (arr.length - 1)), y = Y(v); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]); };
  line(st.close, '#6ee7a8', 5, [12, 10]);
  if (st.drift > 0.005) line(st.mine, '#ffb070', 6);
  const v = st.now, x = X(st.p);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, Y(v), 11, 0, 7); g.fill();
  g.font = 'bold 22px sans-serif';
  g.fillStyle = '#6ee7a8'; g.fillText('bar touching the legs', L + 10, T + 20);
  if (st.drift > 0.005) { g.fillStyle = '#ffb070'; g.fillText(`bar ${Math.round(st.drift * 100)} cm further out`, L + 300, T + 20); }
}

export default {
  id: 'hinge',
  short: 'The hinge',
  title: 'The hip hinge and the spine',
  subtitle: 'A deadlift is a lever: keep the bar close and the load on your lower back falls.',
  view: { pos: [-1.0, 9.0, 27], target: [-1.6, 7.6, 0] },
  learn: `<p>Bend forward from your hips with a fairly straight back and you are doing a <b>hip hinge</b>: the move behind the <b>deadlift</b>, the <b>Romanian deadlift</b>, the <b>good morning</b> and lifting a bucket of water off the floor. Your <b>glutes</b> and <b>hamstrings</b> swing your hips, and your <b>erector spinae</b> hold your spine still against the weight.</p>
    <p>Your spine works like a lever (see <a href="/torqueclear/">TorqueClear</a>). The pivot is the lowest disc, <b>L5/S1</b>. The weight of your upper body and the bar try to fold you forward, and the turning effect, or <b>moment</b>, is each weight × its <b>horizontal distance</b> from that disc. The back muscles pull only about <b>5.5 cm</b> behind the disc, so they must pull <b>many times</b> the weight: lifting a 100 kg bar, the model's 60 kg person needs about 7 kN from them, and the disc is squeezed by about 8 kN. Spines adapt to this: estimates for top powerlifters reach about 17 kN.</p>
    <p>That is why coaches say <b>keep the bar close</b>. Let it drift 15 cm forward and the moment jumps by about a third, and your balance tips towards your toes. Coaches also teach a <b>neutral spine</b>: the natural curves held still, not arched hard and not rounded. When the lower back <b>rounds</b> fully, the back muscles can switch off and stretched <b>ligaments</b> and the back of the <b>discs</b> take the load instead. Rounding a little when you pick something up is normal, and a 2020 review found no clear link between bending the back while lifting and back pain. For heavy, repeated lifts, a braced neutral spine keeps the load on muscles you can train.</p>
    <p><b>Bracing</b> means a big breath into your belly and tightening your trunk all round, which stiffens it. Holding your breath this way sends blood pressure very high for a moment, so if you have high blood pressure or a heart condition, ask a doctor first and breathe out through the hard part. <b>Back extensions</b> train the same muscles with only your upper body as the weight.</p>
    <p class="tip"><b>Try it:</b> push "Bar drift" out to 20 cm and watch the moment curve rise. Then switch the spine to "Rounded" and see the load shift from muscle to ligament.</p>`,
  terms: [
    { t: 'Hip hinge', d: 'Bending forward by folding at the hips while the spine stays fairly straight.' },
    { t: 'Moment (torque)', d: 'The turning effect of a force: force × its distance from the pivot.' },
    { t: 'L5/S1', d: 'The disc between the last lumbar vertebra and the sacrum, the pivot of a lift.' },
    { t: 'Neutral spine', d: 'Your spine with its natural curves, neither rounded nor arched hard.' },
    { t: 'Bracing', d: 'Breathing in and tightening the muscles all round your trunk to stiffen it before a lift.' },
    { t: 'Erector spinae', d: 'The long muscles beside the spine that straighten it and hold it still.' },
  ],
  defaults: { ex: 'deadlift', p: 0, auto: true, bar: 60, body: 60, drift: 0, spine: 'neutral', brace: true },
  onChange(s, key) {
    if (key === 'p') s.auto = false;
    if (key === 'ex') { if (s.ex === 'goodmorning') s.bar = Math.min(s.bar, 30); if (s.ex === 'backext') { s.bar = 0; } else if (s.bar < 20) s.bar = 20; }
  },
  controls: [
    { key: 'ex', type: 'seg', label: 'Exercise', options: Object.entries(EXL).map(([v, label]) => ({ v, label })) },
    { key: 'auto', type: 'toggle', label: 'Do reps' },
    { key: 'p', type: 'range', label: 'Position in the lift', min: 0, max: 1, step: 0.01, ends: ['bottom', 'standing'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'bar', type: 'range', label: 'Weight (bar and plates, or a plate held for back extensions)', min: 0, max: 200, step: 5, fmt: (v) => Math.round(v) + ' kg' },
    { key: 'body', type: 'range', label: 'Body weight', min: 35, max: 120, step: 1, fmt: (v) => Math.round(v) + ' kg' },
    { key: 'drift', type: 'range', label: 'Bar drift away from the legs', min: 0, max: 0.3, step: 0.01, ends: ['touching', '30 cm'], fmt: (v) => Math.round(v * 100) + ' cm' },
    { key: 'spine', type: 'seg', label: 'Lower back', options: [{ v: 'neutral', label: 'Neutral' }, { v: 'rounded', label: 'Rounded' }] },
    { key: 'brace', type: 'toggle', label: 'Brace (breath in, trunk tight)' },
  ],
  quiz: [
    { q: 'Why does letting the bar drift away from your legs make a deadlift harder on your back?', options: ['The bar gets heavier', 'Its horizontal distance from the lower back grows, so the moment grows', 'Your legs stop working', 'It doesn’t'], answer: 1, why: 'Moment = weight × horizontal distance from the pivot (the L5/S1 disc). More distance, more turning effect for the back muscles to resist.' },
    { q: 'The back extensor muscles pull about 5.5 cm behind the disc. What does that mean?', options: ['They need only a small force', 'They must pull many times the weight being lifted', 'They don’t matter', 'The disc does all the work'], answer: 1, why: 'A short lever arm means a big force: a 400 N·m moment ÷ 0.055 m needs over 7,000 N.' },
    { q: 'What does good evidence say about rounding your back when you pick things up?', options: ['It always causes injury', 'A 2020 review found no clear link with back pain; neutral and braced is still taught for heavy lifts', 'It makes you stronger', 'You must never bend'], answer: 1, why: 'Saraceni and colleagues (2020) found no clear evidence that lumbar bending while lifting is linked to back pain. Coaches still teach a braced neutral spine for heavy, repeated lifts to keep the load on trained muscles.' },
  ],
  reel: [
    { ms: 5600, caption: 'A deadlift is a lever: weight times its distance from your lowest disc.', set: { ex: 'deadlift', auto: false, p: 0, bar: 100, body: 60, drift: 0, spine: 'neutral', brace: true }, anim: { p: [0, 1] }, view: { pos: [1.7, 9.0, 11.5], target: [1.2, 8.6, 0.0] }, spin: 0 },
    { ms: 5400, caption: 'Let the bar drift 20 cm forward and the load on your lower back rises by half.', set: { ex: 'deadlift', auto: false, p: 0.15, bar: 100, drift: 0 }, anim: { drift: [0, 0.2] }, view: { pos: [1.7, 7.9, 8.8], target: [1.2, 7.5, 0.0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const fig = makeSide(stage);
    root.add(fig.root);
    // back-extension bench (a pad under the hips and one behind the ankles)
    const bench = new THREE.Group(); root.add(bench);
    const padM = M.matte(0x3a3f4c), dark = M.matte(0x2a2f3a);
    const hipPad = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 4), padM); hipPad.position.set(0.1, 8.45, 0); bench.add(hipPad);
    const footPad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 4, 16), padM); footPad.rotation.x = Math.PI / 2; footPad.position.set(-8.3, 9.6, 0); bench.add(footPad);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 1.2), dark); frame.position.set(-4, 7.8, 0); bench.add(frame);
    for (const x of [-8, 0]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.8, 0.5), dark); leg.position.set(x, 3.9, 0); bench.add(leg); }
    // markers and dimension lines
    const l5Dot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 12), M.glow(0x8ef0ff)); root.add(l5Dot);
    const comDot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 12), M.glow(0xffd166)); root.add(comDot);
    const mkLine = (col, dashed) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const m = dashed ? new THREE.LineDashedMaterial({ color: col, dashSize: 0.3, gapSize: 0.2 }) : new THREE.LineBasicMaterial({ color: col }); const l = new THREE.Line(g, m); root.add(l); return l; };
    const setLine = (l, a, b) => { l.geometry.setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); l.computeLineDistances?.(); };
    const vL5 = mkLine(0x8ef0ff, true), vBar = mkLine(0xffb070, true), dimBar = mkLine(0xffb070), vCom = mkLine(0xffd166, true), dimCom = mkLine(0xffd166);
    const lab = {
      l5: tint(stage.label('L5/S1', [0, 0, 0], root), 'cyan'),
      bar: tint(stage.label('', [0, 0, 0], root), 'orange'),
      com: tint(stage.label('', [0, 0, 0], root), 'gold'),
      erc: tint(stage.label('Erector spinae', [0, 0, 0], root), 'red'),
      tip: tint(stage.label('', [0, 0, 0], root), 'orange'),
    };
    // chart board
    const st = { close: [], mine: [], now: 0, p: 0, max: 600, drift: 0 };
    const chart = canvasTexture(900, 520, (g, w, h) => drawChart(g, w, h, st));
    const bd = board(chart, 8.6, 5.0); bd.position.set(7.6, 12.2, -3); bd.rotation.y = -0.2; root.add(bd);
    const fit = fitNarrow(stage, { pos: [1.0, 7.8, 19], target: [1.0, 6.6, 0] });
    let p = 0, phase = 0, key = '', curve = 0.15, lastDraw = -1;

    const curves = (s) => {
      const k = `${s.ex}|${s.bar}|${s.body}|${s.drift}|${s.spine}`;
      if (k === key) return; key = k;
      st.close = []; st.mine = [];
      for (let i = 0; i <= 40; i++) {
        const q = i / 40;
        st.close.push(hingeLoads(hingePose(s.ex, q, 0), s.body, s.bar).M);
        st.mine.push(hingeLoads(hingePose(s.ex, q, s.drift), s.body, s.bar).M);
      }
      const mx = Math.max(...st.close, ...st.mine, 50);
      st.max = mx > 900 ? 1200 : mx > 600 ? 900 : mx > 400 ? 600 : mx > 200 ? 400 : 200;
      st.drift = s.ex === 'deadlift' || s.ex === 'rdl' ? s.drift : 0;
      lastDraw = -1;
    };

    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        if (s.auto && !inReel()) { phase += dt; const T = 4.4, u = (phase % T) / T; p = u < 0.38 ? smooth(u / 0.38) : u < 0.5 ? 1 : u < 0.88 ? 1 - smooth((u - 0.5) / 0.38) : 0; s.p = p; }
        else p = approach(p, s.p, 8, dt);
        const drift = s.ex === 'deadlift' || s.ex === 'rdl' ? s.drift : 0;
        const P = hingePose(s.ex, p, drift, 1.7, s.spine === 'rounded');
        const R = hingeLoads(P, s.body, s.bar);
        curve = approach(curve, s.spine === 'rounded' ? -0.55 : 0.15, 6, dt);
        // arms: straight to the bar, hands on the bar on the upper back, or crossed on the chest
        let elbow, hand;
        const sh = P.shoulder;
        if (s.ex === 'goodmorning') { const t = P.theta * Math.PI / 180; elbow = [sh[0] - 0.22 * Math.cos(t) - 0.12 * Math.sin(t), sh[1] + 0.22 * Math.sin(t) - 0.12 * Math.cos(t)]; hand = [P.bar[0] - 0.02, P.bar[1] + 0.03]; }
        else if (s.ex === 'backext') { const t = P.theta * Math.PI / 180, d = [Math.sin(t), Math.cos(t)], f = [Math.cos(t), -Math.sin(t)]; elbow = [sh[0] + f[0] * 0.2 - d[0] * 0.1, sh[1] + f[1] * 0.2 - d[1] * 0.1]; hand = [sh[0] + f[0] * 0.12 - d[0] * 0.02, sh[1] + f[1] * 0.12 - d[1] * 0.02]; }
        else { hand = P.bar; elbow = [lerp(sh[0], hand[0], 0.5), lerp(sh[1], hand[1], 0.5)]; }
        const toe = P.lying ? [P.ankle[0] - 0.05, P.ankle[1] - 0.19] : undefined;
        fig.set({ ankle: P.ankle, knee: P.knee, hip: P.hip, shoulder: sh, elbow, hand, bar: s.ex === 'backext' ? null : P.bar, curve, l5: P.l5, toe });
        fig.setPlates(s.bar);
        fig.bar.visible = s.ex !== 'backext';
        bench.visible = s.ex === 'backext';
        // colours: erectors glow with their pull; rounded hands the load to ligaments
        const work = clamp(R.F / 12000, 0, 1), round = clamp((0.15 - curve) / 0.7, 0, 1);
        fig.ercMat.emissiveIntensity = 0.12 + 1.1 * work * (1 - 0.75 * round);
        fig.ligMat.emissive.setHex(0xffb070); fig.ligMat.emissiveIntensity = 0.05 + 1.4 * round * clamp(R.M / 300, 0.2, 1);
        fig.braceMat.opacity = approach(fig.braceMat.opacity, s.brace ? 0.22 : 0, 6, dt);
        fig.discs[0].material.emissiveIntensity = 0.3 + clamp(R.comp / 10000, 0, 1.2);
        // markers and lines (metres → model units)
        const m3 = (q, z = 1.6) => [q[0] * U, q[1] * U, z];
        l5Dot.position.set(...m3(P.l5, 0.9)); comDot.position.set(...m3(P.com, 0.9));
        const yF = P.lying ? 6.2 : 0.25;
        setLine(vL5, m3(P.l5), m3([P.l5[0], yF / U]));
        setLine(vCom, m3(P.com), m3([P.com[0], (yF + 0.9) / U]));
        setLine(dimCom, m3([P.l5[0], (yF + 0.9) / U]), m3([P.com[0], (yF + 0.9) / U]));
        const showBar = !!P.bar || s.ex === 'backext';
        vBar.visible = dimBar.visible = showBar && s.bar > 0;
        const bx = P.bar ? P.bar : [P.l5[0] + R.dB, P.l5[1]];
        if (vBar.visible) { setLine(vBar, m3(bx), m3([bx[0], yF / U])); setLine(dimBar, m3([P.l5[0], yF / U]), m3([bx[0], yF / U])); }
        const narrow = fit();
        const labs = !inReel();
        lab.l5.position.set(P.l5[0] * U - 1.6, P.l5[1] * U - 0.6, 1.2);
        lab.bar.element.textContent = `bar ${Math.round(R.dB * 100)} cm`; lab.bar.position.set((P.l5[0] + bx[0]) * U / 2, yF - 0.55, 1.6);
        lab.com.element.textContent = `upper body ${Math.round(R.dU * 100)} cm`; lab.com.position.set((P.l5[0] + P.com[0]) * U / 2, yF + 1.45, 1.6);
        const ep = fig.erc.mid; lab.erc.position.set(ep.x - 2.2, ep.y + 0.9, 1.2);
        lab.tip.element.textContent = R.over === 'toes' ? 'tipping onto your toes' : '';
        lab.tip.position.set(2.2, -0.2, 2);
        Object.values(lab).forEach((l) => { l.visible = labs; });
        lab.bar.visible = labs && vBar.visible; lab.tip.visible = labs && R.over === 'toes'; lab.erc.visible = labs && !narrow;
        bd.visible = !narrow;
        // chart
        curves(s); st.p = p; st.now = R.M;
        if (Math.abs(p - lastDraw) > 0.01) { chart.redraw(); lastDraw = p; }
        s._R = R; s._P = P;
      },
      readout: (s) => {
        const R = s._R, P = s._P; if (!R) return '';
        const kgf = (N) => Math.round(N / g0);
        const bal = { mid: 'over the middle of the foot', front: 'towards the toes', toes: 'past the toes: you would tip', back: 'towards the heels', heels: 'past the heels' }[R.over];
        return `<div class="big">${Math.round(R.M)} N·m on your lower back</div>
          <div class="row"><span>${s.ex === 'backext' ? 'Plate' : 'Bar'} from L5/S1</span><b>${s.bar > 0 ? Math.round(R.dB * 100) + ' cm ahead' : 'no weight'}</b></div>
          <div class="row"><span>Upper body (${Math.round(R.mU)} kg)</span><b>${Math.round(R.dU * 100)} cm ahead</b></div>
          <div class="row"><span>Back muscles pull</span><b>${(R.F / 1000).toFixed(1)} kN (${kgf(R.F)} kg-force)</b></div>
          <div class="row"><span>Disc squeezed by</span><b>${(R.comp / 1000).toFixed(1)} kN, ${(R.comp / (s.body * g0)).toFixed(1)}× body weight</b></div>
          ${P.lying ? '' : `<div class="row"><span>Balance</span><b>${bal}</b></div>`}
          <div class="row"><span>Load held by</span><b>${s.spine === 'rounded' ? 'more ligament and disc' : 'mostly muscle'}</b></div>
          <small>A simple static model, 1.70 m person. Estimates for elite lifters reach about ${(LIFTERS.comp / 1000).toFixed(0)} kN (Cholewicki et al. 1991).</small>`;
      },
    });
  },
};
void HINGE;
