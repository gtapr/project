// Drivable cars: arcade bicycle-model physics with lateral grip (handbrake = drift), box collisions, enter/exit.
(function(S){
const T=THREE,W=S.world,Bx=(w,h,d)=>new T.BoxGeometry(w,h,d);
const glass=new T.MeshStandardMaterial({color:0x0e1a24,roughness:.1,metalness:.8}),dark=new T.MeshStandardMaterial({color:0x15151a,roughness:.9});
const head=new T.MeshStandardMaterial({color:0xfff4d0,emissive:0xfff0b0,emissiveIntensity:.5});
const tail=new T.MeshStandardMaterial({color:0x661111,emissive:0xff1a1a,emissiveIntensity:.6});
const wheelGeo=new T.CylinderGeometry(.36,.36,.26,14).rotateZ(Math.PI/2),nrm={nx:0,nz:0};
S.carMats={head,tail};   // game.js brightens these at night

class Car{
  constructor(name,color,x,z,h){this.name=name;this.init=[x,z,h];this.pos=new T.Vector3();this.occupied=false;this.build(color);this.reset()}
  reset(){this.pos.set(this.init[0],0,this.init[1]);this.h=this.init[2];this.vx=this.vz=this.speed=this.steer=0;this.sync()}
  build(color){const g=this.mesh=new T.Group(),body=new T.MeshStandardMaterial({color,roughness:.3,metalness:.6});
    const add=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;g.add(m)};
    add(Bx(2,.55,4.4),body,0,.65,0);add(Bx(1.8,.5,2.3),glass,0,1.2,-.35);add(Bx(1.84,.07,2.0),body,0,1.49,-.35);
    add(Bx(2.05,.25,.2),dark,0,.45,2.2);add(Bx(2.05,.25,.2),dark,0,.45,-2.2);
    for(const s of[-1,1]){add(Bx(.45,.18,.1),head,s*.7,.72,2.21);add(Bx(.5,.15,.1),tail,s*.7,.78,-2.21)}
    this.wheels=[];for(const[x,z,f]of[[-1,1.4,1],[1,1.4,1],[-1,-1.4,0],[1,-1.4,0]]){
      const p=new T.Group(),w=new T.Mesh(wheelGeo,dark);p.position.set(x,.36,z);w.castShadow=true;p.add(w);g.add(p);this.wheels.push({p,w,f})}}
  // c = {thr:-1..1, steer:-1..1 (left +), hand:bool}; null when parked
  update(dt,c){c=c||{thr:0,steer:0,hand:false};
    let sh=Math.sin(this.h),ch=Math.cos(this.h),vf=this.vx*sh+this.vz*ch,vl=-this.vx*ch+this.vz*sh;
    if(c.thr>0)vf+=(vf<0?30:15*Math.max(0,1-vf/42))*dt;
    else if(c.thr<0){if(vf>.5)vf-=30*dt;else vf=Math.max(vf-9*dt,-11)}
    if(c.hand)vf-=Math.sign(vf)*Math.min(Math.abs(vf),12*dt);
    else if(!c.thr)vf-=Math.sign(vf)*Math.min(Math.abs(vf),(2.5+.012*vf*vf)*dt);   // rolling resistance + drag
    vl*=Math.exp(-(c.hand?1.1:7)*dt);                                                // lateral grip
    this.vx=sh*vf-ch*vl;this.vz=ch*vf+sh*vl;                                         // world velocity, old heading
    const st=c.steer*.62/(1+Math.abs(vf)/14);this.steer+=(st-this.steer)*(1-Math.exp(-10*dt));
    this.h+=vf/2.7*Math.tan(this.steer)*dt;                                          // heading changes; velocity doesn't => slip
    this.pos.x+=this.vx*dt;this.pos.z+=this.vz*dt;sh=Math.sin(this.h);ch=Math.cos(this.h);
    for(const off of[1.5,-1.5]){const q={x:this.pos.x+sh*off,z:this.pos.z+ch*off},px=q.x,pz=q.z;
      if(W.resolve(q,1.05,nrm)){this.pos.x+=q.x-px;this.pos.z+=q.z-pz;const d=this.vx*nrm.nx+this.vz*nrm.nz;
        if(d<0){this.vx-=1.3*d*nrm.nx;this.vz-=1.3*d*nrm.nz;if(this.occupied&&d<-9)S.player.health-=(-d-9)*1.6}}}
    this.speed=this.vx*sh+this.vz*ch;this.sync(dt)}
  sync(dt){const gh=W.groundHeight(this.pos.x,this.pos.z);this.pos.y+=(gh-this.pos.y)*(dt?1-Math.exp(-12*dt):1);
    this.mesh.position.copy(this.pos);this.mesh.rotation.y=this.h;
    for(const w of this.wheels){if(w.f)w.p.rotation.y=this.steer;w.w.rotation.x+=this.speed*(dt||0)/.36}}
}
const V=S.vehicles={cars:[],
  spawn(scene){[['Sentinel GT',0xd1306a,-52.5,-26,0],['Coast Cruiser',0x2ec4b6,-59.5,-40,Math.PI],['Palm Sedan',0xefe6d2,-10,3.5,Math.PI/2],['Night Runner',0x23232b,-30,-3.5,-Math.PI/2]]
    .forEach(d=>{const c=new Car(...d);V.cars.push(c);scene.add(c.mesh)})},
  reset(){V.cars.forEach(c=>c.reset())},
  enter(c){const p=S.player;p.car=c;c.occupied=true;p.mesh.visible=false;S.cam.yaw=c.h;S.cam.idle=0},
  exit(){const p=S.player,c=p.car;if(!c)return;const sh=Math.sin(c.h),ch=Math.cos(c.h);
    const cand=[[ch*2.4,-sh*2.4],[-ch*2.4,sh*2.4],[-sh*3.4,-ch*3.4]];let spot=cand[0];
    for(const s of cand){if(!W.resolve({x:c.pos.x+s[0],z:c.pos.z+s[1]},.5)){spot=s;break}}
    p.pos.set(c.pos.x+spot[0],0,c.pos.z+spot[1]);W.resolve(p.pos,.45);p.pos.y=W.groundHeight(p.pos.x,p.pos.z);
    p.vel.set(0,0);p.vy=0;p.face=c.h;c.occupied=false;p.car=null;p.mesh.visible=true}
};
})(window.SUNSET=window.SUNSET||{});
