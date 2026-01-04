(function(){
  TrackboardRouter.register('insights', async (mount)=>{
    document.getElementById('brand-subtitle').textContent = 'Insights · Private · Stored on this device';

    const entries = await Store.getAllEntries();
    const week = UI.weekBounds(new Date());
    const inWeek = entries.filter(e=> UI.inRange(e.date, week.start, week.end));

    const moods = inWeek.map(e=> e.mood).filter(x=> typeof x==='number');
    const avgMood = moods.length ? (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1) : '—';

    const tags = {};
    inWeek.forEach(e=>{
      (e.tags||[]).forEach(t=> tags[t]=(tags[t]||0)+1);
    });
    const topTags = Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);

    const alcoholFree = inWeek.filter(e=> e.alcohol==='free').length;
    const poorSleep = inWeek.filter(e=> e.poorSleep).length;

    const stack = UI.h('div',{class:'stack'},[]);

    const card = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['This week']),
      UI.h('div',{class:'small'},[`Average mood: ${avgMood}`]),
      UI.h('div',{class:'small'},[`Alcohol-free days: ${alcoholFree}`]),
      UI.h('div',{class:'small'},[`Poor sleep days: ${poorSleep}`]),
      UI.h('div',{class:'hr'},[]),
      UI.h('div',{class:'h2'},['Patterns']),
      UI.h('div',{class:'small'},[ topTags.length ? `Most common influences: ${topTags.join(', ')}` : 'Add a few check-ins to see patterns.' ])
    ]);

    stack.appendChild(card);
    mount.appendChild(stack);
  });
})();
