(function(){
  TrackboardRouter.register('home', async (mount)=>{
    const d = new Date();
    document.getElementById('brand-subtitle').textContent =
      `Today · ${UI.fmtDate(d)} · Private · Stored on this device`;

    const stack = UI.h('div',{class:'stack'},[]);

    const primary = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['Today']),
      UI.h('p',{class:'p'},['Pick one small action. Ten seconds counts.']),
      UI.h('div',{class:'hr'},[]),
      UI.h('div',{class:'col'},[
        UI.h('button',{class:'btn primary full', type:'button', 'data-route':'checkin'},['Check in']),
        UI.h('button',{class:'btn full', type:'button', 'data-route':'calm'},['Calm']),
        UI.h('button',{class:'btn full', type:'button', 'data-route':'alcohol'},['Alcohol'])
      ]),
      UI.h('p',{class:'small', style:'margin-top:10px'},['Nothing here leaves your device.'])
    ]);

    // Week at a glance
    const entries = await Store.getAllEntries();
    const week = UI.weekBounds(new Date());
    const inWeek = entries.filter(e=> UI.inRange(e.date, week.start, week.end));
    const moods = inWeek.map(e=> e.mood).filter(x=> typeof x==='number');
    const avgMood = moods.length ? (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1) : '—';
    const alcoholFree = inWeek.filter(e=> e.alcohol === 'free').length;
    const poorSleep = inWeek.filter(e=> e.poorSleep).length;

    const glance = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['This week at a glance']),
      UI.h('div',{class:'row', style:'margin-top:6px'},[
        UI.h('div',{class:'small'},[`Average mood: ${avgMood}`]),
      ]),
      UI.h('div',{class:'row'},[
        UI.h('div',{class:'small'},[`Alcohol-free days: ${alcoholFree}`]),
      ]),
      UI.h('div',{class:'row'},[
        UI.h('div',{class:'small'},[`Poor sleep days: ${poorSleep}`]),
      ]),
    ]);

    const notebook = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Notebook']),
      UI.h('div',{class:'col'},[
        UI.h('button',{class:'btn full', type:'button', 'data-route':'goals'},['Goals']),
        UI.h('button',{class:'btn full', type:'button', 'data-route':'insights'},['Insights'])
      ])
    ]);

    stack.appendChild(primary);
    stack.appendChild(glance);
    stack.appendChild(notebook);
    mount.appendChild(stack);
  });
})();
