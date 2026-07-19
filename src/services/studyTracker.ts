// ============================================================
// studyTracker — gom hoạt động học tập rồi ghi vào study_stats.
// Mục tiêu: đo "phút học", "thẻ đã ôn", "từ mới", "quiz" mà KHÔNG bắn
// quá nhiều request. Các sự kiện cộng vào bộ đệm; định kỳ (hoặc khi rời
// trang / ẩn cửa sổ) mới gọi CloudApi.bumpStats một lần.
// ============================================================
import { useEffect } from 'react'
import { CloudApi, type StatsDelta } from './cloud/CloudApiClient'

interface Buffer {
  cards: number
  seconds: number // thời gian học tích lũy (giây) — quy ra phút khi ghi
  newWords: number
  quizzes: number
}

const buf: Buffer = { cards: 0, seconds: 0, newWords: 0, quizzes: 0 }
let flushTimer: number | undefined
const FLUSH_DELAY = 20_000 // gom 20s rồi ghi 1 lần

function schedule() {
  if (flushTimer != null) return
  flushTimer = window.setTimeout(() => {
    flushTimer = undefined
    void flush()
  }, FLUSH_DELAY)
}

// Ghi phần đang đệm lên cloud. Chỉ trừ đúng phần ĐÃ GỬI khỏi bộ đệm để
// nếu offline (bump ném lỗi) thì dữ liệu vẫn còn, lần sau gửi lại.
export async function flush(): Promise<void> {
  if (flushTimer != null) {
    window.clearTimeout(flushTimer)
    flushTimer = undefined
  }
  const minutes = Math.floor(buf.seconds / 60)
  const delta: StatsDelta = {
    cards: buf.cards,
    minutes,
    newWords: buf.newWords,
    quizzes: buf.quizzes,
  }
  if (!buf.cards && !buf.newWords && !buf.quizzes && minutes < 1) return
  try {
    await CloudApi.bumpStats(delta)
    buf.cards = 0
    buf.newWords = 0
    buf.quizzes = 0
    buf.seconds -= minutes * 60 // giữ lại phần lẻ < 1 phút
  } catch {
    // offline / chưa chạy migration RPC -> giữ nguyên bộ đệm, thử lại sau
    schedule()
  }
}

export const track = {
  cards(n = 1) {
    if (n > 0) {
      buf.cards += n
      schedule()
    }
  },
  newWords(n = 1) {
    if (n > 0) {
      buf.newWords += n
      schedule()
    }
  },
  quizzes(n = 1) {
    if (n > 0) {
      buf.quizzes += n
      schedule()
    }
  },
  seconds(s: number) {
    if (s > 0) {
      buf.seconds += s
      schedule()
    }
  },
}

// Ghi nốt bộ đệm trước khi đóng cửa sổ (best-effort)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void flush()
  })
}

// ---------- Hook đo thời gian học ----------
// Đếm thời gian trong khi component còn gắn VÀ cửa sổ đang hiển thị
// (ẩn tab/minimize thì dừng — không tính giờ khi người dùng bỏ đi).
// Cộng vào bộ đệm "seconds"; tự ghi khi rời trang.
// Giới hạn mỗi mạch < 90 phút để cửa sổ mở-quên không thổi phồng số liệu.
export function useStudyTime(active = true): void {
  useEffect(() => {
    if (!active) return
    const MAX_STRETCH_MS = 90 * 60_000
    let startedAt = document.hidden ? 0 : Date.now()

    const accumulate = () => {
      if (!startedAt) return
      const ms = Math.min(Date.now() - startedAt, MAX_STRETCH_MS)
      track.seconds(ms / 1000)
      startedAt = 0
    }

    const onVisibility = () => {
      if (document.hidden) accumulate()
      else startedAt = Date.now()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      accumulate()
      document.removeEventListener('visibilitychange', onVisibility)
      void flush()
    }
  }, [active])
}
