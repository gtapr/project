// Keyboard/mouse state. down(code)=held, pressed(code)=went down this frame. game.js calls endFrame() each frame.
(function(S){
  const I=S.input={keys:{},hit:{},dx:0,dy:0,wheel:0};
  addEventListener('keydown',e=>{if(!e.repeat)I.hit[e.code]=true;I.keys[e.code]=true;if(e.code==='Space')e.preventDefault();});
  addEventListener('keyup',e=>{I.keys[e.code]=false});
  addEventListener('blur',()=>{I.keys={}});
  addEventListener('mousemove',e=>{if(document.pointerLockElement){I.dx+=e.movementX;I.dy+=e.movementY}});
  addEventListener('wheel',e=>{I.wheel+=e.deltaY},{passive:true});
  I.down=c=>!!I.keys[c];I.pressed=c=>!!I.hit[c];
  I.endFrame=()=>{I.hit={};I.dx=I.dy=I.wheel=0};
})(window.SUNSET=window.SUNSET||{});
