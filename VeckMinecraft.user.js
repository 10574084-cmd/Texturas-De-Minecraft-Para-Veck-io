// ==UserScript==
// @name         VeckCraft - First Person HUD
// @namespace    https://github.com/10574084-cmd/Texturas-De-Minecraft-Para-Veck-io
// @version      0.3.0
// @description  Prototipo de mano en primera persona, hotbar e inventario estilo Minecraft para Veck.io.
// @match        https://veck.io/*
// @match        https://www.veck.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  if (window.__veckCraftFirstPerson) return;
  window.__veckCraftFirstPerson = true;

  const style = document.createElement('style');
  style.textContent = `
    #vcfp-canvas{position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none;image-rendering:pixelated}
    #vcfp-label{position:fixed;top:10px;left:10px;z-index:2147483001;padding:5px 8px;color:#fff;background:#1119;border:1px solid #aaa;font:11px monospace;pointer-events:none}
    #vcfp-hotbar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483002;display:flex;gap:3px;padding:5px;background:#171717a8;border:2px solid #ddd;pointer-events:auto}
    .vcfp-slot{width:44px;height:44px;box-sizing:border-box;border:2px solid #888;background:#555b;color:#fff;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;font:20px monospace}
    .vcfp-slot.active{border:3px solid white;background:#888b;outline:1px solid #222}
    .vcfp-slot small{position:absolute;left:2px;top:0;color:#fff;text-shadow:1px 1px #000;font:10px monospace}
    #vcfp-inventory{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2147483003;width:min(340px,90vw);padding:14px;background:#c6c6c6;border:3px solid #373737;box-shadow:inset 3px 3px #fff,inset -3px -3px #555;color:#222;font:13px monospace;pointer-events:auto;display:none}
    #vcfp-inventory h3{margin:0 0 12px;font-size:15px;font-weight:normal}
    #vcfp-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
    .vcfp-cell{height:45px;background:#8b8b8b;border:2px solid #eee;border-right-color:#555;border-bottom-color:#555;display:grid;place-items:center;font-size:22px;cursor:pointer}
    #vcfp-hint{margin-top:10px;font-size:10px;color:#333}
  `;
  document.documentElement.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.id = 'vcfp-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const label = document.createElement('div');
  label.id = 'vcfp-label';
  label.textContent = 'VECKCRAFT FP · E inventario · F2 ocultar';
  document.body.appendChild(label);

  const items = [
    {id:'grass', icon:'🟩', name:'Bloque de césped', color:'#70a848'},
    {id:'dirt', icon:'🟫', name:'Tierra', color:'#8b603d'},
    {id:'stone', icon:'⬜', name:'Piedra', color:'#999999'},
    {id:'wood', icon:'🪵', name:'Madera', color:'#9b6738'},
    {id:'pickaxe', icon:'⛏️', name:'Herramienta', color:'#7c8c92'}
  ];
  let selected=0, inventoryOpen=false, visible=true, phase=0, mx=0, my=0, lastX=0, lastY=0, movement=0, swing=0;

  const hotbar=document.createElement('div');
  hotbar.id='vcfp-hotbar';
  hotbar.innerHTML=items.map((it,i)=>'<button class="vcfp-slot '+(i===0?'active':'')+'" data-i="'+i+'" title="'+it.name+'"><small>'+(i+1)+'</small>'+it.icon+'</button>').join('');
  document.body.appendChild(hotbar);

  const inv=document.createElement('div');
  inv.id='vcfp-inventory';
  inv.innerHTML='<h3>Inventario</h3><div id="vcfp-grid"></div><div id="vcfp-hint">Pulsa E o Escape para cerrar · Selecciona un objeto</div>';
  inv.querySelector('#vcfp-grid').innerHTML=items.concat(items,items).map((it,i)=>'<button class="vcfp-cell" data-i="'+(i%items.length)+'" title="'+it.name+'">'+it.icon+'</button>').join('');
  document.body.appendChild(inv);

  function select(i){
    selected=i;
    hotbar.querySelectorAll('.vcfp-slot').forEach((b,n)=>b.classList.toggle('active',n===i));
  }
  hotbar.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.i))));
  inv.querySelectorAll('.vcfp-cell').forEach(b=>b.addEventListener('click',()=>{select(Number(b.dataset.i));inventoryOpen=false;inv.style.display='none';}));

  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);
    canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function pixelRect(x,y,w,h,color){
    ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  function drawBlock(x,y,s,type){
    const palette={grass:['#79b64b','#6a452b','#52351f'],dirt:['#93663f','#7b5233','#573920'],stone:['#b5b5b5','#858585','#646464'],wood:['#b98145','#8c5b30','#604020'],pickaxe:['#8d9a9e','#5b6467','#414749']}[type]||['#79b64b','#6a452b','#52351f'];
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s,y-s*.45);ctx.lineTo(x+s*2,y);ctx.lineTo(x+s,y+s*.45);ctx.closePath();ctx.fillStyle=palette[0];ctx.fill();
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s,y+s*.45);ctx.lineTo(x+s,y+s*1.45);ctx.lineTo(x,y+s);ctx.closePath();ctx.fillStyle=palette[1];ctx.fill();
    ctx.beginPath();ctx.moveTo(x+s,y+s*.45);ctx.lineTo(x+s*2,y);ctx.lineTo(x+s*2,y+s);ctx.lineTo(x+s,y+s*1.45);ctx.closePath();ctx.fillStyle=palette[2];ctx.fill();
    ctx.fillStyle='#ffffff22';ctx.fillRect(x+s*.25,y+s*.2,Math.max(2,s*.15),Math.max(2,s*.15));
  }
  function drawHand(w,h){
    // First-person blocky forearm and hand; it follows a small walk bob and mouse motion.
    const scale=Math.max(.7,Math.min(1.25,h/720));
    const bob=Math.sin(phase)*Math.min(7,2+movement*.6);
    const sway=Math.max(-12,Math.min(12,mx*.018));
    const x=w*.72+sway, y=h+18+bob+my*.012;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(-.12+Math.sin(phase*.5)*.018);
    // sleeve
    pixelRect(-4*scale,-122*scale,86*scale,108*scale,'#2777a4');
    pixelRect(5*scale,-119*scale,67*scale,7*scale,'#398db4');
    // skin forearm and square hand
    pixelRect(8*scale,-55*scale,66*scale,58*scale,'#c99068');
    pixelRect(8*scale,-55*scale,66*scale,8*scale,'#e0aa7d');
    pixelRect(8*scale,-8*scale,66*scale,8*scale,'#a96f50');
    // pixelated knuckle shading
    pixelRect(18*scale,-35*scale,12*scale,9*scale,'#dba17a');
    pixelRect(43*scale,-28*scale,15*scale,8*scale,'#b97f5d');
    if(items[selected].id!=='pickaxe'){
      // selected block held in front of the hand
      drawBlock(31*scale,-190*scale,25*scale,items[selected].id);
    } else {
      // a simple pixel-art tool silhouette (visual placeholder)
      ctx.save();ctx.translate(36*scale,-95*scale);ctx.rotate(-.45+Math.sin(swing)*.025);
      pixelRect(-4*scale,-83*scale,9*scale,88*scale,'#8b6039');
      pixelRect(-23*scale,-84*scale,47*scale,13*scale,'#7f9095');
      pixelRect(-23*scale,-84*scale,12*scale,24*scale,'#9caaae');
      ctx.restore();
    }
    ctx.restore();
  }
  function draw(){
    const w=innerWidth,h=innerHeight;
    ctx.clearRect(0,0,w,h);
    if(visible){
      // Minimal Minecraft-style crosshair only; no second character or fake landscape.
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.globalAlpha=.85;
      ctx.beginPath();ctx.moveTo(w/2-7,h/2);ctx.lineTo(w/2-2,h/2);ctx.moveTo(w/2+2,h/2);ctx.lineTo(w/2+7,h/2);ctx.moveTo(w/2,h/2-7);ctx.lineTo(w/2,h/2-2);ctx.moveTo(w/2,h/2+2);ctx.lineTo(w/2,h/2+7);ctx.stroke();ctx.globalAlpha=1;
      drawHand(w,h);
      phase+=.08+movement*.012;swing+=.12;
      movement*=.94;
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('pointermove',e=>{
    mx=e.clientX-innerWidth/2;my=e.clientY-innerHeight/2;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;
    movement=Math.min(7,movement+Math.min(2,Math.hypot(dx,dy)*.04));
    lastX=e.clientX;lastY=e.clientY;
  },{passive:true});
  window.addEventListener('keydown',e=>{
    if(/^[1-5]$/.test(e.key))select(Number(e.key)-1);
    if(e.key.toLowerCase()==='e'&&!e.repeat){inventoryOpen=!inventoryOpen;inv.style.display=inventoryOpen?'block':'none';}
    if(e.key==='Escape'&&inventoryOpen){inventoryOpen=false;inv.style.display='none';}
    if(e.key==='F2'){visible=!visible;canvas.style.display=visible?'block':'none';label.style.display=visible?'block':'none';hotbar.style.display=visible?'flex':'none';if(!visible){inventoryOpen=false;inv.style.display='none';}}
  });
  window.addEventListener('resize',resize);
  resize();draw();
  console.info('[VeckCraft FP] Primera persona: mano pixelada, bobbing, hotbar e inventario. Capa visual local; aún no reemplaza armas/modelos de Unity ni cambia el servidor.');
})();