
(function(){
  const DB_NAME = 'trackboard';
  const DB_VER = 1;
  const STORES = {
    entries: { keyPath: 'date' },
    settings: { keyPath: 'key' }
  };

  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = ()=>{
        const db = req.result;
        for(const [name, cfg] of Object.entries(STORES)){
          if(!db.objectStoreNames.contains(name)){
            db.createObjectStore(name, cfg);
          }
        }
      };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
  }

  async function withStore(storeName, mode, fn){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;
      Promise.resolve(fn(store)).then(r=>{
        result = r;
      }).catch(reject);
      tx.oncomplete = ()=> resolve(result);
      tx.onerror = ()=> reject(tx.error);
      tx.onabort = ()=> reject(tx.error);
    });
  }

  function getEntry(date){
    return withStore('entries','readonly', (store)=> new Promise((res, rej)=>{
      const r = store.get(date);
      r.onsuccess = ()=> res(r.result || null);
      r.onerror = ()=> rej(r.error);
    }));
  }

  function putEntry(entry){
    return withStore('entries','readwrite', (store)=> new Promise((res, rej)=>{
      const r = store.put(entry);
      r.onsuccess = ()=> res(true);
      r.onerror = ()=> rej(r.error);
    }));
  }

  function getAllEntries(){
    return withStore('entries','readonly', (store)=> new Promise((res, rej)=>{
      const r = store.getAll();
      r.onsuccess = ()=> res(r.result || []);
      r.onerror = ()=> rej(r.error);
    }));
  }

  function getSetting(key){
    return withStore('settings','readonly', (store)=> new Promise((res, rej)=>{
      const r = store.get(key);
      r.onsuccess = ()=> res(r.result ? r.result.value : null);
      r.onerror = ()=> rej(r.error);
    }));
  }

  function setSetting(key, value){
    return withStore('settings','readwrite', (store)=> new Promise((res, rej)=>{
      const r = store.put({key, value});
      r.onsuccess = ()=> res(true);
      r.onerror = ()=> rej(r.error);
    }));
  }

  window.Store = {
    todayKey: ()=>{
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    },
    getEntry, putEntry, getAllEntries,
    getSetting, setSetting
  };
})();
