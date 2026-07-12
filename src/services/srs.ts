// ============================================================
// Thuật toán lặp lại ngắt quãng SM-2 (giống Anki, rút gọn)
// Tính trạng thái SRS mới của thẻ sau mỗi lần người dùng đánh giá.
// ============================================================

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  srs_interval: number // số ngày tới lần ôn kế tiếp
  srs_ease: number // hệ số dễ (ease factor)
  srs_reps: number // số lần ôn đúng liên tiếp
  srs_due_date: string // YYYY-MM-DD
}

// Quy đổi rating -> điểm chất lượng q (0..5) như SM-2
const QUALITY: Record<Rating, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
}

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function nextSrs(current: SrsState, rating: Rating): SrsState {
  let interval = current.srs_interval
  let ease = current.srs_ease
  let reps = current.srs_reps
  const q = QUALITY[rating]

  if (rating === 'again') {
    // Trả lời sai -> học lại từ đầu
    reps = 0
    interval = 1
  } else {
    reps += 1
    if (reps === 1) interval = 1
    else if (reps === 2) interval = 6
    else interval = Math.round(interval * ease)

    // Điều chỉnh ease factor theo công thức SM-2
    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (ease < 1.3) ease = 1.3

    // "Hard" thì rút ngắn khoảng cách một chút
    if (rating === 'hard') interval = Math.max(1, Math.round(interval * 0.8))
  }

  return {
    srs_interval: interval,
    srs_ease: ease,
    srs_reps: reps,
    srs_due_date: addDays(interval),
  }
}

// Nhãn tiếng Việt + khoảng cách dự kiến để hiển thị trên nút
export function previewInterval(current: SrsState, rating: Rating): string {
  const next = nextSrs(current, rating)
  const d = next.srs_interval
  return d <= 1 ? '1 ngày' : `${d} ngày`
}
