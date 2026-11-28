// ============================================================
// Mưa từ — game gõ tiếng Anh: từ rơi từ trên xuống, gõ đúng trước khi chạm đáy.
// Ba bước: chọn bộ từ (RainSetup) → chơi (RainStage) → kết quả (RainResults).
// Nguồn từ: bộ thẻ Từ vựng của tài khoản.
// Mỗi lượt chơi lưu một dòng vào bảng typing_sessions (supabase/typing_sessions.sql);
// chưa chạy SQL thì vẫn chơi được, kỷ lục giữ trên máy.
// ============================================================
import { useEffect, useState } from 'react'
import { CloudApi, type DeckStat, type TypingSession } from '../services/cloud/CloudApiClient'
import { errText, isMissingSchema } from '../services/cloud/cloudError'
import { entriesFromCards, MIN_POOL } from '../services/wordRainContent'
import type { RainConfig, RainSummary } from '../services/wordRain'
import type { PageKey } from './pages'
import RainSetup from './wordrain/RainSetup'
import RainStage from './wordrain/RainStage'
import RainResults from './wordrain/RainResults'
import {
  bestKey,
  isNarrowScreen,
  loadBests,
  loadSetup,
  loadSpeak,
  saveBest,
  saveSetup,
  saveSpeak,
  speedOf,
  type RainLaunch,
  type RainSetupState,
} from './wordrain/store'
import '../styles/wordrain.css'

const NEED_SQL = 'Chưa lưu lên cloud — chạy supabase/typing_sessions.sql trong Supabase → SQL Editor để lưu lịch sử và kỷ lục trên mọi thiết bị.'
const WORDS_PER_LEVEL = 10

type Step = 'setup' | 'play' | 'result'

const sourceKeyOf = (s: RainSetupState) => `deck:${s.deckId}`

