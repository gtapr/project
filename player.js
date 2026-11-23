// Player character (procedural humanoid), on-foot movement, and the third-person camera (S.cam).
(function(S){
const T=THREE,I=S.input,W=S.world,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const mats={},mt=c=>mats[c]||(mats[c]=new T.MeshStandardMaterial({color:c,roughness:.8}));
const G={leg:new T.BoxGeometry(.2,.9,.22),torso:new T.BoxGeometry(.5,.62,.28),arm:new T.BoxGeometry(.13,.58,.16),head:new T.SphereGeometry(.16,10,8),hair:new T.SphereGeometry(.175,10,6,0,Math.PI*2,0,Math.PI*.55)};
S.lerpAngle=(a,b,t)=>{const d=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return a+d*t};
// Shared by player and NPCs. colors: {skin,shirt,pants,hair}
S.makeHuman=c=>{const g=new T.Group(),L={};
  const part=(geo,col,y,x,pivot,name)=>{const p=new T.Group(),m=new T.Mesh(geo,mt(col));p.position.set(x,pivot,0);m.position.y=y;m.castShadow=true;p.add(m);g.add(p);if(name)L[name]=p};
  part(G.leg,c.pants,-.45,-.13,.9,'legL');part(G.leg,c.pants,-.45,.13,.9,'legR');part(G.torso,c.shirt,0,0,1.2);
  part(G.arm,c.shirt,-.27,-.34,1.48,'armL');part(G.arm,c.shirt,-.27,.34,1.48,'armR');
  part(G.head,c.skin,0,0,1.68);part(G.hair,c.hair,.02,0,1.68);g.userData.limbs=L;return g};
S.animateHuman=(g,speed,t)=>{const L=g.userData.limbs,s=Math.sin(t*(2+speed*1.1))*Math.min(speed/5,1)*.9;
  L.legL.rotation.x=s;L.legR.rotation.x=-s;L.armL.rotation.x=-s;L.armR.rotation.x=s};

const P=S.player={pos:new T.Vector3(-40,0,-14),vy:0,vel:new T.Vector2(),face:0,health:100,money:500,car:null,t:0,grounded:true};
P.mesh=S.makeHuman({skin:0xc9966e,shirt:0x2d3f66,pants:0x23232b,hair:0x1a1410});
P.update=function(dt){
  if(P.car)return;
  const f=(I.down('KeyW')?1:0)-(I.down('KeyS')?1:0),s=(I.down('KeyD')?1:0)-(I.down('KeyA')?1:0),sy=Math.sin(C.yaw),cy=Math.cos(C.yaw);
  const dx=sy*f-cy*s,dz=cy*f+sy*s,len=Math.hypot(dx,dz),sp=(I.down('ShiftLeft')||I.down('ShiftRight'))?8:4.2;
  let tx=0,tz=0;if(len>0){tx=dx/len*sp;tz=dz/len*sp;P.face=S.lerpAngle(P.face,Math.atan2(dx,dz),1-Math.exp(-14*dt))}
  const k=1-Math.exp(-(P.grounded?12:2.5)*dt);P.vel.x+=(tx-P.vel.x)*k;P.vel.y+=(tz-P.vel.y)*k;
  P.pos.x+=P.vel.x*dt;P.pos.z+=P.vel.y*dt;W.resolve(P.pos,.4);
  if(I.pressed('Space')&&P.grounded){P.vy=7;P.grounded=false}
  P.vy-=22*dt;P.pos.y+=P.vy*dt;const gh=W.groundHeight(P.pos.x,P.pos.z);
  if(P.pos.y<=gh){P.pos.y=gh;P.vy=0;P.grounded=true}else if(P.pos.y>gh+.05)P.grounded=false;
  P.t+=dt;P.sync(Math.hypot(P.vel.x,P.vel.y));
};
P.sync=function(speed){P.mesh.position.copy(P.pos);P.mesh.rotation.y=P.face;S.animateHuman(P.mesh,speed||0,P.t)};

// ---- Third-person camera: orbit around target; auto-follows car heading when mouse idle ----
const C=S.cam={yaw:0,pitch:.35,dist:6,idle:0,pos:new T.Vector3(),target:new T.Vector3()};
const inBig=(x,z)=>W.big.some(b=>x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1);
S.updateCamera=function(camera,dt){
  const k=.0022*S.settings.sens;
  if(I.dx||I.dy){C.yaw-=I.dx*k;C.pitch=cl(C.pitch+I.dy*k,-.1,1.2);C.idle=0}else C.idle+=dt;
  C.dist=cl(C.dist+I.wheel*.005,3,12);
  const car=P.car;
  if(car&&C.idle>1.5&&Math.abs(car.speed)>2)C.yaw=S.lerpAngle(C.yaw,car.h,1-Math.exp(-2*dt));
  const base=car?car.pos:P.pos,d=C.dist*(car?1.5:1);
  C.target.set(base.x,base.y+(car?1.3:1.5),base.z);
  const ox=-Math.sin(C.yaw)*Math.cos(C.pitch),oy=Math.sin(C.pitch),oz=-Math.cos(C.yaw)*Math.cos(C.pitch);
  let f=1;for(let s=1;s<=8;s++){if(inBig(C.target.x+ox*d*s/8,C.target.z+oz*d*s/8)){f=Math.max(.15,(s-1)/8);break}}
  const wx=C.target.x+ox*d*f,wy=Math.max(.6,C.target.y+oy*d*f+.4),wz=C.target.z+oz*d*f;
  C.pos.lerp(new T.Vector3(wx,wy,wz),1-Math.exp(-14*dt));camera.position.copy(C.pos);camera.lookAt(C.target);
};
})(window.SUNSET=window.SUNSET||{});
