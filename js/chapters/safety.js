// Chapter 5: safety, back pain and what helps. The back model shows the lumbar spine and the
// sciatic nerve paths; pick a situation and the readout says what official sources advise.
// Sources (read at the source unless noted):
//  - NHS "Back pain" (nhs.uk/conditions/back-pain, reviewed March 2026): stay active and keep up
//    daily activities, don't stay in bed for long; see a GP if it isn't better after a few weeks
//    of home treatment, stops daily activities, comes with weight loss without trying, a lump or
//    swelling, is worse at night or not eased by rest, worse on coughing or sneezing, or comes from
//    between the shoulders. Urgent help (111) if you feel hot, shivery or unwell, or severe pain
//    starts suddenly or gets worse quickly. Call 999 / A&E for pain, tingling, weakness or numbness
//    in both legs, loss of feeling around the genitals or anus, changes in bladder or bowel
//    control, changes in sexual function, chest pain, or pain after a serious accident.
//  - WHO "Low back pain" fact sheet (June 2023): 619 million people in 2020, projected 843 million
//    by 2050; the single leading cause of disability worldwide; about 90% non-specific; staying
//    physically active helps. WHO's first guideline on chronic primary low back pain (7 Dec 2023)
//    includes structured exercise programmes among recommended non-surgical care (from WHO news
//    release summaries).
//  - Cochrane review (Hayden et al. 2021, 249 trials): exercise reduced chronic low back pain by
//    about 15 points on a 0–100 scale compared with no treatment, usual care or placebo,
//    moderate certainty (from search summaries of the abstract): a real but modest effect.
//  - Anabolic steroids: NHS "Anabolic steroid misuse": risks include heart attack and stroke, liver
//    and kidney damage, high blood pressure, infertility, and addiction. They are on WADA's
//    Prohibited List (S1, anabolic agents) at all times; NADA enforces this in India.
//  - Supplements: ICMR-NIN (2024) advises against protein powders for healthy people; in India
//    supplements are food products regulated by FSSAI, not medicines.
import { THREE, M, approach, clamp } from '../kit.js';
import { makeBack, fitNarrow, compactReadout, inReel, tint } from '../back.js';

const CASES = {
  start: {
    label: 'Before you start', head: 'Check first, then start light',
    rows: [['Ask a doctor first if you have', 'heart disease, high blood pressure, are pregnant, or had recent injury or surgery'], ['Start with', 'light weights or bodyweight; learn the move'], ['Warm up', 'a few easy sets of the same move'], ['Add', 'a little at a time, not all at once']],
    note: 'Most people can train safely. Technique first, then load.',
  },
  sore: {
    label: 'Sore next day', head: 'Ordinary training soreness',
    rows: [['Feels like', 'a dull, even ache in muscles you worked'], ['Comes', 'the day after a new or harder session'], ['Do', 'keep moving; it fades in a few days'], ['Then', 'build up more gently next time']],
    note: 'This is common and harmless. It is not a sign of damage.',
  },
  sharp: {
    label: 'Sharp pain lifting', head: 'Stop the set',
    rows: [['Sharp pain or a "pop"', 'stop and don’t push through'], ['Most back pain', 'gets better within weeks (NHS)'], ['Stay active', 'gentle walking beats bed rest'], ['See a GP if', 'not better in a few weeks, or it stops daily life']],
    note: 'No ego-lifting: never chase a weight you cannot control.',
  },
  nerve: {
    label: 'Pain down the leg', head: 'Pain, tingling or numbness down a leg',
    rows: [['What it can mean', 'an irritated nerve root in the lower back'], ['Do', 'stop lifting and get it checked by a GP or physio'], ['Worse at night, weight loss, feeling unwell', 'see a GP; urgent help if severe or quickly worse'], ['Both legs', 'emergency: see red flags']],
    note: 'The yellow lines show the sciatic nerve paths from the lower spine down each leg.',
  },
  red: {
    label: 'Red flags', head: 'Call 999 or go to A&E (in India: 112) if you have',
    rows: [['Both legs', 'pain, tingling, weakness or numbness'], ['Numbness', 'around the genitals or bottom'], ['Bladder or bowel', 'trouble peeing, or wetting or soiling yourself'], ['Also', 'chest pain, or pain after a serious accident']],
    note: 'From the NHS back pain page. These can mean nerves are badly squeezed.',
  },
  helps: {
    label: 'What helps', head: 'Exercise is a treatment',
    rows: [['Low back pain worldwide', '619 million people (WHO, 2020)'], ['Leading cause', 'of disability in the world (WHO)'], ['Exercise for long-term back pain', 'about 15 points less pain out of 100 (Cochrane 2021)'], ['WHO 2023 guideline', 'structured exercise among recommended care']],
    note: 'A modest but real effect, with few risks. Walking, swimming, yoga and strength work all count.',
  },
  drugs: {
    label: 'Steroids and pills', head: 'Anabolic steroids: harmful and banned',
    rows: [['Health risks (NHS)', 'heart attack, stroke, liver and kidney damage, high blood pressure'], ['Also', 'infertility, acne, mood changes, addiction'], ['In sport', 'banned at all times (WADA list S1; NADA in India)'], ['Supplements', 'food, not medicine: ICMR-NIN advises against protein powders for healthy people']],
    note: 'Muscle built with training and food is safe and yours to keep.',
  },
};

