/* Kiểm thử DOM cho module 11-ngu-phap (chạy bằng jsdom) — không phải file của app */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');

const ROOT = process.argv[2] || '.';
let fails = 0, checks = 0;
function ok(cond, label, extra) {
  checks++;
  if (!cond) { fails++; console.log('  ✗ ' + label + (extra ? ' — ' + extra : '')); }
  else console.log('  ✓ ' + label);
}

async function load(rel) {
  const errs = [];
  const vc = new VirtualConsole();
  /* Bỏ qua các giới hạn của jsdom (không phải lỗi của app): tải CSS ngoài, scrollTo, animate */
  const IGNORE = /Could not load|css|Not implemented/i;
  vc.on('jsdomError', e => { if (!IGNORE.test(e.message)) errs.push(e.message); });
  const dom = await JSDOM.fromFile(path.join(ROOT, rel), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc
  });
  const w = dom.window;
  w.Element.prototype.animate = w.Element.prototype.animate || function () { return { finished: Promise.resolve() }; };
  w.addEventListener('error', e => errs.push(String(e.message)));
  await new Promise(r => { w.addEventListener('load', r); setTimeout(r, 700); });
  return { dom, w, d: w.document, errs };
}

function key(w, k) {
  const e = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  w.document.dispatchEvent(e);
}

