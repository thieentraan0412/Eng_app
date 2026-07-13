import { supabase } from './supabaseClient'
import type { Session, User } from '@supabase/supabase-js'
import { nextSrs, type Rating } from '../srs'

// ============================================================
// CloudApiClient — điểm truy cập duy nhất tới dữ liệu Cloud.
// Mọi đọc/ghi dữ liệu người dùng đi qua đây (không có CSDL cục bộ).
// RLS ở Postgres tự lọc theo user đang đăng nhập.
// ============================================================

export interface Deck {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  user_id: string
  deck_id: string
  word: string
  meaning: string | null
  phonetic: string | null
  example: string | null
  collocation: string | null
  pattern: string | null
  pos: string | null
  srs_interval: number
  srs_ease: number
  srs_due_date: string
  srs_reps: number
}

export interface NewCard {
  word: string
  meaning?: string
  phonetic?: string
  example?: string
  collocation?: string
  pattern?: string
  pos?: string
}

export interface Lesson {
  id: string
  user_id: string
  title: string
  content: string | null
  level: string | null
  created_at: string
}

export type QuestionType = 'mcq' | 'fill_blank'

export interface Question {
  id: string
  user_id: string
  lesson_id: string
  type: QuestionType
  prompt: string
  options: string[] | null
  correct_answer: string | null
  explanation: string | null
}

export interface NewQuestion {
  type: QuestionType
  prompt: string
  options?: string[]
  correct_answer: string
  explanation?: string
}

export interface Reading {
  id: string
  user_id: string
  title: string
  content: string | null
  level: string | null
  created_at: string
}

