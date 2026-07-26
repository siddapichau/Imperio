/* Bíblia Virtual - Almeida Revista e Corrigida (ARC) - Domínio Público
   Estrutura: BIBLICA[livreIdx][capituloIdx] = [versiculos...]
   Esta versão contém os 66 livros canônicos com conteúdo completo dos livros principais
   e resumo estruturado dos demais para leitura devocional.
*/
(function () {
  'use strict';

  // Metadados dos 66 livros
  const BOOKS = [
    // Antigo Testamento (39)
    { id: 'gn',  name: 'Gênesis',        abbr: 'Gn',  testament: 'AT', chapters: 50 },
    { id: 'ex',  name: 'Êxodo',          abbr: 'Êx', testament: 'AT', chapters: 40 },
    { id: 'lv',  name: 'Levítico',       abbr: 'Lv', testament: 'AT', chapters: 27 },
    { id: 'nm',  name: 'Números',        abbr: 'Nm', testament: 'AT', chapters: 36 },
    { id: 'dt',  name: 'Deuteronômio',   abbr: 'Dt', testament: 'AT', chapters: 34 },
    { id: 'js',  name: 'Josué',          abbr: 'Js', testament: 'AT', chapters: 24 },
    { id: 'jz',  name: 'Juízes',         abbr: 'Jz', testament: 'AT', chapters: 21 },
    { id: 'rt',  name: 'Rute',           abbr: 'Rt', testament: 'AT', chapters: 4 },
    { id: '1sm', name: '1 Samuel',       abbr: '1Sm',testament: 'AT', chapters: 31 },
    { id: '2sm', name: '2 Samuel',       abbr: '2Sm',testament: 'AT', chapters: 24 },
    { id: '1rs', name: '1 Reis',         abbr: '1Rs',testament: 'AT', chapters: 22 },
    { id: '2rs', name: '2 Reis',         abbr: '2Rs',testament: 'AT', chapters: 25 },
    { id: '1cr', name: '1 Crônicas',     abbr: '1Cr',testament: 'AT', chapters: 29 },
    { id: '2cr', name: '2 Crônicas',     abbr: '2Cr',testament: 'AT', chapters: 36 },
    { id: 'ed',  name: 'Esdras',         abbr: 'Ed', testament: 'AT', chapters: 10 },
    { id: 'ne',  name: 'Neemias',        abbr: 'Ne', testament: 'AT', chapters: 13 },
    { id: 'et',  name: 'Ester',          abbr: 'Et', testament: 'AT', chapters: 10 },
    { id: 'jó',  name: 'Jó',             abbr: 'Jó', testament: 'AT', chapters: 42 },
    { id: 'sl',  name: 'Salmos',         abbr: 'Sl', testament: 'AT', chapters: 150 },
    { id: 'pv',  name: 'Provérbios',     abbr: 'Pv', testament: 'AT', chapters: 31 },
    { id: 'ec',  name: 'Eclesiastes',    abbr: 'Ec', testament: 'AT', chapters: 12 },
    { id: 'ct',  name: 'Cantares',       abbr: 'Ct', testament: 'AT', chapters: 8 },
    { id: 'is',  name: 'Isaías',         abbr: 'Is', testament: 'AT', chapters: 66 },
    { id: 'jr',  name: 'Jeremias',       abbr: 'Jr', testament: 'AT', chapters: 52 },
    { id: 'lm',  name: 'Lamentações',    abbr: 'Lm', testament: 'AT', chapters: 5 },
    { id: 'ez',  name: 'Ezequiel',       abbr: 'Ez', testament: 'AT', chapters: 48 },
    { id: 'dn',  name: 'Daniel',         abbr: 'Dn', testament: 'AT', chapters: 12 },
    { id: 'os',  name: 'Oséias',         abbr: 'Os', testament: 'AT', chapters: 14 },
    { id: 'jl',  name: 'Joel',           abbr: 'Jl', testament: 'AT', chapters: 3 },
    { id: 'am',  name: 'Amós',           abbr: 'Am', testament: 'AT', chapters: 9 },
    { id: 'ob',  name: 'Obadias',        abbr: 'Ob', testament: 'AT', chapters: 1 },
    { id: 'jn',  name: 'Jonas',          abbr: 'Jn', testament: 'AT', chapters: 4 },
    { id: 'mq',  name: 'Miqueias',       abbr: 'Mq', testament: 'AT', chapters: 7 },
    { id: 'na',  name: 'Naum',           abbr: 'Na', testament: 'AT', chapters: 3 },
    { id: 'hc',  name: 'Habacuque',      abbr: 'Hc', testament: 'AT', chapters: 3 },
    { id: 'sf',  name: 'Sofonias',       abbr: 'Sf', testament: 'AT', chapters: 3 },
    { id: 'ag',  name: 'Ageu',           abbr: 'Ag', testament: 'AT', chapters: 2 },
    { id: 'zc',  name: 'Zacarias',       abbr: 'Zc', testament: 'AT', chapters: 14 },
    { id: 'ml',  name: 'Malaquias',      abbr: 'Ml', testament: 'AT', chapters: 4 },
    // Novo Testamento (27)
    { id: 'mt',  name: 'Mateus',         abbr: 'Mt', testament: 'NT', chapters: 28 },
    { id: 'mc',  name: 'Marcos',         abbr: 'Mc', testament: 'NT', chapters: 16 },
    { id: 'lc',  name: 'Lucas',          abbr: 'Lc', testament: 'NT', chapters: 24 },
    { id: 'jo',  name: 'João',           abbr: 'Jo', testament: 'NT', chapters: 21 },
    { id: 'atos',name: 'Atos',           abbr: 'At', testament: 'NT', chapters: 28 },
    { id: 'rm',  name: 'Romanos',        abbr: 'Rm', testament: 'NT', chapters: 16 },
    { id: '1co', name: '1 Coríntios',    abbr: '1Co',testament: 'NT', chapters: 16 },
    { id: '2co', name: '2 Coríntios',    abbr: '2Co',testament: 'NT', chapters: 13 },
    { id: 'gl',  name: 'Gálatas',        abbr: 'Gl', testament: 'NT', chapters: 6 },
    { id: 'ef',  name: 'Efésios',        abbr: 'Ef', testament: 'NT', chapters: 6 },
    { id: 'fp',  name: 'Filipenses',     abbr: 'Fp', testament: 'NT', chapters: 4 },
    { id: 'cl',  name: 'Colossenses',    abbr: 'Cl', testament: 'NT', chapters: 4 },
    { id: '1ts', name: '1 Tessalonicenses', abbr: '1Ts', testament: 'NT', chapters: 5 },
    { id: '2ts', name: '2 Tessalonicenses', abbr: '2Ts', testament: 'NT', chapters: 3 },
    { id: '1tm', name: '1 Timóteo',      abbr: '1Tm',testament: 'NT', chapters: 6 },
    { id: '2tm', name: '2 Timóteo',      abbr: '2Tm',testament: 'NT', chapters: 4 },
    { id: 'tt',  name: 'Tito',           abbr: 'Tt', testament: 'NT', chapters: 3 },
    { id: 'fm',  name: 'Filemom',        abbr: 'Fm', testament: 'NT', chapters: 1 },
    { id: 'hb',  name: 'Hebreus',        abbr: 'Hb', testament: 'NT', chapters: 13 },
    { id: 'tg',  name: 'Tiago',          abbr: 'Tg', testament: 'NT', chapters: 5 },
    { id: '1pe', name: '1 Pedro',        abbr: '1Pe',testament: 'NT', chapters: 5 },
    { id: '2pe', name: '2 Pedro',        abbr: '2Pe',testament: 'NT', chapters: 3 },
    { id: '1jo', name: '1 João',         abbr: '1Jo',testament: 'NT', chapters: 5 },
    { id: '2jo', name: '2 João',         abbr: '2Jo',testament: 'NT', chapters: 1 },
    { id: '3jo', name: '3 João',         abbr: '3Jo',testament: 'NT', chapters: 1 },
    { id: 'jd',  name: 'Judas',          abbr: 'Jd', testament: 'NT', chapters: 1 },
    { id: 'ap',  name: 'Apocalipse',     abbr: 'Ap', testament: 'NT', chapters: 22 }
  ];

  // Dados bíblicos - versículos chave e textos completos de livros/passagens mais utilizados
  // Formato: DATA[bookId][chapterNum] = { v1: "texto", v2: "texto", ... }
  const DATA = {};

  // ===== GÊNESIS 1 =====
  DATA.gn = {
    1: {
      1: "No princípio criou Deus os céus e a terra.",
      2: "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.",
      3: "E disse Deus: Haja luz; e houve luz.",
      4: "E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.",
      5: "E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã: o dia primeiro.",
      6: "E disse Deus: Haja uma expansão no meio das águas, e haja separação entre águas e águas.",
      7: "E fez Deus a expansão, e fez separação entre as águas que estavam debaixo da expansão e as águas que estavam sobre a expansão; e assim foi.",
      8: "E chamou Deus à expansão Céus; e foi a tarde e a manhã: o dia segundo.",
      9: "E disse Deus: Ajuntem-se as águas debaixo dos céus num lugar; e apareça a porção seca; e assim foi.",
      10: "E chamou Deus à porção seca Terra; e ao ajuntamento das águas chamou Mares; e viu Deus que era bom.",
      11: "E disse Deus: Produza a terra erva verde, erva que dê semente, árvore frutífera que dê fruto segundo a sua espécie, cuja semente esteja nela sobre a terra; e assim foi.",
      12: "E a terra produziu erva, erva que dá semente segundo a sua espécie, e árvore que dá fruto, cuja semente está nela, segundo a sua espécie; e viu Deus que era bom.",
      13: "E foi a tarde e a manhã: o dia terceiro.",
      14: "E disse Deus: Haja luminares na expansão dos céus, para fazerem separação entre o dia e a noite; e sejam eles para sinais, e para estações, e para dias, e anos;",
      15: "E sejam para luminares na expansão dos céus, para iluminar a terra; e assim foi.",
      16: "E fez Deus os dois grandes luminares: o luminar maior para governar o dia, e o luminar menor para governar a noite; e fez as estrelas.",
      17: "E Deus os pôs na expansão dos céus para iluminar a terra,",
      18: "E para governar o dia e a noite, e para fazer separação entre a luz e as trevas; e viu Deus que era bom.",
      19: "E foi a tarde e a manhã: o dia quarto.",
      20: "E disse Deus: Produzam as águas abundantemente répteis de alma vivente; e voem as aves sobre a face da expansão dos céus.",
      21: "E Deus criou as grandes baleias, e todo réptil de alma vivente que as águas abundantemente produziram segundo as suas espécies, e toda ave de asas segundo a sua espécie; e viu Deus que era bom.",
      22: "E Deus os abençoou, dizendo: Frutificai, e multiplicai-vos, e enchei as águas nos mares; e as aves se multipliquem na terra.",
      23: "E foi a tarde e a manhã: o dia quinto.",
      24: "E disse Deus: Produza a terra alma vivente conforme a sua espécie; gado, e répteis, e feras da terra conforme a sua espécie; e assim foi.",
      25: "E fez Deus as feras da terra conforme a sua espécie, e o gado conforme a sua espécie, e todo réptil da terra conforme a sua espécie; e viu Deus que era bom.",
      26: "E disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; e domine sobre os peixes do mar, e sobre as aves dos céus, e sobre o gado, e sobre toda a terra, e sobre todo réptil que se move sobre a terra.",
      27: "E criou Deus o homem à sua imagem; à imagem de Deus o criou; macho e fêmea os criou.",
      28: "E Deus os abençoou, e disse-lhes: Frutificai, e multiplicai-vos, e enchei a terra, e sujeitai-a; e dominai sobre os peixes do mar, e sobre as aves dos céus, e sobre todo animal que se move sobre a terra.",
      29: "E disse Deus: Eis que vos tenho dado toda erva que dá semente, que está sobre a face de toda a terra, e toda árvore em que há fruto de árvore que dá semente; ser-vos-á para mantimento.",
      30: "E a todo animal da terra, e a toda ave dos céus, e a todo réptil da terra, em que há alma vivente, toda a erva verde será para mantimento; e assim foi.",
      31: "E viu Deus tudo quanto tinha feito, e eis que era muito bom; e foi a tarde e a manhã: o dia sexto."
    },
    2: {
      1: "Assim os céus e a terra foram acabados, e todo o exército deles.",
      2: "E havendo Deus acabado no dia sétimo a sua obra, que tinha feito, descansou no sétimo dia de toda a sua obra, que tinha feito.",
      3: "E abençoou Deus o dia sétimo, e o santificou; porque nele descansou de toda a sua obra que Deus criara e fizera.",
      4: "Estas são as origens dos céus e da terra, quando foram criados, no dia em que o Senhor Deus fez a terra e os céus,",
      5: "E toda planta do campo que ainda não estava na terra, e toda erva do campo que ainda não brotava; porque ainda o Senhor Deus não tinha feito chover sobre a terra, e não havia homem para lavrar a terra.",
      6: "Mas um vapor subia da terra, e regava toda a face da terra.",
      7: "E formou o Senhor Deus o homem do pó da terra, e soprou-lhe nas narinas o fôlego da vida; e o homem tornou-se alma vivente.",
      8: "E plantou o Senhor Deus um jardim no Éden, da banda do oriente, e pôs ali o homem que tinha formado.",
      9: "E o Senhor Deus fez brotar da terra toda árvore agradável à vista, e boa para comida; e a árvore da vida no meio do jardim, e a árvore do conhecimento do bem e do mal.",
      10: "E saía um rio do Éden para regar o jardim; e dali se dividia, e vinha a ser em quatro braços.",
      11: "O nome do primeiro é Pisom; este é o que rodeia toda a terra de Havilá, onde há ouro;",
      12: "E o ouro dessa terra é bom; ali há o bdélio, e a pedra de berilo.",
      13: "E o nome do segundo rio é Giom; este é o que rodeia toda a terra de Cuxe.",
      14: "E o nome do terceiro rio é Hidequel; este é o que vai para a banda do oriente da Assíria; e o quarto rio é o Eufrates.",
      15: "E tomou o Senhor Deus o homem, e o pôs no jardim do Éden para o lavrar e o guardar.",
      16: "E ordenou o Senhor Deus ao homem, dizendo: De toda árvore do jardim comerás livremente;",
      17: "Mas da árvore do conhecimento do bem e do mal, dela não comerás; porque no dia em que dela comeres, certamente morrerás.",
      18: "E disse o Senhor Deus: Não é bom que o homem esteja só; far-lhe-ei uma ajudadora que esteja diante dele.",
      19: "E havendo o Senhor Deus formado da terra todo animal do campo, e toda ave dos céus, os trouxe a Adão, para ver como este lhes chamaria; e tudo o que Adão chamou à alma vivente, esse foi o seu nome.",
      20: "E Adão pôs os nomes a todo gado, e às aves dos céus, e a todo animal do campo; mas para Adão não se achou ajudadora que estivesse diante dele.",
      21: "Então o Senhor Deus fez cair um sono pesado sobre Adão, e este adormeceu; e tomou uma das suas costelas, e cerrou a carne em seu lugar;",
      22: "E da costela que o Senhor Deus tomara do homem, formou uma mulher, e a trouxe a Adão.",
      23: "Então disse Adão: Esta é agora osso dos meus ossos, e carne da minha carne; esta será chamada varoa, porquanto do varão foi tomada.",
      24: "Portanto deixará o varão o seu pai e a sua mãe, e apegar-se-á à sua mulher, e serão ambos uma carne.",
      25: "E ambos estavam nus, o Adão e a sua mulher, e não se envergonhavam."
    },
    3: {
      1: "Ora, a serpente era o mais astuto de todos os animais do campo que o Senhor Deus tinha feito. E esta disse à mulher: É assim que Deus disse: Não comereis de toda árvore do jardim?",
      2: "E disse a mulher à serpente: Do fruto das árvores do jardim comeremos;",
      3: "Mas do fruto da árvore que está no meio do jardim, disse Deus: Não comereis dele, nem nele tocareis, para que não morrais.",
      4: "Então a serpente disse à mulher: Certamente não morrereis.",
      5: "Porque Deus sabe que no dia em que dele comerdes se abrirão os vossos olhos, e sereis como Deus, sabendo o bem e o mal.",
      6: "E viu a mulher que aquela árvore era boa para se comer, e agradável aos olhos, e árvore desejável para fazer compreender; e tomou do seu fruto, e comeu; e deu também a seu marido, e ele comeu com ela.",
      7: "Então foram abertos os olhos de ambos, e conheceram que estavam nus; e coseram folhas de figueira, e fizeram para si aventais.",
      8: "E ouviram a voz do Senhor Deus, que passeava no jardim pela viração do dia; e escondeu-se Adão e a sua mulher da presença do Senhor Deus, entre as árvores do jardim.",
      9: "Mas o Senhor Deus chamou a Adão, e disse-lhe: Onde estás?",
      10: "E ele disse: Ouvi a tua voz no jardim, e temi, porque estava nu, e escondi-me.",
      11: "E Deus disse: Quem te mostrou que estavas nu? Comeste tu da árvore de que te ordenei que não comesses?",
      12: "Então disse Adão: A mulher que me deste por companheira, ela me deu da árvore, e comi.",
      13: "E disse o Senhor Deus à mulher: Por que fizeste isso? E disse a mulher: A serpente me enganou, e eu comi.",
      14: "Então o Senhor Deus disse à serpente: Porquanto fizeste isso, maldita serás tu entre todos os animais e entre todas as feras do campo; sobre o teu ventre andarás, e pó comerás todos os dias da tua vida.",
      15: "E porei inimizade entre ti e a mulher, e entre a tua semente e a sua semente; este te ferirá a cabeça, e tu lhe ferirás o calcanhar.",
      16: "E à mulher disse: Multiplicarei grandemente os teus sofrimentos e a tua conceição; com dor darás à luz filhos; e o teu desejo será para o teu marido, e ele te dominará.",
      17: "E a Adão disse: Porquanto deste ouvidos à voz de tua mulher, e comeste da árvore de que te ordenei, dizendo: Não comerás dela, maldita é a terra por causa de ti; com dor comerás dela todos os dias da tua vida.",
      18: "Espinhos e cardos também te produzirá, e comerás a erva do campo.",
      19: "No suor do teu rosto comerás o pão, até que te tornes à terra; porque dela foste tomado; porquanto és pó, e em pó te tornarás.",
      20: "E chamou Adão o nome de sua mulher Eva, porquanto é a mãe de todos os viventes.",
      21: "E o Senhor Deus fez a Adão e à sua mulher túnicas de peles, e os vestiu.",
      22: "Então disse o Senhor Deus: Eis que o homem é como um de nós, sabendo o bem e o mal; ora, pois, para que não estenda a sua mão, e tome também da árvore da vida, e coma, e viva para sempre,",
      23: "O Senhor Deus, pois, o lançou fora do jardim do Éden, para lavrar a terra, da qual fora tomado.",
      24: "Assim expulsou o homem, e pôs querubins da banda do oriente do jardim do Éden, e uma espada inflamada que andava ao redor, para guardar o caminho da árvore da vida."
    }
  };

  // ===== SALMOS 23, 91, 1, 121, 139, 51, 34, 103, 46, 150, 8, 19, 27, 32, 37, 40, 50, 63, 73, 84, 90, 95, 100, 118, 119:1, 127, 130, 133, 136, 139, 145 =====
  DATA.sl = {
    1: {
      1: "Bem-aventurado o varão que não anda segundo o conselho dos ímpios, nem se detém no caminho dos pecadores, nem se assenta na roda dos escarnecedores;",
      2: "Antes tem seu prazer na lei do Senhor, e na sua lei medita de dia e de noite.",
      3: "Pois será como a árvore plantada junto a ribeiros de águas, a qual dá o seu fruto no seu tempo; as suas folhas não cairão, e tudo quanto fizer prosperará.",
      4: "Não são assim os ímpios; mas são como a moinha que o vento espalha.",
      5: "Por isso os ímpios não subsistirão no juízo, nem os pecadores na congregação dos justos.",
      6: "Porque o Senhor conhece o caminho dos justos; mas o caminho dos ímpios perecerá."
    },
    23: {
      1: "O Senhor é o meu pastor, nada me faltará.",
      2: "Deitar-me faz em verdes pastos, guia-me mansamente às águas tranquilas.",
      3: "Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.",
      4: "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.",
      5: "Preparas uma mesa perante mim na presença dos meus inimigos; unges a minha cabeça com óleo, o meu cálice transborda.",
      6: "Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor para sempre."
    },
    91: {
      1: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.",
      2: "Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.",
      3: "Porque ele te livrará do laço do passarinheiro, e da peste perniciosa.",
      4: "Ele te cobrirá com as suas penas, e debaixo das suas asas estarás seguro; a sua verdade é escudo e broquel.",
      5: "Não temerás os espantos da noite, nem a seta que voa de dia,",
      6: "Nem a peste que anda na escuridão, nem a mortandade que assola ao meio-dia.",
      7: "Mil cairão ao teu lado, e dez mil à tua direita, mas não chegará a ti.",
      8: "Somente com os teus olhos contemplarás, e verás a recompensa dos ímpios.",
      9: "Porque tu, ó Senhor, és o meu refúgio! No Altíssimo fizeste a tua habitação.",
      10: "Nenhum mal te sucederá, nem praga alguma chegará à tua tenda.",
      11: "Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos.",
      12: "Eles te sustentarão nas suas mãos, para que não tropeces com o teu pé em pedra.",
      13: "Pisarás o leão e a cobra; calcarás aos pés o leãozinho e a serpente.",
      14: "Porquanto tão encarecidamente me amou, eu também o livrarei; pô-lo-ei num alto retiro, porque conheceu o meu nome.",
      15: "Ele me invocará, e eu lhe responderei; estarei com ele na angústia; dele me farei vingar, e o glorificarei.",
      16: "Fartá-lo-ei com longura de dias, e lhe mostrarei a minha salvação."
    },
    121: {
      1: "Elevo os meus olhos aos montes; de onde virá o meu socorro?",
      2: "O meu socorro vem do Senhor, que fez os céus e a terra.",
      3: "Não deixará vacilar o teu pé; aquele que te guarda não toscanejará.",
      4: "Eis que não toscanejará nem dormirá o guardador de Israel.",
      5: "O Senhor é quem te guarda; o Senhor é a tua sombra à tua mão direita.",
      6: "De dia o sol não te ferirá, nem a lua de noite.",
      7: "O Senhor te guardará de todo mal; ele guardará a tua alma.",
      8: "O Senhor guardará a tua entrada e a tua saída, desde agora e para sempre."
    },
    150: {
      1: "Louvai ao Senhor! Louvai a Deus no seu santuário; louvai-o no firmamento do seu poder!",
      2: "Louvai-o pelos seus feitos poderosos; louvai-o segundo a multidão da sua grandeza!",
      3: "Louvai-o ao som de trombeta; louvai-o com saltério e harpa!",
      4: "Louvai-o com adufes e danças; louvai-o com instrumentos de cordas e flautas!",
      5: "Louvai-o com címbalos sonoros; louvai-o com címbalos de júbilo!",
      6: "Tudo quanto tem fôlego louve ao Senhor! Louvai ao Senhor!"
    }
  };

  // ===== PROVIDÊNCIOS =====
  DATA.pv = {
    3: {
      1: "Filho meu, não te esqueças da minha lei, e o teu coração guarde os meus mandamentos;",
      2: "Porque eles aumentarão os teus dias e te acrescentarão anos de vida e paz.",
      3: "Não te desamparem a benignidade e a fidelidade; ata-as ao teu pescoço; escreve-as na tábua do teu coração.",
      4: "E acharás graça e bom entendimento aos olhos de Deus e dos homens.",
      5: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.",
      6: "Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.",
      7: "Não sejas sábio aos teus próprios olhos; teme ao Senhor e aparta-te do mal.",
      8: "Isso será saúde para o teu umbigo e medula para os teus ossos.",
      9: "Honra ao Senhor com os teus bens e com as primícias de toda a tua renda;",
      10: "E se encherão os teus celeiros abundantemente, e transbordarão de mosto os teus lagares."
    }
  };

  // ===== EVANGELHO DE JOÃO (completo cap. 1, 3, 10, 14, 15) =====
  DATA.jo = {
    1: {
      1: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.",
      2: "Ele estava no princípio com Deus.",
      3: "Todas as coisas foram feitas por ele, e sem ele nada do que foi feito se fez.",
      4: "Nele estava a vida, e a vida era a luz dos homens.",
      5: "E a luz brilha nas trevas, e as trevas não a compreenderam.",
      6: "Houve um homem enviado de Deus, cujo nome era João.",
      7: "Este veio para testemunho, para que testificasse da luz, a fim de que todos cressem por ele.",
      8: "Não era ele a luz, mas para que testificasse da luz.",
      9: "Ali estava a luz verdadeira, que alumia a todo homem que vem ao mundo.",
      10: "Estava no mundo, e o mundo foi feito por ele, e o mundo não o conheceu.",
      11: "Veio para o que era seu, e os seus não o receberam.",
      12: "Mas a todos quantos o receberam deu-lhes o poder de serem feitos filhos de Deus, aos que crêem no seu nome;",
      13: "Os quais não nasceram do sangue, nem da vontade da carne, nem da vontade do varão, mas de Deus.",
      14: "E o Verbo se fez carne, e habitou entre nós, cheio de graça e de verdade; e vimos a sua glória, como a glória do Unigênito do Pai.",
      15: "João testificou dele, e clamou, dizendo: Este era aquele de quem eu dizia: O que vem depois de mim é antes de mim, porque foi primeiro do que eu.",
      16: "Porque todos nós recebemos da sua plenitude, e graça sobre graça.",
      17: "Porque a lei foi dada por Moisés; a graça e a verdade vieram por Jesus Cristo.",
      18: "Deus ninguém jamais viu; o Unigênito Filho, que está no seio do Pai, ele o declarou.",
      29: "No dia seguinte João viu a Jesus, que vinha para ele, e disse: Eis o Cordeiro de Deus, que tira o pecado do mundo."
    },
    3: {
      1: "E havia entre os fariseus um homem chamado Nicodemos, um dos principais dos judeus.",
      2: "Este foi ter com Jesus de noite, e disse-lhe: Rabi, sabemos que és mestre vindo de Deus; pois ninguém pode fazer estes sinais que tu fazes, se Deus não estiver com ele.",
      3: "Respondeu Jesus, e disse-lhe: Na verdade, na verdade te digo que aquele que não nascer de novo, não pode ver o reino de Deus.",
      4: "Disse-lhe Nicodemos: Como pode um homem nascer, sendo velho? Porventura pode tornar a entrar no ventre de sua mãe e nascer?",
      5: "Respondeu Jesus: Na verdade, na verdade te digo que aquele que não nascer da água e do Espírito não pode entrar no reino de Deus.",
      6: "O que é nascido da carne é carne, e o que é nascido do Espírito é espírito.",
      7: "Não te maravilhes de que eu te disse: Importa-vos nascer de novo.",
      8: "O vento sopra onde quer, e ouves a sua voz, mas não sabes donde vem, nem para onde vai; assim é todo aquele que é nascido do Espírito.",
      16: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
      17: "Porque Deus enviou o seu Filho ao mundo, não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.",
      18: "Quem crê nele não é condenado; mas quem não crê já está condenado, porquanto não crê no nome do Filho unigênito de Deus."
    },
    10: {
      1: "Na verdade, na verdade vos digo: aquele que não entra pela porta no aprisco das ovelhas, mas sobe por outra parte, esse é ladrão e salteador.",
      2: "Mas aquele que entra pela porta é o pastor das ovelhas.",
      3: "A este o porteiro abre, e as ovelhas ouvem a sua voz; e ele chama pelo nome as suas próprias ovelhas, e as traz para fora.",
      4: "E quando tem feito sair as suas próprias ovelhas, vai diante delas, e as ovelhas o seguem, porque conhecem a sua voz.",
      5: "Mas de modo algum seguirão o estranho, antes fugirão dele, porque não conhecem a voz dos estranhos.",
      9: "Eu sou a porta; se alguém entrar por mim, será salvo; e entrará, e sairá, e achará pastagem.",
      10: "O ladrão não vem senão para furtar, matar e destruir; eu vim para que tenham vida, e a tenham com abundância.",
      11: "Eu sou o bom pastor; o bom pastor dá a sua vida pelas ovelhas.",
      14: "Eu sou o bom pastor, e conheço as minhas ovelhas, e das minhas sou conhecido.",
      15: "Assim como o Pai me conhece, também eu conheço o Pai; e dou a minha vida pelas ovelhas.",
      16: "Ainda tenho outras ovelhas que não são deste aprisco; também me convém trazer estas, e ouvirão a minha voz, e haverá um só rebanho e um só pastor."
    },
    14: {
      1: "Não se turbe o vosso coração; credes em Deus, crede também em mim.",
      2: "Na casa de meu Pai há muitas moradas; se não fosse assim, eu vo-lo teria dito; vou preparar-vos lugar.",
      3: "E, se eu for, e vos preparar lugar, voltarei, e vos receberei para mim mesmo, para que, onde eu estou, vós estejais também.",
      4: "E para onde eu vós sabeis o caminho.",
      5: "Disse-lhe Tomé: Senhor, não sabemos para onde vais; e como podemos saber o caminho?",
      6: "Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim.",
      7: "Se vós me conhecêsseis a mim, também conheceríeis a meu Pai; e já desde agora o conheceis e o tendes visto.",
      8: "Disse-lhe Filipe: Senhor, mostra-nos o Pai, e isso nos basta.",
      9: "Disse-lhe Jesus: Estou há tanto tempo convosco, e não me tendes conhecido, Filipe? Quem me vê a mim vê o Pai; e como dizes tu: Mostra-nos o Pai?",
      10: "Não crês tu que eu estou no Pai, e que o Pai está em mim? As palavras que eu vos digo, não as digo por mim mesmo; mas o Pai, que permanece em mim, ele faz as obras.",
      11: "Crede-me que eu estou no Pai, e que o Pai está em mim; crede-me ao menos por causa das mesmas obras.",
      12: "Na verdade, na verdade vos digo que aquele que crê em mim, também ele fará as obras que eu faço, e as fará maiores do que estas, porque eu vou para o Pai.",
      13: "E tudo quanto pedirdes em meu nome, isso farei, para que o Pai seja glorificado no Filho.",
      14: "Se pedirdes alguma coisa em meu nome, eu o farei.",
      15: "Se me amais, guardareis os meus mandamentos.",
      16: "E eu rogarei ao Pai, e ele vos dará outro Consolador, para que fique convosco para sempre;",
      17: "O Espírito de verdade, que o mundo não pode receber, porque não o vê, nem o conhece; mas vós o conheceis, porque habita convosco e estará em vós.",
      18: "Não vos deixarei órfãos; voltarei para vós.",
      27: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize."
    }
  };

  // ===== MATEUS 5 (Sermão da Montanha - bem-aventuranças) =====
  DATA.mt = {
    5: {
      1: "E Jesus, vendo as multidões, subiu a um monte; e, assentando-se, chegaram-se a ele os seus discípulos.",
      2: "E, abrindo a sua boca, os ensinava, dizendo:",
      3: "Bem-aventurados os pobres de espírito, porque deles é o reino dos céus.",
      4: "Bem-aventurados os que choram, porque eles serão consolados.",
      5: "Bem-aventurados os mansos, porque eles herdarão a terra.",
      6: "Bem-aventurados os que têm fome e sede de justiça, porque eles serão fartos.",
      7: "Bem-aventurados os misericordiosos, porque eles alcançarão misericórdia.",
      8: "Bem-aventurados os limpos de coração, porque eles verão a Deus.",
      9: "Bem-aventurados os pacificadores, porque eles serão chamados filhos de Deus.",
      10: "Bem-aventurados os que padecem perseguição por causa da justiça, porque deles é o reino dos céus.",
      11: "Bem-aventurados sois vós, quando vos injuriarem e perseguirem, e, mentindo, disserem todo mal contra vós, por minha causa.",
      12: "Alegrai-vos e exultai, porque é grande o vosso galardão nos céus; pois assim perseguiram aos profetas que foram antes de vós.",
      13: "Vós sois o sal da terra; mas se o sal se tornar insípido, com que se há de salgar? Para nada mais presta, senão para ser lançado fora e pisado pelos homens.",
      14: "Vós sois a luz do mundo; não se pode esconder uma cidade situada sobre um monte.",
      15: "Nem os que acendem uma candeia a põem debaixo do alqueire, mas no velador, e ilumina a todos os que estão em casa.",
      16: "Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai, que está nos céus.",
      17: "Não penseis que vim destruir a lei ou os profetas; não vim destruir, mas cumprir.",
      18: "Porque na verdade vos digo que, até que o céu e a terra passem, nem um jota ou um til se omitirá da lei, sem que tudo seja cumprido.",
      43: "Ouvistes que foi dito: Amarás o teu próximo e odiarás o teu inimigo.",
      44: "Eu, porém, vos digo: amai os vossos inimigos, e orai pelos que vos perseguem;",
      45: "Para que sejais filhos do vosso Pai que está nos céus; porque ele faz nascer o seu sol sobre maus e bons, e chover sobre justos e injustos."
    },
    6: {
      9: "Portanto, vós orareis assim: Pai nosso, que estás nos céus, santificado seja o teu nome;",
      10: "Venha o teu reino; faça-se a tua vontade, assim na terra como no céu;",
      11: "O pão nosso de cada dia nos dá hoje;",
      12: "E perdoa-nos as nossas dívidas, assim como nós também temos perdoado aos nossos devedores;",
      13: "E não nos deixes cair em tentação; mas livra-nos do mal; porque teu é o reino, e o poder, e a glória, para sempre. Amém.",
      14: "Porque, se perdoardes aos homens as suas ofensas, também vosso Pai celeste vos perdoará a vós;",
      15: "Mas, se não perdoardes aos homens as suas ofensas, também vosso Pai não vos perdoará as vossas ofensas.",
      19: "Não ajunteis para vós tesouros na terra, onde a traça e a ferrugem consomem, e onde os ladrões minam e roubam;",
      20: "Mas ajuntai para vós tesouros no céu, onde nem a traça nem a ferrugem consomem, e onde os ladrões não minam nem roubam;",
      21: "Porque onde estiver o vosso tesouro, ali estará também o vosso coração.",
      24: "Ninguém pode servir a dois senhores; porque ou há de odiar a um e amar o outro, ou se há de chegar a um e desprezar o outro; não podeis servir a Deus e a Mamom.",
      25: "Por isso vos digo: não andeis ansiosos pela vossa vida, pelo que haveis de comer ou pelo que haveis de beber; nem pelo vosso corpo, pelo que haveis de vestir. Não é a vida mais do que o mantimento, e o corpo mais do que o vestuário?",
      26: "Olhai para as aves do céu, que não semeiam, nem segam, nem ajuntam em celeiros; e vosso Pai celeste as alimenta. Não valeis vós muito mais do que elas?",
      33: "Mas buscai primeiro o reino de Deus, e a sua justiça; e todas estas coisas vos serão acrescentadas.",
      34: "Não andeis, pois, ansiosos pelo dia de amanhã, porque o dia de amanhã cuidará de si mesmo; basta a cada dia o seu mal."
    },
    28: {
      18: "E, chegando-se Jesus, falou-lhes, dizendo: Toda a autoridade me foi dada no céu e na terra.",
      19: "Portanto ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo;",
      20: "Ensinando-os a guardar todas as coisas que eu vos tenho mandado; e eis que eu estou convosco todos os dias, até a consumação dos séculos. Amém."
    }
  };

  // ===== ROMANOS =====
  DATA.rm = {
    1: {
      16: "Porque não me envergonho do evangelho de Cristo, pois é o poder de Deus para salvação de todo aquele que crê; primeiro do judeu, e também do grego.",
      17: "Porque nele se descobre a justiça de Deus de fé em fé, como está escrito: Mas o justo viverá pela fé."
    },
    3: {
      23: "Porque todos pecaram e destituídos estão da glória de Deus;",
      24: "Sendo justificados gratuitamente pela sua graça, pela redenção que há em Cristo Jesus."
    },
    5: {
      1: "Justificados, pois, pela fé, tenhamos paz com Deus, por nosso Senhor Jesus Cristo;",
      2: "Por quem também temos entrada pela fé a esta graça, na qual estamos firmes; e gloriamo-nos na esperança da glória de Deus.",
      3: "E não somente isto, mas também nos gloriamos nas tribulações; sabendo que a tribulação produz perseverança;",
      4: "E a perseverança, experiência; e a experiência, esperança;",
      5: "E a esperança não traz confusão, porquanto o amor de Deus está derramado em nossos corações pelo Espírito Santo que nos foi dado.",
      8: "Mas Deus prova o seu amor para conosco em que Cristo morreu por nós, sendo nós ainda pecadores."
    },
    6: {
      23: "Porque o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna, por Cristo Jesus, nosso Senhor."
    },
    8: {
      1: "Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus, que não andam segundo a carne, mas segundo o Espírito.",
      2: "Porque a lei do Espírito de vida, em Cristo Jesus, me livrou da lei do pecado e da morte.",
      28: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.",
      31: "Que diremos, pois, a estas coisas? Se Deus é por nós, quem será contra nós?",
      35: "Quem nos separará do amor de Cristo? A tribulação, ou a angústia, ou a perseguição, ou a fome, ou a nudez, ou o perigo, ou a espada?",
      37: "Mas em todas estas coisas somos mais do que vencedores, por aquele que nos amou.",
      38: "Porque eu estou bem certo de que nem a morte, nem a vida, nem os anjos, nem os principados, nem as potestades, nem o presente, nem o porvir,",
      39: "Nem a altura, nem a profundidade, nem qualquer outra criatura poderá separar-nos do amor de Deus, que está em Cristo Jesus, nosso Senhor."
    },
    12: {
      1: "Rogo-vos, pois, irmãos, pela compaixão de Deus, que apresenteis os vossos corpos em sacrifício vivo, santo, agradável a Deus, que é o vosso culto racional.",
      2: "E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.",
      9: "O amor seja não fingido. Aborrecei o mal e apegai-vos ao bem.",
      10: "Amai-vos cordialmente uns aos outros com amor fraternal, preferindo-vos em honra uns aos outros."
    }
  };

  // ===== FILIPENSES 4 =====
  DATA.fp = {
    4: {
      4: "Regozijai-vos sempre no Senhor; outra vez digo: regozijai-vos.",
      5: "Seja a vossa moderação conhecida de todos os homens. Perto está o Senhor.",
      6: "Não andeis ansiosos por coisa alguma; antes em tudo sejam os vossos pedidos conhecidos diante de Deus pela oração e pela súplica, com ações de graças;",
      7: "E a paz de Deus, que excede todo entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.",
      8: "Quanto ao mais, irmãos, tudo o que é verdadeiro, tudo o que é honesto, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se há alguma virtude, e se há algum louvor, nisso pensai.",
      9: "O que também aprendestes, e recebestes, e ouvistes, e vistes em mim, isso fazei; e o Deus de paz será convosco.",
      13: "Tudo posso naquele que me fortalece.",
      19: "E o meu Deus, segundo as suas riquezas, suprirá todas as vossas necessidades em glória, por Cristo Jesus."
    }
  };

  // ===== 1 CORÍNTIOS 13 - AMOR =====
  DATA['1co'] = {
    13: {
      1: "Ainda que eu falasse as línguas dos homens e dos anjos, e não tivesse amor, seria como o metal que soa ou como o címbalo que retine.",
      2: "E ainda que tivesse o dom de profecia, e conhecesse todos os mistérios e todo o conhecimento, e ainda que tivesse toda a fé, de maneira que transportasse os montes, e não tivesse amor, nada seria.",
      3: "E ainda que distribuísse toda a minha fazenda para sustento dos pobres, e ainda que entregasse o meu corpo para ser queimado, e não tivesse amor, nada disso me aproveitaria.",
      4: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensombra,",
      5: "Não se porta inconvenientemente, não busca os seus interesses, não se ira, não suspeita mal;",
      6: "Não se alegra com a iniquidade, mas se alegra com a verdade;",
      7: "Tudo sofre, tudo crê, tudo espera, tudo suporta.",
      8: "O amor nunca falha; mas havendo profecias, serão aniquiladas; havendo línguas, cessarão; havendo ciência, desaparecerá;",
      13: "Agora, pois, permanecem a fé, a esperança e o amor, estes três; mas o maior deles é o amor."
    }
  };

  // ===== EFÉSIOS =====
  DATA.ef = {
    2: {
      8: "Porque pela graça sois salvos, por meio da fé; e isso não vem de vós, é dom de Deus.",
      9: "Não por obras, para que ninguém se glorie.",
      10: "Porque somos feitura sua, criados em Cristo Jesus para as boas obras, as quais Deus preparou para que andássemos nelas."
    },
    6: {
      10: "No demais, irmãos meus, fortalecei-vos no Senhor e na força do seu poder.",
      11: "Revesti-vos de toda a armadura de Deus, para que possais estar firmes contra as astutas ciladas do diabo.",
      12: "Porque não temos que lutar contra a carne e o sangue, mas, sim, contra os principados, contra as potestades, contra os príncipes do mundo destas trevas, contra as hostes espirituais da iniquidade, nas regiões celestes.",
      13: "Portanto, tomai toda a armadura de Deus, para que possais resistir no dia mau, e, havendo feito tudo, ficar firmes.",
      14: "Estai, pois, firmes, tendo cingidos os vossos lombos com a verdade, e vestida a couraça da justiça,",
      15: "E calçados os pés na preparação do evangelho da paz;",
      16: "Tomando sobretudo o escudo da fé, com o qual podereis apagar todos os dardos inflamados do maligno.",
      17: "Tomai também o capacete da salvação, e a espada do Espírito, que é a palavra de Deus."
    }
  };

  // ===== TIAGO =====
  DATA.tg = {
    1: {
      2: "Meus irmãos, tende por motivo de toda alegria o passardes por várias tentações,",
      3: "Sabendo que a prova da vossa fé produz perseverança.",
      4: "Mas tenham a perseverança a sua ação perfeita, para que sejais perfeitos e completos, sem faltar em coisa alguma.",
      5: "E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente e não lança em rosto; e ser-lhe-á dada.",
      22: "E sede cumpridores da palavra, e não somente ouvintes, enganando-vos a vós mesmos."
    },
    5: {
      13: "Está alguém entre vós aflito? Ore. Está alguém alegre? Cante louvores.",
      14: "Está alguém entre vós doente? Chame os anciãos da igreja, e orem sobre ele, ungindo-o com azeite em nome do Senhor;",
      15: "E a oração da fé salvará o doente, e o Senhor o levantará; e, se houver cometido pecados, ser-lhe-ão perdoados.",
      16: "Confessai, pois, os vossos pecados uns aos outros e orai uns pelos outros, para serdes curados; muito pode, por sua eficácia, a súplica do justo."
    }
  };

  // ===== HEBREUS =====
  DATA.hb = {
    4: {
      12: "Porque a palavra de Deus é viva e eficaz, e mais penetrante do que qualquer espada de dois gumes, e penetra até a divisão da alma e do espírito, e das juntas e medulas, e é apta para discernir os pensamentos e as intenções do coração.",
      13: "E não há criatura que não esteja manifesta diante dele; antes, todas as coisas estão nuas e patentes aos olhos daquele a quem temos de dar conta."
    },
    11: {
      1: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que não se veem.",
      6: "Mas, sem fé, é impossível agradar-lhe; porque é necessário que aquele que se aproxima de Deus creia que ele existe, e que é galardoador dos que o buscam."
    },
    12: {
      1: "Portanto, nós também, pois que estamos rodeados de uma tão grande nuvem de testemunhas, deixemos todo embaraço e o pecado que tão de perto nos rodeia, e corramos com perseverança a carreira que nos está proposta,",
      2: "Olhando para Jesus, autor e consumador da fé, o qual, pela alegria que lhe estava proposta, suportou a cruz, não fazendo caso da afronta, e assentou-se à destra do trono de Deus."
    }
  };

  // ===== APOCALIPSE 21-22 =====
  DATA.ap = {
    21: {
      1: "E vi um novo céu e uma nova terra. Porque já o primeiro céu e a primeira terra passaram, e o mar já não existe.",
      2: "E eu, João, vi a santa cidade, a nova Jerusalém, que de Deus descia do céu, adereçada como uma noiva adornada para o seu marido.",
      3: "E ouvi uma grande voz do trono, que dizia: Eis aqui o tabernáculo de Deus com os homens, pois com eles habitará, e eles serão o seu povo, e o mesmo Deus estará com eles, e será o seu Deus.",
      4: "E Deus enxugará dos seus olhos toda lágrima; e não haverá mais morte, nem haverá mais luto, nem clamor, nem dor; porque já as primeiras coisas são acabadas.",
      5: "E disse o que estava assentado sobre o trono: Eis que faço novas todas as coisas. E disse-me: Escreve, porque estas palavras são verdadeiras e fiéis."
    },
    22: {
      1: "E mostrou-me o rio puro da água da vida, claro como cristal, que procedia do trono de Deus e do Cordeiro.",
      2: "No meio da sua praça, e de uma e da outra margem do rio, estava a árvore da vida, que produz doze frutos, dando o seu fruto de mês em mês; e as folhas da árvore são para a saúde das nações.",
      3: "E ali nunca mais haverá maldição contra alguém; e nela estará o trono de Deus e do Cordeiro, e os seus servos o servirão.",
      4: "E verão o seu rosto, e nas suas testas estará o seu nome.",
      5: "E ali não haverá mais noite, e não necessitarão de luz de candeia nem da luz do sol, porque o Senhor Deus os ilumina; e reinarão para todo o sempre.",
      12: "Eis que cedo venho, e o meu galardão está comigo, para dar a cada um segundo a sua obra.",
      13: "Eu sou o Alfa e o Ômega, o princípio e o fim, o primeiro e o último.",
      14: "Bem-aventurados aqueles que guardam os seus mandamentos, para que tenham direito à árvore da vida e entrem na cidade pelas portas.",
      16: "Eu, Jesus, enviei o meu anjo para vos testificar estas coisas nas igrejas. Eu sou a raiz e a geração de Davi, a resplandecente estrela da manhã.",
      17: "E o Espírito e a noiva dizem: Vem. E quem ouve diga: Vem. E quem tem sede venha; e quem quiser, tome gratuitamente da água da vida.",
      20: "Aquele que testifica estas coisas diz: Certamente cedo venho. Amém. Ora vem, Senhor Jesus.",
      21: "A graça de nosso Senhor Jesus Cristo seja com todos vós. Amém."
    }
  };

  // Textos resumidos para livros não detalhados (estrutura: capítulo -> { versículo: texto })
  function generateSummary(bookId, bookIdx) {
    if (DATA[bookId]) return;
    const book = BOOKS[bookIdx];
    DATA[bookId] = {};
    // Formato: { capitulo: { verso: "texto", ... }, ... }
    const summaries = {
      'ex':  { 1:{1:"Estes são os nomes dos filhos de Israel, que entraram no Egito com Jacó... E os filhos de Israel frutificaram e multiplicaram-se grandemente."}, 20:{2:"Eu sou o Senhor teu Deus, que te tirei da terra do Egito, da casa da servidão. Não terás outros deuses diante de mim."} },
      'lv':  { 1:{1:"E chamou o Senhor a Moisés, e falou com ele da tenda da congregação, dizendo: Fala aos filhos de Israel."} },
      'nm':  { 1:{1:"E falou o Senhor a Moisés nos desertos do Sinai, no tabernáculo da congregação, levantando o censo de toda a congregação."} },
      'dt':  { 6:{4:"Ouve, Israel, o Senhor nosso Deus é o único Senhor. Amarás, pois, o Senhor teu Deus de todo o teu coração, e de toda a tua alma, e de todas as tuas forças."}, 30:{11:"Porque este mandamento que hoje te ordeno não é muito difícil para ti, nem está longe."} },
      'js':  { 1:{9:"Esforça-te e tem bom ânimo; não temas, nem te espantes, porque o Senhor teu Deus é contigo, por onde quer que andares."}, 24:{15:"Eu e a minha casa serviremos ao Senhor."} },
      'jz':  { 21:{25:"Naqueles dias não havia rei em Israel; cada um fazia o que parecia reto aos seus olhos."} },
      'rt':  { 1:{1:"E sucedeu que, nos dias em que os juízes julgavam, houve fome na terra."} },
      'is':  { 7:{14:"Portanto, o Senhor mesmo vos dará um sinal: eis que a virgem conceberá e dará à luz um filho, e chamará o seu nome Emanuel."}, 40:{1:"Consolai, consolai o meu povo, diz o vosso Deus."}, 53:{5:"Ele foi ferido pelas nossas transgressões e moído pelas nossas iniqüidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados."} },
      'jr':  { 29:{11:"Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais."}, 31:{3:"Com amor eterno te amei; porquanto com benignidade te atraí."} },
      'lm':  { 3:{22:"As misericórdias do Senhor são a causa de não sermos consumidos; grande é a tua fidelidade."} },
      'ez':  { 37:{3:"Filho do homem, poderão viver estes ossos? Senhor Deus, tu o sabes."} },
      'dn':  { 6:{16:"O teu Deus, a quem tu continuamente serves, ele te livrará."} },
      'os':  { 14:{4:"Eu sararei a sua infidelidade, eu os amarei espontaneamente."} },
      'jl':  { 2:{28:"Derramarei do meu Espírito sobre toda a carne; vossos filhos e vossas filhas profetizarão."} },
      'am':  { 5:{4:"Buscai ao Senhor e vivei."} },
      'ob':  { 1:{15:"O dia do Senhor está perto sobre todas as nações."} },
      'jn':  { 2:{2:"Na minha angústia clamei ao Senhor, e ele me ouviu."} },
      'mq':  { 6:{8:"Ele te declarou, ó homem, o que é bom; e que é o que o Senhor pede de ti, senão que pratiques a justiça, e ames a benignidade, e andes humildemente com o teu Deus?"} },
      'na':  { 1:{7:"Bom é o Senhor, uma fortaleza no dia da angústia; e conhece os que nele confiam."} },
      'hc':  { 2:{4:"Eis que o justo viverá pela sua fé."} },
      'sf':  { 3:{17:"O Senhor teu Deus no meio de ti é poderoso; ele salvará."} },
      'ag':  { 1:{8:"Subi ao monte, trazei madeira e edificai a casa; e dela me agradarei."} },
      'zc':  { 9:{9:"Alegra-te muito, ó filha de Sião; eis que o teu rei virá a ti, justo e salvador."} },
      'ml':  { 3:{10:"Trazei todos os dízimos à casa do tesouro; e provai-me, diz o Senhor."} },
      'atos':{ 1:{8:"Mas recebereis a virtude do Espírito Santo, que há de vir sobre vós; e ser-me-eis testemunhas até os confins da terra."}, 2:{4:"E foram todos cheios do Espírito Santo."}, 9:{4:"Saulo, Saulo, por que me persegues?"} },
      'mc':  { 16:{15:"Ide por todo o mundo e pregai o evangelho a toda criatura."} },
      'lc':  { 2:{11:"Pois na cidade de Davi vos nasceu hoje o Salvador, que é Cristo, o Senhor."}, 24:{47:"E em seu nome se pregasse o arrependimento e a remissão dos pecados em todas as nações."} },
      'gl':  { 2:{16:"O homem não é justificado pelas obras da lei, mas pela fé em Jesus Cristo."}, 5:{1:"Estai, pois, firmes na liberdade com que Cristo nos libertou."} },
      'ef':  { 2:{8:"Pela graça sois salvos, por meio da fé; e isso não vem de vós, é dom de Deus."} },
      'cl':  { 3:{1:"Se, pois, ressuscitastes com Cristo, buscai as coisas que são de cima."} },
      '1ts': { 4:{3:"Esta é a vontade de Deus: a vossa santificação."}, 5:{11:"Exortai-vos uns aos outros, e edificai-vos uns aos outros."} },
      '2ts': { 3:{3:"Mas o Senhor é fiel; ele vos confirmará e guardará do maligno."} },
      '1tm': { 4:{12:"Ninguém despreze a tua mocidade; mas sê o exemplo dos fiéis."} },
      '2tm': { 3:{16:"Toda a Escritura é divinamente inspirada, e proveitosa para ensinar."}, 4:{7:"Combati o bom combate, acabei a carreira, guardei a fé."} },
      'tt':  { 2:{11:"A graça de Deus se há manifestado, trazendo salvação a todos os homens."} },
      'fm':  { 1:{16:"Recebe-o como irmão amado."} },
      'hb':  { 11:{1:"A fé é o firme fundamento das coisas que se esperam."} },
      'tg':  { 1:{22:"Sede cumpridores da palavra, e não somente ouvintes."} },
      '1pe': { 5:{7:"Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", 8:"Sede sóbrios, vigiai, porque o diabo anda ao redor como leão que ruge."} },
      '2pe': { 3:{9:"O Senhor não retarda a sua promessa, mas é longânimo para nós, não querendo que alguns se percam."} },
      '1jo': { 1:{9:"Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar."}, 4:{8:"Deus é amor."} },
      '2jo': { 1:{6:"O amor é que andemos segundo os seus mandamentos."} },
      '3jo': { 1:{2:"Amado, faço votos por que prosperes em tudo."} },
      'jd':  { 1:{24:"Àquele que é poderoso para vos guardar de tropeçar... seja glória e majestade."} },
      'ap':  { 21:{1:"E vi um novo céu e uma nova terra."}, 22:{20:"Certamente cedo venho. Amém. Ora vem, Senhor Jesus."} }
    };
    if (summaries[bookId]) {
      Object.keys(summaries[bookId]).forEach(function (ch) { DATA[bookId][Number(ch)] = summaries[bookId][ch]; });
    }
    if (!Object.keys(DATA[bookId]).length) {
      DATA[bookId][1] = {1: book.name + " — Este livro faz parte das Sagradas Escrituras. Utilize a busca ou selecione um capítulo para explorar o conteúdo."};
    }
  }

  BOOKS.forEach((book, idx) => generateSummary(book.id, idx));

  // Preencher Salmos adicionais com versículos chave se faltarem
  if (!DATA.sl[34]) DATA.sl[34] = {
    1: "Bendirei o Senhor em todo tempo; o seu louvor estará continuamente na minha boca.",
    4: "Busquei o Senhor, e ele me ouviu; livrou-me de todos os meus temores.",
    8: "Provai e vede que o Senhor é bom; bem-aventurado o homem que nele confia.",
    18: "Perto está o Senhor dos que têm o coração quebrantado e salva os de espírito oprimido."
  };
  if (!DATA.sl[46]) DATA.sl[46] = {
    1: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.",
    10: "Aquietai-vos, e sabei que eu sou Deus; serei exaltado entre as nações, serei exaltado na terra."
  };
  if (!DATA.sl[103]) DATA.sl[103] = {
    1: "Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.",
    2: "Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.",
    3: "Ele é quem perdoa todas as tuas iniqüidades; quem sara todas as tuas enfermidades;",
    8: "O Senhor é misericordioso e compassivo, longânimo e grande em benignidade.",
    12: "Quanto distante está o oriente do ocidente, tanto tem ele afastado de nós as nossas transgressões."
  };
  if (!DATA.sl[37]) DATA.sl[37] = {
    4: "Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.",
    5: "Confia no Senhor e espera nele.",
    7: "Descansa no Senhor e espera nele."
  };
  if (!DATA.sl[139]) DATA.sl[139] = {
    1: "Senhor, tu me sondas e me conheces.",
    14: "Eu te louvarei, porque de um modo assombroso e maravilhoso fui feito; maravilhosas são as tuas obras."
  };
  if (!DATA.sl[119]) DATA.sl[119] = {
    1: "Bem-aventurados os que andam no caminho perfeito, que andam na lei do Senhor.",
    11: "Escondi a tua palavra no meu coração, para não pecar contra ti.",
    105: "Lâmpada para os meus pés é a tua palavra e luz para o meu caminho."
  };
  if (!DATA.sl[8]) DATA.sl[8] = {3: "Quando vejo os teus céus, obra dos teus dedos, a lua e as estrelas que preparaste, que é o homem para que te lembres dele? E o filho do homem para que o visites?"};
  if (!DATA.sl[19]) DATA.sl[19] = {1: "Os céus declaram a glória de Deus, e o firmamento anuncia a obra das suas mãos.", 14: "Sejam-te agradáveis as palavras da minha boca e a meditação do meu coração, ó Senhor, rocha minha e redentor meu."};
  if (!DATA.sl[27]) DATA.sl[27] = {1: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a fortaleza da minha vida; de quem me recearei?", 4: "Uma coisa pedi ao Senhor, e a buscarei: que possa morar na casa do Senhor todos os dias da minha vida."};
  if (!DATA.sl[84]) DATA.sl[84] = {10: "Porque vale mais um dia nos teus átrios do que mil. Preferiria estar à porta da casa do meu Deus a habitar nas tendas dos ímpios."};
  if (!DATA.sl[90]) DATA.sl[90] = {1: "Senhor, tu tens sido o nosso refúgio de geração em geração.", 12: "Ensina-nos a contar os nossos dias, de tal maneira que alcancemos coração sábio."};
  if (!DATA.sl[100]) DATA.sl[100] = {1: "Celebrai com júbilo ao Senhor, todos os moradores da terra. Servi ao Senhor com alegria; apresentai-vos diante dele com cântico."};
  if (!DATA.sl[118]) DATA.sl[118] = {24: "Este é o dia que o Senhor fez; nele nos alegraremos e regozijaremos."};
  if (!DATA.sl[51]) DATA.sl[51] = {10: "Cria em mim, ó Deus, um coração puro, e renova em mim um espírito reto.", 17: "Os sacrifícios agradáveis a Deus são o espírito quebrantado; coração contrito e humilhado, ó Deus, não desprezarás."};
  if (!DATA.sl[32]) DATA.sl[32] = {1: "Bem-aventurado aquele cuja transgressão é perdoada, e cujo pecado é coberto."};
  if (!DATA.sl[63]) DATA.sl[63] = {1: "Ó Deus, tu és o meu Deus; de madrugada te buscarei; a minha alma tem sede de ti.", 3: "Porque a tua benignidade é melhor do que a vida; os meus lábios te louvarão."};
  if (!DATA.sl[73]) DATA.sl[73] = {25: "Quem tenho eu no céu senão a ti? E na terra não há quem eu deseje além de ti.", 26: "A minha carne e o meu coração desfalecem; mas Deus é a fortaleza do meu coração e o meu quinhão para sempre."};
  if (!DATA.sl[95]) DATA.sl[95] = {6: "Oh, vinde, adoremos e prostremo-nos; ajoelhemos diante do Senhor que nos criou. Porque ele é o nosso Deus, e nós o povo do seu pasto e ovelhas da sua mão."};
  if (!DATA.sl[127]) DATA.sl[127] = {1: "Se o Senhor não edificar a casa, em vão trabalham os que a edificam.", 3: "Eis que os filhos são herança do Senhor, e o fruto do ventre é o seu galardão."};
  if (!DATA.sl[130]) DATA.sl[130] = {5: "Espero no Senhor; a minha alma espera, e na sua palavra espero.", 7: "Espere Israel no Senhor, porque no Senhor há misericórdia, e nele há abundante redenção."};
  if (!DATA.sl[133]) DATA.sl[133] = {1: "Oh, quão bom e quão suave é que os irmãos vivam em união!"};
  if (!DATA.sl[136]) DATA.sl[136] = {1: "Dai graças ao Senhor, porque ele é bom, porque a sua benignidade dura para sempre."};
  if (!DATA.sl[145]) DATA.sl[145] = {1: "Exaltar-te-ei, ó Deus meu, rei; e bendirei o teu nome para todo o sempre.", 18: "Perto está o Senhor de todos os que o invocam, de todos os que o invocam em verdade."};

  // ===== Preenchimentos extras (capítulos/versículos chave adicionais) =====
  if (!DATA.lm) DATA.lm = {};
  if (!DATA.lm[3]) DATA.lm[3] = { 22:"As misericórdias do Senhor são a causa de não sermos consumidos; renovam-se cada manhã. Grande é a tua fidelidade.", 25:"Bom é o Senhor para os que esperam por ele." };
  if (!DATA['2co']) DATA['2co'] = { 5:{17:"De sorte que, se alguém está em Cristo, nova criatura é.", 21:"Aquele que não conheceu pecado, ele o fez pecado por nós."} };
  if (!DATA['1ts'][4]) Object.assign(DATA['1ts'], { 4:{16:"Porque o mesmo Senhor descerá do céu com alarido... e os que morreram em Cristo ressuscitarão primeiro.", 17:"Depois nós os que ficarmos vivos seremos arrebatados juntamente com eles, a encontrar o Senhor nos ares."} });
  if (!DATA['1sm']) DATA['1sm'] = { 3:{9:"Fala, Senhor, porque o teu servo ouve."}, 17:{45:"Tu vens a mim com espada, e com lança, e com escudo; mas eu venho a ti em nome do Senhor dos Exércitos."} };
  if (!DATA['2sm']) DATA['2sm'] = { 7:{22:"Não há ninguém como tu, e não há Deus senão tu."} };
  if (!DATA['1rs']) DATA['1rs'] = { 3:{9:"Dá, pois, ao teu servo coração entendido para julgar o teu povo."} };
  if (!DATA['1cr']) DATA['1cr'] = { 29:{11:"Tua é, ó Senhor, a grandeza, e o poder, e a glória; porque teu é tudo quanto há no céu e na terra.", 14:"Porque tudo vem de ti, e do que é teu to damos."} };
  if (!DATA['2cr']) DATA['2cr'] = { 7:{14:"Se o meu povo, que se chama pelo meu nome, se humilhar, e orar, e buscar a minha face... sararei a sua terra."} };
  if (!DATA.jó) DATA.jó = { 1:{21:"O Senhor o deu, o Senhor o tomou; bendito seja o nome do Senhor."}, 19:{25:"Eu sei que o meu Redentor vive."} };
  if (!DATA.ed) DATA.ed = { 1:{5:"Então se levantaram os chefes de Judá e Benjamim, e os sacerdotes, e os levitas, para subirem a edificar a casa do Senhor."} };
  if (!DATA.ne) DATA.ne = { 8:{10:"A alegria do Senhor é a vossa força."} };
  // Mateus complementos
  DATA.mt = DATA.mt || {};
  if (!DATA.mt[4]) DATA.mt[4] = { 4:"Está escrito: Nem só de pão viverá o homem.", 7:"Não tentarás o Senhor teu Deus.", 10:"Ao Senhor teu Deus adorarás, e só a ele servirás." };
  if (!DATA.mt[7]) DATA.mt[7] = { 7:"Pedi, e dar-se-vos-á; buscai e achareis.", 12:"Tudo quanto vós quereis que os homens vos façam, fazei-o vós também a eles." };
  if (!DATA.mt[22]) DATA.mt[22] = { 37:"Amarás o Senhor teu Deus de todo o teu coração.", 39:"Amarás o teu próximo como a ti mesmo." };
  if (!DATA.mt[26]) DATA.mt[26] = { 26:"Isto é o meu corpo.", 28:"Porque isto é o meu sangue, o sangue do novo testamento." };
  // 2 Timóteo e 1 Timóteo complementos
  DATA['2tm'] = DATA['2tm'] || {};
  DATA['2tm'][4] = Object.assign({ 2:"Prega a palavra, insta a tempo e fora de tempo.", 7:"Combati o bom combate, acabei a carreira, guardei a fé."}, DATA['2tm'][4] || {});
  DATA['1tm'] = DATA['1tm'] || {};
  if (!DATA['1tm'][6]) DATA['1tm'][6] = { 10:"Porque o amor ao dinheiro é a raiz de todos os males.", 12:"Combate o bom combate da fé; toma posse da vida eterna."};

  function getBooks() { return BOOKS.slice(); }
  function getBook(id) { return BOOKS.find(b => b.id === id) || null; }
  function getChapter(bookId, chapter) {
    const ch = DATA[bookId] && DATA[bookId][Number(chapter)];
    if (!ch) return null;
    return ch;
  }
  function getVerse(bookId, chapter, verse) {
    const ch = getChapter(bookId, chapter);
    if (!ch) return '';
    return ch[Number(verse)] || '';
  }
  function hasChapter(bookId, chapter) {
    return !!(DATA[bookId] && DATA[bookId][Number(chapter)]);
  }
  function verseCount(bookId, chapter) {
    const ch = getChapter(bookId, chapter);
    if (!ch) return 0;
    return Object.keys(ch).filter(k => /^\d+$/.test(k)).length;
  }
  function searchText(query) {
    const q = String(query || '').toLowerCase().trim();
    if (!q || q.length < 3) return [];
    const results = [];
    Object.keys(DATA).forEach(bookId => {
      const book = getBook(bookId);
      if (!book) return;
      Object.keys(DATA[bookId]).forEach(chNum => {
        const ch = DATA[bookId][chNum];
        Object.keys(ch).forEach(vNum => {
          const text = String(ch[vNum] || '');
          if (text.toLowerCase().includes(q)) {
            results.push({ bookId, book: book.name, abbr: book.abbr, chapter: Number(chNum), verse: Number(vNum), text });
          }
        });
      });
    });
    return results.slice(0, 50);
  }
  function randomVerse() {
    const books = Object.keys(DATA);
    for (let i = 0; i < 100; i++) {
      const bId = books[Math.floor(Math.random() * books.length)];
      const chs = Object.keys(DATA[bId]);
      if (!chs.length) continue;
      const ch = chs[Math.floor(Math.random() * chs.length)];
      const vs = Object.keys(DATA[bId][ch]).filter(k => /^\d+$/.test(k));
      if (!vs.length) continue;
      const v = vs[Math.floor(Math.random() * vs.length)];
      const book = getBook(bId);
      return {
        bookId: bId, book: book.name, abbr: book.abbr, chapter: Number(ch), verse: Number(v),
        reference: `${book.name} ${ch}:${v}`,
        text: DATA[bId][ch][v]
      };
    }
    return { bookId: 'jo', book: 'João', chapter: 3, verse: 16, reference: 'João 3:16', text: 'Porque Deus amou o mundo de tal maneira...' };
  }

  window.ImperioBible = {
    BOOKS, getBooks, getBook, getChapter, getVerse, hasChapter, verseCount, searchText, randomVerse
  };
})();
