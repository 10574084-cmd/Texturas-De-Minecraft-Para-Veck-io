// ==UserScript==
// @name         Veck.io Minecraft Visual Prototype
// @namespace    https://github.com/10574084-cmd/Texturas-De-Minecraft-Para-Veck-io
// @version      0.1.0
// @description  Prototipo visual estilo Minecraft para Veck.io: Steve voxel, bloques y hotbar local.
// @match        https://veck.io/*
// @match        https://www.veck.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  if (window.__veckMinecraftPrototype) return;
  window.__veckMinecraftPrototype = true;

  const style = document.createElement('style');
  style.textContent = `
    #vmc-panel{position:fixed;right:14px;top:14px;z-index:2147483646;width:265px;color:#fff;background:#171717f2;border:2px solid #6b9b45;box-shadow:0 5px 22px #0009;font:13px monospace;border-radius:5px;overflow:hidden}
    #vmc-head{padding:9px 10px;background:#426b2c;display:flex;justify-content:space-between;align-items:center;font-weight:bold;cursor:move}
    #vmc-body{padding:10px}.vmc-row{display:flex;gap:6px;margin:7px 0}.vmc-btn{font:12px monospace;color:white;background:#383838;border:1px solid #888;padding:7px 8px;cursor:pointer;flex:1}.vmc-btn:hover{background:#4c7134}
    #vmc-preview{width:100%;height:190px;display:block;background:linear-gradient(#7fb8e6 0 66%,#5c8d3c 66%);image-rendering:pixelated;border:1px solid #666}
    #vmc-hotbar{display:flex;gap:4px;justify-content:center;margin-top:8px}.vmc-slot{width:42px;height:42px;border:2px solid #777;background:#292929;display:grid;place-items:center;font-size:20px}.vmc-slot.active{border-color:#fff;outline:1px solid #fff}
    #vmc-status{color:#d8e9c8;font-size:11px;line-height:1.45;margin-top:8px}.vmc-note{font-size:10px;color:#bbb;line-height:1.4;margin-top:8px}
    #vmc-toggle{position:fixed;right:14px;top:14px;z-index:2147483646;background:#426b2c;color:#fff;border:1px solid #b5d59b;padding:8px;font:12px monospace;cursor:pointer}
  `;
  document.documentElement.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'vmc-panel';
  panel.innerHTML = `
    <div id="vmc-head"><span>⛏ VECKCRAFT · PROTOTIPO</span><button id="vmc-close" class="vmc-btn" style="flex:0;padding:3px 7px">—</button></div>
    <div id="vmc-body">
      <canvas id="vmc-preview" width="265" height="190" aria-label="Vista previa voxel"></canvas>
      <div class="vmc-row"><button class="vmc-btn" id="vmc-add">+ Añadir bloque</button><button class="vmc-btn" id="vmc-remove">− Quitar bloque</button></div>
      <div id="vmc-hotbar">
        <button class="vmc-slot active" data-block="grass" title="Césped">🟩</button>
        <button class="vmc-slot" data-block="dirt" title="Tierra">🟫</button>
        <button class="vmc-slot" data-block="stone" title="Piedra">⬜</button>
        <button class="vmc-slot" data-block="wood" title="Madera">🟧</button>
        <button class="vmc-slot" data-block="brick" title="Ladrillo">🟥</button>
      </div>
      <div id="vmc-status">Iniciando diagnóstico de Unity…</div>
      <div class="vmc-note">Vista local de prueba: los bloques y Steve todavía no existen en el mundo real de Veck.io ni se sincronizan con otros jugadores.</div>
    </div>`;
  document.body.appendChild(panel);

  const toggle = document.createElement('button');
  toggle.id = 'vmc-toggle';
  toggle.textContent = '⛏ VeckCraft';
  toggle.style.display = 'none';
  document.body.appendChild(toggle);

  const canvas = panel.querySelector('#vmc-preview');
  const ctx = canvas.getContext('2d');
  const status = panel.querySelector('#vmc-status');
  const blocks = [];
  const colors = {
    grass: ['#72b64d','#4b8834','#8a603d'],
    dirt: ['#a4774d','#785033','#5b3c28'],
    stone: ['#b6b6b6','#858585','#686868'],
    wood: ['#c39152','#91602f','#68421f'],
    brick: ['#bd5c4d','#8e3d35','#632a27']
  };
  let selected = 'grass';
  let yaw = 0;

  function polygon(points, fill) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
    ctx.strokeStyle='#0002'; ctx.stroke();
  }
  function cube(x,y,s, palette) {
    const [top,left,right] = palette;
    polygon([[x,y],[x+s,y-s*.48],[x+s*2,y],[x+s,y+s*.48]],top);
    polygon([[x,y],[x+s,y+s*.48],[x+s,y+s*1.48],[x,y+s]],left);
    polygon([[x+s,y+s*.48],[x+s*2,y],[x+s*2,y+s],[x+s,y+s*1.48]],right);
    // Pixel flecks for a block-texture feel
    ctx.fillStyle='#ffffff16';
    for(let i=0;i<3;i++) ctx.fillRect(x+4+i*8,y+5+(i%2)*5,3,3);
  }
  function drawSteve(cx, baseY, scale) {
    const u=scale, bob=Math.sin(yaw)*2;
    // Legs
    ctx.fillStyle='#273d8b'; ctx.fillRect(cx-15*u,baseY-31*u+bob,13*u,31*u); ctx.fillRect(cx+2*u,baseY-31*u-bob,13*u,31*u);
    // Shoes
    ctx.fillStyle='#3c342b';ctx.fillRect(cx-16*u,baseY-5*u,14*u,5*u);ctx.fillRect(cx+1*u,baseY-5*u,14*u,5*u);
    // Body
    ctx.fillStyle='#2878a7';ctx.fillRect(cx-17*u,baseY-64*u,34*u,34*u);
    // Arms
    ctx.fillStyle='#c98b61';ctx.fillRect(cx-25*u,baseY-63*u,8*u,32*u);ctx.fillRect(cx+17*u,baseY-63*u,8*u,32*u);
    // Head
    ctx.fillStyle='#c98b61';ctx.fillRect(cx-16*u,baseY-88*u,32*u,25*u);
    // Hair
    ctx.fillStyle='#563b25';ctx.fillRect(cx-16*u,baseY-91*u,32*u,8*u);ctx.fillRect(cx-16*u,baseY-83*u,5*u,8*u);ctx.fillRect(cx+11*u,baseY-83*u,5*u,6*u);
    // Face, eyes and nose
    ctx.fillStyle='#fff';ctx.fillRect(cx-10*u,baseY-81*u,6*u,4*u);ctx.fillRect(cx+4*u,baseY-81*u,6*u,4*u);
    ctx.fillStyle='#3156a2';ctx.fillRect(cx-8*u,baseY-80*u,3*u,3*u);ctx.fillRect(cx+6*u,baseY-80*u,3*u,3*u);
    ctx.fillStyle='#81513d';ctx.fillRect(cx-3*u,baseY-76*u,6*u,7*u);
    // Pixel-grid seams
    ctx.strokeStyle='#0002';ctx.lineWidth=1;ctx.strokeRect(cx-17*u,baseY-64*u,34*u,34*u);
  }
  function render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Pixelated clouds and distant hills
    ctx.fillStyle='#ffffffaa';ctx.fillRect(22,24,38,9);ctx.fillRect(33,16,20,8);ctx.fillRect(176,35,45,9);ctx.fillRect(188,27,19,8);
    polygon([[0,128],[48,87],[88,119],[140,76],[205,116],[265,91],[265,190],[0,190]],'#63944b');
    polygon([[0,151],[57,132],[102,155],[171,126],[228,153],[265,140],[265,190],[0,190]],'#4d7a38');
    for(let i=blocks.length-1;i>=0;i--) {
      const b=blocks[i]; cube(130+b.x*18,148-b.z*14-b.x*7,15,colors[b.type]||colors.grass);
    }
    drawSteve(132,165,0.78);
    ctx.fillStyle='#0008';ctx.fillRect(7,7,92,16);ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.fillText('STEVE · VISUAL',12,18);
    yaw += 0.045;
    requestAnimationFrame(render);
  }
  render();

  panel.querySelectorAll('.vmc-slot').forEach(btn => btn.addEventListener('click', () => {
    panel.querySelectorAll('.vmc-slot').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); selected=btn.dataset.block;
  }));
  panel.querySelector('#vmc-add').addEventListener('click', () => {
    if(blocks.length >= 16) { status.textContent='Límite de 16 bloques de prueba alcanzado.'; return; }
    blocks.push({type:selected,x:(blocks.length%5)-2,z:Math.floor(blocks.length/5)});
    status.textContent='Bloque local añadido ('+blocks.length+'/16). No afecta al servidor.';
  });
  panel.querySelector('#vmc-remove').addEventListener('click', () => {
    if(blocks.length) blocks.pop();
    status.textContent='Bloques locales: '+blocks.length+'. No se ha cambiado el mundo real.';
  });
  panel.querySelector('#vmc-close').addEventListener('click', () => { panel.style.display='none';toggle.style.display='block'; });
  toggle.addEventListener('click', () => { panel.style.display='block';toggle.style.display='none'; });

  // Make the panel draggable by its title bar.
  const head = panel.querySelector('#vmc-head');
  let drag = null;
  head.addEventListener('pointerdown', e => {
    if(e.target.closest('button')) return;
    const r=panel.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};head.setPointerCapture(e.pointerId);
  });
  head.addEventListener('pointermove', e => {
    if(!drag) return;
    panel.style.left=Math.max(0,e.clientX-drag.x)+'px';
    panel.style.top=Math.max(0,e.clientY-drag.y)+'px';
    panel.style.right='auto';
  });
  head.addEventListener('pointerup',()=>drag=null);
  head.addEventListener('pointercancel',()=>drag=null);

  function inspectUnity() {
    const instance = window.unityInstance;
    if(instance && typeof instance.SendMessage === 'function') {
      status.textContent='Unity detectado: SendMessage disponible. Aún falta identificar los objetos y métodos internos del juego.';
      return;
    }
    const c=document.querySelector('#unity-canvas') || document.querySelector('canvas');
    status.textContent = c
      ? 'Canvas Unity/WebGL detectado, pero no hay puente de objetos público. Prototipo visual activo.'
      : 'Esperando el canvas del juego…';
  }
  inspectUnity();
  setTimeout(inspectUnity,1500);
  setTimeout(inspectUnity,5000);
  console.info('[VeckCraft] Prototipo visual cargado. Esto no modifica la física ni el multijugador.');
})();