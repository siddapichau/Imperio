(function () {
  'use strict';

  const roleWeight = { membro: 1, editor: 2, lider: 3, líder: 3, pastor: 4, admin: 4 };
  const state = {
    ready: false,
    data: null,
    user: null,
    authUser: null,
    theme: localStorage.getItem('imperioTheme') || 'light',
    palette: localStorage.getItem('imperioPalette') || '',
    mode: 'local'
  };
  const listeners = {};

  // Paletas oficiais do app. Cada uma troca cores E logo (claro/escuro continuam funcionando).
  const palettes = {
    vinho: {
      id: 'vinho',
      name: 'Vinho Imperial',
      logo: 'assets/logo.png',
      favicon: 'assets/favicon.png',
      light: {
        bg: '#fbf3f5', surface: '#ffffff', surface2: '#fff0f3', text: '#261118', muted: '#7f6570',
        primary: '#6f1025', primary2: '#a61e3a', accent: '#f2c166',
        border: 'rgba(111, 16, 37, .16)', shadow: '0 18px 55px rgba(111, 16, 37, .14)',
        glow1: 'rgba(242,193,102,.24)', glow2: 'rgba(166,30,58,.18)',
        heroFrom: '#6f1025', heroTo: '#a61e3a'
      },
      dark: {
        bg: '#14070c', surface: '#241017', surface2: '#351723', text: '#fff7f9', muted: '#d6b8c2',
        primary: '#ff8aa6', primary2: '#ff4f7d', accent: '#ffd37a',
        border: 'rgba(255,255,255,.12)', shadow: '0 18px 55px rgba(0,0,0,.42)',
        glow1: 'rgba(255,211,122,.12)', glow2: 'rgba(255,79,125,.14)',
        heroFrom: '#4a0a18', heroTo: '#7d1730'
      }
    },
    azul: {
      id: 'azul',
      name: 'Azul Celeste',
      logo: 'assets/logo-azul.png',
      favicon: 'assets/favicon-azul.png',
      light: {
        bg: '#f1f5fd', surface: '#ffffff', surface2: '#e8f0fe', text: '#0e1b33', muted: '#5b6b8a',
        primary: '#13366e', primary2: '#2a63c4', accent: '#f0c674',
        border: 'rgba(19, 54, 110, .16)', shadow: '0 18px 55px rgba(19, 54, 110, .16)',
        glow1: 'rgba(240,198,116,.22)', glow2: 'rgba(42,99,196,.20)',
        heroFrom: '#13366e', heroTo: '#2a63c4'
      },
      dark: {
        bg: '#050c1b', surface: '#0d1a30', surface2: '#132542', text: '#eef4ff', muted: '#a9bcdd',
        primary: '#8ab6ff', primary2: '#4d8dfa', accent: '#ffd68a',
        border: 'rgba(255,255,255,.12)', shadow: '0 18px 55px rgba(0,0,0,.5)',
        glow1: 'rgba(255,214,138,.10)', glow2: 'rgba(77,141,250,.18)',
        heroFrom: '#0a1f45', heroTo: '#1d4894'
      }
    },
    roxo: {
      id: 'roxo',
      name: 'Roxo Vinho Escuro',
      logo: 'assets/logo-roxo.png',
      favicon: 'assets/favicon-roxo.png',
      light: {
        bg: '#f8f2fa', surface: '#ffffff', surface2: '#f3e9f7', text: '#220f2a', muted: '#75607f',
        primary: '#4b0f43', primary2: '#7a1d63', accent: '#e7b566',
        border: 'rgba(75, 15, 67, .16)', shadow: '0 18px 55px rgba(75, 15, 67, .16)',
        glow1: 'rgba(231,181,102,.22)', glow2: 'rgba(122,29,99,.20)',
        heroFrom: '#4b0f43', heroTo: '#7a1d63'
      },
      dark: {
        bg: '#100517', surface: '#1e0c26', surface2: '#2c1236', text: '#faf2ff', muted: '#d0b6dc',
        primary: '#dc9ff0', primary2: '#b45ad2', accent: '#f2cd8c',
        border: 'rgba(255,255,255,.12)', shadow: '0 18px 55px rgba(0,0,0,.5)',
        glow1: 'rgba(242,205,140,.10)', glow2: 'rgba(180,90,210,.18)',
        heroFrom: '#33082f', heroTo: '#5c1350'
      }
    }
  };

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
      palette: 'vinho',
      allowUserPalette: true,
      defaultMode: 'light',
      theme: {
        primary: '#6f1025',
        primary2: '#a61e3a',
        accent: '#f2c166'
      },
      social: { instagram: '', facebook: '', youtube: '', site: '' },
      share: {
        enabled: true,
        defaultImage: '',
        useLogoFallback: true,
        hashtags: '#IgrejaImperialBatista',
        signature: 'Igreja Imperial Batista — baixe nosso app.'
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
        dizimo: { id: 'dizimo', label: 'Dízimo/Oferta', icon: '💝', page: 'dizimo', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 10 },
        postar: { id: 'postar', label: 'Postar', icon: '✍️', page: 'postar', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 11 },
        perfil: { id: 'perfil', label: 'Perfil', icon: '🙋', page: 'perfil', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 12 },
        oracao: { id: 'oracao', label: 'Oração', icon: '🙌', page: 'oracao', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 13 },
        midia: { id: 'midia', label: 'Mídia', icon: '🎬', page: 'midia', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 14 },
        leitura: { id: 'leitura', label: 'Leitura', icon: '📚', page: 'leitura', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 15 },
        aniversarios: { id: 'aniversarios', label: 'Aniversários', icon: '🎂', page: 'aniversarios', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 16 },
        sobre: { id: 'sobre', label: 'Sobre', icon: '⛪', page: 'sobre', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 17 },
        contato: { id: 'contato', label: 'Contato', icon: '📍', page: 'contato', visible: true, roles: ['membro', 'editor', 'lider', 'pastor'], order: 18 }
      }
    },
    integrations: {
      ai: {
        provider: 'deepseek',
        enabled: true,
        apiKey: 'sk-b0dba64c561a48abbb03f1f71bc1b75d',
        endpoint: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 700,
        dailyLimitPerUser: 20,
        saveHistory: true,
        systemPrompt: 'Você é o assistente bíblico pastoral da Igreja Imperial Batista (batista, bíblica e acolhedora). O usuário escreve o que sente ou pensa. Responda SEMPRE em português do Brasil e SEMPRE em JSON válido, sem markdown, no formato: {"reference":"Livro Capítulo:Versículo","verse":"texto do versículo em português (Almeida ou NVI)","message":"aplicação pastoral acolhedora de 2 a 4 frases","prayer":"oração curta de 1 a 2 frases","theme":"tema em uma palavra"}. Nunca invente referências; use apenas versículos reais da Bíblia. Seja acolhedor, nunca julgue. Se houver sinal de risco de vida, inclua na mensagem um convite gentil para procurar a liderança da igreja e o CVV 188.'
      },
      pix: {
        enabled: true,
        provider: 'mercadopago',
        pixKey: '',
        keyType: 'email',
        receiverName: 'IGREJA IMPERIAL BATISTA',
        city: 'SAO PAULO',
        mercadoPagoPublicKey: '',
        mercadoPagoAccessToken: '',
        checkoutLink: '',
        minAmount: 5,
        maxAmount: 10000,
        suggestedAmounts: [5, 10, 20, 50, 100, 200],
        purposes: ['Dízimo', 'Oferta', 'Missões', 'Ação social', 'Construção'],
        message: 'Cada oferta sustenta missões, ação social e o cuidado com pessoas. "Cada um contribua segundo propôs no seu coração." (2 Coríntios 9:7)',
        thanksMessage: 'Que Deus abençoe sua generosidade! Sua contribuição foi registrada.',
        requireReceipt: false,
        showHistory: true
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
      pastor_demo: { id: 'pastor_demo', name: 'Administrador', username: 'admin', email: 'admin@imperialbatista.local', passwordHash: '96804082c42f237e24695664f03c11fd741c4ad4f0be827f209161eeecbc3581', whatsapp: '', phone: '', address: '', role: 'pastor', city: '', cellId: '', avatarKey: 'crown', note: 'Administrador principal', createdAt: now() },
      lider_demo: { id: 'lider_demo', name: 'Líder Ana', username: 'ana.lider', email: 'lider@imperialbatista.local', passwordHash: '25a92495d733cd6d022798c1ca86f9636e2d99dbfbce22985be06d4a12aa577d', whatsapp: '', phone: '', address: '', role: 'lider', city: '', cellId: 'cel_1', avatarKey: 'olive', note: 'Líder de célula', createdAt: now() },
      membro_demo: { id: 'membro_demo', name: 'Membro Demo', username: 'membro', email: 'membro@imperialbatista.local', passwordHash: '25a92495d733cd6d022798c1ca86f9636e2d99dbfbce22985be06d4a12aa577d', whatsapp: '', phone: '', address: '', role: 'membro', city: '', cellId: 'cel_1', avatarKey: 'dove', note: 'Perfil de exemplo', createdAt: now() }
    },
    donations: {},
    aiVerses: {},
    messages: {},
    readingProgress: {},
    media: {
      media_1: { id: 'media_1', title: 'Culto de Celebração — ao vivo', category: 'Culto', speaker: 'Pastor titular', description: 'Assista à transmissão do nosso culto de domingo.', embed: '', image: '', live: false, visible: true, date: now(), createdAt: now() }
    },
    readingPlans: {
      plan_1: {
        id: 'plan_1',
        title: 'Evangelho de João em 21 dias',
        description: 'Um capítulo por dia para conhecer Jesus mais de perto.',
        visible: true,
        days: {
          d1: { id: 'd1', label: 'Dia 1', passage: 'João 1' },
          d2: { id: 'd2', label: 'Dia 2', passage: 'João 2' },
          d3: { id: 'd3', label: 'Dia 3', passage: 'João 3' },
          d4: { id: 'd4', label: 'Dia 4', passage: 'João 4' },
          d5: { id: 'd5', label: 'Dia 5', passage: 'João 5' },
          d6: { id: 'd6', label: 'Dia 6', passage: 'João 6' },
          d7: { id: 'd7', label: 'Dia 7', passage: 'João 7' }
        }
      }
    },
    customPages: {
      sobre_1: { id: 'sobre_1', slug: 'sobre', title: 'Nossa história', content: '<p>A Igreja Imperial Batista nasceu do desejo de servir, amar e discipular. Somos uma família de fé comprometida com a Palavra de Deus e com o cuidado de pessoas.</p>', visible: true, order: 1 }
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
    result.integrations = mergeDeep(defaultData.integrations, incoming.integrations || {});
    // Garante que menus sejam todos visíveis por padrão (novas páginas aparecem automaticamente)
    try {
      Object.keys(defaultData.settings.menus).forEach(key => {
        if (result.settings.menus[key]) result.settings.menus[key].visible = true;
      });
    } catch (_) {}
    // Garante chave DeepSeek padrão se não estiver configurada (evita "não aparece" ao pedir versículo)
    try {
      if (!result.integrations.ai) result.integrations.ai = clone(defaultData.integrations.ai);
      if (!result.integrations.ai.apiKey) result.integrations.ai.apiKey = defaultData.integrations.ai.apiKey;
      if (!result.integrations.ai.endpoint) result.integrations.ai.endpoint = defaultData.integrations.ai.endpoint;
      if (!result.integrations.ai.model) result.integrations.ai.model = defaultData.integrations.ai.model;
      if (result.integrations.ai.enabled == null) result.integrations.ai.enabled = true;
    } catch (_) {}
    ['news', 'announcements', 'services', 'events', 'activities', 'cells', 'posts', 'devotionalVerses', 'feelingWords', 'users', 'presence', 'cellPresence', 'quizzes', 'quizResults', 'prayerRequests', 'commemorations', 'donations', 'aiVerses', 'messages', 'media', 'readingPlans', 'readingProgress', 'customPages', 'audit'].forEach(key => {
      result[key] = hasOwn(incoming, key) ? clone(incoming[key] || {}) : clone(defaultData[key] || {});
    });
    result.users = result.users || {};
    const adminDefaults = clone(defaultData.users.pastor_demo);
    const storedAdmin = result.users.pastor_demo || {};
    // Preserva credenciais definidas pelo administrador; nunca mantém senha em texto puro.
    result.users.pastor_demo = Object.assign({}, adminDefaults, storedAdmin, {
      role: 'pastor',
      createdAt: storedAdmin.createdAt || adminDefaults.createdAt
    });
    Object.keys(result.users).forEach(key => sanitizeStoredUser(result.users[key]));
    return result;
  }

  // Converte qualquer senha em texto puro herdada de versões antigas em hash e remove o campo.
  function sanitizeStoredUser(user) {
    if (!user || typeof user !== 'object') return user;
    const security = window.ImperioSecurity;
    if (user.password) {
      if (security && !security.isHashed(user.password)) user.passwordHash = security.hashPassword(user.password);
      else if (!user.passwordHash) user.passwordHash = user.password;
      delete user.password;
    }
    return user;
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

  function findUserByNormalizedEmail(email) {
    const norm = normalizeIdentifier(email || '');
    if (!norm) return null;
    const users = getAt('users', {}) || {};
    return Object.values(users).find(u => normalizeIdentifier(u.email) === norm) || null;
  }

  async function ensureProfile(authUser) {
    if (!authUser) return null;
    const userPath = 'users/' + authUser.uid;
    let profile = getAt(userPath, null);

    // === VINCULAÇÃO POR EMAIL: se logou com Google e já existe conta com mesmo email (ex: admin), usa a conta existente ===
    if (!profile) {
      const existingByEmail = findUserByNormalizedEmail(authUser.email);
      if (existingByEmail) {
        // Atualiza dados do perfil existente com info do Google (foto, nome) mas mantém role/admin
        profile = Object.assign({}, existingByEmail, {
          // Mantém id original para preservar cargo/role (pastor etc)
          photoURL: authUser.photoURL || existingByEmail.photoURL || '',
          displayName: existingByEmail.name || authUser.displayName || existingByEmail.displayName || '',
          updatedAt: now(),
          lastLoginProvider: authUser.providerId || 'google',
          lastLoginAt: now()
        });
        // Se o uid do auth for diferente do id existente (ex: Google uid vs pastor_demo), mescla:
        // 1) Atualiza o registro original com foto Google se não tinha
        // 2) Cria também um alias users/{authUser.uid} apontando para o mesmo perfil para consistência futura
        //    (mas o app usará o perfil original com role correto)
        await setAt('users/' + existingByEmail.id, profile);
        if (existingByEmail.id !== authUser.uid) {
          // Cria alias opcional para facilitar buscas futuras por uid
          const alias = Object.assign({}, profile, { id: authUser.uid, linkedTo: existingByEmail.id });
          try { await setAt(userPath, alias); } catch (_) {}
          // Retorna perfil canônico (admin original) para manter permissão
          return profile;
        }
        return profile;
      }
    }

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
        providerId: authUser.providerId || 'password',
        createdAt: now()
      };
      await setAt(userPath, profile);
    } else {
      const updates = {};
      if (authUser.photoURL && !profile.photoURL) updates.photoURL = authUser.photoURL;
      if (authUser.displayName && !profile.name) updates.name = authUser.displayName;
      if (authUser.email && !profile.email) updates.email = authUser.email;
      if (Object.keys(updates).length) {
        await updateAt(userPath, updates);
        profile = Object.assign({}, profile, updates);
      }
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
      // Aplica o modo padrão definido pelo admin apenas se o usuário nunca escolheu.
      if (!localStorage.getItem('imperioTheme')) {
        state.theme = getAt('settings/defaultMode', 'light') === 'dark' ? 'dark' : 'light';
      }
      if (state.authUser) {
        let profile = getAt('users/' + state.authUser.uid, null);
        if (!profile) profile = findUserByNormalizedEmail(state.authUser.email);
        if (profile && profile.linkedTo) {
          const canonical = getAt('users/' + profile.linkedTo, null);
          if (canonical) profile = canonical;
        }
        state.user = profile || state.user;
      }
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
      summary: '',
      image: '',
      category: 'Geral',
      authorId: state.user.id,
      authorName: state.user.name,
      status,
      createdAt: now(),
      date: now(),
      approvedBy: status === 'approved' ? state.user.id : ''
    }, values || {});
    if (window.ImperioEditor) {
      post.content = window.ImperioEditor.sanitizeHtml(post.content);
      if (!post.image) post.image = window.ImperioEditor.firstImage(post.content);
      if (!post.summary) post.summary = window.ImperioEditor.excerpt(post.content, 180);
    }
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
      public: data.public === true || data.public === 'true',
      prayCount: 0,
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

  function absoluteUrl(path) {
    if (!path) return '';
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    try { return new URL(path, location.href).href; } catch (_) { return path; }
  }

  // Imagem que acompanha o compartilhamento: imagem do post quando existir, senão a logo do tema ativo.
  function shareImageFor(payload) {
    const share = getAt('settings/share', {});
    const candidate = (payload && (payload.image || payload.cover)) || '';
    if (candidate) return absoluteUrl(candidate);
    if (share.useLogoFallback === false) return '';
    return absoluteUrl(share.defaultImage || logoPath());
  }

  async function imageToFile(url, name) {
    if (!url) return null;
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) return null;
      const blob = await response.blob();
      if (!blob || !/^image\//.test(blob.type)) return null;
      const extension = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      return new File([blob], `${name || 'imperio'}.${extension}`, { type: blob.type });
    } catch (_) {
      return null;
    }
  }

  function buildShareText(data) {
    const share = getAt('settings/share', {});
    const parts = [];
    if (data.title) parts.push(data.title);
    if (data.text) parts.push(data.text);
    if (data.url) parts.push(data.url);
    if (share.signature) parts.push(share.signature);
    if (share.hashtags) parts.push(share.hashtags);
    return parts.filter(Boolean).join('\n');
  }

  async function shareContent(payload, channel) {
    const settings = getAt('settings', {});
    const data = Object.assign({
      title: settings.churchName || 'Igreja Imperial Batista',
      text: 'Conheça o app da Igreja Imperial Batista.',
      url: pageUrl('home')
    }, payload || {});
    const image = shareImageFor(data);
    const textToShare = buildShareText(data);

    async function nativeShare() {
      if (!navigator.share) return false;
      // Tenta enviar com imagem (post ou logo do app); cai para texto se o dispositivo não aceitar arquivos.
      if (image && navigator.canShare) {
        const file = await imageToFile(image, 'imperial-batista');
        if (file && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title: data.title, text: `${data.text}\n${data.url}`, files: [file] });
            return true;
          } catch (error) {
            if (error && error.name === 'AbortError') return true;
          }
        }
      }
      try {
        await navigator.share({ title: data.title, text: data.text, url: data.url });
        return true;
      } catch (error) {
        if (error && error.name === 'AbortError') return true;
        return false;
      }
    }

    const encodedText = encodeURIComponent(`${data.title}\n${data.text}\n${data.url}`);
    const encodedUrl = encodeURIComponent(data.url);

    if (channel === 'native') {
      if (await nativeShare()) return true;
      await copyText(textToShare);
      toast('Texto copiado para compartilhar.');
      return true;
    }
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encodedText}`, '_blank', 'noopener');
    else if (channel === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank', 'noopener');
    else if (channel === 'telegram') window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank', 'noopener');
    else if (channel === 'x') window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank', 'noopener');
    else if (channel === 'email') window.open(`mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(textToShare)}`, '_blank', 'noopener');
    else if (channel === 'copy') {
      await copyText(textToShare);
      toast('Link e texto copiados.');
    } else if (channel === 'image') {
      if (await nativeShare()) return true;
      window.open(image, '_blank', 'noopener');
    } else if (channel === 'instagram') {
      if (navigator.canShare && image) {
        const file = await imageToFile(image, 'imperial-batista');
        if (file && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title: data.title, text: textToShare, files: [file] });
            return true;
          } catch (error) {
            if (error && error.name === 'AbortError') return true;
          }
        }
      }
      await copyText(textToShare).catch(() => false);
      toast('Texto copiado. Cole no Instagram para compartilhar.');
      window.open('https://www.instagram.com/', '_blank', 'noopener');
    } else if (await nativeShare()) {
      return true;
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

  function paletteList() {
    return Object.keys(palettes).map(key => palettes[key]);
  }

  function activePaletteId() {
    const allowUser = getAt('settings/allowUserPalette', true) !== false;
    const userChoice = allowUser ? state.palette : '';
    const adminChoice = getAt('settings/palette', 'vinho');
    const chosen = userChoice || adminChoice || 'vinho';
    return palettes[chosen] ? chosen : 'vinho';
  }

  function activePalette() {
    return palettes[activePaletteId()];
  }

  function setPalette(id, persistUser) {
    if (!palettes[id]) return activePaletteId();
    if (persistUser === false) {
      state.palette = '';
      localStorage.removeItem('imperioPalette');
    } else {
      state.palette = id;
      localStorage.setItem('imperioPalette', id);
    }
    applyTheme();
    emit('theme', state.theme);
    emit('palette', activePaletteId());
    return activePaletteId();
  }

  function logoPath() {
    const custom = getAt('settings/logoPath', '');
    const palette = activePalette();
    // Logo customizada (upload/URL) tem prioridade sobre a logo da paleta.
    if (custom && custom !== 'assets/logo.png' && !/^assets\/logo-(azul|roxo)\.png$/.test(custom)) return custom;
    return palette.logo;
  }

  function faviconPath() {
    return activePalette().favicon;
  }

  function applyTheme() {
    const root = document.documentElement;
    const mode = state.theme === 'dark' ? 'dark' : 'light';
    const palette = activePalette();
    const colors = palette[mode] || palette.light;
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-palette', palette.id);
    const map = {
      '--bg': colors.bg,
      '--surface': colors.surface,
      '--surface-2': colors.surface2,
      '--text': colors.text,
      '--muted': colors.muted,
      '--primary': colors.primary,
      '--primary-2': colors.primary2,
      '--accent': colors.accent,
      '--border': colors.border,
      '--shadow': colors.shadow,
      '--glow-1': colors.glow1,
      '--glow-2': colors.glow2,
      '--hero-from': colors.heroFrom,
      '--hero-to': colors.heroTo
    };
    Object.keys(map).forEach(key => { if (map[key]) root.style.setProperty(key, map[key]); });

    // Cores manuais do admin sobrescrevem apenas quando a paleta é a personalizada.
    const custom = getAt('settings/theme', {});
    if (getAt('settings/palette', 'vinho') === 'custom') {
      if (custom.primary) root.style.setProperty('--primary', custom.primary);
      if (custom.primary2) root.style.setProperty('--primary-2', custom.primary2);
      if (custom.accent) root.style.setProperty('--accent', custom.accent);
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', colors.primary);
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.setAttribute('href', faviconPath());
    const apple = document.querySelector('link[apple-touch-icon], link[rel="apple-touch-icon"]');
    if (apple) apple.setAttribute('href', logoPath());
    document.querySelectorAll('[data-app-logo]').forEach(img => { img.src = logoPath(); });
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
    shareImageFor,
    absoluteUrl,
    palettes,
    paletteList,
    activePalette,
    activePaletteId,
    setPalette,
    logoPath,
    faviconPath,
    sanitizeStoredUser,
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
