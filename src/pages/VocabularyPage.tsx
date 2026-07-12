import { useEffect, useState, type FormEvent } from 'react'
import { CloudApi, type Deck, type Card } from '../services/cloud/CloudApiClient'

export default function VocabularyPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [selected, setSelected] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newDeckName, setNewDeckName] = useState('')

  const loadDecks = async () => {
    try {
      setDecks(await CloudApi.listDecks())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    loadDecks()
  }, [])

  const createDeck = async (e: FormEvent) => {
    e.preventDefault()
    if (!newDeckName.trim()) return
    try {
      const deck = await CloudApi.createDeck(newDeckName.trim())
      setNewDeckName('')
      setDecks((d) => [deck, ...d])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const removeDeck = async (deck: Deck) => {
    if (!confirm(`Xóa bộ "${deck.name}"?`)) return
    await CloudApi.deleteDeck(deck.id)
    setDecks((d) => d.filter((x) => x.id !== deck.id))
    if (selected?.id === deck.id) setSelected(null)
  }

  if (selected) {
    return <DeckDetail deck={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="page">
      <h1 className="page-title">Từ vựng</h1>
      {error && <div className="alert error">{error}</div>}

      <form className="inline-form" onSubmit={createDeck}>
        <input
          placeholder="Tên bộ từ mới (VD: IELTS Vocab 1)"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
        />
        <button className="btn primary" type="submit">
          + Tạo bộ
        </button>
      </form>

      {decks.length === 0 ? (
        <p className="muted">Chưa có bộ từ nào. Hãy tạo bộ đầu tiên ở trên.</p>
      ) : (
        <div className="deck-grid">
          {decks.map((deck) => (
            <div key={deck.id} className="deck-card" onClick={() => setSelected(deck)}>
              <div className="deck-name">{deck.name}</div>
              {deck.description && <div className="muted">{deck.description}</div>}
              <button
                className="btn tiny danger"
                onClick={(e) => {
                  e.stopPropagation()
                  removeDeck(deck)
                }}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Chi tiết một bộ: danh sách thẻ + thêm thẻ ----------
function DeckDetail({ deck, onBack }: { deck: Deck; onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ word: '', meaning: '', phonetic: '', example: '' })

  const load = async () => {
    try {
      setCards(await CloudApi.listCards(deck.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id])

  const addCard = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.word.trim()) return
    try {
      const card = await CloudApi.createCard(deck.id, {
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        phonetic: form.phonetic.trim(),
        example: form.example.trim(),
      })
      setCards((c) => [card, ...c])
      setForm({ word: '', meaning: '', phonetic: '', example: '' })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const removeCard = async (id: string) => {
    await CloudApi.deleteCard(id)
    setCards((c) => c.filter((x) => x.id !== id))
  }

  return (
    <div className="page">
      <button className="btn tiny" onClick={onBack}>
        ← Quay lại
      </button>
      <h1 className="page-title">{deck.name}</h1>
      {error && <div className="alert error">{error}</div>}

      <form className="card-form" onSubmit={addCard}>
        <input
          placeholder="Từ tiếng Anh *"
          value={form.word}
          onChange={(e) => setForm({ ...form, word: e.target.value })}
        />
        <input
          placeholder="Nghĩa tiếng Việt"
          value={form.meaning}
          onChange={(e) => setForm({ ...form, meaning: e.target.value })}
        />
        <input
          placeholder="Phiên âm"
          value={form.phonetic}
          onChange={(e) => setForm({ ...form, phonetic: e.target.value })}
        />
        <input
          placeholder="Câu ví dụ"
          value={form.example}
          onChange={(e) => setForm({ ...form, example: e.target.value })}
        />
        <button className="btn primary" type="submit">
          + Thêm thẻ
        </button>
      </form>

      <p className="muted">{cards.length} thẻ</p>
      <div className="card-list">
        {cards.map((card) => (
          <div key={card.id} className="word-card">
            <div className="wc-main">
              <span className="wc-word">{card.word}</span>
              {card.phonetic && <span className="wc-phonetic">{card.phonetic}</span>}
            </div>
            {card.meaning && <div className="wc-meaning">{card.meaning}</div>}
            {card.example && <div className="wc-example">“{card.example}”</div>}
            <button className="btn tiny danger" onClick={() => removeCard(card.id)}>
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
