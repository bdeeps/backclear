// Chapter 4: training the back. Growth in brief (BicepsClear goes deep), how much and how hard,
// form cues, protein, and posture myths. The figure sits in a chair in the posture you pick,
// and a board shows the shared, clearly labelled illustrative model of strength and size.
// Evidence used (state honestly):
//  - WHO 2020 guidelines and NHS: muscle-strengthening activities for all major muscle groups,
//    including the back, on at least 2 days a week; NHS: work "to the point where you need a
//    short rest before repeating" (nhs.uk, physical activity guidelines for adults 19–64).
//  - Volume: Schoenfeld, Ogborn & Krieger, J Sports Sci 2017 (online 2016), meta-analysis: more
//    weekly sets, more growth (each extra weekly set linked to a small extra gain); the 10+ sets
//    per muscle group category did best, but that comparison was only a trend (P = 0.074) and few
//    studies went above 10 sets.
//  - Load: Schoenfeld, Grgic, Ogborn & Krieger, J Strength Cond Res 31:3508, 2017: low loads
//    (≤60% of 1RM) and high loads (>60%) gave similar growth when sets went to failure; heavy
//    loads gave more 1RM strength.
//  - After a hard session muscle protein synthesis was about doubled at 24 h (+109%) and nearly
//    back to normal by about 36 h (MacDougall et al., Can J Appl Physiol 20:480, 1995; 6 men).
//  - Protein: ICMR-NIN Dietary Guidelines for Indians (2024) give 0.83 g per kg body weight per
//    day for healthy adults and advise against protein powders for healthy people. (Read from
//    news reports of the guidelines, not the PDF itself.)
//  - Posture: "Sit up straight": time to re-evaluate (Slater, Korakakis, O'Sullivan et al.,
//    J Orthop Sports Phys Ther 49:562, 2019): no single "correct" posture prevents back pain;
//    varying position and staying active matter more.
// The growth curves are an ILLUSTRATION with made-up round constants, not a prediction:
//  strength = neural gain 12% × (1 − e^(−w/3)) + 1.2 × size
//  size = 20% × dose × effort × (1 − e^(−(w−2)/16)), dose = 1 − e^(−sets/8), effort falls off
//  when sets stop well short of failure.
import { THREE, M, approach, clamp, canvasTexture } from '../kit.js';
import { makeSide, chain, fitNarrow, compactReadout, inReel, tint, board, panel } from '../back.js';

export function growth(weeks, sets, rir) {
  const dose = 1 - Math.exp(-sets / 8);
  const eff = rir <= 3 ? 1 - 0.05 * rir : Math.max(0.3, 0.85 - 0.2 * (rir - 3));
  const size = 20 * dose * eff * (1 - Math.exp(-Math.max(0, weeks - 2) / 16));
  const neural = sets > 0 ? 12 * (1 - Math.exp(-weeks / 3)) * Math.min(1, sets / 4) : 0;
  return { size, strength: neural + 1.2 * size, neural, dose, eff };
}

const POSTURES = {
  tall: { label: 'Sitting up tall', A: { shank: 0, thigh: -90, trunk: 2, uarm: 165, farm: 100, curve: 0.25, neck: 4 } },
  slump: { label: 'Slumped', A: { shank: 0, thigh: -90, trunk: -6, uarm: 160, farm: 95, curve: -0.6, neck: 32 } },
  lean: { label: 'Leaning back', A: { shank: 8, thigh: -90, trunk: -22, uarm: 175, farm: 80, curve: 0.0, neck: 10 } },
  move: { label: 'Changing often', A: null },
};

