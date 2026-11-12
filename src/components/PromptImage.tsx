// Ảnh đề bài của Luyện Task 1 (biểu đồ, bảng, bản đồ, quy trình):
//   PromptImageField — mục 1.1: ô tải ảnh (bấm chọn · kéo thả · chụp màn hình rồi dán Ctrl+V). Bọc luôn ô chữ
//                      của đề, nên đang ở ô chữ mà dán ảnh cũng được.
//   PromptBrief      — khung "Đề bài" trên đầu outline: chữ đề + ảnh để xem khi viết; thu gọn được, ghim được
//                      (dính trên đầu cột khi cuộn).
//   ImageViewer      — xem ảnh toàn màn hình: vừa khung / 100% / phóng to, thu nhỏ, kéo để di chuyển.
// Ảnh lưu ở Supabase Storage (services/cloud/task1Images.ts), bài chỉ giữ đường dẫn.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ClipboardEvent, type DragEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import ConfirmDialog from './ConfirmDialog'
import {
  ImageError,
  cachedImageUrl,
  imageErrText,
  imageUrl,
  prepareImage,
  removeT1Images,
  uploadT1Image,
  type T1Image,
} from '../services/cloud/task1Images'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/bmp'
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
const ratioOf = (img: T1Image) => (img.w && img.h ? `${img.w} / ${img.h}` : '16 / 9')

// ------------------------------------------------------------------ Link xem ảnh
/** Link xem ảnh theo đường dẫn: dùng bản trong bộ nhớ nếu có, không thì xin link ký tạm.
 *  <img> lỗi (thường do link hết hạn) thì tự xin link mới một lần, lần sau mới báo lỗi. */
export function useImageUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => (path ? cachedImageUrl(path) : null))
  const [err, setErr] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const force = useRef(false)
  const retried = useRef(false)

  useEffect(() => {
    retried.current = false
  }, [path])

  useEffect(() => {
    setErr(null)
    if (!path) {
      setUrl(null)
      return
    }
    const renew = force.current
    force.current = false
    const hit = renew ? null : cachedImageUrl(path)
    if (hit) {
      setUrl(hit)
      return
    }
    setUrl(null)
    let alive = true
    imageUrl(path, renew).then(
      (u) => alive && setUrl(u),
      (e) => alive && setErr(imageErrText(e)),
    )
    return () => {
      alive = false
    }
  }, [path, tick])

  const reload = useCallback(() => {
    force.current = true
    setTick((t) => t + 1)
  }, [])
  const onError = () => {
    if (retried.current) {
      setErr('Không hiện được ảnh. Kiểm tra mạng rồi bấm Tải lại ảnh.')
      return
    }
    retried.current = true
    reload()
  }
  const onLoad = () => {
    retried.current = false
  }
  return { url, err, reload, onError, onLoad }
}

/** Ảnh đề bài kèm trạng thái đang tải / lỗi. Có onOpen thì cả ảnh là nút mở trình xem. */
function ImageFrame({ image, onOpen, className }: { image: T1Image; onOpen?: () => void; className?: string }) {
  const { url, err, reload, onError, onLoad } = useImageUrl(image.path)
  if (err) {
    return (
      <div className={cx('t1-imgerr', className)} role="alert">
        <Icon name="alert" />
        <span>{err}</span>
        <button type="button" className="mt-mini" onClick={reload}>
          <Icon name="refresh" />
          Tải lại ảnh
        </button>
      </div>
    )
  }
  if (!url) {
    return <span className={cx('t1-img-skel', className)} style={{ aspectRatio: ratioOf(image) }} role="status" aria-label="Đang tải ảnh đề bài" />
  }
  const img = <img src={url} alt="Ảnh biểu đồ của đề bài" onError={onError} onLoad={onLoad} draggable={false} />
  if (!onOpen) return <span className={cx('t1-img', className)}>{img}</span>
  return (
    <button type="button" className={cx('t1-img', className)} onClick={onOpen} aria-label="Phóng to ảnh đề bài" title="Bấm để xem lớn">
      {img}
      <span className="t1-img-hint" aria-hidden="true">
        <Icon name="expand" />
        Xem lớn
      </span>
    </button>
  )
}

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files')

