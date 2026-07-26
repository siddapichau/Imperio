# Igreja Imperial Batista — Imperio

Aplicativo/site PWA para a Igreja Imperial Batista, pronto para publicar como site estático e empacotar como APK via PWABuilder/Capacitor.

## Recursos incluídos

- **3 temas de cores com logo própria**: Vinho Imperial, Azul Celeste e Roxo Vinho Escuro. Ao ativar um tema, o app inteiro muda de cor **e a logo troca junto** — cada tema tem modo claro e escuro.
- **Assistente bíblico com IA (DeepSeek)**: a pessoa escreve o que sente ou pensa e recebe um versículo, aplicação pastoral e oração. Com fallback offline que nunca deixa o membro sem resposta.
- **Dízimos e ofertas por Pix**: QR Code no padrão oficial BR Code do Banco Central, gerado no próprio app (offline), com valor livre a partir do mínimo configurado. Suporte a link do Mercado Pago para cartão.
- **Editor de conteúdo completo**: negrito, títulos, centralizar/alinhar, listas, citações, cores, marca-texto, tabelas, links, vídeos do YouTube/Vimeo, código HTML, imagem por URL e **upload com conversão automática para WebP**.
- **Compartilhamento com imagem**: sempre acompanha a imagem principal do post; quando o post não tem imagem, vai a **logo do tema ativo**. WhatsApp, Instagram, Facebook, Telegram, e-mail, copiar e compartilhamento nativo.
- Login por email ou nome de usuário, cadastro com validação forte e senhas guardadas apenas como hash SHA-256.
- Páginas: Home, Cultos, Agenda, Versículo, Palavra, Atividades, Células, Membros, Quiz, Postar, Perfil, **Dízimo/Oferta, Mural de Oração, Mídia, Plano de Leitura, Aniversariantes, Sobre e Contato**.
- Notificações PWA/APK para avisos, agenda e atividades.
- Tudo 100% editável pelo painel administrativo, pensado para celular e computador.

## Estrutura

- `index.html`: aplicativo público, menu responsivo e páginas embutidas por `iframe`.
- `admin.html`: painel administrativo com 18 abas.
- `pages/`: páginas carregadas dentro do `index.html`.
- `js/core.js`: núcleo, temas/paletas, dados e compartilhamento.
- `js/editor.js`: editor de conteúdo rico e conversão de imagens para WebP.
- `js/ai.js`: integração DeepSeek + biblioteca local de versículos.
- `js/pix.js`: geração de BR Code Pix, QR Code e registro de doações.
- `js/security.js`: hash SHA-256 de senhas.
- `js/vendor-qrcode.js`: gerador de QR Code (MIT, funciona offline).
- `css/style.css`: tema claro/escuro, paletas e responsivo.
- `assets/`: logos e favicons de cada tema.

## Painel administrativo

| Aba | O que edita |
| --- | --- |
| 📊 Dashboard | Visão geral e pendências |
| 🎨 Geral/Menu | Identidade, cores manuais, contatos e menus |
| 🌈 Temas | Tema de cor + logo do app inteiro e compartilhamento |
| 📰 Conteúdo | Notícias, avisos, atividades, datas comemorativas |
| ⛪ Cultos/Agenda | Cultos e eventos |
| 🏡 Células | Células e presença |
| 🎬 Mídia | Pregações, lives e planos de leitura |
| 👥 Usuários | Cadastro e cargos |
| ✅ Aprovação | Aprovar/recusar posts de membros |
| 🙏 Devocionais | Versículos, palavra por sentimento, pedidos |
| 🧠 Quizzes | Quizzes e resultados |
| 💝 Pix/Doações | Chave Pix que recebe, valores, relatório e CSV |
| ✨ IA DeepSeek | Chave da API, modelo, limites e histórico |
| 📄 Páginas | Páginas personalizadas com editor completo |
| ✉️ Mensagens | Contatos e pedidos de oração |
| 🔐 Segurança | Trocar senha do admin e diagnóstico |
| 🧩 JSON | Exportar/importar todo o conteúdo |
| 🔥 Firebase | Credenciais Web do Firebase |

