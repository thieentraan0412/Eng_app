import {
  groupSensesByPos,
  translate,
  translateSenses,
  type PosSenses,
} from './translation'
import { shortPos } from './enrich'

export interface DictionaryUsage {
  definition: string
  definitionVi?: string
  example?: string
  exampleVi?: string
}

export interface DictionaryPosGroup {
  pos: string
  meanings: string[]
  usages: DictionaryUsage[]
  totalUsages: number
}

export interface WordDetails {
  word: string
  lemma?: string
  phonetic?: string
  groups: DictionaryPosGroup[]
}

interface DictionaryApiDefinition {
  definition?: string
  example?: string
}

interface DictionaryApiMeaning {
  partOfSpeech?: string
  definitions?: DictionaryApiDefinition[]
}

interface DictionaryApiPhonetic {
  text?: string
}

interface DictionaryApiEntry {
  phonetic?: string
  phonetics?: DictionaryApiPhonetic[]
  meanings?: DictionaryApiMeaning[]
}

interface LemmaCandidate {
  lemma: string
  expectedPos: string[]
}

interface DictionaryFetchResult {
  candidate: LemmaCandidate
  entries: DictionaryApiEntry[]
}

interface MutablePosGroup {
  pos: string
  meanings: string[]
  usages: DictionaryUsage[]
  totalUsages: number
}

interface TranslationTarget {
  usage: DictionaryUsage
  field: 'definitionVi' | 'exampleVi'
  text: string
}

const REQUEST_TIMEOUT_MS = 6500
// Keep the full set returned by the dictionary for normal words. The limits
// remain as a guard against malformed or unexpectedly huge API responses.
const MAX_USAGES_PER_POS = 12
const MAX_USAGES_TOTAL = 40
const MAX_BATCH_ITEMS = 40
const MAX_BATCH_CHARS = 3500
const BATCH_SEPARATOR = '\u241e'

const detailsCache = new Map<string, Promise<WordDetails>>()
const dictionaryCache = new Map<string, Promise<DictionaryApiEntry[]>>()

const POS_ALIASES: Record<string, string> = {
  exclamation: 'interj',
  adposition: 'prep',
  auxiliary: 'aux',
  'auxiliary verb': 'aux',
  modal: 'modal',
  'modal verb': 'modal',
}

const POS_INFO: Record<string, { label: string; description: string }> = {
  n: {
    label: 'Danh từ',
    description:
      'Chỉ người, vật, nơi chốn, sự việc hoặc khái niệm; thường làm chủ ngữ hoặc tân ngữ.',
  },
  v: {
    label: 'Động từ',
    description:
      'Diễn tả hành động, trạng thái hoặc sự thay đổi; có thể được chia theo thì và chủ ngữ.',
  },
  adj: {
    label: 'Tính từ',
    description: 'Mô tả đặc điểm hoặc tính chất của danh từ, đại từ.',
  },
  adv: {
    label: 'Trạng từ',
    description: 'Bổ nghĩa cho động từ, tính từ, trạng từ khác hoặc cho cả câu.',
  },
  pron: {
    label: 'Đại từ',
    description: 'Dùng thay cho danh từ hoặc cụm danh từ để tránh lặp lại.',
  },
  prep: {
    label: 'Giới từ',
    description:
      'Thể hiện quan hệ về thời gian, nơi chốn, phương hướng hoặc cách thức với thành phần khác.',
  },
  conj: {
    label: 'Liên từ',
    description: 'Nối từ, cụm từ hoặc các mệnh đề với nhau.',
  },
  interj: {
    label: 'Thán từ',
    description: 'Biểu lộ cảm xúc hoặc phản ứng ngắn, thường đứng độc lập.',
  },
  det: {
    label: 'Từ hạn định',
    description: 'Đứng trước danh từ để xác định số lượng, phạm vi hoặc đối tượng được nói tới.',
  },
  num: {
    label: 'Số từ',
    description: 'Biểu thị số lượng hoặc thứ tự.',
  },
  art: {
    label: 'Mạo từ',
    description: 'Đứng trước danh từ để cho biết đối tượng đã xác định hay chưa xác định.',
  },
  aux: {
    label: 'Trợ động từ',
    description: 'Đi cùng động từ chính để tạo thì, thể, câu hỏi hoặc câu phủ định.',
  },
  modal: {
    label: 'Động từ khuyết thiếu',
    description: 'Diễn tả khả năng, sự cho phép, nghĩa vụ, dự đoán hoặc mức độ chắc chắn.',
  },
}

