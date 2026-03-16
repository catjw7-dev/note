'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '../../../components/Sidebar'
import MarkdownView from '../../../components/MarkdownView'
import { loadNotes, saveNotes, loadTags, loadTrash, saveTrash } from '../../../lib/notes'
import styles from './page.module.css'

export default function NotePage() {
  const router = useRouter()
  const { id } = useParams()
  const [notes, setNotes] = useState([])
  const [tags, setTags] = useState([])
  const [trash, setTrash] = useState([])
  const [note, setNote] = useState(null)
  const [saveStatus, setSaveStatus] = useState('저장됨')
  const [preview, setPreview] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    const all = loadNotes()
    const allTags = loadTags()
    const allTrash = loadTrash()
    setNotes(all)
    setTags(allTags)
    setTrash(allTrash)
    const found = all.find(n => String(n.id) === String(id))
    if (found) setNote({ ...found })
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

  const noteTag = tags.find(t => t.id === note.tagId)

  return (
    <div className={styles.app}>
      <Sidebar
        notes={notes}
        tags={tags}
        activeTagId={null}
        trashCount={trash.length}
        onNoteClick={(nid) => router.push(`/note/${nid}`)}
        onTagFilter={() => router.push('/')}
        onAddTag={() => {}}
        onDeleteTag={() => {}}
        onRenameTag={() => {}}
        onEmptyTrash={() => {}}
      />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={goBack}>← 갤러리로</button>
          <div className={styles.actions}>
            {noteTag && (
              <div className={styles.tagBadge} style={{ background: noteTag.color + '22', color: noteTag.color, borderColor: noteTag.color + '44' }}>
                <div className={styles.tagDot} style={{ background: noteTag.color }} />
                {noteTag.name}
              </div>
            )}
            {/* 편집 / 미리보기 토글 */}
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeBtn} ${!preview ? styles.modeBtnActive : ''}`}
                onClick={() => setPreview(false)}
              >편집</button>
              <button
                className={`${styles.modeBtn} ${preview ? styles.modeBtnActive : ''}`}
                onClick={() => setPreview(true)}
              >미리보기</button>
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
            <>
              <input
                className={styles.titleInput}
                placeholder="제목을 입력하세요..."
                value={note.title}
                onChange={e => handleChange('title', e.target.value)}
                autoFocus={!note.title}
              />
              <textarea
                className={styles.bodyInput}
                placeholder={`내용을 입력하세요...\n\n마크다운 지원:\n# 제목\n**굵게** *기울임*\n- 목록\n> 인용\n\`코드\``}
                value={note.body}
                onChange={e => handleChange('body', e.target.value)}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
