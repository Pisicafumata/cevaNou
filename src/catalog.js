export const CATEGORIES = [{id:'all',label:'Toate'},{id:'plants',label:'Plante'},{id:'water',label:'Apă'},{id:'decor',label:'Decor'},{id:'life',label:'Viață'}];
export const CATALOG = [
  {id:'fern',name:'Ferigă',category:'plants',terrain:'land',cost:20,level:1,xp:10,income:.45,description:'Frunze desfăcute, un mic adăpost verde.'},
  {id:'flowers',name:'Flori de câmp',category:'plants',terrain:'land',cost:18,level:1,xp:10,income:.35,description:'Un strop de culoare printre firele de iarbă.'},
  {id:'oak',name:'Stejar',category:'plants',terrain:'land',cost:45,level:1,xp:16,income:.9,description:'Un răsad care va deveni inima insulei.'},
  {id:'reeds',name:'Stuf',category:'water',terrain:'land',cost:22,level:1,xp:10,income:.4,description:'Tulpini înalte care se leagănă în vânt.'},
  {id:'lily',name:'Nufăr',category:'water',terrain:'water',cost:25,level:1,xp:12,income:.5,description:'O frunză plutitoare pentru oglinda iazului.'},
  {id:'stone',name:'Pietre de râu',category:'decor',terrain:'land',cost:12,level:1,xp:6,income:0,description:'Forme simple, tocite de apă și de timp.'},
  {id:'mushrooms',name:'Ciupercuțe',category:'decor',terrain:'land',cost:24,level:1,xp:10,income:.2,description:'Un mic colț de poveste, la umbra plantelor.'},
  {id:'bamboo',name:'Bambus',category:'plants',terrain:'land',cost:38,level:2,xp:14,income:.7,description:'Linii înalte și frunze care foșnesc încet.'},
  {id:'lotus',name:'Lotus roz',category:'water',terrain:'water',cost:42,level:2,xp:16,income:.8,description:'O floare delicată care se deschide peste apă.'},
  {id:'lantern',name:'Felinar',category:'decor',terrain:'land',cost:36,level:2,xp:12,income:0,description:'O lumină caldă pentru serile de pe insulă.'},
  {id:'willow',name:'Salcie',category:'plants',terrain:'land',cost:65,level:3,xp:22,income:1.1,description:'Ramuri lungi, moi, deasupra unui colț liniștit.'},
  {id:'koi',name:'Pește koi',category:'life',terrain:'water',cost:60,level:3,xp:20,income:.45,description:'O pată portocalie care dansează în iaz.'},
  {id:'butterflies',name:'Fluturi',category:'life',terrain:'land',cost:52,level:3,xp:18,income:.55,description:'Vizitatori colorați pentru grădina ta.'},
  {id:'bridge',name:'Podeț de lemn',category:'decor',terrain:'water',cost:55,level:3,xp:18,income:0,description:'Un mic drum peste apă, fără grabă.'},
  {id:'pine',name:'Pin de munte',category:'plants',terrain:'land',cost:72,level:4,xp:24,income:1.25,description:'O siluetă de pădure, verde în orice anotimp.'},
  {id:'bench',name:'Bancă de grădină',category:'decor',terrain:'land',cost:48,level:4,xp:16,income:0,description:'Un loc imaginar pentru o pauză adevărată.'},
  {id:'fireflies',name:'Licurici',category:'life',terrain:'land',cost:80,level:4,xp:26,income:.7,description:'Mici constelații care se aprind la căderea nopții.'},
  {id:'bonsai',name:'Arțar bonsai',category:'plants',terrain:'land',cost:95,level:5,xp:30,income:1.6,description:'O coroană de toamnă, într-o lume în miniatură.'},
  {id:'crystal',name:'Cristal de rouă',category:'decor',terrain:'land',cost:110,level:5,xp:32,income:.5,description:'Prinde lumina și o împarte în nuanțe reci.'},
  {id:'fountain',name:'Fântâna izvorului',category:'decor',terrain:'land',cost:140,level:6,xp:40,income:1.2,description:'Un izvor mic pentru o lume care a crescut mare.'}
];
export const ITEM_BY_ID=Object.assign(Object.create(null),Object.fromEntries(CATALOG.map(item=>[item.id,item])));
export const LEVELS=[{xp:0,name:'Primul răsad'},{xp:35,name:'Grădină în devenire'},{xp:105,name:'Refugiu viu'},{xp:220,name:'Oază înfloritoare'},{xp:390,name:'Sanctuar verde'},{xp:650,name:'Lume în echilibru'}];
export const GRID={cols:8,rows:7,x:480,y:232,dx:36,dy:17};
export function isTile(col,row){return Number.isInteger(col)&&Number.isInteger(row)&&col>=0&&col<8&&row>=0&&row<7&&!([0,7].includes(col)&&[0,6].includes(row));}
export function terrainAt(col,row){if(!isTile(col,row))return null;return ((col===1&&row>=3&&row<=4)||(col===2&&row>=3&&row<=5)||(col===3&&row>=4&&row<=5))?'water':'land';}
export const TILES=Array.from({length:56},(_,i)=>({col:i%8,row:Math.floor(i/8)})).filter(t=>isTile(t.col,t.row));
export function tilePoint(col,row){return {x:GRID.x+(col-row)*GRID.dx,y:GRID.y+(col+row)*GRID.dy};}
