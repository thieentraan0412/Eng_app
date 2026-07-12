import { useState } from 'react'
import Sidebar from './Sidebar'
import TranslatePopup from './TranslatePopup'
import { CloudApi, type Deck } from '../services/cloud/CloudApiClient'
import type { PageKey } from '../pages/pages'
import DashboardPage from '../pages/DashboardPage'
import VocabularyPage from '../pages/VocabularyPage'
import FlashcardPage from '../pages/FlashcardPage'
import ReadingPage from '../pages/ReadingPage'
import GrammarPage from '../pages/GrammarPage'
import WritingPage from '../pages/WritingPage'
import SettingsPage from '../pages/SettingsPage'

const SAVED_DECK_NAME = 'Từ đã lưu khi đọc'

export default function AppLayout() {
  const [page, setPage] = useState<PageKey>('dashboard')

  // Lưu từ đang bôi dịch vào một bộ "Từ đã lưu" (tự tạo nếu chưa có)
  const handleSaveWord = async (entry: { word: string; meaning: string; phonetic?: string }) => {
    if (!entry.meaning) return
    const decks = await CloudApi.listDecks()
    let deck: Deck | undefined = decks.find((d) => d.name === SAVED_DECK_NAME)
    if (!deck) deck = await CloudApi.createDeck(SAVED_DECK_NAME, 'Các từ lưu khi bôi màu dịch')
    await CloudApi.createCard(deck.id, {
      word: entry.word,
      meaning: entry.meaning,
      phonetic: entry.phonetic,
    })
  }

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
      case 'grammar':
        return <GrammarPage />
      case 'writing':
        return <WritingPage />
    }
  }

  return (
    <div className="app-root">
      <Sidebar current={page} onNavigate={setPage} />
      <div className="main-area">
        <main className="content">{renderPage()}</main>
      </div>
      <TranslatePopup onSave={handleSaveWord} />
    </div>
  )
}
