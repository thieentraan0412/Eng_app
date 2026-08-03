// ============================================================
// Sinh src/data/grammarTopics.ts từ EngMaster_Redesign/Excel/*.xlsx
//
//   node scripts/gen-grammar-topics.mjs
//
// Mỗi chủ điểm là một sổ tính 6 sheet (ThongTin · CongThuc · CachDung ·
// DoiChieu · Bay · CauLuyen). Nội dung được đọc bằng ĐÚNG parser của app
// (readTopicWorkbook trong src/services/grammarImport.ts) — bundle tạm bằng
// esbuild để chạy được trong Node — nên dữ liệu dựng sẵn khớp tuyệt đối với
// đường nhập tay "Thêm chủ điểm → nạp sổ tính .xlsx".
//
// Sửa nội dung: sửa file .xlsx rồi chạy lại script, ĐỪNG sửa grammarTopics.ts.
// ============================================================
import { build } from 'esbuild'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const XLSX_DIR = join(root, 'EngMaster_Redesign/Excel')
const OUT = join(root, 'src/data/grammarTopics.ts')

// Thứ tự học A1 → C1, và slug của từng chủ điểm.
// `key` LÀ KHÓA của tiến độ học và sổ lỗi — đổi nó là mất lịch sử của người
// dùng, nên giữ nguyên kể cả khi đổi tên file .xlsx.
const TOPICS = [
  // A1
  ['danh-tu-so-nhieu-dem-duoc', 'plural-nouns'],
  ['mao-tu-a-an-the', 'articles'],
  ['hien-tai-don-tiep-dien', 'present-simple'],
  ['trat-tu-tu-cau-hoi', 'word-order'],
  // A2
  ['qua-khu-don-tiep-dien', 'past-simple'],
  ['hoa-hop-chu-ngu-dong-tu', 'subject-verb'],
  ['cau-hoi-duoi-gian-tiep', 'question-forms'],
  ['gioi-tu-thoi-gian-noi-chon', 'prepositions'],
  ['so-sanh-hon-nhat', 'comparison'],
  // B1
  ['thi-hien-tai-hoan-thanh', 'present-perfect'],
  ['dong-tu-khuyet-thieu', 'modals'],
  ['cau-bi-dong', 'passive'],
  ['menh-de-quan-he', 'relative-clauses'],
  ['verb-patterns-gioi-tu', 'verb-patterns'],
  ['phrasal-verbs', 'phrasal-verbs'],
  // B2
  ['cau-dieu-kien', 'conditionals'],
  ['gerund-infinitive', 'gerund-infinitive'],
  ['cau-tuong-thuat', 'reported-speech'],
  ['modal-perfect', 'modal-perfect'],
  ['cau-uoc-wish-if-only', 'wish-clauses'],
  ['menh-de-rut-gon', 'participle-clauses'],
  ['word-formation', 'word-formation'],
  // C1
  ['dao-ngu-nhan-manh', 'inversion'],
  ['cau-truc-che', 'cleft-sentences'],
]

// Chủ điểm vẽ thêm dòng thời gian trong bài học — sổ tính không có ô này.
const TIMELINE = new Set(['present-perfect'])

// Sổ tính KHÔNG phải chủ điểm: mẫu tải về của màn "Thêm chủ điểm", và mẫu của
// module Chép câu (khác cấu trúc hoàn toàn).
const NOT_A_TOPIC = new Set(['mau-chu-diem-ngu-phap', 'mau-chep-cau'])

