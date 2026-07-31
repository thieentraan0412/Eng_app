import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  CloudApi,
  type Deck,
  type Reading,
  type ReadingHighlight,
} from '../services/cloud/CloudApiClient'
import { bestEnglishVoice, speak, ttsSupported } from '../services/tts'
import { isSingleWord, translate, translateOnline } from '../services/translation'
import {
  lookupWordDetails,
  posDescriptionVi,
  posLabelVi,
  type DictionaryPosGroup,
  type WordDetails,
} from '../services/dictionaryDetails'
import { shortPos } from '../services/enrich'
import Icon from '../components/Icon'
import '../styles/reading.css'

// Bảng màu bôi (highlight) — class CSS tương ứng: .hl-yellow, .hl-green…
const HL_COLORS = ['yellow', 'green', 'blue', 'pink'] as const

// Cấp độ CEFR cho bài đọc (cột `level` trong DB)
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

// Bộ từ do AppLayout tạo khi lưu từ lúc bôi dịch
const SAVED_DECK_NAME = 'Từ đã lưu khi đọc'

// Cỡ chữ vùng đọc (mockup: nhỏ / vừa / lớn) — nhớ lựa chọn của người dùng
const READ_SIZES = [
  { v: 15, label: 'A', size: 11, title: 'Cỡ chữ nhỏ' },
  { v: 17, label: 'A', size: 13, title: 'Cỡ chữ vừa' },
  { v: 19.5, label: 'A', size: 15, title: 'Cỡ chữ lớn' },
] as const

// Ước lượng thời gian đọc: ~150 từ / phút
function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 150))
}

// Bỏ phần giao nhau với [start, end) khỏi danh sách vùng bôi (cắt đôi nếu cần)
function subtractRange(ranges: ReadingHighlight[], start: number, end: number): ReadingHighlight[] {
  const out: ReadingHighlight[] = []
  for (const r of ranges) {
    if (r.end <= start || r.start >= end) {
      out.push(r)
      continue
    }
    if (r.start < start) out.push({ ...r, end: start })
    if (r.end > end) out.push({ ...r, start: end })
  }
  return out
}

// Thêm vùng bôi mới (đè lên vùng cũ nếu chồng lấn), gộp các vùng liền kề
// cùng màu — nhưng KHÔNG gộp khi ghi chú khác nhau (kẻo mất/ghép nhầm ghi chú)
function addRange(ranges: ReadingHighlight[], h: ReadingHighlight): ReadingHighlight[] {
  const out = [...subtractRange(ranges, h.start, h.end), h].sort((a, b) => a.start - b.start)
  const merged: ReadingHighlight[] = []
  for (const r of out) {
    const last = merged[merged.length - 1]
    if (
      last &&
      last.color === r.color &&
      r.start <= last.end &&
      (last.note ?? '') === (r.note ?? '')
    ) {
      last.end = Math.max(last.end, r.end)
    } else merged.push({ ...r })
  }
  return merged
}

// Tách bài thành từng đoạn ngắn (~180 ký tự, cắt theo câu) để đọc TTS —
// đọc 1 utterance quá dài Chrome sẽ tự ngắt giữa chừng
function splitChunks(text: string): string[] {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*\s*/g) ?? [text]
  const chunks: string[] = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length > 180 && cur.trim()) {
      chunks.push(cur)
      cur = s
    } else cur += s
  }
  if (cur.trim()) chunks.push(cur)
  return chunks
}

function sentenceAround(text: string, start: number, end: number): string {
  const before = text.slice(0, start)
  const left = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?'),
    before.lastIndexOf('\n'),
  )
  const after = text.slice(end)
  const stops = [after.indexOf('.'), after.indexOf('!'), after.indexOf('?'), after.indexOf('\n')]
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)
  const right = stops.length ? end + stops[0] + 1 : text.length
  return text
    .slice(left + 1, right)
    .replace(/\s+/g, ' ')
    .trim()
}

interface SaveWordEntry {
  word: string
  meaning: string
  phonetic?: string
  pos?: string
  example?: string
  inferPos?: boolean
}

interface SavedReadingWord extends SaveWordEntry {
  meanings?: string[]
}

interface LookupState {
  word: string
  meaning: string | null
  selectedMeanings: string[]
  meaningSelectionTouched: boolean
  contextMeaning: string | null
  phonetic?: string
  pos?: string
  example: string
  contextTranslation?: string | null
  contextStatus: 'idle' | 'loading' | 'ready' | 'error'
  details?: WordDetails
  detailsStatus: 'idle' | 'loading' | 'ready' | 'error'
  activePos?: string
  meaningSource: 'context' | 'dictionary'
  status: 'loading' | 'ready' | 'error'
}

function firstShortPos(pos?: string): string | undefined {
  const parts = pos
    ?.split(/[\/,;]/)
    .map((part) => part.trim())
    .filter(Boolean)
  // "noun/verb" là hai cách dùng khác nhau; không tự gắn toàn bộ nghĩa ghép vào noun.
  return parts?.length === 1 ? shortPos(parts[0]) : undefined
}

function preferredGroupMeaning(group: DictionaryPosGroup): string | null {
  return group.meanings[0] ?? group.usages[0]?.definitionVi ?? null
}

function meaningKey(value: string): string {
  return value.trim().toLocaleLowerCase('vi-VN')
}

