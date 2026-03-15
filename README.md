# 노트 앱

Next.js 14 + PWA 기반 노트 앱

## 시작하기

```bash
npm install
npm run dev
```

## PWA 배포 방법 (폰에서 앱처럼 쓰기)

### 1. 아이콘 생성
```bash
cd public/icons
npm install sharp
node generate-icons.js
```
icon-192.png, icon-512.png 파일이 생성됩니다.

### 2. Vercel 배포 (무료)
```bash
npm install -g vercel
vercel
```
배포된 URL을 폰 브라우저로 열면 됩니다.

### 3. 폰에 설치
- **Android**: Chrome에서 접속 → 브라우저 메뉴 → "홈 화면에 추가"
- **iPhone**: Safari에서 접속 → 공유 버튼 → "홈 화면에 추가"

> PWA는 개발 모드(npm run dev)에서는 비활성화됩니다.
> `npm run build && npm start` 로 실행해야 서비스워커가 동작합니다.

## 파일 구조

```
app/
  page.jsx              # 갤러리 홈
  layout.jsx            # PWA 메타태그 포함
  globals.css
  note/[id]/
    page.jsx            # 노트 에디터
    page.module.css

components/
  Sidebar.jsx           # 데스크탑 사이드바
  MobileNav.jsx         # 모바일 드로어 메뉴
  PinModal.jsx          # 노트 열기 비번
  LockModal.jsx         # 잠금/해제 설정
  TagModal.jsx          # 태그 선택/생성

public/
  manifest.json         # PWA 설정
  icons/
    icon.svg
    generate-icons.js   # 아이콘 생성 스크립트

lib/
  notes.js              # localStorage 저장/불러오기
```

## 기능
- 갤러리 형태 노트 목록
- 노트 생성 / 편집 / 자동저장
- 노트 잠금 (비밀번호)
- 제목/내용 블러 처리
- 태그 시스템 (생성, 삭제, rename, 색깔)
- 노트 rename / delete
- 우클릭 컨텍스트 메뉴
- PWA (모바일 홈 화면 설치)
- 모바일 반응형 (드로어 메뉴)

## 색상
- 흰색: #F2F4FF  
- 검정: #0C1821  
- 파랑: #276FBF
