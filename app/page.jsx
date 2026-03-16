'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import PinModal from '../components/PinModal'
import LockModal from '../components/LockModal'
import MoveModal from '../components/MoveModal'
import MobileNav from '../components/MobileNav'
import CardPreview from '../components/CardPreview'
import { loadNotes, saveNotes, loadFolders, saveFolders, loadTrash, saveTrash, COLORS } from '../lib/notes'
import styles from './page.module.css'

export default function GalleryPage() {
  const router = useRouter()
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [trash, setTrash] = useState([])
  const [activeFolderId, setActiveFolderId] = useState('root')
  const [lockedId, setLockedId] = useState(null)
  const [lockModalId, setLockModalId] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const [moveModalId, setMoveModalId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const menuRef = useRef(null)
  const contextRef = useRef(null)
  const renameRef = useRef(null)
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)

  useEffect(() => {
    setNotes(loadNotes())
    setFolders(loadFolders())
    setTrash(loadTrash())
  }, [])

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
    e.preventDefault(); setMenuId(null)
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
    e.stopPropagation(); setContextMenu(null)
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

  const openLockModal = (id) => { setMenuId(null); setContextMenu(null); setLockModalId(id) }
  const openMoveModal = (id) => { setMenuId(null); setContextMenu(null); setMoveModalId(id) }

  const startRename = (id) => {
    const note = notes.find(n => n.id === id)
    setMenuId(null); setContextMenu(null)
    setRenamingId(id); setRenameVal(note?.title || '')
  }

  const commitRename = () => {
    if (renamingId) { updateNote(renamingId, { title: renameVal }); setRenamingId(null); setRenameVal('') }
  }

  const handleLockSuccess = (password) => { updateNote(lockModalId, { locked: true, password }); setLockModalId(null) }

  const handleUnlockAttempt = (password) => {
    const note = notes.find(n => n.id === lockModalId)
    if (!note) return false
    if (password === note.password) { updateNote(lockModalId, { locked: false, password: null }); setLockModalId(null); return true }
    return false
  }

  const handleMove = (folderId) => {
    updateNote(moveModalId, { folderId })
    setMoveModalId(null)
  }

  const handleEmptyTrash = () => { setTrash([]); saveTrash([]) }

  const togglePin = (id) => {
    const note = notes.find(n => n.id === id)
    updateNote(id, { pinned: !note?.pinned })
    setMenuId(null); setContextMenu(null)
  }

  // 폴더 관리
  const handleNewFolder = (parentId) => {
    const newFolder = { id: `f${Date.now()}`, name: '새 폴더', parentId }
    const updated = [...folders, newFolder]
    setFolders(updated); saveFolders(updated)
  }

  const handleRenameFolder = (id, name) => {
    const updated = folders.map(f => f.id === id ? { ...f, name } : f)
    setFolders(updated); saveFolders(updated)
  }

  const handleDeleteFolder = (id) => {
    // 하위 폴더 재귀 삭제
    const getAllChildren = (fId) => {
      const children = folders.filter(f => f.parentId === fId)
      return [fId, ...children.flatMap(c => getAllChildren(c.id))]
    }
    const toDelete = getAllChildren(id)
    const updatedFolders = folders.filter(f => !toDelete.includes(f.id))
    // 해당 폴더 노트들 root로 이동
    const updatedNotes = notes.map(n => toDelete.includes(n.folderId) ? { ...n, folderId: 'root' } : n)
    setFolders(updatedFolders); saveFolders(updatedFolders)
    setNotes(updatedNotes); saveNotes(updatedNotes)
    if (toDelete.includes(activeFolderId)) setActiveFolderId('root')
  }

  const createNote = () => {
    const newNote = { id: Date.now(), title: '', body: '', locked: false, password: null, color: COLORS[notes.length % COLORS.length], folderId: activeFolderId, tagId: null, pinned: false, date: '방금' }
    const updated = [...notes, newNote]
    setNotes(updated); saveNotes(updated)
    router.push(`/note/${newNote.id}`)
  }

  const currentLockNote = notes.find(n => n.id === lockModalId)
  const currentFolder = folders.find(f => f.id === activeFolderId)

  // 현재 폴더의 노트 + 하위 폴더
  const folderNotes = [...notes.filter(n => n.folderId === activeFolderId)]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  const subFolders = folders.filter(f => f.parentId === activeFolderId)

  const DropdownItems = ({ id, stopProp }) => {
    const note = notes.find(n => n.id === id)
    if (!note) return null
    const wrap = (fn) => (e) => { if (stopProp) e.stopPropagation(); fn(id) }
    return (
      <>
        <button className={styles.dropItem} onClick={wrap(togglePin)}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><path d="M9 1L13 5L8 8L6 13L5 9L1 8L6 6Z"/></svg>
          {note.pinned ? '고정 해제' : '고정'}
        </button>
        <button className={styles.dropItem} onClick={wrap(startRename)}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/></svg>
          Rename
        </button>
        <button className={styles.dropItem} onClick={wrap(openMoveModal)}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/></svg>
          이동
        </button>
        <button className={styles.dropItem} onClick={wrap(openLockModal)}>
          {note.locked
            ? <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2" strokeDasharray="2 2"/></svg>잠금 해제</>
            : <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/></svg>잠금</>
          }
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
        notes={notes}
        folders={folders}
        activeFolderId={activeFolderId}
        trashCount={trash.length}
        onSelectFolder={setActiveFolderId}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onNewFolder={handleNewFolder}
        onEmptyTrash={handleEmptyTrash}
        onNoteClick={handleNoteClick}
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MobileNav
              notes={notes} folders={folders} activeFolderId={activeFolderId}
              trashCount={trash.length}
              onNoteClick={handleNoteClick}
              onSelectFolder={setActiveFolderId}
              onNewFolder={handleNewFolder}
            />
            <div>
              <h1 className={styles.title}>{currentFolder?.name || '갤러리'}</h1>
            </div>
          </div>
          <button className={styles.newBtn} onClick={createNote}>+ 새 노트</button>
        </div>

        <div className={styles.grid}>
          {/* 하위 폴더 카드 */}
          {subFolders.map(folder => (
            <div
              key={folder.id}
              className={`${styles.card} ${styles.folderCard}`}
              onClick={() => setActiveFolderId(folder.id)}
            >
              <svg viewBox="0 0 20 16" fill="none" stroke="#276FBF" strokeWidth="1.3" width="20" height="16" style={{ marginBottom: 8 }}>
                <path d="M1 4h18v11H1zM1 4l3-3h5l1 3"/>
              </svg>
              <div className={styles.cardTitle}>{folder.name}</div>
              <div className={styles.cardDate}>{notes.filter(n => n.folderId === folder.id).length}개</div>
            </div>
          ))}

          {/* 노트 카드 */}
          {folderNotes.map(note => (
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
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                    onClick={e => e.stopPropagation()}
                  />
                  <CardPreview content={note.body} />
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
            <circle cx="500" cy="44" r="22" fill="none" stroke="#0C1821" strokeWidth="0.5" opacity="0.08"/>
            <line x1="0" y1="44" x2="250" y2="44" stroke="#0C1821" strokeWidth="0.5" opacity="0.06"/>
            <line x1="350" y1="44" x2="600" y2="44" stroke="#0C1821" strokeWidth="0.5" opacity="0.06"/>
          </svg>
          <p className={styles.footerText}>노트 {folderNotes.length}개 · {currentFolder?.name}</p>
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

      {moveModalId && (
        <MoveModal
          folders={folders}
          currentFolderId={notes.find(n => n.id === moveModalId)?.folderId}
          onMove={handleMove}
          onCancel={() => setMoveModalId(null)}
        />
      )}
    </div>
  )
}
