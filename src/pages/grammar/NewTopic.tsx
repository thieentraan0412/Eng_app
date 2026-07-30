import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import Icon from '../../components/Icon'
import type { CefrLevel, GrammarFormula, GrammarTrap, GrammarUse } from '../../data/grammar'
import { TOPIC_TEMPLATES, type TopicTemplate } from '../../data/grammarTemplates'
import { errText } from '../../services/cloud/cloudError'
import {
  ERROR_TAGS,
  TOPIC_GROUPS,
  TOPIC_ICONS,
  createTopic,
  saveTopicEdit,
  type GrammarTopic,
  type TopicDraft,
} from '../../services/cloud/grammarCloud'
import {
  KIND_LABEL,
  SAMPLE_PASTE,
  csvToPasteText,
  downloadSampleCsv,
  downloadSampleWorkbook,
  itemsToPasteText,
  parseAll,
  readTopicWorkbook,
  toItem,
  type ParsedLine,
  type ParsedOk,
  type SheetReport,
} from '../../services/grammarImport'
import { topicIcon } from './parts'

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']

type Screen = 'start' | 'templates' | 'xlsx' | 'wizard' | 'done'

interface CmpRow {
  key: string
  other: string
  self: string
}

const emptyFormula = (form = ''): GrammarFormula => ({ form, structure: '', example: '' })
const emptyUse = (): GrammarUse => ({ name: '', sample: '', note: '' })
const emptyTrap = (): GrammarTrap => ({ wrong: '', right: '', why: '' })
const emptyCmp = (): CmpRow => ({ key: '', other: '', self: '' })

