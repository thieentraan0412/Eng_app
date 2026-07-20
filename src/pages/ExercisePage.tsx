import { useEffect, useMemo, useRef, useState } from 'react'
import { CloudApi, type Card, type Deck } from '../services/cloud/CloudApiClient'
import { speak, ttsSupported } from '../services/tts'
import { track } from '../services/studyTracker'
import '../styles/exercise.css'

// Trang Bài tập — trắc nghiệm sinh TỰ ĐỘNG từ các bộ từ vựng:
//  · Anh→Việt: hiện từ tiếng Anh, chọn 1 trong 4 nghĩa tiếng Việt
//  · Việt→Anh: hiện nghĩa tiếng Việt, chọn 1 trong 4 từ tiếng Anh
// Mỗi đáp án kèm câu ví dụ của thẻ đó (chiều Anh→Việt che từ bằng ___ để không lộ).
// Số bài tập = số bộ từ đang có từ vựng.

type Direction = 'en2vi' | 'vi2en'

interface DeckWithCards {
  deck: Deck
  cards: Card[]
}

interface ExQuestion {
  card: Card // thẻ đúng
  options: Card[] // 1 đúng + tối đa 3 nhiễu, đã trộn
}

// Thẻ dùng được cho trắc nghiệm: phải có cả từ lẫn nghĩa
const usable = (c: Card) => Boolean(c.word.trim() && (c.meaning ?? '').trim())

// Trộn ngẫu nhiên (Fisher–Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Câu ví dụ đầu tiên của thẻ (chỉ hiện sau khi đã chọn đáp án nên không cần che từ)
function exampleOf(card: Card): string | null {
  return (card.example ?? '').split('\n').filter(Boolean)[0] ?? null
}

// Câu ví dụ dùng được cho bài "sắp xếp từ": chọn câu 3–12 từ (đủ khó mà không rối).
function reorderSentence(card: Card): string | null {
  for (const line of (card.example ?? '').split('\n').map((s) => s.trim()).filter(Boolean)) {
    const n = line.split(/\s+/).filter(Boolean).length
    if (n >= 3 && n <= 12) return line
  }
  return null
}

const hasReorder = (c: Card) => reorderSentence(c) !== null

// Sinh đề: mỗi thẻ trong bộ thành 1 câu hỏi; nhiễu ưu tiên lấy CÙNG BỘ,
// thiếu mới mượn từ các bộ khác. Không trùng từ / trùng nghĩa giữa các đáp án.
function buildQuiz(deckCards: Card[], pool: Card[]): ExQuestion[] {
  return shuffle(deckCards)
    .map((card) => {
      const words = new Set([card.word.trim().toLowerCase()])
      const meanings = new Set([(card.meaning ?? '').trim().toLowerCase()])
      const distractors: Card[] = []
      for (const c of [...shuffle(deckCards), ...shuffle(pool)]) {
        if (distractors.length >= 3) break
        const w = c.word.trim().toLowerCase()
        const m = (c.meaning ?? '').trim().toLowerCase()
        if (c.id === card.id || words.has(w) || meanings.has(m)) continue
        words.add(w)
        meanings.add(m)
        distractors.push(c)
      }
      return { card, options: shuffle([card, ...distractors]) }
    })
    .filter((q) => q.options.length >= 2) // quá ít đáp án -> bỏ câu đó
}

// ---------- Lưu / khôi phục tiến độ làm bài (localStorage + Supabase) ----------
// Lưu cả THỨ TỰ câu + các đáp án của từng câu + lựa chọn đã chọn,
// để lần sau vào lại: đề y nguyên, nhảy thẳng tới câu CHƯA làm đầu tiên.
// Ghi song song localStorage (nhanh, offline) + Supabase (đồng bộ app ↔ web ↔ mobile);
// khi đọc chọn bản có mốc thời gian `t` mới hơn.
interface SavedProgress {
  q: { c: string; o: string[] }[] // c = id thẻ đúng, o = id 4 đáp án theo thứ tự
  a: Record<string, string> // id thẻ đúng -> id thẻ đã chọn
  t?: number // thời điểm lưu (ms) — để so bản local vs cloud bản nào mới hơn
}

const progressKey = (deckId: string) => `ex_progress_${deckId}`

