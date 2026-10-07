# Sorizava Archive (취업채용 관리)

정적 HTML + Supabase로 동작하는 속기사 취업지원 관리 프로그램입니다. 빌드 과정 없이 `index.html`을 그대로 배포합니다.

## 파일 구조

```
index.html                 화면 뼈대 + 스크립트 불러오기 (순서 중요)
css/app.css                공용 스타일
js/data/                   큰 고정 데이터 (지도, 속기사 명단, 연도별 취업자)
js/core/                   공용 기능
  config.js                Supabase 연결 설정
  auth.js                  로그인 / 권한 / 개인정보 마스킹
  state.js                 상수와 화면 상태 값
  utils.js                 날짜·검색·CSV 등 유틸
  data.js                  데이터 불러오기 / 실시간 연동 (바뀐 테이블만 다시 불러옴)
  ui.js                    모달, 토스트, PDF 출력
  layout.js                사이드바
  trash.js                 휴지통 / 삭제 되돌리기
js/views/                  화면별 코드 (dashboard, jobs, students, training, insights ...)
js/app.js                  화면 전환과 시작 (항상 마지막에 불러옴)
supabase/sql/              DB에 한 번 실행할 SQL
supabase/functions/        Supabase Edge Function (AI 요약)
```

화면 하나를 고칠 때는 `js/views/` 안의 해당 파일만 열면 됩니다.
새 파일을 추가하면 `index.html`의 `<script>` 목록에도 넣어 주세요 (`js/app.js`보다 앞).

## 데이터 불러오기

- 로그인 직후에는 8개 테이블을 동시에(병렬로) 불러옵니다.
- 저장·삭제나 다른 사람의 실시간 변경이 있으면 **바뀐 테이블만** 다시 불러옵니다.
  연쇄 삭제되는 테이블(학생→지원자·즐겨찾기, 공고→지원자, 기수→수강생)은 함께 갱신합니다.
  규칙은 `js/core/data.js`의 `DATA_TABLES`, `DATA_CASCADE`에 있습니다.

## 휴지통 (한 번만 설정)

Supabase 대시보드 → SQL Editor에서 `supabase/sql/deleted_items.sql`을 실행하세요.
실행 전에도 삭제 직후 "되돌리기"는 동작하지만, 휴지통 목록은 브라우저를 닫으면 사라집니다.

## AI 요약 (한 번만 설정)

AI 채용 브리핑의 "AI로 요약하기"는 Supabase Edge Function `ai-briefing`이 Claude API를 호출합니다.
API 키는 브라우저 코드에 넣지 않고 Supabase 시크릿으로만 보관합니다.

```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy ai-briefing
```

요약에는 집계 숫자와 공고명·일정만 보내고, 지원자 이름·연락처는 보내지 않습니다.
