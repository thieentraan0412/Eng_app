import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import TranslatePopup from './TranslatePopup'
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
import WritingPage from '../pages/WritingPage'
import SentencePage from '../pages/SentencePage'
import UsagePage from '../pages/UsagePage'
import SettingsPage from '../pages/SettingsPage'

const SAVED_DECK_NAME = 'Từ đã lưu khi đọc'

// Các trang được tính là "đang học" -> đo thời gian học (minutes_studied)
const STUDY_PAGES = new Set<PageKey>([
  'flashcard',
  'exercise',
  'reading',
  'writing',
  'sentence',
  'vocabulary',
])

export default function AppLayout() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [toast, setToast] = useState<string | null>(null)
  const [navOpen, setNavOpen] = useState(false) // drawer menu trên mobile

  // Đo thời gian học khi đang ở một trang học (dừng khi rời trang / ẩn cửa sổ)
  useStudyTime(STUDY_PAGES.has(page))

  // Chọn trang: chuyển trang + đóng drawer (mobile)
  const goto = (p: PageKey) => {
    setPage(p)
    setNavOpen(false)
  }

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
    entry: { word: string; meaning: string; phonetic?: string; pos?: string },
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
    const pos = entry.pos ?? data.pos[0] ?? (offPos ? shortPos(offPos) : '')
    const collocations = data.collocations.slice(0, 4)
    const patterns = data.patterns.slice(0, 3)

    // Ví dụ: ưu tiên câu ĐÚNG TỪ LOẠI đã chọn (VD chọn "v" -> chỉ lấy ví dụ động từ)
    const byPos: Record<string, string[]> = data.examplesByPos
    let examples = (pos ? (byPos[pos] ?? []) : []).slice(0, 2)
    // Người dùng KHÔNG chỉ định từ loại -> mới được dùng ví dụ chung (mọi loại)
    if (examples.length === 0 && !entry.pos) examples = data.examples.slice(0, 2)
    // Vẫn trống -> tìm câu thật (Tatoeba); với động từ tìm "to <từ>" cho đúng cách dùng
    if (isSingleWord && examples.length === 0) {
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
    }
  }, [])

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage onNavigate={setPage} />
      case 'vocabulary':
        return <VocabularyPage />
      case 'flashcard':
        return <FlashcardPage />
      case 'reading':
        return <ReadingPage />
      case 'settings':
        return <SettingsPage />
      case 'exercise':
        return <ExercisePage />
      case 'writing':
        return <WritingPage />
      case 'sentence':
        return <SentencePage />
      case 'usage':
        return <UsagePage />
    }
  }

  return (
    <div className={navOpen ? 'app-root nav-open' : 'app-root'}>
      {/* Thanh trên cùng chỉ hiện trên mobile: nút mở menu + thương hiệu */}
      <header className="mobile-topbar">
        <button
          className="hamburger"
          onClick={() => setNavOpen(true)}
          aria-label="Mở menu"
          aria-expanded={navOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="mobile-brand">
          <span className="brand-badge">E</span>
          <span>EngMaster</span>
        </div>
      </header>

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
      <TranslatePopup onSave={handleSaveWord} />
      {toast && <div className="app-toast">{toast}</div>}
    </div>
  )
}
