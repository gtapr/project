// Persistent user settings (localStorage). Other modules read S.settings.* directly.
(function(S){
  const KEY='sunset.v1.settings', defaults={sens:1,volume:.6,quality:'high'};
  let stored={};try{stored=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}
  S.settings=Object.assign({},defaults,stored);
  S.saveSettings=()=>{try{localStorage.setItem(KEY,JSON.stringify(S.settings))}catch(e){}};
})(window.SUNSET=window.SUNSET||{});
