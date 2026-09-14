(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  function syncTheme() {
    const dark = root.dataset.theme === 'dark';
    toggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.querySelector('.theme-label').textContent = dark ? 'Light mode' : 'Dark mode';
    toggle.querySelector('.theme-icon').textContent = dark ? '☀' : '☾';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0b1220' : '#f2f0ea';
  }
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('tanish-site-theme-v2', root.dataset.theme); } catch {}
    syncTheme();
  });
  syncTheme();
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav-list');
  const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu'; };
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open)); menu.textContent = open ? 'Close' : 'Menu';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
  const search = document.querySelector('#post-search');
  if (search) {
    document.querySelector('.toolbar').hidden = false;
    const category = document.querySelector('#post-category');
    const cards = [...document.querySelectorAll('.post-card')];
    function filterPosts() {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      cards.forEach(card => {
        const match = (!query || card.textContent.toLocaleLowerCase().includes(query)) && (!category.value || category.value === card.dataset.category);
        card.hidden = !match; if (match) count++;
      });
      document.querySelector('#post-count').textContent = `${count} ${count === 1 ? 'post' : 'posts'}`;
      document.querySelector('#empty-results').hidden = count !== 0;
    }
    search.addEventListener('input', filterPosts);
    category.addEventListener('change', filterPosts);
    document.querySelector('#clear-search').addEventListener('click', () => { search.value = ''; category.value = ''; filterPosts(); search.focus(); });
    filterPosts();
  }
  const progress = document.querySelector('.progress');
  if (progress) {
    const update = () => { const total = document.documentElement.scrollHeight - innerHeight; progress.value = total > 0 ? Math.min(100, Math.max(0, scrollY / total * 100)) : 100; };
    addEventListener('scroll', update, {passive:true}); addEventListener('resize', update); update();
  }
})();
