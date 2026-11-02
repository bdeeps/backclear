// Chapter 6: people have trained the back for centuries. The side figure takes four poses: a
// mallakhamb climb, a rope climb from the akhara and early Olympics, Surya Namaskar's cobra
// (a back extension), and a deadlift for the lab science of spines. Dates (see history.json for
// the full list and sources):
//  - Mallakhamb: first literary mention in the Manasollasa, 1135 CE; revived in the early 19th
//    century by Balambhatta Dada Deodhar, teacher of Peshwa Baji Rao II; demonstrated at the 1936
//    Olympics; state sport of Madhya Pradesh from 9 April 2013; first World Mallakhamb
//    Championship in Mumbai, 2019 (Wikipedia "Mallakhamba", Indian Express 20 Feb 2019).
//  - Pehlwani (kushti) training: dand, baithak, Surya Namaskar, rope climbing, log pulling
//    (Wikipedia "Pehlwani"). Rope climbing was an Olympic gymnastics event in 1896, 1904, 1924
//    and 1932 (and the 1906 Intercalated Games).
//  - Surya Namaskar: named and popularised in the 1920s by Bhawanrao Pant Pratinidhi, Raja of
//    Aundh, in his 1928 book; Krishnamacharya taught it at the Mysore Palace. Bhujangasana (cobra)
//    and Urdhva Mukha Svanasana (upward dog) are back extensions.
//  - Science: Borelli, De Motu Animalium (1680–81): muscles on short levers pull many times the
//    load. Nachemson & Morris (1964) measured pressure inside living lumbar discs; Wilke et al.
//    (1999): 2.3 MPa lifting 20 kg with a round back, 1.7 MPa with bent knees, 1.1 MPa held close.
import { THREE, M, approach, lerp } from '../kit.js';
import { makeSide, chain, hingePose, fitNarrow, compactReadout, inReel, tint } from '../back.js';

const POSES = {
  mallakhamb: { label: 'Mallakhamb', anchor: [-0.3, 0.32], A: { shank: 42, thigh: -12, trunk: -10, uarm: 22, farm: 6, curve: 0.25, neck: 0 } },
  rope: { label: 'Rope climb', anchor: [-0.02, 0.62], A: { shank: 25, thigh: -55, trunk: 4, uarm: 8, farm: 2, curve: 0.1, neck: 0 } },
  cobra: { label: 'Surya Namaskar', anchor: [-0.86, 0.06], A: { shank: 90, thigh: 90, trunk: 58, uarm: 196, farm: 92, curve: 0.55, neck: 25, foot: -100 } },
  science: { label: 'The science', anchor: null, A: null },
};
const INFO = {
  mallakhamb: { head: 'Mallakhamb: gymnastics on a pole', rows: [['1135 CE', 'first written mention, in the Manasollasa'], ['Early 1800s', 'revived by Balambhatta Dada Deodhar'], ['1936', 'shown at the Olympics'], ['2013, 2019', 'Madhya Pradesh state sport; first World Championship, Mumbai']], note: 'Gripping, climbing and holding the body out from the pole trains the whole back.' },
  rope: { head: 'Rope climbing: the akhara and the Olympics', rows: [['Akhara training', 'dand, baithak, Surya Namaskar, rope climbing'], ['1896 to 1932', 'rope climbing was an Olympic event'], ['Works', 'lats, grip and biceps: a pull-up that keeps going'], ['Today', 'still in kushti, gyms and armed forces training']], note: 'Pehlwani grew from Persian koshti and Indian malla-yuddha.' },
  cobra: { head: 'Surya Namaskar: a back extension inside', rows: [['Pose', 'Bhujangasana (cobra) or upward dog'], ['What works', 'erector spinae arch the spine back'], ['1920s', 'named and popularised by the Raja of Aundh'], ['1928', 'his book on Surya Namaskar']], note: 'Wrestlers also used the sequence in their daily routine.' },
  science: { head: 'Measuring the load on a spine', rows: [['1680', 'Borelli: muscles on short levers pull many times the load'], ['1964', 'Nachemson: pressure measured inside a living disc'], ['1991', 'powerlifters’ spines: about 17 kN estimated'], ['1999', 'disc pressure: 2.3 MPa round back vs 1.1 held close']], note: 'Wilke et al. 1999 measured one volunteer’s L4–L5 disc while he lifted 20 kg.' },
};

