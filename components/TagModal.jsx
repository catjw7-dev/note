'use client'
import { useState } from 'react'
import { TAG_COLORS } from '../lib/notes'
import styles from './TagModal.module.css'

export default function TagModal({ tags, currentTagId, onAssign, onCreateTag, onCancel }) {
  const [mode, setMode] = useState('assign')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0])
  const [error, setError] = useState('')

  const handleCreate = () => {
    if (!newName.trim()) { setError('태그 이름을 입력해주세요'); return }
    const newTag = onCreateTag({ name: newName.trim(), color: newColor })
    if (newTag) onAssign(newTag.id)
    setNewName('')
    setNewColor(TAG_COLORS[0])
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.popup}>
        {mode === 'assign' ? (
          <>
            <div className={styles.header}>
              <span className={styles.title}>태그 설정</span>
              <button className={styles.createBtn} onClick={() => setMode('create')}>+ 새 태그</button>
            </div>
            <div className={styles.tagList}>
              <div
                className={`${styles.tagRow} ${!currentTagId ? styles.tagRowActive : ''}`}
                onClick={() => onAssign(null)}
              >
                <div className={styles.tagColorDot} style={{ background: '#ccc' }} />
                <span>태그 없음</span>
                {!currentTagId && <span className={styles.check}>✓</span>}
              </div>
              {tags.length === 0 && (
                <div className={styles.emptyMsg}>태그가 없어요. 새 태그를 만들어보세요!</div>
              )}
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className={`${styles.tagRow} ${currentTagId === tag.id ? styles.tagRowActive : ''}`}
                  onClick={() => onAssign(tag.id)}
                >
                  <div className={styles.tagColorDot} style={{ background: tag.color }} />
                  <span className={styles.tagName}>{tag.name}</span>
                  {currentTagId === tag.id && <span className={styles.check}>✓</span>}
                </div>
              ))}
            </div>
            <button className={styles.cancelBtn} onClick={onCancel}>닫기</button>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <button className={styles.backBtn} onClick={() => { setMode('assign'); setError('') }}>← 뒤로</button>
              <span className={styles.title}>새 태그</span>
            </div>
            <div className={styles.createForm}>
              <input
                className={styles.nameInput}
                type="text"
                placeholder="태그 이름"
                value={newName}
                onChange={e => { setNewName(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.colorLabel}>색깔 선택</div>
              <div className={styles.colorGrid}>
                {TAG_COLORS.map(c => (
                  <div
                    key={c}
                    className={`${styles.colorSwatch} ${newColor === c ? styles.colorSelected : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
              <div className={styles.preview}>
                <div className={styles.previewDot} style={{ background: newColor }} />
                <span style={{ color: newColor, fontWeight: 500 }}>{newName || '태그 이름'}</span>
              </div>
            </div>
            <button className={styles.confirmBtn} onClick={handleCreate}>만들고 할당하기</button>
            <button className={styles.cancelBtn} onClick={() => setMode('assign')}>취소</button>
          </>
        )}
      </div>
    </div>
  )
}
