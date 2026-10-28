// Hand-drawn pixel sprites shared by the island, placement ghosts, and catalogue.
export function sprite(ctx,kind,x,y,{growth=100,time=0,seed=0,night=false,scale=1,alpha=1}={}){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);ctx.globalAlpha*=alpha;
  const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
  const p=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
  const sway=Math.round(Math.sin(time*.8+seed)*1.5),leaf=night?['#34584d','#50816a','#79a67a','#b3c68a']:['#42694b','#639052','#8cac60','#c1d77e'];
  const flower=(x,y,color)=>{r(x,y-12,2,13,leaf[0]);r(x-4,y-6,4,2,leaf[1]);r(x-3,y-17,8,5,color);r(x,y-20,2,11,color);r(x,y-16,2,2,'#efd89b');};
  const canopy=(x,y,w,h,palette=leaf)=>{r(x-w/2,y,w,h,palette[0]);r(x-w/2-4,y-5,w+8,h-4,palette[1]);r(x-w/2+2,y-12,w-4,14,palette[2]);r(x-w/2+9,y-17,w-18,8,palette[3]);r(x-w/2+7,y+2,4,3,palette[0]);r(x+w/2-7,y-5,3,3,palette[1]);};
  const size=.6+growth*.004;
  switch(kind){
    case 'oak':case 'willow':case 'bonsai':{
      ctx.scale(size,size);const bonsai=kind==='bonsai',willow=kind==='willow',h=willow?72:bonsai?43:62;
      r(-5,-h,10,h,night?'#716951':'#9b7d52');r(2,-h,3,h,night?'#8f8060':'#c49d64');
      p([[-2,-22],[-24,-48],[-23,-56],[4,-32]],'#8e7750');p([[1,-35],[20,-56],[25,-57],[5,-28]],'#8e7750');
      p([[-13,3],[-4,-10],[5,-10],[13,3]],'#8e7750');
      const colors=bonsai?['#8a574d','#b46a54','#d79066','#efb27e']:leaf;
      canopy(-19+sway,-h+4,39,22,colors);canopy(20+sway,-h-3,43,22,colors);canopy(sway,-h-20,47,23,colors);
      if(willow){for(let i=0;i<9;i++){const xx=-41+i*10+sway;r(xx,-h-3,4,31+(i%3)*8,leaf[i%3]);r(xx+2,-h+18,3,14,leaf[2]);}}
      break;
    }
    case 'pine':{
      ctx.scale(size,size);r(-4,-70,8,72,'#9b8059');p([[0,-105],[-21,-65],[21,-65]],leaf[2]);p([[0,-84],[-29,-39],[29,-39]],leaf[1]);p([[0,-60],[-36,-12],[36,-12]],leaf[0]);p([[0,-102],[-6,-69],[8,-69]],leaf[3]);r(-16,-40,14,3,leaf[2]);break;
    }
    case 'fern':{
      ctx.scale(.65+growth*.0035,.65+growth*.0035);r(0,-33,2,35,leaf[0]);for(let i=0;i<5;i++){const w=22-i*4,y=-5-i*6;r(-w+sway,y-5,w,4,leaf[i%3]);r(2+sway,y-8,w,4,leaf[(i+1)%3]);r(-w+sway,y-8,5,4,leaf[2]);}break;
    }
    case 'flowers':{ctx.scale(.7+growth*.003,.7+growth*.003);flower(-13,-1,'#f1d5b3');flower(1,-7,'#e6bca5');flower(13,1,'#e9dba8');r(-20,0,38,3,leaf[1]);break;}
    case 'reeds':{for(let i=0;i<5;i++){let xx=-14+i*7,h=23+(i%3)*10;r(xx+sway,-h,2,h,leaf[1]);r(xx-2+sway,-h-9,5,11,'#a38852');r(xx-5,-12,5,2,leaf[2]);}break;}
    case 'bamboo':{for(let i=0;i<3;i++){let xx=(i-1)*13,h=48+i%2*17;r(xx+sway,-h,4,h,leaf[1]);for(let j=0;j<4;j++)r(xx+sway,-8-j*14,4,2,leaf[3]);p([[xx+2,-h+13],[xx+25,-h+2],[xx+13,-h+16]],leaf[2]);p([[xx,-h+27],[xx-23,-h+17],[xx-10,-h+31]],leaf[1]);}break;}
    case 'lily':case 'lotus':{
      p([[-24,-1],[-16,-8],[12,-9],[24,-2],[15,5],[-13,6]],leaf[1]);p([[0,0],[17,-4],[24,-2],[15,5]],leaf[2]);
      if(kind==='lotus'){p([[0,-26],[-7,-17],[-16,-21],[-13,-10],[-23,-13],[-15,-3],[0,0],[16,-4],[23,-14],[12,-12],[15,-22],[7,-17]],night?'#bd9bba':'#e7b2bb');r(-3,-13,6,6,'#f0d69b');}else{flower(2,-2,'#efe4bc');}break;
    }
    case 'stone':{p([[-26,2],[-23,-12],[-10,-21],[3,-18],[12,-4],[11,5]],night?'#7d8a7d':'#a9b3a0');p([[-23,-12],[-10,-21],[3,-18],[0,-13]],'#c9cbb2');p([[2,4],[4,-5],[18,-12],[28,-6],[30,4],[19,8]],night?'#61746a':'#889d8b');r(9,-5,11,2,'#b7c1a6');break;}
    case 'mushrooms':{for(const [xx,yy,s] of [[-10,1,1],[9,-4,.75],[17,4,.55]]){ctx.save();ctx.translate(xx,yy);ctx.scale(s,s);r(-2,-15,5,16,'#dfd4af');r(-13,-16,26,5,'#bb805b');r(-9,-23,18,8,'#d3956b');r(-4,-27,9,5,'#dca475');r(-6,-21,3,3,'#edcf9b');r(4,-20,3,2,'#edcf9b');ctx.restore();}break;}
    case 'lantern':{
      if(night){ctx.fillStyle='#edc47a18';ctx.beginPath();ctx.arc(0,-19,43,0,7);ctx.fill();ctx.fillStyle='#edc47a22';ctx.beginPath();ctx.arc(0,-19,24,0,7);ctx.fill();}
      r(-2,-25,4,27,'#746c55');r(-9,0,18,4,'#958668');r(-10,-32,20,20,night?'#f6d48f':'#c5c6a0');r(-12,-35,24,4,'#6c725b');p([[-14,-35],[0,-44],[14,-35]],'#7e8063');r(-12,-14,24,4,'#6c725b');r(-8,-31,2,17,'#7e775a');r(6,-31,2,17,'#7e775a');break;
    }
    case 'bridge':{for(let i=0;i<8;i++){const yy=-9+i*3;r(-29,yy,58,3,i%2?'#aa8e61':'#c5a474');}r(-29,-21,3,33,'#826b49');r(27,-21,3,33,'#826b49');r(-29,-19,58,3,'#c4a06f');r(-29,8,58,3,'#8c714b');break;}
    case 'bench':{r(-24,-17,48,6,'#b29167');r(-24,-25,48,5,'#c4a274');r(-24,-8,48,7,'#ac8c5e');r(-21,-4,4,11,'#776948');r(17,-4,4,11,'#776948');r(-26,-26,3,25,'#7a714f');r(23,-26,3,25,'#7a714f');break;}
    case 'koi':{const xx=Math.sin(time*.65+seed)*14,yy=Math.cos(time*.8+seed)*4;p([[xx-17,yy],[xx-24,yy-6],[xx-23,yy+6]],'#c5d8bb');p([[xx-17,yy],[xx-8,yy-5],[xx+10,yy-4],[xx+17,yy],[xx+10,yy+5],[xx-8,yy+4]],'#e7d7b2');r(xx-4,yy-4,9,8,'#d89460');r(xx+11,yy-1,2,2,'#385b4a');break;}
    case 'butterflies':{for(let i=0;i<3;i++){const xx=Math.sin(time*.8+i*2+seed)*18,yy=-20+Math.cos(time*.7+i)*14-i*8,w=3+Math.abs(Math.sin(time*4+i))*5;r(xx-w,yy-3,w,6,['#e1c776','#d8b0a2','#b6cce0'][i]);r(xx+2,yy-3,w,6,['#e1c776','#d8b0a2','#b6cce0'][i]);r(xx,yy-2,2,6,'#656d4b');}break;}
    case 'fireflies':{for(let i=0;i<6;i++){const xx=Math.sin(time*.6+i*2+seed)*26,yy=-12+Math.cos(time*.8+i)*15-i*5;ctx.globalAlpha=alpha*(.5+.5*Math.abs(Math.sin(time+i)));r(xx-2,yy-2,6,6,night?'#d1ec9b25':'#8c996a20');r(xx,yy,2,2,night?'#d6eba0':'#819459');}break;}
    case 'crystal':{p([[-20,0],[-22,-25],[-12,-39],[-3,-28],[1,-47],[9,-57],[18,-40],[15,-2]],night?'#69aeb0':'#8cc4bf');p([[1,-47],[9,-57],[9,-3],[-2,1]],'#b4dfd0');p([[9,-57],[18,-40],[15,-2],[9,-3]],'#629d9e');p([[-20,0],[-22,-25],[-12,-39],[-11,-4]],'#a0d2c3');r(3,-35,3,7,'#e3f3da');break;}
    case 'fountain':{p([[-29,-5],[-18,-15],[18,-15],[29,-5],[18,10],[-18,10]],'#839889');p([[-23,-5],[-14,-11],[14,-11],[23,-5],[13,3],[-13,3]],'#a2c9bc');r(-5,-35,10,31,'#b4bda1');r(-13,-36,26,5,'#c4c9ad');r(-2,-49,4,14,'#b9e0cf');for(let i=0;i<5;i++){const yy=-27+((time*15+i*8)%28);r(-16,yy,2,6,'#bcddc9');r(15,yy,2,6,'#bcddc9');}break;}
  }
  ctx.restore();
}
export function drawThumbnail(canvas,kind){
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
  const tall=['oak','pine','willow'].includes(kind);sprite(ctx,kind,canvas.width/2,canvas.height-10,{scale:tall?.6:.95,growth:100,time:1});
}
