// ============================================================
// Ảnh đề bài của trang "Luyện Task 1" — Supabase Storage, bucket riêng tư task1-images.
// Bài (task1_essays.data) chỉ giữ đường dẫn + kích thước ảnh, nên mỗi lần tự lưu bài không
// phải gửi lại ảnh và danh sách bài vẫn nhẹ. Ảnh xem qua link ký tạm (signed URL, https:)
// hoặc bản data: vừa tải lên trong phiên này — CSP của bản desktop cho phép cả hai, không cho blob:.
// Cần chạy supabase/task1_images.sql một lần để tạo bucket + quyền.
// ============================================================
import { supabase } from './supabaseClient'
import { errText } from './cloudError'

export const T1_BUCKET = 'task1-images'

/** Ảnh đề bài lưu trong bài: đường dẫn trong bucket + kích thước thật (px). */
export interface T1Image {
  path: string
  w: number
  h: number
}

export const NEED_IMG_SQL =
  'Chưa bật kho ảnh đề bài. Mở Supabase → SQL Editor, chạy file supabase/task1_images.sql rồi thử lại.'

/** Lỗi đã viết sẵn cho người dùng đọc (không phải lỗi kỹ thuật). */
export class ImageError extends Error {}

/** Kiểm tra dữ liệu đọc từ cloud có đúng dạng ảnh không. */
export function asT1Image(raw: unknown): T1Image | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.path !== 'string' || !o.path) return null
  const w = Number(o.w)
  const h = Number(o.h)
  return { path: o.path, w: w > 0 ? w : 0, h: h > 0 ? h : 0 }
}

// ------------------------------------------------------------------ Chuẩn bị ảnh trước khi tải lên
const MAX_INPUT = 20 * 1024 * 1024 // ảnh gốc tối đa 20 MB
const MAX_SIDE = 2400 // cạnh dài nhất sau khi thu nhỏ: đủ nét để đọc chữ nhỏ trên biểu đồ
const KEEP_AS_IS = 1.5 * 1024 * 1024 // ảnh nhỏ, đúng định dạng thì giữ nguyên bản gốc
const KEEP_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

