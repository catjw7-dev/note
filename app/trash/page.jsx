'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import { loadNotes, loadTags, loadTrash, saveTrash, saveNotes, saveTags, loadTags as lt } from '../../lib/notes'
import styles from './page.module.css'

export default function TrashPage() {
  const router = useRouter()
  const [notes, setNotes] = useState([])
  const [tags, setTags] = useState([])
  const [trash, setTrash] = useState([])
  const [contextMenu, setContextMenu] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const menuRef = useRef(null)
  const contextRef = useRef(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)

  useEffect(() => {
    setNotes(loadNotes())
    setTags(loadTags())
    setTrash(loadTrash())
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null)
      if (contextRef.current && !contextRef.current.contains(e.target)) setContextMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const restoreNote = (id) => {
    const note = trash.find(n => n.id === id)
    if (!note) return
    const { deletedAt, ...restored } = note
    const updatedNotes = [...notes, restored]
    const updatedTrash = trash.filter(n => n.id !== id)
    setNotes(updatedNotes); saveNotes(updatedNotes)
    setTrash(updatedTrash); saveTrash(updatedTrash)
    setMenuId(null); setContextMenu(null)
  }

  const restoreAll = () => {
    const restored = trash.map(({ deletedAt, ...note }) => note)
    const updatedNotes = [...notes, ...restored]
    setNotes(updatedNotes); saveNotes(updatedNotes)
    setTrash([]); saveTrash([])
  }

  const permanentDelete = (id) => {
    const updated = trash.filter(n => n.id !== id)
    setTrash(updated); saveTrash(updated)
    setMenuId(null); setContextMenu(null)
  }

  const emptyTrash = () => {
    setTrash([]); saveTrash([])
  }

  const handleContextMenu = (e, id) => {
    e.preventDefault()
    setMenuId(null)
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  const handleTouchStart = (e, id) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      const touch = e.touches[0]
      setMenuId(null)
      setContextMenu({ id, x: touch.clientX, y: touch.clientY })
    }, 500)
  }

  const handleTouchEnd = () => clearTimeout(longPressTimer.current)
  const handleTouchMove = () => clearTimeout(longPressTimer.current)

  const handleMenuBtn = (e, id) => {
    e.stopPropagation()
    setContextMenu(null)
    setMenuId(prev => prev === id ? null : id)
  }

  const DropdownItems = ({ id, stopProp }) => (
    <>
      <button className={styles.dropItem} onClick={(e) => { if (stopProp) e.stopPropagation(); restoreNote(id) }}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13">
          <path d="M1 7A6 6 0 1 0 3 3.5M1 1v3h3"/>
        </svg>
        복구하기
      </button>
      <div className={styles.dropDivider} />
      <button className={styles.deleteBtn} onClick={(e) => { if (stopProp) e.stopPropagation(); permanentDelete(id) }}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13">
          <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/>
        </svg>
        완전 삭제
      </button>
    </>
  )

  return (
    <div className={styles.app}>
      <Sidebar
        notes={notes} tags={tags} activeTagId={null}
        trashCount={trash.length}
        onNoteClick={(id) => router.push(`/note/${id}`)}
        onTagFilter={() => router.push('/')}
        onAddTag={() => {}}
        onDeleteTag={() => {}}
        onRenameTag={() => {}}
        onEmptyTrash={emptyTrash}
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.push('/')}>← 갤러리로</button>
            <h1 className={styles.title}>휴지통</h1>
            {trash.length > 0 && (
              <span className={styles.count}>{trash.length}개</span>
            )}
          </div>
          <div className={styles.headerActions}>
            {trash.length > 0 && (
              <>
                <button className={styles.restoreAllBtn} onClick={restoreAll}>전부 복구하기</button>
                <button className={styles.emptyBtn} onClick={emptyTrash}>휴지통 비우기</button>
              </>
            )}
          </div>
        </div>

        {trash.length === 0 ? (
          <div className={styles.empty}>
            <svg viewBox="0 0 48 48" fill="none" stroke="#ccc" strokeWidth="1.5" width="48" height="48">
              <path d="M8 12h32M20 12V8h8v4M10 12l2 28h24l2-28"/>
              <path d="M20 20v14M24 20v14M28 20v14"/>
            </svg>
            <p>휴지통이 비어있어요</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {trash.map(note => (
              <div
                key={note.id}
                className={styles.card}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
                onTouchStart={(e) => handleTouchStart(e, note.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
              >
                <div className={styles.cardColor} style={{ background: note.color }} />
                <button className={styles.menuBtn} onClick={(e) => handleMenuBtn(e, note.id)}>⋮</button>

                {menuId === note.id && (
                  <div className={styles.dropdown} ref={menuRef}>
                    <DropdownItems id={note.id} stopProp={true} />
                  </div>
                )}

                {note.locked ? (
                  <>
                    <div className={`${styles.cardTitle} ${styles.blur}`}>{note.title || '제목 없음'}</div>
                    <div className={`${styles.cardPreview} ${styles.blur}`}>잠긴 노트입니다...</div>
                  </>
                ) : (
                  <>
                    <div className={styles.cardTitle}>{note.title || '제목 없음'}</div>
                    <div className={styles.cardPreview}>{note.body?.replace(/\n/g, ' ').slice(0, 60) || '내용 없음'}</div>
                  </>
                )}
                <div className={styles.cardDate}>삭제됨 · {note.deletedAt}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          ref={contextRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <DropdownItems id={contextMenu.id} stopProp={false} />
        </div>
      )}
    </div>
  )
}
