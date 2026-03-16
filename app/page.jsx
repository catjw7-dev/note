'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import PinModal from '../components/PinModal'
import LockModal from '../components/LockModal'
import MoveModal from '../components/MoveModal'
import MobileNav from '../components/MobileNav'
import CardPreview from '../components/CardPreview'
import FolderLockModal from '../components/FolderLockModal'
import { loadNotes, saveNotes, loadFolders, saveFolders, loadTrash, saveTrash, COLORS, FOLDER_COLORS, uniqueName } from '../lib/notes'
import styles from './page.module.css'

export default function GalleryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [trash, setTrash] = useState([])
  const [activeFolderId, setActiveFolderId] = useState('root')
  const [lockedId, setLockedId] = useState(null)
  const [lockModalId, setLockModalId] = useState(null)
  const [menuId, setMenuId] = useState(null)
  const [moveModalId, setMoveModalId] = useState(null)
  const [createMenu, setCreateMenu] = useState(false)      // 헤더 버튼
  const [createCardMenu, setCreateCardMenu] = useState(false) // 갤러리 카드
  const [folderMenuId, setFolderMenuId] = useState(null)
  const [folderLockModal, setFolderLockModal] = useState(null) // { id, mode }
  const [moveFolderId, setMoveFolderId] = useState(null)
  const [unlockedFolderIds, setUnlockedFolderIds] = useState([])
  const [dragItem, setDragItem] = useState(null) // { type: 'note'|'folder', id }
  const [dragOverId, setDragOverId] = useState(null) // 드롭 대상 폴더 id
  const folderMenuRef = useRef(null)
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
    setMounted(true)
  }, [])

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus()
  }, [renamingId])

  const createMenuRef = useRef(null)
  const createCardRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null)
      if (contextRef.current && !contextRef.current.contains(e.target)) setContextMenu(null)
      if (createMenuRef.current && !createMenuRef.current.contains(e.target) &&
          createCardRef.current && !createCardRef.current.contains(e.target)) setCreateMenu(false)
      if (createCardRef.current && !createCardRef.current.contains(e.target)) setCreateCardMenu(false)
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target)) setFolderMenuId(null)
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

  const startFolderRename = (id) => {
    // 갤러리 폴더 카드에서 rename — 사이드바 트리의 rename과 동일하게 처리
    const folder = folders.find(f => f.id === id)
    if (!folder) return
    const existingNames = folders.filter(f => f.parentId === folder.parentId && f.id !== id).map(f => f.name)
    const newName = prompt('폴더 이름', folder.name)
    if (newName && newName.trim()) {
      const finalName = uniqueName(newName.trim(), existingNames)
      handleRenameFolder(id, finalName)
    }
  }

  const commitRename = () => {
    if (renamingId) {
      const note = notes.find(n => n.id === renamingId)
      const siblings = notes.filter(n => n.folderId === note?.folderId && n.id !== renamingId).map(n => n.title)
      const finalName = uniqueName(renameVal, siblings)
      updateNote(renamingId, { title: finalName })
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

  const handleMove = (folderId) => {
    updateNote(moveModalId, { folderId })
    setMoveModalId(null)
  }

  const handleEmptyTrash = () => { setTrash([]); saveTrash([]) }

  // 드래그 앤 드롭
  const handleDragStart = (e, type, id) => {
    setDragItem({ type, id })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `${type}:${id}`)
  }

  const handleDragOver = (e, folderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(folderId)
  }

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault()
    setDragOverId(null)
    if (!dragItem) return
    if (dragItem.type === 'note') {
      if (notes.find(n => n.id === dragItem.id)?.folderId === targetFolderId) return
      updateNote(dragItem.id, { folderId: targetFolderId })
    } else if (dragItem.type === 'folder') {
      if (dragItem.id === targetFolderId) return
      // 자기 자신의 하위 폴더로 이동 방지
      const getAllChildren = (fId) => {
        const children = folders.filter(f => f.parentId === fId)
        return [fId, ...children.flatMap(c => getAllChildren(c.id))]
      }
      if (getAllChildren(dragItem.id).includes(targetFolderId)) return
      const updated = folders.map(f => f.id === dragItem.id ? { ...f, parentId: targetFolderId } : f)
      setFolders(updated); saveFolders(updated)
    }
    setDragItem(null)
  }

  const handleDragEnd = () => {
    setDragItem(null)
    setDragOverId(null)
  }

  const togglePin = (id) => {
    const note = notes.find(n => n.id === id)
    updateNote(id, { pinned: !note?.pinned })
    setMenuId(null); setContextMenu(null)
  }

  // 폴더 관리
  const handleNewFolder = (parentId) => {    const existingNames = folders.filter(f => f.parentId === parentId).map(f => f.name)
    const name = uniqueName('새 폴더', existingNames)
    const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length]
    const newFolder = { id: `f${Date.now()}`, name, parentId, color }
    const updated = [...folders, newFolder]
    setFolders(updated); saveFolders(updated)
    setCreateMenu(false)
    setCreateCardMenu(false)
  }

  const handleRenameFolder = (id, name) => {
    const folder = folders.find(f => f.id === id)
    const siblings = folders.filter(f => f.parentId === folder?.parentId && f.id !== id).map(f => f.name)
    const finalName = uniqueName(name, siblings)
    const updated = folders.map(f => f.id === id ? { ...f, name: finalName } : f)
    setFolders(updated); saveFolders(updated)
  }

  const handleDeleteFolder = (id) => {
    const getAllChildren = (fId) => {
      const children = folders.filter(f => f.parentId === fId)
      return [fId, ...children.flatMap(c => getAllChildren(c.id))]
    }
    const toDelete = getAllChildren(id)
    const updatedFolders = folders.filter(f => !toDelete.includes(f.id))
    const updatedNotes = notes.map(n => toDelete.includes(n.folderId) ? { ...n, folderId: 'root' } : n)
    setFolders(updatedFolders); saveFolders(updatedFolders)
    setNotes(updatedNotes); saveNotes(updatedNotes)
    if (toDelete.includes(activeFolderId)) setActiveFolderId('root')
  }

  const handleMoveFolder = (folderId) => setMoveFolderId(folderId)

  const handleFolderMoveSubmit = (targetId) => {
    const updated = folders.map(f => f.id === moveFolderId ? { ...f, parentId: targetId } : f)
    setFolders(updated); saveFolders(updated)
    setMoveFolderId(null)
  }

  const handleLockFolder = (id, mode) => setFolderLockModal({ id, mode })

  const handleFolderLockSuccess = ({ password }) => {
    const { id, mode } = folderLockModal
    if (mode === 'lock') {
      const updated = folders.map(f => f.id === id ? { ...f, locked: true, password } : f)
      setFolders(updated); saveFolders(updated)
    } else {
      const folder = folders.find(f => f.id === id)
      if (folder?.password !== password) { alert('비밀번호가 틀렸어요'); return }
      setUnlockedFolderIds(prev => [...prev, id])
    }
    setFolderLockModal(null)
  }

  const createNote = () => {
    const existingNames = notes.filter(n => n.folderId === activeFolderId).map(n => n.title)
    const title = uniqueName('제목 없음', existingNames)
    const newNote = { id: Date.now(), title, body: '', locked: false, password: null, color: COLORS[notes.length % COLORS.length], folderId: activeFolderId, tagId: null, pinned: false, date: '방금' }
    const updated = [...notes, newNote]
    setNotes(updated); saveNotes(updated)
    setCreateMenu(false)
    setCreateCardMenu(false)
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

  if (!mounted) return null

  return (
    <div className={styles.app}>
      <Sidebar
        notes={notes} folders={folders}
        activeFolderId={activeFolderId} activeNoteId={null}
        trashCount={trash.length}
        unlockedFolderIds={unlockedFolderIds}
        onSelectFolder={setActiveFolderId}
        onNoteClick={handleNoteClick}
        onNewFolder={handleNewFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveFolder={handleMoveFolder}
        onLockFolder={handleLockFolder}
        onRenameNote={startRename}
        onMoveNote={openMoveModal}
        onLockNote={openLockModal}
        onPinNote={togglePin}
        onDeleteNote={deleteNote}
        onEmptyTrash={handleEmptyTrash}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        dragOverId={dragOverId}
        dragItemId={dragItem?.id}
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MobileNav
              notes={notes} folders={folders}
              activeFolderId={activeFolderId}
              activeNoteId={null}
              trashCount={trash.length}
              onNoteClick={handleNoteClick}
              onSelectFolder={setActiveFolderId}
              onNewFolder={handleNewFolder}
            />
            <div>
              <h1 className={styles.title}>{currentFolder?.name || '갤러리'}</h1>
            </div>
          </div>
          <div className={styles.createMenuWrap} ref={createMenuRef}>
            <button className={styles.newBtn} onClick={() => setCreateMenu(m => !m)}>+ 새로 만들기</button>
            {createMenu && (
              <div className={styles.createMenu}>
                <button className={styles.createMenuItem} onClick={createNote}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14">
                    <path d="M3 1h6l3 3v9H3V1z"/><path d="M9 1v3h3"/><path d="M5 7h4M7 5v4"/>
                  </svg>
                  <div>
                    <div className={styles.createMenuLabel}>새 파일</div>
                    <div className={styles.createMenuDesc}>노트를 만들어요</div>
                  </div>
                </button>
                <button className={styles.createMenuItem} onClick={() => handleNewFolder(activeFolderId)}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14">
                    <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/><path d="M7 7v3M5.5 8.5h3"/>
                  </svg>
                  <div>
                    <div className={styles.createMenuLabel}>새 폴더</div>
                    <div className={styles.createMenuDesc}>폴더를 만들어요</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          className={styles.grid}
          onDragOver={e => handleDragOver(e, activeFolderId)}
          onDrop={e => handleDrop(e, activeFolderId)}
        >
          {/* 하위 폴더 카드 */}
          {subFolders.map(folder => {
            const isLocked = folder.locked && !unlockedFolderIds.includes(folder.id)
            return (
              <div
                key={folder.id}
                className={`${styles.card} ${styles.folderCard} ${dragOverId === folder.id ? styles.dragOver : ''} ${dragItem?.id === folder.id ? styles.dragging : ''}`}
                onClick={() => { if (isLocked) { handleLockFolder(folder.id, 'unlock'); return } }}
                onDoubleClick={() => { if (!isLocked) setActiveFolderId(folder.id) }}
                draggable={!isLocked}
                onDragStart={e => handleDragStart(e, 'folder', folder.id)}
                onDragOver={e => handleDragOver(e, folder.id)}
                onDrop={e => handleDrop(e, folder.id)}
                onDragEnd={handleDragEnd}
                style={{ borderTopColor: folder.color || '#276FBF', borderTopWidth: 3 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <svg viewBox="0 0 16 13" fill="none" stroke={folder.color || '#276FBF'} strokeWidth="1.3" width="18" height="14">
                    <path d="M1 3h14v9H1zM1 3l2.5-2h5l1 2"/>
                  </svg>
                  <div className={styles.cardTitle} style={{ flex: 1, marginBottom: 0, filter: isLocked ? 'blur(4px)' : 'none' }}>
                    {folder.name}
                  </div>
                  {isLocked && (
                    <svg viewBox="0 0 14 14" fill="none" stroke="#888" strokeWidth="1.4" width="13" height="13">
                      <rect x="3" y="6" width="8" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/>
                    </svg>
                  )}
                  <button
                    className={styles.menuBtn}
                    style={{ opacity: 1, position: 'static', width: 20, height: 20 }}
                    onClick={e => { e.stopPropagation(); setFolderMenuId(prev => prev === folder.id ? null : folder.id) }}
                  >⋮</button>
                </div>
                <div className={styles.cardDate} style={{ filter: isLocked ? 'blur(4px)' : 'none' }}>
                  {notes.filter(n => n.folderId === folder.id).length}개의 노트
                </div>

                {folderMenuId === folder.id && (
                  <div className={styles.dropdown} ref={folderMenuRef}>
                    <button className={styles.dropItem} onClick={e => { e.stopPropagation(); startFolderRename(folder.id); setFolderMenuId(null) }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/></svg>
                      Rename
                    </button>
                    <button className={styles.dropItem} onClick={e => { e.stopPropagation(); handleMoveFolder(folder.id); setFolderMenuId(null) }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/><path d="M9 8l2 2-2 2"/></svg>
                      이동
                    </button>
                    <button className={styles.dropItem} onClick={e => {
                      e.stopPropagation()
                      handleLockFolder(folder.id, isLocked ? 'unlock' : 'lock')
                      setFolderMenuId(null)
                    }}>
                      {isLocked
                        ? <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2" strokeDasharray="2 2"/></svg>잠금 해제</>
                        : <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/></svg>잠금</>
                      }
                    </button>
                    <div className={styles.dropDivider}/>
                    <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); setFolderMenuId(null) }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/></svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* 노트 카드 */}
          {folderNotes.map(note => (
            <div
              key={note.id}
              className={`${styles.card} ${dragItem?.id === note.id ? styles.dragging : ''}`}
              onClick={() => { if (longPressTriggered.current) { longPressTriggered.current = false; return } }}
              onDoubleClick={() => handleNoteClick(note.id)}
              onContextMenu={(e) => handleContextMenu(e, note.id)}
              onTouchStart={(e) => handleTouchStart(e, note.id)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              draggable
              onDragStart={e => handleDragStart(e, 'note', note.id)}
              onDragEnd={handleDragEnd}
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

          {folderNotes.length === 0 && subFolders.length === 0 && (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 48 48" fill="none" stroke="#ddd" strokeWidth="1.5" width="44" height="44">
                <path d="M8 12h32v28H8zM8 12l5-6h12l3 6"/>
                <path d="M20 24h8M20 30h5"/>
              </svg>
              <p>비어있어요</p>
              <span>새 노트를 만들거나 폴더를 추가해보세요</span>
            </div>
          )}

          <div className={`${styles.card} ${styles.addCard}`} onClick={() => setCreateCardMenu(m => !m)} ref={createCardRef}>
            <span className={styles.plus}>+</span>
            <span>새로 만들기</span>
            {createCardMenu && (
              <div className={styles.createMenu} onClick={e => e.stopPropagation()}>
                <button className={styles.createMenuItem} onClick={createNote}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14">
                    <path d="M3 1h6l3 3v9H3V1z"/><path d="M9 1v3h3"/><path d="M5 7h4M7 5v4"/>
                  </svg>
                  <div>
                    <div className={styles.createMenuLabel}>새 파일</div>
                    <div className={styles.createMenuDesc}>노트를 만들어요</div>
                  </div>
                </button>
                <button className={styles.createMenuItem} onClick={() => handleNewFolder(activeFolderId)}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14">
                    <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/><path d="M7 7v3M5.5 8.5h3"/>
                  </svg>
                  <div>
                    <div className={styles.createMenuLabel}>새 폴더</div>
                    <div className={styles.createMenuDesc}>폴더를 만들어요</div>
                  </div>
                </button>
              </div>
            )}
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

      {moveFolderId && (
        <MoveModal
          type="folder"
          folders={folders}
          currentFolderId={folders.find(f => f.id === moveFolderId)?.parentId}
          excludeId={moveFolderId}
          onMove={handleFolderMoveSubmit}
          onCancel={() => setMoveFolderId(null)}
        />
      )}

      {folderLockModal && (
        <FolderLockModal
          mode={folderLockModal.mode}
          hasChildren={folders.some(f => f.parentId === folderLockModal.id)}
          onSuccess={handleFolderLockSuccess}
          onCancel={() => setFolderLockModal(null)}
        />
      )}
    </div>
  )
}