/** Chặn trình duyệt / Electron mở tệp khi thả ra ngoài ô nhận ảnh (Electron sẽ rời app sang tệp đó). */
export function useBlockFileDrop() {
  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (e.defaultPrevented || !e.dataTransfer || !Array.from(e.dataTransfer.types).includes('Files')) return
      e.preventDefault()
      if (e.type === 'dragover') e.dataTransfer.dropEffect = 'none'
    }
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])
}

// ------------------------------------------------------------------ Mục 1.1: tải ảnh lên
export function PromptImageField({
  essayId,
  image,
  onChange,
  onView,
  children,
}: {
  essayId: string
  image: T1Image | null
  /** ảnh mới (đã tải lên xong) hoặc null khi xóa — ảnh cũ do trang dọn sau khi bài đã lưu */
  onChange: (img: T1Image | null) => void
  onView: () => void
  children: ReactNode
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [retry, setRetry] = useState<Blob | null>(null)
  const [drag, setDrag] = useState(false)
  const [asking, setAsking] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const depth = useRef(0)
  const busy = useRef(false)
  const alive = useRef(true)
  // Tải xong mới gọi onChange: luôn dùng hàm mới nhất của trang
  const change = useRef(onChange)
  change.current = onChange

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const upload = async (file: Blob) => {
    if (busy.current) return
    busy.current = true
    setUploading(true)
    setPreview(null)
    setErr(null)
    setRetry(null)
    try {
      const prepared = await prepareImage(file)
      if (!alive.current) return
      setPreview(prepared.preview)
      const img = await uploadT1Image(essayId, prepared)
      if (!alive.current) {
        // Đã rời bài trong lúc tải: ảnh không gắn vào đâu nữa thì xóa luôn
        void removeT1Images([img.path]).catch(() => undefined)
        return
      }
      change.current(img)
    } catch (e) {
      if (!alive.current) return
      setErr(imageErrText(e))
      // Lỗi do chính tệp ảnh thì thử lại cũng vậy; lỗi mạng / chưa có kho ảnh thì cho thử lại
      if (!(e instanceof ImageError)) setRetry(file)
    } finally {
      busy.current = false
      if (alive.current) {
        setUploading(false)
        setPreview(null)
      }
    }
  }

  const pick = () => fileRef.current?.click()

  const onPaste = (e: ClipboardEvent) => {
    const dt = e.clipboardData
    // Có chữ thì để ô chữ dán như thường (Word chép chữ kèm cả một ảnh chụp đoạn chữ)
    if (dt.getData('text/plain').trim()) return
    const file =
      Array.from(dt.files).find((f) => f.type.startsWith('image/')) ??
      Array.from(dt.items)
        .find((i) => i.kind === 'file' && i.type.startsWith('image/'))
        ?.getAsFile()
    if (!file) return
    e.preventDefault()
    void upload(file)
  }

  const dragProps = {
    onDragEnter: (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current += 1
      setDrag(true)
    },
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = uploading ? 'none' : 'copy'
    },
    onDragLeave: (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth.current = Math.max(0, depth.current - 1)
      if (!depth.current) setDrag(false)
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current = 0
      setDrag(false)
      const files = Array.from(e.dataTransfer.files)
      const file = files.find((f) => f.type.startsWith('image/')) ?? files[0]
      if (file) void upload(file)
    },
  }

  const onCancelAsk = useCallback(() => setAsking(false), [])
  const onConfirmAsk = useCallback(() => {
    setAsking(false)
    setErr(null)
    change.current(null)
  }, [])

  return (
    <div className={cx('t1-prompt', drag && 'is-drag')} onPaste={onPaste} {...dragProps}>
      {children}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="mt-sr"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = '' // chọn lại đúng tệp đó vẫn chạy
          if (f) void upload(f)
        }}
      />

      {uploading || image ? (
        <div className="t1-shot">
          <div className={cx('t1-shot-view', drag && !uploading && 'is-drag')} data-drop="Thả để thay ảnh">
            {uploading ? (
              <div className="t1-shot-busy" role="status">
                {preview ? <img src={preview} alt="" draggable={false} /> : <span className="t1-img-skel" style={{ aspectRatio: '16 / 9' }} />}
                <span className="t1-busytag">
                  <span className="t1-spin" aria-hidden="true" />
                  {preview ? 'Đang tải ảnh lên…' : 'Đang xử lý ảnh…'}
                </span>
              </div>
            ) : (
              image && <ImageFrame image={image} onOpen={onView} className="is-field" />
            )}
          </div>
          <div className="t1-shot-acts">
            <button type="button" className="mt-mini" onClick={onView} disabled={uploading}>
              <Icon name="expand" />
              Xem lớn
            </button>
            <button type="button" className="mt-mini" onClick={pick} disabled={uploading}>
              <Icon name="upload" />
              Đổi ảnh
            </button>
            {image && !uploading && image.w > 0 && (
              <span className="t1-shot-meta">
                {image.w} × {image.h} px
              </span>
            )}
            <button type="button" className="mt-mini t1-danger" onClick={() => setAsking(true)} disabled={uploading}>
              <Icon name="trash" />
              Xóa ảnh
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={cx('t1-drop', drag && 'is-drag')} onClick={pick}>
          <span className="t1-drop-ico" aria-hidden="true">
            <Icon name={drag ? 'upload' : 'image'} />
          </span>
          <span className="t1-drop-txt">
            <b>{drag ? 'Thả ảnh vào đây' : 'Thêm ảnh biểu đồ của đề'}</b>
            <small>Bấm để chọn ảnh, kéo thả vào khung này, hoặc chụp màn hình rồi dán bằng Ctrl+V. PNG, JPG, WEBP, tối đa 20 MB.</small>
          </span>
        </button>
      )}

      {err && (
        <div className="mt-warn t1-shot-err" role="alert">
          <Icon name="alert" />
          <span>{err}</span>
          {retry && (
            <button type="button" className="mt-mini" onClick={() => void upload(retry)} disabled={uploading}>
              <Icon name="refresh" />
              Thử lại
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={asking}
        danger
        title="Xóa ảnh đề bài?"
        body="Ảnh sẽ bị xóa khỏi cloud và không hoàn tác được. Chữ của đề bài vẫn giữ nguyên."
        confirmLabel="Xóa ảnh"
        cancelLabel="Giữ lại"
        onConfirm={onConfirmAsk}
        onCancel={onCancelAsk}
      />
    </div>
  )
}

// ------------------------------------------------------------------ Khung "Đề bài" trên đầu outline
const BRIEF_KEY = 'task1_brief'
interface BriefPref {
  open: boolean
  pin: boolean
}
function loadBrief(): BriefPref {
  try {
    const raw = localStorage.getItem(BRIEF_KEY)
    if (raw) return { open: true, pin: false, ...(JSON.parse(raw) as Partial<BriefPref>) }
  } catch {
    /* bộ nhớ trình duyệt bị chặn — dùng mặc định */
  }
  return { open: true, pin: false }
}

export function PromptBrief({ prompt, image, onView, onEdit }: { prompt: string; image: T1Image | null; onView: () => void; onEdit: () => void }) {
  const [pref, setPref] = useState<BriefPref>(loadBrief)
  useEffect(() => {
    try {
      localStorage.setItem(BRIEF_KEY, JSON.stringify(pref))
    } catch {
      /* không nhớ được thì thôi */
    }
  }, [pref])
  const set = (p: Partial<BriefPref>) => setPref((v) => ({ ...v, ...p }))
  const text = prompt.trim()

  if (!text && !image) {
    return (
      <div className="t1-brief is-empty">
        <Icon name="image" />
        <span>Chưa có đề bài. Dán chữ của đề và thêm ảnh biểu đồ ở mục 1.1 để xem ngay tại đây trong lúc viết.</span>
        <button type="button" className="mt-mini" onClick={onEdit}>
          <Icon name="pencil" />
          Thêm đề bài
        </button>
      </div>
    )
  }

  return (
    <section className={cx('t1-brief', pref.pin && 'is-pinned', !pref.open && 'is-closed')} aria-label="Đề bài">
      <header className="t1-brief-head">
        <button type="button" className="t1-brief-toggle" aria-expanded={pref.open} aria-controls="t1-brief-body" onClick={() => set({ open: !pref.open })}>
          <Icon name="down" />
          <b>Đề bài</b>
          {!pref.open && (
            <span className="t1-brief-peek" lang={text ? 'en' : undefined}>
              {text || 'Ảnh biểu đồ'}
            </span>
          )}
        </button>
        <span className="t1-brief-acts">
          {image && (
            <button type="button" className="mt-mini" onClick={onView} title="Xem ảnh đề bài toàn màn hình">
              <Icon name="expand" />
              Xem lớn
            </button>
          )}
          <button
            type="button"
            className="mt-mini t1-pin"
            aria-pressed={pref.pin}
            onClick={() => set({ pin: !pref.pin })}
            title={pref.pin ? 'Bỏ ghim: khung đề cuộn theo outline' : 'Ghim: khung đề luôn nằm trên đầu cột khi cuộn outline'}
          >
            <Icon name="pin" />
            {pref.pin ? 'Đang ghim' : 'Ghim'}
          </button>
        </span>
      </header>
      {pref.open && (
        <div className="t1-brief-body" id="t1-brief-body">
          {text ? (
            <p className="t1-brief-text" lang="en">
              {text}
            </p>
          ) : (
            <p className="t1-brief-none">
              Chưa có chữ của đề.{' '}
              <button type="button" className="mt-link" onClick={onEdit}>
                Dán ở mục 1.1
              </button>
            </p>
          )}
          {image ? (
            <ImageFrame image={image} onOpen={onView} className="is-brief" />
          ) : (
            <p className="t1-brief-none">
              Chưa có ảnh biểu đồ.{' '}
              <button type="button" className="mt-link" onClick={onEdit}>
                Thêm ảnh ở mục 1.1
              </button>
            </p>
          )}
        </div>
      )}
    </section>
  )
}

// ------------------------------------------------------------------ Trình xem toàn màn hình
const MAX_ZOOM = 8
const STEP = 1.25
const PAD = 24 // khoảng trống quanh ảnh khi vừa khung

export function ImageViewer({ image, prompt, onClose }: { image: T1Image; prompt: string; onClose: () => void }) {
  const { url, err, reload, onError, onLoad } = useImageUrl(image.path)
  const [nat, setNat] = useState({ w: image.w, h: image.h }) // kích thước thật của ảnh
  const [fit, setFit] = useState(1) // tỉ lệ khi vừa khung
  const [scale, setScale] = useState<number | null>(null) // null = vừa khung
  const [showText, setShowText] = useState(true)
  const [panning, setPanning] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const anchor = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)
  const pan = useRef<{ id: number; x: number; y: number; left: number; top: number; moved: boolean; onBack: boolean } | null>(null)
  const text = prompt.trim()
  const cur = scale ?? fit
  const ready = Boolean(url && !err && nat.w && nat.h)

  // Mở: khóa cuộn nền, đưa focus vào nút Đóng; đóng: trả focus về chỗ cũ
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      back?.focus?.()
    }
  }, [])

  // Tỉ lệ vừa khung theo kích thước vùng xem (đổi cỡ cửa sổ, ẩn/hiện chữ đề)
  useLayoutEffect(() => {
    const st = stageRef.current
    if (!st || !nat.w || !nat.h) return
    const measure = () => {
      const w = Math.max(40, st.clientWidth - PAD * 2)
      const h = Math.max(40, st.clientHeight - PAD * 2)
      setFit(Math.min(w / nat.w, h / nat.h, 3)) // ảnh nhỏ được phóng tối đa 3 lần cho dễ đọc
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(st)
    return () => ro.disconnect()
  }, [nat.w, nat.h, showText])

  /** Đổi tỉ lệ, giữ nguyên điểm ảnh đang nằm dưới con trỏ (hoặc giữa khung). */
  const zoomTo = useCallback(
    (next: number | null, at?: { cx: number; cy: number }) => {
      const st = stageRef.current
      const img = imgRef.current
      if (st && img) {
        const r = st.getBoundingClientRect()
        const px = at ? at.cx - r.left : st.clientWidth / 2
        const py = at ? at.cy - r.top : st.clientHeight / 2
        anchor.current = { x: (st.scrollLeft + px - img.offsetLeft) / cur, y: (st.scrollTop + py - img.offsetTop) / cur, cx: px, cy: py }
      }
      setScale(next === null ? null : Math.min(MAX_ZOOM, Math.max(Math.min(0.1, fit), next)))
    },
    [cur, fit],
  )
  useLayoutEffect(() => {
    const a = anchor.current
    const st = stageRef.current
    const img = imgRef.current
    anchor.current = null
    if (!a || !st || !img) return
    st.scrollLeft = a.x * cur + img.offsetLeft - a.cx
    st.scrollTop = a.y * cur + img.offsetTop - a.cy
  }, [cur])

  const zoomIn = () => zoomTo(cur * STEP)
  const zoomOut = () => zoomTo(cur / STEP)
  const toggleZoom = (at?: { cx: number; cy: number }) => zoomTo(scale === null ? Math.max(1, fit * 2) : null, at)

  // Ctrl + lăn chuột (hoặc chụm hai ngón trên touchpad) để phóng to quanh con trỏ.
  // Gắn trực tiếp vì onWheel của React là passive, không chặn được trình duyệt tự phóng cả trang.
  useEffect(() => {
    const st = stageRef.current
    if (!st) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey || !ready) return
      e.preventDefault()
      zoomTo(cur * Math.exp(-e.deltaY * 0.002), { cx: e.clientX, cy: e.clientY })
    }
    st.addEventListener('wheel', onWheel, { passive: false })
    return () => st.removeEventListener('wheel', onWheel)
  }, [cur, ready, zoomTo])

  // Phím: Esc đóng · + / − phóng thu · 0 vừa khung · 1 cỡ thật · Tab chỉ chạy trong trình xem
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const box = boxRef.current
        if (!box) return
        const items = Array.from(box.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'))
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || !ready) return
      if (e.key === '+' || e.key === '=') zoomIn()
      else if (e.key === '-' || e.key === '_') zoomOut()
      else if (e.key === '0') zoomTo(null)
      else if (e.key === '1') zoomTo(1)
      else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // Kéo để di chuyển ảnh đã phóng to; bấm (không kéo) vào khoảng trống quanh ảnh thì đóng
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const st = e.currentTarget
    pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, left: st.scrollLeft, top: st.scrollTop, moved: false, onBack: e.target !== imgRef.current }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pan.current
    if (!p || p.id !== e.pointerId) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (!p.moved && Math.hypot(dx, dy) < 4) return
    if (!p.moved) {
      p.moved = true
      setPanning(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    e.currentTarget.scrollLeft = p.left - dx
    e.currentTarget.scrollTop = p.top - dy
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = pan.current
    pan.current = null
    if (!p || p.id !== e.pointerId) return
    if (p.moved) {
      setPanning(false)
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    } else if (p.onBack) onClose()
  }

  const pct = Math.round(cur * 100)
  const big = ready && (nat.w * cur > (stageRef.current?.clientWidth ?? 0) || nat.h * cur > (stageRef.current?.clientHeight ?? 0))

  return createPortal(
    <div className="mt-page t1-viewer" role="dialog" aria-modal="true" aria-label="Xem đề bài" ref={boxRef}>
      <div className="t1-vbar">
        <span className="t1-vtitle">
          <Icon name="image" />
          <b>Đề bài</b>
          {nat.w > 0 && (
            <small>
              {nat.w} × {nat.h} px
            </small>
          )}
        </span>
        <span className="t1-vzoom" role="group" aria-label="Thu phóng ảnh">
          <button type="button" className="t1-vbtn is-icon" onClick={zoomOut} disabled={!ready} aria-label="Thu nhỏ" title="Thu nhỏ (−)">
            <Icon name="minus" />
          </button>
          <span className="t1-vpct" aria-live="polite">
            {ready ? `${pct}%` : '–'}
          </span>
          <button type="button" className="t1-vbtn is-icon" onClick={zoomIn} disabled={!ready} aria-label="Phóng to" title="Phóng to (+)">
            <Icon name="plus" />
          </button>
          <button type="button" className="t1-vbtn" onClick={() => zoomTo(null)} disabled={!ready} aria-pressed={scale === null} title="Vừa khung (0)">
            Vừa khung
          </button>
          <button type="button" className="t1-vbtn" onClick={() => zoomTo(1)} disabled={!ready} aria-pressed={scale === 1} title="Cỡ thật (1)">
            100%
          </button>
        </span>
        <span className="t1-vend">
          {text && (
            <button type="button" className="t1-vbtn" onClick={() => setShowText((v) => !v)} aria-pressed={showText} title={showText ? 'Ẩn chữ đề để ảnh rộng hơn' : 'Hiện chữ đề'}>
              <Icon name="file" />
              Chữ đề
            </button>
          )}
          <button type="button" className="t1-vbtn is-close" onClick={onClose} ref={closeRef} title="Đóng (Esc)">
            <Icon name="x" />
            Đóng
          </button>
        </span>
      </div>

      <div
        className={cx('t1-vstage', big && 'is-big', panning && 'is-panning')}
        ref={stageRef}
        tabIndex={0}
        aria-label="Ảnh đề bài. Ctrl + lăn chuột để phóng to, kéo để di chuyển, phím mũi tên để cuộn."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pan.current = null
          setPanning(false)
        }}
      >
        <div className="t1-vcanvas" style={{ padding: PAD }}>
          {err ? (
            <div className="t1-verr" role="alert">
              <Icon name="alert" />
              <span>{err}</span>
              <button type="button" className="t1-vbtn" onClick={reload}>
                <Icon name="refresh" />
                Tải lại ảnh
              </button>
            </div>
          ) : url ? (
            <img
              ref={imgRef}
              src={url}
              alt="Ảnh biểu đồ của đề bài"
              draggable={false}
              style={nat.w && nat.h ? { width: nat.w * cur, height: nat.h * cur } : undefined}
              onError={onError}
              onLoad={(e) => {
                onLoad()
                const el = e.currentTarget
                if (el.naturalWidth && (el.naturalWidth !== nat.w || el.naturalHeight !== nat.h)) setNat({ w: el.naturalWidth, h: el.naturalHeight })
              }}
              onDoubleClick={(e) => toggleZoom({ cx: e.clientX, cy: e.clientY })}
            />
          ) : (
            <span className="t1-vload" role="status">
              <span className="t1-spin" aria-hidden="true" />
              Đang tải ảnh…
            </span>
          )}
        </div>
      </div>

      {text && showText && (
        <p className="t1-vprompt" lang="en">
          {text}
        </p>
      )}
      <p className="t1-vtip" aria-hidden="true">
        Ctrl + lăn chuột hoặc + / − để phóng to · kéo để di chuyển · bấm đúp để đổi vừa khung / phóng to · Esc để đóng
      </p>
    </div>,
    document.body,
  )
}
