'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

// 파일 아이콘
function FileIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" width="12" height="12" style={{ flexShrink: 0 }}>
      <path d="M3 1h6l3 3v9H3V1z"/><path d="M9 1v3h3"/>
    </svg>
  )
}

// 폴더 아이콘
function FolderIcon({ open }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" width="13" height="13" style={{ flexShrink: 0 }}>
      <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/>
    </svg>
  )
}

// 컨텍스트 메뉴 (폴더용)
function FolderContextMenu({ onNewFolder, onRename, onDelete, isRoot, style, menuRef }) {
  return (
    <div className={styles.folderDropdown} ref={menuRef} style={style}>
      <button className={styles.folderDropItem} onClick={onNewFolder}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
          <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/><path d="M7 7v4M5 9h4"/>
        </svg>
        새 폴더
      </button>
      {!isRoot && (
        <>
          <button className={styles.folderDropItem} onClick={onRename}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
              <path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/>
            </svg>
            Rename
          </button>
          <div className={styles.folderDropDivider}/>
          <button className={styles.folderDropDelete} onClick={onDelete}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
              <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/>
            </svg>
            Delete
          </button>
        </>
      )}
    </div>
  )
}

// 노트용 컨텍스트 메뉴
function NoteContextMenu({ note, onRename, onMove, onLock, onPin, onDelete, menuRef, style }) {
  return (
    <div className={styles.folderDropdown} ref={menuRef} style={style}>
      <button className={styles.folderDropItem} onClick={onPin}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
          <path d="M9 1L13 5L8 8L6 13L5 9L1 8L6 6Z"/>
        </svg>
        {note?.pinned ? '고정 해제' : '고정'}
      </button>
      <button className={styles.folderDropItem} onClick={onRename}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
          <path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/>
        </svg>
        Rename
      </button>
      <button className={styles.folderDropItem} onClick={onMove}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
          <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/>
        </svg>
        이동
      </button>
      <button className={styles.folderDropItem} onClick={onLock}>
        {note?.locked
          ? <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2" strokeDasharray="2 2"/></svg>잠금 해제</>
          : <><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><rect x="2" y="6" width="10" height="7" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/></svg>잠금</>
        }
      </button>
      <div className={styles.folderDropDivider}/>
      <button className={styles.folderDropDelete} onClick={onDelete}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
          <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/>
        </svg>
        삭제
      </button>
    </div>
  )
}

// 폴더 노드 (재귀)
function FolderNode({ folder, folders, notes, depth, activeFolderId, activeNoteId,
  onSelectFolder, onNoteClick,
  onNewFolder, onRenameFolder, onDeleteFolder,
  onRenameNote, onMoveNote, onLockNote, onPinNote, onDeleteNote,
}) {
  const children = folders.filter(f => f.parentId === folder.id)
  const folderNotes = notes.filter(n => n.folderId === folder.id)
  const isRoot = folder.id === 'root'
  const [open, setOpen] = useState(isRoot)
  const [menu, setMenu] = useState(false) // 'folder' | false
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(folder.name)
  const [noteMenu, setNoteMenu] = useState(null) // noteId
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

  return (
    <div className={styles.folderNode}>
      {/* 폴더 행 */}
      <div
        className={`${styles.folderRow} ${activeFolderId === folder.id ? styles.folderActive : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => { setOpen(o => !o); onSelectFolder(folder.id) }}
        onContextMenu={e => { e.preventDefault(); setMenu('folder') }}
      >
        <span className={`${styles.folderArrow} ${open && hasChildren ? styles.folderArrowOpen : ''}`}
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}>
          {hasChildren ? '›' : ' '}
        </span>
        <FolderIcon open={open} />
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
          <span className={styles.folderName}>{folder.name}</span>
        )}
        <button className={styles.folderMenuBtn} onClick={e => { e.stopPropagation(); setMenu(m => m ? false : 'folder') }}>⋮</button>
      </div>

      {menu === 'folder' && (
        <FolderContextMenu
          menuRef={menuRef}
          style={{ left: 8 + depth * 14 }}
          isRoot={isRoot}
          onNewFolder={() => { onNewFolder(folder.id); setMenu(false) }}
          onRename={() => { setRenaming(true); setMenu(false) }}
          onDelete={() => { onDeleteFolder(folder.id); setMenu(false) }}
        />
      )}

      {/* 펼쳐진 상태에서 하위 폴더 + 노트 */}
      {open && (
        <>
          {children.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              folders={folders}
              notes={notes}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              activeNoteId={activeNoteId}
              onSelectFolder={onSelectFolder}
              onNoteClick={onNoteClick}
              onNewFolder={onNewFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onRenameNote={onRenameNote}
              onMoveNote={onMoveNote}
              onLockNote={onLockNote}
              onPinNote={onPinNote}
              onDeleteNote={onDeleteNote}
            />
          ))}

          {/* 노트 파일들 */}
          {folderNotes.map(note => (
            <div key={note.id} className={styles.folderNode} style={{ position: 'relative' }}>
              <div
                className={`${styles.noteRow} ${activeNoteId === note.id ? styles.noteActive : ''}`}
                style={{ paddingLeft: 8 + (depth + 1) * 14 }}
                onClick={() => onNoteClick(note.id)}
                onContextMenu={e => { e.preventDefault(); setNoteMenu(note.id) }}
              >
                <span style={{ width: 12, flexShrink: 0 }} />
                <FileIcon />
                <span className={styles.folderName} style={{ opacity: note.locked ? 0.5 : 1 }}>
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
                <NoteContextMenu
                  note={note}
                  menuRef={noteMenuRef}
                  style={{ left: 8 + (depth + 1) * 14 }}
                  onPin={() => { onPinNote(note.id); setNoteMenu(null) }}
                  onRename={() => { onRenameNote(note.id); setNoteMenu(null) }}
                  onMove={() => { onMoveNote(note.id); setNoteMenu(null) }}
                  onLock={() => { onLockNote(note.id); setNoteMenu(null) }}
                  onDelete={() => { onDeleteNote(note.id); setNoteMenu(null) }}
                />
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
  onNewFolder, onRenameFolder, onDeleteFolder,
  onRenameNote, onMoveNote, onLockNote, onPinNote, onDeleteNote,
  onEmptyTrash,
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
        {/* 최근 항목 */}
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

        {/* 폴더 트리 */}
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
              key={f.id}
              folder={f}
              folders={folders}
              notes={notes}
              depth={0}
              activeFolderId={activeFolderId}
              activeNoteId={activeNoteId}
              onSelectFolder={onSelectFolder}
              onNoteClick={onNoteClick}
              onNewFolder={onNewFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onRenameNote={onRenameNote}
              onMoveNote={onMoveNote}
              onLockNote={onLockNote}
              onPinNote={onPinNote}
              onDeleteNote={onDeleteNote}
            />
          ))}
        </div>
      </div>

      {/* 휴지통 */}
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
