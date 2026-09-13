// Cửa sổ nổi "hình trong hình" cho bản web — Document Picture-in-Picture API.
// Mở một cửa sổ nhỏ luôn nằm trên mọi tab và ứng dụng khác, trong đó dựng DOM
// thật (không phải video) nên gõ phím, bấm nút bình thường. Bản desktop đã có
// chế độ mini + luôn nổi của Electron nên chỉ bật ở bản web.
// Hỗ trợ: Chrome / Edge 116+ trên máy tính. Firefox, Safari, mobile: không có.
import { isWeb } from '../platform'

interface DocumentPictureInPicture {
  requestWindow(options?: {
    width?: number
    height?: number
    disallowReturnToOpener?: boolean
  }): Promise<Window>
}

function api(): DocumentPictureInPicture | undefined {
  return (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture
}

export const pipSupported = typeof window !== 'undefined' && isWeb && !!api()

// Phải gọi ngay trong sự kiện bấm của người dùng, nếu không trình duyệt từ chối.
export async function openPipWindow(opts: {
  title: string
  width: number
  height: number
  bodyClass?: string
}): Promise<Window> {
  const dpip = api()
  if (!dpip) throw new Error('Trình duyệt này chưa hỗ trợ cửa sổ nổi')
  const pip = await dpip.requestWindow({ width: opts.width, height: opts.height })
  const doc = pip.document
  doc.title = opts.title

  // Cửa sổ mới là about:blank — đặt <base> để đường dẫn tương đối trong CSS
  // (font @fontsource, file .css của bản build) trỏ về đúng máy chủ của app.
  const base = doc.createElement('base')
  base.href = document.baseURI
  doc.head.appendChild(base)

  // Chép nguyên các thẻ CSS của trang chính: bản build là <link>, lúc chạy dev
  // Vite chèn <style> — cả hai clone được. Không chép qua cssRules vì đường dẫn
  // url() trong đó có thể mất gốc.
  document.head
    .querySelectorAll('link[rel="stylesheet"], style')
    .forEach((node) => doc.head.appendChild(node.cloneNode(true)))

  // Chủ đề sáng/tối: đồng bộ theo trang chính, kể cả khi đổi lúc cửa sổ đang mở.
  const syncTheme = () => {
    const theme = document.documentElement.dataset.theme
    if (theme) doc.documentElement.dataset.theme = theme
    else delete doc.documentElement.dataset.theme
  }
  syncTheme()
  const observer = new MutationObserver(syncTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  pip.addEventListener('pagehide', () => observer.disconnect(), { once: true })

  if (opts.bodyClass) doc.body.className = opts.bodyClass
  return pip
}
