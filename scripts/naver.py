#!/usr/bin/env python3
"""지금 뜨는 검색어로 찾은 네이버 검색결과(뉴스·블로그·카페)와
데이터랩(검색어 트렌드·쇼핑인사이트)을 그대로 public/data/naver.json 에 덮어쓴다.

검색어는 사람이 정하지 않는다. 구글 트렌드 '지금 한국 급상승 검색어' RSS(최대 10개)를
스크립트가 받아 그 순서대로 네이버에 검색한다. (네이버 검색 API는 검색어가 필수라 빈 검색은 불가)

네이버 검색 API 약관(특약 2.2~2.4)에 맞추기 위해:
  - 네이버가 준 순서와 내용을 그대로 쓴다 (고르거나 고치지 않는다).
  - Claude 등 AI가 이 결과를 읽거나 요약하지 않는다. 스크립트가 바로 파일로 쓴다.
  - 날짜별 호에 저장하지 않고 매일 이 파일 하나를 덮어쓴다.
  - 화면에 'NAVER 검색' 출처와 원문 링크를 표시한다.

필요(둘 중 하나):
  - NAVER API HUB: NCP_APIGW_API_KEY_ID, NCP_APIGW_API_KEY
  - 기존 개발자센터 키(2027-06-30까지): NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
API HUB에서 신청하지 않은 API는 실패하고 건너뛴다.
사용: python3 scripts/naver.py
"""
import datetime as dt, html, json, os, re, sys, urllib.parse, urllib.request, xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "naver.json")
HOT_RSS = "https://trends.google.com/trending/rss?geo=KR"
HOT_MAX = 10   # 급상승 검색어 개수 (RSS가 주는 최대치)
PER = 5        # 검색어·종류별 글 개수
KINDS = [("news", "news"), ("blog", "blog"), ("cafe", "cafearticle")]
SORT = "sim"
SORT_KO = {"sim": "정확도순", "date": "최신순"}
TREND_GROUPS = [
    {"groupName": "ChatGPT", "keywords": ["챗GPT", "ChatGPT", "챗지피티"]},
    {"groupName": "Gemini", "keywords": ["제미나이", "Gemini"]},
    {"groupName": "Claude", "keywords": ["클로드 AI", "Claude", "클로드AI"]},
    {"groupName": "Grok", "keywords": ["그록", "Grok"]},
    {"groupName": "Perplexity", "keywords": ["퍼플렉시티", "Perplexity"]},
]
SHOP_CATEGORY = ("50000003", "디지털/가전")
SHOP_KEYWORDS = [  # param은 키워드 1개만 허용
    {"name": "AI 노트북", "param": ["AI 노트북"]},
    {"name": "AI 스마트폰", "param": ["AI 스마트폰"]},
    {"name": "AI 스피커", "param": ["AI 스피커"]},
    {"name": "스마트글래스", "param": ["스마트글래스"]},
    {"name": "AI PC", "param": ["AI PC"]},
]

clean = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s or ""))


def creds():
    e = os.environ
    if e.get("NCP_APIGW_API_KEY_ID") and e.get("NCP_APIGW_API_KEY"):
        return ("https://naverapihub.apigw.ntruss.com/search/v1/",
                "https://naverapihub.apigw.ntruss.com/search-trend/v1/search",
                "https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords",
                {"X-NCP-APIGW-API-KEY-ID": e["NCP_APIGW_API_KEY_ID"], "X-NCP-APIGW-API-KEY": e["NCP_APIGW_API_KEY"]})
    if e.get("NAVER_CLIENT_ID") and e.get("NAVER_CLIENT_SECRET"):
        return ("https://openapi.naver.com/v1/search/",
                "https://openapi.naver.com/v1/datalab/search",
                "https://openapi.naver.com/v1/datalab/shopping/category/keywords",
                {"X-Naver-Client-Id": e["NAVER_CLIENT_ID"], "X-Naver-Client-Secret": e["NAVER_CLIENT_SECRET"]})
    sys.exit("네이버 키 환경 변수가 없습니다 (NCP_APIGW_API_KEY_ID/NCP_APIGW_API_KEY 또는 NAVER_CLIENT_ID/NAVER_CLIENT_SECRET)")


