#!/usr/bin/env python3
"""github.com/trending (오늘 기준) 목록을 GitHub 서버에서 직접 읽어 public/data/trending-raw.json 으로 저장한다.

GitHub Actions(.github/workflows/trending.yml)를 매일 아침 브리핑 발행 때 직접 실행한다.
클라우드 발행 환경에서는 github.com이 막혀 있고 웹페이지 읽기 도구는 캐시된 옛 목록을 줄 때가 있어서,
발행 때는 이 파일을 쓴다. 표준 라이브러리만 쓴다.
"""
import datetime as dt, html, json, re, sys, urllib.request

URL = "https://github.com/trending?since=daily"
OUT = sys.argv[1] if len(sys.argv) > 1 else "public/data/trending-raw.json"


def num(s):
    return int(re.sub(r"[^\d]", "", s or "0") or 0)


def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (ai-briefing trending)", "Accept-Language": "en-US"})
page = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
repos = []
for art in re.findall(r'<article class="Box-row">(.*?)</article>', page, re.S):
    m = re.search(r'<h2[^>]*>.*?href="/([^"/]+/[^"/]+)"', art, re.S)
    if not m:
        continue
    name = m.group(1)
    desc = re.search(r'<p class="col-9[^"]*">(.*?)</p>', art, re.S)
    lang = re.search(r'itemprop="programmingLanguage">(.*?)</span>', art, re.S)
    total = re.search(r'href="/' + re.escape(name) + r'/stargazers"[^>]*>(.*?)</a>', art, re.S)
    today = re.search(r'([\d,]+)\s+stars? today', art)
    repos.append({"name": name, "today": num(today and today.group(1)), "total": num(total and text(total.group(1))),
                  "lang": text(lang.group(1)) if lang else None, "desc": text(desc.group(1)) if desc else ""})
if not repos:
    sys.exit("트렌딩 목록을 하나도 못 읽었어요 (페이지 구조가 바뀌었을 수 있음)")
now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
json.dump({"source": URL, "fetched": now.strftime("%Y-%m-%d %H:%M KST"), "repos": repos},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"트렌딩 {len(repos)}개 → {OUT} (1위 {repos[0]['name']} +{repos[0]['today']})")
