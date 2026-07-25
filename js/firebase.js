(function () {
  'use strict';

  const ROOT_KEY = 'imperioLocalData';
  const SESSION_KEY = 'imperioSession';
  const CONFIG_KEY = 'imperioFirebaseConfig';

  const defaultConfig = {
    apiKey: 'AIzaSyBtz2E3I3YLV1X72Xxy1EUrahiaQZmPiCs',
    authDomain: 'imperio-28408.firebaseapp.com',
    databaseURL: 'https://imperio-28408-default-rtdb.firebaseio.com',
    projectId: 'imperio-28408',
    storageBucket: 'imperio-28408.firebasestorage.app',
    messagingSenderId: '20222357769',
    appId: '1:20222357769:web:59d1e33de346efa6b6e3d8'
  };

  let app = null;
  let db = null;
  let auth = null;
  let mode = 'local';
  const localAuthListeners = new Set();

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function toastLog(...args) {
    console.info('[ImperioFirebase]', ...args);
  }

  function getConfig() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch (_) { stored = {}; }
    return Object.assign({}, defaultConfig, stored || {});
  }

  function saveConfig(config) {
    const next = Object.assign({}, getConfig(), config || {});
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    return next;
  }

  function canUseFirebase(config) {
    return Boolean(window.firebase && config && config.apiKey && config.databaseURL);
  }

  async function init() {
    const config = getConfig();
    if (canUseFirebase(config)) {
      try {
        app = window.firebase.apps && window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
        db = window.firebase.database(app);
        auth = window.firebase.auth(app);
        mode = 'firebase';
        toastLog('Conectado ao Firebase Realtime Database.');
        return { mode, config };
      } catch (error) {
        console.warn('[ImperioFirebase] Firebase falhou, usando modo local:', error);
      }
    }
    mode = 'local';
    return { mode, config };
  }

  function splitPath(path) {
    return String(path || '').split('/').filter(Boolean);
  }

  function readLocalRoot() {
    try { return JSON.parse(localStorage.getItem(ROOT_KEY) || '{}') || {}; } catch (_) { return {}; }
  }

  function writeLocalRoot(root) {
    localStorage.setItem(ROOT_KEY, JSON.stringify(root || {}));
    window.dispatchEvent(new CustomEvent('imperio:local-data', { detail: clone(root || {}) }));
  }

  function getLocal(path) {
    const parts = splitPath(path);
    let cursor = readLocalRoot();
    for (const part of parts) {
      if (cursor == null || typeof cursor !== 'object') return null;
      cursor = cursor[part];
    }
    return clone(cursor == null ? null : cursor);
  }

  function setLocal(path, value) {
    const parts = splitPath(path);
    const root = readLocalRoot();
    if (!parts.length) {
      writeLocalRoot(value || {});
      return clone(value);
    }
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i];
      if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = {};
      cursor = cursor[part];
    }
    cursor[parts[parts.length - 1]] = clone(value);
    writeLocalRoot(root);
    return clone(value);
  }

  function updateLocal(path, value) {
    const current = getLocal(path) || {};
    return setLocal(path, Object.assign({}, current, clone(value || {})));
  }

  function removeLocal(path) {
    const parts = splitPath(path);
    const root = readLocalRoot();
    if (!parts.length) {
      writeLocalRoot({});
      return;
    }
    let cursor = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      cursor = cursor && cursor[parts[i]];
      if (!cursor) return;
    }
    delete cursor[parts[parts.length - 1]];
    writeLocalRoot(root);
  }

  async function get(path) {
    if (mode === 'firebase') {
      const snap = await db.ref(path || '/').once('value');
      return snap.val();
    }
    return getLocal(path);
  }

  async function set(path, value) {
    if (mode === 'firebase') {
      await db.ref(path || '/').set(value);
      return value;
    }
    return setLocal(path, value);
  }

  async function update(path, value) {
    if (mode === 'firebase') {
      await db.ref(path || '/').update(value || {});
      return value;
    }
    return updateLocal(path, value);
  }

  async function push(path, value) {
    if (mode === 'firebase') {
      const ref = db.ref(path || '/').push();
      const item = Object.assign({}, value || {}, { id: ref.key });
      await ref.set(item);
      return { id: ref.key, value: item };
    }
    const id = 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    const item = Object.assign({}, value || {}, { id });
    await setLocal((path ? path + '/' : '') + id, item);
    return { id, value: item };
  }

  async function remove(path) {
    if (mode === 'firebase') return db.ref(path || '/').remove();
    return removeLocal(path);
  }

  function onValue(path, callback) {
    if (mode === 'firebase') {
      const ref = db.ref(path || '/');
      const handler = snap => callback(snap.val());
      ref.on('value', handler);
      return () => ref.off('value', handler);
    }
    const emit = () => callback(getLocal(path));
    emit();
    window.addEventListener('imperio:local-data', emit);
    window.addEventListener('storage', emit);
    return () => {
      window.removeEventListener('imperio:local-data', emit);
      window.removeEventListener('storage', emit);
    };
  }

  function localSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (_) { return null; }
  }

  function setLocalSession(user) {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
    localAuthListeners.forEach(listener => listener(user ? clone(user) : null));
  }

  function normalizeAuthUser(user) {
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.name || '',
      photoURL: user.photoURL || '',
      providerId: user.providerData && user.providerData[0] ? user.providerData[0].providerId : (user.providerId || 'password')
    };
  }

  function normalizeIdentifier(value) {
    return String(value || '').trim().toLowerCase();
  }

  function findUserByEmail(usersObj, email) {
    const norm = normalizeIdentifier(email);
    if (!norm) return null;
    const list = usersObj ? Object.values(usersObj) : [];
    return list.find(u => normalizeIdentifier(u.email) === norm) || null;
  }

  async function resolveEmailForLogin(inputIdentifier) {
    // Suporta login por username mesmo em modo Firebase buscando no Realtime DB / local
    const raw = String(inputIdentifier || '').trim();
    if (!raw) return raw;
    if (raw.includes('@')) return raw;
    try {
      const usersData = mode === 'firebase' && db
        ? (await db.ref('appData/users').once('value')).val() || {}
        : (getLocal('appData') || {}).users || {};
      const found = Object.values(usersData).find(u => normalizeIdentifier(u.username) === normalizeIdentifier(raw) || normalizeIdentifier(u.email) === normalizeIdentifier(raw));
      if (found && found.email) return found.email;
    } catch (_) {}
    return raw;
  }

  const Auth = {
    onChange(callback) {
      if (mode === 'firebase' && auth) return auth.onAuthStateChanged(user => callback(normalizeAuthUser(user)));
      localAuthListeners.add(callback);
      callback(localSession());
      return () => localAuthListeners.delete(callback);
    },
    current() {
      if (mode === 'firebase' && auth) return normalizeAuthUser(auth.currentUser);
      return localSession();
    },
    async signInEmail(identifier, password) {
      let login = String(identifier || '').trim();
      login = await resolveEmailForLogin(login);
      if (mode === 'firebase' && auth) {
        try {
          const result = await auth.signInWithEmailAndPassword(login, password);
          return normalizeAuthUser(result.user);
        } catch (e) {
          // Se o usuário digitou username, já resolvemos para email. Se falhar, tenta mensagem amigável
          if (e && e.code === 'auth/user-not-found') throw new Error('Email/usuário ou senha inválidos.');
          if (e && e.code === 'auth/wrong-password') throw new Error('Email/usuário ou senha inválidos.');
          throw e;
        }
      }
      const data = getLocal('appData') || {};
      const users = data.users || {};
      const normalized = normalizeIdentifier(login);
      const security = window.ImperioSecurity;
      let found = Object.values(users).find(u => normalizeIdentifier(u.email) === normalized || normalizeIdentifier(u.username) === normalized);

      // Migra senhas antigas em texto puro para hash, sem quebrar o login existente.
      if (found && found.password && security) {
        const migrated = Object.assign({}, found, { passwordHash: security.isHashed(found.password) ? found.password : security.hashPassword(found.password) });
        delete migrated.password;
        setLocal('appData/users/' + found.id, migrated);
        found = migrated;
      }

      if (!found) throw new Error('Email/usuário ou senha inválidos.');
      const stored = found.passwordHash || '';
      const valid = stored
        ? (security ? security.verifyPassword(password, stored) : String(password) === stored)
        : false;
      if (!valid) throw new Error('Email/usuário ou senha inválidos.');
      const user = normalizeAuthUser({ uid: found.id, email: found.email, displayName: found.name, photoURL: found.photoURL || found.avatarUrl || '', providerId: 'local' });
      setLocalSession(user);
      return user;
    },
    async registerEmail({ name, username, email, password }) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanUsername = String(username || '').trim();
      if (mode === 'firebase' && auth) {
        try {
          const result = await auth.createUserWithEmailAndPassword(cleanEmail, password);
          if (result.user && name) await result.user.updateProfile({ displayName: name });
          return normalizeAuthUser(result.user);
        } catch (e) {
          if (e && e.code === 'auth/email-already-in-use') {
            // Se já existe conta Google com mesmo email, tenta vincular automaticamente solicitando login Google
            throw new Error('Este email já está cadastrado. Tente entrar com Google usando o mesmo email para vincular as contas.');
          }
          throw e;
        }
      }
      const data = getLocal('appData') || {};
      const users = data.users || {};
      const duplicated = Object.values(users).find(u => normalizeIdentifier(u.email) === normalizeIdentifier(cleanEmail) || normalizeIdentifier(u.username) === normalizeIdentifier(cleanUsername));
      if (duplicated) throw new Error('Email ou usuário já cadastrado.');
      const uid = 'user_' + Date.now().toString(36);
      const security = window.ImperioSecurity;
      const profile = {
        id: uid,
        name: name || cleanEmail.split('@')[0],
        username: cleanUsername,
        email: cleanEmail,
        passwordHash: security ? security.hashPassword(password) : '',
        role: 'membro',
        city: '',
        whatsapp: '',
        phone: '',
        address: '',
        cellId: '',
        avatarKey: 'dove',
        createdAt: new Date().toISOString()
      };
      setLocal('appData/users/' + uid, profile);
      const user = normalizeAuthUser({ uid, email: cleanEmail, displayName: profile.name, providerId: 'local' });
      setLocalSession(user);
      return user;
    },
    async signInGoogle() {
      if (mode === 'firebase' && auth) {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        try {
          const result = await auth.signInWithPopup(provider);
          return normalizeAuthUser(result.user);
        } catch (error) {
          // Fluxo padrão Firebase para conta existente com outro provedor (email/senha) mesmo email
          if (error && error.code === 'auth/account-exists-with-different-credential' && error.email) {
            const email = error.email;
            const pendingCred = error.credential;
            try {
              const methods = await auth.fetchSignInMethodsForEmail(email);
              if (methods && methods.includes('password')) {
                // Pede senha para vincular contas (experiência integrada)
                const pwd = window.prompt(`Este email (${email}) já tem cadastro com senha. Digite a senha para vincular sua conta Google à mesma conta e continuar como admin/membro existente:`);
                if (!pwd) throw new Error('Vinculação cancelada. Use sua senha para entrar, ou crie outra conta Google.');
                const emailResult = await auth.signInWithEmailAndPassword(email, pwd);
                if (emailResult.user && pendingCred) {
                  try { await emailResult.user.linkWithCredential(pendingCred); } catch (linkErr) { console.warn('Link credential failed', linkErr); }
                }
                return normalizeAuthUser(emailResult.user);
              }
              // Se não for password, tenta login direto via Google se já houver método Google (caso raro)
              throw error;
            } catch (inner) {
              if (inner && inner.code && inner.code.startsWith('auth/')) throw inner;
              throw error;
            }
          }
          throw error;
        }
      }
      // Modo local/demo: tenta reutilizar conta existente com mesmo email Google demo ou com email já cadastrado
      const data = getLocal('appData') || {};
      const users = data.users || {};
      // Tenta encontrar perfil existente pelo email de demonstração ou por qualquer email já usado como Google
      let profile = Object.values(users).find(u => u.providerId === 'google-local');
      // Se existir admin ou qualquer usuário com mesmo email do Google demo, prioriza esse para demonstrar vinculação
      const demoEmail = 'google.demo@imperialbatista.local';
      const byDemoEmail = findUserByEmail(users, demoEmail);
      if (byDemoEmail) profile = byDemoEmail;
      // Se já temos perfil salvo, usa. Senão cria novo mas tenta vincular por email se possível
      if (!profile) {
        const uid = 'google_local';
        profile = {
          id: uid,
          name: 'Visitante Google',
          email: demoEmail,
          role: 'membro',
          providerId: 'google-local',
          avatarKey: 'cross',
          createdAt: new Date().toISOString()
        };
        setLocal('appData/users/' + uid, profile);
      }
      const user = normalizeAuthUser({ uid: profile.id, email: profile.email, displayName: profile.name, photoURL: profile.photoURL || '', providerId: 'google-local' });
      setLocalSession(user);
      return user;
    },
    async signOut() {
      if (mode === 'firebase' && auth) return auth.signOut();
      setLocalSession(null);
    }
  };

  window.ImperioFirebase = {
    init,
    getConfig,
    saveConfig,
    getMode: () => mode,
    get,
    set,
    update,
    push,
    remove,
    onValue,
    Auth
  };
})();
