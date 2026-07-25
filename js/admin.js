(function () {
  'use strict';

  const app = window.Imperio;
  const root = document.getElementById('adminRoot');
  const authModal = document.getElementById('adminAuthModal');
  const loginBtn = document.getElementById('adminLoginOpen');
  const themeBtn = document.getElementById('adminThemeToggle');
  const jsonDialog = document.getElementById('jsonDialog');
  let activeTab = localStorage.getItem('imperioAdminTab') || 'dashboard';

  const tabs = [
    ['dashboard', '📊 Dashboard'],
    ['geral', '🎨 Geral/Menu'],
    ['conteudo', '📰 Conteúdo'],
    ['cultos', '⛪ Cultos/Agenda'],
    ['celulas', '🏡 Células'],
    ['usuarios', '👥 Usuários'],
    ['posts', '✅ Aprovação'],
    ['quizzes', '🧠 Quizzes'],
    ['json', '🧩 JSON'],
    ['firebase', '🔥 Firebase']
  ];

  const templates = {
    news: { title: 'Nova notícia', summary: 'Resumo da notícia', content: 'Conteúdo completo', author: 'Igreja', status: 'approved', featured: false, date: new Date().toISOString(), createdAt: new Date().toISOString(), image: '' },
    announcements: { title: 'Novo aviso', text: 'Texto do aviso', date: new Date().toISOString(), visible: true, priority: 'normal' },
    services: { title: 'Novo culto', type: 'Culto', weekday: 'Domingo', time: '19:00', date: '', location: 'Templo', preacher: '', theme: '', visible: true },
    events: { title: 'Novo evento', description: '', startsAt: new Date().toISOString(), endsAt: '', location: '', category: 'Evento', visible: true },
    activities: { title: 'Nova atividade', description: '', leader: '', schedule: '', visible: true },
    cells: { name: 'Nova célula', leaderId: '', leaderName: '', weekday: 'Terça-feira', time: '20:00', address: '', neighborhood: '', description: '', visible: true },
    quizzes: { title: 'Novo quiz', scope: 'culto', targetId: '', active: true, createdAt: new Date().toISOString(), questions: [{ text: 'Pergunta', options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'], answer: 0 }] },
    commemorations: { title: 'Nova data', date: new Date().toISOString().slice(0, 10), description: '' }
  };

  function e(value) { return app.escapeHtml(value); }
  function list(path) { return app.asArray(app.getAt(path, {})); }
  function idFor(prefix) { return app.uid(prefix).replace(/-/g, '_'); }

  function setLoginButton() {
    const user = app.state.user;
    if (!user) {
      loginBtn.textContent = 'Entrar';
      loginBtn.onclick = () => authModal.showModal();
      return;
    }
    loginBtn.innerHTML = `${e(app.avatarFor(user))} ${e(user.name || 'Perfil')}`;
    loginBtn.onclick = () => { if (confirm('Deseja sair?')) app.signOut(); };
  }

  function guard() {
    const user = app.state.user;
    if (!user) {
      root.innerHTML = `<section class="admin-hero"><div class="hero"><span class="badge">Admin</span><h1>Painel administrativo da igreja</h1><p>Entre para editar menu, cores, notícias, cultos, agenda, células, usuários, posts, presença e quizzes.</p><div class="hero-actions"><button class="btn accent" id="openAdminLogin">Entrar como pastor</button><a class="btn ghost" href="index.html">Ver aplicativo</a></div></div><div class="card"><h2>Acesso demo local</h2><p class="muted">Email: pastor@imperialbatista.local<br>Senha: imperio123</p><p>Para produção, configure o Firebase Auth e regras de segurança.</p></div></section>`;
      document.getElementById('openAdminLogin').onclick = () => authModal.showModal();
      return false;
    }
    if (!app.hasRole('pastor')) {
      root.innerHTML = `<div class="card danger"><h1>Acesso restrito</h1><p>Somente pastor/admin pode acessar todo o painel administrativo.</p><p>Seu cargo atual: <strong>${e(user.role || 'membro')}</strong></p><button class="btn" id="logoutRestricted">Sair</button></div>`;
      document.getElementById('logoutRestricted').onclick = () => app.signOut();
      return false;
    }
    return true;
  }

  function shell(content) {
    const user = app.state.user;
    const stats = {
      users: list('users').length,
      pending: list('posts').filter(p => p.status === 'pending').length,
      services: list('services').length,
      cells: list('cells').length
    };
    root.innerHTML = `<section class="admin-hero"><div class="hero"><span class="badge">Painel pastor/admin</span><h1>Editar todo o aplicativo</h1><p>Altere menus, identidade visual, conteúdo, cargos, células, presença e quizzes. Tudo é salvo no Firebase ou no modo local.</p></div><div class="grid"><div class="card"><h2>${e(user.name)}</h2><p class="muted">Cargo: ${e(user.role)}<br>Modo de dados: ${e(window.ImperioFirebase.getMode())}</p></div><div class="grid two"><div class="card kpi"><strong>${stats.users}</strong><span>usuários</span></div><div class="card kpi"><strong>${stats.pending}</strong><span>posts pendentes</span></div><div class="card kpi"><strong>${stats.services}</strong><span>cultos</span></div><div class="card kpi"><strong>${stats.cells}</strong><span>células</span></div></div></div></section><nav class="admin-tabs">${tabs.map(([id, label]) => `<button class="btn small admin-tab ${activeTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}</nav><section id="adminContent">${content}</section>`;
    root.querySelectorAll('[data-tab]').forEach(btn => btn.onclick = () => { activeTab = btn.dataset.tab; localStorage.setItem('imperioAdminTab', activeTab); render(); });
  }

  function dashboard() {
    const posts = list('posts').filter(p => p.status === 'pending');
    const recentUsers = list('users').sort(app.byDateDesc).slice(0, 5);
    return `<div class="grid two"><div class="card"><div class="section-head"><h2>Posts aguardando aprovação</h2><button class="btn small" data-go-tab="posts">Ver todos</button></div><div class="grid">${posts.map(p => `<div class="card compact"><h3>${e(p.title)}</h3><p class="muted">${e(p.authorName)} • ${e(app.formatDate(p.createdAt))}</p></div>`).join('') || '<p class="muted">Nenhum post pendente.</p>'}</div></div><div class="card"><h2>Últimos membros</h2><div class="grid">${recentUsers.map(u => `<div class="row gap"><span>${app.avatarMarkup(u, 'avatar-sm')}</span><div><strong>${e(u.name)}</strong><p class="muted">${e(u.role)} • ${e(u.email || '')}</p></div></div>`).join('')}</div></div><div class="card"><h2>Ideias batistas incluídas</h2><ul><li>Escola Bíblica Dominical e cultos de oração.</li><li>Missões, ação social, comunhão e discipulado em células.</li><li>Ceia, datas comemorativas e quizzes de aprendizado bíblico.</li><li>Aprovação pastoral de posts e cargos por responsabilidade.</li></ul></div><div class="card"><h2>Próximos passos produção</h2><ol><li>Preencher configuração Web do Firebase.</li><li>Ativar Google e Email/Senha no Firebase Auth.</li><li>Criar regras de segurança no Realtime Database.</li><li>Publicar e gerar APK via PWABuilder/Capacitor.</li></ol></div></div>`;
  }

  function geral() {
    const s = app.getAt('settings', {});
    const menus = list('settings/menus').sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    return `<div class="grid two"><section class="card"><h2>Identidade e cores</h2><form id="settingsForm" class="form-grid"><label>Nome do app<input name="appName" value="${e(s.appName || '')}"></label><label>Nome da igreja<input name="churchName" value="${e(s.churchName || '')}"></label><label>Slogan<input name="slogan" value="${e(s.slogan || '')}"></label><label>Logo/Favicon path<input name="logoPath" value="${e(s.logoPath || 'assets/logo.png')}"></label><label class="full">Título da home<input name="welcomeTitle" value="${e(s.welcomeTitle || '')}"></label><label class="full">Texto da home<textarea name="welcomeText">${e(s.welcomeText || '')}</textarea></label><label>Cor primária<input name="primary" type="color" value="${e((s.theme && s.theme.primary) || '#123b2a')}"></label><label>Cor secundária<input name="primary2" type="color" value="${e((s.theme && s.theme.primary2) || '#1f6a49')}"></label><label>Cor destaque<input name="accent" type="color" value="${e((s.theme && s.theme.accent) || '#d4a33a')}"></label><label>WhatsApp<input name="whatsapp" value="${e(s.whatsapp || '')}"></label><label>Telefone<input name="phone" value="${e(s.phone || '')}"></label><label>Email<input name="email" value="${e(s.email || '')}"></label><label class="full">Endereço<input name="address" value="${e(s.address || '')}"></label><div class="full"><button class="btn primary" type="submit">Salvar configurações</button></div></form></section><section class="card"><div class="section-head"><h2>Menu do aplicativo</h2><button class="btn small" data-add-menu="1">Adicionar menu</button></div><div class="table-wrap"><table><thead><tr><th>Ordem</th><th>Ícone</th><th>Label</th><th>Página</th><th>Visível</th><th>Ações</th></tr></thead><tbody>${menus.map(m => `<tr><td>${e(m.order || '')}</td><td>${e(m.icon || '')}</td><td>${e(m.label)}</td><td>${e(m.page)}</td><td>${m.visible !== false ? 'Sim' : 'Não'}</td><td><button class="btn small" data-edit-path="settings/menus/${e(m.id)}">Editar</button> <button class="btn small danger" data-delete-path="settings/menus/${e(m.id)}">Excluir</button></td></tr>`).join('')}</tbody></table></div></section></div>`;
  }

  function collectionSection(title, path, description) {
    const items = list(path).sort(app.byDateDesc);
    const prefix = path.slice(0, 4);
    return `<section class="card"><div class="section-head"><div><h2>${title}</h2><p class="muted">${description || 'Edite adicionando, alterando ou excluindo itens.'}</p></div><button class="btn primary small" data-add-collection="${path}">Adicionar</button></div><div class="collection-list">${items.map(item => `<article class="card compact collection-card"><div><div class="card-title-line"><h3>${e(item.title || item.name || item.id)}</h3>${item.status ? `<span>${statusText(item.status)}</span>` : ''}</div><p class="muted">${e(item.description || item.summary || item.text || item.content || item.weekday || '')}</p><small class="muted">ID: ${e(item.id)}</small></div><div class="row gap wrap"><button class="btn small" data-edit-path="${path}/${e(item.id)}">Editar</button><button class="btn small danger" data-delete-path="${path}/${e(item.id)}">Excluir</button></div></article>`).join('') || '<div class="empty">Nenhum item cadastrado.</div>'}</div></section>`;
  }

  function statusText(status) {
    const map = { approved: 'Aprovado', pending: 'Pendente', rejected: 'Recusado' };
    return `<span class="status ${e(status)}">${map[status] || e(status)}</span>`;
  }

  function conteudo() {
    return `<div class="grid two">${collectionSection('Notícias', 'news', 'Notícias exibidas na Home.')}${collectionSection('Avisos', 'announcements', 'Avisos curtos e prioridades.')}${collectionSection('Atividades', 'activities', 'Ministérios, ação social, louvor e missões.')}${collectionSection('Datas comemorativas', 'commemorations', 'Datas especiais da igreja.')}</div>`;
  }

  function cultos() {
    return `<div class="grid two">${collectionSection('Cultos', 'services', 'Cultos, EBD, oração, temas e pregadores.')}${collectionSection('Agenda/Eventos', 'events', 'Eventos com data, horário e local.')}</div>`;
  }

  function celulas() {
    return `<div class="grid two">${collectionSection('Células', 'cells', 'Cada célula com líder, endereço, horário e membros.')}${collectionSection('Presença em células', 'cellPresence', 'Registros automáticos de presença.')}</div>`;
  }

  function usuarios() {
    const users = list('users').sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    const cells = app.getAt('cells', {});
    return `<section class="card"><div class="section-head"><div><h2>Usuários e cargos</h2><p class="muted">Cargos: membro, editor, líder e pastor/admin.</p></div><button class="btn primary small" data-add-user="1">Adicionar usuário</button></div><div class="table-wrap"><table><thead><tr><th>Membro</th><th>Contato</th><th>Cargo</th><th>Célula</th><th>Nota</th><th>Ações</th></tr></thead><tbody>${users.map(u => `<tr><td><div class="row gap"><span>${app.avatarMarkup(u, 'avatar-sm')}</span><div><strong>${e(u.name)}</strong><br><small>${e(u.username || u.id)}</small></div></div></td><td>${e(u.email || '')}<br>${e(u.whatsapp || '')}</td><td><select data-role-user="${e(u.id)}"><option ${u.role === 'membro' ? 'selected' : ''}>membro</option><option ${u.role === 'editor' ? 'selected' : ''}>editor</option><option ${u.role === 'lider' ? 'selected' : ''} value="lider">lider</option><option ${u.role === 'pastor' ? 'selected' : ''}>pastor</option></select></td><td>${e(cells[u.cellId] ? cells[u.cellId].name : '-')}</td><td>${e(u.note || '')}</td><td><button class="btn small" data-edit-path="users/${e(u.id)}">Editar</button> <button class="btn small danger" data-delete-path="users/${e(u.id)}">Excluir</button></td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function posts() {
    const posts = list('posts').sort(app.byDateDesc);
    return `<section class="card"><h2>Aprovação de posts</h2><p class="muted">Membros podem postar; líderes ou pastor aprovam ou recusam.</p><div class="grid two section">${posts.map(p => `<article class="card ${p.status === 'pending' ? 'highlight' : ''}"><div class="card-title-line"><h3>${e(p.title)}</h3>${statusText(p.status || 'pending')}</div><p>${e(p.content)}</p><p class="muted">${e(p.category || 'Geral')} • ${e(p.authorName || '')} • ${e(app.formatDate(p.createdAt))}</p><div class="row gap wrap"><button class="btn small primary" data-approve-post="${e(p.id)}">Aprovar</button><button class="btn small danger" data-reject-post="${e(p.id)}">Recusar</button><button class="btn small" data-edit-path="posts/${e(p.id)}">Editar</button><button class="btn small danger" data-delete-path="posts/${e(p.id)}">Excluir</button></div></article>`).join('') || '<div class="empty">Nenhum post.</div>'}</div></section>`;
  }

  function quizzes() {
    return `<div class="grid two">${collectionSection('Quizzes', 'quizzes', 'Perguntas para cultos e células.')}${collectionSection('Resultados', 'quizResults', 'Acertos e histórico por membro.')}</div>`;
  }

  function jsonEditor() {
    return `<section class="card"><h2>Editor JSON completo</h2><p class="muted">Use com cuidado: aqui todo o conteúdo editável do aplicativo pode ser exportado, importado ou salvo no Firebase/local.</p><textarea id="fullJson" class="json-area">${e(JSON.stringify(app.state.data, null, 2))}</textarea><div class="row gap wrap section"><button class="btn primary" id="saveFullJson">Salvar JSON completo</button><button class="btn" id="downloadJson">Baixar backup</button><label class="btn ghost">Importar JSON<input id="importJson" type="file" accept="application/json" hidden></label></div></section>`;
  }

  function firebaseTab() {
    const cfg = window.ImperioFirebase.getConfig();
    return `<section class="card"><h2>Configuração Firebase Web</h2><p class="muted">O databaseURL já está preenchido. Para login real por Email/Google, copie as credenciais Web do console Firebase.</p><form id="firebaseForm" class="form-grid"><label>apiKey<input name="apiKey" value="${e(cfg.apiKey || '')}" placeholder="AIza..."></label><label>authDomain<input name="authDomain" value="${e(cfg.authDomain || '')}"></label><label class="full">databaseURL<input name="databaseURL" value="${e(cfg.databaseURL || '')}"></label><label>projectId<input name="projectId" value="${e(cfg.projectId || '')}"></label><label>storageBucket<input name="storageBucket" value="${e(cfg.storageBucket || '')}"></label><label>messagingSenderId<input name="messagingSenderId" value="${e(cfg.messagingSenderId || '')}"></label><label>appId<input name="appId" value="${e(cfg.appId || '')}"></label><div class="full"><button class="btn primary" type="submit">Salvar configuração</button></div></form><div class="card compact section"><strong>Modo atual:</strong> ${e(window.ImperioFirebase.getMode())}. Após salvar config, recarregue a página.</div></section>`;
  }

  function renderTab() {
    const map = { dashboard, geral, conteudo, cultos, celulas, usuarios, posts, quizzes, json: jsonEditor, firebase: firebaseTab };
    return (map[activeTab] || dashboard)();
  }

  function render() {
    setLoginButton();
    themeBtn.textContent = app.state.theme === 'dark' ? '☀️' : '🌙';
    if (!guard()) return;
    shell(renderTab());
    bind();
  }

  function openJsonEditor(path, value) {
    jsonDialog.innerHTML = `<form method="dialog" class="modal-card"><button class="modal-close" value="cancel">×</button><h2>Editar: ${e(path)}</h2><textarea id="itemJson" class="json-area">${e(JSON.stringify(value, null, 2))}</textarea><div class="row gap wrap"><button class="btn primary" id="saveItemJson" type="button">Salvar</button><button class="btn ghost" value="cancel">Cancelar</button></div></form>`;
    jsonDialog.showModal();
    document.getElementById('saveItemJson').onclick = async () => {
      try {
        const parsed = JSON.parse(document.getElementById('itemJson').value);
        await app.setAt(path, parsed);
        jsonDialog.close();
        app.toast('Item salvo.');
      } catch (error) { app.toast('JSON inválido: ' + error.message); }
    };
  }

  function bind() {
    root.querySelectorAll('[data-go-tab]').forEach(btn => btn.onclick = () => { activeTab = btn.dataset.goTab; render(); });
    root.querySelectorAll('[data-edit-path]').forEach(btn => btn.onclick = () => openJsonEditor(btn.dataset.editPath, app.getAt(btn.dataset.editPath, {})));
    root.querySelectorAll('[data-delete-path]').forEach(btn => btn.onclick = async () => {
      if (!confirm('Excluir este item?')) return;
      await app.removeAt(btn.dataset.deletePath);
      app.toast('Item excluído.');
    });
    root.querySelectorAll('[data-add-collection]').forEach(btn => btn.onclick = () => {
      const path = btn.dataset.addCollection;
      const id = idFor(path.slice(0, 5));
      openJsonEditor(path + '/' + id, Object.assign({ id }, templates[path] || { id, title: 'Novo item' }));
    });
    const addMenu = root.querySelector('[data-add-menu]');
    if (addMenu) addMenu.onclick = () => {
      const id = idFor('menu');
      openJsonEditor('settings/menus/' + id, { id, label: 'Novo menu', icon: '✨', page: 'home', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 99 });
    };
    const addUser = root.querySelector('[data-add-user]');
    if (addUser) addUser.onclick = () => {
      const id = idFor('user');
      openJsonEditor('users/' + id, { id, name: 'Novo membro', username: '', email: '', password: '', whatsapp: '', phone: '', address: '', role: 'membro', city: '', cellId: '', avatarKey: 'dove', note: '', createdAt: new Date().toISOString() });
    };
    const settingsForm = root.querySelector('#settingsForm');
    if (settingsForm) settingsForm.onsubmit = async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(settingsForm).entries());
      await app.updateAt('settings', {
        appName: data.appName,
        churchName: data.churchName,
        slogan: data.slogan,
        logoPath: data.logoPath,
        welcomeTitle: data.welcomeTitle,
        welcomeText: data.welcomeText,
        whatsapp: data.whatsapp,
        phone: data.phone,
        email: data.email,
        address: data.address,
        theme: { primary: data.primary, primary2: data.primary2, accent: data.accent }
      });
      app.toast('Configurações salvas.');
    };
    root.querySelectorAll('[data-role-user]').forEach(select => select.onchange = async () => {
      await app.updateAt('users/' + select.dataset.roleUser, { role: select.value });
      app.toast('Cargo atualizado.');
    });
    root.querySelectorAll('[data-approve-post]').forEach(btn => btn.onclick = () => app.approvePost(btn.dataset.approvePost, true));
    root.querySelectorAll('[data-reject-post]').forEach(btn => btn.onclick = () => app.approvePost(btn.dataset.rejectPost, false));
    const fullJson = root.querySelector('#fullJson');
    const saveFull = root.querySelector('#saveFullJson');
    if (saveFull) saveFull.onclick = async () => {
      try { await window.ImperioFirebase.set('appData', JSON.parse(fullJson.value)); app.toast('JSON completo salvo.'); }
      catch (error) { app.toast('JSON inválido: ' + error.message); }
    };
    const downloadJson = root.querySelector('#downloadJson');
    if (downloadJson) downloadJson.onclick = () => {
      const blob = new Blob([JSON.stringify(app.state.data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'backup-imperio-batista.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };
    const importJson = root.querySelector('#importJson');
    if (importJson) importJson.onchange = async () => {
      const file = importJson.files[0];
      if (!file) return;
      const text = await file.text();
      fullJson.value = JSON.stringify(JSON.parse(text), null, 2);
    };
    const firebaseForm = root.querySelector('#firebaseForm');
    if (firebaseForm) firebaseForm.onsubmit = event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(firebaseForm).entries());
      window.ImperioFirebase.saveConfig(values);
      app.toast('Configuração salva. Recarregue a página para conectar.');
    };
  }

  document.getElementById('adminAuthForm').onsubmit = async event => {
    event.preventDefault();
    try {
      await app.signInEmail(document.getElementById('adminAuthEmail').value.trim(), document.getElementById('adminAuthPassword').value);
      authModal.close();
    } catch (error) { app.toast(error.message || 'Falha no login.'); }
  };
  document.getElementById('adminGoogleLogin').onclick = async () => {
    try { await app.signInGoogle(); authModal.close(); } catch (error) { app.toast(error.message || 'Falha no Google.'); }
  };
  themeBtn.onclick = () => { app.toggleTheme(); render(); };

  app.on('data', render);
  app.on('auth', render);
  app.on('theme', render);
  app.init().then(render);
})();