function drawGrowth(g, w, h, st) {
  panel(g, w, h);
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('Training the back for 24 weeks', 26, 46);
  g.fillStyle = 'rgba(255,209,102,.95)'; g.font = 'bold 21px sans-serif'; g.fillText('ILLUSTRATION, not a prediction: real gains vary a lot', 26, 78);
  const L = 80, R = w - 30, T = 104, B = h - 66, max = 40;
  const X = (wk) => L + (wk / 24) * (R - L), Y = (v) => B - (v / max) * (B - T);
  g.font = '21px sans-serif';
  for (let v = 0; v <= max; v += 10) { g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(`+${v}%`, 14, Y(v) + 7); }
  for (let k = 0; k <= 24; k += 4) g.fillText(String(k), X(k) - 8, h - 36);
  g.fillText('weeks', R - 66, h - 12);
  const line = (fn, col) => { g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 96; i++) { const wk = (i / 96) * 24, v = fn(wk); i ? g.lineTo(X(wk), Y(v)) : g.moveTo(X(wk), Y(v)); } g.stroke(); };
  line((wk) => growth(wk, st.sets, st.rir).strength, '#8ef0ff');
  line((wk) => growth(wk, st.sets, st.rir).size, '#ff8a8a');
  const now = growth(st.weeks, st.sets, st.rir);
  for (const [v, c] of [[now.strength, '#8ef0ff'], [now.size, '#ff8a8a']]) { g.fillStyle = c; g.beginPath(); g.arc(X(st.weeks), Y(v), 10, 0, 7); g.fill(); }
  g.font = 'bold 22px sans-serif';
  g.fillStyle = '#8ef0ff'; g.fillText('strength (nerves learn first)', L + 10, T + 26);
  g.fillStyle = '#ff8a8a'; g.fillText('muscle size (slower)', L + 10, T + 54);
}

