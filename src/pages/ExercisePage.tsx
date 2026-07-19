import { useEffect, useMemo, useState } from 'react'
import { CloudApi, type Card, type Deck } from '../services/cloud/CloudApiClient'
import { speak, ttsSupported } from '../services/tts'

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

export default function ExercisePage() {
  const [decks, setDecks] = useState<DeckWithCards[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<DeckWithCards | null>(null)
  // Tiến độ đã lưu trên cloud theo từng bộ (đồng bộ giữa app / web / điện thoại)
  const [cloudProg, setCloudProg] = useState<Map<string, SavedProgress>>(() => new Map())

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
    return (
      <VocabQuiz
        deck={session.deck}
        cards={session.cards}
        pool={pool}
        cloudSaved={cloudProg.get(session.deck.id) ?? null}
        onExit={() => setSession(null)}
      />
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Bài tập</h1>
      <p className="muted">
        Trắc nghiệm sinh tự động từ các bộ từ vựng của bạn — bấm vào một bộ để bắt đầu.
      </p>

      {!decks ? (
        <p className="muted">Đang tải…</p>
      ) : decks.length === 0 ? (
        <p className="muted">Chưa có bộ nào có từ vựng. Hãy thêm từ ở mục Từ vựng trước nhé.</p>
      ) : (
        <div className="deck-grid">
          {decks.map((d) => {
            const saved = pickSaved(d.deck.id, cloudProg.get(d.deck.id) ?? null)
            const done = Math.min(answeredCount(saved), d.cards.length)
            return (
              <button key={d.deck.id} className="deck-card" onClick={() => setSession(d)}>
                <div className="deck-name">{d.deck.name}</div>
                <span className="muted">
                  {d.cards.length} từ · {d.cards.length} câu hỏi
                </span>
                <span className="muted">
                  {done > 0 ? `Đã làm ${done}/${d.cards.length} · Làm tiếp →` : 'Bấm để làm →'}
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

  const choose = (c: Card) => {
    if (answered || !q) return
    setAnswers((a) => ({ ...a, [q.card.id]: c.id }))
    // Chọn xong mới đọc từ tiếng Anh (chiều Việt→Anh đọc sớm sẽ lộ đáp án)
    if (ttsSupported) speak(q.card.word)
  }

  // 2 nút qua / lùi — qua được cả khi chưa trả lời (bỏ qua câu khó)
  const goNext = () => setIdx((i) => Math.min(i + 1, questions.length))
  const goBack = () => setIdx((i) => Math.max(0, i - 1))

  // Phím ← / → cũng chuyển câu
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setIdx((i) => Math.min(i + 1, questions.length))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setIdx((i) => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [questions.length])

  // Làm lại từ đầu: xóa tiến độ đã lưu (cả local lẫn cloud) + trộn đề mới
  const restart = () => {
    localStorage.removeItem(progressKey(deck.id))
    CloudApi.clearExerciseProgress(deck.id).catch(() => {})
    setQuestions(buildQuiz(cards, pool))
    setIdx(0)
    setAnswers({})
  }

  // Hết câu -> màn kết quả + ôn lại các câu sai / bỏ trống
  if (!q) {
    const wrongCards = questions.filter((x) => answers[x.card.id] !== x.card.id).map((x) => x.card)
    return (
      <div className="page center">
        <h1 className="page-title">🎉 Hoàn thành!</h1>
        <p className="muted">
          Bộ “{deck.name}” ({en2vi ? 'Anh → Việt' : 'Việt → Anh'}): đúng{' '}
          <strong>{right}</strong> / {questions.length} câu.
        </p>
        {wrongCards.length > 0 && (
          <div className="ex-wrong-list">
            <div className="ex-wrong-title">Các từ trả lời sai / bỏ trống:</div>
            {wrongCards.map((c) => (
              <div key={c.id} className="word-card q-wrong">
                <div className="wc-word">
                  {c.word} {c.pos && <span className="fc-pos">{c.pos}</span>}
                </div>
                <div className="muted">{c.meaning}</div>
                {exampleOf(c) && <div className="wc-example">“{exampleOf(c)}”</div>}
              </div>
            ))}
          </div>
        )}
        <div className="review-actions">
          <button className="btn primary" onClick={restart}>
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
      <div className="review-bar">
        <button className="btn tiny" onClick={onExit}>
          ← Thoát
        </button>
        <div className="review-progress" title={`${idx}/${questions.length}`}>
          <div
            className="review-progress-fill"
            style={{ width: `${Math.round((idx / questions.length) * 100)}%` }}
          />
        </div>
        <span className="review-count">
          Câu {idx + 1}/{questions.length} · Đúng {right}
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
          {en2vi ? 'Chọn nghĩa tiếng Việt đúng' : 'Chọn từ tiếng Anh đúng'}
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

      {/* 4 đáp án — câu ví dụ chỉ hiện SAU khi chọn (đã biết đúng/sai thì hiện nguyên văn) */}
      <div className="ex-options">
        {q.options.map((c) => {
          const ex = answered ? exampleOf(c) : null
          let cls = 'ex-option'
          if (answered) {
            if (c.id === q.card.id) cls += ' correct'
            else if (c.id === picked) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button key={c.id} className={cls} onClick={() => choose(c)} disabled={answered}>
              <span className="ex-option-main">
                {en2vi ? c.meaning : c.word}
                {!en2vi && c.pos && <span className="fc-pos">{c.pos}</span>}
              </span>
              {ex && <span className="ex-option-ex">“{ex}”</span>}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="ex-feedback">
          {picked === q.card.id ? (
            <span className="fc-answer-feedback ok">✓ Chính xác!</span>
          ) : (
            <span className="fc-answer-feedback no">
              ✗ Chưa đúng — đáp án: {en2vi ? q.card.meaning : q.card.word}
            </span>
          )}
        </div>
      )}

      {/* 2 nút lùi / qua câu (phím ← → cũng dùng được); câu cuối -> xem kết quả */}
      <div className="review-nav">
        <button className="btn" onClick={goBack} disabled={idx === 0}>
          ← Trước
        </button>
        <span className="review-nav-pos">
          {idx + 1} / {questions.length}
        </span>
        <button className={answered ? 'btn primary' : 'btn'} onClick={goNext}>
          {idx + 1 < questions.length ? 'Tiếp →' : 'Xem kết quả'}
        </button>
      </div>
    </div>
  )
}
