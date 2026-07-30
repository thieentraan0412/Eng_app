// ============================================================
// grammarCloud — kho dữ liệu module Ngữ pháp.
// Chủ điểm gồm 2 nguồn, dùng chung một kiểu dữ liệu:
//   - 16 chủ điểm dựng sẵn trong src/data/grammar.ts (key = slug, builtin)
//   - chủ điểm người dùng tự soạn / nạp Excel, lưu Supabase (key = uuid)
// Tiến độ từng chủ điểm và sổ lỗi cá nhân đều lưu Supabase để đồng bộ đa máy.
// ============================================================
import {
  CloudApi,
  type CloudGrammarError,
  type CloudGrammarItem,
  type CloudGrammarTopic,
  type GrammarItemKind,
  type NewCloudGrammarItem,
  type NewCloudGrammarTopic,
} from './CloudApiClient'
import { isMissingSchema } from './cloudError'
import {
  BUILTIN_TOPICS,
  type GrammarCompare,
  type GrammarFormula,
  type GrammarItem,
  type GrammarTopic,
  type GrammarTrap,
  type GrammarUse,
  type CefrLevel,
} from '../../data/grammar'

export type {
  CefrLevel,
  GrammarCompare,
  GrammarFormula,
  GrammarItem,
  GrammarItemKind,
  GrammarTopic,
  GrammarTrap,
  GrammarUse,
}

// ---------- Tiến độ 1 chủ điểm ----------
export interface TopicProgress {
  topicKey: string
  attempts: number
  correct: number
  mastery: number // 0..100
  interval: number // số ngày tới lần ôn kế
  due: string // yyyy-mm-dd
  lastStudied: string | null
}

// ---------- Một lỗi trong sổ lỗi ----------
export interface ErrorEntry {
  id: string
  topicKey: string
  topicName: string
  level: string | null
  errorTag: string
  itemRef: string | null
  wrong: string
  right: string
  hitCount: number
  stage: number // 0..3
  status: 'active' | 'resolved'
  due: string
  firstSeen: string
  lastSeen: string
}

// ---------- Bản nháp chủ điểm (wizard / nạp Excel) ----------
export interface TopicDraft {
  /** slug chủ điểm dựng sẵn mà bản nháp này thay thế (chỉ khi sửa chủ điểm dựng sẵn) */
  sourceKey?: string | null
  name: string
  nameEn: string
  level: CefrLevel
  group: string
  description: string
  icon: string
  tags: string[]
  signals: string[]
  formulas: GrammarFormula[]
  uses: GrammarUse[]
  traps: GrammarTrap[]
  compare: GrammarCompare | null
  items: GrammarItem[]
}

export const ERROR_TAGS = [
  'Thiếu -s số nhiều',
  'Thiếu mạo từ',
  'Thiếu -s ngôi 3',
  'Nhầm thì',
  'Thiếu to be',
  'Trật tự từ',
  'Giới từ',
] as const

export const TOPIC_GROUPS = [
  'Thì động từ',
  'Danh từ & mạo từ',
  'Động từ & cấu trúc',
  'Câu phức',
  'Trật tự từ & nhấn mạnh',
] as const

export const TOPIC_ICONS = [
  'clock',
  'layers',
  'type',
  'shuffle',
  'stack',
  'repeat',
  'trend',
  'speak',
  'pen',
  'bulb',
  'target',
  'sparkle',
] as const

// Chặng ôn của một lỗi: mắc lỗi → 1 ngày → 3 → 7 → 21 rồi "đã khắc phục"
export const ERROR_STEPS = [1, 3, 7, 21]
// Lịch ôn của một chủ điểm khi làm tốt
const TOPIC_STEPS = [1, 3, 7, 14, 30]

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}
export function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
export function daysUntil(date: string): number {
  const ms = new Date(date + 'T00:00:00').getTime() - new Date(todayStr() + 'T00:00:00').getTime()
  return Math.round(ms / 86400000)
}

// ---------- Ánh xạ DB -> app ----------
function itemFromCloud(r: CloudGrammarItem): GrammarItem {
  return {
    id: r.id,
    kind: r.kind,
    prompt: r.prompt,
    answers: r.answers ?? [],
    options: r.options ?? undefined,
    tokens: r.tokens ?? undefined,
    errIndex: r.err_index ?? undefined,
    cue: r.cue ?? undefined,
    explain: r.explain ?? undefined,
    errorTag: r.error_tag ?? undefined,
  }
}

