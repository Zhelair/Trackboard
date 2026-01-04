
(function(){
  function weekKey(d=new Date()){
    // ISO week key like 2026-W02
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }

  TrackboardRouter.register('goals', async (mount)=>{
    const key = Store.todayKey();
    const entry = await Store.getEntry(key) || {date:key};
    const tab = entry.goalsTab || 'today';

    const card = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['Goals']),
      UI.h('p',{class:'p'},['Keep it realistic. You can always pick it up again.']),
      UI.h('div',{class:'row', style:'margin-top:10px'},[
        UI.h('button',{class:'btn'+(tab==='today'?' primary':''), type:'button', 'data-gtab':'today'},['Today']),
        UI.h('button',{class:'btn'+(tab==='week'?' primary':''), type:'button', 'data-gtab':'week'},['This week']),
      ])
    ]);

    async function save(){
      entry.updatedAt = Date.now();
      entry.createdAt = entry.createdAt || Date.now();
      await Store.putEntry(entry);
    }

    function listUI(items, onChange){
      const wrap = UI.h('div',{},[]);
      const ul = UI.h('div',{},[]);
      function render(){
        ul.innerHTML='';
        (items||[]).forEach((it, idx)=>{
          const cb = UI.h('input',{type:'checkbox'},[]);
          cb.checked = !!it.done;
          cb.addEventListener('change', ()=>{
            it.done = cb.checked;
            onChange();
          });
          const inp = UI.h('input',{type:'text', value: it.text || ''},[]);
          inp.addEventListener('input', ()=>{
            it.text = inp.value.slice(0,80);
            onChange();
          });
          ul.appendChild(UI.h('div',{class:'row', style:'align-items:center; width:100%'},[
            cb, UI.h('div',{style:'flex:1'},[inp])
          ]));
        });
      }
      render();

      const addBtn = UI.h('button',{class:'btn full', type:'button', style:'margin-top:10px'},['+ Add goal']);
      addBtn.addEventListener('click', ()=>{
        items.push({text:'', done:false});
        render();
        onChange();
      });

      wrap.appendChild(ul);
      wrap.appendChild(addBtn);
      return wrap;
    }

    const body = UI.h('div',{},[]);
    card.appendChild(body);

    async function render(){
      body.innerHTML='';
      if(tab==='today'){
        entry.dailyGoals = entry.dailyGoals || [
          {text:'Apply to 1 job', done:false},
          {text:'Move 10 minutes', done:false},
          {text:'Alcohol-free', done:false},
        ];
        body.appendChild(listUI(entry.dailyGoals, ()=>save()));
      } else {
        // store weekly goals inside entry for simplicity (can refactor later)
        entry.weekKey = entry.weekKey || weekKey(new Date());
        entry.weekGoals = entry.weekGoals || [
          {text:'Apply to 5 jobs this week', done:false},
          {text:'3 walks', done:false},
          {text:'5 alcohol-free days', done:false},
        ];
        body.appendChild(UI.h('p',{class:'small', style:'margin-top:10px'},[`Week: ${entry.weekKey}`]));
        body.appendChild(listUI(entry.weekGoals, ()=>save()));
        // "good enough week" preview
        const done = entry.weekGoals.filter(g=>g.done).length;
        body.appendChild(UI.h('div',{class:'card', style:'margin-top:12px; background:rgba(31,31,36,.6)'},[
          UI.h('div',{class:'h1'},['Good enough week']),
          UI.h('p',{class:'p'},[`You completed ${done}/${entry.weekGoals.length}. Not perfect. Still progress.`)
        ]));
      }
    }

    card.addEventListener('click', async (e)=>{
      const t = e.target.closest('[data-gtab]')?.dataset.gtab;
      if(t){
        entry.goalsTab = t;
        await save();
        TrackboardRouter.go('goals');
      }
    });

    await render();
    mount.appendChild(card);
  });
})();
