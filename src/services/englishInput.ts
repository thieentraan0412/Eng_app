// Làm sạch chữ gõ vào ô chỉ nhận tiếng Anh — dùng chung cho Chép câu và game Mưa từ.
//
// Giữ chữ Latin ASCII, số, xuống dòng và dấu câu; chuẩn hóa một số dấu câu
// “thông minh” thường gặp khi dán văn bản. Chữ có dấu (bộ gõ tiếng Việt đang
// bật, hoặc dán văn bản tiếng Việt) được HẠ DẤU về chữ cái gốc chứ không xóa —
// xóa thẳng thì chữ tự dưng biến mất, người gõ tưởng ô nhập hỏng.
export function sanitizeEnglishInput(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'))
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x20-\x7E\n]/g, '')
}