function topicFromCloud(t: CloudGrammarTopic, items: GrammarItem[]): GrammarTopic {
  return {
    // Bản sửa của chủ điểm dựng sẵn giữ nguyên khóa gốc để tiến độ và sổ lỗi
    // đã tích lũy vẫn thuộc về nó sau khi sửa.
    key: t.source_key ?? t.id,
    builtin: false,
    cloudId: t.id,
    sourceKey: t.source_key ?? undefined,
    name: t.name,
    nameEn: t.name_en ?? '',
    level: (t.level as CefrLevel) ?? 'B1',
    group: t.topic_group ?? '',
    description: t.description ?? '',
    icon: t.icon ?? 'clock',
    tags: t.tags ?? [],
    signals: t.signals ?? [],
    formulas: t.formulas ?? [],
    uses: t.uses ?? [],
    traps: t.traps ?? [],
    compare: t.compare ?? null,
    items,
  }
}

function draftToRow(d: TopicDraft): NewCloudGrammarTopic {
  return {
    source_key: d.sourceKey ?? null,
    name: d.name.trim() || 'Chủ điểm mới',
    name_en: d.nameEn.trim() || null,
    level: d.level,
    topic_group: d.group || null,
    description: d.description.trim() || null,
    icon: d.icon,
    tags: d.tags,
    signals: d.signals,
    formulas: d.formulas.filter((f) => f.form || f.structure || f.example),
    uses: d.uses.filter((u) => u.name || u.sample),
    traps: d.traps.filter((t) => t.wrong || t.right),
    compare: d.compare && d.compare.rows.length > 0 ? d.compare : null,
  }
}

function itemToRow(i: GrammarItem): NewCloudGrammarItem {
  return {
    kind: i.kind,
    prompt: i.prompt,
    answers: i.answers,
    options: i.options ?? null,
    tokens: i.tokens ?? null,
    err_index: i.errIndex ?? null,
    cue: i.cue ?? null,
    explain: i.explain ?? null,
    error_tag: i.errorTag ?? null,
  }
}

function errorFromCloud(e: CloudGrammarError): ErrorEntry {
  return {
    id: e.id,
    topicKey: e.topic_key,
    topicName: e.topic_name,
    level: e.level,
    errorTag: e.error_tag,
    itemRef: e.item_ref,
    wrong: e.wrong_text,
    right: e.right_text,
    hitCount: e.hit_count,
    stage: e.stage,
    status: e.status,
    due: e.due_date,
    firstSeen: e.first_seen,
    lastSeen: e.last_seen,
  }
}

// ============================================================
// ĐỌC
// ============================================================
export interface GrammarData {
  topics: GrammarTopic[]
  progress: Record<string, TopicProgress>
  errors: ErrorEntry[]
  /** chủ điểm dựng sẵn đang bị ẩn — hiện ở cuối thư viện để khôi phục */
  hidden: { key: string; name: string; level: string }[]
}

export async function loadGrammar(): Promise<GrammarData> {
  const [cloudTopics, cloudItems, progressRows, errorRows, hiddenKeys] = await Promise.all([
    CloudApi.listGrammarTopics(),
    CloudApi.listGrammarItems(),
    CloudApi.listGrammarProgress(),
    CloudApi.listGrammarErrors(),
    // Bảng ẩn chủ điểm được thêm sau (supabase/grammar.sql) — thiếu bảng thì coi
    // như chưa ẩn chủ điểm nào, phần còn lại của trang vẫn chạy bình thường.
    CloudApi.listHiddenGrammarTopics().catch(() => [] as string[]),
  ])

  const byTopic = new Map<string, GrammarItem[]>()
  for (const row of cloudItems) {
    const list = byTopic.get(row.topic_id) ?? []
    list.push(itemFromCloud(row))
    byTopic.set(row.topic_id, list)
  }

  const hiddenSet = new Set(hiddenKeys)
  const userTopics = cloudTopics.map((t) => topicFromCloud(t, byTopic.get(t.id) ?? []))
  // Bản sửa của chủ điểm dựng sẵn đứng đúng chỗ bản gốc trong thư viện
  const overrides = new Map<string, GrammarTopic>()
  for (const t of userTopics) if (t.sourceKey) overrides.set(t.sourceKey, t)

  const topics: GrammarTopic[] = [
    ...BUILTIN_TOPICS.map((t) => overrides.get(t.key) ?? t),
    ...userTopics.filter((t) => !t.sourceKey),
  ].filter((t) => !hiddenSet.has(t.key))

  const builtinName = new Map(BUILTIN_TOPICS.map((t) => [t.key, t]))
  const hidden = hiddenKeys.map((key) => {
    const t = builtinName.get(key)
    return { key, name: t?.name ?? key, level: t?.level ?? '' }
  })

  const progress: Record<string, TopicProgress> = {}
  for (const p of progressRows) {
    progress[p.topic_key] = {
      topicKey: p.topic_key,
      attempts: p.attempts,
      correct: p.correct,
      mastery: p.mastery,
      interval: p.srs_interval,
      due: p.srs_due_date,
      lastStudied: p.last_studied,
    }
  }

  return { topics, progress, errors: errorRows.map(errorFromCloud), hidden }
}

