import { useEffect, useState, type FormEvent } from 'react'
import { CloudApi, type Reading } from '../services/cloud/CloudApiClient'

// Trang Đọc — danh sách bài đọc (lưu cloud); mở bài để đọc + bôi màu tra từ.
export default function ReadingPage() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [selected, setSelected] = useState<Reading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const load = async () => {
    try {
      setReadings(await CloudApi.listReadings())
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    try {
      const r = await CloudApi.createReading(form.title.trim(), form.content.trim())
      setReadings((x) => [r, ...x])
      setForm({ title: '', content: '' })
      setAdding(false)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const remove = async (r: Reading) => {
    if (!confirm(`Xóa bài "${r.title}"?`)) return
    await CloudApi.deleteReading(r.id)
    setReadings((x) => x.filter((y) => y.id !== r.id))
  }

  if (selected) {
    return (
      <div className="page">
        <button className="btn tiny" onClick={() => setSelected(null)}>
          ← Danh sách bài đọc
        </button>
        <h1 className="page-title">{selected.title}</h1>
        <p className="muted">💡 Bôi/tô một từ tiếng Anh để xem nghĩa tiếng Việt.</p>
        <div className="reading-text">{selected.content}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Đọc & tra từ</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="toolbar">
        <button className="btn primary" onClick={() => setAdding((a) => !a)}>
          {adding ? '× Đóng' : '+ Thêm bài đọc'}
        </button>
      </div>

      {adding && (
        <form className="card-form" onSubmit={create} style={{ flexDirection: 'column' }}>
          <input
            placeholder="Tiêu đề bài đọc"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="reading-editor"
            placeholder="Dán/nhập nội dung tiếng Anh…"
            rows={8}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <button className="btn primary" type="submit">
            Lưu bài đọc
          </button>
        </form>
      )}

      {readings.length === 0 ? (
        <p className="muted">Chưa có bài đọc nào. Thêm bài đầu tiên để luyện đọc & tra từ.</p>
      ) : (
        <div className="deck-grid">
          {readings.map((r) => (
            <div key={r.id} className="deck-card" onClick={() => setSelected(r)}>
              <div className="deck-name">{r.title}</div>
              <span className="muted">{(r.content ?? '').slice(0, 60)}…</span>
              <button
                className="btn tiny danger"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(r)
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
