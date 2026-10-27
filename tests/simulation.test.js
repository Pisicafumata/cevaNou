import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, advance, water, restoreWorld, MAX_CATCHUP_SECONDS } from '../src/simulation.js';

const now = 1800000000000;
test('a wet plant grows over time and uses moisture', () => {
  const result = advance(createWorld(now), now + 3600000);
  assert.equal(result.moisture, 56);
  assert.equal(result.growth, 30);
});
test('offline growth stops at the moment the soil becomes dry', () => {
  const result = advance({ ...createWorld(now), moisture: 23 }, now + 3600000);
  assert.equal(result.moisture, 17);
  assert.equal(result.growth, 24); // Only the first 30 minutes were wet enough.
});
test('watering caps moisture and cannot farm instant growth', () => {
  let world = createWorld(now);
  for (let i=0;i<100;i++) world = water(world, now);
  assert.equal(world.moisture, 100);
  assert.equal(world.growth, 18);
});
test('offline catch-up caps at eight hours and never kills the plant', () => {
  const world = createWorld(now);
  assert.deepEqual(advance(world, now + 100*86400000), { ...advance(world, now + MAX_CATCHUP_SECONDS*1000), lastUpdate: now + 100*86400000 });
  assert.equal(advance({ ...world, moisture: 0 },now+86400000).growth,18);
});
test('corrupt saves and unknown versions safely create a new world', () => {
  for (const raw of ['oops', 'null', '[]', '{"version":2}']) assert.deepEqual(restoreWorld(raw, now),createWorld(now));
});
test('save data is validated, bounded and ignores injected extra fields', () => {
  const world = restoreWorld(JSON.stringify({version:1,ecosystem:'pond',moisture:999,growth:-12,lastUpdate:now+1000,theme:'other',motionPaused:'yes',extra:'ignored'}),now);
  assert.deepEqual(world,{...createWorld(now),moisture:100,growth:0});
});
test('reloading preserves progress and catches up from its timestamp', () => {
  const world = water({ ...createWorld(now), theme:'night' },now);
  const restored = restoreWorld(JSON.stringify(world),now+3600000);
  assert.equal(restored.theme,'night'); assert.equal(restored.moisture,74); assert.equal(restored.growth,30);
});
test('clock going backwards never creates growth or repeats elapsed time', () => {
  const world=createWorld(now);
  assert.deepEqual(advance(world,now-10000),world);
});
