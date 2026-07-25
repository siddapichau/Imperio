# Igreja Imperial Batista — Imperio

Projeto inicial de um aplicativo/site PWA para Igreja Imperial Batista, pronto para publicar como site estático e empacotar como APK via PWABuilder/Capacitor.

## Estrutura

- `index.html`: aplicativo público, menu responsivo e páginas embutidas por `iframe`.
- `admin.html`: painel administrativo para editar menus, cores, notícias, cultos, agenda, células, usuários, posts e quizzes.
- `pages/`: páginas carregadas dentro do `index.html`.
- `js/`: núcleo do app, integração Firebase, renderização das páginas e admin.
- `css/style.css`: tema claro/escuro e responsivo para celular/computador.
- `assets/`: logo, favicon e ícones do app.
- `manifest.json` e `service-worker.js`: PWA instalável.

## Firebase

O Realtime Database configurado é:

`https://imperio-28408-default-rtdb.firebaseio.com/`

Para login real por e-mail/Google no Firebase, é necessário preencher a configuração Web do Firebase, principalmente `apiKey`, `appId` e `messagingSenderId`. O painel `admin.html` possui uma seção **Firebase** para salvar essa configuração no navegador. Enquanto não houver `apiKey`, o projeto funciona em modo local/demo usando `localStorage`.

### Acesso demo local

- Pastor/Admin: `pastor@imperialbatista.local`
- Senha: `imperio123`

## Como abrir

Como as páginas usam `iframe`, abra com um servidor local:

```bash
python3 -m http.server 8080
```

Depois acesse:

- App: <http://localhost:8080/index.html>
- Admin: <http://localhost:8080/admin.html>

## Transformar em APK

Opção simples: publicar o projeto e usar <https://www.pwabuilder.com/> apontando para a URL publicada.

Opção com Capacitor:

```bash
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init ImperioBatista br.com.imperialbatista.app --web-dir .
npx cap add android
npx cap open android
```

No Android Studio, gere o APK/AAB. O app já possui `manifest.json`, service worker, ícones e layout responsivo.

## Observação de segurança

Este projeto inicial é front-end estático. Para produção, configure regras do Firebase Realtime Database para impedir edições indevidas, valide cargos no servidor/Firebase Rules e remova senhas demo.