// ============================================================
// GHI — tiến độ chủ điểm
// ============================================================
// Sau mỗi phiên: cộng dồn số câu, tính lại mức nắm vững, đặt lịch ôn kế tiếp.
// Làm tốt (≥80% trong phiên) thì giãn cách lên chặng sau, ngược lại về 1 ngày.
export async function saveTopicResult(
  topicKey: string,
  prev: TopicProgress | undefined,
  sessionCorrect: number,
  sessionTotal: number,
): Promise<TopicProgress> {
  const attempts = (prev?.attempts ?? 0) + sessionTotal
  const correct = (prev?.correct ?? 0) + sessionCorrect
  // Mức nắm vững nghiêng về kết quả gần đây: 60% phiên vừa rồi + 40% lịch sử cũ
  const sessionPct = sessionTotal > 0 ? (sessionCorrect / sessionTotal) * 100 : 0
  const mastery =
    prev && prev.attempts > 0
      ? Math.round(sessionPct * 0.6 + prev.mastery * 0.4)
      : Math.round(sessionPct)

  const good = sessionTotal > 0 && sessionCorrect / sessionTotal >= 0.8
  const idx = TOPIC_STEPS.indexOf(prev?.interval ?? 0)
  const interval = good ? TOPIC_STEPS[Math.min(idx + 1, TOPIC_STEPS.length - 1)] : TOPIC_STEPS[0]

  const next: TopicProgress = {
    topicKey,
    attempts,
    correct,
    mastery: Math.max(0, Math.min(100, mastery)),
    interval,
    due: addDays(interval),
    lastStudied: new Date().toISOString(),
  }

  await CloudApi.saveGrammarProgress({
    topic_key: next.topicKey,
    attempts: next.attempts,
    correct: next.correct,
    mastery: next.mastery,
    srs_interval: next.interval,
    srs_due_date: next.due,
    last_studied: next.lastStudied,
  })
  return next
}

// ============================================================
// GHI — sổ lỗi
// ============================================================
export async function recordError(e: {
  topicKey: string
  topicName: string
  level: string | null
  errorTag: string
  itemRef: string | null
  wrong: string
  right: string
}): Promise<void> {
  await CloudApi.recordGrammarError({
    topic_key: e.topicKey,
    topic_name: e.topicName,
    level: e.level,
    error_tag: e.errorTag || 'Khác',
    item_ref: e.itemRef,
    wrong_text: e.wrong,
    right_text: e.right,
    hit_count: 1,
    stage: 0,
    status: 'active',
    due_date: addDays(ERROR_STEPS[0]),
  })
}

// Ôn 1 lỗi: đúng thì lên chặng (hết chặng → đã khắc phục), sai thì về chặng đầu.
export async function reviewError(entry: ErrorEntry, ok: boolean): Promise<ErrorEntry> {
  if (!ok) {
    await CloudApi.recordGrammarError({
      topic_key: entry.topicKey,
      topic_name: entry.topicName,
      level: entry.level,
      error_tag: entry.errorTag,
      item_ref: entry.itemRef,
      wrong_text: entry.wrong,
      right_text: entry.right,
      hit_count: entry.hitCount + 1,
      stage: 0,
      status: 'active',
      due_date: addDays(ERROR_STEPS[0]),
    })
    return { ...entry, hitCount: entry.hitCount + 1, stage: 0, status: 'active', due: addDays(ERROR_STEPS[0]) }
  }

  const stage = Math.min(entry.stage + 1, ERROR_STEPS.length - 1)
  const resolved = entry.stage + 1 >= ERROR_STEPS.length - 1
  const due = addDays(ERROR_STEPS[stage])
  await CloudApi.advanceGrammarError(entry.id, {
    stage,
    status: resolved ? 'resolved' : 'active',
    due_date: due,
  })
  return { ...entry, stage, status: resolved ? 'resolved' : 'active', due }
}

export async function deleteError(id: string): Promise<void> {
  await CloudApi.deleteGrammarError(id)
}

