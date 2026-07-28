import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import {
  deleteError,
  loadGrammar,
  recordError,
  removeTopic,
  restoreTopic,
  revertTopic,
  reviewError,
  saveTopicResult,
  type ErrorEntry,
  type GrammarData,
  type GrammarTopic,
} from '../services/cloud/grammarCloud'
import ErrorBook from './grammar/ErrorBook'
import NewTopic from './grammar/NewTopic'
import PracticeSession, { type SessionCard, type SessionResult } from './grammar/PracticeSession'
import TopicLesson from './grammar/TopicLesson'
import TopicLibrary from './grammar/TopicLibrary'
import '../styles/grammar.css'

type View = 'library' | 'lesson' | 'errors' | 'new' | 'edit'

// Số câu tối đa lấy từ mỗi chủ điểm khi luyện nhiều chủ điểm cùng lúc
const PER_TOPIC = 6
// Số câu tối đa của một phiên luyện một chủ điểm
const PER_SESSION = 18

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// Trộn xen kẽ các chủ điểm để một phiên không dồn cục theo chủ điểm
function interleave(groups: SessionCard[][]): SessionCard[] {
  const out: SessionCard[] = []
  const max = Math.max(0, ...groups.map((g) => g.length))
  for (let i = 0; i < max; i++) {
    for (const g of groups) if (g[i]) out.push(g[i])
  }
  return out
}

