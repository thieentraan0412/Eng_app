import { useEffect, useState, type FormEvent } from 'react'
import {
  CloudApi,
  type Lesson,
  type Question,
  type NewQuestion,
  type QuestionType,
} from '../services/cloud/CloudApiClient'

export default function GrammarPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selected, setSelected] = useState<Lesson | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')

  const load = async () => {
    try {
      setLessons(await CloudApi.listLessons())
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const createLesson = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const l = await CloudApi.createLesson(title.trim())
      setTitle('')
      setLessons((x) => [l, ...x])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const removeLesson = async (l: Lesson) => {
    if (!confirm(`Xóa bài "${l.title}"?`)) return
    await CloudApi.deleteLesson(l.id)
    setLessons((x) => x.filter((y) => y.id !== l.id))
  }

  if (selected) return <LessonDetail lesson={selected} onBack={() => setSelected(null)} />

  return (
    <div className="page">
      <h1 className="page-title">Ngữ pháp & Bài tập</h1>
      {error && <div className="alert error">{error}</div>}

      <form className="inline-form" onSubmit={createLesson}>
        <input
          placeholder="Tên bài học (VD: Thì hiện tại đơn)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn primary" type="submit">
          + Tạo bài
        </button>
      </form>

      {lessons.length === 0 ? (
        <p className="muted">Chưa có bài học. Tạo bài đầu tiên ở trên rồi thêm câu hỏi.</p>
      ) : (
        <div className="deck-grid">
          {lessons.map((l) => (
            <div key={l.id} className="deck-card" onClick={() => setSelected(l)}>
              <div className="deck-name">{l.title}</div>
              <span className="muted">Bấm để mở →</span>
              <button
                className="btn tiny danger"
                onClick={(e) => {
                  e.stopPropagation()
                  removeLesson(l)
                }}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Chi tiết bài: soạn câu hỏi + làm quiz ----------
function LessonDetail({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [mode, setMode] = useState<'edit' | 'quiz'>('edit')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setQuestions(await CloudApi.listQuestions(lesson.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id])

  return (
    <div className="page">
      <button className="btn tiny" onClick={onBack}>
        ← Quay lại
      </button>
      <h1 className="page-title">{lesson.title}</h1>
      {error && <div className="alert error">{error}</div>}

      <div className="tabs">
        <button className={mode === 'edit' ? 'tab active' : 'tab'} onClick={() => setMode('edit')}>
          Soạn câu hỏi ({questions.length})
        </button>
        <button
          className={mode === 'quiz' ? 'tab active' : 'tab'}
          onClick={() => setMode('quiz')}
          disabled={questions.length === 0}
        >
          Làm bài
        </button>
      </div>

      {mode === 'edit' ? (
        <QuestionEditor
          lessonId={lesson.id}
          questions={questions}
          onChange={load}
          onError={setError}
        />
      ) : (
        <Quiz questions={questions} />
      )}
    </div>
  )
}

// ---------- Soạn câu hỏi ----------
function QuestionEditor({
  lessonId,
  questions,
  onChange,
  onError,
}: {
  lessonId: string
  questions: Question[]
  onChange: () => void
  onError: (m: string) => void
}) {
  const [type, setType] = useState<QuestionType>('mcq')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState('')
  const [explanation, setExplanation] = useState('')

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !correct.trim()) return
    const q: NewQuestion = {
      type,
      prompt: prompt.trim(),
      correct_answer: correct.trim(),
      explanation: explanation.trim(),
      options: type === 'mcq' ? options.map((o) => o.trim()).filter(Boolean) : undefined,
    }
    try {
      await CloudApi.createQuestion(lessonId, q)
      setPrompt('')
      setOptions(['', '', '', ''])
      setCorrect('')
      setExplanation('')
      onChange()
    } catch (e) {
      onError((e as Error).message)
    }
  }

  const remove = async (id: string) => {
    await CloudApi.deleteQuestion(id)
    onChange()
  }

  return (
    <div>
      <form className="q-form" onSubmit={add}>
        <div className="tabs">
          <button
            type="button"
            className={type === 'mcq' ? 'tab active' : 'tab'}
            onClick={() => setType('mcq')}
          >
            Trắc nghiệm
          </button>
          <button
            type="button"
            className={type === 'fill_blank' ? 'tab active' : 'tab'}
            onClick={() => setType('fill_blank')}
          >
            Điền từ
          </button>
        </div>

        <input
          placeholder="Câu hỏi / đề bài *"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {type === 'mcq' &&
          options.map((o, i) => (
            <input
              key={i}
              placeholder={`Lựa chọn ${i + 1}`}
              value={o}
              onChange={(e) => {
                const next = [...options]
                next[i] = e.target.value
                setOptions(next)
              }}
            />
          ))}

        <input
          placeholder={type === 'mcq' ? 'Đáp án đúng (gõ đúng nội dung lựa chọn) *' : 'Đáp án đúng *'}
          value={correct}
          onChange={(e) => setCorrect(e.target.value)}
        />
        <input
          placeholder="Giải thích (hiện sau khi chấm)"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        <button className="btn primary" type="submit">
          + Thêm câu hỏi
        </button>
      </form>

      <div className="card-list">
        {questions.map((q, i) => (
          <div key={q.id} className="word-card">
            <div className="wc-main">
              <span className="wc-word">
                {i + 1}. {q.prompt}
              </span>
            </div>
            <div className="muted">
              {q.type === 'mcq' ? 'Trắc nghiệm' : 'Điền từ'} · Đáp án: {q.correct_answer}
            </div>
            <button className="btn tiny danger" onClick={() => remove(q.id)}>
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Làm bài + chấm điểm ----------
function Quiz({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = questions.filter(
    (q) => (answers[q.id] ?? '').trim().toLowerCase() === (q.correct_answer ?? '').toLowerCase(),
  ).length

  if (submitted) {
    return (
      <div>
        <div className="quiz-score">
          Kết quả: <strong>{score}</strong> / {questions.length} câu đúng
        </div>
        <div className="card-list">
          {questions.map((q, i) => {
            const ok =
              (answers[q.id] ?? '').trim().toLowerCase() === (q.correct_answer ?? '').toLowerCase()
            return (
              <div key={q.id} className={`word-card ${ok ? 'q-ok' : 'q-wrong'}`}>
                <div className="wc-word">
                  {i + 1}. {q.prompt}
                </div>
                <div className="muted">Bạn chọn: {answers[q.id] || '(bỏ trống)'}</div>
                {!ok && <div className="q-answer">Đáp án đúng: {q.correct_answer}</div>}
                {q.explanation && <div className="wc-example">💡 {q.explanation}</div>}
              </div>
            )
          })}
        </div>
        <button
          className="btn primary"
          onClick={() => {
            setSubmitted(false)
            setAnswers({})
          }}
        >
          Làm lại
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="card-list">
        {questions.map((q, i) => (
          <div key={q.id} className="word-card">
            <div className="wc-word">
              {i + 1}. {q.prompt}
            </div>
            {q.type === 'mcq' && q.options ? (
              <div className="mcq-options">
                {q.options.map((opt) => (
                  <label key={opt} className="mcq-option">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="fill-input"
                placeholder="Nhập câu trả lời"
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      <button className="btn primary" onClick={() => setSubmitted(true)}>
        Nộp bài & chấm điểm
      </button>
    </div>
  )
}
