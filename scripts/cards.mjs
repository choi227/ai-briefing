// 인스타그램 카드뉴스 생성기
// 사용: node scripts/cards.mjs public/data/YYYY-MM-DD.json
// 결과: public/cards/YYYY-MM-DD/01.jpg ~ NN.jpg, caption.txt (1080x1350, 4:5)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// playwright는 전역 설치본도 찾도록 require 사용 (NODE_PATH 지원)
const { chromium } = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
if (!src) { console.error('사용: node scripts/cards.mjs public/data/YYYY-MM-DD.json'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
const outDir = path.join(here, '..', 'public', 'cards', d.date);
fs.mkdirSync(outDir, { recursive: true });

const SITE = 'ai-briefing.a2teosis.workers.dev';
const font = w => `url(data:font/woff2;base64,${fs.readFileSync(path.join(here, 'fonts', `Pretendard-${w}.woff2`)).toString('base64')})`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '');
const firstSentence = s => { const t = strip(s); const m = t.match(/^.+?(요|다)\.(\s|$)/); const f = m ? m[0].trim() : t; return f.length > 105 ? f.slice(0, 102).trim() + '…' : f; };
const [y, mo, da] = d.date.split('-');
const dateLabel = `${+mo}월 ${+da}일 (${d.weekday})`;
const no = `No.${String(d.issue).padStart(3, '0')}`;
const CAT = { invest: ['투자', '#1f4fe0'], chip: ['반도체', '#7a45d6'], market: ['시장', '#cf3a3a'], policy: ['정책', '#b5610b'], startup: ['스타트업', '#12805a'], model: ['모델', '#0b84a5'], korea: ['한국', '#c2357a'] };
const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n);

const css = `
@font-face{font-family:P;font-weight:400;src:${font('Regular')}}
@font-face{font-family:P;font-weight:600;src:${font('SemiBold')}}
@font-face{font-family:P;font-weight:700;src:${font('Bold')}}
@font-face{font-family:P;font-weight:800;src:${font('ExtraBold')}}
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:1350px}
body{font-family:P,sans-serif;color:#06191d;background:#fff;word-break:keep-all;overflow-wrap:anywhere;-webkit-font-smoothing:antialiased}
.page{width:1080px;height:1350px;padding:84px 80px 72px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.top{display:flex;align-items:center;gap:16px;font-size:26px;font-weight:600;color:#667074}
.mark{width:48px;height:48px;border-radius:12px;background:#06191d;color:#fff;display:grid;place-items:center;font-weight:800;font-size:20px}
.top .no{margin-left:auto;font-variant-numeric:tabular-nums}
.chip{display:inline-block;background:#e2d7fa;color:#5b1fd1;font-weight:700;font-size:26px;padding:10px 22px;border-radius:99px}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:24px;color:#667074;font-weight:600;padding-top:28px;border-top:2px solid #e9e9eb}
.foot b{color:#5b1fd1}
h1,h2{font-weight:800;letter-spacing:-.035em;line-height:1.2;text-wrap:balance}
.cover h1{font-size:92px;margin-top:auto}
.cover .hl{margin-top:44px;font-size:44px;font-weight:700;line-height:1.35;letter-spacing:-.02em;color:#06191d}
.cover .tags{margin:44px 0 auto;display:flex;flex-wrap:wrap;gap:14px}
.cover .tags span{font-size:28px;font-weight:600;color:#5b1fd1;background:#efe9fd;padding:10px 20px;border-radius:12px}
.cover .swipe{position:absolute;right:80px;bottom:150px;font-size:26px;font-weight:600;color:#667074}
.box{background:#fafafa;border:2px solid #e9e9eb;border-radius:28px;padding:48px}
.head h1{font-size:62px;margin:36px 0 32px}
.head p{font-size:33px;line-height:1.6;color:#333b3e}
.figs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:auto}
.fig{background:#fff;border:2px solid #e9e9eb;border-radius:22px;padding:28px 24px}
.fig b{display:block;font-size:50px;font-weight:800;letter-spacing:-.03em;color:#5b1fd1}
.fig span{display:block;font-size:24px;color:#667074;margin-top:8px;line-height:1.35}
.src{font-size:22px;color:#8a9296;margin-top:24px}
.sec{font-size:54px;font-weight:800;letter-spacing:-.03em;margin:36px 0 30px}
.news{display:flex;flex-direction:column;gap:26px}
.item{border:2px solid #e9e9eb;border-radius:24px;padding:34px 36px}
.cat{font-size:22px;font-weight:700;letter-spacing:.02em}
.item h2{font-size:38px;font-weight:700;letter-spacing:-.025em;line-height:1.3;margin:10px 0 12px}
.item p{font-size:27px;line-height:1.55;color:#4a5357}
.repo{display:grid;grid-template-columns:52px 1fr auto;gap:6px 18px;align-items:center;padding:22px 0;border-bottom:2px solid #f0f0f2}
.repo .rk{font-size:36px;font-weight:800;color:#c3c7ca}
.repo .nm{font-size:31px;font-weight:700;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.repo .st{font-size:30px;font-weight:800;color:#e99a0c;font-variant-numeric:tabular-nums}
.repo .ds{grid-column:2/4;font-size:24px;color:#667074;line-height:1.4}
.repo .bar{grid-column:2/4;height:10px;border-radius:99px;background:#fbefd6;overflow:hidden}
.repo .bar i{display:block;height:100%;background:#e99a0c;border-radius:99px}
.skill{font-size:18px;font-weight:700;color:#5b1fd1;background:#efe9fd;padding:3px 10px;border-radius:8px;margin-left:10px;vertical-align:4px}
.ins{margin-top:28px;font-size:27px;line-height:1.55;color:#333b3e;background:#efe9fd;border-radius:20px;padding:26px 30px}
.ins strong{color:#5b1fd1}
.outro{justify-content:center}
.outro h1{font-size:76px}
.outro p{font-size:34px;line-height:1.6;color:#4a5357;margin-top:32px}
.outro .url{margin-top:56px;font-size:36px;font-weight:700;color:#5b1fd1;background:#efe9fd;border-radius:20px;padding:28px 34px;display:inline-block}
.todo-h{margin-top:52px;font-size:26px;font-weight:700;color:#5b1fd1}
.todo{margin-top:20px;display:flex;flex-direction:column;gap:18px}
.todo div{font-size:30px;line-height:1.5;padding-left:44px;position:relative}
.todo div::before{content:"";position:absolute;left:0;top:10px;width:24px;height:24px;border:3px solid #5b1fd1;border-radius:7px}
`;

