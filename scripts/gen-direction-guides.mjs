// ============================================================
// Sinh src/data/task2DirectionGuides.ts từ DATA/huong-dan-song-ngu.html
//
//   node scripts/gen-direction-guides.mjs
//
// Lấy mục "3. 12 hướng phát triển ý": câu hỏi chính, ý triển khai, đào sâu bằng 6 câu hỏi
// (mỗi câu 3 câu ví dụ kèm pattern), collocation, chuỗi lập luận, đoạn mẫu.
//
// Sửa nội dung: sửa file HTML rồi chạy lại script, ĐỪNG sửa task2DirectionGuides.ts.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'DATA/huong-dan-song-ngu.html')
const out = resolve(root, 'src/data/task2DirectionGuides.ts')
const html = readFileSync(src, 'utf8')

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
/** <b>x</b> → **x**, bỏ mọi thẻ khác. */
const text = (s) =>
  decode(
    s
      .replace(/<b>/g, '**')
      .replace(/<\/b>/g, '**')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()

const LV = { B: 'basic', I: 'mid', A: 'adv' }
const W = ['who', 'why', 'what', 'how', 'when', 'which']

const sections = [...html.matchAll(/<section class="dir" id="huong-(\d+)-[^"]*">([\s\S]*?)<\/section>/g)]
if (sections.length !== 12) throw new Error(`Cần 12 hướng, thấy ${sections.length}`)

const pairRe = /<div class="pair ([^"]*)"[^>]*>([\s\S]*?)<\/div><\/div>(?=\s*(?:<div class="pair|<\/div>|<p|$))/g
const viOf = (body) => /<div class="vi" lang="vi">([\s\S]*?)<\/div>/.exec(body)?.[1] ?? ''
const enOf = (body) => /<div class="en" lang="en">([\s\S]*)$/.exec(body)?.[1] ?? ''

const data = sections.map(([, no, body]) => {
  const d = { no: Number(no), q: null, ideas: [], six: {}, colls: [], chain: null, sample: null }
  let cur = null
  for (const [, cls, inner] of body.matchAll(pairRe)) {
    const vi = viOf(inner)
    const enRaw = enOf(inner)
    if (cls === 'q') d.q = { vi: text(vi), en: text(enRaw) }
    else if (cls === 'li') d.ideas.push({ vi: text(vi), en: text(enRaw) })
    else if (cls === 'w q6') {
      const tag = /<span class="tag">([A-Z]+)<\/span>/.exec(inner)[1].toLowerCase()
      cur = d.six[tag] = { vi: text(vi), en: text(enRaw), ex: [] }
    } else if (cls === 'w idea li') {
      const chip = /<span class="pchip lv-([BIA])" title="([^"]*)">([\s\S]*?)<\/span>/.exec(enRaw)
      if (!chip) throw new Error(`Hướng ${no}: câu ví dụ thiếu pattern: ${text(enRaw)}`)
      const en = text(enRaw.slice(0, chip.index))
      const meaning = decode(chip[2]).split(' · ')[0].trim()
      cur.ex.push({ vi: text(vi), en, pattern: text(chip[3]), meaning, level: LV[chip[1]] })
    } else if (cls === 'pat') {
      const level = LV[/data-level="([BIA])"/.exec(inner)?.[1] ?? /lv-([BIA])/.exec(inner)[1]]
      const mean = /<span class="mean">([\s\S]*?)<\/span>/.exec(vi)?.[1] ?? ''
      const viEx = /<span class="ex">([\s\S]*?)<\/span>/.exec(vi)?.[1] ?? ''
      const pt = /<span class="pt">([\s\S]*?)<\/span>/.exec(enRaw)?.[1] ?? ''
      const enEx = /<span class="ex">([\s\S]*?)<\/span>/.exec(enRaw)?.[1] ?? ''
      d.colls.push({ level, meaning: text(mean), pattern: text(pt), en: text(enEx), vi: text(viEx) })
    } else if (cls === 'chain') d.chain = { vi: text(vi), en: text(enRaw) }
    else if (cls === 'sample') d.sample = { vi: text(vi), en: text(enRaw) }
  }
  for (const k of W) if (!d.six[k] || d.six[k].ex.length === 0) throw new Error(`Hướng ${no}: thiếu ${k}`)
  if (!d.q || !d.chain || !d.sample || !d.ideas.length || !d.colls.length) throw new Error(`Hướng ${no}: thiếu phần`)
  return d
})

