import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import {
  hasVietnameseMarks,
  isAllProperNouns,
  isSingleWord,
  translate,
  translateOnlineDetailed,
  translateToEnglishDetailed,
  type TranslateOutcome,
} from '../services/translation'
import {
  lookupWordDetails,
  posDescriptionVi,
  posLabelVi,
  type WordDetails,
} from '../services/dictionaryDetails'
import { speak, stopSpeaking, ttsSupported } from '../services/tts'
import '../styles/quicktranslate.css'

export type QuickTranslateDirection = 'en-vi' | 'vi-en'

// Từ đơn tiếng Anh -> có bảng từ điển -> cửa sổ nổi cần rộng để xếp 2 cột.
const SINGLE_WORD = /^[a-z]+(?:['-][a-z]+)*$/i

interface Props {
  open: boolean
  hotkey: string
  onClose: () => void
  standalone?: boolean
  focusToken?: number
  /** Chữ đang bôi đen lúc gọi phím tắt — đổ sẵn vào ô nhập, rỗng thì giữ chữ cũ. */
  seedText?: string
}

const readDirection = (): QuickTranslateDirection =>
  localStorage.getItem('quick_translate_direction') === 'vi-en' ? 'vi-en' : 'en-vi'

async function getTranslation(
  source: string,
  direction: QuickTranslateDirection,
): Promise<TranslateOutcome> {
  if (direction === 'vi-en') return translateToEnglishDetailed(source)
  if (isSingleWord(source)) {
    const offline = translate(source).vi
    if (offline) return { status: 'ok', text: offline }
  }
  return translateOnlineDetailed(source)
}

// Dịch vụ trả lời bình thường nhưng không có nghĩa nào khác chữ gốc: chữ gõ sai,
// tên riêng, viết tắt, ký hiệu. Báo đúng như vậy thay vì đổ cho mạng.
function noMeaningMessage(source: string, direction: QuickTranslateDirection): string {
  const target = direction === 'vi-en' ? 'tiếng Anh' : 'tiếng Việt'
  return `Không tìm thấy nghĩa ${target} của “${source}”. Có thể là chữ gõ sai, tên riêng hoặc viết tắt.`
}

// Bản dịch ra y hệt chữ đã nhập. Đó là kết quả đúng (tên riêng giữ nguyên, hoặc
// câu vốn đã là tiếng đích), nhưng nhìn vào thì tưởng app chưa dịch — nên nói rõ
// lý do và chỉ luôn cách sửa nếu là chọn nhầm chiều.
function unchangedNote(source: string, direction: QuickTranslateDirection): string {
  if (isAllProperNouns(source)) return 'Đây là tên riêng hoặc viết tắt nên được giữ nguyên.'
  if (direction === 'vi-en' && !hasVietnameseMarks(source))
    return 'Chữ bạn nhập gần như đã là tiếng Anh nên được giữ nguyên. Bấm Tab để đổi sang chiều EN → VI.'
  if (direction === 'en-vi' && hasVietnameseMarks(source))
    return 'Chữ bạn nhập đã là tiếng Việt nên được giữ nguyên. Bấm Tab để đổi sang chiều VI → EN.'
  return 'Các phần được giữ nguyên thường là tên riêng, viết tắt hoặc chữ gõ sai.'
}

export default function QuickTranslateModal({
  open,
  hotkey,
  onClose,
  standalone = false,
  focusToken = 0,
  seedText = '',
}: Props) {
  const [direction, setDirection] = useState<QuickTranslateDirection>(readDirection)
  const [text, setText] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Ghi chú đi kèm bản dịch giữ nguyên văn — xem unchangedNote.
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [details, setDetails] = useState<WordDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [activePos, setActivePos] = useState('all')
  // Nút nào đang đọc: chữ đã nhập, bản dịch, hay từ trong thẻ từ điển
  const [speaking, setSpeaking] = useState<'source' | 'result' | 'word' | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const posListRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef(0)
  // Mỗi lượt đọc một mã: lượt cũ bị ngắt xong mới báo "hết" thì bỏ qua
  const speakIdRef = useRef(0)
  // Từ điển có ra nghĩa hay không — để khỏi báo "không tìm thấy nghĩa" đè lên
  // bảng nghĩa đang hiện.
  const hasDetailsRef = useRef(false)
  // Đọc qua ref để lần mở nào cũng nhận chữ mới nhất mà không thêm phụ thuộc
  // vào effect (thay đổi giữa chừng sẽ xoá mất kết quả đang hiện).
  const seedRef = useRef(seedText)
  seedRef.current = seedText

  useEffect(() => {
    requestRef.current += 1
    setLoading(false)
    setResult(null)
    setError('')
    setNote('')
    setDetails(null)
    hasDetailsRef.current = false
    setDetailsLoading(false)
    setActivePos('all')
    if (!open) return
    setDirection(readDirection())
    setCopied(false)
    const seed = seedRef.current.trim()
    if (seed) setText(seed)
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

  // Đóng cửa sổ thì ngừng đọc
  useEffect(() => {
    if (open) return
    speakIdRef.current += 1
    setSpeaking(null)
    stopSpeaking()
  }, [open])

  // Dừng gõ một nhịp ngắn là dịch. Mỗi lần gõ/đổi chiều sẽ hủy kết quả của
  // yêu cầu trước để bản dịch cũ không ghi đè nội dung mới. Bật lại cửa sổ
  // (focusToken) cũng dịch lại chữ đang có, vì lượt reset ở trên đã xoá kết quả
  // cũ — nếu không sẽ thấy chữ trong ô nhập mà khung kết quả trống trơn.
  useEffect(() => {
    if (!open) return
    const source = text.trim()
    const request = ++requestRef.current
    if (!source) {
      setLoading(false)
      setResult(null)
      setError('')
      setNote('')
      setDetails(null)
      setDetailsLoading(false)
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      setNote('')
      setCopied(false)
      const shouldLoadDetails = direction === 'en-vi' && SINGLE_WORD.test(source)
      setDetails(null)
      hasDetailsRef.current = false
      setDetailsLoading(shouldLoadDetails)

      if (shouldLoadDetails) {
        void lookupWordDetails(source).then((wordDetails) => {
          if (request !== requestRef.current) return
          setDetailsLoading(false)
          if (wordDetails.groups.length > 0) {
            hasDetailsRef.current = true
            setDetails(wordDetails)
            setError('')
          }
        })
      }

      const outcome = await getTranslation(source, direction)
      if (request !== requestRef.current) return
      setLoading(false)
      if (outcome.status === 'ok') {
        setResult(outcome.text)
        setError('')
        setNote(outcome.unchanged ? unchangedNote(source, direction) : '')
        // Chiều Việt -> Anh: tra tiếp chính từ tiếng Anh vừa dịch được, người
        // học có luôn phiên âm, từ loại và ví dụ thay vì chỉ một dòng chữ.
        const word = outcome.text.trim()
        if (direction === 'vi-en' && SINGLE_WORD.test(word)) {
          setDetailsLoading(true)
          void lookupWordDetails(word).then((wordDetails) => {
            if (request !== requestRef.current) return
            setDetailsLoading(false)
            if (wordDetails.groups.length > 0) {
              hasDetailsRef.current = true
              setDetails(wordDetails)
            }
          })
        }
      } else {
        setResult(null)
        setNote('')
        // Từ điển đã tìm ra nghĩa thì đừng báo lỗi chồng lên, mâu thuẫn nhau.
        if (hasDetailsRef.current) return
        setError(
          outcome.status === 'no-meaning'
            ? noMeaningMessage(source, direction)
            : 'Không dịch được. Hãy kiểm tra kết nối mạng và thử lại.',
        )
      }
    }, 380)

    return () => window.clearTimeout(timer)
  }, [direction, focusToken, open, text])

  const hasOutput = Boolean(loading || result || error || detailsLoading || details)
  // Bố cục từ điển bật ngay từ lúc đang tra, không đợi có dữ liệu, để khung
  // kết quả không phải đổi kiểu cuộn giữa chừng.
  const hasDictionary = Boolean(details) || detailsLoading

  // Đổi từ loại thì đọc lại từ đầu danh sách.
  useEffect(() => {
    posListRef.current?.scrollTo({ top: 0 })
  }, [activePos])

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
    setNote('')
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

  // Bấm lần nữa khi đang đọc thì dừng; bấm nút khác thì chuyển sang đọc nút đó.
  const toggleSpeak = (target: 'source' | 'result' | 'word', value: string, rate = 0.95) => {
    const id = ++speakIdRef.current
    if (speaking === target) {
      stopSpeaking()
      setSpeaking(null)
      return
    }
    setSpeaking(target)
    speak(value, rate, () => {
      if (speakIdRef.current === id) setSpeaking(null)
    })
  }
  const speakWord = () => {
    if (details) toggleSpeak('word', details.word, 0.86)
  }
  // Chỉ phần nào đang là tiếng Anh mới có nút nghe
  const sourceEnglish = ttsSupported && direction === 'en-vi' ? text.trim() : ''
  const resultEnglish = ttsSupported && direction === 'vi-en' && result ? result : ''

  const speakButton = (target: 'source' | 'result', value: string, label: string) => (
    <button
      type="button"
      className={speaking === target ? 'is-speaking' : undefined}
      // Giữ con trỏ trong ô nhập để bấm nghe xong gõ tiếp được ngay
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => toggleSpeak(target, value)}
      aria-label={speaking === target ? 'Dừng đọc' : label}
      title={speaking === target ? 'Dừng đọc' : label}
    >
      <Icon name="speak" /> {speaking === target ? 'Dừng' : 'Nghe'}
    </button>
  )

  const visibleGroups = details
    ? activePos === 'all'
      ? details.groups
      : details.groups.filter((group) => group.pos === activePos)
    : []

  return (
    <div className={standalone ? 'qt-backdrop is-window' : 'qt-backdrop'} onMouseDown={onClose}>
      <section
        className={`qt-modal${hasDictionary ? ' has-dictionary' : ''}`}
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
          <div className="qt-form-head">
            <label htmlFor="qt-source">
              {direction === 'en-vi' ? 'Tiếng Anh' : 'Tiếng Việt'}
            </label>
            {sourceEnglish && speakButton('source', sourceEnglish, 'Nghe câu tiếng Anh đã nhập')}
          </div>
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
              setNote('')
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
          {/* Chỗ kết quả luôn có mặt để bố cục đứng yên; khi chưa gõ gì thì
              nói rõ sắp có gì ở đây thay vì để một mảng trống. */}
          {!hasOutput && (
            <div className="qt-empty">
              <span className="qt-empty-icon"><Icon name="lang" /></span>
              <strong>Gõ từ hoặc câu cần dịch</strong>
              <p>Bản dịch, phiên âm, từ loại và ví dụ sẽ hiện ở đây.</p>
            </div>
          )}

          {(loading || result || error) && !details && (
            <div className={error ? 'qt-result is-error' : 'qt-result'} aria-live="polite">
              <div className="qt-result-head">
                <span>{direction === 'en-vi' ? 'Tiếng Việt' : 'Tiếng Anh'}</span>
                {result && (
                  <div className="qt-result-actions">
                    {resultEnglish && speakButton('result', resultEnglish, 'Nghe bản dịch tiếng Anh')}
                    <button type="button" onClick={copyResult}>
                      <Icon name={copied ? 'check' : 'stack'} /> {copied ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                )}
              </div>
              <div className="qt-result-text">
                {loading ? 'Đang dịch…' : error || result}
              </div>
              {!loading && !error && note && <p className="qt-result-note">{note}</p>}
            </div>
          )}

          {(detailsLoading || details) && (
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
                      {result && (
                        <button type="button" className="qt-dict-copy" onClick={copyResult}>
                          <Icon name={copied ? 'check' : 'stack'} />
                          {copied ? 'Đã chép' : 'Sao chép'}
                        </button>
                      )}
                    </div>
                    {/* Chiều Anh -> Việt thì nghĩa phổ biến là thông tin chính. Chiều
                        Việt -> Anh thì chính từ đứng đầu đã là bản dịch, chỉ cần nhắc
                        lại chữ tiếng Việt đã nhập. */}
                    {direction === 'en-vi' && result && (
                      <div className="qt-dict-primary">
                        <span>Nghĩa phổ biến</span>
                        <strong>{result}</strong>
                      </div>
                    )}
                    {direction === 'en-vi' && !result && (loading || error) && (
                      <div className={error ? 'qt-dict-status is-error' : 'qt-dict-status'}>
                        {loading && <span />}
                        {loading ? 'Đang dịch nghĩa phổ biến…' : error}
                      </div>
                    )}
                    {direction === 'vi-en' && (
                      <small>Dịch từ <b>{text.trim()}</b></small>
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

                  <div className="qt-pos-list qt-scroll" ref={posListRef}>
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
