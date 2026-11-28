// Mưa từ — hiệu ứng "bắn súng" vẽ trên một canvas phủ lên vùng chơi.
//  - Khẩu pháo ở giữa mép dưới, nòng xoay theo từ đang nhắm.
//  - Mỗi chữ gõ đúng: một viên đạn (quả cầu sáng có đuôi sao chổi) bay đuổi theo từ đó,
//    chạm vào thì toé tia lửa nhỏ. Đạn bay ~0,2–0,4 giây để mắt kịp thấy.
//  - Gõ xong cả từ: phát đạn cuối; từ đứng lại chờ đạn tới rồi nổ tung (mảnh vỡ, vòng sóng,
//    chớp sáng, rung nhẹ màn). fire() trả về thời gian bay để RainStage hẹn giờ cho từ nổ.
//  - Gõ sai: nòng xì khói đỏ.
// Toàn bộ chạy trong vòng lặp khung hình của RainStage (update + draw mỗi khung), không dùng
// setTimeout. Máy bật "giảm chuyển động" (Windows tắt hiệu ứng động) thì vẫn bắn — đây là
// phần chính của game — nhưng không rung màn và ít mảnh vỡ hơn.

interface Bullet {
  x0: number
  y0: number
  /** Đích (cập nhật mỗi khung nếu đạn đuổi theo một từ đang rơi) */
  x1: number
  y1: number
  /** id từ đang rơi để đạn đuổi theo; null = đích cố định */
  targetId: number | null
  x: number
  y: number
  t: number
  dur: number
  boom: boolean
  /** Các vị trí gần đây để vẽ đuôi sao chổi */
  trail: { x: number; y: number }[]
}

export type TargetResolver = (id: number) => { x: number; y: number } | null

interface Part {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  spin: number
  rot: number
}

interface Ring {
  x: number
  y: number
  t: number
  max: number
  color: string
}

export interface FxColors {
  primary: string
  success: string
  warn: string
  danger: string
  accent: string
  text: string
  surface: string
}

const GRAVITY = 820 // px/s²
const BARREL = 42 // độ dài nòng
const BASE_R = 28 // bán kính bệ pháo
const BULLET_SPEED = 1.25 // px mỗi ms (~1250 px/s): đủ nhanh để có cảm giác bắn, đủ chậm để thấy đạn bay
const TRAIL = 10 // số điểm đuôi sao chổi

export function readFxColors(el: Element): FxColors {
  const cs = getComputedStyle(el)
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  return {
    primary: v('--primary', '#4f46e5'),
    success: v('--success', '#12b76a'),
    warn: v('--warn', '#f79009'),
    danger: v('--danger', '#f04438'),
    accent: v('--accent-3', '#7c3aed'),
    text: v('--text', '#101828'),
    surface: v('--surface', '#ffffff'),
  }
}

