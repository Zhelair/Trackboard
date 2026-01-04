
(function(){
  TrackboardRouter.register('settings', async (mount)=>{
    const card = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['Settings']),
      UI.h('p',{class:'p'},['Private by design. No accounts. No servers.']),
    ]);

    // Reminders guide (local-only workaround)
    const rem = UI.h('div',{class:'card', style:'margin-top:12px; background:rgba(31,31,36,.6)'},[
      UI.h('div',{class:'h1'},['Phone reminders (local-only)']),
      UI.h('p',{class:'p'},['Set these once in your phone’s Alarm/Reminders. Most reliable, maximum privacy.']),
      UI.h('div',{class:'hr'},[]),
      UI.h('div',{class:'kv'},[UI.h('div',{},['Sleep reminder']), UI.h('div',{},['00:30'])]),
      UI.h('div',{class:'kv'},[UI.h('div',{},['Check-ins']), UI.h('div',{},['10:30 · 15:30 · 20:30'])]),
      UI.h('p',{class:'small', style:'margin-top:8px'},['Suggested label: “Quick check-in — how are you?”'])
    ]);

    // Estimates for progress math
    const avgSpend = UI.h('input',{type:'number', min:'0', step:'1', value: (await Store.getSetting('avgSpendPerDrinkDay')) ?? 10},[]);
    const avgSleep = UI.h('input',{type:'number', min:'0', step:'0.5', value: (await Store.getSetting('avgSleepLossHours')) ?? 1.5},[]);

    const est = UI.h('div',{class:'card', style:'margin-top:12px; background:rgba(31,31,36,.6)'},[
      UI.h('div',{class:'h1'},['Alcohol estimates']),
      UI.h('p',{class:'p'},['Used only to calculate “money saved” and “sleep saved”.']),
      UI.h('div',{class:'field'},[
        UI.h('label',{},['Avg spend per drinking day (€)']),
        avgSpend
      ]),
      UI.h('div',{class:'field'},[
        UI.h('label',{},['Avg sleep lost per drinking day (hours)']),
        avgSleep
      ]),
      UI.h('button',{class:'btn primary full', type:'button', style:'margin-top:10px', id:'save-est'},['Save'])
    ]);

    est.querySelector('#save-est').addEventListener('click', async ()=>{
      await Store.setSetting('avgSpendPerDrinkDay', Number(avgSpend.value||0));
      await Store.setSetting('avgSleepLossHours', Number(avgSleep.value||0));
      UI.toast('Saved.');
    });

    // Report (print to PDF)
    const rep = UI.h('div',{class:'card', style:'margin-top:12px; background:rgba(31,31,36,.6)'},[
      UI.h('div',{class:'h1'},['Report (print / PDF)']),
      UI.h('p',{class:'p'},['Opens a read-only report page. Use your browser’s Print → Save as PDF.']),
      UI.h('button',{class:'btn full', type:'button', id:'open-report'},['Open report'])
    ]);
    rep.querySelector('#open-report').addEventListener('click', ()=>{
      window.open('report.html','_blank');
    });

    card.appendChild(rem);
    card.appendChild(est);
    card.appendChild(rep);

    mount.appendChild(card);
  });
})();
