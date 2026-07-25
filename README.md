# Igreja Imperial Batista — Imperio

Aplicativo/site PWA para a Igreja Imperial Batista, pronto para publicar como site estático e empacotar como APK via PWABuilder/Capacitor.

## Recursos incluídos

- Login por **email ou nome de usuário**, com mostrar/ocultar senha e opção de lembrar o usuário neste dispositivo.
- Cadastro com nome completo, usuário, email, senha confirmada e validação forte.
- Acesso admin local atualizado: `wesleystudio@gmail.com` ou `wesley` / `Kimmy2310@`.
- Tema vinho/vermelho, nova logo e favicon.
- Compartilhamento para WhatsApp, Facebook, Instagram e compartilhamento nativo do dispositivo.
- Páginas **Versículo** e **Palavra** no menu principal.
- Versículo do dia, palavra por sentimento e formulário de pedido de oração.
- Notificações PWA/APK para avisos, agenda e atividades.
- Avatar do Google preservado quando existir e avatares internos cristãos para perfis locais.

## Estrutura

- `index.html`: aplicativo público, menu responsivo e páginas embutidas por `iframe`.
- `admin.html`: painel administrativo para editar menus, cores, notícias, cultos, agenda, devocionais, células, usuários, posts e quizzes.
- `pages/`: páginas carregadas dentro do `index.html`, incluindo `versiculo.html` e `palavra.html`.
- `js/`: núcleo do app, integração Firebase/localStorage, renderização das páginas e admin.
- `css/style.css`: tema claro/escuro e responsivo para celular/computador.
- `assets/`: logo, favicon e ícones do app.
- `manifest.json` e `service-worker.js`: PWA instalável com cache offline e notificações.

## Firebase

O Realtime Database configurado é:

`https://imperio-28408-default-rtdb.firebaseio.com/`

Para login real por e-mail/Google no Firebase, é necessário preencher a configuração Web do Firebase, principalmente `apiKey`, `appId` e `messagingSenderId`. O painel `admin.html` possui uma seção **Firebase** para salvar essa configuração no navegador. Enquanto não houver `apiKey`, o projeto funciona em modo local/demo usando `localStorage`.

### Acesso demo local

- Pastor/Admin: `wesleystudio@gmail.com` ou usuário `wesley`
- Senha: `Kimmy2310@`

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

No Android Studio, gere o APK/AAB. O app já possui `manifest.json`, service worker, ícones, notificações e layout responsivo.

## Observação de segurança

Este projeto é front-end estático. Para produção, configure regras do Firebase Realtime Database para impedir edições indevidas, valide cargos no servidor/Firebase Rules e substitua credenciais demo por contas reais no Firebase Auth.
