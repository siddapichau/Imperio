/**
 * Login nativo do Google para o APK (Capacitor).
 *
 * PROBLEMA QUE ESTE ARQUIVO RESOLVE
 * ---------------------------------
 * No navegador o botão "Entrar com Google" usa `signInWithPopup()`, que abre uma janela
 * no domínio `imperio-28408.firebaseapp.com`. Isso funciona no site porque o domínio está
 * autorizado no Firebase Auth.
 *
 * Dentro do APK a página é servida por `https://app.imperialbatista.local` (WebView do
 * Capacitor). Nesse ambiente o popup **nunca** funciona, por três motivos somados:
 *   1. A WebView do Android bloqueia `window.open()` (popup) por padrão;
 *   2. O Google recusa OAuth dentro de WebView embutida (erro `disallowed_useragent`);
 *   3. `app.imperialbatista.local` não é (e não pode ser) um domínio autorizado do
 *      Firebase Auth, então sairia `auth/unauthorized-domain`.
 *
 * Já o login por email/senha continua funcionando no APK porque é apenas uma chamada REST
 * para a API do Firebase — sem popup e sem checagem de domínio. Por isso "no site funciona
 * tudo e no APK só o email/senha vai".
 *
 * SOLUÇÃO
 * -------
 * No APK usamos a tela nativa de contas do Android (Credential Manager) através do plugin
 * `@capgo/capacitor-social-login`, pegamos o `idToken` do Google e entregamos ele ao
 * Firebase com `signInWithCredential()` — que também é só REST. Resultado: a mesma conta,
 * o mesmo cargo (pastor/admin) e nenhum popup.
 */
