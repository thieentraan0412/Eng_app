// Mưa từ — màn chơi. Engine ở services/wordRain.ts; ở đây chỉ có vòng lặp khung hình,
// ô nhập và phần vẽ. Vị trí từ ghi thẳng vào style.transform qua ref mỗi khung hình;
// React chỉ vẽ lại khi có sự kiện (từ mới, gõ phím, nổ, rơi mất) để khỏi giật.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import Icon from '../../components/Icon'
import {
  beginCountdown,
  comboMult,
  createRain,
  focusOf,
  pauseRain,
  quitRain,
  stepRain,
  summarizeRain,
  trimBuffer,
  typeChar,
  type RainEvent,
  type RainItem,
  type RainState,
  type RainSummary,
} from '../../services/wordRain'
import { hintMask, sanitizeTyping } from '../../services/wordRainContent'
import { hasVietnameseMarks } from '../../services/translation'
import { speak, stopSpeaking, warmUpSpeech } from '../../services/tts'
import { isDesktop } from '../../platform'
import { fmtScore, isTouchFirst, type RainLaunch } from './store'
import { createRainFx, readFxColors, type RainFx } from './rainFx'

interface Props {
  launch: RainLaunch
  onEnd: (summary: RainSummary) => void
}

// Từ vừa gõ xong: đứng lại tại chỗ (nền xanh "đã khoá mục tiêu") chờ viên đạn cuối bay tới,
// rồi nổ và hiện "+điểm". travel = thời gian đạn bay (ms).
interface Ghost {
  id: number
  text: string
  meaning?: string
  points: number
  x: number
  y: number
  travel: number
}

interface MissToast {
  id: number
  text: string
  note?: string
}

// Không để ô nhập mất focus khi bấm nút / vùng chơi (mất focus = tạm dừng)
const keepFocus = (e: ReactMouseEvent) => e.preventDefault()

