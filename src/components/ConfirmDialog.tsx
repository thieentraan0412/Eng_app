import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import '../styles/confirm.css'

// Hộp thoại xác nhận dùng chung. Thay window.confirm() vì hộp thoại của hệ điều
// hành không theo giao diện app, không đọc được nội dung dài và không có nút
// nguy hiểm màu đỏ để người dùng biết thao tác không hoàn tác được.
export default function ConfirmDialog({
  open,
  title,
  body,
  items,
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Hủy',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body?: ReactNode
  /** danh sách mục sẽ bị tác động — hiện khi thao tác trên nhiều mục */
  items?: string[]
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const goRef = useRef<HTMLButtonElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreTo.current = document.activeElement as HTMLElement | null
    goRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', onKey)
    // Khóa cuộn nền để hộp thoại thực sự là "chặn"
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      restoreTo.current?.focus?.()
    }
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div className="cf-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div
        className={danger ? 'cf-box is-danger' : 'cf-box'}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="cf-top">
          <span className="cf-mark">
            <Icon name={danger ? 'alert' : 'bulb'} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="cf-title">{title}</h2>
            {body && <p className="cf-body">{body}</p>}
            {items && items.length > 0 && (
              <ul className="cf-list">
                {items.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="cf-foot">
          <button type="button" className="cf-btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={goRef}
            type="button"
            className={danger ? 'cf-btn cf-btn-danger' : 'cf-btn cf-btn-go'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Đang xử lý…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
