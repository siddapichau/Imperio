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
        primary: '#6f1025',
        primary2: '#a61e3a',
        accent: '#f2c166'
      },
      menus: {
        home: { id: 'home', label: 'Home', icon: '🏠', page: 'home', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 1 },
        membros: { id: 'membros', label: 'Membros', icon: '👥', page: 'membros', visible: true, roles: ['lider', 'pastor'], order: 2 },
        cultos: { id: 'cultos', label: 'Cultos', icon: '⛪', page: 'cultos', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 3 },
        agenda: { id: 'agenda', label: 'Agenda', icon: '📅', page: 'agenda', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 4 },
        versiculo: { id: 'versiculo', label: 'Versículo', icon: '📖', page: 'versiculo', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 5 },
        palavra: { id: 'palavra', label: 'Palavra', icon: '🙏', page: 'palavra', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 6 },
        atividades: { id: 'atividades', label: 'Atividades', icon: '🤝', page: 'atividades', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 7 },
        celula: { id: 'celula', label: 'Célula', icon: '🏡', page: 'celula', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 8 },
        quiz: { id: 'quiz', label: 'Quiz', icon: '🧠', page: 'quiz', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 9 },
        postar: { id: 'postar', label: 'Postar', icon: '✍️', page: 'postar', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 10 },
        perfil: { id: 'perfil', label: 'Perfil', icon: '🙋', page: 'perfil', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 11 }
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
    devotionalVerses: {
      verse_1: { id: 'verse_1', reference: 'Salmos 46:1', text: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', theme: 'Confiança', visible: true },
      verse_2: { id: 'verse_2', reference: 'João 14:6', text: 'Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai senão por mim.', theme: 'Salvação', visible: true },
      verse_3: { id: 'verse_3', reference: 'Filipenses 4:6-7', text: 'Não andeis ansiosos por coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica, com ações de graças.', theme: 'Paz', visible: true },
      verse_4: { id: 'verse_4', reference: 'Romanos 8:39', text: 'Nada poderá nos separar do amor de Deus, que está em Cristo Jesus, nosso Senhor.', theme: 'Amor', visible: true },
      verse_5: { id: 'verse_5', reference: 'Mateus 5:16', text: 'Assim brilhe também a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai que está nos céus.', theme: 'Testemunho', visible: true }
    },
    feelingWords: {
      ansiedade: { id: 'ansiedade', feeling: 'Ansiedade', icon: '🌊', title: 'Descanse no cuidado de Deus', verse: '1 Pedro 5:7', text: 'Lance sobre o Senhor cada preocupação. Ore com sinceridade, respire, procure apoio pastoral e dê o próximo passo com fé.', prayer: 'Senhor, entrego minha ansiedade em tuas mãos. Guarda meu coração em Cristo Jesus.' },
      tristeza: { id: 'tristeza', feeling: 'Tristeza', icon: '🕯️', title: 'O Consolador está perto', verse: 'Salmos 34:18', text: 'Deus se aproxima dos quebrantados. Você não precisa caminhar sozinho; a igreja deseja orar e cuidar de você.', prayer: 'Pai, consola meu coração e renova minha esperança pela tua Palavra.' },
      gratidao: { id: 'gratidao', feeling: 'Gratidão', icon: '🙌', title: 'Celebre as bondades do Senhor', verse: 'Salmos 103:2', text: 'A gratidão fortalece a fé. Compartilhe um testemunho e reconheça a mão de Deus em cada detalhe.', prayer: 'Obrigado, Senhor, por tua fidelidade e por cada misericórdia renovada.' },
      decisao: { id: 'decisao', feeling: 'Decisão', icon: '🧭', title: 'Busque sabedoria do alto', verse: 'Tiago 1:5', text: 'Antes de decidir, ore, consulte a Bíblia e caminhe com conselhos maduros. Deus guia seus filhos em paz.', prayer: 'Dá-me sabedoria, Senhor, para escolher o que te honra.' },
      cansaco: { id: 'cansaco', feeling: 'Cansaço', icon: '🌿', title: 'Cristo renova as forças', verse: 'Mateus 11:28', text: 'Jesus chama os cansados para encontrar descanso nele. Reorganize a rotina e receba cuidado da comunidade.', prayer: 'Jesus, renova minhas forças e ensina-me a descansar em ti.' }
    },
    users: {
      pastor_demo: { id: 'pastor_demo', name: 'Wesley Studio', username: 'wesley', email: 'wesleystudio@gmail.com', password: 'Kimmy2310@', whatsapp: '(00) 99999-0001', phone: '(00) 3333-0001', address: 'Casa pastoral', role: 'pastor', city: 'Sua cidade', cellId: '', avatarKey: 'crown', note: 'Administrador principal', createdAt: now() },
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
    if (hasOwn(incoming.settings, 'menus')) result.settings.menus = mergeDeep(defaultData.settings.menus, incoming.settings.menus || {});
    ['news', 'announcements', 'services', 'events', 'activities', 'cells', 'posts', 'devotionalVerses', 'feelingWords', 'users', 'presence', 'cellPresence', 'quizzes', 'quizResults', 'prayerRequests', 'commemorations', 'audit'].forEach(key => {
      result[key] = hasOwn(incoming, key) ? clone(incoming[key] || {}) : clone(defaultData[key] || {});
    });
    result.users = result.users || {};
    const adminDefaults = clone(defaultData.users.pastor_demo);
    result.users.pastor_demo = Object.assign({}, result.users.pastor_demo || {}, adminDefaults, {
      createdAt: (result.users.pastor_demo && result.users.pastor_demo.createdAt) || adminDefaults.createdAt
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

  function normalizeIdentifier(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function validateUsername(username) {
    const value = String(username || '').trim();
    if (!value) return { valid: false, message: 'Informe um nome de usuário.' };
    if (!/^[a-zA-Z0-9._-]{3,24}$/.test(value)) return { valid: false, message: 'Usuário deve ter 3 a 24 caracteres e usar apenas letras, números, ponto, hífen ou underline.' };
    return { valid: true, value };
  }

  function validateStrongPassword(password) {
    const value = String(password || '');
    const missing = [];
    if (value.length < 8) missing.push('8 caracteres');
    if (!/[a-z]/.test(value)) missing.push('letra minúscula');
    if (!/[A-Z]/.test(value)) missing.push('letra maiúscula');
    if (!/\d/.test(value)) missing.push('número');
    if (!/[^A-Za-z0-9]/.test(value)) missing.push('símbolo');
    return missing.length ? { valid: false, message: 'A senha precisa conter ' + missing.join(', ') + '.' } : { valid: true };
  }

  function resolveLoginIdentifier(identifier) {
    const value = String(identifier || '').trim();
    if (!value) throw new Error('Informe email ou usuário.');
    if (isEmail(value)) return value;
    const normalized = normalizeIdentifier(value);
    const found = asArray(getAt('users', {})).find(user => normalizeIdentifier(user.username) === normalized || normalizeIdentifier(user.email) === normalized);
    return found && found.email ? found.email : value;
  }

  function assertUniqueCredentials(email, username, ignoreId) {
    const normalizedEmail = normalizeIdentifier(email);
    const normalizedUsername = normalizeIdentifier(username);
    const duplicatedEmail = asArray(getAt('users', {})).find(user => user.id !== ignoreId && normalizeIdentifier(user.email) === normalizedEmail);
    if (duplicatedEmail) throw new Error('Este email já está cadastrado.');
    const duplicatedUsername = asArray(getAt('users', {})).find(user => user.id !== ignoreId && normalizeIdentifier(user.username) === normalizedUsername);
    if (duplicatedUsername) throw new Error('Este usuário já está cadastrado.');
  }

  async function signInEmail(identifier, password) {
    const login = resolveLoginIdentifier(identifier);
    const user = await window.ImperioFirebase.Auth.signInEmail(login, password);
    state.authUser = user;
    state.user = await ensureProfile(user);
    emit('auth', state.user);
    toast('Login realizado com sucesso.');
    return state.user;
  }

  async function registerEmail(details, emailArg, passwordArg, confirmArg) {
    const payload = typeof details === 'object' ? Object.assign({}, details) : {
      name: details,
      email: emailArg,
      password: passwordArg,
      confirmPassword: confirmArg
    };
    payload.name = String(payload.name || '').trim();
    payload.username = String(payload.username || '').trim();
    payload.email = String(payload.email || '').trim().toLowerCase();
    payload.password = String(payload.password || '');
    payload.confirmPassword = String(payload.confirmPassword || payload.confirm || '');
    if (!payload.name) throw new Error('Informe seu nome completo.');
    const usernameCheck = validateUsername(payload.username);
    if (!usernameCheck.valid) throw new Error(usernameCheck.message);
    if (!isEmail(payload.email)) throw new Error('Informe um email válido.');
    if (payload.password !== payload.confirmPassword) throw new Error('As senhas não conferem.');
    const strength = validateStrongPassword(payload.password);
    if (!strength.valid) throw new Error(strength.message);
    assertUniqueCredentials(payload.email, payload.username);
    const user = await window.ImperioFirebase.Auth.registerEmail(payload);
    state.authUser = user;
    state.user = await ensureProfile(user);
    if (state.user) {
      state.user = Object.assign({}, state.user, {
        name: payload.name,
        username: payload.username,
        email: payload.email,
        avatarKey: state.user.avatarKey || 'dove',
        updatedAt: now()
      });
      await setAt('users/' + state.user.id, state.user);
    }
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

  async function submitPrayerRequest(values) {
    const data = values || {};
    const request = {
      id: uid('prayer'),
      userId: state.user ? state.user.id : '',
      authorName: String(data.authorName || (state.user && state.user.name) || 'Pedido anônimo').trim(),
      feeling: String(data.feeling || '').trim(),
      text: String(data.text || data.request || '').trim(),
      contact: String(data.contact || (state.user && (state.user.whatsapp || state.user.email)) || '').trim(),
      status: 'pending',
      createdAt: now()
    };
    if (!request.text) throw new Error('Escreva seu pedido de oração.');
    await setAt('prayerRequests/' + request.id, request);
    toast('Pedido de oração enviado para a liderança.');
    return request;
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

  function pageUrl(page) {
    const base = location.href.split('#')[0].replace(/(?:index|admin)\.html.*$/, 'index.html');
    return base + '#' + (page || 'home');
  }

  function verseOfDay(date) {
    const verses = asArray(getAt('devotionalVerses', {})).filter(item => item.visible !== false);
    if (!verses.length) return { reference: 'Salmos 119:105', text: 'Lâmpada para os meus pés é a tua palavra e luz para os meus caminhos.', theme: 'Palavra' };
    const day = Math.floor((date ? new Date(date) : new Date()).setHours(0, 0, 0, 0) / 86400000);
    return verses[Math.abs(day) % verses.length];
  }

  function wordForFeeling(feeling) {
    const words = asArray(getAt('feelingWords', {}));
    if (!words.length) return null;
    const normalized = normalizeIdentifier(feeling || '');
    return words.find(item => normalizeIdentifier(item.id) === normalized || normalizeIdentifier(item.feeling) === normalized) || words[0];
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-999px';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }

  async function shareContent(payload, channel) {
    const data = Object.assign({
      title: 'Igreja Imperial Batista',
      text: 'Conheça o app da Igreja Imperial Batista.',
      url: pageUrl('home')
    }, payload || {});
    const textToShare = `${data.title}\n${data.text}\n${data.url}`;
    if (channel === 'native' && navigator.share) {
      await navigator.share(data);
      return true;
    }
    const encodedText = encodeURIComponent(`${data.text} ${data.url}`);
    const encodedUrl = encodeURIComponent(data.url);
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encodedText}`, '_blank', 'noopener');
    else if (channel === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank', 'noopener');
    else if (channel === 'instagram') {
      await copyText(textToShare).catch(() => false);
      toast('Texto copiado. Cole no Instagram para compartilhar.');
      window.open('https://www.instagram.com/', '_blank', 'noopener');
    } else if (navigator.share) {
      await navigator.share(data);
    } else {
      await copyText(textToShare);
      toast('Texto copiado para compartilhar.');
    }
    return true;
  }

  function notificationSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async function showNotification(title, options) {
    const opts = Object.assign({
      body: '',
      icon: 'assets/logo.png',
      badge: 'assets/favicon.png',
      tag: 'imperio-batista',
      data: { url: pageUrl('home') }
    }, options || {});
    if (!notificationSupported()) {
      if (opts.body) toast(opts.body);
      return false;
    }
    if (Notification.permission !== 'granted') return false;
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, opts);
        return true;
      } catch (error) {
        console.warn('Notificação via service worker falhou:', error);
      }
    }
    new Notification(title, opts);
    return true;
  }

  async function requestNotifications() {
    if (!notificationSupported()) {
      toast('Este navegador não suporta notificações.');
      return 'unsupported';
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission === 'granted') {
      toast('Notificações ativadas.');
      await showNotification('Igreja Imperial Batista', { body: 'Você receberá avisos, agenda e atividades da igreja.', tag: 'imperio-notifications-on' });
    } else {
      toast('Notificações não foram permitidas.');
    }
    return permission;
  }

  function notificationCandidates() {
    const today = new Date();
    const inSevenDays = new Date(today.getTime() + 7 * 86400000);
    const announcements = asArray(getAt('announcements', {})).filter(item => item.visible !== false).slice(0, 2).map(item => ({
      id: 'ann_' + item.id,
      title: 'Aviso da igreja',
      body: `${item.title}: ${item.text || ''}`,
      url: pageUrl('home')
    }));
    const events = asArray(getAt('events', {})).filter(item => item.visible !== false && item.startsAt && new Date(item.startsAt) >= today && new Date(item.startsAt) <= inSevenDays).sort(byDateAsc).slice(0, 2).map(item => ({
      id: 'event_' + item.id,
      title: 'Agenda da igreja',
      body: `${item.title} • ${formatDateTime(item.startsAt)}${item.location ? ' • ' + item.location : ''}`,
      url: pageUrl('agenda')
    }));
    const activities = asArray(getAt('activities', {})).filter(item => item.visible !== false).slice(0, 1).map(item => ({
      id: 'act_' + item.id,
      title: 'Atividade da igreja',
      body: `${item.title}: ${item.schedule || 'acompanhe no app'}`,
      url: pageUrl('atividades')
    }));
    return announcements.concat(events, activities);
  }

  async function checkDueNotifications(force) {
    if (!notificationSupported() || Notification.permission !== 'granted') return false;
    const day = new Date().toISOString().slice(0, 10);
    let sent = {};
    try { sent = JSON.parse(localStorage.getItem('imperioNotificationSent') || '{}') || {}; } catch (_) { sent = {}; }
    const candidates = notificationCandidates().filter(item => force || sent[item.id] !== day).slice(0, force ? 3 : 2);
    for (const item of candidates) {
      await showNotification(item.title, { body: item.body, tag: item.id, data: { url: item.url } });
      sent[item.id] = day;
    }
    localStorage.setItem('imperioNotificationSent', JSON.stringify(sent));
    return candidates.length > 0;
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
    normalizeIdentifier,
    validateUsername,
    validateStrongPassword,
    pageUrl,
    verseOfDay,
    wordForFeeling,
    shareContent,
    requestNotifications,
    showNotification,
    checkDueNotifications,
    notificationCandidates,
    signInEmail,
    registerEmail,
    signInGoogle,
    signOut,
    updateProfile,
    markPresence,
    submitPost,
    submitPrayerRequest,
    approvePost,
    saveQuizResult,
    statsForUser,
    toggleTheme,
    applyTheme
  };
})();
