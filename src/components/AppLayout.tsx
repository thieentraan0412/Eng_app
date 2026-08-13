import { useEffect, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import TranslatePopup from './TranslatePopup'
import WindowBar from './WindowBar'
import { useWindowChrome } from '../contexts/WindowChromeContext'
import { isDesktop } from '../platform'
import { CloudApi, type Deck } from '../services/cloud/CloudApiClient'
import { translate, translateOnline } from '../services/translation'
import { fetchEnrichment, searchSentences, shortPos } from '../services/enrich'
import { track, useStudyTime } from '../services/studyTracker'
import type { PageKey } from '../pages/pages'
import DashboardPage from '../pages/DashboardPage'
import VocabularyPage from '../pages/VocabularyPage'
import FlashcardPage from '../pages/FlashcardPage'
import ReadingPage from '../pages/ReadingPage'
import ExercisePage from '../pages/ExercisePage'
import GrammarPage from '../pages/GrammarPage'
import WritingPage from '../pages/WritingPage'
import SentencePage from '../pages/SentencePage'
import UsagePage from '../pages/UsagePage'
import SettingsPage from '../pages/SettingsPage'
import QuickTranslateModal from './QuickTranslateModal'
import { matchesAccelerator, readQuickTranslateHotkey } from '../services/hotkey'
import { readSelectedText } from '../services/selection'
import { watchKeyboardInset } from '../services/keyboardInset'

const SAVED_DECK_NAME = 'Từ đã lưu khi đọc'

// Các trang được tính là "đang học" -> đo thời gian học (minutes_studied)
const STUDY_PAGES = new Set<PageKey>([
  'flashcard',
  'exercise',
  'grammar',
  'reading',
  'writing',
  'sentence',
  'vocabulary',
])

export default function AppLayout() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [toast, setToast] = useState<string | null>(null)
  const [navOpen, setNavOpen] = useState(false) // drawer menu trên mobile
  const [quickTranslateOpen, setQuickTranslateOpen] = useState(false)
  const [quickTranslateSeed, setQuickTranslateSeed] = useState('')
  // Bộ nghe phím tắt chỉ gắn một lần nên phải soi trạng thái qua ref.
  const quickTranslateOpenRef = useRef(false)
  quickTranslateOpenRef.current = quickTranslateOpen
  const [quickTranslateHotkey, setQuickTranslateHotkey] = useState(readQuickTranslateHotkey)
  const { hidden: chromeHidden, fullScreen } = useWindowChrome()
  const [translateEnabled, setTranslateEnabled] = useState(
    localStorage.getItem('desktop_translate_enabled') === '1',
  )

  // Đo thời gian học khi đang ở một trang học (dừng khi rời trang / ẩn cửa sổ)
  useStudyTime(STUDY_PAGES.has(page))

  // Chọn trang: chuyển trang + đóng drawer (mobile)
  const goto = (p: PageKey) => {
    setPage(p)
    setNavOpen(false)
  }

  useEffect(() => {
    if (chromeHidden) setNavOpen(false)
  }, [chromeHidden])

  // Đo bàn phím ảo cho toàn app (xem services/keyboardInset.ts)
  useEffect(() => watchKeyboardInset(), [])

  // Dịch bằng bàn phím: desktop đăng ký phím tắt toàn hệ thống; web lắng nghe
  // tổ hợp khi tab đang hoạt động. Cài đặt có thể mở thử modal bằng custom event.
  useEffect(() => {
    const openModal = (seed = '') => {
      setNavOpen(false)
      setQuickTranslateSeed(seed)
      setQuickTranslateOpen(true)
    }
    // Bản web cũng bật/tắt như desktop: đang mở mà bấm phím tắt lần nữa là đóng.
    // Lúc mở thì lấy luôn chữ đang bôi đen để khỏi phải gõ lại.
    const toggleModal = () => {
      if (quickTranslateOpenRef.current) {
        setQuickTranslateOpen(false)
        return
      }
      openModal(readSelectedText())
    }
    const onOpen = () => openModal(readSelectedText())
    const onHotkeyChanged = (event: Event) => {
      setQuickTranslateHotkey(String((event as CustomEvent<string>).detail ?? ''))
    }
    window.addEventListener('quick-translate-hotkey-changed', onHotkeyChanged)

    let onWebKey: ((event: KeyboardEvent) => void) | undefined
    let onSelect: (() => void) | undefined
    if (isDesktop && window.api) {
      void window.api.setQuickTranslateHotkey(quickTranslateHotkey)
      // Phím tắt chạy ở main process nên không đọc được vùng chọn của trang;
      // gửi sẵn chữ vừa bôi đen để cửa sổ dịch có cái mà đổ vào ô nhập.
      let lastSent = ''
      onSelect = () => {
        const selected = readSelectedText()
        if (selected === lastSent) return
        lastSent = selected
        void window.api.setQuickTranslateSelection(selected)
      }
      document.addEventListener('mouseup', onSelect)
      document.addEventListener('keyup', onSelect)
    } else {
      window.addEventListener('quick-translate-open', onOpen)
      onWebKey = (event: KeyboardEvent) => {
        const accelerator = readQuickTranslateHotkey()
        if (!event.repeat && matchesAccelerator(event, accelerator)) {
          event.preventDefault()
          toggleModal()
        }
      }
      window.addEventListener('keydown', onWebKey, true)
    }

    return () => {
      window.removeEventListener('quick-translate-open', onOpen)
      window.removeEventListener('quick-translate-hotkey-changed', onHotkeyChanged)
      if (onWebKey) window.removeEventListener('keydown', onWebKey, true)
      if (onSelect) {
        document.removeEventListener('mouseup', onSelect)
        document.removeEventListener('keyup', onSelect)
      }
    }
    // Chỉ đăng ký lúc khởi tạo; thay đổi trong Cài đặt gọi API trực tiếp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Chọn bộ đích: deckId đã chọn > bộ dùng gần nhất > bộ mới nhất > tạo bộ mặc định
  const resolveDeck = async (deckId?: string): Promise<Deck> => {
    const decks = await CloudApi.listDecks()
    const byId = (id?: string | null) => (id ? decks.find((d) => d.id === id) : undefined)
    const chosen = byId(deckId) ?? byId(localStorage.getItem('last_deck_id')) ?? decks[0]
    if (chosen) return chosen
    return CloudApi.createDeck(SAVED_DECK_NAME, 'Các từ lưu khi bôi màu dịch')
  }

  // Lưu từ đang bôi dịch vào bộ đã chọn (hoặc bộ gần nhất),
  // LÀM GIÀU đầy đủ giống thêm thủ công: nghĩa + từ loại + collocation + pattern + ví dụ.
  const handleSaveWord = async (
    entry: {
      word: string
      meaning: string
      phonetic?: string
      pos?: string
      example?: string
      inferPos?: boolean
    },
    deckId?: string,
  ) => {
    const word = entry.word.trim()
    if (!word) return
    const lw = word.toLowerCase()
    const isSingleWord = /^[a-z]+$/.test(lw)

    // Nghĩa: ưu tiên nghĩa sẵn có; trống -> offline rồi online
    let meaning = entry.meaning?.trim() ?? ''
    if (!meaning) {
      meaning = translate(lw).vi ?? (await translateOnline(lw)) ?? ''
    }

    // Làm giàu (chỉ với từ đơn): collocation / pattern / ví dụ / từ loại
    const data = isSingleWord
      ? await fetchEnrichment(lw)
      : { collocations: [], patterns: [], examples: [], examplesByPos: {}, pos: [] }

    // Từ loại: ưu tiên loại người dùng chọn trong popup, rồi mới đoán tự động
    const offPos = translate(lw).pos
    // Ở trang Đọc, nếu UI chưa chọn POS thì không âm thầm gắn một nhãn khác với
    // tab/nghĩa người dùng đang thấy. Các popup cũ không có câu ngữ cảnh vẫn được tự đoán.
    const inferredPos = entry.inferPos === false
      ? ''
      : data.pos[0] ?? (offPos && !/[\/,;]/.test(offPos) ? shortPos(offPos) : '')
    const pos = entry.pos ?? inferredPos
    const collocations = data.collocations.slice(0, 4)
    const patterns = data.patterns.slice(0, 3)

    // Ví dụ: ưu tiên chính câu người dùng đang đọc, sau đó mới tìm theo từ loại.
    const byPos: Record<string, string[]> = data.examplesByPos
    const readingExample = entry.example?.replace(/\s+/g, ' ').trim()
    let examples = readingExample
      ? [readingExample]
      : (pos ? (byPos[pos] ?? []) : []).slice(0, 2)
    // Người dùng KHÔNG chỉ định từ loại -> mới được dùng ví dụ chung (mọi loại)
    if (examples.length === 0 && !entry.pos && entry.inferPos !== false)
      examples = data.examples.slice(0, 2)
    // Vẫn trống -> tìm câu thật (Tatoeba); với động từ tìm "to <từ>" cho đúng cách dùng
    if (isSingleWord && examples.length === 0 && (entry.inferPos !== false || Boolean(pos))) {
      examples = await searchSentences(pos === 'v' ? `to ${lw}` : lw, 2)
      // "to <từ>" không ra câu nào (từ đã chia: paid, went…) -> tìm theo chính từ đó
      if (examples.length === 0) examples = await searchSentences(lw, 2)
    }

    const deck = await resolveDeck(deckId)
    await CloudApi.createCard(deck.id, {
      word,
      meaning,
      phonetic: entry.phonetic,
      pos: pos || undefined,
      collocation: collocations.length ? collocations.join('\n') : undefined,
      pattern: patterns.length ? patterns.join('\n') : undefined,
      example: examples.length ? examples.join('\n') : undefined,
    })
    track.newWords(1) // đếm vào study_stats: +1 từ mới (lưu nhanh khi bôi dịch)
    localStorage.setItem('last_deck_id', deck.id) // nhớ bộ gần nhất cho lần sau
  }

  // Đồng bộ trạng thái tính năng "Dịch nhanh toàn màn hình" theo cài đặt đã lưu,
  // và nhận yêu cầu "Lưu vào bộ từ" đến từ popup toàn cục (cửa sổ khác).
  useEffect(() => {
    if (!window.api) return // web: không có tính năng dịch toàn màn hình / quick-save
    // Cửa sổ luôn nổi trên cùng: khôi phục theo cài đặt đã lưu ở lần mở trước
    if (localStorage.getItem('always_on_top') === '1') {
      void window.api.setAlwaysOnTop(true)
    }
    // Phím tắt toàn cục bật/tắt "Luôn nổi trên cùng" (mặc định Ctrl+Alt+T).
    window.api.setAlwaysOnTopHotkey(
      localStorage.getItem('always_on_top_hotkey') ?? 'Ctrl+Alt+T',
    )
    const offOnTop = window.api.onAlwaysOnTopState((on) => {
      localStorage.setItem('always_on_top', on ? '1' : '0')
      window.dispatchEvent(new CustomEvent('always-on-top-changed', { detail: on }))
      setToast(on ? '📌 Luôn nổi trên cùng: BẬT' : '📌 Luôn nổi trên cùng: TẮT')
      window.setTimeout(() => setToast(null), 2600)
    })
    if (localStorage.getItem('desktop_translate_enabled') === '1') {
      window.api.setDesktopTranslate(true)
    }
    // Phím tắt toàn cục bật/tắt dịch nhanh (mặc định Ctrl+Alt+D, đổi được ở Cài đặt)
    window.api.setTranslateHotkey(localStorage.getItem('desktop_translate_hotkey') ?? 'Ctrl+Alt+D')
    // Phím tắt được nhấn -> main đã đổi trạng thái -> lưu cài đặt + toast + báo trang Cài đặt
    const offState = window.api.onDesktopTranslateState((on) => {
      localStorage.setItem('desktop_translate_enabled', on ? '1' : '0')
      window.dispatchEvent(new CustomEvent('desktop-translate-changed', { detail: on }))
      setToast(on ? '🖱️ Dịch nhanh toàn màn hình: BẬT' : 'Dịch nhanh toàn màn hình: TẮT')
      window.setTimeout(() => setToast(null), 2600)
    })
    const off = window.api.onQuickSave(async ({ entry, deckId }) => {
      try {
        await handleSaveWord(entry, deckId)
        setToast(`Đã lưu “${entry.word}” vào bộ từ`)
      } catch {
        setToast('Lưu từ thất bại (kiểm tra đăng nhập / mạng)')
      }
      window.setTimeout(() => setToast(null), 2600)
    })
    return () => {
      off()
      offState()
      offOnTop()
    }
  }, [])

  // Công tắc dịch dùng chung cho cả tính năng toàn màn hình và popup bôi chữ
  // bên trong app. Khi tắt, unmount popup để đóng kết quả đang mở và gỡ toàn
  // bộ listener chọn văn bản ngay lập tức.
  useEffect(() => {
    const handleTranslateState = (event: Event) => {
      setTranslateEnabled(Boolean((event as CustomEvent<boolean>).detail))
    }
    window.addEventListener('desktop-translate-changed', handleTranslateState)
    return () => window.removeEventListener('desktop-translate-changed', handleTranslateState)
  }, [])

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage onNavigate={setPage} />
      case 'vocabulary':
        return <VocabularyPage onNavigate={setPage} />
      case 'flashcard':
        return <FlashcardPage />
      case 'reading':
        return <ReadingPage onSaveWord={handleSaveWord} />
      case 'settings':
        return <SettingsPage />
      case 'exercise':
        return <ExercisePage />
      case 'grammar':
        return <GrammarPage />
      case 'writing':
        return <WritingPage />
      case 'sentence':
        return <SentencePage />
      case 'usage':
        return <UsagePage />
    }
  }

  return (
    <div
      className={[
        'app-root',
        navOpen ? 'nav-open' : '',
        isDesktop && !chromeHidden && !fullScreen ? 'has-window-bar' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Một hàng duy nhất: vừa kéo/điều khiển cửa sổ, vừa mở menu ở màn nhỏ. */}
      <WindowBar onOpenMenu={() => setNavOpen((open) => !open)} menuOpen={navOpen} />

      {/* Bản web vẫn dùng thanh mobile cũ vì trình duyệt tự có nút cửa sổ. */}
      {!isDesktop && !chromeHidden && (
        <header className="mobile-topbar">
          <button
            className="hamburger"
            onClick={() => setNavOpen(true)}
            aria-label="Mở menu"
            aria-expanded={navOpen}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="mobile-brand">
            <span className="brand-badge">E</span>
            <span>EngMaster</span>
          </div>
        </header>
      )}

      {/* Nền mờ khi mở drawer — chạm để đóng */}
      <div
        className="nav-overlay"
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />

      <Sidebar current={page} onNavigate={goto} onClose={() => setNavOpen(false)} />
      <div className="main-area">
        <main className="content">{renderPage()}</main>
      </div>
      {!isDesktop && (
        <QuickTranslateModal
          open={quickTranslateOpen}
          hotkey={quickTranslateHotkey}
          seedText={quickTranslateSeed}
          onClose={() => setQuickTranslateOpen(false)}
        />
      )}
      {translateEnabled && <TranslatePopup onSave={handleSaveWord} />}
      {toast && <div className="app-toast">{toast}</div>}
    </div>
  )
}
