'use client'
import { useState } from 'react'
import styles from './MoveModal.module.css'

function FolderOption({ folder, folders, depth, selected, onSelect }) {
  const children = folders.filter(f => f.parentId === folder.id)
  const [open, setOpen] = useState(depth === 0)

  return (
    <div>
      <div
        className={`${styles.folderRow} ${selected === folder.id ? styles.folderSelected : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => onSelect(folder.id)}
      >
        <span
          className={styles.arrow}
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        >{children.length > 0 ? (open ? '▾' : '▸') : ' '}</span>
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" width="13" height="13" style={{ flexShrink: 0, opacity: 0.6 }}>
          <path d="M1 4h12v8H1zM1 4l2-2h4l1 2"/>
        </svg>
        <span className={styles.folderName}>{folder.name}</span>
        {selected === folder.id && <span className={styles.check}>✓</span>}
      </div>
      {open && children.map(c => (
        <FolderOption key={c.id} folder={c} folders={folders} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  )
}

export default function MoveModal({ folders, currentFolderId, onMove, onCancel }) {
  const [selected, setSelected] = useState(currentFolderId || 'root')
  const rootFolders = folders.filter(f => f.parentId === null)

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <span className={styles.title}>폴더로 이동</span>
        </div>
        <div className={styles.folderList}>
          {rootFolders.map(f => (
            <FolderOption key={f.id} folder={f} folders={folders} depth={0} selected={selected} onSelect={setSelected} />
          ))}
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button className={styles.moveBtn} onClick={() => onMove(selected)}>이동</button>
        </div>
      </div>
    </div>
  )
}
