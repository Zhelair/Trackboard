
(function(){
  function startOfWeek(d=new Date()){
    const x = new Date(d);
    const day = x.getDay() || 7;
    x.setDate(x.getDate() - (day-1));
    x.setHours(0,0,0,0);
    return x;
  }

  TrackboardRouter.register('insights', async (mount)=>{
    const entries = await Store.getAllEntries();
    const card = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['Insights']),
      UI.h('p',{class:'p'},['Patterns, not judgement.']),
    ]);

    const wk = startOfWeek(new Date());
    const weekEntries = entries.filter(e=>{
      const d = new Date(e.date+'T00:00:00');
      return d >= wk;
    });

    const moods = weekEntries.map(e=>Number(e.mood||0)).filter(n=>n>0);
    const avgMood = moods.length ? (moods.reduce((a,b)=>a+b,0)/moods.length) : null;

    const tagCounts = {};
    let alcoholFree = 0;
    let poorSleep = 0;

    for(const e of weekEntries){
      (e.tags||[]).forEach(t=> tagCounts[t]=(tagCounts[t]||0)+1);
      if(e.alcohol === 'free') alcoholFree++;
      if(e.sleepPoor) poorSleep++;
    }
    const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);

    const wrap = UI.h('div',{class:'card', style:'margin-top:12px; background:rgba(31,31,36,.6)'},[
      UI.h('div',{class:'h1'},['This week']),
      UI.h('div',{class:'kv'},[UI.h('div',{},['Average mood']), UI.h('div',{},[avgMood?avgMood.toFixed(1):'—'])]),
      UI.h('div',{class:'kv'},[UI.h('div',{},['Most common tags']), UI.h('div',{},[topTags.length?topTags.join(', '):'—'])]),
      UI.h('div',{class:'kv'},[UI.h('div',{},['Alcohol-free days']), UI.h('div',{},[String(alcoholFree)])]),
      UI.h('div',{class:'kv'},[UI.h('div',{},['Poor sleep days']), UI.h('div',{},[String(poorSleep)])]),
    ]);

    card.appendChild(wrap);
    card.appendChild(UI.h('p',{class:'small', style:'margin-top:10px'},['(Calendar view will come next slice.)']));

    mount.appendChild(card);
  });
})();
