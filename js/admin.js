(function () {
  'use strict';

  const app = window.Imperio;
  const root = document.getElementById('adminRoot');
  const authModal = document.getElementById('adminAuthModal');
  const loginBtn = document.getElementById('adminLoginOpen');
  const themeBtn = document.getElementById('adminThemeToggle');
  const jsonDialog = document.getElementById('jsonDialog');
  const adminDrawer = document.getElementById('adminDrawer');
  const adminMobileNav = document.getElementById('adminMobileNav');
  const openAdminDrawerBtn = document.getElementById('openAdminDrawer');
  const closeAdminDrawerBtn = document.getElementById('closeAdminDrawer');
  const adminDrawerBackdrop = document.getElementById('adminDrawerBackdrop');
  let activeTab = localStorage.getItem('imperioAdminTab') || 'dashboard';

  function openAdminDrawer() { if (adminDrawer) adminDrawer.setAttribute('aria-hidden', 'false'); }
  function closeAdminDrawer() { if (adminDrawer) adminDrawer.setAttribute('aria-hidden', 'true'); }
  if (openAdminDrawerBtn) openAdminDrawerBtn.onclick = openAdminDrawer;
  if (closeAdminDrawerBtn) closeAdminDrawerBtn.onclick = closeAdminDrawer;
  if (adminDrawerBackdrop) adminDrawerBackdrop.onclick = closeAdminDrawer;

  // Cada aba declara a permissão necessária. Áreas sensíveis exigem 'admin-only' (pastor/admin).
  const ALL_TABS = [
    ['dashboard', '📊 Dashboard', 'admin.dashboard'],
    ['geral', '🎨 Geral/Menu', 'settings.identity'],
    ['temas', '🌈 Temas', 'settings.identity'],
    ['conteudo', '📰 Conteúdo', 'content.news'],
    ['cultos', '⛪ Cultos/Agenda', 'content.services'],
    ['celulas', '🏡 Células', 'content.cells'],
    ['midia', '🎬 Mídia', 'content.media'],
    ['usuarios', '👥 Usuários', 'users.view'],
    ['posts', '✅ Aprovação', 'posts.approve'],
    ['devocionais', '🙏 Devocionais', 'content.devotionals'],
    ['quizzes', '🧠 Quizzes', 'content.quizzes'],
    ['pix', '💝 Pix/Doações', 'integrations.pix'],
    ['ia', '✨ IA DeepSeek', 'integrations.ai'],
    ['paginas', '📄 Páginas', 'content.pages'],
    ['mensagens', '✉️ Mensagens', 'messages.read'],
    ['seguranca', '🔐 Segurança', 'security.manage'],
    ['json', '🧩 JSON', 'security.manage'],
    ['firebase', '🔥 Firebase', 'security.manage']
  ];

  /** Abas que o usuário logado pode realmente abrir. */
  function allowedTabs() {
    return ALL_TABS.filter(([, , capability]) => app.can(capability));
  }

  /** Bloco padrão exibido quando alguém tenta abrir uma área sem permissão. */
  function deniedCard(area) {
    return `<section class="card danger"><h2>🔒 Área restrita</h2><p>A seção <strong>${e(area)}</strong> é exclusiva do pastor/administrador da igreja.</p><p class="muted">Seu cargo atual: <strong>${e(roleName(app.currentRole()))}</strong>. Se você precisa deste acesso, fale com o administrador.</p></section>`;
  }

  function roleName(role) {
    const map = { pastor: 'Administrador (pastor)', lider: 'Líder', editor: 'Editor', membro: 'Membro' };
    return map[app.normalizeRole(role)] || 'Membro';
  }

  const templates = {
    news: { title: 'Nova notícia', summary: 'Resumo da notícia', content: 'Conteúdo completo', author: 'Igreja', status: 'approved', featured: false, date: new Date().toISOString(), createdAt: new Date().toISOString(), image: '' },
    announcements: { title: 'Novo aviso', text: 'Texto do aviso', date: new Date().toISOString(), visible: true, priority: 'normal' },
    services: { title: 'Novo culto', type: 'Culto', weekday: 'Domingo', time: '19:00', date: '', location: 'Templo', preacher: '', theme: '', visible: true },
    events: { title: 'Novo evento', description: '', startsAt: new Date().toISOString(), endsAt: '', location: '', category: 'Evento', visible: true },
    activities: { title: 'Nova atividade', description: '', leader: '', schedule: '', visible: true },
    devotionalVerses: { reference: 'João 3:16', text: 'Porque Deus amou ao mundo de tal maneira...', theme: 'Evangelho', visible: true },
    feelingWords: { feeling: 'Esperança', icon: '🌅', title: 'Palavra de esperança', verse: 'Romanos 15:13', text: 'Mensagem pastoral para este sentimento.', prayer: 'Senhor, renova minha esperança.' },
    prayerRequests: { authorName: 'Membro', feeling: 'Oração', text: 'Pedido de oração', contact: '', status: 'pending', createdAt: new Date().toISOString() },
    cells: { name: 'Nova célula', leaderId: '', leaderName: '', weekday: 'Terça-feira', time: '20:00', address: '', neighborhood: '', description: '', visible: true },
    quizzes: { title: 'Novo quiz', scope: 'culto', targetId: '', active: true, createdAt: new Date().toISOString(), questions: [{ text: 'Pergunta', options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'], answer: 0 }] },
    commemorations: { title: 'Nova data', date: new Date().toISOString().slice(0, 10), description: '' },
    media: { title: 'Nova pregação', category: 'Pregação', speaker: '', description: '', embed: '', image: '', live: false, visible: true, date: new Date().toISOString(), createdAt: new Date().toISOString() },
    readingPlans: { title: 'Novo plano de leitura', description: '', visible: true, days: { d1: { id: 'd1', label: 'Dia 1', passage: 'Gênesis 1' } } },
    customPages: { slug: 'sobre', title: 'Nova página', content: '<p>Conteúdo da página.</p>', visible: true, order: 10 },
    donations: { donorName: 'Doador', amount: 0, purpose: 'Oferta', method: 'pix', status: 'confirmada', createdAt: new Date().toISOString() }
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
    const avatar = app.avatarFor(user);
    const avatarHtml = /^https?:|^data:/i.test(avatar) ? `<img src="${e(avatar)}" alt="" class="avatar-sm">` : e(avatar);
    loginBtn.innerHTML = `${avatarHtml} ${e(user.name || 'Perfil')}`;
    loginBtn.onclick = () => { if (confirm('Deseja sair?')) app.signOut(); };
  }

  function guard() {
    const user = app.state.user;
    if (!user) {
      root.innerHTML = `<section class="admin-hero"><div class="hero"><span class="badge">Admin</span><h1>Painel administrativo da igreja</h1><p>Entre para editar menu, cores, notícias, cultos, agenda, células, usuários, posts, presença, doações e quizzes.</p><div class="hero-actions"><button class="btn accent" id="openAdminLogin">Entrar</button><a class="btn ghost" href="index.html">Ver aplicativo</a></div></div><div class="card"><h2>Acesso restrito</h2><p class="muted">Use as credenciais fornecidas pela liderança da igreja. Por segurança, nenhuma senha é exibida nesta tela.</p><p class="muted">Perdeu o acesso? O responsável técnico pode redefinir a senha do administrador na aba <strong>Segurança</strong> do painel.</p></div></section>`;
      document.getElementById('openAdminLogin').onclick = () => authModal.showModal();
      return false;
    }
    if (!app.can('admin.access')) {
      root.innerHTML = `<div class="card danger"><h1>Acesso restrito</h1><p>O painel administrativo é para administradores, líderes e editores da igreja.</p><p>Seu cargo atual: <strong>${e(roleName(user.role))}</strong>.</p><p class="muted">Se você deveria ter acesso, peça ao administrador para ajustar seu cargo na aba Usuários.</p><div class="row gap wrap"><a class="btn primary" href="index.html">Voltar ao aplicativo</a><button class="btn ghost" id="logoutRestricted">Sair</button></div></div>`;
      document.getElementById('logoutRestricted').onclick = () => app.signOut();
      return false;
    }
    // Se a aba salva não é permitida para este cargo, abre a primeira liberada.
    const permitted = allowedTabs();
    if (!permitted.some(([id]) => id === activeTab)) {
      activeTab = permitted.length ? permitted[0][0] : 'dashboard';
      localStorage.setItem('imperioAdminTab', activeTab);
    }
    return true;
  }

  function shell(content) {
    const user = app.state.user;
    const tabs = allowedTabs();
    const role = app.currentRole();
    const stats = {
      users: list('users').length,
      pending: list('posts').filter(p => p.status === 'pending').length,
      services: list('services').length,
      cells: list('cells').length
    };
    const tabsHtml = tabs.map(([id, label]) => `<button class="btn small admin-tab ${activeTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('');
    const mobileTabsHtml = tabs.map(([id, label]) => `<button class="nav-link ${activeTab === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('');
    const currentLabel = (tabs.find(t => t[0] === activeTab) || ['',''])[1] || activeTab;
    const heroText = role === 'pastor'
      ? 'Você é administrador: pode editar menus, identidade visual, conteúdo, cargos, células, Pix, IA e segurança.'
      : role === 'lider'
        ? 'Como líder você cuida de conteúdo, cultos, agenda, células, quizzes, aprovação de posts e mensagens. Pix, IA e segurança são exclusivos do administrador.'
        : 'Como editor você cuida de notícias, avisos, mídia, devocionais e páginas. Demais áreas são da liderança.';
    root.innerHTML = `<section class="admin-hero"><div class="hero"><span class="badge">Painel • ${e(roleName(role))}</span><h1>Gestão do aplicativo</h1><p>${e(heroText)}</p></div><div class="grid"><div class="card"><h2>${e(user.name)}</h2><p class="muted">Cargo: <strong>${e(roleName(user.role))}</strong><br>Email: ${e(user.email || '')}<br>Modo: ${e(window.ImperioFirebase.getMode())}${user.linkedTo ? '<br><small>🔗 Conta vinculada via Google (mesmo email)</small>' : ''}</p><p class="muted"><small>${tabs.length} de ${ALL_TABS.length} seções liberadas para o seu cargo.</small></p></div><div class="grid two"><div class="card kpi"><strong>${stats.users}</strong><span>usuários</span></div><div class="card kpi"><strong>${stats.pending}</strong><span>posts pendentes</span></div><div class="card kpi"><strong>${stats.services}</strong><span>cultos</span></div><div class="card kpi"><strong>${stats.cells}</strong><span>células</span></div></div></div></section>
      <div class="admin-mobile-bar"><button class="btn primary small" id="openDrawerFromContent">☰ ${currentLabel}</button><select id="adminTabSelect" class="admin-tab-select">${tabs.map(([id, label]) => `<option value="${id}" ${activeTab===id?'selected':''}>${label}</option>`).join('')}</select></div>
      <nav class="admin-tabs">${tabsHtml}</nav><section id="adminContent">${content}</section>`;
    root.querySelectorAll('[data-tab]').forEach(btn => btn.onclick = () => { activeTab = btn.dataset.tab; localStorage.setItem('imperioAdminTab', activeTab); closeAdminDrawer(); render(); });
    const select = root.querySelector('#adminTabSelect');
    if (select) select.onchange = () => { activeTab = select.value; localStorage.setItem('imperioAdminTab', activeTab); render(); };
    const openFromContent = root.querySelector('#openDrawerFromContent');
    if (openFromContent) openFromContent.onclick = openAdminDrawer;
    if (adminMobileNav) {
      adminMobileNav.innerHTML = mobileTabsHtml;
      adminMobileNav.querySelectorAll('[data-tab]').forEach(btn => btn.onclick = () => { activeTab = btn.dataset.tab; localStorage.setItem('imperioAdminTab', activeTab); closeAdminDrawer(); render(); });
    }
    const mobileLogout = document.getElementById('adminMobileLogout');
    if (mobileLogout) mobileLogout.onclick = () => { if (confirm('Deseja sair da sua conta?')) app.signOut(); };
    const mobileSwitch = document.getElementById('adminMobileSwitch');
    if (mobileSwitch) mobileSwitch.onclick = async () => {
      closeAdminDrawer();
      await app.signOut();
      authModal.showModal();
    };
  }

  function dashboard() {
    const posts = list('posts').filter(p => p.status === 'pending');
    const recentUsers = list('users').sort(app.byDateDesc).slice(0, 5);
    return `<div class="grid two"><div class="card"><div class="section-head"><h2>Posts aguardando aprovação</h2><button class="btn small" data-go-tab="posts">Ver todos</button></div><div class="grid">${posts.map(p => `<div class="card compact"><h3>${e(p.title)}</h3><p class="muted">${e(p.authorName)} • ${e(app.formatDate(p.createdAt))}</p></div>`).join('') || '<p class="muted">Nenhum post pendente.</p>'}</div></div><div class="card"><h2>Últimos membros</h2><div class="grid">${recentUsers.map(u => `<div class="row gap"><span>${app.avatarMarkup(u, 'avatar-sm')}</span><div><strong>${e(u.name)}</strong><p class="muted">${e(u.role)} • ${e(u.email || '')}</p></div></div>`).join('')}</div></div><div class="card"><h2>Ideias batistas incluídas</h2><ul><li>Escola Bíblica Dominical e cultos de oração.</li><li>Missões, ação social, comunhão e discipulado em células.</li><li>Ceia, datas comemorativas e quizzes de aprendizado bíblico.</li><li>Aprovação pastoral de posts e cargos por responsabilidade.</li></ul></div><div class="card"><h2>Próximos passos produção</h2><ol><li>Preencher configuração Web do Firebase.</li><li>Ativar Google e Email/Senha no Firebase Auth.</li><li>Criar regras de segurança no Realtime Database.</li><li>Publicar e gerar APK via PWABuilder/Capacitor.</li></ol></div></div>`;
  }

  function geral() {
    const s = app.getAt('settings', {});
    const menus = list('settings/menus').sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    return `<div class="grid two"><section class="card"><h2>Identidade e cores</h2><form id="settingsForm" class="form-grid"><label>Nome do app<input name="appName" value="${e(s.appName || '')}"></label><label>Nome da igreja<input name="churchName" value="${e(s.churchName || '')}"></label><label>Slogan<input name="slogan" value="${e(s.slogan || '')}"></label><label>Logo/Favicon path<input name="logoPath" value="${e(s.logoPath || 'assets/logo-roxo.png')}"></label><label class="full">Título da home<input name="welcomeTitle" value="${e(s.welcomeTitle || '')}"></label><label class="full">Texto da home<textarea name="welcomeText">${e(s.welcomeText || '')}</textarea></label><label>Cor primária<input name="primary" type="color" value="${e((s.theme && s.theme.primary) || '#4b0f43')}"></label><label>Cor secundária<input name="primary2" type="color" value="${e((s.theme && s.theme.primary2) || '#7a1d63')}"></label><label>Cor destaque<input name="accent" type="color" value="${e((s.theme && s.theme.accent) || '#e7b566')}"></label><label>WhatsApp<input name="whatsapp" value="${e(s.whatsapp || '')}"></label><label>Telefone<input name="phone" value="${e(s.phone || '')}"></label><label>Email<input name="email" value="${e(s.email || '')}"></label><label class="full">Endereço<input name="address" value="${e(s.address || '')}"></label><div class="full"><button class="btn primary" type="submit">Salvar configurações</button></div></form></section><section class="card"><div class="section-head"><h2>Menu do aplicativo</h2><button class="btn small" data-add-menu="1">Adicionar menu</button></div><div class="table-wrap"><table><thead><tr><th>Ordem</th><th>Ícone</th><th>Label</th><th>Página</th><th>Visível</th><th>Ações</th></tr></thead><tbody>${menus.map(m => `<tr><td>${e(m.order || '')}</td><td>${e(m.icon || '')}</td><td>${e(m.label)}</td><td>${e(m.page)}</td><td>${m.visible !== false ? 'Sim' : 'Não'}</td><td><button class="btn small" data-edit-path="settings/menus/${e(m.id)}">Editar</button> <button class="btn small danger" data-delete-path="settings/menus/${e(m.id)}">Excluir</button></td></tr>`).join('')}</tbody></table></div></section></div>`;
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
    const canManage = app.can('users.manage');
    const canChangeRole = app.can('users.role');
    const roleOptions = (current, locked) => {
      const value = app.normalizeRole(current);
      const opts = [['membro', 'Membro'], ['editor', 'Editor'], ['lider', 'Líder'], ['pastor', 'Administrador']];
      return opts.map(([id, label]) => `<option value="${id}" ${value === id ? 'selected' : ''}>${label}</option>`).join('') + (locked ? '' : '');
    };
    const intro = canChangeRole
      ? 'Defina o cargo de cada pessoa. <strong>Membro</strong> usa o app; <strong>Editor</strong> cuida de conteúdo; <strong>Líder</strong> cuida também de cultos, células, quizzes e aprovações; <strong>Administrador</strong> tem acesso total, incluindo Pix, IA e segurança.'
      : 'Lista de membros da igreja. Apenas o administrador pode alterar cargos ou excluir cadastros.';

    return `<section class="card">
      <div class="section-head">
        <div><h2>Usuários e cargos</h2><p class="muted">${intro}</p></div>
        ${canManage ? '<button class="btn primary small" data-add-user="1">Adicionar usuário</button>' : ''}
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Membro</th><th>Contato</th><th>Cargo</th><th>Célula</th><th>Nota</th>${canManage ? '<th>Ações</th>' : ''}</tr></thead>
        <tbody>${users.map(u => {
          const fixedAdmin = app.isAdminEmail(u.email);
          return `<tr>
            <td><div class="row gap"><span>${app.avatarMarkup(u, 'avatar-sm')}</span><div><strong>${e(u.name)}</strong><br><small>${e(u.username || u.id)}</small></div></div></td>
            <td>${e(u.email || '')}<br>${e(u.whatsapp || '')}</td>
            <td>${canChangeRole && !fixedAdmin
              ? `<select data-role-user="${e(u.id)}">${roleOptions(u.role)}</select>`
              : `<span class="status ${app.normalizeRole(u.role) === 'pastor' ? 'approved' : ''}">${e(roleName(u.role))}</span>${fixedAdmin ? '<br><small class="muted">admin fixo</small>' : ''}`}</td>
            <td>${e(cells[u.cellId] ? cells[u.cellId].name : '-')}</td>
            <td>${e(u.note || '')}</td>
            ${canManage ? `<td><button class="btn small" data-edit-path="users/${e(u.id)}">Editar</button> ${fixedAdmin ? '' : `<button class="btn small danger" data-delete-path="users/${e(u.id)}">Excluir</button>`}</td>` : ''}
          </tr>`;
        }).join('')}</tbody>
      </table></div>
      ${canChangeRole ? `<div class="card compact section"><h3>O que cada cargo pode fazer</h3><ul class="check-list">${
        ['editor', 'lider', 'pastor'].map(role => {
          const caps = app.capabilitiesFor(role);
          const text = caps.includes('*')
            ? 'Acesso total ao painel, incluindo Pix, IA, usuários e segurança.'
            : caps.filter(c => c !== 'admin.access' && c !== 'admin.dashboard').map(c => app.CAPABILITY_LABELS[c] || c).join(' • ');
          return `<li><strong>${e(roleName(role))}:</strong> ${e(text)}</li>`;
        }).join('')
      }<li><strong>Membro:</strong> usa o aplicativo, sem acesso ao painel.</li></ul></div>` : ''}
    </section>`;
  }

  function posts() {
    const posts = list('posts').sort(app.byDateDesc);
    return `<section class="card"><h2>Aprovação de posts</h2><p class="muted">Membros podem postar; líderes ou pastor aprovam ou recusam.</p><div class="grid two section">${posts.map(p => `<article class="card ${p.status === 'pending' ? 'highlight' : ''}"><div class="card-title-line"><h3>${e(p.title)}</h3>${statusText(p.status || 'pending')}</div><p>${e(p.content)}</p><p class="muted">${e(p.category || 'Geral')} • ${e(p.authorName || '')} • ${e(app.formatDate(p.createdAt))}</p><div class="row gap wrap"><button class="btn small primary" data-approve-post="${e(p.id)}">Aprovar</button><button class="btn small danger" data-reject-post="${e(p.id)}">Recusar</button><button class="btn small" data-edit-path="posts/${e(p.id)}">Editar</button><button class="btn small danger" data-delete-path="posts/${e(p.id)}">Excluir</button></div></article>`).join('') || '<div class="empty">Nenhum post.</div>'}</div></section>`;
  }

  function devocionais() {
    return `<div class="grid two">${collectionSection('Versículos devocionais', 'devotionalVerses', 'Lista usada para escolher o versículo do dia.')}${collectionSection('Palavra por sentimento', 'feelingWords', 'Mensagens pastorais exibidas na página Palavra.')}${collectionSection('Pedidos de oração', 'prayerRequests', 'Pedidos enviados pelo formulário devocional.')}</div>`;
  }

  function quizzes() {
    return `<div class="grid two">${collectionSection('Quizzes', 'quizzes', 'Perguntas para cultos e células.')}${collectionSection('Resultados', 'quizResults', 'Acertos e histórico por membro.')}</div>`;
  }

  function jsonEditor() {
    return `<section class="card"><h2>Editor JSON completo</h2><p class="muted">Use com cuidado: aqui todo o conteúdo editável do aplicativo pode ser exportado, importado ou salvo no Firebase/local.</p><textarea id="fullJson" class="json-area">${e(JSON.stringify(app.state.data, null, 2))}</textarea><div class="row gap wrap section"><button class="btn primary" id="saveFullJson">Salvar JSON completo</button><button class="btn" id="downloadJson">Baixar backup</button><label class="btn ghost">Importar JSON<input id="importJson" type="file" accept="application/json" hidden></label></div></section>`;
  }

  function firebaseTab() {
    const cfg = window.ImperioFirebase.getConfig();
    const isConfigured = Boolean(cfg.apiKey && cfg.appId);
    return `<section class="card"><h2>Configuração Firebase Web — ${isConfigured ? '✅ Configurado' : '⚠️ Pendente'}</h2><p class="muted">Firebase configurado com projeto <strong>imperio-28408</strong>. Login por Email/Senha e Google já funciona. Se logar com Google usando o mesmo email de uma conta admin existente, o sistema vincula automaticamente à mesma conta (não cria conta duplicada).</p>
      <div class="card compact" style="margin-bottom:14px; background:var(--surface-2)"><p class="muted" style="margin:0"><strong>apiKey:</strong> ${e(cfg.apiKey ? cfg.apiKey.slice(0,10)+'...'+cfg.apiKey.slice(-6) : '')}<br><strong>authDomain:</strong> ${e(cfg.authDomain||'')}<br><strong>databaseURL:</strong> ${e(cfg.databaseURL||'')}<br><strong>projectId:</strong> ${e(cfg.projectId||'')}<br><strong>storageBucket:</strong> ${e(cfg.storageBucket||'')}<br><strong>messagingSenderId:</strong> ${e(cfg.messagingSenderId||'')}<br><strong>appId:</strong> ${e(cfg.appId? cfg.appId.slice(0,12)+'...' : '')}</p></div>
      <form id="firebaseForm" class="form-grid">
        <label>apiKey<input name="apiKey" value="${e(cfg.apiKey || '')}" placeholder="AIza..."></label>
        <label>authDomain<input name="authDomain" value="${e(cfg.authDomain || '')}"></label>
        <label class="full">databaseURL<input name="databaseURL" value="${e(cfg.databaseURL || '')}"></label>
        <label>projectId<input name="projectId" value="${e(cfg.projectId || '')}"></label>
        <label>storageBucket<input name="storageBucket" value="${e(cfg.storageBucket || '')}"></label>
        <label>messagingSenderId<input name="messagingSenderId" value="${e(cfg.messagingSenderId || '')}"></label>
        <label>appId<input name="appId" value="${e(cfg.appId || '')}"></label>
        <div class="full row gap wrap"><button class="btn primary" type="submit">Salvar configuração</button><button class="btn ghost" type="button" id="resetFirebase">Restaurar padrão imperio-28408</button></div>
      </form>
      <div class="card compact section"><strong>Modo atual:</strong> ${e(window.ImperioFirebase.getMode())}. ${isConfigured ? 'Conectado ao Firebase — login real ativo.' : 'Modo local — preencha apiKey para conectar.'} Recarregue após salvar.</div>
      <div class="card compact section"><h3>🔗 Vinculação de conta Google</h3><p class="muted">Quando alguém já tem conta com email/senha (ex: admin) e depois entra com Google no <strong>mesmo email</strong>, o app detecta e abre a mesma conta com cargo pastor/admin. Se for a primeira vez com Google e o email já existe, o app pede a senha para vincular automaticamente.</p></div>
    </section>`;
  }

  function temas() {
    const s = app.getAt('settings', {});
    const active = s.palette || 'vinho';
    const palettes = app.paletteList();
    return `<div class="grid two">
      <section class="card">
        <div class="section-head"><div><h2>Tema de cores do aplicativo</h2><p class="muted">Ao ativar um tema, o app inteiro muda de cor <strong>e a logo troca junto</strong>. Claro e escuro continuam funcionando em todos os temas.</p></div></div>
        <div class="palette-grid">
          ${palettes.map(palette => `<article class="palette-card ${active === palette.id ? 'active' : ''}" data-set-palette="${e(palette.id)}">
            <img src="${e(palette.logo)}" alt="Logo ${e(palette.name)}" loading="lazy">
            <div>
              <strong>${e(palette.name)}</strong>
              <div class="swatches">
                <span style="background:${e(palette.light.primary)}" title="Primária clara"></span>
                <span style="background:${e(palette.light.primary2)}" title="Secundária"></span>
                <span style="background:${e(palette.light.accent)}" title="Destaque"></span>
                <span style="background:${e(palette.dark.bg)}" title="Fundo escuro"></span>
              </div>
              <small class="muted">${active === palette.id ? '✅ Tema ativo no app' : 'Clique para ativar'}</small>
            </div>
          </article>`).join('')}
          <article class="palette-card ${active === 'custom' ? 'active' : ''}" data-set-palette="custom">
            <div class="palette-custom-icon">🎨</div>
            <div><strong>Cores personalizadas</strong><small class="muted">Use as cores definidas manualmente na aba Geral.</small></div>
          </article>
        </div>
      </section>

      <section class="card">
        <h2>Opções de tema</h2>
        <form id="themeOptionsForm" class="form-grid">
          <label class="checkbox-line full"><input type="checkbox" name="allowUserPalette" ${s.allowUserPalette !== false ? 'checked' : ''}><span>Permitir que cada membro escolha o tema de cor no app</span></label>
          <label>Modo padrão do app
            <select name="defaultMode">
              <option value="light" ${s.defaultMode !== 'dark' ? 'selected' : ''}>Claro</option>
              <option value="dark" ${s.defaultMode === 'dark' ? 'selected' : ''}>Escuro</option>
            </select>
          </label>
          <label>Logo personalizada (URL ou caminho)
            <input name="logoPath" value="${e(s.logoPath || '')}" placeholder="Deixe vazio para usar a logo do tema">
          </label>
          <div class="full"><button class="btn primary" type="submit">Salvar opções</button></div>
        </form>
        <div class="card compact section">
          <h3>Pré-visualização</h3>
          <div class="theme-preview">
            <div class="theme-preview-item"><img data-app-logo src="${e(app.logoPath())}" alt="Logo atual"><small class="muted">Logo ativa</small></div>
            <div class="theme-preview-item"><span class="btn primary small">Botão</span><span class="badge">Badge</span></div>
          </div>
        </div>
      </section>

      <section class="card full-span">
        <h2>Compartilhamento</h2>
        <p class="muted">Define o que acompanha o conteúdo quando alguém toca em "Compartilhar".</p>
        <form id="shareForm" class="form-grid">
          <label class="checkbox-line full"><input type="checkbox" name="enabled" ${(s.share || {}).enabled !== false ? 'checked' : ''}><span>Exibir botões de compartilhamento no app</span></label>
          <label class="checkbox-line full"><input type="checkbox" name="useLogoFallback" ${(s.share || {}).useLogoFallback !== false ? 'checked' : ''}><span>Quando o post não tiver imagem, enviar a <strong>logo do app</strong> junto</span></label>
          <label class="full">Imagem padrão de compartilhamento<input name="defaultImage" value="${e((s.share || {}).defaultImage || '')}" placeholder="Vazio = logo do tema ativo"></label>
          <label class="full">Assinatura no texto compartilhado<input name="signature" value="${e((s.share || {}).signature || '')}"></label>
          <label class="full">Hashtags<input name="hashtags" value="${e((s.share || {}).hashtags || '')}" placeholder="#IgrejaImperialBatista"></label>
          <div class="full"><button class="btn primary" type="submit">Salvar compartilhamento</button></div>
        </form>
      </section>
    </div>`;
  }

  function pixTab() {
    const cfg = app.getAt('integrations/pix', {}) || {};
    const donations = list('donations').sort(app.byDateDesc);
    const confirmed = donations.filter(item => item.status === 'confirmada');
    const total = confirmed.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const thisMonth = confirmed.filter(item => String(item.createdAt || '').slice(0, 7) === new Date().toISOString().slice(0, 7));
    const monthTotal = thisMonth.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const configured = Boolean(String(cfg.pixKey || '').trim());

    return `<div class="grid">
      <section class="card compact" style="border-left:4px solid var(--primary)">
        <p class="muted" style="margin:0">🔒 <strong>Área exclusiva do administrador.</strong> A chave Pix definida aqui é a conta que recebe todas as contribuições do app. Confira sempre no app do banco antes de divulgar.</p>
      </section>
      <section class="grid four">
        <div class="card kpi"><div class="icon-bubble">💰</div><div><strong>${e(money(total))}</strong><span>total confirmado</span></div></div>
        <div class="card kpi"><div class="icon-bubble">📅</div><div><strong>${e(money(monthTotal))}</strong><span>este mês</span></div></div>
        <div class="card kpi"><div class="icon-bubble">🧾</div><div><strong>${donations.length}</strong><span>contribuições registradas</span></div></div>
        <div class="card kpi"><div class="icon-bubble">${configured ? '✅' : '⚠️'}</div><div><strong>${configured ? 'Ativo' : 'Pendente'}</strong><span>status da chave Pix</span></div></div>
      </section>

      <div class="grid two">
        <section class="card">
          <h2>Chave Pix / Mercado Pago que vai receber</h2>
          <p class="muted">O QR Code é gerado no padrão oficial BR Code do Banco Central. Se você usa Mercado Pago, cadastre aqui a chave Pix da sua conta Mercado Pago.</p>
          <form id="pixConfigForm" class="form-grid">
            <label class="checkbox-line full"><input type="checkbox" name="enabled" ${cfg.enabled !== false ? 'checked' : ''}><span>Ativar página de Dízimo/Oferta no app</span></label>
            <label class="full">Chave Pix (a que vai receber as doações)
              <input name="pixKey" value="${e(cfg.pixKey || '')}" placeholder="email, CPF/CNPJ, telefone ou chave aleatória" required>
            </label>
            <label>Tipo de chave
              <select name="keyType">
                ${['email', 'cpf', 'cnpj', 'telefone', 'aleatoria'].map(type => `<option value="${type}" ${cfg.keyType === type ? 'selected' : ''}>${type.toUpperCase()}</option>`).join('')}
              </select>
            </label>
            <label>Nome do recebedor (aparece no banco)
              <input name="receiverName" value="${e(cfg.receiverName || '')}" maxlength="25" placeholder="IGREJA IMPERIAL BATISTA">
            </label>
            <label>Cidade
              <input name="city" value="${e(cfg.city || '')}" maxlength="15" placeholder="SAO PAULO">
            </label>
            <label>Provedor
              <select name="provider">
                <option value="mercadopago" ${cfg.provider === 'mercadopago' ? 'selected' : ''}>Mercado Pago</option>
                <option value="banco" ${cfg.provider === 'banco' ? 'selected' : ''}>Banco tradicional</option>
                <option value="outro" ${cfg.provider === 'outro' ? 'selected' : ''}>Outro</option>
              </select>
            </label>
            <label>Valor mínimo (R$)<input name="minAmount" type="number" min="1" step="0.01" value="${e(cfg.minAmount || 5)}"></label>
            <label>Valor máximo (R$)<input name="maxAmount" type="number" min="0" step="0.01" value="${e(cfg.maxAmount || 0)}" placeholder="0 = sem limite"></label>
            <label class="full">Valores sugeridos (separados por vírgula)
              <input name="suggestedAmounts" value="${e((cfg.suggestedAmounts || []).join(', '))}" placeholder="5, 10, 20, 50, 100, 200">
            </label>
            <label class="full">Finalidades disponíveis (separadas por vírgula)
              <input name="purposes" value="${e((cfg.purposes || []).join(', '))}" placeholder="Dízimo, Oferta, Missões">
            </label>
            <label class="full">Mensagem da página<textarea name="message">${e(cfg.message || '')}</textarea></label>
            <label class="full">Mensagem de agradecimento<input name="thanksMessage" value="${e(cfg.thanksMessage || '')}"></label>
            <label class="checkbox-line full"><input type="checkbox" name="showHistory" ${cfg.showHistory !== false ? 'checked' : ''}><span>Mostrar histórico de contribuições para o próprio doador</span></label>
            <div class="full row gap wrap">
              <button class="btn primary" type="submit">Salvar configuração Pix</button>
              <button class="btn ghost" type="button" id="pixTestBtn">🔍 Testar QR Code</button>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>Mercado Pago (cartão e boleto — opcional)</h2>
          <p class="muted">Além do Pix, você pode oferecer cartão criando um <strong>Link de Pagamento</strong> no painel do Mercado Pago e colando abaixo.</p>
          <form id="mpConfigForm" class="form-grid">
            <label class="full">Link de pagamento Mercado Pago
              <input name="checkoutLink" value="${e(cfg.checkoutLink || '')}" placeholder="https://mpago.la/...">
            </label>
            <label class="full">Public Key (opcional)
              <input name="mercadoPagoPublicKey" value="${e(cfg.mercadoPagoPublicKey || '')}" placeholder="APP_USR-...">
            </label>
            <label class="full">Access Token (opcional — mantenha em sigilo)
              <span class="password-field">
                <input name="mercadoPagoAccessToken" type="password" value="${e(cfg.mercadoPagoAccessToken || '')}" placeholder="APP_USR-...">
                <button class="field-icon" type="button" data-reveal="1" aria-label="Mostrar">👁️</button>
              </span>
            </label>
            <div class="full"><button class="btn primary" type="submit">Salvar Mercado Pago</button></div>
          </form>
          <div class="card compact section" id="pixTestBox" hidden></div>
        </section>
      </div>

      <section class="card">
        <div class="section-head"><div><h2>Contribuições registradas</h2><p class="muted">Registros gerados quando alguém abre o QR Code no app.</p></div><button class="btn small" id="exportDonations">⬇️ Exportar CSV</button></div>
        <div class="table-wrap"><table><thead><tr><th>Data</th><th>Doador</th><th>Valor</th><th>Finalidade</th><th>Status</th><th>Ações</th></tr></thead><tbody>
          ${donations.slice(0, 100).map(item => `<tr><td>${e(app.formatDate(item.createdAt))}</td><td>${e(item.donorName || 'Anônimo')}</td><td>${e(money(item.amount))}</td><td>${e(item.purpose || '')}</td><td><span class="status ${item.status === 'confirmada' ? 'approved' : 'pending'}">${e(item.status || '')}</span></td><td><button class="btn small" data-confirm-donation="${e(item.id)}">Confirmar</button> <button class="btn small danger" data-delete-path="donations/${e(item.id)}">Excluir</button></td></tr>`).join('') || '<tr><td colspan="6">Nenhuma contribuição registrada.</td></tr>'}
        </tbody></table></div>
      </section>
    </div>`;
  }

  function iaTab() {
    const cfg = app.getAt('integrations/ai', {}) || {};
    const history = list('aiVerses').sort(app.byDateDesc);
    const security = window.ImperioSecurity;
    const themes = {};
    history.forEach(item => { themes[item.theme || 'Outros'] = (themes[item.theme || 'Outros'] || 0) + 1; });
    const topThemes = Object.keys(themes).sort((a, b) => themes[b] - themes[a]).slice(0, 6);

    return `<div class="grid">
      <div class="grid two">
        <section class="card">
          <h2>Assistente bíblico com IA (DeepSeek)</h2>
          <p class="muted">A pessoa escreve o que sente ou pensa e a IA devolve um versículo, aplicação pastoral e oração. Se a IA falhar ou ficar sem crédito, o app usa automaticamente a biblioteca local — nunca fica sem resposta.</p>
          <form id="aiConfigForm" class="form-grid">
            <label class="checkbox-line full"><input type="checkbox" name="enabled" ${cfg.enabled !== false ? 'checked' : ''}><span>Ativar respostas por IA</span></label>
            <label class="full">Chave da API (armazenada no banco de dados do app)
              <span class="password-field">
                <input name="apiKey" type="password" value="${e(cfg.apiKey || '')}" placeholder="sk-...">
                <button class="field-icon" type="button" data-reveal="1" aria-label="Mostrar">👁️</button>
              </span>
              ${cfg.apiKey ? `<small class="muted">Salva: ${e(security ? security.maskSecret(cfg.apiKey, 6) : '••••')}</small>` : ''}
            </label>
            <label class="full">Endpoint<input name="endpoint" value="${e(cfg.endpoint || '')}"></label>
            <label>Modelo
              <select name="model">
                <option value="deepseek-chat" ${cfg.model === 'deepseek-chat' ? 'selected' : ''}>deepseek-chat</option>
                <option value="deepseek-reasoner" ${cfg.model === 'deepseek-reasoner' ? 'selected' : ''}>deepseek-reasoner</option>
              </select>
            </label>
            <label>Criatividade (0 a 1)<input name="temperature" type="number" min="0" max="1" step="0.1" value="${e(cfg.temperature != null ? cfg.temperature : 0.7)}"></label>
            <label>Tokens máximos<input name="maxTokens" type="number" min="100" max="4000" step="50" value="${e(cfg.maxTokens || 700)}"></label>
            <label>Limite diário por pessoa<input name="dailyLimitPerUser" type="number" min="0" max="200" value="${e(cfg.dailyLimitPerUser || 20)}" placeholder="0 = ilimitado"></label>
            <label class="checkbox-line full"><input type="checkbox" name="saveHistory" ${cfg.saveHistory !== false ? 'checked' : ''}><span>Salvar histórico das consultas (para acompanhamento pastoral)</span></label>
            <label class="full">Instruções da IA (prompt do sistema)
              <textarea name="systemPrompt" rows="7">${e(cfg.systemPrompt || '')}</textarea>
            </label>
            <div class="full row gap wrap">
              <button class="btn primary" type="submit">Salvar configuração da IA</button>
              <button class="btn ghost" type="button" id="aiTestBtn">🧪 Testar conexão</button>
            </div>
          </form>
          <div class="card compact section" id="aiTestBox" hidden></div>
        </section>

        <section class="card">
          <h2>Como as pessoas estão usando</h2>
          <div class="grid two section">
            <div class="card kpi"><strong>${history.length}</strong><span>consultas registradas</span></div>
            <div class="card kpi"><strong>${history.filter(item => item.source === 'deepseek').length}</strong><span>respondidas pela IA</span></div>
          </div>
          ${topThemes.length ? `<h3>Temas mais buscados</h3><div class="row gap wrap">${topThemes.map(theme => `<span class="chip">${e(theme)} • ${themes[theme]}</span>`).join('')}</div>` : ''}
          <div class="card compact section">
            <h3>💡 Uso pastoral</h3>
            <p class="muted">Os temas mais buscados mostram o que a igreja está vivendo. Use esses dados para escolher temas de pregação, séries de estudo e cuidado pastoral.</p>
          </div>
        </section>
      </div>

      <section class="card">
        <div class="section-head"><div><h2>Histórico de consultas</h2><p class="muted">Últimas buscas feitas pelos membros. Use com sensibilidade pastoral.</p></div><button class="btn small danger" id="clearAiHistory">Limpar histórico</button></div>
        <div class="table-wrap"><table><thead><tr><th>Data</th><th>Pessoa</th><th>O que escreveu</th><th>Versículo</th><th>Tema</th></tr></thead><tbody>
          ${history.slice(0, 60).map(item => `<tr><td>${e(app.formatDate(item.createdAt))}</td><td>${e(item.userName || 'Visitante')}</td><td>${e(String(item.input || '').slice(0, 90))}</td><td>${e(item.reference || '')}</td><td>${e(item.theme || '')}</td></tr>`).join('') || '<tr><td colspan="5">Nenhuma consulta ainda.</td></tr>'}
        </tbody></table></div>
      </section>
    </div>`;
  }

  function midiaTab() {
    return `<div class="grid two">${collectionSection('Mídia (pregações, louvores, lives)', 'media', 'Cole o link do YouTube/Vimeo no campo "embed". Marque "live" para destacar como transmissão ao vivo.')}${collectionSection('Planos de leitura', 'readingPlans', 'Planos bíblicos com progresso por membro.')}</div>`;
  }

  function paginasTab() {
    const pages = list('customPages').sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    return `<div class="grid">
      <section class="card">
        <div class="section-head"><div><h2>Páginas personalizadas</h2><p class="muted">Crie páginas com o editor completo (imagens, vídeos, HTML) e exiba no app.</p></div><button class="btn primary small" id="newCustomPage">Nova página</button></div>
        <div class="collection-list">${pages.map(page => `<article class="card compact collection-card"><div><div class="card-title-line"><h3>${e(page.title)}</h3><span class="status">${page.visible !== false ? 'visível' : 'oculta'}</span></div><p class="muted">slug: ${e(page.slug)} • ordem: ${e(page.order || 0)}</p></div><div class="row gap wrap"><button class="btn small primary" data-edit-page="${e(page.id)}">✏️ Editar conteúdo</button><button class="btn small" data-edit-path="customPages/${e(page.id)}">JSON</button><button class="btn small danger" data-delete-path="customPages/${e(page.id)}">Excluir</button></div></article>`).join('') || '<div class="empty">Nenhuma página personalizada.</div>'}</div>
      </section>
      <section class="card">
        <h2>💡 Ideias de páginas para a igreja</h2>
        <div class="grid three">
          ${[
            ['📖 Nossa fé', 'Declaração doutrinária batista, história e valores.'],
            ['👶 Ministério infantil', 'Horários, check-in de crianças e segurança.'],
            ['💍 Casamentos e batismos', 'Como agendar, requisitos e aconselhamento.'],
            ['🤝 Seja voluntário', 'Ministérios abertos e formulário de inscrição.'],
            ['🎓 Cursos e discipulado', 'Turmas de novos convertidos e escola bíblica.'],
            ['📊 Prestação de contas', 'Transparência financeira da igreja.']
          ].map(([title, text]) => `<div class="card compact"><h3>${e(title)}</h3><p class="muted">${e(text)}</p></div>`).join('')}
        </div>
      </section>
    </div>`;
  }

  function mensagensTab() {
    const messages = list('messages').sort(app.byDateDesc);
    const prayers = list('prayerRequests').sort(app.byDateDesc);
    return `<div class="grid">
      <section class="card">
        <h2>Mensagens de contato</h2>
        <div class="table-wrap"><table><thead><tr><th>Data</th><th>Nome</th><th>Contato</th><th>Assunto</th><th>Mensagem</th><th>Ações</th></tr></thead><tbody>
          ${messages.map(item => `<tr class="${item.status === 'novo' ? 'row-highlight' : ''}"><td>${e(app.formatDate(item.createdAt))}</td><td>${e(item.name || '')}</td><td>${e(item.contact || '')}</td><td>${e(item.subject || '')}</td><td>${e(String(item.message || '').slice(0, 120))}</td><td><button class="btn small" data-mark-read="${e(item.id)}">Marcar lida</button> <button class="btn small danger" data-delete-path="messages/${e(item.id)}">Excluir</button></td></tr>`).join('') || '<tr><td colspan="6">Nenhuma mensagem.</td></tr>'}
        </tbody></table></div>
      </section>
      <section class="card">
        <h2>Pedidos de oração</h2>
        <div class="grid two">${prayers.slice(0, 40).map(item => `<article class="card compact"><div class="card-title-line"><h3>${e(item.authorName || 'Anônimo')}</h3><span class="badge">${e(item.feeling || 'Oração')}</span></div><p>${e(item.text)}</p><p class="muted">${e(app.formatDate(item.createdAt))} • ${e(item.contact || 'sem contato')} • ${item.public ? 'público' : 'privado'} • ${e(Number(item.prayCount || 0))} orando</p><div class="row gap wrap"><button class="btn small" data-toggle-public="${e(item.id)}">${item.public ? 'Tornar privado' : 'Publicar no mural'}</button><button class="btn small danger" data-delete-path="prayerRequests/${e(item.id)}">Excluir</button></div></article>`).join('') || '<div class="empty">Nenhum pedido.</div>'}</div>
      </section>
    </div>`;
  }

  function segurancaTab() {
    const users = list('users');
    const admin = users.find(item => item.id === 'pastor_demo') || {};
    const withPlain = users.filter(item => item.password);
    return `<div class="grid two">
      <section class="card">
        <h2>Senha do administrador</h2>
        <p class="muted">As senhas são guardadas apenas como hash SHA-256 — nem o painel nem o banco mostram a senha em texto. Nenhuma credencial aparece na tela de login do app.</p>
        <form id="adminPasswordForm" class="form-grid">
          <label class="full">Email do administrador<input name="email" value="${e(admin.email || '')}" type="email" required></label>
          <label class="full">Nome de usuário<input name="username" value="${e(admin.username || '')}" required></label>
          <label class="full">Nova senha
            <span class="password-field">
              <input name="password" type="password" placeholder="mínimo 8 caracteres, maiúscula, número e símbolo" required>
              <button class="field-icon" type="button" data-reveal="1" aria-label="Mostrar">👁️</button>
            </span>
          </label>
          <label class="full">Confirmar nova senha
            <span class="password-field">
              <input name="confirmPassword" type="password" required>
              <button class="field-icon" type="button" data-reveal="1" aria-label="Mostrar">👁️</button>
            </span>
          </label>
          <div class="full"><button class="btn primary" type="submit">Atualizar credenciais</button></div>
        </form>
      </section>
      <section class="card">
        <h2>Diagnóstico de segurança</h2>
        <ul class="check-list">
          <li>${withPlain.length ? '⚠️' : '✅'} Senhas em texto puro no banco: <strong>${withPlain.length}</strong>${withPlain.length ? ' — clique em "Converter em hash" abaixo.' : ''}</li>
          <li>${app.getAt('integrations/ai/apiKey', '') ? '✅' : '⚠️'} Chave da IA configurada no banco de dados.</li>
          <li>${app.getAt('integrations/pix/pixKey', '') ? '✅' : '⚠️'} Chave Pix configurada.</li>
          <li>${window.ImperioFirebase.getConfig().apiKey ? '✅' : '⚠️'} Firebase em modo ${e(window.ImperioFirebase.getMode())}.</li>
          <li>✅ Nenhuma credencial exibida na tela de login (app e admin).</li>
        </ul>
        <div class="row gap wrap section">
          ${withPlain.length ? '<button class="btn primary" id="hashAllPasswords">🔐 Converter senhas em hash</button>' : ''}
          <button class="btn ghost" id="resetSessions">Encerrar sessão local</button>
        </div>
        <div class="card compact section">
          <h3>Recomendações para produção</h3>
          <ol class="muted">
            <li>Configure o Firebase Authentication (Email/Senha + Google) na aba Firebase.</li>
            <li>Crie regras no Realtime Database limitando escrita a usuários autenticados e leitura de <code>integrations</code> apenas ao admin.</li>
            <li>Para volume alto de IA, mova a chamada DeepSeek para uma Cloud Function, mantendo a chave fora do cliente.</li>
          </ol>
        </div>
      </section>
    </div>`;
  }

  function renderTab() {
    const map = { dashboard, geral, temas, conteudo, cultos, celulas, midia: midiaTab, usuarios, posts, devocionais, quizzes, pix: pixTab, ia: iaTab, paginas: paginasTab, mensagens: mensagensTab, seguranca: segurancaTab, json: jsonEditor, firebase: firebaseTab };
    const entry = ALL_TABS.find(([id]) => id === activeTab);
    // Trava dupla: mesmo que alguém force a aba, sem permissão não renderiza o conteúdo.
    if (entry && !app.can(entry[2])) return deniedCard(entry[1].replace(/^[^\s]+\s/, ''));
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

  /** Caminhos que somente o pastor/admin pode gravar ou apagar. */
  const ADMIN_ONLY_PATHS = /^(integrations|settings|users|audit)(\/|$)/;

  function canWritePath(path) {
    if (app.isAdmin()) return true;
    if (ADMIN_ONLY_PATHS.test(String(path || ''))) return false;
    return true;
  }

  function denyWrite(path) {
    app.toast('🔒 Somente o administrador pode alterar "' + String(path).split('/')[0] + '".');
    return false;
  }

  function bind() {
    root.querySelectorAll('[data-go-tab]').forEach(btn => btn.onclick = () => { activeTab = btn.dataset.goTab; render(); });
    root.querySelectorAll('[data-edit-path]').forEach(btn => btn.onclick = () => {
      if (!canWritePath(btn.dataset.editPath)) return denyWrite(btn.dataset.editPath);
      openJsonEditor(btn.dataset.editPath, app.getAt(btn.dataset.editPath, {}));
    });
    root.querySelectorAll('[data-delete-path]').forEach(btn => btn.onclick = async () => {
      if (!canWritePath(btn.dataset.deletePath)) return denyWrite(btn.dataset.deletePath);
      if (!confirm('Excluir este item?')) return;
      await app.removeAt(btn.dataset.deletePath);
      app.toast('Item excluído.');
    });
    root.querySelectorAll('[data-add-collection]').forEach(btn => btn.onclick = () => {
      const path = btn.dataset.addCollection;
      if (!canWritePath(path)) return denyWrite(path);
      const id = idFor(path.slice(0, 5));
      openJsonEditor(path + '/' + id, Object.assign({ id }, templates[path] || { id, title: 'Novo item' }));
    });
    const addMenu = root.querySelector('[data-add-menu]');
    if (addMenu) addMenu.onclick = () => {
      if (!app.can('settings.identity')) return app.toast('🔒 Somente o administrador pode editar os menus.');
      const id = idFor('menu');
      openJsonEditor('settings/menus/' + id, { id, label: 'Novo menu', icon: '✨', page: 'home', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 99 });
    };
    const addUser = root.querySelector('[data-add-user]');
    if (addUser) addUser.onclick = () => {
      if (!app.can('users.manage')) return app.toast('🔒 Somente o administrador pode cadastrar usuários.');
      const id = idFor('user');
      openJsonEditor('users/' + id, { id, name: 'Novo membro', username: '', email: '', password: '', whatsapp: '', phone: '', address: '', role: 'membro', city: '', cellId: '', avatarKey: 'dove', note: '', createdAt: new Date().toISOString() });
    };
    const settingsForm = root.querySelector('#settingsForm');
    if (settingsForm) settingsForm.onsubmit = async event => {
      event.preventDefault();
      if (!app.can('settings.identity')) return app.toast('🔒 Somente o administrador pode alterar a identidade do app.');
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
      // Alterar cargo é privilégio exclusivo do administrador.
      if (!app.can('users.role')) {
        select.value = app.getAt('users/' + select.dataset.roleUser + '/role', 'membro');
        return app.toast('🔒 Somente o administrador pode alterar cargos.');
      }
      const target = app.getAt('users/' + select.dataset.roleUser, {}) || {};
      if (app.isAdminEmail(target.email) && select.value !== 'pastor') {
        select.value = 'pastor';
        return app.toast('Este email é administrador fixo do sistema e não pode ser rebaixado.');
      }
      await app.updateAt('users/' + select.dataset.roleUser, { role: select.value });
      app.toast('Cargo atualizado para ' + roleName(select.value) + '.');
    });
    root.querySelectorAll('[data-approve-post]').forEach(btn => btn.onclick = () => app.approvePost(btn.dataset.approvePost, true).catch(error => app.toast(error.message)));
    root.querySelectorAll('[data-reject-post]').forEach(btn => btn.onclick = () => app.approvePost(btn.dataset.rejectPost, false).catch(error => app.toast(error.message)));
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
    const resetFirebase = root.querySelector('#resetFirebase');
    if (resetFirebase) resetFirebase.onclick = () => {
      window.ImperioFirebase.saveConfig({
        apiKey: 'AIzaSyBtz2E3I3YLV1X72Xxy1EUrahiaQZmPiCs',
        authDomain: 'imperio-28408.firebaseapp.com',
        databaseURL: 'https://imperio-28408-default-rtdb.firebaseio.com',
        projectId: 'imperio-28408',
        storageBucket: 'imperio-28408.firebasestorage.app',
        messagingSenderId: '20222357769',
        appId: '1:20222357769:web:59d1e33de346efa6b6e3d8'
      });
      app.toast('Configuração padrão imperio-28408 restaurada. Recarregando...');
      setTimeout(()=>location.reload(), 900);
    };

    bindTemas();
    bindPixTab();
    bindIaTab();
    bindPaginas();
    bindMensagens();
    bindSeguranca();
    bindReveal();
  }

  function bindReveal() {
    root.querySelectorAll('[data-reveal]').forEach(btn => btn.onclick = () => {
      const input = btn.parentElement.querySelector('input');
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? '👁️' : '🙈';
    });
  }

  function bindTemas() {
    root.querySelectorAll('[data-set-palette]').forEach(card => card.onclick = async () => {
      const id = card.dataset.setPalette;
      await app.updateAt('settings', { palette: id });
      // Aplica no painel imediatamente e limpa a preferência individual para ver o tema oficial.
      app.setPalette(id === 'custom' ? app.activePaletteId() : id, false);
      app.applyTheme();
      app.toast(`Tema "${id}" ativado no aplicativo inteiro (site, admin e logo).`);
    });

    const optionsForm = root.querySelector('#themeOptionsForm');
    if (optionsForm) optionsForm.onsubmit = async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(optionsForm).entries());
      await app.updateAt('settings', {
        allowUserPalette: optionsForm.querySelector('[name="allowUserPalette"]').checked,
        defaultMode: data.defaultMode,
        logoPath: data.logoPath || ''
      });
      app.applyTheme();
      app.toast('Opções de tema salvas.');
    };

    const shareForm = root.querySelector('#shareForm');
    if (shareForm) shareForm.onsubmit = async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(shareForm).entries());
      await app.updateAt('settings/share', {
        enabled: shareForm.querySelector('[name="enabled"]').checked,
        useLogoFallback: shareForm.querySelector('[name="useLogoFallback"]').checked,
        defaultImage: data.defaultImage || '',
        signature: data.signature || '',
        hashtags: data.hashtags || ''
      });
      app.toast('Configuração de compartilhamento salva.');
    };
  }

  function bindPixTab() {
    const form = root.querySelector('#pixConfigForm');
    if (form) form.onsubmit = async event => {
      event.preventDefault();
      // Pix é a área mais sensível do app: apenas o administrador grava.
      if (!app.can('integrations.pix')) return app.toast('🔒 Somente o administrador pode alterar a chave Pix.');
      const data = Object.fromEntries(new FormData(form).entries());
      const parseList = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);
      await app.updateAt('integrations/pix', {
        enabled: form.querySelector('[name="enabled"]').checked,
        pixKey: String(data.pixKey || '').trim(),
        keyType: data.keyType,
        receiverName: String(data.receiverName || '').toUpperCase(),
        city: String(data.city || '').toUpperCase(),
        provider: data.provider,
        minAmount: Number(data.minAmount || 5),
        maxAmount: Number(data.maxAmount || 0),
        suggestedAmounts: parseList(data.suggestedAmounts).map(Number).filter(value => value > 0),
        purposes: parseList(data.purposes),
        message: data.message || '',
        thanksMessage: data.thanksMessage || '',
        showHistory: form.querySelector('[name="showHistory"]').checked
      });
      app.toast('Configuração Pix salva. A página de doação já está usando esta chave.');
    };

    const mpForm = root.querySelector('#mpConfigForm');
    if (mpForm) mpForm.onsubmit = async event => {
      event.preventDefault();
      if (!app.can('integrations.pix')) return app.toast('🔒 Somente o administrador pode alterar os dados de recebimento.');
      const data = Object.fromEntries(new FormData(mpForm).entries());
      await app.updateAt('integrations/pix', {
        checkoutLink: String(data.checkoutLink || '').trim(),
        mercadoPagoPublicKey: String(data.mercadoPagoPublicKey || '').trim(),
        mercadoPagoAccessToken: String(data.mercadoPagoAccessToken || '').trim()
      });
      app.toast('Dados do Mercado Pago salvos.');
    };

    const testBtn = root.querySelector('#pixTestBtn');
    if (testBtn) testBtn.onclick = () => {
      const box = root.querySelector('#pixTestBox');
      box.hidden = false;
      try {
        const payload = window.ImperioPix.buildPayload({ amount: 10, txid: 'TESTE' });
        box.innerHTML = `<h3>✅ QR Code de teste (R$ 10,00)</h3><div id="pixTestQr" class="pix-qr"></div><textarea class="pix-payload" readonly rows="3">${e(payload)}</textarea><p class="muted">Leia com o app do seu banco para conferir se o recebedor está correto. <strong>Não confirme o pagamento.</strong></p>`;
        window.ImperioPix.renderQr(root.querySelector('#pixTestQr'), payload, { size: 220, logoSrc: app.logoPath() });
      } catch (error) {
        box.innerHTML = `<p class="notice danger">${e(error.message)}</p>`;
      }
    };

    root.querySelectorAll('[data-confirm-donation]').forEach(btn => btn.onclick = async () => {
      await window.ImperioPix.confirmDonation(btn.dataset.confirmDonation);
      app.toast('Contribuição confirmada.');
    });

    const exportBtn = root.querySelector('#exportDonations');
    if (exportBtn) exportBtn.onclick = () => {
      const rows = [['Data', 'Doador', 'Valor', 'Finalidade', 'Status', 'Mensagem']];
      list('donations').sort(app.byDateDesc).forEach(item => rows.push([
        item.createdAt || '', item.donorName || '', Number(item.amount || 0).toFixed(2), item.purpose || '', item.status || '', String(item.message || '').replace(/[\r\n;]/g, ' ')
      ]));
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'contribuicoes-imperial-batista.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    };
  }

  function bindIaTab() {
    const form = root.querySelector('#aiConfigForm');
    if (form) form.onsubmit = async event => {
      event.preventDefault();
      if (!app.can('integrations.ai')) return app.toast('🔒 Somente o administrador pode alterar a configuração da IA.');
      const data = Object.fromEntries(new FormData(form).entries());
      await app.updateAt('integrations/ai', {
        enabled: form.querySelector('[name="enabled"]').checked,
        apiKey: String(data.apiKey || '').trim(),
        endpoint: String(data.endpoint || '').trim(),
        model: data.model,
        temperature: Number(data.temperature || 0.7),
        maxTokens: Number(data.maxTokens || 700),
        dailyLimitPerUser: Number(data.dailyLimitPerUser || 0),
        saveHistory: form.querySelector('[name="saveHistory"]').checked,
        systemPrompt: data.systemPrompt || ''
      });
      app.toast('Configuração da IA salva no banco de dados.');
    };

    const testBtn = root.querySelector('#aiTestBtn');
    if (testBtn) testBtn.onclick = async () => {
      const box = root.querySelector('#aiTestBox');
      box.hidden = false;
      box.innerHTML = '<div class="ai-loading"><span class="spinner"></span> Conectando ao DeepSeek...</div>';
      testBtn.disabled = true;
      try {
        const answer = await window.ImperioAI.testConnection();
        box.innerHTML = `<h3>✅ Conexão OK</h3><blockquote>${e(answer.verse)}</blockquote><p class="muted"><strong>${e(answer.reference)}</strong> • tema: ${e(answer.theme)}</p><p>${e(answer.message)}</p>`;
      } catch (error) {
        box.innerHTML = `<h3>⚠️ Não conectou</h3><p class="notice danger">${e(error.message)}</p><p class="muted">O app continuará respondendo com a biblioteca local de versículos, então nenhum membro fica sem resposta.</p>`;
      } finally {
        testBtn.disabled = false;
      }
    };

    const clearBtn = root.querySelector('#clearAiHistory');
    if (clearBtn) clearBtn.onclick = async () => {
      if (!confirm('Apagar todo o histórico de consultas da IA?')) return;
      await app.setAt('aiVerses', {});
      app.toast('Histórico apagado.');
    };
  }

  function bindPaginas() {
    const newBtn = root.querySelector('#newCustomPage');
    if (newBtn) newBtn.onclick = () => {
      const id = idFor('page');
      openRichEditor('customPages/' + id, { id, slug: 'sobre', title: 'Nova página', content: '', visible: true, order: 10 });
    };
    root.querySelectorAll('[data-edit-page]').forEach(btn => btn.onclick = () => {
      const id = btn.dataset.editPage;
      openRichEditor('customPages/' + id, app.getAt('customPages/' + id, {}));
    });
  }

  function bindMensagens() {
    root.querySelectorAll('[data-mark-read]').forEach(btn => btn.onclick = async () => {
      await app.updateAt('messages/' + btn.dataset.markRead, { status: 'lida' });
      app.toast('Mensagem marcada como lida.');
    });
    root.querySelectorAll('[data-toggle-public]').forEach(btn => btn.onclick = async () => {
      const id = btn.dataset.togglePublic;
      const current = app.getAt('prayerRequests/' + id + '/public', false);
      await app.updateAt('prayerRequests/' + id, { public: !current });
      app.toast(current ? 'Pedido tornado privado.' : 'Pedido publicado no mural.');
    });
  }

  function bindSeguranca() {
    const form = root.querySelector('#adminPasswordForm');
    if (form) form.onsubmit = async event => {
      event.preventDefault();
      if (!app.can('security.manage')) return app.toast('🔒 Área exclusiva do administrador.');
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.password !== data.confirmPassword) return app.toast('As senhas não conferem.');
      const strength = app.validateStrongPassword(data.password);
      if (!strength.valid) return app.toast(strength.message);
      const security = window.ImperioSecurity;
      await app.updateAt('users/pastor_demo', {
        email: String(data.email || '').trim().toLowerCase(),
        username: String(data.username || '').trim(),
        passwordHash: security.hashPassword(data.password),
        password: null,
        updatedAt: new Date().toISOString()
      });
      form.reset();
      app.toast('Credenciais do administrador atualizadas com segurança.');
    };

    const hashBtn = root.querySelector('#hashAllPasswords');
    if (hashBtn) hashBtn.onclick = async () => {
      const security = window.ImperioSecurity;
      const users = list('users').filter(item => item.password);
      for (const user of users) {
        await app.updateAt('users/' + user.id, {
          passwordHash: security.isHashed(user.password) ? user.password : security.hashPassword(user.password),
          password: null
        });
      }
      app.toast(`${users.length} senha(s) convertida(s) em hash.`);
    };

    const resetBtn = root.querySelector('#resetSessions');
    if (resetBtn) resetBtn.onclick = () => {
      localStorage.removeItem('imperioSession');
      app.toast('Sessão local encerrada.');
      setTimeout(() => location.reload(), 800);
    };
  }

  /** Editor completo (rich text) para conteúdos longos do painel. */
  function openRichEditor(path, value) {
    const dialog = document.getElementById('formDialog');
    const item = Object.assign({}, value || {});
    dialog.innerHTML = `<form method="dialog" class="modal-card wide">
      <button class="modal-close" value="cancel" aria-label="Fechar">×</button>
      <h2>Editar conteúdo</h2>
      <div class="form-grid">
        <label>Título<input id="reTitle" value="${e(item.title || '')}"></label>
        <label>Identificador (slug)<input id="reSlug" value="${e(item.slug || '')}"></label>
        <label>Ordem<input id="reOrder" type="number" value="${e(item.order || 10)}"></label>
        <label class="checkbox-line"><input id="reVisible" type="checkbox" ${item.visible !== false ? 'checked' : ''}><span>Visível no app</span></label>
        <label class="full">Conteúdo
          <textarea id="reContent" data-rich-editor data-min-height="320">${e(item.content || '')}</textarea>
        </label>
      </div>
      <div class="row gap wrap">
        <button class="btn primary" id="reSave" type="button">Salvar</button>
        <button class="btn ghost" value="cancel">Cancelar</button>
      </div>
    </form>`;
    dialog.showModal();
    if (window.ImperioEditor) window.ImperioEditor.attachAll(dialog);
    document.getElementById('reSave').onclick = async () => {
      const payload = Object.assign({}, item, {
        title: document.getElementById('reTitle').value,
        slug: document.getElementById('reSlug').value,
        order: Number(document.getElementById('reOrder').value || 10),
        visible: document.getElementById('reVisible').checked,
        content: window.ImperioEditor ? window.ImperioEditor.sanitizeHtml(document.getElementById('reContent').value) : document.getElementById('reContent').value,
        updatedAt: new Date().toISOString()
      });
      await app.setAt(path, payload);
      dialog.close();
      app.toast('Conteúdo salvo.');
    };
  }

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

  document.getElementById('adminAuthForm').onsubmit = async event => {
    event.preventDefault();
    try {
      await app.signInEmail(document.getElementById('adminAuthIdentifier').value.trim(), document.getElementById('adminAuthPassword').value);
      authModal.close();
    } catch (error) { app.toast(error.message || 'Falha no login.'); }
  };
  document.getElementById('adminGoogleLogin').onclick = async () => {
    try { await app.signInGoogle(); authModal.close(); } catch (error) { app.toast(error.message || 'Falha no Google.'); }
  };
  themeBtn.onclick = () => { app.toggleTheme(); render(); };

  const paletteBtn = document.getElementById('adminPaletteToggle');
  const paletteMenu = document.getElementById('paletteMenu');
  if (paletteBtn && paletteMenu) {
    paletteBtn.onclick = event => {
      event.stopPropagation();
      paletteMenu.innerHTML = `<div class="palette-menu-head">Visualizar painel em</div>${app.paletteList().map(palette => `<button type="button" class="palette-option ${app.activePaletteId() === palette.id ? 'active' : ''}" data-palette="${e(palette.id)}"><img src="${e(palette.logo)}" alt=""><span><strong>${e(palette.name)}</strong></span></button>`).join('')}<div class="palette-menu-foot"><small class="muted">Para mudar o tema oficial do app inteiro, use a aba <strong>Temas</strong>.</small></div>`;
      paletteMenu.querySelectorAll('[data-palette]').forEach(btn => btn.onclick = () => {
        app.setPalette(btn.dataset.palette, true);
        paletteMenu.hidden = true;
        render();
      });
      paletteMenu.hidden = !paletteMenu.hidden;
    };
    document.addEventListener('click', event => {
      if (!paletteMenu.hidden && !paletteMenu.contains(event.target) && event.target !== paletteBtn) paletteMenu.hidden = true;
    });
  }

  app.on('data', render);
  app.on('auth', render);
  app.on('theme', render);
  app.on('palette', render);
  app.init().then(render);
})();
