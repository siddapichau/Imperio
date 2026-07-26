(function () {
  'use strict';

  const app = window.Imperio;

  function pageDoc(doc, page) {
    return {
      doc,
      page,
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

  /**
   * Botões de compartilhamento. Sempre levam uma imagem junto:
   * a imagem principal do post quando existir, senão a logo do tema ativo.
   */
  function shareButtons(e, payload) {
    const settings = app.getAt('settings/share', {});
    if (settings.enabled === false) return '';
    const title = e(payload.title || app.getAt('settings/churchName', 'Igreja Imperial Batista'));
    const text = e(payload.text || 'Conheça o app da Igreja Imperial Batista.');
    const url = e(payload.url || app.pageUrl('home'));
    const image = e(payload.image || '');
    const data = `data-share-title="${title}" data-share-text="${text}" data-share-url="${url}" data-share-image="${image}"`;
    const preview = image || app.logoPath();
    return `<div class="share-block">
      <div class="share-preview" aria-hidden="true">
        <img src="${e(preview)}" alt="" loading="lazy">
        <div><strong>${title}</strong><small>${image ? 'Vai com a imagem do post' : 'Vai com a logo do app'}</small></div>
      </div>
      <div class="share-grid" aria-label="Compartilhar">
        <button class="btn small primary" type="button" data-share="native" ${data}>📤 Compartilhar</button>
        <button class="btn small" type="button" data-share="whatsapp" ${data}>WhatsApp</button>
        <button class="btn small" type="button" data-share="instagram" ${data}>Instagram</button>
        <button class="btn small" type="button" data-share="facebook" ${data}>Facebook</button>
        <button class="btn small" type="button" data-share="telegram" ${data}>Telegram</button>
        <button class="btn small ghost" type="button" data-share="copy" ${data}>🔗 Copiar</button>
      </div>
    </div>`;
  }

  /** Renderiza conteúdo rico (HTML do editor) já higienizado. */
  function richContent(html) {
    if (!html) return '';
    const editor = window.ImperioEditor;
    const safe = editor ? editor.sanitizeHtml(html) : app.escapeHtml(html);
    return `<div class="rich-content">${safe}</div>`;
  }

  /** Descobre a imagem principal de um item (campo image ou primeira imagem do conteúdo). */
  function mainImage(item) {
    if (!item) return '';
    if (item.image) return item.image;
    const editor = window.ImperioEditor;
    return editor ? editor.firstImage(item.content || '') : '';
  }

  function summaryOf(item, size) {
    if (item.summary) return item.summary;
    const editor = window.ImperioEditor;
    return editor ? editor.excerpt(item.content || '', size || 180) : String(item.content || '').slice(0, size || 180);
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
          <div class="grid two">${news.map(n => {
            const image = mainImage(n);
            return `<article class="card news-card ${n.featured ? 'highlight' : ''}">${image ? `<img class="card-cover" src="${e(image)}" alt="${e(n.title)}" loading="lazy">` : ''}<div class="card-title-line"><h3>${e(n.title)}</h3>${n.featured ? '<span class="badge">Destaque</span>' : ''}</div><p class="muted">${e(app.formatDate(n.date || n.createdAt))} • ${e(n.author || 'Igreja')}</p><p>${e(summaryOf(n))}</p><div class="row gap wrap"><button class="btn small ghost" data-open-item="news:${e(n.id)}">Ler mais</button><button class="btn small ghost" data-share="native" data-share-title="${e(n.title)}" data-share-text="${e(summaryOf(n, 140))}" data-share-url="${e(app.pageUrl('home'))}" data-share-image="${e(image)}">📤</button></div></article>`;
          }).join('') || '<div class="empty">Nenhuma notícia cadastrada.</div>'}</div>
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
          <div class="card ai-card">
            <span class="badge">✨ Versículo com IA</span>
            <h2>Como você está se sentindo?</h2>
            <p class="muted">Escreva o que você sente ou pensa agora e a nossa IA traz um versículo que fala com esse momento.</p>
            <form id="homeAiForm" class="ai-quick">
              <input name="feeling" placeholder="Ex: estou ansioso com o trabalho..." maxlength="300" required>
              <button class="btn accent" type="submit">Buscar palavra</button>
            </form>
            <div id="homeAiResult" class="ai-result" hidden></div>
          </div>
        </section>

        <section class="section grid two">
          <div class="card give-card">
            <span class="badge">💝 Contribua</span>
            <h2>Dízimos e ofertas por Pix</h2>
            <p class="muted">${e(app.getAt('integrations/pix/message', 'Contribua com a obra de Deus de forma rápida e segura por QR Code Pix.'))}</p>
            <button class="btn primary" data-nav="dizimo">Ofertar agora</button>
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
    const themes = [...new Set(verses.map(item => item.theme).filter(Boolean))];
    const aiOn = window.ImperioAI && window.ImperioAI.isEnabled();
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">📖 Versículo do dia</span>
        <h1>${e(verse.reference || 'Palavra de Deus')}</h1>
        <p>${e(verse.theme || 'Devocional diário')}</p>
      </section>

      <section class="section card ai-panel" id="aiPanel">
        <div class="section-head">
          <div>
            <span class="badge">✨ Palavra com IA${aiOn ? '' : ' (modo offline)'}</span>
            <h2>Diga o que você sente ou pensa agora</h2>
            <p class="muted">Escreva com suas palavras. A IA encontra um versículo que fala exatamente com este momento, com uma aplicação pastoral e uma oração.</p>
          </div>
        </div>
        <form id="aiVerseForm" class="ai-form">
          <label class="full">O que está no seu coração?
            <textarea name="feeling" rows="3" maxlength="500" required placeholder="Ex: estou ansioso com uma decisão no trabalho e sem saber que caminho seguir..."></textarea>
          </label>
          <div class="ai-suggestions" aria-label="Sugestões rápidas">
            ${['Estou ansioso', 'Preciso de força', 'Sou grato hoje', 'Estou triste', 'Preciso de direção', 'Estou cansado'].map(item => `<button type="button" class="chip ai-chip" data-ai-suggestion="${e(item)}">${e(item)}</button>`).join('')}
          </div>
          <div class="row gap wrap">
            <button class="btn primary" type="submit" id="aiSubmit">✨ Receber versículo</button>
            <button class="btn ghost" type="reset">Limpar</button>
          </div>
        </form>
        <div id="aiResult" class="ai-result" hidden></div>
      </section>

      <section class="section grid two">
        <article class="card devotional-quote highlight">
          <span class="badge">${e(verse.theme || 'Devocional')}</span>
          <blockquote>${e(verse.text || '')}</blockquote>
          <p class="muted">${e(verse.reference || '')}</p>
          ${shareButtons(e, { title, text: shareText, url: app.pageUrl('versiculo') })}
        </article>
        <article class="card">
          <h2>Plano de leitura e devocional</h2>
          <p class="muted">Guarde os versículos que mais falaram com você e acompanhe o plano de leitura da igreja.</p>
          <div class="row gap wrap">
            <button class="btn primary" data-nav="palavra">Palavra por sentimento</button>
            <button class="btn ghost" data-nav="leitura">Plano de leitura</button>
            <button class="btn ghost" data-nav="oracao">Mural de oração</button>
          </div>
        </article>
      </section>

      <section class="section">
        <div class="section-head"><div><h2>Outros versículos</h2><p class="muted">Lista editável pelo painel administrativo.</p></div></div>
        ${themes.length ? `<div class="filter-row">${['Todos'].concat(themes).map((theme, index) => `<button class="chip filter-chip ${index === 0 ? 'active' : ''}" data-verse-filter="${e(index === 0 ? '' : theme)}">${e(theme)}</button>`).join('')}</div>` : ''}
        <div class="grid three" id="verseList">${verses.map(item => `<article class="card compact verse-item" data-theme="${e(item.theme || '')}"><span class="badge">${e(item.theme || 'Versículo')}</span><h3>${e(item.reference)}</h3><p>${e(item.text)}</p><div class="row gap wrap"><button class="btn small ghost" data-share="native" data-share-title="${e(item.reference)}" data-share-text="${e('“' + (item.text || '') + '” (' + (item.reference || '') + ')')}" data-share-url="${e(app.pageUrl('versiculo'))}">📤 Compartilhar</button></div></article>`).join('') || '<div class="empty">Nenhum versículo cadastrado.</div>'}</div>
      </section>
    </div>`;
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
    const roleNames = { pastor: 'Administrador', lider: 'Líder', editor: 'Editor', membro: 'Membro' };
    const roleLabel = roleNames[app.normalizeRole(me.role)] || 'Membro';
    const needsPassword = app.needsPasswordSetup();
    const canAdmin = app.can('admin.access');

    root.innerHTML = `<div class="page-container">
      <section class="card highlight">
        <div class="row gap wrap between">
          <div class="row gap">
            <span>${app.avatarMarkup(me, 'large')}</span>
            <div>
              <h1>${e(me.name)}</h1>
              <p class="muted">${e(me.email || '')}${me.username ? ' • @' + e(me.username) : ''}</p>
              <span class="status approved">${e(roleLabel)}</span>
            </div>
          </div>
          <div class="row gap wrap">
            ${canAdmin ? '<a class="btn ghost" href="admin.html">⚙️ Painel administrativo</a>' : ''}
            <button class="btn danger ghost" data-logout="1">Sair</button>
          </div>
        </div>
      </section>

      ${needsPassword ? `<section class="section card highlight">
        <span class="badge">🔐 Segurança da conta</span>
        <h2>Crie uma senha para sua conta</h2>
        <p class="muted">Você entrou com o Google. Defina uma senha para também poder entrar com email e senha, mesmo sem o Google.</p>
        <form id="passwordForm" class="form-grid">
          <label>Nova senha
            <span class="password-field">
              <input name="password" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres" required>
              <button class="field-icon" type="button" data-toggle-pass="1" aria-label="Mostrar senha">👁️</button>
            </span>
          </label>
          <label>Confirmar senha
            <span class="password-field">
              <input name="confirmPassword" type="password" autocomplete="new-password" placeholder="Repita a senha" required>
              <button class="field-icon" type="button" data-toggle-pass="1" aria-label="Mostrar senha">👁️</button>
            </span>
          </label>
          <p class="help-text full">Use no mínimo 8 caracteres com letra maiúscula, minúscula, número e símbolo.</p>
          <div class="full"><button class="btn primary" type="submit">Salvar senha</button></div>
        </form>
      </section>` : ''}

      <section class="section grid four">
        <div class="card kpi"><div class="icon-bubble">⛪</div><div><strong>${stats.presence}</strong><span>presenças em cultos</span></div></div>
        <div class="card kpi"><div class="icon-bubble">🏡</div><div><strong>${stats.cellPresence}</strong><span>presenças em células</span></div></div>
        <div class="card kpi"><div class="icon-bubble">🧠</div><div><strong>${stats.quizzes}</strong><span>quizzes feitos</span></div></div>
        <div class="card kpi"><div class="icon-bubble">✅</div><div><strong>${stats.quizPercent}%</strong><span>acertos</span></div></div>
      </section>

      <section class="section card">
        <h2>Meus dados</h2>
        <form id="profileForm" class="form-grid">
          <label>Nome<input name="name" value="${e(me.name || '')}" required></label>
          <label>Nome de usuário<input name="username" value="${e(me.username || '')}"></label>
          <label>Email<input name="email" type="email" value="${e(me.email || '')}"></label>
          <label>WhatsApp<input name="whatsapp" value="${e(me.whatsapp || '')}"></label>
          <label>Telefone<input name="phone" value="${e(me.phone || '')}"></label>
          <label>Cidade<input name="city" value="${e(me.city || '')}"></label>
          <label class="full">Endereço<input name="address" value="${e(me.address || '')}"></label>
          <label>Célula<select name="cellId"><option value="">Sem célula</option>${cells.map(c => `<option value="${e(c.id)}" ${me.cellId === c.id ? 'selected' : ''}>${e(c.name)}</option>`).join('')}</select></label>
          <label>Cargo<input value="${e(roleLabel)}" disabled></label>
          <div class="full"><h3>Avatar do site</h3><div class="row gap wrap">${avatarButtons}</div><input type="hidden" name="avatarKey" value="${e(me.avatarKey || 'dove')}"></div>
          <div class="full"><button class="btn primary" type="submit">Salvar perfil</button></div>
        </form>
      </section>
    </div>`;
  }

  function renderPostar(ctx) {
    const { e, root, user } = ctx;
    const me = user();
    if (!me) { root.innerHTML = `<div class="page-container">${loginCard(e)}</div>`; return; }
    const canPublish = app.hasRole('lider');
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">✍️ Participação</span>
        <h1>Enviar post, notícia ou testemunho</h1>
        <p>${canPublish ? 'Como liderança, seu conteúdo é publicado imediatamente.' : 'Posts de membros ficam pendentes até aprovação de líder ou pastor.'}</p>
      </section>
      <section class="section card">
        <form id="postForm" class="form-grid">
          <label>Título<input name="title" required maxlength="120" placeholder="Ex: Testemunho de gratidão"></label>
          <label>Categoria<select name="category"><option>Testemunho</option><option>Notícia</option><option>Devocional</option><option>Atividade</option><option>Evento</option><option>Geral</option></select></label>
          <label class="full">Resumo (aparece nas listas e no compartilhamento)<input name="summary" maxlength="200" placeholder="Uma frase que resume o post"></label>

          <div class="full">
            <h3>Imagem principal</h3>
            <p class="muted">Esta é a imagem que vai junto quando alguém compartilhar o post. Sem imagem, usamos a logo do app.</p>
            <div class="image-picker">
              <div class="image-preview" id="postImagePreview"><span class="muted">Sem imagem — o app usará a logo</span></div>
              <div class="row gap wrap">
                <label class="btn small">⬆️ Enviar imagem (vira WebP)<input type="file" id="postImageFile" accept="image/*" hidden></label>
                <button class="btn small ghost" type="button" id="postImageUrl">🔗 Imagem por link</button>
                <button class="btn small danger ghost" type="button" id="postImageClear">Remover</button>
              </div>
            </div>
            <input type="hidden" name="image" id="postImageValue">
          </div>

          <label class="full">Conteúdo
            <textarea name="content" required data-rich-editor data-min-height="300" placeholder="Escreva sua mensagem... use a barra de ferramentas para formatar, centralizar, inserir imagens, vídeos e código HTML."></textarea>
          </label>

          <div class="full row gap wrap">
            <button class="btn primary" type="submit">${canPublish ? 'Publicar' : 'Enviar para aprovação'}</button>
            <button class="btn ghost" type="reset">Limpar</button>
          </div>
        </form>
      </section>
      <section class="section card compact">
        <h3>Dicas para um bom post</h3>
        <ul class="muted">
          <li>Use o botão <strong>↔</strong> para centralizar títulos e imagens.</li>
          <li>Imagens enviadas são convertidas automaticamente para <strong>WebP</strong>, ficando muito mais leves no celular.</li>
          <li>O botão <strong>&lt;/&gt;</strong> permite colar/editar código HTML direto.</li>
          <li>Use <strong>📖</strong> para inserir um versículo formatado.</li>
        </ul>
      </section>
    </div>`;
  }

  function renderDizimo(ctx) {
    const { e, root, user } = ctx;
    const cfg = app.getAt('integrations/pix', {}) || {};
    const me = user();
    if (cfg.enabled === false) {
      root.innerHTML = `<div class="page-container"><div class="empty section">A página de contribuição está desativada no momento.</div></div>`;
      return;
    }
    const configured = window.ImperioPix && window.ImperioPix.isConfigured();
    const amounts = Array.isArray(cfg.suggestedAmounts) && cfg.suggestedAmounts.length ? cfg.suggestedAmounts : [5, 10, 20, 50, 100, 200];
    const purposes = Array.isArray(cfg.purposes) && cfg.purposes.length ? cfg.purposes : ['Dízimo', 'Oferta'];
    const min = Number(cfg.minAmount || 5);
    const history = cfg.showHistory !== false && me
      ? app.asArray(app.getAt('donations', {})).filter(item => item.userId === me.id).sort(app.byDateDesc).slice(0, 5)
      : [];

    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">💝 Dízimos e Ofertas</span>
        <h1>Contribua com a obra de Deus</h1>
        <p>${e(cfg.message || 'Sua contribuição sustenta missões, ação social e o cuidado com pessoas.')}</p>
      </section>

      ${!configured ? '<section class="section card danger"><h2>Chave Pix ainda não configurada</h2><p>O administrador precisa cadastrar a chave Pix / Mercado Pago no painel administrativo, aba <strong>Pix/Doações</strong>.</p></section>' : ''}

      <section class="section grid two give-layout">
        <article class="card">
          <h2>1. Escolha o valor</h2>
          <form id="pixForm" class="form-grid">
            <div class="full">
              <div class="amount-grid">
                ${amounts.map(value => `<button type="button" class="amount-chip" data-amount="${e(value)}">R$ ${e(Number(value).toFixed(0))}</button>`).join('')}
                <button type="button" class="amount-chip" data-amount="outro">Outro</button>
              </div>
            </div>
            <label>Valor (R$)
              <input name="amount" id="pixAmount" type="number" min="${e(min)}" step="0.01" value="${e(amounts[0] || min)}" required inputmode="decimal">
            </label>
            <label>Finalidade
              <select name="purpose" id="pixPurpose">${purposes.map(item => `<option>${e(item)}</option>`).join('')}</select>
            </label>
            <label class="full">Seu nome (opcional)
              <input name="donorName" value="${e(me ? me.name : '')}" placeholder="Deixe em branco para doar anonimamente">
            </label>
            <label class="full">Mensagem/intenção (opcional)
              <input name="message" maxlength="120" placeholder="Ex: Gratidão pela minha família">
            </label>
            <div class="full row gap wrap">
              <button class="btn primary" type="submit" ${configured ? '' : 'disabled'}>Gerar QR Code Pix</button>
              ${cfg.checkoutLink ? '<button class="btn ghost" type="button" id="pixCheckout">Pagar com cartão (Mercado Pago)</button>' : ''}
            </div>
            <p class="muted full">Valor mínimo: R$ ${e(min.toFixed(2).replace('.', ','))}${cfg.maxAmount ? ` • máximo: R$ ${e(Number(cfg.maxAmount).toFixed(2).replace('.', ','))}` : ''}. Você escolhe quanto quer ofertar.</p>
          </form>
        </article>

        <article class="card pix-result" id="pixResult">
          <h2>2. Pague pelo app do banco</h2>
          <div class="empty">Escolha o valor e clique em <strong>Gerar QR Code Pix</strong>.</div>
        </article>
      </section>

      ${history.length ? `<section class="section card"><h2>Suas últimas contribuições</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Valor</th><th>Finalidade</th><th>Status</th></tr></thead><tbody>${history.map(item => `<tr><td>${e(app.formatDate(item.createdAt))}</td><td>${e(window.ImperioPix.formatBRL(item.amount))}</td><td>${e(item.purpose)}</td><td><span class="status ${item.status === 'confirmada' ? 'approved' : 'pending'}">${e(item.status)}</span></td></tr>`).join('')}</tbody></table></div></section>` : ''}

      <section class="section grid three">
        <div class="card compact"><div class="icon-bubble">🔒</div><h3>Seguro</h3><p class="muted">O QR Code é gerado no padrão oficial do Banco Central (BR Code). O pagamento acontece dentro do app do seu banco.</p></div>
        <div class="card compact"><div class="icon-bubble">📖</div><h3>Bíblico</h3><p class="muted">"Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." (2 Co 9:7)</p></div>
        <div class="card compact"><div class="icon-bubble">🤝</div><h3>Transparente</h3><p class="muted">Prestação de contas é apresentada periodicamente pela liderança da igreja.</p></div>
      </section>
    </div>`;
  }

  function renderOracao(ctx) {
    const { e, root, list, user } = ctx;
    const me = user();
    const requests = list('prayerRequests').filter(item => item.public === true && item.status !== 'rejected').sort(app.byDateDesc).slice(0, 30);
    const words = visible(list('feelingWords'));
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">🙏 Mural de oração</span>
        <h1>Oremos uns pelos outros</h1>
        <p>Envie seu pedido e interceda pelos pedidos da nossa comunidade. "Orai uns pelos outros para que sareis." (Tiago 5:16)</p>
      </section>
      <section class="section card">
        <h2>Enviar pedido de oração</h2>
        <form id="prayerForm" class="form-grid">
          <label>Nome<input name="authorName" value="${e(me ? me.name : '')}" placeholder="Seu nome ou anônimo"></label>
          <label>Contato opcional<input name="contact" value="${e(me ? (me.whatsapp || me.email || '') : '')}" placeholder="WhatsApp ou email"></label>
          <label>Sentimento<select name="feeling"><option value="">Escolha...</option>${words.map(word => `<option value="${e(word.feeling || word.id)}">${e(word.icon || '🙏')} ${e(word.feeling || word.id)}</option>`).join('')}</select></label>
          <label class="checkbox-line"><input type="checkbox" name="public" value="true"><span>Publicar no mural para a igreja orar</span></label>
          <label class="full">Pedido<textarea name="text" required placeholder="Escreva seu pedido de oração..."></textarea></label>
          <div class="full"><button class="btn primary" type="submit">Enviar pedido</button></div>
        </form>
      </section>
      <section class="section">
        <div class="section-head"><div><h2>Pedidos da comunidade</h2><p class="muted">Toque em "Estou orando" para apoiar um irmão.</p></div></div>
        <div class="grid three">${requests.map(item => `<article class="card compact prayer-item"><div class="card-title-line"><h3>${e(item.authorName || 'Anônimo')}</h3><span class="badge">${e(item.feeling || 'Oração')}</span></div><p>${e(item.text)}</p><p class="muted">${e(app.formatDate(item.createdAt))} • ${e(Number(item.prayCount || 0))} orando</p><button class="btn small" data-pray="${e(item.id)}">🙏 Estou orando</button></article>`).join('') || '<div class="empty">Nenhum pedido público no momento. Seja o primeiro a compartilhar.</div>'}</div>
      </section>
    </div>`;
  }

  function renderMidia(ctx) {
    const { e, root, list } = ctx;
    const media = visible(list('media')).sort(app.byDateDesc);
    const settings = ctx.settings();
    const live = media.find(item => item.live === true);
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">🎬 Mídia</span>
        <h1>Pregações, louvores e transmissões</h1>
        <p>Assista aos cultos, reveja mensagens e ouça o louvor da nossa igreja.</p>
      </section>
      ${live ? `<section class="section card highlight"><span class="badge">🔴 AO VIVO</span><h2>${e(live.title)}</h2>${live.embed ? `<div class="embed-block"><iframe src="${e(window.ImperioEditor ? window.ImperioEditor.embedUrl(live.embed) || live.embed : live.embed)}" loading="lazy" allowfullscreen frameborder="0"></iframe></div>` : ''}<p>${e(live.description || '')}</p></section>` : ''}
      <section class="section">
        <div class="section-head"><div><h2>Biblioteca</h2><p class="muted">Conteúdo publicado pela liderança no painel administrativo.</p></div></div>
        <div class="grid three">${media.filter(item => !item.live).map(item => {
          const embed = window.ImperioEditor ? (window.ImperioEditor.embedUrl(item.embed || item.url || '') || '') : '';
          return `<article class="card media-card">${embed ? `<div class="embed-block"><iframe src="${e(embed)}" loading="lazy" allowfullscreen frameborder="0"></iframe></div>` : (item.image ? `<img class="card-cover" src="${e(item.image)}" alt="${e(item.title)}" loading="lazy">` : '')}<span class="badge">${e(item.category || 'Pregação')}</span><h3>${e(item.title)}</h3><p class="muted">${e(item.speaker || '')} • ${e(app.formatDate(item.date || item.createdAt))}</p><p>${e(item.description || '')}</p>${shareButtons(e, { title: item.title, text: item.description || '', url: app.pageUrl('midia'), image: item.image })}</article>`;
        }).join('') || `<div class="empty">Nenhuma mídia publicada ainda.${settings.social && settings.social.youtube ? ` Acompanhe no <a href="${e(settings.social.youtube)}" target="_blank" rel="noopener">YouTube</a>.` : ''}</div>`}</div>
      </section>
    </div>`;
  }

  function renderLeitura(ctx) {
    const { e, root, list, user } = ctx;
    const me = user();
    const plans = visible(list('readingPlans'));
    const progress = me ? (app.getAt('readingProgress/' + me.id, {}) || {}) : {};
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">📚 Plano de leitura</span>
        <h1>Leia a Bíblia todos os dias</h1>
        <p>Marque cada dia concluído e acompanhe seu progresso na Palavra.</p>
      </section>
      ${!me ? `<section class="section">${loginCard(e)}</section>` : ''}
      <section class="section grid two">${plans.map(plan => {
        const days = app.asArray(plan.days || {});
        const done = days.filter(day => progress[plan.id + ':' + day.id]).length;
        const percent = days.length ? Math.round((done / days.length) * 100) : 0;
        return `<article class="card"><div class="card-title-line"><h2>${e(plan.title)}</h2><span class="status">${percent}%</span></div><p>${e(plan.description || '')}</p><div class="progress-bar"><span style="width:${percent}%"></span></div><div class="grid section">${days.slice(0, 40).map(day => `<label class="checkbox-line reading-day"><input type="checkbox" data-reading="${e(plan.id)}:${e(day.id)}" ${progress[plan.id + ':' + day.id] ? 'checked' : ''} ${me ? '' : 'disabled'}><span><strong>${e(day.label || day.id)}</strong> — ${e(day.passage || '')}</span></label>`).join('') || '<p class="muted">Plano sem dias cadastrados.</p>'}</div></article>`;
      }).join('') || '<div class="empty">Nenhum plano de leitura cadastrado. O administrador pode criar na aba Devocionais.</div>'}</section>
    </div>`;
  }

  function renderAniversarios(ctx) {
    const { e, root, list } = ctx;
    const users = list('users').filter(item => item.birthday);
    const today = new Date();
    const month = today.getMonth();
    function parseDay(value) {
      const parts = String(value).split(/[-/]/).map(Number);
      if (parts.length >= 3) return { month: parts[1] - 1, day: parts[2] };
      if (parts.length === 2) return { month: parts[0] - 1, day: parts[1] };
      return null;
    }
    const withDates = users.map(item => Object.assign({}, item, { parsed: parseDay(item.birthday) })).filter(item => item.parsed);
    const thisMonth = withDates.filter(item => item.parsed.month === month).sort((a, b) => a.parsed.day - b.parsed.day);
    const todayList = thisMonth.filter(item => item.parsed.day === today.getDate());
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">🎂 Aniversariantes</span>
        <h1>Celebrando a vida da nossa família</h1>
        <p>Envie uma mensagem de carinho para quem faz aniversário.</p>
      </section>
      ${todayList.length ? `<section class="section card highlight"><h2>🎉 Aniversariantes de hoje</h2><div class="grid three">${todayList.map(item => `<div class="card compact row gap"><span>${app.avatarMarkup(item, 'avatar-sm')}</span><div><strong>${e(item.name)}</strong><p class="muted">${e(item.whatsapp || '')}</p></div></div>`).join('')}</div></section>` : ''}
      <section class="section">
        <div class="section-head"><h2>Aniversariantes do mês</h2></div>
        <div class="grid three">${thisMonth.map(item => `<article class="card compact"><div class="row gap"><span>${app.avatarMarkup(item, 'avatar-sm')}</span><div><strong>${e(item.name)}</strong><p class="muted">Dia ${e(item.parsed.day)}</p></div></div></article>`).join('') || '<div class="empty">Nenhum aniversariante cadastrado neste mês. Membros podem preencher a data no perfil.</div>'}</div>
      </section>
    </div>`;
  }

  function renderSobre(ctx) {
    const { e, root, settings, list } = ctx;
    const s = settings();
    const team = list('users').filter(item => ['pastor', 'lider'].includes(item.role));
    const pages = visible(list('customPages')).filter(item => item.slug === 'sobre');
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">⛪ Nossa igreja</span>
        <h1>${e(s.churchName || 'Igreja Imperial Batista')}</h1>
        <p>${e(s.slogan || '')}</p>
      </section>
      ${pages.map(page => `<section class="section card">${richContent(page.content)}</section>`).join('')}
      <section class="section grid three">
        <div class="card"><div class="icon-bubble">📖</div><h3>Nossa fé</h3><p class="muted">Somos uma igreja batista: cremos na autoridade das Escrituras, na salvação pela graça mediante a fé em Jesus Cristo e no sacerdócio de todos os crentes.</p></div>
        <div class="card"><div class="icon-bubble">🤝</div><h3>Nossa missão</h3><p class="muted">Servir, amar e discipular — levando o evangelho à nossa cidade e apoiando missões.</p></div>
        <div class="card"><div class="icon-bubble">🏡</div><h3>Nossa vida</h3><p class="muted">Cultos, Escola Bíblica Dominical, células, ação social e ministérios para todas as idades.</p></div>
      </section>
      <section class="section">
        <div class="section-head"><h2>Liderança</h2></div>
        <div class="grid three">${team.map(item => `<article class="card compact"><div class="row gap"><span>${app.avatarMarkup(item, 'avatar-sm')}</span><div><strong>${e(item.name)}</strong><p class="muted">${e(item.role === 'pastor' ? 'Pastor' : 'Líder')}</p></div></div></article>`).join('') || '<div class="empty">Equipe em atualização.</div>'}</div>
      </section>
    </div>`;
  }

  function renderContato(ctx) {
    const { e, root, settings } = ctx;
    const s = settings();
    const social = s.social || {};
    const whatsappDigits = String(s.whatsapp || '').replace(/\D/g, '');
    const mapQuery = encodeURIComponent(`${s.address || ''} ${s.city || ''}`.trim());
    root.innerHTML = `<div class="page-container">
      <section class="hero">
        <span class="badge">📍 Contato</span>
        <h1>Venha nos visitar</h1>
        <p>Será uma alegria receber você e sua família.</p>
      </section>
      <section class="section grid two">
        <article class="card">
          <h2>Onde estamos</h2>
          <p class="muted">📍 ${e(s.address || 'Endereço a definir')}<br>${e(s.city || '')}</p>
          <p class="muted">📞 ${e(s.phone || '-')}<br>💬 ${e(s.whatsapp || '-')}<br>✉️ ${e(s.email || '-')}</p>
          <div class="row gap wrap">
            ${whatsappDigits ? `<a class="btn primary" href="https://wa.me/55${e(whatsappDigits)}" target="_blank" rel="noopener">Falar no WhatsApp</a>` : ''}
            ${mapQuery ? `<a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" rel="noopener">Ver no mapa</a>` : ''}
          </div>
          <div class="row gap wrap section">
            ${social.instagram ? `<a class="chip" href="${e(social.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}
            ${social.facebook ? `<a class="chip" href="${e(social.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ''}
            ${social.youtube ? `<a class="chip" href="${e(social.youtube)}" target="_blank" rel="noopener">YouTube</a>` : ''}
            ${social.site ? `<a class="chip" href="${e(social.site)}" target="_blank" rel="noopener">Site</a>` : ''}
          </div>
        </article>
        <article class="card">
          <h2>Fale conosco</h2>
          <p class="muted">Dúvidas, pedidos de visita, aconselhamento ou primeira visita — escreva para nós.</p>
          <form id="contactForm" class="form-grid">
            <label>Nome<input name="name" required></label>
            <label>Contato<input name="contact" required placeholder="WhatsApp ou email"></label>
            <label class="full">Assunto<select name="subject"><option>Quero visitar a igreja</option><option>Aconselhamento pastoral</option><option>Quero servir em um ministério</option><option>Batismo / membresia</option><option>Outro assunto</option></select></label>
            <label class="full">Mensagem<textarea name="message" required placeholder="Escreva sua mensagem..."></textarea></label>
            <div class="full"><button class="btn primary" type="submit">Enviar mensagem</button></div>
          </form>
        </article>
      </section>
      ${mapQuery ? `<section class="section card"><div class="embed-block map-block"><iframe src="https://www.google.com/maps?q=${mapQuery}&output=embed" loading="lazy" title="Mapa da igreja"></iframe></div></section>` : ''}
    </div>`;
  }

  function renderQuiz(ctx) {
    const { e, root, list, user } = ctx;
    const me = user();
    if (!me) { root.innerHTML = `<div class="page-container">${loginCard(e)}</div>`; return; }
    const quizzes = visible(list('quizzes')).filter(q => q.active !== false);
    root.innerHTML = `<div class="page-container"><div class="section-head"><div><h1>Quizzes bíblicos</h1><p class="muted">Pastores e líderes podem criar quizzes para cultos e células.</p></div></div><div class="grid two">${quizzes.map(q => `<article class="card quiz-card" data-quiz="${e(q.id)}"><div class="card-title-line"><h2>${e(q.title)}</h2><span class="status">${e(q.scope || 'geral')}</span></div><p class="muted">${(q.questions || []).length} perguntas</p><div class="quiz-content">${(q.questions || []).map((question, qi) => `<div class="section"><h3>${qi + 1}. ${e(question.text)}</h3><div class="grid">${(question.options || []).map((opt, oi) => `<button class="btn quiz-option" type="button" data-quiz-option="${qi}" data-value="${oi}">${e(opt)}</button>`).join('')}</div></div>`).join('')}</div><button class="btn primary" data-submit-quiz="${e(q.id)}">Enviar respostas</button></article>`).join('') || '<div class="empty">Nenhum quiz ativo.</div>'}</div></div>`;
  }

  const renderers = {
    home: renderHome,
    cultos: renderCultos,
    agenda: renderAgenda,
    versiculo: renderVersiculo,
    palavra: renderPalavra,
    atividades: renderAtividades,
    celula: renderCelula,
    membros: renderMembros,
    perfil: renderPerfil,
    postar: renderPostar,
    quiz: renderQuiz,
    dizimo: renderDizimo,
    oracao: renderOracao,
    midia: renderMidia,
    leitura: renderLeitura,
    aniversarios: renderAniversarios,
    sobre: renderSobre,
    contato: renderContato
  };

  function bindCommon(ctx, page) {
    const { doc, root } = ctx;
    root.onclick = async event => {
      const nav = event.target.closest('[data-nav]');
      if (nav) return postMessage('navigate', { page: nav.dataset.nav });
      if (event.target.closest('[data-login]')) return postMessage('login');
      if (event.target.closest('[data-notify]')) return app.requestNotifications().then(() => app.checkDueNotifications(true));
      const share = event.target.closest('[data-share]');
      if (share) {
        return app.shareContent({ title: share.dataset.shareTitle, text: share.dataset.shareText, url: share.dataset.shareUrl, image: share.dataset.shareImage }, share.dataset.share).catch(error => app.toast(error.message || 'Não foi possível compartilhar.'));
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

    // Definir senha para quem entrou pelo Google e ainda não tem senha própria.
    const passwordForm = doc.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.onsubmit = async event => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(passwordForm).entries());
        try {
          await app.setAccountPassword(values.password, values.confirmPassword);
          passwordForm.reset();
          renderEmbeddedPage('perfil', doc);
        } catch (error) { app.toast(error.message); }
      };
      passwordForm.querySelectorAll('[data-toggle-pass]').forEach(btn => {
        btn.onclick = () => {
          const input = btn.parentElement.querySelector('input');
          if (!input) return;
          const showing = input.type === 'text';
          input.type = showing ? 'password' : 'text';
          btn.textContent = showing ? '👁️' : '🙈';
        };
      });
    }

    bindPostForm(ctx);
    bindPrayerForm(ctx);
    bindAi(ctx);
    bindPix(ctx);
    bindExtras(ctx);
  }

  function bindPostForm(ctx) {
    const { doc } = ctx;
    const postForm = doc.getElementById('postForm');
    if (!postForm) return;

    // Editor de conteúdo rico (negrito, centralizar, HTML, imagem por link, upload em WebP...).
    if (window.ImperioEditor) window.ImperioEditor.attachAll(doc);

    const imageValue = doc.getElementById('postImageValue');
    const preview = doc.getElementById('postImagePreview');
    const fileInput = doc.getElementById('postImageFile');

    function setImage(src) {
      if (!imageValue || !preview) return;
      imageValue.value = src || '';
      preview.innerHTML = src
        ? `<img src="${app.escapeHtml(src)}" alt="Imagem principal do post">`
        : '<span class="muted">Sem imagem — o app usará a logo</span>';
    }

    if (fileInput) fileInput.onchange = async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file || !window.ImperioEditor) return;
      try {
        app.toast('Convertendo imagem para WebP...');
        const result = await window.ImperioEditor.toWebp(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
        setImage(result.dataUrl);
        app.toast(`Imagem pronta (${Math.round(result.size / 1024)} KB em WebP).`);
      } catch (error) { app.toast(error.message || 'Falha ao converter imagem.'); }
    };

    const urlBtn = doc.getElementById('postImageUrl');
    if (urlBtn) urlBtn.onclick = () => {
      const url = prompt('Cole o endereço (URL) da imagem principal:');
      if (!url) return;
      if (window.ImperioEditor && !window.ImperioEditor.isSafeUrl(url)) return app.toast('URL inválida.');
      setImage(url);
    };

    const clearBtn = doc.getElementById('postImageClear');
    if (clearBtn) clearBtn.onclick = () => setImage('');

    postForm.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(postForm).entries());
      if (window.ImperioEditor) {
        values.content = window.ImperioEditor.sanitizeHtml(values.content || '');
        if (!window.ImperioEditor.htmlToText(values.content)) return app.toast('Escreva o conteúdo do post.');
        if (!values.image) values.image = window.ImperioEditor.firstImage(values.content);
        if (!values.summary) values.summary = window.ImperioEditor.excerpt(values.content, 180);
      }
      try {
        await app.submitPost(values);
        postForm.reset();
        renderers[ctx.page || 'postar'] && renderEmbeddedPage('postar', doc);
      } catch (error) { app.toast(error.message); }
    };
  }

  function bindPrayerForm(ctx) {
    const { doc } = ctx;
    const prayerForm = doc.getElementById('prayerForm');
    if (!prayerForm) return;
    prayerForm.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(prayerForm).entries());
      values.public = values.public === 'true';
      try { await app.submitPrayerRequest(values); prayerForm.reset(); } catch (error) { app.toast(error.message); }
    };
  }

  /** Formata a resposta da IA em card, com botões de compartilhamento e salvar. */
  function aiResultHtml(answer) {
    const e = app.escapeHtml;
    const shareText = `“${answer.verse}” (${answer.reference})\n\n${answer.message}`;
    return `<article class="card ai-answer">
      ${answer.warning ? `<p class="notice">${e(answer.warning)}</p>` : ''}
      ${answer.risk ? `<p class="notice danger">${e(answer.riskMessage || '')}</p>` : ''}
      <span class="badge">${e(answer.theme || 'Palavra')}${answer.source === 'deepseek' ? ' • IA' : ''}</span>
      <blockquote>${e(answer.verse)}</blockquote>
      <p class="reference"><strong>${e(answer.reference)}</strong></p>
      ${answer.message ? `<p>${e(answer.message)}</p>` : ''}
      ${answer.prayer ? `<p class="muted prayer-line">🙏 ${e(answer.prayer)}</p>` : ''}
      <div class="share-grid">
        <button class="btn small primary" type="button" data-share="native" data-share-title="${e(answer.reference)}" data-share-text="${e(shareText)}" data-share-url="${e(app.pageUrl('versiculo'))}">📤 Compartilhar</button>
        <button class="btn small" type="button" data-share="whatsapp" data-share-title="${e(answer.reference)}" data-share-text="${e(shareText)}" data-share-url="${e(app.pageUrl('versiculo'))}">WhatsApp</button>
        <button class="btn small ghost" type="button" data-save-verse='${e(JSON.stringify({ reference: answer.reference, text: answer.verse, theme: answer.theme }))}'>💾 Salvar no app</button>
      </div>
    </article>`;
  }

  function bindAi(ctx) {
    const { doc } = ctx;

    async function ask(inputValue, target, button) {
      if (!window.ImperioAI) return app.toast('Módulo de IA não carregado.');
      const text = String(inputValue || '').trim();
      if (text.length < 3) return app.toast('Escreva um pouco mais sobre o que você sente.');
      target.hidden = false;
      target.innerHTML = '<div class="ai-loading"><span class="spinner"></span> Buscando uma palavra para você...</div>';
      if (button) { button.disabled = true; button.dataset.label = button.textContent; button.textContent = 'Buscando...'; }
      try {
        const answer = await window.ImperioAI.verseForFeeling(text);
        target.innerHTML = aiResultHtml(answer);
      } catch (error) {
        target.innerHTML = `<div class="empty">${app.escapeHtml(error.message || 'Não foi possível buscar agora.')}</div>`;
      } finally {
        if (button) { button.disabled = false; button.textContent = button.dataset.label || 'Buscar palavra'; }
      }
    }

    const aiForm = doc.getElementById('aiVerseForm');
    if (aiForm) {
      const result = doc.getElementById('aiResult');
      aiForm.onsubmit = event => {
        event.preventDefault();
        ask(aiForm.querySelector('[name="feeling"]').value, result, doc.getElementById('aiSubmit'));
      };
      doc.querySelectorAll('[data-ai-suggestion]').forEach(chip => {
        chip.onclick = () => {
          const field = aiForm.querySelector('[name="feeling"]');
          field.value = chip.dataset.aiSuggestion;
          field.focus();
        };
      });
    }

    const homeForm = doc.getElementById('homeAiForm');
    if (homeForm) {
      const result = doc.getElementById('homeAiResult');
      homeForm.onsubmit = event => {
        event.preventDefault();
        ask(homeForm.querySelector('[name="feeling"]').value, result, homeForm.querySelector('button[type="submit"]'));
      };
    }
  }

  function bindPix(ctx) {
    const { doc } = ctx;
    const pixForm = doc.getElementById('pixForm');
    if (!pixForm || !window.ImperioPix) return;
    const Pix = window.ImperioPix;
    const amountInput = doc.getElementById('pixAmount');
    const resultBox = doc.getElementById('pixResult');

    doc.querySelectorAll('[data-amount]').forEach(chip => {
      chip.onclick = () => {
        doc.querySelectorAll('[data-amount]').forEach(item => item.classList.remove('active'));
        chip.classList.add('active');
        if (chip.dataset.amount === 'outro') { amountInput.value = ''; amountInput.focus(); return; }
        amountInput.value = chip.dataset.amount;
      };
    });

    const checkoutBtn = doc.getElementById('pixCheckout');
    if (checkoutBtn) checkoutBtn.onclick = () => {
      const url = Pix.checkoutUrl(amountInput.value, doc.getElementById('pixPurpose').value);
      if (!url) return app.toast('Link de checkout não configurado.');
      window.open(url, '_blank', 'noopener');
    };

    pixForm.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(pixForm).entries());
      try {
        const amount = Pix.validateAmount(values.amount);
        const donation = await Pix.registerDonation({
          amount,
          purpose: values.purpose,
          donorName: values.donorName,
          message: values.message
        });
        const payload = Pix.buildPayload({ amount, txid: donation.id.replace(/[^A-Za-z0-9]/g, '').slice(-20), description: values.purpose });
        resultBox.innerHTML = `
          <h2>2. Pague pelo app do banco</h2>
          <p class="muted">Valor: <strong>${app.escapeHtml(Pix.formatBRL(amount))}</strong> • ${app.escapeHtml(values.purpose)}</p>
          <div class="pix-qr" id="pixQr"></div>
          <label class="full">Pix Copia e Cola
            <textarea id="pixPayload" class="pix-payload" readonly rows="3">${app.escapeHtml(payload)}</textarea>
          </label>
          <div class="row gap wrap">
            <button class="btn primary" type="button" id="pixCopy">📋 Copiar código Pix</button>
            <button class="btn ghost" type="button" id="pixDownload">⬇️ Baixar QR Code</button>
            <button class="btn ghost" type="button" id="pixShare">📤 Compartilhar</button>
            <button class="btn small" type="button" id="pixDone">✅ Já paguei</button>
          </div>
          <p class="muted section">Abra o app do seu banco → Pix → Ler QR Code (ou Pix Copia e Cola) → confirme o valor.</p>`;

        Pix.renderQr(doc.getElementById('pixQr'), payload, { size: 280, logoSrc: app.logoPath() });

        doc.getElementById('pixCopy').onclick = async () => {
          const area = doc.getElementById('pixPayload');
          area.select();
          try {
            await navigator.clipboard.writeText(payload);
            app.toast('Código Pix copiado! Cole no app do seu banco.');
          } catch (_) {
            doc.execCommand('copy');
            app.toast('Código Pix copiado.');
          }
        };
        doc.getElementById('pixDownload').onclick = () => Pix.downloadQr(doc.getElementById('pixQr'), 'pix-' + values.purpose.toLowerCase());
        doc.getElementById('pixShare').onclick = () => app.shareContent({
          title: 'Contribua com a ' + app.getAt('settings/churchName', 'nossa igreja'),
          text: `${values.purpose} de ${Pix.formatBRL(amount)} — Pix Copia e Cola:\n${payload}`,
          url: app.pageUrl('dizimo')
        }, 'native');
        doc.getElementById('pixDone').onclick = async () => {
          await Pix.confirmDonation(donation.id);
          app.toast(app.getAt('integrations/pix/thanksMessage', 'Que Deus abençoe sua generosidade!'));
        };
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (error) {
        app.toast(error.message || 'Não foi possível gerar o Pix.');
      }
    };
  }

  function bindExtras(ctx) {
    const { doc } = ctx;

    // Salvar versículo sugerido pela IA na coleção do app (líderes e pastores).
    doc.querySelectorAll('[data-save-verse]').forEach(btn => {
      btn.onclick = async () => {
        if (!app.hasRole('lider')) return app.toast('Apenas liderança pode salvar versículos no app.');
        try {
          const verse = JSON.parse(btn.dataset.saveVerse);
          const id = app.uid('verse');
          await app.setAt('devotionalVerses/' + id, Object.assign({ id, visible: true }, verse));
          app.toast('Versículo salvo na biblioteca do app.');
        } catch (error) { app.toast('Não foi possível salvar.'); }
      };
    });

    // Filtro de versículos por tema.
    doc.querySelectorAll('[data-verse-filter]').forEach(chip => {
      chip.onclick = () => {
        const theme = chip.dataset.verseFilter;
        doc.querySelectorAll('[data-verse-filter]').forEach(item => item.classList.remove('active'));
        chip.classList.add('active');
        doc.querySelectorAll('.verse-item').forEach(item => {
          item.hidden = Boolean(theme) && item.dataset.theme !== theme;
        });
      };
    });

    // "Estou orando" no mural.
    doc.querySelectorAll('[data-pray]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.pray;
        const current = Number(app.getAt('prayerRequests/' + id + '/prayCount', 0));
        await app.updateAt('prayerRequests/' + id, { prayCount: current + 1 });
        app.toast('Obrigado por interceder. 🙏');
      };
    });

    // Progresso do plano de leitura.
    doc.querySelectorAll('[data-reading]').forEach(box => {
      box.onchange = async () => {
        const me = app.state.user;
        if (!me) return app.toast('Entre para salvar seu progresso.');
        await app.updateAt('readingProgress/' + me.id, { [box.dataset.reading.replace(/[.#$/\[\]]/g, '_')]: box.checked });
      };
    });

    // Abrir conteúdo completo de notícia/post em modal.
    doc.querySelectorAll('[data-open-item]').forEach(btn => {
      btn.onclick = () => {
        const [collection, id] = String(btn.dataset.openItem).split(':');
        const item = app.getAt(collection + '/' + id, null);
        if (!item) return;
        openContentModal(doc, item);
      };
    });

    // Formulário de contato.
    const contactForm = doc.getElementById('contactForm');
    if (contactForm) contactForm.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(contactForm).entries());
      const id = app.uid('msg');
      await app.setAt('messages/' + id, Object.assign({ id, status: 'novo', createdAt: new Date().toISOString() }, values));
      contactForm.reset();
      app.toast('Mensagem enviada! A liderança responderá em breve.');
    };
  }

  function openContentModal(doc, item) {
    const e = app.escapeHtml;
    const image = mainImage(item);
    let modal = doc.getElementById('contentModal');
    if (!modal) {
      modal = doc.createElement('dialog');
      modal.id = 'contentModal';
      modal.className = 'modal';
      doc.body.appendChild(modal);
    }
    modal.innerHTML = `<form method="dialog" class="modal-card wide">
      <button class="modal-close" value="cancel" aria-label="Fechar">×</button>
      ${image ? `<img class="modal-cover" src="${e(image)}" alt="${e(item.title || '')}">` : ''}
      <h2>${e(item.title || '')}</h2>
      <p class="muted">${e(app.formatDate(item.date || item.createdAt))}${item.author || item.authorName ? ' • ' + e(item.author || item.authorName) : ''}</p>
      ${richContent(item.content)}
      ${shareButtons(e, { title: item.title, text: summaryOf(item, 160), url: app.pageUrl('home'), image })}
      <button class="btn ghost" value="cancel" type="submit">Fechar</button>
    </form>`;
    modal.querySelectorAll('[data-share]').forEach(btn => {
      btn.type = 'button';
      btn.onclick = () => app.shareContent({
        title: btn.dataset.shareTitle,
        text: btn.dataset.shareText,
        url: btn.dataset.shareUrl,
        image: btn.dataset.shareImage
      }, btn.dataset.share);
    });
    modal.showModal();
  }

  function renderEmbeddedPage(page, doc) {
    const ctx = pageDoc(doc, page);
    const renderer = renderers[page] || renderers.home;
    renderer(ctx);
    bindCommon(ctx, page);
  }

  window.Imperio.renderEmbeddedPage = renderEmbeddedPage;
})();