const IRREGULAR_LEMMAS: Record<string, string> = {
  arose: 'arise',
  arisen: 'arise',
  was: 'be',
  were: 'be',
  been: 'be',
  being: 'be',
  bore: 'bear',
  borne: 'bear',
  beat: 'beat',
  beaten: 'beat',
  became: 'become',
  begun: 'begin',
  began: 'begin',
  bent: 'bend',
  bit: 'bite',
  bitten: 'bite',
  blew: 'blow',
  blown: 'blow',
  broke: 'break',
  broken: 'break',
  brought: 'bring',
  built: 'build',
  bought: 'buy',
  caught: 'catch',
  chose: 'choose',
  chosen: 'choose',
  came: 'come',
  cost: 'cost',
  cut: 'cut',
  dealt: 'deal',
  dug: 'dig',
  did: 'do',
  done: 'do',
  drew: 'draw',
  drawn: 'draw',
  drank: 'drink',
  drunk: 'drink',
  drove: 'drive',
  driven: 'drive',
  ate: 'eat',
  eaten: 'eat',
  fell: 'fall',
  fallen: 'fall',
  fed: 'feed',
  felt: 'feel',
  fought: 'fight',
  found: 'find',
  fled: 'flee',
  flew: 'fly',
  flown: 'fly',
  forgot: 'forget',
  forgotten: 'forget',
  froze: 'freeze',
  frozen: 'freeze',
  got: 'get',
  gotten: 'get',
  gave: 'give',
  given: 'give',
  went: 'go',
  gone: 'go',
  grew: 'grow',
  grown: 'grow',
  hung: 'hang',
  had: 'have',
  heard: 'hear',
  hid: 'hide',
  hidden: 'hide',
  hit: 'hit',
  held: 'hold',
  hurt: 'hurt',
  kept: 'keep',
  knew: 'know',
  known: 'know',
  laid: 'lay',
  led: 'lead',
  learnt: 'learn',
  left: 'leave',
  lent: 'lend',
  lay: 'lie',
  lain: 'lie',
  lit: 'light',
  lost: 'lose',
  made: 'make',
  meant: 'mean',
  met: 'meet',
  paid: 'pay',
  put: 'put',
  quit: 'quit',
  rode: 'ride',
  ridden: 'ride',
  rang: 'ring',
  rung: 'ring',
  rose: 'rise',
  risen: 'rise',
  ran: 'run',
  said: 'say',
  saw: 'see',
  seen: 'see',
  sold: 'sell',
  sent: 'send',
  set: 'set',
  shook: 'shake',
  shaken: 'shake',
  shone: 'shine',
  shot: 'shoot',
  showed: 'show',
  shown: 'show',
  shut: 'shut',
  sang: 'sing',
  sung: 'sing',
  sank: 'sink',
  sunk: 'sink',
  sat: 'sit',
  slept: 'sleep',
  spoke: 'speak',
  spoken: 'speak',
  spent: 'spend',
  spread: 'spread',
  stood: 'stand',
  stole: 'steal',
  stolen: 'steal',
  stuck: 'stick',
  struck: 'strike',
  swam: 'swim',
  swum: 'swim',
  swung: 'swing',
  took: 'take',
  taken: 'take',
  taught: 'teach',
  tore: 'tear',
  torn: 'tear',
  told: 'tell',
  thought: 'think',
  threw: 'throw',
  thrown: 'throw',
  understood: 'understand',
  woke: 'wake',
  woken: 'wake',
  wore: 'wear',
  worn: 'wear',
  wove: 'weave',
  woven: 'weave',
  won: 'win',
  wound: 'wind',
  wrote: 'write',
  written: 'write',
  sought: 'seek',
}

function normalizeWord(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[^a-z]+|[^a-z]+$/g, '')
}

function normalizeSinglePos(raw: string): string {
  const shortened = shortPos(raw.trim())
  return POS_ALIASES[shortened] ?? shortened
}

function normalizePosList(raw: string | undefined): string[] {
  if (!raw) return []
  const parts = raw
    .split(/\s*(?:\/|,|\band\b)\s*/i)
    .map(normalizeSinglePos)
    .filter(Boolean)
  return [...new Set(parts)]
}

