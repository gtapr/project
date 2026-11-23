// Generic interaction system. Register {pos:()=>Vector3|{x,z}, r, prompt:()=>string, use:()=>void, active?:()=>bool}.
// The nearest active interactable in range shows its prompt; E calls use(). Shops, doors, NPCs can plug in later.
(function(S){
  S.interact={list:[],current:null,
    add(o){this.list.push(o)},
    update(){const p=S.player.pos;let best=null,bd=1e9;
      for(const o of this.list){if(o.active&&!o.active())continue;const q=o.pos(),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<o.r&&d<bd){best=o;bd=d}}
      this.current=best;S.hud.setPrompt(best?best.prompt():'');if(best&&S.input.pressed('KeyE'))best.use()}};
})(window.SUNSET=window.SUNSET||{});