export default function GrammarPage() {
  const [data, setData] = useState<GrammarData>({
    topics: [],
    progress: {},
    errors: [],
    hidden: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('library')
  const [openKey, setOpenKey] = useState<string | null>(null)
  // Chủ điểm đang mở trong màn sửa (null = đang thêm mới)
  const [editing, setEditing] = useState<GrammarTopic | null>(null)
  // Phiên luyện đang chạy (null = không có)
  const [session, setSession] = useState<{
    cards: SessionCard[]
    title: string
    reviewing?: ErrorEntry
  } | null>(null)

  const refresh = async () => {
    setData(await loadGrammar())
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await loadGrammar()
        if (alive) setData(d)
      } catch (e) {
        if (alive) setError(errMsg(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const byKey = useMemo(() => new Map(data.topics.map((t) => [t.key, t])), [data.topics])
  const openTopic = openKey ? byKey.get(openKey) : undefined

  // ---------- Bắt đầu phiên luyện ----------
  const startPractice = (keys: string[]) => {
    const topics = keys.map((k) => byKey.get(k)).filter((t): t is GrammarTopic => !!t)
    const withItems = topics.filter((t) => t.items.length > 0)
    if (withItems.length === 0) return

    const cards =
      withItems.length === 1
        ? withItems[0].items.slice(0, PER_SESSION).map((item) => ({ item, topic: withItems[0] }))
        : interleave(
            withItems.map((t) => t.items.slice(0, PER_TOPIC).map((item) => ({ item, topic: t }))),
          )

    setSession({
      cards,
      title: withItems.length === 1 ? withItems[0].name : `${withItems.length} chủ điểm`,
    })
  }

  // ---------- Ôn một lỗi trong sổ ----------
  const startErrorReview = (entry: ErrorEntry) => {
    const topic = byKey.get(entry.topicKey)
    const item = topic?.items.find((i) => i.id === entry.itemRef)
    if (!topic || !item) {
      // Câu gốc không còn (chủ điểm đã sửa/xóa) — đánh dấu ôn thủ công
      reviewError(entry, true)
        .then(refresh)
        .catch((e) => setError(errMsg(e)))
      return
    }
    // Đổi dạng bài khi tái phạm: ưu tiên câu khác cùng chủ điểm nếu có
    const alt = topic.items.find((i) => i.id !== item.id && i.errorTag === item.errorTag)
    const chosen = entry.hitCount > 1 && alt ? alt : item
    setSession({
      cards: [{ item: chosen, topic }],
      title: `Ôn lỗi · ${entry.errorTag}`,
      reviewing: entry,
    })
  }

  // ---------- Kết thúc phiên ----------
  const finishSession = async (result: SessionResult) => {
    const reviewing = session?.reviewing
    setSession(null)
    try {
      for (const [key, r] of Object.entries(result.perTopic)) {
        await saveTopicResult(key, data.progress[key], r.correct, r.total)
      }
      // Phiên "Ôn lỗi" không ghi lỗi mới: lỗi đó đã có trong sổ, chỉ cập nhật
      // chặng ôn bên dưới — nếu ghi thêm sẽ thành hai dòng cho cùng một lỗi.
      for (const e of reviewing ? [] : result.errors) {
        await recordError({
          topicKey: e.topicKey,
          topicName: e.topicName,
          level: e.level,
          errorTag: e.errorTag,
          itemRef: e.itemRef,
          wrong: e.wrong,
          right: e.right,
        })
      }
      if (reviewing) {
        const totals = Object.values(result.perTopic).reduce(
          (s, r) => ({ correct: s.correct + r.correct, total: s.total + r.total }),
          { correct: 0, total: 0 },
        )
        if (totals.total > 0) await reviewError(reviewing, totals.correct === totals.total)
      }
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  // ---------- Sửa ----------
  const editTopic = (t: GrammarTopic) => {
    setEditing(t)
    setView('edit')
  }

  // ---------- Xóa / ẩn ----------
  const discardTopic = async (t: GrammarTopic) => {
    // Chủ điểm dựng sẵn nằm trong code nên chỉ ẩn được — và ẩn thì hoàn tác được
    const msg = t.builtin
      ? `Ẩn chủ điểm “${t.name}” khỏi thư viện? Tiến độ được giữ lại, bạn có thể hiện lại bất cứ lúc nào.`
      : t.sourceKey
        ? `Xóa chủ điểm “${t.name}”? Bản chỉnh sửa của bạn bị bỏ và chủ điểm gốc cũng được ẩn khỏi thư viện.`
        : `Xóa chủ điểm “${t.name}” và toàn bộ câu luyện bên trong?`
    if (!confirm(msg)) return
    try {
      await removeTopic(t)
      if (openKey === t.key) {
        setOpenKey(null)
        setView('library')
      }
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  const unhideTopic = async (key: string) => {
    try {
      await restoreTopic(key)
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  // Bỏ bản chỉnh sửa của một chủ điểm dựng sẵn, quay lại nội dung gốc
  const backToBuiltin = async (t: GrammarTopic) => {
    if (!confirm(`Bỏ bản chỉnh sửa của “${t.name}” và dùng lại nội dung dựng sẵn?`)) return
    try {
      await revertTopic(t)
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  const removeError = async (e: ErrorEntry) => {
    if (!confirm('Xóa lỗi này khỏi sổ?')) return
    try {
      await deleteError(e.id)
      await refresh()
    } catch (err) {
      setError(errMsg(err))
    }
  }

  // ============================================================
  if (session) {
    return (
      <PracticeSession
        cards={session.cards}
        title={session.title}
        onExit={finishSession}
        onOpenLesson={(key) => {
          setSession(null)
          setOpenKey(key)
          setView('lesson')
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="page gr-page">
        <p className="gr-loading">Đang tải chủ điểm ngữ pháp…</p>
      </div>
    )
  }

  if (error && data.topics.length === 0) {
    return (
      <div className="page gr-page">
        <div className="gr-empty">
          <Icon name="alert" />
          <b>Không tải được dữ liệu ngữ pháp</b>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (view === 'new' || view === 'edit') {
    const target = view === 'edit' ? editing : null
    return (
      <NewTopic
        key={target ? `edit:${target.key}` : 'new'}
        existingNames={data.topics.map((t) => t.name)}
        edit={target}
        onCancel={() => {
          setEditing(null)
          setView(target && openKey === target.key ? 'lesson' : 'library')
          refresh()
        }}
        onSaved={() => {
          refresh()
        }}
      />
    )
  }

  if (view === 'errors') {
    return (
      <ErrorBook
        errors={data.errors}
        onBack={() => setView('library')}
        onReview={startErrorReview}
        onDelete={removeError}
      />
    )
  }

  if (view === 'lesson' && openTopic) {
    return (
      <TopicLesson
        topic={openTopic}
        progress={data.progress[openTopic.key]}
        errors={data.errors}
        onBack={() => setView('library')}
        onPractice={() => startPractice([openTopic.key])}
        onOpenErrors={() => setView('errors')}
        onEdit={() => editTopic(openTopic)}
        onDelete={() => discardTopic(openTopic)}
        onRevert={() => backToBuiltin(openTopic)}
      />
    )
  }

  return (
    <>
      {error && (
        <div className="page gr-page" style={{ paddingBottom: 0 }}>
          <div className="gr-panel" style={{ marginBottom: 12, color: 'var(--danger)' }}>
            {error}
          </div>
        </div>
      )}
      <TopicLibrary
        topics={data.topics}
        progress={data.progress}
        errors={data.errors}
        hidden={data.hidden}
        onOpenTopic={(t) => {
          setOpenKey(t.key)
          setView('lesson')
        }}
        onPractice={startPractice}
        onOpenErrors={() => setView('errors')}
        onNewTopic={() => setView('new')}
        onEditTopic={editTopic}
        onDeleteTopic={discardTopic}
        onRestoreTopic={unhideTopic}
      />
    </>
  )
}
