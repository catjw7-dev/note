'use client'
import { useState } from 'react'
import styles from './FolderLockModal.module.css'

export default function FolderLockModal({ mode, onSuccess, onCancel }) {
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [error, setError] = useState('')
  const isLock = mode === 'lock'

  const confirm = () => {
    setError('')
    if (!pw.trim()) { setError('비밀번호를 입력해주세요'); return }
    if (isLock && pw !== pwConfirm) { setError('비밀번호가 일치하지 않아요'); return }
    onSuccess({ password: pw })
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.popup}>
        <div className={styles.icon} data-unlock={String(!isLock)}>
          {isLock
            ? <svg viewBox="0 0 18 18" fill="none" stroke="#276FBF" strokeWidth="1.6" width="18" height="18"><rect x="3" y="8" width="12" height="9" rx="2"/><path d="M6 8V5.5a3 3 0 016 0V8"/></svg>
            : <svg viewBox="0 0 18 18" fill="none" stroke="#4CAF82" strokeWidth="1.6" width="18" height="18"><rect x="3" y="8" width="12" height="9" rx="2"/><path d="M6 8V5.5a3 3 0 016 0V8" strokeDasharray="3 2"/></svg>
          }
        </div>
        <div className={styles.title}>{isLock ? '폴더 잠금' : '폴더 잠금 해제'}</div>
        <div className={styles.sub}>{isLock ? '이 폴더에 비밀번호를 설정해요' : '비밀번호를 입력하면 잠금이 풀려요'}</div>
        <div className={styles.fields}>
          <input className={styles.input} type="password"
            placeholder={isLock ? '비밀번호' : '현재 비밀번호'}
            value={pw} onChange={e => { setPw(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (isLock ? document.getElementById('flock-confirm')?.focus() : confirm())}
            autoFocus
          />
          {isLock && (
            <input id="flock-confirm" className={styles.input} type="password"
              placeholder="비밀번호 확인"
              value={pwConfirm} onChange={e => { setPwConfirm(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && confirm()}
            />
          )}
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button className={`${styles.btn} ${!isLock ? styles.btnGreen : ''}`} onClick={confirm}>
          {isLock ? '잠금 설정' : '잠금 해제'}
        </button>
        <span className={styles.cancel} onClick={onCancel}>취소</span>
      </div>
    </div>
  )
}
