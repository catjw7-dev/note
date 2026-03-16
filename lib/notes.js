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
  return []
}

function getDefaultTags() {
  return []
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
    { id: 'root', name: '노트', parentId: null, color: '#276FBF', locked: false, password: null },
  ]
}

export const FOLDER_COLORS = [
  '#276FBF', '#4CAF82', '#E97C5A', '#A07BE0',
  '#F5B731', '#E05A8A', '#5AB8E0', '#E24B4A',
]

// 중복 이름 방지 넘버링
export function uniqueName(name, existingNames) {
  if (!existingNames.includes(name)) return name
  let i = 2
  while (existingNames.includes(`${name} (${i})`)) i++
  return `${name} (${i})`
}