export default {
  id: 'history',
  short: 'History',
  title: 'Poles, ropes, sun salutes and a needle in a disc',
  subtitle: 'How people in India and around the world have trained and studied the back.',
  view: { pos: [5.5, 11.5, -40], target: [4.2, 10.2, 0] },
  learn: `<p>In India, the back was trained long before gyms. <b>Mallakhamb</b> ("wrestler's pole") is gymnastics on a wooden pole or a hanging rope. It is first described in the <b>Manasollasa</b> of 1135 CE, was revived in the early 1800s by <b>Balambhatta Dada Deodhar</b>, a teacher at the court of the Peshwa, was shown at the <b>1936 Olympics</b>, became the state sport of <b>Madhya Pradesh</b> in 2013, and had its first <b>World Championship</b> in Mumbai in 2019. Every climb and hold is a back and grip workout.</p>
    <p>Wrestlers in the <b>akhara</b> (pehlwani or kushti, which grew from Persian koshti and Indian malla-yuddha) train with <b>dand</b>, <b>baithak</b>, <b>Surya Namaskar</b> and <b>rope climbing</b>. Rope climbing was even an <b>Olympic event</b> from 1896 to 1932.</p>
    <p><b>Surya Namaskar</b> was named and made popular in the 1920s by the Raja of Aundh, Bhawanrao Pant Pratinidhi. Its <b>cobra</b> or <b>upward dog</b> pose is a back extension: the erector spinae arch the spine backwards.</p>
    <p>Science came later. In 1680 <b>Giovanni Borelli</b> showed that muscles work on short levers, so they pull many times the load. In the 1960s <b>Alf Nachemson</b> put a pressure sensor inside living lumbar discs, and in 1999 a team in Ulm measured one volunteer's disc as he lifted 20 kg: holding it close squeezed the disc least. Today WHO counts exercise as treatment for back pain.</p>
    <p class="tip"><b>Try it:</b> step through the four scenes and compare which muscles each one works. Open "History" in the bar below for the full timeline.</p>`,
  terms: [
    { t: 'Mallakhamb', d: 'Indian gymnastics on a wooden pole or a hanging rope.' },
    { t: 'Akhara', d: 'A traditional Indian wrestling school and its training ground.' },
    { t: 'Bhujangasana', d: 'The cobra pose of yoga: lying face down and arching the upper body up.' },
    { t: 'Intradiscal pressure', d: 'The pressure inside a spinal disc, measured with a needle sensor.' },
  ],
  defaults: { scene: 'mallakhamb' },
  controls: [
    { key: 'scene', type: 'seg', label: 'Scene', options: Object.entries(POSES).map(([v, p]) => ({ v, label: p.label })) },
  ],
  quiz: [
    { q: 'What is mallakhamb?', options: ['A kind of dumbbell', 'Gymnastics on a wooden pole or rope', 'A yoga breathing method', 'A wrestling hold'], answer: 1, why: 'Mallakhamb is Indian pole and rope gymnastics, first written about in 1135 CE and now a competitive sport.' },
    { q: 'Which part of Surya Namaskar is a back extension?', options: ['Standing with palms together', 'The cobra or upward dog pose', 'Touching the toes', 'The squat'], answer: 1, why: 'In cobra (Bhujangasana) or upward dog, the back muscles arch your spine backwards.' },
    { q: 'What did the 1999 disc-pressure study find about lifting 20 kg?', options: ['Round back and close hold were the same', 'Holding the weight close to the body squeezed the disc least', 'Bending the knees made it worse', 'Pressure didn’t change'], answer: 1, why: 'Wilke and colleagues measured 2.3 MPa with a round back, 1.7 MPa with bent knees and 1.1 MPa with the weight held close.' },
  ],
  reel: [
    { ms: 5000, caption: 'Mallakhamb, written about in 1135, has trained Indian backs on a wooden pole for centuries.', set: { scene: 'mallakhamb' }, anim: {}, view: { pos: [1.0, 10.7, 12.6], target: [0.2, 10.5, 0.0] }, spin: 0.25 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const fig = makeSide(stage, { bar: true });
    root.add(fig.root);
    const wood = M.matte(0x8a6a48);
    // the pole: thicker at the bottom, a round "head" on top (about 2.6 m tall)
    const pole = new THREE.Group(); root.add(pole);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 24, 24), wood); shaft.position.set(0.9, 12, 0); pole.add(shaft);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 12), wood); knob.position.set(0.9, 24.6, 0); pole.add(knob);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 16), wood); neck.position.set(0.9, 24.0, 0); pole.add(neck);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 26, 10), M.matte(0xd9c49a)); rope.position.set(0.55, 13, 0); root.add(rope);
    const beamTop = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 0.5), M.matte(0x2a2f3a)); beamTop.position.set(0.55, 26.1, 0); root.add(beamTop);
    const mat = new THREE.Mesh(new THREE.BoxGeometry(22, 0.12, 8), M.matte(0x5a3d2e)); mat.position.set(1, 0.06, 0); root.add(mat);
    const cap = tint(stage.label('', [0, 0, 0], root), 'gold');
    const fit = fitNarrow(stage, { pos: [1.0, 11.4, 15], target: [0.2, 10.8, 0] });
    let A = { ...POSES.mallakhamb.A, foot: 90 }, anchor = [...POSES.mallakhamb.anchor], k = 0, t = 0;
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t = time;
        const P = POSES[s.scene];
        let J;
        if (s.scene === 'science') {
          // a deadlift from the hinge chapter, rising slowly
          k = 0.5 - 0.5 * Math.cos(time * 1.2);
          const H = hingePose('deadlift', 0.15 + 0.7 * k, 0);
          J = { ankle: H.ankle, knee: H.knee, hip: H.hip, shoulder: H.shoulder, hand: H.bar, bar: H.bar, curve: 0.15, l5: H.l5 };
          fig.setPlates(60);
        } else {
          const want = { foot: 90, ...P.A };
          for (const key of Object.keys(want)) A[key] = approach(A[key] ?? want[key], want[key], 4, dt);
          anchor = [approach(anchor[0], P.anchor[0], 4, dt), approach(anchor[1], P.anchor[1], 4, dt)];
          // a slow breath in the hold, and a little climb on the pole and rope
          const bob = s.scene === 'cobra' ? 0 : 0.03 * Math.sin(time * 1.6);
          J = chain([anchor[0], anchor[1] + bob], A);
          J.bar = null;
        }
        fig.set(J);
        fig.bar.visible = s.scene === 'science';
        pole.visible = s.scene === 'mallakhamb'; rope.visible = beamTop.visible = s.scene === 'rope';
        fig.ercMat.emissiveIntensity = s.scene === 'cobra' ? 0.8 : s.scene === 'science' ? 0.4 + 0.5 * (1 - k) : 0.35;
        fig.discs[0].material.emissiveIntensity = s.scene === 'science' ? 0.4 + 0.8 * (1 - k) : 0.4;
        cap.element.textContent = { mallakhamb: 'mallakhamb pole', rope: 'climbing rope', cobra: 'Bhujangasana: the back arches', science: 'L5/S1 disc under load' }[s.scene];
        cap.position.set(s.scene === 'cobra' ? 4 : -4.5, s.scene === 'cobra' ? 7.2 : 16.5, -1);
        const narrow = fit();
        cap.visible = !inReel() && !narrow;
        void t; void lerp;
      },
      readout: (s) => {
        const I = INFO[s.scene];
        return `<div class="big">${I.head}</div>${I.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}<small>${I.note}</small>`;
      },
    });
  },
};
