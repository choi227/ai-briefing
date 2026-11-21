#!/usr/bin/env python3
"""유튜브 '지금 인기 영상'을 지역별로 모은다 (YouTube Data API v3, chart=mostPopular).

필요: 환경 변수 YOUTUBE_API_KEY
사용: python3 scripts/youtube.py --issue public/data/YYYY-MM-DD.json   # 호 파일의 youtube 항목을 채움
      python3 scripts/youtube.py --out /tmp/yt.json                     # 따로 저장만

검색어 없이 유튜브가 정한 지역별 인기 순위를 그대로 가져온다 (AI 여부로 거르지 않음).
한국(KR)·미국(US) 각각 인기 목록 최대 200개를 받아,
3분 초과는 '영상', 3분 이하는 '짧은 영상'으로 나눠 순위대로 N개씩 남긴다.
※ 인기 목록에는 숏츠(60초 이하 세로 영상)가 거의 들어오지 않는다. 숏츠 인기 순위는 공식 API로 받을 수 없다.
조회수·구독자 수·구독자 대비(ratio = 조회수 ÷ 구독자 수)를 붙인다.
할당량: 지역당 목록 4회 + 채널 조회 몇 회 ≈ 하루 20 단위 (무료 한도 10,000).
"""
import argparse, datetime as dt, json, os, re, sys, urllib.parse, urllib.request

API = "https://www.googleapis.com/youtube/v3/"
REGIONS = [("KR", "한국"), ("US", "미국")]
SHORT_MAX = 180  # 3분 이하를 짧은 영상으로 본다
KEEP = 10        # 지역·종류별로 남길 개수


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


def popular(region):
    items, tok = [], None
    for _ in range(4):
        p = dict(part="snippet,statistics,contentDetails", chart="mostPopular", regionCode=region, maxResults=50)
        if tok:
            p["pageToken"] = tok
        d = call("videos", **p)
        items += d.get("items", [])
        tok = d.get("nextPageToken")
        if not tok:
            break
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--issue", help="youtube 항목을 채울 호 JSON 경로")
    a = ap.parse_args()
    if not os.environ.get("YOUTUBE_API_KEY"):
        sys.exit("YOUTUBE_API_KEY 환경 변수가 없습니다")

    raw = {code: popular(code) for code, _ in REGIONS}
    ch_ids = sorted({v["snippet"]["channelId"] for vs in raw.values() for v in vs})
    subs = {}
    for i in range(0, len(ch_ids), 50):
        for c in call("channels", part="statistics", id=",".join(ch_ids[i:i + 50])).get("items", []):
            st = c.get("statistics", {})
            subs[c["id"]] = None if st.get("hiddenSubscriberCount") else int(st.get("subscriberCount", 0))

    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
    out = {"label": "검색어 없이 유튜브 지역별 인기 순위 그대로 · " + now.strftime("%m/%d %H:%M") + " 수집",
           "collected": now.strftime("%m/%d %H:%M KST"), "regions": {}}
    for code, name in REGIONS:
        vids, shorts = [], []
        for rank, v in enumerate(raw[code], 1):
            sn, st = v["snippet"], v.get("statistics", {})
            views = int(st.get("viewCount", 0))
            sec = seconds(v["contentDetails"].get("duration"))
            s = subs.get(sn["channelId"])
            row = {"id": v["id"], "title": sn["title"], "channel": sn["channelTitle"], "subs": s, "views": views,
                   "likes": int(st["likeCount"]) if "likeCount" in st else None, "published": sn["publishedAt"],
                   "seconds": sec, "ratio": round(views / s, 2) if s else None, "rank": rank}
            (shorts if 0 < sec <= SHORT_MAX else vids).append(row)
        out["regions"][code] = {"name": name, "videos": vids[:KEEP], "shorts": shorts[:KEEP]}

    if a.issue:
        d = json.load(open(a.issue, encoding="utf-8"))
        d["youtube"] = out
        open(a.issue, "w", encoding="utf-8").write(json.dumps(d, ensure_ascii=False, indent=1) + "\n")
    text = json.dumps(out, ensure_ascii=False, indent=1)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text)
    summary = ", ".join(f"{c} 영상 {len(r['videos'])}·짧은 영상 {len(r['shorts'])}" for c, r in out["regions"].items())
    print("유튜브 인기:", summary, "→", a.issue or a.out or "stdout")
    if not a.issue and not a.out:
        print(text)


if __name__ == "__main__":
    main()
