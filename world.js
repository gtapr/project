// Procedural city: 4x4 blocks separated by roads. Also owns collision data (2D boxes) and ground height.
// Layout: block pitch P, road width ROAD, block size BLK. Block (1,1) is the park/plaza.
(function(S){
const T=THREE,P=56,ROAD=14,BLK=P-ROAD,N=4,H=.15,EXT=N*P/2+ROAD/2;
const W=S.world={P,ROAD,BLK,N,H,EXT,boxes:[],big:[],blocks:[],glow:[],atm:null};
const ctr=i=>(i-(N-1)/2)*P;W.ctr=ctr;
let seed=7;const rand=()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
const R=(a,b)=>a+rand()*(b-a),pick=a=>a[Math.floor(rand()*a.length)];

function addBox(x,z,hw,hd,big){const b={x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd};W.boxes.push(b);if(big)W.big.push(b)}
// Sidewalk blocks are raised by H; everything else is road level.
W.groundHeight=(x,z)=>{const i=Math.round(x/P+(N-1)/2),j=Math.round(z/P+(N-1)/2);
  if(i<0||j<0||i>=N||j>=N)return 0;return(Math.abs(x-ctr(i))<BLK/2&&Math.abs(z-ctr(j))<BLK/2)?H:0};
// Push circle (p.x,p.z,r) out of all boxes. Returns true on hit; out gets the last contact normal.
W.resolve=(p,r,out)=>{let hit=false;
  for(const b of W.boxes){const cx=Math.max(b.x0,Math.min(p.x,b.x1)),cz=Math.max(b.z0,Math.min(p.z,b.z1));
    const dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;if(d2>=r*r)continue;hit=true;let nx,nz;
    if(d2>1e-9){const d=Math.sqrt(d2);nx=dx/d;nz=dz/d;p.x+=nx*(r-d);p.z+=nz*(r-d)}
    else{const l=p.x-b.x0,rr=b.x1-p.x,t=p.z-b.z0,bt=b.z1-p.z,m=Math.min(l,rr,t,bt);
      if(m===l){nx=-1;nz=0;p.x=b.x0-r}else if(m===rr){nx=1;nz=0;p.x=b.x1+r}else if(m===t){nx=0;nz=-1;p.z=b.z0-r}else{nx=0;nz=1;p.z=b.z1+r}}
    if(out){out.nx=nx;out.nz=nz}}
  return hit};

function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function tex(c){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t}
// Facade tile = 8m x 6m (2x2 windows). Second canvas is the night emissive map (lit windows).
function facade(base,frame){const c=cv(128,96),g=c.getContext('2d'),e=cv(128,96),h=e.getContext('2d');
  g.fillStyle=base;g.fillRect(0,0,128,96);h.fillStyle='#000';h.fillRect(0,0,128,96);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){const x=i*64+14,y=j*48+9;
    g.fillStyle=frame;g.fillRect(x-3,y-3,42,34);g.fillStyle='#1c2b38';g.fillRect(x,y,36,28);
    if(rand()<.5){h.fillStyle=rand()<.8?'#ffc875':'#8fd8ff';h.fillRect(x,y,36,28)}}
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,90,128,6);return[tex(c),tex(e)]}
function sign(text,color){const c=cv(256,48),g=c.getContext('2d');g.fillStyle='#05060a';g.fillRect(0,0,256,48);
  g.font='bold 30px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.shadowColor=color;g.shadowBlur=10;g.fillText(text,128,26);return tex(c)}

W.build=function(scene){
  const g=W.group=new T.Group();scene.add(g);
  const std=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o));
  const glow=(m,b,k)=>{W.glow.push([m,b,k]);return m};
  const Bx=(w,h,d)=>new T.BoxGeometry(w,h,d);
  const add=(geo,mat,x,y,z,cast)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!!cast;m.receiveShadow=true;g.add(m);return m};
  // list items: [x,y,z,rotX,rotY,rotZ,scale]
  const inst=(geo,mat,list,cast)=>{if(!list.length)return;const m=new T.InstancedMesh(geo,mat,list.length),d=new T.Object3D();
    list.forEach((o,i)=>{d.position.set(o[0],o[1],o[2]);d.rotation.set(o[3]||0,o[4]||0,o[5]||0,'YXZ');d.scale.setScalar(o[6]||1);d.updateMatrix();m.setMatrixAt(i,d.matrix)});
    m.castShadow=!!cast;m.receiveShadow=true;m.frustumCulled=false;g.add(m)};

  add(new T.PlaneGeometry(EXT*2+500,EXT*2+500).rotateX(-Math.PI/2),std(0x202127,{roughness:.95}),0,0,0);
  // Dashed centre lines between intersections (instanced)
  const dashMat=vert=>{const c=cv(vert?4:64,vert?64:4),x=c.getContext('2d');x.fillStyle='#e0b43a';vert?x.fillRect(0,0,4,32):x.fillRect(0,0,32,4);
    const t=tex(c);t.repeat.set(vert?1:BLK/8,vert?BLK/8:1);return std(0xffffff,{map:t,transparent:true})};
  const hl=[],vl=[];for(let k=0;k<=N;k++)for(let j=0;j<N;j++){hl.push([ctr(j),.03,(k-2)*P]);vl.push([(k-2)*P,.03,ctr(j)])}
  inst(new T.PlaneGeometry(BLK,.35).rotateX(-Math.PI/2),dashMat(false),hl);
  inst(new T.PlaneGeometry(.35,BLK).rotateX(-Math.PI/2),dashMat(true),vl);
  // Invisible map-edge walls
  addBox(0,EXT+4,EXT+10,4);addBox(0,-EXT-4,EXT+10,4);addBox(EXT+4,0,4,EXT+10);addBox(-EXT-4,0,4,EXT+10);

  const pals=[['#8a5a4e','#d9cbb8'],['#b9a99a','#3a3a40'],['#4a6470','#d9d4c8'],['#d8a9a0','#4a3a40'],['#cdbb94','#3a3a40']].map(p=>facade(p[0],p[1]));
  const roofMat=std(0x3a3a40),acGeo=Bx(3,1.4,2.4),balGeo=Bx(3.2,.15,1.2),railGeo=Bx(3.2,.9,.05);
  const shop=glow(std(0x1c2d3a,{emissive:0xffc070,emissiveIntensity:.2,roughness:.2,metalness:.4}),.15,.9);
  const doorM=std(0x15151a),awn=[0xd1306a,0x2ec4b6,0xefe6d2].map(c=>std(c));
  const names=['BAR','CLUB 88','PIZZA','MOTEL','CAFÉ','LIQUOR','LUNA','DINER','ARCADE','NOVA','PALMS','TACOS'],neon=['#ff3d9a','#35e0ff','#ffb347','#a77bff'];
  const acs=[],bal=[],rails=[];
  function building(x,z,sgn){
    const [t,te]=pick(pals),pairs=Math.floor(R(2,7)),h=pairs*6,w=16,tc=t.clone(),ec=te.clone();
    [tc,ec].forEach(q=>{q.repeat.set(2,pairs);q.needsUpdate=true});
    const wall=glow(new T.MeshStandardMaterial({map:tc,emissiveMap:ec,emissive:0xffffff,emissiveIntensity:0,roughness:.85}),0,1.2);
    const m=new T.Mesh(Bx(w,h,w),[wall,wall,roofMat,roofMat,wall,wall]);m.position.set(x,H+h/2,z);m.castShadow=m.receiveShadow=true;g.add(m);
    addBox(x,z,w/2,w/2,true);
    const zf=z+sgn*(w/2+.15);                       // street-facing side
    add(Bx(13,3,.3),shop,x,H+1.7,zf);add(Bx(1.6,2.6,.5),doorM,x+(rand()<.5?-4.8:4.8),H+1.4,zf+sgn*.1);
    add(Bx(13.4,.12,1.8),pick(awn),x,H+3.7,zf+sgn*.9);
    const st=sign(pick(names),pick(neon));add(Bx(8,1,.3),glow(std(0xffffff,{map:st,emissiveMap:st,emissive:0xffffff,emissiveIntensity:.8}),.7,.8),x,H+4.9,zf);
    acs.push([x+R(-4,4),H+h+.7,z+R(-4,4)]);
    if(pairs>=3)for(let r=1;r<pairs;r++)for(const bx of[-4,4]){bal.push([x+bx,H+6*r+.6,z+sgn*(w/2+.6)]);rails.push([x+bx,H+6*r+1.1,z+sgn*(w/2+1.2)])}
  }
  // Trees, palms, lamps (all instanced)
  const palms=[],trees=[],lamps=[];
  const park=(cx,cz)=>{const stone=std(0x8c8a84);
    add(new T.CircleGeometry(8,24).rotateX(-Math.PI/2),stone,cx,H+.02,cz);
    add(Bx(BLK-2,.03,3),stone,cx,H+.015,cz);add(Bx(3,.03,BLK-2),stone,cx,H+.015,cz);
    add(new T.CylinderGeometry(3,3.2,.7,16),stone,cx,H+.35,cz,true);
    add(new T.CylinderGeometry(2.6,2.6,.05,16),glow(std(0x2a7fb8,{emissive:0x35e0ff,emissiveIntensity:.2,roughness:.1}),.2,.6),cx,H+.72,cz);
    add(new T.CylinderGeometry(.3,.5,2.2,8),stone,cx,H+1.6,cz,true);addBox(cx,cz,3.2,3.2);
    const wood=std(0x6b4a33);
    for(const[bx,bz,ro]of[[6.5,0,1],[-6.5,0,1],[0,6.5,0],[0,-6.5,0]]){
      const b=new T.Group();b.add(new T.Mesh(Bx(2,.12,.6),wood));const bk=new T.Mesh(Bx(2,.5,.1),wood);bk.position.set(0,.4,-.28);b.add(bk);
      b.position.set(cx+bx,H+.5,cz+bz);b.rotation.y=ro?-Math.PI/2*Math.sign(bx):(bz>0?Math.PI:0);b.traverse(o=>o.castShadow=true);g.add(b);addBox(cx+bx,cz+bz,ro?.4:1,ro?1:.4)}
    // ATM kiosk (interactable, see game.js)
    const ax=cx+12,az=cz+3;add(Bx(1,2.2,.8),std(0x23232b),ax,H+1.1,az,true);
    add(Bx(.7,.5,.05),glow(std(0x103040,{emissive:0x35e0ff,emissiveIntensity:.6}),.6,.6),ax,H+1.5,az-.43);addBox(ax,az,.5,.4);W.atm={x:ax,z:az};
    for(const[dx,dz]of[[14,14],[-14,14],[14,-14],[-14,-14],[0,15],[0,-15]])trees.push([cx+dx,H,cz+dz,0,0,0,R(.9,1.2)]);
    for(const[dx,dz]of[[14,6],[-14,6],[14,-6],[-14,-6],[6,14],[-6,14],[6,-14],[-6,-14]])palms.push([cx+dx,H,cz+dz]);
  };
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const cx=ctr(i),cz=ctr(j),isPark=i===1&&j===1;
    add(Bx(BLK,H,BLK),isPark?std(0x2f5d3a):std(0x6e6c68),cx,H/2,cz);W.blocks.push({cx,cz,park:isPark});
    if(isPark)park(cx,cz);else{for(const sx of[-1,1])for(const sz of[-1,1])building(cx+sx*9,cz+sz*9,sz);
      for(const sx of[-10,10])for(const sz of[-20,20])palms.push([cx+sx,H,cz+sz])}
    for(const[lx,lz]of[[20.4,20.4],[-20.4,20.4],[20.4,-20.4],[-20.4,-20.4],[20.4,0],[-20.4,0]])lamps.push([cx+lx,H,cz+lz])}
  inst(acGeo,roofMat,acs,true);inst(balGeo,roofMat,bal,true);inst(railGeo,std(0x2b2b31),rails);
  // Palms: trunk + 6 drooping fronds each
  const fr=[];palms.forEach(p=>{addBox(p[0],p[2],.3,.3);for(let k=0;k<6;k++)fr.push([p[0],p[1]+7,p[2],.5,k*Math.PI/3+p[0],0])});
  inst(new T.CylinderGeometry(.18,.3,7,6).translate(0,3.5,0),std(0x7a5a3a),palms,true);
  inst(new T.BoxGeometry(.55,.05,3.4).translate(0,0,1.7),std(0x2f7a4a),fr,true);
  trees.forEach(t=>addBox(t[0],t[2],.3,.3));
  inst(new T.CylinderGeometry(.2,.28,3,6).translate(0,1.5,0),std(0x5a4030),trees,true);
  inst(new T.IcosahedronGeometry(2.2,1),std(0x2d6a3e),trees.map(t=>[t[0],t[1]+4.2,t[2],0,0,0,t[6]]),true);
  // Street lamps: pole + glowing bulb + additive light pool on the ground
  lamps.forEach(l=>addBox(l[0],l[2],.2,.2));
  inst(new T.CylinderGeometry(.09,.12,6.2,6).translate(0,3.1,0),std(0x2b2b31),lamps);
  inst(new T.SphereGeometry(.32,8,6),glow(std(0xfff0c8,{emissive:0xffd890,emissiveIntensity:0}),.1,2.5),lamps.map(l=>[l[0],l[1]+6.3,l[2]]));
  const pc=cv(64,64),pg=pc.getContext('2d'),gr=pg.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');pg.fillStyle=gr;pg.fillRect(0,0,64,64);
  W.poolMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(pc),color:0xffc880,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});
  inst(new T.PlaneGeometry(13,13).rotateX(-Math.PI/2),W.poolMat,lamps.map(l=>[l[0]*.97,.22,l[2]*.97]));
};
})(window.SUNSET=window.SUNSET||{});
