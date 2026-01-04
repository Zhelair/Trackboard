
(function(){
  TrackboardRouter.register('home', async (mount)=>{
    const d = new Date();
    document.getElementById('brand-subtitle').textContent = `Today · ${UI.fmtDate(d)} · Private · Stored on this device`;

    const card = UI.h('div', {class:'card'}, [
      UI.h('div', {class:'h1'}, ['Today']),
      UI.h('p', {class:'p'}, ['Pick one small action. 10 seconds counts.']),
      UI.h('div', {class:'hr'}, []),
      UI.h('div', {class:'grid'}, [
        UI.h('button', {class:'btn primary full', 'data-route':'checkin'}, ['Check-in']),
        UI.h('button', {class:'btn full', 'data-route':'stress'}, ['Release stress']),
        UI.h('button', {class:'btn full', 'data-route':'alcohol'}, ['Alcohol']),
        UI.h('button', {class:'btn full', 'data-route':'goals'}, ['Goals']),
        UI.h('button', {class:'btn full', 'data-route':'calm'}, ['Calm']),
        UI.h('button', {class:'btn full', 'data-route':'insights'}, ['Insights'])
      ]),
      UI.h('p', {class:'small', style:'margin-top:10px'}, ['Nothing here leaves your device.'])
    ]);
    mount.appendChild(card);
  });
})();
