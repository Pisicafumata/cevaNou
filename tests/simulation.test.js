import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG,ITEM_BY_ID,TILES,terrainAt } from '../src/catalog.js';
import { createWorld,advance,water,collect,restoreWorld,parseWorld,summary,levelFor,canPlace,placeItem,moveItem,removeItem,claimMission,MISSIONS,MAX_CATCHUP_SECONDS } from '../src/simulation.js';
const NOW=1800000000000;
const fresh=()=>createWorld(NOW);
const free=(world,kind)=>TILES.find(t=>!canPlace(world,kind,t.col,t.row));
const add=(world,kind='fern')=>{const t=free(world,kind);return placeItem(world,kind,t.col,t.row,NOW);};

test('starter island has unique compatible tiles and a complete sprite catalogue',()=>{
  const w=fresh();assert.equal(CATALOG.length,20);assert.equal(w.items.length,7);assert.equal(new Set(w.items.map(i=>`${i.col}:${i.row}`)).size,7);
  for(const item of w.items)assert.equal(terrainAt(item.col,item.row),ITEM_BY_ID[item.kind].terrain);
  assert.equal(TILES.length,52);assert.equal(TILES.filter(t=>terrainAt(t.col,t.row)==='water').length,7);
});
test('purchase spends exactly its cost, adds XP, and does not mutate the old world',()=>{
  const w=fresh(),copy=JSON.stringify(w),action=add(w);
  assert.equal(action.error,'');assert.equal(action.world.leaves,120);assert.equal(action.world.xp,10);assert.equal(action.world.items.length,8);assert.equal(action.world.stats.placed,1);assert.equal(JSON.stringify(w),copy);
});
test('locked purchases, unknown items and insufficient funds do not spend resources',()=>{
  const w=fresh(),tile=free(w,'fern');
  for(const [world,kind] of [[w,'willow'],[w,'__proto__'],[{...w,leaves:1},'fern']]){const action=placeItem(world,kind,tile.col,tile.row,NOW);assert.ok(action.error);assert.equal(action.world.leaves,world.leaves);assert.equal(action.world.items.length,world.items.length);}
});
test('placement rejects occupied, outside, fractional and incompatible terrain',()=>{
  const w=fresh();
  for(const [kind,col,row] of [['fern',5,1],['fern',-1,2],['fern',1.5,0],['fern',2,3],['lily',4,0]]){
    const action=placeItem(w,kind,col,row,NOW);assert.ok(action.error);assert.equal(action.world.leaves,140);
  }
});
test('water plants occupy pond tiles and update discoveries',()=>{
  const w={...fresh(),xp:35},action=add(w,'lotus');assert.equal(action.error,'');assert.ok(action.world.discovered.includes('lotus'));assert.equal(terrainAt(action.entity.col,action.entity.row),'water');
});
test('moving is free, preserves growth, and cannot overwrite another object',()=>{
  const w=fresh(),item=w.items[0],tile=free(w,'oak'),action=moveItem(w,item.id,tile.col,tile.row,NOW);
  assert.equal(action.error,'');assert.equal(action.world.leaves,w.leaves);assert.equal(action.world.xp,w.xp);assert.equal(action.world.items.find(i=>i.id===item.id).growth,item.growth);
  assert.ok(moveItem(w,item.id,5,4,NOW).error);assert.ok(moveItem(w,item.id,2,3,NOW).error);
});
test('recycling returns half of paid price and cannot refund the same object twice',()=>{
  const bought=add(fresh()),action=removeItem(bought.world,bought.entity.id,NOW);
  assert.equal(action.refund,10);assert.equal(action.world.leaves,130);assert.equal(action.world.items.length,7);assert.ok(removeItem(action.world,bought.entity.id,NOW).error);
  assert.equal(removeItem(fresh(),'seed-0',NOW).refund,0);
});
test('watering has a cooldown, a moisture ceiling and no repeat XP exploit',()=>{
  const action=water(fresh(),NOW);assert.equal(action.world.moisture,84);assert.equal(action.world.xp,3);
  const again=water(action.world,NOW+1000);assert.ok(again.error);assert.equal(again.world.xp,action.world.xp+1/60*.7);
  assert.ok(water({...action.world,moisture:100},NOW+30000).error);
});
test('collecting transfers whole leaves, preserves fractions and rejects empty repeats',()=>{
  const w={...fresh(),stored:15.75},action=collect(w,NOW);assert.equal(action.amount,15);assert.equal(action.world.leaves,155);assert.equal(action.world.stored,.75);assert.equal(action.world.stats.collected,15);assert.equal(action.world.xp,6);assert.ok(collect(action.world,NOW).error);
});
test('passive growth, moisture, XP and bounded production advance together',()=>{
  const w=advance(fresh(),NOW+3600000);assert.equal(w.moisture,56);assert.equal(w.items[0].growth,100);assert.equal(w.xp,42);assert.equal(w.stored,summary(w).capacity);assert.equal(levelFor(w.xp),2);
});
test('growth and production stop once moisture reaches 20%',()=>{
  const w=advance({...fresh(),moisture:23},NOW+3600000);assert.equal(w.moisture,17);assert.equal(w.xp,21);
  const dry=advance({...fresh(),moisture:0},NOW+3600000);assert.equal(dry.xp,0);assert.equal(dry.stored,0);assert.equal(dry.items[0].growth,35);
});
test('rain restores moisture and mist slows drying; dry rain waits before growth',()=>{
  assert.equal(advance({...fresh(),weather:'rain'},NOW+3600000).moisture,74);
  assert.equal(advance({...fresh(),weather:'mist'},NOW+3600000).moisture,59);
  const dry=advance({...fresh(),weather:'rain',moisture:0},NOW+3600000);assert.equal(dry.moisture,12);assert.equal(dry.xp,0);
});
test('an empty island cannot produce free biological XP or leaves',()=>{
  const w=advance({...fresh(),items:[]},NOW+60000);assert.equal(w.xp,0);assert.equal(w.stored,0);assert.equal(summary(w).species,0);
});
test('offline catch-up caps at eight hours and no plant dies',()=>{
  const w=advance(fresh(),NOW+100*86400000),capped=advance(fresh(),NOW+MAX_CATCHUP_SECONDS*1000);
  assert.deepEqual(w,{...capped,lastUpdate:NOW+100*86400000});assert.equal(w.items.length,7);
});
test('backwards clock cannot duplicate elapsed time',()=>assert.deepEqual(advance(fresh(),NOW-30000),fresh()));
test('mission rewards require completion and can only be claimed once',()=>{
  assert.ok(claimMission(fresh(),'first',NOW).error);const placed=add(fresh()).world,claimed=claimMission(placed,'first',NOW);
  assert.equal(claimed.error,'');assert.equal(claimed.world.leaves,155);assert.equal(claimed.world.xp,35);assert.equal(levelFor(claimed.world.xp),2);assert.ok(claimMission(claimed.world,'first',NOW).error);
});
test('all six level thresholds and all nine mission identities are distinct',()=>{
  assert.deepEqual([0,35,105,220,390,650].map(levelFor),[1,2,3,4,5,6]);assert.equal(levelFor(99999),6);assert.equal(MISSIONS.length,9);assert.equal(new Set(MISSIONS.map(m=>m.id)).size,9);
});
test('v1 saves migrate moisture, oak growth and preferences without losing the starter island',()=>{
  const w=parseWorld(JSON.stringify({version:1,ecosystem:'pond',moisture:79,growth:71,lastUpdate:NOW,theme:'night',motionPaused:true}),NOW);
  assert.equal(w.version,2);assert.equal(w.moisture,79);assert.equal(w.items[0].growth,71);assert.equal(w.theme,'night');assert.equal(w.motionPaused,true);assert.equal(w.leaves,140);
});
test('v2 round-trip preserves placed objects, mission claims, settings and resources',()=>{
  const w={...claimMission(add(fresh()).world,'first',NOW).world,name:'Mica mea lume',theme:'night',weather:'mist'};
  assert.deepEqual(parseWorld(JSON.stringify(w),NOW),w);
});
test('corrupt or incompatible saves recover locally but strict import rejects them',()=>{
  for(const raw of ['broken','null','[]','{"version":9,"ecosystem":"pond"}','{"version":2,"ecosystem":"pond","items":"bad"}']){assert.deepEqual(restoreWorld(raw,NOW),fresh());assert.throws(()=>parseWorld(raw,NOW));}
});
test('invalid save entities are filtered and currencies and dates are bounded',()=>{
  const w=fresh();w.items=[...w.items,{...w.items[0],id:'duplicate-tile'},{kind:'__proto__',col:0,row:1},{kind:'fern',col:-10,row:0}];
  const saved=parseWorld(JSON.stringify({...w,leaves:-100,xp:-100,lastUpdate:NOW+1e6,theme:'bad',stats:{placed:-5},discovered:['__proto__','fern']}),NOW);
  assert.equal(saved.items.length,7);assert.equal(saved.leaves,0);assert.equal(saved.xp,0);assert.equal(saved.lastUpdate,NOW);assert.equal(saved.theme,'auto');assert.equal(saved.stats.placed,0);assert.ok(!saved.discovered.includes('__proto__'));
  const duplicate=parseWorld(JSON.stringify({...fresh(),items:fresh().items.map(i=>({...i,id:'restored-1-1'}))}),NOW);assert.equal(new Set(duplicate.items.map(i=>i.id)).size,duplicate.items.length);
});
test('restored next ID never overwrites an existing purchased item',()=>{
  const bought=add(fresh()).world,restored=parseWorld(JSON.stringify({...bought,nextId:1}),NOW),second=add(restored);
  assert.notEqual(second.entity.id,bought.items.at(-1).id);assert.equal(new Set(second.world.items.map(i=>i.id)).size,second.world.items.length);
});
