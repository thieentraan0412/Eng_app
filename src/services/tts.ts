// ============================================================
// TTS — phát âm từ/câu tiếng Anh bằng Web SpeechSynthesis.
// Có sẵn trong Electron/Chrome/Edge; trên Windows dùng giọng hệ thống
// (offline, không cần API key). Dùng chung cho Flashcard, popup dịch…
// Giọng đọc chọn ở Cài đặt › Giọng đọc; mặc định app tự chọn giọng tốt nhất.
// ============================================================

export const ttsSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window

// voiceURI của giọng người dùng chọn; không có = app tự chọn. Lưu theo TỪNG
// THIẾT BỊ (localStorage) vì mỗi máy / trình duyệt có một bộ giọng khác nhau.
const VOICE_KEY = 'tts_voice'

let voices: SpeechSynthesisVoice[] = []
let warmed = false // đã đọc ít nhất một lượt -> giọng đã nạp (xem warmUpSpeech)

function refreshVoices() {
  voices = window.speechSynthesis.getVoices()
}
if (ttsSupported) {
  refreshVoices()
  // Danh sách giọng nạp bất đồng bộ -> cập nhật lại khi sẵn sàng
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

// Các giọng tiếng Anh có trên máy / trình duyệt này
export function englishVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported) return []
  if (!voices.length) refreshVoices()
  return voices.filter((v) => v.lang?.toLowerCase().startsWith('en'))
}

// Danh sách giọng nạp chậm hoặc đổi (cài thêm giọng) -> báo để vẽ lại ô chọn giọng
export function onVoicesChanged(cb: () => void): () => void {
  if (!ttsSupported) return () => {}
  window.speechSynthesis.addEventListener('voiceschanged', cb)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', cb)
}

// Giọng app tự chọn khi để "Tự động": ưu tiên en-US > en-GB, giọng
// "Natural/Online" (Windows 11/Edge) nghe tự nhiên hơn giọng cổ điển.
export function autoEnglishVoice(): SpeechSynthesisVoice | null {
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0
    const lang = v.lang.toLowerCase()
    if (lang.startsWith('en-us')) s += 4
    else if (lang.startsWith('en-gb')) s += 3
    if (/natural|online/i.test(v.name)) s += 2
    if (/google/i.test(v.name)) s += 1
    return s
  }
  return englishVoices().sort((a, b) => score(b) - score(a))[0] ?? null
}

export function loadVoiceChoice(): string {
  return localStorage.getItem(VOICE_KEY) ?? ''
}

export function saveVoiceChoice(voiceURI: string): void {
  if (voiceURI) localStorage.setItem(VOICE_KEY, voiceURI)
  else localStorage.removeItem(VOICE_KEY)
}

// Giọng đang dùng: giọng chọn ở Cài đặt nếu máy này còn giọng đó (gỡ giọng, mở
// bằng trình duyệt khác thì không còn), không thì để app tự chọn.
function pickVoice(): SpeechSynthesisVoice | null {
  const chosen = loadVoiceChoice()
  return (chosen && englishVoices().find((v) => v.voiceURI === chosen)) || autoEnglishVoice()
}

// Gắn giọng đang dùng vào một lượt đọc. Mọi chỗ đọc tiếng Anh trong app đều đi
// qua đây, nên đổi giọng ở Cài đặt là đổi cho toàn bộ app.
export function applyEnglishVoice(u: SpeechSynthesisUtterance): void {
  const v = pickVoice()
  u.lang = v?.lang ?? 'en-US'
  if (v) u.voice = v
}

