const intro = document.querySelector('#intro');
const site = document.querySelector('#site');
const openButton = document.querySelector('#openButton');
const musicControl = document.querySelector('#musicControl');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let audioContext = null;
let activeNodes = [];
let musicTimer = null;
let musicPlaying = false;

const notes = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

const melody = [
  ['G4', .28], ['G4', .16], ['A4', .42], ['G4', .42], ['C5', .42], ['B4', .72],
  ['G4', .28], ['G4', .16], ['A4', .42], ['G4', .42], ['D5', .42], ['C5', .72],
  ['G4', .28], ['G4', .16], ['G5', .42], ['E5', .42], ['C5', .42], ['B4', .42], ['A4', .72],
  ['F5', .28], ['F5', .16], ['E5', .42], ['C5', .42], ['D5', .42], ['C5', .82],
];

function stopMusic() {
  activeNodes.forEach((node) => {
    try { node.stop(); } catch (_) {}
  });
  activeNodes = [];
  clearTimeout(musicTimer);
  audioContext?.close();
  audioContext = null;
  musicPlaying = false;
  musicControl.setAttribute('aria-pressed', 'false');
  musicControl.setAttribute('aria-label', 'Reproducir música');
}

function playMusic() {
  if (musicPlaying) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext = new AudioContextClass();
  const master = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();

  master.gain.value = 0.46;
  compressor.threshold.value = -20;
  compressor.knee.value = 18;
  compressor.ratio.value = 5;
  master.connect(compressor).connect(audioContext.destination);

  let cursor = audioContext.currentTime + 0.06;

  melody.forEach(([name, duration]) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = notes[name];
    gain.gain.setValueAtTime(0.0001, cursor);
    gain.gain.exponentialRampToValueAtTime(0.38, cursor + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);

    oscillator.connect(gain).connect(master);
    oscillator.start(cursor);
    oscillator.stop(cursor + duration + 0.04);
    activeNodes.push(oscillator);
    cursor += duration + 0.03;
  });

  musicPlaying = true;
  musicControl.setAttribute('aria-pressed', 'true');
  musicControl.setAttribute('aria-label', 'Pausar música');

  const totalMs = Math.max(0, (cursor - audioContext.currentTime + 0.25) * 1000);
  musicTimer = setTimeout(() => {
    musicPlaying = false;
    activeNodes = [];
    audioContext?.close();
    audioContext = null;
    playMusic();
  }, totalMs);
}

function celebrate() {
  if (reduceMotion || typeof confetti !== 'function') return;

  const end = Date.now() + 1700;
  const colors = ['#9c3458', '#d47797', '#f4d9e1', '#ffffff'];

  function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 52, origin: { x: 0 }, colors });
    confetti({ particleCount: 3, angle: 120, spread: 52, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  }

  frame();
}

function startPetals() {
  if (reduceMotion || typeof gsap === 'undefined') return;

  const layer = document.querySelector('.petals');
  for (let index = 0; index < 12; index += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * 100}vw`;
    layer.appendChild(petal);

    gsap.to(petal, {
      y: '115vh',
      x: -80 + Math.random() * 160,
      rotation: 360 + Math.random() * 420,
      duration: 10 + Math.random() * 8,
      delay: Math.random() * 7,
      ease: 'none',
      repeat: -1,
    });
  }
}

function revealSite() {
  playMusic();
  site.setAttribute('aria-hidden', 'false');
  document.body.classList.remove('is-locked');

  if (reduceMotion || typeof gsap === 'undefined') {
    intro.remove();
    site.style.opacity = '1';
    site.style.visibility = 'visible';
    return;
  }

  gsap.timeline({ onComplete: () => intro.remove() })
    .to('.intro__content', { y: -16, opacity: 0, duration: 0.42, ease: 'power2.in' })
    .to(intro, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.08')
    .set(site, { visibility: 'visible' }, '-=0.52')
    .to(site, { opacity: 1, duration: 0.62, ease: 'power2.out' }, '-=0.52')
    .from('.portrait', { y: 34, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
    .from('.hero__copy > *', { y: 26, opacity: 0, duration: 0.62, stagger: 0.09, ease: 'power3.out' }, '-=0.65');

  celebrate();
  startPetals();
}

openButton.addEventListener('click', revealSite);
musicControl.addEventListener('click', () => {
  if (musicPlaying) stopMusic();
  else playMusic();
});

if (!reduceMotion && typeof gsap !== 'undefined') {
  gsap.from('.intro__content > *', {
    y: 18,
    opacity: 0,
    duration: 0.75,
    stagger: 0.1,
    ease: 'power3.out',
    delay: 0.2,
  });
}
