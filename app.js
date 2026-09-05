(function(){

    // Pull data from the globally scoped PORTFOLIO_DATA object created in data.js
    const DATA = window.PORTFOLIO_DATA;
    
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 700;
    const sleep = ms => new Promise(r=>setTimeout(r,ms));
    const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
    function escapeHtml(str){
      return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function sphericalPos(radius, thetaDeg, phiDeg){
      const theta = THREE.MathUtils.degToRad(thetaDeg);
      const phi = THREE.MathUtils.degToRad(phiDeg);
      return new THREE.Vector3(
        radius*Math.sin(phi)*Math.cos(theta),
        radius*Math.cos(phi),
        radius*Math.sin(phi)*Math.sin(theta)
      );
    }
    function ringAround(center, count, radius){
      const outward = center.clone().normalize();
      const arbitrary = Math.abs(outward.y) < 0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
      const u = new THREE.Vector3().crossVectors(outward, arbitrary).normalize();
      const v = new THREE.Vector3().crossVectors(outward, u).normalize();
      const pts = [];
      for(let i=0;i<count;i++){
        const a = (i/count)*Math.PI*2;
        pts.push(center.clone()
          .add(u.clone().multiplyScalar(Math.cos(a)*radius))
          .add(v.clone().multiplyScalar(Math.sin(a)*radius)));
      }
      return pts;
    }
    function animateValue(duration, onUpdate, onComplete){
      const start = performance.now();
      function step(now){
        const t = Math.min(1, (now-start)/duration);
        const eased = 1-Math.pow(1-t,3);
        onUpdate(eased,t);
        if(t<1) requestAnimationFrame(step); else if(onComplete) onComplete();
      }
      requestAnimationFrame(step);
    }
    
    /* ---------- three.js core ---------- */
    const canvas = document.getElementById('scene-canvas');
    const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    scene.fog = new THREE.FogExp2(0x050608, 0.02);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.9);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0xff2e7a, 0.5);
    dirLight2.position.set(-10, -20, -10);
    scene.add(dirLight2);
    
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 1000);
    
    const OVERVIEW_R = 32, MIN_R = 3.5, MAX_R = 60, HUB_FOCUS_R = 9.5, PROJECT_FOCUS_R = 6.5;
    const camTarget = new THREE.Vector3(0,0,0);
    const camState = {radius:OVERVIEW_R, theta:0.9, phi:1.3};
    
    // Parallax state
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    
    function updateCameraPosition(){
      const {radius,theta,phi} = camState;
      const offset = new THREE.Vector3(
        radius*Math.sin(phi)*Math.cos(theta),
        radius*Math.cos(phi),
        radius*Math.sin(phi)*Math.sin(theta)
      );
      camera.position.copy(camTarget).add(offset);
      
      if(!reduceMotion) {
        camera.position.x += mouseX * 3;
        camera.position.y += -mouseY * 3;
      }
      
      camera.lookAt(camTarget);
    }
    function flyTo(targetVec, targetRadius){
      const startTarget = camTarget.clone();
      const startRadius = camState.radius;
      animateValue(900, (e)=>{
        camTarget.lerpVectors(startTarget, targetVec, e);
        camState.radius = startRadius + (targetRadius-startRadius)*e;
      });
    }
    
    function makeGlowTexture(){
      const size=128;
      const c=document.createElement('canvas'); c.width=c.height=size;
      const ctx=c.getContext('2d');
      const grad=ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
      grad.addColorStop(0,'rgba(255,255,255,1)');
      grad.addColorStop(0.4,'rgba(255,255,255,0.4)');
      grad.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=grad; ctx.fillRect(0,0,size,size);
      return new THREE.CanvasTexture(c);
    }
    const glowTexture = makeGlowTexture();
    
    function makeLabelSprite(text, colorCss){
      const canvasEl=document.createElement('canvas');
      const ctx=canvasEl.getContext('2d');
      const fontSize=48;
      ctx.font=`600 ${fontSize}px "Chakra Petch", sans-serif`;
      const width=Math.ceil(ctx.measureText(text).width)+40;
      canvasEl.width=width; canvasEl.height=fontSize*1.6;
      ctx.font=`600 ${fontSize}px "Chakra Petch", sans-serif`;
      ctx.fillStyle=colorCss; ctx.textBaseline='middle'; ctx.textAlign='center';
      ctx.shadowColor=colorCss; ctx.shadowBlur=20;
      ctx.fillText(text, canvasEl.width/2, canvasEl.height/2);
      const tex=new THREE.CanvasTexture(canvasEl);
      tex.minFilter=THREE.LinearFilter;
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false}));
      const scale=0.014;
      sprite.scale.set(canvasEl.width*scale, canvasEl.height*scale, 1);
      return sprite;
    }
    
    const nodesById = {};
    const edges = [];
    const clickableMeshes = [];
    
    function addNode(id, opts){
      const geo = new THREE.IcosahedronGeometry(opts.size, opts.detail || 1);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for(let i=0; i<pos.count; i++){
        v.fromBufferAttribute(pos, i);
        const noise = (Math.random() * 0.25) - 0.125; 
        v.normalize().multiplyScalar(opts.size * (1 + noise));
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
    
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: opts.color,
          roughness: 0.9,
          metalness: 0.2,
          flatShading: true 
        })
      );
      mesh.position.copy(opts.position);
      scene.add(mesh);
    
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map:glowTexture, color:opts.color, transparent:true,
        blending:THREE.AdditiveBlending, depthWrite:false, opacity:opts.glowOpacity
      }));
      glow.scale.setScalar(opts.glowScale);
      glow.position.copy(opts.position);
      scene.add(glow);
    
      const label = makeLabelSprite(opts.label, '#'+new THREE.Color(opts.color).getHexString());
      label.position.copy(opts.position).add(new THREE.Vector3(0, opts.size+0.9, 0));
      scene.add(label);
    
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(opts.size+0.9, 10, 10),
        new THREE.MeshBasicMaterial({transparent:true, opacity:0, depthWrite:false})
      );
      hit.position.copy(opts.position);
      hit.userData.nodeId = id;
      scene.add(hit);
      clickableMeshes.push(hit);
    
      nodesById[id] = {
        id, type:opts.type, position:opts.position.clone(), mesh, glow,
        baseGlowScale:opts.glowScale, baseGlowOpacity:opts.glowOpacity,
        focusRadius:opts.focusRadius, payload:opts.payload||null
      };
    }
    function addEdge(fromId, toId, color){
      const from = nodesById[fromId], to = nodesById[toId];
      const geo = new THREE.BufferGeometry().setFromPoints([from.position, to.position]);
      scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({color, transparent:true, opacity:0.35})));
    
      const pulse = new THREE.Sprite(new THREE.SpriteMaterial({
        map:glowTexture, color, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, opacity:0.9
      }));
      pulse.scale.setScalar(0.5);
      scene.add(pulse);
      edges.push({start:from.position, end:to.position, pulse, speed:0.15+Math.random()*0.15, phase:Math.random()});
    }
    
    async function buildGraph(){
      if(window.document && document.fonts && document.fonts.ready){
        try{
          document.fonts.load('700 48px "Chakra Petch"');
          document.fonts.load('600 40px "Chakra Petch"');
          await Promise.race([document.fonts.ready, sleep(2000)]);
        }catch(e){}
      }
    
      addNode('core', {
        type:'core', label:DATA.name.split(' ')[0].toUpperCase(),
        position:new THREE.Vector3(0,0,0), color:0xeaf2ff,
        size:1.8, glowScale:5.2, glowOpacity:0.5, detail:2, focusRadius:OVERVIEW_R
      });
    
      const hubDefs = [
        {id:'about', label:'ABOUT', color:0x00f0ff, theta:40, phi:80},
        {id:'projects', label:'PROJECTS', color:0xff2e7a, theta:140, phi:100},
        {id:'skills', label:'SKILLS', color:0xa855f7, theta:230, phi:75},
        {id:'contact', label:'CONTACT', color:0xffc93c, theta:320, phi:105}
      ];
      hubDefs.forEach(h=>{
        const pos = sphericalPos(11, h.theta, h.phi);
        addNode(h.id, {type:'hub', label:h.label, position:pos, color:h.color,
          size:1.1, glowScale:3.4, glowOpacity:0.55, detail:2, focusRadius:HUB_FOCUS_R});
        addEdge('core', h.id, h.color);
      });
    
      const projHub = nodesById['projects'];
      const positions = ringAround(projHub.position, DATA.projects.length, 6.0);
      DATA.projects.forEach((p,i)=>{
        const id = 'project-'+p.id;
        addNode(id, {type:'project', label:p.name.toUpperCase(), position:positions[i], color:0xff2e7a,
          size:0.6, glowScale:2.3, glowOpacity:0.45, detail:1, focusRadius:PROJECT_FOCUS_R, payload:p});
        addEdge('projects', id, 0xff2e7a);
      });
    }
    
    /* ---------- particles ---------- */
    let particles;
    function buildParticles(){
      const count = isSmall ? 500 : 1100;
      const positions = new Float32Array(count*3);
      for(let i=0;i<count;i++){
        const u=Math.random(), v=Math.random();
        const theta=2*Math.PI*u, phi=Math.acos(2*v-1);
        const r = 15 + (55-15)*Math.cbrt(Math.random());
        positions[i*3] = r*Math.sin(phi)*Math.cos(theta);
        positions[i*3+1] = r*Math.cos(phi);
        positions[i*3+2] = r*Math.sin(phi)*Math.sin(theta);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
      const mat = new THREE.PointsMaterial({
        size:0.35, map:glowTexture, color:0x7fa8ff, transparent:true,
        opacity:0.5, depthWrite:false, blending:THREE.AdditiveBlending
      });
      particles = new THREE.Points(geo, mat);
      scene.add(particles);
    }
    
    /* ---------- interaction state ---------- */
    let isDragging=false, dragMoved=0, prevPinchDist=null, lastInteraction=performance.now();
    let hoveredId=null, currentFocusId=null;
    const activePointers = new Map();
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(-10,-10);
    
    function setNodeHighlight(id, on){
      const node = nodesById[id];
      if(!node) return;
      const startScale = node.mesh.scale.x;
      const targetScale = on?1.25:1;
      const startOpacity = node.glow.material.opacity;
      const targetOpacity = node.baseGlowOpacity*(on?1.8:1);
      animateValue(200, (e)=>{
        const s = startScale + (targetScale-startScale)*e;
        node.mesh.scale.setScalar(s);
        node.glow.scale.setScalar(node.baseGlowScale*s);
        node.glow.material.opacity = startOpacity + (targetOpacity-startOpacity)*e;
      });
    }
    function checkHover(){
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);
      const id = hits.length ? hits[0].object.userData.nodeId : null;
      if(id !== hoveredId){
        if(hoveredId) setNodeHighlight(hoveredId,false);
        if(id) setNodeHighlight(id,true);
        hoveredId = id;
        canvas.style.cursor = id ? 'pointer' : 'grab';
      }
    }
    
    window.addEventListener('pointermove', (e) => {
      if (activePointers.size === 0) {
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
      }
    });
    
    function onPointerDown(e){
      canvas.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
      isDragging=true; dragMoved=0; canvas.classList.add('dragging');
      lastInteraction = performance.now();
    }
    function onPointerMove(e){
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX-rect.left)/rect.width)*2-1;
      pointerNDC.y = -((e.clientY-rect.top)/rect.height)*2+1;
      if(!activePointers.has(e.pointerId)) return;
    
      const prev = activePointers.get(e.pointerId);
      const dx = e.clientX-prev.x, dy = e.clientY-prev.y;
      activePointers.set(e.pointerId, {x:e.clientX,y:e.clientY});
      dragMoved += Math.abs(dx)+Math.abs(dy);
      lastInteraction = performance.now();
    
      if(activePointers.size===2){
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x-pts[1].x, pts[0].y-pts[1].y);
        if(prevPinchDist!=null){
          camState.radius = clamp(camState.radius-(dist-prevPinchDist)*0.05, MIN_R, MAX_R);
        }
        prevPinchDist = dist;
      } else if(activePointers.size===1){
        prevPinchDist=null;
        camState.theta -= dx*0.005;
        camState.phi = clamp(camState.phi-dy*0.005, 0.35, 2.7);
      }
    }
    function onPointerUp(e){
      activePointers.delete(e.pointerId);
      if(activePointers.size<2) prevPinchDist=null;
      if(activePointers.size===0){
        isDragging=false; canvas.classList.remove('dragging');
        if(dragMoved<6){
          raycaster.setFromCamera(pointerNDC, camera);
          const hits = raycaster.intersectObjects(clickableMeshes);
          if(hits.length) activateNode(hits[0].object.userData.nodeId);
        }
      }
    }
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', (e)=>{
      e.preventDefault();
      camState.radius = clamp(camState.radius+e.deltaY*0.02, MIN_R, MAX_R);
      lastInteraction = performance.now();
    }, {passive:false});
    window.addEventListener('resize', ()=>{
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') resetView(); });
    
    /* ---------- navigation / panels ---------- */
    const hintEl = document.getElementById('hint');
    const backBtn = document.getElementById('back-btn');
    const panelEl = document.getElementById('panel');
    const panelBody = document.getElementById('panel-body');
    
    function activateNode(id){
      const node = nodesById[id];
      if(!node) return;
      lastInteraction = performance.now();
      hintEl.classList.add('hidden');
    
      if(id==='core'){ resetView(); return; }
    
      if(node.type==='hub'){
        currentFocusId = id;
        flyTo(node.position, node.focusRadius);
        backBtn.classList.add('visible');
        if(id==='projects'){ openPanel('projects-list'); return; }
        openPanel(id);
        return;
      }
      if(node.type==='project'){
        currentFocusId = id;
        flyTo(node.position, node.focusRadius);
        backBtn.classList.add('visible');
        openPanel('project', node.payload);
      }
    }
    function resetView(){
      currentFocusId = null;
      flyTo(new THREE.Vector3(0,0,0), OVERVIEW_R);
      closePanel();
      backBtn.classList.remove('visible');
    }
    function openPanel(kind, payload){
      if(kind==='about') panelBody.innerHTML = renderAboutHTML();
      else if(kind==='skills') panelBody.innerHTML = renderSkillsHTML();
      else if(kind==='contact'){ panelBody.innerHTML = renderContactHTML(); wireContactTerminal(); }
      else if(kind==='projects-list'){ panelBody.innerHTML = renderProjectsListHTML(); wireProjectList(); }
      else if(kind==='project') panelBody.innerHTML = renderProjectHTML(payload);
      panelEl.classList.add('open');
      panelEl.focus();
    }
    function closePanel(){ panelEl.classList.remove('open'); }
    
    backBtn.addEventListener('click', resetView);
    document.getElementById('panel-close').addEventListener('click', closePanel);
    document.querySelectorAll('.sr-nav button').forEach(btn=>{
      btn.addEventListener('click', ()=>activateNode(btn.dataset.target));
    });
    
    /* ---------- panel content ---------- */
    function renderAboutHTML(){
      return `
        <h2 class="panel-title">${escapeHtml(DATA.name)}</h2>
        <p class="panel-meta">${escapeHtml(DATA.role)}</p>
        <p class="panel-lead">${escapeHtml(DATA.tagline)}</p>
        ${DATA.bio.map(p=>`<p class="panel-body-text">${escapeHtml(p)}</p>`).join('')}
        <div class="stat-grid">
          ${DATA.stats.map(s=>`<div><div class="stat-value">${escapeHtml(s.value)}</div><div class="stat-label">${escapeHtml(s.label)}</div></div>`).join('')}
        </div>`;
    }
    function renderProjectsListHTML(){
      return `
        <h2 class="panel-title">Projects</h2>
        <p class="panel-lead">${DATA.projects.length} deep-dive architectural implementations.</p>
        <div class="project-list">
          ${DATA.projects.map(p=>`
            <button class="project-item" data-project="${escapeHtml(p.id)}">
              <span class="project-item-name">${escapeHtml(p.name)}</span>
              <span class="project-item-blurb">${escapeHtml(p.blurb)}</span>
            </button>`).join('')}
        </div>`;
    }
    function wireProjectList(){
      document.querySelectorAll('.project-item').forEach(btn=>{
        btn.addEventListener('click', ()=>activateNode('project-'+btn.dataset.project));
      });
    }
    function renderProjectHTML(p){
      const detailsHTML = p.details 
        ? p.details.map(d => `<p class="panel-body-text" style="margin-bottom:14px;">${escapeHtml(d)}</p>`).join('') 
        : '';
    
      return `
        <h2 class="panel-title">${escapeHtml(p.name)}</h2>
        <p class="panel-lead">${escapeHtml(p.blurb)}</p>
        <div class="tag-row">${p.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        ${detailsHTML}
        <a class="panel-cta" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View project</a>`;
    }
    function renderSkillsHTML(){
      return `
        <h2 class="panel-title">Skills</h2>
        <p class="panel-lead">Production AI Engineering Map.</p>
        <div class="radar-wrap">${buildRadarSVG(DATA.skills)}</div>`;
    }
    function buildRadarSVG(skills){
        // Massive 500x500 canvas with a smaller 90px radius chart to guarantee text fits
        const size = 500;
        const center = size / 2;
        const maxR = 90; 
        const N = skills.length;
        
        const angleFor = i => (-90+i*(360/N))*Math.PI/180;
        const ptFor = (i,frac) => {
          const a = angleFor(i);
          return [center + maxR * frac * Math.cos(a), center + maxR * frac * Math.sin(a)];
        };
        
        let svg = `<svg viewBox="0 0 ${size} ${size}" class="radar" role="img" aria-label="Skill levels chart" style="width:100%; height:auto;">`;
        
        // Draw background rings
        [0.25, 0.5, 0.75, 1].forEach(f => {
          const pts = skills.map((_,i) => ptFor(i,f).join(',')).join(' ');
          svg += `<polygon points="${pts}" class="radar-ring" />`;
        });
        
        // Draw axes
        skills.forEach((_,i) => {
          const [x,y] = ptFor(i,1);
          svg += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" class="radar-axis" />`;
        });
        
        // Draw data polygon
        const dataPts = skills.map((s,i) => ptFor(i, s.level/100).join(',')).join(' ');
        svg += `<polygon points="${dataPts}" class="radar-data" />`;
        
        // Draw data dots
        skills.forEach((s,i) => {
          const [x,y] = ptFor(i, s.level/100);
          svg += `<circle cx="${x}" cy="${y}" r="4" class="radar-dot" />`;
        });
        
        // Draw text labels
        skills.forEach((s,i) => {
          // Push text out 30% beyond the outer ring
          const [x,y] = ptFor(i, 1.3); 
          const a = angleFor(i);
          const cosA = Math.cos(a);
          
          const anchor = cosA > 0.35 ? 'start' : (cosA < -0.35 ? 'end' : 'middle');
          const dy = Math.sin(a) > 0.5 ? 12 : (Math.sin(a) < -0.5 ? -4 : 4);
          
          // Bumped font size slightly for readability since the viewbox is larger
          svg += `<text x="${x}" y="${y + dy}" text-anchor="${anchor}" class="radar-label" style="font-size: 13px; fill: var(--white);">${escapeHtml(s.name)}</text>`;
        });
        
        svg += `</svg>`;
        return svg;
    }
    function renderContactHTML(){
      return `
        <h2 class="panel-title">Contact</h2>
        <p class="panel-lead">Type a command below, or just use the links.</p>
        <div class="terminal">
          <div class="term-log" id="term-log">session started. try 'help' if you're stuck.</div>
          <div class="term-input-row">
            <span class="term-prompt">&gt;</span>
            <input id="term-input" class="term-input" autocomplete="off" spellcheck="false" aria-label="Terminal command input" />
          </div>
        </div>
        <div class="link-row">
          <a class="panel-cta" href="mailto:${escapeHtml(DATA.contact.email)}">Email me</a>
          <a class="panel-cta ghost" href="${escapeHtml(DATA.contact.github)}" target="_blank" rel="noopener">GitHub</a>
          <a class="panel-cta ghost" href="${escapeHtml(DATA.contact.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
        </div>`;
    }
    function wireContactTerminal(){
      const input = document.getElementById('term-input');
      if(!input) return;
      input.addEventListener('keydown', (e)=>{
        if(e.key==='Enter' && input.value.trim()!==''){
          handleTermCommand(input.value);
          input.value='';
        }
      });
      input.focus();
    }
    function handleTermCommand(raw){
      const log = document.getElementById('term-log');
      if(!log) return;
      const cmd = raw.trim();
      const lower = cmd.toLowerCase();
      const echo = document.createElement('div');
      echo.className='term-echo'; echo.textContent='> '+cmd;
      log.appendChild(echo);
      const printLine = (text)=>{ const d=document.createElement('div'); d.textContent=text; log.appendChild(d); };
    
      if(lower==='help'){
        ['help','whoami','ls projects',"contact --email","sudo hire-me",'clear'].forEach(c=>printLine('  '+c));
      } else if(lower==='whoami'){
        printLine(`${DATA.name} — ${DATA.role}`);
      } else if(lower==='ls' || lower==='ls projects'){
        DATA.projects.forEach(p=>printLine('  '+p.name));
      } else if(lower.startsWith('contact')){
        printLine(DATA.contact.email);
      } else if(lower==='sudo hire-me'){
        printLine('permission granted. drafting an email for you...');
        printLine(DATA.contact.email);
      } else if(lower==='clear'){
        log.innerHTML=''; return;
      } else {
        printLine(`command not found: ${cmd}. try 'help'.`);
      }
      log.scrollTop = log.scrollHeight;
    }
    
    /* ---------- boot sequence ---------- */
    const BOOT_LINES = [
      "booting neural interface...",
      "loading model weights [##########] done",
      "mapping synapses... 47,382 connections found",
      "calibrating renderer...",
      `welcome, ${DATA.name.split(' ')[0].toLowerCase()}.`
    ];
    function playBootText(){
      return new Promise(resolve=>{
        const el = document.getElementById('boot-log');
        if(reduceMotion){
          el.textContent = BOOT_LINES.join('\n');
          sleep(300).then(resolve);
          return;
        }
        let li=0;
        function typeLine(){
          if(li>=BOOT_LINES.length){ resolve(); return; }
          const line = BOOT_LINES[li];
          let ci=0;
          el.textContent += (li>0?'\n':'');
          const timer = setInterval(()=>{
            el.textContent += line[ci];
            ci++;
            if(ci>=line.length){ clearInterval(timer); li++; setTimeout(typeLine,180); }
          },16);
        }
        typeLine();
      });
    }
    function fadeOutBoot(){
      const boot = document.getElementById('boot');
      boot.style.opacity='0';
      setTimeout(()=>{ boot.style.display='none'; }, 650);
    }
    
    /* ---------- render loop ---------- */
    let lastTime = performance.now();
    function tick(now){
      const dt = now-lastTime; lastTime=now;
      
      if(!reduceMotion) {
        // Parallax easing
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        // Dynamic lighting orbit
        const elapsed = now/1000;
        dirLight.position.x = Math.cos(elapsed * 0.4) * 20;
        dirLight.position.z = Math.sin(elapsed * 0.4) * 20;
        dirLight2.position.x = Math.sin(elapsed * 0.3) * -20;
        dirLight2.position.z = Math.cos(elapsed * 0.3) * -20;
      }
    
      if(!isDragging && !reduceMotion && (now-lastInteraction)>1500){
        camState.theta += 0.00025*dt;
      }
      
      updateCameraPosition();
      
      Object.values(nodesById).forEach(node => {
        if(node.mesh && !reduceMotion) {
          node.mesh.rotation.y += 0.0005 * dt;
          node.mesh.rotation.x += 0.0002 * dt;
        }
      });
    
      const elapsed = now/1000;
      edges.forEach(e=>{
        const t = (elapsed*e.speed + e.phase) % 1;
        e.pulse.position.lerpVectors(e.start, e.end, t);
        e.pulse.material.opacity = Math.sin(t*Math.PI)*0.9+0.1;
      });
      
      if(particles && !reduceMotion) {
        particles.rotation.y += 0.00003 * dt;
        // Ascending particles loop
        const posAttr = particles.geometry.attributes.position;
        const posArr = posAttr.array;
        for(let i=1; i<posArr.length; i+=3) {
          posArr[i] += 0.004 * dt;
          if(posArr[i] > 55) posArr[i] = -55; // Wrap around
        }
        posAttr.needsUpdate = true;
      }
    
      checkHover();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    
    /* ---------- boot ---------- */
    async function main(){
      const graphPromise = buildGraph();
      const textPromise = playBootText();
      buildParticles();
      requestAnimationFrame(tick);
      await Promise.all([graphPromise, textPromise]);
      await sleep(400);
      fadeOutBoot();
    }
    main();
    
    })();