function localSaved(deckId: string): SavedProgress | null {
  try {
    return JSON.parse(localStorage.getItem(progressKey(deckId)) ?? '') as SavedProgress
  } catch {
    return null
  }
}

// Gộp tiến độ: có cả 2 nơi -> lấy bản lưu sau cùng
function pickSaved(deckId: string, cloud: SavedProgress | null): SavedProgress | null {
  const local = localSaved(deckId)
  if (local && cloud) return (cloud.t ?? 0) > (local.t ?? 0) ? cloud : local
  return cloud ?? local
}

// Số câu đã làm của 1 bộ (hiện ở danh sách bài tập)
function answeredCount(saved: SavedProgress | null): number {
  return saved ? Object.keys(saved.a ?? {}).length : 0
}

// Khôi phục tiến độ đã lưu; dữ liệu hỏng / từ đã bị xóa thì sinh lại phần thiếu
function restoreOrBuild(
  saved: SavedProgress | null,
  deckCards: Card[],
  pool: Card[],
): { questions: ExQuestion[]; answers: Record<string, string>; startIdx: number } {
  const byId = new Map(pool.map((c) => [c.id, c]))
  const deckIds = new Set(deckCards.map((c) => c.id))
  let questions: ExQuestion[] | null = null
  let answers: Record<string, string> = {}
  try {
    if (saved) {
      const covered = new Set<string>()
      const restored: ExQuestion[] = []
      for (const it of saved.q ?? []) {
        const card = byId.get(it.c)
        if (!card || !deckIds.has(it.c) || covered.has(it.c)) continue
        covered.add(it.c)
        const options = (it.o ?? [])
          .map((id) => byId.get(id))
          .filter((x): x is Card => Boolean(x))
        if (options.length >= 2 && options.some((o) => o.id === card.id)) {
          restored.push({ card, options })
        } else {
          // Đáp án cũ không còn đủ (từ bị xóa/sửa) -> sinh lại câu này
          const rebuilt = buildQuiz([card], pool)[0]
          if (rebuilt) restored.push(rebuilt)
        }
      }
      // Từ MỚI thêm vào bộ sau lần làm trước -> nối vào cuối đề
      const fresh = buildQuiz(deckCards.filter((c) => !covered.has(c.id)), pool)
      questions = [...restored, ...fresh]
      for (const q of questions) {
        const a = saved.a?.[q.card.id]
        if (a && q.options.some((o) => o.id === a)) answers[q.card.id] = a
      }
    }
  } catch {
    /* dữ liệu hỏng -> làm đề mới */
  }
  if (!questions || questions.length === 0) {
    questions = buildQuiz(deckCards, pool)
    answers = {}
  }
  // Vào lại -> tiếp tục từ câu chưa làm đầu tiên (làm hết rồi -> màn kết quả)
  let startIdx = questions.findIndex((q) => !(q.card.id in answers))
  if (startIdx === -1) startIdx = questions.length
  return { questions, answers, startIdx }
}

type ExMode = 'mcq' | 'reorder'

