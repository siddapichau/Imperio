(function () {
  'use strict';

  const roleWeight = { membro: 1, editor: 2, lider: 3, líder: 3, pastor: 4, admin: 4 };
  const state = {
    ready: false,
    data: null,
    user: null,
    authUser: null,
    theme: localStorage.getItem('imperioTheme') || 'light',
    mode: 'local'
  };
  const listeners = {};

  const avatarMap = {
    dove: '🕊️', cross: '✝️', bible: '📖', fish: '🐟', lamb: '🐑', flame: '🔥', heart: '💛', crown: '👑', olive: '🌿', music: '🎶'
  };

  function now() { return new Date().toISOString(); }
  function uid(prefix) { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }
  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }
  function asArray(collection) {
    if (!collection) return [];
    if (Array.isArray(collection)) return collection.filter(Boolean);
    return Object.keys(collection).map(key => Object.assign({ id: key }, collection[key] || {}));
  }
  function byDateAsc(a, b) { return String(a.date || a.startsAt || a.createdAt || '').localeCompare(String(b.date || b.startsAt || b.createdAt || '')); }
  function byDateDesc(a, b) { return String(b.date || b.startsAt || b.createdAt || '').localeCompare(String(a.date || a.startsAt || a.createdAt || '')); }
  function formatDate(value) {
    if (!value) return 'Data a definir';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatDateTime(value) {
    if (!value) return 'Data a definir';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return value;
  }

  const defaultData = {
    version: 1,
    settings: {
      appName: 'Império Batista',
      churchName: 'Igreja Imperial Batista',
      slogan: 'Servir, amar e discipular',
      welcomeTitle: 'Uma igreja para viver a fé em comunidade',
      welcomeText: 'Acompanhe cultos, células, agenda, notícias, presença, estudos e atividades da Igreja Imperial Batista em um só lugar.',
      address: 'Rua da Comunhão, 100 — Centro',
      city: 'Sua cidade',
      whatsapp: '(00) 00000-0000',
      phone: '(00) 0000-0000',
      email: 'contato@imperialbatista.local',
      logoPath: 'assets/logo.png',
      theme: {
        primary: '#123b2a',
        primary2: '#1f6a49',
        accent: '#d4a33a'
      },
      menus: {
        home: { id: 'home', label: 'Home', icon: '🏠', page: 'home', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 1 },
        membros: { id: 'membros', label: 'Membros', icon: '👥', page: 'membros', visible: true, roles: ['lider', 'pastor'], order: 2 },
        cultos: { id: 'cultos', label: 'Cultos', icon: '⛪', page: 'cultos', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 3 },
        agenda: { id: 'agenda', label: 'Agenda', icon: '📅', page: 'agenda', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 4 },
        atividades: { id: 'atividades', label: 'Atividades', icon: '🤝', page: 'atividades', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 5 },
        celula: { id: 'celula', label: 'Célula', icon: '🏡', page: 'celula', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 6 },
        quiz: { id: 'quiz', label: 'Quiz', icon: '🧠', page: 'quiz', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 7 },
        postar: { id: 'postar', label: 'Postar', icon: '✍️', page: 'postar', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 8 },
        perfil: { id: 'perfil', label: 'Perfil', icon: '🙋', page: 'perfil', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 9 }
      }
    },
    news: {
      news_1: { id: 'news_1', title: 'Bem-vindo ao app da Igreja Imperial Batista', summary: 'Agora a igreja tem um espaço digital para comunhão, agenda, presença e crescimento espiritual.', content: 'Aqui você acompanhará avisos, cultos, eventos, células e estudos bíblicos. O conteúdo pode ser editado pelo painel administrativo.', author: 'Pastor', status: 'approved', featured: true, createdAt: now(), date: now(), image: '' },
      news_2: { id: 'news_2', title: 'Semana de oração e cuidado', summary: 'Reserve momentos para oração em família e intercessão pela cidade.', content: 'Durante esta semana incentive sua célula a compartilhar pedidos de oração e testemunhos. Uma igreja batista valoriza a Palavra, a oração e a cooperação missionária.', author: 'Ministério de Comunhão', status: 'approved', featured: false, createdAt: now(), date: now(), image: '' }
    },
    announcements: {
      ann_1: { id: 'ann_1', title: 'Culto de celebração', text: 'Domingo às 19h com louvor, Palavra e comunhão.', date: now(), visible: true, priority: 'alta' },
      ann_2: { id: 'ann_2', title: 'Escola Bíblica', text: 'Domingo pela manhã: classes para todas as idades.', date: now(), visible: true, priority: 'normal' }
    },
    services: {
      culto_domingo: { id: 'culto_domingo', title: 'Culto de Celebração', type: 'Culto', weekday: 'Domingo', time: '19:00', date: '', location: 'Templo principal', preacher: 'Pastor titular', theme: 'Graça que transforma', visible: true },
      ebd: { id: 'ebd', title: 'Escola Bíblica Dominical', type: 'Ensino', weekday: 'Domingo', time: '09:00', date: '', location: 'Salas de estudo', preacher: 'Equipe de ensino', theme: 'Fundamentos da fé batista', visible: true },
      quarta: { id: 'quarta', title: 'Culto de Oração', type: 'Oração', weekday: 'Quarta-feira', time: '19:30', date: '', location: 'Templo principal', preacher: 'Liderança', theme: 'Clamor pela família', visible: true }
    },
    events: {
      event_1: { id: 'event_1', title: 'Ceia do Senhor', description: 'Celebração da Ceia e momento de comunhão da igreja.', startsAt: new Date(Date.now() + 7 * 86400000).toISOString(), endsAt: '', location: 'Templo', category: 'Culto', visible: true },
      event_2: { id: 'event_2', title: 'Encontro de Famílias', description: 'Palestra, oração e dinâmica para fortalecer lares cristãos.', startsAt: new Date(Date.now() + 14 * 86400000).toISOString(), endsAt: '', location: 'Salão social', category: 'Família', visible: true }
    },
    activities: {
      act_1: { id: 'act_1', title: 'Ação social', description: 'Arrecadação de alimentos e visitas de cuidado pastoral.', leader: 'Diaconia', schedule: 'Sábado, 09h', visible: true },
      act_2: { id: 'act_2', title: 'Louvor e adoração', description: 'Ensaios e formação para músicos e vocalistas.', leader: 'Ministério de Louvor', schedule: 'Quinta, 20h', visible: true },
      act_3: { id: 'act_3', title: 'Missões', description: 'Mobilização missionária, oração e ofertas cooperativas.', leader: 'Missões', schedule: 'Mensal', visible: true }
    },
    cells: {
      cel_1: { id: 'cel_1', name: 'Célula Fé Viva', leaderId: 'lider_demo', leaderName: 'Líder Ana', weekday: 'Terça-feira', time: '20:00', address: 'Casa da irmã Ana', neighborhood: 'Centro', description: 'Comunhão, estudo bíblico e cuidado mútuo.', visible: true },
      cel_2: { id: 'cel_2', name: 'Célula Caminho', leaderId: '', leaderName: 'A definir', weekday: 'Sexta-feira', time: '19:30', address: 'A definir', neighborhood: 'Bairro Novo', description: 'Célula aberta para novos participantes.', visible: true }
    },
    posts: {
      post_1: { id: 'post_1', title: 'Testemunho de gratidão', content: 'Deus tem cuidado da nossa igreja e nos chamado para servir com alegria.', category: 'Testemunho', authorId: 'membro_demo', authorName: 'Membro Demo', status: 'approved', createdAt: now(), approvedBy: 'pastor_demo' }
    },
    users: {
      pastor_demo: { id: 'pastor_demo', name: 'Pastor Administrador', username: 'pastor', email: 'pastor@imperialbatista.local', password: 'imperio123', whatsapp: '(00) 99999-0001', phone: '(00) 3333-0001', address: 'Casa pastoral', role: 'pastor', city: 'Sua cidade', cellId: '', avatarKey: 'crown', note: 'Administrador demo', createdAt: now() },
      lider_demo: { id: 'lider_demo', name: 'Líder Ana', username: 'ana.lider', email: 'lider@imperialbatista.local', password: 'imperio123', whatsapp: '(00) 99999-0002', phone: '', address: 'Centro', role: 'lider', city: 'Sua cidade', cellId: 'cel_1', avatarKey: 'olive', note: 'Líder de célula', createdAt: now() },
      membro_demo: { id: 'membro_demo', name: 'Membro Demo', username: 'membro', email: 'membro@imperialbatista.local', password: 'imperio123', whatsapp: '(00) 99999-0003', phone: '', address: 'Bairro', role: 'membro', city: 'Sua cidade', cellId: 'cel_1', avatarKey: 'dove', note: 'Perfil de exemplo', createdAt: now() }
    },
    presence: {},
    cellPresence: {},
    quizzes: {
      quiz_1: { id: 'quiz_1', title: 'Quiz do Culto — Graça', scope: 'culto', targetId: 'culto_domingo', active: true, createdAt: now(), questions: [
        { text: 'Segundo Efésios 2:8, somos salvos pela...', options: ['Força humana', 'Graça mediante a fé', 'Tradição', 'Obras somente'], answer: 1 },
        { text: 'Uma igreja saudável deve crescer em...', options: ['Comunhão, ensino e missão', 'Competição', 'Isolamento', 'Aparência'], answer: 0 }
      ] },
      quiz_2: { id: 'quiz_2', title: 'Quiz da Célula — Comunhão', scope: 'celula', targetId: 'cel_1', active: true, createdAt: now(), questions: [
        { text: 'Células existem para ajudar no...', options: ['Cuidado e discipulado', 'Distanciamento', 'Segredo', 'Individualismo'], answer: 0 }
      ] }
    },
    quizResults: {},
    prayerRequests: {},
    commemorations: {
      mothers: { id: 'mothers', title: 'Dia das Mães', date: '2026-05-10', description: 'Celebração e gratidão pelas mães.' },
      missions: { id: 'missions', title: 'Mês de Missões', date: '2026-09-01', description: 'Mobilização missionária da igreja.' }
    },
    audit: {}
  };

  function mergeDeep(base, incoming) {
    if (Array.isArray(base) || Array.isArray(incoming)) return incoming == null ? clone(base) : clone(incoming);
    const result = clone(base || {});
    Object.keys(incoming || {}).forEach(key => {
      if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key]) && base && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        result[key] = mergeDeep(base[key], incoming[key]);
      } else {
        result[key] = clone(incoming[key]);
      }
    });
    return result;
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function normalizeData(data) {
    const incoming = data || {};
    const result = Object.assign({}, clone(defaultData), clone(incoming));
    result.settings = mergeDeep(defaultData.settings, incoming.settings || {});
    if (hasOwn(incoming.settings, 'menus')) result.settings.menus = clone(incoming.settings.menus || {});
    ['news', 'announcements', 'services', 'events', 'activities', 'cells', 'posts', 'users', 'presence', 'cellPresence', 'quizzes', 'quizResults', 'prayerRequests', 'commemorations', 'audit'].forEach(key => {
      result[key] = hasOwn(incoming, key) ? clone(incoming[key] || {}) : clone(defaultData[key] || {});
    });
    return result;
  }

  function emit(event, detail) {
    (listeners[event] || []).forEach(fn => {
      try { fn(detail); } catch (error) { console.error(error); }
    });
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => listeners[event] = listeners[event].filter(item => item !== fn);
  }

  function toast(message) {
    const el = document.getElementById('toast') || (window.parent && window.parent.document && window.parent.document.getElementById('toast'));
    if (!el) return alert(message);
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function getAt(path, fallback) {
    const parts = String(path || '').split('/').filter(Boolean);
    let cursor = state.data;
    for (const part of parts) {
      if (cursor == null || typeof cursor !== 'object') return fallback;
      cursor = cursor[part];
    }
    return cursor == null ? fallback : cursor;
  }

  async function setAt(path, value) {
    await window.ImperioFirebase.set('appData/' + String(path || '').replace(/^\/+/, ''), value);
    return value;
  }

  async function updateAt(path, value) {
    await window.ImperioFirebase.update('appData/' + String(path || '').replace(/^\/+/, ''), value);
    return value;
  }

  async function removeAt(path) {
    await window.ImperioFirebase.remove('appData/' + String(path || '').replace(/^\/+/, ''));
  }

  async function pushAt(path, value) {
    return window.ImperioFirebase.push('appData/' + String(path || '').replace(/^\/+/, ''), value);
  }

  function currentRole() { return state.user ? (state.user.role || 'membro') : 'membro'; }
  function hasRole(minRole) { return (roleWeight[currentRole()] || 1) >= (roleWeight[minRole] || 1); }
  function roleAllowed(roles) {
    if (!roles || !roles.length) return true;
    const userRole = currentRole();
    return roles.includes(userRole) || roles.some(role => hasRole(role));
  }

  function avatarFor(profile) {
    if (!profile) return '';
    if (profile.photoURL || profile.avatarUrl) return profile.photoURL || profile.avatarUrl;
    return avatarMap[profile.avatarKey || 'dove'] || avatarMap.dove;
  }

  function avatarMarkup(profile, cls) {
    const avatar = avatarFor(profile);
    if (/^https?:|^data:|\.(png|jpe?g|webp|gif|svg)$/i.test(avatar)) return `<img class="avatar ${cls || ''}" src="${escapeHtml(avatar)}" alt="Avatar">`;
    return `<div class="avatar ${cls || ''} row center" aria-label="Avatar" style="font-size:2rem">${escapeHtml(avatar)}</div>`;
  }

  async function ensureProfile(authUser) {
    if (!authUser) return null;
    const userPath = 'users/' + authUser.uid;
    let profile = getAt(userPath, null);
    if (!profile) {
      profile = {
        id: authUser.uid,
        name: authUser.displayName || (authUser.email || 'Membro').split('@')[0],
        username: '',
        email: authUser.email || '',
        whatsapp: '',
        phone: '',
        address: '',
        role: 'membro',
        city: '',
        cellId: '',
        avatarKey: 'dove',
        photoURL: authUser.photoURL || '',
        createdAt: now()
      };
      await setAt(userPath, profile);
    } else if (authUser.photoURL && !profile.photoURL) {
      profile.photoURL = authUser.photoURL;
      await updateAt(userPath, { photoURL: authUser.photoURL });
    }
    return profile;
  }

  async function refreshProfile() {
    state.user = await ensureProfile(state.authUser);
    emit('auth', state.user);
    emit('data', state.data);
    return state.user;
  }

  async function seedIfNeeded() {
    const stored = await window.ImperioFirebase.get('appData');
    if (!stored) await window.ImperioFirebase.set('appData', clone(defaultData));
  }

  async function init() {
    if (state.ready) return state;
    const info = await window.ImperioFirebase.init();
    state.mode = info.mode;
    await seedIfNeeded();
    window.ImperioFirebase.onValue('appData', async data => {
      state.data = normalizeData(data || {});
      state.ready = true;
      if (state.authUser) state.user = getAt('users/' + state.authUser.uid, state.user) || state.user;
      applyTheme();
      emit('data', state.data);
      emit('ready', state);
    });
    window.ImperioFirebase.Auth.onChange(async authUser => {
      state.authUser = authUser;
      await refreshProfile();
    });
    applyTheme();
    return state;
  }

  async function signInEmail(email, password) {
    const user = await window.ImperioFirebase.Auth.signInEmail(email, password);
    state.authUser = user;
    state.user = await ensureProfile(user);
    emit('auth', state.user);
    toast('Login realizado com sucesso.');
    return state.user;
  }

  async function registerEmail(name, email, password) {
    const user = await window.ImperioFirebase.Auth.registerEmail({ name, email, password });
    state.authUser = user;
    state.user = await ensureProfile(user);
    emit('auth', state.user);
    toast('Conta criada com sucesso.');
    return state.user;
  }

  async function signInGoogle() {
    const user = await window.ImperioFirebase.Auth.signInGoogle();
    state.authUser = user;
    state.user = await ensureProfile(user);
    emit('auth', state.user);
    toast('Login com Google realizado.');
    return state.user;
  }

  async function signOut() {
    await window.ImperioFirebase.Auth.signOut();
    state.authUser = null;
    state.user = null;
    emit('auth', null);
    toast('Você saiu da conta.');
  }

  async function updateProfile(values) {
    if (!state.user) throw new Error('Entre para editar o perfil.');
    const profile = Object.assign({}, state.user, values || {}, { id: state.user.id, updatedAt: now() });
    await setAt('users/' + state.user.id, profile);
    state.user = profile;
    emit('auth', profile);
    toast('Perfil atualizado.');
    return profile;
  }

  async function markPresence(type, targetId) {
    if (!state.user) throw new Error('Entre para marcar presença.');
    const key = `${state.user.id}_${type}_${targetId}_${new Date().toISOString().slice(0, 10)}`;
    const path = type === 'celula' ? 'cellPresence/' + key : 'presence/' + key;
    await setAt(path, { id: key, userId: state.user.id, userName: state.user.name, type, targetId, date: now(), present: true });
    toast('Presença marcada. Deus abençoe!');
  }

  async function submitPost(values) {
    if (!state.user) throw new Error('Entre para postar.');
    const status = hasRole('lider') ? 'approved' : 'pending';
    const post = Object.assign({
      id: uid('post'),
      title: '',
      content: '',
      category: 'Geral',
      authorId: state.user.id,
      authorName: state.user.name,
      status,
      createdAt: now(),
      approvedBy: status === 'approved' ? state.user.id : ''
    }, values || {});
    await setAt('posts/' + post.id, post);
    toast(status === 'approved' ? 'Post publicado.' : 'Post enviado para aprovação da liderança.');
    return post;
  }

  async function approvePost(id, approve) {
    if (!hasRole('lider')) throw new Error('Apenas líderes e pastores aprovam posts.');
    await updateAt('posts/' + id, { status: approve ? 'approved' : 'rejected', approvedBy: state.user && state.user.id, approvedAt: now() });
    toast(approve ? 'Post aprovado.' : 'Post recusado.');
  }

  async function saveQuizResult(quizId, answers) {
    if (!state.user) throw new Error('Entre para responder o quiz.');
    const quiz = getAt('quizzes/' + quizId, null);
    if (!quiz) throw new Error('Quiz não encontrado.');
    const questions = quiz.questions || [];
    const correct = questions.reduce((sum, question, index) => sum + (Number(answers[index]) === Number(question.answer) ? 1 : 0), 0);
    const result = {
      id: `${state.user.id}_${quizId}`,
      userId: state.user.id,
      userName: state.user.name,
      quizId,
      quizTitle: quiz.title,
      answers,
      correct,
      total: questions.length,
      percent: questions.length ? Math.round((correct / questions.length) * 100) : 0,
      createdAt: now()
    };
    await setAt('quizResults/' + result.id, result);
    toast(`Quiz enviado: ${correct}/${questions.length} acertos.`);
    return result;
  }

  function statsForUser(userId) {
    const id = userId || (state.user && state.user.id);
    const presence = asArray(getAt('presence', {})).filter(item => item.userId === id && item.present);
    const cellPresence = asArray(getAt('cellPresence', {})).filter(item => item.userId === id && item.present);
    const results = asArray(getAt('quizResults', {})).filter(item => item.userId === id);
    const correct = results.reduce((sum, item) => sum + Number(item.correct || 0), 0);
    const total = results.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return { presence: presence.length, cellPresence: cellPresence.length, quizzes: results.length, correct, total, quizPercent: total ? Math.round((correct / total) * 100) : 0 };
  }

  function visibleMenus() {
    return asArray(getAt('settings/menus', {}))
      .filter(menu => menu.visible !== false && roleAllowed(menu.roles))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }

  function applyTheme() {
    const root = document.documentElement;
    root.setAttribute('data-theme', state.theme || 'light');
    const theme = getAt('settings/theme', {});
    if (theme.primary) root.style.setProperty('--primary', theme.primary);
    if (theme.primary2) root.style.setProperty('--primary-2', theme.primary2);
    if (theme.accent) root.style.setProperty('--accent', theme.accent);
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('imperioTheme', state.theme);
    applyTheme();
    emit('theme', state.theme);
    return state.theme;
  }

  window.Imperio = {
    state,
    defaultData,
    avatarMap,
    init,
    on,
    emit,
    toast,
    escapeHtml,
    asArray,
    byDateAsc,
    byDateDesc,
    formatDate,
    formatDateTime,
    formatTime,
    uid,
    getAt,
    setAt,
    updateAt,
    removeAt,
    pushAt,
    roleWeight,
    hasRole,
    roleAllowed,
    currentRole,
    visibleMenus,
    avatarFor,
    avatarMarkup,
    signInEmail,
    registerEmail,
    signInGoogle,
    signOut,
    updateProfile,
    markPresence,
    submitPost,
    approvePost,
    saveQuizResult,
    statsForUser,
    toggleTheme,
    applyTheme
  };
})();
