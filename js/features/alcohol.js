(function(){
  TrackboardRouter.register('alcohol', async (mount)=>{
    document.getElementById('brand-subtitle').textContent = 'Alcohol · Private · Stored on this device';

    const key = Store.todayKey();
    const existing = await Store.getEntry(key) || {date:key};

    const stack = UI.h('div',{class:'stack'},[]);

    stack.appendChild(UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Just note what happened today.']),
      UI.h('div',{class:'small'},['No judgement. No consequences.'])
    ]));

    // Today card
    const todayCard = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['Alcohol today?']),
      UI.h('div',{class:'row', style:'margin-top:8px'},[
        UI.h('button',{type:'button', class:'btn full'+(existing.alcohol==='free'?' primary':''), id:'btn-free'},['Alcohol-free']),
        UI.h('button',{type:'button', class:'btn full'+(existing.alcohol==='had'?' primary':''), id:'btn-had'},['Had alcohol'])
      ]),
      UI.h('div',{id:'had-more'})
    ]);

    // Context when had
    const ctxWrap = UI.h('div',{class:'col', style:'margin-top:10px;display:none;'},[]);
    const whyCard = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['What played a role?']),
      UI.h('div',{class:'small'},['Optional.']),
    ]);
    const reasons = ['stress','social','boredom','fatigue','habit'];
    const selected = new Set(existing.alcoholWhy || []);
    const chips = UI.h('div',{class:'pillrow'},[]);
    function renderWhy(){
      chips.innerHTML='';
      reasons.forEach(r=>{
        chips.appendChild(UI.h('button',{type:'button', class:'pill'+(selected.has(r)?' active':''), 'data-why':r},[r]));
      });
      chips.appendChild(UI.h('button',{type:'button', class:'pill', id:'btn-addwhy'},['+ other']));
    }
    renderWhy();
    whyCard.appendChild(chips);

    const noteCard = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Anything you want to note?']),
      UI.h('div',{class:'small'},['Optional. One line is enough.']),
      UI.h('input',{type:'text', id:'alcohol-note', placeholder:'Short note (optional).'})
    ]);
    ctxWrap.appendChild(whyCard);
    ctxWrap.appendChild(noteCard);

    // Craving card
    const craveCard = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['If a craving shows up']),
      UI.h('div',{class:'small'},['Cravings pass on their own. Waiting is enough.']),
      UI.h('button',{type:'button', class:'btn', id:'btn-wait'},['Wait 10 minutes']),
      UI.h('div',{id:'wait-area', class:'small', style:'margin-top:8px;display:none;'},[])
    ]);

    // Quiet progress
    const entries = await Store.getAllEntries();
    const week = UI.weekBounds(new Date());
    const inWeek = entries.filter(e=> UI.inRange(e.date, week.start, week.end));
    const alcoholFree = inWeek.filter(e=> e.alcohol === 'free').length;
    const sleepBetter = inWeek.filter(e=> e.alcohol === 'free' && !e.poorSleep).length;

    const progress = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Quiet progress']),
      UI.h('div',{class:'small'},[`Alcohol-free days this week: ${alcoholFree}`]),
      UI.h('div',{class:'small'},[`Better-sleep nights (approx.): ${sleepBetter}`]),
      UI.h('div',{class:'small'},['Money saved will appear once you set a baseline in Settings (optional).'])
    ]);

    stack.appendChild(todayCard);
    stack.appendChild(ctxWrap);
    stack.appendChild(craveCard);
    stack.appendChild(progress);
    mount.appendChild(stack);

    // Fill
    document.getElementById('alcohol-note').value = existing.alcoholNote || '';

    function showHad(show){
      ctxWrap.style.display = show ? 'flex' : 'none';
    }
    showHad(existing.alcohol === 'had');

    // Buttons
    document.getElementById('btn-free').addEventListener('click', async ()=>{
      existing.alcohol = 'free';
      showHad(false);
      document.getElementById('btn-free').classList.add('primary');
      document.getElementById('btn-had').classList.remove('primary');
      await Store.putEntry(existing);
      UI.toast('Noted.');
    });
    document.getElementById('btn-had').addEventListener('click', async ()=>{
      existing.alcohol = 'had';
      showHad(true);
      document.getElementById('btn-had').classList.add('primary');
      document.getElementById('btn-free').classList.remove('primary');
      await Store.putEntry(existing);
      UI.toast('Noted.');
    });

    whyCard.addEventListener('click', async (e)=>{
      const btn = e.target.closest('[data-why]');
      if(btn){
        const t = btn.dataset.why;
        if(selected.has(t)) selected.delete(t);
        else selected.add(t);
        existing.alcoholWhy = Array.from(selected);
        renderWhy();
        await Store.putEntry(existing);
      }
      if(e.target && e.target.id === 'btn-addwhy'){
        const v = prompt('Add a short word or phrase:');
        if(v){
          const t = v.trim().slice(0,24);
          if(t){
            selected.add(t);
            existing.alcoholWhy = Array.from(selected);
            renderWhy();
            await Store.putEntry(existing);
          }
        }
      }
    });

    document.getElementById('alcohol-note').addEventListener('change', async ()=>{
      existing.alcoholNote = document.getElementById('alcohol-note').value.trim();
      await Store.putEntry(existing);
      UI.toast('Saved.');
    });

    document.getElementById('btn-wait').addEventListener('click', ()=>{
      const area = document.getElementById('wait-area');
      area.style.display = 'block';
      const start = Date.now();
      const dur = 10*60*1000;
      area.textContent = 'Waiting…';
      const t = setInterval(()=>{
        const left = dur - (Date.now()-start);
        if(left <= 0){
          clearInterval(t);
          area.innerHTML = '';
          area.appendChild(UI.h('div',{},['How is it now?']));
          const row = UI.h('div',{class:'row', style:'margin-top:6px'},[
            UI.h('button',{class:'btn small', type:'button'},['Better']),
            UI.h('button',{class:'btn small', type:'button'},['Same']),
            UI.h('button',{class:'btn small', type:'button'},['Worse'])
          ]);
          row.addEventListener('click', ()=>{
            UI.toast('Noted.');
            area.style.display = 'none';
          });
          area.appendChild(row);
        } else {
          const m = Math.ceil(left/60000);
          area.textContent = `Waiting… ${m} min`;
        }
      }, 15000);
    });
  });
})();