## Cargos e permissões

O painel mostra **apenas** as abas que o cargo da pessoa permite. Áreas sensíveis (Pix, IA,
Segurança, JSON, Firebase, identidade e menus) são **exclusivas do administrador**, e a trava
vale tanto para a interface quanto para a gravação dos dados.

| Cargo | O que pode fazer no painel |
| --- | --- |
| **Membro** | Não acessa o painel. Usa apenas o aplicativo. |
| **Editor** | Notícias, avisos, atividades, datas, mídia, devocionais e páginas. |
| **Líder** | Tudo do editor **+** cultos, agenda, células, quizzes, aprovação de posts, mensagens e lista de membros. |
| **Administrador** (pastor) | Acesso total, incluindo **Pix**, **IA**, **usuários/cargos**, **segurança**, **Firebase** e **JSON**. |

O email `wesleystudio@gmail.com` está registrado como **administrador fixo** em `js/core.js`
(`ADMIN_EMAILS`): ele sempre entra como pastor/admin — por senha ou pelo Google — e não pode ser
rebaixado pela tela de usuários. Para adicionar outro administrador fixo, inclua o email nessa lista.

## Login com Google no APK (Android)

No **navegador** o botão "Entrar com Google" abre um popup no domínio
`imperio-28408.firebaseapp.com`. Dentro do **APK** esse popup nunca funciona, porque:

1. a WebView do Android bloqueia `window.open()`;
2. o Google recusa OAuth dentro de WebView embutida (`disallowed_useragent`);
3. o app roda em `https://app.imperialbatista.local`, que não é um domínio autorizado
   do Firebase Auth (`auth/unauthorized-domain`).

Era exatamente por isso que **só o login por email/senha funcionava no APK**: ele é uma
chamada REST simples, sem popup e sem checagem de domínio.

Agora o APK usa a **tela nativa de contas do Android** (Credential Manager, via
`@capgo/capacitor-social-login`), pega o `idToken` do Google e troca por sessão Firebase
com `signInWithCredential()`. A conta, o email e o cargo (pastor/admin) continuam os mesmos
do site. No navegador nada muda: continua usando o popup.

### O que precisa estar cadastrado no Google Cloud