export interface PreparedImage {
  blob: Blob
  type: string
  w: number
  h: number
  /** data: URL để hiện ngay trong lúc tải lên */
  preview: string
}

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`

function readAsDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error ?? new Error('read failed'))
    r.readAsDataURL(b)
  })
}

async function decode(file: Blob): Promise<{ src: CanvasImageSource; w: number; h: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bmp = await createImageBitmap(file)
    return { src: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() }
  }
  const img = new Image()
  img.src = await readAsDataUrl(file)
  await img.decode()
  return { src: img, w: img.naturalWidth, h: img.naturalHeight, close: () => undefined }
}

const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, q))

/** Kiểm tra + thu nhỏ ảnh (cạnh dài tối đa 2400px, nền trắng, WEBP hoặc JPG). */
export async function prepareImage(file: Blob): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new ImageError('Tệp này không phải ảnh. Hãy chọn ảnh PNG, JPG hoặc WEBP.')
  if (file.size > MAX_INPUT) throw new ImageError(`Ảnh nặng ${mb(file.size)}, quá mức 20 MB. Hãy chụp lại vùng biểu đồ hoặc chọn ảnh nhỏ hơn.`)
  let pic: Awaited<ReturnType<typeof decode>>
  try {
    pic = await decode(file)
  } catch {
    throw new ImageError('Không đọc được ảnh này (có thể là ảnh HEIC hoặc tệp bị hỏng). Hãy dùng PNG, JPG hoặc WEBP.')
  }
  try {
    const { w, h } = pic
    if (!w || !h) throw new ImageError('Ảnh này không có nội dung. Hãy chọn ảnh khác.')
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
    if (scale === 1 && file.size <= KEEP_AS_IS && KEEP_TYPES.includes(file.type)) {
      return { blob: file, type: file.type, w, h, preview: await readAsDataUrl(file) }
    }
    const cw = Math.max(1, Math.round(w * scale))
    const ch = Math.max(1, Math.round(h * scale))
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageError('Máy không xử lý được ảnh này. Hãy thử ảnh PNG hoặc JPG nhỏ hơn.')
    // Nền trắng: ảnh trong suốt vẫn đọc được trên giao diện tối, và JPG không có kênh trong suốt
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cw, ch)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(pic.src, 0, 0, cw, ch)
    let blob = await toBlob(canvas, 'image/webp', 0.9)
    // Trình duyệt không xuất được WEBP (trả PNG hoặc null) thì dùng JPG
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.9)
    if (!blob) throw new ImageError('Không nén được ảnh này. Hãy thử ảnh khác.')
    return { blob, type: blob.type, w: cw, h: ch, preview: await readAsDataUrl(blob) }
  } finally {
    pic.close()
  }
}

// ------------------------------------------------------------------ Tải lên · lấy link · xóa
const previews = new Map<string, string>() // ảnh vừa tải lên trong phiên này: hiện ngay, không chờ mạng
const signed = new Map<string, { url: string; until: number }>()
const pending = new Map<string, Promise<string>>() // nhiều chỗ cùng xin link một ảnh thì chỉ gọi mạng một lần
const TTL = 6 * 3600 // giây

async function userId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new ImageError('Phiên đăng nhập đã hết. Đăng nhập lại rồi thử lại.')
  return id
}

export async function uploadT1Image(essayId: string, img: PreparedImage): Promise<T1Image> {
  const uid = await userId()
  const path = `${uid}/${essayId}/${Date.now().toString(36)}.${EXT[img.type] ?? 'img'}`
  const { error } = await supabase.storage
    .from(T1_BUCKET)
    .upload(path, img.blob, { contentType: img.type, cacheControl: '31536000', upsert: false })
  if (error) throw error
  previews.set(path, img.preview)
  return { path, w: img.w, h: img.h }
}

/** Link đã có sẵn trong bộ nhớ (không gọi mạng), hoặc null. */
export function cachedImageUrl(path: string): string | null {
  const p = previews.get(path)
  if (p) return p
  const s = signed.get(path)
  return s && s.until > Date.now() + 5 * 60_000 ? s.url : null
}

/** Link xem ảnh. force = bỏ link cũ (đã hết hạn / ảnh không tải được) để xin link mới. */
export function imageUrl(path: string, force = false): Promise<string> {
  if (force) signed.delete(path)
  const cached = cachedImageUrl(path)
  if (cached) return Promise.resolve(cached)
  let p = pending.get(path)
  if (!p) {
    p = (async () => {
      const { data, error } = await supabase.storage.from(T1_BUCKET).createSignedUrl(path, TTL)
      if (error) throw error
      signed.set(path, { url: data.signedUrl, until: Date.now() + TTL * 1000 })
      return data.signedUrl
    })().finally(() => pending.delete(path))
    pending.set(path, p)
  }
  return p
}

export async function removeT1Images(paths: string[]): Promise<void> {
  if (!paths.length) return
  paths.forEach((p) => {
    previews.delete(p)
    signed.delete(p)
  })
  const { error } = await supabase.storage.from(T1_BUCKET).remove(paths)
  if (error) throw error
}

/** Xóa mọi ảnh của một bài (kể cả ảnh cũ chưa dọn được) — gọi khi xóa bài. */
export async function removeEssayImages(essayId: string): Promise<void> {
  const dir = `${await userId()}/${essayId}`
  const { data, error } = await supabase.storage.from(T1_BUCKET).list(dir, { limit: 100 })
  if (error) throw error
  await removeT1Images((data ?? []).map((f) => `${dir}/${f.name}`))
}

/** Lỗi khi làm việc với ảnh → câu người dùng hiểu được và biết cách xử lý. */
export function imageErrText(e: unknown): string {
  if (e instanceof ImageError) return e.message
  const t = errText(e)
  if (/bucket not found|row-level security|violates .*policy|unauthorized/i.test(t)) return NEED_IMG_SQL
  if (/object not found|not_found/i.test(t)) return 'Không tìm thấy ảnh trên cloud (có thể đã bị xóa). Hãy tải ảnh lên lại.'
  if (/maximum allowed size|too large|payload/i.test(t)) return 'Ảnh vẫn quá lớn sau khi nén. Hãy cắt bớt phần thừa rồi thử lại.'
  if (/mime type/i.test(t)) return 'Kho ảnh chỉ nhận PNG, JPG hoặc WEBP. Hãy chọn ảnh khác.'
  if (/failed to fetch|networkerror|network request|load failed/i.test(t)) return 'Mất kết nối mạng nên chưa xong. Kiểm tra mạng rồi bấm Thử lại.'
  return t
}
