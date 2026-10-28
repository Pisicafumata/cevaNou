import { GRID, TILES, ITEM_BY_ID, terrainAt, tilePoint } from './catalog.js';
import { canPlace } from './simulation.js';
import { sprite } from './sprites.js';

export function isNight(world){const hour=new Date().getHours();return world.theme==='night'||(world.theme==='auto'&&(hour<7||hour>=20));}
export function createScene(canvas,getWorld,getView,onTile){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D nu este disponibil.');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let running=false,frame=0,timeoutFrame=false,lastFrame=-Infinity,previous=0,time=0,rainUntil=0;
  const rand=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
  const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
  const p=(points,color,stroke)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(color){ctx.fillStyle=color;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
  const diamond=(x,y,color,stroke)=>p([[x,y-17],[x+36,y],[x,y+17],[x-36,y]],color,stroke);
  function cloud(x,y,size,color){ctx.save();ctx.translate(Math.round(x),y);ctx.scale(size,size);r(0,5,64,9,color);r(11,-2,38,9,color);r(23,-8,16,8,color);ctx.restore();}

  function draw(stamp){
    const world=getWorld(),view=getView(),night=isNight(world),still=world.motionPaused||reduced.matches;
    ctx.clearRect(0,0,960,600);
    const sky=ctx.createLinearGradient(0,0,0,600);sky.addColorStop(0,night?'#122d36':'#d7e4d3');sky.addColorStop(.65,night?'#35564e':'#bdd1b3');sky.addColorStop(1,night?'#1c3b36':'#d2dfbf');ctx.fillStyle=sky;ctx.fillRect(0,0,960,600);
    if(night){for(let i=0;i<70;i++){ctx.globalAlpha=.25+(Math.sin(time*.5+i)+1)*.25;r(rand(i+1)*960,rand(i+110)*300, i%5?1:2,1,'#d6e2b8');}ctx.globalAlpha=1;r(767,69,29,33,'#e2dfb5');r(761,75,41,21,'#e2dfb5');r(780,68,23,23,'#1b3740');}
    else{ctx.fillStyle='#f5e8b82b';ctx.beginPath();ctx.arc(784,90,55,0,7);ctx.fill();r(767,72,34,34,'#f2e6b4');r(761,79,46,20,'#f2e6b4');}
    cloud(106+Math.sin(time*.035)*24,99,1.2,night?'#32514f':'#edf1db');cloud(676+Math.sin(time*.045+2)*32,171,.8,night?'#385b53':'#dfe9d0');cloud(444+Math.sin(time*.04+1)*19,63,.6,night?'#2b4b4b':'#e8efdb');
    // Layered silhouettes keep the scene atmospheric without external artwork.
    for(let layer=0;layer<3;layer++){
      const points=[[0,600],[0,260+layer*65]];
      for(let i=0;i<=24;i++){const xx=i*43,yy=205+layer*65+rand(i+layer*70)*55;points.push([xx,yy],[xx+43,yy]);}
      points.push([960,600]);p(points,night?['#284c47','#31594b','#3c644e'][layer]:['#a9c49e','#99b68a','#b1c59b'][layer]);
    }
    const haze=ctx.createLinearGradient(0,315,0,600);haze.addColorStop(0,night?'#284c4700':'#d2dfbf00');haze.addColorStop(1,night?'#284c47':'#d2dfbf');ctx.fillStyle=haze;ctx.fillRect(0,315,960,285);
    ctx.save();ctx.translate(480,325);ctx.scale(view.zoom,view.zoom);ctx.translate(-480,-325);
    ctx.fillStyle=night?'#0b242d35':'#65855b25';ctx.beginPath();ctx.ellipse(485,505,258,31,0,0,7);ctx.fill();
    // Terrarium arch and a pair of quiet glass highlights.
    ctx.strokeStyle=night?'#c8e4c020':'#faffeb80';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(190,422);ctx.lineTo(190,260);ctx.bezierCurveTo(190,5,805,5,805,260);ctx.lineTo(805,422);ctx.stroke();
    ctx.strokeStyle=night?'#c8e4c029':'#fbffe8a0';ctx.beginPath();ctx.moveTo(208,235);ctx.bezierCurveTo(213,176,243,136,292,113);ctx.stroke();r(207,251,2,54,night?'#a7c6ad22':'#fcffed60');
    // Isometric soil sides under every front-facing edge.
    const ordered=[...TILES].sort((a,b)=>(a.col+a.row)-(b.col+b.row));
    for(const tile of ordered){const {x,y}=tilePoint(tile.col,tile.row);
      if(!terrainAt(tile.col,tile.row+1)){
        p([[x-36,y],[x,y+17],[x,y+70],[x-36,y+49]],night?'#4d5845':'#83764d');
        p([[x-36,y+26],[x,y+45],[x,y+54],[x-36,y+35]],night?'#444f40':'#6e6946');
      }
      if(!terrainAt(tile.col+1,tile.row)){
        p([[x,y+17],[x+36,y],[x+36,y+49],[x,y+70]],night?'#3c4b3e':'#6c6542');
        p([[x,y+45],[x+36,y+26],[x+36,y+35],[x,y+54]],night?'#334436':'#5d5c3c');
      }
    }
    for(const tile of ordered){const {x,y}=tilePoint(tile.col,tile.row),water=terrainAt(tile.col,tile.row)==='water',tone=rand(tile.col*30+tile.row);
      diamond(x,y,water?(night?'#4d887e':'#83b5a3'):(night?(tone>.5?'#52734c':'#587c50'):(tone>.5?'#91b363':'#9abb6c')));
      if(water){r(x-12+Math.sin(time+tile.row)*3,y-2,24,1,night?'#80b4a0':'#c7e0b8');r(x+6,y+5,12,1,night?'#659c8a':'#a5d0ac');}
      else{for(let i=0;i<4;i++)r(x-18+rand(tile.col*40+tile.row+i)*36,y-5+rand(tile.row*40+i)*10,2,2,night?'#78945b':'#b9ce81');}
    }
    for(let i=0;i<23;i++){const x=297+i*17,y=452+Math.sin(i)*12;if(i%4===0)r(x,y,2,10+i%3*5,night?'#6a7050':'#a39262');}
    // The grid indicates legal placement, including the pond boundary.
    if(view.grid||view.mode==='place'||view.mode==='move')for(const tile of ordered){const {x,y}=tilePoint(tile.col,tile.row);let color=night?'#d4e8c32b':'#38563b33';if(view.kind&&canPlace(world,view.kind,tile.col,tile.row,view.mode==='move'?view.selected:null)==='')color=night?'#9cd3b260':'#35634b65';diamond(x,y,null,color);}
    const target=view.hover;
    if(target&&terrainAt(target.col,target.row)){
      const {x,y}=tilePoint(target.col,target.row),error=view.kind?canPlace(world,view.kind,target.col,target.row,view.mode==='move'?view.selected:null):'';
      diamond(x,y,error?'#d39a8155':'#eff3c34d',error?'#d3a48e':'#e0ecc4');
    }
    const entities=[...world.items].sort((a,b)=>(a.col+a.row)-(b.col+b.row)||a.col-b.col);
    for(const entity of entities){const {x,y}=tilePoint(entity.col,entity.row);
      if(entity.id===view.selected)diamond(x,y,'#e9edb22b','#f0e4a1');
      sprite(ctx,entity.kind,x,y,{growth:entity.growth,time,seed:entity.col+entity.row*7,night,alpha:(view.mode==='move'&&entity.id===view.selected) ? .4 : 1});
    }
    if(target&&view.kind&&['place','move'].includes(view.mode)&&!canPlace(world,view.kind,target.col,target.row,view.mode==='move'?view.selected:null)){
      const {x,y}=tilePoint(target.col,target.row);sprite(ctx,view.kind,x,y,{growth:65,time,night,alpha:.5});
    }
    if(night){for(let i=0;i<8;i++){const x=310+rand(i+53)*340+Math.sin(time*.4+i)*18,y=260+rand(i+65)*140;ctx.globalAlpha=.3+Math.abs(Math.sin(time+i))*.5;r(x,y,2,2,'#dfebb3');}ctx.globalAlpha=1;}
    if(!still&&(world.weather==='rain'||stamp<rainUntil)){ctx.globalAlpha=.55;for(let i=0;i<90;i++){const x=210+rand(i+75)*565,y=105+((time*150+i*19)%340);r(x,y,1,8,'#b7d3bf');}ctx.globalAlpha=1;}
    if(world.weather==='mist'){for(let i=0;i<3;i++){const fog=ctx.createLinearGradient(0,320+i*38,0,410+i*38);fog.addColorStop(0,'#d8e6cf00');fog.addColorStop(.5,'#d8e6cf25');fog.addColorStop(1,'#d8e6cf00');ctx.fillStyle=fog;ctx.fillRect(190,320+i*38,615,90);}}
    ctx.strokeStyle=night?'#d0e8c025':'#faffec60';ctx.beginPath();ctx.moveTo(189,421);ctx.bezierCurveTo(210,486,782,486,806,421);ctx.stroke();
    ctx.restore();
  }
  function fromPointer(event){
    const bounds=canvas.getBoundingClientRect(),view=getView();
    const sx=(event.clientX-bounds.left)/bounds.width*960,sy=(event.clientY-bounds.top)/bounds.height*600;
    const x=(sx-480)/view.zoom+480,y=(sy-325)/view.zoom+325;
    const col=Math.round(((x-GRID.x)/GRID.dx+(y-GRID.y)/GRID.dy)/2),row=Math.round(((y-GRID.y)/GRID.dy-(x-GRID.x)/GRID.dx)/2);
    if(view.mode!=='place'&&!(view.mode==='move'&&view.selected)){
      const objects=[...getWorld().items].sort((a,b)=>(b.col+b.row)-(a.col+a.row)||b.col-a.col);
      const hit=objects.find(item=>{
        const point=tilePoint(item.col,item.row),tree=['oak','willow','pine','bonsai'].includes(item.kind);
        const height=tree?110*(.6+item.growth*.004):['bamboo','crystal','fountain'].includes(item.kind)?70:38;
        const width=tree?42:26;
        return Math.abs(x-point.x)<width&&y<=point.y+7&&y>=point.y-height;
      });
      if(hit)return {col:hit.col,row:hit.row};
    }
    return terrainAt(col,row)?{col,row}:null;
  }
  canvas.addEventListener('pointermove',event=>{getView().hover=fromPointer(event);if(!running||getWorld().motionPaused||reduced.matches)draw(performance.now());});
  canvas.addEventListener('pointerleave',()=>{getView().hover=null;draw(performance.now());});
  canvas.addEventListener('click',event=>{const tile=fromPointer(event);if(tile)onTile(tile);});
  canvas.addEventListener('keydown',event=>{
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    const view=getView();if(delta){event.preventDefault();const tile=view.hover||{col:4,row:3};view.hover={col:Math.max(0,Math.min(7,tile.col+delta[0])),row:Math.max(0,Math.min(6,tile.row+delta[1]))};const object=getWorld().items.find(i=>i.col===view.hover.col&&i.row===view.hover.row);canvas.setAttribute('aria-label',`Loc ${view.hover.col+1}, ${view.hover.row+1}: ${object?ITEM_BY_ID[object.kind].name:terrainAt(view.hover.col,view.hover.row)==='water'?'apă liberă':terrainAt(view.hover.col,view.hover.row)?'pământ liber':'în afara insulei'}. Enter pentru acțiune, Escape pentru anulare.`);draw(performance.now());}
    if(event.key==='Enter'||event.key===' '){event.preventDefault();onTile(view.hover||{col:4,row:3});}
  });
  function loop(stamp){if(!running)return;const still=getWorld().motionPaused||reduced.matches;
    if(stamp-lastFrame>=(still?1000:1000/30)){if(!still&&previous)time+=Math.min((stamp-previous)/1000,.15);previous=stamp;lastFrame=stamp;draw(stamp);}
    timeoutFrame=still;frame=still?setTimeout(()=>loop(performance.now()),1000):requestAnimationFrame(loop);
  }
  function stop(){running=false;if(timeoutFrame)clearTimeout(frame);else cancelAnimationFrame(frame);previous=0;}
  return {start(){if(running)return;running=true;lastFrame=-Infinity;previous=0;loop(performance.now());},stop,refresh(){draw(performance.now());},rain(){rainUntil=performance.now()+2200;draw(performance.now());}};
}
