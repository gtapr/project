// Save-game storage. Data shape is defined in game.js (saveNow). Versioned key so future formats can migrate.
(function(S){
  const KEY='sunset.v1.save';
  S.save={
    exists(){try{return !!localStorage.getItem(KEY)}catch(e){return false}},
    write(d){try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch(e){return false}},
    read(){try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}},
    clear(){try{localStorage.removeItem(KEY)}catch(e){}}
  };
})(window.SUNSET=window.SUNSET||{});
