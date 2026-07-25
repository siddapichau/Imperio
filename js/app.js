(function () {
  'use strict';

  const app = window.Imperio;
  const frame = document.getElementById('appFrame');
  const desktopNav = document.getElementById('desktopNav');
  const mobileNav = document.getElementById('mobileNav');
  const drawer = document.getElementById('drawer');
  const loginOpen = document.getElementById('loginOpen');
  const authModal = document.getElementById('authModal');
  const authForm = document.getElementById('authForm');
  const registerToggle = document.getElementById('registerToggle');
  const googleLogin = document.getElementById('googleLogin');
  const themeToggle = document.getElementById('themeToggle');
  const installBtn = document.getElementById('installBtn');
  let deferredInstall = null;
  let registering = false;

  function currentPage() {
    return (location.hash || '#home').replace('#', '').split('?')[0] || 'home';
  }

  function navigate(page) {
    const next = page || 'home';
    if (location.hash !== '#' + next) location.hash = next;
    const url = `pages/${next}.html`;
    if (!frame.src.endsWith(url)) frame.src = url;
    renderNav();
    closeDrawer();
  }

  function navLink(menu) {
    const active = currentPage() === menu.page ? ' active' : '';
    return `<button class="nav-link${active}" type="button" data-page="${app.escapeHtml(menu.page)}"><span class="emoji">${app.escapeHtml(menu.icon || '•')}</span>${app.escapeHtml(menu.label)}</button>`;
  }

  function renderNav() {
    const menus = app.visibleMenus();
    const html = menus.map(navLink).join('');
    desktopNav.innerHTML = html;
    mobileNav.innerHTML = html;
    [desktopNav, mobileNav].forEach(nav => {
      nav.querySelectorAll('[data-page]').forEach(btn => btn.onclick = () => navigate(btn.dataset.page));
    });
  }

  function renderBrand() {
    const settings = app.getAt('settings', {});
    document.title = settings.churchName || 'Igreja Imperial Batista';
    document.getElementById('brandName').textContent = settings.churchName || 'Igreja Imperial Batista';
    document.getElementById('brandSlogan').textContent = settings.slogan || '';
    document.getElementById('drawerTitle').textContent = settings.appName || settings.churchName || 'Imperial Batista';
    const logo = settings.logoPath || 'assets/logo.png';
    document.getElementById('brandLogo').src = logo;
    themeToggle.textContent = app.state.theme === 'dark' ? '☀️' : '🌙';
  }

  function renderUser() {
    const user = app.state.user;
    if (!user) {
      loginOpen.innerHTML = 'Entrar';
      loginOpen.onclick = () => authModal.showModal();
      return;
    }
    const avatar = app.avatarFor(user);
    const avatarHtml = /^https?:|^data:/i.test(avatar) ? `<img src="${app.escapeHtml(avatar)}" alt="">` : `<span>${app.escapeHtml(avatar)}</span>`;
    loginOpen.innerHTML = `${avatarHtml}<span>${app.escapeHtml((user.name || 'Perfil').split(' ')[0])}</span>`;
    loginOpen.onclick = () => {
      if (confirm('Deseja sair da conta? Clique em Cancelar para abrir o perfil.')) app.signOut();
      else navigate('perfil');
    };
  }

  function openDrawer() { drawer.setAttribute('aria-hidden', 'false'); }
  function closeDrawer() { drawer.setAttribute('aria-hidden', 'true'); }

  document.getElementById('openDrawer').onclick = openDrawer;
  document.getElementById('closeDrawer').onclick = closeDrawer;
  document.getElementById('drawerBackdrop').onclick = closeDrawer;
  themeToggle.onclick = () => { app.toggleTheme(); renderBrand(); };

  registerToggle.onclick = () => {
    registering = !registering;
    document.querySelectorAll('.register-only').forEach(el => el.hidden = !registering);
    registerToggle.textContent = registering ? 'Já tenho conta' : 'Criar conta';
    document.getElementById('emailLogin').textContent = registering ? 'Cadastrar' : 'Entrar';
    document.getElementById('authName').required = registering;
  };

  authForm.onsubmit = async event => {
    event.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value.trim();
    try {
      if (registering) await app.registerEmail(name, email, password);
      else await app.signInEmail(email, password);
      authModal.close();
    } catch (error) {
      app.toast(error.message || 'Não foi possível entrar.');
    }
  };

  googleLogin.onclick = async () => {
    try { await app.signInGoogle(); authModal.close(); } catch (error) { app.toast(error.message || 'Falha no Google.'); }
  };

  window.addEventListener('hashchange', () => navigate(currentPage()));
  window.addEventListener('message', event => {
    if (!event.data || event.data.source !== 'imperio-page') return;
    if (event.data.action === 'navigate') navigate(event.data.page);
    if (event.data.action === 'login') authModal.showModal();
  });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstall = event;
    installBtn.hidden = false;
  });
  installBtn.onclick = async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    installBtn.hidden = true;
  };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }

  app.on('data', () => { renderBrand(); renderNav(); renderUser(); });
  app.on('auth', () => { renderNav(); renderUser(); });
  app.on('theme', renderBrand);

  app.init().then(() => {
    renderBrand();
    renderNav();
    renderUser();
    navigate(currentPage());
  });
})();
