// ============================================
// Google Sheets 載入 + Markdown 渲染
// ============================================

(function() {
  'use strict';

  // ===== CSV Parser =====
  function parseCSV(text) {
    var lines = [];
    var line = '';
    var inQuote = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') {
        if (inQuote && text[i+1] === '"') {
          line += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if ((ch === '\n' || ch === '\r') && !inQuote) {
        if (ch === '\r' && text[i+1] === '\n') i++;
        if (line.length || lines.length) lines.push(line);
        line = '';
      } else {
        line += ch;
      }
    }
    if (line) lines.push(line);
    return lines.map(splitCells);
  }

  function splitCells(line) {
    var cells = [];
    var cell = '';
    var inQuote = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i+1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        cells.push(cell);
        cell = '';
      } else {
        cell += ch;
      }
    }
    cells.push(cell);
    return cells;
  }

  // ===== Markdown 轉 HTML =====
  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function parseMarkdown(md) {
    if (!md) return '';

    var blocks = String(md).replace(/\r\n/g, '\n').split(/\n\n+/);
    var html = [];

    blocks.forEach(function(block) {
      block = block.trim();
      if (!block) return;

      // 小標
      if (/^## /.test(block)) {
        html.push('<h2>' + inline(block.replace(/^## /, '')) + '</h2>');
        return;
      }
      // 三級小標
      if (/^### /.test(block)) {
        html.push('<h3>' + inline(block.replace(/^### /, '')) + '</h3>');
        return;
      }
      // 引用 —— 用 \n 接，inline() 內會轉成 <br>
      if (/^> /.test(block)) {
        var quote = block.split('\n').map(function(l) {
          return l.replace(/^> ?/, '');
        }).join('\n');
        html.push('<blockquote><p>' + inline(quote) + '</p></blockquote>');
        return;
      }
      // 圖片（單行 ![](url)）
      var imgMatch = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        html.push('<figure><img src="' + imgMatch[2] + '" alt="' + escapeHtml(imgMatch[1]) + '">' +
                  (imgMatch[1] ? '<figcaption>' + escapeHtml(imgMatch[1]) + '</figcaption>' : '') +
                  '</figure>');
        return;
      }
      // 列表
      if (/^- /.test(block)) {
        var items = block.split('\n').filter(function(l) { return /^- /.test(l); })
          .map(function(l) { return '<li>' + inline(l.replace(/^- /, '')) + '</li>'; });
        html.push('<ul>' + items.join('') + '</ul>');
        return;
      }
      if (/^\d+\. /.test(block)) {
        var items = block.split('\n').filter(function(l) { return /^\d+\. /.test(l); })
          .map(function(l) { return '<li>' + inline(l.replace(/^\d+\. /, '')) + '</li>'; });
        html.push('<ol>' + items.join('') + '</ol>');
        return;
      }
      // 一般段落（可能多行）—— 換行轉 <br> 移到 inline() 內 escapeHtml 之後
      html.push('<p>' + inline(block) + '</p>');
    });

    return html.join('\n');
  }

  function inline(text) {
    text = escapeHtml(text);
    // 換行轉 <br>（在 escapeHtml 之後，這樣 <br> 才會是真的 HTML 而不會被跳脫）
    text = text.replace(/\n/g, '<br>');
    // 還原圖片（避免被 escapeHtml 破壞）
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(_, alt, url) {
      return '<img src="' + url + '" alt="' + alt + '" style="max-width:100%;">';
    });
    // 連結
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // 粗體
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 強調（金色底線）
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return text;
  }


  // 將各種日期字串轉成 YYYY-MM-DD（表單回應的日期可能是斜線、月日全寫等）
  function normalizeDate(s) {
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var d = new Date(s);
    if (!isNaN(d.getTime())) {
      var y = d.getFullYear();
      var m = ('0' + (d.getMonth() + 1)).slice(-2);
      var dd = ('0' + d.getDate()).slice(-2);
      return y + '-' + m + '-' + dd;
    }
    return s;
  }

  // ===== Cache helpers =====
  var CACHE_KEY = 'zhiyao-articles-cache';
  function getCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      var ttl = (window.SHEETS_CONFIG && window.SHEETS_CONFIG.CACHE_MINUTES || 5) * 60 * 1000;
      if (Date.now() - data.t > ttl) return null;
      return data.articles;
    } catch(e) { return null; }
  }
  function setCache(articles) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), articles: articles }));
    } catch(e) {}
  }

  // ===== Fetch + Parse =====
  window.fetchArticles = function() {
    var cached = getCache();
    if (cached) return Promise.resolve(cached);

    return fetch(window.getSheetCsvUrl())
      .then(function(r) { return r.text(); })
      .then(function(text) {
        var rows = parseCSV(text);
        if (rows.length < 2) return [];
        // 第 1 列是欄位名稱，跳過
        var articles = rows.slice(1).filter(function(r) {
          // 表單回覆分頁第 0 欄是時間戳記，跳過。文章ID 在第 1 欄、大標題在第 2 欄
          return r[1] && r[2]; // 至少要有 ID + 標題
        }).map(function(r) {
          return {
            // A 欄 r[0] = 時間戳記（不用）
            id: (r[1] || '').trim(),
            title: (r[2] || '').trim(),
            subtitle: (r[3] || '').trim(),
            category: (r[4] || '').trim(),
            date: normalizeDate((r[5] || '').trim()),
            excerpt: (r[6] || '').trim(),
            cover: (r[7] || '').trim(),
            content: r[8] || ''
          };
        });
        // 依日期降序排
        articles.sort(function(a, b) {
          return (b.date || '').localeCompare(a.date || '');
        });
        setCache(articles);
        return articles;
      })
      .catch(function(err) {
        console.error('載入文章失敗', err);
        return [];
      });
  };

  window.fetchArticleById = function(id) {
    return window.fetchArticles().then(function(articles) {
      return articles.find(function(a) { return a.id === id; });
    });
  };

  window.renderMarkdown = parseMarkdown;
})();
