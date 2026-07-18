import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { CloudApi, type Deck, type Card } from '../services/cloud/CloudApiClient'
import { previewInterval, type Rating } from '../services/srs'
import { speak, stopSpeaking, ttsSupported } from '../services/tts'

// Nút 🔊 phát âm 1 lần (câu ví dụ) — dừng nổi bọt để không lật thẻ khi bấm
function SpeakButton({ text }: { text: string }) {
  if (!ttsSupported) return null
  return (
    <button
      type="button"
      className="fc-speak"
      title="Phát âm"
      onClick={(e) => {
        e.stopPropagation()
        speak(text)
      }}
    >
      🔊
    </button>
  )
}

// Nút loa cạnh TỪ: bật/tắt chế độ TỰ PHÁT ÂM (🔊 đang bật, 🔇 đã tắt)
function SpeakToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  if (!ttsSupported) return null
  return (
    <button
      type="button"
      className={on ? 'fc-speak' : 'fc-speak off'}
      title={on ? 'Đang tự phát âm — bấm để tắt' : 'Tự phát âm đang tắt — bấm để bật'}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
    >
      {on ? '🔊' : '🔇'}
    </button>
  )
}

export default function FlashcardPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [session, setSession] = useState<Deck | null>(null)

  useEffect(() => {
    CloudApi.listDecks().then(setDecks)
  }, [])

  if (session) {
    return <ReviewSession deck={session} onExit={() => setSession(null)} />
  }

  return (
    <div className="page">
      <h1 className="page-title">Ôn tập (Flashcard)</h1>
      <p className="muted">Chọn một bộ để bắt đầu ôn những thẻ đến hạn hôm nay.</p>
      {decks.length === 0 && <p className="muted">Chưa có bộ từ. Hãy tạo ở mục Từ vựng.</p>}
      <div className="deck-grid">
        {decks.map((deck) => (
          <button key={deck.id} className="deck-card" onClick={() => setSession(deck)}>
            <div className="deck-name">{deck.name}</div>
            <span className="muted">Bấm để ôn →</span>
          </button>
        ))}
      </div>
    </div>
  )
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
  const answerRef = useRef<HTMLInputElement>(null)
  // Vuốt ngang (mobile) để chuyển thẻ
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const toggleFront = () => {
    setFrontVi((v) => {
      const nv = !v
      localStorage.setItem('fc_front_vi', nv ? '1' : '0')
      return nv
    })
    setFlipped(false)
  }

  useEffect(() => {
    CloudApi.getDueCards(deck.id)
      .then(setQueue)
      .catch((e) => setError((e as Error).message))
  }, [deck.id])

  const current = queue?.[idx]

  // Sang thẻ khác -> xóa nội dung đang nhập dở
  useEffect(() => {
    setMyEx('')
    setTyped('')
    setAnswerState('idle')
    setHintLevel(0)
  }, [idx])

  // Tự focus vào ô gõ từ tiếng Anh mỗi khi qua thẻ mới (cả 2 chiều học)
  useEffect(() => {
    if (!flipped && current) answerRef.current?.focus()
  }, [idx, frontVi, flipped, current])

  // Tự phát âm khi SANG THẺ MỚI ở chiều Anh→Việt (từ hiện ngay mặt trước).
  // Không phụ thuộc `flipped` để lật đi lật lại không đọc lại.
  useEffect(() => {
    if (autoSpeak && !frontVi && current) speak(current.word)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, frontVi, autoSpeak, current?.id])

  // Chiều Việt→Anh: chỉ phát khi LẬT ra đáp án (phát sớm hơn sẽ lộ đáp án)
  useEffect(() => {
    if (autoSpeak && frontVi && flipped && current) speak(current.word)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, frontVi, autoSpeak, current?.id])

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
      <div className="page center">
        <h1 className="page-title">🎉 Hoàn thành!</h1>
        <p className="muted">
          {practice ? 'Đã học lại' : 'Bạn đã ôn'} {done} thẻ trong bộ “{deck.name}”.
        </p>
        {done === 0 && !practice && (
          <p className="muted">Không có thẻ nào đến hạn hôm nay. Bạn có thể học lại cả bộ.</p>
        )}
        <div className="review-actions">
          <button className="btn primary" onClick={restudy}>
            🔁 Học lại cả bộ
          </button>
          <button className="btn" onClick={onExit}>
            Xong
          </button>
        </div>
      </div>
    )
  }

  const total = queue.length
  const pct = total ? Math.round((done / total) * 100) : 0

  // Form tự viết câu ví dụ — dùng ở cả mặt trước lẫn mặt sau thẻ
  const exampleForm = (
    <form
      className="fc-add-example"
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => {
        e.preventDefault()
        saveExample()
      }}
    >
      <input
        placeholder="Viết câu ví dụ của bạn với từ này…"
        value={myEx}
        onChange={(e) => setMyEx(e.target.value)}
      />
      <button className="btn small" type="submit" disabled={savingEx || !myEx.trim()}>
        {savingEx ? 'Đang lưu…' : '+ Lưu ví dụ'}
      </button>
    </form>
  )

  return (
    <div className="review-page">
      <div className="review-bar">
        <button className="btn tiny" onClick={onExit}>
          ← Thoát
        </button>
        <div className="review-progress" title={`${done}/${total}`}>
          <div className="review-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="review-count">
          {practice && <span className="review-mode">Học lại</span>}
          Còn lại {total - idx} · Đã ôn {done}
        </span>
      </div>

      <div className="review-stage" onTouchStart={onStageTouchStart} onTouchEnd={onStageTouchEnd}>
        <button className="fc-dir-toggle" onClick={toggleFront} title="Đổi chiều học">
          🔁 {frontVi ? 'Việt → Anh' : 'Anh → Việt'}
        </button>

        <div
          className={flipped ? 'flashcard flipped' : 'flashcard'}
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
          <div className="fc-top">
            {frontVi ? (
              <span className="fc-word">{current.meaning || '(chưa có nghĩa)'}</span>
            ) : (
              <>
                <span className="fc-word">{current.word}</span>
                {current.pos && <span className="fc-pos">{current.pos}</span>}
                <SpeakToggle on={autoSpeak} onToggle={toggleAutoSpeak} />
              </>
            )}
          </div>

          {!flipped && (
            <>
              {/* Ô gõ từ tiếng Anh — cả 2 chiều học:
                  · Việt→Anh: nhớ lại từ theo nghĩa (có gợi ý lộ dần chữ cái)
                  · Anh→Việt: gõ lại từ đang thấy để nhớ mặt chữ/chính tả
                  Gõ đúng (hoặc Enter khi đúng) -> tự sang từ khác */}
              <form
                className={`fc-answer-form ${answerState}`}
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault()
                  checkAnswer()
                }}
              >
                <input
                  ref={answerRef}
                  key={current.id}
                  autoFocus
                  placeholder={frontVi ? 'Gõ từ tiếng Anh…' : 'Gõ lại từ để nhớ chính tả…'}
                  value={typed}
                  readOnly={answerState === 'correct'}
                  onChange={(e) => onTypeAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    // Đang gõ trong ô nhập: Tab = lật thẻ xem nghĩa (lật lại bằng Tab lần nữa —
                    // khi đó focus đã rời input nên phím tắt toàn trang xử lý)
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      setFlipped((f) => !f)
                    }
                  }}
                />
                {answerState === 'correct' && <span className="fc-answer-feedback ok">✓ Chính xác!</span>}
                {answerState === 'wrong' && <span className="fc-answer-feedback no">✗ Chưa đúng, thử lại</span>}

                {/* Gợi ý chỉ có nghĩa ở chiều Việt→Anh (chiều Anh→Việt từ đã hiện sẵn) */}
                {frontVi && answerState !== 'correct' && (
                  <div className="fc-hint-row">
                    <button
                      type="button"
                      className="btn tiny"
                      onClick={revealHint}
                      disabled={hintLevel >= current.word.length}
                    >
                      💡 Gợi ý
                    </button>
                    {hintLevel > 0 && (
                      <span className="fc-hint-word">
                        {maskedWord} · {current.word.replace(/\s/g, '').length} chữ cái
                      </span>
                    )}
                  </div>
                )}
              </form>
              <div className="fc-hint">
                Bấm thẻ hoặc phím Tab để xem {frontVi ? 'từ tiếng Anh' : 'nghĩa'}
              </div>
            </>
          )}

          {flipped && (
            <div className="fc-back">
              {frontVi ? (
                <div className="fc-answer">
                  <span className="fc-answer-word">{current.word}</span>
                  {current.pos && <span className="fc-pos">{current.pos}</span>}
                  <SpeakToggle on={autoSpeak} onToggle={toggleAutoSpeak} />
                </div>
              ) : (
                <div className="fc-meaning">{current.meaning || '(chưa có nghĩa)'}</div>
              )}
              <ExtraBlock label="Collocation" value={current.collocation} />
              <ExtraBlock label="Pattern" value={current.pattern} />
              {current.example && (
                <div className="fc-examples">
                  {current.example
                    .split('\n')
                    .filter(Boolean)
                    .map((ex, i) => (
                      <div className="fc-example" key={i}>
                        “{ex}” <SpeakButton text={ex} />
                      </div>
                    ))}
                </div>
              )}

              {/* Tự viết câu ví dụ với từ này -> lưu thêm vào thẻ */}
              {exampleForm}
            </div>
          )}
        </div>

        {flipped && (
          <div className="rating-row">
            {RATINGS.map((r) => (
              <button key={r.key} className={`btn rating ${r.cls}`} onClick={() => rate(r.key)}>
                <span>{r.label}</span>
                <small>{previewInterval(current, r.key)}</small>
              </button>
            ))}
          </div>
        )}

        <div className="review-nav">
          <button className="btn" onClick={goBack} disabled={idx === 0}>
            ← Trước
          </button>
          <span className="review-nav-pos">
            {idx + 1} / {total}
          </span>
          <button className="btn" onClick={goNext}>
            Tiếp →
          </button>
        </div>
      </div>
    </div>
  )
}

// Khối phụ (Collocation / Pattern) ở mặt sau thẻ — nhiều giá trị nối bằng xuống dòng
function ExtraBlock({ label, value }: { label: string; value: string | null }) {
  if (!value || value === ',') return null
  const items = value.split('\n').filter(Boolean)
  if (!items.length) return null
  return (
    <div className="fc-extra">
      <span className="fc-tag">{label}</span>
      <span className="fc-vals">
        {items.map((v, i) => (
          <span className="fc-chip" key={i}>
            {v}
          </span>
        ))}
      </span>
    </div>
  )
}
