'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './MobileNav.module.css'

export default function MobileNav({ notes, tags, activeTagId, onNoteClick, onTagFilter, onAddTag, onDeleteTag, onRenameTag, trashCount }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const recent = [...notes].slice(-3).reverse()

  return (
    <>
      {/* 상단 헤더 버튼 */}
      <button className={styles.menuToggle} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
          <path d="M2 4h14M2 9h14M2 14h14"/>
        </svg>
      </button>

      {/* 드로어 오버레이 */}
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
                <div className={styles.label}>태그</div>
                <button className={styles.addTagBtn} onClick={() => { onAddTag(); setOpen(false) }}>
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 1v10M1 6h10"/>
                  </svg>
                </button>
              </div>

              <div
                className={`${styles.item} ${!activeTagId ? styles.itemActive : ''}`}
                onClick={() => { onTagFilter(null); setOpen(false) }}
              >
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4">
                  <rect x="1" y="2" width="5" height="5" rx="1"/>
                  <rect x="8" y="2" width="5" height="5" rx="1"/>
                  <rect x="1" y="8" width="5" height="5" rx="1"/>
                  <rect x="8" y="8" width="5" height="5" rx="1"/>
                </svg>
                <span>전체</span>
              </div>

              {tags.map(tag => (
                <div
                  key={tag.id}
                  className={`${styles.item} ${activeTagId === tag.id ? styles.itemActive : ''}`}
                  onClick={() => { onTagFilter(tag.id); setOpen(false) }}
                >
                  <div className={styles.tagDot} style={{ background: tag.color }} />
                  <span className={styles.itemText}>{tag.name}</span>
                  <span className={styles.tagCount}>{notes.filter(n => n.tagId === tag.id).length}</span>
                </div>
              ))}
            </div>

            <div className={styles.section}>
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
