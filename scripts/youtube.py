#!/usr/bin/env python3
"""유튜브 AI 영상·숏츠 후보를 모은다 (YouTube Data API v3).

필요: 환경 변수 YOUTUBE_API_KEY
사용: python3 scripts/youtube.py [--days 3] [--out /tmp/yt.json]

한국어·영어 AI 키워드로 최근 N일 영상을 조회수 순으로 찾고,
조회수·좋아요·길이·채널 구독자 수를 붙여 후보 목록을 낸다.
ratio = 조회수 ÷ 구독자 수 (구독자 대비 얼마나 터졌는지).
최종 5개 선정과 한국어 설명은 BRIEFING.md 절차대로 사람이(또는 Claude가) 고른다.
할당량: 검색 4회(400) + 상세 조회 몇 회 ≈ 하루 410 단위 (무료 한도 10,000).
"""
import argparse, datetime as dt, json, os, re, sys, urllib.parse, urllib.request

API = "https://www.googleapis.com/youtube/v3/"
QUERIES = {
    "ko": dict(q="AI|인공지능|챗GPT|클로드|제미나이|LLM", regionCode="KR", relevanceLanguage="ko"),
    "en": dict(q="AI|ChatGPT|Claude|Gemini|OpenAI|LLM", regionCode="US", relevanceLanguage="en"),
}
SHORT_MAX = 180  # 3분 이하를 숏츠로 본다


def call(path, **params):
    params["key"] = os.environ["YOUTUBE_API_KEY"]
    url = API + path + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def seconds(iso):
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--out")
    a = ap.parse_args()
    if not os.environ.get("YOUTUBE_API_KEY"):
        sys.exit("YOUTUBE_API_KEY 환경 변수가 없습니다")

    since = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=a.days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    ids, lang_of = [], {}
    for lang, q in QUERIES.items():
        for dur in ("short", "any"):
            res = call("search", part="id", type="video", order="viewCount", maxResults=25,
                       publishedAfter=since, videoDuration=dur, safeSearch="moderate", **q)
            for it in res.get("items", []):
                vid = it["id"]["videoId"]
                if vid not in lang_of:
                    ids.append(vid)
                    lang_of[vid] = lang

    videos = []
    for i in range(0, len(ids), 50):
        res = call("videos", part="snippet,statistics,contentDetails", id=",".join(ids[i:i + 50]))
        videos += res.get("items", [])

    ch_ids = sorted({v["snippet"]["channelId"] for v in videos})
    subs = {}
    for i in range(0, len(ch_ids), 50):
        res = call("channels", part="statistics", id=",".join(ch_ids[i:i + 50]))
        for c in res.get("items", []):
            st = c.get("statistics", {})
            subs[c["id"]] = None if st.get("hiddenSubscriberCount") else int(st.get("subscriberCount", 0))

    out = {"videos": [], "shorts": []}
    for v in videos:
        sn, st = v["snippet"], v.get("statistics", {})
        views = int(st.get("viewCount", 0))
        sec = seconds(v["contentDetails"].get("duration"))
        s = subs.get(sn["channelId"])
        row = {
            "id": v["id"],
            "title": sn["title"],
            "channel": sn["channelTitle"],
            "subs": s,
            "views": views,
            "likes": int(st["likeCount"]) if "likeCount" in st else None,
            "published": sn["publishedAt"],
            "seconds": sec,
            "ratio": round(views / s, 2) if s else None,
            "lang": lang_of.get(v["id"]),
            "tags": sn.get("tags", [])[:8],
        }
        out["shorts" if 0 < sec <= SHORT_MAX else "videos"].append(row)
    for k in out:
        out[k].sort(key=lambda r: r["views"], reverse=True)
        out[k] = out[k][:30]
    out["since"] = since
    out["collected"] = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%m/%d %H:%M KST")

    text = json.dumps(out, ensure_ascii=False, indent=1)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text)
        print(f"영상 {len(out['videos'])}개, 숏츠 {len(out['shorts'])}개 → {a.out}")
    else:
        print(text)


if __name__ == "__main__":
    main()
