import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useWindowChrome } from '../contexts/WindowChromeContext'
import { isDesktop } from '../platform'
import Icon from '../components/Icon'
import type { UpdateStatus } from '../vite-env'
import { accelFromEvent, readQuickTranslateHotkey } from '../services/hotkey'
import {
  autoEnglishVoice,
  englishVoiceGroups,
  loadVoiceChoice,
  onVoicesChanged,
  saveVoiceChoice,
  speak,
  ttsSupported,
  voiceLabel,
} from '../services/tts'
import { listFolders, type Folder } from '../services/cloud/sentenceCloud'
import {
  DISPLAY_OPTIONS,
  INTERVAL_OPTIONS,
  REMINDER_UPDATED_EVENT,
  describeNext,
  formatDuration,
  planNextSentence,
  readReminderEnabled,
  readReminderFolder,
  readReminderTiming,
  saveReminderEnabled,
  saveReminderFolder,
  saveReminderTiming,
  type ReminderTiming,
} from '../services/sentenceReminder'
import '../styles/settings.css'

// Câu đọc thử khi chọn giọng / bấm "Nghe thử"
const VOICE_SAMPLE = 'Hello! This is the voice I will use to read English for you.'

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
  const [quickHotkey, setQuickHotkey] = useState(readQuickTranslateHotkey)
  const [quickDirection, setQuickDirection] = useState<'en-vi' | 'vi-en'>(
    localStorage.getItem('quick_translate_direction') === 'vi-en' ? 'vi-en' : 'en-vi',
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
  const [recordingQuick, setRecordingQuick] = useState(false)
  const [quickHkErr, setQuickHkErr] = useState<string | null>(null)
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
  // Giọng đọc tiếng Anh cho toàn bộ app (lưu theo từng thiết bị). Danh sách giọng
  // nạp chậm và đổi khi cài thêm giọng -> đọc lại mỗi khi trình duyệt báo.
  const [voiceGroups, setVoiceGroups] = useState(englishVoiceGroups)
  const [voiceChoice, setVoiceChoice] = useState(loadVoiceChoice)
  useEffect(() => onVoicesChanged(() => setVoiceGroups(englishVoiceGroups())), [])
  const chooseVoice = (voiceURI: string) => {
    setVoiceChoice(voiceURI)
    saveVoiceChoice(voiceURI)
    speak(VOICE_SAMPLE) // đọc thử ngay bằng giọng vừa chọn
  }
  const autoVoice = autoEnglishVoice()
  const allVoices = voiceGroups.flatMap((g) => g.voices)
  // Giọng đã chọn không còn trên máy này -> ô chọn hiện "Tự động" (app cũng đọc như vậy)
  const voiceValue = allVoices.some((v) => v.voiceURI === voiceChoice) ? voiceChoice : ''
  // Chép câu: làm đúng thì tự đọc to câu hoàn chỉnh (đọc thẳng khóa lúc chấm)
  const [sentenceSpeak, setSentenceSpeak] = useState(
    localStorage.getItem('sc_autospeak') !== '0',
  )
  const toggleSentenceSpeak = () => {
    const next = !sentenceSpeak
    setSentenceSpeak(next)
    localStorage.setItem('sc_autospeak', next ? '1' : '0')
  }
  // Chép câu: gõ xong một từ đúng chỗ thì đọc ngay từ đó (mặc định TẮT)
  const [wordSpeak, setWordSpeak] = useState(localStorage.getItem('sc_wordspeak') === '1')
  const toggleWordSpeak = () => {
    const next = !wordSpeak
    setWordSpeak(next)
    localStorage.setItem('sc_wordspeak', next ? '1' : '0')
  }
  // Nhắc chép câu (desktop): mặc định TẮT; nguồn câu là 1 thư mục hoặc tất cả
  const [reminder, setReminder] = useState(readReminderEnabled)
  const [reminderFolder, setReminderFolder] = useState(readReminderFolder)
  const [sentenceFolders, setSentenceFolders] = useState<Folder[]>([])
  // Chờ bao lâu thì hiện câu + câu nằm trên màn hình bao lâu thì ẩn
  const [reminderTiming, setReminderTiming] = useState(readReminderTiming)
  const toggleReminder = () => {
    const next = !reminder
    setReminder(next)
    saveReminderEnabled(next)
  }
  const chooseReminderTiming = (patch: Partial<ReminderTiming>) => {
    setReminderTiming((t) => ({ ...t, ...patch }))
    saveReminderTiming(patch)
  }
  const chooseReminderFolder = (folderId: string) => {
    setReminderFolder(folderId)
    saveReminderFolder(folderId)
  }
  useEffect(() => {
    if (!isDesktop) return
    let active = true
    // Lỗi tải -> ô chọn chỉ còn "Tất cả thư mục"
    void listFolders()
      .then((fs) => active && setSentenceFolders(fs))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  // Câu sẽ hiện ở lượt tới (số thứ tự trong bộ đang dùng). Tính lại khi đổi bộ và
  // mỗi khi lượt nhắc hiện câu / tự chuyển bộ / tự tắt / vừa làm xong một câu.
  const [nextInfo, setNextInfo] = useState<string | null>(null)
  useEffect(() => {
    if (!isDesktop || !reminder) return
    let active = true
    const refresh = () => {
      planNextSentence()
        .then((next) => active && setNextInfo(describeNext(next)))
        .catch(() => active && setNextInfo(null))
    }
    const onUpdated = () => {
      setReminder(readReminderEnabled())
      setReminderFolder(readReminderFolder())
      refresh()
    }
    setNextInfo(null)
    refresh()
    window.addEventListener(REMINDER_UPDATED_EVENT, onUpdated)
    return () => {
      active = false
      window.removeEventListener(REMINDER_UPDATED_EVENT, onUpdated)
    }
  }, [reminder, reminderFolder])

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

  const applyQuickHotkey = async (accel: string) => {
    setQuickHkErr(null)
    const ok = await window.api?.setQuickTranslateHotkey(accel)
    if (isDesktop && accel && !ok) {
      await window.api?.setQuickTranslateHotkey(quickHotkey)
      setQuickHkErr('Không đăng ký được — tổ hợp có thể đã bị ứng dụng khác dùng')
      return
    }
    setQuickHotkey(accel)
    localStorage.setItem('quick_translate_hotkey', accel)
    window.dispatchEvent(new CustomEvent('quick-translate-hotkey-changed', { detail: accel }))
  }

  const chooseQuickDirection = (direction: 'en-vi' | 'vi-en') => {
    setQuickDirection(direction)
    localStorage.setItem('quick_translate_direction', direction)
    window.dispatchEvent(
      new CustomEvent('quick-translate-direction-changed', { detail: direction }),
    )
  }

  const openQuickTranslate = () => {
    if (isDesktop) void window.api.openQuickTranslateWindow()
    else window.dispatchEvent(new Event('quick-translate-open'))
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

  useEffect(() => {
    if (!recordingQuick) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecordingQuick(false)
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        void applyQuickHotkey('')
        setRecordingQuick(false)
        return
      }
      const accel = accelFromEvent(e)
      if (!accel) return
      void applyQuickHotkey(accel)
      setRecordingQuick(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingQuick])

  useEffect(() => {
    const onDirection = (event: Event) => {
      const direction = (event as CustomEvent<'en-vi' | 'vi-en'>).detail
      if (direction === 'en-vi' || direction === 'vi-en') setQuickDirection(direction)
    }
    window.addEventListener('quick-translate-direction-changed', onDirection)
    return () => window.removeEventListener('quick-translate-direction-changed', onDirection)
  }, [])

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

      {/* -------------------------------------------------- Giọng đọc */}
      {ttsSupported && (
        <>
          <h2 className="set-label">Giọng đọc</h2>
          <section className="set-card">
            <div className="set-row">
              <span className="set-ico">
                <Icon name="speak" />
              </span>
              <span className="set-main">
                <span className="set-title">Giọng đọc tiếng Anh</span>
                <span className="set-desc">
                  Dùng cho mọi chỗ máy đọc tiếng Anh: từ vựng, ôn tập, chép câu, bài đọc, dịch
                  nhanh. Mỗi máy và trình duyệt có bộ giọng riêng nên chọn riêng trên từng thiết bị.
                  {allVoices.some((v) => !v.localService) &&
                    ' Giọng (online) nghe tự nhiên hơn nhưng cần mạng và ra tiếng chậm hơn.'}
                </span>
                {isDesktop && (
                  <span className="set-hotkey">
                    Thêm giọng Anh-Anh, Úc, Ấn…: Settings của Windows › Time & language › Speech ›
                    Add voices, rồi mở lại app.
                  </span>
                )}
              </span>
              <span className="set-side set-voice">
                <select
                  className="set-select"
                  value={voiceValue}
                  aria-label="Giọng đọc tiếng Anh"
                  onChange={(e) => chooseVoice(e.target.value)}
                >
                  <option value="">
                    Tự động{autoVoice ? ` — ${voiceLabel(autoVoice)}` : ''}
                  </option>
                  {voiceGroups.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.voices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {voiceLabel(v)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  className="set-btn"
                  onClick={() => speak(VOICE_SAMPLE)}
                  title="Nghe thử giọng đang chọn"
                >
                  <Icon name="play" /> Nghe thử
                </button>
              </span>
            </div>
          </section>
        </>
      )}

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

        <div className="set-row">
          <span className="set-ico">
            <Icon name="lang" />
          </span>
          <span className="set-main">
            <span className="set-title">Dịch nhanh bằng bàn phím</span>
            <span className="set-desc">
              {isDesktop
                ? 'Mở hộp dịch từ mọi ứng dụng, nhập tiếng Anh hoặc tiếng Việt rồi nhấn Enter'
                : 'Mở hộp dịch khi đang dùng EngMaster trên trình duyệt, nhập nội dung rồi nhấn Enter'}
            </span>
            <span className="set-hotkey">
              Phím tắt mở:{' '}
              {recordingQuick ? (
                <span className="set-recording">
                  nhấn tổ hợp phím (kèm Ctrl/Alt)… · Esc hủy · Backspace gỡ
                </span>
              ) : (
                <>
                  <kbd className="set-kbd">{quickHotkey || 'chưa đặt'}</kbd>
                  <button className="set-btn set-btn-sm" onClick={() => setRecordingQuick(true)}>
                    Đổi
                  </button>
                  <button
                    className="set-btn set-btn-sm"
                    onClick={openQuickTranslate}
                  >
                    Mở thử
                  </button>
                </>
              )}
              {quickHkErr && <span className="set-hotkey-err">{quickHkErr}</span>}
            </span>
          </span>
          <span className="set-side">
            <select
              className="set-select"
              value={quickDirection}
              aria-label="Chiều dịch mặc định"
              onChange={(e) => chooseQuickDirection(e.target.value as 'en-vi' | 'vi-en')}
            >
              <option value="en-vi">Anh → Việt</option>
              <option value="vi-en">Việt → Anh</option>
            </select>
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

      {/* --------------------------------------------------- Chép câu */}
      {(ttsSupported || isDesktop) && (
        <>
          <h2 className="set-label">Chép câu</h2>
          <section className="set-card">
            {ttsSupported && (
              <div className="set-row">
                <span className="set-ico">
                  <Icon name="speak" />
                </span>
                <span className="set-main">
                  <span className="set-title">Tự phát âm câu khi làm đúng</span>
                  <span className="set-desc">
                    Đọc to câu tiếng Anh hoàn chỉnh ngay khi kiểm tra đúng. Tắt đi vẫn nghe lại
                    được bằng nút loa cạnh kết quả.
                  </span>
                </span>
                <span className="set-side">
                  <label className="set-switch">
                    <input
                      type="checkbox"
                      checked={sentenceSpeak}
                      onChange={toggleSentenceSpeak}
                    />
                    <span className="track" />
                  </label>
                </span>
              </div>
            )}

            {ttsSupported && (
              <div className="set-row">
                <span className="set-ico">
                  <Icon name="keyboard" />
                </span>
                <span className="set-main">
                  <span className="set-title">Đọc từng từ khi gõ đúng</span>
                  <span className="set-desc">
                    Gõ xong một từ (bấm cách hoặc dấu câu) mà từ đó đúng chỗ trong đáp án thì máy
                    đọc ngay từ đó; gõ sai thì im. Từ cuối câu được đọc ngay khi gõ đủ chữ, hoặc
                    khi bấm Enter. Gõ nhanh thì từ mới ngắt từ đang đọc, nên tiếng luôn theo kịp
                    tay gõ.
                  </span>
                </span>
                <span className="set-side">
                  <label className="set-switch">
                    <input type="checkbox" checked={wordSpeak} onChange={toggleWordSpeak} />
                    <span className="track" />
                  </label>
                </span>
              </div>
            )}

            {/* Cửa sổ câu nổi trên mọi ứng dụng là tính năng của desktop → ẩn trên web */}
            {isDesktop && (
              <div className="set-row">
                <span className="set-ico">
                  <Icon name="clock" />
                </span>
                <span className="set-main">
                  <span className="set-title">Tự động hiển thị câu chép</span>
                  <span className="set-desc">
                    Cứ {formatDuration(reminderTiming.intervalMs)} hiện một câu chưa làm xong lên
                    màn hình, nổi trên mọi ứng dụng, để làm và lưu kết quả ngay — không bấm vào
                    thì tự ẩn sau {formatDuration(reminderTiming.displayMs)}, lần sau hiện lại.
                  </span>
                </span>
                <span className="set-side">
                  <label className="set-switch">
                    <input type="checkbox" checked={reminder} onChange={toggleReminder} />
                    <span className="track" />
                  </label>
                </span>
              </div>
            )}

            {isDesktop && reminder && (
              <div className="set-row">
                <span className="set-ico">
                  <Icon name="repeat" />
                </span>
                <span className="set-main">
                  <span className="set-title">Thời gian chờ giữa hai lần hiện</span>
                  <span className="set-desc">
                    Câu đóng lại rồi, chờ bao lâu thì hiện câu tiếp theo
                  </span>
                </span>
                <span className="set-side">
                  <select
                    className="set-select"
                    value={reminderTiming.intervalMs}
                    aria-label="Thời gian chờ giữa hai lần hiện câu"
                    onChange={(e) => chooseReminderTiming({ intervalMs: Number(e.target.value) })}
                  >
                    {INTERVAL_OPTIONS.map((ms) => (
                      <option key={ms} value={ms}>
                        {formatDuration(ms)}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            )}

            {isDesktop && reminder && (
              <div className="set-row">
                <span className="set-ico">
                  <Icon name="eye" />
                </span>
                <span className="set-main">
                  <span className="set-title">Thời gian hiện câu</span>
                  <span className="set-desc">
                    Không bấm vào câu trong khoảng này thì câu tự ẩn. Đã bắt đầu làm thì câu ở
                    lại tới khi bạn đóng hoặc làm đúng.
                  </span>
                </span>
                <span className="set-side">
                  <select
                    className="set-select"
                    value={reminderTiming.displayMs}
                    aria-label="Thời gian hiện câu trên màn hình"
                    onChange={(e) => chooseReminderTiming({ displayMs: Number(e.target.value) })}
                  >
                    {DISPLAY_OPTIONS.map((ms) => (
                      <option key={ms} value={ms}>
                        {formatDuration(ms)}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            )}

            {isDesktop && reminder && (
              <div className="set-row">
                <span className="set-ico">
                  <Icon name="folder" />
                </span>
                <span className="set-main">
                  <span className="set-title">Thư mục câu</span>
                  <span className="set-desc">
                    Chỉ hiện câu chưa đúng 100%: chưa làm xong thì lần sau hiện lại đúng câu đó.
                    Bộ xong hết thì tự chuyển sang bộ kế tiếp; mọi bộ đều xong thì tự tắt.
                  </span>
                  <span className="set-hotkey">{nextInfo ?? 'Đang tính câu tiếp theo…'}</span>
                </span>
                <span className="set-side">
                  <select
                    className="set-select"
                    value={
                      sentenceFolders.some((f) => f.id === reminderFolder) ? reminderFolder : ''
                    }
                    aria-label="Thư mục câu để hiển thị"
                    onChange={(e) => chooseReminderFolder(e.target.value)}
                  >
                    <option value="">Tất cả thư mục</option>
                    {sentenceFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            )}
          </section>
        </>
      )}

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
