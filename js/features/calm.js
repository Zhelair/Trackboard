
(function(){
  TrackboardRouter.register('calm', async (mount)=>{
    const card = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h1'},['Calm']),
      UI.h('p',{class:'p'},['You don’t need to feel great. Just a little steadier.']),
      UI.h('div',{class:'grid', style:'margin-top:10px'},[
        UI.h('button',{class:'btn primary full', type:'button', 'data-calm':'ground'},['60-sec grounding']),
        UI.h('button',{class:'btn full', type:'button', 'data-calm':'audio'},['Body scan (audio)']),
        UI.h('button',{class:'btn full', type:'button', 'data-calm':'text'},['My calming text'])
      ])
    ]);

    let tab = 'ground';
    const body = UI.h('div',{},[]);
    card.appendChild(body);

    async function render(){
      body.innerHTML='';
      if(tab==='ground'){
        body.appendChild(UI.h('div',{class:'card', style:'margin-top:12px; background:rgba(31,31,36,.6)'},[
          UI.h('div',{class:'h1'},['One minute']),
          UI.h('p',{class:'p'},['Name 5 things you can see.']),
          UI.h('p',{class:'p'},['4 things you can feel.']),
          UI.h('p',{class:'p'},['3 things you can hear.']),
          UI.h('p',{class:'p'},['2 things you can smell.']),
          UI.h('p',{class:'p'},['1 thing you can taste.']),
          UI.h('button',{class:'btn primary full', type:'button', style:'margin-top:10px'},['Done'])
        ]));
      }
      if(tab==='audio'){
        const note = UI.h('p',{class:'small', style:'margin-top:10px'},[
          'Two tracks (3 min + 8 min). ',
          'If audio doesn’t play yet, add the MP3s later (placeholders included).'
        ]);
        const a1 = UI.h('audio',{controls:true, preload:'none', style:'width:100%; margin-top:10px'},[]);
        a1.src = 'assets/body-scan-3min.mp3';
        const a2 = UI.h('audio',{controls:true, preload:'none', style:'width:100%; margin-top:10px'},[]);
        a2.src = 'assets/body-scan-8min.mp3';
        body.appendChild(note);
        body.appendChild(a1);
        body.appendChild(a2);
      }
      if(tab==='text'){
        const t = await Store.getSetting('calmingText') || 'Write something you want to hear on rough days.';
        const ta = UI.h('textarea',{style:'margin-top:10px'},[t]);
        const saveBtn = UI.h('button',{class:'btn primary full', type:'button', style:'margin-top:10px'},['Save']);
        body.appendChild(UI.h('p',{class:'p', style:'margin-top:10px'},['Your words. No performance.']));
        body.appendChild(ta);
        body.appendChild(saveBtn);
        saveBtn.addEventListener('click', async ()=>{
          await Store.setSetting('calmingText', ta.value.slice(0,1500));
          UI.toast('Saved.');
        });
      }
    }

    card.addEventListener('click', (e)=>{
      const t = e.target.closest('[data-calm]')?.dataset.calm;
      if(t){ tab = t; render(); }
    });

    await render();
    mount.appendChild(card);
  });
})();
