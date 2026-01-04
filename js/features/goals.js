(function(){
  function isoWeekKey(d=new Date()){
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
  }

  TrackboardRouter.register('goals', async (mount)=>{
    document.getElementById('brand-subtitle').textContent = 'Goals · Private · Stored on this device';

    const wk = isoWeekKey(new Date());
    const existing = await Store.getWeek(wk) || {weekKey:wk};

    const stack = UI.h('div',{class:'stack'},[]);

    stack.appendChild(UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['This week']),
      UI.h('div',{class:'small'},['Goals are direction, not obligation.'])
    ]));

    const intentionCard = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['What would make this week feel good enough?']),
      UI.h('div',{class:'small'},['One or two short sentences.']),
      UI.h('textarea',{id:'wk-intention', placeholder:'Example: Keep evenings calm. Apply to two jobs.'},[])
    ]);

    const checkCard = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Gentle check']),
      UI.h('div',{class:'small'},['How did this week go?']),
      UI.h('div',{class:'row', style:'margin-top:8px'},[
        UI.h('button',{class:'btn small', type:'button', 'data-ref':'better'},['Better than expected']),
        UI.h('button',{class:'btn small', type:'button', 'data-ref':'right'},['About right']),
        UI.h('button',{class:'btn small', type:'button', 'data-ref':'hard'},['Harder than I hoped'])
      ])
    ]);

    const carryCard = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['Carry forward']),
      UI.h('label',{class:'small', style:'display:flex;gap:10px;align-items:center;'},[
        UI.h('input',{type:'checkbox', id:'wk-carry'}),
        UI.h('span',{},['Keep this intention for next week.'])
      ])
    ]);

    const summaryCard = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Good enough week']),
      UI.h('div',{class:'small', id:'wk-summary'},['You stayed engaged. That counts.'])
    ]);

    const actions = UI.h('div',{class:'card soft'},[
      UI.h('button',{class:'btn primary full', type:'button', id:'wk-save'},['Save'])
    ]);

    stack.appendChild(intentionCard);
    stack.appendChild(checkCard);
    stack.appendChild(carryCard);
    stack.appendChild(summaryCard);
    stack.appendChild(actions);
    mount.appendChild(stack);

    // Fill
    document.getElementById('wk-intention').value = existing.intention || '';
    document.getElementById('wk-carry').checked = !!existing.carryForward;

    function setReflection(val){
      existing.reflection = val;
      checkCard.querySelectorAll('[data-ref]').forEach(b=>{
        b.classList.toggle('primary', b.dataset.ref === val);
      });
      const s = document.getElementById('wk-summary');
      if(val === 'better') s.textContent = 'Nice. Keep it simple and repeat what worked.';
      else if(val === 'right') s.textContent = 'That’s a solid week. Good enough is good.';
      else if(val === 'hard') s.textContent = 'Hard weeks count too. Keep the bar kind.';
      else s.textContent = 'You stayed engaged. That counts.';
    }
    if(existing.reflection) setReflection(existing.reflection);

    checkCard.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-ref]');
      if(!btn) return;
      setReflection(btn.dataset.ref);
    });

    document.getElementById('wk-save').addEventListener('click', async ()=>{
      existing.intention = document.getElementById('wk-intention').value.trim();
      existing.carryForward = document.getElementById('wk-carry').checked;
      await Store.putWeek(existing);
      UI.toast('Saved.');
    });
  });
})();
