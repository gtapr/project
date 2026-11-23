// Bootstrap + main loop: renderer, lighting/day-night, sky, state machine (menu/play/pause), save/load, audio.
(function(S){
const $=id=>document.getElementById(id);
if(!window.THREE){$('loading').textContent='Could not load Three.js from the CDN. Check your internet connection.';return}
const T=THREE,I=S.input,W=S.world,P=S.player,C=S.cam;
const canvas=$('c'),renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(60,1,.1,600);scene.fog=new T.Fog(0x888888,70,380);
const hemi=new T.HemisphereLight(0xffffff,0x2a2622,.6),sun=new T.DirectionalLight(0xffffff,1);
sun.shadow.mapSize.set(2048,2048);const sc=sun.shadow.camera;sc.left=sc.bottom=-70;sc.right=sc.top=70;sc.near=1;sc.far=400;sun.shadow.bias=-.0005;
scene.add(hemi,sun,sun.target);
// Sky dome: vertical gradient + sun/moon glow, recoloured by applyTime
const skyU={top:{value:new T.Color()},hor:{value:new T.Color()},sd:{value:new T.Vector3()},gc:{value:new T.Color()}};
const sky=new T.Mesh(new T.SphereGeometry(450,24,12),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top,hor,sd,gc;varying vec3 v;void main(){vec3 n=normalize(v);float h=clamp(n.y,0.,1.);vec3 c=mix(hor,top,pow(h,.55));float d=max(dot(n,sd),0.);c+=gc*(pow(d,6.)*.5+pow(d,400.)*3.);gl_FragColor=vec4(c,1.);}'}));
sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);

W.build(scene);scene.add(P.mesh);S.vehicles.spawn(scene);S.spawnNPCs(scene,16);

// ---- interactables ----
for(const car of S.vehicles.cars)S.interact.add({pos:()=>car.pos,r:3.8,active:()=>!P.car,prompt:()=>'E — Enter '+car.name,use:()=>S.vehicles.enter(car)});
S.interact.add({pos:()=>P.pos,r:999,active:()=>!!P.car&&Math.abs(P.car.speed)<6,prompt:()=>'E — Exit Vehicle',use:()=>S.vehicles.exit()});
S.interact.add({pos:()=>W.atm,r:2.6,active:()=>!P.car,prompt:()=>'E — Withdraw $100',use:()=>{P.money+=100;S.toast('+$100')}});

// ---- day/night ----
S.time=17.5;
const col=(h)=>new T.Color(h),sm=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
const K={dT:col(0x3c78c0),dH:col(0xa8d0f0),nT:col(0x04061a),nH:col(0x141a3a),sT:col(0x5a3a7a),sH:col(0xff7a50),moon:col(0x6e86c8),warm:col(0xffb070),white:col(0xfff4e0)},tmp=new T.Color();
function applyTime(h,focus){
  const ang=(h-6)/24*Math.PI*2,sy=Math.sin(ang),d=sm(-.12,.3,sy),dusk=Math.exp(-Math.pow(sy/.22,2)),night=1-sm(-.1,.15,sy);
  const top=skyU.top.value.copy(K.nT).lerp(K.dT,d).lerp(K.sT,dusk*.6),hor=skyU.hor.value.copy(K.nH).lerp(K.dH,d).lerp(K.sH,dusk*.85);
  scene.fog.color.copy(hor);const vec=new T.Vector3(Math.cos(ang),sy,.35).normalize(),up=sy>-.05;
  skyU.sd.value.copy(up?vec:vec.clone().negate());skyU.gc.value.copy(up?K.warm:K.moon).multiplyScalar(up?.3+dusk:.25);
  sun.color.copy(K.moon).lerp(K.warm,sm(-.1,.1,sy)).lerp(K.white,sm(.1,.5,sy));sun.intensity=.3+1.0*d;
  sun.position.copy(focus).addScaledVector(up?vec:vec.clone().negate(),150);sun.target.position.copy(focus);
  hemi.color.copy(hor).lerp(K.white,.3);hemi.intensity=.3+.6*d;
  for(const g of W.glow)g[0].emissiveIntensity=g[1]+g[2]*night;
  W.poolMat.opacity=night*.55;S.carMats.head.emissiveIntensity=.4+night*2;S.carMats.tail.emissiveIntensity=.5+night*.8;
  sky.position.copy(camera.position);
}

// ---- settings / resize ----
function applySettings(){const q=S.settings.quality,sh=q!=='low';
  renderer.setPixelRatio(q==='low'?.7:q==='medium'?1:Math.min(devicePixelRatio,2));
  if(renderer.shadowMap.enabled!==sh){renderer.shadowMap.enabled=sh;sun.castShadow=sh;scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true)})}
  S.setNPCCount(q==='low'?8:q==='medium'?12:16);resize()}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);

