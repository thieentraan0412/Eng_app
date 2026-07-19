// ============================================================
// Heatmap — lưới ô kiểu GitHub: mỗi cột 1 tuần, mỗi hàng 1 thứ trong tuần.
// Nhận danh sách ngày LIÊN TỤC {date, value} (tăng dần) và tô đậm theo value.
// ============================================================

interface Day {
  date: string // YYYY-MM-DD
  value: number
}

interface Cell {
  date: string
  value: number
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12']

// Mức đậm 0..4 theo tỷ lệ với giá trị lớn nhất (0 = không học)
function level(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0
  const r = value / max
  if (r > 0.66) return 4
  if (r > 0.33) return 3
  if (r > 0.12) return 2
  return 1
}

export default function Heatmap({
  data,
  unit = '',
}: {
  data: Day[]
  unit?: string
}) {
  if (data.length === 0) return <p className="muted">Chưa có dữ liệu.</p>

  const max = Math.max(...data.map((d) => d.value))

  // Đệm ô trống đầu để cột đầu bắt đầu từ Chủ nhật (getDay: 0=CN…6=T7)
  const firstDow = new Date(data[0].date + 'T00:00:00').getDay()
  const cells: (Cell | null)[] = [...Array(firstDow).fill(null), ...data]

  // Chia thành các cột 7 ô (1 tuần / cột)
  const weeks: (Cell | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  // Nhãn tháng: hiện khi ô trên cùng của cột sang tháng mới
  const monthLabel = (week: (Cell | null)[], wi: number): string => {
    const first = week.find(Boolean) as Cell | undefined
    if (!first) return ''
    const m = new Date(first.date + 'T00:00:00').getMonth()
    if (wi === 0) return MONTHS[m]
    const prev = weeks[wi - 1].find(Boolean) as Cell | undefined
    const pm = prev ? new Date(prev.date + 'T00:00:00').getMonth() : -1
    return m !== pm ? MONTHS[m] : ''
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap">
        <div className="hm-weekdays">
          {WEEKDAYS.map((w, i) => (
            <span key={w} className="hm-wd">
              {i % 2 === 1 ? w : ''}
            </span>
          ))}
        </div>
        <div className="hm-grid-area">
          <div className="hm-months">
            {weeks.map((w, wi) => (
              <span key={wi} className="hm-month">
                {monthLabel(w, wi)}
              </span>
            ))}
          </div>
          <div className="hm-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="hm-col">
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = week[di] ?? null
                  if (!cell) return <span key={di} className="hm-cell empty" />
                  const lv = level(cell.value, max)
                  const nice = new Date(cell.date + 'T00:00:00').toLocaleDateString('vi-VN')
                  return (
                    <span
                      key={di}
                      className={`hm-cell lv${lv}`}
                      title={`${nice}: ${cell.value}${unit ? ' ' + unit : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hm-legend">
        <span className="muted">Ít</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`hm-cell lv${l}`} />
        ))}
        <span className="muted">Nhiều</span>
      </div>
    </div>
  )
}