const top = () => `<div class="top"><div class="mark">AI</div>오늘의 AI 브리핑<span class="no">${no} · ${+mo}/${+da}</span></div>`;
const foot = (i, n) => `<div class="foot"><span>${SITE}</span><b>${i} / ${n}</b></div>`;

const pages = [];
pages.push(n => `<div class="page cover">${top()}
  <h1>${dateLabel}<br>AI 뉴스 브리핑</h1>
  <div class="hl">${esc(strip(d.oneline?.text))}</div>
  <div class="tags">${(d.oneline?.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
  <div class="swipe">밀어서 보기 →</div>${foot(1, n)}</div>`);

if (d.headline) pages.push((n, i) => `<div class="page head">${top()}
  <div style="margin-top:56px"><span class="chip">${esc(d.headline.kicker || '오늘의 헤드라인')}</span></div>
  <h1>${esc(d.headline.title)}</h1>
  <p>${esc(strip(d.headline.body))}</p>
  <div class="figs">${(d.headline.figures || []).slice(0, 3).map(f => `<div class="fig"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join('')}</div>
  <div class="src">출처: ${esc(d.headline.source?.name)}</div>${foot(i, n)}</div>`);

const news = (d.news || []).slice(0, 6);
for (let k = 0; k < news.length; k += 3) {
  const chunk = news.slice(k, k + 3);
  pages.push((n, i) => `<div class="page">${top()}
    <div class="sec">주요 뉴스 ${k / 3 + 1}</div>
    <div class="news">${chunk.map(a => { const [c, col] = CAT[a.cat] || ['뉴스', '#667074']; return `<div class="item">
      <div class="cat" style="color:${col}">${c} · ${esc(a.source)}</div>
      <h2>${esc(a.title)}</h2><p>${esc(firstSentence(a.summary))}</p></div>`; }).join('')}</div>${foot(i, n)}</div>`);
}

const repos = (d.trending?.repos || []).slice(0, 5);
if (repos.length) {
  const max = Math.max(...repos.map(r => r.today));
  pages.push((n, i) => `<div class="page">${top()}
    <div class="sec">GitHub 트렌딩 · 오늘 받은 별</div>
    <div>${repos.map((r, j) => `<div class="repo"><span class="rk">${j + 1}</span>
      <span class="nm">${esc(r.name)}${r.skill ? '<span class="skill">스킬</span>' : ''}</span><span class="st">★ ${fmt(r.today)}</span>
      <div class="bar"><i style="width:${(r.today / max * 100).toFixed(1)}%"></i></div>
      <span class="ds">${esc(r.desc)}</span></div>`).join('')}</div>
    ${d.trending.insight ? `<div class="ins">${String(d.trending.insight).replace(/<(?!\/?strong>)[^>]+>/g, '')}</div>` : ''}${foot(i, n)}</div>`);
}

pages.push((n, i) => `<div class="page outro">${top()}
  <div style="margin:auto 0">
  <h1>전체 브리핑은<br>사이트에서</h1>
  <p>뉴스 원문 링크, 커뮤니티 화제, 유튜브 인기,<br>검색 관심도 차트까지 매일 아침 9시 반에 올라와요.</p>
  ${(d.todo || []).length ? `<div class="todo-h">오늘 해볼 것</div><div class="todo">${d.todo.slice(0, 3).map(t => `<div>${esc(strip(t.text ?? t.title ?? t))}</div>`).join('')}</div>` : ''}
  <div class="url">${SITE}</div></div>${foot(i, n)}</div>`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const files = [];
for (let i = 0; i < pages.length; i++) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${pages[i](pages.length, i + 1)}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const f = path.join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 92 });
  files.push(f);
}
await browser.close();

// 캡션 (인스타 2,200자·해시태그 30개 제한 안쪽)
const tags = [...new Set([...(d.oneline?.tags || []), '#AI뉴스', '#인공지능', '#AI브리핑', '#생성형AI', '#테크뉴스', '#깃허브트렌딩'])].slice(0, 20);
const caption = [
  `📰 ${dateLabel} AI 브리핑 ${no}`,
  '',
  strip(d.oneline?.text),
  '',
  d.headline ? `▶ 헤드라인: ${d.headline.title}` : null,
  ...news.map(a => `· ${a.title}`),
  '',
  `전체 브리핑과 원문 링크는 프로필 링크(${SITE})에서 볼 수 있어요.`,
  '',
  tags.join(' '),
].filter(x => x !== null).join('\n').slice(0, 2200);
fs.writeFileSync(path.join(outDir, 'caption.txt'), caption);
console.log(JSON.stringify({ dir: outDir, cards: files.length }));
