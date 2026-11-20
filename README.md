# AI 모닝 브리핑

매일 아침 8시(KST), 밤사이 AI 뉴스와 GitHub 트렌딩을 정리하는 정적 사이트. Cloudflare Workers(정적 자산)로 배포한다.

- `public/index.html`, `public/app.js`: 화면 (빌드 없음)
- `public/data/index.json`: 발행된 날짜 목록
- `public/data/YYYY-MM-DD.json`: 그날 브리핑 데이터
- `wrangler.jsonc`: Cloudflare 배포 설정

새 호 발행 = `public/data/`에 JSON 하나 추가하고 `index.json`에 날짜를 넣은 뒤 main에 커밋. Cloudflare가 자동으로 다시 배포한다.
특정 날짜는 `/#2026-11-17` 처럼 열 수 있다.
