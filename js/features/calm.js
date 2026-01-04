(function(){
  TrackboardRouter.register('calm', async (mount)=>{
    document.getElementById('brand-subtitle').textContent = 'Calm · Private · Stored on this device';

    const stack = UI.h('div',{class:'stack'},[]);

    stack.appendChild(UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Take a moment.']),
      UI.h('div',{class:'small'},['Nothing else needs attention right now.'])
    ]));

    const oneMin = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['One-minute grounding']),
      UI.h('div',{class:'small'},['To settle your body.']),
      UI.h('button',{class:'btn', type:'button', id:'btn-ground'},['Start']),
      UI.h('div',{id:'ground-steps', class:'small', style:'margin-top:10px;display:none;line-height:1.5;'},[])
    ]);

    const scan = UI.h('div',{class:'card'},[
      UI.h('div',{class:'h2'},['Body scan']),
      UI.h('div',{class:'small'},['3 or 8 minutes. You don’t need to focus perfectly.']),
      UI.h('div',{class:'row', style:'margin-top:8px'},[
        UI.h('button',{class:'btn', type:'button', id:'btn-scan-3'},['3 minutes']),
        UI.h('button',{class:'btn', type:'button', id:'btn-scan-8'},['8 minutes'])
      ]),
      UI.h('audio',{id:'scan-audio', controls:true, style:'width:100%;margin-top:10px;display:none;'},[])
    ]);

    const myText = UI.h('div',{class:'card soft'},[
      UI.h('div',{class:'h2'},['Your calming text']),
      UI.h('div',{class:'small'},['Read something that helps.']),
      UI.h('div',{id:'my-text', class:'small', style:'white-space:pre-wrap;margin-top:8px;'},['']),
      UI.h('button',{class:'btn', type:'button', id:'btn-edit'},['Edit'])
    ]);

    stack.appendChild(oneMin);
    stack.appendChild(scan);
    stack.appendChild(myText);
    mount.appendChild(stack);

    // Load calming text from settings
    const existing = (await Store.getSetting('calmText')) || '';
    const textEl = document.getElementById('my-text');
    textEl.textContent = existing || '—';

    document.getElementById('btn-edit').addEventListener('click', async ()=>{
      const v = prompt('Write a few lines that help you feel steadier:', existing || '');
      if(v !== null){
        await Store.setSetting('calmText', v);
        textEl.textContent = v.trim() ? v : '—';
        UI.toast('Saved.');
      }
    });

    document.getElementById('btn-ground').addEventListener('click', ()=>{
      const steps = document.getElementById('ground-steps');
      steps.style.display = 'block';
      steps.innerHTML = '';
      const list = UI.h('div',{},[
        UI.h('div',{},['• Notice what you can see.']),
        UI.h('div',{},['• Notice what you can feel.']),
        UI.h('div',{},['• Notice what you can hear.']),
        UI.h('div',{style:'margin-top:8px;'},['That’s enough.'])
      ]);
      steps.appendChild(list);
      UI.toast('Done.');
    });

    function play(src){
      const a = document.getElementById('scan-audio');
      a.style.display = 'block';
      a.src = src;
      a.play().catch(()=>{});
    }
    document.getElementById('btn-scan-3').addEventListener('click', ()=> play('assets/body-scan-3min.mp3'));
    document.getElementById('btn-scan-8').addEventListener('click', ()=> play('assets/body-scan-8min.mp3'));
  });
})();