(async () => {
  /* ------------------------------------------------- 1. Bốn trang mới */
  for (const f of ['index.html', 'chi-tiet.html', 'luyen-tap.html', 'so-loi.html', 'them-chu-diem.html']) {
    console.log('\n▸ 11-ngu-phap/' + f);
    const { w, d, errs } = await load('11-ngu-phap/' + f);
    ok(errs.length === 0, 'không có lỗi JavaScript', errs[0]);
    ok(d.querySelectorAll('[data-ico]').length === 0, 'mọi <i data-ico> đã thành SVG',
       'còn ' + d.querySelectorAll('[data-ico]').length);
    ok(d.querySelectorAll('svg.ico').length > 0, 'icon SVG được render (' + d.querySelectorAll('svg.ico').length + ')');

    const focusPage = f === 'luyen-tap.html';
    if (!focusPage) {
      const act = d.querySelector('.side .nav-item.is-active');
      ok(!!act && /Ngữ pháp/.test(act.textContent), 'sidebar dựng xong, mục “Ngữ pháp” đang active');
      ok(!!d.querySelector('.tabbar') && !!d.querySelector('.topbar'), 'có tabbar + topbar cho mobile');
      const links = [...d.querySelectorAll('.side a')].map(a => a.getAttribute('href'));
      ok(links.some(h => /11-ngu-phap/.test(h)), 'sidebar trỏ tới module 11');
    } else {
      ok(!!d.querySelector('.focus-bar'), 'dùng chế độ tập trung (.focus)');
      ok(!d.querySelector('.side'), 'không dựng sidebar trong phiên luyện');
    }
    ok(d.documentElement.getAttribute('data-theme') === 'light', 'theme mặc định = light');
    w.EMTheme.apply('dark');
    ok(d.documentElement.getAttribute('data-theme') === 'dark', 'đổi sang dark mode được');
    w.close();
  }

  /* ------------------------------------------------- 2. Bộ lọc trang index */
  console.log('\n▸ index.html — tab & bộ lọc cấp độ');
  {
    const { w, d } = await load('11-ngu-phap/index.html');
    const clk = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));

    clk(d.querySelector('[data-tab="trap"]'));
    ok(d.getElementById('tab-trap').hidden === false && d.getElementById('tab-all').hidden === true,
       'tab “Bẫy với người Việt” mở đúng');
    ok(d.querySelectorAll('#tab-trap .trap').length === 7, '7 nhóm lỗi người Việt được liệt kê');

    clk(d.querySelector('[data-tab="weak"]'));
    ok(d.getElementById('tab-weak').hidden === false, 'tab “Điểm yếu của tôi” mở đúng');

    clk(d.querySelector('[data-tab="all"]'));
    const cards = [...d.querySelectorAll('#topicGrid .deck')];
    ok(cards.length === 16, '16 chủ điểm ngữ pháp', 'đếm được ' + cards.length);

    clk(d.querySelector('#lvFilter [data-lv="B1"]'));
    const shown = cards.filter(c => c.style.display !== 'none');
    ok(shown.length === 4 && shown.every(c => c.dataset.lv === 'B1'),
       'lọc cấp độ B1 → chỉ còn chủ điểm B1 (' + shown.length + ')');
    ok(d.getElementById('lvCount').textContent === '4 chủ điểm', 'bộ đếm cập nhật đúng');

    clk(d.querySelector('#lvFilter [data-lv="all"]'));
    ok(cards.filter(c => c.style.display !== 'none').length === 16, 'bỏ lọc → hiện lại đủ 16');
    w.close();
  }

  /* ------------------------------------------------- 3. Bộ lọc sổ lỗi */
  console.log('\n▸ so-loi.html — bộ lọc');
  {
    const { w, d } = await load('11-ngu-phap/so-loi.html');
    const clk = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    const rows = [...d.querySelectorAll('#errList .err')];
    ok(rows.length === 8, '8 lỗi trong sổ');
    clk(d.querySelector('#filter [data-f="due"]'));
    ok(rows.filter(r => r.style.display !== 'none').length === 4, 'lọc “đến hạn hôm nay” → 4 lỗi');
    clk(d.querySelector('#filter [data-f="done"]'));
    ok(rows.filter(r => r.style.display !== 'none').length === 2, 'lọc “đã khắc phục” → 2 lỗi');
    clk(d.querySelector('#filter [data-f="all"]'));
    ok(d.getElementById('errList').hidden === false, 'bỏ lọc → danh sách hiện lại');
    ok(d.querySelectorAll('.dist-row').length === 7, 'biểu đồ phân bố đủ 7 nhóm lỗi');
    w.close();
  }

  /* ------------------------------------------------- 4. Phiên luyện: trả lời ĐÚNG hết */
  console.log('\n▸ luyen-tap.html — trả lời đúng cả 6 câu');
  {
    const { w, d, errs } = await load('11-ngu-phap/luyen-tap.html');
    const clk = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    const RIGHT = ['has lived', 'a teacher', null, 'A new app was launched by the company last month', 'goes', 'books'];
    const TYPE = ['cloze', 'correct', 'mcq', 'transform', 'cloze', 'correct'];

    for (let i = 0; i < 6; i++) {
      const label = d.querySelector('.qcard-head .badge').textContent.trim();
      ok(!!label, 'câu ' + (i + 1) + ' — dạng bài: ' + label);

      if (TYPE[i] === 'mcq') {
        key(w, '1');                                   /* phím tắt chọn đáp án 1 */
      } else {
        if (TYPE[i] === 'correct') clk(d.querySelector('#toks .tok-btn[data-i="3"]'));
        const el = d.getElementById('ans');
        el.value = RIGHT[i];
        clk(d.getElementById('btnMain'));
      }
      const fb = d.querySelector('#fbSlot .fb');
      ok(!!fb && fb.classList.contains('fb-ok'), '  → chấm ĐÚNG');
      clk(d.getElementById('btnMain'));                /* sang câu tiếp / xem kết quả */
    }
    ok(/100%/.test(d.querySelector('.ring-lg').textContent), 'màn hình kết quả: 100%');
    ok(/6 \/ 6/.test(d.querySelector('.res-title').textContent), 'điểm 6/6');
    ok(!!d.querySelector('.empty'), 'không có lỗi mới nào được ghi vào sổ');
    ok(errs.length === 0, 'không có lỗi JavaScript trong cả phiên', errs[0]);
    w.close();
  }

  /* ------------------------------------------------- 5. Phiên luyện: trả lời SAI */
  console.log('\n▸ luyen-tap.html — trả lời sai, kiểm tra ghi sổ lỗi & ôn lại');
  {
    const { w, d, errs } = await load('11-ngu-phap/luyen-tap.html');
    const clk = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));

    /* Câu 1 — điền sai */
    d.getElementById('ans').value = 'lived';
    clk(d.getElementById('btnMain'));
    let fb = d.querySelector('#fbSlot .fb');
    ok(fb.classList.contains('fb-err'), 'điền sai → phản hồi “Chưa đúng”');
    ok(/sổ lỗi/.test(fb.textContent), 'phản hồi báo đã thêm vào sổ lỗi');
    ok(/Vì sao/.test(fb.textContent), 'phản hồi có giải thích quy tắc');
    clk(d.getElementById('btnMain'));

    /* Câu 2 — bấm nhầm token */
    clk(d.querySelector('#toks .tok-btn[data-i="1"]'));
    fb = d.querySelector('#fbSlot .fb');
    ok(fb.classList.contains('fb-err'), 'bấm nhầm chỗ sai → tính là sai');
    ok(!!d.querySelector('#toks .tok-btn.is-right'), 'hé lộ đúng token bị lỗi');
    clk(d.getElementById('btnMain'));

    /* Câu 3 — chọn đáp án sai */
    key(w, '2');
    ok(d.querySelector('#fbSlot .fb').classList.contains('fb-err'), 'trắc nghiệm chọn sai → tính là sai');
    ok(!!d.querySelector('#opts .opt.is-right') && !!d.querySelector('#opts .opt.is-wrong'),
       'hiện cả đáp án đúng và đáp án đã chọn');
    clk(d.getElementById('btnMain'));

    /* Câu 4–6 — bỏ qua */
    for (let i = 0; i < 3; i++) {
      clk(d.getElementById('btnSkip'));
      clk(d.getElementById('btnMain'));
    }

    ok(/0%/.test(d.querySelector('.ring-lg').textContent), 'kết quả 0%');
    const rows = d.querySelectorAll('.res-row');
    ok(rows.length === 6, 'cả 6 câu sai được ghi vào sổ lỗi', 'đếm được ' + rows.length);
    ok(/Thiếu -s số nhiều|Nhầm thì/.test(d.querySelector('.res-list').textContent),
       'mỗi lỗi gắn đúng nhãn nhóm lỗi');

    clk(d.getElementById('btnRetry'));
    ok(/Câu 1 \/ 6/.test(d.getElementById('stage').textContent), 'nút “Ôn lại câu sai” khởi động lại phiên');
    ok(errs.length === 0, 'không có lỗi JavaScript', errs[0]);
    w.close();
  }

  /* ------------------------------------------------- 6. Parser dán hàng loạt */
  console.log('\n▸ them-chu-diem.html — parser cú pháp dán hàng loạt');
  {
    const { w, d } = await load('11-ngu-phap/them-chu-diem.html');
    const P = w.EMParseGrammar;

    const one = s => P(s)[0];
    ok(one('She {has lived} in Hue for six years. (live)').type === 'cloze', 'nhận diện “điền chỗ trống” từ { }');
    ok(one('She {has lived} in Hue. (live)').hint === 'live', 'đọc được (gợi ý) ở cuối câu điền');
    ok(one('He worked here {for | since | from} five years.').type === 'mcq', 'nhận diện “trắc nghiệm” từ dấu |');
    ok(one('He worked here {for | since | from} five years.').answer === 'for', 'phương án đầu là đáp án đúng');
    ok(one('He worked here {for | since | from} five years.').options.length === 3, 'giữ đủ 3 phương án');
    ok(one('My sister is [teacher > a teacher] at school.').type === 'correct', 'nhận diện “sửa lỗi” từ [ > ]');
    ok(one('My sister is [teacher > a teacher] at school.').answer === 'a teacher', 'lấy đúng vế sửa');
    ok(one('They built it in 1990. >> It was built in 1990.').type === 'transform', 'nhận diện “viết lại câu” từ >>');
    ok(one('She {goes} to school. // Ngôi 3 số ít thêm -s.').why === 'Ngôi 3 số ít thêm -s.',
       'tách được phần // giải thích');
    ok(P('# đây là ghi chú\n\nShe {goes} home.').length === 1, 'bỏ qua dòng # và dòng trống');

    ok(one('She {has lived in Hue.').ok === false, 'báo lỗi: ngoặc { } chưa khép');
    ok(one('She {a} and {b} here.').ok === false, 'báo lỗi: nhiều hơn một cặp { }');
    ok(one('He worked here {a|b|c|d|e} years.').ok === false, 'báo lỗi: quá 4 phương án');
    ok(one('My sister is [teacher >] at school.').ok === false, 'báo lỗi: thiếu vế đúng trong [ > ]');
    ok(one('They built it in 1990. >>').ok === false, 'báo lỗi: thiếu câu đích sau >>');
    ok(one('She has lived in Hue for six years.').ok === false, 'báo lỗi: không nhận ra dạng bài');
    ok(/Không nhận ra/.test(one('She has lived in Hue.').msg), 'thông báo lỗi bằng tiếng Việt, nói rõ nguyên nhân');
    w.close();
  }

  /* ------------------------------------------------- 7. Luồng wizard thêm chủ điểm */
  console.log('\n▸ them-chu-diem.html — luồng 4 bước');
  {
    const { w, d, errs } = await load('11-ngu-phap/them-chu-diem.html');
    const clk = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    const inp = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };

    ok(d.getElementById('scr-start').hidden === false, 'mở ra ở màn hình chọn cách bắt đầu');

    /* --- Nhánh chép mẫu --- */
    clk(d.getElementById('goTpl'));
    ok(d.getElementById('scr-tpl').hidden === false, 'mở được thư viện mẫu');
    const tpls = [...d.querySelectorAll('#tplGrid .deck')];
    ok(tpls.length === 8, '8 chủ điểm mẫu');
    clk(d.querySelector('#tplFilter [data-lv="B2"]'));
    ok(tpls.filter(t => t.style.display !== 'none').length === 3, 'lọc mẫu theo cấp độ B2 → 3 mẫu');
    clk(d.querySelector('#tplFilter [data-lv="all"]'));

    clk(tpls[0]);
    ok(d.getElementById('scr-wiz').hidden === false, 'chọn mẫu → vào wizard');
    ok(d.getElementById('inName').value === 'Thì quá khứ hoàn thành', 'mẫu điền sẵn tên chủ điểm');
    ok(d.getElementById('pasteBox').value.length > 40, 'mẫu điền sẵn câu luyện tập');
    ok(d.querySelectorAll('#revList .rev').length === 3, 'câu của mẫu được phân tích ngay (3 câu)');
    ok(d.querySelectorAll('#useRows .tblock').length === 3, 'mẫu điền sẵn 3 trường hợp dùng');
    ok(d.getElementById('inCmp').value === 'Quá khứ đơn', 'mẫu điền sẵn chủ điểm dễ nhầm');
    ok(d.querySelectorAll('#cmpRows .rrow').length === 3, 'mẫu điền sẵn 3 tiêu chí đối chiếu');
    ok(d.getElementById('cmpHeadA').textContent === 'Quá khứ đơn' &&
       d.getElementById('cmpHeadB').textContent === 'Thì quá khứ hoàn thành',
       'tiêu đề 2 cột bảng đối chiếu bám theo tên đã nhập');

    /* --- Bắt buộc có tên --- */
    clk(d.getElementById('wizCancel'));
    clk(d.getElementById('goBlank'));
    ok(d.getElementById('pasteBox').value === '', 'tạo mới → mọi trường trống');
    ok(d.getElementById('inCmp').value === '', 'tạo mới → xóa sạch dữ liệu của mẫu trước đó');
    ok(d.querySelectorAll('#formRows .rrow').length === 3, 'tạo mới có sẵn 3 dòng công thức');
    ok(d.querySelectorAll('#useRows .tblock').length === 2, 'tạo mới có sẵn 2 khối trường hợp dùng');
    clk(d.getElementById('btnNext'));
    ok(d.getElementById('fName').classList.contains('is-bad'), 'thiếu tên → chặn sang bước 2 và báo lỗi');
    ok(d.getElementById('pane-1').hidden === false, 'vẫn đang ở bước 1');

    /* --- Đi hết 4 bước --- */
    d.getElementById('inName').value = 'Thì hiện tại hoàn thành tiếp diễn';
    clk(d.getElementById('btnNext'));
    ok(d.getElementById('pane-2').hidden === false, 'có tên → sang bước 2');
    ok(!d.getElementById('fName').classList.contains('is-bad'), 'cờ báo lỗi được gỡ');

    /* thêm/xóa dòng công thức, thêm từ tín hiệu, thêm bẫy */
    clk(d.getElementById('addForm'));
    ok(d.querySelectorAll('#formRows .rrow').length === 4, 'thêm dòng công thức được');
    clk(d.querySelector('#formRows .rrow:last-child .icon-btn'));
    ok(d.querySelectorAll('#formRows .rrow').length === 3, 'xóa dòng công thức được');

    const sig = d.getElementById('sigIn');
    sig.value = 'since, for, lately';
    sig.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    ok(d.querySelectorAll('#sigList .chip-x').length === 3, 'gõ nhiều từ tín hiệu ngăn bằng dấu phẩy → 3 chip');
    clk(d.querySelector('#sigList .chip-x button'));
    ok(d.querySelectorAll('#sigList .chip-x').length === 2, 'bỏ được một chip');

    clk(d.getElementById('addUse'));
    ok(d.querySelectorAll('#useRows .tblock').length === 3, 'thêm trường hợp dùng được');
    ok(/3/.test(d.querySelector('#useRows .tblock:last-child .use-no').textContent),
       'khối mới được đánh số 3 tự động');
    clk(d.querySelector('#useRows .tblock:last-child .icon-btn'));
    ok(d.querySelectorAll('#useRows .tblock').length === 2, 'xóa trường hợp dùng được');

    clk(d.getElementById('addCmp'));
    ok(d.querySelectorAll('#cmpRows .rrow').length === 2, 'thêm tiêu chí đối chiếu được');

    clk(d.getElementById('addTrap'));
    ok(d.querySelectorAll('#trapRows .tblock').length === 2, 'thêm khối bẫy được');

    clk(d.getElementById('btnNext'));
    ok(d.getElementById('pane-3').hidden === false, 'sang bước 3');

    clk(d.getElementById('btnSample'));
    const rows = [...d.querySelectorAll('#revList .rev')];
    ok(rows.length === 11, 'ví dụ mẫu cho 11 câu (dòng # bị bỏ qua)', 'đếm được ' + rows.length);
    ok(rows.filter(r => r.classList.contains('is-bad')).length === 0, 'ví dụ mẫu không có dòng lỗi');
    ok(/Điền chỗ trống/.test(d.getElementById('revMix').textContent) &&
       /Viết lại câu/.test(d.getElementById('revMix').textContent), 'bộ đếm liệt kê đủ các dạng bài');

    inp(d.getElementById('pasteBox'), d.getElementById('pasteBox').value + '\nCâu này thiếu dấu hiệu.');
    ok(d.querySelectorAll('#revList .rev.is-bad').length === 1, 'thêm dòng sai cú pháp → hiện 1 dòng lỗi');
    ok(d.getElementById('revBad').hidden === false, 'huy hiệu “dòng lỗi” hiện lên');
    clk(d.querySelector('#revList .rev.is-bad [data-del]'));
    ok(d.querySelectorAll('#revList .rev.is-bad').length === 0, 'xóa được dòng lỗi khỏi bảng duyệt');

    clk(d.getElementById('btnNext'));
    ok(d.getElementById('pane-4').hidden === false, 'sang bước 4');
    ok(/Thì hiện tại hoàn thành tiếp diễn/.test(d.getElementById('prevDeck').textContent),
       'xem trước thẻ chủ điểm lấy đúng tên vừa nhập');
    ok(d.querySelectorAll('#chkList .chk-row').length === 9, 'checklist đủ 9 mục');
    ok(/trường hợp dùng/.test(d.getElementById('chkList').textContent),
       'checklist có mục “trường hợp dùng”');
    ok(/đối chiếu/i.test(d.getElementById('chkList').textContent),
       'checklist có mục “bảng đối chiếu”');
    ok(d.querySelectorAll('#chkList .chk-ok').length >= 4, 'phần lớn mục checklist đạt');

    clk(d.getElementById('btnPrev'));
    ok(d.getElementById('pane-3').hidden === false, 'nút Quay lại hoạt động');
    clk(d.getElementById('btnNext'));
    clk(d.getElementById('btnNext'));
    ok(d.getElementById('scr-done').hidden === false, 'lưu xong → màn hình hoàn tất');
    ok(/Thì hiện tại hoàn thành tiếp diễn/.test(d.getElementById('doneName').textContent),
       'màn hình hoàn tất nêu tên chủ điểm');
    ok(errs.length === 0, 'không có lỗi JavaScript trong cả luồng', errs[0]);
    w.close();
  }

  /* ------------------------------------------------- 8. Đọc / tạo file .xlsx */
  console.log('\n▸ xlsx-mini.js — đọc và tạo .xlsx không dùng thư viện ngoài');
  {
    const { JSDOM } = require('jsdom');
    const fs = require('fs'), cp = require('child_process'), os = require('os');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emx-'));

    const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
    const w = dom.window;
    w.DecompressionStream = DecompressionStream;
    w.TextDecoder = TextDecoder; w.TextEncoder = TextEncoder;
    w.eval(fs.readFileSync(path.join(ROOT, '11-ngu-phap/xlsx-mini.js'), 'utf8'));
    const X = w.EMXlsx;
    ok(typeof X.read === 'function' && typeof X.build === 'function', 'xlsx-mini nạp được, có read() và build()');

    /* --- A. Đọc file .xlsx THẬT do openpyxl sinh (deflate + sharedStrings, đúng định dạng Excel) --- */
    const mk = path.join(tmp, 'mk.py');
    fs.writeFileSync(mk, `# -*- coding: utf-8 -*-
from openpyxl import Workbook
wb = Workbook(); ws = wb.active; ws.title = "Thông tin"
for r in [["Nhãn","Giá trị"],["Tên chủ điểm","Thì quá khứ hoàn thành"],["Cấp độ","b1"],
          ["Icon","clock"],["Nhóm lỗi","Nhầm thì"],["Từ tín hiệu","before, after, by the time"],
          ["Chủ điểm dễ nhầm","Quá khứ đơn"],["Nhãn lạ","bỏ qua"]]: ws.append(r)
w2 = wb.create_sheet("Công thức")
for r in [["Dạng","Cấu trúc","Ví dụ"],["Khẳng định","S + had + V3","She had left."],
          ["Phủ định","S + had not + V3","They hadn't finished."]]: w2.append(r)
w3 = wb.create_sheet("Cách dùng")
for r in [["Trường hợp","Câu ví dụ","Giải thích"],["Trước một mốc quá khứ","The train {had} already {left}.","Tàu chạy trước."]]: w3.append(r)
w4 = wb.create_sheet("Đối chiếu")
for r in [["Tiêu chí","Quá khứ đơn","Chủ điểm này"],["Số mốc","Một","Hai"]]: w4.append(r)
w5 = wb.create_sheet("Bẫy")
for r in [["Câu sai","Câu đúng","Vì sao"],["the train already left","the train had already left","Một chữ đã."]]: w5.append(r)
w6 = wb.create_sheet("Câu luyện")
for r in [["Câu","Giải thích"],
          ["When I arrived, the train {had already left}. (already leave)","Trước một mốc quá khứ."],
          ["She told me she [have finished > had finished] the report.",""],
          ["They built it in 1990. >> It was built in 1990.",""],
          ["Câu này không có dấu hiệu gì cả.",""]]: w6.append(r)
wb.save(r"${path.join(tmp, 'real.xlsx').replace(/\\/g, '/')}")
`);
    cp.execFileSync('python3', [mk], { stdio: 'pipe' });
    const rb = fs.readFileSync(path.join(tmp, 'real.xlsx'));
    const book = await X.read(rb.buffer.slice(rb.byteOffset, rb.byteOffset + rb.byteLength));

    ok(Object.keys(book).length === 6, 'đọc đúng 6 sheet từ file Excel thật', Object.keys(book).join(','));
    ok(book['Thông tin'][1][1] === 'Thì quá khứ hoàn thành', 'giải nén deflate + sharedStrings, giữ đúng tiếng Việt có dấu');
    ok(book['Công thức'].length === 3, 'sheet Công thức đọc đủ 3 dòng');

    /* --- B. Ánh xạ sổ tính → chủ điểm (chạy hàm thật của trang) --- */
    const page = await load('11-ngu-phap/them-chu-diem.html');
    const res = page.w.EMMapWorkbook(book);
    ok(res.ok === true, 'ánh xạ thành công — có tên chủ điểm');
    ok(res.data.name === 'Thì quá khứ hoàn thành', 'lấy đúng tên chủ điểm');
    ok(res.data.level === 'B1', 'chuẩn hóa cấp độ “b1” thành B1');
    ok(res.data.signals.length === 3, 'tách từ tín hiệu theo dấu phẩy → 3 từ');
    ok(res.data.tags[0] === 'Nhầm thì', 'đọc được nhóm lỗi người Việt');
    ok(res.data.cmpWith === 'Quá khứ đơn', 'đọc được chủ điểm dễ nhầm');
    ok(res.data.formulas.length === 2, 'bỏ dòng tiêu đề, còn 2 dòng công thức');
    ok(res.data.uses.length === 1 && res.data.cmpRows.length === 1 && res.data.traps.length === 1,
       'đọc được cách dùng, đối chiếu và bẫy');
    ok(res.data.items.filter(i => i.ok).length === 3, '3 câu luyện hợp lệ');
    ok(res.data.items.filter(i => !i.ok).length === 1, '1 dòng sai cú pháp được báo lỗi, không chặn nạp');
    ok(res.report.some(r => /Không nhận ra nhãn/.test(r.label)), 'nhãn lạ trong ThongTin được cảnh báo');

    /* thiếu tên chủ điểm → chặn lưu */
    const noName = JSON.parse(JSON.stringify(book));
    noName['Thông tin'] = [['Nhãn', 'Giá trị'], ['Cấp độ', 'B1']];
    ok(page.w.EMMapWorkbook(noName).ok === false, 'thiếu “Tên chủ điểm” → không cho lưu');

    /* --- C. Sinh sổ tính mẫu rồi để openpyxl mở lại --- */
    const bytes = X.build(page.w.EMSampleBook);
    const outPath = path.join(tmp, 'app-made.xlsx');
    fs.writeFileSync(outPath, Buffer.from(bytes));
    const check = cp.execFileSync('python3', ['-c', `# -*- coding: utf-8 -*-
import zipfile, json
from openpyxl import load_workbook
p = r"${outPath.replace(/\\/g, '/')}"
print(json.dumps({
  "crc": zipfile.ZipFile(p).testzip() is None,
  "sheets": load_workbook(p).sheetnames,
  "ten": load_workbook(p)["ThongTin"].cell(row=2, column=2).value,
  "cau": load_workbook(p)["CauLuyen"].max_row
}, ensure_ascii=False))`], { stdio: 'pipe' }).toString();
    const info = JSON.parse(check);
    ok(info.crc === true, 'file mẫu do app sinh: CRC32 của mọi part đều đúng');
    ok(info.sheets.length === 6, 'openpyxl mở được và thấy đủ 6 sheet', info.sheets.join(','));
    ok(info.ten === 'Thì quá khứ hoàn thành', 'openpyxl đọc đúng ô có tiếng Việt trong file app sinh');
    ok(info.cau === 9, 'sheet CauLuyen của file mẫu có 8 câu + 1 dòng tiêu đề');

    /* --- D. Nạp lại chính file mẫu vừa sinh --- */
    const round = await X.read(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const r2 = page.w.EMMapWorkbook(round);
    ok(r2.ok && r2.data.name === 'Thì quá khứ hoàn thành', 'nạp lại file mẫu → ra đúng chủ điểm');
    ok(r2.data.items.filter(i => i.ok).length === 8, 'file mẫu cho đủ 8 câu luyện hợp lệ');
    ok(new Set(r2.data.items.filter(i => i.ok).map(i => i.type)).size === 4,
       'file mẫu dùng đủ cả 4 dạng bài');
    page.w.close(); w.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* ------------------------------------------------- 9. Màn hình Nạp từ Excel */
  console.log('\n▸ them-chu-diem.html — màn hình Nạp từ Excel');
  {
    const { w, d, errs } = await load('11-ngu-phap/them-chu-diem.html');
    const clk = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));

    ok(d.querySelectorAll('#scr-start .start-card').length === 3, '3 lối vào trên màn hình đầu');
    clk(d.getElementById('goXlsx'));
    ok(d.getElementById('scr-xlsx').hidden === false, 'mở được màn hình Nạp từ Excel');
    ok(d.getElementById('xResult').hidden === true, 'chưa chọn file thì chưa hiện kết quả');
    ok(d.querySelectorAll('#scr-xlsx .syn tbody tr').length === 6, 'bảng hướng dẫn liệt kê đủ 6 sheet');

    /* nạp thẳng dữ liệu đã ánh xạ, bỏ qua bước chọn file của trình duyệt */
    const res = w.EMMapWorkbook(w.EMSampleBook);
    w.eval('window.__draw = null');
    d.getElementById('xfile').dispatchEvent(new w.Event('change'));       /* không có file → không lỗi */
    ok(errs.length === 0, 'chọn file rỗng không gây lỗi JavaScript', errs[0]);
    ok(res.ok === true && res.data.uses.length === 3, 'sổ tính mẫu ánh xạ ra 3 trường hợp dùng');
    ok(res.report.length >= 6, 'báo cáo có ít nhất 6 mục — một mục cho mỗi sheet');
    w.close();
  }

  /* ------------------------------------------------- 10. Điểm vào ở trang thư viện */
  console.log('\n▸ index.html — điểm vào “Thêm chủ điểm”');
  {
    const { w, d } = await load('11-ngu-phap/index.html');
    const links = [...d.querySelectorAll('a')].filter(a => /them-chu-diem/.test(a.getAttribute('href') || ''));
    ok(links.length === 2, 'có 2 điểm vào: nút đầu trang + thẻ cuối lưới');
    ok(!!d.querySelector('.new-deck'), 'thẻ nét đứt “Thêm chủ điểm” ở cuối lưới chủ điểm');
    ok(d.querySelectorAll('#topicGrid .deck').length === 16, 'thẻ thêm mới không bị đếm vào 16 chủ điểm');
    w.close();
  }

  /* ------------------------------------------------- 11. Trang hub gốc */
  console.log('\n▸ index.html (hub gốc)');
  {
    const { w, d, errs } = await load('index.html');
    ok(errs.length === 0, 'không có lỗi JavaScript', errs[0]);
    ok(d.querySelectorAll('[data-ico]').length === 0, 'mọi icon đã render');
    const card = [...d.querySelectorAll('.hub-card')].find(a => /11-ngu-phap/.test(a.getAttribute('href')));
    ok(!!card, 'thẻ “Ngữ pháp” có mặt trên hub');
    ok(/Ngữ pháp/.test(card.textContent), 'thẻ hiển thị đúng tên');
    ok(d.querySelectorAll('.hub-card').length === 11, '11 phân hệ trên hub');
    w.close();
  }

  console.log('\n' + (fails ? '✗ ' + fails + ' / ' + checks + ' kiểm tra THẤT BẠI'
                            : '✓ Tất cả ' + checks + ' kiểm tra đều đạt'));
  process.exit(fails ? 1 : 0);
})();
