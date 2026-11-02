// Chapter 1: the back muscles in a ghosted torso seen from behind. Peel the layers from skin to
// bone, lift them off, and pick a muscle to see where it starts and ends and what it does.
// Anatomy: Gray's Anatomy (42nd ed.); Moore, Clinically Oriented Anatomy (8th ed.); StatPearls
// chapters "Anatomy, Back, Latissimus Dorsi", "Trapezius", "Rhomboid", "Erector Spinae".
//  - Latissimus dorsi: from the spines of the lower six thoracic vertebrae, the thoracolumbar
//    fascia, the iliac crest and the lowest ribs, to the floor of the bicipital groove of the
//    humerus. Extends, adducts and turns the arm inwards. Nerve: thoracodorsal (C6–C8).
//  - Trapezius: from the skull (external occipital protuberance), the nuchal ligament and the
//    spines of C7–T12, to the clavicle, acromion and spine of the scapula. Upper part lifts the
//    scapula and turns it upwards; middle part pulls it in (retraction); lower part pulls it down
//    and helps turn it upwards.
//  - Rhomboids (major and minor): from the spines of C7–T5 to the inner edge of the scapula.
//    Retract it and turn it downwards.
//  - Teres major: from the lower corner of the scapula to the humerus next to the lat.
//  - Erector spinae: iliocostalis, longissimus and spinalis columns, from the sacrum and iliac
//    crest up to the ribs, vertebrae and skull. Straighten and steady the spine.
//  - Multifidus: short deep bundles spanning 2–4 vertebrae, thickest in the lower back.
//  - Spine: 7 cervical, 12 thoracic and 5 lumbar vertebrae, then the sacrum; about 23 discs
//    between them (none between the top two neck bones).
import { THREE } from '../kit.js';
import { makeBack, fitNarrow, compactReadout, inReel, tint, BACK_NAMES } from '../back.js';
import { toast } from '../ui.js';

const INFO = {
  all: { label: 'All', head: 'Your back: a stack of muscles', rows: [['Biggest by area', 'latissimus dorsi'], ['Pull the arm down and back', 'lats, teres major'], ['Move the shoulder blades', 'trapezius, rhomboids'], ['Hold the spine up', 'erector spinae, multifidus']] },
  lats: { label: 'Lats', head: 'Latissimus dorsi', rows: [['Starts', 'lower spine, hip bone, lowest ribs'], ['Ends', 'front of the upper arm bone'], ['Does', 'pulls the arm down, back and in'], ['Feel it in', 'pull-ups, pulldowns, rowing, climbing']] },
  trap: { label: 'Trapezius', head: 'Trapezius', rows: [['Starts', 'skull and spine, neck to T12'], ['Ends', 'collarbone and shoulder blade'], ['Upper part', 'shrugs and turns the blade up'], ['Middle and lower', 'pull the blades in and down']] },
  rhomb: { label: 'Rhomboids', head: 'Rhomboids', rows: [['Starts', 'spine, C7 to T5'], ['Ends', 'inner edge of the shoulder blade'], ['Does', 'squeezes the blades together'], ['Feel it in', 'rows, holding a heavy bag close']] },
  teres: { label: 'Teres major', head: 'Teres major', rows: [['Starts', 'lower corner of the shoulder blade'], ['Ends', 'upper arm, beside the lat'], ['Does', 'helps the lat pull the arm down'], ['Nickname', '"the lat’s little helper"']] },
  erector: { label: 'Erectors', head: 'Erector spinae', rows: [['Columns', 'iliocostalis, longissimus, spinalis'], ['Run', 'sacrum and hip bone up to ribs and neck'], ['Does', 'straightens and holds the spine'], ['Feel it in', 'deadlifts, back extensions, carrying']] },
  multi: { label: 'Multifidus', head: 'Multifidus', rows: [['Where', 'deepest, beside the spine'], ['Spans', '2 to 4 vertebrae each'], ['Thickest', 'in the lower back'], ['Does', 'steadies each vertebra']] },
  spine: { label: 'Spine', head: 'Spine, discs and pelvis', rows: [['Vertebrae', '7 neck, 12 chest, 5 lower back'], ['Then', 'sacrum, fused into the pelvis'], ['Discs', 'about 23 cushions between them'], ['Biggest', 'the 5 lumbar vertebrae']] },
};
const KEYS = { lats: ['lats'], trap: ['trapU', 'trapM', 'trapL'], rhomb: ['rhomb'], teres: ['teres'], erector: ['erector'], multi: ['multi'] };

