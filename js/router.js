
(function(){
  const routes = {};
  let current = null;

  function setActiveNav(route){
    document.querySelectorAll('.navbtn').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.route === route);
    });
  }

  function render(route, opts={}){
    if(!routes[route]) route = 'home';
    current = route;
    setActiveNav(route);
    const view = document.getElementById('view');
    view.innerHTML = '';
    routes[route](view, opts);
    window.location.hash = route;
  }

  function onHash(){
    const route = (window.location.hash || '#home').slice(1);
    render(route);
  }

  window.TrackboardRouter = {
    register: (name, fn)=>{ routes[name]=fn; },
    go: (name, opts)=>render(name, opts),
    current: ()=>current
  };

  window.addEventListener('hashchange', onHash);

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-route]');
    if(btn){
      e.preventDefault();
      render(btn.dataset.route);
    }
  });

  window.addEventListener('DOMContentLoaded', ()=>{
    onHash();
  });
})();