def call(url, h, body=None):
    data = json.dumps(body).encode() if body is not None else None
    hh = {**h, "Content-Type": "application/json"} if body is not None else h
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=hh), timeout=30) as r:
        return json.load(r)


def hot_keywords():
    req = urllib.request.Request(HOT_RSS, headers={"User-Agent": "ai-briefing/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        root = ET.fromstring(r.read())
    ns = {"ht": "https://trends.google.com/trending/rss"}
    out = []
    for it in root.iter("item"):
        t = (it.findtext("title") or "").strip()
        if t:
            out.append((t, (it.findtext("ht:approx_traffic", namespaces=ns) or "").strip()))
    num = lambda x: int(re.sub(r"\D", "", x) or 0)
    out.sort(key=lambda r: num(r[1]), reverse=True)  # 검색량 많은 순 (같으면 RSS 순서)
    return out[:HOT_MAX]


def series_of(results, dates, key):
    rows = []
    for g in results:
        m = {x["period"]: x["ratio"] for x in g.get("data", [])}
        s = [round(float(m.get(d.isoformat(), 0)), 1) for d in dates]
        rows.append({"name": g[key], "series": s, "avg": round(sum(s) / len(s), 1)})
    rows.sort(key=lambda r: r["avg"], reverse=True)
    return rows


def main():
    sbase, turl, shurl, h = creds()
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
    out = {"updated": now.strftime("%m/%d %H:%M KST"), "errors": {}}

    try:
        hot = hot_keywords()
    except Exception as ex:
        hot = []
        out["errors"]["hot"] = f"{type(ex).__name__}: {ex}"[:200]
    rows = []
    for kw, traffic in hot:
        row = {"keyword": kw, "traffic": traffic}
        for key, kind in KINDS:
            try:
                d = call(sbase + kind + "?" + urllib.parse.urlencode({"query": kw, "display": PER, "sort": SORT}), h)
                items = []
                for i in d.get("items", []):
                    it = {"title": clean(i.get("title")), "url": i.get("link"), "desc": clean(i.get("description"))}
                    if kind == "blog":
                        it.update(source=clean(i.get("bloggername")), date=i.get("postdate"))
                    elif kind == "cafearticle":
                        it.update(source=clean(i.get("cafename")))
                    elif kind == "news":
                        it.update(date=i.get("pubDate"))
                    items.append(it)
                row[key] = items
            except Exception as ex:
                out["errors"][f"{key}:{kw}"] = f"{type(ex).__name__}: {ex}"[:200]
        rows.append(row)
    if rows:
        out["hot"] = {"source": "구글 트렌드 한국 급상승 검색어", "sort": SORT_KO[SORT], "keywords": rows}

    # 데이터랩은 전날 집계가 아침에 아직 안 들어와 0이 나온다 → 그저께까지 7일
    end, start = now.date() - dt.timedelta(days=2), now.date() - dt.timedelta(days=8)
    dates = [start + dt.timedelta(days=i) for i in range(7)]
    period = {"startDate": start.isoformat(), "endDate": end.isoformat(), "timeUnit": "date"}
    try:
        t = call(turl, h, {**period, "keywordGroups": TREND_GROUPS})
        out["trend"] = {"dates": [d.strftime("%m/%d") for d in dates], "keywords": series_of(t.get("results", []), dates, "title")}
    except Exception as ex:
        out["errors"]["trend"] = f"{type(ex).__name__}: {ex}"[:200]
    try:
        t = call(shurl, h, {**period, "category": SHOP_CATEGORY[0], "keyword": SHOP_KEYWORDS})
        out["shopping"] = {"category": SHOP_CATEGORY[1], "dates": [d.strftime("%m/%d") for d in dates],
                           "keywords": series_of(t.get("results", []), dates, "title")}
    except Exception as ex:
        out["errors"]["shopping"] = f"{type(ex).__name__}: {ex}"[:200]

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    got = [k for k in ("hot", "trend", "shopping") if k in out]
    print("네이버 수집:", ", ".join(got) or "없음", "| 실패:", out["errors"] or "없음")


if __name__ == "__main__":
    main()