export function posLabelVi(pos: string): string {
  const normalized = normalizePosList(pos)
  if (normalized.length > 1) return normalized.map((item) => posLabelVi(item)).join(' / ')
  const key = normalized[0] ?? normalizeSinglePos(pos)
  return POS_INFO[key]?.label ?? (key || 'Từ loại khác')
}

export function posDescriptionVi(pos: string): string {
  const normalized = normalizePosList(pos)
  if (normalized.length > 1)
    return normalized.map((item) => posDescriptionVi(item)).join(' ')
  const key = normalized[0] ?? normalizeSinglePos(pos)
  return (
    POS_INFO[key]?.description ??
    'Nhãn từ loại do từ điển cung cấp; xem định nghĩa và ví dụ để xác định cách dùng phù hợp.'
  )
}

function pushLemmaCandidate(
  output: LemmaCandidate[],
  source: string,
  lemma: string,
  expectedPos: string[],
): void {
  if (
    lemma.length < 2 ||
    lemma === source ||
    output.some((candidate) => candidate.lemma === lemma)
  )
    return
  output.push({ lemma, expectedPos })
}

function lemmaCandidates(word: string): LemmaCandidate[] {
  const output: LemmaCandidate[] = []
  const irregular = IRREGULAR_LEMMAS[word]
  if (irregular) {
    pushLemmaCandidate(output, word, irregular, ['v'])
    return output
  }

  if (word.endsWith('ied') && word.length > 4) {
    pushLemmaCandidate(output, word, `${word.slice(0, -3)}y`, ['v'])
    return output
  }

  if (word.endsWith('ed') && word.length > 4) {
    const stem = word.slice(0, -2)
    const doubled = /(.)\1$/.test(stem)
    if (doubled) pushLemmaCandidate(output, word, stem.slice(0, -1), ['v'])
    pushLemmaCandidate(output, word, `${stem}e`, ['v'])
    pushLemmaCandidate(output, word, stem, ['v'])
  }

  if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3)
    const doubled = /(.)\1$/.test(stem)
    if (doubled) pushLemmaCandidate(output, word, stem.slice(0, -1), ['v'])
    pushLemmaCandidate(output, word, `${stem}e`, ['v'])
    pushLemmaCandidate(output, word, stem, ['v'])
  }

  if (word.endsWith('ies') && word.length > 4) {
    pushLemmaCandidate(output, word, `${word.slice(0, -3)}y`, ['n', 'v'])
  } else if (word.endsWith('es') && word.length > 3) {
    pushLemmaCandidate(output, word, word.slice(0, -1), ['n', 'v'])
    pushLemmaCandidate(output, word, word.slice(0, -2), ['n', 'v'])
  } else if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    pushLemmaCandidate(output, word, word.slice(0, -1), ['n', 'v'])
  }

  return output.slice(0, 3)
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    globalThis.clearTimeout(timer)
  }
}

function isDictionaryEntry(value: unknown): value is DictionaryApiEntry {
  return typeof value === 'object' && value !== null
}

function fetchDictionaryEntries(word: string): Promise<DictionaryApiEntry[]> {
  const cached = dictionaryCache.get(word)
  if (cached) return cached

  const request = (async (): Promise<DictionaryApiEntry[]> => {
    try {
      const response = await fetchWithTimeout(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      )
      if (!response.ok) {
        // 404 là kết quả ổn định; lỗi máy chủ/kết nối chỉ là tạm thời và cần được thử lại.
        if (response.status !== 404) dictionaryCache.delete(word)
        return []
      }
      const data: unknown = await response.json()
      return Array.isArray(data) ? data.filter(isDictionaryEntry) : []
    } catch {
      dictionaryCache.delete(word)
      return []
    }
  })()

  dictionaryCache.set(word, request)
  return request
}

function dictionaryPhonetic(entries: DictionaryApiEntry[]): string | undefined {
  for (const entry of entries) {
    const direct = entry.phonetic?.trim()
    if (direct) return direct
    for (const phonetic of entry.phonetics ?? []) {
      const text = phonetic.text?.trim()
      if (text) return text
    }
  }
  return undefined
}

function shouldExposeLemma(
  exactEntries: DictionaryApiEntry[],
  matchedLemma: DictionaryFetchResult | undefined,
): boolean {
  // Nếu chính dạng đang tra đã có mục từ, nó có thể là một từ độc lập (spring, news,
  // wound...) chứ không chắc là dạng chia. Chỉ công bố lemma khi từ điển không có mục
  // chính xác và phải thật sự dùng mục fallback; như vậy tránh đưa thông tin sai.
  return Boolean(matchedLemma && exactEntries.length === 0)
}

