# memo-app (Next.js)

로그인/회원가입 기반의 **개인 메모(노트) 앱**입니다.  
메모는 **Markdown 편집/미리보기**, **검색(하이라이트)**, **TOC(목차)**, **즐겨찾기**, **프로필 이미지 업로드**, **테마/폰트 설정**을 지원합니다.

---

## 주요 기능

- **인증/인가**
  - 회원가입: 비밀번호 **bcrypt 해싱** 저장
  - 로그인: **JWT 발급 → HttpOnly Cookie(token)** 저장
  - 로그아웃: token 쿠키 삭제
  - (미들웨어 + API 단에서) 인증되지 않으면 로그인 페이지로 리다이렉트/401 반환

- **메모 CRUD**
  - 메모 목록 조회, 생성, 수정, 삭제
  - 메모 **즐겨찾기(isFavorite)** 토글 및 정렬(즐겨찾기 우선)

- **Markdown 보기**
  - 편집(Edit) / 보기(View) 토글
  - `react-markdown` + `remark-gfm` + `rehype-raw`
  - `DOMPurify`로 렌더링 전 sanitize

- **검색**
  - 전체 메모 내용에서 단어 검색
  - 검색 결과 클릭 시 해당 페이지로 이동 + 검색어 **하이라이트 표시**

- **TOC(목차)**
  - Markdown의 heading을 파싱(`unified` + `remark-parse`)해 우측 사이드바에 TOC 생성
  - TOC 클릭 시 해당 heading으로 스크롤 이동

- **사용자 설정**
  - 테마: light/dark (`darkMode: 'class'`)
  - 폰트: Roboto / Open Sans / Lato

- **프로필 이미지**
  - 이미지 업로드(formidable로 multipart 파싱) → `public/uploads/`에 저장
  - DB(User.profileImageUrl)에 URL 저장 후 사용

---

## 기술 스택

- **Next.js 15 (App Router)**, React 18
- Tailwind CSS (+ typography)
- Prisma ORM + SQLite
- JWT(jsonwebtoken) + bcrypt
- Markdown: react-markdown, remark/rehype, DOMPurify
- 파일 업로드: formidable

---

## 프로젝트 구조

> 실제 zip에는 `.next/`(빌드 산출물)도 포함되어 있었지만, 일반적으로 GitHub에는 커밋하지 않고 `.gitignore` 처리합니다.

```txt
.
├─ prisma/
│  └─ schema.prisma                # DB 스키마(User, Page)
├─ public/
│  ├─ default-profile.png
│  ├─ fonts/                       # Roboto/OpenSans/Lato 폰트 파일
│  └─ uploads/                     # 런타임 생성(프로필 이미지 업로드 저장 위치)
├─ src/
│  ├─ lib/
│  │  └─ prisma.js                 # PrismaClient 싱글톤
│  └─ app/
│     ├─ layout.js                 # 루트 레이아웃(폰트/글로벌 CSS)
│     ├─ globals.css               # Tailwind + 폰트 로딩 + font1/2/3 클래스
│     ├─ page.js                   # 로그인 화면 (/)
│     ├─ register/page.js          # 회원가입 화면 (/register)
│     ├─ notes/page.js             # 메모 메인 화면 (/notes)
│     ├─ middleware.js             # /notes, /api/pages 인증 처리(매처 설정)
│     └─ api/
│        ├─ auth/
│        │  ├─ login/route.js      # POST /api/auth/login
│        │  ├─ logout/route.js     # POST /api/auth/logout
│        │  ├─ register/route.js   # POST /api/auth/register
│        │  ├─ profile-image/route.js          # GET /api/auth/profile-image
│        │  └─ upload-profile-image/route.js   # POST /api/auth/upload-profile-image
│        ├─ pages/
│        │  ├─ route.js            # GET/POST /api/pages
│        │  └─ [id]/route.js       # PUT/DELETE /api/pages/:id
│        └─ user/
│           └─ settings/route.js   # GET/POST /api/user/settings
├─ .env                            # DATABASE_URL, JWT_SECRET, NEXTAUTH_SECRET(값은 비공개로 관리)
├─ package.json
└─ tailwind.config.js
```

---

## 설치 방법

```
npm install
npx prisma migrate dev --name init
npm run dev
```
