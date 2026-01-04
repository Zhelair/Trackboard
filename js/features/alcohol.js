
(function(){
  const DRINK_TRIGGERS = ['stress','social','boredom','anger','tired'];
  const POS_MSG = [
    'Nice. Nothing lost today.',
    'Quiet win logged.',
    'That helps more than it looks.',
    'Your sleep will thank you.',
    'Good choice today.'
  ];

  TrackboardRouter.register('alcohol', async (mount)=>{
    const key = Store.todayKey();
    const entry = await Store.getEntry(key) || {date:key};

    const tab = entry.alcTab || 'today';

    const card = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['Alcohol']),
      UI.h('p',{class:'p'},['Just note what happened. No judgement.']),
      UI.h('div',{class:'row', style:'margin-top:10px'},[
        UI.h('button',{class:'btn'+(tab==='today'?' primary':''), type:'button', 'data-tab':'today'},['Today']),
        UI.h('button',{class:'btn'+(tab==='craving'?' primary':''), type:'button', 'data-tab':'craving'},['Craving']),
        UI.h('button',{class:'btn'+(tab==='progress'?' primary':''), type:'button', 'data-tab':'progress'},['Progress']),
      ])
    ]);

    async function save(){
      entry.updatedAt = Date.now();
      entry.createdAt = entry.createdAt || Date.now();
      await Store.putEntry(entry);
    }

    function sectionToday(){
      const box = UI.h('div',{},[]);
      const b1 = UI.h('button',{class:'btn primary full', type:'button', style:'margin-top:10px', 'data-alc':'free'},['Alcohol-free today']);
      const b2 = UI.h('button',{class:'btn full', type:'button', style:'margin-top:10px', 'data-alc':'drank'},['Drank today']);
      box.appendChild(b1); box.appendChild(b2);

      if(entry.alcohol === 'drank'){
        const chips = UI.h('div',{class:'chips', style:'margin-top:10px'},[]);
        const sel = new Set(entry.alcTriggers || []);
        function render(){
          chips.innerHTML='';
          DRINK_TRIGGERS.forEach(t=>{
            chips.appendChild(UI.h('button',{type:'button', class:'chip'+(sel.has(t)?' sel':''), 'data-trig':t},[t]));
          });
        }
        render();
        const note = UI.h('input',{type:'text', placeholder:'One line is enough.', value: entry.alcNote || ''},[]);
        const saveBtn = UI.h('button',{class:'btn primary full', type:'button', style:'margin-top:10px'},['Save']);
        box.appendChild(UI.h('div',{class:'field'},[
          UI.h('label',{},['What played a role? (optional)']),
          chips,
          UI.h('label',{},['Note (optional)']),
          note
        ]));
        box.appendChild(saveBtn);

        box.addEventListener('click', (e)=>{
          const t = e.target.closest('[data-trig]')?.dataset.trig;
          if(!t) return;
          if(sel.has(t)) sel.delete(t); else sel.add(t);
          entry.alcTriggers = Array.from(sel).slice(0,5);
          render();
        });
        saveBtn.addEventListener('click', async ()=>{
          entry.alcNote = note.value.slice(0,120);
          await save();
          UI.toast('Saved.');
        });
      }

      return box;
    }

    function sectionCraving(){
      const box = UI.h('div',{},[]);
      box.appendChild(UI.h('p',{class:'p', style:'margin-top:10px'},['Cravings pass. Let’s wait it out.']));

      const timerBtn = UI.h('button',{class:'btn primary full', type:'button', style:'margin-top:10px'},['Start 10-minute timer']);
      const doneBtn = UI.h('button',{class:'btn full', type:'button', style:'margin-top:10px'},['I’m okay now']);
      const timerBox = UI.h('div',{class:'card', style:'margin-top:10px; background:rgba(31,31,36,.6)'},[]);
      let interval = null;

      function setTimerUI(ms){
        const s = Math.max(0, Math.floor(ms/1000));
        const m = String(Math.floor(s/60)).padStart(2,'0');
        const r = String(s%60).padStart(2,'0');
        timerBox.innerHTML='';
        timerBox.appendChild(UI.h('div',{class:'h1'},[`${m}:${r}`]));
        timerBox.appendChild(UI.h('p',{class:'p'},['This is just a wave.']));
      }

      timerBtn.addEventListener('click', async ()=>{
        const end = Date.now() + 10*60*1000;
        entry.cravingEndsAt = end;
        entry.cravingStartedAt = Date.now();
        entry.cravingCount = (entry.cravingCount || 0) + 1;
        await save();
        UI.toast('Timer started.');
        if(interval) clearInterval(interval);
        interval = setInterval(()=>{
          const left = end - Date.now();
          setTimerUI(left);
          if(left <= 0){
            clearInterval(interval);
            interval = null;
            timerBox.innerHTML='';
            timerBox.appendChild(UI.h('div',{class:'h1'},['Done']));
            timerBox.appendChild(UI.h('p',{class:'p'},['How is it now?']));
            const row = UI.h('div',{class:'row', style:'margin-top:10px'},[
              UI.h('button',{class:'btn', type:'button', 'data-feel':'better'},['Better']),
              UI.h('button',{class:'btn', type:'button', 'data-feel':'same'},['Same']),
              UI.h('button',{class:'btn', type:'button', 'data-feel':'worse'},['Worse'])
            ]);
            timerBox.appendChild(row);
          }
        }, 250);
      });

      timerBox.addEventListener('click', async (e)=>{
        const feel = e.target.closest('[data-feel]')?.dataset.feel;
        if(!feel) return;
        entry.cravingResult = feel;
        await save();
        UI.toast('Logged.');
      });

      doneBtn.addEventListener('click', async ()=>{
        entry.cravingResult = 'ok';
        await save();
        UI.toast('Logged.');
      });

      box.appendChild(timerBtn);
      box.appendChild(doneBtn);
      box.appendChild(timerBox);
      return box;
    }

    async function sectionProgress(){
      const box = UI.h('div',{},[]);
      const avgSpend = (await Store.getSetting('avgSpendPerDrinkDay')) ?? 10;
      const avgSleepLoss = (await Store.getSetting('avgSleepLossHours')) ?? 1.5;

      const entries = await Store.getAllEntries();
      const since = new Date();
      since.setDate(since.getDate()-6);

      let alcoholFree = 0;
      let drank = 0;
      for(const e of entries){
        const d = new Date(e.date+'T00:00:00');
        if(d >= since){
          if(e.alcohol === 'free') alcoholFree++;
          if(e.alcohol === 'drank') drank++;
        }
      }
      const savedMoney = alcoholFree * Number(avgSpend);
      const savedSleep = alcoholFree * Number(avgSleepLoss);

      box.appendChild(UI.h('div',{class:'hr'},[]));
      const wrap = UI.h('div',{class:'card', style:'margin-top:10px; background:rgba(31,31,36,.6)'},[
        UI.h('div',{class:'h1'},['This week']),
        UI.h('div',{class:'kv'},[UI.h('div',{},['Alcohol-free days']), UI.h('div',{},[String(alcoholFree)])]),
        UI.h('div',{class:'kv'},[UI.h('div',{},['Drank days']), UI.h('div',{},[String(drank)])]),
        UI.h('div',{class:'kv'},[UI.h('div',{},['Money saved (est.)']), UI.h('div',{},[`€${savedMoney.toFixed(0)}`])]),
        UI.h('div',{class:'kv'},[UI.h('div',{},['Sleep saved (est.)']), UI.h('div',{},[`+${savedSleep.toFixed(1)}h`])]),
        UI.h('p',{class:'small', style:'margin-top:8px'},['Edit the estimates in Settings.'])
      ]);
      box.appendChild(wrap);
      return box;
    }

    // Render section
    const body = UI.h('div',{},[]);
    if(tab==='today') body.appendChild(sectionToday());
    if(tab==='craving') body.appendChild(sectionCraving());
    if(tab==='progress') body.appendChild(await sectionProgress());

    card.appendChild(body);

    card.addEventListener('click', async (e)=>{
      const t = e.target.closest('[data-tab]')?.dataset.tab;
      if(t){
        entry.alcTab = t;
        await save();
        TrackboardRouter.go('alcohol');
      }
      const choice = e.target.closest('[data-alc]')?.dataset.alc;
      if(choice){
        if(choice==='free'){
          entry.alcohol = 'free';
          entry.alcTriggers = [];
          entry.alcNote = '';
          await save();
          UI.toast(POS_MSG[Math.floor(Math.random()*POS_MSG.length)]);
          TrackboardRouter.go('alcohol');
        }
        if(choice==='drank'){
          entry.alcohol = 'drank';
          await save();
          TrackboardRouter.go('alcohol');
        }
      }
    });

    mount.appendChild(card);
  });
})();