export interface Writing {
  id: string
  user_id: string
  title: string | null
  content: string | null
  word_count: number
  topic: string | null
  created_at: string
  updated_at: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export const CloudApi = {
  // ---------- Auth ----------
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string): Promise<Session | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.session
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async currentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  // ---------- Decks (bộ từ) ----------
  async listDecks(): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Deck[]
  },

  async createDeck(name: string, description = ''): Promise<Deck> {
    const user = await this.currentUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const { data, error } = await supabase
      .from('decks')
      .insert({ user_id: user.id, name, description })
      .select()
      .single()
    if (error) throw error
    return data as Deck
  },

  async deleteDeck(deckId: string): Promise<void> {
    const { error } = await supabase
      .from('decks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deckId)
    if (error) throw error
  },

  // ---------- Cards (thẻ từ) ----------
  async listCards(deckId: string): Promise<Card[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Card[]
  },

  async createCard(deckId: string, card: NewCard): Promise<Card> {
    const user = await this.currentUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const { data, error } = await supabase
      .from('cards')
      .insert({
        user_id: user.id,
        deck_id: deckId,
        word: card.word,
        meaning: card.meaning ?? null,
        phonetic: card.phonetic ?? null,
        example: card.example ?? null,
        collocation: card.collocation ?? null,
        pattern: card.pattern ?? null,
        pos: card.pos ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data as Card
  },

  async deleteCard(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('cards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', cardId)
    if (error) throw error
  },

  async getDueCards(deckId: string): Promise<Card[]> {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .is('deleted_at', null)
      .lte('srs_due_date', today())
      .order('srs_due_date', { ascending: true })
    if (error) throw error
    return data as Card[]
  },

  // Ôn 1 thẻ: tính SRS mới, cập nhật card + ghi review_log
  async reviewCard(card: Card, rating: Rating): Promise<Card> {
    const next = nextSrs(card, rating)
    const { data, error } = await supabase
      .from('cards')
      .update(next)
      .eq('id', card.id)
      .select()
      .single()
    if (error) throw error

    await supabase.from('review_logs').insert({
      user_id: card.user_id,
      card_id: card.id,
      rating,
      interval_after: next.srs_interval,
    })

    return data as Card
  },

  // ---------- Lessons (bài ngữ pháp) ----------
  async listLessons(): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Lesson[]
  },

  async createLesson(title: string, content = '', level = ''): Promise<Lesson> {
    const user = await this.currentUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const { data, error } = await supabase
      .from('lessons')
      .insert({ user_id: user.id, title, content, level })
      .select()
      .single()
    if (error) throw error
    return data as Lesson
  },

  async deleteLesson(id: string): Promise<void> {
    const { error } = await supabase
      .from('lessons')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  // ---------- Questions (câu hỏi bài tập) ----------
  async listQuestions(lessonId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('id', { ascending: true })
    if (error) throw error
    return data as Question[]
  },

  async createQuestion(lessonId: string, q: NewQuestion): Promise<Question> {
    const user = await this.currentUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const { data, error } = await supabase
      .from('questions')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        type: q.type,
        prompt: q.prompt,
        options: q.options ?? null,
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data as Question
  },

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) throw error
  },

  // ---------- Readings (bài đọc) ----------
  async listReadings(): Promise<Reading[]> {
    const { data, error } = await supabase
      .from('readings')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Reading[]
  },

  async createReading(title: string, content: string, level = ''): Promise<Reading> {
    const user = await this.currentUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const { data, error } = await supabase
      .from('readings')
      .insert({ user_id: user.id, title, content, level })
      .select()
      .single()
    if (error) throw error
    return data as Reading
  },

  async deleteReading(id: string): Promise<void> {
    const { error } = await supabase
      .from('readings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  // ---------- Writings (bài viết) ----------
  async listWritings(): Promise<Writing[]> {
    const { data, error } = await supabase
      .from('writings')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data as Writing[]
  },

  async createWriting(title: string, content: string, wordCount: number): Promise<Writing> {
    const user = await this.currentUser()
    if (!user) throw new Error('Chưa đăng nhập')
    const { data, error } = await supabase
      .from('writings')
      .insert({ user_id: user.id, title, content, word_count: wordCount })
      .select()
      .single()
    if (error) throw error
    return data as Writing
  },

  async updateWriting(
    id: string,
    title: string,
    content: string,
    wordCount: number,
  ): Promise<Writing> {
    const { data, error } = await supabase
      .from('writings')
      .update({ title, content, word_count: wordCount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Writing
  },

  async deleteWriting(id: string): Promise<void> {
    const { error } = await supabase
      .from('writings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  // ---------- Thống kê nhanh cho Dashboard ----------
  async summary(): Promise<{ decks: number; cards: number; due: number }> {
    const [{ count: decks }, { count: cards }, { count: due }] = await Promise.all([
      supabase.from('decks').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('cards').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .lte('srs_due_date', today()),
    ])
    return { decks: decks ?? 0, cards: cards ?? 0, due: due ?? 0 }
  },

  // Số thẻ đã ôn theo từng ngày trong `days` ngày gần nhất (cho biểu đồ + streak)
  async reviewsByDay(days = 14): Promise<{ date: string; count: number }[]> {
    const from = new Date()
    from.setDate(from.getDate() - (days - 1))
    const fromDate = from.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('review_logs')
      .select('reviewed_at')
      .gte('reviewed_at', fromDate)
    if (error) throw error

    // Gom nhóm theo ngày
    const counts = new Map<string, number>()
    for (const row of data as { reviewed_at: string }[]) {
      const d = row.reviewed_at.slice(0, 10)
      counts.set(d, (counts.get(d) ?? 0) + 1)
    }

    // Trả về đủ mọi ngày (kể cả ngày 0 thẻ) để vẽ biểu đồ liền mạch
    const result: { date: string; count: number }[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(from)
      d.setDate(from.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: key, count: counts.get(key) ?? 0 })
    }
    return result
  },
}

// Tính streak: số ngày học liên tục tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa học)
export function computeStreak(byDay: { date: string; count: number }[]): number {
  let streak = 0
  for (let i = byDay.length - 1; i >= 0; i--) {
    if (byDay[i].count > 0) streak++
    else if (i === byDay.length - 1) continue // hôm nay chưa học -> vẫn tính tiếp từ hôm qua
    else break
  }
  return streak
}
