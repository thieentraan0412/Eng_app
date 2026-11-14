// Danh mục "Tài liệu" — các trang HTML song ngữ soạn trong DATA/ được đưa vào app.
// Nội dung lấy thẳng từ file HTML gốc (?raw) nên sửa file trong DATA/ là app cập nhật
// theo ở lần build sau. Cách đọc file: src/services/docContent.ts.
// Thêm tài liệu mới = thêm một mục vào DOCUMENTS (file theo cùng khuôn song ngữ).
import huongDanSongNgu from '../../DATA/huong-dan-song-ngu.html?raw'

export interface DocMeta {
  id: string
  /** Nhãn nhỏ phía trên tiêu đề */
  eyebrow: string
  /** Mô tả ngắn trong thư viện */
  summary: string
  tags: string[]
  /** HTML gốc của cả trang */
  raw: string
}

export const DOCUMENTS: DocMeta[] = [
  {
    id: 'huong-dan-song-ngu',
    eyebrow: 'IELTS Writing Task 2',
    summary:
      'Công thức 6 câu hỏi, collocation & pattern theo mức độ, 12 hướng phát triển ý kèm câu mẫu, chuỗi lập luận và đoạn văn mẫu — trình bày song song Việt – Anh.',
    tags: ['Writing Task 2', 'Tìm ý', 'Pattern'],
    raw: huongDanSongNgu,
  },
]

export function findDocument(id: string | null | undefined): DocMeta | undefined {
  return id ? DOCUMENTS.find((d) => d.id === id) : undefined
}
