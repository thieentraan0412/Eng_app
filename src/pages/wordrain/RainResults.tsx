// Mưa từ — màn kết quả: điểm, kỷ lục, chỉ số, các từ bị lỡ (kèm nghĩa, nghe lại).
import Icon from '../../components/Icon'
import type { RainSummary } from '../../services/wordRain'
import { speak, ttsSupported } from '../../services/tts'
import { fmtDuration, fmtScore, speedOf, type RainLaunch } from './store'

interface Props {
  summary: RainSummary
  launch: RainLaunch
  isRecord: boolean
  /** Ghi chú về việc lưu lên cloud (chưa chạy SQL, lỗi mạng…); null = đã lưu / không cần lưu */
  cloudNote: string | null
  onReplay: () => void
  onReviewMissed: () => void
  onChangeSource: () => void
}

const ENDED: Record<RainSummary['ended'], string> = {
  lives: 'Hết mạng',
  done: 'Đã ôn hết danh sách',
  quit: 'Đã dừng giữa chừng',
}

export default function RainResults({ summary: r, launch, isRecord, cloudNote, onReplay, onReviewMissed, onChangeSource }: Props) {
  const stats: [string, string][] = [
    ['Từ đã gõ', String(r.words)],
    ['WPM', String(r.wpm)],
    ['Chính xác', r.accuracy === null ? '—' : `${r.accuracy}%`],
    ['Combo cao nhất', String(r.maxCombo)],
    ['Cấp đạt được', String(r.level)],
    ['Thời gian', fmtDuration(r.durationMs)],
  ]
  return (
    <div className="wr-results">
      <section className="wr-card wr-score-card">
        <div className="wr-ended">
          {ENDED[r.ended]} · {launch.sourceLabel} · {speedOf(launch.speed).label} · {launch.cfg.lives} mạng
        </div>
        <div className="wr-score">{fmtScore(r.score)}</div>
        <div className="wr-score-label">điểm</div>
        {isRecord ? (
          <div className="wr-record">
            <Icon name="star" /> Kỷ lục mới!
          </div>
        ) : launch.prevBest > 0 ? (
          <div className="wr-prev">Kỷ lục: {fmtScore(launch.prevBest)}</div>
        ) : null}
        <div className="wr-stats">
          {stats.map(([k, v]) => (
            <div key={k} className="wr-statbox">
              <b>{v}</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
        <div className="wr-result-actions">
          <button type="button" className="btn primary" onClick={onReplay} autoFocus>
            <Icon name="refresh" /> Chơi lại
          </button>
          {r.missed.length > 0 && (
            <button type="button" className="btn" onClick={onReviewMissed}>
              <Icon name="repeat" /> Ôn các từ bị lỡ ({r.missed.length})
            </button>
          )}
          <button type="button" className="btn" onClick={onChangeSource}>
            Đổi bộ từ
          </button>
        </div>
        {cloudNote && <p className="wr-cloud-note">{cloudNote}</p>}
      </section>

      {r.missed.length > 0 && (
        <section className="wr-card">
          <h2 className="wr-h">Từ bị lỡ</h2>
          <ul className="wr-missed">
            {r.missed.map((m) => (
              <li key={m.key}>
                {ttsSupported && (
                  <button type="button" className="wr-icon-btn" onClick={() => speak(m.text)} title="Nghe" aria-label={`Nghe ${m.text}`}>
                    <Icon name="speak" />
                  </button>
                )}
                <b>{m.text}</b>
                {m.meaning && <span className="wr-missed-mean">{m.meaning}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
