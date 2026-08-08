import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import {
  isSingleWord,
  translate,
  translateOnline,
  translateToEnglish,
} from '../services/translation'
import {
  lookupWordDetails,
  posDescriptionVi,
  posLabelVi,
  type WordDetails,
} from '../services/dictionaryDetails'
import '../styles/quicktranslate.css'

export type QuickTranslateDirection = 'en-vi' | 'vi-en'

interface Props {
  open: boolean
  hotkey: string
  onClose: () => void
  standalone?: boolean
  focusToken?: number
}

const readDirection = (): QuickTranslateDirection =>
  localStorage.getItem('quick_translate_direction') === 'vi-en' ? 'vi-en' : 'en-vi'

async function getTranslation(
  source: string,
  direction: QuickTranslateDirection,
): Promise<string | null> {
  if (direction === 'vi-en') return translateToEnglish(source)
  if (isSingleWord(source)) {
    const offline = translate(source).vi
    if (offline) return offline
  }
  return translateOnline(source)
}

export default function QuickTranslateModal({
  open,
  hotkey,
  onClose,
  standalone = false,
  focusToken = 0,
}: Props) {
  const [direction, setDirection] = useState<QuickTranslateDirection>(readDirection)
  const [text, setText] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [details, setDetails] = useState<WordDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [activePos, setActivePos] = useState('all')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    requestRef.current += 1
    setLoading(false)
    setResult(null)
    setError('')
    setDetails(null)
    setDetailsLoading(false)
    setActivePos('all')
    if (!open) return
    setDirection(readDirection())
    setCopied(false)
    window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }, [open, focusToken])

  useEffect(() => {
    if (!open) return
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open, onClose])

  // Dừng gõ một nhịp ngắn là dịch. Mỗi lần gõ/đổi chiều sẽ hủy kết quả của
  // yêu cầu trước để bản dịch cũ không ghi đè nội dung mới.
  useEffect(() => {
    if (!open) return
    const source = text.trim()
    const request = ++requestRef.current
    if (!source) {
      setLoading(false)
      setResult(null)
      setError('')
      setDetails(null)
      setDetailsLoading(false)
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      setCopied(false)
      const shouldLoadDetails = direction === 'en-vi' && /^[a-z]+(?:['-][a-z]+)*$/i.test(source)
      setDetails(null)
      setDetailsLoading(shouldLoadDetails)

      if (shouldLoadDetails) {
        void lookupWordDetails(source).then((wordDetails) => {
          if (request !== requestRef.current) return
          setDetailsLoading(false)
          if (wordDetails.groups.length > 0) {
            setDetails(wordDetails)
            setError('')
          }
        })
      }

      const translated = await getTranslation(source, direction)
      if (request !== requestRef.current) return
      setLoading(false)
      if (translated) {
        setResult(translated)
        setError('')
      } else {
        setResult(null)
        setError('Không dịch được. Hãy kiểm tra kết nối mạng và thử lại.')
      }
    }, 380)

    return () => window.clearTimeout(timer)
  }, [direction, open, text])

  const hasQuery = text.trim().length > 0
  const hasOutput = Boolean(loading || result || error || detailsLoading || details)
  const hasDictionary = Boolean(details)

  useEffect(() => {
    if (!standalone || !window.api?.resizeQuickTranslateWindow) return
    void window.api.resizeQuickTranslateWindow(hasQuery)
  }, [hasQuery, standalone])

  if (!open) return null

  const chooseDirection = (next: QuickTranslateDirection) => {
    if (next === direction) {
      inputRef.current?.focus()
      return
    }
    requestRef.current += 1
    setLoading(text.trim().length > 0)
    setDirection(next)
    localStorage.setItem('quick_translate_direction', next)
    window.dispatchEvent(new CustomEvent('quick-translate-direction-changed', { detail: next }))
    setResult(null)
    setError('')
    setDetails(null)
    setDetailsLoading(false)
    setActivePos('all')
    setCopied(false)
    inputRef.current?.focus()
  }

  const copyResult = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Không thể sao chép tự động trên trình duyệt này.')
    }
  }

  const speakWord = () => {
    if (!details || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(details.word)
    utterance.lang = 'en-US'
    utterance.rate = 0.86
    window.speechSynthesis.speak(utterance)
  }

  const visibleGroups = details
    ? activePos === 'all'
      ? details.groups
      : details.groups.filter((group) => group.pos === activePos)
    : []

  return (
    <div className={standalone ? 'qt-backdrop is-window' : 'qt-backdrop'} onMouseDown={onClose}>
      <section
        className={`qt-modal${hasOutput ? ' has-output' : ''}${hasDictionary ? ' has-dictionary' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qt-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="qt-head">
          <span className="qt-head-icon"><Icon name="lang" /></span>
          <span className="qt-head-copy">
            <strong id="qt-title">Dịch nhanh</strong>
            <span>Tự động dịch khi gõ · Tab để đổi chiều</span>
          </span>
          {hotkey && <kbd className="qt-kbd">{hotkey}</kbd>}
          <button className="qt-close" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="x" />
          </button>
        </header>

        <div className="qt-directions" role="group" aria-label="Chọn chiều dịch">
          <button
            type="button"
            className={direction === 'en-vi' ? 'is-active' : ''}
            aria-pressed={direction === 'en-vi'}
            onClick={() => chooseDirection('en-vi')}
          >
            <b>EN</b> Tiếng Anh <Icon name="right" /> <b>VI</b> Tiếng Việt
          </button>
          <button
            type="button"
            className={direction === 'vi-en' ? 'is-active' : ''}
            aria-pressed={direction === 'vi-en'}
            onClick={() => chooseDirection('vi-en')}
          >
            <b>VI</b> Tiếng Việt <Icon name="right" /> <b>EN</b> Tiếng Anh
          </button>
        </div>

        <div className="qt-form">
          <label htmlFor="qt-source">
            {direction === 'en-vi' ? 'Tiếng Anh' : 'Tiếng Việt'}
          </label>
          <textarea
            ref={inputRef}
            id="qt-source"
            value={text}
            rows={2}
            maxLength={1000}
            placeholder={
              direction === 'en-vi'
                ? 'Nhập tiếng Anh cần dịch…'
                : 'Nhập tiếng Việt cần dịch…'
            }
            onChange={(e) => {
              requestRef.current += 1
              setLoading(e.target.value.trim().length > 0)
              setText(e.target.value)
              setResult(null)
              setError('')
              setDetails(null)
              setDetailsLoading(false)
              setActivePos('all')
              setCopied(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault()
                chooseDirection(direction === 'en-vi' ? 'vi-en' : 'en-vi')
              }
            }}
            aria-keyshortcuts="Tab"
          />
          <div className="qt-form-foot">
            <span>Tự dịch sau khi bạn dừng gõ</span>
            <span className="qt-tab-hint"><kbd>Tab</kbd> Đổi chiều dịch</span>
          </div>
        </div>

        <div className="qt-output">
          {(loading || result || error) && !details && (
            <div className={error ? 'qt-result is-error' : 'qt-result'} aria-live="polite">
              <div className="qt-result-head">
                <span>{direction === 'en-vi' ? 'Tiếng Việt' : 'Tiếng Anh'}</span>
                {result && (
                  <button type="button" onClick={copyResult}>
                    <Icon name={copied ? 'check' : 'stack'} /> {copied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                )}
              </div>
              <div className="qt-result-text">
                {loading ? 'Đang dịch…' : error || result}
              </div>
            </div>
          )}

          {(detailsLoading || details) && direction === 'en-vi' && (
            <section className="qt-dictionary" aria-live="polite">
              {detailsLoading && !details ? (
                <div className="qt-dict-loading">
                  <span /> Đang phân tích nghĩa và cách dùng…
                </div>
              ) : details ? (
                <>
                  <header className="qt-dict-hero">
                    <div className="qt-dict-wordline">
                      <strong>{details.word}</strong>
                      {details.phonetic && <em>{details.phonetic}</em>}
                      <button type="button" onClick={speakWord} aria-label={`Phát âm ${details.word}`}>
                        <Icon name="speak" />
                      </button>
                    </div>
                    {result && (
                      <div className="qt-dict-primary">
                        <span>Nghĩa phổ biến</span>
                        <strong>{result}</strong>
                        <button type="button" onClick={copyResult}>
                          <Icon name={copied ? 'check' : 'stack'} />
                          {copied ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    )}
                    {!result && (loading || error) && (
                      <div className={error ? 'qt-dict-status is-error' : 'qt-dict-status'}>
                        {loading && <span />}
                        {loading ? 'Đang dịch nghĩa phổ biến…' : error}
                      </div>
                    )}
                    {details.lemma && (
                      <small>Dạng gốc <b>{details.lemma}</b></small>
                    )}
                  </header>

                  {details.groups.length > 1 && (
                    <nav className="qt-pos-tabs" aria-label="Lọc theo từ loại">
                      <button
                        type="button"
                        className={activePos === 'all' ? 'is-active' : ''}
                        onClick={() => setActivePos('all')}
                      >
                        Tất cả
                      </button>
                      {details.groups.map((group) => (
                        <button
                          type="button"
                          key={group.pos}
                          className={activePos === group.pos ? 'is-active' : ''}
                          onClick={() => setActivePos(group.pos)}
                        >
                          {group.pos} · {posLabelVi(group.pos)}
                        </button>
                      ))}
                    </nav>
                  )}

                  <div className="qt-pos-list">
                    {visibleGroups.map((group) => (
                      <article className="qt-pos-group" key={group.pos}>
                        <div className="qt-pos-head">
                          <span className="qt-pos-code">{group.pos}</span>
                          <span>
                            <strong>{posLabelVi(group.pos)}</strong>
                            <small>{posDescriptionVi(group.pos)}</small>
                          </span>
                          <span className="qt-pos-count">
                            {group.meanings.length} nghĩa
                            {group.usages.length > 0 && ` · ${group.usages.length} cách dùng`}
                          </span>
                        </div>

                        {group.meanings.length > 0 && (
                          <div className="qt-meaning-block">
                            <h4>Các nghĩa thường gặp</h4>
                            <ol className="qt-meanings">
                              {group.meanings.map((meaning) => (
                                <li key={meaning}>{meaning}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {group.usages.length > 0 && (
                          <div className="qt-usage-block">
                            <h4>Định nghĩa và ví dụ</h4>
                            <div className="qt-usages">
                              {group.usages.map((usage, index) => (
                                <div className="qt-usage" key={`${usage.definition}-${index}`}>
                                  <span className="qt-usage-no">{index + 1}</span>
                                  <div>
                                    <b>{usage.definitionVi ?? usage.definition}</b>
                                    {usage.definitionVi && (
                                      <span className="qt-definition-en">{usage.definition}</span>
                                    )}
                                    {usage.example && (
                                      <div className="qt-example">
                                        <span className="qt-example-label">Ví dụ</span>
                                        <p>“{usage.example}”</p>
                                        {usage.exampleVi && <span>{usage.exampleVi}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </section>
          )}
        </div>
      </section>
    </div>
  )
}
