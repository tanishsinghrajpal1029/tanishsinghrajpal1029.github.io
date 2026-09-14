// Run before paint. The setting is shared with the existing home/contact pages.
(() => {
  let theme = 'light';
  try { if (localStorage.getItem('tanish-site-theme-v2') === 'dark') theme = 'dark'; } catch {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.add('js');
})();
