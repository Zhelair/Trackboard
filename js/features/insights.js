(function(){
  function isoWeekKey(d=new Date()){
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }

  function moodQualifier(avg){
    if(avg >= 4.5) return 'calm and supported';
    if(avg >= 3.8) return 'steady and manageable';
    if(avg >= 3.0) return 'mixed, but workable';
    if(avg >= 2.2) return 'demanding and tiring';
    return 'overwhelming at times';
  }

  function toneLabel(idx){
    return ['overwhelming at times','demanding and tiring','mixed, but workable','steady and manageable','calm and supported'][idx] || 'mixed, but workable';
  }

  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

  TrackboardRouter.register('insights', async (mount)=>{
    document.getElementById('brand-subtitle').textContent = 'Insights · Private · Stored on this device';

    const entries = await Store.getAllEntries();
    const week = UI.weekBounds(new Date());
    const inWeek = entries.filter(e=> UI.inRange(e.date, week.start, week.end));

    const moods = inWeek.map(e=> e.mood).filter(x=> typeof x==='number');
    const avgMoodNum = moods.length ? (moods.reduce((a,b)=>a+b,0)/moods.length) : null;

    const poorSleep = inWeek.filter(e=> !!e.poorSleep).length;

    // Alcohol aggregation (context, not judgement)
    const alcoholFreeN = inWeek.filter(e=> e.alcohol === 'free').length;
    const alcoholHadN  = inWeek.filter(e=> e.alcohol === 'had').length;
    const alcoholKnown = alcoholFreeN + alcoholHadN;

    let alcoholStatus = null; // 'free' | 'mixed' | 'present'
    if(alcoholKnown){
      if(alcoholHadN === 0) alcoholStatus = 'free';
      else if(alcoholFreeN === 0) alcoholStatus = 'present';
      else alcoholStatus = 'mixed';
    }

    // Influences (tags)
    const tags = {};
    inWeek.forEach(e=>{
      (e.tags||[]).forEach(t=> tags[t]=(tags[t]||0)+1);
    });
    const topTags = Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);

    // Weekly reflection (optional)
    const wkKey = isoWeekKey(new Date());
    const wk = await Store.getWeek(wkKey);

    let refScore = null; // 0..4 mapped
    if(wk && wk.reflection){
      if(wk.reflection === 'hard') refScore = 1;
      else if(wk.reflection === 'right') refScore = 2;
      else if(wk.reflection === 'better') refScore = 3;
    }

    // Tone index 0..4 (very heavy -> very light)
    let toneIdx = 2; // neutral default
    if(avgMoodNum !== null){
      toneIdx = clamp(Math.round(avgMoodNum - 1), 0, 4);
      if(refScore !== null){
        const blended = 0.75*toneIdx + 0.25*refScore;
        toneIdx = clamp(Math.round(blended), 0, 4);
      }
      if(poorSleep >= 3) toneIdx = clamp(toneIdx - 1, 0, 4);
    } else if(refScore !== null){
      toneIdx = clamp(refScore, 0, 4);
    }

    const stack = UI.h('div',{class:'stack'},[]);

    // If no data, show gentle empty state
    if(inWeek.length === 0 && !wk){
      stack.appendChild(UI.h('div',{class:'card'},[
        UI.h('div',{class:'h2'},['This week']),
        UI.h('div',{class:'small'},['Not enough entries yet.']),
        UI.h('div',{class:'small', style:'margin-top:6px;'},['Patterns usually appear after a few days.'])
      ]));
      mount.appendChild(stack);
      return;
    }

    // Card 1 — Weekly tone
    const toneCard = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['This week']),
      UI.h('div',{class:'tonebar', 'data-tone': String(toneIdx)},[
        UI.h('div',{class:'tonetrack'},[]),
        UI.h('div',{class:'tonedot', style:`left:${(toneIdx/4)*100}%`},[])
      ]),
      UI.h('div',{class:'small', style:'margin-top:10px;'},[`Overall, this week felt ${toneLabel(toneIdx)}.`])
    ]);

    // Card 2 — What showed up
    const showed = [];
    if(poorSleep) showed.push('Sleep');
    topTags.forEach(t=> showed.push(t));
    if(alcoholStatus === 'free') showed.push('Alcohol-free days');
    else if(alcoholStatus === 'mixed') showed.push('Alcohol (mixed)');
    else if(alcoholStatus === 'present') showed.push('Alcohol use');

    const uniq = Array.from(new Set(showed)).slice(0,3);

    const showedCard = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['What showed up']),
      UI.h('div',{class:'small'},[ uniq.length ? '' : 'Not enough detail yet.' ]),
      UI.h('ul',{class:'bullets'}, uniq.map(x=> UI.h('li',{},[x])) )
    ]);

    // Card 3 — Gentle reflections
    const reflections = [];

    if(avgMoodNum !== null && poorSleep){
      reflections.push('Sleep appears to influence your mood more than other factors.');
    } else if(poorSleep){
      reflections.push('Sleep showed up this week. It may shape how the week feels.');
    }

    if(alcoholKnown){
      if(alcoholStatus === 'free') reflections.push('Alcohol-free days often align with steadier moods.');
      else if(alcoholStatus === 'present') reflections.push('Alcohol was present this week. There may or may not be a clear pattern with mood.');
      else reflections.push('Alcohol was mixed this week. It can help to notice what else was present on those days.');
    }

    if(topTags.length){
      reflections.push(`“${topTags[0]}” appeared frequently this week.`);
    }

    // Keep 1–3, avoid repetition
    const refl = reflections.filter(Boolean).slice(0,3);
    const reflCard = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['You might notice']),
      UI.h('div',{class:'small'},[
        refl.length ? '' : 'Not enough data to notice patterns yet. They usually appear after a few days.'
      ]),
      UI.h('div',{class:'small', style:'margin-top:6px;line-height:1.5;'},[
        refl.length ? refl.map((t,i)=> UI.h('div',{style:i? 'margin-top:6px':''},[t])) : ''
      ])
    ]);

    // Card 4 — Details (collapsed)
    const detailsLines = [];
    if(avgMoodNum !== null) detailsLines.push(`Average mood: ${avgMoodNum.toFixed(1)} — ${moodQualifier(avgMoodNum)}`);
    else detailsLines.push('Average mood: —');
    if(alcoholKnown){
      detailsLines.push(`Alcohol: ${alcoholStatus === 'free' ? 'Alcohol-free days were common' : (alcoholStatus === 'mixed' ? 'Mixed' : 'Present')}`);
    } else {
      detailsLines.push('Alcohol: —');
    }
    detailsLines.push(`Poor sleep: ${poorSleep ? 'Present' : 'Not present'}`);

    const details = UI.h('details',{class:'details'},[
      UI.h('summary',{class:'small'},['Details (optional)']),
      UI.h('div',{class:'small', style:'margin-top:10px;line-height:1.6;'}, detailsLines.map(l=> UI.h('div',{},[l])))
    ]);

    const detailsCard = UI.h('div',{class:'card'},[details]);

    stack.appendChild(toneCard);
    stack.appendChild(showedCard);
    stack.appendChild(reflCard);
    stack.appendChild(detailsCard);

    mount.appendChild(stack);
  });
})();