// ---- audio: one synthesised engine tone, volume from settings ----
const audio={ctx:null,
  init(){if(this.ctx)return;try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),f=a.createBiquadFilter(),g=a.createGain();
    o.type='sawtooth';f.type='lowpass';f.frequency.value=500;g.gain.value=0;o.connect(f);f.connect(g);g.connect(a.destination);o.start();Object.assign(this,{ctx:a,o,g})}catch(e){}},
  set(speed,on){if(!this.ctx)return;const t=this.ctx.currentTime;this.o.frequency.setTargetAtTime(45+Math.abs(speed)*3.2,t,.1);this.g.gain.setTargetAtTime(on?.09*S.settings.volume:0,t,.1)}};

// ---- state / save ----
function setState(s){S.state=s;$('menu').classList.toggle('hidden',s!=='menu');$('pause').classList.toggle('hidden',s!=='pause');$('hud').classList.toggle('hidden',s==='menu');if(s!=='play')audio.set(0,false)}
const lock=()=>{try{const p=canvas.requestPointerLock();p&&p.catch&&p.catch(()=>{})}catch(e){}};
function placePlayer(x,y,z){if(P.car)S.vehicles.exit();P.pos.set(x,y,z);P.vel.set(0,0);P.vy=0;P.mesh.visible=true;P.sync(0)}
function newGame(){S.vehicles.reset();placePlayer(-40,0,-14);P.health=100;P.money=500;S.time=17.5;C.yaw=0;C.pitch=.35}
function readSave(){const d=S.save.read();if(!d||!d.pos)return false;placePlayer(d.pos[0],d.pos[1],d.pos[2]);
  P.health=d.health;P.money=d.money;S.time=d.time;C.yaw=d.yaw||0;return true}
function saveNow(quiet){const p=P.car?P.car.pos:P.pos;const ok=S.save.write({v:1,money:P.money,health:P.health,time:S.time,pos:[p.x,p.y,p.z],yaw:C.yaw});if(!quiet)S.toast(ok?'Game saved':'Could not save')}
S.game={applySettings,saveNow,
  start(mode){audio.init();if(mode==='load'&&readSave());else newGame();setState('play');lock()},
  resume(){setState('play');lock()},
  loadNow(){if(readSave()){S.toast('Game loaded');S.game.resume()}else S.toast('No save found')},
  toMenu(){saveNow(true);document.exitPointerLock&&document.exitPointerLock();setState('menu')}};
const pause=()=>{if(S.state==='play')setState('pause')};
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement)pause()});
addEventListener('keydown',e=>{if(e.code==='Escape')pause()});
canvas.addEventListener('click',()=>{if(S.state==='play'&&!document.pointerLockElement)lock()});
setInterval(()=>{if(S.state==='play')saveNow(true)},30000);   // autosave

// ---- main loop ----
let last=performance.now(),menuT=0;const focus=new T.Vector3();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
  if(S.state==='play'){
    S.time=(S.time+dt*24/720)%24;                       // full day = 12 real minutes
    const car=P.car;
    if(car){car.update(dt,{thr:(I.down('KeyW')?1:0)-(I.down('KeyS')?1:0),steer:(I.down('KeyA')?1:0)-(I.down('KeyD')?1:0),hand:I.down('Space')});
      P.pos.set(car.pos.x,car.pos.y,car.pos.z)}else P.update(dt);
    for(const c of S.vehicles.cars)if(c!==car&&(Math.abs(c.vx)+Math.abs(c.vz)>.05))c.update(dt,null);
    S.updateNPCs(dt,P.pos);S.interact.update();S.updateCamera(camera,dt);S.hud.update();
    audio.set(car?car.speed:0,!!car);
    if(P.health<=0){S.toast('WASTED — lost $100');P.money=Math.max(0,P.money-100);P.health=100;placePlayer(-40,0,-14)}
    focus.copy(P.pos);
  }else if(S.state==='menu'){menuT+=dt*.05;S.time=(S.time+dt*.05)%24;focus.set(0,0,0);
    camera.position.set(Math.cos(menuT)*95,32,Math.sin(menuT)*95);camera.lookAt(0,10,0);S.updateNPCs(dt,focus)}
  applyTime(S.time,focus);renderer.render(scene,camera);I.endFrame()}
applySettings();S.state='menu';S.time=18.1;$('loading').classList.add('hidden');setState('menu');requestAnimationFrame(frame);
})(window.SUNSET=window.SUNSET||{});
