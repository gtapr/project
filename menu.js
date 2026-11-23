// Menu/pause/modal wiring. All buttons use data-act; actions call into S.game (game.js).
(function(S){
const $=id=>document.getElementById(id),modal=$('modal');
const show=id=>{modal.classList.remove('hidden');document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('hidden',p.id!=='m-'+id))};
const st=S.settings;$('s-sens').value=st.sens;$('s-vol').value=st.volume;$('s-q').value=st.quality;
const upd=()=>{st.sens=+$('s-sens').value;st.volume=+$('s-vol').value;st.quality=$('s-q').value;S.saveSettings();S.game&&S.game.applySettings()};
['s-sens','s-vol','s-q'].forEach(id=>$(id).addEventListener('input',upd));
const acts={
  play:()=>S.game.start(S.save.exists()?'load':'new'),
  new:()=>{if(!S.save.exists()||confirm('Start a new game? Your existing save is kept until the next save.'))S.game.start('new')},
  settings:()=>show('settings'),controls:()=>show('controls'),credits:()=>show('credits'),close:()=>modal.classList.add('hidden'),
  resume:()=>S.game.resume(),save:()=>S.game.saveNow(),load:()=>S.game.loadNow(),menu:()=>S.game.toMenu(),
  reset:()=>{if(confirm('Delete your saved game? This cannot be undone.')){S.save.clear();S.toast('Save deleted')}},
  fullscreen:()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{})}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&acts[b.dataset.act])acts[b.dataset.act]()});
})(window.SUNSET=window.SUNSET||{});
