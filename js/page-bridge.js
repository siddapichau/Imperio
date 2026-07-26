(function () {
  'use strict';
  function pageName() {
    const script = document.currentScript;
    if (script && script.dataset.page) return script.dataset.page;
    return location.pathname.split('/').pop().replace('.html', '') || 'home';
  }

  function syncBibleFromParent() {
    const parent = window.parent;
    if (parent && parent.ImperioBible && !window.ImperioBible) {
      window.ImperioBible = parent.ImperioBible;
    }
  }

  function syncTheme(parentApp) {
    const root = document.documentElement;
    const parentRoot = window.parent && window.parent.document && window.parent.document.documentElement;
    root.setAttribute('data-theme', (parentApp.state && parentApp.state.theme) || 'light');
    if (parentRoot) {
      const palette = parentRoot.getAttribute('data-palette') || (parentApp.activePaletteId && parentApp.activePaletteId()) || 'vinho';
      root.setAttribute('data-palette', palette);
      const computed = window.parent.getComputedStyle(parentRoot);
      [
        '--bg', '--surface', '--surface-2', '--text', '--muted', '--primary', '--primary-2', '--accent',
        '--danger', '--success', '--info', '--border', '--shadow', '--glow-1', '--glow-2', '--hero-from', '--hero-to'
      ].forEach(name => {
        const value = computed.getPropertyValue(name);
        if (value) root.style.setProperty(name, value.trim());
      });
    }
    document.querySelectorAll('[data-app-logo]').forEach(img => {
      if (!parentApp.logoPath) return;
      const src = String(parentApp.logoPath()).replace(/^\.\//, '');
      img.src = /^(https?:|data:|blob:|\/)/i.test(src) ? src : '../' + src;
    });
  }

  function isBusy() {
    return document.body && document.body.dataset && document.body.dataset.imperioBusy === '1';
  }

  function boot() {
    const parentApp = window.parent && window.parent.Imperio;
    if (!parentApp || !parentApp.renderEmbeddedPage || !parentApp.state.ready) {
      setTimeout(boot, 60);
      return;
    }
    syncBibleFromParent();
    const page = pageName();
    function render() {
      syncTheme(parentApp);
      parentApp.renderEmbeddedPage(page, document);
      syncTheme(parentApp);
    }
    render();
    // Algumas ações (Pix/IA) gravam no banco antes de mostrar o resultado. Se a página
    // fosse recriada nesse momento, o QR Code/resposta sumia. A flag imperioBusy é
    // definida pela página durante essas ações e evita re-renderizações destrutivas.
    parentApp.on('data', () => { if (!isBusy()) render(); else syncTheme(parentApp); });
    parentApp.on('auth', () => { if (!isBusy()) render(); else syncTheme(parentApp); });
    parentApp.on('theme', () => syncTheme(parentApp));
    parentApp.on('palette', () => syncTheme(parentApp));
    syncTheme(parentApp);
  }
  boot();
})();