// ============================================================
// GHI — chủ điểm tự soạn
// ============================================================
// Cột source_key / bảng grammar_hidden_topics được thêm sau (supabase/grammar.sql).
// Tài khoản chưa chạy file đó vẫn phải soạn và lưu được chủ điểm của mình —
// chỉ riêng phần sửa/ẩn CHỦ ĐIỂM DỰNG SẴN mới bắt buộc có chúng.
const NEED_SQL =
  'Kho dữ liệu chưa có phần “sửa/ẩn chủ điểm dựng sẵn”. Mở Supabase → SQL Editor, chạy lại file supabase/grammar.sql rồi thử lại.'

function withoutSourceKey(row: NewCloudGrammarTopic): NewCloudGrammarTopic {
  const { source_key: _drop, ...rest } = row
  return rest as NewCloudGrammarTopic
}

export async function createTopic(draft: TopicDraft): Promise<string> {
  const row = draftToRow(draft)
  let id: string
  try {
    id = (await CloudApi.createGrammarTopic(row)).id
  } catch (e) {
    if (!isMissingSchema(e, 'source_key')) throw e
    if (row.source_key != null) throw new Error(NEED_SQL)
    id = (await CloudApi.createGrammarTopic(withoutSourceKey(row))).id
  }
  await CloudApi.createGrammarItems(id, draft.items.map(itemToRow))
  return id
}

export async function updateTopic(id: string, draft: TopicDraft): Promise<void> {
  const row = draftToRow(draft)
  try {
    await CloudApi.updateGrammarTopic(id, row)
  } catch (e) {
    if (!isMissingSchema(e, 'source_key')) throw e
    if (row.source_key != null) throw new Error(NEED_SQL)
    await CloudApi.updateGrammarTopic(id, withoutSourceKey(row))
  }
  await CloudApi.replaceGrammarItems(id, draft.items.map(itemToRow))
}

// Lưu bản sửa của một chủ điểm bất kỳ.
//  - chủ điểm đã nằm trong DB  -> ghi đè bản ghi đó
//  - chủ điểm dựng sẵn         -> tạo bản riêng mang source_key, thay chỗ bản gốc
//                                 trong thư viện và dùng tiếp tiến độ cũ
export async function saveTopicEdit(topic: GrammarTopic, draft: TopicDraft): Promise<void> {
  if (topic.cloudId) {
    await updateTopic(topic.cloudId, { ...draft, sourceKey: topic.sourceKey ?? null })
    return
  }
  await createTopic({ ...draft, sourceKey: topic.key })
}

// Xóa khỏi thư viện: bản ghi DB thì xóa hẳn, chủ điểm dựng sẵn thì ẩn đi.
// Sửa một chủ điểm dựng sẵn rồi xóa thì bỏ cả bản sửa lẫn bản gốc.
export async function removeTopic(topic: GrammarTopic): Promise<void> {
  if (topic.cloudId) await CloudApi.deleteGrammarTopic(topic.cloudId)
  if (!topic.builtin && !topic.sourceKey) return
  try {
    await CloudApi.hideGrammarTopic(topic.sourceKey ?? topic.key)
  } catch (e) {
    throw isMissingSchema(e, 'grammar_hidden_topics') ? new Error(NEED_SQL) : e
  }
}

// Hiện lại một chủ điểm dựng sẵn đã ẩn (tiến độ cũ còn nguyên)
export async function restoreTopic(key: string): Promise<void> {
  try {
    await CloudApi.unhideGrammarTopic(key)
  } catch (e) {
    throw isMissingSchema(e, 'grammar_hidden_topics') ? new Error(NEED_SQL) : e
  }
}

// Bỏ bản sửa, quay về nội dung dựng sẵn ban đầu
export async function revertTopic(topic: GrammarTopic): Promise<void> {
  if (!topic.sourceKey || !topic.cloudId) return
  await CloudApi.deleteGrammarTopic(topic.cloudId)
}

// ---------- Chủ điểm -> bản nháp (mở lại trong màn soạn) ----------
export function topicToDraft(t: GrammarTopic): TopicDraft {
  return {
    sourceKey: t.sourceKey ?? null,
    name: t.name,
    nameEn: t.nameEn,
    level: t.level,
    group: t.group,
    description: t.description,
    icon: t.icon,
    tags: t.tags,
    signals: t.signals,
    formulas: t.formulas,
    uses: t.uses,
    traps: t.traps,
    compare: t.compare,
    items: t.items,
  }
}

// ---------- Tiện ích dùng chung cho các màn ----------
export function isDue(p: TopicProgress | undefined): boolean {
  return !!p && p.due <= todayStr()
}

export function masteryOf(p: TopicProgress | undefined): number {
  return p?.mastery ?? 0
}

// Đếm số câu luyện của 1 chủ điểm (dựng sẵn đã kèm items; tự soạn lấy từ cloud)
export function itemCount(t: GrammarTopic): number {
  return t.items.length
}
