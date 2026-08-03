import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useWindowChrome } from '../contexts/WindowChromeContext'
import { isDesktop } from '../platform'
import Icon from '../components/Icon'
import type { UpdateStatus } from '../vite-env'
import '../styles/settings.css'

// Dựng chuỗi accelerator Electron từ sự kiện bàn phím (Ctrl+Alt+D, Ctrl+Shift+F2…).
// Bắt buộc có Ctrl/Alt/Super để không chiếm phím gõ thường của mọi ứng dụng.
function accelFromEvent(e: KeyboardEvent): string | null {
  if (!e.ctrlKey && !e.altKey && !e.metaKey) return null
  const k = e.key
  let key: string
  if (/^[a-z]$/i.test(k)) key = k.toUpperCase()
  else if (/^[0-9]$/.test(k)) key = k
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(k)) key = k
  else if (k === ' ') key = 'Space'
  else if (k === 'ArrowUp') key = 'Up'
  else if (k === 'ArrowDown') key = 'Down'
  else if (k === 'ArrowLeft') key = 'Left'
  else if (k === 'ArrowRight') key = 'Right'
  else return null // mới nhấn mỗi modifier, hoặc phím không hỗ trợ
  const mods: string[] = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  if (e.metaKey) mods.push('Super')
  return [...mods, key].join('+')
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { hidden: chromeHidden, setHidden: setChromeHidden } = useWindowChrome()
  const [suggest, setSuggest] = useState(localStorage.getItem('suggest_enabled') !== '0')
  const [spell, setSpell] = useState(localStorage.getItem('spell_enabled') !== '0')
  const [grammar, setGrammar] = useState(localStorage.getItem('grammar_enabled') !== '0')
  // Mặc định TẮT (tính năng nền toàn cục, người dùng chủ động bật)
  const [deskTrans, setDeskTrans] = useState(
    localStorage.getItem('desktop_translate_enabled') === '1',
  )
  // Phím tắt toàn cục bật/tắt dịch nhanh ('' = không dùng phím tắt)
  const [hotkey, setHotkey] = useState(
    localStorage.getItem('desktop_translate_hotkey') ?? 'Ctrl+Alt+D',
  )
  const [onTopHotkey, setOnTopHotkey] = useState(
    localStorage.getItem('always_on_top_hotkey') ?? 'Ctrl+Alt+T',
  )
  // Cửa sổ desktop: luôn nổi trên cùng + thu gọn kiểu hình-trong-hình.
  // alwaysOnTop được nhớ giữa các lần mở app; mini chỉ tính trong phiên đang chạy.
  const [onTop, setOnTop] = useState(localStorage.getItem('always_on_top') === '1')
  const [mini, setMini] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [hkErr, setHkErr] = useState<string | null>(null)
  const [recordingOnTop, setRecordingOnTop] = useState(false)
  const [onTopHkErr, setOnTopHkErr] = useState<string | null>(null)
  const [appVersion, setAppVersion] = useState(__APP_VERSION__)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  // Tùy chọn phiên ôn — dùng chung khóa localStorage với trang Ôn tập
  const [frontVi, setFrontVi] = useState(localStorage.getItem('fc_front_vi') === '1')
  const [autoSpeak, setAutoSpeak] = useState(localStorage.getItem('fc_autospeak') !== '0')

  const chooseFront = (vi: boolean) => {
    setFrontVi(vi)
    localStorage.setItem('fc_front_vi', vi ? '1' : '0')
  }
  const toggleAutoSpeak = () => {
    const next = !autoSpeak
    setAutoSpeak(next)
    localStorage.setItem('fc_autospeak', next ? '1' : '0')
  }

  const toggleDeskTrans = () => {
    const next = !deskTrans
    setDeskTrans(next)
    localStorage.setItem('desktop_translate_enabled', next ? '1' : '0')
    window.dispatchEvent(new CustomEvent('desktop-translate-changed', { detail: next }))
    window.api?.setDesktopTranslate(next)
  }

  const toggleOnTop = () => {
    const next = !onTop
    setOnTop(next)
    localStorage.setItem('always_on_top', next ? '1' : '0')
    void window.api?.setAlwaysOnTop(next)
  }

  // Mini tự kéo theo "luôn nổi" (main bật khi vào, trả lại trạng thái cũ khi ra)
  // -> đọc lại trạng thái thật thay vì tự đoán.
  const toggleMini = async () => {
    const next = !mini
    setMini(next)
    await window.api?.setMiniWindow(next)
    const s = await window.api?.getWindowState()
    if (s) {
      setMini(s.mini)
      setOnTop(s.alwaysOnTop)
    }
  }

  const toggleFull = async () => {
    const next = !fullScreen
    setFullScreen(next)
    await window.api?.toggleFullScreen(next)
  }

  // Cửa sổ có thể đã đổi trạng thái ở nơi khác (hoặc trang này vừa mở lại)
  // -> đọc trạng thái thật từ main để công tắc không hiển thị sai.
  useEffect(() => {
    if (!isDesktop) return
    let active = true
    void window.api
      .getWindowState()
      .then((s) => {
        if (!active) return
        setOnTop(s.alwaysOnTop)
        setMini(s.mini)
      })
      .catch(() => {})
    void window.api.getFullScreen().then((v) => active && setFullScreen(v))
    const offWindowState = window.api.onWindowState((state) => {
      if (!active) return
      setOnTop(state.alwaysOnTop)
      setMini(state.mini)
    })
    const off = window.api.onFullScreenState(setFullScreen)
    return () => {
      active = false
      offWindowState()
      off()
    }
  }, [])

  // Đồng bộ công tắc khi phím tắt "Luôn nổi trên cùng" được nhấn.
  useEffect(() => {
    const h = (e: Event) => setOnTop(!!(e as CustomEvent).detail)
    window.addEventListener('always-on-top-changed', h)
    return () => window.removeEventListener('always-on-top-changed', h)
  }, [])

  // Phím tắt toàn cục vừa bật/tắt tính năng (AppLayout bắn event) -> đồng bộ nút
  useEffect(() => {
    const h = (e: Event) => setDeskTrans(!!(e as CustomEvent).detail)
    window.addEventListener('desktop-translate-changed', h)
    return () => window.removeEventListener('desktop-translate-changed', h)
  }, [])

  // Trạng thái cập nhật chỉ tồn tại ở Electron. Đọc lại trạng thái gần nhất để
  // không bỏ lỡ trường hợp bản mới đã tải xong trước khi mở trang Cài đặt.
  useEffect(() => {
    if (!isDesktop) return

    let active = true
    const off = window.api.onUpdateStatus((status) => {
      if (active) setUpdateStatus(status)
    })

    void window.api
      .appVersion()
      .then((version) => {
        if (active) setAppVersion(version)
      })
      .catch(() => {})

    void window.api
      .getUpdateStatus()
      .then((status) => {
        if (active && status) setUpdateStatus(status)
      })
      .catch(() => {})

    return () => {
      active = false
      off()
    }
  }, [])

  // Lưu + đăng ký phím tắt mới (accel rỗng = gỡ bỏ)
  const applyHotkey = async (accel: string) => {
    setHotkey(accel)
    setHkErr(null)
    localStorage.setItem('desktop_translate_hotkey', accel)
    const ok = await window.api?.setTranslateHotkey(accel)
    if (accel && !ok) setHkErr('Không đăng ký được — tổ hợp có thể đã bị ứng dụng khác dùng')
  }

  const applyOnTopHotkey = async (accel: string) => {
    setOnTopHkErr(null)
    const ok = await window.api?.setAlwaysOnTopHotkey(accel)
    if (accel && !ok) {
      // Main đã gỡ tổ hợp cũ trước khi thử tổ hợp mới; khôi phục nếu tổ hợp mới bị chiếm.
      await window.api?.setAlwaysOnTopHotkey(onTopHotkey)
      setOnTopHkErr('Không đăng ký được — tổ hợp có thể đã bị ứng dụng khác dùng')
      return
    }
    setOnTopHotkey(accel)
    localStorage.setItem('always_on_top_hotkey', accel)
  }

  // Chế độ ghi phím tắt: nhấn tổ hợp để đặt, Esc hủy, Backspace/Delete gỡ phím tắt
  useEffect(() => {
    if (!recording) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecording(false)
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        void applyHotkey('')
        setRecording(false)
        return
      }
      const accel = accelFromEvent(e)
      if (!accel) return // chờ tổ hợp hợp lệ (phải kèm Ctrl/Alt)
      void applyHotkey(accel)
      setRecording(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording])

  useEffect(() => {
    if (!recordingOnTop) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecordingOnTop(false)
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        void applyOnTopHotkey('')
        setRecordingOnTop(false)
        return
      }
      const accel = accelFromEvent(e)
      if (!accel) return
      void applyOnTopHotkey(accel)
      setRecordingOnTop(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingOnTop])

  const toggleSuggest = () => {
    const next = !suggest
    setSuggest(next)
    localStorage.setItem('suggest_enabled', next ? '1' : '0')
  }

  const toggleSpell = () => {
    const next = !spell
    setSpell(next)
    localStorage.setItem('spell_enabled', next ? '1' : '0')
  }

  const toggleGrammar = () => {
    const next = !grammar
    setGrammar(next)
    localStorage.setItem('grammar_enabled', next ? '1' : '0')
  }

  const checkForUpdate = async () => {
    setUpdateStatus({ state: 'checking' })
    try {
      const result = await window.api.checkUpdate()
      if (result === null) {
        setUpdateStatus((current) =>
          current?.state === 'checking'
            ? { state: 'error', message: 'Không thể kết nối dịch vụ cập nhật' }
            : current,
        )
      }
    } catch {
      setUpdateStatus({ state: 'error', message: 'Không thể kết nối dịch vụ cập nhật' })
    }
  }

  const installUpdate = () => {
    void window.api.installUpdate()
  }

  // Chữ cái đầu của email cho ô avatar (thuần hiển thị, không đổi logic)
  const initial = (user?.email?.[0] ?? 'U').toUpperCase()

  return (
    <div className="page set-page">
      <div className="set-head">
        <h1>Cài đặt</h1>
        <p>Tài khoản, giao diện và trợ lý viết.</p>
      </div>

      {/* ------------------------------------------------- Tài khoản */}
      <section className="set-card">
        <div className="set-row">
          <span className="set-ava">{initial}</span>
          <span className="set-main">
            <span className="set-title">{user?.email}</span>
            <span className="set-desc">Tài khoản · đồng bộ đám mây</span>
          </span>
          <span className="set-side">
            <button className="set-btn set-btn-danger" onClick={signOut}>
              <Icon name="logout" /> Đăng xuất
            </button>
          </span>
        </div>
      </section>

      {/* --------------------------------------------------- Giao diện */}
      <h2 className="set-label">Giao diện</h2>
      <section className="set-card">
        <div className="set-row">
          <span className="set-ico">
            <Icon name="moon" />
          </span>
          <span className="set-main">
            <span className="set-title">Chế độ hiển thị</span>
            <span className="set-desc">Sáng hoặc Tối — áp dụng cho toàn bộ ứng dụng</span>
          </span>
          <span className="set-side">
            <span className="set-seg">
              <button
                className={theme !== 'dark' ? 'is-active' : ''}
                onClick={() => theme === 'dark' && toggle()}
              >
                <Icon name="sun" /> Sáng
              </button>
              <button
                className={theme === 'dark' ? 'is-active' : ''}
                onClick={() => theme !== 'dark' && toggle()}
              >
                <Icon name="moon" /> Tối
              </button>
            </span>
          </span>
        </div>
      </section>

      {/* Cửa sổ nổi / thu gọn — chỉ có ở bản desktop (web không điều khiển được cửa sổ) */}
      {isDesktop && (
        <>
          <h2 className="set-label">Cửa sổ</h2>
          <section className="set-card">
            <div className="set-row">
              <span className="set-ico">
                <Icon name="pin" />
              </span>
              <span className="set-main">
                <span className="set-title">Luôn nổi trên cùng</span>
                <span className="set-desc">
                  {mini
                    ? 'Đang bật theo chế độ hình trong hình — tắt chế độ đó để đổi lại'
                    : 'Giữ EngMaster nằm trên các ứng dụng khác để vừa học vừa làm việc'}
                </span>
                <span className="set-hotkey">
                  Phím tắt bật/tắt:{' '}
                  {recordingOnTop ? (
                    <span className="set-recording">
                      nhấn tổ hợp phím (kèm Ctrl/Alt)… · Esc hủy · Backspace gỡ
                    </span>
                  ) : (
                    <>
                      <kbd className="set-kbd">{onTopHotkey || 'chưa đặt'}</kbd>
                      <button className="set-btn set-btn-sm" onClick={() => setRecordingOnTop(true)}>
                        Đổi
                      </button>
                    </>
                  )}
                  {onTopHkErr && <span className="set-hotkey-err">{onTopHkErr}</span>}
                </span>
              </span>
              <span className="set-side">
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={onTop}
                    disabled={mini}
                    onChange={toggleOnTop}
                  />
                  <span className="track" />
                </label>
              </span>
            </div>

            <div className="set-row">
              <span className="set-ico">
                <Icon name="menu" />
              </span>
              <span className="set-main">
                <span className="set-title">Ẩn toàn bộ thanh trên cùng</span>
                <span className="set-desc">
                  Ẩn cả nút menu, logo và các nút thu nhỏ / phóng to / đóng để dành thêm không
                  gian cho nội dung. Bật lại bất cứ lúc nào bằng phím tắt.
                </span>
                <span className="set-hotkey">
                  Phím tắt bật/tắt: <kbd className="set-kbd">Ctrl + Shift + H</kbd>
                </span>
              </span>
              <span className="set-side">
                <label className="set-switch">
                  <input
                    type="checkbox"
                    checked={chromeHidden}
                    onChange={() => setChromeHidden(!chromeHidden)}
                  />
                  <span className="track" />
                </label>
              </span>
            </div>

            <div className="set-row">
              <span className="set-ico">
                <Icon name="grid" />
              </span>
              <span className="set-main">
                <span className="set-title">Toàn màn hình</span>
                <span className="set-desc">
                  Phủ kín màn hình, ẩn cả thanh tiêu đề lẫn thanh tác vụ — hợp lúc cần tập trung
                </span>
                <span className="set-hotkey">
                  Phím tắt bật/tắt: <kbd className="set-kbd">F11</kbd>
                </span>
              </span>
              <span className="set-side">
                <label className="set-switch">
                  <input type="checkbox" checked={fullScreen} onChange={toggleFull} />
                  <span className="track" />
                </label>
              </span>
            </div>

            <div className="set-row">
              <span className="set-ico">
                <Icon name="pip" />
              </span>
              <span className="set-main">
                <span className="set-title">Chế độ hình trong hình</span>
                <span className="set-desc">
                  Thu cửa sổ về góc phải-dưới màn hình (420×640) và luôn nổi trên các ứng dụng
                  khác — tắt để trả lại kích thước cũ
                </span>
              </span>
              <span className="set-side">
                <label className="set-switch">
                  <input type="checkbox" checked={mini} onChange={toggleMini} />
                  <span className="track" />
                </label>
              </span>
            </div>
          </section>
        </>
      )}

      {/* ------------------------------------------------ Trợ lý viết */}
      <h2 className="set-label">Trợ lý viết</h2>
      <section className="set-card">
        <div className="set-row">
          <span className="set-ico">
            <Icon name="sparkle" />
          </span>
          <span className="set-main">
            <span className="set-title">Gợi ý từ khi viết</span>
            <span className="set-desc">Hiện gợi ý từ tiếp theo khi bạn gõ</span>
          </span>
          <span className="set-side">
            <label className="set-switch">
              <input type="checkbox" checked={suggest} onChange={toggleSuggest} />
              <span className="track" />
            </label>
          </span>
        </div>

        <div className="set-row">
          <span className="set-ico">
            <Icon name="type" />
          </span>
          <span className="set-main">
            <span className="set-title">Kiểm tra chính tả</span>
            <span className="set-desc">Gạch chân từ sai kèm gợi ý sửa</span>
          </span>
          <span className="set-side">
            <label className="set-switch">
              <input type="checkbox" checked={spell} onChange={toggleSpell} />
              <span className="track" />
            </label>
          </span>
        </div>

        <div className="set-row">
          <span className="set-ico">
            <Icon name="target" />
          </span>
          <span className="set-main">
            <span className="set-title">Kiểm tra câu</span>
            <span className="set-desc">
              Ngữ pháp, văn phong, dùng từ, collocation (cần mạng)
            </span>
          </span>
          <span className="set-side">
            <label className="set-switch">
              <input type="checkbox" checked={grammar} onChange={toggleGrammar} />
              <span className="track" />
            </label>
          </span>
        </div>

        {/* Dịch toàn màn hình là tính năng nền của desktop → ẩn trên web */}
        {isDesktop && (
          <div className="set-row">
            <span className="set-ico">
              <Icon name="lang" />
            </span>
            <span className="set-main">
              <span className="set-title">Dịch nhanh toàn màn hình</span>
              <span className="set-desc">
                {deskTrans
                  ? 'Bôi/tô chữ ở BẤT KỲ app nào (trình duyệt, Word, PDF…) để dịch'
                  : 'Bôi/tô chữ ở bất kỳ ứng dụng nào để dịch nhanh'}
              </span>
              <span className="set-hotkey">
                Phím tắt bật/tắt:{' '}
                {recording ? (
                  <span className="set-recording">
                    nhấn tổ hợp phím (kèm Ctrl/Alt)… · Esc hủy · Backspace gỡ
                  </span>
                ) : (
                  <>
                    <kbd className="set-kbd">{hotkey || 'chưa đặt'}</kbd>
                    <button className="set-btn set-btn-sm" onClick={() => setRecording(true)}>
                      Đổi
                    </button>
                  </>
                )}
                {hkErr && <span className="set-hotkey-err">{hkErr}</span>}
              </span>
            </span>
            <span className="set-side">
              <label className="set-switch">
                <input type="checkbox" checked={deskTrans} onChange={toggleDeskTrans} />
                <span className="track" />
              </label>
            </span>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------- Ôn tập */}
      <h2 className="set-label">Ôn tập</h2>
      <section className="set-card">
        <div className="set-row">
          <span className="set-ico">
            <Icon name="repeat" />
          </span>
          <span className="set-main">
            <span className="set-title">Chiều ôn mặc định</span>
            <span className="set-desc">Áp dụng khi bắt đầu một phiên ôn mới</span>
          </span>
          <span className="set-side">
            <select
              className="set-select"
              value={frontVi ? 'vi' : 'en'}
              onChange={(e) => chooseFront(e.target.value === 'vi')}
            >
              <option value="en">Anh → Việt</option>
              <option value="vi">Việt → Anh</option>
            </select>
          </span>
        </div>

        <div className="set-row">
          <span className="set-ico">
            <Icon name="speak" />
          </span>
          <span className="set-main">
            <span className="set-title">Tự phát âm từ tiếng Anh</span>
            <span className="set-desc">Áp dụng khi ôn tập và làm bài tập</span>
          </span>
          <span className="set-side">
            <label className="set-switch">
              <input type="checkbox" checked={autoSpeak} onChange={toggleAutoSpeak} />
              <span className="track" />
            </label>
          </span>
        </div>
      </section>

      {/* Auto-update chỉ hỗ trợ bản desktop cài bằng NSIS. */}
      {isDesktop && (
        <>
          <h2 className="set-label">Cập nhật ứng dụng</h2>
          <section className="set-card">
            <div className="set-row set-update-row">
              <span className="set-ico">
                <Icon name="refresh" />
              </span>
              <span className="set-main">
                <span className="set-title">EngMaster v{appVersion}</span>
                <span className="set-desc">Phiên bản hiện tại trên máy của bạn</span>

                {updateStatus && (
                  <div
                    className={`set-update-status is-${updateStatus.state}`}
                    role="status"
                    aria-live="polite"
                  >
                    {updateStatus.state === 'checking' && 'Đang kiểm tra cập nhật…'}
                    {updateStatus.state === 'none' && 'Bạn đang dùng bản mới nhất'}
                    {updateStatus.state === 'available' &&
                      `Đã tìm thấy bản v${updateStatus.version} · đang chuẩn bị tải…`}
                    {updateStatus.state === 'downloading' && (
                      <>
                        <div className="set-update-progress-label">
                          <span>Đang tải bản cập nhật…</span>
                          <strong>{updateStatus.percent}%</strong>
                        </div>
                        <div
                          className="set-update-progress"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={updateStatus.percent}
                        >
                          <span style={{ width: `${updateStatus.percent}%` }} />
                        </div>
                      </>
                    )}
                    {updateStatus.state === 'ready' &&
                      `Bản v${updateStatus.version} đã sẵn sàng để cài đặt.`}
                    {updateStatus.state === 'error' &&
                      'Không kiểm tra được cập nhật. Vui lòng thử lại khi có mạng.'}
                  </div>
                )}
              </span>

              <span className="set-side">
                {updateStatus?.state === 'ready' ? (
                  <button className="set-btn set-btn-primary" onClick={installUpdate}>
                    Khởi động lại để cập nhật
                  </button>
                ) : (
                  <button
                    className="set-btn"
                    onClick={() => void checkForUpdate()}
                    disabled={
                      updateStatus?.state === 'checking' ||
                      updateStatus?.state === 'downloading' ||
                      updateStatus?.state === 'available'
                    }
                  >
                    {updateStatus?.state === 'checking'
                      ? 'Đang kiểm tra…'
                      : updateStatus?.state === 'downloading' ||
                          updateStatus?.state === 'available'
                        ? 'Đang tải…'
                        : 'Kiểm tra cập nhật'}
                  </button>
                )}
              </span>
            </div>
          </section>
        </>
      )}

      <p className="set-version">EngMaster v{appVersion}</p>
    </div>
  )
}
