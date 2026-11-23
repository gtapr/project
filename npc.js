// Pedestrians: each walks the sidewalk ring of one block (clockwise or counter), occasionally reversing.
// They collide with buildings/props. Distant NPCs are hidden and not simulated.
(function(S){
const T=THREE,W=S.world,pick=a=>a[Math.floor(Math.random()*a.length)];
const skins=[0xf1c8a0,0xc9966e,0x8d5a3b,0x5e3a28,0xe0b08a],shirts=[0xd1306a,0x2ec4b6,0xf4e9d8,0x2d3f66,0xe8a33d,0x6b4a8f,0x3a3a44],
  pants=[0x23232b,0x3b4a6b,0x6b5d4b,0xb9b0a0],hairs=[0x1a1410,0x4a3020,0xc9a15a,0x777777,0x8a2f2f],A=18.7;
const corner=(b,k)=>[[A,A],[A,-A],[-A,-A],[-A,A]][k%4].map((v,i)=>v+(i?b.cz:b.cx));
S.npcs=[];
S.spawnNPCs=function(scene,n){for(let i=0;i<n;i++){
  const b=pick(W.blocks),k=Math.floor(Math.random()*4),dir=Math.random()<.5?1:-1,tk=(k+dir+4)%4,a=corner(b,k),c=corner(b,tk),f=Math.random();
  const mesh=S.makeHuman({skin:pick(skins),shirt:pick(shirts),pants:pick(pants),hair:pick(hairs)});scene.add(mesh);
  S.npcs.push({mesh,b,k,tk,dir,pos:new T.Vector3(a[0]+(c[0]-a[0])*f,W.H,a[1]+(c[1]-a[1])*f),speed:1.1+Math.random()*.7,face:0,t:Math.random()*10,active:true})}};
S.setNPCCount=n=>S.npcs.forEach((p,i)=>{p.active=i<n;if(!p.active)p.mesh.visible=false});
S.updateNPCs=function(dt,focus){for(const p of S.npcs){if(!p.active)continue;
  const near=p.pos.distanceTo(focus)<110;p.mesh.visible=near;if(!near)continue;
  const c=corner(p.b,p.tk),dx=c[0]-p.pos.x,dz=c[1]-p.pos.z,d=Math.hypot(dx,dz);
  if(d<.8){p.k=p.tk;if(Math.random()<.1)p.dir=-p.dir;p.tk=(p.k+p.dir+4)%4}
  else{p.pos.x+=dx/d*p.speed*dt;p.pos.z+=dz/d*p.speed*dt;p.face=S.lerpAngle(p.face,Math.atan2(dx,dz),1-Math.exp(-8*dt))}
  W.resolve(p.pos,.35);p.t+=dt;p.mesh.position.copy(p.pos);p.mesh.rotation.y=p.face;S.animateHuman(p.mesh,p.speed*2,p.t)}};
})(window.SUNSET=window.SUNSET||{});
