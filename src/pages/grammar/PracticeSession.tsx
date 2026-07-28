import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import type { GrammarItem, GrammarTopic } from '../../services/cloud/grammarCloud'
import { KIND_ICON, KIND_LABEL } from '../../services/grammarImport'
import { Hl } from './parts'

export interface SessionCard {
  item: GrammarItem
  topic: GrammarTopic
}

export interface SessionError {
  topicKey: string
  topicName: string
  level: string
  errorTag: string
  itemRef: string
  wrong: string
  right: string
}

export interface SessionResult {
  perTopic: Record<string, { correct: number; total: number }>
  errors: SessionError[]
}

const INSTR: Record<GrammarItem['kind'], string> = {
  cloze: 'Chia / điền từ vào chỗ trống cho đúng.',
  mcq: 'Chọn phương án đúng để hoàn thành câu.',
  correct: 'Bấm vào từ bị sai trong câu, rồi gõ dạng đúng.',
  transform: 'Viết lại câu theo yêu cầu.',
}

// Chuẩn hóa trước khi so đáp án: bỏ dấu câu cuối, hạ chữ thường, don't = do not
function norm(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/n't\b/g, ' not')
    .replace(/[.?!,;]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function matches(value: string, answers: string[]): boolean {
  const v = norm(value)
  if (!v) return false
  return answers.some((a) => norm(a) === v)
}

// Xáo phương án theo id câu (ổn định giữa các lần render, không đổi khi gõ)
function shuffled(options: string[], seed: string): string[] {
  const arr = options.map((o, i) => ({ o, k: (seed.charCodeAt(i % seed.length) * (i + 7)) % 97 }))
  return arr.sort((a, b) => a.k - b.k).map((x) => x.o)
}

export default function PracticeSession({
  cards,
  title,
  onExit,
  onOpenLesson,
}: {
  cards: SessionCard[]
  title: string
  onExit: (result: SessionResult) => void
  onOpenLesson: (topicKey: string) => void
}) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i))
  const [pos, setPos] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [correctNow, setCorrectNow] = useState(false)
  const [userText, setUserText] = useState('')
  const [picked, setPicked] = useState<number | null>(null) // dạng "sửa lỗi": token đã chọn
  const [chosen, setChosen] = useState<number | null>(null) // dạng trắc nghiệm
  const [note, setNote] = useState('')
  const [wrongList, setWrongList] = useState<SessionError[]>([])
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<SessionResult>({ perTopic: {}, errors: [] })

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  // Khóa chấm điểm: chặn bấm nhanh 2 lần cùng một câu (state React cập nhật trễ
  // nên chỉ dựa vào `answered` sẽ ghi trùng lỗi vào sổ).
  const lock = useRef(false)
  const current = cards[order[pos]]
  const item = current?.item
  const topic = current?.topic

  const options = useMemo(
    () => (item?.options ? shuffled(item.options, item.id) : []),
    [item],
  )

  useEffect(() => {
    if (!done) inputRef.current?.focus()
  }, [pos, picked, done])

  // ---------- Dựng câu đầy đủ (hiện trong phản hồi) ----------
  const fullSentence = (it: GrammarItem, answer: string): string => {
    if (it.kind === 'correct' && it.tokens) {
      return it.tokens
        .map((t, i) => (i === it.errIndex ? `{${answer}}` : t))
        .join(' ')
    }
    if (it.kind === 'transform') return `{${answer}}`
    return it.prompt.replace('___', `{${answer}}`)
  }
  const userSentence = (it: GrammarItem, value: string): string => {
    if (it.kind === 'correct' && it.tokens) {
      return it.tokens.map((t, i) => (i === it.errIndex ? `{${value || t}}` : t)).join(' ')
    }
    if (it.kind === 'transform') return `{${value}}`
    return it.prompt.replace('___', `{${value || '…'}}`)
  }

  // ---------- Chấm ----------
  const finish = useCallback(
    (ok: boolean, value: string, extra = '') => {
      if (!item || !topic || lock.current) return
      lock.current = true
      setAnswered(true)
      setCorrectNow(ok)
      setNote(extra)
      if (ok) setScore((s) => s + 1)
      else {
        setWrongList((list) => [
          ...list,
          {
            topicKey: topic.key,
            topicName: topic.name,
            level: topic.level,
            errorTag: item.errorTag || topic.tags[0] || 'Khác',
            itemRef: item.id,
            wrong: userSentence(item, value),
            right: fullSentence(item, item.answers[0]),
          },
        ])
      }
      setResult((r) => {
        const cur = r.perTopic[topic.key] ?? { correct: 0, total: 0 }
        return {
          ...r,
          perTopic: {
            ...r.perTopic,
            [topic.key]: { correct: cur.correct + (ok ? 1 : 0), total: cur.total + 1 },
          },
        }
      })
    },
    [item, topic],
  )

  const submit = useCallback(() => {
    if (!item || answered) return
    if (item.kind === 'mcq') return // chọn là chấm luôn
    if (item.kind === 'correct' && picked === null) return // chưa chọn từ sai
    const value = userText.trim()
    if (!value) {
      inputRef.current?.focus()
      return
    }
    finish(matches(value, item.answers), value)
  }, [item, answered, picked, userText, finish])

  const next = useCallback(() => {
    if (pos + 1 >= order.length) {
      setResult((r) => ({ ...r, errors: wrongList }))
      setDone(true)
      return
    }
    setPos((p) => p + 1)
    lock.current = false
    setAnswered(false)
    setCorrectNow(false)
    setUserText('')
    setPicked(null)
    setChosen(null)
    setNote('')
  }, [pos, order.length, wrongList])

  const pickOption = (i: number) => {
    if (!item || answered) return
    setChosen(i)
    finish(matches(options[i], item.answers), options[i])
  }

  const pickToken = (i: number) => {
    if (!item || answered || picked !== null) return
    if (i !== item.errIndex) {
      finish(false, item.tokens?.[i] ?? '', 'Chỗ sai không nằm ở từ này.')
      setPicked(-1)
      return
    }
    setPicked(i)
  }

  // ---------- Phím tắt ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onExit({ ...result, errors: wrongList })
        return
      }
      if (done || !item) return
      if (e.key === 'Enter') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === 'textarea' && e.shiftKey) return
        e.preventDefault()
        if (answered) next()
        else submit()
        return
      }
      if (!answered && item.kind === 'mcq' && ['1', '2', '3', '4'].includes(e.key)) {
        const i = Number(e.key) - 1
        if (i < options.length) pickOption(i)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // ============================================================
  // MÀN KẾT QUẢ
  // ============================================================
  if (done) {
    const total = order.length
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const msg =
      pct >= 85
        ? 'Rất tốt — chủ điểm này gần như đã vững.'
        : pct >= 60
          ? 'Khá ổn. Vài quy tắc còn lung lay, ôn lại các câu sai là đủ.'
          : 'Còn nhiều chỗ chưa chắc. Nên đọc lại bài học trước khi luyện tiếp.'

    return (
      <div className="gr-focus">
        <header className="gr-focus-bar">
          <button
            className="gr-ibtn"
            aria-label="Thoát"
            onClick={() => onExit({ ...result, errors: wrongList })}
          >
            <Icon name="x" />
          </button>
          <span className="gr-bar">
            <i style={{ width: '100%' }} />
          </span>
          <span className="gr-badge gr-badge-ok">
            <Icon name="check" /> {score} đúng
          </span>
        </header>

        <div className="gr-focus-stage">
          <div className="gr-res">
            <span className="gr-ring gr-ring-lg" style={{ ['--p' as string]: pct }}>
              <span>{pct}%</span>
            </span>
            <div>
              <p className="gr-res-title">
                {score} / {total} câu đúng
              </p>
              <p className="gr-res-sub">{msg}</p>
            </div>

            {wrongList.length > 0 ? (
              <div className="gr-card" style={{ width: '100%' }}>
                <div className="gr-card-head">
                  <h2>
                    <Icon name="flag" /> Đã thêm {wrongList.length} lỗi vào sổ
                  </h2>
                  <span className="gr-hint">Ôn lại sau 1 ngày</span>
                </div>
                {wrongList.map((w, i) => (
                  <div className="gr-res-row" key={i}>
                    <span className="gr-badge gr-badge-err">{w.errorTag}</span>
                    <span className="gr-res-main">
                      <s>
                        <Hl text={w.wrong} as="em" />
                      </s>{' '}
                      →{' '}
                      <b>
                        <Hl text={w.right} as="em" />
                      </b>
                      <span className="gr-res-meta">
                        {w.topicName} · {w.level}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gr-empty" style={{ width: '100%' }}>
                <Icon name="sparkle" />
                <b>Không có lỗi nào mới</b>
                <p>Cả phiên không sai câu nào — sổ lỗi giữ nguyên.</p>
              </div>
            )}

            <div className="gr-q-actions">
              {wrongList.length > 0 && (
                <button
                  className="gr-btn"
                  onClick={() => {
                    const ids = new Set(wrongList.map((w) => w.itemRef))
                    const retry = cards
                      .map((c, i) => ({ c, i }))
                      .filter(({ c }) => ids.has(c.item.id))
                      .map(({ i }) => i)
                    setOrder(retry)
                    setPos(0)
                    setScore(0)
                    setWrongList([])
                    lock.current = false
                    setAnswered(false)
                    setUserText('')
                    setPicked(null)
                    setChosen(null)
                    setDone(false)
                  }}
                >
                  <Icon name="refresh" /> Ôn lại {wrongList.length} câu sai
                </button>
              )}
              <button
                className="gr-btn gr-btn-primary gr-btn-lg"
                onClick={() => onExit({ ...result, errors: wrongList })}
              >
                <Icon name="check" /> Xong
              </button>
            </div>
            <p className="gr-focus-foot">
              <span>
                <span className="gr-kbd">Esc</span> về thư viện chủ điểm
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!item || !topic) return null

  // ============================================================
  // MÀN CÂU HỎI
  // ============================================================
  const [before, after] = item.prompt.split('___')
  const locked = answered

  return (
    <div className="gr-focus">
      <header className="gr-focus-bar">
        <button
          className="gr-ibtn"
          aria-label="Thoát"
          onClick={() => onExit({ ...result, errors: wrongList })}
        >
          <Icon name="x" />
        </button>
        <span className="gr-bar">
          <i style={{ width: `${((pos + (answered ? 1 : 0)) / order.length) * 100}%` }} />
        </span>
        <span className="gr-badge gr-badge-ok">
          <Icon name="check" /> {score} đúng
        </span>
      </header>

      <div className="gr-focus-stage">
        <p className="gr-qnum">
          {title} · Câu {pos + 1} / {order.length}
        </p>

        <div className="gr-qcard">
          <div className="gr-qcard-head">
            <span className="gr-badge gr-badge-accent">
              <Icon name={KIND_ICON[item.kind]} /> {KIND_LABEL[item.kind]}
            </span>
            <span className="gr-badge">{topic.level}</span>
            <span className="gr-q-topic">{topic.name}</span>
          </div>

          <div className="gr-qcard-body">
            <p className="gr-q-instr">{INSTR[item.kind]}</p>

            {item.kind === 'cloze' && (
              <p className="gr-q-sent">
                {before}
                <input
                  ref={(el) => {
                    inputRef.current = el
                  }}
                  className={`gr-blank${answered ? (correctNow ? ' is-right' : ' is-wrong') : ''}`}
                  value={userText}
                  readOnly={locked}
                  placeholder="…"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setUserText(e.target.value)}
                />
                {after}
                {item.cue && <span className="gr-q-cue">{item.cue}</span>}
              </p>
            )}

            {item.kind === 'mcq' && (
              <>
                <p className="gr-q-sent" style={{ marginBottom: 14 }}>
                  {before}
                  <span style={{ color: 'var(--muted)' }}>______</span>
                  {after}
                </p>
                <div className="gr-options">
                  {options.map((o, i) => {
                    const isRight = matches(o, item.answers)
                    const cls = answered
                      ? isRight
                        ? 'gr-opt is-right'
                        : chosen === i
                          ? 'gr-opt is-wrong'
                          : 'gr-opt'
                      : 'gr-opt'
                    return (
                      <button key={o} className={cls} disabled={locked} onClick={() => pickOption(i)}>
                        <span className="gr-opt-key">{i + 1}</span> {o}
                        <Icon name={isRight ? 'check' : 'x'} />
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {item.kind === 'correct' && item.tokens && (
              <div className="gr-toks">
                {item.tokens.map((t, i) =>
                  picked === i && !answered ? (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRef.current = el
                      }}
                      className="gr-blank"
                      value={userText}
                      placeholder={t}
                      autoComplete="off"
                      spellCheck={false}
                      style={{ minWidth: Math.max(t.length + 4, 10) * 9 }}
                      onChange={(e) => setUserText(e.target.value)}
                    />
                  ) : picked === i && answered ? (
                    <input
                      key={i}
                      className={`gr-blank ${correctNow ? 'is-right' : 'is-wrong'}`}
                      value={userText}
                      readOnly
                    />
                  ) : (
                    <button
                      key={i}
                      className={`gr-tok${
                        answered && i === item.errIndex && picked !== i ? ' is-right' : ''
                      }${answered && picked === -1 && i !== item.errIndex ? '' : ''}`}
                      disabled={locked || picked !== null}
                      onClick={() => pickToken(i)}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
            )}

            {item.kind === 'transform' && (
              <>
                <div className="gr-src">
                  <Icon name="file" />
                  <span>{item.prompt}</span>
                </div>
                <textarea
                  ref={(el) => {
                    inputRef.current = el
                  }}
                  className="gr-answer"
                  rows={2}
                  value={userText}
                  readOnly={locked}
                  placeholder="Gõ câu viết lại của bạn…"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setUserText(e.target.value)}
                />
                {item.hint && (
                  <p className="gr-tip">
                    <Icon name="bulb" /> {item.hint}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {answered && (
          <div className={`gr-fb ${correctNow ? 'is-ok' : 'is-err'}`}>
            <div className="gr-fb-head">
              <Icon name={correctNow ? 'check' : 'x'} />
              {correctNow ? 'Chính xác' : 'Chưa đúng'}
            </div>
            <div className="gr-fb-body">
              <p className="gr-fb-sent">
                <HlMark text={fullSentence(item, item.answers[0])} />
              </p>
              {!correctNow && (
                <p className="gr-fb-yours">
                  Bạn viết: <s>{userText || (chosen !== null ? options[chosen] : '—')}</s>
                  {note && ` · ${note}`}
                </p>
              )}
              {item.explain && (
                <p className="gr-fb-why">
                  <b>Vì sao:</b> {item.explain}
                </p>
              )}
            </div>
            <div className="gr-fb-foot">
              <span className="gr-badge">{item.errorTag || topic.tags[0] || topic.group}</span>
              <button className="gr-link" onClick={() => onOpenLesson(topic.key)}>
                Mở bài học “{topic.name}”
              </button>
              {!correctNow && (
                <>
                  <span className="gr-spacer" />
                  <span className="gr-row" style={{ gap: 5 }}>
                    <Icon name="flag" /> Đã thêm vào sổ lỗi · ôn lại sau 1 ngày
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="gr-q-actions">
          {!answered && (
            <button
              className="gr-btn gr-btn-ghost"
              onClick={() => {
                if (item.kind === 'correct') setPicked(item.errIndex ?? -1)
                finish(false, userText, 'bỏ qua')
              }}
            >
              Bỏ qua
            </button>
          )}
          {answered ? (
            <button className="gr-btn gr-btn-primary gr-btn-lg" onClick={next}>
              {pos + 1 >= order.length ? 'Xem kết quả' : 'Câu tiếp theo'} <Icon name="right" />
            </button>
          ) : (
            item.kind !== 'mcq' && (
              <button className="gr-btn gr-btn-primary gr-btn-lg" onClick={submit}>
                Kiểm tra
              </button>
            )
          )}
        </div>

        <p className="gr-focus-foot">
          {item.kind === 'mcq' ? (
            <span>
              Bấm <span className="gr-kbd">1</span>–<span className="gr-kbd">4</span> để chọn
            </span>
          ) : (
            <span>
              <span className="gr-kbd">Enter</span> kiểm tra
            </span>
          )}
          <span>
            <span className="gr-kbd">Enter</span> sang câu tiếp
          </span>
          <span>
            <span className="gr-kbd">Esc</span> thoát
          </span>
        </p>
      </div>
    </div>
  )
}

// Câu đúng đầy đủ: phần { } hiện dạng <mark>
function HlMark({ text }: { text: string }) {
  const parts = String(text).split(/(\{[^{}]*\})/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('{') && p.endsWith('}') ? (
          <mark key={i}>{p.slice(1, -1)}</mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}
