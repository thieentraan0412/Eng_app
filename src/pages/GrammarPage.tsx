import { useEffect, useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import Icon from '../components/Icon'
import { errText } from '../services/cloud/cloudError'
import {
  deleteError,
  loadGrammar,
  recordError,
  removeTopic,
  restoreTopic,
  revertTopic,
  reviewError,
  saveTopicResult,
  setTopicLearned,
  todayStr,
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

const errMsg = errText

// Một việc nguy hiểm đang chờ xác nhận trong hộp thoại
interface Ask {
  title: string
  body: string
  items?: string[]
  confirmLabel: string
  run: () => Promise<void>
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
  // Việc đang chờ người dùng xác nhận (xóa / ẩn / bỏ bản sửa)
  const [ask, setAsk] = useState<Ask | null>(null)
  const [asking, setAsking] = useState(false)
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
  // Chủ điểm dựng sẵn nằm trong code nên chỉ ẩn được — ẩn thì hoàn tác được;
  // chủ điểm tự soạn xóa là mất hẳn cả câu luyện bên trong.
  const discardTopic = (t: GrammarTopic) =>
    setAsk({
      title: t.builtin ? `Ẩn “${t.name}”?` : `Xóa “${t.name}”?`,
      body: t.builtin
        ? 'Chủ điểm dựng sẵn không xóa khỏi app được nên sẽ được ẩn khỏi thư viện. Tiến độ và sổ lỗi giữ nguyên, bạn hiện lại được bất cứ lúc nào ở cuối trang.'
        : t.sourceKey
          ? 'Bản chỉnh sửa của bạn bị bỏ và chủ điểm gốc cũng được ẩn khỏi thư viện. Muốn giữ lại bản gốc thì chọn “Về bản gốc” trong trang bài học.'
          : `Xóa hẳn chủ điểm cùng ${t.formulas.length} quy tắc và ${t.items.length} câu luyện bên trong. Thao tác này không hoàn tác được.`,
      confirmLabel: t.builtin ? 'Ẩn chủ điểm' : 'Xóa chủ điểm',
      run: async () => {
        await removeTopic(t)
        if (openKey === t.key) {
          setOpenKey(null)
          setView('library')
        }
      },
    })

  // Xóa nhiều chủ điểm đã tick trong thư viện
  const discardTopics = (list: GrammarTopic[]) => {
    if (list.length === 0) return
    const hideCount = list.filter((t) => t.builtin).length
    const dropCount = list.length - hideCount
    const parts: string[] = []
    if (dropCount > 0) parts.push(`xóa hẳn ${dropCount} chủ điểm tự soạn (mất cả câu luyện bên trong)`)
    if (hideCount > 0) parts.push(`ẩn ${hideCount} chủ điểm dựng sẵn khỏi thư viện`)
    setAsk({
      title: `Xóa ${list.length} chủ điểm đã chọn?`,
      body: `Sẽ ${parts.join(' và ')}. Chủ điểm dựng sẵn hiện lại được, chủ điểm tự soạn thì không.`,
      items: list.map((t) => `${t.name} · ${t.level}${t.builtin ? ' · dựng sẵn' : ''}`),
      confirmLabel: `Xóa ${list.length} chủ điểm`,
      run: async () => {
        const failed: string[] = []
        for (const t of list) {
          try {
            await removeTopic(t)
          } catch (e) {
            failed.push(`${t.name}: ${errMsg(e)}`)
          }
        }
        if (openKey && list.some((t) => t.key === openKey)) {
          setOpenKey(null)
          setView('library')
        }
        // Xóa được bao nhiêu hay bấy nhiêu, chỉ báo lại phần hỏng
        if (failed.length > 0) throw new Error(`Không xóa được ${failed.length} chủ điểm — ${failed[0]}`)
      },
    })
  }

  const unhideTopic = async (key: string) => {
    try {
      await restoreTopic(key)
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  // Bật/tắt dấu "đã học". Đổi màu thẻ ngay rồi mới gọi cloud; hỏng thì trả lại
  // trạng thái cũ để giao diện không nói dối.
  const toggleLearned = async (t: GrammarTopic, learned: boolean) => {
    const before = data.progress[t.key]
    setData((d) => ({
      ...d,
      progress: {
        ...d.progress,
        [t.key]: before
          ? { ...before, learned }
          : {
              topicKey: t.key,
              attempts: 0,
              correct: 0,
              mastery: 0,
              interval: 0,
              due: todayStr(),
              lastStudied: null,
              learned,
            },
      },
    }))
    setError(null)
    try {
      await setTopicLearned(t.key, learned)
      await refresh()
    } catch (e) {
      setError(errMsg(e))
      setData((d) => {
        const next = { ...d.progress }
        if (before) next[t.key] = before
        else delete next[t.key]
        return { ...d, progress: next }
      })
    }
  }

  // Bỏ bản chỉnh sửa của một chủ điểm dựng sẵn, quay lại nội dung gốc
  const backToBuiltin = (t: GrammarTopic) =>
    setAsk({
      title: `Về bản gốc của “${t.name}”?`,
      body: 'Bản chỉnh sửa của bạn (kể cả câu luyện đã soạn) sẽ bị bỏ, thư viện dùng lại nội dung dựng sẵn. Tiến độ học vẫn giữ nguyên.',
      confirmLabel: 'Dùng lại bản gốc',
      run: () => revertTopic(t),
    })

  const removeError = (e: ErrorEntry) =>
    setAsk({
      title: 'Xóa lỗi này khỏi sổ?',
      body: `“${e.errorTag}” của chủ điểm ${e.topicName} sẽ không còn trong lịch ôn lỗi nữa.`,
      confirmLabel: 'Xóa khỏi sổ lỗi',
      run: () => deleteError(e.id),
    })

  // Chạy việc đã được xác nhận trong hộp thoại
  const runAsk = async () => {
    if (!ask) return
    setAsking(true)
    setError(null)
    try {
      await ask.run()
      setAsk(null)
      await refresh()
    } catch (e) {
      setAsk(null)
      setError(errMsg(e))
      await refresh()
    } finally {
      setAsking(false)
    }
  }

  // Lỗi của một thao tác lẻ (đánh dấu đã học, xóa, ẩn…). Nổi cố định ở góc màn
  // hình nên thấy được kể cả khi đang cuộn giữa lưới chủ điểm, và dùng chung cho
  // mọi màn của trang. Ở lại tới khi người dùng tắt hoặc làm thao tác kế tiếp.
  const errorUi = error && (
    <div className="gr-toast" role="alert">
      <Icon name="alert" />
      <span>{error}</span>
      <button className="gr-toast-x" title="Đóng" onClick={() => setError(null)}>
        <Icon name="x" />
      </button>
    </div>
  )

  const confirmUi = (
    <ConfirmDialog
      open={!!ask}
      danger
      busy={asking}
      title={ask?.title ?? ''}
      body={ask?.body}
      items={ask?.items}
      confirmLabel={ask?.confirmLabel ?? 'Xóa'}
      onConfirm={runAsk}
      onCancel={() => !asking && setAsk(null)}
    />
  )

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
      <>
        <ErrorBook
          errors={data.errors}
          onBack={() => setView('library')}
          onReview={startErrorReview}
          onDelete={removeError}
        />
        {errorUi}
        {confirmUi}
      </>
    )
  }

  if (view === 'lesson' && openTopic) {
    return (
      <>
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
          onToggleLearned={(learned) => void toggleLearned(openTopic, learned)}
        />
        {errorUi}
        {confirmUi}
      </>
    )
  }

  return (
    <>
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
        onDeleteTopics={discardTopics}
        onRestoreTopic={unhideTopic}
        onToggleLearned={toggleLearned}
      />
      {errorUi}
      {confirmUi}
    </>
  )
}
