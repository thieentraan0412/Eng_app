// Mưa từ — màn chọn bộ từ vựng và kiểu chơi.
import Icon from '../../components/Icon'
import type { DeckStat, TypingSession } from '../../services/cloud/CloudApiClient'
import { ttsSupported } from '../../services/tts'
import type { PageKey } from '../pages'
import { fmtScore, LIVES_OPTIONS, SPEEDS, speedOf, type RainSetupState } from './store'

interface Props {
  setup: RainSetupState
  onChange: (next: RainSetupState) => void
  decks: DeckStat[] | null
  loadError: string | null
  speakOn: boolean
  onSpeak: (on: boolean) => void
  best: number
  recent: TypingSession[] | null
  starting: boolean
  startError: string | null
  onStart: () => void
  onNavigate?: (p: PageKey) => void
}

const MODE_LABEL: Record<string, string> = { word: 'Nhìn chữ', meaning: 'Nhìn nghĩa' }

// "Nhìn chữ · Nhanh · 3 mạng" cho một lượt đã lưu (lượt cũ chưa ghi tốc độ / số mạng = Vừa, 5 mạng)
function sessionMeta(r: TypingSession): string {
  const d = (r.data ?? {}) as { speed?: string; lives?: number }
  return `${MODE_LABEL[r.mode] ?? r.mode} · ${speedOf(d.speed).label} · ${d.lives ?? 5} mạng`
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export default function RainSetup(p: Props) {
  const { setup } = p
  const set = (patch: Partial<RainSetupState>) => p.onChange({ ...setup, ...patch })
  const decks = (p.decks ?? []).filter((d) => d.total > 0)
  const canStart = decks.some((d) => d.deck_id === setup.deckId)

  return (
    <div className="wr-setup">
      <section className="wr-card">
        <h2 className="wr-h">Bộ từ vựng</h2>
        {p.loadError && <div className="alert error">{p.loadError}</div>}
        {p.decks === null ? (
          <p className="muted">Đang tải bộ từ…</p>
        ) : decks.length ? (
          <div className="wr-choices">
            {decks.map((d) => (
              <button
                key={d.deck_id}
                type="button"
                className={`wr-choice${setup.deckId === d.deck_id ? ' is-on' : ''}`}
                onClick={() => set({ deckId: d.deck_id })}
              >
                <span className="wr-choice-name">{d.name}</span>
                <span className="wr-choice-meta">{d.total} thẻ</span>
              </button>
            ))}
          </div>
        ) : (
          !p.loadError && (
            <div className="wr-empty">
              <p>Chưa có bộ thẻ nào có từ. Thêm từ vào một bộ ở trang Từ vựng rồi quay lại chơi.</p>
              {p.onNavigate && (
                <div className="wr-empty-actions">
                  <button type="button" className="btn small" onClick={() => p.onNavigate?.('vocabulary')}>
                    Mở Từ vựng
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </section>

      <section className="wr-card">
        <h2 className="wr-h">Kiểu chơi</h2>
        <div className="wr-modes">
          <button type="button" className={`wr-mode${setup.mode === 'word' ? ' is-on' : ''}`} onClick={() => set({ mode: 'word' })}>
            <b>Nhìn chữ gõ chữ</b>
            <span>Từ tiếng Anh rơi xuống — luyện gõ nhanh, đúng chính tả.</span>
          </button>
          <button type="button" className={`wr-mode${setup.mode === 'meaning' ? ' is-on' : ''}`} onClick={() => set({ mode: 'meaning' })}>
            <b>Nhìn nghĩa gõ từ</b>
            <span>Nghĩa tiếng Việt rơi xuống — nhớ và gõ ra từ tiếng Anh. Chỉ dùng các thẻ có nghĩa.</span>
          </button>
        </div>
        <div className="wr-seg-row">
          <span className="wr-seg-label" id="wr-speed-label">
            Tốc độ rơi
          </span>
          <div className="tabs wr-seg" role="radiogroup" aria-labelledby="wr-speed-label">
            {SPEEDS.map((sp) => (
              <button
                key={sp.id}
                type="button"
                role="radio"
                aria-checked={setup.speed === sp.id}
                className={`tab${setup.speed === sp.id ? ' active' : ''}`}
                onClick={() => set({ speed: sp.id })}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
        <div className="wr-seg-row">
          <span className="wr-seg-label" id="wr-lives-label">
            Số mạng
          </span>
          <div className="tabs wr-seg" role="radiogroup" aria-labelledby="wr-lives-label">
            {LIVES_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={setup.lives === n}
                className={`tab${setup.lives === n ? ' active' : ''}`}
                onClick={() => set({ lives: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <p className="wr-note wr-seg-note">Tốc độ và số mạng tính kỷ lục riêng. Từ vẫn rơi nhanh dần sau mỗi 10 từ.</p>
        <div className="wr-opts">
          {ttsSupported && (
            <label className="wr-opt">
              <input type="checkbox" checked={p.speakOn} onChange={(e) => p.onSpeak(e.target.checked)} />
              <span>Đọc to từ khi gõ xong hoặc khi để rơi</span>
            </label>
          )}
          {setup.mode === 'word' && (
            <label className="wr-opt">
              <input type="checkbox" checked={setup.showMeaning} onChange={(e) => set({ showMeaning: e.target.checked })} />
              <span>Hiện nghĩa tiếng Việt dưới từ đang rơi</span>
            </label>
          )}
          {setup.mode === 'meaning' && (
            <label className="wr-opt">
              <input type="checkbox" checked={setup.firstLetter} onChange={(e) => set({ firstLetter: e.target.checked })} />
              <span>Gợi ý chữ cái đầu của từ</span>
            </label>
          )}
        </div>
      </section>

      <div className="wr-start">
        <div className="wr-best">
          <Icon name="star" />
          {p.best > 0 ? (
            <span>
              Kỷ lục với lựa chọn này: <b>{fmtScore(p.best)}</b>
            </span>
          ) : (
            <span>Chưa có kỷ lục với lựa chọn này</span>
          )}
        </div>
        {p.startError && <div className="alert error">{p.startError}</div>}
        <button type="button" className="btn primary wr-start-btn" disabled={!canStart || p.starting} onClick={p.onStart}>
          <Icon name="play" /> {p.starting ? 'Đang chuẩn bị…' : 'Bắt đầu'}
        </button>
        <p className="wr-note">
          Tốc độ {speedOf(setup.speed).label.toLowerCase()} · {setup.lives} mạng · lên cấp sau mỗi 10 từ · Esc để tạm dừng.
        </p>
      </div>

      {p.recent && p.recent.length > 0 && (
        <section className="wr-card">
          <h2 className="wr-h">Lượt chơi gần đây</h2>
          <ul className="wr-recent">
            {p.recent.map((r) => (
              <li key={r.id}>
                <span className="wr-recent-src">
                  {r.source_label || r.source_key}
                  <small>{sessionMeta(r)}</small>
                </span>
                <span className="wr-recent-num">{fmtScore(r.score)} điểm</span>
                <span className="wr-recent-num">{r.words} từ</span>
                <span className="wr-recent-num">{r.wpm} WPM</span>
                <span className="wr-recent-date">{shortDate(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
