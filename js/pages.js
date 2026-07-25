(function () {
  'use strict';

  const app = window.Imperio;

  function pageDoc(doc) {
    return {
      doc,
      root: doc.getElementById('page-root'),
      e: app.escapeHtml,
      list: name => app.asArray(app.getAt(name, {})),
      user: () => app.state.user,
      settings: () => app.getAt('settings', {})
    };
  }

  function postMessage(action, payload) {
    window.postMessage(Object.assign({ source: 'imperio-page', action }, payload || {}), '*');
  }

  function loginCard(e) {
    return `<div class="card highlight"><h2>Entre para continuar</h2><p class="muted">Faça login para acessar presença, perfil, quiz e célula.</p><button class="btn primary" data-login="1">Entrar ou criar conta</button></div>`;
  }

  function visible(items) { return items.filter(item => item.visible !== false && item.status !== 'rejected'); }
  function statusLabel(status) {
    const map = { approved: 'Aprovado', pending: 'Pendente', rejected: 'Recusado' };
    return `<span class="status ${status || 'approved'}">${map[status] || status || 'Aprovado'}</span>`;
  }

  function shareButtons(e, payload) {
    const title = e(payload.title || 'Igreja Imperial Batista');
    const text = e(payload.text || 'Conheça o app da Igreja Imperial Batista.');
    const url = e(payload.url || app.pageUrl('home'));
    return `<div class="share-grid" aria-label="Compartilhar">
      <button class="btn small" type="button" data-share="whatsapp" data-share-title="${title}" data-share-text="${text}" data-share-url="${url}">WhatsApp</button>
      <button class="btn small" type="button" data-share="facebook" data-share-title="${title}" data-share-text="${text}" data-share-url="${url}">Facebook</button>
      <button class="btn small" type="button" data-share="instagram" data-share-title="${title}" data-share-text="${text}" data-share-url="${url}">Instagram</button>
      <button class="btn small primary" type="button" data-share="native" data-share-title="${title}" data-share-text="${text}" data-share-url="${url}">Compartilhar</button>
    </div>`;
  }

  function renderHome(ctx) {
    const { e, root, settings, list } = ctx;
    const s = settings();
    const news = visible(list('news')).filter(n => (n.status || 'approved') === 'approved').sort(app.byDateDesc).slice(0, 4);
    const announcements = visible(list('announcements')).sort(app.byDateDesc).slice(0, 3);
    const events = visible(list('events')).sort(app.byDateAsc).slice(0, 3);
    const services = visible(list('services')).slice(0, 3);
    root.innerHTML = `
      <div class="page-container">
        <section class="hero">
          <span class="badge">🕊️ ${e(s.slogan || 'Servir, amar e discipular')}</span>
          <h1>${e(s.welcomeTitle || s.churchName)}</h1>
          <p>${e(s.welcomeText || '')}</p>
          <div class="hero-actions">
            <button class="btn accent" data-nav="cultos">Ver próximos cultos</button>
            <button class="btn ghost" data-nav="postar">Enviar testemunho/post</button>
            <button class="btn ghost" data-nav="perfil">Meu perfil</button>
          </div>
        </section>

        <section class="section grid four">
          <div class="card kpi"><div class="icon-bubble">⛪</div><div><strong>${services.length}</strong><span>Cultos ativos</span></div></div>
          <div class="card kpi"><div class="icon-bubble">🏡</div><div><strong>${visible(list('cells')).length}</strong><span>Células</span></div></div>
          <div class="card kpi"><div class="icon-bubble">📅</div><div><strong>${events.length}</strong><span>Eventos próximos</span></div></div>
          <div class="card kpi"><div class="icon-bubble">🧠</div><div><strong>${visible(list('quizzes')).filter(q => q.active !== false).length}</strong><span>Quizzes</span></div></div>
        </section>

        <section class="section">
          <div class="section-head"><div><h2>Notícias da igreja</h2><p class="muted">Palavra, comunhão, avisos e testemunhos aprovados.</p></div><button class="btn small" data-nav="postar">Postar</button></div>
          <div class="grid two">${news.map(n => `<article class="card ${n.featured ? 'highlight' : ''}"><div class="card-title-line"><h3>${e(n.title)}</h3>${n.featured ? '<span class="badge">Destaque</span>' : ''}</div><p class="muted">${e(app.formatDate(n.date || n.createdAt))} • ${e(n.author || 'Igreja')}</p><p>${e(n.summary || n.content || '')}</p></article>`).join('') || '<div class="empty">Nenhuma notícia cadastrada.</div>'}</div>
        </section>

        <section class="section grid two">
          <div>
            <div class="section-head"><h2>Avisos importantes</h2></div>
            <div class="grid">${announcements.map(a => `<div class="card compact"><div class="card-title-line"><h3>${e(a.title)}</h3><span class="status ${a.priority === 'alta' ? 'pending' : ''}">${e(a.priority || 'normal')}</span></div><p>${e(a.text)}</p><p class="muted">${e(app.formatDate(a.date))}</p></div>`).join('') || '<div class="empty">Sem avisos.</div>'}</div>
          </div>
          <div>
            <div class="section-head"><h2>Próximas datas</h2></div>
            <div class="grid">${events.map(ev => `<div class="card compact"><h3>${e(ev.title)}</h3><p>${e(ev.description || '')}</p><p class="muted">📍 ${e(ev.location || '')} • ${e(app.formatDateTime(ev.startsAt))}</p></div>`).join('') || '<div class="empty">Sem eventos.</div>'}</div>
          </div>
        </section>

        <section class="section grid two">
          <div class="card devotional-quote">
            <span class="badge">📖 Versículo do dia</span>
            <h2>${e(app.verseOfDay().reference)}</h2>
            <blockquote>${e(app.verseOfDay().text)}</blockquote>
            <div class="row gap wrap"><button class="btn primary" data-nav="versiculo">Ler e compartilhar</button><button class="btn ghost" data-nav="palavra">Palavra por sentimento</button></div>
          </div>
          <div class="card">
            <span class="badge">🔔 PWA/APK</span>
            <h2>Receba avisos da igreja</h2>
            <p class="muted">Ative notificações para agenda, atividades, cultos e avisos importantes direto no app instalado.</p>
            <button class="btn accent" data-notify="1" type="button">Ativar notificações</button>
          </div>
        </section>
      </div>`;
  }

  function renderCultos(ctx) {
    const { e, root, list } = ctx;
    const services = visible(list('services'));
    root.innerHTML = `<div class="page-container"><div class="section-head"><div><h1>Cultos e celebrações</h1><p class="muted">Horários, temas, presença e quizzes de cada culto.</p></div></div><div class="grid three">${services.map(service => `<article class="card"><span class="badge">${e(service.type || 'Culto')}</span><h2>${e(service.title)}</h2><p class="muted">${e(service.weekday || '')} ${service.time ? 'às ' + e(service.time) : ''}</p><p>${e(service.theme || '')}</p><p class="muted">📍 ${e(service.location || '')}<br>🎙️ ${e(service.preacher || '')}</p><div class="row gap wrap"><button class="btn primary" data-presence="culto" data-id="${e(service.id)}">Marcar presença</button><button class="btn ghost" data-nav="quiz">Responder quiz</button></div></article>`).join('') || '<div class="empty">Nenhum culto cadastrado.</div>'}</div></div>`;
  }

  function renderAgenda(ctx) {
    const { e, root, list } = ctx;
    const events = visible(list('events')).sort(app.byDateAsc);
    const commemorations = list('commemorations').sort(app.byDateAsc);
    root.innerHTML = `<div class="page-container"><section class="hero"><span class="badge">📅 Agenda</span><h1>Datas, eventos e celebrações</h1><p>Planeje sua participação nos cultos, atividades, ceias, encontros e datas comemorativas.</p></section><section class="section grid two"><div><div class="section-head"><h2>Eventos</h2></div><div class="grid">${events.map(ev => `<article class="card"><div class="card-title-line"><h3>${e(ev.title)}</h3><span class="status">${e(ev.category || 'Evento')}</span></div><p>${e(ev.description || '')}</p><p class="muted">${e(app.formatDateTime(ev.startsAt))} • ${e(ev.location || '')}</p></article>`).join('') || '<div class="empty">Agenda vazia.</div>'}</div></div><div><div class="section-head"><h2>Datas comemorativas</h2></div><div class="grid">${commemorations.map(item => `<article class="card compact"><h3>${e(item.title)}</h3><p>${e(item.description || '')}</p><p class="muted">${e(app.formatDate(item.date))}</p></article>`).join('') || '<div class="empty">Sem datas.</div>'}</div></div></section></div>`;
  }

  function renderVersiculo(ctx) {
    const { e, root, list } = ctx;
    const verse = app.verseOfDay();
    const verses = visible(list('devotionalVerses'));
    const title = `Versículo do dia — ${verse.reference || 'Igreja Imperial Batista'}`;
    const shareText = `“${verse.text || ''}” (${verse.reference || ''})`;
    root.innerHTML = `<div class="page-container"><section class="hero"><span class="badge">📖 Versículo do dia</span><h1>${e(verse.reference || 'Palavra de Deus')}</h1><p>${e(verse.theme || 'Devocional diário')}</p></section><section class="section grid two"><article class="card devotional-quote highlight"><span class="badge">${e(verse.theme || 'Devocional')}</span><blockquote>${e(verse.text || '')}</blockquote><p class="muted">${e(verse.reference || '')}</p>${shareButtons(e, { title, text: shareText, url: app.pageUrl('versiculo') })}</article><article class="card"><h2>Compartilhe esperança</h2><p class="muted">Envie o versículo para WhatsApp, Facebook, Instagram ou use o compartilhamento nativo do celular.</p><button class="btn primary" data-nav="palavra">Receber palavra por sentimento</button></article></section><section class="section"><div class="section-head"><div><h2>Outros versículos</h2><p class="muted">Lista editável pelo painel administrativo.</p></div></div><div class="grid three">${verses.map(item => `<article class="card compact"><span class="badge">${e(item.theme || 'Versículo')}</span><h3>${e(item.reference)}</h3><p>${e(item.text)}</p></article>`).join('') || '<div class="empty">Nenhum versículo cadastrado.</div>'}</div></section></div>`;
  }

  function renderPalavra(ctx) {
    const { e, root, list, user } = ctx;
    const words = visible(list('feelingWords'));
    const me = user();
    root.innerHTML = `<div class="page-container"><section class="hero"><span class="badge">🙏 Palavra por sentimento</span><h1>Receba cuidado pela Palavra</h1><p>Escolha uma mensagem pastoral conforme seu momento e envie pedidos de oração para a liderança.</p></section><section class="section"><div class="section-head"><div><h2>Como você está hoje?</h2><p class="muted">Mensagens devocionais editáveis no painel administrativo.</p></div></div><div class="grid three">${words.map(word => {
      const shareText = `${word.title || word.feeling}: ${word.text || ''} ${word.verse ? '(' + word.verse + ')' : ''}`;
      return `<article class="card feeling-card"><div class="icon-bubble">${e(word.icon || '🙏')}</div><span class="badge">${e(word.feeling || 'Sentimento')}</span><h2>${e(word.title || '')}</h2><p>${e(word.text || '')}</p><p class="muted">📖 ${e(word.verse || '')}<br>🙏 ${e(word.prayer || '')}</p>${shareButtons(e, { title: word.title || 'Palavra da Igreja Imperial Batista', text: shareText, url: app.pageUrl('palavra') })}</article>`;
    }).join('') || '<div class="empty">Nenhuma palavra cadastrada.</div>'}</div></section><section class="section card"><div class="section-head"><div><h2>Pedido de oração</h2><p class="muted">Compartilhe seu pedido. A liderança poderá acompanhar pelo painel administrativo.</p></div></div><form id="prayerForm" class="form-grid"><label>Nome<input name="authorName" value="${e(me ? me.name : '')}" placeholder="Seu nome ou anônimo"></label><label>Contato opcional<input name="contact" value="${e(me ? (me.whatsapp || me.email || '') : '')}" placeholder="WhatsApp ou email"></label><label>Sentimento<select name="feeling"><option value="">Escolha...</option>${words.map(word => `<option value="${e(word.feeling || word.id)}">${e(word.icon || '🙏')} ${e(word.feeling || word.id)}</option>`).join('')}</select></label><label class="full">Pedido<textarea name="text" required placeholder="Escreva seu pedido de oração..."></textarea></label><div class="full"><button class="btn primary" type="submit">Enviar pedido de oração</button></div></form></section></div>`;
  }

  function renderAtividades(ctx) {
    const { e, root, list } = ctx;
    const activities = visible(list('activities'));
    const posts = list('posts').filter(p => p.status === 'approved').sort(app.byDateDesc).slice(0, 6);
    root.innerHTML = `<div class="page-container"><section class="hero"><span class="badge">🤝 Ministérios</span><h1>Atividades para servir com alegria</h1><p>Participe dos ministérios, ações sociais, louvor, missões e comunhão da igreja.</p></section><section class="section"><div class="section-head"><h2>Ministérios e atividades</h2><button class="btn small" data-nav="postar">Compartilhar notícia</button></div><div class="grid three">${activities.map(a => `<article class="card"><div class="icon-bubble">🤲</div><h3>${e(a.title)}</h3><p>${e(a.description || '')}</p><p class="muted">Líder: ${e(a.leader || 'A definir')}<br>Agenda: ${e(a.schedule || 'A definir')}</p></article>`).join('') || '<div class="empty">Sem atividades.</div>'}</div></section><section class="section"><div class="section-head"><h2>Posts aprovados</h2></div><div class="grid two">${posts.map(p => `<article class="card"><div class="card-title-line"><h3>${e(p.title)}</h3><span class="status approved">${e(p.category || 'Post')}</span></div><p>${e(p.content)}</p><p class="muted">Por ${e(p.authorName || 'Membro')} • ${e(app.formatDate(p.createdAt))}</p></article>`).join('') || '<div class="empty">Nenhum post aprovado ainda.</div>'}</div></section></div>`;
  }

  function renderCelula(ctx) {
    const { e, root, list, user } = ctx;
    const me = user();
    const cells = visible(list('cells'));
    const users = list('users');
    root.innerHTML = `<div class="page-container"><section class="hero"><span class="badge">🏡 Pequenos grupos</span><h1>Células de comunhão e discipulado</h1><p>Cada célula possui líder, membros, presença e estudos próprios.</p></section>${!me ? `<section class="section">${loginCard(e)}</section>` : ''}<section class="section grid two">${cells.map(cell => {
      const members = users.filter(u => u.cellId === cell.id);
      const isLeader = me && (me.id === cell.leaderId || app.hasRole('pastor'));
      return `<article class="card"><div class="card-title-line"><div><span class="badge">${e(cell.weekday || '')} ${e(cell.time || '')}</span><h2>${e(cell.name)}</h2></div><span class="status">${members.length} membros</span></div><p>${e(cell.description || '')}</p><p class="muted">Líder: ${e(cell.leaderName || 'A definir')}<br>📍 ${e(cell.address || '')} — ${e(cell.neighborhood || '')}</p><div class="row gap wrap"><button class="btn primary" data-presence="celula" data-id="${e(cell.id)}">Marcar presença</button><button class="btn ghost" data-nav="quiz">Quiz da célula</button></div>${isLeader ? `<div class="section"><h3>Membros da célula</h3><div class="grid">${members.map(m => `<div class="card compact row gap"><span>${app.avatarMarkup(m, 'avatar-sm')}</span><div><strong>${e(m.name)}</strong><p class="muted">${e(m.whatsapp || m.email || '')}</p></div></div>`).join('') || '<p class="muted">Sem membros vinculados.</p>'}</div></div>` : ''}</article>`;
    }).join('') || '<div class="empty">Nenhuma célula cadastrada.</div>'}</section></div>`;
  }

  function renderMembros(ctx) {
    const { e, root, list } = ctx;
    if (!app.hasRole('lider')) {
      root.innerHTML = `<div class="page-container">${loginCard(e)}<div class="empty section">A lista de membros é liberada para líderes e pastores.</div></div>`;
      return;
    }
    const users = list('users').sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const cells = app.getAt('cells', {});
    root.innerHTML = `<div class="page-container"><div class="section-head"><div><h1>Membros</h1><p class="muted">Cadastro, contatos, cargos e vínculo com células.</p></div></div><div class="grid three">${users.map(u => `<article class="card"><div class="row gap"><span>${app.avatarMarkup(u)}</span><div><h3>${e(u.name)}</h3><p class="muted">${e(u.email || '')}</p></div></div><p><span class="status">${e(u.role || 'membro')}</span></p><p class="muted">WhatsApp: ${e(u.whatsapp || '-')}<br>Cidade: ${e(u.city || '-')}<br>Célula: ${e(cells[u.cellId] ? cells[u.cellId].name : '-')}</p></article>`).join('')}</div></div>`;
  }

  function renderPerfil(ctx) {
    const { e, root, user, list } = ctx;
    const me = user();
    if (!me) { root.innerHTML = `<div class="page-container">${loginCard(e)}</div>`; return; }
    const stats = app.statsForUser(me.id);
    const cells = list('cells');
    const avatarButtons = Object.keys(app.avatarMap).map(key => `<button class="avatar-option ${me.avatarKey === key ? 'active' : ''}" type="button" data-avatar="${e(key)}"><span class="avatar row center" style="font-size:2rem">${app.avatarMap[key]}</span></button>`).join('');
    root.innerHTML = `<div class="page-container"><section class="card highlight"><div class="row gap wrap between"><div class="row gap"><span>${app.avatarMarkup(me, 'large')}</span><div><h1>${e(me.name)}</h1><p class="muted">${e(me.email || '')}</p><span class="status approved">${e(me.role || 'membro')}</span></div></div><button class="btn ghost" data-logout="1">Sair</button></div></section><section class="section grid four"><div class="card kpi"><div class="icon-bubble">⛪</div><div><strong>${stats.presence}</strong><span>presenças em cultos</span></div></div><div class="card kpi"><div class="icon-bubble">🏡</div><div><strong>${stats.cellPresence}</strong><span>presenças em células</span></div></div><div class="card kpi"><div class="icon-bubble">🧠</div><div><strong>${stats.quizzes}</strong><span>quizzes feitos</span></div></div><div class="card kpi"><div class="icon-bubble">✅</div><div><strong>${stats.quizPercent}%</strong><span>acertos</span></div></div></section><section class="section card"><h2>Meus dados</h2><form id="profileForm" class="form-grid"><label>Nome<input name="name" value="${e(me.name || '')}" required></label><label>Nome de usuário<input name="username" value="${e(me.username || '')}"></label><label>Email<input name="email" type="email" value="${e(me.email || '')}"></label><label>WhatsApp<input name="whatsapp" value="${e(me.whatsapp || '')}"></label><label>Telefone<input name="phone" value="${e(me.phone || '')}"></label><label>Cidade<input name="city" value="${e(me.city || '')}"></label><label class="full">Endereço<input name="address" value="${e(me.address || '')}"></label><label>Célula<select name="cellId"><option value="">Sem célula</option>${cells.map(c => `<option value="${e(c.id)}" ${me.cellId === c.id ? 'selected' : ''}>${e(c.name)}</option>`).join('')}</select></label><label>Cargo<input value="${e(me.role || 'membro')}" disabled></label><div class="full"><h3>Avatar do site</h3><div class="row gap wrap">${avatarButtons}</div><input type="hidden" name="avatarKey" value="${e(me.avatarKey || 'dove')}"></div><div class="full"><button class="btn primary" type="submit">Salvar perfil</button></div></form></section></div>`;
  }

  function renderPostar(ctx) {
    const { e, root, user } = ctx;
    const me = user();
    if (!me) { root.innerHTML = `<div class="page-container">${loginCard(e)}</div>`; return; }
    root.innerHTML = `<div class="page-container"><section class="hero"><span class="badge">✍️ Participação</span><h1>Enviar post, notícia ou testemunho</h1><p>Posts de membros ficam pendentes até aprovação de líder ou pastor.</p></section><section class="section card"><form id="postForm" class="form-grid"><label>Título<input name="title" required maxlength="90" placeholder="Ex: Testemunho de gratidão"></label><label>Categoria<select name="category"><option>Testemunho</option><option>Notícia</option><option>Pedido de oração</option><option>Atividade</option><option>Geral</option></select></label><label class="full">Conteúdo<textarea name="content" required placeholder="Escreva sua mensagem..."></textarea></label><div class="full"><button class="btn primary" type="submit">Enviar para aprovação</button></div></form></section></div>`;
  }

  function renderQuiz(ctx) {
    const { e, root, list, user } = ctx;
    const me = user();
    if (!me) { root.innerHTML = `<div class="page-container">${loginCard(e)}</div>`; return; }
    const quizzes = visible(list('quizzes')).filter(q => q.active !== false);
    root.innerHTML = `<div class="page-container"><div class="section-head"><div><h1>Quizzes bíblicos</h1><p class="muted">Pastores e líderes podem criar quizzes para cultos e células.</p></div></div><div class="grid two">${quizzes.map(q => `<article class="card quiz-card" data-quiz="${e(q.id)}"><div class="card-title-line"><h2>${e(q.title)}</h2><span class="status">${e(q.scope || 'geral')}</span></div><p class="muted">${(q.questions || []).length} perguntas</p><div class="quiz-content">${(q.questions || []).map((question, qi) => `<div class="section"><h3>${qi + 1}. ${e(question.text)}</h3><div class="grid">${(question.options || []).map((opt, oi) => `<button class="btn quiz-option" type="button" data-quiz-option="${qi}" data-value="${oi}">${e(opt)}</button>`).join('')}</div></div>`).join('')}</div><button class="btn primary" data-submit-quiz="${e(q.id)}">Enviar respostas</button></article>`).join('') || '<div class="empty">Nenhum quiz ativo.</div>'}</div></div>`;
  }

  const renderers = { home: renderHome, cultos: renderCultos, agenda: renderAgenda, versiculo: renderVersiculo, palavra: renderPalavra, atividades: renderAtividades, celula: renderCelula, membros: renderMembros, perfil: renderPerfil, postar: renderPostar, quiz: renderQuiz };

  function bindCommon(ctx, page) {
    const { doc, root } = ctx;
    root.onclick = async event => {
      const nav = event.target.closest('[data-nav]');
      if (nav) return postMessage('navigate', { page: nav.dataset.nav });
      if (event.target.closest('[data-login]')) return postMessage('login');
      if (event.target.closest('[data-notify]')) return app.requestNotifications().then(() => app.checkDueNotifications(true));
      const share = event.target.closest('[data-share]');
      if (share) {
        return app.shareContent({ title: share.dataset.shareTitle, text: share.dataset.shareText, url: share.dataset.shareUrl }, share.dataset.share).catch(error => app.toast(error.message || 'Não foi possível compartilhar.'));
      }
      if (event.target.closest('[data-logout]')) return app.signOut();
      const presence = event.target.closest('[data-presence]');
      if (presence) {
        try { await app.markPresence(presence.dataset.presence, presence.dataset.id); } catch (error) { app.toast(error.message); postMessage('login'); }
      }
      const avatar = event.target.closest('[data-avatar]');
      if (avatar) {
        doc.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('active'));
        avatar.classList.add('active');
        const input = doc.querySelector('input[name="avatarKey"]');
        if (input) input.value = avatar.dataset.avatar;
      }
      const option = event.target.closest('[data-quiz-option]');
      if (option) {
        const qIndex = option.dataset.quizOption;
        const card = option.closest('.quiz-card');
        card.querySelectorAll(`[data-quiz-option="${qIndex}"]`).forEach(btn => btn.classList.remove('selected'));
        option.classList.add('selected');
      }
      const submitQuiz = event.target.closest('[data-submit-quiz]');
      if (submitQuiz) {
        const card = submitQuiz.closest('.quiz-card');
        const answers = [];
        card.querySelectorAll('.quiz-content .section').forEach((section, index) => {
          const selected = section.querySelector('.quiz-option.selected');
          answers[index] = selected ? Number(selected.dataset.value) : -1;
        });
        try { await app.saveQuizResult(submitQuiz.dataset.submitQuiz, answers); renderers.quiz(ctx); bindCommon(ctx, page); } catch (error) { app.toast(error.message); }
      }
    };

    const profileForm = doc.getElementById('profileForm');
    if (profileForm) profileForm.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(profileForm).entries());
      try { await app.updateProfile(values); } catch (error) { app.toast(error.message); }
    };

    const postForm = doc.getElementById('postForm');
    if (postForm) postForm.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(postForm).entries());
      try { await app.submitPost(values); postForm.reset(); } catch (error) { app.toast(error.message); }
    };

    const prayerForm = doc.getElementById('prayerForm');
    if (prayerForm) prayerForm.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(prayerForm).entries());
      try { await app.submitPrayerRequest(values); prayerForm.reset(); } catch (error) { app.toast(error.message); }
    };
  }

  function renderEmbeddedPage(page, doc) {
    const ctx = pageDoc(doc);
    const renderer = renderers[page] || renderers.home;
    renderer(ctx);
    bindCommon(ctx, page);
  }

  window.Imperio.renderEmbeddedPage = renderEmbeddedPage;
})();
