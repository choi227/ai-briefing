# 매일 브리핑 발행 절차

매일 아침 07:20 KST쯤 예약 작업이 이 문서대로 새 호를 만든다. 08:00 KST 전에 사이트에 올라가 있어야 한다.

## 0. 준비
- 오늘 날짜(KST)를 `YYYY-MM-DD`로 정한다. `public/data/<오늘>.json`이 이미 있으면 아무것도 하지 않고 끝낸다.
- `public/data/index.json`의 마지막 호를 열어 형식과 `issue` 번호를 확인한다. 새 호의 `issue`는 마지막 호 + 1.
- 형식의 기준은 `public/data/2026-11-17.json`이다. 키 이름과 구조를 그대로 따른다.

## 1. AI 뉴스 (`headline`, `news`, `oneline`)
- 최근 24시간(한국시간 전날 아침 이후) AI 뉴스를 웹 검색으로 찾는다. 모델 출시, 빅테크·반도체, 투자·상장, 규제·정책, 스타트업, 한국 소식을 고르게 본다.
- 가장 중요한 1건은 `headline`으로, 나머지 6~8건은 `news`로 넣는다. `news` 중 비중 큰 2건은 `featured: true`.
- 각 기사는 원문을 직접 읽고(웹페이지 읽기) 확인한 사실만 쓴다. 회사 자체 발표 수치는 "(회사 발표 기준)"처럼 밝힌다. 읽지 못한 기사는 넣지 않는다.
- `cat`은 `invest`, `chip`, `market`, `policy`, `startup`, `model`, `korea` 중 하나.
- 요약은 한국어 존댓말 1~2문장. `headline.figures`는 기사에 나온 핵심 숫자 3개.
- `oneline.text`는 오늘을 한 문장으로, `tags`는 3~4개.

## 2. 밤사이 미국 시장 (`market`)
- 전날 미국 장 마감 기준 나스닥, S&P 500, 필라델피아 반도체지수, 엔비디아의 등락률(%)을 기사에서 확인해 `change`에 숫자로 넣는다(하락은 음수).
- 확인 못 한 항목은 빼고, 주말·휴장일이면 `label`에 "최근 거래일(MM/DD) 종가"라고 쓴다.

## 3. GitHub 트렌딩 (`trending`)
- https://github.com/trending 을 웹페이지 읽기로 열어 목록 전체를 가져온다. (이 환경의 curl로는 github.com이 막혀 있다.)
- 오늘 받은 별(`today`) 많은 순 상위 10개(목록이 10개 미만이면 전부)를 `repos`에 넣는다. `total`은 누적 별, `lang`은 언어, `desc`는 한국어 한 줄 설명.
- `skill`은 Claude Code·Cursor·Codex 등에 붙이는 에이전트 스킬 저장소면 `true`.
- `categories.items`는 목록 전체를 "에이전트 스킬 / 에이전트 도구·인프라 / 기타"로 센 값, `title`은 "분야 분포 · 트렌딩 N개".
- `languages`는 목록 전체의 언어별 개수(많은 순).
- `insight`는 오늘 트렌딩에서 보이는 흐름 1~2문장. 강조할 단어 하나만 `<strong>`으로 감싸도 된다.

## 4. 오늘 해볼 것 (`todo`)
- 오늘 소식과 이어지는 5분짜리 행동 2~3개.

## 5. 저장과 배포
1. `public/data/<오늘>.json` 작성, `public/data/index.json`의 `issues` 배열 끝에 날짜 추가.
2. `python3 -c "import json;json.load(open(...))"`로 두 파일이 올바른 JSON인지 확인.
3. 이 두 파일만 커밋한다. 메시지: `브리핑 No.XXX (YYYY-MM-DD)`.
4. `main`에 push. Cloudflare가 1~2분 안에 https://ai-briefing.a2teosis.workers.dev 에 반영한다.

## 하지 말 것
- 사실을 지어내지 않는다. 확인 못 한 숫자는 빼거나 "원문 미확인"이라고 쓴다.
- `index.html`, `app.js` 등 화면 파일은 건드리지 않는다.
- 커밋 메시지에 `Claude-Session:` 링크 줄을 넣지 않는다. (저장소 주인 요청, 공개 저장소에 대화 링크를 남기지 않기 위함)