function addMeanings(
  groups: Map<string, MutablePosGroup>,
  translatedGroups: PosSenses[],
): void {
  for (const translated of translatedGroups) {
    const positions = normalizePosList(translated.pos)
    for (const pos of positions.length ? positions : ['other']) {
      const group = ensureGroup(groups, pos)
      for (const meaning of translated.vis) {
        const value = meaning.trim()
        if (value && !group.meanings.some((item) => item.toLowerCase() === value.toLowerCase()))
          group.meanings.push(value)
      }
    }
  }
}

function addOfflineMeaning(
  groups: Map<string, MutablePosGroup>,
  word: string,
): { phonetic?: string } {
  const offline = translate(word)
  if (!offline.vi) return { phonetic: offline.phonetic }
  const positions = normalizePosList(offline.pos)
  // Entry phẳng kiểu noun/verb + "công việc; làm việc" không cho biết nghĩa nào
  // thuộc POS nào. Không nhân cả hai nghĩa vào cả hai nhóm vì sẽ tạo dữ liệu sai.
  if (positions.length !== 1) return { phonetic: offline.phonetic }

  const group = ensureGroup(groups, positions[0])
  const meanings = offline.vi
    .split(/[;,/]|\bhoặc\b/i)
    .map((meaning) => meaning.trim())
    .filter(Boolean)
  for (const meaning of meanings)
    if (!group.meanings.some((item) => item.toLowerCase() === meaning.toLowerCase()))
      group.meanings.push(meaning)
  return { phonetic: offline.phonetic }
}

function ensureGroup(groups: Map<string, MutablePosGroup>, pos: string): MutablePosGroup {
  const current = groups.get(pos)
  if (current) return current
  const created: MutablePosGroup = {
    pos,
    meanings: [],
    usages: [],
    totalUsages: 0,
  }
  groups.set(pos, created)
  return created
}

function addDictionaryUsages(
  groups: Map<string, MutablePosGroup>,
  entries: DictionaryApiEntry[],
  expectedPos: string[] | undefined,
): void {
  let retainedTotal = 0
  const seenDefinitions = new Map<string, Set<string>>()
  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      const positions = normalizePosList(meaning.partOfSpeech)
      const selectedPositions = (positions.length ? positions : ['other']).filter(
        (pos) => !expectedPos || expectedPos.includes(pos),
      )
      const definitions = meaning.definitions ?? []
      for (const pos of selectedPositions) {
        const group = ensureGroup(groups, pos)
        const seenForPos = seenDefinitions.get(pos) ?? new Set<string>()
        seenDefinitions.set(pos, seenForPos)
        for (const rawUsage of definitions) {
          const definition = rawUsage.definition?.trim()
          if (!definition) continue
          const definitionKey = definition.toLowerCase()
          if (seenForPos.has(definitionKey)) continue
          seenForPos.add(definitionKey)
          group.totalUsages += 1
          if (
            group.usages.length >= MAX_USAGES_PER_POS ||
            retainedTotal >= MAX_USAGES_TOTAL
          )
            continue
          const example = rawUsage.example?.trim()
          group.usages.push({
            definition,
            ...(example ? { example } : {}),
          })
          retainedTotal += 1
        }
      }
    }
  }
}

function batchTranslationTargets(groups: MutablePosGroup[]): TranslationTarget[] {
  const usages = groups.flatMap((group) => group.usages)
  const candidates: TranslationTarget[] = [
    ...usages.map((usage) => ({
      usage,
      field: 'definitionVi' as const,
      text: usage.definition,
    })),
    ...usages.flatMap((usage) =>
      usage.example
        ? [
            {
              usage,
              field: 'exampleVi' as const,
              text: usage.example,
            },
          ]
        : [],
    ),
  ]

  const selected: TranslationTarget[] = []
  let totalChars = 0
  for (const candidate of candidates) {
    const cleanText = candidate.text.split(BATCH_SEPARATOR).join(' ').trim()
    if (!cleanText) continue
    const nextChars = totalChars + cleanText.length + BATCH_SEPARATOR.length
    if (selected.length >= MAX_BATCH_ITEMS || nextChars > MAX_BATCH_CHARS) continue
    selected.push({ ...candidate, text: cleanText })
    totalChars = nextChars
  }
  return selected
}

