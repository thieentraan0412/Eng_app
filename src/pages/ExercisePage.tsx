import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { CloudApi, type Card, type Deck } from '../services/cloud/CloudApiClient'
import { speak, ttsSupported } from '../services/tts'
import { track } from '../services/studyTracker'
import Icon from '../components/Icon'
import '../styles/exercise.css'

// Bộ "Từ đã lưu khi đọc" — hiện icon bóng đèn thay chữ cái đầu (giống mockup)
const SAVED_DECK_NAME = 'Từ đã lưu khi đọc'

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

  // Bộ có từ nhưng KHÔNG có câu ví dụ dùng được — nêu rõ ở tab sắp xếp từ
  const noSentenceDecks =
    decks && mode === 'reorder' ? decks.filter((d) => !d.cards.some(hasReorder)) : []

  const deckMark = (name: string) =>
    name.trim() === SAVED_DECK_NAME ? <Icon name="bulb" /> : name.trim().charAt(0).toUpperCase()

  return (
    <div className="page ex-page">
      <div className="ex-head">
        <h1>Bài tập</h1>
        <p>
          {mode === 'reorder'
            ? 'Sắp xếp các từ đã xáo trộn thành câu ví dụ đúng — bấm vào một bộ để bắt đầu.'
            : 'Trắc nghiệm sinh tự động từ các bộ từ vựng của bạn — chọn một bộ để bắt đầu.'}
        </p>
      </div>

      {/* Chọn kiểu bài: trắc nghiệm / sắp xếp từ */}
      <nav className="ex-tabs">
        <button
          className={mode === 'mcq' ? 'is-active' : ''}
          onClick={() => chooseMode('mcq')}
        >
          <Icon name="tasks" /> Trắc nghiệm
        </button>
        <button
          className={mode === 'reorder' ? 'is-active' : ''}
          onClick={() => chooseMode('reorder')}
        >
          <Icon name="shuffle" /> Sắp xếp từ
        </button>
      </nav>

      {!decks ? (
        <p className="muted">Đang tải…</p>
      ) : !visibleDecks || visibleDecks.length === 0 ? (
        <div className="ex-empty is-page">
          <Icon name="layers" />
          <b>
            {mode === 'reorder' ? 'Chưa có câu nào để sắp xếp' : 'Chưa có bộ nào có từ vựng'}
          </b>
          <p>
            {mode === 'reorder'
              ? 'Thêm câu ví dụ (3–12 từ) cho các thẻ ở mục Từ vựng để tạo bài sắp xếp từ.'
              : 'Hãy thêm từ ở mục Từ vựng trước, trắc nghiệm sẽ tự sinh từ các thẻ đó.'}
          </p>
        </div>
      ) : (
        <section className="ex-grid">
          {visibleDecks.map((d) => {
            if (mode === 'reorder') {
              const n = d.cards.filter(hasReorder).length
              return (
                <button key={d.deck.id} className="ex-deck" onClick={() => setSession(d)}>
                  <span className="ex-deck-top">
                    <span className="ex-deck-mark">{deckMark(d.deck.name)}</span>
                    <span className="ex-deck-txt">
                      <span className="ex-deck-name">{d.deck.name}</span>
                      <span className="ex-deck-desc">{n} câu để sắp xếp</span>
                    </span>
                  </span>
                  <span className="ex-bar">
                    <i style={{ width: '0%' }} />
                  </span>
                  <span className="ex-deck-meta">
                    <span>Câu ví dụ từ các thẻ</span>
                    <span className="ex-deck-go">
                      Bắt đầu <Icon name="right" />
                    </span>
                  </span>
                </button>
              )
            }
            const saved = pickSaved(d.deck.id, cloudProg.get(d.deck.id) ?? null)
            const done = Math.min(answeredCount(saved), d.cards.length)
            const pct = d.cards.length ? Math.round((done / d.cards.length) * 100) : 0
            return (
              <button key={d.deck.id} className="ex-deck" onClick={() => setSession(d)}>
                <span className="ex-deck-top">
                  <span className="ex-deck-mark">{deckMark(d.deck.name)}</span>
                  <span className="ex-deck-txt">
                    <span className="ex-deck-name">{d.deck.name}</span>
                    <span className="ex-deck-desc">
                      {d.cards.length} từ · {d.cards.length} câu hỏi
                    </span>
                  </span>
                </span>
                <span className="ex-bar" title={`${pct}%`}>
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span className="ex-deck-meta">
                  <span>{done > 0 ? `Đã làm ${done}/${d.cards.length}` : 'Chưa làm'}</span>
                  <span className="ex-deck-go">
                    {done > 0 ? 'Làm tiếp' : 'Bắt đầu'} <Icon name="right" />
                  </span>
                </span>
              </button>
            )
          })}

          {/* Tab sắp xếp từ: nêu rõ bộ nào chưa có câu ví dụ (giống mockup) */}
          {noSentenceDecks.length > 0 && (
            <div className="ex-empty">
              <Icon name="alert" />
              <b>
                {noSentenceDecks.length === 1
                  ? `Bộ “${noSentenceDecks[0].deck.name}” chưa có câu ví dụ`
                  : `${noSentenceDecks.length} bộ chưa có câu ví dụ`}
              </b>
              <p>Thêm câu ví dụ cho các thẻ trong bộ để tạo bài sắp xếp từ.</p>
            </div>
          )}
        </section>
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
  // Dùng chung tùy chọn tự phát âm với trang Ôn tập / Cài đặt.
  const autoSpeak = localStorage.getItem('fc_autospeak') !== '0'

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

  // Chiều Anh→Việt: từ tiếng Anh hiện ngay nên đọc mỗi khi chuyển sang câu mới.
  // Chiều Việt→Anh không đọc ở đây để tránh làm lộ đáp án.
  useEffect(() => {
    if (!ttsSupported || !autoSpeak || !en2vi || !q) return
    const timer = window.setTimeout(() => speak(q.card.word), 0)
    return () => window.clearTimeout(timer)
  }, [autoSpeak, en2vi, q?.card.id])

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
    // Chiều Việt→Anh chỉ đọc sau khi chọn, khi đáp án tiếng Anh đã được mở.
    if (ttsSupported && autoSpeak && !en2vi) speak(q.card.word)
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
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
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
    return (
      <div className="page ex-quiz">
        <div className="ex-result">
          <h1>
            {pctRight >= 80 ? 'Tuyệt vời!' : pctRight >= 50 ? 'Khá lắm!' : 'Cố lên!'}
          </h1>
          <p>
            Bộ “{deck.name}” · {en2vi ? 'Anh → Việt' : 'Việt → Anh'}
          </p>

          <span className={`ex-ring ${ringCls}`} style={{ ['--p' as string]: pctRight }}>
            <span>
              <b>{pctRight}%</b>
              <small>chính xác</small>
            </span>
          </span>

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

          <div className="ex-result-actions">
            {wrongCards.length > 0 && (
              <button className="ex-btn ex-btn-primary" onClick={retryWrong}>
                <Icon name="pen" /> Làm lại {wrongCards.length} câu sai
              </button>
            )}
            <button
              className={wrongCards.length > 0 ? 'ex-btn' : 'ex-btn ex-btn-primary'}
              onClick={restart}
            >
              <Icon name="undo" /> Làm lại toàn bộ
            </button>
            <button className="ex-btn" onClick={onExit}>
              Chọn bộ khác
            </button>
          </div>

          {wrongCards.length > 0 && (
            <div className="ex-wrong-list">
              <div className="ex-wrong-title">Ôn lại các từ sai / bỏ trống</div>
              {wrongCards.map((c) => (
                <div key={c.id} className="ex-wrong-item">
                  <div className="ex-wrong-word">
                    {c.word} {c.pos && <span className="ex-pos">{c.pos}</span>}
                    <span className="ex-wrong-meaning">{c.meaning}</span>
                  </div>
                  {exampleOf(c) && <div className="ex-wrong-ex">“{exampleOf(c)}”</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const isCorrect = answered && picked === q.card.id
  return (
    <div className="page ex-quiz">
      {/* Thanh trên: thoát · tiến độ · số câu đúng */}
      <div className="ex-top">
        <button className="ex-ibtn danger" onClick={onExit} title="Thoát (Esc)">
          <Icon name="x" />
        </button>
        <div className="ex-progress" title={`Câu ${idx + 1}/${questions.length}`}>
          <div style={{ width: `${Math.round((idx / questions.length) * 100)}%` }} />
        </div>
        <span className="ex-badge ok" title="Số câu đúng">
          <Icon name="check" /> {right} đúng
        </span>
      </div>

      <div className="ex-stage">
        {/* Đổi chiều làm bài — chỉ đổi cách hiển thị, đáp án đã chọn giữ nguyên */}
        <div className="ex-seg">
          <button
            className={en2vi ? 'is-active' : ''}
            onClick={() => setDirection('en2vi')}
            title="Hiện từ tiếng Anh, chọn nghĩa"
          >
            <Icon name="repeat" /> Anh → Việt
          </button>
          <button
            className={en2vi ? '' : 'is-active'}
            onClick={() => setDirection('vi2en')}
            title="Hiện nghĩa, chọn từ tiếng Anh"
          >
            <Icon name="lang" /> Việt → Anh
          </button>
        </div>

        {/* Đề bài */}
        <div className="ex-prompt">
          <p className="ex-prompt-label">
            Câu {idx + 1} / {questions.length} ·{' '}
            {en2vi ? 'Chọn nghĩa tiếng Việt đúng' : 'Chọn từ tiếng Anh đúng'}
          </p>
          <p className="ex-word">
            {en2vi ? q.card.word : q.card.meaning}
            {en2vi && q.card.pos && <span className="ex-pos">{q.card.pos}</span>}
            {en2vi && ttsSupported && (
              <button
                type="button"
                className="ex-ibtn"
                title="Phát âm"
                onClick={() => speak(q.card.word)}
              >
                <Icon name="speak" />
              </button>
            )}
          </p>
        </div>

        {/* 4 đáp án đánh số (bấm phím 1-4 cũng chọn được) — ví dụ chỉ hiện SAU khi chọn */}
        <div className="ex-options">
          {q.options.map((c, i) => {
            const ex = answered ? exampleOf(c) : null
            let cls = 'ex-option'
            if (answered) {
              if (c.id === q.card.id) cls += ' is-right'
              else if (c.id === picked) cls += ' is-wrong'
              else cls += ' is-dim'
            }
            const isRight = answered && c.id === q.card.id
            const isWrong = answered && c.id === picked && c.id !== q.card.id
            return (
              <button key={c.id} className={cls} onClick={() => choose(c)} disabled={answered}>
                <span className="ex-key">{i + 1}</span>
                <span className="ex-option-body">
                  <span className="ex-option-main">
                    {en2vi ? c.meaning : c.word}
                    {!en2vi && c.pos && <span className="ex-pos">{c.pos}</span>}
                  </span>
                  {ex && <span className="ex-option-ex">“{ex}”</span>}
                </span>
                {isRight && <Icon name="check" />}
                {isWrong && <Icon name="x" />}
              </button>
            )
          })}
        </div>

        {/* Chưa trả lời -> điều hướng; trả lời rồi -> băng phản hồi */}
        {answered ? (
          <div className={`ex-banner ${isCorrect ? 'ok' : 'no'}`}>
            <span className="ex-banner-ico">
              <Icon name={isCorrect ? 'check' : 'x'} />
            </span>
            <div className="ex-banner-text">
              <strong>{isCorrect ? 'Chính xác!' : 'Chưa đúng'}</strong>
              {!isCorrect && <span>Đáp án: {en2vi ? q.card.meaning : q.card.word}</span>}
            </div>
            <button className="ex-btn" onClick={goBack} disabled={idx === 0} title="Câu trước">
              <Icon name="left" />
            </button>
            <button className="ex-btn ex-btn-primary" onClick={goNext}>
              {idx + 1 < questions.length ? 'Tiếp tục' : 'Xem kết quả'} <Icon name="right" />
            </button>
          </div>
        ) : (
          <div className="ex-nav">
            <button className="ex-btn ex-btn-sm" onClick={goBack} disabled={idx === 0}>
              <Icon name="left" /> Trước
            </button>
            <span className="ex-nav-pos">
              {idx + 1} / {questions.length}
            </span>
            <button className="ex-btn ex-btn-sm" onClick={goNext}>
              Bỏ qua <Icon name="right" />
            </button>
          </div>
        )}

        <p className="ex-foot">
          <span>
            Bấm <span className="ex-kbd">1</span>–<span className="ex-kbd">4</span> để chọn nhanh
          </span>
          <span>
            <span className="ex-kbd">Esc</span> thoát
          </span>
        </p>
      </div>
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

const sameChipText = (left: Chip, right: Chip | undefined) =>
  right !== undefined &&
  left.text.trim().toLocaleLowerCase() === right.text.trim().toLocaleLowerCase()

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
  const [attempted, setAttempted] = useState(false) // đã chấm ít nhất 1 lần ở câu này
  const [edited, setEdited] = useState(false) // đã sửa lại sau lần chấm gần nhất
  const [showAnswer, setShowAnswer] = useState(false)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    area: 'placed' | 'bank'
    index: number
  } | null>(null)
  const justDragged = useRef(false)
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
    setAttempted(false)
    setEdited(false)
    setShowAnswer(false)
    setDraggingId(null)
    setDropTarget(null)
  }, [idx, q])

  // Xong toàn bộ -> đếm +1 quiz vào study_stats (1 lần / lượt)
  const counted = useRef(false)
  useEffect(() => {
    if (!q && questions.length > 0 && !counted.current) {
      counted.current = true
      track.quizzes(1)
    }
  }, [q, questions.length])

  // Chấm ĐÚNG mới khóa câu lại; chấm sai vẫn cho sắp xếp lại rồi kiểm tra tiếp.
  const locked = checked && correct

  const pick = (chip: Chip, from: number) => {
    if (locked) return
    setEdited(true)
    setBank((b) => b.filter((_, i) => i !== from))
    setPlaced((p) => [...p, chip])
  }
  const unpick = (from: number) => {
    if (locked) return
    setEdited(true)
    setPlaced((p) => {
      const chip = p[from]
      setBank((b) => [...b, chip])
      return p.filter((_, i) => i !== from)
    })
  }

  const moveChip = (chipId: number, area: 'placed' | 'bank', targetIndex: number) => {
    if (locked) return
    const chip = [...placed, ...bank].find((item) => item.id === chipId)
    if (!chip) return
    setEdited(true)

    const sourceArea = placed.some((item) => item.id === chipId) ? 'placed' : 'bank'
    const source = sourceArea === 'placed' ? placed : bank
    const sourceIndex = source.findIndex((item) => item.id === chipId)
    const nextPlaced = placed.filter((item) => item.id !== chipId)
    const nextBank = bank.filter((item) => item.id !== chipId)
    const target = area === 'placed' ? nextPlaced : nextBank
    let insertAt = targetIndex
    if (sourceArea === area && sourceIndex >= 0 && sourceIndex < targetIndex) insertAt -= 1
    insertAt = Math.max(0, Math.min(insertAt, target.length))
    target.splice(insertAt, 0, chip)

    setPlaced(nextPlaced)
    setBank(nextBank)
  }

  const startDrag = (event: DragEvent<HTMLButtonElement>, chipId: number) => {
    if (locked) {
      event.preventDefault()
      return
    }
    justDragged.current = true
    setDraggingId(chipId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(chipId))
  }

  const finishDrag = () => {
    setDraggingId(null)
    setDropTarget(null)
    window.setTimeout(() => {
      justDragged.current = false
    }, 0)
  }

  const dropChip = (
    event: DragEvent<HTMLElement>,
    area: 'placed' | 'bank',
    index: number,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const raw = event.dataTransfer.getData('text/plain')
    const transferred = raw ? Number(raw) : Number.NaN
    const chipId = draggingId ?? (Number.isFinite(transferred) ? transferred : null)
    if (chipId !== null) moveChip(chipId, area, index)
    finishDrag()
  }

  const dragOver = (
    event: DragEvent<HTMLElement>,
    area: 'placed' | 'bank',
    index: number,
  ) => {
    if (locked) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget((current) =>
      current?.area === area && current.index === index ? current : { area, index },
    )
  }

  const clickWithoutDrag = (action: () => void) => {
    if (justDragged.current) return
    action()
  }

  const check = () => {
    if (!q || placed.length !== q.answer.length) return
    const ok = normSentence(placed) === normSentence(q.answer)
    setCorrect(ok)
    setChecked(true)
    setEdited(false)
    // Điểm tính theo LẦN CHẤM ĐẦU TIÊN — sửa lại cho đúng vẫn được, nhưng
    // không tính là câu đúng để thống kê phản ánh đúng thực lực.
    if (attempted) return
    setAttempted(true)
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
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
        return
      }
      if (e.key !== 'Enter') return
      e.preventDefault()
      // Đã chấm và chưa sửa gì -> sang câu kế; vừa sửa lại -> chấm lại
      if (checked && !edited) next()
      else if (q && placed.length === q.answer.length) check()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, edited, placed, q])

  if (questions.length === 0) {
    return (
      <div className="page ex-quiz">
        <div className="ex-result">
          <h1>Chưa có câu để sắp xếp</h1>
          <p>Bộ “{deck.name}” chưa có thẻ nào kèm câu ví dụ phù hợp (3–12 từ).</p>
          <div className="ex-result-actions">
            <button className="ex-btn ex-btn-primary" onClick={onExit}>
              Chọn bộ khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Màn kết quả
  if (!q) {
    const right = results.filter(Boolean).length
    const pctRight = Math.round((right / questions.length) * 100)
    const ringCls = pctRight >= 80 ? 'good' : pctRight >= 50 ? 'mid' : 'bad'
    const replay = () => {
      counted.current = false
      setResults([])
      setIdx(0)
    }
    return (
      <div className="page ex-quiz">
        <div className="ex-result">
          <h1>{pctRight >= 80 ? 'Tuyệt vời!' : pctRight >= 50 ? 'Khá lắm!' : 'Cố lên!'}</h1>
          <p>Bộ “{deck.name}” · Sắp xếp từ</p>
          <span className={`ex-ring ${ringCls}`} style={{ ['--p' as string]: pctRight }}>
            <span>
              <b>{pctRight}%</b>
              <small>chính xác</small>
            </span>
          </span>
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
          <div className="ex-result-actions">
            <button className="ex-btn ex-btn-primary" onClick={replay}>
              <Icon name="undo" /> Làm lại
            </button>
            <button className="ex-btn" onClick={onExit}>
              Chọn bộ khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page ex-quiz">
      <div className="ex-top">
        <button className="ex-ibtn danger" onClick={onExit} title="Thoát (Esc)">
          <Icon name="x" />
        </button>
        <div className="ex-progress" title={`Câu ${idx + 1}/${questions.length}`}>
          <div style={{ width: `${Math.round((idx / questions.length) * 100)}%` }} />
        </div>
        <span className="ex-badge ok" title="Số câu đúng">
          <Icon name="check" /> {results.filter(Boolean).length} đúng
        </span>
      </div>

      <div className="ex-stage">
        <div className="ex-prompt">
          <p className="ex-prompt-label">
            Câu {idx + 1} / {questions.length} · Sắp xếp các từ thành câu đúng
          </p>
          <p className="ex-hint">
            <Icon name="bulb" /> Gợi ý: <b>{q.card.word}</b>
            {q.card.meaning ? ` — ${q.card.meaning}` : ''}
          </p>
        </div>

        {/* Vùng đã xếp — bấm 1 từ để trả lại kho */}
        <div
          className={`ro-answer${checked && correct ? ' ok' : placed.length ? ' is-filled' : ''}${
            dropTarget?.area === 'placed' && dropTarget.index === placed.length
              ? ' is-drag-over'
              : ''
          }`}
          onDragOver={(event) => dragOver(event, 'placed', placed.length)}
          onDrop={(event) => dropChip(event, 'placed', placed.length)}
        >
          {placed.length === 0 ? (
            <span className="ro-placeholder">Bấm hoặc kéo từ vào đây để xếp câu…</span>
          ) : (
            placed.map((c, i) => {
              // Sửa lại sau khi chấm sai -> bỏ dấu đỏ cho tới lần chấm kế
              const wrong = checked && !edited && !sameChipText(c, q.answer[i])
              const dropBefore =
                dropTarget?.area === 'placed' &&
                dropTarget.index === i &&
                draggingId !== c.id
              return (
                <button
                  key={c.id}
                  className={`ro-chip${wrong ? ' is-wrong' : ''}${
                    draggingId === c.id ? ' is-dragging' : ''
                  }${dropBefore ? ' is-drop-before' : ''}`}
                  draggable={!locked}
                  disabled={locked}
                  onClick={() => clickWithoutDrag(() => unpick(i))}
                  onDragStart={(event) => startDrag(event, c.id)}
                  onDragEnd={finishDrag}
                  onDragOver={(event) => dragOver(event, 'placed', i)}
                  onDrop={(event) => dropChip(event, 'placed', i)}
                  title={wrong ? 'Từ này sai vị trí — kéo để sửa' : 'Kéo để đổi vị trí'}
                >
                  {c.text}
                </button>
              )
            })
          )}
        </div>

        {checked && showAnswer && (
          <div className="ro-answer-reveal" role="status">
            <span>Đáp án đúng</span>
            <strong>{q.answer.map((chip) => chip.text).join(' ')}</strong>
          </div>
        )}

        {/* Kho từ đã xáo trộn — còn hiện khi chưa xếp đúng để sửa tiếp */}
        {!locked && (
          <div
            className={`ro-bank${
              dropTarget?.area === 'bank' && dropTarget.index === bank.length
                ? ' is-drag-over'
                : ''
            }`}
            onDragOver={(event) => dragOver(event, 'bank', bank.length)}
            onDrop={(event) => dropChip(event, 'bank', bank.length)}
          >
            {bank.map((c, i) => {
              const dropBefore =
                dropTarget?.area === 'bank' && dropTarget.index === i && draggingId !== c.id
              return (
                <button
                  key={c.id}
                  className={`ro-chip${draggingId === c.id ? ' is-dragging' : ''}${
                    dropBefore ? ' is-drop-before' : ''
                  }`}
                  draggable
                  onClick={() => clickWithoutDrag(() => pick(c, i))}
                  onDragStart={(event) => startDrag(event, c.id)}
                  onDragEnd={finishDrag}
                  onDragOver={(event) => dragOver(event, 'bank', i)}
                  onDrop={(event) => dropChip(event, 'bank', i)}
                  title="Kéo vào câu hoặc bấm để thêm"
                >
                  {c.text}
                </button>
              )
            })}
          </div>
        )}

        {checked && (
          <div className={`ex-banner ${correct ? 'ok' : 'no'}`}>
            <span className="ex-banner-ico">
              <Icon name={correct ? 'check' : 'x'} />
            </span>
            <div className="ex-banner-text">
              <strong>{correct ? 'Chính xác!' : 'Chưa đúng'}</strong>
              {!correct && <span>Sắp xếp lại rồi bấm “Kiểm tra lại”</span>}
            </div>
            {!correct && (
              <button className="ex-btn" onClick={() => setShowAnswer((value) => !value)}>
                <Icon name="eye" /> {showAnswer ? 'Ẩn đáp án' : 'Xem đáp án'}
              </button>
            )}
            {/* Sai: “Kiểm tra lại” ở hàng dưới mới là nút chính, nên nút này để phụ */}
            <button className={`ex-btn${correct ? ' ex-btn-primary' : ''}`} onClick={next}>
              {idx + 1 < questions.length ? 'Tiếp tục' : 'Xem kết quả'} <Icon name="right" />
            </button>
          </div>
        )}

        {/* Chưa xếp đúng thì luôn còn hàng nút để sửa và chấm lại */}
        {!locked && (
          <div className="ex-nav">
            <button
              className="ex-btn"
              onClick={() => {
                if (placed.length) unpick(placed.length - 1)
              }}
              disabled={placed.length === 0}
            >
              <Icon name="undo" /> Bỏ từ cuối
            </button>
            <button
              className="ex-btn ex-btn-primary"
              onClick={check}
              disabled={placed.length !== q.answer.length || (checked && !edited)}
            >
              <Icon name="check" /> {attempted ? 'Kiểm tra lại' : 'Kiểm tra'}
            </button>
          </div>
        )}

        <p className="ex-foot">
          <span>Kéo thả để đổi vị trí · bấm từ trong câu để trả lại kho</span>
          <span>
            <span className="ex-kbd">Esc</span> thoát
          </span>
        </p>
      </div>
    </div>
  )
}
