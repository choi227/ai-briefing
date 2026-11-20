#!/usr/bin/env python3
"""네이버 블로그 검색결과를 그대로 public/data/naver.json 에 덮어쓴다.

네이버 검색 API 약관(특약 2.2~2.4)에 맞추기 위해:
  - 네이버가 준 순서와 내용을 그대로 쓴다 (고르거나 고치지 않는다).
  - Claude 등 AI가 이 결과를 읽거나 요약하지 않는다. 스크립트가 바로 파일로 쓴다.
  - 날짜별 호에 저장하지 않고 매일 이 파일 하나를 덮어쓴다.
  - 화면에 '네이버 검색결과' 출처와 원문 링크를 표시한다.

필요(둘 중 하나):
  - NAVER API HUB: NCP_APIGW_API_KEY_ID, NCP_APIGW_API_KEY
  - 기존 개발자센터 키(2027-06-30까지): NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
사용: python3 scripts/naver.py
"""
import datetime as dt, html, json, os, re, sys, urllib.parse, urllib.request

QUERY = "인공지능 AI"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "naver.json")


def main():
    e = os.environ
    q = urllib.parse.urlencode({"query": QUERY, "display": 5, "sort": "sim"})
    if e.get("NCP_APIGW_API_KEY_ID") and e.get("NCP_APIGW_API_KEY"):
        url = "https://naverapihub.apigw.ntruss.com/search/v1/blog?" + q
        h = {"X-NCP-APIGW-API-KEY-ID": e["NCP_APIGW_API_KEY_ID"], "X-NCP-APIGW-API-KEY": e["NCP_APIGW_API_KEY"]}
    elif e.get("NAVER_CLIENT_ID") and e.get("NAVER_CLIENT_SECRET"):
        url = "https://openapi.naver.com/v1/search/blog?" + q
        h = {"X-Naver-Client-Id": e["NAVER_CLIENT_ID"], "X-Naver-Client-Secret": e["NAVER_CLIENT_SECRET"]}
    else:
        sys.exit("네이버 키 환경 변수가 없습니다 (NCP_APIGW_API_KEY_ID/NCP_APIGW_API_KEY 또는 NAVER_CLIENT_ID/NAVER_CLIENT_SECRET)")
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
    clean = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s or ""))
    items = [{"title": clean(i["title"]), "url": i["link"], "blog": clean(i.get("bloggername")),
              "date": i.get("postdate"), "desc": clean(i.get("description"))} for i in d.get("items", [])]
    out = {"query": QUERY, "sort": "정확도순",
           "updated": dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%m/%d %H:%M KST"),
           "items": items}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"네이버 블로그 {len(items)}건 → public/data/naver.json")


if __name__ == "__main__":
    main()
