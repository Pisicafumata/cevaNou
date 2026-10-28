const {chromium}=require(process.env.TERRA_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const BASE=process.env.TERRA_TEST_URL||'http://127.0.0.1:4173';
const KEY='terraquarium.world.v2';
const read=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const importPayload=async(page,world)=>{
  if(!await page.locator('#settings').evaluate(d=>d.open))await page.locator('#settings-open').click();
  await page.locator('#import-file').setInputFiles({name:'insula.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(world))});
  await page.locator('#import-confirm-button').click();
};
async function clickTile(page,col,row,zoom=1.15){
  const canvas=page.locator('#scene');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
  const x=480+(col-row)*36,y=232+(col+row)*17;
  await page.mouse.click(box.x+(480+(x-480)*zoom)/960*box.width,box.y+(325+(y-325)*zoom)/600*box.height);
}
(async()=>{
  await fs.mkdir('artifacts',{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.TERRA_BROWSER_PATH?{executablePath:process.env.TERRA_BROWSER_PATH}:process.platform==='win32'?{channel:'msedge'}:{})});
  const errors=[],failed=[],checks=[];
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  context.on('page',page=>{page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('requestfailed',r=>failed.push(r.url()));});
  try{
    const page=await context.newPage();await page.goto(BASE);
    assert.equal(await page.locator('.item-card').count(),20);
    await page.locator('[data-item="fern"]').click();await clickTile(page,4,3);
    let world=await read(page);assert.equal(world.items.length,8);assert.equal(world.leaves,120);assert.equal(world.items.at(-1).col,4);assert.equal(world.items.at(-1).row,3);checks.push('manual placement and exact purchase cost');
    await page.locator('[data-claim="first"]').click();world=await read(page);assert.ok(world.claimed.includes('first'));assert.equal(world.leaves,155);assert.equal(await page.locator('#level-badge').textContent(),'02');assert.equal(await page.locator('[data-item="bamboo"]').getAttribute('aria-disabled'),'false');checks.push('mission reward, level-up and unlock');
    await page.locator('[data-item="bamboo"]').click();await page.locator('#auto-place').click();assert.equal((await read(page)).items.length,9);checks.push('automatic placement');
    await page.locator('[data-item="lotus"]').click();await page.locator('#auto-place').click();world=await read(page);const lotus=world.items.at(-1);assert.equal(lotus.kind,'lotus');
    await page.locator('[data-mode="move"]').click();await clickTile(page,3,5);world=await read(page);assert.equal(world.items.find(i=>i.id===lotus.id).row,5);assert.equal(world.items.find(i=>i.id===lotus.id).col,3);checks.push('move without spending leaves');
    const balance=world.leaves;await page.locator('[data-mode="remove"]').click();await clickTile(page,3,5);world=await read(page);assert.equal(world.leaves,balance+21);assert.ok(!world.items.some(i=>i.id===lotus.id));checks.push('recycling half-price refund');
    await page.locator('#selection-cancel').click();
    await page.locator('[data-item="flowers"]').click();await page.locator('#scene').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');assert.equal((await read(page)).items.length,10);checks.push('keyboard construction');
    await page.locator('#water').click();assert.equal(await page.locator('#moisture-value').textContent(),'84%');assert.ok(await page.locator('#water').isDisabled());
    await page.locator('[data-claim="water"]').click();checks.push('watering and cooldown');
    await page.locator('[data-category="life"]').click();assert.equal(await page.locator('.item-card:visible').count(),3);
    await page.locator('[data-item="koi"]').click({force:true});assert.match(await page.locator('#toast').textContent(),/nivelul 3/);await page.locator('[data-category="all"]').click();checks.push('categories and locked element feedback');
    await page.locator('#rename').click();await page.locator('#name-input').fill('<b>Insula mea</b>');await page.locator('#rename-form button').click();assert.equal(await page.locator('#island-name').textContent(),'<b>Insula mea</b>');assert.equal(await page.locator('#island-name b').count(),0);checks.push('safe custom island name');
    await page.locator('#settings-open').click();await page.locator('#theme').selectOption('day');await page.locator('#weather').selectOption('rain');assert.match(await page.locator('#scene-time').textContent(),/Ploaie/);await page.locator('#motion').click();assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'true');await page.locator('#motion').click();await page.locator('#weather').selectOption('clear');
    const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;const backup=path.resolve('artifacts/v2-backup.json');await download.saveAs(backup);const saved=JSON.parse(await fs.readFile(backup,'utf8'));assert.equal(saved.version,2);assert.equal(saved.items.length,10);checks.push('day/night, weather, motion and actual export download');
    await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":999}')});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('compatibil'));assert.equal((await read(page)).items.length,10);checks.push('invalid import preserves current world');
    const beforeImport=await read(page);await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...saved,name:'Import verificat'}))});await page.locator('#import-confirm').waitFor({state:'visible'});assert.equal((await read(page)).name,beforeImport.name);await page.locator('#import-confirm-button').click();assert.equal((await read(page)).name,'Import verificat');await page.reload();assert.equal((await read(page)).name,'Import verificat');assert.equal((await read(page)).items.length,10);checks.push('confirmed import and reload persistence');
    await page.locator('#guide-open').click();assert.equal(await page.locator('.collection-item').count(),20);await page.keyboard.press('Escape');
    await page.locator('#ambient').click();assert.ok(await page.locator('#ambient-exit').isVisible());assert.equal(await page.locator('#water').isVisible(),false);await page.keyboard.press('Escape');assert.ok(await page.locator('#water').isVisible());checks.push('collection journal and ambient Escape');
    await page.evaluate(()=>{window.__sceneFrames=0;const original=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.id==='scene')window.__sceneFrames++;return original.apply(this,args);};window.livelyWallpaperPlaybackChanged('{"IsPaused":true}');});
    await page.waitForTimeout(180);const paused=await page.evaluate(()=>window.__sceneFrames);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.__sceneFrames),paused);await page.evaluate(()=>window.livelyWallpaperPlaybackChanged('{"IsPaused":false}'));await page.waitForTimeout(180);assert.ok(await page.evaluate(()=>window.__sceneFrames)>paused);checks.push('host pause really stops canvas rendering');
    const sim=await import(pathToFileURL(path.resolve('src/simulation.js')).href),catalog=await import(pathToFileURL(path.resolve('src/catalog.js')).href);
    let showcase={...sim.createWorld(),name:'Grădina posibilităților',xp:650,leaves:5000,theme:'day'};
    for(const item of catalog.CATALOG){if(showcase.items.some(i=>i.kind===item.id))continue;const tile=catalog.TILES.find(t=>!sim.canPlace(showcase,item.id,t.col,t.row));assert.ok(tile);showcase=sim.placeItem(showcase,item.id,tile.col,tile.row).world;}
    showcase.items=showcase.items.map(i=>({...i,growth:100}));showcase.stored=40;
    await importPayload(page,showcase);assert.equal((await read(page)).items.length,20);await page.screenshot({path:'artifacts/v2-garden-day.png',fullPage:true});
    await page.locator('#settings-open').click();await page.locator('#theme').selectOption('night');await page.keyboard.press('Escape');await page.screenshot({path:'artifacts/v2-garden-night.png',fullPage:true});checks.push('all 20 sprites render in a mature playable garden');
    for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.locator('#catalog').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);await page.screenshot({path:`artifacts/v2-mobile-${width}.png`,fullPage:true});}
    await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#settings-open').click();await page.locator('#weather').selectOption('mist');assert.match(await page.locator('#scene-time').textContent(),/Ceață/);await page.keyboard.press('Escape');checks.push('320/390px responsive layout and reduced motion');
    const offlineContext=await browser.newContext();const offline=await offlineContext.newPage();await offline.addInitScript(world=>{if(!localStorage.getItem('terraquarium.world.v2'))localStorage.setItem('terraquarium.world.v2',JSON.stringify({...world,lastUpdate:Date.now()-7200000,stored:0,stats:{...world.stats,collected:0}}));},sim.createWorld());await offline.goto(BASE);assert.ok((await read(offline)).stored>=100);const oldLeaves=(await read(offline)).leaves;await offline.locator('#collect').click();assert.ok((await read(offline)).leaves>oldLeaves);assert.ok((await read(offline)).stats.collected>=100);checks.push('offline production and collection');
    const migratedContext=await browser.newContext();const migrated=await migratedContext.newPage();await migrated.addInitScript(()=>{if(!localStorage.getItem('terraquarium.world.v2'))localStorage.setItem('terraquarium.world.v1',JSON.stringify({version:1,ecosystem:'pond',moisture:79,growth:77,lastUpdate:Date.now(),theme:'night'}));});await migrated.goto(BASE);const converted=await read(migrated);assert.equal(converted.version,2);assert.ok(converted.items[0].growth>=77);assert.equal(converted.theme,'night');checks.push('real v1 local-storage migration');
    const blockedContext=await browser.newContext();const blocked=await blockedContext.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Storage blocked');}}));await blocked.goto(BASE);await blocked.locator('[data-item="fern"]').click();await blocked.locator('#auto-place').click();assert.equal(await blocked.locator('#leaves').textContent(),'120');assert.match(await blocked.locator('#save-state').textContent(),/nu este disponibil/);checks.push('blocked storage fallback remains playable');
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({result:'PASS',checks,errors,failed},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