export default function WordRainPage({ onNavigate }: { onNavigate?: (p: PageKey) => void }) {
  const [step, setStep] = useState<Step>('setup')
  const [setup, setSetup] = useState<RainSetupState>(loadSetup)
  const [speakOn, setSpeakOn] = useState(loadSpeak)
  const [decks, setDecks] = useState<DeckStat[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [recent, setRecent] = useState<TypingSession[] | null>(null)
  const [cloudMissing, setCloudMissing] = useState(false)
  const [bests, setBests] = useState<Record<string, number>>(loadBests)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [launch, setLaunch] = useState<RainLaunch | null>(null)
  const [round, setRound] = useState(0) // đổi key để RainStage khởi tạo lại khi chơi lại
  const [summary, setSummary] = useState<RainSummary | null>(null)
  const [isRecord, setIsRecord] = useState(false)
  const [cloudNote, setCloudNote] = useState<string | null>(null)

  // Nạp danh sách bộ từ + lượt chơi gần đây (một lần khi mở trang)
  useEffect(() => {
    let alive = true
    CloudApi.statsByDeck()
      .then((d) => alive && setDecks(d))
      .catch((e) => {
        if (!alive) return
        setDecks([])
        setLoadError(errText(e))
      })
    loadRecent(() => alive)
    return () => {
      alive = false
    }
  }, [])

  const loadRecent = (alive: () => boolean = () => true) => {
    CloudApi.listTypingSessions(6)
      .then((r) => {
        if (!alive()) return
        setRecent(r)
        // Kỷ lục cloud gộp vào kỷ lục trên máy
        setBests((prev) => {
          const next = { ...prev }
          for (const x of r) {
            const d = (x.data ?? {}) as { speed?: string; lives?: number }
            const k = bestKey(x.mode === 'meaning' ? 'meaning' : 'word', x.source_key, d.speed ?? 'normal', d.lives ?? 5)
            next[k] = Math.max(next[k] ?? 0, x.score)
          }
          return next
        })
      })
      .catch((e) => {
        if (!alive()) return
        setRecent([])
        if (isMissingSchema(e, 'typing_sessions')) setCloudMissing(true)
      })
  }

  // Chọn sẵn bộ đầu tiên khi bộ đã lưu không còn (bị xoá, hết thẻ)
  useEffect(() => {
    if (!decks) return
    const usable = decks.filter((d) => d.total > 0)
    if (usable.length && !usable.some((d) => d.deck_id === setup.deckId)) setSetup((s) => ({ ...s, deckId: usable[0].deck_id }))
  }, [decks, setup.deckId])

  useEffect(() => saveSetup(setup), [setup])

  const best = bests[bestKey(setup.mode, sourceKeyOf(setup), setup.speed, setup.lives)] ?? 0
  const sourceLabel = decks?.find((d) => d.deck_id === setup.deckId)?.name ?? 'Bộ từ vựng'

  const play = (next: RainLaunch) => {
    setLaunch(next)
    setSummary(null)
    setCloudNote(null)
    setIsRecord(false)
    setRound((n) => n + 1)
    setStep('play')
  }

  const start = async () => {
    setStartError(null)
    setStarting(true)
    try {
      const narrow = isNarrowScreen()
      const mode = setup.mode
      const pool = entriesFromCards(await CloudApi.listCards(setup.deckId), mode, narrow)
      if (pool.length < MIN_POOL) {
        setStartError(
          mode === 'meaning'
            ? `Bộ này chỉ có ${pool.length} thẻ có nghĩa dùng được (cần ít nhất ${MIN_POOL}). Thử kiểu "Nhìn chữ gõ chữ" hoặc chọn bộ khác.`
            : `Bộ này chỉ có ${pool.length} từ dùng được (cần ít nhất ${MIN_POOL}). Thêm thẻ ở trang Từ vựng hoặc chọn bộ khác.`,
        )
        return
      }
      const sourceKey = sourceKeyOf(setup)
      const { speed, lives } = setup
      let prevBest = bests[bestKey(mode, sourceKey, speed, lives)] ?? 0
      if (!cloudMissing) {
        try {
          prevBest = Math.max(prevBest, (await CloudApi.bestTypingScore('rain', mode, sourceKey, speed, lives)) ?? 0)
        } catch {
          /* chưa có bảng / mạng lỗi -> dùng kỷ lục trên máy */
        }
      }
      const cfg: RainConfig = { mode, narrow, lives, wordsPerLevel: WORDS_PER_LEVEL, speed: speedOf(speed).mult }
      play({ pool, cfg, kind: 'deck', sourceKey, sourceLabel, speed, prevBest, speak: speakOn, firstLetter: setup.firstLetter, showMeaning: setup.showMeaning })
    } catch (e) {
      setStartError(errText(e))
    } finally {
      setStarting(false)
    }
  }

  const onEnd = (sum: RainSummary) => {
    if (!launch) return
    setSummary(sum)
    setStep('result')
    const record = launch.kind !== 'missed' && sum.score > 0 && sum.score > launch.prevBest
    setIsRecord(record)
    // Lượt "Ôn các từ bị lỡ" không tính kỷ lục chung
    if (launch.kind !== 'missed') {
      saveBest(bestKey(launch.cfg.mode, launch.sourceKey, launch.speed, launch.cfg.lives), sum.score)
      setBests(loadBests())
    }
    // Lưu lên cloud khi đã thật sự chơi (≥ 1 từ hoặc ≥ 15 giây)
    if (sum.words < 1 && sum.durationMs < 15000) return
    if (cloudMissing) {
      setCloudNote(NEED_SQL)
      return
    }
    CloudApi.saveTypingSession({
      game: 'rain',
      mode: launch.cfg.mode,
      source_kind: launch.kind,
      source_key: launch.sourceKey,
      source_label: launch.sourceLabel,
      score: sum.score,
      words: sum.words,
      missed_count: sum.missedCount,
      max_combo: sum.maxCombo,
      level: sum.level,
      wpm: sum.wpm,
      accuracy: sum.accuracy,
      duration_ms: sum.durationMs,
      data: {
        v: 1,
        device: launch.cfg.narrow ? 'phone' : 'pc',
        keys: { ok: sum.okKeys, bad: sum.badKeys },
        ended: sum.ended,
        speed: launch.speed,
        lives: launch.cfg.lives,
        missed: sum.missed.slice(0, 50).map((m) => ({ text: m.text, ...(m.meaning ? { meaning: m.meaning } : {}) })),
      },
    })
      .then(() => loadRecent())
      .catch((e) => {
        if (isMissingSchema(e, 'typing_sessions')) {
          setCloudMissing(true)
          setCloudNote(NEED_SQL)
        } else setCloudNote(`Chưa lưu được lên cloud: ${errText(e)}`)
      })
  }

  const replay = () => launch && play({ ...launch, prevBest: Math.max(launch.prevBest, summary?.score ?? 0) })

  const reviewMissed = () => {
    if (!launch || !summary?.missed.length) return
    play({
      ...launch,
      pool: summary.missed,
      cfg: { ...launch.cfg, finite: true },
      kind: 'missed',
      sourceKey: 'missed',
      sourceLabel: `Ôn từ bị lỡ · ${launch.kind === 'missed' ? launch.sourceLabel.replace(/^Ôn từ bị lỡ · /, '') : launch.sourceLabel}`,
      prevBest: 0,
    })
  }

  if (step === 'play' && launch) return <RainStage key={round} launch={launch} onEnd={onEnd} />

  return (
    <div className="page wr-page">
      <h1 className="page-title">Mưa từ</h1>
      <p className="page-sub">Gõ từ tiếng Anh trước khi chúng rơi chạm đáy. Để rơi từ nào, game nhắc lại từ đó cho bạn học.</p>
      {step === 'result' && summary && launch ? (
        <RainResults
          summary={summary}
          launch={launch}
          isRecord={isRecord}
          cloudNote={cloudNote}
          onReplay={replay}
          onReviewMissed={reviewMissed}
          onChangeSource={() => setStep('setup')}
        />
      ) : (
        <RainSetup
          setup={setup}
          onChange={setSetup}
          decks={decks}
          loadError={loadError}
          speakOn={speakOn}
          onSpeak={(on) => {
            setSpeakOn(on)
            saveSpeak(on)
          }}
          best={best}
          recent={recent}
          starting={starting}
          startError={startError}
          onStart={start}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}
