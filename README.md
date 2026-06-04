# 내 플래너 - 실행 가이드

## 1단계: Google Cloud Console 설정

1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성
3. **APIs & Services > Library** → "Google Calendar API" 검색 후 사용 설정
4. **APIs & Services > Credentials**
   - "CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
5. 클라이언트 ID, 클라이언트 시크릿 복사

---

## 2단계: 백엔드 환경 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열고 값 채우기:

```
GOOGLE_CLIENT_ID=복사한_클라이언트_ID
GOOGLE_CLIENT_SECRET=복사한_클라이언트_시크릿
SESSION_SECRET=아무_랜덤_문자열
```

VAPID 키 생성 (푸시 알림용):

```bash
npm install
node -e "const wp = require('web-push'); const k = wp.generateVAPIDKeys(); console.log('PUBLIC:', k.publicKey); console.log('PRIVATE:', k.privateKey);"
```

생성된 키를 `.env`에 입력:

```
VAPID_PUBLIC_KEY=출력된_공개키
VAPID_PRIVATE_KEY=출력된_비공개키
VAPID_EMAIL=mailto:your@email.com
```

---

## 3단계: 실행

**터미널 1 - 백엔드:**
```bash
cd backend
npm install
npm run dev
```

**터미널 2 - 프론트엔드:**
```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

---

## 4단계: 스마트폰에서 PWA 설치

1. 스마트폰 크롬으로 `http://[내PC_IP]:5173` 접속
2. 구글 로그인
3. 브라우저 메뉴 → "홈 화면에 추가"
4. 알림 허용

---

## 프로젝트 구조

```
project1/
  ├── backend/
  │   ├── server.js          # 서버 진입점
  │   ├── routes/            # API 라우터
  │   ├── services/          # 구글 캘린더, 푸시 알림 서비스
  │   ├── scheduler/         # 알림 스케줄러 (매 분 실행)
  │   └── db/                # SQLite 데이터베이스
  └── frontend/
      └── src/
          ├── pages/         # 대시보드, 캘린더, 할일, 메모
          ├── components/    # 레이아웃, 공통 컴포넌트
          └── hooks/         # PWA 푸시 알림 훅
```