export default function ExercisePage() {
  const [decks, setDecks] = useState<DeckWithCards[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<DeckWithCards | null>(null)
  // Kiểu bài tập: trắc nghiệm (mặc định) hoặc sắp xếp từ
  const [mode, setMode] = useState<ExMode>(
    () => (localStorage.getItem('ex_mode') as ExMode) || 'mcq',
  )
  // Tiến độ đã lưu trên cloud theo từng bộ (đồng bộ giữa app / web / điện thoại)
  const [cloudProg, setCloudProg] = useState<Map<string, SavedProgress>>(() => new Map())

  const chooseMode = (m: ExMode) => {
    setMode(m)
    localStorage.setItem('ex_mode', m)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const ds = await CloudApi.listDecks()
        const withCards = await Promise.all(
          ds.map(async (deck) => ({
            deck,
            cards: (await CloudApi.listCards(deck.id)).filter(usable),
          })),
        )
        // Chỉ giữ bộ CÓ từ vựng -> số bài tập = số bộ có từ
        setDecks(withCards.filter((d) => d.cards.length > 0))
      } catch (e) {
        setError((e as Error).message)
      }
      // Tiến độ cloud: lỗi (offline / chưa chạy migration) thì bỏ qua, dùng local
      try {
        const rows = await CloudApi.listExerciseProgress()
        setCloudProg(new Map(rows.map((r) => [r.deck_id, r.data as SavedProgress])))
      } catch {
        /* dùng tiến độ local */
      }
    })()
  }, [])

  // Kho thẻ toàn cục để mượn đáp án nhiễu khi bộ quá ít từ
  const pool = useMemo(() => decks?.flatMap((d) => d.cards) ?? [], [decks])

  if (error) return <div className="page"><div className="alert error">{error}</div></div>

  if (session) {
    return mode === 'reorder' ? (
      <ReorderQuiz
        deck={session.deck}
        cards={session.cards.filter(hasReorder)}
        onExit={() => setSession(null)}
      />
    ) : (
      <VocabQuiz
        deck={session.deck}
        cards={session.cards}
        pool={pool}
        cloudSaved={cloudProg.get(session.deck.id) ?? null}
        onExit={() => setSession(null)}
      />
    )
  }

  // Ở chế độ "sắp xếp từ" chỉ hiện bộ CÓ câu ví dụ dùng được
  const visibleDecks =
    decks && mode === 'reorder'
      ? decks.filter((d) => d.cards.some(hasReorder))
      : decks

  return (
    <div className="page">
      {/* Header dạng hàng: tiêu đề + mô tả bên trái, chọn kiểu bài bên phải */}
      <div className="exq-head">
        <div>
          <h1 className="page-title">Bài tập</h1>
          <p className="page-sub">
            {mode === 'reorder'
              ? 'Sắp xếp các từ đã xáo trộn thành câu ví dụ đúng — bấm vào một bộ để bắt đầu.'
              : 'Trắc nghiệm sinh tự động từ các bộ từ vựng của bạn — bấm vào một bộ để bắt đầu.'}
          </p>
        </div>

        {/* Chọn kiểu bài: trắc nghiệm / sắp xếp từ */}
        <div className="tabs exq-tabs">
          <button
            className={mode === 'mcq' ? 'tab active' : 'tab'}
            onClick={() => chooseMode('mcq')}
          >
            📝 Trắc nghiệm
          </button>
          <button
            className={mode === 'reorder' ? 'tab active' : 'tab'}
            onClick={() => chooseMode('reorder')}
          >
            🔀 Sắp xếp từ
          </button>
        </div>
      </div>

      {!decks ? (
        <p className="muted">Đang tải…</p>
      ) : !visibleDecks || visibleDecks.length === 0 ? (
        <p className="muted">
          {mode === 'reorder'
            ? 'Chưa có bộ nào có câu ví dụ để sắp xếp. Hãy thêm câu ví dụ cho thẻ ở mục Từ vựng.'
            : 'Chưa có bộ nào có từ vựng. Hãy thêm từ ở mục Từ vựng trước nhé.'}
        </p>
      ) : (
        <div className="deck-grid">
          {visibleDecks.map((d) => {
            if (mode === 'reorder') {
              const n = d.cards.filter(hasReorder).length
              return (
                <button key={d.deck.id} className="deck-card" onClick={() => setSession(d)}>
                  <div className="deck-name">{d.deck.name}</div>
                  <span className="deck-desc">{n} câu để sắp xếp</span>
                  <span className="exq-deck-open">
                    Bắt đầu <span>→</span>
                  </span>
                </button>
              )
            }
            const saved = pickSaved(d.deck.id, cloudProg.get(d.deck.id) ?? null)
            const done = Math.min(answeredCount(saved), d.cards.length)
            const pct = d.cards.length ? Math.round((done / d.cards.length) * 100) : 0
            return (
              <button key={d.deck.id} className="deck-card" onClick={() => setSession(d)}>
                <div className="deck-name">{d.deck.name}</div>
                <span className="deck-desc">
                  {d.cards.length} từ · {d.cards.length} câu hỏi
                </span>
                <div className="exq-deck-bar" title={`${pct}%`}>
                  <div style={{ width: `${pct}%` }} />
                </div>
                <span className="exq-deck-open">
                  {done > 0 ? `Đã làm ${done}/${d.cards.length} · Làm tiếp ` : 'Bắt đầu '}
                  <span>→</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- Làm trắc nghiệm 1 bộ từ ----------
function VocabQuiz({
  deck,
  cards,
  pool,
  cloudSaved,
  onExit,
}: {
  deck: Deck
  cards: Card[]
  pool: Card[]
  cloudSaved: SavedProgress | null
  onExit: () => void
}) {
  // Chiều làm bài — mặc định Anh→Việt, đổi bằng nút 🔁 bên trong (không mất đáp án đã làm)
  const [direction, setDirection] = useState<Direction>('en2vi')
  // Khôi phục tiến độ đã lưu (bản mới hơn giữa local và cloud) — vào lại tiếp tục từ câu chưa làm
  const initial = useMemo(
    () => restoreOrBuild(pickSaved(deck.id, cloudSaved), cards, pool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck.id],
  )
  const [questions, setQuestions] = useState<ExQuestion[]>(initial.questions)
  const [idx, setIdx] = useState(initial.startIdx)
  // Đáp án đã chọn theo từng câu (id thẻ đúng -> id thẻ đã chọn) — lùi lại vẫn thấy lựa chọn cũ
  const [answers, setAnswers] = useState<Record<string, string>>(initial.answers)

  // Mỗi lần trả lời / đổi đề -> lưu tiến độ vào localStorage (offline)
  // + đẩy lên Supabase để thiết bị khác vào là tiếp đúng câu
  useEffect(() => {
    const data: SavedProgress = {
      q: questions.map((x) => ({ c: x.card.id, o: x.options.map((o) => o.id) })),
      a: answers,
      t: Date.now(),
    }
    try {
      localStorage.setItem(progressKey(deck.id), JSON.stringify(data))
    } catch {
      /* localStorage đầy -> bỏ qua, không chặn làm bài */
    }
    CloudApi.saveExerciseProgress(deck.id, data).catch(() => {
      /* offline / chưa chạy migration -> còn bản local, lần sau đẩy lại */
    })
  }, [deck.id, questions, answers])

  const q = questions[idx] as ExQuestion | undefined
  const picked = q ? (answers[q.card.id] ?? null) : null
  const answered = picked !== null
  const en2vi = direction === 'en2vi'

  // Số câu đúng tính từ toàn bộ đáp án đã chọn
  const right = questions.filter((x) => answers[x.card.id] === x.card.id).length

  // Hẹn giờ tự sang câu khi chọn ĐÚNG (hủy nếu người dùng tự bấm chuyển trước)
  const autoNext = useRef<number | null>(null)
  useEffect(() => {
    if (autoNext.current) {
      window.clearTimeout(autoNext.current)
      autoNext.current = null
    }
  }, [idx])
  useEffect(
    () => () => {
      if (autoNext.current) window.clearTimeout(autoNext.current)
    },
    [],
  )

  const choose = (c: Card) => {
    if (answered || !q) return
    setAnswers((a) => ({ ...a, [q.card.id]: c.id }))
    // Chọn xong mới đọc từ tiếng Anh (chiều Việt→Anh đọc sớm sẽ lộ đáp án)
    if (ttsSupported) speak(q.card.word)
    // Chọn ĐÚNG -> tự nhảy sang câu mới; chọn sai thì đứng lại để xem đáp án
    if (c.id === q.card.id) {
      autoNext.current = window.setTimeout(() => {
        setIdx((i) => Math.min(i + 1, questions.length))
      }, 900)
    }
  }

  // 2 nút qua / lùi — qua được cả khi chưa trả lời (bỏ qua câu khó)
  const goNext = () => setIdx((i) => Math.min(i + 1, questions.length))
  const goBack = () => setIdx((i) => Math.max(0, i - 1))

  // Phím tắt: ← / → chuyển câu · 1-4 chọn đáp án · Enter sang câu kế
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setIdx((i) => Math.min(i + 1, questions.length))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setIdx((i) => Math.max(0, i - 1))
      } else if (!answered && q && ['1', '2', '3', '4'].includes(e.key)) {
        const opt = q.options[Number(e.key) - 1]
        if (opt) choose(opt)
      } else if (answered && e.key === 'Enter') {
        e.preventDefault()
        setIdx((i) => Math.min(i + 1, questions.length))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, idx, answers])

  // Làm lại từ đầu: xóa tiến độ đã lưu (cả local lẫn cloud) + trộn đề mới
  const restart = () => {
    localStorage.removeItem(progressKey(deck.id))
    CloudApi.clearExerciseProgress(deck.id).catch(() => {})
    quizCounted.current = false // lượt mới -> cho phép đếm lại khi hoàn thành
    setQuestions(buildQuiz(cards, pool))
    setIdx(0)
    setAnswers({})
  }

  // Làm xong 1 lượt (tới màn kết quả) -> đếm +1 quiz vào study_stats (mỗi lượt 1 lần)
  const quizCounted = useRef(false)
  useEffect(() => {
    if (!q && questions.length > 0 && !quizCounted.current) {
      quizCounted.current = true
      track.quizzes(1)
    }
  }, [q, questions.length])

  // Hết câu -> màn kết quả + ôn lại các câu sai / bỏ trống
  if (!q) {
    const wrongCards = questions.filter((x) => answers[x.card.id] !== x.card.id).map((x) => x.card)
    // Vòng mới CHỈ gồm các từ sai/bỏ trống (đề + đáp án trộn lại); tiến độ lưu theo vòng này
    const retryWrong = () => {
      quizCounted.current = false // lượt mới -> cho phép đếm lại khi hoàn thành
      setQuestions(buildQuiz(wrongCards, pool))
      setIdx(0)
      setAnswers({})
    }
    // Vòng tròn điểm số: % đúng, đổi màu theo mức (xanh / vàng / đỏ)
    const pctRight = questions.length ? Math.round((right / questions.length) * 100) : 0
    const ringCls = pctRight >= 80 ? 'good' : pctRight >= 50 ? 'mid' : 'bad'
    const R = 52
    const CIRC = 2 * Math.PI * R
    return (
      <div className="page center ex-result">
        <h1 className="page-title">
          {pctRight >= 80 ? '🎉 Tuyệt vời!' : pctRight >= 50 ? '👍 Khá lắm!' : '💪 Cố lên!'}
        </h1>
        <p className="muted">
          Bộ “{deck.name}” · {en2vi ? 'Anh → Việt' : 'Việt → Anh'}
        </p>

        <svg className={`ex-ring ${ringCls}`} viewBox="0 0 120 120">
          <circle className="ex-ring-track" cx="60" cy="60" r={R} />
          <circle
            className="ex-ring-fill"
            cx="60"
            cy="60"
            r={R}
            strokeDasharray={`${(pctRight / 100) * CIRC} ${CIRC}`}
          />
          <text className="ex-ring-pct" x="60" y="58">
            {pctRight}%
          </text>
          <text className="ex-ring-sub" x="60" y="78">
            chính xác
          </text>
        </svg>

        <div className="ex-stats">
          <div className="ex-stat ok">
            <strong>{right}</strong>
            <span>Đúng</span>
          </div>
          <div className="ex-stat no">
            <strong>{wrongCards.length}</strong>
            <span>Sai / bỏ trống</span>
          </div>
          <div className="ex-stat">
            <strong>{questions.length}</strong>
            <span>Tổng số câu</span>
          </div>
        </div>

        <div className="review-actions">
          {wrongCards.length > 0 && (
            <button className="btn primary" onClick={retryWrong}>
              ✍️ Làm lại {wrongCards.length} câu sai
            </button>
          )}
          <button className={wrongCards.length > 0 ? 'btn' : 'btn primary'} onClick={restart}>
            🔁 Làm lại toàn bộ
          </button>
          <button className="btn" onClick={onExit}>
            Chọn bộ khác
          </button>
        </div>

        {wrongCards.length > 0 && (
          <div className="ex-wrong-list">
            <div className="ex-wrong-title">Ôn lại các từ sai / bỏ trống</div>
            {wrongCards.map((c) => (
              <div key={c.id} className="ex-wrong-item">
                <div className="ex-wrong-word">
                  {c.word} {c.pos && <span className="fc-pos">{c.pos}</span>}
                  <span className="ex-wrong-meaning">{c.meaning}</span>
                </div>
                {exampleOf(c) && <div className="ex-wrong-ex">“{exampleOf(c)}”</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const isCorrect = answered && picked === q.card.id
  return (
    <div className="page ex-quiz">
      {/* Thanh trên: thoát ✕ · tiến độ lớn · điểm đúng */}
      <div className="ex-top">
        <button className="ex-exit" onClick={onExit} title="Thoát">
          ✕
        </button>
        <div className="ex-bar" title={`Câu ${idx + 1}/${questions.length}`}>
          <div
            className="ex-bar-fill"
            style={{ width: `${Math.round((idx / questions.length) * 100)}%` }}
          />
        </div>
        <span className="ex-score" title="Số câu đúng">
          ✓ {right}
        </span>
      </div>

      {/* Nút đổi chiều làm bài — chỉ đổi cách hiển thị, đáp án đã chọn giữ nguyên */}
      <button
        className="fc-dir-toggle"
        onClick={() => setDirection((d) => (d === 'en2vi' ? 'vi2en' : 'en2vi'))}
        title="Đổi chiều làm bài"
      >
        🔁 {en2vi ? 'Anh → Việt' : 'Việt → Anh'}
      </button>

      {/* Đề bài */}
      <div className="ex-prompt">
        <div className="ex-prompt-label">
          Câu {idx + 1}/{questions.length} · {en2vi ? 'Chọn nghĩa tiếng Việt đúng' : 'Chọn từ tiếng Anh đúng'}
        </div>
        <div className="ex-word">
          {en2vi ? q.card.word : q.card.meaning}
          {en2vi && q.card.pos && <span className="fc-pos">{q.card.pos}</span>}
          {en2vi && ttsSupported && (
            <button
              type="button"
              className="fc-speak"
              title="Phát âm"
              onClick={() => speak(q.card.word)}
            >
              🔊
            </button>
          )}
        </div>
      </div>

      {/* 4 đáp án đánh số (bấm phím 1-4 cũng chọn được) — câu ví dụ chỉ hiện SAU khi chọn */}
      <div className="ex-options exq-options">
        {q.options.map((c, i) => {
          const ex = answered ? exampleOf(c) : null
          let cls = 'ex-option'
          let key: string = String(i + 1)
          if (answered) {
            if (c.id === q.card.id) {
              cls += ' correct'
              key = '✓'
            } else if (c.id === picked) {
              cls += ' wrong'
              key = '✕'
            } else cls += ' dim'
          }
          return (
            <button key={c.id} className={cls} onClick={() => choose(c)} disabled={answered}>
              <span className="ex-key">{key}</span>
              <span className="ex-option-body">
                <span className="ex-option-main">
                  {en2vi ? c.meaning : c.word}
                  {!en2vi && c.pos && <span className="fc-pos">{c.pos}</span>}
                </span>
                {ex && <span className="ex-option-ex">“{ex}”</span>}
              </span>
            </button>
          )
        })}
      </div>

      {/* Dưới cùng: chưa trả lời -> điều hướng; trả lời rồi -> banner phản hồi kiểu Duolingo */}
      {answered ? (
        <div className={`ex-banner ${isCorrect ? 'ok' : 'no'}`}>
          <button className="ex-banner-back" onClick={goBack} disabled={idx === 0} title="Câu trước">
            ←
          </button>
          <span className="ex-banner-ico">{isCorrect ? '✓' : '✕'}</span>
          <div className="ex-banner-text">
            <strong>{isCorrect ? 'Chính xác!' : 'Chưa đúng'}</strong>
            {!isCorrect && <span>Đáp án: {en2vi ? q.card.meaning : q.card.word}</span>}
          </div>
          <button className="ex-continue" onClick={goNext}>
            {idx + 1 < questions.length ? 'Tiếp tục →' : 'Xem kết quả'}
          </button>
        </div>
      ) : (
        <div className="review-nav">
          <button className="btn" onClick={goBack} disabled={idx === 0}>
            ← Trước
          </button>
          <span className="review-nav-pos">
            {idx + 1} / {questions.length}
          </span>
          <button className="btn" onClick={goNext}>
            Bỏ qua →
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Bài "Sắp xếp từ" (reorder) — xáo trộn câu ví dụ của thẻ, người dùng
// bấm các từ theo đúng thứ tự để dựng lại câu. Chấm bằng cách so chuỗi
// từ đã xếp với câu gốc (bỏ hoa/thường, khoảng trắng thừa).
// ============================================================
interface Chip {
  id: number // vị trí trong câu gốc (để phân biệt từ trùng nhau)
  text: string
}

interface ReorderQuestion {
  card: Card
  sentence: string // câu gốc (đáp án đúng)
  answer: Chip[] // các từ theo đúng thứ tự
}

// So khớp câu: nối các từ, bỏ hoa/thường & khoảng trắng thừa
const normSentence = (chips: Chip[]) =>
  chips
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// Xáo trộn chip sao cho KHÁC thứ tự gốc (thử vài lần, cùng lắm đảo ngược)
function scramble(chips: Chip[]): Chip[] {
  if (chips.length < 2) return [...chips]
  const original = chips.map((c) => c.id).join(',')
  for (let i = 0; i < 8; i++) {
    const s = shuffle(chips)
    if (s.map((c) => c.id).join(',') !== original) return s
  }
  return [...chips].reverse()
}

function buildReorder(cards: Card[]): ReorderQuestion[] {
  return shuffle(cards)
    .map((card) => {
      const sentence = reorderSentence(card)
      if (!sentence) return null
      const answer = sentence
        .split(/\s+/)
        .filter(Boolean)
        .map((text, id) => ({ id, text }))
      return { card, sentence, answer } as ReorderQuestion
    })
    .filter((q): q is ReorderQuestion => q !== null)
}

function ReorderQuiz({
  deck,
  cards,
  onExit,
}: {
  deck: Deck
  cards: Card[]
  onExit: () => void
}) {
  const [questions] = useState<ReorderQuestion[]>(() => buildReorder(cards))
  const [idx, setIdx] = useState(0)
  const [placed, setPlaced] = useState<Chip[]>([]) // các từ đã xếp (theo thứ tự)
  const [bank, setBank] = useState<Chip[]>([]) // các từ còn trong kho
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)
  // Kết quả từng câu để tính điểm ở màn cuối
  const [results, setResults] = useState<boolean[]>([])

  const q = questions[idx] as ReorderQuestion | undefined

  // Vào câu mới -> xáo trộn lại kho từ, xóa vùng đã xếp
  useEffect(() => {
    if (!q) return
    setBank(scramble(q.answer))
    setPlaced([])
    setChecked(false)
    setCorrect(false)
  }, [idx, q])

  // Xong toàn bộ -> đếm +1 quiz vào study_stats (1 lần / lượt)
  const counted = useRef(false)
  useEffect(() => {
    if (!q && questions.length > 0 && !counted.current) {
      counted.current = true
      track.quizzes(1)
    }
  }, [q, questions.length])

  const pick = (chip: Chip, from: number) => {
    if (checked) return
    setBank((b) => b.filter((_, i) => i !== from))
    setPlaced((p) => [...p, chip])
  }
  const unpick = (from: number) => {
    if (checked) return
    setPlaced((p) => {
      const chip = p[from]
      setBank((b) => [...b, chip])
      return p.filter((_, i) => i !== from)
    })
  }

  const check = () => {
    if (!q || placed.length !== q.answer.length) return
    const ok = normSentence(placed) === normSentence(q.answer)
    setCorrect(ok)
    setChecked(true)
    setResults((r) => {
      const next = [...r]
      next[idx] = ok
      return next
    })
  }

  const next = () => {
    setIdx((i) => i + 1)
  }

  // Enter: đủ từ -> chấm; đã chấm -> sang câu kế
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      if (checked) next()
      else if (q && placed.length === q.answer.length) check()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, placed, q])

  if (questions.length === 0) {
    return (
      <div className="page center">
        <h1 className="page-title">Chưa có câu để sắp xếp</h1>
        <p className="muted">Bộ “{deck.name}” chưa có thẻ nào kèm câu ví dụ phù hợp (3–12 từ).</p>
        <button className="btn primary" onClick={onExit}>
          Chọn bộ khác
        </button>
      </div>
    )
  }

  // Màn kết quả
  if (!q) {
    const right = results.filter(Boolean).length
    const pctRight = Math.round((right / questions.length) * 100)
    const R = 52
    const CIRC = 2 * Math.PI * R
    const ringCls = pctRight >= 80 ? 'good' : pctRight >= 50 ? 'mid' : 'bad'
    const replay = () => {
      counted.current = false
      setResults([])
      setIdx(0)
    }
    return (
      <div className="page center ex-result">
        <h1 className="page-title">
          {pctRight >= 80 ? '🎉 Tuyệt vời!' : pctRight >= 50 ? '👍 Khá lắm!' : '💪 Cố lên!'}
        </h1>
        <p className="muted">Bộ “{deck.name}” · Sắp xếp từ</p>
        <svg className={`ex-ring ${ringCls}`} viewBox="0 0 120 120">
          <circle className="ex-ring-track" cx="60" cy="60" r={R} />
          <circle
            className="ex-ring-fill"
            cx="60"
            cy="60"
            r={R}
            strokeDasharray={`${(pctRight / 100) * CIRC} ${CIRC}`}
          />
          <text className="ex-ring-pct" x="60" y="58">
            {pctRight}%
          </text>
          <text className="ex-ring-sub" x="60" y="78">
            chính xác
          </text>
        </svg>
        <div className="ex-stats">
          <div className="ex-stat ok">
            <strong>{right}</strong>
            <span>Đúng</span>
          </div>
          <div className="ex-stat no">
            <strong>{questions.length - right}</strong>
            <span>Sai</span>
          </div>
          <div className="ex-stat">
            <strong>{questions.length}</strong>
            <span>Tổng số câu</span>
          </div>
        </div>
        <div className="review-actions">
          <button className="btn primary" onClick={replay}>
            🔁 Làm lại
          </button>
          <button className="btn" onClick={onExit}>
            Chọn bộ khác
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page ex-quiz">
      <div className="ex-top">
        <button className="ex-exit" onClick={onExit} title="Thoát">
          ✕
        </button>
        <div className="ex-bar" title={`Câu ${idx + 1}/${questions.length}`}>
          <div
            className="ex-bar-fill"
            style={{ width: `${Math.round((idx / questions.length) * 100)}%` }}
          />
        </div>
        <span className="ex-score" title="Số câu đúng">
          ✓ {results.filter(Boolean).length}
        </span>
      </div>

      <div className="ex-prompt">
        <div className="ex-prompt-label">
          Câu {idx + 1}/{questions.length} · Sắp xếp các từ thành câu đúng
        </div>
        <div className="exq-hint-row">
          <span className="exq-hint">
            💡 Gợi ý: <strong>{q.card.word}</strong>
            {q.card.meaning ? ` — ${q.card.meaning}` : ''}
          </span>
        </div>
      </div>

      {/* Vùng đã xếp — bấm 1 từ để trả lại kho */}
      <div className={`ro-answer ${checked ? (correct ? 'ok' : 'no') : ''}`}>
        {placed.length === 0 ? (
          <span className="ro-placeholder muted">Bấm các từ bên dưới để xếp câu…</span>
        ) : (
          placed.map((c, i) => (
            <button key={`${c.id}-${i}`} className="ro-chip placed" onClick={() => unpick(i)}>
              {c.text}
            </button>
          ))
        )}
      </div>

      {/* Kho từ đã xáo trộn */}
      {!checked && (
        <div className="ro-bank">
          {bank.map((c, i) => (
            <button key={`${c.id}-${i}`} className="ro-chip" onClick={() => pick(c, i)}>
              {c.text}
            </button>
          ))}
        </div>
      )}

      {/* Phản hồi sau khi chấm */}
      {checked && !correct && (
        <div className="ro-solution">
          <span className="muted">Đáp án đúng:</span> {q.sentence}
        </div>
      )}

      {checked ? (
        <div className={`ex-banner ${correct ? 'ok' : 'no'}`}>
          <span className="ex-banner-ico">{correct ? '✓' : '✕'}</span>
          <div className="ex-banner-text">
            <strong>{correct ? 'Chính xác!' : 'Chưa đúng'}</strong>
          </div>
          <button className="ex-continue" onClick={next}>
            {idx + 1 < questions.length ? 'Tiếp tục →' : 'Xem kết quả'}
          </button>
        </div>
      ) : (
        <div className="review-nav">
          <button
            className="btn"
            onClick={() => {
              if (placed.length) unpick(placed.length - 1)
            }}
            disabled={placed.length === 0}
          >
            ↩ Bỏ từ cuối
          </button>
          <button
            className="btn primary"
            onClick={check}
            disabled={placed.length !== q.answer.length}
          >
            Kiểm tra
          </button>
        </div>
      )}
    </div>
  )
}
