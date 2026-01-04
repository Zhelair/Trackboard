
(function(){
  const TAGS = ['work','PIP','money','job hunt','sleep','health','family','exercise'];

  function moodButtons(selected){
    const row = UI.h('div', {class:'row', style:'margin-top:8px'}, []);
    for(let i=1;i<=5;i++){
      row.appendChild(UI.h('button',{class:'btn'+(selected===i?' primary':''), type:'button', 'data-mood':String(i)},[String(i)]));
    }
    return row;
  }

  TrackboardRouter.register('checkin', async (mount)=>{
    const key = Store.todayKey();
    const existing = await Store.getEntry(key) || {date:key};

    const card = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['Check-in']),
      UI.h('p',{class:'p'},['Whatever it is, it’s okay to log it.']),
    ]);

    // Mood
    card.appendChild(UI.h('div',{class:'field'},[
      UI.h('label',{},['Mood (1–5)']),
      moodButtons(existing.mood || 3),
      UI.h('div',{class:'small'},['A number is enough.'])
    ]));

    // Tags
    const chips = UI.h('div',{class:'chips'},[]);
    const selected = new Set(existing.tags || []);
    function renderChips(){
      chips.innerHTML='';
      TAGS.forEach(t=>{
        const sel = selected.has(t);
        chips.appendChild(UI.h('button',{type:'button', class:'chip'+(sel?' sel':''), 'data-tag':t},[t]));
      });
      chips.appendChild(UI.h('button',{type:'button', class:'chip', 'data-tag':'__custom'},['+ custom']));
    }
    renderChips();

    card.appendChild(UI.h('div',{class:'field'},[
      UI.h('label',{},['What influenced today? (up to 3)']),
      chips
    ]));

    // Notes
    const note = UI.h('textarea',{placeholder:'Just a line or two, if you want.'},[existing.note||'']);
    card.appendChild(UI.h('div',{class:'field'},[
      UI.h('label',{},['Notes (optional)']),
      note
    ]));

    // Something good
    const good = UI.h('input',{type:'text', placeholder:'Even something small counts.', value: existing.good || ''},[]);
    card.appendChild(UI.h('div',{class:'field'},[
      UI.h('label',{},['Something good today (optional)']),
      good
    ]));

    // Sleep
    const bed = UI.h('input',{type:'time', value: existing.sleepBed || ''},[]);
    const wake = UI.h('input',{type:'time', value: existing.sleepWake || ''},[]);
    const poor = UI.h('input',{type:'checkbox'},[]);
    poor.checked = !!existing.sleepPoor;

    card.appendChild(UI.h('div',{class:'field'},[
      UI.h('label',{},['Sleep (optional)']),
      UI.h('div',{class:'row'},[
        UI.h('div',{style:'flex:1'},[UI.h('label',{},['Went to bed']), bed]),
        UI.h('div',{style:'flex:1'},[UI.h('label',{},['Woke up']), wake]),
      ]),
      UI.h('label', {style:'display:flex; align-items:center; gap:8px; margin-top:6px'}, [
        poor, UI.h('span',{},['Poor sleep'])
      ])
    ]));

    const saveBtn = UI.h('button',{class:'btn primary full', type:'button', style:'margin-top:12px'},['Save']);
    card.appendChild(saveBtn);

    // Events
    card.addEventListener('click', async (e)=>{
      const mb = e.target.closest('[data-mood]');
      if(mb){
        existing.mood = Number(mb.dataset.mood);
        TrackboardRouter.go('checkin'); // rerender quick & simple
      }
      const tg = e.target.closest('[data-tag]');
      if(tg){
        const t = tg.dataset.tag;
        if(t === '__custom'){
          const val = prompt('Add a tag (short):');
          if(val){
            const v = val.trim().slice(0,20);
            if(v){
              if(selected.size >= 3 && !selected.has(v)) UI.toast('Max 3 tags');
              else {
                if(selected.has(v)) selected.delete(v); else selected.add(v);
                existing.tags = Array.from(selected);
              }
            }
          }
        } else {
          if(selected.has(t)) selected.delete(t);
          else {
            if(selected.size >= 3) { UI.toast('Max 3 tags'); return; }
            selected.add(t);
          }
          existing.tags = Array.from(selected);
        }
        renderChips();
      }
    });

    saveBtn.addEventListener('click', async ()=>{
      existing.note = note.value.slice(0,240);
      existing.good = good.value.slice(0,200);
      existing.sleepBed = bed.value || '';
      existing.sleepWake = wake.value || '';
      existing.sleepPoor = !!poor.checked;
      existing.updatedAt = Date.now();
      existing.createdAt = existing.createdAt || Date.now();
      await Store.putEntry(existing);
      UI.toast('Saved.');
    });

    mount.appendChild(card);
  });
})();
