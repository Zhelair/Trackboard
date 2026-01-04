(function(){
  const $ = (sel, root=document) => root.querySelector(sel);

  const TYPE_OPTIONS = [
    { key: "beer", label: "Beer", emoji: "🍺" },
    { key: "wine", label: "Wine", emoji: "🍷" },
    { key: "spirits", label: "Spirits", emoji: "🥃" },
  ];

  function startOfWeekISO(date){
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // Mon=0
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0,10);
  }

  function fmtWeekRange(weekStartISO){
    const d0 = new Date(weekStartISO+"T00:00:00");
    const d1 = new Date(d0); d1.setDate(d1.getDate()+6);
    const opts = { month: "short", day: "numeric" };
    return `${d0.toLocaleDateString(undefined, opts)} – ${d1.toLocaleDateString(undefined, opts)}`;
  }

  function summarizeWeek(entries){
    let freeDays = 0;
    let hadDays = 0;
    let drinksTotal = 0;
    const byType = { beer:0, wine:0, spirits:0 };

    for(const e of entries){
      const a = e.alcohol || null;
      if(!a || a.status === "free"){
        freeDays += 1;
        continue;
      }
      if(a.status === "had"){
        hadDays += 1;
        const drinks = Number(a.drinks || 0) || 0;
        drinksTotal += drinks;
        const t = a.type;
        if(t && byType.hasOwnProperty(t)) byType[t] += drinks;
      }
    }
    return { freeDays, hadDays, drinksTotal, byType };
  }

  function typeButtonsHtml(selectedKey){
    return TYPE_OPTIONS.map(t => {
      const active = selectedKey === t.key ? "active" : "";
      return `<button class="pill ${active}" type="button" data-type="${t.key}" aria-pressed="${selectedKey===t.key}">
        <span class="emoji" aria-hidden="true">${t.emoji}</span> ${t.label}
      </button>`;
    }).join("");
  }

  function drinksStepperHtml(val){
    const v = Math.min(20, Math.max(1, Number(val||1) || 1));
    return `
      <div class="stepper" role="group" aria-label="Drinks">
        <button class="stepper-btn" type="button" data-step="-1" aria-label="Decrease">−</button>
        <div class="stepper-val" aria-live="polite"><span id="alc-drinks">${v}</span> drink(s)</div>
        <button class="stepper-btn" type="button" data-step="1" aria-label="Increase">+</button>
      </div>
      <div class="muted tiny">Rough estimate is fine. One “drink” = one serving.</div>
    `;
  }

  function renderAlcohol(){
    const root = document.createElement("div");
    root.innerHTML = `
      <section class="card">
        <h2>Just note what happened today.</h2>
        <p class="muted">No judgement. No consequences.</p>
      </section>

      <section class="card">
        <h3>Alcohol today?</h3>
        <div class="seg">
          <button class="seg-btn" data-choice="free" type="button">Alcohol-free</button>
          <button class="seg-btn" data-choice="had" type="button">Had alcohol</button>
        </div>

        <div id="alc-details" class="mt"></div>

        <div class="row mt">
          <div class="muted" id="alc-status">No unsaved changes.</div>
          <button class="btn primary" id="alc-save" type="button">Save today</button>
        </div>
      </section>

      <section class="card">
        <h3>If a craving shows up</h3>
        <p class="muted">Cravings pass on their own. Waiting is enough.</p>
        <button class="btn" id="alc-wait" type="button">Wait 10 minutes</button>
      </section>

      <section class="card" id="alc-week">
        <h3>Weekly view</h3>
        <p class="muted">A simple snapshot. It updates from what you log.</p>
        <div id="alc-week-body" class="mt"></div>
      </section>
    `;

    const details = $("#alc-details", root);
    const statusEl = $("#alc-status", root);
    const saveBtn = $("#alc-save", root);

    let dirty = false;
    let currentChoice = "free";
    let currentType = "beer";
    let currentDrinks = 1;
    let currentNote = "";

    function setDirty(v){
      dirty = v;
      statusEl.textContent = dirty ? "Unsaved changes." : "No unsaved changes.";
      saveBtn.disabled = !dirty;
    }

    function setChoice(choice){
      currentChoice = choice;
      root.querySelectorAll(".seg-btn").forEach(b=>{
        b.classList.toggle("active", b.dataset.choice === choice);
        b.setAttribute("aria-pressed", b.dataset.choice === choice ? "true" : "false");
      });

      if(choice === "free"){
        details.innerHTML = `<p class="muted">That’s it. Nothing more needed.</p>`;
      }else{
        details.innerHTML = `
          <div class="grid2">
            <div>
              <div class="label">Type</div>
              <div class="pillrow" id="alc-types">${typeButtonsHtml(currentType)}</div>
            </div>
            <div>
              <div class="label">How many?</div>
              <div id="alc-step">${drinksStepperHtml(currentDrinks)}</div>
            </div>
          </div>

          <div class="mt">
            <div class="label">Optional note</div>
            <input id="alc-note" class="input" type="text" placeholder="Example: with dinner, celebration, stress" value="${(currentNote||"").replace(/"/g,'&quot;')}" />
          </div>
        `;

        // type buttons
        $("#alc-types", details).addEventListener("click", (e)=>{
          const btn = e.target.closest("button[data-type]");
          if(!btn) return;
          currentType = btn.dataset.type;
          btn.parentElement.querySelectorAll("button[data-type]").forEach(b=>b.classList.toggle("active", b.dataset.type===currentType));
          setDirty(true);
        });

        // stepper
        details.querySelectorAll(".stepper-btn").forEach(b=>{
          b.addEventListener("click", ()=>{
            const delta = Number(b.dataset.step || 0);
            currentDrinks = Math.min(20, Math.max(1, currentDrinks + delta));
            const vEl = details.querySelector("#alc-drinks");
            if(vEl) vEl.textContent = String(currentDrinks);
            setDirty(true);
          });
        });

        // note
        const note = $("#alc-note", details);
        note.addEventListener("input", ()=>{
          currentNote = note.value.slice(0, 160);
          setDirty(true);
        });
      }
    }

    async function loadToday(){
      const today = TrackboardUI.todayISO();
      const entry = await Store.getEntry(today) || {};
      const a = entry.alcohol || { status: "free" };
      currentChoice = (a.status === "had") ? "had" : "free";
      currentType = a.type || "beer";
      currentDrinks = Number(a.drinks || 1) || 1;
      currentNote = a.note || "";
      setChoice(currentChoice);
      setDirty(false);
      await renderWeek();
    }

    async function renderWeek(){
      const today = new Date();
      const weekStart = startOfWeekISO(today);
      const entries = await Store.getEntriesForWeek(weekStart);
      const sum = summarizeWeek(entries);
      const range = fmtWeekRange(weekStart);

      const lines = TYPE_OPTIONS.map(t=>{
        const n = sum.byType[t.key] || 0;
        const faded = n ? "" : "muted";
        return `<span class="${faded}" title="${t.label}">${t.emoji} ${n}</span>`;
      }).join(" · ");

      const toneClass = sum.hadDays === 0 ? "good" : (sum.hadDays <= 2 ? "ok" : "warn");

      $("#alc-week-body", root).innerHTML = `
        <div class="weekline">
          <div><strong>${range}</strong></div>
          <div class="badge ${toneClass}">${sum.freeDays} alcohol-free day(s)</div>
        </div>
        <div class="muted mt">Drinks logged: <strong>${sum.drinksTotal}</strong></div>
        <div class="mt">${lines}</div>
      `;
    }

    // wire choice buttons
    root.querySelector(".seg").addEventListener("click", (e)=>{
      const btn = e.target.closest(".seg-btn");
      if(!btn) return;
      setChoice(btn.dataset.choice);
      setDirty(true);
    });

    // save
    saveBtn.addEventListener("click", async ()=>{
      const today = TrackboardUI.todayISO();
      const entry = await Store.getEntry(today) || {};
      entry.alcohol = (currentChoice === "free")
        ? { status: "free" }
        : { status: "had", type: currentType, drinks: currentDrinks, note: currentNote };

      entry.date = today;
      try{
        await Store.putEntry(entry);
      }catch(err){
        if(String(err).includes('Locked')){
          TrackboardUI.toast('Notebook is locked. Unlock to save.');
          window.location.hash = '#unlock';
          return;
        }
        throw err;
      }
      TrackboardUI.toast("Saved.");
      setDirty(false);
      await renderWeek();
    });

    // 10-min wait
    $("#alc-wait", root).addEventListener("click", ()=>{
      TrackboardUI.toast("Timer started. Come back in 10 minutes.");
      TrackboardUI.startTimer(10*60);
    });

    // initial
    loadToday();

    return root;
  }

  TrackboardRouter.register("alcohol", async () => {
    const view = document.getElementById("view");
    view.appendChild(renderAlcohol());
    TrackboardUI.setActiveNav("alcohol");
    TrackboardUI.setSubtitle("Alcohol · Private · Stored on this device");
  });
})();
