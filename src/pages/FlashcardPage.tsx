import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from 'react'
import { CloudApi, type Deck, type Card } from '../services/cloud/CloudApiClient'
import { previewInterval, type Rating } from '../services/srs'
import { speak, stopSpeaking, ttsSupported } from '../services/tts'
import { track } from '../services/studyTracker'
import Icon from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
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

// Tìm ký tự đầu tiên người dùng nhập sai hoặc còn thiếu.
function firstMismatchIndex(answer: string, input: string): number {
  const expected = answer.toLocaleLowerCase()
  const actual = input.toLocaleLowerCase()
  const limit = Math.min(expected.length, actual.length)
  let i = 0
  while (i < limit && expected[i] === actual[i]) i += 1
  return i
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setDecks(null)
    setLoadError(null)
    ;(async () => {
      const ds = await CloudApi.listDecks()
      const withCards = await Promise.all(
        ds.map(async (deck) => ({ deck, cards: await CloudApi.listCards(deck.id) })),
      )
      if (!cancelled) setDecks(withCards)
    })().catch((error) => {
      if (cancelled) return
      setDecks([])
      setLoadError((error as Error).message || 'Không thể tải dữ liệu ôn tập.')
    })
    CloudApi.listReviewProgress()
      .then((rows) => {
        if (!cancelled)
          setRvMap(new Map(rows.map((r) => [r.deck_id, r.data as ReviewSaved])))
      })
      .catch(() => {
        /* offline -> dùng bản local trong rvPick */
      })
    CloudApi.studyStatsByDay(1)
      .then((rows) => {
        if (!cancelled) {
          const cloudCount = rows[rows.length - 1]?.cards_reviewed ?? 0
          setReviewedToday((current) => Math.max(current, cloudCount))
        }
      })
      .catch(() => {
        if (!cancelled) setReviewedToday(0)
      })
    return () => {
      cancelled = true
    }
  }, [session, reloadKey]) // quay lại từ phiên ôn -> tải lại số liệu mới nhất

  const pickDirection = (vi: boolean) => {
    setFrontVi(vi)
    localStorage.setItem('fc_front_vi', vi ? '1' : '0')
  }

  if (session) {
    return (
      <ReviewSession
        deck={session}
        onExit={() => setSession(null)}
        onReviewed={() => setReviewedToday((count) => count + 1)}
      />
    )
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
      {loadError ? (
        <div className="fc-empty">
          <Icon name="alert" />
          <b>Không thể tải dữ liệu ôn tập</b>
          <p>{loadError}</p>
          <button className="fc-btn" type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <Icon name="refresh" /> Thử lại
          </button>
        </div>
      ) : !decks ? (
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
              <button
                key={deck.id}
                className="fc-deck"
                disabled={cards.length === 0}
                onClick={() => setSession(deck)}
              >
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
                    {cards.length === 0 ? (
                      'Chưa thể ôn'
                    ) : (
                      <>
                        Bắt đầu <Icon name="right" />
                      </>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </section>
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

function ReviewSession({
  deck,
  onExit,
  onReviewed,
}: {
  deck: Deck
  onExit: () => void
  onReviewed: () => void
}) {
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
  const [ratingCard, setRatingCard] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState(false)
  // Chế độ Việt→Anh: gõ từ tiếng Anh; đúng thì tự sang từ mới
  // Gắn nội dung nhập với đúng thẻ để sự kiện bàn phím/IME đến trễ từ thẻ cũ
  // không thể làm giá trị đó xuất hiện trên thẻ mới.
  const [typedEntry, setTypedEntry] = useState<{ cardId: string | null; value: string }>({
    cardId: null,
    value: '',
  })
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
  const activeCardIdRef = useRef<string | null>(null)
  const isComposingRef = useRef(false)
  const answerAdvanceTimerRef = useRef<number | null>(null)
  const deletePausedAdvanceRef = useRef(false)
  const ratingRef = useRef(false)
  const savingExRef = useRef(false)
  const deletingCardRef = useRef(false)
  const mountedRef = useRef(true)
  // Vuốt ngang (mobile) để chuyển thẻ
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  // Xóa ngay cả giá trị DOM lẫn state để không có một nhịp nào ô nhập còn giữ từ cũ.
  // Việc này vẫn tái sử dụng cùng input nên không làm đóng bàn phím trên mobile.
  const resetTyping = () => {
    isComposingRef.current = false
    if (answerAdvanceTimerRef.current !== null) {
      window.clearTimeout(answerAdvanceTimerRef.current)
      answerAdvanceTimerRef.current = null
    }
    if (answerRef.current) answerRef.current.value = ''
    setTypedEntry({ cardId: null, value: '' })
    setAnswerState('idle')
    setHintLevel(0)
  }

  const resetCardInput = () => {
    resetTyping()
    setMyEx('')
  }

  const toggleCard = () => {
    // Lật qua lại chỉ đổi mặt thẻ: giữ nguyên nội dung đã gõ, trạng thái đúng/sai
    // và mức gợi ý. Các dữ liệu này chỉ được xóa khi thực sự chuyển/đổi thẻ.
    setFlipped((value) => !value)
  }

  const toggleTyping = () => {
    resetTyping()
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
    resetCardInput()
    setFrontVi((v) => {
      const nv = !v
      localStorage.setItem('fc_front_vi', nv ? '1' : '0')
      return nv
    })
    setFlipped(false)
  }

  const safeExit = () => {
    if (!ratingRef.current && !deletingCardRef.current && !deleteTarget) onExit()
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (answerAdvanceTimerRef.current !== null) {
        window.clearTimeout(answerAdvanceTimerRef.current)
        answerAdvanceTimerRef.current = null
      }
      stopSpeaking()
    }
  }, [])

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
  activeCardIdRef.current = current?.id ?? null
  const typed = current && typedEntry.cardId === current.id ? typedEntry.value : ''

  // Các thẻ đã học qua trong bộ này (tích lũy vĩnh viễn — hiện "Đã học x/y" ở danh sách)
  const seen = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (current) seen.current.add(current.id)
  }, [current])

  // Lưu phiên sau mỗi thao tác: localStorage ngay, cloud debounce 800ms.
  // Hết phiên -> xóa hàng thẻ (lần sau vào lấy thẻ đến hạn mới) nhưng GIỮ danh sách đã học.
  const rvTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!queue) return
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

  // Sang thẻ khác -> xóa nội dung đang nhập trước khi trình duyệt vẽ thẻ mới.
  // Dùng layout effect để người dùng gõ nhanh không bị nối chữ mới vào đáp án của thẻ trước.
  useLayoutEffect(() => {
    resetCardInput()
    // Chỉ chạy khi đổi thẻ; resetCardInput cố ý không nằm trong dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

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

  const scheduleNextCard = () => {
    if (answerAdvanceTimerRef.current !== null) return
    answerAdvanceTimerRef.current = window.setTimeout(() => {
      answerAdvanceTimerRef.current = null
      void rate('good')
    }, 700)
  }

  // Người dùng gõ từ tiếng Anh (chế độ Việt→Anh). Gõ đúng -> tự sang từ mới.
  const onTypeAnswer = (value: string, cardId: string, canAdvance = true) => {
    // Bỏ qua input event còn sót lại từ ô nhập của flashcard trước.
    if (!current || activeCardIdRef.current !== cardId || current.id !== cardId) return
    setTypedEntry({ cardId, value })
    // Người dùng vừa sửa câu trả lời: lần gợi ý kế tiếp bắt đầu từ lỗi mới.
    setHintLevel(0)
    if (norm(value) && norm(value) === norm(current.word)) {
      setAnswerState('correct')
      // Bộ gõ/IME có thể báo đúng trước khi commit từ cuối. Chỉ chuyển thẻ sau compositionend.
      if (canAdvance && !isComposingRef.current) scheduleNextCard()
    } else if (answerState === 'wrong') {
      setAnswerState('idle')
    }
  }

  // Nhấn Enter mà chưa đúng -> báo sai để người dùng thử lại
  const checkAnswer = () => {
    if (!current || !typed.trim() || isComposingRef.current) return
    if (norm(typed) === norm(current.word)) {
      setAnswerState('correct')
      scheduleNextCard()
    } else {
      setAnswerState('wrong')
      // Chấm sai thì tự mở ngay chữ đầu tiên tại vị trí sai/còn thiếu.
      setHintLevel(1)
    }
  }

  const hintMismatch = current ? firstMismatchIndex(current.word, typed) : 0
  // Khoảng trắng luôn được hiển thị nên không chiếm một lượt bấm gợi ý.
  const hintPositions = current
    ? current.word
        .split('')
        .map((ch, i) => ({ ch, i }))
        .filter(({ ch, i }) => i >= hintMismatch && ch !== ' ')
        .map(({ i }) => i)
    : []

  // Gợi ý: lộ thêm một chữ cái kể từ vị trí đầu tiên sai/còn thiếu.
  const revealHint = () => {
    if (!current) return
    setHintLevel((n) => Math.min(n + 1, hintPositions.length))
    answerRef.current?.focus()
  }

  // Giữ phần đã nhập đúng, mở chữ từ vị trí sai, che phần còn lại.
  const maskedWord = current
    ? current.word
        .split('')
        .map((ch, i) => {
          if (ch === ' ' || i < hintMismatch) return ch
          const revealOrder = hintPositions.indexOf(i)
          return revealOrder >= 0 && revealOrder < hintLevel ? ch : '_'
        })
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
    savingExRef.current = true
    setSavingEx(true)
    setError(null)
    try {
      const updated = await CloudApi.updateCardExample(current.id, [...lines, t].join('\n'))
      if (!mountedRef.current) return
      setQueue((q) => (q ? q.map((c) => (c.id === updated.id ? updated : c)) : q))
      setMyEx('')
    } catch (e) {
      if (mountedRef.current) setError((e as Error).message)
    } finally {
      savingExRef.current = false
      if (mountedRef.current) setSavingEx(false)
    }
  }

  async function rate(rating: Rating) {
    if (!current || ratingRef.current || savingExRef.current || deletingCardRef.current) return
    ratingRef.current = true
    setRatingCard(true)
    setError(null)
    // Học lại: chỉ luyện, không ghi SRS
    try {
      if (!practice) {
        const updated = await CloudApi.reviewCard(current, rating)
        track.cards(1) // đếm vào study_stats: 1 thẻ đã ôn thật
        if (!mountedRef.current) return
        onReviewed()
        setQueue((cards) =>
          cards ? cards.map((card) => (card.id === updated.id ? updated : card)) : cards,
        )
      }
      if (!mountedRef.current) return
      setDone((d) => d + 1)
      resetCardInput()
      setFlipped(false)
      setIdx((i) => i + 1)
    } catch (e) {
      if (mountedRef.current) {
        setError((e as Error).message)
        setAnswerState('idle')
      }
    } finally {
      ratingRef.current = false
      if (mountedRef.current) setRatingCard(false)
    }
  }

  // Chuyển thẻ thủ công (không đánh giá, không ghi SRS)
  const goNext = () => {
    if (!queue || ratingRef.current || savingExRef.current || deletingCardRef.current) return
    resetCardInput()
    setFlipped(false)
    setIdx((i) => Math.min(i + 1, queue.length))
  }
  const goBack = () => {
    if (ratingRef.current || savingExRef.current || deletingCardRef.current) return
    resetCardInput()
    setFlipped(false)
    setIdx((i) => Math.max(0, i - 1))
  }

  const askDeleteCurrentCard = () => {
    if (!current || ratingRef.current || savingExRef.current || deletingCardRef.current) return
    // Không để bộ hẹn giờ "gõ đúng -> tự sang thẻ" chấm đúng thẻ trong lúc hộp xác nhận mở.
    deletePausedAdvanceRef.current = answerAdvanceTimerRef.current !== null
    if (answerAdvanceTimerRef.current !== null) {
      window.clearTimeout(answerAdvanceTimerRef.current)
      answerAdvanceTimerRef.current = null
    }
    stopSpeaking()
    setDeleteTarget(current)
  }

  const cancelDeleteCard = () => {
    if (deletingCardRef.current) return
    const targetId = deleteTarget?.id
    setDeleteTarget(null)
    if (
      deletePausedAdvanceRef.current &&
      targetId &&
      current?.id === targetId &&
      answerState === 'correct'
    ) {
      scheduleNextCard()
    }
    deletePausedAdvanceRef.current = false
  }

  const deleteCurrentCard = async () => {
    const target = deleteTarget
    if (!target || !queue || deletingCardRef.current) return

    deletingCardRef.current = true
    setDeletingCard(true)
    setError(null)
    try {
      await CloudApi.deleteCard(target.id)
      if (!mountedRef.current) return

      const targetIndex = queue.findIndex((card) => card.id === target.id)
      const nextQueue = queue.filter((card) => card.id !== target.id)
      deletePausedAdvanceRef.current = false
      seen.current.delete(target.id)
      window.dispatchEvent(new Event('cards-changed'))
      resetCardInput()
      setFlipped(false)
      setQueue(nextQueue)
      setIdx((currentIndex) => {
        if (nextQueue.length === 0) return 0
        const shiftedIndex =
          targetIndex >= 0 && targetIndex < currentIndex
            ? currentIndex - 1
            : currentIndex
        // Giữ nguyên vị trí để thẻ kế tiếp trượt vào; nếu vừa xóa thẻ cuối,
        // cho phép idx === length để đi tới màn hoàn thành thay vì quay ngược.
        return Math.min(Math.max(0, shiftedIndex), nextQueue.length)
      })
      setDeleteTarget(null)
    } catch (e) {
      if (mountedRef.current) {
        setDeleteTarget(null)
        setError(`Không thể xóa thẻ: ${(e as Error).message}`)
        if (
          deletePausedAdvanceRef.current &&
          current?.id === target.id &&
          answerState === 'correct'
        ) {
          scheduleNextCard()
        }
        deletePausedAdvanceRef.current = false
      }
    } finally {
      deletingCardRef.current = false
      if (mountedRef.current) setDeletingCard(false)
    }
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
    if (ratingRef.current) return
    setError(null)
    setPractice(true)
    resetCardInput()
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
      // Hộp xác nhận tự xử lý Esc; không cho phím tắt phía sau đổi/lật thẻ.
      if (deleteTarget) return
      if (!current) return
      // Đang gõ trong ô nhập (VD: ô câu ví dụ) -> không kích hoạt phím tắt
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.preventDefault()
          safeExit()
        }
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        toggleCard()
      } else if (e.key === 'Tab') {
        // Tab cũng lật thẻ (đồng bộ với Tab trong ô nhập — xem onKeyDown của input)
        e.preventDefault()
        toggleCard()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        safeExit()
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        void rate(RATINGS[Number(e.key) - 1].key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, flipped, deleteTarget])

  if (error && !queue) {
    return (
      <div className="page rev-session">
        <div className="fc-empty">
          <Icon name="alert" />
          <b>Không thể mở phiên ôn tập</b>
          <p>{error}</p>
          <button className="fc-btn" type="button" onClick={safeExit}>
            <Icon name="left" /> Quay lại
          </button>
        </div>
      </div>
    )
  }
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
            <button className="fc-btn" onClick={safeExit}>
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
        <button
          className="rev-ibtn danger"
          onClick={safeExit}
          disabled={ratingCard}
          title="Thoát phiên ôn (Esc)"
        >
          <Icon name="x" />
        </button>
        <div className="rev-bar" title={`Còn lại ${total - idx} thẻ`}>
          <div className="rev-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {practice && <span className="fc-badge">Học lại</span>}
        <span className="fc-badge" title="Đã ôn / tổng số thẻ">
          <Icon name="check" /> {done} / {total}
        </span>
        <button
          type="button"
          className="fc-btn fc-btn-sm rev-delete-card"
          onClick={askDeleteCurrentCard}
          disabled={ratingCard || savingEx || deletingCard}
          title={`Xóa thẻ “${current.word}”`}
          aria-label={`Xóa thẻ ${current.word}`}
        >
          <Icon name="trash" /> <span>Xóa thẻ</span>
        </button>
      </div>

      {error && (
        <div className="rev-error alert error">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Đóng thông báo lỗi">
            <Icon name="x" />
          </button>
        </div>
      )}

      <div className="rev-stage" onTouchStart={onStageTouchStart} onTouchEnd={onStageTouchEnd}>
        <div className="rev-toggle-row">
          <button
            className="rev-toggle is-active"
            onClick={toggleFront}
            disabled={ratingCard}
            title="Đổi chiều học"
          >
            <Icon name={frontVi ? 'lang' : 'repeat'} /> {frontVi ? 'Việt → Anh' : 'Anh → Việt'}
          </button>
          <button
            className={showTyping ? 'rev-toggle is-active' : 'rev-toggle'}
            onClick={toggleTyping}
            disabled={ratingCard}
            title={showTyping ? 'Đang hiện ô gõ từ — bấm để ẩn' : 'Ô gõ từ đang ẩn — bấm để hiện'}
          >
            <Icon name="keyboard" /> Gõ từ
          </button>
          <button
            className={showExamples ? 'rev-toggle is-active' : 'rev-toggle'}
            onClick={toggleExamples}
            disabled={ratingCard}
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
            toggleCard()
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
                      key={current.id}
                      ref={answerRef}
                      autoFocus
                      autoComplete="off"
                      name={`flashcard-answer-${current.id}`}
                      placeholder={frontVi ? 'Gõ từ tiếng Anh…' : 'Gõ lại từ để nhớ chính tả…'}
                      value={typed}
                      onFocus={(e) => {
                        // HMR/IME đôi khi giữ giá trị nội bộ của input cũ dù React đã reset state.
                        // Đồng bộ lại DOM ngay khi ô của thẻ mới nhận focus.
                        if (e.currentTarget.value !== typed) e.currentTarget.value = typed
                      }}
                      onBeforeInput={(e) => {
                        // Xóa giá trị DOM cũ trước khi ký tự đầu tiên của thẻ mới được chèn.
                        if (e.currentTarget.value !== typed) e.currentTarget.value = typed
                      }}
                      // Mỗi thẻ dùng một input DOM mới để trình duyệt/IME không khôi phục
                      // giá trị của thẻ trước khi người dùng gõ ký tự đầu tiên.
                      onChange={(e) => {
                        if (answerState !== 'correct') {
                          const composing =
                            isComposingRef.current ||
                            Boolean((e.nativeEvent as InputEvent).isComposing)
                          onTypeAnswer(e.target.value, current.id, !composing)
                        }
                      }}
                      onCompositionStart={() => {
                        isComposingRef.current = true
                      }}
                      onCompositionEnd={(e) => {
                        isComposingRef.current = false
                        onTypeAnswer(e.currentTarget.value, current.id, true)
                      }}
                      onKeyDown={(e) => {
                        if ((e.nativeEvent as KeyboardEvent).isComposing) return
                        // Đang gõ trong ô nhập: Tab = lật thẻ xem nghĩa (lật lại bằng Tab lần
                        // nữa — khi đó focus đã rời input nên phím tắt toàn trang xử lý)
                        if (e.key === 'Tab') {
                          e.preventDefault()
                          toggleCard()
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
                          disabled={hintLevel >= hintPositions.length}
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
              <button
                key={r.key}
                className={`rev-grade rev-g${i + 1}`}
                disabled={ratingCard || savingEx}
                onClick={() => void rate(r.key)}
              >
                <b>{r.label}</b>
                <small>{ratingCard ? 'Đang lưu…' : previewInterval(current, r.key)}</small>
              </button>
            ))}
          </div>
        )}

        <div className="rev-nav">
          <button
            className="fc-btn fc-btn-sm"
            onClick={goBack}
            disabled={idx === 0 || ratingCard || savingEx}
          >
            <Icon name="left" /> Trước
          </button>
          <span className="rev-nav-pos">
            {idx + 1} / {total}
          </span>
          <button
            className="fc-btn fc-btn-sm"
            onClick={goNext}
            disabled={ratingCard || savingEx}
          >
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa thẻ này?"
        body={
          <>
            Thẻ sẽ bị xóa khỏi bộ “{deck.name}” và không còn xuất hiện trong các phiên ôn tập.
            Thao tác này không thể hoàn tác.
          </>
        }
        items={
          deleteTarget
            ? [
                `${deleteTarget.word}${
                  deleteTarget.meaning ? ` — ${deleteTarget.meaning}` : ''
                }`,
              ]
            : undefined
        }
        confirmLabel="Xóa thẻ"
        danger
        busy={deletingCard}
        onConfirm={() => void deleteCurrentCard()}
        onCancel={cancelDeleteCard}
      />
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
