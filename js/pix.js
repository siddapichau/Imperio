(function () {
  'use strict';

  const app = window.Imperio;

  function config() {
    return app.getAt('integrations/pix', {}) || {};
  }

  function normalizeText(value, max) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
      .trim()
      .toUpperCase()
      .slice(0, max || 25);
  }

  function field(id, value) {
    const text = String(value == null ? '' : value);
    return id + String(text.length).padStart(2, '0') + text;
  }

  // CRC16/CCITT-FALSE, exigido pelo padrão BR Code do Banco Central.
  function crc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let bit = 0; bit < 8; bit++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  /** Normaliza a chave Pix conforme o tipo (CPF/CNPJ/telefone sem máscara, email/aleatória como está). */
  function normalizeKey(rawKey, keyType) {
    const key = String(rawKey || '').trim();
    if (!key) return '';
    const type = String(keyType || '').toLowerCase();
    if (type === 'cpf' || type === 'cnpj') return onlyDigits(key);
    if (type === 'telefone' || type === 'phone' || type === 'celular') {
      const digits = onlyDigits(key);
      if (!digits) return '';
      return digits.startsWith('55') ? '+' + digits : '+55' + digits;
    }
    if (type === 'email') return key.toLowerCase();
    return key;
  }

  function detectKeyType(key) {
    const value = String(key || '').trim();
    if (!value) return '';
    if (value.includes('@') && /\.[a-z]{2,}$/i.test(value)) return 'email';
    const digits = onlyDigits(value);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'aleatoria';
    if (value.startsWith('+') || (digits.length >= 12 && digits.startsWith('55'))) return 'telefone';
    if (digits.length === 11) return 'cpf';
    if (digits.length === 14) return 'cnpj';
    return 'aleatoria';
  }

  function txidFor(reference) {
    const clean = String(reference || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return (clean || 'DOACAO').slice(0, 25) || '***';
  }

  /**
   * Gera o payload "Pix Copia e Cola" (BR Code estático) com valor definido.
   * Funciona 100% offline — o mesmo código serve para o QR Code e para o botão de copiar.
   */
  function buildPayload(options) {
    const cfg = config();
    const opts = options || {};
    const rawKey = opts.pixKey || cfg.pixKey;
    const keyType = opts.keyType || cfg.keyType || detectKeyType(rawKey);
    const key = normalizeKey(rawKey, keyType);
    if (!key) throw new Error('Chave Pix não configurada. Peça ao administrador para cadastrar no painel.');

    const amount = Number(opts.amount || 0);
    const name = normalizeText(opts.receiverName || cfg.receiverName || 'IGREJA', 25) || 'IGREJA';
    const city = normalizeText(opts.city || cfg.city || 'BRASIL', 15) || 'BRASIL';
    const txid = txidFor(opts.txid);
    const description = opts.description ? normalizeText(opts.description, 40) : '';

    const merchantAccount = field('00', 'br.gov.bcb.pix') + field('01', key) + (description ? field('02', description) : '');

    let payload = '';
    payload += field('00', '01');
    payload += field('01', '12'); // 12 = QR reutilizável (permite múltiplas doações)
    payload += field('26', merchantAccount);
    payload += field('52', '0000');
    payload += field('53', '986'); // BRL
    if (amount > 0) payload += field('54', amount.toFixed(2));
    payload += field('58', 'BR');
    payload += field('59', name);
    payload += field('60', city);
    payload += field('62', field('05', txid));
    payload += '6304';
    return payload + crc16(payload);
  }

  /** Desenha o QR Code em um elemento, com a logo do tema ativo no centro. */
  function renderQr(target, text, options) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) return null;
    const doc = element.ownerDocument || document;
    const win = doc.defaultView || window;
    const qrcodeFactory = win.qrcode || window.qrcode || (window.parent && window.parent.qrcode);
    if (!qrcodeFactory) {
      element.innerHTML = '<div class="empty">Não foi possível carregar o gerador de QR Code.</div>';
      return null;
    }
    const opts = options || {};
    const qr = qrcodeFactory(0, opts.correction || 'M');
    qr.addData(text);
    qr.make();

    const size = Number(opts.size || 260);
    const count = qr.getModuleCount();
    const cell = Math.floor(size / (count + 8));
    const margin = Math.floor((size - cell * count) / 2);
    const canvas = doc.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.className = 'pix-qr-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'QR Code Pix para doação');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.background || '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = opts.color || '#101010';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) ctx.fillRect(margin + col * cell, margin + row * cell, cell, cell);
      }
    }
    element.innerHTML = '';
    element.appendChild(canvas);

    if (opts.logo !== false) {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const box = Math.round(size * 0.22);
        const pos = Math.round((size - box) / 2);
        const pad = Math.round(box * 0.12);
        ctx.fillStyle = opts.background || '#ffffff';
        ctx.fillRect(pos - pad, pos - pad, box + pad * 2, box + pad * 2);
        ctx.drawImage(logo, pos, pos, box, box);
      };
      logo.onerror = () => {};
      logo.src = opts.logoSrc || app.logoPath();
    }
    return canvas;
  }

  function downloadQr(element, filename) {
    const canvas = (typeof element === 'string' ? document.getElementById(element) : element);
    const target = canvas && (canvas.tagName === 'CANVAS' ? canvas : canvas.querySelector('canvas'));
    if (!target) return false;
    const link = document.createElement('a');
    link.download = (filename || 'pix-imperial-batista') + '.png';
    link.href = target.toDataURL('image/png');
    link.click();
    return true;
  }

  function parseAmount(amount) {
    if (typeof amount === 'number') return amount;
    let text = String(amount || '').trim();
    // Aceita tanto 10.50 quanto 10,50 e valores colados como R$ 1.234,56.
    if (text.includes(',') && text.includes('.')) text = text.replace(/\./g, '').replace(',', '.');
    else text = text.replace(',', '.');
    text = text.replace(/[^0-9.\-]/g, '');
    return Number(text);
  }

  function validateAmount(amount) {
    const cfg = config();
    const value = parseAmount(amount);
    const min = Number(cfg.minAmount || 5);
    const max = Number(cfg.maxAmount || 0);
    if (!Number.isFinite(value) || value <= 0) throw new Error('Informe um valor válido.');
    if (value < min) throw new Error(`O valor mínimo é R$ ${min.toFixed(2).replace('.', ',')}.`);
    if (max && value > max) throw new Error(`O valor máximo é R$ ${max.toFixed(2).replace('.', ',')}.`);
    return Math.round(value * 100) / 100;
  }

  function formatBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /** Registra a intenção de doação para o relatório do painel administrativo. */
  async function registerDonation(details) {
    const data = details || {};
    const user = app.state.user;
    const record = {
      id: app.uid('don'),
      userId: user ? user.id : '',
      donorName: String(data.donorName || (user && user.name) || 'Anônimo').trim(),
      amount: Number(data.amount || 0),
      purpose: String(data.purpose || 'Oferta'),
      method: String(data.method || 'pix'),
      message: String(data.message || '').slice(0, 300),
      status: 'iniciada',
      txid: String(data.txid || ''),
      createdAt: new Date().toISOString()
    };
    try { await app.setAt('donations/' + record.id, record); } catch (error) { console.warn('Doação não registrada:', error); }
    return record;
  }

  async function confirmDonation(id) {
    if (!id) return false;
    await app.updateAt('donations/' + id, { status: 'confirmada', confirmedAt: new Date().toISOString() });
    return true;
  }

  /** Link de checkout do Mercado Pago (quando o admin cadastra um link de pagamento). */
  function checkoutUrl(amount, purpose) {
    const cfg = config();
    const base = String(cfg.checkoutLink || '').trim();
    if (!base) return '';
    const separator = base.includes('?') ? '&' : '?';
    const params = new URLSearchParams();
    if (amount) params.set('amount', Number(amount).toFixed(2));
    if (purpose) params.set('description', purpose);
    const query = params.toString();
    return query ? base + separator + query : base;
  }

  function isConfigured() {
    const cfg = config();
    return cfg.enabled !== false && Boolean(String(cfg.pixKey || '').trim());
  }

  function mercadoPagoConfigured() {
    const cfg = config();
    return cfg.enabled !== false && Boolean(String(cfg.checkoutLink || '').trim());
  }

  window.ImperioPix = {
    config,
    isConfigured,
    buildPayload,
    renderQr,
    downloadQr,
    validateAmount,
    parseAmount,
    formatBRL,
    registerDonation,
    confirmDonation,
    checkoutUrl,
    mercadoPagoConfigured,
    detectKeyType,
    normalizeKey,
    crc16
  };
})();