export default function RainStage({ launch, onEnd }: Props) {
  const { cfg } = launch
  const stateRef = useRef<RainState | null>(null)
  if (!stateRef.current) stateRef.current = createRain(launch.pool, cfg)
  const s = stateRef.current

  const [, setVer] = useState(0)
  const bump = useCallback(() => setVer((v) => v + 1), [])
  const fieldRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<RainFx | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const els = useRef(new Map<number, HTMLDivElement>())
  const sizes = useRef(new Map<number, { w: number; h: number }>())
  const dims = useRef({ W: 800, H: 500 })
  // Bộ chuyển ô nhập -> phím: `consumed` = số ký tự đầu ô đã dùng xong (chỉ khác 0 khi
  // bộ gõ đang soạn chữ, lúc đó không được ghi đè ô); `prev` = phần còn lại đã xử lý;
  // `kept[i]` = ký tự prev[i] có được nhận vào phần đã gõ không (false = gõ sai, bị bỏ —
  // chỉ còn sót trong ô khi bộ gõ đang soạn chữ). Luôn có: số `true` = s.buffer.length.
  // Chữ thật của ô bị ẩn; thứ người chơi thấy là lớp `wr-inputview` vẽ s.buffer, nên ô
  // luôn chỉ hiện chữ đã nhận: gõ sai không hiện, gõ trúng từ là ô trống ngay — kể cả khi
  // bộ gõ (Gboard, bộ gõ có gạch chân…) chưa cho ghi đè ô.
  const io = useRef({ consumed: 0, prev: '', kept: [] as boolean[], composing: false })
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [toast, setToast] = useState<MissToast | null>(null)
  const [levelFlash, setLevelFlash] = useState<number | null>(null)
  const [imeWarn, setImeWarn] = useState(false)
  const countRef = useRef(0)
  const endedRef = useRef(false)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  // ---------- vị trí ----------
  const place = useCallback((it: RainItem) => {
    const el = els.current.get(it.id)
    if (!el) return
    let sz = sizes.current.get(it.id)
    if (!sz) {
      sz = { w: el.offsetWidth, h: el.offsetHeight }
      sizes.current.set(it.id, sz)
    }
    const { W, H } = dims.current
    const px = Math.min(Math.max(it.x * W - sz.w / 2, 6), Math.max(6, W - sz.w - 6))
    const py = -sz.h + Math.min(1, it.y) * H
    el.style.transform = `translate3d(${px}px, ${py}px, 0)`
    el.classList.toggle('is-danger', it.y > 0.78)
  }, [])

  const screenPos = (it: RainItem) => {
    const sz = sizes.current.get(it.id) ?? { w: 80, h: 40 }
    const { W, H } = dims.current
    return {
      x: Math.min(Math.max(it.x * W, sz.w / 2 + 6), W - sz.w / 2 - 6),
      y: -sz.h / 2 + Math.min(1, it.y) * H,
    }
  }

  // ---------- ô nhập ----------
  const writeBack = useCallback(() => {
    const el = inputRef.current
    const a = io.current
    if (el && el.value !== s.buffer) {
      el.value = s.buffer
      try {
        el.setSelectionRange(s.buffer.length, s.buffer.length)
      } catch {
        /* một số loại input không hỗ trợ chọn vùng */
      }
    }
    a.consumed = 0
    a.prev = s.buffer
    a.kept = Array.from(s.buffer, () => true)
  }, [s])

  const shake = () => {
    const el = wrapRef.current
    if (!el) return
    el.classList.remove('is-shake')
    void el.offsetWidth // khởi động lại animation
    el.classList.add('is-shake')
  }

  const handleEvents = (events: RainEvent[]) => {
    for (const ev of events) {
      if (ev.t === 'hit') {
        const p = screenPos(ev.item)
        // phát đạn cuối: từ đứng lại chờ đạn tới rồi mới nổ
        const travel = fxRef.current?.fire(p.x, p.y, true) ?? 0
        const e = ev.item.entry
        const g: Ghost = { id: ev.item.id, text: e.text, meaning: launch.showMeaning || cfg.mode === 'meaning' ? e.meaning : undefined, points: ev.points, x: p.x, y: p.y, travel }
        setGhosts((list) => [...list, g])
        later(() => setGhosts((list) => list.filter((x) => x !== g)), travel + 800)
        if (launch.speak) speak(ev.item.entry.text, 1)
      } else if (ev.t === 'miss') {
        const e = ev.item.entry
        const t: MissToast = { id: ev.item.id, text: e.text, note: e.meaning }
        setToast(t)
        later(() => setToast((cur) => (cur === t ? null : cur)), 2200)
        if (launch.speak) speak(e.text, 0.9)
      } else if (ev.t === 'level') {
        setLevelFlash(ev.level)
        const lv = ev.level
        later(() => setLevelFlash((cur) => (cur === lv ? null : cur)), 1300)
      } else if (ev.t === 'over') {
        if (!endedRef.current) {
          endedRef.current = true
          later(() => onEndRef.current(summarizeRain(s)), 700)
        }
      }
    }
  }

  // Chữ trong ô thay đổi (gõ, xoá, bộ gõ soạn chữ…) -> so với lần trước, phần mới gõ
  // được đưa vào engine từng ký tự. Chạy cả lúc bộ gõ kết thúc soạn chữ.
  const processInput = (raw: string) => {
    const a = io.current
    if (hasVietnameseMarks(raw)) setImeWarn(true)
    const playing = s.phase === 'playing'
    if (!playing && !a.composing) {
      writeBack()
      return
    }
    const v = sanitizeTyping(raw)
    if (a.consumed > v.length) a.consumed = v.length
    const view = v.slice(a.consumed)
    let k = 0
    while (k < view.length && k < a.prev.length && view[k] === a.prev[k]) k++
    const kept = a.kept.slice(0, k)
    // Xoá lùi ở cuối: mỗi phím xoá là một chữ người chơi NHÌN THẤY. Nếu bộ gõ chỉ xoá
    // ký tự sai (đã ẩn, còn sót trong ô) thì bỏ thêm chữ đã nhận ở cuối cho khớp.
    if (k === view.length && view.length < a.prev.length) {
      let owe = a.prev.length - view.length - a.kept.slice(k).filter(Boolean).length
      for (let j = kept.length - 1; j >= 0 && owe > 0; j--) {
        if (kept[j]) {
          kept[j] = false
          owe--
        }
      }
    }
    trimBuffer(s, kept.filter(Boolean).length)
    const events: RainEvent[] = []
    let start = 0
    let bad = false
    for (let i = k; i < view.length; i++) {
      if (!playing) {
        kept.push(false) // gõ lúc đếm ngược / tạm dừng: bỏ, không phạt
        continue
      }
      // ký tự sai bị bỏ (không vào phần đã gõ), các ký tự sau vẫn tính bình thường
      const r = typeChar(s, view[i], cfg)
      events.push(...r.events)
      kept.push(r.kind === 'ok')
      if (r.kind === 'skip' || r.kind === 'hit') start = i + 1
      else if (r.kind === 'ok') {
        // mỗi chữ đúng: một viên đạn bay tới từ đang nhắm
        const t = focusOf(s)
        if (t) {
          const pos = screenPos(t)
          fxRef.current?.fire(pos.x, pos.y, false, t.id) // đạn đuổi theo từ đang rơi
        }
      } else if (r.kind === 'bad') bad = true
    }
    a.consumed += start
    a.prev = view.slice(start)
    a.kept = kept.slice(start)
    if (!a.composing) writeBack()
    if (bad) {
      shake()
      fxRef.current?.misfire()
    }
    handleEvents(events)
    bump()
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => processInput(e.currentTarget.value)

  // Chữ thật của ô bị ẩn nên giữ con trỏ ở cuối ô — không để chọn / chèn vào giữa chữ
  const pinCaret = () => {
    const el = inputRef.current
    if (!el || io.current.composing) return
    const n = el.value.length
    if (el.selectionStart === n && el.selectionEnd === n) return
    try {
      el.setSelectionRange(n, n)
    } catch {
      /* một số loại input không hỗ trợ chọn vùng */
    }
  }

  // ---------- tạm dừng / tiếp tục ----------
  const pause = useCallback(() => {
    if (s.phase === 'playing' || s.phase === 'countdown') {
      pauseRain(s)
      stopSpeaking()
      bump()
    }
  }, [s, bump])

  // Gọi trong chính hàm xử lý chạm/bấm: iOS chỉ mở bàn phím khi focus nằm trong cùng thao tác
  const resume = () => {
    inputRef.current?.focus()
    if (s.phase === 'ready' || s.phase === 'paused') {
      if (s.phase === 'ready' && isDesktop && launch.speak) warmUpSpeech()
      beginCountdown(s)
      writeBack()
      bump()
    }
  }

  const quit = () => {
    if (endedRef.current) return
    endedRef.current = true
    quitRain(s)
    stopSpeaking()
    onEndRef.current(summarizeRain(s))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      pause()
      return
    }
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Tab') {
      e.preventDefault()
      return
    }
    if (s.phase === 'ready' || s.phase === 'paused') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        resume()
      }
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      trimBuffer(s, 0)
      writeBack()
      bump()
    }
  }

  // ---------- vòng lặp khung hình ----------
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(50, Math.max(0, now - last))
      last = now
      const phase = s.phase
      const hadBuffer = s.buffer
      const events = stepRain(s, dt, cfg)
      if (events.length) {
        // Từ đang gõ vừa rơi mất -> engine đã xoá phần đã gõ; đồng bộ lại ô nhập
        if (hadBuffer && !s.buffer) {
          const a = io.current
          if (a.composing) {
            a.consumed += a.prev.length
            a.prev = ''
            a.kept = []
          } else writeBack()
        }
        handleEvents(events)
      }
      const count = s.phase === 'countdown' ? Math.ceil(s.countdownMs / 600) : 0
      if (events.length || phase !== s.phase || count !== countRef.current) {
        countRef.current = count
        bump()
      }
      for (const it of s.items) place(it)
      const fx = fxRef.current
      const ctx = canvasRef.current?.getContext('2d')
      if (fx && ctx) {
        const f = focusOf(s)
        fx.update(dt, f ? screenPos(f) : null, (id) => {
          const it = s.items.find((x) => x.id === id)
          return it ? screenPos(it) : null
        })
        fx.draw(ctx)
        const o = fx.shakeOffset()
        if (fieldRef.current) fieldRef.current.style.transform = o.x || o.y ? `translate(${o.x}px, ${o.y}px)` : ''
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Kích thước vùng chơi (đổi khi xoay máy / bàn phím ảo mở)
  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    if (!fxRef.current) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      fxRef.current = createRainFx(readFxColors(el), calm)
    }
    const measure = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      dims.current = { W, H }
      const cv = canvasRef.current
      if (cv) {
        const dpr = window.devicePixelRatio || 1
        cv.width = Math.round(W * dpr)
        cv.height = Math.round(H * dpr)
        cv.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      fxRef.current?.resize(W, H)
      for (const it of s.items) place(it)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [s, place])

  // Chế độ tập trung: ẩn thanh bên / thanh trên; tự tạm dừng khi rời cửa sổ
  useEffect(() => {
    document.body.classList.add('wr-focus')
    const onVis = () => {
      if (document.hidden) pause()
    }
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', onVis)
    // Máy tính: vào là chạy luôn. Điện thoại: chờ người chơi chạm "Bắt đầu" để mở bàn phím.
    if (!isTouchFirst()) {
      inputRef.current?.focus()
      if (isDesktop && launch.speak) warmUpSpeech()
      beginCountdown(s)
      bump()
    }
    const pending = timers.current
    return () => {
      document.body.classList.remove('wr-focus')
      window.removeEventListener('blur', pause)
      document.removeEventListener('visibilitychange', onVis)
      pending.forEach((t) => window.clearTimeout(t))
      stopSpeaking()
    }
  }, [])

  // ---------- vẽ ----------
  const focus = focusOf(s)
  const mult = comboMult(s.combo)
  const wpl = cfg.wordsPerLevel
  const levelProgress = ((s.cleared % wpl) / wpl) * 100
  const count = s.phase === 'countdown' ? Math.max(1, Math.ceil(s.countdownMs / 600)) : 0
  const placeholder = cfg.mode === 'meaning' ? 'Gõ từ tiếng Anh của nghĩa đang rơi…' : 'Gõ từ đang rơi…'

  return (
    <div className={`wr-stage${s.phase === 'paused' ? ' is-paused' : ''}`}>
      <div className="wr-hud" onMouseDown={keepFocus}>
        <div className="wr-stat">
          <span>Điểm</span>
          <b>{fmtScore(s.score)}</b>
        </div>
        <div className="wr-stat">
          <span>Cấp</span>
          <b>{s.level}</b>
        </div>
        <div className="wr-stat">
          <span>Từ</span>
          <b>{s.cleared}</b>
        </div>
        <div className={`wr-combo${s.combo >= 2 ? ' is-on' : ''}${mult > 1 ? ' is-hot' : ''}`}>
          <Icon name="flame" />
          <span>
            {s.combo} liên tiếp{mult > 1 ? ` · ×${mult.toLocaleString('vi-VN')}` : ''}
          </span>
        </div>
        <div className="wr-lives" aria-label={`Còn ${s.lives} trên ${cfg.lives} mạng`}>
          {cfg.lives > 5 ? (
            // Nhiều mạng: một trái tim + số, để thanh trên không tràn trên điện thoại
            <>
              <Icon name="heart" className={s.lives > 0 ? 'is-full' : ''} />
              <span className="wr-lives-num">
                {s.lives}/{cfg.lives}
              </span>
            </>
          ) : (
            Array.from({ length: cfg.lives }, (_, i) => <Icon key={i} name="heart" className={i < s.lives ? 'is-full' : ''} />)
          )}
        </div>
        <div className="wr-hud-actions">
          <button type="button" className="wr-icon-btn" onClick={pause} title="Tạm dừng (Esc)" aria-label="Tạm dừng">
            <Icon name="pause" />
          </button>
          <button type="button" className="wr-icon-btn" onClick={quit} title="Kết thúc lượt chơi" aria-label="Kết thúc">
            <Icon name="x" />
          </button>
        </div>
      </div>
      <div className="wr-progress" title="Tiến độ lên cấp">
        <span style={{ width: `${levelProgress}%` }} />
      </div>

      <div className="wr-field" ref={fieldRef} onMouseDown={keepFocus}>
        {s.items.map((it) => {
          const cand = !!s.buffer && it.entry.key.startsWith(s.buffer)
          const n = cand ? s.buffer.length : 0
          const cls = [
            'wr-item',
            cfg.mode === 'meaning' ? 'is-meaning' : '',
            cand ? 'is-cand' : '',
            focus?.id === it.id ? 'is-next' : '',
            it.y > 0.78 ? 'is-danger' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <div
              key={it.id}
              className={cls}
              ref={(el) => {
                if (el) {
                  els.current.set(it.id, el)
                  sizes.current.delete(it.id)
                  place(it)
                } else {
                  els.current.delete(it.id)
                  sizes.current.delete(it.id)
                }
              }}
            >
              {cfg.mode === 'word' ? (
                <>
                  <span className="wr-word">
                    <span className="wr-typed">{it.entry.text.slice(0, n)}</span>
                    {it.entry.text.slice(n)}
                  </span>
                  {launch.showMeaning && it.entry.meaning && <span className="wr-sub">{it.entry.meaning}</span>}
                </>
              ) : (
                <>
                  <span className="wr-mean">{it.entry.meaning}</span>
                  <span className="wr-mask">
                    {hintMask(it.entry.key, n, launch.firstLetter).map((c, i) => (
                      <span key={i} className={c.typed ? 'is-typed' : c.space ? 'is-space' : ''}>
                        {c.space ? ' ' : c.ch}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </div>
          )
        })}

        {ghosts.map((g) => (
          <div key={g.id} className="wr-ghost" style={{ left: g.x, top: g.y, ['--travel' as string]: `${Math.round(g.travel)}ms` }}>
            <div className="wr-item wr-corpse">
              <span className="wr-word">{g.text}</span>
              {g.meaning && <span className="wr-sub">{g.meaning}</span>}
            </div>
            <span className="wr-ghost-pts">+{g.points}</span>
          </div>
        ))}

        <canvas ref={canvasRef} className="wr-fx" aria-hidden="true" />
        <div className="wr-ground" />

        {levelFlash !== null && (
          <div className="wr-levelup" key={levelFlash}>
            Lên cấp {levelFlash}!
          </div>
        )}

        {s.phase === 'countdown' && (
          <div className="wr-overlay is-clear">
            <div className="wr-count" key={count}>
              {count}
            </div>
          </div>
        )}

        {s.phase === 'ready' && (
          <div className="wr-overlay">
            <div className="wr-panel">
              <h3>Sẵn sàng?</h3>
              <p>Gõ từ đang rơi trước khi chạm đáy. Không cần Enter.</p>
              <button type="button" className="btn primary" onClick={resume}>
                <Icon name="play" /> Bắt đầu
              </button>
            </div>
          </div>
        )}

        {s.phase === 'paused' && (
          <div className="wr-overlay">
            <div className="wr-panel">
              <h3>Đang tạm dừng</h3>
              <p>Nhấn Enter hoặc bấm Tiếp tục để chơi tiếp.</p>
              <div className="wr-panel-actions">
                <button type="button" className="btn primary" onClick={resume}>
                  <Icon name="play" /> Tiếp tục
                </button>
                <button type="button" className="btn" onClick={quit}>
                  Kết thúc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="wr-inputbar">
        {imeWarn && (
          <div className="wr-ime" role="alert">
            <Icon name="alert" />
            <span>
              Bộ gõ tiếng Việt đang bật (Telex gộp “oo” thành “ô”). Chuyển sang chế độ gõ tiếng Anh (E) để gõ
              đúng từ.
            </span>
            <button type="button" className="wr-icon-btn" onMouseDown={keepFocus} onClick={() => setImeWarn(false)} aria-label="Ẩn cảnh báo">
              <Icon name="x" />
            </button>
          </div>
        )}
        {/* Từ vừa rơi mất hiện ở đây (ngoài vùng chơi) để không che các từ sắp chạm đáy */}
        <div className={`wr-last${toast ? ' is-miss' : ''}`} role="status">
          {toast ? (
            <>
              <Icon name="x" />
              <b>{toast.text}</b>
              {toast.note && <span> = {toast.note}</span>}
            </>
          ) : s.lastHit ? (
            <>
              <Icon name="check" />
              <b>{s.lastHit.text}</b>
              {s.lastHit.meaning && <span> · {s.lastHit.meaning}</span>}
            </>
          ) : (
            <span>Gõ từ đang rơi — gõ đủ chữ là từ tự nổ.</span>
          )}
        </div>
        <div
          ref={wrapRef}
          className="wr-inputwrap"
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.classList.remove('is-shake')
          }}
        >
          <input
            ref={inputRef}
            className="wr-input"
            type="text"
            inputMode="text"
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            aria-label="Ô gõ từ"
            placeholder={placeholder}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onSelect={pinCaret}
            onBlur={pause}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onCompositionStart={() => {
              io.current.composing = true
            }}
            onCompositionEnd={(e) => {
              io.current.composing = false
              processInput(e.currentTarget.value)
            }}
          />
          {/* Thứ người chơi thấy trong ô: chỉ các chữ đã nhận (xem ghi chú ở `io`) */}
          <div className="wr-inputview" aria-hidden="true">
            {s.buffer ? (
              <>
                <span className="wr-inputview-text">{s.buffer}</span>
                <span className="wr-caret" />
              </>
            ) : (
              <>
                <span className="wr-caret" />
                <span className="wr-inputview-ph">{placeholder}</span>
              </>
            )}
          </div>
        </div>
        <div className="wr-keys">
          <kbd>Esc</kbd> tạm dừng · <kbd>Enter</kbd> xoá chữ đang gõ
        </div>
      </div>
    </div>
  )
}
