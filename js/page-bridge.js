(function () {
  'use strict';
  function pageName() {
    const script = document.currentScript;
    if (script && script.dataset.page) return script.dataset.page;
    return location.pathname.split('/').pop().replace('.html', '') || 'home';
  }
  function boot() {
    const parentApp = window.parent && window.parent.Imperio;
    if (!parentApp || !parentApp.renderEmbeddedPage || !parentApp.state.ready) {
      setTimeout(boot, 60);
      return;
    }
    parentApp.renderEmbeddedPage(pageName(), document);
    parentApp.on('data', () => parentApp.renderEmbeddedPage(pageName(), document));
    parentApp.on('auth', () => parentApp.renderEmbeddedPage(pageName(), document));
    parentApp.on('theme', () => document.documentElement.setAttribute('data-theme', parentApp.state.theme || 'light'));
    document.documentElement.setAttribute('data-theme', parentApp.state.theme || 'light');
  }
  boot();
})();