// Phát âm đoạn chữ tiếng Anh. Gọi lần nữa khi đang đọc -> ngắt lượt cũ, đọc lượt mới.
// rate hơi chậm (0.95) để nghe rõ; truyền rate thấp hơn nếu muốn đọc chậm.
// onEnd chạy khi đọc xong, bị ngắt hoặc lỗi — để nút "Nghe" trở lại trạng thái cũ.
export function speak(text: string, rate = 0.95, onEnd?: () => void): void {
  if (!ttsSupported) return
  const t = text.trim()
  if (!t) return
  const synth = window.speechSynthesis
  warmed = true
  synth.cancel()
  const u = new SpeechSynthesisUtterance(t)
  applyEnglishVoice(u)
  u.rate = rate
  if (onEnd) {
    u.onend = onEnd
    u.onerror = onEnd
  }
  synth.speak(u)
}

// Lần đọc ĐẦU TIÊN chậm hơn hẳn vì máy còn phải nạp giọng (đo trên Windows:
// ~0,2–0,4 giây, các lần sau ~0,1 giây). Đọc trước một tiếng câm để lúc cần đọc
// thật (VD gõ xong một từ) tiếng ra ngay. Chỉ một lần, và bỏ qua khi đang đọc
// dở (đọc chen sẽ cắt mất lượt đó). Chỉ gọi ở bản desktop: Safari iOS bỏ qua
// volume nên tiếng "câm" vẫn phát ra loa.
export function warmUpSpeech(): void {
  if (!ttsSupported || warmed) return
  const synth = window.speechSynthesis
  if (synth.speaking || synth.pending) return
  warmed = true
  const u = new SpeechSynthesisUtterance('a')
  applyEnglishVoice(u)
  u.volume = 0
  synth.speak(u)
}

// Dừng đọc (nếu đang đọc)
export function stopSpeaking(): void {
  if (ttsSupported) window.speechSynthesis.cancel()
}

// ---------- Ô chọn giọng ở Cài đặt ----------
const REGIONS: Record<string, string> = {
  US: 'Anh-Mỹ',
  GB: 'Anh-Anh',
  AU: 'Anh-Úc',
  CA: 'Anh-Canada',
  IN: 'Anh-Ấn',
  IE: 'Anh-Ireland',
  NZ: 'Anh-New Zealand',
  ZA: 'Anh-Nam Phi',
  SG: 'Anh-Singapore',
  PH: 'Anh-Philippines',
  HK: 'Anh-Hồng Kông',
  KE: 'Anh-Kenya',
  NG: 'Anh-Nigeria',
  TZ: 'Anh-Tanzania',
}

// Tên giọng gọn: "Microsoft Aria Online (Natural) - English (United States)" ->
// "Aria (online)". Giọng online nghe tự nhiên hơn nhưng cần mạng, ra tiếng chậm hơn.
export function voiceLabel(v: SpeechSynthesisVoice): string {
  const name =
    v.name
      .replace(/\s*[-–]\s*English\b.*$/i, '')
      .replace(/^Microsoft\s+/i, '')
      .replace(/\s+Online\s*\(Natural\)\s*$/i, '')
      .trim() || v.name
  return v.localService ? name : `${name} (online)`
}

// Giọng tiếng Anh xếp nhóm theo vùng: Anh-Mỹ, Anh-Anh trước, các vùng khác theo ABC
export function englishVoiceGroups(): { label: string; voices: SpeechSynthesisVoice[] }[] {
  const byRegion = new Map<string, SpeechSynthesisVoice[]>()
  for (const v of englishVoices()) {
    const code = v.lang.replace('_', '-').split('-')[1]?.toUpperCase() ?? ''
    byRegion.set(code, [...(byRegion.get(code) ?? []), v])
  }
  const rank = (code: string) => (code === 'US' ? 0 : code === 'GB' ? 1 : 2)
  const label = (code: string) => REGIONS[code] ?? (code ? `Anh (${code})` : 'Tiếng Anh')
  return [...byRegion]
    .sort(([a], [b]) => rank(a) - rank(b) || label(a).localeCompare(label(b), 'vi'))
    .map(([code, list]) => ({
      label: label(code),
      voices: list.sort((a, b) => voiceLabel(a).localeCompare(voiceLabel(b))),
    }))
}
