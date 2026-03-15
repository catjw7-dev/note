'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

export default function Sidebar({ notes, tags, onNoteClick, onTagFilter, onAddTag, onDeleteTag, onRenameTag, onEmptyTrash, activeTagId, trashCount }) {
  const router = useRouter()
  const pathname = usePathname()
  const [tagMenuBtn, setTagMenuBtn] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [trashCtx, setTrashCtx] = useState(false)
  const menuRef = useRef(null)
  const renameRef = useRef(null)
  const trashRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setTagMenuBtn(null)
      if (trashRef.current && !trashRef.current.contains(e.target)) setTrashCtx(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus()
  }, [renamingId])

  const startRename = (tag) => {
    setTagMenuBtn(null)
    setRenamingId(tag.id)
    setRenameVal(tag.name)
  }

  const commitRename = () => {
    if (renameVal.trim()) onRenameTag(renamingId, renameVal.trim())
    setRenamingId(null)
    setRenameVal('')
  }

  const handleTagMenuBtn = (e, id) => {
    e.stopPropagation()
    setTagMenuBtn(prev => prev === id ? null : id)
  }

  const TagDropdown = ({ id }) => (
    <div className={styles.tagDropdown} ref={menuRef}>
      <button className={styles.tagDropItem} onClick={() => startRename(tags.find(t => t.id === id))}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/></svg>
        Rename
      </button>
      <div className={styles.tagDropDivider} />
      <button className={styles.tagDropDelete} onClick={() => { onDeleteTag(id); setTagMenuBtn(null) }}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/></svg>
        Delete
      </button>
    </div>
  )

  const recent = [...notes].slice(-3).reverse()
  const isTrash = pathname === '/trash'

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
        <div className={styles.section}>
          <div className={styles.label}>최근 항목</div>
          {recent.map(note => (
            <div key={note.id} className={styles.item} onClick={() => onNoteClick(note.id)}>
              <div className={styles.dot} style={{ background: note.color }} />
              <span className={styles.itemText}>{note.title || '제목 없음'}</span>
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.label}>태그</div>
            <button className={styles.addTagBtn} onClick={onAddTag}>
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 1v10M1 6h10"/>
              </svg>
            </button>
          </div>

          <div className={`${styles.item} ${!activeTagId && !isTrash ? styles.itemActive : ''}`} onClick={() => { onTagFilter(null); router.push('/') }}>
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4">
              <rect x="1" y="2" width="5" height="5" rx="1"/><rect x="8" y="2" width="5" height="5" rx="1"/>
              <rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/>
            </svg>
            <span className={styles.itemText}>전체</span>
          </div>

          {tags.map(tag => (
            <div key={tag.id} className={styles.tagItemWrap}>
              <div
                className={`${styles.item} ${activeTagId === tag.id && !isTrash ? styles.itemActive : ''}`}
                onClick={() => { if (renamingId !== tag.id) { onTagFilter(tag.id); router.push('/') } }}
              >
                <div className={styles.tagDot} style={{ background: tag.color }} />
                {renamingId === tag.id ? (
                  <input
                    ref={renameRef}
                    className={styles.renameInput}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className={styles.itemText}>{tag.name}</span>
                )}
                <span className={styles.tagCount}>{notes.filter(n => n.tagId === tag.id).length}</span>
                <button className={styles.tagMenuBtn} onClick={e => handleTagMenuBtn(e, tag.id)}>⋮</button>
              </div>
              {tagMenuBtn === tag.id && <TagDropdown id={tag.id} />}
            </div>
          ))}
        </div>

        {/* 휴지통 */}
        <div className={styles.section}>
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
