'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

function FolderNode({ folder, folders, notes, depth, activeFolderId, onSelectFolder, onRenameFolder, onDeleteFolder, onNewFolder }) {
  const children = folders.filter(f => f.parentId === folder.id)
  const noteCount = notes.filter(n => n.folderId === folder.id).length
  const [open, setOpen] = useState(depth === 0)
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(folder.name)
  const menuRef = useRef(null)
  const renameRef = useRef(null)
  const isRoot = folder.id === 'root'

  useEffect(() => {
    if (renaming && renameRef.current) renameRef.current.focus()
  }, [renaming])

  useEffect(() => {
    const fn = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const commitRename = () => {
    if (renameVal.trim()) onRenameFolder(folder.id, renameVal.trim())
    setRenaming(false)
  }

  return (
    <div className={styles.folderNode}>
      <div
        className={`${styles.folderRow} ${activeFolderId === folder.id ? styles.folderActive : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => { setOpen(o => !o); onSelectFolder(folder.id) }}
        onContextMenu={e => { e.preventDefault(); setMenu(true) }}
      >
        {/* 화살표 */}
        <span className={`${styles.folderArrow} ${open ? styles.folderArrowOpen : ''}`}>
          {children.length > 0 ? '›' : ' '}
        </span>
        {/* 폴더 아이콘 */}
        <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" width="13" height="13" style={{ flexShrink: 0 }}>
          {open
            ? <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/>
            : <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/>
          }
        </svg>

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

        <span className={styles.folderCount}>{noteCount > 0 ? noteCount : ''}</span>

        {/* ⋮ 버튼 */}
        <button className={styles.folderMenuBtn} onClick={e => { e.stopPropagation(); setMenu(m => !m) }}>⋮</button>
      </div>

      {/* 드롭다운 */}
      {menu && (
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
              <div className={styles.folderDropDivider} />
              <button className={styles.folderDropDelete} onClick={() => { onDeleteFolder(folder.id); setMenu(false) }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* 하위 폴더 */}
      {open && children.map(child => (
        <FolderNode
          key={child.id}
          folder={child}
          folders={folders}
          notes={notes}
          depth={depth + 1}
          activeFolderId={activeFolderId}
          onSelectFolder={onSelectFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onNewFolder={onNewFolder}
        />
      ))}
    </div>
  )
}

export default function Sidebar({ notes, folders, activeFolderId, trashCount, onSelectFolder, onRenameFolder, onDeleteFolder, onNewFolder, onEmptyTrash, onNoteClick }) {
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
        <div className={styles.section}>
          <div className={styles.label}>최근 항목</div>
          {recent.map(note => (
            <div key={note.id} className={styles.item} onClick={() => onNoteClick(note.id)}>
              <div className={styles.dot} style={{ background: note.color }} />
              <span className={styles.itemText}>{note.title || '제목 없음'}</span>
            </div>
          ))}
        </div>

        {/* 폴더 트리 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.label}>폴더</div>
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
              onSelectFolder={onSelectFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onNewFolder={onNewFolder}
            />
          ))}
        </div>
      </div>

      {/* 휴지통 — 유저 바로 위 고정 */}
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
