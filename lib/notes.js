export const COLORS = [
  '#276FBF', '#4CAF82', '#E97C5A',
  '#A07BE0', '#F5B731', '#E05A8A', '#5AB8E0',
]

export const TAG_COLORS = [
  '#276FBF', '#4CAF82', '#E97C5A', '#A07BE0',
  '#F5B731', '#E05A8A', '#5AB8E0', '#E24B4A',
  '#0C1821', '#888888',
]

export function loadNotes() {
  if (typeof window === 'undefined') return getDefaultNotes()
  try {
    const saved = localStorage.getItem('notes')
    return saved ? JSON.parse(saved) : getDefaultNotes()
  } catch { return getDefaultNotes() }
}

export function saveNotes(notes) {
  if (typeof window === 'undefined') return
  localStorage.setItem('notes', JSON.stringify(notes))
}

export function loadTags() {
  if (typeof window === 'undefined') return getDefaultTags()
  try {
    const saved = localStorage.getItem('tags')
    return saved ? JSON.parse(saved) : getDefaultTags()
  } catch { return getDefaultTags() }
}

export function saveTags(tags) {
  if (typeof window === 'undefined') return
  localStorage.setItem('tags', JSON.stringify(tags))
}

export function loadTrash() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('trash')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

export function saveTrash(trash) {
  if (typeof window === 'undefined') return
  localStorage.setItem('trash', JSON.stringify(trash))
}

function getDefaultNotes() {
  return [
    { id: 1, title: '프로젝트 기획서', body: '노트 앱 기획\n\nNext.js 기반으로 제작할 예정입니다.', locked: false, password: null, color: '#276FBF', tagId: null, folderId: 'root', pinned: false, date: '오늘' },
    { id: 2, title: '비밀 노트', body: '이것은 비밀 노트입니다.', locked: true, password: '1234', color: '#4CAF82', tagId: null, folderId: 'root', pinned: false, date: '어제' },
    { id: 3, title: '독서 메모', body: '원씽 — 단 하나의 가장 중요한 일에 집중하라', locked: false, password: null, color: '#E97C5A', tagId: null, folderId: 'f1', pinned: false, date: '3일 전' },
    { id: 4, title: '아이디어 노트', body: '떠오르는 아이디어들\n\n- AI 요약 기능', locked: false, password: null, color: '#A07BE0', tagId: null, folderId: 'root', pinned: false, date: '1주 전' },
    { id: 5, title: '오늘 할 일', body: 'Next.js 셋업\n컴포넌트 설계\nUI 기획 완성', locked: false, password: null, color: '#F5B731', tagId: null, folderId: 'f2', pinned: false, date: '오늘' },
  ]
}

function getDefaultTags() {
  return [
    { id: 101, name: '공부', color: '#276FBF' },
    { id: 102, name: '일상', color: '#4CAF82' },
    { id: 103, name: '업무', color: '#E97C5A' },
  ]
}

// ── 폴더 ──
export function loadFolders() {
  if (typeof window === 'undefined') return getDefaultFolders()
  try {
    const saved = localStorage.getItem('folders')
    return saved ? JSON.parse(saved) : getDefaultFolders()
  } catch { return getDefaultFolders() }
}

export function saveFolders(folders) {
  if (typeof window === 'undefined') return
  localStorage.setItem('folders', JSON.stringify(folders))
}

function getDefaultFolders() {
  return [
    { id: 'root', name: '노트', parentId: null },
    { id: 'f1', name: '공부', parentId: 'root' },
    { id: 'f2', name: '일상', parentId: 'root' },
    { id: 'f3', name: '업무', parentId: 'root' },
  ]
}
