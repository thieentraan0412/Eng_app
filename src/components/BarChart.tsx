// Biểu đồ cột đơn giản (thuần CSS, không cần thư viện) — số thẻ ôn theo ngày.
interface Props {
  data: { date: string; count: number }[]
}

export default function BarChart({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="barchart">
      {data.map((d) => {
        const day = Number(d.date.slice(8, 10))
        return (
          <div className="bar-col" key={d.date} title={`${d.date}: ${d.count} thẻ`}>
            <div className="bar-wrap">
              <div
                className={d.count > 0 ? 'bar filled' : 'bar'}
                style={{ height: `${(d.count / max) * 100}%` }}
              >
                {d.count > 0 && <span className="bar-val">{d.count}</span>}
              </div>
            </div>
            <div className="bar-label">{day}</div>
          </div>
        )
      })}
    </div>
  )
}