export default {
  id: 'safety',
  short: 'Safety',
  title: 'Train safely, and when back pain needs a doctor',
  subtitle: 'Start light, technique first, stop on sharp or spreading pain, and know the red flags.',
  view: { pos: [-5.5, 11.0, -21], target: [4.6, 9.4, 0] },
  learn: `<p>Strength training is safe for most people, and it is one of the best things you can do for your back. A few rules keep it that way.</p>
    <p><b>Check first.</b> If you have heart disease, high blood pressure, are pregnant, or have had a recent injury or operation, ask a doctor before you start. <b>Start light</b>, learn the move, warm up with easy sets, and add weight slowly. No <b>ego-lifting</b>.</p>
    <p><b>Know your pain.</b> A dull ache in worked muscles the next day is normal. A <b>sharp</b> pain or a "pop" while lifting means stop. Pain, tingling or numbness that <b>spreads down a leg</b> can mean an irritated nerve in your lower back: stop and get it checked. The NHS lists <b>red flags</b> that need emergency care (999 in the UK, 112 in India): numbness or weakness in <b>both legs</b>, numbness around the <b>genitals or bottom</b>, trouble <b>peeing or controlling your bowels</b>, chest pain, or pain after a serious accident.</p>
    <p><b>Exercise helps back pain.</b> Low back pain affected about <b>619 million</b> people in 2020 and is the world's leading cause of disability (WHO). Most of it has no single cause and gets better. The NHS says stay active rather than rest in bed, and WHO's 2023 guideline includes structured exercise for long-lasting back pain. A big Cochrane review found exercise cuts pain by about 15 points out of 100: modest, real, and with few risks.</p>
    <p><b>Steroids, plainly.</b> Anabolic steroids can cause heart attacks, strokes, liver and kidney damage, high blood pressure and infertility (NHS), and they are banned in sport at all times (WADA, enforced in India by NADA). Supplements are food products, not medicines; ICMR-NIN advises against protein powders for healthy people. Food, training and sleep do the job.</p>
    <p class="tip"><b>Try it:</b> pick "Pain down the leg" and follow the nerve paths, then "Red flags" and "What helps".</p>`,
  terms: [
    { t: 'Sciatica', d: 'Pain, tingling or numbness running down the leg from an irritated nerve root in the lower back.' },
    { t: 'Red flag', d: 'A warning sign that needs urgent medical help.' },
    { t: 'Non-specific back pain', d: 'Back pain without one clear cause: about 9 in 10 cases, and most get better.' },
    { t: 'Anabolic steroids', d: 'Drugs like testosterone that are harmful when misused and banned in sport.' },
    { t: 'Ego-lifting', d: 'Lifting more than you can control to look strong.' },
  ],
  defaults: { case: 'start' },
  controls: [
    { key: 'case', type: 'seg', label: 'Situation', options: Object.entries(CASES).map(([v, c]) => ({ v, label: c.label })) },
  ],
  quiz: [
    { q: 'Pain shoots down one leg while you lift. What should you do?', options: ['Finish the set', 'Stop and get it checked', 'Add more weight', 'Stretch hard'], answer: 1, why: 'Pain, tingling or numbness spreading down a leg can mean an irritated nerve. Stop and see a GP or physiotherapist.' },
    { q: 'Which of these is an emergency red flag with back pain?', options: ['Sore muscles the day after training', 'Numbness around the genitals or trouble controlling your bladder', 'Stiffness in the morning', 'A tired back after gardening'], answer: 1, why: 'The NHS says call 999 or go to A&E for numbness around the genitals or bottom, or bladder or bowel changes.' },
    { q: 'What do the NHS and WHO say about most low back pain?', options: ['Rest in bed for weeks', 'Stay active; exercise is part of the treatment', 'Avoid all lifting forever', 'Only surgery helps'], answer: 1, why: 'Staying active and structured exercise help; long bed rest does not.' },
  ],
  reel: [
    { ms: 5000, caption: 'Pain or numbness spreading down a leg means stop and get it checked.', set: { case: 'nerve' }, anim: {}, view: { pos: [-2.6, 9.2, -7.1], target: [0.3, 8.6, 0.0] }, spin: 0.35 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBack(stage, { labels: false, nerves: true });
    root.add(body.root);
    body.setLayer(2.6);
    const labs = {
      disc: tint(stage.label('Lower-back discs', [-3.2, 9.6, -1.4], root), 'blue'),
      nerve: tint(stage.label('Sciatic nerve paths', [-3.0, 5.6, -1.2], root), 'gold'),
    };
    const fit = fitNarrow(stage, { pos: [-2, 10.2, -11.5], target: [0.3, 9.6, 0] });
    let glowN = 0, glowE = 0, red = 0, layer = 2.6;
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const c = s.case;
        const pulse = 0.5 + 0.5 * Math.sin(time * 4);
        glowN = approach(glowN, c === 'nerve' ? 0.6 + 0.4 * pulse : c === 'red' ? 1 : 0.15, 5, dt);
        red = approach(red, c === 'red' ? 1 : 0, 5, dt);
        glowE = approach(glowE, c === 'sore' ? 0.45 : c === 'sharp' ? 0.6 + 0.4 * pulse : c === 'helps' ? 0.35 : 0, 5, dt);
        layer = approach(layer, c === 'nerve' || c === 'red' ? 3.2 : 2.6, 4, dt);
        body.setLayer(layer);
        body.pose({ e: 8, phi: 0, k: 10, pole: [0, 0, 1], ret: 0, elev: 0, rot: 0 });
        body.glow((e) => (e.k === 'erector' || e.k === 'multi' ? glowE : c === 'helps' ? 0.25 : 0));
        body.nerves.forEach((n, i) => {
          const one = c === 'nerve' && i === 1;            // one leg for sciatica, both for red flags
          const on = c === 'red' || one;
          n.mesh.material.emissiveIntensity = on ? 0.3 + 1.2 * glowN : 0.12;
          n.mesh.material.color.setHex(red > 0.5 && on ? 0xff5a4a : 0xffd166);
          n.mesh.material.emissive.setHex(red > 0.5 && on ? 0xff3a2a : 0xffd166);
          n.mesh.material.opacity = on ? 1 : 0.45;
        });
        body.verts.forEach((v) => { v.mesh.material.emissive = v.mesh.material.emissive || new THREE.Color(); });
        const narrow = fit();
        Object.values(labs).forEach((l) => { l.visible = !inReel() && !narrow; });
      },
      readout: (s) => {
        const c = CASES[s.case];
        return `<div class="big">${c.head}</div>${c.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}<small>${c.note} Not a diagnosis: if in doubt, ask a doctor.</small>`;
      },
    });
  },
};
void M; void clamp;
