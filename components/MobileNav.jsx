'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './MobileNav.module.css'

function FolderItem({ folder, folders, notes, depth, activeFolderId, activeNoteId, onSelect, onClose, onNoteClick }) {
  const children = folders.filter(f => f.parentId === folder.id)
  const folderNotes = notes.filter(n => n.folderId === folder.id)
  const hasChildren = children.length > 0 || folderNotes.length > 0
  const [open, setOpen] = useState(depth === 0)

  return (
    <div>
      <div
        className={`${styles.item} ${activeFolderId === folder.id ? styles.itemActive : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => { onSelect(folder.id); onClose() }}
      >
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 12, cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}>
          {hasChildren ? (open ? '▾' : '▸') : ' '}
        </span>
        <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" width="13" height="13" style={{ flexShrink: 0 }}>
          <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/>
        </svg>
        <span className={styles.itemText}>{folder.name}</span>
        <span className={styles.tagCount}>{folderNotes.length || ''}</span>
      </div>
      {open && (
        <>
          {children.map(c => (
            <FolderItem key={c.id} folder={c} folders={folders} notes={notes}
              depth={depth + 1} activeFolderId={activeFolderId} activeNoteId={activeNoteId}
              onSelect={onSelect} onClose={onClose} onNoteClick={onNoteClick} />
          ))}
          {folderNotes.map(note => (
            <div
              key={note.id}
              className={`${styles.item} ${activeNoteId === String(note.id) ? styles.itemActive : ''}`}
              style={{ paddingLeft: 8 + (depth + 1) * 14 }}
              onClick={() => { onNoteClick(note.id); onClose() }}
            >
              <span style={{ width: 12, flexShrink: 0 }} />
              <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" width="12" height="12" style={{ flexShrink: 0 }}>
                <path d="M3 1h6l3 3v9H3V1z"/><path d="M9 1v3h3"/>
              </svg>
              <span className={styles.itemText} style={{ fontSize: 12, opacity: note.locked ? 0.5 : 1 }}>
                {note.locked ? '🔒 ' : ''}{note.title || '제목 없음'}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function MobileNav({ notes, folders, activeFolderId, activeNoteId, trashCount, onNoteClick, onSelectFolder, onNewFolder }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const recent = [...notes].slice(-3).reverse()
  const rootFolders = folders.filter(f => f.parentId === null)

  return (
    <>
      <button className={styles.menuToggle} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
          <path d="M2 4h14M2 9h14M2 14h14"/>
        </svg>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.logoRow}>
                <div className={styles.logoDot}>
                  <svg viewBox="0 0 14 14" width="14" height="14" fill="white">
                    <path d="M2 2h4v4H2zm6 0h4v4h-4zM2 8h4v4H2zm6 2h1v1h1v1h-1v1h-1v-1H7v-1h1z"/>
                  </svg>
                </div>
                <span className={styles.logoText}>노트</span>
              </div>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className={styles.drawerScroll}>
              <div className={styles.section}>
                <div className={styles.label}>최근 항목</div>
                {recent.map(note => (
                  <div key={note.id} className={styles.item} onClick={() => { onNoteClick(note.id); setOpen(false) }}>
                    <div className={styles.dot} style={{ background: note.color }} />
                    <span className={styles.itemText}>{note.title || '제목 없음'}</span>
                  </div>
                ))}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.label}>폴더</div>
                  <button className={styles.addTagBtn} onClick={() => { onNewFolder('root'); setOpen(false) }}>
                    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 1v10M1 6h10"/>
                    </svg>
                  </button>
                </div>
                {rootFolders.map(f => (
                  <FolderItem key={f.id} folder={f} folders={folders} notes={notes} depth={0}
                    activeFolderId={activeFolderId} activeNoteId={activeNoteId}
                    onSelect={onSelectFolder} onClose={() => setOpen(false)} onNoteClick={onNoteClick} />
                ))}
              </div>
            </div>

            <div className={styles.trashSection}>
              <div className={styles.item} onClick={() => { router.push('/trash'); setOpen(false) }}>
                <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" width="13" height="13">
                  <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/>
                </svg>
                <span className={styles.itemText}>휴지통</span>
                {trashCount > 0 && <span className={styles.tagCount}>{trashCount}</span>}
              </div>
            </div>

            <div className={styles.user}>
              <div className={styles.avatar}>나</div>
              <div>
                <div className={styles.userName}>사용자</div>
                <div className={styles.userSub}>노트 {notes.length}개</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
