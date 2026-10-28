import { CATALOG,CATEGORIES,ITEM_BY_ID,LEVELS,TILES } from './catalog.js';
import { SAVE_KEY,LEGACY_SAVE_KEY,createWorld,restoreWorld,parseWorld,advance,summary,levelFor,canPlace,placeItem,moveItem,removeItem,water,collect,MISSIONS,claimMission,WATER_COOLDOWN } from './simulation.js';
import { createScene,isNight } from './scene.js';
import { drawThumbnail } from './sprites.js';

const $=id=>document.getElementById(id);
const format=(value,digits=0)=>new Intl.NumberFormat('ro-RO',{maximumFractionDigits:digits}).format(value);
const node=(tag,className,text)=>{const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;};
let world=createWorld(),storageAvailable=true,migrated=false;
try{
  const current=localStorage.getItem(SAVE_KEY),legacy=localStorage.getItem(LEGACY_SAVE_KEY);
  try{world=current?parseWorld(current):restoreWorld(legacy);migrated=!current&&!!legacy;}
  catch{world=restoreWorld(legacy);migrated=!!legacy;}
}catch{storageAvailable=false;}
const view={mode:'inspect',kind:null,selected:null,hover:null,grid:false,zoom:innerWidth<=720?1.4:1.15};
let category='all',showAllMissions=false,hostPaused=false,ambient=false,pendingImport=null,timer,toastTimer;
const cards=new Map(),missionCards=new Map();
const scene=createScene($('scene'),()=>world,()=>view,handleTile);

