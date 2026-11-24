# 매일 브리핑 발행 절차

매일 아침 09:20 KST에 예약 작업이 이 문서대로 새 호를 만든다. 09:40 KST 전에 사이트에 올라가 있어야 한다.

## 0. 준비
- 오늘 날짜(KST)를 `YYYY-MM-DD`로 정한다. `public/data/<오늘>.json`이 이미 있으면 아무것도 하지 않고 끝낸다.
- `public/data/index.json`의 마지막 호를 열어 형식과 `issue` 번호를 확인한다. 새 호의 `issue`는 마지막 호 + 1.
- 형식의 기준은 `public/data/2026-11-20.json`이다. 키 이름과 구조를 그대로 따른다.

## 0-1. 보조 소스 한 번에 모으기
- `pip install -q trendspyg` 후 `python3 scripts/collect.py --out /tmp/sources.json` 을 실행한다.
- 결과의 `errors`에 적힌 소스는 그날 빼고 계속한다.

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

## 2-1. AI 검색 관심도 (`searchtrend`)
- `/tmp/sources.json`의 `trends`를 그대로 옮긴다: `dates`, `keywords`(name·series·avg, 숫자 수정 금지), `rising`은 `rising_ai`.
- `label`: "AI 서비스 검색 관심도 · 구글 트렌드 한국 · 최근 7일". `trends`가 실패했으면 이 키를 넣지 않는다.

## 3. GitHub 트렌딩 (`trending`)
- `git pull` 후 `public/data/trending-raw.json` 을 읽는다. GitHub Actions(트렌딩 수집)가 매일 09:05 KST에 github.com/trending 을 GitHub 서버에서 직접 읽어 저장한 파일이다. `fetched`가 오늘 날짜인지 먼저 확인한다.
- 오늘 날짜가 아니면(작업 실패 등) `gh workflow run trending.yml -R choi227/ai-briefing` 로 한 번 다시 돌리고 2~3분 뒤 다시 pull 한다. 그래도 안 되면 그때만 https://github.com/trending 을 웹페이지 읽기로 열되, 캐시된 옛 목록일 수 있으니 전날 호와 같으면 insight에 갱신 지연을 밝힌다. (이 환경의 curl로는 github.com이 막혀 있다.)
- `label`은 "github.com/trending 전체 N개 · MM/DD HH:MM 수집" (N과 시각은 trending-raw.json 기준).
- 오늘 받은 별(`today`) 많은 순 상위 10개(목록이 10개 미만이면 전부)를 `repos`에 넣는다. `total`은 누적 별, `lang`은 언어, `desc`는 한국어 한 줄 설명.
- `skill`은 Claude Code·Cursor·Codex 등에 붙이는 에이전트 스킬 저장소면 `true`.
- `categories.items`는 목록 전체를 "에이전트 스킬 / 에이전트 도구·인프라 / 기타"로 센 값, `title`은 "분야 분포 · 트렌딩 N개".
- `languages`는 목록 전체의 언어별 개수(많은 순).
- `insight`는 오늘 트렌딩에서 보이는 흐름 1~2문장. 강조할 단어 하나만 `<strong>`으로 감싸도 된다.

## 3-1. 커뮤니티 화제 (`community`)
- Hacker News: https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30 을 웹페이지 읽기로 열어, AI·LLM·머신러닝 관련 글만 점수(points) 높은 순 최대 5개. `title`은 원제, `title_ko`는 한국어 번역, `discuss`는 `https://news.ycombinator.com/item?id=<objectID>`.
- GeekNews: https://news.hada.io/ 를 웹페이지 읽기로 열어 AI 관련 글 최대 3개. `title`과 `title_ko`는 같은 한국어 원제, `discuss`는 `https://news.hada.io/topic?id=...`.
- `source`는 `hn` 또는 `gn`. `points`, `comments`는 페이지에 보인 숫자 그대로. `label`에는 수집 시각(KST)을 적는다.
- Hugging Face 논문 (`source: "hf"`): `/tmp/sources.json`의 `hf` 중 추천 많은 순 최대 3개. `title`은 원제, `title_ko`는 한국어 번역, `url`·`discuss`는 논문 링크, `points`=upvotes, `comments`=comments.
- dev.to (`source: "dev"`): `devto` 중 AI와 직접 관련된 글만 반응 많은 순 최대 3개. `points`=reactions, `comments`=comments, `url`·`discuss`=글 링크.
- `label`은 실제로 넣은 소스 이름을 나열하고 수집 시각을 붙인다. 예: "HN · GeekNews · HF 논문 · dev.to · 11/21 07:30 KST".
- Reddit은 이 환경에서 막혀 있으니 쓰지 않는다. 형식 기준은 `public/data/2026-11-20.json`의 `community`.

## 3-2. 유튜브 지금 인기 (`youtube`)
- 호 JSON을 다 쓴 뒤(5-1 다음) `python3 scripts/youtube.py --issue public/data/<오늘>.json` 을 실행한다. 스크립트가 `youtube` 항목을 직접 채운다. (`YOUTUBE_API_KEY` 필요. 실패하면 이 섹션 없이 계속한다.)
- 검색어 없이 유튜브의 한국·미국 인기 순위를 그대로 쓴다. **AI 여부로 거르거나 고르지 않고, 값도 고치지 않는다.** 사용자 요청: "지금 뜨는 영상이 뭔지 아는 게 목적"(2026-11-22).
- 3분 초과는 영상, 3분 이하는 짧은 영상으로 지역별 10개씩 들어간다.

## 3-3. 네이버 급상승 검색어 글·검색어 트렌드·쇼핑인사이트 (`public/data/naver.json`)
- `python3 scripts/naver.py` 를 실행한다. 키가 없거나 실패하면 건너뛴다.
- 검색어는 사람이 정하지 않는다. 스크립트가 구글 트렌드 '지금 한국 급상승 검색어' 10개를 받아, 각각 네이버 뉴스·블로그·카페를 5개씩 검색한다.
- **이 파일은 열어보거나 고치지 않는다.** 네이버 검색 API 약관상 결과를 AI가 읽고 가공·선별하면 안 된다. 스크립트가 네이버가 준 순서 그대로 쓰고, 화면이 그대로 보여준다.
- 신청하지 않은 API는 스크립트가 알아서 건너뛴다. 호 JSON(`community`)에 네이버 글을 넣지 않는다. 매일 덮어쓰는 이 파일 하나만 쓴다.

## 4. 오늘 해볼 것 (`todo`)
- 오늘 소식과 이어지는 5분짜리 행동 2~3개.

## 5. 저장과 배포
1. `public/data/<오늘>.json` 작성, `public/data/index.json`의 `issues` 배열 끝에 날짜 추가. 그다음 3-2의 `youtube.py --issue` 실행.
2. `python3 -c "import json;json.load(open(...))"`로 두 파일이 올바른 JSON인지 확인.
3. 이 두 파일(+ `public/data/naver.json`이 바뀌었으면 그것도)만 커밋한다. 메시지: `브리핑 No.XXX (YYYY-MM-DD)`.
4. `main`에 push. Cloudflare가 1~2분 안에 https://ai-briefing.a2teosis.workers.dev 에 반영한다.

## 하지 말 것
- 사실을 지어내지 않는다. 확인 못 한 숫자는 빼거나 "원문 미확인"이라고 쓴다.
- `index.html`, `app.js` 등 화면 파일은 건드리지 않는다.
- 커밋 메시지에 `Claude-Session:` 링크 줄을 넣지 않는다. (저장소 주인 요청, 공개 저장소에 대화 링크를 남기지 않기 위함)
