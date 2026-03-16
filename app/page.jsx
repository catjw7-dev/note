'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import PinModal from '../components/PinModal'
import LockModal from '../components/LockModal'
import TagModal from '../components/TagModal'
import MobileNav from '../components/MobileNav'
import CardPreview from '../components/CardPreview'
import { loadNotes, saveNotes, loadTags, saveTags, loadTrash, saveTrash, COLORS } from '../lib/notes'
import styles from './page.module.css'

export default function GalleryPage() {
  const router = useRouter()
  const [notes, setNotes] = useState([])
  const [tags, setTags] = useState([])
  const [lockedId, setLockedId] = useState(null)
  const [lockModalId, setLockModalId] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const [tagModalId, setTagModalId] = useState(null)
  const [activeTagId, setActiveTagId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [trash, setTrash] = useState([])
  const menuRef = useRef(null)
  const contextRef = useRef(null)
  const renameRef = useRef(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)

  useEffect(() => { setNotes(loadNotes()); setTags(loadTags()); setTrash(loadTrash()) }, [])

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus()
  }, [renamingId])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null)
      if (contextRef.current && !contextRef.current.contains(e.target)) setContextMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const updateNote = (id, changes) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...changes } : n)
    setNotes(updated); saveNotes(updated)
  }

  const handleNoteClick = (id) => {
    if (renamingId === id) return
    if (menuId || contextMenu) { setMenuId(null); setContextMenu(null); return }
    const note = notes.find(n => n.id === id)
    if (!note) return
    if (note.locked) setLockedId(id)
    else router.push(`/note/${id}`)
  }

  const handleContextMenu = (e, id) => {
    e.preventDefault()
    setMenuId(null)
    setContextMenu({ id, x: e.clientX, y: e.clientY })
  }

  // 모바일 꾹 누르기 → 우클릭
  const handleTouchStart = (e, id) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      const touch = e.touches[0]
      setMenuId(null)
      setContextMenu({ id, x: touch.clientX, y: touch.clientY })
    }, 500)
  }

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current)
  }

  const handleTouchMove = () => {
    clearTimeout(longPressTimer.current)
  }

  const handleMenuBtn = (e, id) => {
    e.stopPropagation()
    setContextMenu(null)
    setMenuId(prev => prev === id ? null : id)
  }

  const deleteNote = (id) => {
    const note = notes.find(n => n.id === id)
    if (!note) return
    const updatedNotes = notes.filter(n => n.id !== id)
    const updatedTrash = [...trash, { ...note, deletedAt: new Date().toLocaleDateString('ko-KR') }]
    setNotes(updatedNotes); saveNotes(updatedNotes)
    setTrash(updatedTrash); saveTrash(updatedTrash)
    setMenuId(null); setContextMenu(null)
  }

  const handleEmptyTrash = () => {
    setTrash([]); saveTrash([])
  }

  const togglePin = (id) => {
    const note = notes.find(n => n.id === id)
    updateNote(id, { pinned: !note?.pinned })
    setMenuId(null); setContextMenu(null)
  }

  const openLockModal = (id) => { setMenuId(null); setContextMenu(null); setLockModalId(id) }
  const openTagModal = (id) => { setMenuId(null); setContextMenu(null); setTagModalId(id) }

  const startRename = (id) => {
    const note = notes.find(n => n.id === id)
    setMenuId(null); setContextMenu(null)
    setRenamingId(id)
    setRenameVal(note?.title || '')
  }

  const commitRename = () => {
    if (renamingId) {
      updateNote(renamingId, { title: renameVal })
      setRenamingId(null); setRenameVal('')
    }
  }

  const handleLockSuccess = (password) => { updateNote(lockModalId, { locked: true, password }); setLockModalId(null) }

  const handleUnlockAttempt = (password) => {
    const note = notes.find(n => n.id === lockModalId)
    if (!note) return false
    if (password === note.password) { updateNote(lockModalId, { locked: false, password: null }); setLockModalId(null); return true }
    return false
  }

  // 버그 수정: 태그 할당 시 색 변경 + null이면 원래 색으로
  const handleTagAssign = (tagId) => {
    const tag = tags.find(t => t.id === tagId)
    const noteIdx = notes.findIndex(n => n.id === tagModalId)
    const color = tag ? tag.color : COLORS[noteIdx % COLORS.length]
    updateNote(tagModalId, { tagId, color })
    setTagModalId(null)
  }

  // 버그 수정: 새 태그 만들기 → id 반환해서 바로 할당 가능
  const handleCreateTag = ({ name, color }) => {
    const newTag = { id: Date.now(), name, color }
    const updated = [...tags, newTag]
    setTags(updated); saveTags(updated)
    return newTag // TagModal에서 바로 onAssign에 사용
  }

  const handleDeleteTag = (tagId) => {
    const updatedTags = tags.filter(t => t.id !== tagId)
    setTags(updatedTags); saveTags(updatedTags)
    // 해당 태그 달린 노트들 색 초기화
    const updatedNotes = notes.map((n, i) =>
      n.tagId === tagId ? { ...n, tagId: null, color: COLORS[i % COLORS.length] } : n
    )
    setNotes(updatedNotes); saveNotes(updatedNotes)
    if (activeTagId === tagId) setActiveTagId(null)
  }

  const handleRenameTag = (tagId, newName) => {
    const updated = tags.map(t => t.id === tagId ? { ...t, name: newName } : t)
    setTags(updated); saveTags(updated)
  }

  const handleAddTag = () => setTagModalId('__new__')

  const createNote = () => {
    const newNote = { id: Date.now(), title: '', body: '', locked: false, password: null, color: COLORS[notes.length % COLORS.length], tagId: null, pinned: false, date: '방금' }
    const updated = [...notes, newNote]
    setNotes(updated); saveNotes(updated)
    router.push(`/note/${newNote.id}`)
  }

  const currentLockNote = notes.find(n => n.id === lockModalId)
  // 고정된 노트 먼저, 나머지는 원래 순서
  const sortedNotes = [...(activeTagId ? notes.filter(n => n.tagId === activeTagId) : notes)]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  const visibleNotes = sortedNotes

  const DropdownItems = ({ id, stopProp }) => {
    const note = notes.find(n => n.id === id)
    if (!note) return null
    const wrap = (fn) => (e) => { if (stopProp) e.stopPropagation(); fn(id) }
    return (
      <>
        <button className={styles.dropItem} onClick={wrap(togglePin)}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13">
            <path d="M9 1L13 5L8 8L6 13L5 9L1 8L6 6Z"/>
          </svg>
          {note.pinned ? '고정 해제' : '고정'}
        </button>
        <button className={styles.dropItem} onClick={wrap(startRename)}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13">
            <path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/>
          </svg>
          Rename
        </button>
        <button className={styles.dropItem} onClick={wrap(openTagModal)}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13">
            <path d="M1 1h5.5l5.5 5.5-5 5L1.5 6V1z"/><circle cx="4" cy="4" r="1"/>
          </svg>
          태그
        </button>
        <button className={styles.dropItem} onClick={wrap(openLockModal)}>
          {note.locked ? (
            <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2" strokeDasharray="2 2"/></svg>잠금 해제</>
          ) : (
            <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/></svg>잠금</>
          )}
        </button>
        <div className={styles.dropDivider} />
        <button className={styles.deleteBtn} onClick={(e) => { if (stopProp) e.stopPropagation(); deleteNote(id) }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/></svg>
          삭제
        </button>
      </>
    )
  }

  return (
    <div className={styles.app}>
      <Sidebar
        notes={notes} tags={tags} activeTagId={activeTagId}
        trashCount={trash.length}
        onNoteClick={handleNoteClick}
        onTagFilter={setActiveTagId}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
        onRenameTag={handleRenameTag}
        onEmptyTrash={handleEmptyTrash}
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MobileNav
              notes={notes} tags={tags} activeTagId={activeTagId}
              trashCount={trash.length}
              onNoteClick={handleNoteClick}
              onTagFilter={setActiveTagId}
              onAddTag={handleAddTag}
              onDeleteTag={handleDeleteTag}
              onRenameTag={handleRenameTag}
            />
            <div>
              <h1 className={styles.title}>갤러리</h1>
            {activeTagId && (
              <div className={styles.filterBadge}>
                <div className={styles.filterDot} style={{ background: tags.find(t => t.id === activeTagId)?.color }} />
                {tags.find(t => t.id === activeTagId)?.name}
                <span className={styles.filterClear} onClick={() => setActiveTagId(null)}>×</span>
              </div>
            )}
            </div>
          </div>
          <button className={styles.newBtn} onClick={createNote}>+ 새 노트</button>
        </div>

        <div className={styles.grid}>
          {visibleNotes.map(note => (
            <div
              key={note.id}
              className={styles.card}
              onClick={() => { if (longPressTriggered.current) { longPressTriggered.current = false; return } handleNoteClick(note.id) }}
              onContextMenu={(e) => handleContextMenu(e, note.id)}
              onTouchStart={(e) => handleTouchStart(e, note.id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardColor} style={{ background: note.color }} />
                {note.pinned && (
                  <div className={styles.pinIcon}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="#0C1821" strokeWidth="1.5" strokeLinejoin="round" width="12" height="12">
                      <path d="M9 1L13 5L8 8L6 13L5 9L1 8L6 6Z"/>
                    </svg>
                  </div>
                )}
              </div>
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
                  <div className={styles.lockIcon}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                      <rect x="3" y="6" width="8" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/>
                    </svg>
                  </div>
                </>
              ) : renamingId === note.id ? (
                <>
                  <input
                    ref={renameRef}
                    className={styles.cardRenameInput}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') { setRenamingId(null) }
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className={styles.cardPreview}>{note.body.replace(/\n/g, ' ').slice(0, 60) || '내용 없음'}</div>
                </>
              ) : (
                <>
                  <div className={styles.cardTitle}>{note.title || '제목 없음'}</div>
                  <CardPreview content={note.body} />
                </>
              )}
              <div className={styles.cardDate}>{note.date}</div>
            </div>
          ))}

          <div className={`${styles.card} ${styles.addCard}`} onClick={createNote}>
            <span className={styles.plus}>+</span>
            <span>새 노트</span>
          </div>
        </div>

        <div className={styles.footer}>
          <svg width="100%" viewBox="0 0 600 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <g fill="#0C1821" opacity="0.07">
              {Array.from({ length: 3 }, (_, row) => Array.from({ length: 24 }, (_, col) => (
                <circle key={`${row}-${col}`} cx={20 + col * 24} cy={20 + row * 24} r="1.5" />
              )))}
            </g>
            <circle cx="300" cy="44" r="38" fill="none" stroke="#276FBF" strokeWidth="0.6" opacity="0.2"/>
            <circle cx="300" cy="44" r="26" fill="none" stroke="#276FBF" strokeWidth="0.6" opacity="0.15"/>
            <circle cx="300" cy="44" r="14" fill="none" stroke="#276FBF" strokeWidth="0.6" opacity="0.12"/>
            <circle cx="300" cy="44" r="4" fill="#276FBF" opacity="0.2"/>
            <circle cx="100" cy="44" r="22" fill="none" stroke="#0C1821" strokeWidth="0.5" opacity="0.08"/>
            <circle cx="100" cy="44" r="12" fill="none" stroke="#0C1821" strokeWidth="0.5" opacity="0.06"/>
            <circle cx="500" cy="44" r="22" fill="none" stroke="#0C1821" strokeWidth="0.5" opacity="0.08"/>
            <circle cx="500" cy="44" r="12" fill="none" stroke="#0C1821" strokeWidth="0.5" opacity="0.06"/>
            <line x1="0" y1="44" x2="250" y2="44" stroke="#0C1821" strokeWidth="0.5" opacity="0.06"/>
            <line x1="350" y1="44" x2="600" y2="44" stroke="#0C1821" strokeWidth="0.5" opacity="0.06"/>
          </svg>
          <p className={styles.footerText}>노트 {notes.length}개 · 마지막 업데이트 오늘</p>
        </div>
      </main>

      {contextMenu && (
        <div className={styles.contextMenu} ref={contextRef} style={{ top: contextMenu.y, left: contextMenu.x }}>
          <DropdownItems id={contextMenu.id} stopProp={false} />
        </div>
      )}

      {lockedId && (
        <PinModal
          password={notes.find(n => n.id === lockedId)?.password}
          onSuccess={() => { setLockedId(null); router.push(`/note/${lockedId}`) }}
          onCancel={() => setLockedId(null)}
        />
      )}

      {lockModalId && currentLockNote && (
        <LockModal
          mode={currentLockNote.locked ? 'unlock' : 'lock'}
          onSuccess={currentLockNote.locked ? handleUnlockAttempt : handleLockSuccess}
          onCancel={() => setLockModalId(null)}
        />
      )}

      {tagModalId && tagModalId !== '__new__' && (
        <TagModal
          tags={tags}
          currentTagId={notes.find(n => n.id === tagModalId)?.tagId ?? null}
          onAssign={handleTagAssign}
          onCreateTag={handleCreateTag}
          onCancel={() => setTagModalId(null)}
        />
      )}

      {tagModalId === '__new__' && (
        <TagModal
          tags={tags}
          currentTagId={null}
          onAssign={() => setTagModalId(null)}
          onCreateTag={(t) => { handleCreateTag(t); setTagModalId(null) }}
          onCancel={() => setTagModalId(null)}
        />
      )}
    </div>
  )
}
