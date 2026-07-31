/* =============================================================================
   xlsx-mini — đọc và tạo file .xlsx ngay trong trình duyệt, KHÔNG dùng thư viện ngoài.

   .xlsx thực chất là một file ZIP chứa vài file XML. Ở đây:
   · Đọc  — tự bóc chỉ mục ZIP rồi giải nén bằng DecompressionStream('deflate-raw')
            (Chrome/Edge 80+, Firefox 113+, Safari 16.4+), sau đó phân tích XML bằng DOMParser.
   · Tạo  — đóng gói ZIP ở chế độ STORE (không nén) + CRC32 tự tính, nên không cần deflate.
            File sinh ra mở được bằng Excel / LibreOffice / Google Sheets khi offline.

   API:  window.EMXlsx.read(arrayBuffer) -> Promise<{ "TênSheet": [[ô,…],…] }>
         window.EMXlsx.build({ "TênSheet": [[ô,…],…] }) -> Uint8Array
         window.EMXlsx.supported() -> boolean
   ============================================================================= */
(function () {
  'use strict';

  var TD = function (u8) { return new TextDecoder('utf-8').decode(u8); };
  var TE = function (s) { return new TextEncoder().encode(s); };

  /* --------------------------------------------------------------- CRC32 */
  var TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* ------------------------------------------------------------ GIẢI NÉN */
  function supported() {
    return typeof DecompressionStream === 'function' && typeof DOMParser === 'function';
  }

  async function inflate(u8, method) {
    if (method === 0) return u8;                       /* STORE — không nén */
    if (method !== 8) throw new Error('Kiểu nén không hỗ trợ trong ZIP (method ' + method + ')');
    var ds = new DecompressionStream('deflate-raw');
    var wr = ds.writable.getWriter();
    wr.write(u8); wr.close();
    var rd = ds.readable.getReader(), parts = [], total = 0, r;
    while (!(r = await rd.read()).done) { parts.push(r.value); total += r.value.length; }
    var out = new Uint8Array(total), p = 0;
    parts.forEach(function (c) { out.set(c, p); p += c.length; });
    return out;
  }

  /* -------------------------------------------------------------- ĐỌC ZIP */
  async function unzip(buf) {
    var u8 = new Uint8Array(buf), d = new DataView(buf);
    var eo = -1, min = Math.max(0, u8.length - 22 - 65535);
    for (var i = u8.length - 22; i >= min; i--) {
      if (d.getUint32(i, true) === 0x06054b50) { eo = i; break; }
    }
    if (eo < 0) throw new Error('Không đọc được cấu trúc ZIP — file có đúng là .xlsx không?');

    var count = d.getUint16(eo + 10, true), start = d.getUint32(eo + 16, true);
    var entries = [], p = start;
    for (var n = 0; n < count; n++) {
      if (d.getUint32(p, true) !== 0x02014b50) break;
      var nameLen = d.getUint16(p + 28, true),
          extraLen = d.getUint16(p + 30, true),
          cmtLen = d.getUint16(p + 32, true);
      entries.push({
        name: TD(u8.subarray(p + 46, p + 46 + nameLen)),
        method: d.getUint16(p + 10, true),
        csize: d.getUint32(p + 20, true),
        lho: d.getUint32(p + 42, true)
      });
      p += 46 + nameLen + extraLen + cmtLen;
    }

    var files = {};
    for (var k = 0; k < entries.length; k++) {
      var e = entries[k];
      if (/\/$/.test(e.name)) continue;
      var ln = d.getUint16(e.lho + 26, true), le = d.getUint16(e.lho + 28, true);
      var from = e.lho + 30 + ln + le;
      files[e.name] = await inflate(u8.subarray(from, from + e.csize), e.method);
    }
    return files;
  }

  /* ------------------------------------------------------------- ĐỌC XLSX */
  function parseXml(u8) {
    return new DOMParser().parseFromString(TD(u8), 'application/xml');
  }
  function attr(el, local) {
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (a.name === local || a.name.split(':').pop() === local) return a.value;
    }
    return null;
  }
  function textOf(el) {
    return el ? String(el.textContent) : '';
  }
  function colIndex(ref) {
    var m = /^([A-Z]+)/.exec(ref || '');
    if (!m) return 0;
    var c = 0;
    for (var i = 0; i < m[1].length; i++) c = c * 26 + (m[1].charCodeAt(i) - 64);
    return c - 1;
  }

  function sharedStrings(doc) {
    if (!doc) return [];
    var out = [], si = doc.getElementsByTagName('si');
    for (var i = 0; i < si.length; i++) {
      var ts = si[i].getElementsByTagName('t'), s = '';
      for (var j = 0; j < ts.length; j++) s += textOf(ts[j]);
      out.push(s);
    }
    return out;
  }

  function readSheet(doc, shared) {
    var rows = [], rowEls = doc.getElementsByTagName('row');
    for (var i = 0; i < rowEls.length; i++) {
      var cs = rowEls[i].getElementsByTagName('c'), row = [];
      for (var j = 0; j < cs.length; j++) {
        var c = cs[j], t = c.getAttribute('t'), v;
        if (t === 's') {
          var idx = parseInt(textOf(c.getElementsByTagName('v')[0]), 10);
          v = shared[idx] || '';
        } else if (t === 'inlineStr') {
          var is = c.getElementsByTagName('is')[0];
          var ts = is ? is.getElementsByTagName('t') : [];
          v = '';
          for (var q = 0; q < ts.length; q++) v += textOf(ts[q]);
        } else {
          v = textOf(c.getElementsByTagName('v')[0]);
        }
        var at = colIndex(c.getAttribute('r'));
        while (row.length < at) row.push('');
        row[at] = String(v).trim();
      }
      /* bỏ dòng trống hoàn toàn */
      if (row.some(function (x) { return x !== ''; })) rows.push(row);
    }
    return rows;
  }

  async function read(buf) {
    if (!supported()) throw new Error('Trình duyệt này chưa hỗ trợ đọc .xlsx — hãy lưu file thành .csv rồi thử lại.');
    var files = await unzip(buf);

    var wbKey = Object.keys(files).filter(function (k) { return /^xl\/workbook\.xml$/i.test(k); })[0];
    if (!wbKey) throw new Error('File không có xl/workbook.xml — không phải sổ tính Excel.');

    var wb = parseXml(files[wbKey]);
    var relsKey = Object.keys(files).filter(function (k) { return /^xl\/_rels\/workbook\.xml\.rels$/i.test(k); })[0];
    var rels = {};
    if (relsKey) {
      var rl = parseXml(files[relsKey]).getElementsByTagName('Relationship');
      for (var i = 0; i < rl.length; i++) {
        rels[rl[i].getAttribute('Id')] = rl[i].getAttribute('Target').replace(/^\/?xl\//, '').replace(/^\//, '');
      }
    }

    var ssKey = Object.keys(files).filter(function (k) { return /^xl\/sharedStrings\.xml$/i.test(k); })[0];
    var shared = sharedStrings(ssKey ? parseXml(files[ssKey]) : null);

    var out = {}, sheets = wb.getElementsByTagName('sheet');
    for (var s = 0; s < sheets.length; s++) {
      var name = sheets[s].getAttribute('name');
      var rid = attr(sheets[s], 'id');
      var target = rels[rid] || ('worksheets/sheet' + (s + 1) + '.xml');
      var key = Object.keys(files).filter(function (k) {
        return k.toLowerCase() === ('xl/' + target).toLowerCase();
      })[0];
      out[name] = key ? readSheet(parseXml(files[key]), shared) : [];
    }
    return out;
  }

  /* ------------------------------------------------------------- TẠO XLSX */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      /* XML 1.0 không cho phép ký tự điều khiển — loại bỏ để Excel không báo hỏng file */
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }
  function colName(i) {
    var s = '';
    i++;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; }
    return s;
  }
  function sheetXml(rows) {
    var body = rows.map(function (r, ri) {
      var cells = r.map(function (v, ci) {
        if (v === null || v === undefined || v === '') return '';
        return '<c r="' + colName(ci) + (ri + 1) + '" t="inlineStr">' +
               '<is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
      }).join('');
      return '<row r="' + (ri + 1) + '">' + cells + '</row>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetData>' + body + '</sheetData></worksheet>';
  }

  function zipStore(files) {
    var chunks = [], central = [], offset = 0, total = 0;
    files.forEach(function (f) {
      var nameBytes = TE(f.name), crc = crc32(f.data), size = f.data.length;

      var lh = new Uint8Array(30 + nameBytes.length);
      var lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);            /* version cần để giải nén */
      lv.setUint16(6, 0x0800, true);        /* cờ: tên file mã hoá UTF-8 */
      lv.setUint16(8, 0, true);             /* method 0 = STORE */
      lv.setUint16(10, 0, true);            /* giờ */
      lv.setUint16(12, 0x21, true);         /* ngày = 1980-01-01 */
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);

      var ch = new Uint8Array(46 + nameBytes.length);
      var cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x21, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint32(42, offset, true);
      ch.set(nameBytes, 46);

      chunks.push(lh, f.data);
      central.push(ch);
      offset += lh.length + size;
    });

    var cdSize = central.reduce(function (a, c) { return a + c.length; }, 0);
    var eocd = new Uint8Array(22), ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);

    var all = chunks.concat(central, [eocd]);
    all.forEach(function (c) { total += c.length; });
    var out = new Uint8Array(total), p = 0;
    all.forEach(function (c) { out.set(c, p); p += c.length; });
    return out;
  }

  function build(sheets) {
    var names = Object.keys(sheets);

    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      names.map(function (_, i) {
        return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ' +
               'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join('') + '</Types>';

    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';

    var workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      names.map(function (n, i) {
        return '<sheet name="' + esc(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      }).join('') + '</sheets></workbook>';

    var wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      names.map(function (_, i) {
        return '<Relationship Id="rId' + (i + 1) + '" ' +
               'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
               'Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join('') + '</Relationships>';

    var files = [
      { name: '[Content_Types].xml', data: TE(contentTypes) },
      { name: '_rels/.rels', data: TE(rootRels) },
      { name: 'xl/workbook.xml', data: TE(workbook) },
      { name: 'xl/_rels/workbook.xml.rels', data: TE(wbRels) }
    ];
    names.forEach(function (n, i) {
      files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: TE(sheetXml(sheets[n])) });
    });
    return zipStore(files);
  }

  var api = { read: read, build: build, supported: supported };
  if (typeof window !== 'undefined') window.EMXlsx = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
