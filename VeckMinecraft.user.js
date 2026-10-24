// ==UserScript==
// @name         VeckCraft - Minecraft visual layer
// @namespace    https://github.com/10574084-cmd/Texturas-De-Minecraft-Para-Veck-io
// @version      0.2.0
// @description  Capa visual Minecraft a pantalla completa para Veck.io (prototipo local).
// @match        https://veck.io/*
// @match        https://www.veck.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  if (window.__veckCraftLayer) return;
  window.__veckCraftLayer = true;

  const css = document.createElement('style');
  css.textContent = `
    #veckcraft-layer{position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none;image-rendering:pixelated}
    #veckcraft-hud{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483001;display:flex;gap:5px;padding:6px;background:#1717179e;border:2px solid #ddd;pointer-events:auto}
    .veckcraft-slot{width:43px;height:43px;box-sizing:border-box;background:#555b;color:white;border:2px solid #aaa;font:22px monospace;display:grid;place-items:center;text-shadow:1px 2px #222;cursor:pointer}
    .veckcraft-slot.active{border:3px solid white;background:#8b8b8b}
    #veckcraft-tag{position:fixed;top:10px;left:10px;z-index:2147483001;color:white;background:#1119;border:1px solid #aaa;padding:5px 8px;font:12px monospace;pointer-events:none}
    #veckcraft-help{position:fixed;top:10px;right:10px;z-index:2147483001;color:#fff;background:#111b;padding:7px 9px;font:11px monospace;pointer-events:auto}
  `;
  document.documentElement.appendChild(css);

  const layer = document.createElement('canvas');
  layer.id = 'veckcraft-layer';
  layer.setAttribute('aria-label','Capa visual Minecraft');
  document.body.appendChild(layer);
  const ctx = layer.getContext('2d');
  const tag = document.createElement('div');
  tag.id='veckcraft-tag';
  tag.textContent='VECKCRAFT VISUAL 0.2 · F2 oculta/mostrar';
  document.body.appendChild(tag);

  const help = document.createElement('div');
  help.id='veckcraft-help';
  help.textContent='PROTOTIPO VISUAL · solo local';
  document.body.appendChild(help);

  const hud = document.createElement('div');
  hud.id='veckcraft-hud';
  hud.innerHTML = '<button class="veckcraft-slot active" data-kind="grass" title="Césped">🟩</button><button class="veckcraft-slot" data-kind="dirt" title="Tierra">🟫</button><button class="veckcraft-slot" data-kind="stone" title="Piedra">⬜</button><button class="veckcraft-slot" data-kind="wood" title="Madera">🟫</button><button class="veckcraft-slot" data-kind="sword" title="Espada">⚔️</button>';
  document.body.appendChild(hud);

  let visible=true, selected='grass', swing=0, tick=0;
  const palette = {
    grass:{top:'#76b94b',left:'#795239',right:'#60402b',sideTop:'#4e9638'},
    dirt:{top:'#996841',left:'#785033',right:'#583a26'},
    stone:{top:'#b5b5b5',left:'#858585',right:'#626262'},
    wood:{top:'#c28a4b',left:'#94602f',right:'#69401f'},
    brick:{top:'#b65a4d',left:'#8d4138',right:'#652b27'}
  };
  const placed = [];

  function poly(points, fill, stroke='#17171766') {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function cube(x,y,s,type) {
    const p=palette[type]||palette.grass;
    const topY=s*.48;
    poly([[x,y],[x+s,y-topY],[x+2*s,y],[x+s,y+topY]],p.top);
    poly([[x,y],[x+s,y+topY],[x+s,y+topY+s],[x,y+s]],p.left);
    poly([[x+s,y+topY],[x+2*s,y],[x+2*s,y+s],[x+s,y+topY+s]],p.right);
    // Tiny square pixels
    ctx.fillStyle='#ffffff20';
    ctx.fillRect(x+s*.25,y+s*.2,Math.max(2,s*.12),Math.max(2,s*.12));
    ctx.fillRect(x+s*1.3,y+s*.18,Math.max(2,s*.1),Math.max(2,s*.1));
  }
  function drawSteve(x, feet, u) {
    const bob=Math.sin(tick*.07)*u*1.3;
    // legs and shoes
    ctx.fillStyle='#273c83';ctx.fillRect(x-13*u,feet-31*u+bob,12*u,30*u);ctx.fillRect(x+1*u,feet-31*u-bob,12*u,30*u);
    ctx.fillStyle='#3d342c';ctx.fillRect(x-14*u,feet-4*u,13*u,4*u);ctx.fillRect(x+u,feet-4*u,13*u,4*u);
    // arms
    ctx.fillStyle='#c99068';ctx.fillRect(x-22*u,feet-62*u,8*u,29*u);ctx.fillRect(x+14*u,feet-62*u,8*u,29*u);
    // turquoise shirt/body
    ctx.fillStyle='#247ca6';ctx.fillRect(x-14*u,feet-63*u,28*u,32*u);
    // block head and hair
    ctx.fillStyle='#c99068';ctx.fillRect(x-13*u,feet-85*u,26*u,23*u);
    ctx.fillStyle='#573b25';ctx.fillRect(x-13*u,feet-88*u,26*u,7*u);ctx.fillRect(x-13*u,feet-81*u,4*u,8*u);ctx.fillRect(x+9*u,feet-81*u,4*u,6*u);
    ctx.fillStyle='#f5f5f5';ctx.fillRect(x-9*u,feet-78*u,5*u,4*u);ctx.fillRect(x+4*u,feet-78*u,5*u,4*u);
    ctx.fillStyle='#2e56a5';ctx.fillRect(x-7*u,feet-77*u,2.5*u,3*u);ctx.fillRect(x+6*u,feet-77*u,2.5*u,3*u);
    ctx.fillStyle='#81503a';ctx.fillRect(x-2*u,feet-73*u,4*u,6*u);
    // sword selected: held in right hand, purely visual
    if(selected==='sword') {
      ctx.save();ctx.translate(x+22*u,feet-47*u);ctx.rotate(-.6+Math.sin(swing)*.07);
      ctx.fillStyle='#a66c3b';ctx.fillRect(-2*u,0,4*u,13*u);
      ctx.fillStyle='#d5e5e8';ctx.fillRect(-3*u,-20*u,6*u,22*u);
      ctx.fillStyle='#f6ffff';ctx.fillRect(-1*u,-19*u,2*u,17*u);
      ctx.fillStyle='#8b6039';ctx.fillRect(-7*u,-2*u,14*u,3*u);
      ctx.restore();
    }
  }
  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    layer.width=Math.floor(innerWidth*dpr);layer.height=Math.floor(innerHeight*dpr);
    layer.style.width=innerWidth+'px';layer.style.height=innerHeight+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function draw(){
    if(!visible){requestAnimationFrame(draw);return;}
    const w=innerWidth,h=innerHeight;
    ctx.clearRect(0,0,w,h);
    // Perspective block path painted over the game view.
    const horizon=h*.61;
    for(let row=3;row>=0;row--){
      for(let col=-3;col<=3;col++){
        const s=Math.max(5,7+row*3);
        const x=w/2+col*s*1.65-row*2;
        const y=horizon+row*s*.85+Math.abs(col)*s*.16;
        if(y<h-80) cube(x,y,s, row===0?'grass':(row%2?'dirt':'grass'));
      }
    }
    // A small floating block crosshair, and a Minecraft-style player in front.
    const cx=w*.5, feet=h*.77, scale=Math.max(.65,Math.min(1.2,h/700));
    drawSteve(cx,feet,scale);
    // Pixel crosshair, kept subtle
    ctx.strokeStyle='#ffffffcc';ctx.lineWidth=2;
    ctx.strokeRect(cx-7,h*.49-7,14,14);
    ctx.fillStyle='#ffffffaa';ctx.fillRect(cx-1,h*.49-1,2,2);
    // Local placed-block previews float in a short row above hotbar.
    placed.forEach((b,i)=>cube(w/2-((placed.length-1)*18)/2+i*18,h*.66,7,b));
    tick++;swing+=.12;
    requestAnimationFrame(draw);
  }
  hud.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
    hud.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');selected=btn.dataset.kind;
    if(selected!=='sword') { if(placed.length<8) placed.push(selected); }
  }));
  window.addEventListener('keydown',e=>{
    if(e.key==='F2'){visible=!visible;layer.style.display=visible?'block':'none';hud.style.display=visible?'flex':'none';tag.style.display=visible?'block':'none';help.style.display=visible?'block':'none';}
    if(e.key==='Escape'){visible=false;layer.style.display='none';hud.style.display='none';tag.style.display='none';help.style.display='none';}
  });
  window.addEventListener('resize',resize);
  resize();draw();

  const gameCanvas=document.querySelector('#unity-canvas')||document.querySelector('canvas');
  help.textContent=gameCanvas
    ? 'CAPA SOBRE EL JUEGO · no modifica la escena Unity'
    : 'Esperando canvas de Veck.io · F2 para ocultar';
  console.info('[VeckCraft] Capa visual cargada. Solo dibujo local; no altera el mundo ni el multijugador.');
})();