(function () {
  'use strict';

  // Client ID OAuth "Web application" do projeto imperio-28408.
  // É este (e não o Android) que o Credential Manager exige em `webClientId`.
  var DEFAULT_WEB_CLIENT_ID = '20222357769-24as5ue0cde4q08s47e2shddci2r64f2.apps.googleusercontent.com';

  var initPromise = null;
  var initializedWith = '';

  function capacitor() {
    return window.Capacitor || null;
  }

  /** true quando estamos rodando dentro do APK/Capacitor (e não no navegador). */
  function isNative() {
    var cap = capacitor();
    return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  }

  function platform() {
    var cap = capacitor();
    if (cap && typeof cap.getPlatform === 'function') return cap.getPlatform();
    return 'web';
  }

  /** Handle do plugin nativo, injetado pelo Capacitor quando o APK é gerado com o plugin. */
  function plugin() {
    var cap = capacitor();
    return (cap && cap.Plugins && cap.Plugins.SocialLogin) || null;
  }

  /** true quando dá para usar o login nativo do Google. */
  function isAvailable() {
    return isNative() && Boolean(plugin());
  }

  function resolveWebClientId(explicit) {
    var value = String(explicit || '').trim();
    if (value) return value;
    try {
      if (window.ImperioFirebase && typeof window.ImperioFirebase.getConfig === 'function') {
        var fromConfig = String(window.ImperioFirebase.getConfig().googleWebClientId || '').trim();
        if (fromConfig) return fromConfig;
      }
    } catch (_) { /* ignora */ }
    return DEFAULT_WEB_CLIENT_ID;
  }

  /** Inicializa o plugin uma única vez (reinicializa se o client ID mudar). */
  function ensureInitialized(webClientId) {
    var clientId = resolveWebClientId(webClientId);
    var social = plugin();
    if (!social) return Promise.reject(new Error('Plugin de login nativo indisponível.'));
    if (initPromise && initializedWith === clientId) return initPromise;
    initializedWith = clientId;
    initPromise = Promise.resolve(social.initialize({ google: { webClientId: clientId, mode: 'online' } }))
      .catch(function (error) {
        // Permite nova tentativa caso a inicialização falhe (ex.: sem Play Services no momento).
        initPromise = null;
        initializedWith = '';
        throw error;
      });
    return initPromise;
  }

  function rawMessage(error) {
    if (!error) return '';
    if (typeof error === 'string') return error;
    return String(error.message || error.errorMessage || error.code || '');
  }

  /**
   * Converte os erros crus do Credential Manager em mensagens que a secretaria da igreja
   * consegue entender (e que dizem exatamente o que configurar quando for erro de console).
   */
  function friendlyError(error) {
    var raw = rawMessage(error);
    var lower = raw.toLowerCase();

    if (/cancel/.test(lower) || /user_cancel/.test(lower) || /activity is cancelled/.test(lower)) {
      return criticalError('Login com Google cancelado.', 'imperio/google-cancelled', raw);
    }
    if (/28444/.test(lower) || /developer console is not set up correctly/.test(lower) || /10:/.test(lower)) {
      return criticalError(
        'O Google recusou este APK. No Google Cloud do projeto imperio-28408 é preciso ter um cliente OAuth do tipo Android com o pacote br.com.imperialbatista.app e a impressão digital SHA-1 desta versão do app.',
        'imperio/google-console',
        raw
      );
    }
    if (/no credentials|nocredential|no google accounts|during begin sign in/.test(lower)) {
      return criticalError(
        'Nenhuma conta Google encontrada neste aparelho. Abra Configurações do Android › Contas, adicione sua conta Google e tente de novo.',
        'imperio/google-no-account',
        raw
      );
    }
    if (/account reauth failed|\[16\]/.test(lower)) {
      return criticalError(
        'O Google pediu para você entrar novamente nesta conta. Abra Configurações do Android › Contas, remova e adicione a conta Google outra vez.',
        'imperio/google-reauth',
        raw
      );
    }
    if (/network|unable to resolve host|timeout/.test(lower)) {
      return criticalError('Sem conexão com o Google. Verifique sua internet e tente de novo.', 'imperio/google-network', raw);
    }
    if (/play\s*services|api_not_connected|service_missing/.test(lower)) {
      return criticalError(
        'Este aparelho está sem o Google Play Services atualizado, necessário para entrar com o Google. Atualize o Play Services ou entre com email e senha.',
        'imperio/google-play-services',
        raw
      );
    }
    if (/not implemented|unimplemented|indisponível/.test(lower)) {
      return criticalError(
        'Este APK foi gerado sem o plugin de login nativo do Google. Gere o APK novamente pelo GitHub Actions com a versão mais recente do projeto.',
        'imperio/google-plugin-missing',
        raw
      );
    }
    return criticalError(raw || 'Não foi possível entrar com o Google.', 'imperio/google-failed', raw);
  }

  function criticalError(message, code, raw) {
    var error = new Error(message);
    error.code = code;
    error.nativeMessage = raw;
    return error;
  }

  /** Extrai o idToken das várias formas que o plugin pode devolver. */
  function extractIdToken(response) {
    if (!response) return '';
    var result = response.result || response;
    if (typeof result === 'string') return result;
    return String(result.idToken || result.id_token || (result.authentication && result.authentication.idToken) || '');
  }

  /**
   * Abre a tela nativa de contas Google e devolve o idToken para trocar por sessão Firebase.
   * @param {{ webClientId?: string, forcePrompt?: boolean }} [options]
   */
  async function googleIdToken(options) {
    var opts = options || {};
    if (!isAvailable()) throw criticalError('Login nativo do Google indisponível neste dispositivo.', 'imperio/google-plugin-missing', '');
    var social = plugin();
    try {
      await ensureInitialized(opts.webClientId);
      var response = await social.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile'],
          // Deixa a pessoa escolher a conta em vez de reaproveitar a última silenciosamente.
          forcePrompt: opts.forcePrompt !== false,
          filterByAuthorizedAccounts: false,
          autoSelectEnabled: false
        }
      });
      var idToken = extractIdToken(response);
      if (!idToken) {
        throw criticalError('O Google não devolveu o token de identificação. Tente novamente.', 'imperio/google-no-token', JSON.stringify(response || {}));
      }
      return idToken;
    } catch (error) {
      if (error && typeof error.code === 'string' && error.code.indexOf('imperio/') === 0) throw error;
      throw friendlyError(error);
    }
  }

  /** Encerra a sessão nativa para que a próxima entrada mostre o seletor de contas. */
  async function signOut() {
    var social = plugin();
    if (!social || !isNative()) return false;
    try {
      await social.logout({ provider: 'google' });
      return true;
    } catch (_) {
      return false;
    }
  }

  window.ImperioNativeAuth = {
    isNative: isNative,
    isAvailable: isAvailable,
    platform: platform,
    defaultWebClientId: DEFAULT_WEB_CLIENT_ID,
    resolveWebClientId: resolveWebClientId,
    googleIdToken: googleIdToken,
    signOut: signOut
  };
})();
