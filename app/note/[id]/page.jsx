'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '../../../components/Sidebar'
import MarkdownView from '../../../components/MarkdownView'
import { loadNotes, saveNotes, loadFolders, loadTrash } from '../../../lib/notes'
import styles from './page.module.css'

const BLOCK_COMMANDS = [
  { label: '제목 1', icon: 'H1', syntax: '# ', desc: '큰 제목', cursorOffset: 2 },
  { label: '제목 2', icon: 'H2', syntax: '## ', desc: '중간 제목', cursorOffset: 3 },
  { label: '제목 3', icon: 'H3', syntax: '### ', desc: '작은 제목', cursorOffset: 4 },
  { label: '굵게', icon: 'B', syntax: '****', desc: '굵은 텍스트', cursorOffset: 2 },
  { label: '기울임', icon: 'I', syntax: '**', desc: '이탤릭체', cursorOffset: 1 },
  { label: '목록', icon: '•', syntax: '- ', desc: '글머리 기호', cursorOffset: 2 },
  { label: '번호 목록', icon: '1.', syntax: '1. ', desc: '번호 목록', cursorOffset: 3 },
  { label: '인용', icon: '"', syntax: '> ', desc: '인용문', cursorOffset: 2 },
  { label: '코드', icon: '<>', syntax: '``', desc: '인라인 코드', cursorOffset: 1 },
  { label: '코드 블록', icon: '```', syntax: '```\n\n```', desc: '코드 블록', cursorOffset: 4 },
  { label: '구분선', icon: '—', syntax: '---', desc: '수평선', cursorOffset: 3 },
  { label: '체크박스', icon: '☐', syntax: '- [ ] ', desc: '할 일 목록', cursorOffset: 6 },
]

export default function NotePage() {
  const router = useRouter()
  const { id } = useParams()
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [trash, setTrash] = useState([])
  const [note, setNote] = useState(null)
  const [saveStatus, setSaveStatus] = useState('저장됨')
  const [preview, setPreview] = useState(false)
  const [slashMenu, setSlashMenu] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)
  const slashPos = useRef(null) // 슬래시 입력 위치

  useEffect(() => {
    const all = loadNotes()
    const allFolders = loadFolders()
    const allTrash = loadTrash()
    setNotes(all); setFolders(allFolders); setTrash(allTrash)
    const found = all.find(n => String(n.id) === String(id))
    if (found) {
      setNote({ ...found })
      // 내용 없으면 편집 모드, 있으면 미리보기
      setPreview(!!(found.body?.trim()))
    }
    else router.push('/')
  }, [id])

  const handleChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }))
    setSaveStatus('저장 중...')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setNotes(prev => {
        const updated = prev.map(n =>
          String(n.id) === String(id) ? { ...n, [field]: value } : n
        )
        saveNotes(updated)
        return updated
      })
      setSaveStatus('저장됨')
    }, 800)
  }

  const handleBodyKeyDown = (e) => {
    if (slashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex(i => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        insertBlock(filtered[slashIndex])
        return
      }
      if (e.key === 'Escape') {
        setSlashMenu(false)
        return
      }
    }
  }

  const handleBodyInput = (e) => {
    const val = e.target.value
    handleChange('body', val)

    const cursor = e.target.selectionStart
    const textBeforeCursor = val.slice(0, cursor)
    const lastSlash = textBeforeCursor.lastIndexOf('/')

    if (lastSlash !== -1 && (lastSlash === 0 || textBeforeCursor[lastSlash - 1] === '\n')) {
      const query = textBeforeCursor.slice(lastSlash + 1)
      if (!query.includes(' ') && !query.includes('\n')) {
        setSlashFilter(query)
        setSlashMenu(true)
        setSlashIndex(0)
        slashPos.current = lastSlash
        return
      }
    }
    setSlashMenu(false)
  }

  const insertBlock = (cmd) => {
    if (!cmd || !textareaRef.current) return
    const textarea = textareaRef.current
    const val = note.body
    const slashStart = slashPos.current
    const cursor = textarea.selectionStart
    const before = val.slice(0, slashStart)
    const after = val.slice(cursor)
    const newVal = before + cmd.syntax + after
    handleChange('body', newVal)
    setSlashMenu(false)
    setSlashFilter('')
    // 커서를 syntax 안쪽으로 (cursorOffset 위치)
    setTimeout(() => {
      const newCursor = slashStart + (cmd.cursorOffset ?? cmd.syntax.length)
      textarea.setSelectionRange(newCursor, newCursor)
      textarea.focus()
    }, 0)
  }

  const filtered = BLOCK_COMMANDS.filter(c =>
    c.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    c.icon.toLowerCase().includes(slashFilter.toLowerCase())
  )

  const goBack = () => {
    clearTimeout(saveTimer.current)
    const all = loadNotes()
    const updated = all.map(n =>
      String(n.id) === String(id) ? { ...n, ...note } : n
    )
    saveNotes(updated)
    router.push('/')
  }

  if (!note) return null

  return (
    <div className={styles.app}>
      <Sidebar
        notes={notes} folders={folders}
        activeFolderId={null} activeNoteId={String(id)}
        trashCount={trash.length}
        unlockedFolderIds={[]}
        onSelectFolder={() => router.push('/')}
        onNoteClick={(nid) => router.push(`/note/${nid}`)}
        onNewFolder={() => {}} onRenameFolder={() => {}}
        onDeleteFolder={() => {}} onMoveFolder={() => {}} onLockFolder={() => {}}
        onRenameNote={() => {}} onMoveNote={() => {}}
        onLockNote={() => {}} onPinNote={() => {}} onDeleteNote={() => {}}
        onEmptyTrash={() => {}}
      />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={goBack}>← 갤러리로</button>
          <div className={styles.actions}>
            <div className={styles.modeToggle}>
              <button className={`${styles.modeBtn} ${!preview ? styles.modeBtnActive : ''}`} onClick={() => setPreview(false)}>편집</button>
              <button className={`${styles.modeBtn} ${preview ? styles.modeBtnActive : ''}`} onClick={() => setPreview(true)}>미리보기</button>
            </div>
            <span className={styles.saveStatus}>{saveStatus}</span>
          </div>
        </div>

        <div className={styles.editor}>
          {preview ? (
            <div className={styles.previewWrap}>
              <h1 className={styles.previewTitle}>{note.title || '제목 없음'}</h1>
              <MarkdownView content={note.body} />
            </div>
          ) : (
            <div className={styles.editWrap}>
              <input
                className={styles.titleInput}
                placeholder="제목을 입력하세요..."
                value={note.title}
                onChange={e => handleChange('title', e.target.value)}
                autoFocus={!note.title}
              />
              <div className={styles.textareaWrap}>
                <textarea
                  ref={textareaRef}
                  className={styles.bodyInput}
                  placeholder={'내용을 입력하세요...\n\n/ 를 입력하면 블록을 삽입할 수 있어요'}
                  value={note.body}
                  onChange={handleBodyInput}
                  onKeyDown={handleBodyKeyDown}
                />
                {slashMenu && filtered.length > 0 && (
                  <div className={styles.slashMenu}>
                    {filtered.map((cmd, i) => (
                      <div
                        key={cmd.label}
                        className={`${styles.slashItem} ${i === slashIndex ? styles.slashItemActive : ''}`}
                        onMouseDown={(e) => { e.preventDefault(); insertBlock(cmd) }}
                      >
                        <span className={styles.slashIcon}>{cmd.icon}</span>
                        <div>
                          <div className={styles.slashLabel}>{cmd.label}</div>
                          <div className={styles.slashDesc}>{cmd.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
