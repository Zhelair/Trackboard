
(function(){
  // Settings button
  document.getElementById('btn-settings').addEventListener('click', ()=>{
    TrackboardRouter.go('settings');
  });

  // Register service worker for offline
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    });
  }
})();
