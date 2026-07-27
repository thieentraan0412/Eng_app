import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { CloudApi, type Deck, type Card } from '../services/cloud/CloudApiClient'
import { previewInterval, type Rating } from '../services/srs'
import { speak, stopSpeaking, ttsSupported } from '../services/tts'
import { track } from '../services/studyTracker'
import Icon from '../components/Icon'
import '../styles/flashcard.css'

// Nút loa phát âm 1 lần (câu ví dụ) — dừng nổi bọt để không lật thẻ khi bấm
function SpeakButton({ text }: { text: string }) {
  if (!ttsSupported) return null
  return (
    <button
      type="button"
      className="rev-ibtn"
      title="Phát âm"
      onClick={(e) => {
        e.stopPropagation()
        speak(text)
      }}
    >
      <Icon name="speak" />
    </button>
  )
}

// Nút loa cạnh TỪ: bật/tắt chế độ TỰ PHÁT ÂM (mờ đi khi đã tắt)
function SpeakToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  if (!ttsSupported) return null
  return (
    <button
      type="button"
      className={on ? 'rev-ibtn' : 'rev-ibtn is-off'}
      title={on ? 'Đang tự phát âm — bấm để tắt' : 'Tự phát âm đang tắt — bấm để bật'}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
    >
      <Icon name="speak" />
    </button>
  )
}

// Ngày hôm nay theo GIỜ ĐỊA PHƯƠNG (yyyy-mm-dd) — so với srs_due_date để đếm thẻ đến hạn
function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

// Bộ "Từ đã lưu khi đọc" — hiện icon bóng đèn thay chữ cái đầu (giống mockup)
const SAVED_DECK_NAME = 'Từ đã lưu khi đọc'

