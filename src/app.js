import { SAVE_KEY, restoreWorld, advance, water, plantStage } from './simulation.js';
import { createScene } from './scene.js';

const $ = id => document.getElementById(id);
let storageAvailable = true;
let raw = null;
try { raw = localStorage.getItem(SAVE_KEY); } catch { storageAvailable = false; }
let world = restoreWorld(raw);
let hostPaused = false;
let ambient = new URLSearchParams(location.search).get('ambient') === '1';
let timer;
const scene = createScene($('scene'), () => world);

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(world)); storageAvailable = true; }
  catch { storageAvailable = false; }
  if (!storageAvailable) $('notice').textContent = 'Salvarea locală nu este disponibilă. Progresul rămâne în această sesiune.';
}

function paint() {
  const moisture = Math.round(world.moisture), growth = Math.floor(world.growth);
  $('moisture-value').textContent = `${moisture}%`;
  $('growth-value').textContent = `${growth}%`;
  $('moisture-meter').value = moisture;
  $('growth-meter').value = growth;
  $('water').disabled = world.moisture >= 99;
  const stage = plantStage(world.growth);
  $('plant-stage').textContent = stage.title;
  $('plant-description').textContent = world.moisture <= 20 ? 'Solul e uscat. Puțină apă o ajută să crească din nou.' : stage.description;
  document.body.classList.toggle('night', world.theme === 'night');
  $('scene-time').textContent = world.theme === 'night' ? 'Liniște de noapte' : 'Lumină de zi';
  $('theme').innerHTML = world.theme === 'night' ? '<span aria-hidden="true">☀</span> Zi' : '<span aria-hidden="true">☾</span> Noapte';
  $('theme').setAttribute('aria-pressed', String(world.theme === 'night'));
  $('motion').textContent = world.motionPaused ? 'Reia animația' : 'Pauză animație';
  $('motion').setAttribute('aria-pressed', String(world.motionPaused));
}

function setAmbient(value) {
  ambient = value;
  document.body.classList.toggle('ambient', ambient);
  $('ambient-exit').hidden = !ambient;
  if (ambient) $('ambient-exit').focus(); else $('ambient').focus();
}

function run() {
  clearTimeout(timer);
  if (document.hidden || hostPaused) { scene.stop(); return; }
  world = advance(world);
  paint();
  scene.start();
  timer = setTimeout(run, 1000);
}

$('water').addEventListener('click', () => {
  world = water(world); save(); paint(); scene.rain();
  if (storageAvailable) $('notice').textContent = 'Un strop de grijă. Planta crește cu timpul, cât solul este umed.';
});
$('theme').addEventListener('click', () => {
  world.theme = world.theme === 'day' ? 'night' : 'day'; save(); paint(); scene.refresh();
});
$('motion').addEventListener('click', () => {
  world.motionPaused = !world.motionPaused; save(); paint(); scene.refresh();
});
$('ambient').addEventListener('click', () => setAmbient(true));
$('ambient-exit').addEventListener('click', () => setAmbient(false));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && ambient) setAmbient(false); });
$('about-open').addEventListener('click', () => $('about').showModal());
$('about-close').addEventListener('click', () => $('about').close());
document.addEventListener('visibilitychange', () => { world = advance(world); save(); run(); });
window.addEventListener('pagehide', () => { world = advance(world); save(); });
setInterval(() => { if (!document.hidden && !hostPaused) save(); }, 15000);

// Prepared host boundary; a browser preview never modifies Windows wallpaper.
window.livelyWallpaperPlaybackChanged = data => {
  try {
    const payload = typeof data === 'string' ? JSON.parse(data) : data;
    hostPaused = payload?.IsPaused === true;
    world = advance(world); save(); run();
  } catch { /* Ignore malformed messages from an optional desktop host. */ }
};

save(); paint();
if (ambient) setAmbient(true);
run();