export default {
  id: 'anatomy',
  short: 'The back muscles',
  title: 'A back is a stack of muscles',
  subtitle: 'Wide sheets on top, long cables underneath, and a spine of 24 bones and their discs.',
  view: { pos: [-4.0, 13.6, -15.5], target: [0.9, 12.3, 0] },
  learn: `<p>Your back is not one muscle but <b>layers</b> of them, like clothes. We are looking from behind, so the person's right side is on your right.</p>
    <p>On top are two big sheets. The <b>trapezius</b> is a diamond from your skull to the middle of your back. Its <b>upper</b> part shrugs your shoulders, its <b>middle</b> part pulls your shoulder blades together and its <b>lower</b> part pulls them down. Below it the <b>latissimus dorsi</b> ("lats") fans out from your lower spine and hip bone and wraps round to the front of your upper arm. That is why it <b>pulls your arm down and back</b>: every pull-up, rope climb and row uses it. The <b>teres major</b> helps it.</p>
    <p>Under the trapezius, the <b>rhomboids</b> tie the inner edge of each <b>shoulder blade</b> (scapula) to the spine. Deeper still, the <b>erector spinae</b> run like three long cables either side of the spine, from the pelvis to the ribs and neck. They straighten you up from a bend and hold you there. The deepest layer, the <b>multifidus</b>, links each vertebra to the next few and steadies them.</p>
    <p>The <b>spine</b> itself is 7 neck, 12 chest and 5 lower-back (<b>lumbar</b>) vertebrae on top of the sacrum, with a soft <b>disc</b> between most of them. The lumbar ones are the biggest because they carry the most. How the muscles pull on these bones is the story of <a href="/muscleclear/">MuscleClear</a> (how a muscle contracts) and <a href="/skeletonclear/">SkeletonClear</a> (joints, levers and the spine).</p>
    <p class="tip"><b>Try it:</b> peel the layers from skin to bone, then lift them apart. Pick "Lats" and follow it from the hip to the arm.</p>`,
  terms: [
    { t: 'Latissimus dorsi', d: 'The widest back muscle. It runs from the lower spine and hip to the upper arm and pulls the arm down and back.' },
    { t: 'Trapezius', d: 'A diamond-shaped muscle from skull to mid-back that lifts, squeezes and lowers the shoulder blades.' },
    { t: 'Rhomboids', d: 'Muscles under the trapezius that pull the shoulder blades towards the spine.' },
    { t: 'Erector spinae', d: 'Three long columns of muscle beside the spine that straighten and hold it.' },
    { t: 'Scapula', d: 'The shoulder blade: a flat triangular bone that slides over the ribs.' },
    { t: 'Intervertebral disc', d: 'A tough, springy cushion between two vertebrae, with a soft centre.' },
    { t: 'Lumbar spine', d: 'The five big vertebrae of the lower back.' },
  ],
  defaults: { layer: 1, explode: 0, pick: 'all', labels: true },
  controls: [
    { key: 'layer', type: 'range', label: 'X-ray: peel the layers', min: 0, max: 4, step: 0.01, ends: ['skin', 'bones'], fmt: (v) => ['skin', 'all muscles', 'top layer off', 'deep muscles', 'bones'][Math.round(v)] },
    { key: 'explode', type: 'range', label: 'Lift the layers apart', min: 0, max: 1, step: 0.01, ends: ['together', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'pick', type: 'seg', label: 'Pick a muscle', options: Object.entries(INFO).map(([v, g]) => ({ v, label: g.label })) },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Where does the latissimus dorsi attach on the arm?', options: ['The elbow', 'The front of the upper arm bone', 'The wrist', 'The collarbone'], answer: 1, why: 'The lat wraps round from your lower back to the front of the humerus, so it pulls the arm down, back and in.' },
    { q: 'Which muscles run like long cables either side of the spine?', options: ['The rhomboids', 'The erector spinae', 'The lats', 'The deltoids'], answer: 1, why: 'The erector spinae (iliocostalis, longissimus, spinalis) run from the pelvis to the ribs and neck and straighten the spine.' },
    { q: 'Why are the lumbar vertebrae the biggest?', options: ['They are the oldest', 'They carry the weight of everything above them', 'They hold the ribs', 'They are hollow'], answer: 1, why: 'Each vertebra carries the body above it, so the lowest five, the lumbar vertebrae, carry the most and are the biggest.' },
  ],
  reel: [
    { ms: 5400, caption: 'Your back is layers of muscle: wide sheets on top, long cables underneath.', set: { layer: 0.2, explode: 0, pick: 'all', labels: false }, anim: { layer: [0.2, 1.4] }, view: { pos: [-1.9, 12.5, -8.0], target: [0.0, 12.2, 0.0] }, spin: 0.35 },
    { ms: 5200, caption: 'The lats fan from your lower spine to your upper arm, so they pull the arm down and back.', set: { layer: 1, explode: 0, pick: 'lats', labels: false }, anim: { explode: [0, 0.7] }, view: { pos: [-2.3, 12.2, -7.1], target: [0.0, 12.0, 0.0] }, spin: 0.4 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBack(stage);
    root.add(body.root);
    stage.pickables.push(...body.list.map((e) => e.band.mesh), ...body.verts.map((v) => v.mesh));
    const sideL = [tint(stage.label('Their left', [3.4, 8.0, -1.2], root), 'side'), tint(stage.label('Their right', [-3.4, 8.0, -1.2], root), 'side')];
    const fit = fitNarrow(stage, { pos: [-1.6, 13.0, -10.5], target: [0, 12.6, 0] });
    let t = 0, lastToast = -9, layer = 1, ex = -1;
    const pickOf = (k) => Object.entries(KEYS).find(([, ks]) => ks.includes(k))?.[0];
    return compactReadout(stage, {
      pick(o) {
        if (t - lastToast < 0.8) return; lastToast = t;
        const m = o.userData.muscle;
        if (m) { const p = pickOf(m.k); toast(`<b>${BACK_NAMES[m.k]}</b>. ${INFO[p].rows[2][1]}.`); return; }
        toast('<b>A vertebra</b>. The discs between them are cushions; <a href="/skeletonclear/">SkeletonClear</a> shows the whole spine.');
      },
      update(dt, s, time) {
        dt = Math.max(0, dt); t = time;
        layer += (s.layer - layer) * Math.min(1, dt * 6);
        body.setLayer(layer);
        if (Math.abs(ex - s.explode) > 0.002) { ex += (s.explode - ex) * Math.min(1, dt * 6); if (Math.abs(ex - s.explode) < 0.003) ex = s.explode; body.setExplode(ex); }
        // a gentle breath and a slow shrug so the model looks alive
        const sh = 0.5 - 0.5 * Math.cos(time * 2 * Math.PI / 4);
        body.pose({ e: 8, phi: 0, k: 10, pole: [0, 0, 1], ret: 0.15 * sh, elev: 0.12 * sh, rot: 0 });
        const sel = s.pick;
        body.glow((e) => (sel === 'all' ? null : sel === 'spine' ? 0 : KEYS[sel].includes(e.k) ? 0.6 + 0.3 * sh : 0));
        const narrow = fit();
        const lab = s.labels && !inReel() && !narrow && s.explode < 0.45;
        const keys = sel === 'all' ? null : sel === 'spine' ? ['spine', 'scap'] : [...KEYS[sel]];
        const vis = layer < 0.5 ? [] : layer < 1.5 ? ['trapU', 'trapM', 'trapL', 'lats', 'delt', 'scap', 'spine'] : layer < 2.5 ? ['rhomb', 'teres', 'erector', 'scap', 'spine'] : layer < 3.5 ? ['erector', 'multi', 'spine', 'scap'] : ['spine', 'scap'];
        body.showLabels(lab, (keys || vis).filter((k) => vis.includes(k) || (keys && layer >= 0.5)));
        sideL.forEach((l) => { l.visible = s.labels && !inReel() && !narrow; });
      },
      readout: (s) => {
        const g = INFO[s.pick];
        return `<div class="big">${g.head}</div>${g.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <small>${s.layer > 3 ? 'Bones: 24 vertebrae (blue discs between), shoulder blades, ribs and pelvis.' : 'Seen from behind: their right is on your right.'}</small>`;
      },
    });
  },
};
