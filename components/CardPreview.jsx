'use client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './CardPreview.module.css'

export default function CardPreview({ content }) {
  if (!content?.trim()) return <p className={styles.empty}>내용 없음</p>

  return (
    <div className={styles.preview}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 카드 크기에 맞게 축소된 렌더링
          h1: ({ children }) => <span className={styles.h1}>{children}</span>,
          h2: ({ children }) => <span className={styles.h2}>{children}</span>,
          h3: ({ children }) => <span className={styles.h3}>{children}</span>,
          p: ({ children }) => <span className={styles.p}>{children}</span>,
          strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
          em: ({ children }) => <em className={styles.em}>{children}</em>,
          li: ({ children }) => <span className={styles.li}>• {children}</span>,
          blockquote: ({ children }) => <span className={styles.blockquote}>{children}</span>,
          code: ({ children }) => <code className={styles.code}>{children}</code>,
          pre: ({ children }) => <span className={styles.pre}>{children}</span>,
          a: ({ children }) => <span className={styles.link}>{children}</span>,
          hr: () => <span className={styles.hr} />,
          input: ({ checked }) => <span className={styles.checkbox}>{checked ? '☑' : '☐'}</span>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
