import { useEffect, useState } from 'react'
import { CloudApi, type Deck, type Card } from '../services/cloud/CloudApiClient'
import { previewInterval, type Rating } from '../services/srs'

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
      if (e.code === 'Space') {
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

      <div className="review-stage">
        <button className="fc-dir-toggle" onClick={toggleFront} title="Đổi chiều học">
          🔁 {frontVi ? 'Việt → Anh' : 'Anh → Việt'}
        </button>

        <div
          className={flipped ? 'flashcard flipped' : 'flashcard'}
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="fc-top">
            {frontVi ? (
              <span className="fc-word">{current.meaning || '(chưa có nghĩa)'}</span>
            ) : (
              <>
                <span className="fc-word">{current.word}</span>
                {current.pos && <span className="fc-pos">{current.pos}</span>}
              </>
            )}
          </div>

          {!flipped && (
            <div className="fc-hint">
              Bấm (hoặc phím Space) để xem {frontVi ? 'từ tiếng Anh' : 'nghĩa'}
            </div>
          )}

          {flipped && (
            <div className="fc-back">
              {frontVi ? (
                <div className="fc-answer">
                  <span className="fc-answer-word">{current.word}</span>
                  {current.pos && <span className="fc-pos">{current.pos}</span>}
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
                        “{ex}”
                      </div>
                    ))}
                </div>
              )}
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