const IDS = [
  'dir.government',
  'dir.individuals',
  'dir.schools',
  'dir.parents',
  'dir.business',
  'dir.health',
  'dir.economy',
  'dir.society',
  'dir.environment',
  'dir.technology',
  'dir.time',
  'dir.longterm',
]
// Chuỗi dùng nháy đơn như phần còn lại của src/, trừ khi bên trong có nháy đơn hoặc ký tự cần thoát
const lit = (v) => (typeof v === 'string' && !/['\\\n]/.test(v) ? `'${v}'` : JSON.stringify(v))
const fmt = (o, ind = '  ') => {
  if (Array.isArray(o)) return `[\n${o.map((x) => `${ind}  ${fmt(x, ind + '  ')},`).join('\n')}\n${ind}]`
  if (o && typeof o === 'object')
    return `{ ${Object.entries(o)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? fmt(v, ind + '  ') : lit(v)}`)
      .join(', ')} }`
  return lit(o)
}

let ts = `// Ví dụ song ngữ cho 12 hướng phát triển ý — sinh bằng scripts/gen-direction-guides.mjs, đừng sửa tay.
// Nguồn: DATA/huong-dan-song-ngu.html, mục "3. 12 hướng phát triển ý": câu hỏi chính, ý triển khai,
// đào sâu bằng 6 câu hỏi (mỗi câu 3 câu ví dụ có pattern), collocation, chuỗi lập luận, đoạn mẫu.
// Chữ trong **…** là phần in đậm trong tài liệu (collocation / pattern được áp dụng).
import type { PatternLevel } from './task2Patterns'
import type { SixWKey } from './task2MindMap'

export interface BiText {
  vi: string
  en: string
}

/** Một câu ví dụ: áp dụng một pattern ở mục 2 của tài liệu. */
export interface DirExample extends BiText {
  pattern: string
  /** Nghĩa tiếng Việt của pattern. */
  meaning: string
  level: PatternLevel
}

export interface DirCollocation extends BiText {
  level: PatternLevel
  pattern: string
  meaning: string
}

export interface DirectionGuide {
  /** Câu hỏi chính của hướng. */
  question: BiText
  ideas: BiText[]
  /** Đào sâu bằng 6 câu hỏi: ý tóm tắt + câu ví dụ. */
  six: Record<SixWKey, BiText & { ex: DirExample[] }>
  colls: DirCollocation[]
  chain: BiText
  sample: BiText
}

export const DIRECTION_GUIDES: Record<string, DirectionGuide> = {\n`
data.forEach((d, i) => {
  const six = W.map((k) => `      ${k}: ${fmt({ vi: d.six[k].vi, en: d.six[k].en, ex: d.six[k].ex }, '      ')},`).join('\n')
  ts += `  ${lit(IDS[i])}: {
    question: ${fmt(d.q)},
    ideas: ${fmt(d.ideas, '    ')},
    six: {
${six}
    },
    colls: ${fmt(d.colls, '    ')},
    chain: ${fmt(d.chain)},
    sample: ${fmt(d.sample)},
  },\n`
})
ts += '}\n'
writeFileSync(out, ts)
console.log(
  data
    .map((d) => `${d.no}: ideas ${d.ideas.length}, ex ${W.map((k) => d.six[k].ex.length).join('/')}, colls ${d.colls.length}`)
    .join('\n'),
)
