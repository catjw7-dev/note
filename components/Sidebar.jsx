'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

function FileIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" width="12" height="12" style={{ flexShrink: 0 }}>
      <path d="M3 1h6l3 3v9H3V1z"/><path d="M9 1v3h3"/>
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" width="13" height="13" style={{ flexShrink: 0 }}>
      <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" width="11" height="11" style={{ flexShrink: 0 }}>
      <rect x="2" y="5" width="8" height="6" rx="1"/><path d="M4 5V3.5a2 2 0 014 0V5"/>
    </svg>
  )
}

function FolderNode({
  folder, folders, notes, depth,
  activeFolderId, activeNoteId,
  onSelectFolder, onNoteClick,
  onNewFolder, onRenameFolder, onDeleteFolder, onMoveFolder, onLockFolder,
  onRenameNote, onMoveNote, onLockNote, onPinNote, onDeleteNote,
  unlockedFolderIds,
  onDragStart, onDragOver, onDrop, onDragEnd, dragOverId, dragItemId,
}) {
  const children = folders.filter(f => f.parentId === folder.id)
  const folderNotes = notes.filter(n => n.folderId === folder.id)
  const isRoot = folder.id === 'root'
  const isLocked = folder.locked && !unlockedFolderIds.includes(folder.id)
  const [open, setOpen] = useState(isRoot)
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(folder.name)
  const [noteMenu, setNoteMenu] = useState(null)
  const menuRef = useRef(null)
  const noteMenuRef = useRef(null)
  const renameRef = useRef(null)

  useEffect(() => {
    if (renaming && renameRef.current) renameRef.current.focus()
  }, [renaming])

  useEffect(() => {
    const fn = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false)
      if (noteMenuRef.current && !noteMenuRef.current.contains(e.target)) setNoteMenu(null)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const commitRename = () => {
    if (renameVal.trim()) onRenameFolder(folder.id, renameVal.trim())
    setRenaming(false)
  }

  const hasChildren = children.length > 0 || folderNotes.length > 0

  const handleFolderClick = () => {
    if (isLocked) {
      onLockFolder(folder.id, 'unlock')
      return
    }
    setOpen(o => !o)
    onSelectFolder(folder.id)
  }

  return (
    <div className={styles.folderNode}>
      <div
        className={`${styles.folderRow} ${activeFolderId === folder.id ? styles.folderActive : ''} ${isLocked ? styles.folderLocked : ''} ${dragOverId === folder.id ? styles.folderDragOver : ''} ${dragItemId === folder.id ? styles.folderDragging : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={handleFolderClick}
        onDoubleClick={() => { if (!isLocked) { setOpen(true); onSelectFolder(folder.id) } }}
        onContextMenu={e => { e.preventDefault(); if (!isLocked) setMenu('folder') }}
        draggable={!isLocked}
        onDragStart={e => onDragStart(e, 'folder', folder.id)}
        onDragOver={e => onDragOver(e, folder.id)}
        onDrop={e => onDrop(e, folder.id)}
        onDragEnd={onDragEnd}
      >
        <span
          className={`${styles.folderArrow} ${open && hasChildren && !isLocked ? styles.folderArrowOpen : ''}`}
          onClick={e => { e.stopPropagation(); if (!isLocked) setOpen(o => !o) }}
        >
          {hasChildren ? '›' : ' '}
        </span>
        <FolderIcon />
        {renaming ? (
          <input
            ref={renameRef}
            className={styles.folderRenameInput}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={styles.folderName} style={{ filter: isLocked ? 'blur(3px)' : 'none' }}>{folder.name}</span>
        )}
        {isLocked && <LockIcon />}
        {!isLocked && (
          <button className={styles.folderMenuBtn} onClick={e => { e.stopPropagation(); setMenu(m => m ? false : 'folder') }}>⋮</button>
        )}
      </div>

      {/* 폴더 드롭다운 */}
      {menu === 'folder' && (
        <div className={styles.folderDropdown} ref={menuRef} style={{ left: 8 + depth * 14 }}>
          <button className={styles.folderDropItem} onClick={() => { onNewFolder(folder.id); setMenu(false) }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/><path d="M7 7v4M5 9h4"/></svg>
            새 폴더
          </button>
          {!isRoot && (
            <>
              <button className={styles.folderDropItem} onClick={() => { setRenaming(true); setMenu(false) }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/></svg>
                Rename
              </button>
              <button className={styles.folderDropItem} onClick={() => { onMoveFolder(folder.id); setMenu(false) }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/><path d="M9 8l2 2-2 2"/></svg>
                이동
              </button>
              <button className={styles.folderDropItem} onClick={() => { onLockFolder(folder.id, 'lock'); setMenu(false) }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/></svg>
                잠금
              </button>
              <div className={styles.folderDropDivider}/>
              <button className={styles.folderDropDelete} onClick={() => { onDeleteFolder(folder.id); setMenu(false) }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* 펼쳐진 상태 — 잠긴 폴더면 안 보임 */}
      {open && !isLocked && (
        <>
          {children.map(child => (
            <FolderNode
              key={child.id} folder={child} folders={folders} notes={notes}
              depth={depth + 1} activeFolderId={activeFolderId} activeNoteId={activeNoteId}
              onSelectFolder={onSelectFolder} onNoteClick={onNoteClick}
              onNewFolder={onNewFolder} onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder} onMoveFolder={onMoveFolder} onLockFolder={onLockFolder}
              onRenameNote={onRenameNote} onMoveNote={onMoveNote}
              onLockNote={onLockNote} onPinNote={onPinNote} onDeleteNote={onDeleteNote}
              unlockedFolderIds={unlockedFolderIds}
              onDragStart={onDragStart} onDragOver={onDragOver}
              onDrop={onDrop} onDragEnd={onDragEnd}
              dragOverId={dragOverId} dragItemId={dragItemId}
            />
          ))}

          {folderNotes.map(note => (
            <div key={note.id} className={styles.folderNode} style={{ position: 'relative' }}>
              <div
                className={`${styles.noteRow} ${activeNoteId === String(note.id) ? styles.noteActive : ''} ${dragItemId === note.id ? styles.folderDragging : ''}`}
                style={{ paddingLeft: 8 + (depth + 1) * 14 }}
                onClick={() => onNoteClick(note.id)}
                onDoubleClick={() => onNoteClick(note.id)}
                onContextMenu={e => { e.preventDefault(); setNoteMenu(note.id) }}
                draggable
                onDragStart={e => onDragStart(e, 'note', note.id)}
                onDragEnd={onDragEnd}
              >
                <span style={{ width: 12, flexShrink: 0 }} />
                <FileIcon />
                <span className={styles.folderName} style={{ opacity: note.locked ? 0.5 : 1, fontSize: 12 }}>
                  {note.locked ? '🔒 ' : ''}{note.title || '제목 없음'}
                </span>
                {note.pinned && (
                  <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" width="10" height="10" style={{ flexShrink: 0 }}>
                    <path d="M9 1L13 5L8 8L6 13L5 9L1 8L6 6Z"/>
                  </svg>
                )}
                <button className={styles.folderMenuBtn} onClick={e => { e.stopPropagation(); setNoteMenu(n => n === note.id ? null : note.id) }}>⋮</button>
              </div>

              {noteMenu === note.id && (
                <div className={styles.folderDropdown} ref={noteMenuRef} style={{ left: 8 + (depth + 1) * 14 }}>
                  <button className={styles.folderDropItem} onClick={() => { onPinNote(note.id); setNoteMenu(null) }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M9 1L13 5L8 8L6 13L5 9L1 8L6 6Z"/></svg>
                    {note.pinned ? '고정 해제' : '고정'}
                  </button>
                  <button className={styles.folderDropItem} onClick={() => { onRenameNote(note.id); setNoteMenu(null) }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/></svg>
                    Rename
                  </button>
                  <button className={styles.folderDropItem} onClick={() => { onMoveNote(note.id); setNoteMenu(null) }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/></svg>
                    이동
                  </button>
                  <button className={styles.folderDropItem} onClick={() => { onLockNote(note.id); setNoteMenu(null) }}>
                    {note.locked
                      ? <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2" strokeDasharray="2 2"/></svg>잠금 해제</>
                      : <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/></svg>잠금</>
                    }
                  </button>
                  <div className={styles.folderDropDivider}/>
                  <button className={styles.folderDropDelete} onClick={() => { onDeleteNote(note.id); setNoteMenu(null) }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/></svg>
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function Sidebar({
  notes, folders, activeFolderId, activeNoteId, trashCount,
  onSelectFolder, onNoteClick,
  onNewFolder, onRenameFolder, onDeleteFolder, onMoveFolder, onLockFolder,
  onRenameNote, onMoveNote, onLockNote, onPinNote, onDeleteNote,
  onEmptyTrash, unlockedFolderIds = [],
  onDragStart, onDragOver, onDrop, onDragEnd, dragOverId, dragItemId,
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [trashCtx, setTrashCtx] = useState(false)
  const trashRef = useRef(null)
  const isTrash = pathname === '/trash'
  const recent = [...notes].slice(-3).reverse()

  useEffect(() => {
    const fn = (e) => { if (trashRef.current && !trashRef.current.contains(e.target)) setTrashCtx(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const rootFolders = folders.filter(f => f.parentId === null)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoDot}>
          <svg viewBox="0 0 14 14" width="14" height="14" fill="white">
            <path d="M2 2h4v4H2zm6 0h4v4h-4zM2 8h4v4H2zm6 2h1v1h1v1h-1v1h-1v-1H7v-1h1z"/>
          </svg>
        </div>
        <span className={styles.logoText}>노트</span>
      </div>

      <div className={styles.scroll}>
        {recent.length > 0 && (
          <div className={styles.section}>
            <div className={styles.label}>최근 항목</div>
            {recent.map(note => (
              <div key={note.id} className={styles.item} onClick={() => onNoteClick(note.id)}>
                <div className={styles.dot} style={{ background: note.color }} />
                <span className={styles.itemText}>{note.title || '제목 없음'}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.label}>탐색기</div>
            <button className={styles.addTagBtn} onClick={() => onNewFolder('root')} title="새 폴더">
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 1v10M1 6h10"/>
              </svg>
            </button>
          </div>

          {rootFolders.map(f => (
            <FolderNode
              key={f.id} folder={f} folders={folders} notes={notes}
              depth={0} activeFolderId={activeFolderId} activeNoteId={activeNoteId}
              onSelectFolder={onSelectFolder} onNoteClick={onNoteClick}
              onNewFolder={onNewFolder} onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder} onMoveFolder={onMoveFolder} onLockFolder={onLockFolder}
              onRenameNote={onRenameNote} onMoveNote={onMoveNote}
              onLockNote={onLockNote} onPinNote={onPinNote} onDeleteNote={onDeleteNote}
              unlockedFolderIds={unlockedFolderIds}
              onDragStart={onDragStart} onDragOver={onDragOver}
              onDrop={onDrop} onDragEnd={onDragEnd}
              dragOverId={dragOverId} dragItemId={dragItemId}
            />
          ))}
        </div>
      </div>

      <div className={styles.trashSection}>
        <div
          className={`${styles.item} ${isTrash ? styles.itemActive : ''} ${styles.trashItem}`}
          onClick={() => router.push('/trash')}
          onContextMenu={e => { e.preventDefault(); setTrashCtx(true) }}
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13">
            <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/>
          </svg>
          <span className={styles.itemText}>휴지통</span>
          {trashCount > 0 && <span className={styles.tagCount}>{trashCount}</span>}
        </div>
        {trashCtx && (
          <div className={styles.tagDropdown} ref={trashRef} style={{ left: 12 }}>
            <button className={styles.tagDropDelete} onClick={() => { onEmptyTrash(); setTrashCtx(false) }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/></svg>
              휴지통 비우기
            </button>
          </div>
        )}
      </div>

      <div className={styles.user}>
        <div className={styles.avatar}>나</div>
        <div>
          <div className={styles.userName}>사용자</div>
          <div className={styles.userSub}>노트 {notes.length}개</div>
        </div>
      </div>
    </aside>
  )
}
