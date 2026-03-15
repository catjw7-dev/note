'use client'
import { useRef, useState } from 'react'
import styles from './PinModal.module.css'

export default function PinModal({ password, onSuccess, onCancel }) {
  const [val, setVal] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef()

  const confirm = () => {
    if (val === password) {
      onSuccess()
    } else {
      setError(true)
      setVal('')
      inputRef.current?.focus()
      setTimeout(() => setError(false), 1200)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.icon}>
          <svg viewBox="0 0 18 18" fill="none" stroke="#276FBF" strokeWidth="1.6" width="18" height="18">
            <rect x="3" y="8" width="12" height="9" rx="2"/>
            <path d="M6 8V5.5a3 3 0 016 0V8"/>
          </svg>
        </div>
        <div className={styles.title}>잠긴 노트</div>
        <div className={styles.sub}>비밀번호를 입력하면<br/>노트를 열 수 있어요</div>
        <input
          ref={inputRef}
          className={`${styles.pwInput} ${error ? styles.pwError : ''}`}
          type="password"
          placeholder="비밀번호"
          value={val}
          onChange={e => { setVal(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && confirm()}
          autoFocus
        />
        {error && <div className={styles.errorMsg}>비밀번호가 틀렸어요</div>}
        <button className={styles.btn} onClick={confirm}>확인</button>
        <span className={styles.cancel} onClick={onCancel}>취소</span>
      </div>
    </div>
  )
}