No projeto **imperio-28408** ([Google Cloud → Credenciais](https://console.cloud.google.com/apis/credentials))
são necessários **dois** clientes OAuth:

| Tipo | Para que serve |
| --- | --- |
| **Aplicativo da Web** | Já existe. É o `googleWebClientId` usado pelo app. |
| **Android** | Precisa existir com o pacote e o SHA-1 abaixo. |

Crie (ou confira) o cliente **Android** com exatamente:

- **Nome do pacote:** `br.com.imperialbatista.app`
- **Impressão digital SHA-1:** `E7:57:DA:8C:3E:09:04:00:6C:EC:70:6E:51:A0:A8:D8:20:43:96:F5`

Esse SHA-1 é fixo: o APK é sempre assinado com `android-signing/imperio-release.keystore`
(aplicada por `scripts/configure-android-signing.js`). Sem uma chave fixa, cada build do
GitHub Actions geraria um SHA-1 diferente e o Google bloquearia o login com o erro
`[28444] Developer console is not set up correctly`.

> Alterações no Google Cloud podem levar algumas horas para valer. Se a tela de consentimento
> estiver em modo **Testing**, adicione os emails em **Público-alvo → Usuários de teste**.

## Login e senha

- Entrada por **email ou nome de usuário** + senha, ou pelo **Google**.
- Entrando com o Google em um email que já existe, o app abre **a mesma conta** e mantém o cargo.
- Quem entra pelo Google é convidado a **criar uma senha**, podendo depois entrar sem o Google
  (o convite reaparece na página **Perfil** enquanto a senha não for definida).
- **Esqueci minha senha** envia link de redefinição pelo Firebase.
- As mensagens de erro explicam o motivo real (conta inexistente, conta do Google, senha errada,
  sem conexão) em vez de um genérico "usuário ou senha inválidos".

## Gerar o APK com ícone e nome corretos

O nome do app vem de `manifest.json` (`name` / `short_name`) e de `capacitor.config.json`
(`appName`), e os ícones já estão gerados em `assets/` e `resources/` com a logo **roxa vinho**.

### Pelo GitHub Actions

Este repositório já possui o workflow `.github/workflows/build-android-apk.yml`. Ele roda automaticamente em:

- Pull Requests para `main`;
- pushes em `main`;
- execução manual pelo botão **Run workflow** na aba **Actions**.

Quando terminar, baixe o arquivo na área **Artifacts** do workflow:
`Igreja-Imperial-Batista-APK-roxo-vinho`.

### Localmente

```bash
npm install
npm run android:build       # gera o APK debug instalável em android/app/build/outputs/apk/debug/
# ou
npm run android:build:release
```

O script prepara a pasta `www/`, cria o projeto Android se ele ainda não existir, sincroniza o Capacitor,
aplica ícone/splash a partir de `resources/` e executa o Gradle.

- `resources/icon.png` — ícone base (1024×1024)
- `resources/icon-foreground.png` + `resources/icon-background.png` — ícone adaptativo do Android
- `resources/splash.png` e `resources/splash-dark.png` — telas de abertura

Pelo **PWABuilder**, o `manifest.json` já entrega os tamanhos 96→512 e um ícone `maskable`,
então a logo roxa vinho é usada automaticamente e o app é instalado como **Igreja Imperial Batista**.

## Configuração inicial

### 1. Acesso administrativo

Por segurança, **nenhuma credencial é exibida nas telas de login**. O usuário administrador padrão é criado na primeira execução e a senha deve ser trocada imediatamente na aba **🔐 Segurança**.

As senhas são armazenadas apenas como hash SHA-256 — nem o painel, nem o banco de dados, nem o código exibem senha em texto puro. Senhas antigas em texto puro são convertidas automaticamente em hash na primeira vez que a base é carregada.

### 2. Chave Pix (dízimos e ofertas)

Painel → **💝 Pix/Doações** → informe a chave Pix que vai receber (a mesma da sua conta Mercado Pago, se for o caso), o nome do recebedor e a cidade. Use **🔍 Testar QR Code** para conferir o recebedor no app do banco antes de divulgar.

### 3. IA DeepSeek

Painel → **✨ IA DeepSeek** → a chave já vem cadastrada no banco de dados do app. Use **🧪 Testar conexão** para validar. Se a chave expirar ou ficar sem crédito, o app passa a responder com a biblioteca local automaticamente.

> **Produção:** a chave fica no banco de dados e é lida pelo cliente. Para volume alto, mova a chamada para uma Cloud Function e mantenha a chave apenas no servidor.

### 4. Firebase

Realtime Database configurado: `https://imperio-28408-default-rtdb.firebaseio.com/`

Para login real por email/Google, preencha a configuração Web em **🔥 Firebase** (`apiKey`, `appId`, `messagingSenderId`). Sem `apiKey`, o projeto funciona em modo local/demo com `localStorage`.

## Como abrir

Como as páginas usam `iframe`, abra com um servidor local:

```bash
python3 -m http.server 8080
```

Depois acesse <http://localhost:8080/index.html>.

## Gerar o APK

Use o GitHub Actions do PR/push para gerar o APK automaticamente. Se quiser gerar localmente:

```bash
npm install
npm run android:build
```

Ou publique o site e use o [PWABuilder](https://www.pwabuilder.com/).