export default {
  id: 'training',
  short: 'Training it',
  title: 'How a back grows, and how to train it',
  subtitle: 'Hard sets, enough of them, a little more over time, food and sleep. And the posture myths.',
  view: { pos: [0.5, 10.0, 28], target: [0.2, 9.0, 0] },
  learn: `<p><b>How it grows, in brief.</b> When a set is hard, your nervous system calls up more and bigger muscle fibres, and the pull on them (<b>mechanical tension</b>) is the main signal to grow. For a day or two afterwards the muscle builds new protein faster: one study found it doubled at 24 hours and nearly back to normal by about 36. Over <b>weeks</b>, fibres get thicker. Your first gains in strength come mostly from your <b>nerves</b> learning the move; visible size takes weeks to months. <a href="/bicepsclear/">BicepsClear</a> goes deep on all of this.</p>
    <p><b>How much and how hard.</b> WHO and the NHS say: work all the big muscle groups, back included, on <b>at least 2 days a week</b>. For growth, sets should end <b>close to failure</b>, with only about 0 to 3 more reps left in you. Light weights (lots of reps) and heavy ones (few reps) build similar size if the sets are that hard; heavy ones build more top strength. More weekly sets bring more growth, with about <b>10 or more hard sets per muscle a week</b> doing best in a 2017 review, though that evidence is thinner above 10. Add a rep or a little weight when it gets easier: <b>progressive overload</b>. Genes matter too: people grow at very different rates from the same plan.</p>
    <p><b>Good form.</b> Pull-ups: start from a full hang, pull your chest towards the bar, shoulders down, no swinging. Rows: chest up, drive the elbows back, don't heave with your lower back. Deadlifts: bar over the middle of your foot, shins close, brace, push the floor away, hips and shoulders rise together, stand tall at the top without leaning back. The common faults are <b>ego-lifting</b> (too heavy to control), jerking the weight, and cutting the range short.</p>
    <p><b>Food and rest.</b> ICMR-NIN's 2024 guidelines for Indians give about <b>0.83 g of protein per kg</b> of body weight a day for adults, from dal, pulses, milk and curd, paneer, eggs, fish or meat, spread over meals. They advise <b>against protein powders</b> for healthy people. Sleep matters too.</p>
    <p><b>Posture myths.</b> "Sit up straight or you'll hurt your back" sounds right, but researchers reviewing the evidence (Slater and colleagues, 2019) found <b>no single correct posture</b> that prevents back pain. People with different spine curves get pain at similar rates. The best posture is the <b>next one</b>: move often. A strong back helps you do more, but you cannot "fix" posture with one exercise, and you cannot burn fat from one spot either.</p>
    <p class="tip"><b>Try it:</b> set 10 hard sets a week and stop 1–2 reps short of failure, then watch strength race ahead of size in the first weeks. Try each posture: the readout stays the same.</p>`,
  terms: [
    { t: 'Hypertrophy', d: 'Muscle growth: fibres get thicker with training.' },
    { t: 'Mechanical tension', d: 'The pulling force on muscle fibres during a hard set: the main signal to grow.' },
    { t: 'Progressive overload', d: 'Slowly asking more of a muscle: more reps, more weight or more sets over time.' },
    { t: 'Reps in reserve', d: 'How many more reps you could have done when you stop a set.' },
    { t: 'Hard set', d: 'A set taken close to failure, with only a few reps left in reserve.' },
    { t: 'Protein synthesis', d: 'Building new muscle protein; it speeds up for a day or two after training.' },
  ],
  defaults: { sets: 10, rir: 2, weeks: 12, body: 60, posture: 'tall' },
  controls: [
    { key: 'sets', type: 'range', label: 'Hard sets for the back each week', min: 0, max: 24, step: 1, fmt: (v) => Math.round(v) + ' sets' },
    { key: 'rir', type: 'range', label: 'Reps left in reserve at the end of each set', min: 0, max: 6, step: 1, ends: ['to failure', 'easy'], fmt: (v) => (v ? Math.round(v) + ' left' : 'to failure') },
    { key: 'weeks', type: 'range', label: 'Weeks of training', min: 0, max: 24, step: 1, fmt: (v) => Math.round(v) + ' weeks' },
    { key: 'body', type: 'range', label: 'Body weight (for protein)', min: 30, max: 120, step: 1, fmt: (v) => Math.round(v) + ' kg' },
    { key: 'posture', type: 'seg', label: 'Posture', options: Object.entries(POSTURES).map(([v, p]) => ({ v, label: p.label })) },
  ],
  quiz: [
    { q: 'In the first few weeks of training, where do most strength gains come from?', options: ['Bigger muscles', 'Your nervous system learning the move', 'Stronger bones', 'Protein powder'], answer: 1, why: 'Early strength is mostly neural: better recruitment and coordination. Visible size takes weeks to months.' },
    { q: 'Light weights for many reps can build as much muscle as heavy weights when…', options: ['the sets stop well short of tiring', 'the sets go close to failure', 'you do them fast', 'never'], answer: 1, why: 'A 2017 meta-analysis found similar growth from loads at or below 60% of your best and above it, when sets went to failure. Heavy loads still build more top strength.' },
    { q: 'What does the evidence say about "sitting up straight" to avoid back pain?', options: ['One correct posture prevents pain', 'No single posture is proven best; moving often matters more', 'Slumping always injures you', 'Posture is all genetic'], answer: 1, why: 'Reviewers in 2019 found no single correct posture that prevents back pain. Changing position and staying active matter more.' },
  ],
  reel: [
    { ms: 5200, caption: 'Hard sets near failure, about ten a week, and strength rises before size does.', set: { sets: 10, rir: 2, weeks: 0, body: 60, posture: 'tall' }, anim: { weeks: [0, 24] }, view: { pos: [1.5, 8.6, 11.0], target: [1.5, 7.6, 0.0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const fig = makeSide(stage, { bar: false });
    root.add(fig.root);
    // a plain chair and desk
    const wood = M.matte(0x6b5a48), dark = M.matte(0x2a2f3a);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 4.4), wood); seat.position.set(-0.9, 4.25, 0); root.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.6, 4.2), wood); back.position.set(-3.1, 6.7, 0); back.rotation.z = 0.08; root.add(back);
    for (const [x, z] of [[-2.9, -1.9], [-2.9, 1.9], [1.2, -1.9], [1.2, 1.9]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.1, 0.3), dark); leg.position.set(x, 2.05, z); root.add(leg); }
    const desk = new THREE.Mesh(new THREE.BoxGeometry(5, 0.35, 7), wood); desk.position.set(6.6, 7.4, 0); root.add(desk);
    for (const z of [-3.2, 3.2]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 7.3, 0.3), dark); l.position.set(8.8, 3.65, z); root.add(l); }
    const st = { weeks: 12, sets: 10, rir: 2 };
    const chart = canvasTexture(900, 560, (g, w, h) => drawGrowth(g, w, h, st));
    const bd = board(chart, 8.0, 5.0); bd.position.set(11.0, 13.4, -3); bd.rotation.y = -0.25; root.add(bd);
    const note = tint(stage.label('', [0, 0, 0], root), 'gold');
    const fit = fitNarrow(stage, { pos: [1.5, 9.4, 12.5], target: [1.5, 8.4, 0] });
    let A = { ...POSTURES.tall.A }, key = '', t = 0;
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t = time;
        let target = POSTURES[s.posture].A;
        if (!target) { const keys = ['tall', 'slump', 'lean']; target = POSTURES[keys[Math.floor(time / 2.5) % 3]].A; }
        for (const k of Object.keys(A)) A[k] = approach(A[k], target[k], 3, dt);
        const J = chain([0.42, 0.075], { ...A, foot: 90 });
        // keep the hips on the seat: shift the chain so the hip sits at seat height
        const dy = 0.465 - J.hip[1];
        for (const k of ['ankle', 'knee', 'hip', 'shoulder', 'elbow', 'hand']) J[k] = [J[k][0], J[k][1] + (k === 'ankle' || k === 'knee' ? 0 : dy)];
        J.knee = [J.knee[0], J.hip[1]]; J.ankle = [J.knee[0], 0.075]; J.toe = [J.ankle[0] + 0.19, 0.03];
        fig.set(J);
        fig.ercMat.emissiveIntensity = 0.15;
        const k = `${s.sets}|${s.rir}|${s.weeks}`;
        if (k !== key) { key = k; Object.assign(st, { weeks: s.weeks, sets: s.sets, rir: s.rir }); chart.redraw(); }
        note.element.textContent = 'no single posture is proven best';
        note.position.set(7.5, 9.6, 1);
        const narrow = fit();
        note.visible = !inReel() && !narrow;
        bd.visible = !narrow;
        void t;
      },
      readout: (s) => {
        const G = growth(s.weeks, s.sets, s.rir);
        const setsMsg = s.sets === 0 ? 'none yet' : s.sets < 5 ? 'a start: more brings more' : s.sets < 10 ? 'good; 10+ did best in studies' : s.sets <= 20 ? 'in the 10+ range' : 'a lot: recover well';
        const effort = s.rir <= 3 ? 'hard enough to grow' : 'too easy to grow much';
        return `<div class="big">${Math.round(s.body * 0.83)} g of protein a day</div>
          <div class="row"><span>Protein (ICMR-NIN, 0.83 g/kg)</span><b>${Math.round(s.body)} kg × 0.83</b></div>
          <div class="row"><span>Weekly hard sets</span><b>${s.sets}: ${setsMsg}</b></div>
          <div class="row"><span>Effort</span><b>${effort}</b></div>
          <div class="row"><span>After ${s.weeks} weeks (illustration)</span><b>strength +${Math.round(G.strength)}%, size +${G.size.toFixed(1)}%</b></div>
          <div class="row"><span>Days a week</span><b>at least 2 (WHO, NHS)</b></div>
          <small>The growth curves are an illustration with round numbers, not a forecast. Posture: no single position is proven best (Slater et al. 2019).</small>`;
      },
    });
  },
};
