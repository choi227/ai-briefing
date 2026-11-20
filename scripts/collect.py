#!/usr/bin/env python3
"""브리핑 보조 소스를 모아 후보 JSON을 만든다.

사용: python3 scripts/collect.py --out /tmp/sources.json
  - trends : 구글 트렌드(한국) AI 서비스 검색 관심도 7일 (pip install trendspyg 필요)
  - hf     : Hugging Face 오늘의 논문, 추천(upvotes) 순
  - devto  : dev.to #ai 태그 최근 하루 인기글, 반응 수 순
하나가 실패해도 나머지는 계속 모은다. 실패한 소스는 errors 에 이유를 적는다.
"""
import argparse, datetime as dt, json, urllib.request

KST = dt.timezone(dt.timedelta(hours=9))
TREND_KEYWORDS = ["ChatGPT", "Gemini", "Claude", "Grok", "Perplexity"]
UA = {"User-Agent": "ai-briefing/1.0"}


def get_json(url, headers=None):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def trends():
    from trendspyg.compat.request import TrendReq
    t = TrendReq(hl="ko-KR", tz=-540)
    t.build_payload(TREND_KEYWORDS, timeframe="now 7-d", geo="KR")
    df = t.interest_over_time()
    if df is None or df.empty:
        raise RuntimeError("빈 결과")
    df = df.drop(columns=[c for c in df.columns if c == "isPartial"])
    daily = df.groupby(df.index.date).mean()
    dates = [d.strftime("%m/%d") for d in daily.index]
    rows = []
    for k in TREND_KEYWORDS:
        s = [round(float(v), 1) for v in daily[k].tolist()]
        rows.append({"name": k, "series": s, "avg": round(sum(s) / len(s), 1)})
    rows.sort(key=lambda r: r["avg"], reverse=True)
    rising = []
    try:
        t.build_payload(["인공지능"], timeframe="now 7-d", geo="KR")
        rq = t.related_queries().get("인공지능", {}).get("rising")
        if rq is not None:
            rising = [{"query": q, "value": int(v)} for q, v in zip(rq["query"], rq["value"])][:5]
    except Exception:
        pass
    return {"geo": "KR", "timeframe": "최근 7일", "dates": dates, "keywords": rows, "rising_ai": rising}


def hf():
    d = get_json("https://huggingface.co/api/daily_papers?limit=50")
    out = []
    for p in d:
        pp = p["paper"]
        out.append({"id": pp["id"], "title": pp.get("title") or p.get("title"), "upvotes": pp.get("upvotes", 0),
                    "comments": p.get("numComments", 0), "url": "https://huggingface.co/papers/" + pp["id"],
                    "ai_summary": pp.get("ai_summary"), "org": (pp.get("organization") or {}).get("fullname"),
                    "date": (pp.get("submittedOnDailyAt") or p.get("publishedAt") or "")[:10]})
    out.sort(key=lambda r: r["upvotes"], reverse=True)
    return out[:15]


def devto():
    d = get_json("https://dev.to/api/articles?tag=ai&top=1&per_page=40")
    out = [{"title": a["title"], "reactions": a.get("public_reactions_count", 0), "comments": a.get("comments_count", 0),
            "url": a["url"], "author": (a.get("user") or {}).get("name"), "description": a.get("description"),
            "minutes": a.get("reading_time_minutes")} for a in d]
    out.sort(key=lambda r: r["reactions"], reverse=True)
    return out[:15]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--only", help="쉼표로 구분: trends,hf,devto")
    a = ap.parse_args()
    jobs = {"trends": trends, "hf": hf, "devto": devto}
    pick = a.only.split(",") if a.only else list(jobs)
    res = {"collected": dt.datetime.now(KST).strftime("%m/%d %H:%M KST"), "errors": {}}
    for k in pick:
        try:
            res[k] = jobs[k]()
        except Exception as e:  # 한 소스 실패가 전체를 막지 않게
            res["errors"][k] = f"{type(e).__name__}: {e}"[:300]
    text = json.dumps(res, ensure_ascii=False, indent=1)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text)
        print({k: (len(v) if isinstance(v, list) else "ok") for k, v in res.items() if k in jobs}, "errors:", res["errors"])
    else:
        print(text)


if __name__ == "__main__":
    main()