function translatedSegments(data: unknown): string[] {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return []
  let joined = ''
  for (const segment of data[0]) {
    if (Array.isArray(segment) && typeof segment[0] === 'string') joined += segment[0]
  }
  return joined.split(BATCH_SEPARATOR).map((segment) => segment.trim())
}

async function translateUsagesInOneBatch(groups: MutablePosGroup[]): Promise<void> {
  const targets = batchTranslationTargets(groups)
  if (!targets.length) return

  try {
    const source = targets.map((target) => target.text).join(`\n${BATCH_SEPARATOR}\n`)
    const response = await fetchWithTimeout(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' +
        encodeURIComponent(source),
    )
    if (!response.ok) return
    const segments = translatedSegments(await response.json())
    if (segments.length !== targets.length) return
    targets.forEach((target, index) => {
      const translated = segments[index]
      if (translated && translated.toLowerCase() !== target.text.toLowerCase())
        target.usage[target.field] = translated
    })
  } catch {
    // Bản dịch chi tiết là dữ liệu bổ sung; vẫn trả định nghĩa tiếng Anh khi mất mạng.
  }
}

async function buildWordDetails(word: string): Promise<WordDetails> {
  const candidates = lemmaCandidates(word)
  const [senses, exactEntries] = await Promise.all([
    translateSenses(word),
    fetchDictionaryEntries(word),
  ])

  // Chỉ tốn thêm request lemma khi API thật sự không có mục cho dạng đang tra.
  // Với từ có mục chính xác, suy đoán suffix vừa thừa vừa có thể sai (news -> new).
  let matchedLemma: DictionaryFetchResult | undefined
  if (!exactEntries.length && candidates.length) {
    const candidateResults = await Promise.all(
      candidates.map(async (candidate): Promise<DictionaryFetchResult> => ({
        candidate,
        entries: await fetchDictionaryEntries(candidate.lemma),
      })),
    )
    matchedLemma = candidateResults.find((result) => result.entries.length > 0)
  }

  const selectedLemma = shouldExposeLemma(exactEntries, matchedLemma)
    ? matchedLemma?.candidate
    : undefined
  const dictionaryEntries =
    exactEntries.length > 0 ? exactEntries : (matchedLemma?.entries ?? [])
  const groups = new Map<string, MutablePosGroup>()

  addMeanings(groups, groupSensesByPos(senses))
  const offline = addOfflineMeaning(groups, word)
  addDictionaryUsages(
    groups,
    dictionaryEntries,
    exactEntries.length > 0 ? undefined : selectedLemma?.expectedPos,
  )

  const groupList = [...groups.values()]
  await translateUsagesInOneBatch(groupList)

  const lemmaEntries = matchedLemma?.entries ?? []
  const phonetic =
    dictionaryPhonetic(exactEntries) ??
    dictionaryPhonetic(lemmaEntries) ??
    offline.phonetic

  return {
    word,
    ...(selectedLemma ? { lemma: selectedLemma.lemma } : {}),
    ...(phonetic ? { phonetic } : {}),
    groups: groupList.map((group) => ({
      pos: group.pos,
      meanings: group.meanings,
      usages: group.usages,
      totalUsages: group.totalUsages,
    })),
  }
}

export function lookupWordDetails(word: string): Promise<WordDetails> {
  const normalized = normalizeWord(word)
  if (!normalized || !/^[a-z]+(?:['-][a-z]+)*$/.test(normalized))
    return Promise.resolve({ word: normalized || word.trim(), groups: [] })

  const cached = detailsCache.get(normalized)
  if (cached) return cached

  const request = buildWordDetails(normalized)
    .then((details) => {
      // Không ghim kết quả thiếu do mất mạng: lần bôi tiếp theo sẽ tự thử lại.
      const translatedDefinitionsAreReady =
        details.groups.some((group) => group.usages.length > 0) &&
        details.groups.every((group) =>
          group.usages.every((usage) => Boolean(usage.definitionVi)),
        )
      if (!translatedDefinitionsAreReady) detailsCache.delete(normalized)
      return details
    })
    .catch((): WordDetails => {
      detailsCache.delete(normalized)
      return { word: normalized, groups: [] }
    })
  detailsCache.set(normalized, request)
  return request
}
