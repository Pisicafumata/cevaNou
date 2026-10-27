// All artwork is drawn here. No image downloads, textures, or external services.
export function createScene(canvas, getWorld) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D nu este disponibil în acest browser.');
  ctx.imageSmoothingEnabled = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, timeoutFrame = false, running = false, lastFrame = -Infinity, rainUntil = 0, animationTime = 0, previousTime = 0;
  const random = n => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  const rect = (x, y, width, height, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), width, height); };
  const polygon = (points, color) => {
    ctx.fillStyle = color; ctx.beginPath();
    points.forEach(([x,y], index) => index ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); ctx.fill();
  };

  function cloud(x, y, scale, color) {
    ctx.save(); ctx.translate(Math.round(x), y); ctx.scale(scale, scale);
    rect(0, 7, 46, 6, color); rect(7, 2, 24, 6, color); rect(15, -2, 10, 5, color);
    ctx.restore();
  }

  function grass(x, y, color, time, size = 1) {
    const sway = Math.round(Math.sin(time * .8 + x) * 1.5);
    rect(x, y - 9 * size, 2, 10 * size, color);
    rect(x - 3 + sway, y - 13 * size, 2, 6 * size, color);
    rect(x - 5 + sway, y - 15 * size, 2, 4 * size, color);
    rect(x + 3 + sway, y - 7 * size, 2, 6 * size, color);
    rect(x + 5 + sway, y - 10 * size, 2, 4 * size, color);
  }

  function fern(x, y, time, night) {
    const s = Math.round(Math.sin(time + x));
    rect(x, y - 20, 2, 21, night ? '#39635c' : '#4c784a');
    for (let i = 0; i < 4; i++) {
      const width = 10 - i * 2, yy = y - 4 - i * 5;
      rect(x - width + s, yy - 3, width, 3, night ? '#568776' : '#709956');
      rect(x + 2 + s, yy - 5, width, 3, night ? '#46796b' : '#608747');
    }
  }

  function drawTree(x, y, growth, time, night) {
    const height = 33 + growth * .43, width = 30 + growth * .36;
    const sway = Math.round(Math.sin(time * .7) * 1.2);
    const trunk = night ? '#675f4d' : '#8b7754';
    rect(x - 4, y - height, 8, height, trunk);
    rect(x + 2, y - height, 2, height, night ? '#807057' : '#b49b65');
    polygon([[x-7,y+2],[x-2,y-10],[x+4,y-9],[x+10,y+2]], trunk);
    polygon([[x,y-height*.55],[x-17,y-height*.83],[x-19,y-height*.96],[x+1,y-height*.65]], trunk);
    polygon([[x+2,y-height*.62],[x+20,y-height*.91],[x+24,y-height*.95],[x+5,y-height*.5]], trunk);
    const leaf = night ? ['#274e46','#35675a','#4d8270','#6c987b'] : ['#557646','#6b8b4d','#87a45b','#a6bd70'];
    const clusters = [[-width*.44,-height*.94,.7],[width*.38,-height*.98,.8],[0,-height*1.28,1],[-width*.2,-height*1.05,.9]];
    for (const [xx,yy,scale] of clusters) {
      const cx = Math.round(x+xx+sway), cy = Math.round(y+yy), w = Math.round(width*scale);
      rect(cx-w/2,cy,w,18,leaf[0]); rect(cx-w/2-5,cy-8,w+8,17,leaf[1]);
      rect(cx-w/2+1,cy-17,w-2,18,leaf[2]); rect(cx-w/2+7,cy-23,w-13,11,leaf[3]);
      for (let i=0;i<7;i++) rect(cx-w/2+random(i+xx)*w,cy-12+random(i+yy)*19,3,2,leaf[i%3]);
    }
    rect(x - 12, y + 1, 25, 3, night ? '#274b40' : '#6c8d44');
  }

  function draw(time, stamp) {
    const world = getWorld(), night = world.theme === 'night';
    const sky = ctx.createLinearGradient(0,0,0,360);
    sky.addColorStop(0,night ? '#172e38' : '#d9e5cf'); sky.addColorStop(1,night ? '#365649' : '#c6d8b6');
    ctx.fillStyle = sky; ctx.fillRect(0,0,640,360);

    if (night) {
      for (let i=0;i<45;i++) {
        ctx.globalAlpha = .25 + (Math.sin(time*.7+i)+1)*.25;
        rect(random(i+1)*640,random(i+71)*160+22, i%6===0?2:1,1,'#d8e6bf');
      }
      ctx.globalAlpha=1;
      rect(497,63,17,21,'#dedfbc');rect(494,67,23,13,'#dedfbc');rect(503,60,7,3,'#dedfbc');
      rect(506,61,13,16,'#1d3740');
    } else {
      rect(488,65,24,24,'#f0e5ad');rect(483,70,34,14,'#f0e5ad');
      ctx.globalAlpha=.3;rect(479,66,42,22,'#f0e5ad');ctx.globalAlpha=1;
    }
    cloud(66+Math.sin(time*.06)*17,99,1.1,night?'#35514f':'#eef1dd');
    cloud(402+Math.sin(time*.04+2)*23,117,.8,night?'#395951':'#e9edda');
    cloud(294+Math.sin(time*.05+1)*12,70,.5,night?'#2f4a4a':'#e9efdb');
    polygon([[0,208],[0,175],[34,175],[34,159],[67,159],[67,167],[107,167],[107,148],[159,148],[159,166],[203,166],[203,173],[258,173],[258,188],[360,188],[360,159],[410,159],[410,141],[449,141],[449,153],[490,153],[490,170],[530,170],[530,153],[573,153],[573,163],[610,163],[610,181],[640,181],[640,221]],night?'#2e514a':'#c1d1b1');
    polygon([[0,245],[0,208],[44,208],[44,195],[93,195],[93,211],[144,211],[144,201],[196,201],[196,220],[250,220],[250,201],[305,201],[305,208],[366,208],[366,191],[411,191],[411,199],[464,199],[464,188],[517,188],[517,201],[571,201],[571,214],[640,214],[640,260]],night?'#365d4f':'#afc49c');
    // Ground haze and island shadow.
    const haze = ctx.createLinearGradient(0,214,0,350);haze.addColorStop(0,night?'#36564900':'#cbd9b700');haze.addColorStop(1,night?'#365649':'#cbd9b7');ctx.fillStyle=haze;ctx.fillRect(0,214,640,146);
    ctx.fillStyle=night?'#203c3940':'#78956b28';ctx.beginPath();ctx.ellipse(322,304,173,14,0,0,Math.PI*2);ctx.fill();

    // Open glass dome; deliberately subtle so the plants stay the focus.
    ctx.strokeStyle=night?'#b0d5b82b':'#f8ffe873';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(139,251);ctx.lineTo(139,164);ctx.bezierCurveTo(139,29,501,29,501,164);ctx.lineTo(501,251);ctx.stroke();
    ctx.strokeStyle=night?'#b0d5b838':'#f8ffe8ad';ctx.beginPath();ctx.moveTo(152,165);ctx.bezierCurveTo(151,123,180,101,210,92);ctx.stroke();
    rect(151,171,2,29,night?'#729b8833':'#f5ffe969');

    // Cross-section of earth and moss.
    polygon([[148,224],[163,211],[476,211],[494,224],[484,260],[467,260],[467,276],[444,276],[444,287],[413,287],[413,296],[216,296],[216,287],[185,287],[185,273],[165,273],[165,250],[148,250]],night?'#4d5141':'#8d7854');
    polygon([[148,224],[189,237],[212,249],[265,248],[290,266],[382,265],[411,253],[473,249],[489,232],[484,260],[467,260],[467,276],[444,276],[444,287],[413,287],[413,296],[216,296],[216,287],[185,287],[185,273],[165,273],[165,250],[148,250]],night?'#434b3e':'#766748');
    polygon([[178,256],[198,266],[228,267],[242,279],[296,278],[317,287],[377,285],[401,277],[447,270],[465,261],[457,278],[435,278],[435,288],[407,288],[407,297],[231,297],[231,289],[205,289],[205,276],[185,273]],night?'#3c463b':'#685f42');
    for(let i=0;i<105;i++){const x=171+random(i+22)*305,y=240+random(i+222)*42;if(x<193&&y>268||x>452&&y>265)continue;rect(x,y,2+i%3,1+i%2,night?(i%2?'#626147':'#333f35'):(i%2?'#aa9266':'#5f5a3d'));}
    polygon([[145,220],[160,210],[179,210],[179,204],[221,204],[221,200],[286,200],[286,204],[338,204],[338,201],[400,201],[400,205],[464,205],[464,211],[482,211],[497,224],[485,233],[464,233],[464,239],[405,239],[405,243],[349,243],[349,241],[285,241],[285,245],[222,245],[222,238],[181,238],[181,234],[158,234]],night?'#426448':'#87a75d');
    polygon([[162,222],[190,214],[258,209],[297,213],[333,210],[408,212],[462,216],[485,225],[464,231],[412,234],[349,237],[285,235],[223,239],[181,233]],night?'#527850':'#a3ba72');
    // Pond, stepping shores, and lilies.
    polygon([[183,221],[204,212],[257,211],[283,216],[300,226],[288,237],[259,244],[211,239],[184,232]],night?'#3e695e':'#6f9c86');
    polygon([[190,220],[209,214],[257,214],[280,219],[291,226],[281,234],[256,239],[215,235],[190,230]],night?'#63917b':'#a1c4a2');
    rect(210,219,32,2,night?'#8db195':'#d0dfb5');rect(248+Math.sin(time)*3,229,23,1,night?'#84aa90':'#d4e2b8');
    rect(204+Math.sin(time*.8)*3,229,18,1,night?'#749f88':'#b9d6ad');rect(238,233,13,1,night?'#97b696':'#d5e3bc');
    rect(223,219,14,5,night?'#4c7957':'#779a50');rect(220,221,18,2,night?'#4c7957':'#779a50');rect(231,219,4,2,night?'#72925f':'#a1b665');
    rect(267,228,12,4,night?'#4c7957':'#799850');rect(270,225,3,4,night?'#cab5a5':'#efd5bd');rect(267,225,8,2,night?'#cab5a5':'#efd5bd');
    // Shore rocks and small plants.
    polygon([[294,231],[298,223],[308,221],[316,226],[316,232]],night?'#7a846b':'#b1b69a');rect(299,223,10,3,night?'#95a287':'#d4d6b5');
    polygon([[174,223],[178,218],[185,218],[191,223],[189,227],[176,227]],night?'#6d7d66':'#adb694');
    grass(181,218,night?'#4f7958':'#688c44',time,1.3);grass(200,213,night?'#5b865a':'#6a8d42',time,1.4);
    rect(198,190,2,13,night?'#857c55':'#947849');rect(198,186,3,7,night?'#a29a6c':'#b69a5b');
    grass(289,213,night?'#3b6850':'#6b8f45',time);fern(440,221,time,night);fern(464,222,time+1,night);
    for(let i=0;i<32;i++){const x=167+random(i+500)*309,y=211+random(i+540)*24;if(x<300&&x>180)continue;rect(x,y,2,2,night?'#719260':'#bad180');if(i%4===0)grass(x,y,night?'#355f46':'#6e9148',time,.45);}
    drawTree(364,222,world.growth,time,night);
    // A second seedling hints at future planting.
    rect(321,225,2,11,night?'#598368':'#668d4b');rect(316,220,6,3,night?'#7da171':'#9fba69');rect(323,216,7,4,night?'#7da171':'#9fba69');
    rect(418,229,3,8,night?'#a6ac85':'#ded5ad');rect(413,228,13,3,night?'#9b8b70':'#b78a5c');rect(416,225,7,4,night?'#ac9b7a':'#d1a96c');
    // A few roots underneath the island.
    for(let i=0;i<5;i++){const x=239+i*37;rect(x,288,2,10+random(i)*9,night?'#60644b':'#95865e');rect(x-3,295,4,2,night?'#60644b':'#95865e');}
    if(night){for(let i=0;i<8;i++){const x=185+random(i+190)*280+Math.sin(time*.4+i)*9,y=163+random(i+35)*65+Math.cos(time*.6+i)*7;ctx.globalAlpha=.35+(Math.sin(time+i)+1)*.3;rect(x-2,y-1,5,3,'#acc77733');rect(x,y,1,1,'#e0eca6');}ctx.globalAlpha=1;}
    if(stamp<rainUntil&&!world.motionPaused&&!reducedMotion.matches){for(let i=0;i<38;i++){const x=310+random(i+40)*108,y=130+((stamp*.12+i*19)%105);rect(x,y,1,6,'#81b5ad');}}
    // Foreground glass lip.
    ctx.strokeStyle=night?'#bad6b232':'#f7ffe972';ctx.beginPath();ctx.moveTo(137,250);ctx.bezierCurveTo(144,278,494,278,503,250);ctx.stroke();
    rect(484,187,2,23,night?'#9cbda32b':'#f5ffe954');
  }

  function loop(stamp) {
    if (!running) return;
    const world = getWorld();
    const still = world.motionPaused || reducedMotion.matches;
    const interval = still ? 1000 : 1000 / 30;
    if (stamp-lastFrame>=interval) {
      if(!still && previousTime) animationTime += Math.min((stamp-previousTime)/1000,.1);
      previousTime=stamp;lastFrame=stamp;draw(animationTime,stamp);
    }
    // Static scenes wake once per second; moving scenes cap drawing at 30 FPS.
    timeoutFrame = still;
    frame = still ? setTimeout(() => loop(performance.now()),1000) : requestAnimationFrame(loop);
  }
  function stop(){running=false;if(timeoutFrame)clearTimeout(frame);else cancelAnimationFrame(frame);previousTime=0;}
  return {
    start(){if(running)return;running=true;lastFrame=-Infinity;previousTime=0;loop(performance.now());},
    stop,
    refresh(){lastFrame=-Infinity;draw(animationTime,performance.now());},
    rain(){rainUntil=performance.now()+1400;draw(animationTime,performance.now());}
  };
}