// ---------- Nạp parser thật của app ----------
// Bundle phải nằm TRONG dự án: `xlsx` để external nên Node cần resolve được nó
// qua node_modules — đặt ở thư mục temp của hệ điều hành sẽ không tìm thấy.
const tmp = join(root, 'node_modules/.cache/engmaster-grammar-gen')
mkdirSync(tmp, { recursive: true })
const bundle = join(tmp, 'grammarImport.mjs')
await build({
  entryPoints: [join(root, 'src/services/grammarImport.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  packages: 'external',
  outfile: bundle,
  // grammarImport -> grammarCloud -> supabaseClient đọc import.meta.env; ở Node
  // không có, đưa giá trị giả để module nạp được (không hề gọi mạng).
  define: {
    'import.meta.env': JSON.stringify({
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'not-used',
      MODE: 'production',
      DEV: false,
      PROD: true,
    }),
  },
})
const { readTopicWorkbook } = await import(pathToFileURL(bundle).href)

// ---------- Đọc từng sổ tính ----------
const onDisk = new Set(
  readdirSync(XLSX_DIR)
    .filter((f) => f.endsWith('.xlsx'))
    .map((f) => f.replace(/\.xlsx$/, '')),
)

const topics = []
const problems = []
for (const [file, key] of TOPICS) {
  if (!onDisk.has(file)) {
    problems.push(`Thiếu sổ tính: ${file}.xlsx (chủ điểm "${key}")`)
    continue
  }
  onDisk.delete(file)
  const buf = readFileSync(join(XLSX_DIR, `${file}.xlsx`))
  const { draft, parsed, warnings } = readTopicWorkbook(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  )
  for (const w of warnings) problems.push(`${file}: ${w}`)
  for (const p of parsed) if (!p.ok) problems.push(`${file} dòng ${p.no}: ${p.msg} — ${p.raw}`)
  if (!draft.name) problems.push(`${file}: sheet ThongTin thiếu "Tên chủ điểm"`)
  if (!draft.items.length) problems.push(`${file}: không có câu luyện nào`)

  const t = {
    key,
    builtin: true,
    name: draft.name.trim(),
    nameEn: draft.nameEn.trim(),
    level: draft.level,
    group: draft.group.trim(),
    description: draft.description.trim(),
    icon: draft.icon,
    tags: draft.tags,
    signals: draft.signals,
    formulas: draft.formulas,
    uses: draft.uses,
    traps: draft.traps,
    compare: draft.compare,
  }
  if (TIMELINE.has(key)) t.timeline = true
  t.items = draft.items.map((it, i) => {
    const item = { id: `${key}-${i + 1}`, kind: it.kind, prompt: it.prompt, answers: it.answers }
    if (it.options) item.options = it.options
    if (it.tokens) item.tokens = it.tokens
    if (it.errIndex !== undefined) item.errIndex = it.errIndex
    if (it.cue) item.cue = it.cue
    if (it.explain) item.explain = it.explain
    if (it.errorTag) item.errorTag = it.errorTag
    return item
  })
  topics.push(t)
}

for (const left of onDisk) {
  if (!NOT_A_TOPIC.has(left)) problems.push(`Sổ tính chưa khai báo trong TOPICS: ${left}.xlsx`)
}

const items = topics.reduce((n, t) => n + t.items.length, 0)
const header = `// ============================================================
// Ngân hàng chủ điểm ngữ pháp dựng sẵn — SINH TỰ ĐỘNG, ĐỪNG SỬA TAY.
//
// Nguồn: EngMaster_Redesign/Excel/*.xlsx (mỗi chủ điểm một sổ tính gồm 6 sheet
// ThongTin · CongThuc · CachDung · DoiChieu · Bay · CauLuyen).
// Sinh lại bằng:  node scripts/gen-grammar-topics.mjs
//
// ${topics.length} chủ điểm (A1→C1) · ${items} câu luyện tập.
// Trường \`key\` là khóa của tiến độ học và sổ lỗi — giữ nguyên, đừng đổi.
// ============================================================
import type { GrammarTopic } from './grammar'

export const BUILTIN_TOPICS: GrammarTopic[] = `

writeFileSync(OUT, header + JSON.stringify(topics, null, 2) + '\n', 'utf8')
rmSync(tmp, { recursive: true, force: true })

console.log(`Đã ghi src/data/grammarTopics.ts — ${topics.length} chủ điểm · ${items} câu luyện`)
if (problems.length) {
  console.log(`\n${problems.length} vấn đề:`)
  for (const p of problems) console.log('  -', p)
  process.exitCode = 1
}
