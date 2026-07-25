(function () {
  'use strict';

  const ROOT_KEY = 'imperioLocalData';
  const SESSION_KEY = 'imperioSession';
  const CONFIG_KEY = 'imperioFirebaseConfig';

  const defaultConfig = {
    apiKey: '',
    authDomain: 'imperio-28408.firebaseapp.com',
    databaseURL: 'https://imperio-28408-default-rtdb.firebaseio.com/',
    projectId: 'imperio-28408',
    storageBucket: 'imperio-28408.appspot.com',
    messagingSenderId: '',
    appId: ''
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
    async signInEmail(email, password) {
      if (mode === 'firebase' && auth) {
        const result = await auth.signInWithEmailAndPassword(email, password);
        return normalizeAuthUser(result.user);
      }
      const data = getLocal('appData') || {};
      const users = data.users || {};
      const found = Object.values(users).find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase());
      if (!found || (found.password && found.password !== password)) throw new Error('Email ou senha inválidos.');
      const user = normalizeAuthUser({ uid: found.id, email: found.email, displayName: found.name, photoURL: found.photoURL || found.avatarUrl || '', providerId: 'local' });
      setLocalSession(user);
      return user;
    },
    async registerEmail({ name, email, password }) {
      if (mode === 'firebase' && auth) {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        if (result.user && name) await result.user.updateProfile({ displayName: name });
        return normalizeAuthUser(result.user);
      }
      const uid = 'user_' + Date.now().toString(36);
      const profile = {
        id: uid,
        name: name || email.split('@')[0],
        email,
        password,
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
      const user = normalizeAuthUser({ uid, email, displayName: profile.name, providerId: 'local' });
      setLocalSession(user);
      return user;
    },
    async signInGoogle() {
      if (mode === 'firebase' && auth) {
        const provider = new window.firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        return normalizeAuthUser(result.user);
      }
      const data = getLocal('appData') || {};
      const users = data.users || {};
      let profile = Object.values(users).find(u => u.providerId === 'google-local');
      if (!profile) {
        const uid = 'google_local';
        profile = {
          id: uid,
          name: 'Visitante Google',
          email: 'google.demo@imperialbatista.local',
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
