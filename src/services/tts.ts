// ============================================================
// TTS — phát âm từ/câu tiếng Anh bằng Web SpeechSynthesis.
// Có sẵn trong Electron/Chrome/Edge; trên Windows dùng giọng hệ thống
// (offline, không cần API key). Dùng chung cho Flashcard, popup dịch…
// ============================================================

export const ttsSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window

let voices: SpeechSynthesisVoice[] = []

function refreshVoices() {
  voices = window.speechSynthesis.getVoices()
}
if (ttsSupported) {
  refreshVoices()
  // Danh sách giọng nạp bất đồng bộ -> cập nhật lại khi sẵn sàng
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

// Chọn giọng tiếng Anh tốt nhất hiện có: ưu tiên en-US > en-GB,
// giọng "Natural/Online" (Windows 11/Edge) nghe tự nhiên hơn giọng cổ điển.
function pickVoice(): SpeechSynthesisVoice | null {
  if (!voices.length) refreshVoices()
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'))
  if (!en.length) return null
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0
    const lang = v.lang.toLowerCase()
    if (lang.startsWith('en-us')) s += 4
    else if (lang.startsWith('en-gb')) s += 3
    if (/natural|online/i.test(v.name)) s += 2
    if (/google/i.test(v.name)) s += 1
    return s
  }
  return en.sort((a, b) => score(b) - score(a))[0]
}

// Phát âm đoạn chữ tiếng Anh. Gọi lần nữa khi đang đọc -> ngắt lượt cũ, đọc lượt mới.
// rate hơi chậm (0.95) để nghe rõ; truyền rate thấp hơn nếu muốn đọc chậm.
export function speak(text: string, rate = 0.95): void {
  if (!ttsSupported) return
  const t = text.trim()
  if (!t) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(t)
  u.lang = 'en-US'
  const v = pickVoice()
  if (v) u.voice = v
  u.rate = rate
  synth.speak(u)
}

// Dừng đọc (nếu đang đọc)
export function stopSpeaking(): void {
  if (ttsSupported) window.speechSynthesis.cancel()
}
