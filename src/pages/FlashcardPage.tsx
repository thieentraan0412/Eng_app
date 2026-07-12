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

  useEffect(() => {
    CloudApi.getDueCards(deck.id)
      .then(setQueue)
      .catch((e) => setError((e as Error).message))
  }, [deck.id])

  const current = queue?.[idx]

  const rate = async (rating: Rating) => {
    if (!current) return
    try {
      await CloudApi.reviewCard(current, rating)
    } catch (e) {
      setError((e as Error).message)
      return
    }
    setDone((d) => d + 1)
    setFlipped(false)
    setIdx((i) => i + 1)
  }

  // Phím tắt: Space lật, 1-4 đánh giá
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return
      if (e.code === 'Space') {
        e.preventDefault()
        setFlipped((f) => !f)
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
        <p className="muted">Bạn đã ôn {done} thẻ trong bộ “{deck.name}”.</p>
        {done === 0 && <p className="muted">Không có thẻ nào đến hạn hôm nay.</p>}
        <button className="btn primary" onClick={onExit}>
          Xong
        </button>
      </div>
    )
  }

  return (
    <div className="page center">
      <div className="review-top">
        <button className="btn tiny" onClick={onExit}>
          ← Thoát
        </button>
        <span className="muted">
          Còn lại {queue.length - idx} · Đã ôn {done}
        </span>
      </div>

      <div className="flashcard" onClick={() => setFlipped((f) => !f)}>
        <div className="fc-word">{current.word}</div>
        {current.phonetic && <div className="fc-phonetic">{current.phonetic}</div>}
        {flipped && (
          <div className="fc-back">
            <div className="fc-meaning">{current.meaning || '(chưa có nghĩa)'}</div>
            {current.example && <div className="fc-example">“{current.example}”</div>}
          </div>
        )}
        {!flipped && <div className="fc-hint">Bấm (hoặc Space) để lật thẻ</div>}
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
    </div>
  )
}