function wordsInPhrase(value: string): string[] {
  const matches = value.match(/[A-Za-z]+(?:['-][A-Za-z]+)*/g) ?? []
  return [...new Set(matches.map((word) => word.toLowerCase()))].slice(0, 8)
}

function PosLegend() {
  return (
    <details className="read-pos-legend">
      <summary>Ký hiệu từ loại có nghĩa gì?</summary>
      <div className="read-pos-key-list">
        <span>
          <b>n</b> Danh từ
        </span>
        <span>
          <b>v</b> Động từ
        </span>
        <span>
          <b>adj</b> Tính từ
        </span>
        <span>
          <b>adv</b> Trạng từ
        </span>
      </div>
    </details>
  )
}

interface ViewerProps {
  reading: Reading
  onBack: () => void
  onHighlightsChange: (highlights: ReadingHighlight[]) => void
  onSaveWord: (entry: SaveWordEntry, deckId?: string) => Promise<void>
}

// Trình đọc 1 bài: bôi chọn văn bản -> thanh chọn màu hiện phía trên vùng chọn;
// bấm vào vùng đã bôi -> thêm/sửa ghi chú; nghe đọc cả bài bằng TTS.
function ReadingViewer({ reading, onBack, onHighlightsChange, onSaveWord }: ViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const lookupCardRef = useRef<HTMLDivElement>(null)
  const lookupRequestRef = useRef(0)
  const translationCacheRef = useRef(new Map<string, Promise<string | null>>())
  const text = reading.content ?? ''
  const storageKey = `reading_hl_${reading.id}`
  const savedWordsKey = `reading_saved_words_${reading.id}`

  const [highlights, setHighlights] = useState<ReadingHighlight[]>(() => {
    if (reading.highlights?.length) return reading.highlights
    // Dự phòng: bản lưu cục bộ (khi cloud chưa có cột highlights)
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as ReadingHighlight[]
    } catch {
      return []
    }
  })
  // Thanh chọn màu nổi: vị trí (viewport) + vùng ký tự đang chọn
  const [bar, setBar] = useState<{ x: number; y: number; start: number; end: number } | null>(null)
  // Popover ghi chú của 1 vùng bôi đang mở
  const [notePop, setNotePop] = useState<{
    x: number
    y: number
    start: number
    end: number
    draft: string
  } | null>(null)
  const [savedInReading, setSavedInReading] = useState<SavedReadingWord[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(savedWordsKey) ?? '[]') as unknown
      return Array.isArray(value) ? (value as SavedReadingWord[]) : []
    } catch {
      return []
    }
  })
  const [lookup, setLookup] = useState<LookupState | null>(null)
  const [savingWord, setSavingWord] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [deckId, setDeckId] = useState('')
  // Trạng thái đọc bài bằng TTS
  const [tts, setTts] = useState<'idle' | 'playing' | 'paused'>('idle')
  // Cỡ chữ vùng đọc (nhớ lựa chọn) · chế độ tập trung · tiến độ đọc
  const [fontSize, setFontSize] = useState<number>(() => {
    const v = Number(localStorage.getItem('read_font_size'))
    return READ_SIZES.some((s) => s.v === v) ? v : 17
  })
  const [focus, setFocus] = useState(false)

  useEffect(() => {
    if (!lookup) return
    document.body.classList.add('read-lookup-open')
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      lookupRequestRef.current += 1
      setLookup(null)
      setSaveError(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('read-lookup-open')
    }
  }, [Boolean(lookup)])

  useEffect(() => {
    const card = lookupCardRef.current
    if (!card) return
    const scrollHost = card.closest('.content')
    let resizeFrame = 0

    const updateLookupHeight = () => {
      const top = Math.max(14, card.getBoundingClientRect().top)
      const viewportBottom = scrollHost?.getBoundingClientRect().bottom ?? window.innerHeight
      const availableHeight = Math.max(280, Math.floor(viewportBottom - top - 14))
      card.style.setProperty('--read-lookup-height', `${availableHeight}px`)
    }
    const scheduleLookupHeight = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(updateLookupHeight)
    }

    updateLookupHeight()
    window.addEventListener('resize', scheduleLookupHeight)
    scrollHost?.addEventListener('scroll', scheduleLookupHeight, { passive: true })
    return () => {
      cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', scheduleLookupHeight)
      scrollHost?.removeEventListener('scroll', scheduleLookupHeight)
    }
  }, [])

  const [progress, setProgress] = useState(0)

  const applyFontSize = (v: number) => {
    setFontSize(v)
    localStorage.setItem('read_font_size', String(v))
  }

  // Chế độ tập trung: ẩn sidebar + cột tra từ (CSS bám vào class trên <body>)
  useEffect(() => {
    document.body.classList.toggle('read-focus', focus)
    return () => document.body.classList.remove('read-focus')
  }, [focus])

  // Esc: thoát chế độ tập trung
  useEffect(() => {
    if (!focus) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocus(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focus])

  // Tiến độ đọc theo vị trí cuộn của vùng bài (vùng cuộn là .content, không phải window
  // -> dùng listener ở pha capture để vẫn bắt được sự kiện scroll)
  useEffect(() => {
    const update = () => {
      const el = contentRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight * 0.75
      const done = -r.top + window.innerHeight * 0.25
      const p = total <= 0 ? 1 : done / total
      setProgress(Math.max(0, Math.min(1, p)) * 100)
    }
    update()
    document.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      document.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [fontSize])

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  const translateCached = (value: string): Promise<string | null> => {
    const key = value.replace(/\s+/g, ' ').trim().toLowerCase()
    const cached = translationCacheRef.current.get(key)
    if (cached) return cached

    const request = translateOnline(value).then((meaning) => {
      if (!meaning) translationCacheRef.current.delete(key)
      return meaning
    })
    translationCacheRef.current.set(key, request)
    if (translationCacheRef.current.size > 80) {
      const oldest = translationCacheRef.current.keys().next().value
      if (typeof oldest === 'string') translationCacheRef.current.delete(oldest)
    }
    return request
  }

  const findSavedReadingWord = (value: string): SavedReadingWord | undefined => {
    const key = value.replace(/\s+/g, ' ').trim().toLowerCase()
    return savedInReading.find(
      (item) => item.word.replace(/\s+/g, ' ').trim().toLowerCase() === key,
    )
  }

  const lookupText = (selectedText: string, example: string, saved?: SavedReadingWord) => {
    const source = selectedText.replace(/\s+/g, ' ').trim()
    if (!source || source.length > 200 || !/[A-Za-z]/.test(source)) return

    const requestId = ++lookupRequestRef.current
    const singleWord = isSingleWord(source)
    const offline = singleWord ? translate(source) : null
    const initialMeaning = saved?.meaning ?? offline?.vi ?? null
    const initialSelectedMeanings = saved?.meanings?.length
      ? saved.meanings.map((meaning) => meaning.trim()).filter(Boolean)
      : initialMeaning
        ? [initialMeaning]
        : []
    const initialPos = firstShortPos(saved?.pos ?? offline?.pos)
    const word = saved?.word ?? offline?.word ?? source
    const sameAsContext = example.trim() === source
    setSaveError(null)

    setLookup({
      word,
      meaning: initialMeaning,
      selectedMeanings: initialSelectedMeanings,
      meaningSelectionTouched: Boolean(saved?.meanings?.length),
      contextMeaning: initialMeaning,
      phonetic: saved?.phonetic ?? offline?.phonetic,
      pos: initialPos,
      example,
      contextTranslation: sameAsContext ? initialMeaning : null,
      contextStatus: !example
        ? 'idle'
        : sameAsContext && initialMeaning
          ? 'ready'
          : 'loading',
      detailsStatus: singleWord ? 'loading' : 'idle',
      activePos: initialPos,
      meaningSource: saved && !saved.example ? 'dictionary' : 'context',
      status: initialMeaning ? 'ready' : 'loading',
    })

    if (!initialMeaning) {
      void translateCached(source).then((meaning) => {
        if (lookupRequestRef.current !== requestId) return
        setLookup((current) => {
          if (!current) return current
          const activeGroup = current.details?.groups.find(
            (group) => group.pos === current.activePos,
          )
          const fallbackMeaning = activeGroup ? preferredGroupMeaning(activeGroup) : null
          const resolvedContext = meaning ?? current.contextMeaning ?? fallbackMeaning
          const usedDictionaryFallback =
            !meaning && !current.contextMeaning && Boolean(fallbackMeaning)
          return {
            ...current,
            meaning: current.meaning ?? resolvedContext,
            selectedMeanings:
              current.meaningSelectionTouched ||
              current.selectedMeanings.length ||
              !resolvedContext
                ? current.selectedMeanings
                : [resolvedContext],
            meaningSource:
              current.meaning
                ? current.meaningSource
                : usedDictionaryFallback
                  ? 'dictionary'
                  : 'context',
            contextMeaning: resolvedContext,
            pos:
              current.pos ??
              (usedDictionaryFallback ? activeGroup?.pos : undefined),
            contextTranslation: sameAsContext ? meaning : current.contextTranslation,
            contextStatus: sameAsContext ? (meaning ? 'ready' : 'error') : current.contextStatus,
            status: resolvedContext ? 'ready' : 'error',
          }
        })
      })
    }

    if (example && !sameAsContext) {
      void translateCached(example).then((translatedExample) => {
        if (lookupRequestRef.current !== requestId) return
        setLookup((current) =>
          current
            ? {
                ...current,
                contextTranslation: translatedExample,
                contextStatus: translatedExample ? 'ready' : 'error',
              }
            : current,
        )
      })
    }

    if (singleWord) {
      void lookupWordDetails(source)
        .then((details) => {
          if (lookupRequestRef.current !== requestId) return
          setLookup((current) => {
            if (!current) return current
            const activePos =
              (current.activePos &&
                details.groups.some((group) => group.pos === current.activePos) &&
                current.activePos) ||
              details.groups[0]?.pos
            const activeGroup = details.groups.find((group) => group.pos === activePos)
            const fallbackMeaning = activeGroup ? preferredGroupMeaning(activeGroup) : null
            const canUseFallback =
              current.status === 'error' && !current.contextMeaning && Boolean(fallbackMeaning)
            return {
              ...current,
              details,
              detailsStatus: details.groups.length ? 'ready' : 'error',
              phonetic: current.phonetic ?? details.phonetic,
              activePos,
              pos: canUseFallback ? activePos : current.pos,
              meaning: current.meaning ?? (canUseFallback ? fallbackMeaning : null),
              selectedMeanings:
                current.meaningSelectionTouched ||
                current.selectedMeanings.length ||
                !canUseFallback ||
                !fallbackMeaning
                  ? current.selectedMeanings
                  : [fallbackMeaning],
              meaningSource: canUseFallback ? 'dictionary' : current.meaningSource,
              contextMeaning: canUseFallback ? fallbackMeaning : current.contextMeaning,
              status: canUseFallback ? 'ready' : current.status,
            }
          })
        })
        .catch(() => {
          if (lookupRequestRef.current !== requestId) return
          setLookup((current) =>
            current ? { ...current, detailsStatus: 'error' } : current,
          )
        })
    }
  }

  const selectLookupPos = (group: DictionaryPosGroup) => {
    setLookup((current) =>
      current ? { ...current, activePos: group.pos } : current,
    )
  }

  const toggleLookupMeaning = (group: DictionaryPosGroup, meaning: string) => {
    setLookup((current) => {
      if (!current) return current

      // Một thẻ chỉ có một từ loại. Có thể chọn nhiều nghĩa trong từ loại đó;
      // chọn nghĩa ở từ loại khác sẽ bắt đầu một nhóm lựa chọn mới.
      const normalizedMeaning = meaning.trim()
      const normalizedKey = meaningKey(normalizedMeaning)
      const selectableMeanings = new Set(
        [
          ...group.meanings,
          ...group.usages.flatMap((usage) =>
            usage.definitionVi ? [usage.definitionVi] : [],
          ),
        ].map(meaningKey),
      )
      const meaningsInCurrentPos =
        current.pos === group.pos
          ? current.selectedMeanings.filter((item) =>
              selectableMeanings.has(meaningKey(item)),
            )
          : []
      const isSelected = meaningsInCurrentPos.some(
        (item) => meaningKey(item) === normalizedKey,
      )
      const selectedMeanings = isSelected
        ? meaningsInCurrentPos.filter((item) => meaningKey(item) !== normalizedKey)
        : [...meaningsInCurrentPos, normalizedMeaning]

      return {
        ...current,
        activePos: group.pos,
        pos: selectedMeanings.length ? group.pos : undefined,
        meaning: selectedMeanings[0] ?? current.contextMeaning,
        selectedMeanings,
        meaningSelectionTouched: true,
        meaningSource: selectedMeanings.length ? 'dictionary' : 'context',
      }
    })
  }

  useEffect(() => {
    try {
      localStorage.setItem(savedWordsKey, JSON.stringify(savedInReading))
    } catch {
      /* localStorage đầy: vẫn giữ trạng thái trong phiên hiện tại */
    }
  }, [savedInReading, savedWordsKey])

  const persistSavedWords = (
    update: (current: SavedReadingWord[]) => SavedReadingWord[],
  ) => setSavedInReading(update)

  const saveLookupWord = async () => {
    if (!lookup?.selectedMeanings.length || lookup.status !== 'ready' || savingWord) return
    const lookupId = lookupRequestRef.current
    setSavingWord(true)
    setSaveError(null)
    const selectedMeaningText = lookup.selectedMeanings.join('; ')
    const entry: SavedReadingWord = {
      word: lookup.word,
      meaning: selectedMeaningText,
      meanings: [...lookup.selectedMeanings],
      phonetic: lookup.phonetic,
      pos: lookup.pos,
      inferPos: false,
      // Nếu đã chọn nghĩa/POS khác, không gắn nhầm câu ngữ cảnh cũ vào card mới.
      example:
        lookup.meaningSource === 'context' &&
        (!isSingleWord(lookup.word) || lookup.pos)
          ? lookup.example
          : undefined,
    }
    try {
      await onSaveWord(entry, deckId || undefined)
      const key = entry.word.trim().toLowerCase()
      persistSavedWords((current) => [
        entry,
        ...current.filter((item) => item.word.trim().toLowerCase() !== key),
      ])
    } catch {
      if (lookupRequestRef.current === lookupId)
        setSaveError('Không thể lưu từ. Vui lòng kiểm tra kết nối rồi thử lại.')
    } finally {
      setSavingWord(false)
    }
  }

  useEffect(
    () => () => {
      lookupRequestRef.current += 1
    },
    [],
  )

  useEffect(() => {
    let cancelled = false
    void CloudApi.listDecks()
      .then((items) => {
        if (cancelled) return
        setDecks(items)
        const lastDeckId = localStorage.getItem('last_deck_id')
        setDeckId(
          (lastDeckId && items.some((deck) => deck.id === lastDeckId)
            ? lastDeckId
            : items[0]?.id) ?? '',
        )
      })
      .catch(() => {
        if (!cancelled) setDecks([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Đóng thanh màu / popover ghi chú khi bấm ra ngoài
  useEffect(() => {
    if (!bar && !notePop) return
    const close = (e: MouseEvent) => {
      // Bấm vào popup dịch/lưu từ -> KHÔNG đóng (cho các popup cùng tồn tại)
      const t = e.target as HTMLElement
      if (t.closest('.hl-toolbar') || t.closest('.translate-popup') || t.closest('.hl-note-pop'))
        return
      setBar(null)
      setNotePop(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [bar, notePop])

  // Rời trang -> dừng đọc
  useEffect(() => () => stopRead(), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Bôi chọn xong -> tính offset ký tự trong content và hiện thanh màu.
  // Chọn 1 từ/cụm ngắn cũng được tính là "tra từ" (popup dịch sẽ hiện).
  const handleMouseUp = () => {
    const el = contentRef.current
    const sel = window.getSelection()
    if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return
    const pre = range.cloneRange()
    pre.selectNodeContents(el)
    pre.setEnd(range.startContainer, range.startOffset)
    const start = pre.toString().length
    const end = start + range.toString().length
    if (end <= start) return
    const rect = range.getBoundingClientRect()
    setBar({ x: rect.left + rect.width / 2, y: rect.top - 8, start, end })

    const selText = range.toString().trim()
    lookupText(
      selText,
      sentenceAround(text, start, end),
      findSavedReadingWord(selText),
    )
  }

  const save = (next: ReadingHighlight[]) => {
    setHighlights(next)
    onHighlightsChange(next)
    CloudApi.updateReadingHighlights(reading.id, next)
      .then(() => localStorage.removeItem(storageKey))
      .catch(() => localStorage.setItem(storageKey, JSON.stringify(next))) // cloud lỗi -> giữ bản cục bộ
  }

  const applyColor = (color: string) => {
    if (!bar) return
    save(addRange(highlights, { start: bar.start, end: bar.end, color }))
    setBar(null)
    window.getSelection()?.removeAllRanges()
  }

  const erase = () => {
    if (!bar) return
    save(subtractRange(highlights, bar.start, bar.end))
    setBar(null)
    window.getSelection()?.removeAllRanges()
  }

  // Lưu / xóa ghi chú của vùng bôi đang mở popover
  const saveNote = () => {
    if (!notePop) return
    save(
      highlights.map((h) =>
        h.start === notePop.start && h.end === notePop.end
          ? { ...h, note: notePop.draft.trim() || undefined }
          : h,
      ),
    )
    setNotePop(null)
  }

  // ----- TTS đọc cả bài: xếp hàng từng đoạn ngắn, tạm dừng / tiếp tục được -----
  const startRead = () => {
    if (!ttsSupported) return
    const synth = window.speechSynthesis
    synth.cancel()
    const chunks = splitChunks(text)
    const voice = bestEnglishVoice()
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c)
      u.lang = 'en-US'
      u.rate = 0.95
      if (voice) u.voice = voice
      if (i === chunks.length - 1) u.onend = () => setTts('idle')
      synth.speak(u)
    })
    setTts('playing')
  }
  const pauseRead = () => {
    window.speechSynthesis.pause()
    setTts('paused')
  }
  const resumeRead = () => {
    window.speechSynthesis.resume()
    setTts('playing')
  }
  const stopRead = () => {
    if (ttsSupported) window.speechSynthesis.cancel()
    setTts('idle')
  }

  // Dựng nội dung: chèn <mark> cho từng vùng bôi; bấm vào mark để ghi chú
  const parts: ReactNode[] = []
  let pos = 0
  for (const h of highlights) {
    if (h.start > pos) parts.push(text.slice(pos, h.start))
    parts.push(
      <mark
        key={`${h.start}-${h.end}`}
        data-range={`${h.start}-${h.end}`}
        className={`hl hl-${h.color}${h.note ? ' has-note' : ''}`}
        title={h.note || 'Bấm để thêm ghi chú'}
        onClick={(e) => {
          // Đang bôi chọn chữ -> không mở ghi chú (để dịch/bôi màu như thường)
          const sel = window.getSelection()
          if (sel && !sel.isCollapsed) return
          e.stopPropagation()
          const rect = (e.target as HTMLElement).getBoundingClientRect()
          setBar(null)
          setNotePop({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
            start: h.start,
            end: h.end,
            draft: h.note ?? '',
          })
        }}
      >
        {text.slice(h.start, h.end)}
      </mark>,
    )
    pos = h.end
  }
  if (pos < text.length) parts.push(text.slice(pos))

  const activeDetailsGroup = lookup?.details?.groups.find(
    (group) => group.pos === lookup.activePos,
  )
  const selectedMeaningText = lookup?.selectedMeanings.join('; ') ?? ''
  const isLookupSaved = Boolean(
    lookup &&
      savedInReading.some(
        (item) =>
          item.word.trim().toLowerCase() === lookup.word.trim().toLowerCase(),
      ),
  )
  const isLookupMeaningSelected = (group: DictionaryPosGroup, meaning: string) =>
    Boolean(
      lookup?.pos === group.pos &&
        lookup.selectedMeanings.some((item) => meaningKey(item) === meaningKey(meaning)),
    )

  return (
    <div className="page page-wide read-page">
      <button className="read-crumb" onClick={onBack}>
        <Icon name="left" /> Thư viện bài đọc
      </button>

      <div className="read-doc-head">
        <h1>{reading.title}</h1>
        <p className="read-doc-meta">
          {reading.level && <span className="read-badge">{reading.level}</span>}
          <span>
            {wordCount.toLocaleString('vi-VN')} từ · khoảng {readMinutes(text)} phút đọc
          </span>
          <span>· {highlights.length} vùng đã bôi</span>
        </p>
      </div>

      <div className="read-grid2">
        <div className="read-col">
          {/* Thanh công cụ dính: nghe đọc · cỡ chữ · tập trung · tiến độ */}
          <div className="read-bar">
            {ttsSupported &&
              (tts === 'idle' ? (
                <button className="read-btn read-btn-sm" onClick={startRead}>
                  <Icon name="speak" /> <span className="read-btn-label">Nghe đọc bài</span>
                </button>
              ) : (
                <>
                  {tts === 'playing' ? (
                    <button className="read-btn read-btn-sm" onClick={pauseRead}>
                      <Icon name="x" /> <span className="read-btn-label">Tạm dừng</span>
                    </button>
                  ) : (
                    <button className="read-btn read-btn-sm" onClick={resumeRead}>
                      <Icon name="play" /> <span className="read-btn-label">Tiếp tục</span>
                    </button>
                  )}
                  <button className="read-btn read-btn-sm" onClick={stopRead}>
                    <span className="read-btn-label">Dừng</span>
                  </button>
                </>
              ))}

            <div className="read-seg" role="group" aria-label="Cỡ chữ">
              {READ_SIZES.map((s) => (
                <button
                  key={s.v}
                  className={fontSize === s.v ? 'is-active' : ''}
                  title={s.title}
                  style={{ fontSize: s.size }}
                  onClick={() => applyFontSize(s.v)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              className={focus ? 'read-btn read-btn-sm read-btn-primary' : 'read-btn read-btn-sm'}
              onClick={() => setFocus((f) => !f)}
            >
              <Icon name={focus ? 'x' : 'target'} />{' '}
              <span className="read-btn-label">{focus ? 'Thoát tập trung' : 'Tập trung'}</span>
            </button>

            <div className="read-spacer" />
            <span className="read-bar-hint">
              <Icon name="bulb" /> Bôi chữ để tra nghĩa · bấm vùng đã bôi để ghi chú
            </span>
            <div className="read-prog">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>

          <article
            className="reading-text"
            ref={contentRef}
            onMouseUp={handleMouseUp}
            style={{ ['--read-size' as string]: `${fontSize}px` }}
          >
            {parts}
          </article>
        </div>

        {/* ------------------------------------------- Cột bên phải */}
        {lookup && (
          <button
            type="button"
            className="read-lookup-backdrop"
            aria-label="Đóng khung tra từ"
            onClick={() => {
              lookupRequestRef.current += 1
              setLookup(null)
              setSaveError(null)
            }}
          />
        )}
        <aside className={lookup ? 'read-aside has-lookup' : 'read-aside'}>
          <div className="read-card-box read-lookup-card" ref={lookupCardRef}>
            <div className="read-card-head">
              <h2>
                <Icon name="search" /> Tra từ
              </h2>
              {lookup && (
                <button
                  type="button"
                  className="read-lookup-close"
                  aria-label="Đóng khung tra từ"
                  onClick={() => {
                    lookupRequestRef.current += 1
                    setLookup(null)
                    setSaveError(null)
                  }}
                >
                  <Icon name="x" />
                </button>
              )}
            </div>
            {!lookup ? (
              <p className="read-lookup-empty">
                Bôi một từ hoặc cụm từ bất kỳ trong bài để xem nghĩa, ngữ cảnh và lưu vào bộ từ
                của bạn.
              </p>
            ) : (
              <>
                <div className="read-lookup-summary">
                  <div className="read-lookup-word">
                    <span title={lookup.word}>{lookup.word}</span>
                    {ttsSupported && (
                      <button
                        className="read-ibtn"
                        type="button"
                        title="Phát âm"
                        aria-label={`Phát âm ${lookup.word}`}
                        onClick={() => speak(lookup.word)}
                      >
                        <Icon name="speak" />
                      </button>
                    )}
                  </div>
                  {(lookup.phonetic ||
                    (lookup.details?.lemma &&
                      lookup.details.lemma.toLowerCase() !== lookup.word.toLowerCase())) && (
                    <p className="read-lookup-phonetic">
                      {lookup.phonetic && <span>{lookup.phonetic}</span>}
                      {lookup.details?.lemma &&
                        lookup.details.lemma.toLowerCase() !== lookup.word.toLowerCase() && (
                          <span>
                            Dạng gốc: <b>{lookup.details.lemma}</b>
                          </span>
                        )}
                    </p>
                  )}
                </div>
                <div className="read-lookup-body">
                  <div
                    className="read-lookup-scroll"
                    role="region"
                    aria-label={`Chi tiết nghĩa của ${lookup.word}`}
                    tabIndex={0}
                  >

                {lookup.status === 'loading' ? (
                  <p className="read-lookup-loading" role="status">Đang tra nghĩa…</p>
                ) : lookup.status === 'error' || !lookup.contextMeaning ? (
                  <>
                    <p className="read-lookup-unavailable">Chưa tìm thấy nghĩa phù hợp</p>
                    <p className="read-lookup-example">
                      Không thể kết nối dịch trực tuyến. Các thông tin từ điển tải được vẫn sẽ
                      hiển thị bên dưới.
                    </p>
                  </>
                ) : (
                  <section className="read-context-block" aria-label="Nghĩa trong ngữ cảnh">
                    <span className="read-context-label">Nghĩa trong câu đang đọc</span>
                    <p className="read-context-meaning">{lookup.contextMeaning}</p>
                    {lookup.example && (
                      <div className="read-context-lines">
                        <div className="read-context-line is-translation">
                          <span className="read-language-tag">VI</span>
                          {lookup.contextStatus === 'loading' ? (
                            <p className="read-context-translation">Đang dịch câu ngữ cảnh…</p>
                          ) : lookup.contextTranslation ? (
                            <p className="read-context-translation">
                              {lookup.contextTranslation}
                            </p>
                          ) : (
                            <p className="read-context-translation">
                              Chưa có bản dịch cả câu; bạn vẫn có thể xem các cách dùng bên dưới.
                            </p>
                          )}
                        </div>
                        <details className="read-context-original">
                          <summary>Xem câu tiếng Anh</summary>
                          <div className="read-context-line">
                            <span className="read-language-tag">EN</span>
                            <p className="read-context-sentence">{lookup.example}</p>
                          </div>
                        </details>
                      </div>
                    )}
                  </section>
                )}

                {lookup.detailsStatus === 'loading' && (
                  <section className="read-details">
                    <div className="read-details-head">
                      <b className="read-details-title">Nghĩa theo từng từ loại</b>
                    </div>
                    <p className="read-details-loading" role="status">
                      Đang tải các cách dùng và ví dụ…
                    </p>
                  </section>
                )}

                {lookup.detailsStatus === 'error' && (
                  <section className="read-details">
                    <div className="read-details-head">
                      <b className="read-details-title">Nghĩa theo từng từ loại</b>
                    </div>
                    <p className="read-details-empty">
                      Chưa tải được phần giải thích mở rộng. Nghĩa chính ở trên vẫn có thể lưu.
                    </p>
                    <PosLegend />
                  </section>
                )}

                {lookup.detailsStatus === 'idle' && !isSingleWord(lookup.word) && (
                  <section className="read-details">
                    <p className="read-details-empty">
                      Đây là một cụm từ nên nghĩa ở trên được dịch theo cả cụm. Chọn một từ bên
                      dưới để xem riêng từ loại và từng trường hợp sử dụng.
                    </p>
                    <div className="read-lookup-chips" aria-label="Xem chi tiết từng từ">
                      {wordsInPhrase(lookup.word).map((word) => (
                        <button
                          key={word}
                          type="button"
                          className="read-tok"
                          onClick={() =>
                            lookupText(word, lookup.example, findSavedReadingWord(word))
                          }
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {lookup.detailsStatus === 'ready' && lookup.details?.groups.length && (
                  <section className="read-details">
                    <div className="read-details-head">
                      <div>
                        <b className="read-details-title">Các nghĩa của “{lookup.word}”</b>
                        <span className="read-details-subtitle">
                          Có thể chọn nhiều nghĩa trong cùng một từ loại
                        </span>
                      </div>
                    </div>

                    <div className="read-pos-tabs" role="group" aria-label="Chọn từ loại">
                      {lookup.details.groups.map((group) => (
                        <button
                          key={group.pos}
                          type="button"
                          aria-pressed={group.pos === lookup.activePos}
                          className={
                            group.pos === lookup.activePos
                              ? 'read-pos-tab is-active'
                              : 'read-pos-tab'
                          }
                          onClick={() => selectLookupPos(group)}
                        >
                          <span className="read-pos-code">{group.pos}</span>
                          <span className="read-pos-label">{posLabelVi(group.pos)}</span>
                        </button>
                      ))}
                    </div>

                    {activeDetailsGroup && (
                      <div>
                        <div className="read-pos-description">
                          <span className="read-pos-summary-code">
                            {activeDetailsGroup.pos}
                          </span>
                          <div>
                            <b>{posLabelVi(activeDetailsGroup.pos)}</b>
                            <p>{posDescriptionVi(activeDetailsGroup.pos)}</p>
                          </div>
                        </div>

                        {activeDetailsGroup.meanings.length > 0 && (
                          <div className="read-common-meanings">
                            <span className="read-common-title">
                              Nghĩa phổ biến <small>· chọn nhiều</small>
                            </span>
                            <div
                              className="read-common-list"
                              role="group"
                              aria-label="Chọn một hoặc nhiều nghĩa phổ biến"
                            >
                              {activeDetailsGroup.meanings.map((meaning) => (
                                <button
                                  key={meaning}
                                  type="button"
                                  className={
                                    isLookupMeaningSelected(activeDetailsGroup, meaning)
                                      ? 'read-common-meaning is-selected'
                                      : 'read-common-meaning'
                                  }
                                  aria-pressed={isLookupMeaningSelected(
                                    activeDetailsGroup,
                                    meaning,
                                  )}
                                  disabled={savingWord || isLookupSaved}
                                  title={
                                    isLookupSaved
                                      ? 'Từ này đã được lưu'
                                      : 'Chọn hoặc bỏ nghĩa này khỏi thẻ từ'
                                  }
                                  onClick={() =>
                                    toggleLookupMeaning(activeDetailsGroup, meaning)
                                  }
                                >
                                  <span className="read-meaning-check" aria-hidden="true">
                                    {isLookupMeaningSelected(activeDetailsGroup, meaning)
                                      ? '✓'
                                      : ''}
                                  </span>
                                  {meaning}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeDetailsGroup.usages.length > 0 && (
                          <div className="read-usage-list">
                            <span className="read-common-title">Dùng trong trường hợp nào?</span>
                            {activeDetailsGroup.usages.map((usage, index) => (
                              <article
                                className={
                                  usage.definitionVi &&
                                  isLookupMeaningSelected(
                                    activeDetailsGroup,
                                    usage.definitionVi,
                                  )
                                    ? 'read-usage-item is-selected'
                                    : 'read-usage-item'
                                }
                                key={`${usage.definition}-${index}`}
                              >
                                <div className="read-usage-heading">
                                  <span className="read-usage-index">{index + 1}</span>
                                  <p className="read-usage-definition">
                                    {usage.definitionVi ?? usage.definition}
                                  </p>
                                </div>
                                {usage.definitionVi && (
                                  <div className="read-usage-original">
                                    <span className="read-language-tag">EN</span>
                                    <p>{usage.definition}</p>
                                  </div>
                                )}
                                {usage.example && (
                                  <div className="read-usage-example">
                                    <span className="read-example-title">Ví dụ trong câu</span>
                                    <div className="read-example-line">
                                      <span className="read-language-tag">EN</span>
                                      <p>{usage.example}</p>
                                    </div>
                                    {usage.exampleVi && (
                                      <div className="read-example-line is-translation">
                                        <span className="read-language-tag">VI</span>
                                        <p className="read-usage-example-vi">
                                          {usage.exampleVi}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {usage.definitionVi && (
                                  <button
                                    type="button"
                                    className={
                                      isLookupMeaningSelected(
                                        activeDetailsGroup,
                                        usage.definitionVi,
                                      )
                                        ? 'read-usage-select is-selected'
                                        : 'read-usage-select'
                                    }
                                    aria-pressed={isLookupMeaningSelected(
                                      activeDetailsGroup,
                                      usage.definitionVi,
                                    )}
                                    disabled={savingWord || isLookupSaved}
                                    onClick={() =>
                                      toggleLookupMeaning(
                                        activeDetailsGroup,
                                        usage.definitionVi!,
                                      )
                                    }
                                  >
                                    {isLookupMeaningSelected(
                                      activeDetailsGroup,
                                      usage.definitionVi,
                                    )
                                      ? '✓ Đã thêm nghĩa này'
                                      : '+ Thêm nghĩa này để lưu'}
                                  </button>
                                )}
                              </article>
                            ))}
                            {activeDetailsGroup.totalUsages >
                              activeDetailsGroup.usages.length && (
                              <p className="read-usage-more">
                                Nguồn từ điển còn{' '}
                                {activeDetailsGroup.totalUsages -
                                  activeDetailsGroup.usages.length}{' '}
                                định nghĩa khác.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <PosLegend />
                  </section>
                )}

                  {saveError && (
                    <p className="read-lookup-error" role="alert">
                      {saveError}
                    </p>
                  )}
                </div>
                {lookup.status === 'ready' && selectedMeaningText && (
                  <div className="read-save-panel">
                    <div className="read-save-preview">
                      <div className="read-save-preview-copy">
                        <span>
                          {lookup.meaningSelectionTouched
                            ? `Đang chọn ${lookup.selectedMeanings.length} nghĩa để lưu`
                            : 'Đang chọn để lưu'}
                        </span>
                        <b title={selectedMeaningText}>{selectedMeaningText}</b>
                        {!lookup.pos && isSingleWord(lookup.word) && (
                          <small>Chọn một hoặc nhiều nghĩa phía trên để xác định từ loại</small>
                        )}
                      </div>
                      {lookup.pos && (
                        <span className="read-save-pos">
                          {lookup.pos} · {posLabelVi(lookup.pos)}
                        </span>
                      )}
                    </div>
                    <div className="read-save-actions">
                      <label className="read-deck-picker">
                        <span>Chọn bộ từ để lưu</span>
                        <select
                          value={deckId}
                          aria-label="Chọn bộ từ để lưu"
                          onChange={(event) => setDeckId(event.target.value)}
                          disabled={savingWord || isLookupSaved || decks.length === 0}
                        >
                          {decks.length === 0 ? (
                            <option value="">Bộ từ mặc định</option>
                          ) : (
                            decks.map((deck) => (
                              <option key={deck.id} value={deck.id}>
                                {deck.name}
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="read-btn read-btn-sm read-btn-primary read-lookup-save"
                        disabled={
                          savingWord ||
                          isLookupSaved
                        }
                        onClick={saveLookupWord}
                      >
                        {isLookupSaved ? (
                          <>
                            <Icon name="check" /> Đã lưu
                          </>
                        ) : (
                          <>
                            <Icon name="plus" /> {savingWord ? 'Đang lưu…' : 'Lưu vào bộ từ'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            )}
          </div>

        </aside>
      </div>

      {/* Thanh nổi khi bôi chữ (mockup .sel-pop) */}
      {bar && (
        <div className="hl-toolbar" style={{ left: bar.x, top: bar.y }}>
          {HL_COLORS.map((c) => (
            <button
              key={c}
              className={`hl-dot hl-${c}`}
              title="Bôi màu"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyColor(c)}
            />
          ))}
          <span className="hl-sep" />
          {ttsSupported && (
            <button
              className="hl-act"
              title="Đọc đoạn đang chọn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => speak(text.slice(bar.start, bar.end))}
            >
              <Icon name="speak" />
            </button>
          )}
          <button
            className="hl-act danger"
            title="Xóa bôi màu"
            onMouseDown={(e) => e.preventDefault()}
            onClick={erase}
          >
            <Icon name="trash" />
          </button>
        </div>
      )}

      {/* Popover ghi chú cho vùng bôi màu */}
      {notePop && (
        <div className="hl-note-pop" style={{ left: notePop.x, top: notePop.y }}>
          <div className="hl-note-title">
            <Icon name="pencil" /> Ghi chú cho “
            {text.slice(notePop.start, notePop.end).slice(0, 40)}”
          </div>
          <textarea
            autoFocus
            rows={3}
            placeholder="Nhập ghi chú của bạn…"
            value={notePop.draft}
            onChange={(e) => setNotePop({ ...notePop, draft: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNote()
              if (e.key === 'Escape') setNotePop(null)
            }}
          />
          <div className="hl-note-actions">
            <button className="read-btn read-btn-sm read-btn-primary" onClick={saveNote}>
              <Icon name="save" /> Lưu
            </button>
            {notePop.draft.trim() && (
              <button
                className="read-btn read-btn-sm"
                onClick={() => {
                  setNotePop({ ...notePop, draft: '' })
                  save(
                    highlights.map((h) =>
                      h.start === notePop.start && h.end === notePop.end
                        ? { ...h, note: undefined }
                        : h,
                    ),
                  )
                  setNotePop(null)
                }}
              >
                Xóa ghi chú
              </button>
            )}
            <button className="read-btn read-btn-sm" onClick={() => setNotePop(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Trang Đọc — danh sách bài đọc (lưu cloud); mở bài để đọc + bôi màu tra từ.
interface ReadingPageProps {
  onSaveWord: (entry: SaveWordEntry, deckId?: string) => Promise<void>
}

export default function ReadingPage({ onSaveWord }: ReadingPageProps) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [selected, setSelected] = useState<Reading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', level: '' })
  // Lọc danh sách theo cấp độ (chip A1–C2) + ô tìm theo tiêu đề/nội dung
  const [levelFilter, setLevelFilter] = useState('')
  const [query, setQuery] = useState('')
  // Số từ đang có trong bộ "Từ đã lưu khi đọc" — hiện ở nhãn cạnh ô tìm
  const [savedWords, setSavedWords] = useState(0)

  const load = async () => {
    try {
      setReadings(await CloudApi.listReadings())
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
    CloudApi.statsByDeck()
      .then((rows) => setSavedWords(rows.find((d) => d.name === SAVED_DECK_NAME)?.total ?? 0))
      .catch(() => setSavedWords(0))
  }, [])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    try {
      const r = await CloudApi.createReading(form.title.trim(), form.content.trim(), form.level)
      setReadings((x) => [r, ...x])
      setForm({ title: '', content: '', level: '' })
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
      <ReadingViewer
        reading={selected}
        onBack={() => setSelected(null)}
        onSaveWord={onSaveWord}
        onHighlightsChange={(hs) => {
          setSelected((s) => (s ? { ...s, highlights: hs } : s))
          setReadings((x) => x.map((r) => (r.id === selected.id ? { ...r, highlights: hs } : r)))
        }}
      />
    )
  }

  const q = query.trim().toLowerCase()
  const shown = readings.filter(
    (r) =>
      (!levelFilter || r.level === levelFilter) &&
      (!q ||
        r.title.toLowerCase().includes(q) ||
        (r.content ?? '').toLowerCase().includes(q)),
  )
  // Chỉ hiện hàng lọc khi có bài gắn cấp độ
  const hasLevels = readings.some((r) => r.level)

  const openForm = () => {
    setAdding(true)
    window.setTimeout(() => document.getElementById('readTitle')?.focus(), 0)
  }

  return (
    <div className="page read-list-page">
      <div className="read-head">
        <div>
          <h1>Đọc &amp; tra từ</h1>
          <p>
            Thư viện bài đọc của bạn — bôi chữ để dịch và lưu từ mới vào bộ “{SAVED_DECK_NAME}”.
          </p>
        </div>
        <button className="read-btn read-btn-primary" onClick={openForm}>
          <Icon name="plus" /> Thêm bài đọc
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="read-toolbar">
        <label className="read-search">
          <Icon name="search" />
          <input
            className="read-input"
            type="search"
            placeholder="Tìm bài đọc…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {hasLevels && (
          <div className="read-chipset">
            <button
              className={levelFilter ? 'read-chip' : 'read-chip is-active'}
              onClick={() => setLevelFilter('')}
            >
              Tất cả
            </button>
            {LEVELS.filter((l) => readings.some((r) => r.level === l)).map((l) => (
              <button
                key={l}
                className={levelFilter === l ? 'read-chip is-active' : 'read-chip'}
                onClick={() => setLevelFilter(levelFilter === l ? '' : l)}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        <div className="read-spacer" />
        {savedWords > 0 && (
          <span className="read-badge" title={`Bộ “${SAVED_DECK_NAME}”`}>
            <Icon name="bulb" /> {savedWords} từ đã lưu khi đọc
          </span>
        )}
      </div>

      {adding && (
        <form className="read-form" onSubmit={create}>
          <div className="read-form-row">
            <input
              id="readTitle"
              className="read-input"
              placeholder="Tiêu đề bài đọc"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              className="read-select"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              title="Cấp độ CEFR của bài (tùy chọn)"
            >
              <option value="">Cấp độ…</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="read-textarea"
            placeholder="Dán/nhập nội dung tiếng Anh bất kỳ…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div className="read-form-row">
            <button className="read-btn read-btn-primary" type="submit">
              <Icon name="save" /> Lưu bài đọc
            </button>
            <button className="read-btn" type="button" onClick={() => setAdding(false)}>
              Hủy
            </button>
          </div>
        </form>
      )}

      {readings.length === 0 ? (
        <div className="read-empty">
          <Icon name="book" />
          <b>Chưa có bài đọc nào</b>
          <p>Dán một đoạn văn bản tiếng Anh bất kỳ để bắt đầu đọc và tra từ.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="read-empty">
          <Icon name="search" />
          <b>Không tìm thấy bài đọc</b>
          <p>Không có bài nào khớp bộ lọc hiện tại. Thử từ khóa hoặc cấp độ khác.</p>
        </div>
      ) : (
        <section className="read-grid">
          {shown.map((r) => (
            <div
              key={r.id}
              className="read-card"
              role="button"
              tabIndex={0}
              onClick={() => setSelected(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(r)
                }
              }}
            >
              <span className="read-cover">
                <Icon name="book" />
              </span>
              <span className="read-body">
                <span className="read-card-title">{r.title}</span>
                <span className="read-excerpt">{(r.content ?? '').slice(0, 160)}</span>
                <span className="read-foot">
                  {r.level && <span className="read-badge">{r.level}</span>}
                  <span className="read-badge">
                    <Icon name="clock" /> ~{readMinutes(r.content ?? '')} phút
                  </span>
                  <span className="read-tools">
                    <button
                      className="read-ibtn danger"
                      title="Xóa bài đọc"
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(r)
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </span>
                </span>
              </span>
            </div>
          ))}

          <button className="read-add-card" onClick={openForm}>
            <Icon name="plus" />
            <b>Thêm bài đọc</b>
            <span>Dán văn bản tiếng Anh bất kỳ để bắt đầu đọc</span>
          </button>
        </section>
      )}
    </div>
  )
}