export default function FlashcardPage() {
  // Kèm danh sách thẻ từng bộ để hiện tiến độ: đã học bao nhiêu / đến hạn bao nhiêu
  const [decks, setDecks] = useState<{ deck: Deck; cards: Card[] }[] | null>(null)
  const [session, setSession] = useState<Deck | null>(null)
  // Tiến độ ôn trên cloud (chứa danh sách thẻ đã học qua của từng bộ)
  const [rvMap, setRvMap] = useState<Map<string, ReviewSaved>>(() => new Map())
  // Số thẻ đã ôn hôm nay — cho vòng tròn tiến độ ở dải tổng quan
  const [reviewedToday, setReviewedToday] = useState(0)
  // Chiều học chọn trước khi vào phiên (dùng chung khóa với ReviewSession)
  const [frontVi, setFrontVi] = useState(() => localStorage.getItem('fc_front_vi') === '1')

  useEffect(() => {
    ;(async () => {
      const ds = await CloudApi.listDecks()
      const withCards = await Promise.all(
        ds.map(async (deck) => ({ deck, cards: await CloudApi.listCards(deck.id) })),
      )
      setDecks(withCards)
    })().catch(() => setDecks([]))
    CloudApi.listReviewProgress()
      .then((rows) => setRvMap(new Map(rows.map((r) => [r.deck_id, r.data as ReviewSaved]))))
      .catch(() => {
        /* offline -> dùng bản local trong rvPick */
      })
    CloudApi.studyStatsByDay(1)
      .then((rows) => setReviewedToday(rows[rows.length - 1]?.cards_reviewed ?? 0))
      .catch(() => setReviewedToday(0))
  }, [session]) // quay lại từ phiên ôn -> tải lại số liệu mới nhất

  const pickDirection = (vi: boolean) => {
    setFrontVi(vi)
    localStorage.setItem('fc_front_vi', vi ? '1' : '0')
  }

  if (session) {
    return <ReviewSession deck={session} onExit={() => setSession(null)} />
  }

  const today = todayLocal()

  // Số liệu từng bộ + tổng thẻ đến hạn hôm nay
  const rows = (decks ?? []).map(({ deck, cards }) => {
    // "Đã học" = thẻ đã ĐI QUA trong phiên ôn (danh sách `s` lưu cloud/local)
    // hoặc đã bấm đánh giá SRS ít nhất 1 lần (srs_reps > 0)
    const saved = rvPick(deck.id, rvMap.get(deck.id) ?? null)
    const seenSet = new Set(saved?.s ?? [])
    const learned = cards.filter((c) => c.srs_reps > 0 || seenSet.has(c.id)).length
    const due = cards.filter((c) => c.srs_due_date <= today).length
    const pct = cards.length ? Math.round((learned / cards.length) * 100) : 0
    return { deck, cards, learned, due, pct }
  })
  const totalDue = rows.reduce((s, r) => s + r.due, 0)
  // Bộ sẽ mở khi bấm "Ôn ngay": nhiều thẻ đến hạn nhất
  const topDue = rows.filter((r) => r.due > 0).sort((a, b) => b.due - a.due)[0]
  // % tiến độ ôn của HÔM NAY: đã ôn / (đã ôn + còn đến hạn)
  const dayTotal = reviewedToday + totalDue
  const dayPct = dayTotal ? Math.round((reviewedToday / dayTotal) * 100) : 0

  return (
    <div className="page fc-page">
      <div className="fc-head">
        <div>
          <h1>Ôn tập</h1>
          <p>Lịch lặp lại ngắt quãng (SRS) — chọn một bộ để ôn những thẻ đến hạn hôm nay.</p>
        </div>
        <div className="fc-seg">
          <button
            className={frontVi ? '' : 'is-active'}
            onClick={() => pickDirection(false)}
            title="Mặt trước hiện từ tiếng Anh"
          >
            <Icon name="repeat" /> Anh → Việt
          </button>
          <button
            className={frontVi ? 'is-active' : ''}
            onClick={() => pickDirection(true)}
            title="Mặt trước hiện nghĩa tiếng Việt"
          >
            <Icon name="lang" /> Việt → Anh
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------- Tổng quan */}
      {decks && decks.length > 0 && (
        <div className="fc-due-banner">
          <span className="fc-ring" style={{ ['--p' as string]: dayPct }}>
            <span>{dayPct}%</span>
          </span>
          <span className="fc-due-txt">
            <b>
              {totalDue > 0 ? `${totalDue} thẻ đến hạn hôm nay` : 'Không còn thẻ nào đến hạn'}
            </b>
            <span>
              {reviewedToday > 0
                ? `Đã ôn ${reviewedToday} thẻ hôm nay — tiếp tục giữ chuỗi ngày học.`
                : totalDue > 0
                  ? 'Chưa ôn thẻ nào — bắt đầu để giữ chuỗi ngày học.'
                  : 'Bạn đã hoàn thành lịch ôn hôm nay. Có thể học lại cả bộ bất cứ lúc nào.'}
            </span>
          </span>
          <span className="fc-spacer" />
          {topDue && (
            <button
              className="fc-btn fc-btn-primary fc-btn-lg"
              onClick={() => setSession(topDue.deck)}
              title={`Mở bộ nhiều thẻ đến hạn nhất: ${topDue.deck.name}`}
            >
              <Icon name="play" /> Ôn ngay
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------- Chọn bộ */}
      {!decks ? (
        <p className="muted">Đang tải…</p>
      ) : decks.length === 0 ? (
        <div className="fc-empty">
          <Icon name="layers" />
          <b>Chưa có bộ từ nào</b>
          <p>Tạo bộ từ và thêm thẻ ở mục Từ vựng để bắt đầu ôn theo lịch SRS.</p>
        </div>
      ) : (
        <>
          <h2 className="fc-section-label">Chọn bộ để ôn</h2>
          <section className="fc-grid">
            {rows.map(({ deck, cards, learned, due, pct }) => (
              <button key={deck.id} className="fc-deck" onClick={() => setSession(deck)}>
                <span className="fc-deck-top">
                  <span className="fc-deck-mark">
                    {deck.name.trim() === SAVED_DECK_NAME ? (
                      <Icon name="bulb" />
                    ) : (
                      deck.name.trim().charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="fc-deck-txt">
                    <span className="fc-deck-name">{deck.name}</span>
                    <span className="fc-deck-desc">
                      Đã học {learned} / {cards.length} từ · {pct}%
                    </span>
                  </span>
                </span>

                <span className="fc-bar">
                  <i style={{ width: `${pct}%` }} />
                </span>

                <span className="fc-deck-meta">
                  {cards.length === 0 ? (
                    <span className="fc-badge">Chưa có thẻ</span>
                  ) : due > 0 ? (
                    <span className="fc-badge warn dot">{due} đến hạn</span>
                  ) : (
                    <span className="fc-badge ok">
                      <Icon name="check" /> Xong hôm nay
                    </span>
                  )}
                  <span className="fc-deck-go">
                    Bắt đầu <Icon name="right" />
                  </span>
                </span>
              </button>
            ))}
          </section>

          <p className="fc-note">
            <Icon name="bulb" />
            <span>
              Trong phiên ôn bạn có thể bật <b>Gõ từ</b> để tự kiểm tra chính tả, hoặc{' '}
              <b>Ví dụ</b> để xem câu minh họa ở mặt sau. Lật thẻ bằng{' '}
              <span className="fc-kbd">Tab</span>, đánh giá bằng{' '}
              <span className="fc-kbd">1</span>–<span className="fc-kbd">4</span>.
            </span>
          </p>
        </>
      )}
    </div>
  )
}

// ---------- Lưu phiên ôn đang dở (localStorage + Supabase) ----------
// Lưu thứ tự thẻ + thẻ đang học, ghi song song 2 nơi; khi vào đọc bản có `t` mới hơn
// -> app / web PC / điện thoại đều mở đúng thẻ gần nhất đang ôn.
interface ReviewSaved {
  q: string[] // thứ tự id thẻ trong phiên
  cur: string | null // id thẻ đang học
  i: number // vị trí dự phòng (khi thẻ đang học bị xóa)
  d: number // số thẻ đã ôn
  p: boolean // true = chế độ "học lại cả bộ"
  t?: number // thời điểm lưu (ms)
  s?: string[] // id các thẻ ĐÃ HỌC QUA (giữ vĩnh viễn, không xóa khi xong phiên)
}

const rvKey = (deckId: string) => `rv_progress_${deckId}`

function rvLocal(deckId: string): ReviewSaved | null {
  try {
    return JSON.parse(localStorage.getItem(rvKey(deckId)) ?? '') as ReviewSaved
  } catch {
    return null
  }
}

// Gộp tiến độ local vs cloud: lấy bản lưu sau cùng
function rvPick(deckId: string, cloud: ReviewSaved | null): ReviewSaved | null {
  const local = rvLocal(deckId)
  if (local && cloud) return (cloud.t ?? 0) > (local.t ?? 0) ? cloud : local
  return cloud ?? local
}

const RATINGS: { key: Rating; label: string; cls: string }[] = [
  { key: 'again', label: 'Lại (1)', cls: 'again' },
  { key: 'hard', label: 'Khó (2)', cls: 'hard' },
  { key: 'good', label: 'Được (3)', cls: 'good' },
  { key: 'easy', label: 'Dễ (4)', cls: 'easy' },
]

function ReviewSession({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const [queue, setQueue] = useState<Card[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // Chế độ "học lại": ôn qua tất cả thẻ, KHÔNG cập nhật lịch SRS
  const [practice, setPractice] = useState(false)
  // Chiều thẻ: false = Anh→Việt (mặc định); true = Việt→Anh (mặt trước hiện nghĩa)
  const [frontVi, setFrontVi] = useState(() => localStorage.getItem('fc_front_vi') === '1')
  // Câu ví dụ của riêng bạn — nhập ở mặt sau thẻ, lưu thêm vào ví dụ của thẻ
  const [myEx, setMyEx] = useState('')
  const [savingEx, setSavingEx] = useState(false)
  // Chế độ Việt→Anh: gõ từ tiếng Anh; đúng thì tự sang từ mới
  const [typed, setTyped] = useState('')
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  // Số chữ cái đã được gợi ý (lộ dần từ đầu từ)
  const [hintLevel, setHintLevel] = useState(0)
  // Tự phát âm từ tiếng Anh khi từ xuất hiện (mặc định BẬT; bấm loa để tắt)
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('fc_autospeak') !== '0')
  // Bật/tắt ô gõ từ tiếng Anh ở mặt trước (mặc định BẬT; nhớ lựa chọn)
  const [showTyping, setShowTyping] = useState(() => localStorage.getItem('fc_show_typing') !== '0')
  // Bật/tắt câu ví dụ ở mặt sau (cả ví dụ có sẵn lẫn ô tự viết; mặc định BẬT)
  const [showExamples, setShowExamples] = useState(() => localStorage.getItem('fc_show_examples') !== '0')
  const answerRef = useRef<HTMLInputElement>(null)
  // Vuốt ngang (mobile) để chuyển thẻ
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const toggleTyping = () => {
    setShowTyping((v) => {
      const nv = !v
      localStorage.setItem('fc_show_typing', nv ? '1' : '0')
      return nv
    })
  }

  const toggleExamples = () => {
    setShowExamples((v) => {
      const nv = !v
      localStorage.setItem('fc_show_examples', nv ? '1' : '0')
      return nv
    })
  }

  const toggleFront = () => {
    setFrontVi((v) => {
      const nv = !v
      localStorage.setItem('fc_front_vi', nv ? '1' : '0')
      return nv
    })
    setFlipped(false)
  }

  // Vào phiên: có phiên đang dở (local/cloud) -> khôi phục đúng thẻ đang học;
  // không có -> lấy thẻ đến hạn hôm nay như bình thường.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        let cloud: ReviewSaved | null = null
        try {
          cloud = (await CloudApi.getReviewProgress(deck.id)) as ReviewSaved | null
        } catch {
          /* offline / chưa chạy migration -> dùng bản local */
        }
        const saved = rvPick(deck.id, cloud)
        // Khôi phục danh sách thẻ ĐÃ HỌC QUA (kể cả khi phiên cũ đã xong)
        if (saved?.s?.length) seen.current = new Set(saved.s)
        if (saved && saved.q?.length) {
          const all = await CloudApi.listCards(deck.id)
          const byId = new Map(all.map((c) => [c.id, c]))
          // Giữ nguyên thứ tự phiên cũ; thẻ đã bị xóa thì loại khỏi hàng
          const restored = saved.q
            .map((id) => byId.get(id))
            .filter((c): c is Card => Boolean(c))
          let pos = saved.cur ? restored.findIndex((c) => c.id === saved.cur) : -1
          if (pos === -1) pos = Math.min(saved.i ?? 0, restored.length)
          // Các thẻ ĐỨNG TRƯỚC vị trí đang dở chắc chắn đã học qua
          // (bù cho phiên lưu từ phiên bản cũ chưa có danh sách `s`)
          restored.slice(0, pos + 1).forEach((c) => seen.current.add(c.id))
          // Phiên còn thẻ chưa ôn -> tiếp tục đúng chỗ dở
          if (restored.length > 0 && pos < restored.length) {
            if (!alive) return
            setPractice(!!saved.p)
            setDone(saved.d ?? 0)
            setQueue(restored)
            setIdx(pos)
            return
          }
        }
        const due = await CloudApi.getDueCards(deck.id)
        if (alive) setQueue(due)
      } catch (e) {
        if (alive) setError((e as Error).message)
      }
    })()
    return () => {
      alive = false
    }
  }, [deck.id])

  const current = queue?.[idx]

  // Các thẻ đã học qua trong bộ này (tích lũy vĩnh viễn — hiện "Đã học x/y" ở danh sách)
  const seen = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (current) seen.current.add(current.id)
  }, [current])

  // Lưu phiên sau mỗi thao tác: localStorage ngay, cloud debounce 800ms.
  // Hết phiên -> xóa hàng thẻ (lần sau vào lấy thẻ đến hạn mới) nhưng GIỮ danh sách đã học.
  const rvTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!queue || queue.length === 0) return
    window.clearTimeout(rvTimer.current)
    const data: ReviewSaved = current
      ? {
          q: queue.map((c) => c.id),
          cur: current.id,
          i: idx,
          d: done,
          p: practice,
          t: Date.now(),
          s: [...seen.current],
        }
      : { q: [], cur: null, i: 0, d: done, p: practice, t: Date.now(), s: [...seen.current] }
    try {
      localStorage.setItem(rvKey(deck.id), JSON.stringify(data))
    } catch {
      /* localStorage đầy -> bỏ qua */
    }
    rvTimer.current = window.setTimeout(() => {
      CloudApi.saveReviewProgress(deck.id, data).catch(() => {})
    }, 800)
  }, [deck.id, queue, idx, done, practice, current])

  // Sang thẻ khác -> xóa nội dung đang nhập dở
  useEffect(() => {
    setMyEx('')
    setTyped('')
    setAnswerState('idle')
    setHintLevel(0)
  }, [idx])

  // Tự focus vào ô gõ từ tiếng Anh mỗi khi qua thẻ mới (cả 2 chiều học)
  useEffect(() => {
    if (!flipped && current && showTyping) answerRef.current?.focus()
  }, [idx, frontVi, flipped, current, showTyping])

  // Mỗi lần trạng thái hiển thị của thẻ thay đổi, luôn phát từ tiếng Anh nếu:
  // - tự phát âm đang bật; và
  // - từ tiếng Anh đang hiện (Anh→Việt luôn hiện, Việt→Anh chỉ hiện sau khi lật).
  // Hẹn sang lượt render kế tiếp để thẻ đã xuất hiện hoàn chỉnh rồi mới phát âm.
  useEffect(() => {
    if (!autoSpeak || !current || (frontVi && !flipped)) return
    const timer = window.setTimeout(() => speak(current.word), 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, flipped, frontVi, autoSpeak, current?.id])

  // Bật/tắt tự phát âm (nhớ lựa chọn); tắt thì ngừng đọc ngay,
  // bật lại thì đọc luôn từ đang thấy (nếu từ đang hiển thị)
  const toggleAutoSpeak = () => {
    const next = !autoSpeak
    setAutoSpeak(next)
    localStorage.setItem('fc_autospeak', next ? '1' : '0')
    if (!next) stopSpeaking()
    else if (current && (!frontVi || flipped)) speak(current.word)
  }

  // So khớp đáp án tiếng Anh (bỏ hoa/thường, khoảng trắng thừa)
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

  // Người dùng gõ từ tiếng Anh (chế độ Việt→Anh). Gõ đúng -> tự sang từ mới.
  const onTypeAnswer = (value: string) => {
    setTyped(value)
    if (!current) return
    if (norm(value) && norm(value) === norm(current.word)) {
      setAnswerState('correct')
      setTimeout(() => goNext(), 700)
    } else if (answerState === 'wrong') {
      setAnswerState('idle')
    }
  }

  // Nhấn Enter mà chưa đúng -> báo sai để người dùng thử lại
  const checkAnswer = () => {
    if (!current || !typed.trim()) return
    if (norm(typed) === norm(current.word)) {
      setAnswerState('correct')
      setTimeout(() => goNext(), 700)
    } else {
      setAnswerState('wrong')
    }
  }

  // Gợi ý: lộ thêm một chữ cái từ đầu từ mỗi lần bấm
  const revealHint = () => {
    if (!current) return
    setHintLevel((n) => Math.min(n + 1, current.word.length))
    answerRef.current?.focus()
  }

  // Chuỗi che: chữ đã lộ hiển thị, còn lại là "_", giữ nguyên khoảng trắng
  const maskedWord = current
    ? current.word
        .split('')
        .map((ch, i) => (ch === ' ' ? ' ' : i < hintLevel ? ch : '_'))
        .join(' ')
    : ''

  // Lưu câu ví dụ tự nhập: nối thêm vào danh sách ví dụ của thẻ hiện tại
  const saveExample = async () => {
    if (!current) return
    const t = myEx.trim()
    if (!t) return
    const lines = (current.example ?? '').split('\n').filter(Boolean)
    if (lines.includes(t)) {
      setMyEx('')
      return
    }
    setSavingEx(true)
    try {
      const updated = await CloudApi.updateCardExample(current.id, [...lines, t].join('\n'))
      setQueue((q) => (q ? q.map((c) => (c.id === updated.id ? updated : c)) : q))
      setMyEx('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSavingEx(false)
    }
  }

  const rate = async (rating: Rating) => {
    if (!current) return
    // Học lại: chỉ luyện, không ghi SRS
    if (!practice) {
      try {
        await CloudApi.reviewCard(current, rating)
        track.cards(1) // đếm vào study_stats: 1 thẻ đã ôn thật
      } catch (e) {
        setError((e as Error).message)
        return
      }
    }
    setDone((d) => d + 1)
    setFlipped(false)
    setIdx((i) => i + 1)
  }

  // Chuyển thẻ thủ công (không đánh giá, không ghi SRS)
  const goNext = () => {
    if (!queue) return
    setFlipped(false)
    setIdx((i) => Math.min(i + 1, queue.length))
  }
  const goBack = () => {
    setFlipped(false)
    setIdx((i) => Math.max(0, i - 1))
  }

  // Vuốt ngang trên vùng thẻ: trái = từ sau, phải = từ trước.
  // Bỏ qua nếu bắt đầu vuốt trên ô nhập/nút/form (để gõ, bấm bình thường).
  const onStageTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    swiped.current = false // xóa cờ cũ mỗi lần chạm mới (phòng khi click không phát)
    if ((e.target as HTMLElement).closest('input, textarea, button, form')) {
      touchStart.current = null
      return
    }
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onStageTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // Ngang đủ dài và trội hơn dọc -> coi là vuốt chuyển thẻ (không lật thẻ)
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped.current = true
      if (dx < 0) goNext()
      else goBack()
    }
  }

  // Học lại toàn bộ thẻ trong bộ (không đụng tới lịch ôn)
  const restudy = async () => {
    setError(null)
    setPractice(true)
    setFlipped(false)
    setIdx(0)
    setDone(0)
    setQueue(null)
    try {
      setQueue(await CloudApi.listCards(deck.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // Phím tắt: Space lật, 1-4 đánh giá
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return
      // Đang gõ trong ô nhập (VD: ô câu ví dụ) -> không kích hoạt phím tắt
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'Tab') {
        // Tab cũng lật thẻ (đồng bộ với Tab trong ô nhập — xem onKeyDown của input)
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onExit()
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        rate(RATINGS[Number(e.key) - 1].key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, flipped])

  if (error) return <div className="page"><div className="alert error">{error}</div></div>
  if (!queue) return <div className="page"><p className="muted">Đang tải…</p></div>

  if (!current) {
    return (
      <div className="page rev-session">
        <div className="rev-done">
          <Icon name="check" />
          <h1>Hoàn thành!</h1>
          <p>
            {practice ? 'Đã học lại' : 'Bạn đã ôn'} {done} thẻ trong bộ “{deck.name}”.
          </p>
          {done === 0 && !practice && (
            <p>Không có thẻ nào đến hạn hôm nay. Bạn có thể học lại cả bộ.</p>
          )}
          <div className="rev-done-actions">
            <button className="fc-btn fc-btn-primary" onClick={restudy}>
              <Icon name="undo" /> Học lại cả bộ
            </button>
            <button className="fc-btn" onClick={onExit}>
              Xong
            </button>
          </div>
        </div>
      </div>
    )
  }

  const total = queue.length
  const pct = total ? Math.round((done / total) * 100) : 0

  // Form tự viết câu ví dụ — hiện ở mặt sau thẻ
  const exampleForm = (
    <form
      className="rev-add-ex"
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault()
        saveExample()
      }}
    >
      <input
        placeholder="Thêm câu ví dụ của bạn…"
        value={myEx}
        onChange={(e) => setMyEx(e.target.value)}
      />
      <button className="fc-btn fc-btn-sm" type="submit" disabled={savingEx || !myEx.trim()}>
        <Icon name="plus" /> {savingEx ? 'Đang lưu…' : 'Lưu ví dụ'}
      </button>
    </form>
  )

  return (
    <div className="page rev-session">
      <div className="rev-top">
        <button className="rev-ibtn danger" onClick={onExit} title="Thoát phiên ôn (Esc)">
          <Icon name="x" />
        </button>
        <div className="rev-bar" title={`Còn lại ${total - idx} thẻ`}>
          <div className="rev-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {practice && <span className="fc-badge">Học lại</span>}
        <span className="fc-badge" title="Đã ôn / tổng số thẻ">
          <Icon name="check" /> {done} / {total}
        </span>
      </div>

      <div className="rev-stage" onTouchStart={onStageTouchStart} onTouchEnd={onStageTouchEnd}>
        <div className="rev-toggle-row">
          <button className="rev-toggle is-active" onClick={toggleFront} title="Đổi chiều học">
            <Icon name={frontVi ? 'lang' : 'repeat'} /> {frontVi ? 'Việt → Anh' : 'Anh → Việt'}
          </button>
          <button
            className={showTyping ? 'rev-toggle is-active' : 'rev-toggle'}
            onClick={toggleTyping}
            title={showTyping ? 'Đang hiện ô gõ từ — bấm để ẩn' : 'Ô gõ từ đang ẩn — bấm để hiện'}
          >
            <Icon name="keyboard" /> Gõ từ
          </button>
          <button
            className={showExamples ? 'rev-toggle is-active' : 'rev-toggle'}
            onClick={toggleExamples}
            title={showExamples ? 'Đang hiện câu ví dụ — bấm để ẩn' : 'Câu ví dụ đang ẩn — bấm để hiện'}
          >
            <Icon name="file" /> Ví dụ
          </button>
        </div>

        <article
          className="rev-card"
          onClick={() => {
            // Vừa vuốt xong -> bỏ qua cú click (không lật thẻ)
            if (swiped.current) {
              swiped.current = false
              return
            }
            // Đang bôi chữ (để dịch/copy) -> không lật thẻ, để popup dịch hiện lên
            const sel = window.getSelection()
            if (sel && !sel.isCollapsed && sel.toString().trim()) return
            setFlipped((f) => !f)
          }}
        >
          <div className="rev-front">
            <div className="rev-word-row">
              {frontVi ? (
                <span className="rev-word">{current.meaning || '(chưa có nghĩa)'}</span>
              ) : (
                <>
                  <span className="rev-word">{current.word}</span>
                  {current.pos && <span className="rev-pos">{current.pos}</span>}
                  <SpeakToggle on={autoSpeak} onToggle={toggleAutoSpeak} />
                </>
              )}
            </div>

            {!flipped && (
              <>
                {/* Ô gõ từ tiếng Anh — cả 2 chiều học (ẩn/hiện bằng nút "Gõ từ"):
                    · Việt→Anh: nhớ lại từ theo nghĩa (có gợi ý lộ dần chữ cái)
                    · Anh→Việt: gõ lại từ đang thấy để nhớ mặt chữ/chính tả
                    Gõ đúng (hoặc Enter khi đúng) -> tự sang từ khác */}
                {showTyping && (
                  <form
                    className={`rev-typing ${answerState}`}
                    onClick={(e) => e.stopPropagation()}
                    onSubmit={(e) => {
                      e.preventDefault()
                      checkAnswer()
                    }}
                  >
                    <input
                      ref={answerRef}
                      autoFocus
                      placeholder={frontVi ? 'Gõ từ tiếng Anh…' : 'Gõ lại từ để nhớ chính tả…'}
                      value={typed}
                      // Giữ cùng một input và không bật readOnly khi trả lời đúng:
                      // mobile sẽ duy trì focus + bàn phím khi tự chuyển sang thẻ mới.
                      onChange={(e) => {
                        if (answerState !== 'correct') onTypeAnswer(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        // Đang gõ trong ô nhập: Tab = lật thẻ xem nghĩa (lật lại bằng Tab lần
                        // nữa — khi đó focus đã rời input nên phím tắt toàn trang xử lý)
                        if (e.key === 'Tab') {
                          e.preventDefault()
                          setFlipped((f) => !f)
                        }
                      }}
                    />
                    {answerState === 'correct' && (
                      <span className="rev-feedback ok">
                        <Icon name="check" /> Chính xác!
                      </span>
                    )}
                    {answerState === 'wrong' && (
                      <span className="rev-feedback no">
                        <Icon name="x" /> Chưa đúng, thử lại
                      </span>
                    )}

                    {/* Gợi ý chỉ có nghĩa ở chiều Việt→Anh (chiều Anh→Việt từ đã hiện sẵn) */}
                    {frontVi && answerState !== 'correct' && (
                      <div className="rev-hint-row">
                        <button
                          type="button"
                          className="fc-btn fc-btn-sm"
                          onClick={revealHint}
                          disabled={hintLevel >= current.word.length}
                        >
                          <Icon name="bulb" /> Gợi ý
                        </button>
                        {hintLevel > 0 && (
                          <span className="rev-hint-word">
                            {maskedWord} · {current.word.replace(/\s/g, '').length} chữ cái
                          </span>
                        )}
                      </div>
                    )}
                  </form>
                )}
                <p className="rev-hint">
                  <Icon name="eye" /> Bấm thẻ hoặc <span className="fc-kbd">Tab</span> để xem{' '}
                  {frontVi ? 'từ tiếng Anh' : 'nghĩa'}
                </p>
              </>
            )}
          </div>

          {flipped && (
            <div className="rev-back">
              {frontVi ? (
                <div className="rev-answer">
                  <span className="rev-answer-word">{current.word}</span>
                  {current.pos && <span className="rev-pos">{current.pos}</span>}
                  <SpeakToggle on={autoSpeak} onToggle={toggleAutoSpeak} />
                </div>
              ) : (
                <div className="rev-meaning">{current.meaning || '(chưa có nghĩa)'}</div>
              )}
              <ExtraBlock label="Collocation" value={current.collocation} />
              <ExtraBlock label="Pattern" value={current.pattern} pattern />
              {showExamples && current.example && (
                <div className="rev-meta-row">
                  <span className="rev-meta-key">Ví dụ</span>
                  <span className="rev-meta-vals rev-ex-list">
                    {current.example
                      .split('\n')
                      .filter(Boolean)
                      .map((ex, i) => (
                        <span className="rev-ex" key={i}>
                          <span className="rev-ex-txt">{ex}</span>
                          <SpeakButton text={ex} />
                        </span>
                      ))}
                  </span>
                </div>
              )}

              {/* Tự viết câu ví dụ với từ này -> lưu thêm vào thẻ */}
              {showExamples && exampleForm}
            </div>
          )}
        </article>

        {flipped && (
          <div className="rev-grade-row">
            {RATINGS.map((r, i) => (
              <button key={r.key} className={`rev-grade rev-g${i + 1}`} onClick={() => rate(r.key)}>
                <b>{r.label}</b>
                <small>{previewInterval(current, r.key)}</small>
              </button>
            ))}
          </div>
        )}

        <div className="rev-nav">
          <button className="fc-btn fc-btn-sm" onClick={goBack} disabled={idx === 0}>
            <Icon name="left" /> Trước
          </button>
          <span className="rev-nav-pos">
            {idx + 1} / {total}
          </span>
          <button className="fc-btn fc-btn-sm" onClick={goNext}>
            Tiếp <Icon name="right" />
          </button>
        </div>

        <p className="rev-foot">
          <span>
            <span className="fc-kbd">Tab</span> lật thẻ
          </span>
          <span>
            <span className="fc-kbd">1</span>
            <span className="fc-kbd">2</span>
            <span className="fc-kbd">3</span>
            <span className="fc-kbd">4</span> đánh giá
          </span>
          <span>
            <span className="fc-kbd">←</span>
            <span className="fc-kbd">→</span> chuyển thẻ
          </span>
          <span>
            <span className="fc-kbd">Esc</span> thoát
          </span>
        </p>
      </div>
    </div>
  )
}

// Khối phụ (Collocation / Pattern) ở mặt sau thẻ — nhiều giá trị nối bằng xuống dòng
function ExtraBlock({
  label,
  value,
  pattern,
}: {
  label: string
  value: string | null
  pattern?: boolean
}) {
  if (!value || value === ',') return null
  const items = value.split('\n').filter(Boolean)
  if (!items.length) return null
  return (
    <div className="rev-meta-row">
      <span className="rev-meta-key">{label}</span>
      <span className="rev-meta-vals">
        {items.map((v, i) => (
          <span className={pattern ? 'rev-tok is-pattern' : 'rev-tok'} key={i}>
            {v}
          </span>
        ))}
      </span>
    </div>
  )
}
