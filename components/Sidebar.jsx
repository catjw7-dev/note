'use client'
import { useState, useRef, useEffect } from 'react'
import styles from './Sidebar.module.css'

export default function Sidebar({ notes, tags, onNoteClick, onTagFilter, onAddTag, onDeleteTag, onRenameTag, activeTagId }) {
  const [tagMenu, setTagMenu] = useState(null) // { id, x, y } — 우클릭
  const [tagMenuBtn, setTagMenuBtn] = useState(null) // id — ⋮ 버튼
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const menuRef = useRef(null)
  const renameRef = useRef(null)

  const recent = [...notes].slice(-3).reverse()

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setTagMenu(null)
        setTagMenuBtn(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus()
  }, [renamingId])

  const startRename = (tag) => {
    setTagMenu(null)
    setTagMenuBtn(null)
    setRenamingId(tag.id)
    setRenameVal(tag.name)
  }

  const commitRename = () => {
    if (renameVal.trim()) onRenameTag(renamingId, renameVal.trim())
    setRenamingId(null)
    setRenameVal('')
  }

  const handleTagContextMenu = (e, id) => {
    e.preventDefault()
    setTagMenuBtn(null)
    setTagMenu({ id, x: e.clientX, y: e.clientY })
  }

  const handleTagMenuBtn = (e, id) => {
    e.stopPropagation()
    setTagMenu(null)
    setTagMenuBtn(prev => prev === id ? null : id)
  }

  const TagDropdown = ({ id }) => (
    <div className={styles.tagDropdown} ref={menuRef}>
      <button className={styles.tagDropItem} onClick={() => { startRename(tags.find(t => t.id === id)) }}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
          <path d="M2 10V7.5L9.5 1l2.5 2.5L4.5 11H2z"/>
        </svg>
        Rename
      </button>
      <div className={styles.tagDropDivider} />
      <button className={styles.tagDropDelete} onClick={() => { onDeleteTag(id); setTagMenuBtn(null); setTagMenu(null) }}>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12">
          <path d="M2 3.5h10M5.5 3.5V2.5h3v1M3.5 3.5l.5 8h6l.5-8"/>
        </svg>
        Delete
      </button>
    </div>
  )

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
            <button className={styles.addTagBtn} onClick={onAddTag} title="새 태그">
              <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 1v10M1 6h10"/>
              </svg>
            </button>
          </div>

          <div
            className={`${styles.item} ${!activeTagId ? styles.itemActive : ''}`}
            onClick={() => onTagFilter(null)}
          >
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4">
              <rect x="1" y="2" width="5" height="5" rx="1"/>
              <rect x="8" y="2" width="5" height="5" rx="1"/>
              <rect x="1" y="8" width="5" height="5" rx="1"/>
              <rect x="8" y="8" width="5" height="5" rx="1"/>
            </svg>
            <span className={styles.itemText}>전체</span>
          </div>

          {tags.map(tag => (
            <div key={tag.id} className={styles.tagItemWrap} onContextMenu={e => handleTagContextMenu(e, tag.id)}>
              <div
                className={`${styles.item} ${activeTagId === tag.id ? styles.itemActive : ''}`}
                onClick={() => { if (renamingId !== tag.id) onTagFilter(tag.id) }}
              >
                <div className={styles.tagDot} style={{ background: tag.color }} />
                {renamingId === tag.id ? (
                  <input
                    ref={renameRef}
                    className={styles.renameInput}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') { setRenamingId(null) }
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className={styles.itemText}>{tag.name}</span>
                )}
                <span className={styles.tagCount}>{notes.filter(n => n.tagId === tag.id).length}</span>
                <button
                  className={styles.tagMenuBtn}
                  onClick={e => handleTagMenuBtn(e, tag.id)}
                >⋮</button>
              </div>

              {tagMenuBtn === tag.id && <TagDropdown id={tag.id} />}
            </div>
          ))}
        </div>
      </div>

      {/* 우클릭 컨텍스트 메뉴 */}
      {tagMenu && (
        <div
          className={styles.tagContextMenu}
          ref={menuRef}
          style={{ top: tagMenu.y, left: tagMenu.x }}
        >
          <TagDropdown id={tagMenu.id} />
        </div>
      )}

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
