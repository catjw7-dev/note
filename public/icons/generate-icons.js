// 이 파일을 실행하면 아이콘이 생성됩니다
// node generate-icons.js
// (sharp 패키지 필요: npm install sharp)

const sharp = require('sharp')

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#0C1821"/>
  <rect x="80" y="80" width="160" height="160" rx="20" fill="#276FBF"/>
  <rect x="272" y="80" width="160" height="160" rx="20" fill="#276FBF"/>
  <rect x="80" y="272" width="160" height="160" rx="20" fill="#276FBF"/>
  <rect x="272" y="312" width="40" height="40" rx="8" fill="#276FBF"/>
  <rect x="352" y="272" width="40" height="40" rx="8" fill="#276FBF"/>
  <rect x="312" y="352" width="40" height="40" rx="8" fill="#276FBF"/>
</svg>
`

sharp(Buffer.from(svg)).resize(192, 192).png().toFile('icon-192.png')
sharp(Buffer.from(svg)).resize(512, 512).png().toFile('icon-512.png')

console.log('아이콘 생성 완료!')