export default function NewTopic({
  existingNames,
  edit,
  onCancel,
  onSaved,
}: {
  existingNames: string[]
  /** khác null = mở màn này để SỬA chủ điểm đã có, bỏ qua bước chọn cách bắt đầu */
  edit?: GrammarTopic | null
  onCancel: () => void
  onSaved: (topicId: string, name: string) => void
}) {
  const [screen, setScreen] = useState<Screen>(edit ? 'wizard' : 'start')
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedName, setSavedName] = useState('')

  // ---------- Bản nháp ----------
  // Ở chế độ sửa, mọi ô được nạp sẵn nội dung hiện có của chủ điểm.
  const [name, setName] = useState(edit?.name ?? '')
  const [nameEn, setNameEn] = useState(edit?.nameEn ?? '')
  const [level, setLevel] = useState<CefrLevel>(edit?.level ?? 'B1')
  const [group, setGroup] = useState<string>(edit?.group || TOPIC_GROUPS[0])
  const [desc, setDesc] = useState(edit?.description ?? '')
  const [icon, setIcon] = useState(edit?.icon ?? 'clock')
  const [tags, setTags] = useState<string[]>(edit?.tags ?? [])
  const [signals, setSignals] = useState<string[]>(edit?.signals ?? [])
  const [signalInput, setSignalInput] = useState('')
  const [formulas, setFormulas] = useState<GrammarFormula[]>(
    edit?.formulas.length ? edit.formulas : edit ? [emptyFormula('Khẳng định')] : [],
  )
  const [uses, setUses] = useState<GrammarUse[]>(
    edit?.uses.length ? edit.uses : edit ? [emptyUse()] : [],
  )
  const [cmpWith, setCmpWith] = useState(edit?.compare?.with ?? '')
  const [cmpRows, setCmpRows] = useState<CmpRow[]>(
    edit?.compare?.rows.length ? edit.compare.rows : edit ? [emptyCmp()] : [],
  )
  const [traps, setTraps] = useState<GrammarTrap[]>(
    edit?.traps.length ? edit.traps : edit ? [emptyTrap()] : [],
  )
  const [pasteText, setPasteText] = useState(() => (edit ? itemsToPasteText(edit.items) : ''))
  const [nameTouched, setNameTouched] = useState(false)
  const [source, setSource] = useState<'paste' | 'file'>('paste')
  const [fileMsg, setFileMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ---------- Nạp Excel ----------
  const xlsxRef = useRef<HTMLInputElement>(null)
  const [xlsxDraft, setXlsxDraft] = useState<TopicDraft | null>(null)
  const [xlsxParsed, setXlsxParsed] = useState<ParsedLine[]>([])
  const [xlsxReports, setXlsxReports] = useState<SheetReport[]>([])
  const [xlsxWarnings, setXlsxWarnings] = useState<string[]>([])
  const [xlsxMsg, setXlsxMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const parsed = useMemo(() => parseAll(pasteText), [pasteText])
  const good = useMemo(() => parsed.filter((p): p is ParsedOk => p.ok), [parsed])
  const badCount = parsed.length - good.length
  const kinds = useMemo(() => new Set(good.map((g) => g.kind)), [good])

  const draft = (): TopicDraft => ({
    name,
    nameEn,
    level,
    group,
    description: desc,
    icon,
    tags,
    signals,
    formulas,
    uses,
    traps,
    compare:
      cmpRows.filter((r) => r.key || r.other || r.self).length > 0
        ? { with: cmpWith || 'Chủ điểm dễ nhầm', rows: cmpRows.filter((r) => r.key || r.other || r.self) }
        : null,
    items: good.map((g, i) => toItem(g, i, tags[0])),
  })

  // ---------- Mở wizard ----------
  const openBlank = () => {
    setName('')
    setNameEn('')
    setLevel('B1')
    setGroup(TOPIC_GROUPS[0])
    setDesc('')
    setIcon('clock')
    setTags([])
    setSignals([])
    setFormulas([emptyFormula('Khẳng định'), emptyFormula('Phủ định'), emptyFormula('Nghi vấn')])
    setUses([emptyUse(), emptyUse()])
    setCmpWith('')
    setCmpRows([emptyCmp()])
    setTraps([emptyTrap()])
    setPasteText('')
    setNameTouched(false)
    setStep(1)
    setScreen('wizard')
  }

  const openTemplate = (t: TopicTemplate) => {
    setName(t.name)
    setNameEn(t.nameEn)
    setLevel(t.level)
    setGroup(t.group)
    setDesc(t.description)
    setIcon(t.icon)
    setTags(t.tags)
    setSignals([])
    setFormulas([emptyFormula('Khẳng định')])
    setUses(t.uses.map(([n, sample, note]) => ({ name: n, sample, note })))
    setCmpWith(t.compare?.with ?? '')
    setCmpRows(t.compare ? t.compare.rows.map(([k, o, s]) => ({ key: k, other: o, self: s })) : [emptyCmp()])
    setTraps([emptyTrap()])
    setPasteText(t.paste)
    setNameTouched(false)
    setStep(1)
    setScreen('wizard')
  }

  const openFromXlsx = () => {
    if (!xlsxDraft) return
    setName(xlsxDraft.name)
    setNameEn(xlsxDraft.nameEn)
    setLevel(xlsxDraft.level)
    setGroup(xlsxDraft.group || TOPIC_GROUPS[0])
    setDesc(xlsxDraft.description)
    setIcon(xlsxDraft.icon)
    setTags(xlsxDraft.tags)
    setSignals(xlsxDraft.signals)
    setFormulas(xlsxDraft.formulas.length ? xlsxDraft.formulas : [emptyFormula('Khẳng định')])
    setUses(xlsxDraft.uses.length ? xlsxDraft.uses : [emptyUse()])
    setCmpWith(xlsxDraft.compare?.with ?? '')
    setCmpRows(xlsxDraft.compare ? xlsxDraft.compare.rows : [emptyCmp()])
    setTraps(xlsxDraft.traps.length ? xlsxDraft.traps : [emptyTrap()])
    setPasteText(xlsxParsed.map((p) => p.raw).join('\n'))
    setNameTouched(false)
    setStep(1)
    setScreen('wizard')
  }

  // ---------- Lưu ----------
  const save = async (d: TopicDraft) => {
    if (!d.name.trim()) {
      setNameTouched(true)
      setStep(1)
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (edit) {
        await saveTopicEdit(edit, d)
        setSavedName(d.name)
        setScreen('done')
        onSaved(edit.key, d.name)
        return
      }
      const id = await createTopic(d)
      setSavedName(d.name)
      setScreen('done')
      onSaved(id, d.name)
    } catch (e) {
      setError(errText(e))
    } finally {
      setSaving(false)
    }
  }

  // ---------- Đọc file ----------
  const readCsv = async (file: File) => {
    try {
      const text = await file.text()
      const converted = csvToPasteText(text)
      if (!converted) {
        setFileMsg('❌ Không tìm thấy câu nào trong file.')
        return
      }
      setPasteText((prev) => (prev ? `${prev}\n${converted}` : converted))
      setFileMsg(`✅ Đã đọc ${converted.split('\n').length} dòng từ ${file.name}.`)
    } catch {
      setFileMsg('❌ Không đọc được file. Hãy dùng .csv hoặc .txt.')
    }
  }

  const readXlsx = async (file: File) => {
    setXlsxMsg('')
    try {
      const buf = await file.arrayBuffer()
      const res = readTopicWorkbook(buf)
      setXlsxDraft(res.draft)
      setXlsxParsed(res.parsed)
      setXlsxReports(res.reports)
      setXlsxWarnings(res.warnings)
      if (!res.draft.name) setXlsxMsg('⚠️ Thiếu “Tên chủ điểm” ở sheet ThongTin — chưa lưu được.')
    } catch (e) {
      setXlsxMsg('❌ Không đọc được sổ tính: ' + errText(e))
    }
  }

  const onDrop = (e: DragEvent, kind: 'csv' | 'xlsx') => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (kind === 'csv') readCsv(file)
    else readXlsx(file)
  }

  // ============================================================
  // 0 · CHỌN CÁCH BẮT ĐẦU
  // ============================================================
  if (screen === 'start') {
    return (
      <div className="page gr-page">
        <button className="gr-crumb" onClick={onCancel}>
          <Icon name="left" /> Ngữ pháp
        </button>
        <div className="gr-head">
          <div>
            <h1>Thêm chủ điểm ngữ pháp</h1>
            <p>
              Một chủ điểm gồm phần lý thuyết (công thức, từ tín hiệu, bẫy với người Việt) và bộ câu
              luyện tập. Bạn có thể soạn từ đầu, hoặc chép một chủ điểm chuẩn rồi sửa lại.
            </p>
          </div>
        </div>

        <div className="gr-start-grid">
          <button className="gr-start-card" onClick={openBlank}>
            <span className="gr-start-mark">
              <Icon name="pencil" />
            </span>
            <b>Tạo mới từ đầu</b>
            <p>
              Tự đặt tên, chọn cấp độ, soạn công thức và bẫy thường gặp. Câu luyện tập nhập bằng cách
              dán hàng loạt hoặc tải file lên.
            </p>
            <span className="gr-start-go">
              Bắt đầu soạn <Icon name="right" />
            </span>
          </button>

          <button className="gr-start-card" onClick={() => setScreen('templates')}>
            <span className="gr-start-mark">
              <Icon name="layers" />
            </span>
            <b>Chép từ thư viện mẫu</b>
            <p>
              {TOPIC_TEMPLATES.length} chủ điểm chuẩn CEFR đã kèm sẵn trường hợp dùng, bảng đối chiếu
              và câu luyện. Chép về rồi sửa lại theo ý mình.
            </p>
            <span className="gr-start-go">
              Xem thư viện mẫu <Icon name="right" />
            </span>
          </button>

          <button className="gr-start-card" onClick={() => setScreen('xlsx')}>
            <span className="gr-start-mark">
              <Icon name="upload" />
            </span>
            <b>Nạp từ Excel</b>
            <p>
              Soạn sẵn cả chủ điểm trong một sổ tính 6 sheet rồi nạp lên — đọc xong lưu thẳng, không
              phải đi qua 4 bước.
            </p>
            <span className="gr-start-go">
              Chọn file .xlsx <Icon name="right" />
            </span>
          </button>
        </div>

        <div className="gr-panel" style={{ marginTop: 14 }}>
          <b>
            <Icon name="bulb" /> Nên bắt đầu từ đâu
          </b>
          <p>
            Nếu bạn đang ôn thi và muốn bám sát giáo trình riêng thì chọn <b>tạo mới</b>. Nếu chỉ muốn
            lấp chỗ trống trong lộ trình A1–C1 thì <b>chép từ mẫu</b> nhanh hơn nhiều — chép xong vẫn
            sửa được mọi phần.
          </p>
        </div>
      </div>
    )
  }

  // ============================================================
  // T · THƯ VIỆN MẪU
  // ============================================================
  if (screen === 'templates') {
    const available = TOPIC_TEMPLATES.filter(
      (t) => !existingNames.some((n) => n.trim().toLowerCase() === t.name.toLowerCase()),
    )
    return (
      <div className="page gr-page">
        <div className="gr-head">
          <div>
            <h1>Thư viện chủ điểm mẫu</h1>
            <p>
              {available.length} chủ điểm chuẩn CEFR chưa có trong thư viện của bạn. Chép về là có ngay
              trường hợp dùng, bảng đối chiếu và câu luyện.
            </p>
          </div>
          <div className="gr-head-actions">
            <button className="gr-btn" onClick={() => setScreen('start')}>
              <Icon name="left" /> Quay lại
            </button>
          </div>
        </div>

        {available.length === 0 ? (
          <div className="gr-empty">
            <Icon name="check" />
            <b>Bạn đã chép hết thư viện mẫu</b>
            <p>Quay lại và tự soạn một chủ điểm mới, hoặc nạp một sổ tính Excel của riêng bạn.</p>
          </div>
        ) : (
          <section className="gr-grid">
            {available.map((t) => (
              <div
                key={t.name}
                className="gr-topic"
                role="button"
                tabIndex={0}
                onClick={() => openTemplate(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openTemplate(t)
                  }
                }}
              >
                <span className="gr-topic-top">
                  <span className="gr-mark">
                    <Icon name={topicIcon(t.icon)} />
                  </span>
                  <span className="gr-topic-txt">
                    <span className="gr-topic-name">{t.name}</span>
                    <span className="gr-topic-tags">
                      <span className="gr-lv">{t.level}</span>
                      {t.tags.length > 0 && (
                        <span className="gr-badge gr-badge-err gr-badge-dot">Bẫy người Việt</span>
                      )}
                    </span>
                  </span>
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.55 }}>
                  {t.description}
                </span>
                <span className="gr-topic-foot">
                  <span>
                    {t.uses.length} trường hợp · {parseAll(t.paste).filter((p) => p.ok).length} câu
                  </span>
                  <span className="gr-start-go">
                    Chép về <Icon name="right" />
                  </span>
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    )
  }

  // ============================================================
  // X · NẠP EXCEL
  // ============================================================
  if (screen === 'xlsx') {
    const xGood = xlsxParsed.filter((p) => p.ok).length
    const xBad = xlsxParsed.length - xGood
    return (
      <div className="page gr-page">
        <div className="gr-head">
          <div>
            <h1>Nạp chủ điểm từ Excel</h1>
            <p>
              Một sổ tính = một chủ điểm. App đọc file ngay trên máy bạn, không gửi đi đâu. Thiếu sheet
              nào thì phần đó để trống, không chặn nạp.
            </p>
          </div>
          <div className="gr-head-actions">
            <button className="gr-btn" onClick={() => setScreen('start')}>
              <Icon name="left" /> Quay lại
            </button>
          </div>
        </div>

        <div className="gr-card" style={{ marginBottom: 14 }}>
          <div className="gr-card-head">
            <h2>
              <Icon name="grid" /> Sổ tính cần những sheet nào
            </h2>
            <span className="gr-hint">Tên sheet không phân biệt hoa thường và dấu</span>
          </div>
          <table className="gr-syn">
            <thead>
              <tr>
                <th>Sheet</th>
                <th>Các cột theo thứ tự</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="gr-code">ThongTin</span>
                </td>
                <td>
                  <span className="gr-ex">
                    Nhãn · Giá trị — Tên chủ điểm · Tên tiếng Anh · Cấp độ · Nhóm · Mô tả · Icon ·
                    Nhóm lỗi · Từ tín hiệu · Chủ điểm dễ nhầm
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="gr-code">CongThuc</span>
                </td>
                <td>
                  <span className="gr-ex">Dạng · Cấu trúc · Ví dụ</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="gr-code">CachDung</span>
                </td>
                <td>
                  <span className="gr-ex">Trường hợp · Câu ví dụ · Giải thích</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="gr-code">DoiChieu</span>
                </td>
                <td>
                  <span className="gr-ex">Tiêu chí · Chủ điểm kia · Chủ điểm này</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="gr-code">Bay</span>
                </td>
                <td>
                  <span className="gr-ex">Câu sai · Câu đúng · Vì sao</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="gr-code">CauLuyen</span>
                </td>
                <td>
                  <span className="gr-ex">Câu · Giải thích — cột “Câu” dùng cú pháp {'{ }'} · [sai &gt; đúng] · &gt;&gt;</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <input
          ref={xlsxRef}
          type="file"
          accept=".xlsx"
          hidden
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) readXlsx(f)
          }}
        />
        <div
          className={dragOver ? 'gr-drop is-over' : 'gr-drop'}
          role="button"
          tabIndex={0}
          onClick={() => xlsxRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && xlsxRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => onDrop(e, 'xlsx')}
        >
          <Icon name="upload" />
          <b>Kéo sổ tính vào đây, hoặc bấm để chọn</b>
          <span>Nhận .xlsx — đọc trực tiếp trên máy, không gửi đi đâu</span>
        </div>
        <div className="gr-row" style={{ marginTop: 12 }}>
          <button className="gr-btn gr-btn-sm" onClick={downloadSampleWorkbook}>
            <Icon name="download" /> Tải sổ tính mẫu (.xlsx)
          </button>
          <span className="gr-foot-note">
            File mẫu đã điền sẵn một chủ điểm hoàn chỉnh để bạn sửa lại
          </span>
        </div>
        {xlsxMsg && <p className="gr-field-hint" style={{ marginTop: 10 }}>{xlsxMsg}</p>}

        {xlsxDraft && (
          <>
            <div className="gr-prev-grid" style={{ margin: '18px 0 14px' }}>
              <div className="gr-card">
                <div className="gr-card-head">
                  <h2>
                    <Icon name="eye" /> Chủ điểm đọc được
                  </h2>
                </div>
                <div className="gr-card-body">
                  <DraftCard draft={xlsxDraft} itemCount={xGood} />
                </div>
              </div>
              <div className="gr-card">
                <div className="gr-card-head">
                  <h2>
                    <Icon name="check" /> Từng sheet đọc ra gì
                  </h2>
                </div>
                {xlsxReports.map((r) => (
                  <div className={r.sheet ? 'gr-chk is-ok' : 'gr-chk is-warn'} key={r.label}>
                    <Icon name={r.sheet ? 'check' : 'alert'} />
                    <div>
                      <b>
                        {r.label} — {r.sheet ? `sheet “${r.sheet}” · ${r.rows} dòng` : 'không tìm thấy'}
                      </b>
                      <span>{r.note}</span>
                    </div>
                  </div>
                ))}
                {xlsxWarnings.map((w, i) => (
                  <div className="gr-chk is-warn" key={i}>
                    <Icon name="alert" />
                    <div>
                      <b>{w}</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="gr-card">
              <div className="gr-rev-bar">
                <span className="gr-badge gr-badge-ok">
                  <Icon name="check" /> {xGood} câu hợp lệ
                </span>
                {xBad > 0 && (
                  <span className="gr-badge gr-badge-err">
                    <Icon name="alert" /> {xBad} dòng lỗi
                  </span>
                )}
                <span className="gr-spacer" />
                <span className="gr-foot-note">
                  {[...new Set(xlsxParsed.filter((p) => p.ok).map((p) => (p as ParsedOk).kind))]
                    .map((k) => KIND_LABEL[k])
                    .join(' · ') || '—'}
                </span>
              </div>
              <ReviewList lines={xlsxParsed} />
            </div>

            {error && <p className="gr-err-msg" style={{ marginTop: 10 }}>{error}</p>}

            <div className="gr-wiz-foot">
              <button className="gr-btn" onClick={() => xlsxRef.current?.click()}>
                <Icon name="upload" /> Chọn file khác
              </button>
              <span className="gr-spacer" />
              <button className="gr-btn" onClick={openFromXlsx}>
                <Icon name="pencil" /> Mở trong trình soạn để sửa
              </button>
              <button
                className="gr-btn gr-btn-primary gr-btn-lg"
                disabled={!xlsxDraft.name || saving}
                onClick={() => save(xlsxDraft)}
              >
                <Icon name="save" /> {saving ? 'Đang lưu…' : 'Lưu chủ điểm'}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ============================================================
  // XONG
  // ============================================================
  if (screen === 'done') {
    return (
      <div className="page gr-page">
        <div className="gr-empty" style={{ padding: '56px 24px' }}>
          <Icon name="check" />
          <b>
            {edit ? 'Đã lưu thay đổi cho' : 'Đã thêm'} “{savedName}”
          </b>
          <p>
            {edit
              ? edit.builtin
                ? 'Từ giờ thư viện hiện bản của bạn thay cho bản dựng sẵn. Tiến độ và sổ lỗi cũ được giữ nguyên; muốn quay lại bản gốc thì mở chủ điểm và chọn “Về bản gốc”.'
                : 'Nội dung mới đã được lưu. Tiến độ và lịch ôn của chủ điểm giữ nguyên.'
              : 'Chủ điểm đã nằm trong thư viện, có lịch ôn riêng và sẵn sàng để luyện.'}
          </p>
          <div className="gr-row" style={{ marginTop: 16, justifyContent: 'center' }}>
            <button className="gr-btn gr-btn-primary" onClick={onCancel}>
              <Icon name="grammar" /> Về thư viện
            </button>
            {!edit && (
              <button className="gr-btn" onClick={() => setScreen('start')}>
                <Icon name="plus" /> Thêm chủ điểm khác
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // W · WIZARD 4 BƯỚC
  // ============================================================
  const checks: [boolean, string, string][] = [
    [!!name.trim(), 'Đã có tên chủ điểm', name.trim() || 'Bắt buộc — quay lại bước 1'],
    [
      formulas.filter((f) => f.form || f.structure || f.example).length > 0,
      `${formulas.filter((f) => f.form || f.structure || f.example).length} dòng công thức`,
      'Hiện ở đầu trang bài học',
    ],
    [
      uses.filter((u) => u.name || u.sample).length >= 2,
      `${uses.filter((u) => u.name || u.sample).length} trường hợp dùng`,
      'Nên có ít nhất 2 — biết công thức mà không biết dùng khi nào thì vẫn viết sai',
    ],
    [
      cmpRows.filter((r) => r.key || r.other || r.self).length > 0,
      cmpWith
        ? `Đối chiếu với “${cmpWith}” · ${cmpRows.filter((r) => r.key).length} tiêu chí`
        : 'Chưa có bảng đối chiếu',
      'Không bắt buộc — chỉ cần nếu chủ điểm có cặp dễ nhầm',
    ],
    [
      traps.filter((t) => t.wrong || t.right).length > 0,
      `${traps.filter((t) => t.wrong || t.right).length} bẫy với người Việt`,
      'Phần người học đọc kỹ nhất — đây là giá trị riêng của app',
    ],
    [
      good.length >= 8,
      `${good.length} câu luyện tập`,
      good.length >= 8 ? 'Đủ cho một phiên khoảng 5 phút' : 'Nên có từ 8 câu trở lên',
    ],
    [
      kinds.size >= 3,
      `Dùng ${kinds.size} / 4 dạng bài`,
      kinds.size >= 3
        ? 'Đủ đa dạng để tránh học vẹt đáp án'
        : 'Chỉ một hai dạng thì người học dễ nhớ đáp án thay vì quy tắc',
    ],
    [
      badCount === 0,
      badCount === 0 ? 'Không còn dòng lỗi cú pháp' : `Còn ${badCount} dòng lỗi cú pháp`,
      badCount === 0 ? 'Mọi dòng đều đọc được' : 'Các dòng lỗi sẽ bị bỏ qua khi lưu',
    ],
    [signals.length > 0, `${signals.length} từ tín hiệu`, 'Giúp người học nhận diện nhanh'],
  ]

  const STEP_NAMES = ['Thông tin', 'Nội dung bài học', 'Câu luyện tập', 'Xem trước & lưu']

  return (
    <div className="page gr-page">
      <div className="gr-head">
        <div>
          <h1>
            {edit ? 'Sửa · ' : ''}
            {name.trim() ? name : 'Chủ điểm mới'}
          </h1>
          <p>
            {edit
              ? edit.builtin
                ? 'Chủ điểm dựng sẵn: bản chỉnh sửa được lưu riêng cho tài khoản của bạn và thay chỗ bản gốc trong thư viện. Tiến độ đã học không mất.'
                : 'Bốn bước như khi soạn mới. Lưu xong nội dung cũ sẽ được thay hoàn toàn.'
              : 'Bốn bước. Bạn có thể quay lại sửa bất cứ lúc nào trước khi lưu.'}
          </p>
        </div>
        <div className="gr-head-actions">
          <button
            className="gr-btn gr-btn-ghost"
            onClick={() => (edit ? onCancel() : setScreen('start'))}
          >
            Hủy
          </button>
        </div>
      </div>

      <nav className="gr-steps">
        {STEP_NAMES.map((label, i) => {
          const n = i + 1
          const cls = n === step ? 'gr-stp is-now' : n < step ? 'gr-stp is-done' : 'gr-stp'
          return (
            <span key={label} style={{ display: 'contents' }}>
              <button className={cls} onClick={() => n < step && setStep(n)}>
                <span className="gr-stp-no">{n < step ? <Icon name="check" /> : n}</span>
                <span>{label}</span>
              </button>
              {n < 4 && <span className="gr-stp-line" />}
            </span>
          )
        })}
      </nav>

      {/* ---------------------------------------------- BƯỚC 1 */}
      {step === 1 && (
        <div className="gr-card">
          <div className="gr-card-head">
            <h2>
              <Icon name="file" /> Thông tin chủ điểm
            </h2>
          </div>
          <div className="gr-card-body">
            <div className="gr-fields">
              <div className={`gr-field${nameTouched && !name.trim() ? ' is-bad' : ''}`}>
                <label>
                  Tên chủ điểm <span className="gr-req">*</span>
                </label>
                <input
                  className="gr-input"
                  value={name}
                  placeholder="VD: Thì quá khứ hoàn thành"
                  onChange={(e) => setName(e.target.value)}
                />
                {nameTouched && !name.trim() && (
                  <p className="gr-err-msg">Hãy đặt tên cho chủ điểm.</p>
                )}
              </div>

              <div className="gr-field">
                <label>Tên tiếng Anh</label>
                <input
                  className="gr-input"
                  value={nameEn}
                  placeholder="VD: Past perfect"
                  onChange={(e) => setNameEn(e.target.value)}
                />
                <p className="gr-field-hint">Hiện dưới tên tiếng Việt trong trang bài học.</p>
              </div>

              <div className="gr-field">
                <label>Cấp độ CEFR</label>
                <div className="gr-seg">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      className={level === l ? 'is-active' : ''}
                      onClick={() => setLevel(l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gr-field">
                <label>Nhóm</label>
                <select
                  className="gr-select"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                >
                  {TOPIC_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="gr-field full">
                <label>Mô tả ngắn</label>
                <textarea
                  className="gr-textarea"
                  value={desc}
                  placeholder="Một hai câu nói rõ chủ điểm này dùng khi nào và hay bị nhầm với cái gì."
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <div className="gr-field full">
                <label>Icon</label>
                <div className="gr-icon-pick">
                  {TOPIC_ICONS.map((ic) => (
                    <button
                      key={ic}
                      className={icon === ic ? 'is-active' : ''}
                      title={ic}
                      onClick={() => setIcon(ic)}
                    >
                      <Icon name={topicIcon(ic)} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="gr-field full">
                <label>Nhóm lỗi người Việt liên quan</label>
                <div className="gr-chipset">
                  {ERROR_TAGS.map((t) => (
                    <button
                      key={t}
                      className={tags.includes(t) ? 'gr-chip is-active' : 'gr-chip'}
                      onClick={() =>
                        setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="gr-field-hint">
                  Chọn nhóm nào thì lỗi sinh ra từ chủ điểm này sẽ được gắn nhãn đó trong sổ lỗi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------- BƯỚC 2 */}
      {step === 2 && (
        <>
          <div className="gr-card" style={{ marginBottom: 14 }}>
            <div className="gr-card-head">
              <h2>
                <Icon name="grammar" /> Bảng công thức
              </h2>
              <span className="gr-hint">Hiện ở đầu trang bài học</span>
            </div>
            <div className="gr-card-body">
              <div className="gr-rowset-head">
                <span>Dạng</span>
                <span>Cấu trúc</span>
                <span>Ví dụ</span>
                <span />
              </div>
              <div className="gr-rowset">
                {formulas.map((f, i) => (
                  <div className="gr-rs-row" key={i}>
                    <input
                      className="gr-input"
                      value={f.form}
                      placeholder="Khẳng định"
                      onChange={(e) =>
                        setFormulas((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, form: e.target.value } : r)),
                        )
                      }
                    />
                    <input
                      className="gr-input"
                      value={f.structure}
                      placeholder="S + **have/has** + V3"
                      onChange={(e) =>
                        setFormulas((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, structure: e.target.value } : r)),
                        )
                      }
                    />
                    <input
                      className="gr-input"
                      value={f.example}
                      placeholder="She {has lived} here."
                      onChange={(e) =>
                        setFormulas((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, example: e.target.value } : r)),
                        )
                      }
                    />
                    <button
                      className="gr-ibtn danger"
                      title="Xóa dòng"
                      onClick={() => setFormulas((rows) => rows.filter((_, j) => j !== i))}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="gr-btn gr-btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => setFormulas((r) => [...r, emptyFormula()])}
              >
                <Icon name="plus" /> Thêm dòng
              </button>
            </div>
          </div>

          <div className="gr-card" style={{ marginBottom: 14 }}>
            <div className="gr-card-head">
              <h2>
                <Icon name="bulb" /> Các trường hợp dùng
              </h2>
              <span className="gr-hint">Hiện thành lưới thẻ giữa trang bài học</span>
            </div>
            <div className="gr-card-body">
              <div className="gr-rowset">
                {uses.map((u, i) => (
                  <div className="gr-rs-row" key={i}>
                    <input
                      className="gr-input"
                      value={u.name}
                      placeholder="Kinh nghiệm trong đời"
                      onChange={(e) =>
                        setUses((rows) => rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                      }
                    />
                    <input
                      className="gr-input"
                      value={u.sample}
                      placeholder="I {have visited} Japan twice."
                      onChange={(e) =>
                        setUses((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, sample: e.target.value } : r)),
                        )
                      }
                    />
                    <input
                      className="gr-input"
                      value={u.note}
                      placeholder="Giải thích ngắn bằng tiếng Việt"
                      onChange={(e) =>
                        setUses((rows) => rows.map((r, j) => (j === i ? { ...r, note: e.target.value } : r)))
                      }
                    />
                    <button
                      className="gr-ibtn danger"
                      title="Xóa trường hợp"
                      onClick={() => setUses((rows) => rows.filter((_, j) => j !== i))}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="gr-btn gr-btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => setUses((r) => [...r, emptyUse()])}
              >
                <Icon name="plus" /> Thêm trường hợp
              </button>
              <p className="gr-field-hint" style={{ marginTop: 9 }}>
                Bọc phần cần tô đậm trong câu ví dụ bằng <b>{'{ }'}</b> — giống cú pháp ở bước 3.
              </p>
            </div>
          </div>

          <div className="gr-card" style={{ marginBottom: 14 }}>
            <div className="gr-card-head">
              <h2>
                <Icon name="search" /> Từ tín hiệu
              </h2>
              <span className="gr-hint">Gõ rồi bấm Enter</span>
            </div>
            <div className="gr-card-body">
              <input
                className="gr-input"
                value={signalInput}
                placeholder="already, yet, since… — gõ một hoặc nhiều từ rồi Enter"
                onChange={(e) => setSignalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  const added = signalInput
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                  if (added.length === 0) return
                  setSignals((prev) => [...new Set([...prev, ...added])])
                  setSignalInput('')
                }}
              />
              <div className="gr-chips">
                {signals.map((s) => (
                  <button
                    key={s}
                    className="gr-chip-x"
                    onClick={() => setSignals((prev) => prev.filter((x) => x !== s))}
                  >
                    {s} <Icon name="x" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="gr-card" style={{ marginBottom: 14 }}>
            <div className="gr-card-head">
              <h2>
                <Icon name="shuffle" /> Đối chiếu với chủ điểm dễ nhầm
              </h2>
              <span className="gr-hint">Bảng 2 cột ở cuối bài học</span>
            </div>
            <div className="gr-card-body">
              <div className="gr-field" style={{ maxWidth: 340, marginBottom: 12 }}>
                <label>Chủ điểm hay bị nhầm với chủ điểm này</label>
                <input
                  className="gr-input"
                  value={cmpWith}
                  placeholder="VD: Quá khứ đơn"
                  onChange={(e) => setCmpWith(e.target.value)}
                />
              </div>
              <div className="gr-rowset-head">
                <span>Tiêu chí</span>
                <span>{cmpWith || 'Chủ điểm kia'}</span>
                <span>{name || 'Chủ điểm này'}</span>
                <span />
              </div>
              <div className="gr-rowset">
                {cmpRows.map((r, i) => (
                  <div className="gr-rs-row" key={i}>
                    <input
                      className="gr-input"
                      value={r.key}
                      placeholder="Thời điểm"
                      onChange={(e) =>
                        setCmpRows((rows) => rows.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                      }
                    />
                    <input
                      className="gr-input"
                      value={r.other}
                      onChange={(e) =>
                        setCmpRows((rows) =>
                          rows.map((x, j) => (j === i ? { ...x, other: e.target.value } : x)),
                        )
                      }
                    />
                    <input
                      className="gr-input"
                      value={r.self}
                      onChange={(e) =>
                        setCmpRows((rows) => rows.map((x, j) => (j === i ? { ...x, self: e.target.value } : x)))
                      }
                    />
                    <button
                      className="gr-ibtn danger"
                      title="Xóa tiêu chí"
                      onClick={() => setCmpRows((rows) => rows.filter((_, j) => j !== i))}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="gr-btn gr-btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => setCmpRows((r) => [...r, emptyCmp()])}
              >
                <Icon name="plus" /> Thêm tiêu chí
              </button>
            </div>
          </div>

          <div className="gr-card">
            <div className="gr-card-head">
              <h2>
                <Icon name="lang" /> Bẫy với người Việt
              </h2>
              <span className="gr-hint">Phần có giá trị nhất của bài học</span>
            </div>
            <div className="gr-card-body">
              <div className="gr-rowset">
                {traps.map((t, i) => (
                  <div className="gr-rs-row" key={i}>
                    <input
                      className="gr-input"
                      value={t.wrong}
                      placeholder="Câu sai — bọc phần sai trong { }"
                      onChange={(e) =>
                        setTraps((rows) => rows.map((x, j) => (j === i ? { ...x, wrong: e.target.value } : x)))
                      }
                    />
                    <input
                      className="gr-input"
                      value={t.right}
                      placeholder="Câu đúng — bọc phần đúng trong { }"
                      onChange={(e) =>
                        setTraps((rows) => rows.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)))
                      }
                    />
                    <input
                      className="gr-input"
                      value={t.why}
                      placeholder="Vì sao người Việt hay sai chỗ này"
                      onChange={(e) =>
                        setTraps((rows) => rows.map((x, j) => (j === i ? { ...x, why: e.target.value } : x)))
                      }
                    />
                    <button
                      className="gr-ibtn danger"
                      title="Xóa bẫy"
                      onClick={() => setTraps((rows) => rows.filter((_, j) => j !== i))}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="gr-btn gr-btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => setTraps((r) => [...r, emptyTrap()])}
              >
                <Icon name="plus" /> Thêm bẫy
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------- BƯỚC 3 */}
      {step === 3 && (
        <>
          <nav className="gr-tabs">
            <button className={source === 'paste' ? 'is-active' : ''} onClick={() => setSource('paste')}>
              <Icon name="pencil" /> Dán hàng loạt
            </button>
            <button className={source === 'file' ? 'is-active' : ''} onClick={() => setSource('file')}>
              <Icon name="upload" /> Nhập từ file
            </button>
          </nav>

          {source === 'paste' ? (
            <>
              <div className="gr-card" style={{ marginBottom: 14 }}>
                <div className="gr-card-head">
                  <h2>
                    <Icon name="grid" /> Cú pháp — mỗi dòng một câu
                  </h2>
                  <span className="gr-hint">Dạng bài được nhận diện tự động</span>
                </div>
                <table className="gr-syn">
                  <thead>
                    <tr>
                      <th>Dạng bài</th>
                      <th>Đánh dấu</th>
                      <th>Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Điền vào chỗ trống</td>
                      <td>
                        <span className="gr-code">{'{đáp án}'}</span>
                      </td>
                      <td>
                        <span className="gr-ex">She {'{has lived}'} in Hue for six years. (live)</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Trắc nghiệm</td>
                      <td>
                        <span className="gr-code">{'{đúng | sai | sai}'}</span>
                      </td>
                      <td>
                        <span className="gr-ex">He has worked here {'{for | since | from}'} five years.</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Sửa lỗi sai</td>
                      <td>
                        <span className="gr-code">[sai &gt; đúng]</span>
                      </td>
                      <td>
                        <span className="gr-ex">My sister is [teacher &gt; a teacher] at school.</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Viết lại câu</td>
                      <td>
                        <span className="gr-code">gốc &gt;&gt; đích</span>
                      </td>
                      <td>
                        <span className="gr-ex">They built it in 1990. &gt;&gt; It was built in 1990.</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="gr-card-body" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="gr-field-hint">
                    Thêm <span className="gr-code">(gợi ý)</span> ở cuối câu điền để hiện từ gốc cần chia ·
                    thêm <span className="gr-code">// giải thích</span> ở cuối bất kỳ dòng nào để viết
                    phần “Vì sao” · dòng bắt đầu bằng <span className="gr-code">#</span> là ghi chú.
                  </p>
                </div>
              </div>

              <div className="gr-field">
                <label>Dán câu luyện tập vào đây</label>
                <textarea
                  className="gr-paste"
                  value={pasteText}
                  spellCheck={false}
                  placeholder={'# Mỗi dòng một câu\nShe {has lived} in Da Nang for six years. (live)'}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div className="gr-row" style={{ marginTop: 9 }}>
                  <button className="gr-btn gr-btn-sm" onClick={() => setPasteText(SAMPLE_PASTE)}>
                    <Icon name="sparkle" /> Chèn ví dụ mẫu
                  </button>
                  <button className="gr-btn gr-btn-sm" onClick={() => setPasteText('')}>
                    <Icon name="trash" /> Xóa hết
                  </button>
                  <span className="gr-spacer" />
                  <span className="gr-foot-note">Bảng duyệt bên dưới cập nhật ngay khi bạn gõ</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) readCsv(f)
                }}
              />
              <div
                className={dragOver ? 'gr-drop is-over' : 'gr-drop'}
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => onDrop(e, 'csv')}
              >
                <Icon name="upload" />
                <b>Kéo file vào đây, hoặc bấm để chọn</b>
                <span>
                  Nhận .csv và .txt · cột <b>cau</b> bắt buộc, cột <b>giai_thich</b> tùy chọn
                </span>
              </div>
              <div className="gr-row" style={{ marginTop: 12 }}>
                <button className="gr-btn gr-btn-sm" onClick={downloadSampleCsv}>
                  <Icon name="download" /> Tải file mẫu (.csv)
                </button>
                <span className="gr-foot-note">
                  Nội dung cột <b>cau</b> dùng đúng cú pháp ở tab “Dán hàng loạt”
                </span>
              </div>
              {fileMsg && <p className="gr-field-hint" style={{ marginTop: 10 }}>{fileMsg}</p>}
            </>
          )}

          <div className="gr-card" style={{ marginTop: 16 }}>
            <div className="gr-rev-bar">
              <span className="gr-badge gr-badge-ok">
                <Icon name="check" /> {good.length} câu hợp lệ
              </span>
              {badCount > 0 && (
                <span className="gr-badge gr-badge-err">
                  <Icon name="alert" /> {badCount} dòng lỗi
                </span>
              )}
              <span className="gr-spacer" />
              <span className="gr-foot-note">
                {[...kinds].map((k) => KIND_LABEL[k]).join(' · ') || '—'}
              </span>
            </div>
            <ReviewList lines={parsed} />
          </div>
        </>
      )}

      {/* ---------------------------------------------- BƯỚC 4 */}
      {step === 4 && (
        <div className="gr-prev-grid">
          <div className="gr-stack">
            <div className="gr-card">
              <div className="gr-card-head">
                <h2>
                  <Icon name="eye" /> Thẻ trong thư viện
                </h2>
              </div>
              <div className="gr-card-body">
                <DraftCard draft={draft()} itemCount={good.length} />
              </div>
            </div>
            <div className="gr-card">
              <div className="gr-card-head">
                <h2>
                  <Icon name="play" /> Một câu luyện tập
                </h2>
              </div>
              <div className="gr-card-body">
                {good[0] ? (
                  <>
                    <span className="gr-badge gr-badge-accent">{KIND_LABEL[good[0].kind]}</span>
                    <p style={{ fontSize: 15, lineHeight: 1.7, marginTop: 9 }}>
                      {good[0].display.before}
                      <mark
                        style={{
                          background: 'var(--primary-tint)',
                          color: 'var(--primary)',
                          padding: '0 4px',
                          borderRadius: 4,
                        }}
                      >
                        {good[0].display.highlight}
                      </mark>
                      {good[0].display.after}
                    </p>
                    {good[0].why && <p className="gr-field-hint">Vì sao: {good[0].why}</p>}
                  </>
                ) : (
                  <p className="gr-field-hint">Chưa có câu luyện tập nào — quay lại bước 3 để thêm.</p>
                )}
              </div>
            </div>
          </div>

          <div className="gr-card">
            <div className="gr-card-head">
              <h2>
                <Icon name="check" /> Kiểm tra trước khi lưu
              </h2>
              <span className="gr-hint">Cảnh báo không chặn lưu</span>
            </div>
            {checks.map(([ok, title, note], i) => (
              <div className={ok ? 'gr-chk is-ok' : 'gr-chk is-warn'} key={i}>
                <Icon name={ok ? 'check' : 'alert'} />
                <div>
                  <b>{title}</b>
                  <span>{note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="gr-err-msg" style={{ marginTop: 12 }}>{error}</p>}

      <div className="gr-wiz-foot">
        {step > 1 && (
          <button className="gr-btn" onClick={() => setStep((s) => s - 1)}>
            <Icon name="left" /> Quay lại
          </button>
        )}
        <span className="gr-spacer" />
        <span className="gr-foot-note">Bước {step} / 4</span>
        <button
          className="gr-btn gr-btn-primary gr-btn-lg"
          disabled={saving}
          onClick={() => {
            if (step === 1 && !name.trim()) {
              setNameTouched(true)
              return
            }
            if (step === 4) {
              save(draft())
              return
            }
            setStep((s) => s + 1)
          }}
        >
          {step === 4 ? (
            <>
              <Icon name="save" />{' '}
              {saving ? 'Đang lưu…' : edit ? 'Lưu thay đổi' : 'Lưu chủ điểm'}
            </>
          ) : (
            <>
              Tiếp tục <Icon name="right" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ---------- Bảng duyệt câu ----------
function ReviewList({ lines }: { lines: ParsedLine[] }) {
  if (lines.length === 0) {
    return (
      <div className="gr-card-body">
        <p className="gr-field-hint">Chưa có dòng nào — dán câu vào ô ở trên hoặc tải file lên.</p>
      </div>
    )
  }
  return (
    <>
      {lines.map((l) => (
        <div className={l.ok ? 'gr-rev-row' : 'gr-rev-row is-bad'} key={l.no}>
          <span className="gr-rev-no">{l.no}</span>
          {l.ok ? (
            <span className="gr-rev-main">
              {l.display.before}
              <mark>{l.display.highlight}</mark>
              {l.display.after}
              {l.display.note && <span className="gr-rev-note">({l.display.note})</span>}
              {l.why && <span className="gr-rev-note">Vì sao: {l.why}</span>}
            </span>
          ) : (
            <span className="gr-rev-main">
              {l.raw}
              <span className="gr-rev-err">{l.msg}</span>
            </span>
          )}
          <span className="gr-badge">{l.ok ? KIND_LABEL[l.kind] : 'Lỗi'}</span>
        </div>
      ))}
    </>
  )
}

// ---------- Thẻ xem trước ----------
function DraftCard({ draft, itemCount }: { draft: TopicDraft; itemCount: number }) {
  return (
    <div className="gr-topic" style={{ cursor: 'default' }}>
      <span className="gr-topic-top">
        <span className="gr-mark">
          <Icon name={topicIcon(draft.icon)} />
        </span>
        <span className="gr-topic-txt">
          <span className="gr-topic-name">{draft.name || 'Chủ điểm mới'}</span>
          <span className="gr-topic-tags">
            <span className="gr-lv">{draft.level}</span>
            {draft.tags.length > 0 && (
              <span className="gr-badge gr-badge-err gr-badge-dot">Bẫy người Việt</span>
            )}
          </span>
        </span>
      </span>
      <span className="gr-bar">
        <i style={{ width: '0%' }} />
      </span>
      <span className="gr-topic-foot">
        <span>
          {draft.formulas.length} quy tắc · {itemCount} câu
        </span>
        <span>Chưa bắt đầu</span>
      </span>
    </div>
  )
}
