(function () {
  'use strict';

  const app = window.Imperio;

  const FALLBACK_LIBRARY = [
    { keys: ['ansi', 'nervos', 'preocup', 'aflit', 'medo', 'pânico', 'panico', 'estress', 'tens', 'angust', 'apreens'], reference: 'Filipenses 4:6-7', verse: 'Não andeis ansiosos por coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica, com ações de graças. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.', message: 'Deus não te pede que resolva tudo sozinho hoje. Ele te convida a entregar cada peso em oração e receber uma paz que não depende das circunstâncias.', prayer: 'Senhor, entrego cada preocupação nas tuas mãos e recebo a tua paz. Amém.', theme: 'Paz' },
    { keys: ['trist', 'depress', 'chor', 'luto', 'perdi', 'saudade', 'sozinh', 'solid', 'tristeza', 'vazio', 'sós', 'so', 'magoado', 'mágoa', 'dor no coração'], reference: 'Salmos 34:18', verse: 'Perto está o Senhor dos que têm o coração quebrantado e salva os de espírito oprimido.', message: 'A tristeza não te afasta de Deus — ela é exatamente onde Ele se aproxima. Você não precisa carregar isso sozinho; a igreja está aqui com você.', prayer: 'Pai, consola meu coração e mostra que não estou só. Amém.', theme: 'Consolo' },
    { keys: ['grat', 'feliz', 'alegr', 'obrigad', 'venci', 'consegui', 'celebr', 'contente', 'realizado', 'benção', 'benc'], reference: 'Salmos 103:2', verse: 'Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.', message: 'Que alegria! Guarde essa memória: lembrar do que Deus fez fortalece a fé para os próximos dias. Compartilhe esse testemunho com alguém.', prayer: 'Obrigado, Senhor, por tua bondade e cada bênção na minha vida. Amém.', theme: 'Gratidão' },
    { keys: ['cansa', 'exaust', 'esgot', 'sem forç', 'sem forc', 'desanim', 'cansado', 'fadiga', 'sobrecarreg'], reference: 'Mateus 11:28', verse: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.', message: 'Jesus conhece o seu cansaço e não te cobra desempenho. Descanse Nele, ajuste o ritmo e permita que outros te ajudem a carregar o peso.', prayer: 'Jesus, renova as minhas forças e ensina-me a descansar em ti. Amém.', theme: 'Descanso' },
    { keys: ['decis', 'escolh', 'dúvida', 'duvida', 'caminho', 'futuro', 'confus', 'indecis', 'sem saber', 'perdido'], reference: 'Tiago 1:5', verse: 'E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente e não o lança em rosto; e ser-lhe-á dada.', message: 'Antes de decidir, ore, consulte a Palavra e busque conselho maduro. Deus guia quem O busca com sinceridade — Ele não esconde o caminho de quem pergunta.', prayer: 'Dá-me sabedoria, Senhor, para escolher o que te honra. Amém.', theme: 'Sabedoria' },
    { keys: ['rai', 'ódio', 'odio', 'mágoa profunda', 'perdo', 'traí', 'trai', 'injust', 'ressent', 'vingan', 'frustracao', 'frustr'], reference: 'Efésios 4:31-32', verse: 'Vá para longe de vós toda amargura, e ira, e cólera... Antes sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.', message: 'Sua dor é real e Deus a vê. Perdoar não é fingir que não doeu — é entregar a Deus o direito de julgar, para que a mágoa não domine o seu coração.', prayer: 'Senhor, cura minha mágoa e me dá um coração livre para perdoar. Amém.', theme: 'Perdão' },
    { keys: ['doen', 'saúde', 'saude', 'hospital', 'cura', 'dor no corpo', 'enferm', 'doente'], reference: 'Salmos 147:3', verse: 'Sara os quebrantados de coração e liga-lhes as feridas.', message: 'Deus cuida do corpo e da alma. Continue o tratamento, permita que a igreja ore com você e confie: Ele está presente em cada etapa da recuperação.', prayer: 'Senhor, cuida do meu corpo, sustenta minha fé e me dá cura. Amém.', theme: 'Cura' },
    { keys: ['dinheiro', 'desempreg', 'emprego', 'conta', 'dívid', 'divid', 'financ', 'trabalho', 'dificuldade', 'falta', 'necess'], reference: 'Mateus 6:33', verse: 'Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.', message: 'Deus conhece cada necessidade sua. Continue agindo com diligência e sabedoria, mas descanse: o cuidado do Pai não depende do seu saldo.', prayer: 'Pai, supre as minhas necessidades e acalma o meu coração. Amém.', theme: 'Provisão' },
    { keys: ['famíl', 'famil', 'filho', 'casamento', 'esposa', 'marido', 'pais', 'mãe', 'pai ', 'filhos', 'lar'], reference: 'Josué 24:15', verse: 'Porém eu e a minha casa serviremos ao Senhor.', message: 'Lares não se constroem em um dia. Ore por cada pessoa da sua casa, escolha palavras que edificam e confie que Deus trabalha onde você não alcança.', prayer: 'Senhor, abençoa e restaura a minha família. Amém.', theme: 'Família' },
    { keys: ['fé', 'fe ', 'deus', 'oração', 'oracao', 'espiritual', 'distante', 'frio na fé', 'afastado', 'longe de Deus'], reference: 'Jeremias 29:13', verse: 'E buscar-me-eis e me achareis, quando me buscardes com todo o vosso coração.', message: 'Se você sente distância, saiba: Deus nunca saiu do lugar. Um passo simples hoje — cinco minutos de oração e leitura — já reacende a comunhão.', prayer: 'Senhor, reacende em mim a fome pela tua presença. Amém.', theme: 'Comunhão' },
    { keys: ['esperan', 'desesper', 'sem saida', 'imposs', 'difícil', 'dificil', 'pesado', 'fardo', 'opress'], reference: 'Romanos 15:13', verse: 'Ora, o Deus de esperança vos encha de todo o gozo e paz em crer, para que abundeis na esperança pelo poder do Espírito Santo.', message: 'Mesmo quando não há saída visível, a esperança em Deus não envergonha. Deixe o Espírito Santo renovar suas forças e mostrar o próximo passo.', prayer: 'Pai, enche-me de esperança e renova minha confiança em ti. Amém.', theme: 'Esperança' },
    { keys: ['tentaç', 'temptac', 'pecado', 'fraco', 'fraqueza', 'caindo', 'luta'], reference: '1 Coríntios 10:13', verse: 'Não veio sobre vós tentação que não seja humana; mas fiel é Deus, que não vos deixará tentar acima do que podeis; antes, com a tentação dará também o escape.', message: 'Deus é fiel e não permite que você seja tentado além das suas forças. Corra para Ele em oração, afaste-se das ocasiões e peça ajuda a um irmão.', prayer: 'Senhor, dá-me forças para resistir e fugir do que me afasta de ti. Amém.', theme: 'Vitória' },
    { keys: ['culpa', 'verg', 'conden', 'fracass', 'errei', 'errei', 'falha', 'arrepend'], reference: '1 João 1:9', verse: 'Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos limpar de toda injustiça.', message: 'Não há pecado maior que a graça de Deus. Arrependa-se com sinceridade, aceite o perdão em Cristo e levante-se — o Pai te espera de braços abertos.', prayer: 'Pai, perdoa-me e limpa-me pelo sangue de Jesus. Amém.', theme: 'Perdão' },
    { keys: ['coragem', 'força', 'forca', 'enfrentar', 'medroso', 'receio', 'fraco'], reference: 'Josué 1:9', verse: 'Esforça-te e tem bom ânimo; não temas, nem te espantes, porque o Senhor teu Deus é contigo, por onde quer que andares.', message: 'A coragem não é a ausência do medo; é seguir adiante sabendo que Deus vai com você. Ele vai à sua frente e não te abandona.', prayer: 'Senhor, dá-me coragem para enfrentar o que vem pela frente. Amém.', theme: 'Coragem' },
    { keys: ['solidão', 'isolado', 'ninguém', 'ninguem', 'abandon', 'rejeiç', 'rejeic'], reference: 'Hebreus 13:5', verse: 'Não te deixarei, nem te desampararei.', message: 'Mesmo quando você se sente só, Deus está ao seu lado. Busque a comunhão da igreja — você pertence ao corpo de Cristo e faz falta ali.', prayer: 'Pai, que eu sinta tua presença e encontre lugar no teu povo. Amém.', theme: 'Presença' },
    { keys: ['amizade', 'amigo', 'relacionamento', 'irmão', 'irmao', 'comunhão', 'comunhao'], reference: 'Provérbios 17:17', verse: 'Em todo tempo ama o amigo, e para a angústia nasce o irmão.', message: 'Amizades em Cristo são um presente de Deus. Invista em relações que edificam, seja presente, e deixe a igreja ser família para você.', prayer: 'Senhor, põe amigos verdadeiros no meu caminho e faz de mim um irmão presente. Amém.', theme: 'Amizade' },
    { keys: ['estudo', 'prova', 'escola', 'faculdade', 'vestibular', 'provação', 'provacao', 'aprender'], reference: 'Provérbios 2:6', verse: 'Porque o Senhor dá a sabedoria; da sua boca procedem o conhecimento e o entendimento.', message: 'Dedique-se com seriedade, ore por cada etapa e confie que Deus honra o esforço de quem busca fazer o seu melhor.', prayer: 'Senhor, dá-me concentração, sabedoria e paz nos estudos. Amém.', theme: 'Sabedoria' }
  ];

  const DEFAULT_FALLBACK = { reference: 'Salmos 119:105', verse: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.', message: 'Seja qual for o seu momento, a Palavra de Deus ilumina o próximo passo. Leia com calma, ore e siga em frente com confiança.', prayer: 'Senhor, ilumina o meu caminho com a tua Palavra. Amém.', theme: 'Direção' };

  const RISK_WORDS = ['suicid', 'me matar', 'morrer', 'acabar com tudo', 'não quero viver', 'nao quero viver', 'me machucar', 'sumir do mundo'];

  function config() {
    return app.getAt('integrations/ai', {}) || {};
  }

  function isEnabled() {
    const cfg = config();
    return cfg.enabled !== false && Boolean(cfg.apiKey);
  }

  function detectRisk(text) {
    const value = String(text || '').toLowerCase();
    return RISK_WORDS.some(word => value.includes(word));
  }

  /** Chave do histórico de respostas recentes para evitar repetição. */
  function historyKey() {
    const user = (window.Imperio && window.Imperio.state && window.Imperio.state.user) || { id: 'anon' };
    return 'imperioAiRecent:' + (user.id || 'anon') + ':' + new Date().toISOString().slice(0, 10);
  }

  function recentRefs() {
    try { return JSON.parse(localStorage.getItem(historyKey()) || '[]'); } catch (_) { return []; }
  }

  function rememberRef(reference) {
    if (!reference) return;
    const list = recentRefs();
    list.push(String(reference));
    // Guarda apenas os últimos 5 para evitar repetição mas não impedir o retorno de versículos importantes.
    const trimmed = list.slice(-5);
    try { localStorage.setItem(historyKey(), JSON.stringify(trimmed)); } catch (_) {}
  }

  function findMatches(value) {
    return FALLBACK_LIBRARY.filter(entry => entry.keys.some(key => value.includes(key)));
  }

  function pickNonRepeating(matches) {
    const recent = recentRefs();
    // Tenta escolher uma opção que NÃO está nos recentes.
    const fresh = matches.filter(m => !recent.includes(m.reference));
    return (fresh.length ? fresh : matches) || [];
  }

  function localAnswer(feelingText) {
    const value = String(feelingText || '').toLowerCase();
    const matches = findMatches(value);
    let base;
    if (matches.length === 0) {
      base = DEFAULT_FALLBACK;
    } else if (matches.length === 1) {
      base = matches[0];
    } else {
      // VÁRIOS sentimentos detectados (ex: "cansado e triste"): combina os temas na mensagem.
      const pool = pickNonRepeating(matches);
      base = pool[Math.floor(Math.random() * pool.length)] || matches[0];
      // Monta mensagem composta mencionando cada sentimento detectado.
      const feelings = matches.map(m => m.theme.toLowerCase());
      const uniqueFeelings = [...new Set(feelings)];
      if (uniqueFeelings.length > 1) {
        const last = uniqueFeelings.pop();
        const list = uniqueFeelings.join(', ') + ' e ' + last;
        base = Object.assign({}, base, {
          message: `Percebemos que você está falando sobre ${list}. ${base.message} Lembre-se: Deus cuida de cada área da sua vida, e a sua Palavra fala com todas elas.`,
          theme: uniqueFeelings.slice(0, 2).join(' & ') || base.theme
        });
      }
    }
    rememberRef(base.reference);
    return {
      reference: base.reference,
      verse: base.verse,
      message: base.message,
      prayer: base.prayer,
      theme: base.theme,
      source: 'local'
    };
  }

  function usageKey() {
    const user = app.state.user;
    return 'imperioAiUsage:' + (user ? user.id : 'anon') + ':' + new Date().toISOString().slice(0, 10);
  }

  function usageCount() {
    return Number(localStorage.getItem(usageKey()) || 0);
  }

  function bumpUsage() {
    localStorage.setItem(usageKey(), String(usageCount() + 1));
  }

  function withinLimit() {
    const limit = Number(config().dailyLimitPerUser || 0);
    if (!limit) return true;
    return usageCount() < limit;
  }

  function parseAiJson(content) {
    if (!content) return null;
    let text = String(content).trim();
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (!parsed || (!parsed.verse && !parsed.reference)) return null;
      return {
        reference: String(parsed.reference || '').trim(),
        verse: String(parsed.verse || parsed.text || '').trim(),
        message: String(parsed.message || '').trim(),
        prayer: String(parsed.prayer || '').trim(),
        theme: String(parsed.theme || 'Palavra').trim(),
        source: 'deepseek'
      };
    } catch (_) {
      return null;
    }
  }

  async function callDeepSeek(feelingText) {
    const cfg = config();
    const controller = new AbortController();
    // 25s costuma ser suficiente; acima disso o membro fica esperando demais.
    const timer = setTimeout(() => controller.abort(), Number(cfg.timeoutMs || 25000));
    try {
      const recent = recentRefs();
      const localMatches = findMatches(String(feelingText || '').toLowerCase());
      const localThemes = [...new Set(localMatches.map(m => m.theme))];
      const userMessage = 'Sinto/penso o seguinte: ' + String(feelingText || '').slice(0, 900)
        + (localThemes.length > 1 ? '\n\n(O usuário mencionou VÁRIOS sentimentos: ' + localThemes.join(', ') + '. Aborde TODOS eles na resposta — não apenas um.)' : '')
        + (recent.length ? '\n\n(NÃO repita estes versículos usados recentemente: ' + recent.join('; ') + '. Escolha uma referência DIFERENTE e traga uma palavra também diferente da anterior.)' : '');
      const systemPrompt = (cfg.systemPrompt || '')
        + '\n\nREGRAS ADICIONAIS: 1) Se a pessoa mencionar MAIS DE UM sentimento (ex: "cansado e triste"), responda abordando CADA um deles, não apenas um. 2) NUNCA repita o mesmo versículo da resposta anterior; escolha sempre uma referência bíblica diferente, real e apropriada. 3) Varie o tema, a oração e a mensagem — não use fórmulas repetidas.';
      const response = await fetch(cfg.endpoint || 'https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + cfg.apiKey
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: cfg.model || 'deepseek-chat',
          temperature: Math.max(0.8, Number(cfg.temperature != null ? cfg.temperature : 0.85)),
          max_tokens: Number(cfg.maxTokens || 800),
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error('DeepSeek ' + response.status + (detail ? ': ' + detail.slice(0, 160) : ''));
      }
      const payload = await response.json();
      const content = payload && payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
      const parsed = parseAiJson(content);
      if (!parsed) throw new Error('Resposta da IA em formato inesperado.');
      rememberRef(parsed.reference);
      return parsed;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Nunca deixa uma promessa travar a resposta da IA (Firebase offline não resolve o set). */
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error((label || 'Operação') + ' demorou demais.')), ms))
    ]);
  }

  async function saveHistory(feelingText, answer) {
    if (config().saveHistory === false) return;
    const user = app.state.user;
    const record = {
      id: app.uid('ai'),
      userId: user ? user.id : '',
      userName: user ? user.name : 'Visitante',
      input: String(feelingText || '').slice(0, 500),
      reference: answer.reference,
      verse: answer.verse,
      message: answer.message,
      prayer: answer.prayer,
      theme: answer.theme,
      source: answer.source,
      createdAt: new Date().toISOString()
    };
    // Salvar o histórico NUNCA pode impedir o versículo de aparecer para a pessoa.
    try {
      await withTimeout(app.setAt('aiVerses/' + record.id, record), 6000, 'Salvar histórico');
    } catch (error) {
      console.warn('Histórico da IA não salvo:', error);
    }
    return record;
  }

  /**
   * Recebe o que a pessoa sente/pensa e devolve um versículo com aplicação pastoral.
   * Usa DeepSeek quando configurado; se falhar, responde com a biblioteca local (sempre funciona offline).
   */
  async function verseForFeeling(feelingText) {
    const text = String(feelingText || '').trim();
    if (text.length < 3) throw new Error('Escreva um pouco mais sobre o que você está sentindo.');

    const risk = detectRisk(text);
    let answer = null;
    let warning = '';

    if (isEnabled() && withinLimit()) {
      try {
        answer = await callDeepSeek(text);
        bumpUsage();
      } catch (error) {
        console.warn('[ImperioAI]', error);
        // Explica de forma simples por que a IA não respondeu, sem assustar o membro.
        const detail = String((error && error.message) || '');
        if (/aborted|abort/i.test(detail)) warning = 'A IA demorou para responder — trouxemos uma palavra da nossa biblioteca.';
        else if (/Failed to fetch|NetworkError|network/i.test(detail)) warning = 'Sem conexão com a IA agora — trouxemos uma palavra da nossa biblioteca.';
        else if (/401|403/.test(detail)) warning = 'A chave da IA precisa ser revista no painel — por enquanto, uma palavra da nossa biblioteca.';
        else if (/429/.test(detail)) warning = 'A IA está com muitos pedidos agora — trouxemos uma palavra da nossa biblioteca.';
        else warning = 'A IA está indisponível agora — trouxemos uma palavra da nossa biblioteca.';
      }
    } else if (isEnabled() && !withinLimit()) {
      warning = 'Você atingiu o limite diário de consultas à IA. Aqui está uma palavra da nossa biblioteca.';
    }

    // Garante que SEMPRE exista um versículo válido para exibir, mesmo se a IA devolver algo incompleto.
    if (!answer || !answer.verse || !answer.reference) {
      const fallback = localAnswer(text);
      answer = Object.assign({}, fallback, answer || {});
      if (!answer.verse) answer.verse = fallback.verse;
      if (!answer.reference) answer.reference = fallback.reference;
      if (!answer.message) answer.message = fallback.message;
      if (!answer.prayer) answer.prayer = fallback.prayer;
      if (!answer.theme) answer.theme = fallback.theme;
      if (!answer.source) answer.source = 'local';
    }

    answer.warning = warning;
    answer.risk = risk;
    if (risk) {
      answer.riskMessage = 'Percebemos que seu momento é delicado. Você importa muito para Deus e para esta igreja. Fale com nossa liderança agora e, se precisar de ajuda imediata, ligue 188 (CVV, 24h, gratuito).';
    }
    // History is best-effort: falha ao salvar não pode esconder a resposta.
    try { await saveHistory(text, answer); } catch (error) { console.warn('[ImperioAI] histórico', error); }
    return answer;
  }

  async function testConnection() {
    if (!config().apiKey) throw new Error('Informe a chave da API no painel administrativo.');
    const answer = await callDeepSeek('Estou grato hoje, quero um versículo de gratidão.');
    return answer;
  }

  window.ImperioAI = {
    verseForFeeling,
    testConnection,
    isEnabled,
    localAnswer,
    usageCount,
    config
  };
})();
