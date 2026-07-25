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
  const notificationBtn = document.getElementById('notificationBtn');
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
      loginOpen.onclick = () => openAuth(false);
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

  function renderNotificationButton() {
    if (!notificationBtn) return;
    const supported = 'Notification' in window;
    notificationBtn.hidden = !supported;
    if (!supported) return;
    notificationBtn.textContent = Notification.permission === 'granted' ? '🔔 Ativas' : '🔔 Avisos';
    notificationBtn.title = Notification.permission === 'granted' ? 'Notificações ativadas' : 'Ativar notificações de avisos, agenda e atividades';
  }

  function openDrawer() { drawer.setAttribute('aria-hidden', 'false'); }
  function closeDrawer() { drawer.setAttribute('aria-hidden', 'true'); }

  function applyAuthMode() {
    document.querySelectorAll('.register-only').forEach(el => { el.hidden = !registering; });
    document.querySelectorAll('.login-only').forEach(el => { el.hidden = registering; });
    registerToggle.textContent = registering ? 'Já tenho conta' : 'Criar conta';
    document.getElementById('emailLogin').textContent = registering ? 'Cadastrar' : 'Entrar';
    document.getElementById('authIdentifier').required = !registering;
    document.getElementById('authName').required = registering;
    document.getElementById('authUsername').required = registering;
    document.getElementById('authEmail').required = registering;
    document.getElementById('authConfirmPassword').required = registering;
    document.getElementById('authPassword').autocomplete = registering ? 'new-password' : 'current-password';
  }

  function restoreRememberedUser() {
    const remember = localStorage.getItem('imperioRememberUser') === 'true';
    const identifier = localStorage.getItem('imperioRememberIdentifier') || '';
    const rememberBox = document.getElementById('rememberUser');
    const input = document.getElementById('authIdentifier');
    rememberBox.checked = remember;
    if (remember && identifier) input.value = identifier;
  }

  function openAuth(registerMode) {
    registering = Boolean(registerMode);
    applyAuthMode();
    restoreRememberedUser();
    authModal.showModal();
    setTimeout(() => document.getElementById(registering ? 'authName' : 'authIdentifier').focus(), 60);
  }

  document.getElementById('openDrawer').onclick = openDrawer;
  document.getElementById('closeDrawer').onclick = closeDrawer;
  document.getElementById('drawerBackdrop').onclick = closeDrawer;
  themeToggle.onclick = () => { app.toggleTheme(); renderBrand(); };

  registerToggle.onclick = () => {
    registering = !registering;
    applyAuthMode();
  };

  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.onclick = () => {
      const input = document.querySelector(btn.dataset.togglePassword);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? '👁️' : '🙈';
      btn.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
    };
  });

  authForm.onsubmit = async event => {
    event.preventDefault();
    const password = document.getElementById('authPassword').value;
    try {
      if (registering) {
        const details = {
          name: document.getElementById('authName').value.trim(),
          username: document.getElementById('authUsername').value.trim(),
          email: document.getElementById('authEmail').value.trim(),
          password,
          confirmPassword: document.getElementById('authConfirmPassword').value
        };
        await app.registerEmail(details);
      } else {
        const identifier = document.getElementById('authIdentifier').value.trim();
        await app.signInEmail(identifier, password);
        if (document.getElementById('rememberUser').checked) {
          localStorage.setItem('imperioRememberUser', 'true');
          localStorage.setItem('imperioRememberIdentifier', identifier);
        } else {
          localStorage.removeItem('imperioRememberUser');
          localStorage.removeItem('imperioRememberIdentifier');
        }
      }
      authForm.reset();
      restoreRememberedUser();
      authModal.close();
    } catch (error) {
      app.toast(error.message || 'Não foi possível entrar.');
    }
  };

  googleLogin.onclick = async () => {
    try { await app.signInGoogle(); authModal.close(); } catch (error) { app.toast(error.message || 'Falha no Google.'); }
  };

  if (notificationBtn) {
    notificationBtn.onclick = async () => {
      await app.requestNotifications();
      renderNotificationButton();
      await app.checkDueNotifications(true);
    };
  }

  window.addEventListener('hashchange', () => navigate(currentPage()));
  window.addEventListener('message', event => {
    if (!event.data || event.data.source !== 'imperio-page') return;
    if (event.data.action === 'navigate') navigate(event.data.page);
    if (event.data.action === 'login') openAuth(false);
    if (event.data.action === 'register') openAuth(true);
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

  app.on('data', () => {
    renderBrand();
    renderNav();
    renderUser();
    renderNotificationButton();
    app.checkDueNotifications(false);
  });
  app.on('auth', () => { renderNav(); renderUser(); });
  app.on('theme', renderBrand);

  app.init().then(() => {
    renderBrand();
    renderNav();
    renderUser();
    renderNotificationButton();
    applyAuthMode();
    navigate(currentPage());
  });
})();