export function createRainFx(colors: FxColors, calm: boolean) {
  let W = 800
  let H = 500
  let aim = -Math.PI / 2 // nòng hướng thẳng lên
  let recoil = 0
  let puff = 0 // khói đỏ khi gõ sai
  let shake = 0
  const bullets: Bullet[] = []
  const parts: Part[] = []
  const rings: Ring[] = []

  const origin = () => ({ x: W / 2, y: H - 3 })
  const muzzle = () => {
    const o = origin()
    const len = BARREL - recoil * 9
    return { x: o.x + Math.cos(aim) * len, y: o.y + Math.sin(aim) * len }
  }

  function burst(x: number, y: number, n: number, speed: [number, number], palette: string[], size: [number, number], life: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = speed[0] + Math.random() * (speed[1] - speed[0])
      parts.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - sp * 0.35,
        life,
        max: life,
        size: size[0] + Math.random() * (size[1] - size[0]),
        color: palette[i % palette.length],
        spin: (Math.random() - 0.5) * 14,
        rot: Math.random() * Math.PI,
      })
    }
  }

  function arrive(b: Bullet) {
    if (b.boom) {
      // nổ: mảnh vỡ nhiều màu + hai vòng sóng + rung nhẹ (chế độ "giảm chuyển động": không rung màn)
      burst(b.x1, b.y1, 24, [160, 480], [colors.primary, colors.success, colors.warn, colors.accent], [3, 8], 950)
      burst(b.x1, b.y1, 10, [60, 160], [colors.surface, colors.warn], [2, 4], 500)
      rings.push({ x: b.x1, y: b.y1, t: 0, max: 420, color: colors.primary })
      rings.push({ x: b.x1, y: b.y1, t: -60, max: 380, color: colors.success })
      if (!calm) shake = Math.max(shake, 1)
    } else {
      burst(b.x1, b.y1, 6, [90, 220], [colors.warn, colors.primary], [2, 3.5], 340)
    }
  }

  return {
    resize(w: number, h: number) {
      W = w
      H = h
    },

    /**
     * Bắn một viên tới (x, y) trong toạ độ vùng chơi. targetId: đạn đuổi theo từ đó khi nó
     * còn rơi; boom = viên cuối làm từ nổ khi tới nơi. Trả về số ms đạn bay.
     */
    fire(x: number, y: number, boom: boolean, targetId: number | null = null): number {
      // xoay nòng về đích TRƯỚC rồi mới bắn, để viên đạn ra đúng miệng nòng
      const o = origin()
      aim = Math.min(-0.12, Math.max(-Math.PI + 0.12, Math.atan2(y - o.y, x - o.x)))
      recoil = 0
      const m = muzzle()
      const dist = Math.hypot(x - m.x, y - m.y)
      const dur = Math.min(380, Math.max(200, dist / BULLET_SPEED))
      bullets.push({ x0: m.x, y0: m.y, x1: x, y1: y, targetId, x: m.x, y: m.y, t: 0, dur, boom, trail: [] })
      recoil = 1
      return dur
    },

    misfire() {
      puff = 1
    },

    /** Vị trí rung màn (px) để RainStage dịch cả vùng chơi. */
    shakeOffset(): { x: number; y: number } {
      if (shake <= 0) return { x: 0, y: 0 }
      const a = shake * 4
      return { x: (Math.random() - 0.5) * a, y: (Math.random() - 0.5) * a }
    },

    /** aimAt: tâm từ đang nhắm (null = nòng hướng thẳng lên); resolve: vị trí hiện tại của một từ theo id. */
    update(dtMs: number, aimAt: { x: number; y: number } | null, resolve?: TargetResolver) {
      const dt = dtMs / 1000
      const o = origin()
      const want = aimAt ? Math.atan2(aimAt.y - o.y, aimAt.x - o.x) : -Math.PI / 2
      // giới hạn nòng trong nửa trên (không chĩa xuống đất)
      const clamped = Math.min(-0.12, Math.max(-Math.PI + 0.12, want))
      aim += (clamped - aim) * Math.min(1, dtMs / 70)
      recoil = Math.max(0, recoil - dtMs / 110)
      puff = Math.max(0, puff - dtMs / 380)
      shake = Math.max(0, shake - dtMs / 160)

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]
        b.t += dtMs
        // đuổi theo từ đang rơi; từ đã biến mất thì bay tới chỗ thấy nó lần cuối
        if (b.targetId !== null && resolve) {
          const p = resolve(b.targetId)
          if (p) {
            b.x1 = p.x
            b.y1 = p.y
          }
        }
        const u = Math.min(1, b.t / b.dur)
        b.trail.push({ x: b.x, y: b.y })
        if (b.trail.length > TRAIL) b.trail.shift()
        b.x = b.x0 + (b.x1 - b.x0) * u
        b.y = b.y0 + (b.y1 - b.y0) * u
        if (u >= 1) {
          bullets.splice(i, 1)
          arrive(b)
        }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.life -= dtMs
        if (p.life <= 0) {
          parts.splice(i, 1)
          continue
        }
        p.vy += GRAVITY * dt
        p.vx *= 1 - 0.9 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.spin * dt
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].t += dtMs
        if (rings[i].t >= rings[i].max) rings.splice(i, 1)
      }
    },

    draw(ctx: CanvasRenderingContext2D) {
      ctx.clearRect(0, 0, W, H)
      // vòng sóng
      for (const r of rings) {
        if (r.t < 0) continue
        const u = r.t / r.max
        ctx.globalAlpha = (1 - u) * 0.8
        ctx.strokeStyle = r.color
        ctx.lineWidth = 3 * (1 - u) + 1
        ctx.beginPath()
        ctx.arc(r.x, r.y, 10 + u * 70, 0, Math.PI * 2)
        ctx.stroke()
        if (u < 0.25) {
          ctx.globalAlpha = (0.25 - u) * 2.4
          ctx.fillStyle = colors.surface
          ctx.beginPath()
          ctx.arc(r.x, r.y, 26 * (1 - u), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      // mảnh vỡ
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.max)
        ctx.fillStyle = p.color
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7)
        ctx.restore()
      }
      // đạn: quả cầu sáng + đuôi sao chổi nhạt dần
      for (const b of bullets) {
        const r = b.boom ? 7.5 : 5.5
        const n = b.trail.length
        b.trail.forEach((p, i) => {
          const k = (i + 1) / (n + 1)
          ctx.globalAlpha = 0.55 * k
          ctx.fillStyle = colors.warn
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * (0.3 + 0.7 * k), 0, Math.PI * 2)
          ctx.fill()
        })
        // quầng sáng quanh đầu đạn
        ctx.globalAlpha = 0.3
        ctx.fillStyle = colors.warn
        ctx.beginPath()
        ctx.arc(b.x, b.y, r * 2.3, 0, Math.PI * 2)
        ctx.fill()
        // đầu đạn
        ctx.globalAlpha = 1
        ctx.fillStyle = b.boom ? colors.danger : colors.primary
        ctx.beginPath()
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = colors.surface
        ctx.beginPath()
        ctx.arc(b.x - r * 0.25, b.y - r * 0.25, r * 0.42, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      // khẩu pháo: nòng (xoay theo mục tiêu, giật lùi khi bắn) + bệ nửa tròn, có viền để nổi trên cả nền sáng và tối
      const o = origin()
      const len = BARREL - recoil * 9
      ctx.lineJoin = 'round'
      ctx.save()
      ctx.translate(o.x, o.y)
      ctx.rotate(aim)
      ctx.fillStyle = colors.primary
      ctx.strokeStyle = colors.text
      ctx.lineWidth = 2.5
      roundRect(ctx, 0, -8, len, 16, 6)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = colors.text
      roundRect(ctx, len - 8, -10, 11, 20, 4)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = colors.primary
      ctx.strokeStyle = colors.text
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(o.x, o.y, BASE_R, Math.PI, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = colors.surface
      ctx.beginPath()
      ctx.arc(o.x, o.y - 9, 6, 0, Math.PI * 2)
      ctx.fill()
      // chớp lửa ở miệng nòng ngay sau khi bắn
      if (recoil > 0.5) {
        const m = { x: o.x + Math.cos(aim) * (len + 9), y: o.y + Math.sin(aim) * (len + 9) }
        ctx.globalAlpha = Math.min(1, (recoil - 0.5) * 2.4)
        ctx.fillStyle = colors.warn
        ctx.beginPath()
        ctx.arc(m.x, m.y, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = colors.surface
        ctx.beginPath()
        ctx.arc(m.x, m.y, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
      // khói đỏ khi gõ sai
      if (puff > 0) {
        const m = { x: o.x + Math.cos(aim) * (len + 8), y: o.y + Math.sin(aim) * (len + 8) }
        ctx.globalAlpha = puff * 0.55
        ctx.fillStyle = colors.danger
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.arc(m.x + (i - 1) * 7 * (1 - puff + 0.4), m.y - (1 - puff) * 16 - i * 3, 5 + (1 - puff) * 6, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
    },
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export type RainFx = ReturnType<typeof createRainFx>
