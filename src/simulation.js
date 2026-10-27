export const SAVE_KEY = 'terraquarium.world.v1';
export const MAX_CATCHUP_SECONDS = 8 * 60 * 60;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const validNumber = (n, fallback, min, max) => typeof n === 'number' && Number.isFinite(n) ? clamp(n, min, max) : fallback;

export function createWorld(now = Date.now()) {
  return { version: 1, ecosystem: 'pond', moisture: 62, growth: 18, lastUpdate: now, theme: 'day', motionPaused: false };
}

// Pure simulation: no renderer, browser APIs, or desktop host dependencies.
export function advance(world, now = Date.now()) {
  const seconds = clamp((now - world.lastUpdate) / 1000, 0, MAX_CATCHUP_SECONDS);
  const hours = seconds / 3600;
  // Only time spent above 20% moisture contributes to growth, including offline.
  const wetHours = Math.min(hours, Math.max(0, (world.moisture - 20) / 6));
  return { ...world, moisture: clamp(world.moisture - hours * 6, 0, 100), growth: clamp(world.growth + wetHours * 12, 0, 100), lastUpdate: Math.max(world.lastUpdate, now) };
}

export function water(world, now = Date.now()) {
  const updated = advance(world, now);
  return { ...updated, moisture: clamp(updated.moisture + 18, 0, 100) };
}

export function restoreWorld(raw, now = Date.now()) {
  const initial = createWorld(now);
  try {
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== 1 || saved.ecosystem !== 'pond') return initial;
    return advance({ ...initial,
      moisture: validNumber(saved.moisture, initial.moisture, 0, 100),
      growth: validNumber(saved.growth, initial.growth, 0, 100),
      lastUpdate: validNumber(saved.lastUpdate, now, 0, now),
      theme: saved.theme === 'night' ? 'night' : 'day',
      motionPaused: saved.motionPaused === true
    }, now);
  } catch { return initial; }
}

export function plantStage(growth) {
  if (growth >= 75) return { title: 'O mică oază', description: 'Frunze noi, rădăcini puternice. Insula se simte acasă.' };
  if (growth >= 40) return { title: 'Prinde rădăcini', description: 'Încet, dar sigur, prima ta plantă se dezvoltă.' };
  return { title: 'Un început verde', description: 'Rădăcinile se așază. Lasă-i puțin timp.' };
}
