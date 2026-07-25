(function () {
  'use strict';

  const app = window.Imperio;

  const ALLOWED_TAGS = ['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'IMG', 'DIV', 'SPAN', 'HR', 'CODE', 'PRE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'IFRAME', 'FIGURE', 'FIGCAPTION', 'VIDEO', 'SOURCE', 'AUDIO'];
  const ALLOWED_ATTRS = ['href', 'src', 'alt', 'title', 'target', 'rel', 'width', 'height', 'colspan', 'rowspan', 'controls', 'loading', 'allow', 'allowfullscreen', 'frameborder', 'poster', 'type'];
  const ALLOWED_STYLES = ['text-align', 'color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'margin', 'padding', 'border-radius', 'max-width', 'width', 'float', 'display'];
  const SAFE_IFRAME_HOSTS = ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'open.spotify.com', 'w.soundcloud.com', 'drive.google.com', 'www.google.com'];

  function isSafeUrl(value) {
    const url = String(value || '').trim();
    if (!url) return false;
    if (/^(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,)/i.test(url)) return true;
    return /^(https?:\/\/|\/|\.\/|#|mailto:|tel:)/i.test(url) && !/^javascript:/i.test(url);
  }

  function isSafeIframe(value) {
    try {
      const url = new URL(String(value), location.href);
      return url.protocol === 'https:' && SAFE_IFRAME_HOSTS.includes(url.hostname);
    } catch (_) { return false; }
  }

  function sanitizeStyle(style) {
    return String(style || '')
      .split(';')
      .map(rule => rule.trim())
      .filter(rule => {
        const name = rule.split(':')[0].trim().toLowerCase();
        return name && ALLOWED_STYLES.includes(name) && !/url\s*\(|expression|javascript:/i.test(rule);
      })
      .join('; ');
  }

  /** Limpa HTML vindo do editor/colagem, removendo scripts, handlers e URLs perigosas. */
  function sanitizeHtml(html) {
    const template = document.createElement('div');
    template.innerHTML = String(html == null ? '' : html);
    const walker = document.createTreeWalker(template, NodeFilter.SHOW_ELEMENT, null);
    const toRemove = [];
    let node = walker.nextNode();
    while (node) {
      const tag = node.tagName;
      if (!ALLOWED_TAGS.includes(tag)) {
        toRemove.push(node);
      } else {
        Array.from(node.attributes).forEach(attr => {
          const name = attr.name.toLowerCase();
          if (name === 'style') {
            const clean = sanitizeStyle(attr.value);
            if (clean) node.setAttribute('style', clean); else node.removeAttribute('style');
            return;
          }
          if (name === 'class' && /^(text-|img-|embed-|table-)/.test(attr.value)) return;
          if (name.startsWith('on') || !ALLOWED_ATTRS.includes(name)) { node.removeAttribute(attr.name); return; }
          if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) { node.removeAttribute(attr.name); return; }
          if (tag === 'IFRAME' && name === 'src' && !isSafeIframe(attr.value)) { toRemove.push(node); }
        });
        if (tag === 'A' && node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer');
        if (tag === 'IMG') node.setAttribute('loading', 'lazy');
      }
      node = walker.nextNode();
    }
    toRemove.forEach(el => {
      if (ALLOWED_TAGS.includes(el.tagName)) el.remove();
      else el.replaceWith(...Array.from(el.childNodes));
    });
    return template.innerHTML;
  }

  function htmlToText(html) {
    const div = document.createElement('div');
    div.innerHTML = String(html || '');
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function textToHtml(text) {
    const value = String(text || '').trim();
    if (!value) return '';
    if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeHtml(value);
    return value.split(/\n{2,}/).map(part => `<p>${app.escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('');
  }

  /** Converte imagem enviada pelo usuário para WebP redimensionado (economiza banda no APK). */
  function toWebp(file, options) {
    const opts = Object.assign({ maxWidth: 1600, maxHeight: 1600, quality: 0.82 }, options || {});
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Selecione um arquivo de imagem.'));
      if (file.size > 12 * 1024 * 1024) return reject(new Error('Imagem muito grande (máximo 12 MB).'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
        image.onload = () => {
          let { width, height } = image;
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height, 1);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(image, 0, 0, width, height);
          canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Falha ao converter a imagem.'));
            const output = new FileReader();
            output.onload = () => resolve({
              dataUrl: output.result,
              width,
              height,
              size: blob.size,
              type: blob.type,
              name: (file.name || 'imagem').replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.png')
            });
            output.onerror = () => reject(new Error('Falha ao processar a imagem.'));
            output.readAsDataURL(blob);
          }, 'image/webp', opts.quality);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const TOOLBAR = [
    { group: 'texto', items: [
      { cmd: 'bold', icon: '<b>B</b>', title: 'Negrito (Ctrl+B)' },
      { cmd: 'italic', icon: '<i>I</i>', title: 'Itálico (Ctrl+I)' },
      { cmd: 'underline', icon: '<u>U</u>', title: 'Sublinhado (Ctrl+U)' },
      { cmd: 'strikeThrough', icon: '<s>S</s>', title: 'Tachado' }
    ] },
    { group: 'titulo', items: [
      { cmd: 'formatBlock', value: 'H2', icon: 'T1', title: 'Título grande' },
      { cmd: 'formatBlock', value: 'H3', icon: 'T2', title: 'Subtítulo' },
      { cmd: 'formatBlock', value: 'P', icon: '¶', title: 'Parágrafo normal' },
      { cmd: 'formatBlock', value: 'BLOCKQUOTE', icon: '❝', title: 'Citação bíblica' }
    ] },
    { group: 'alinhar', items: [
      { cmd: 'justifyLeft', icon: '⬅', title: 'Alinhar à esquerda' },
      { cmd: 'justifyCenter', icon: '↔', title: 'Centralizar' },
      { cmd: 'justifyRight', icon: '➡', title: 'Alinhar à direita' },
      { cmd: 'justifyFull', icon: '☰', title: 'Justificar' }
    ] },
    { group: 'lista', items: [
      { cmd: 'insertUnorderedList', icon: '• —', title: 'Lista com marcadores' },
      { cmd: 'insertOrderedList', icon: '1.', title: 'Lista numerada' },
      { cmd: 'outdent', icon: '⇤', title: 'Diminuir recuo' },
      { cmd: 'indent', icon: '⇥', title: 'Aumentar recuo' }
    ] },
    { group: 'inserir', items: [
      { action: 'link', icon: '🔗', title: 'Inserir link' },
      { action: 'image-url', icon: '🖼️', title: 'Imagem por link (URL)' },
      { action: 'image-upload', icon: '⬆️', title: 'Enviar imagem (converte para WebP)' },
      { action: 'video', icon: '🎬', title: 'Vídeo do YouTube/Vimeo' },
      { action: 'verse', icon: '📖', title: 'Inserir versículo' },
      { action: 'divider', icon: '―', title: 'Linha divisória' },
      { action: 'table', icon: '▦', title: 'Tabela' }
    ] },
    { group: 'estilo', items: [
      { action: 'color', icon: '🎨', title: 'Cor do texto' },
      { action: 'highlight', icon: '🖍️', title: 'Marca-texto' },
      { cmd: 'removeFormat', icon: '🧹', title: 'Limpar formatação' }
    ] },
    { group: 'avancado', items: [
      { action: 'html', icon: '&lt;/&gt;', title: 'Editar código HTML' },
      { action: 'preview', icon: '👁️', title: 'Pré-visualizar' },
      { action: 'fullscreen', icon: '⛶', title: 'Tela cheia' }
    ] }
  ];

  function buildToolbar(doc) {
    const bar = doc.createElement('div');
    bar.className = 'rte-toolbar';
    bar.setAttribute('role', 'toolbar');
    bar.innerHTML = TOOLBAR.map(group => `<div class="rte-group" data-group="${group.group}">${group.items.map(item => {
      const attrs = item.cmd ? `data-cmd="${item.cmd}"${item.value ? ` data-value="${item.value}"` : ''}` : `data-action="${item.action}"`;
      return `<button type="button" class="rte-btn" ${attrs} title="${item.title}" aria-label="${item.title}">${item.icon}</button>`;
    }).join('')}</div>`).join('');
    return bar;
  }

  function exec(doc, command, value) {
    doc.execCommand('styleWithCSS', false, ['foreColor', 'hiliteColor', 'backColor'].includes(command));
    doc.execCommand(command, false, value == null ? null : value);
  }

  function embedUrl(rawUrl) {
    const url = String(rawUrl || '').trim();
    let match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
    if (match) return 'https://www.youtube-nocookie.com/embed/' + match[1];
    match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (match) return 'https://player.vimeo.com/video/' + match[1];
    if (/^https:\/\/open\.spotify\.com\/(embed\/)?/i.test(url)) return url.replace('open.spotify.com/', 'open.spotify.com/embed/').replace('/embed/embed/', '/embed/');
    return '';
  }

  /**
   * Cria um editor de conteúdo completo (WYSIWYG) sobre um textarea existente.
   * O textarea continua recebendo o HTML final — nenhuma mudança no envio do formulário.
   */
  function attach(textarea, options) {
    const field = typeof textarea === 'string' ? document.getElementById(textarea) : textarea;
    if (!field || field.dataset.rteReady === '1') return null;
    const doc = field.ownerDocument || document;
    const opts = Object.assign({ minHeight: 240, placeholder: 'Escreva aqui...', showCounter: true }, options || {});

    const wrapper = doc.createElement('div');
    wrapper.className = 'rte';
    field.parentNode.insertBefore(wrapper, field);

    const toolbar = buildToolbar(doc);
    const surface = doc.createElement('div');
    surface.className = 'rte-surface';
    surface.contentEditable = 'true';
    surface.setAttribute('role', 'textbox');
    surface.setAttribute('aria-multiline', 'true');
    surface.dataset.placeholder = opts.placeholder;
    surface.style.minHeight = opts.minHeight + 'px';
    surface.innerHTML = textToHtml(field.value) || '';

    const htmlArea = doc.createElement('textarea');
    htmlArea.className = 'rte-html json-area';
    htmlArea.hidden = true;
    htmlArea.spellcheck = false;

    const footer = doc.createElement('div');
    footer.className = 'rte-footer';
    footer.innerHTML = '<span class="rte-count muted"></span><span class="rte-hint muted">Dica: cole textos do Word/WhatsApp — a formatação é limpa automaticamente.</span>';

    const fileInput = doc.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.hidden = true;

    wrapper.append(toolbar, surface, htmlArea, footer, fileInput);
    field.hidden = true;
    field.dataset.rteReady = '1';

    let htmlMode = false;

    function sync() {
      const html = htmlMode ? sanitizeHtml(htmlArea.value) : sanitizeHtml(surface.innerHTML);
      field.value = html;
      const counter = footer.querySelector('.rte-count');
      if (counter && opts.showCounter) {
        const text = htmlToText(html);
        counter.textContent = `${text.length} caracteres • ${text ? text.split(/\s+/).length : 0} palavras`;
      }
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function focusSurface() {
      surface.focus();
    }

    function insertHtml(html) {
      focusSurface();
      const clean = sanitizeHtml(html);
      if (!doc.execCommand('insertHTML', false, clean)) surface.insertAdjacentHTML('beforeend', clean);
      sync();
    }

    function toggleHtmlMode(force) {
      htmlMode = force == null ? !htmlMode : force;
      if (htmlMode) {
        htmlArea.value = sanitizeHtml(surface.innerHTML).replace(/></g, '>\n<');
        htmlArea.hidden = false;
        surface.hidden = true;
        htmlArea.style.minHeight = opts.minHeight + 'px';
      } else {
        surface.innerHTML = sanitizeHtml(htmlArea.value);
        htmlArea.hidden = true;
        surface.hidden = false;
      }
      toolbar.querySelectorAll('[data-action="html"]').forEach(btn => btn.classList.toggle('active', htmlMode));
      sync();
    }

    async function handleUpload(file) {
      if (!file) return;
      try {
        app.toast('Convertendo imagem para WebP...');
        const result = await toWebp(file);
        const kb = Math.round(result.size / 1024);
        insertHtml(`<figure class="img-block"><img src="${result.dataUrl}" alt="${app.escapeHtml(result.name)}" style="max-width: 100%; border-radius: 14px;"><figcaption>Legenda da imagem</figcaption></figure><p><br></p>`);
        app.toast(`Imagem convertida para WebP (${kb} KB) e inserida.`);
      } catch (error) {
        app.toast(error.message || 'Falha ao processar a imagem.');
      }
    }

    toolbar.addEventListener('click', async event => {
      const button = event.target.closest('button');
      if (!button) return;
      event.preventDefault();
      if (htmlMode && button.dataset.action !== 'html' && button.dataset.action !== 'preview') {
        return app.toast('Saia do modo HTML para usar esta ferramenta.');
      }
      if (button.dataset.cmd) {
        const value = button.dataset.value ? (button.dataset.cmd === 'formatBlock' ? '<' + button.dataset.value + '>' : button.dataset.value) : null;
        focusSurface();
        exec(doc, button.dataset.cmd, value);
        sync();
        return;
      }
      const action = button.dataset.action;
      if (action === 'link') {
        const url = prompt('Endereço do link (https://...)');
        if (!url) return;
        if (!isSafeUrl(url)) return app.toast('Link inválido.');
        focusSurface();
        const selection = doc.getSelection();
        if (selection && String(selection).trim()) exec(doc, 'createLink', url);
        else insertHtml(`<a href="${app.escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${app.escapeHtml(url)}</a>`);
        sync();
      } else if (action === 'image-url') {
        const url = prompt('Cole o endereço (URL) da imagem:');
        if (!url) return;
        if (!isSafeUrl(url)) return app.toast('URL de imagem inválida.');
        const alt = prompt('Texto alternativo (acessibilidade):') || 'Imagem';
        insertHtml(`<figure class="img-block"><img src="${app.escapeHtml(url)}" alt="${app.escapeHtml(alt)}" style="max-width: 100%; border-radius: 14px;"></figure><p><br></p>`);
      } else if (action === 'image-upload') {
        fileInput.click();
      } else if (action === 'video') {
        const url = prompt('Cole o link do vídeo (YouTube, Vimeo ou Spotify):');
        if (!url) return;
        const embed = embedUrl(url);
        if (!embed) return app.toast('Link de vídeo não reconhecido.');
        insertHtml(`<div class="embed-block"><iframe src="${app.escapeHtml(embed)}" loading="lazy" allowfullscreen frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"></iframe></div><p><br></p>`);
      } else if (action === 'verse') {
        const reference = prompt('Referência (ex: João 3:16):');
        if (!reference) return;
        const text = prompt('Texto do versículo:') || '';
        insertHtml(`<blockquote class="verse-block"><p>${app.escapeHtml(text)}</p><cite>${app.escapeHtml(reference)}</cite></blockquote><p><br></p>`);
      } else if (action === 'divider') {
        insertHtml('<hr><p><br></p>');
      } else if (action === 'table') {
        const cols = Math.min(6, Math.max(1, Number(prompt('Quantas colunas?', '3')) || 3));
        const rows = Math.min(20, Math.max(1, Number(prompt('Quantas linhas?', '3')) || 3));
        const head = `<tr>${Array.from({ length: cols }, (_, i) => `<th>Coluna ${i + 1}</th>`).join('')}</tr>`;
        const body = Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, () => '<td>&nbsp;</td>').join('')}</tr>`).join('');
        insertHtml(`<div class="table-wrap"><table class="table-block"><thead>${head}</thead><tbody>${body}</tbody></table></div><p><br></p>`);
      } else if (action === 'color' || action === 'highlight') {
        const input = doc.createElement('input');
        input.type = 'color';
        input.value = action === 'color' ? '#6f1025' : '#ffe9a8';
        input.style.position = 'fixed';
        input.style.opacity = '0';
        doc.body.appendChild(input);
        input.addEventListener('change', () => {
          focusSurface();
          exec(doc, action === 'color' ? 'foreColor' : 'hiliteColor', input.value);
          sync();
          input.remove();
        });
        input.click();
      } else if (action === 'html') {
        toggleHtmlMode();
      } else if (action === 'preview') {
        const html = sanitizeHtml(htmlMode ? htmlArea.value : surface.innerHTML);
        const win = window.open('', '_blank', 'width=820,height=720');
        if (!win) return app.toast('Permita pop-ups para pré-visualizar.');
        win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pré-visualização</title><link rel="stylesheet" href="${new URL('css/style.css', location.href).href}"></head><body class="page-body"><main class="page-container"><article class="card rich-content">${html}</article></main></body></html>`);
        win.document.close();
      } else if (action === 'fullscreen') {
        wrapper.classList.toggle('rte-fullscreen');
        button.classList.toggle('active', wrapper.classList.contains('rte-fullscreen'));
      }
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      handleUpload(file);
    });

    surface.addEventListener('input', sync);
    surface.addEventListener('blur', sync);
    htmlArea.addEventListener('input', sync);

    surface.addEventListener('paste', event => {
      const items = event.clipboardData && event.clipboardData.items;
      if (items) {
        for (const item of items) {
          if (item.kind === 'file' && /^image\//.test(item.type)) {
            event.preventDefault();
            return handleUpload(item.getAsFile());
          }
        }
      }
      event.preventDefault();
      const html = event.clipboardData.getData('text/html');
      const text = event.clipboardData.getData('text/plain');
      insertHtml(html ? sanitizeHtml(html) : app.escapeHtml(text).replace(/\n/g, '<br>'));
    });

    surface.addEventListener('drop', event => {
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file && /^image\//.test(file.type)) {
        event.preventDefault();
        handleUpload(file);
      }
    });

    surface.addEventListener('keydown', event => {
      if (event.key === 'Escape' && wrapper.classList.contains('rte-fullscreen')) wrapper.classList.remove('rte-fullscreen');
    });

    sync();

    return {
      element: wrapper,
      getHtml: () => sanitizeHtml(htmlMode ? htmlArea.value : surface.innerHTML),
      setHtml: html => { surface.innerHTML = textToHtml(html); sync(); },
      getText: () => htmlToText(field.value),
      focus: focusSurface,
      insertHtml,
      destroy: () => { wrapper.remove(); field.hidden = false; delete field.dataset.rteReady; }
    };
  }

  function attachAll(scope) {
    const root = scope || document;
    root.querySelectorAll('[data-rich-editor]').forEach(area => attach(area, {
      placeholder: area.getAttribute('placeholder') || 'Escreva aqui...',
      minHeight: Number(area.dataset.minHeight || 240)
    }));
  }

  /** Extrai a primeira imagem do conteúdo — usada como imagem de compartilhamento. */
  function firstImage(html) {
    const div = document.createElement('div');
    div.innerHTML = String(html || '');
    const img = div.querySelector('img');
    return img ? img.getAttribute('src') : '';
  }

  function excerpt(html, size) {
    const text = htmlToText(html);
    const limit = Number(size || 180);
    return text.length > limit ? text.slice(0, limit).trim() + '…' : text;
  }

  window.ImperioEditor = {
    attach,
    attachAll,
    sanitizeHtml,
    htmlToText,
    textToHtml,
    toWebp,
    firstImage,
    excerpt,
    isSafeUrl,
    embedUrl
  };
})();
