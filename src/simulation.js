import { ITEM_BY_ID, LEVELS, TILES, terrainAt } from './catalog.js';
export const SAVE_KEY='terraquarium.world.v2';
export const LEGACY_SAVE_KEY='terraquarium.world.v1';
export const MAX_CATCHUP_SECONDS=8*60*60;
export const WATER_COOLDOWN=20000;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const number=(n,fallback,min=0,max=1e7)=>typeof n==='number'&&Number.isFinite(n)?clamp(n,min,max):fallback;
const starterItems=()=>[['oak',5,1,35],['fern',5,4,55],['flowers',2,1,65],['reeds',1,2,60],['lily',2,4,65],['stone',6,3,100],['mushrooms',4,4,100]].map(([kind,col,row,growth],i)=>({id:`seed-${i}`,kind,col,row,growth,starter:true}));
export function createWorld(now=Date.now()){
  const items=starterItems();
  return {version:2,ecosystem:'pond',name:'Insula de rouă',moisture:62,growth:35,lastUpdate:now,theme:'auto',weather:'clear',motionPaused:false,leaves:140,stored:0,xp:0,lastWater:0,nextId:1,items,discovered:items.map(i=>i.kind),claimed:[],stats:{placed:0,watered:0,collected:0,seconds:0}};
}
export function levelFor(xp){return LEVELS.reduce((level,step,i)=>xp>=step.xp?i+1:level,1);}
export function summary(world){
  const species=new Set(world.items.filter(i=>ITEM_BY_ID[i.kind].income>0&&(ITEM_BY_ID[i.kind].category!=='decor'||i.kind==='mushrooms')).map(i=>i.kind));
  const plants=world.items.filter(i=>['plants','water'].includes(ITEM_BY_ID[i.kind].category));
  const level=levelFor(world.xp),next=LEVELS[level];
  return {level,title:LEVELS[level-1].name,nextXP:next?.xp??null,levelXP:LEVELS[level-1].xp,income:(species.size?1:0)+world.items.reduce((sum,item)=>sum+ITEM_BY_ID[item.kind].income,0)+species.size*.2,capacity:100+level*40,species:species.size,plants:plants.length,biodiversity:Math.min(100,species.size*10),growth:plants.length?plants.reduce((sum,i)=>sum+i.growth,0)/plants.length:0,occupied:world.items.length,free:TILES.length-world.items.length};
}
export function advance(world,now=Date.now()){
  const seconds=clamp((now-world.lastUpdate)/1000,0,MAX_CATCHUP_SECONDS);
  if(seconds===0)return {...world,lastUpdate:Math.max(world.lastUpdate,now)};
  const hours=seconds/3600,drying=world.weather==='rain'?-12:world.weather==='mist'?3:6;
  // Integrate only the part of an interval where the soil is wet enough.
  const wetHours=drying<0?(world.moisture>=20?hours:Math.max(0,hours-(20-world.moisture)/12)):Math.min(hours,Math.max(0,(world.moisture-20)/drying));
  const details=summary(world);
  const items=world.items.map(item=>({...item,growth:ITEM_BY_ID[item.kind].income>0?clamp(item.growth+wetHours*180,0,100):100}));
  const xp=clamp(world.xp+(details.species?wetHours*60*.7:0),0,50000),capacity=100+levelFor(xp)*40;
  return {...world,items,moisture:clamp(world.moisture-hours*drying,0,100),growth:items.find(i=>i.kind==='oak')?.growth??world.growth,stored:clamp(world.stored+wetHours*60*details.income,0,capacity),xp,stats:{...world.stats,seconds:world.stats.seconds+seconds},lastUpdate:Math.max(world.lastUpdate,now)};
}
const result=(world,error='',extra={})=>({world,error,...extra});
export function canPlace(world,kind,col,row,ignoreId=null){
  const item=ITEM_BY_ID[kind];if(!item)return 'Element necunoscut.';
  const terrain=terrainAt(col,row);if(!terrain)return 'Alege un loc pe insulă.';
  if(item.terrain!==terrain)return item.terrain==='water'?'Acest element se așază în iaz.':'Acest element are nevoie de pământ.';
  if(world.items.some(i=>i.col===col&&i.row===row&&i.id!==ignoreId))return 'Locul este deja ocupat.';
  return '';
}
export function placeItem(world,kind,col,row,now=Date.now()){
  const current=advance(world,now),item=ITEM_BY_ID[kind];
  if(!item)return result(current,'Element necunoscut.');
  if(levelFor(current.xp)<item.level)return result(current,`Se deblochează la nivelul ${item.level}.`);
  if(current.leaves<item.cost)return result(current,'Nu ai suficiente frunze. Colectează din ecosistem sau încheie o misiune.');
  const error=canPlace(current,kind,col,row);if(error)return result(current,error);
  const entity={id:`item-${current.nextId}`,kind,col,row,growth:item.income>0?12:100,starter:false};
  return result({...current,leaves:current.leaves-item.cost,xp:current.xp+item.xp,nextId:current.nextId+1,items:[...current.items,entity],discovered:[...new Set([...current.discovered,kind])],stats:{...current.stats,placed:current.stats.placed+1}},'',{entity});
}
export function moveItem(world,id,col,row,now=Date.now()){
  const current=advance(world,now),entity=current.items.find(i=>i.id===id);if(!entity)return result(current,'Selectează mai întâi un element.');
  const error=canPlace(current,entity.kind,col,row,id);if(error)return result(current,error);
  return result({...current,items:current.items.map(i=>i.id===id?{...i,col,row}:i)});
}
export function removeItem(world,id,now=Date.now()){
  const current=advance(world,now),entity=current.items.find(i=>i.id===id);if(!entity)return result(current,'Selectează mai întâi un element.');
  const refund=entity.starter?0:Math.floor(ITEM_BY_ID[entity.kind].cost/2);
  return result({...current,leaves:current.leaves+refund,items:current.items.filter(i=>i.id!==id)},'',{refund,entity});
}
export function water(world,now=Date.now()){
  const current=advance(world,now);
  if(now-current.lastWater<WATER_COOLDOWN)return result(current,'Ploaia tocmai a trecut. Așteaptă câteva secunde.');
  if(current.moisture>=95)return result(current,'Solul are deja suficientă apă.');
  return result({...current,moisture:clamp(current.moisture+22,0,100),lastWater:now,xp:current.xp+3,stats:{...current.stats,watered:current.stats.watered+1}});
}
export function collect(world,now=Date.now()){
  const current=advance(world,now),amount=Math.floor(current.stored);if(amount<1)return result(current,'Frunzele se adună în timp. Revino în câteva secunde.');
  return result({...current,stored:current.stored-amount,leaves:current.leaves+amount,xp:current.xp+amount*.4,stats:{...current.stats,collected:current.stats.collected+amount}},'',{amount});
}
export const MISSIONS=[
  {id:'first',title:'Pune-ți amprenta',text:'Adaugă primul element pe insulă.',target:1,progress:w=>w.stats.placed,leaves:35,xp:25},
  {id:'water',title:'Un strop de grijă',text:'Udă ecosistemul o dată.',target:1,progress:w=>w.stats.watered,leaves:25,xp:15},
  {id:'builder',title:'Grădina ta prinde contur',text:'Adaugă 4 elemente noi.',target:4,progress:w=>w.stats.placed,leaves:50,xp:30},
  {id:'collect',title:'Roadele răbdării',text:'Colectează 15 frunze produse de insulă.',target:15,progress:w=>w.stats.collected,leaves:45,xp:25},
  {id:'diversity',title:'Mai multă viață',text:'Adună 7 specii productive diferite pe insulă.',target:7,progress:w=>summary(w).species,leaves:60,xp:35},
  {id:'pond',title:'O lume sub luciul apei',text:'Așază 3 tipuri diferite de elemente în iaz.',target:3,progress:w=>new Set(w.items.filter(i=>ITEM_BY_ID[i.kind].terrain==='water').map(i=>i.kind)).size,leaves:60,xp:40},
  {id:'haven',title:'Un refugiu adevărat',text:'Ajungi la nivelul 3.',target:3,progress:w=>levelFor(w.xp),leaves:75,xp:35},
  {id:'grove',title:'Un colț de pădure',text:'Ai 10 plante și elemente acvatice pe insulă.',target:10,progress:w=>summary(w).plants,leaves:80,xp:40},
  {id:'mature',title:'Timpul lasă frunze',text:'Crește 3 plante până la maturitate.',target:3,progress:w=>w.items.filter(i=>['plants','water'].includes(ITEM_BY_ID[i.kind].category)&&i.growth>=100).length,leaves:100,xp:50}
];
export function claimMission(world,id,now=Date.now()){
  const current=advance(world,now),mission=MISSIONS.find(m=>m.id===id);
  if(!mission||current.claimed.includes(id))return result(current,'Recompensa a fost deja primită sau misiunea nu există.');
  if(mission.progress(current)<mission.target)return result(current,'Misiunea încă nu este completă.');
  return result({...current,leaves:current.leaves+mission.leaves,xp:current.xp+mission.xp,claimed:[...current.claimed,id]},'',{mission});
}
export function parseWorld(raw,now=Date.now()){
  const saved=JSON.parse(raw),initial=createWorld(now);
  if(!saved||![1,2].includes(saved.version)||saved.ecosystem!=='pond')throw Error('Fișierul nu este o salvare Terraquarium compatibilă.');
  if(saved.version===2&&!Array.isArray(saved.items))throw Error('Salvarea este incompletă. Alege o copie exportată din Terraquarium.');
  const common={moisture:number(saved.moisture,62,0,100),lastUpdate:number(saved.lastUpdate,now,0,now),theme:['day','night','auto'].includes(saved.theme)?saved.theme:'auto',motionPaused:saved.motionPaused===true};
  if(saved.version===1){const growth=number(saved.growth,18,0,100);return advance({...initial,...common,growth,items:initial.items.map(i=>i.kind==='oak'?{...i,growth}:i)},now);}
  const occupied=new Set(),ids=new Set();
  const items=Array.isArray(saved.items)?saved.items.slice(0,TILES.length).flatMap((item,index)=>{
    if(!item||!ITEM_BY_ID[item.kind]||terrainAt(item.col,item.row)!==ITEM_BY_ID[item.kind].terrain||occupied.has(`${item.col}:${item.row}`))return [];
    occupied.add(`${item.col}:${item.row}`);
    const candidate=typeof item.id==='string'&&/^[a-z0-9-]{1,40}$/.test(item.id)?item.id:`restored-${index}`;
    let id=candidate,suffix=0;while(ids.has(id))id=`restored-${index}-${++suffix}`;ids.add(id);
    return [{id,kind:item.kind,col:item.col,row:item.row,growth:number(item.growth,12,0,100),starter:item.starter===true}];
  }):initial.items;
  const numericIds=items.map(i=>/^item-(\d+)$/.exec(i.id)).filter(Boolean).map(match=>Number(match[1])).filter(value=>Number.isSafeInteger(value)&&value<1e7);
  const stats=saved.stats&&typeof saved.stats==='object'?saved.stats:{};
  return advance({...initial,...common,items,name:typeof saved.name==='string'?saved.name.trim().slice(0,32)||initial.name:initial.name,weather:['clear','rain','mist'].includes(saved.weather)?saved.weather:'clear',leaves:number(saved.leaves,140,0,1e7),stored:number(saved.stored,0,0,340),xp:number(saved.xp,0,0,50000),lastWater:number(saved.lastWater,0,0,now),nextId:Math.max(Math.floor(number(saved.nextId,1,1,1e7)),...numericIds.map(id=>id+1)),discovered:[...new Set([...(Array.isArray(saved.discovered)?saved.discovered.filter(id=>ITEM_BY_ID[id]):[]),...items.map(i=>i.kind)])],claimed:Array.isArray(saved.claimed)?[...new Set(saved.claimed.filter(id=>MISSIONS.some(m=>m.id===id)))]:[],stats:{placed:Math.floor(number(stats.placed,0)),watered:Math.floor(number(stats.watered,0)),collected:Math.floor(number(stats.collected,0)),seconds:number(stats.seconds,0,0,1e9)}},now);
}
export function restoreWorld(raw,now=Date.now()){try{return parseWorld(raw,now);}catch{return createWorld(now);}}
