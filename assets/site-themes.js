(() => {
  const root = document.documentElement;
  const palettes = {
    'deep-teal': { name: 'Deep teal', mode: 'dark', color: '#040d12' },
    'light-sage': { name: 'Light sage', mode: 'light', color: '#edf3ef' }
  };
  let palette = 'deep-teal';
  try {
    const stored = localStorage.getItem('tanish-palette-v1');
    if (Object.hasOwn(palettes, stored)) palette = stored;
  } catch {}
  function apply(value) {
    if (!Object.hasOwn(palettes, value)) return;
    palette = value;
    root.dataset.palette = value;
    root.dataset.theme = palettes[value].mode;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = palettes[value].color;
  }
  apply(palette);
  document.addEventListener('DOMContentLoaded', () => {
    const previous = document.querySelector('.theme-toggle');
    if (!previous) return;
    const picker = document.createElement('div');
    picker.className = 'theme-picker';
    const select = document.createElement('select');
    select.className = 'theme-select';
    select.setAttribute('aria-label', 'Color theme');
    for (const [value, entry] of Object.entries(palettes)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = entry.name;
      select.append(option);
    }
    select.value = palette;
    picker.append(select);
    previous.replaceWith(picker);
    // Earlier page scripts also set the browser chrome color while initializing.
    apply(palette);
    select.addEventListener('change', () => {
      apply(select.value);
      try { localStorage.setItem('tanish-palette-v1', select.value); } catch {}
    });
  });
})();
