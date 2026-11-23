// HUD: health, money, clock, vehicle/speed, prompt, toast and a rotating minimap (camera-forward is up).
(function(S){
const $=id=>document.getElementById(id),mm=$('minimap'),g=mm.getContext('2d'),W=S.world;let fr=0,tt=0;
S.hud={setPrompt(t){const e=$('prompt');if(e.textContent!==t)e.textContent=t},
  update(){const P=S.player,car=P.car;
    $('hp').style.width=Math.max(0,P.health)+'%';$('money').textContent='$'+Math.round(P.money).toLocaleString();
    const h=Math.floor(S.time),m=Math.floor((S.time-h)*60);$('clock').textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
    $('veh').textContent=car?car.name:'On foot';$('speed').textContent=car?Math.round(Math.abs(car.speed)*3.6)+' km/h':'';
    if((fr++&1)===0)map(P)}};
S.toast=function(msg){const e=$('toast');e.textContent=msg;e.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>e.style.opacity=0,2200)};
function map(P){const s=.55,y=S.cam.yaw,co=Math.cos(y),si=Math.sin(y);
  g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,160,160);g.beginPath();g.arc(80,80,78,0,6.283);g.clip();g.fillStyle='#14161d';g.fillRect(0,0,160,160);
  g.setTransform(-co*s,-si*s,si*s,-co*s,80,80);g.translate(-P.pos.x,-P.pos.z);
  for(const b of W.blocks){g.fillStyle=b.park?'#2c5a3c':'#2b2e3a';g.fillRect(b.cx-21,b.cz-21,42,42)}
  g.fillStyle='#585d72';for(const b of W.big)g.fillRect(b.x0,b.z0,b.x1-b.x0,b.z1-b.z0);
  g.fillStyle='#ffb347';for(const c of S.vehicles.cars)g.fillRect(c.pos.x-2,c.pos.z-2,4,4);
  g.setTransform(1,0,0,1,0,0);g.translate(80,80);g.rotate(y-(P.car?P.car.h:P.face));
  g.fillStyle='#35e0ff';g.beginPath();g.moveTo(0,-9);g.lineTo(6,7);g.lineTo(-6,7);g.closePath();g.fill();g.restore()}
})(window.SUNSET=window.SUNSET||{});