function notify(message,error=false){
  const toast=$('toast');clearTimeout(toastTimer);
  const active=document.querySelector('dialog[open]');(active||document.body).append(toast);
  toast.textContent=message;toast.classList.toggle('error',error);toast.hidden=false;
  toastTimer=setTimeout(()=>{toast.hidden=true;},5200);
}
function save(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(world));storageAvailable=true;}catch{storageAvailable=false;}
  $('save-state').textContent=storageAvailable?'● Progres salvat pe acest dispozitiv':'○ Salvarea nu este disponibilă. Exportă o copie din Preferințe.';
}
function resetSelection(){view.mode='inspect';view.kind=null;view.selected=null;view.hover=null;paintSelection();scene.refresh();}
function apply(action,message){
  const previousLevel=levelFor(world.xp);world=action.world;
  if(action.error){notify(action.error,true);paint();return false;}
  save();paint();scene.refresh();
  const level=levelFor(world.xp),unlocks=CATALOG.filter(i=>i.level>previousLevel&&i.level<=level).map(i=>i.name.toLocaleLowerCase('ro'));
  notify(level>previousLevel?`${message} Nivel ${level}! Ai deblocat: ${unlocks.join(', ')}.`:message);
  if(level>previousLevel&&!world.motionPaused&&!matchMedia('(prefers-reduced-motion: reduce)').matches)$('level-badge').animate([{transform:'scale(1)'},{transform:'scale(1.17)',background:'#c9dbaf'},{transform:'scale(1)'}],{duration:650});
  return true;
}
function chooseItem(kind){
  const item=ITEM_BY_ID[kind],level=levelFor(world.xp);
  if(level<item.level){notify(`${item.name}: disponibil de la nivelul ${item.level}. Primește recompensele misiunilor pentru a avansa.`,true);return;}
  if(world.leaves<item.cost){notify('Mai ai nevoie de frunze. Colectează producția insulei sau recompensele misiunilor.',true);return;}
  view.mode='place';view.kind=kind;view.selected=null;
  view.hover=TILES.find(t=>!canPlace(world,kind,t.col,t.row))||null;
  paintSelection();paintCatalog();scene.refresh();
  if(innerWidth<=720)$('scene').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function handleTile(tile){
  if(ambient)return;
  const entity=world.items.find(i=>i.col===tile.col&&i.row===tile.row);
  if(view.mode==='place'&&view.kind){
    const action=placeItem(world,view.kind,tile.col,tile.row);
    if(apply(action,`${ITEM_BY_ID[view.kind].name} are un loc nou pe insulă. +${ITEM_BY_ID[view.kind].xp} XP`)){
      view.selected=action.entity.id;view.kind=null;view.mode='inspect';paintSelection();paintCatalog();scene.refresh();
    }return;
  }
  if(view.mode==='move'&&view.selected){
    if(apply(moveItem(world,view.selected,tile.col,tile.row),'Un loc nou, aceeași poveste. Mutarea este gratuită.')){view.mode='inspect';view.kind=null;paintSelection();scene.refresh();}return;
  }
  if(view.mode==='remove'){
    if(!entity){notify('Alege elementul pe care vrei să îl reciclezi.');return;}
    const action=removeItem(world,entity.id);apply(action,`${ITEM_BY_ID[entity.kind].name} a fost reciclat. +${action.refund} frunze.`);view.selected=null;paintSelection();scene.refresh();return;
  }
  view.selected=entity?.id??null;
  view.kind=view.mode==='move'&&entity?entity.kind:null;
  paintSelection();scene.refresh();
}
function paintSelection(){
  const selected=world.items.find(i=>i.id===view.selected),item=ITEM_BY_ID[view.kind]||ITEM_BY_ID[selected?.kind];
  const placing=view.mode==='place',moving=view.mode==='move'&&selected;
  $('auto-place').hidden=!(placing||moving);$('auto-place').textContent=moving?'Mută automat':'Așază automat';
  $('selection-cancel').hidden=!(view.selected||view.kind||view.mode!=='inspect');
  $('selection-title').textContent=placing?`Adaugă: ${item.name}`:moving?`Mută: ${item.name}`:view.mode==='move'?'Un loc mai potrivit.':view.mode==='remove'?'Fă loc unei idei noi.':selected?item.name:'Fă loc ideilor tale.';
  $('selection-symbol').textContent=view.mode==='remove'?'♲':moving?'↔':'✳';
  $('build-hint').textContent=placing||moving?`${item.description} Alege un loc liber ${item.terrain==='water'?'în iaz':'pe pământ'}. Esc anulează.`:view.mode==='move'?'Selectează un element, apoi locul în care vrei să îl muți.':view.mode==='remove'?'Apasă pe un element. Primești înapoi 50% din preț; elementele de început oferă 0 frunze.':selected?`${item.description} ${item.income>0?`Creștere: ${Math.floor(selected.growth)}% · +${format(item.income,2)} frunze/min.`:'Decor pentru mica ta lume.'}`:'Alege din colecție, apoi apasă pe un loc liber. Sau folosește „Așază automat”.';
  for(const button of document.querySelectorAll('[data-mode]')){const active=button.dataset.mode===view.mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  $('scene').style.cursor=['place','move'].includes(view.mode)?'crosshair':view.mode==='remove'?'pointer':'default';
}
function buildCatalog(){
  for(const filter of CATEGORIES){const button=node('button','',filter.label);button.type='button';button.dataset.category=filter.id;button.setAttribute('aria-pressed',String(filter.id==='all'));button.addEventListener('click',()=>{category=filter.id;paintCatalog();});$('category-tabs').append(button);}
  for(const item of CATALOG){
    const card=node('button','item-card');card.type='button';card.dataset.item=item.id;card.title=item.description;
    const image=node('canvas');image.width=96;image.height=88;image.setAttribute('aria-hidden','true');drawThumbnail(image,item.id);
    const name=node('span','item-name',item.name),footer=node('span','item-footer'),price=node('span','item-price',`❧ ${item.cost}`),plus=node('span','item-plus','+'),lock=node('span','lock-label',`NV. ${item.level}`);
    footer.append(price,plus);card.append(image,name,footer,lock);card.addEventListener('click',()=>chooseItem(item.id));$('catalog-items').append(card);cards.set(item.id,{card,lock,plus});
  }
}
function paintCatalog(){
  const level=levelFor(world.xp);
  for(const item of CATALOG){const {card,lock,plus}=cards.get(item.id),locked=level<item.level;
    card.hidden=category!=='all'&&item.category!==category;card.classList.toggle('locked',locked);card.classList.toggle('unaffordable',world.leaves<item.cost);card.classList.toggle('selected',view.mode==='place'&&view.kind===item.id);card.setAttribute('aria-pressed',String(view.mode==='place'&&view.kind===item.id));card.setAttribute('aria-disabled',String(locked||world.leaves<item.cost));card.setAttribute('aria-label',`${item.name}, ${item.cost} frunze${locked?`, se deblochează la nivelul ${item.level}`:''}`);lock.hidden=!locked;plus.textContent=locked?'⌑':'+';
  }
  for(const button of $('category-tabs').children)button.setAttribute('aria-pressed',String(button.dataset.category===category));
  const visible=CATALOG.filter(i=>category==='all'||i.category===category);
  $('catalog-count').textContent=`${visible.filter(i=>i.level<=level).length} disponibile · ${visible.length} în colecție`;
  const next=CATALOG.filter(i=>i.level===level+1).map(i=>i.name.toLocaleLowerCase('ro'));
  $('next-unlock').textContent=next.length?`Nivel ${level+1}: ${next.join(', ')}.`:'Ai deblocat întreaga colecție. Creează ceva al tău.';
}
function buildMissions(){
  MISSIONS.forEach((mission,index)=>{
    const card=node('article','mission'),top=node('div','mission-top'),number=node('span','',`0${index+1}`),count=node('span'),title=node('strong','',mission.title),description=node('p','',mission.text),progress=node('progress'),bottom=node('div','mission-bottom'),reward=node('span','',`❧ ${mission.leaves} · ${mission.xp} XP`),claim=node('button','','În lucru');
    progress.max=mission.target;progress.setAttribute('aria-label',mission.title);claim.dataset.claim=mission.id;claim.type='button';claim.addEventListener('click',()=>{apply(claimMission(world,mission.id),`Misiune încheiată! +${mission.leaves} frunze · +${mission.xp} XP`);});top.append(number,count);bottom.append(reward,claim);card.append(top,title,description,progress,bottom);$('missions').append(card);missionCards.set(mission.id,{card,count,progress,claim});
  });
}
function paintMissions(){
  const pending=MISSIONS.filter(m=>!world.claimed.includes(m.id));
  const shown=new Set([...pending.filter(m=>m.progress(world)>=m.target),...pending.filter(m=>m.progress(world)<m.target)].slice(0,3).map(m=>m.id));
  for(const mission of MISSIONS){const {card,count,progress,claim}=missionCards.get(mission.id),done=world.claimed.includes(mission.id),value=Math.min(mission.target,Math.floor(mission.progress(world))),ready=value>=mission.target&&!done;
    card.hidden=!showAllMissions&&!shown.has(mission.id);card.classList.toggle('claimed',done);card.classList.toggle('ready',ready);count.textContent=done?'✓':`${value} / ${mission.target}`;progress.value=value;claim.disabled=!ready;claim.textContent=done?'Primită ✓':ready?'Primește ↗':'În lucru';
  }
  $('mission-count').textContent=`${world.claimed.length} / ${MISSIONS.length}`;
  $('missions-toggle').textContent=showAllMissions?'Arată mai puține ↑':'Vezi toate ↗';
  if(!pending.length&&!showAllMissions){showAllMissions=true;paintMissions();}
}
function paint(){
  const info=summary(world),night=isNight(world),remaining=info.nextXP?Math.ceil(info.nextXP-world.xp):0;
  $('leaves').textContent=format(Math.floor(world.leaves));$('island-name').textContent=world.name;
  $('level-badge').textContent=String(info.level).padStart(2,'0');$('level-title').textContent=info.title;$('level-next').textContent=info.nextXP?`${remaining} XP până la nivelul ${info.level+1}`:'Nivel maxim · toate elementele deblocate';$('xp-meter').max=info.nextXP?info.nextXP-info.levelXP:1;$('xp-meter').value=info.nextXP?world.xp-info.levelXP:1;
  $('moisture-value').textContent=`${Math.round(world.moisture)}%`;$('moisture-meter').value=world.moisture;
  $('diversity-value').textContent=`${info.biodiversity}%`;$('diversity-meter').value=info.biodiversity;
  $('income').replaceChildren(document.createTextNode(format(world.moisture<=20?0:info.income,1)+' '),node('small','','/ min'));
  $('item-count').textContent=`${info.occupied} elemente · ${info.free} locuri libere`;
  $('stored').textContent=format(Math.floor(world.stored));$('capacity').textContent=`/ ${info.capacity}`;$('collect').disabled=world.stored<1;
  $('harvest-detail').textContent=world.stored>=info.capacity?'Coșul este plin. Colectează ca să faci loc frunzelor noi.':world.moisture<=20?'Solul e uscat. Udă insula pentru a relua producția.':`+${format(info.income,1)} frunze pe minut. Se adună și când lipsești.`;
  const wait=Math.max(0,Math.ceil((WATER_COOLDOWN-(Date.now()-world.lastWater))/1000));
  $('water').disabled=world.moisture>=95||wait>0;$('water').textContent=wait?`Ploaie recentă · ${wait}s`:world.moisture>=95?'Sol bine udat ✓':'♧ Udă insula';
  document.body.classList.toggle('night',night);
  $('scene-time').textContent=world.weather==='rain'?'☂ Ploaie liniștită':world.weather==='mist'?'≋ Ceață de dimineață':night?'☾ Liniște de noapte':'☀ Lumină de zi';
  $('world-state').textContent=world.moisture<=20?'Un strop de apă ar prinde bine':info.level>=4?'O lume întreagă, creată de tine':'Totul crește în ritmul său';
  $('zoom-value').textContent=`${Math.round(view.zoom*100)}%`;$('zoom-out').disabled=view.zoom<=.85;$('zoom-in').disabled=view.zoom>=1.65;
  $('theme').value=world.theme;$('weather').value=world.weather;$('motion').textContent=world.motionPaused?'Reia animația':'Pauză animație';$('motion').setAttribute('aria-pressed',String(world.motionPaused));
  paintSelection();paintCatalog();paintMissions();
}
function setAmbient(value){
  ambient=value;resetSelection();document.body.classList.toggle('ambient',value);$('ambient-exit').hidden=!value;
  $('scene').tabIndex=value?-1:0;$('scene').setAttribute('role',value?'img':'application');
  if(value)$('ambient-exit').focus();else $('ambient').focus();scene.refresh();
}
function paintCollection(){
  $('collection').replaceChildren();
  for(const item of CATALOG){const discovered=world.discovered.includes(item.id),card=node('div',`collection-item${discovered?'':' undiscovered'}`),image=node('canvas');image.width=96;image.height=88;image.setAttribute('aria-hidden','true');drawThumbnail(image,item.id);card.append(image,node('strong','',item.name),node('span','',discovered?'Descoperit ✓':`Nivel ${item.level}`));$('collection').append(card);}
  $('guide-count').textContent=`${world.discovered.length} / ${CATALOG.length} elemente descoperite · ${world.items.length} așezate pe insulă`;
}
function run(){clearTimeout(timer);if(document.hidden||hostPaused){scene.stop();return;}world=advance(world);paint();scene.start();timer=setTimeout(run,1000);}
buildCatalog();buildMissions();
for(const [id,label] of [['guide-open','Deschide colecția'],['settings-open','Deschide preferințele'],['ambient','Intră în modul ambiental']])$(id).setAttribute('aria-label',label);
$('auto-place').addEventListener('click',()=>{const tile=TILES.find(t=>!canPlace(world,view.kind,t.col,t.row,view.mode==='move'?view.selected:null));if(tile)handleTile(tile);else notify('Nu mai există locuri compatibile. Mută sau reciclează un element.',true);});
$('selection-cancel').addEventListener('click',()=>{resetSelection();paintCatalog();});
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{view.mode=button.dataset.mode;view.kind=view.mode==='move'?world.items.find(i=>i.id===view.selected)?.kind??null:null;paintSelection();paintCatalog();scene.refresh();});
$('grid').addEventListener('click',()=>{view.grid=!view.grid;$('grid').setAttribute('aria-pressed',String(view.grid));scene.refresh();});
for(const [id,delta] of [['zoom-in',.1],['zoom-out',-.1]])$(id).addEventListener('click',()=>{view.zoom=Math.max(.85,Math.min(1.65,Math.round((view.zoom+delta)*100)/100));paint();scene.refresh();});
$('water').addEventListener('click',()=>{if(apply(water(world),'Un strop de grijă. +3 XP'))scene.rain();});
$('collect').addEventListener('click',()=>{const action=collect(world);apply(action,`Ai colectat ${action.amount??0} frunze. Lumea ta lucrează încet, dar sigur.`);});
$('missions-toggle').addEventListener('click',()=>{showAllMissions=!showAllMissions;paintMissions();});
$('settings-open').addEventListener('click',()=>$('settings').showModal());
$('guide-open').addEventListener('click',()=>{paintCollection();$('guide').showModal();});
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>$(button.dataset.close).close());
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.append($('toast'));});
for(const id of ['theme','weather'])$(id).addEventListener('change',()=>{world=advance(world);world[id]=$(id).value;save();paint();scene.refresh();});
$('motion').addEventListener('click',()=>{world.motionPaused=!world.motionPaused;save();paint();scene.refresh();});
$('ambient').addEventListener('click',()=>setAmbient(true));$('ambient-exit').addEventListener('click',()=>setAmbient(false));
$('ambient-settings').addEventListener('click',()=>{$('settings').close();setAmbient(true);});
document.addEventListener('keydown',event=>{if(event.key!=='Escape'||document.querySelector('dialog[open]'))return;if(ambient)setAmbient(false);else{resetSelection();paintCatalog();}});
$('rename').addEventListener('click',()=>{$('name-input').value=world.name;$('rename-dialog').showModal();$('name-input').select();});
$('rename-form').addEventListener('submit',event=>{event.preventDefault();const name=$('name-input').value.trim().slice(0,32);if(!name)return;world.name=name;save();paint();$('rename-dialog').close();notify('Un nume nou pentru mica ta lume.');});
$('export').addEventListener('click',()=>{world=advance(world);save();const url=URL.createObjectURL(new Blob([JSON.stringify(world,null,2)],{type:'application/json'})),link=node('a');link.href=url;link.download='terraquarium-insula.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);notify('Copia de siguranță a fost pregătită. Păstreaz-o într-un loc sigur.');});
$('import-open').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;try{if(file.size>1000000)throw Error('Salvarea este prea mare. Alege un fișier Terraquarium sub 1 MB.');pendingImport=parseWorld(await file.text());$('import-description').textContent=`„${pendingImport.name}” · nivel ${levelFor(pendingImport.xp)} · ${pendingImport.items.length} elemente · ${format(pendingImport.leaves)} frunze.`;$('settings').close();$('import-confirm').showModal();}catch(error){pendingImport=null;notify(error instanceof SyntaxError?'Fișierul nu este un JSON valid. Alege o copie exportată din Terraquarium.':error.message||'Fișierul nu a putut fi citit.',true);}});
$('import-confirm-button').addEventListener('click',()=>{if(!pendingImport)return;world=advance(pendingImport);pendingImport=null;resetSelection();save();paint();scene.refresh();$('import-confirm').close();notify('Bine ai revenit pe insula ta.');});
document.addEventListener('visibilitychange',()=>{world=advance(world);save();run();});window.addEventListener('pagehide',()=>{world=advance(world);save();});
window.addEventListener('storage',event=>{if(event.key!==SAVE_KEY||!event.newValue)return;try{world=parseWorld(event.newValue);paint();if(!document.hidden)scene.refresh();}catch{/* Keep this world if another tab writes an invalid save. */}});
setInterval(()=>{if(!document.hidden&&!hostPaused)save();},15000);
window.livelyWallpaperPlaybackChanged=data=>{try{const payload=typeof data==='string'?JSON.parse(data):data;hostPaused=payload?.IsPaused===true;world=advance(world);save();run();}catch{/* Optional desktop host. */}};
save();paint();if(new URLSearchParams(location.search).get('ambient')==='1')setAmbient(true);run();
if(migrated)notify('Insula din prima versiune a fost păstrată. Bine ai venit în noua grădină!');
