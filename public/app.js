(function(){
  var CATS={invest:["투자","--c-invest"],chip:["반도체","--c-chip"],market:["시장","--c-market"],policy:["규제·정책","--c-policy"],startup:["스타트업","--c-startup"],model:["모델","--c-model"],korea:["한국","--c-korea"]};
  var LC={TypeScript:"--l-ts",Python:"--l-py",Go:"--l-go",JavaScript:"--l-js"};
  var CATCOL=["var(--star)","var(--accent)","var(--line)"];
  var app=document.getElementById('app'),issues=[],cur=null;

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function link(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.name)+' ↗</a>'}
  function pct(n){return (n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(2)+'%'}
  function kn(n){n=Number(n)||0;if(n>=1e8)return (n/1e8).toFixed(n<1e9?1:0).replace(/\.0$/,'')+'억';if(n>=1e4)return (n/1e4).toFixed(n<1e5?1:0).replace(/\.0$/,'')+'만';return n.toLocaleString('en-US')}
  function dur(t){var m=Math.floor(t/60),x=t%60;return m>=60?Math.floor(m/60)+':'+String(m%60).padStart(2,'0')+':'+String(x).padStart(2,'0'):m+':'+String(x).padStart(2,'0')}
  function fmtDate(d,w){var p=d.split('-');return p[0]+'.'+p[1]+'.'+p[2]+(w?' '+w:'')}

  var TCOL=['var(--c-invest)','var(--star)','var(--c-startup)','var(--c-chip)','var(--muted)'];
  var TNAME={Gemini:0,ChatGPT:1,Claude:2,Grok:3,Perplexity:4};
  function tc(k,j){return TCOL[k.name in TNAME?TNAME[k.name]:j]||'var(--muted)'}
  function trendInner(g){
    var W=640,H=200,P={l:30,r:22,t:12,b:26},n=g.dates.length,iw=W-P.l-P.r,ih=H-P.t-P.b;
    var mx=Math.max(10,Math.ceil(Math.max.apply(null,g.keywords.map(function(k){return Math.max.apply(null,k.series)}))/10)*10);
    var X=function(i){return P.l+(n<2?iw/2:i*iw/(n-1))},Y=function(v){return P.t+ih-v/mx*ih};
    var svg='<svg class="tchart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="AI 서비스 검색 관심도 '+esc(g.dates[0])+'~'+esc(g.dates[n-1])+'">';
    [0,mx/2,mx].forEach(function(v){svg+='<line x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" class="gl"/><text x="'+(P.l-6)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+Math.round(v)+'</text>'});
    g.dates.forEach(function(dd,i){if(n<=6||i%2===(n-1)%2)svg+='<text x="'+X(i)+'" y="'+(H-6)+'" text-anchor="'+(i===n-1?'end':i===0?'start':'middle')+'">'+esc(dd)+'</text>'});
    g.keywords.slice().reverse().forEach(function(k){
      var j=g.keywords.indexOf(k),c=tc(k,j);
      svg+='<polyline fill="none" stroke="'+c+'" stroke-width="'+(j<3?2.5:1.5)+'" stroke-linejoin="round" stroke-linecap="round" points="'+k.series.map(function(v,i){return X(i).toFixed(1)+','+Y(v).toFixed(1)}).join(' ')+'"/>';
      var l=k.series.length-1;svg+='<circle cx="'+X(l)+'" cy="'+Y(k.series[l])+'" r="3.5" fill="'+c+'"/>';
    });
    svg+='</svg>';
    var leg=g.keywords.map(function(k,j){var a=k.series[0],b=k.series[k.series.length-1],ch=a?Math.round((b-a)/a*100):0;
      return '<div><i style="background:'+tc(k,j)+'"></i>'+esc(k.name)+'<span class="tch mono" style="color:'+(ch>=0?'var(--up)':'var(--down)')+'">'+(ch>=0?'+':'−')+Math.abs(ch)+'%</span><b>'+k.avg+'</b></div>'}).join('');
    var ris=(g.rising||[]).length?'<div class="label" style="margin-top:14px">급상승 관련 검색어 · 인공지능</div><div class="pills">'+g.rising.map(function(r){return '<span class="pill">'+esc(r.query)+'</span>'}).join('')+'</div>':'';
    return '<div class="stwrap"><div class="stchart">'+svg+'</div><div class="stside"><div class="legend"><div class="lh"><span>키워드</span><span class="tch">7일 변화</span><b>평균</b></div>'+leg+'</div>'+ris+'</div></div>'+
      '<div class="note">'+esc(g.note)+'</div>';
  }
  function trendCard(g){
    g.note=g.note||'구글 검색 관심도 상댓값(기간 내 최고=100). 실제 검색 횟수가 아니에요.';
    return '<article class="card strend"><div class="sthead"><div class="label" id="stLabel">'+esc(g.label)+'</div>'+
      '<div class="seg" role="group" aria-label="데이터 출처" id="stSeg" hidden><button type="button" data-s="g" aria-pressed="true">구글</button><button type="button" data-s="n" aria-pressed="false">네이버</button><button type="button" data-s="s" aria-pressed="false">쇼핑</button></div></div>'+
      '<div id="stBody">'+trendInner(g)+'</div></article>';
  }

  function render(d){
    var h=d.headline,m=d.market,o=d.oneline,t=d.trending;
    var mmax=Math.max.apply(null,m.rows.map(function(r){return Math.abs(r.change)}))||1;
    var html='';
    html+='<section id="summary" class="grid">'+
      '<article class="card lead"><div class="label">'+esc(h.kicker)+'</div><h1>'+esc(h.title)+'</h1><p>'+esc(h.body)+'</p>'+
      '<div class="stats">'+h.figures.map(function(f){return '<div class="stat"><b>'+esc(f.value)+'</b><span>'+esc(f.label)+'</span></div>'}).join('')+'</div>'+
      '<span class="src">출처: '+link(h.source)+'</span></article>'+
      '<article class="card market"><div class="label">'+esc(m.label)+'</div>'+
      m.rows.map(function(r){var c=r.change<0?'var(--down)':'var(--up)';return '<div class="mrow"><span class="nm">'+esc(r.name)+'</span><div class="mbar"><i style="width:'+(Math.abs(r.change)/mmax*100).toFixed(1)+'%;background:'+c+'"></i></div><span class="v" style="color:'+c+'">'+pct(r.change)+'</span></div>'}).join('')+
      '<div class="note">'+esc(m.note)+' · '+link(m.source)+'</div></article>'+
      '<article class="card oneline"><div class="label">한 줄 요약</div><p>'+esc(o.text)+'</p><div class="pills">'+o.tags.map(function(x){return '<span class="pill">'+esc(x)+'</span>'}).join('')+'</div></article>'+
      (d.searchtrend&&d.searchtrend.keywords&&d.searchtrend.keywords.length?trendCard(d.searchtrend):'')+
      '</section>';
    html+='<section id="news"><div class="sec-title"><div><h2>AI 뉴스</h2><p>밤사이 나온 소식 '+d.news.length+'건, 원문 링크 포함</p></div><div class="filters" id="filters" role="group" aria-label="분야 필터"></div></div><div class="news" id="newsGrid">'+
      d.news.map(function(n){var c=CATS[n.cat]||[n.cat,"--muted"];return '<article class="card ncard'+(n.featured?' big':'')+'" data-cat="'+esc(n.cat)+'"><div class="cat" style="color:var('+c[1]+')"><i style="background:var('+c[1]+')"></i>'+esc(c[0])+'</div><h3>'+esc(n.title)+'</h3><p>'+esc(n.summary)+'</p><a href="'+esc(n.url)+'" target="_blank" rel="noopener">'+esc(n.source)+' ↗</a></article>'}).join('')+
      '</div></section>';
    var ctot=t.categories.items.reduce(function(a,b){return a+b.count},0);
    html+='<section id="trending"><div class="sec-title"><div><h2>GitHub 트렌딩</h2><p>'+esc(fmtDate(d.date))+' '+esc(t.label)+'</p></div></div><div class="grid">'+
      '<div class="card tlist"><div class="thead"><span class="label" style="margin:0">순위</span><div class="seg" role="group" aria-label="정렬"><button type="button" id="sortToday" aria-pressed="true">오늘 받은 별</button><button type="button" id="sortTotal" aria-pressed="false">누적 별</button></div></div><ol class="repos" id="repos"></ol></div>'+
      '<aside class="side">'+
      '<div class="card"><div class="label">'+esc(t.categories.title)+'</div><div class="stack" aria-hidden="true">'+t.categories.items.map(function(c,i){return '<i style="flex:'+c.count+';background:'+(CATCOL[i]||'var(--line)')+'"></i>'}).join('')+'</div><div class="legend">'+t.categories.items.map(function(c,i){return '<div><i style="background:'+(CATCOL[i]||'var(--line)')+'"></i>'+esc(c.name)+'<b>'+c.count+'</b></div>'}).join('')+'</div></div>'+
      '<div class="card"><div class="label">언어 분포</div><div class="stack" aria-hidden="true">'+t.languages.map(function(l){return '<i style="flex:'+l.count+';background:var('+(LC[l.name]||'--line')+')"></i>'}).join('')+'</div><div class="legend">'+t.languages.map(function(l){return '<div><i style="background:var('+(LC[l.name]||'--line')+')"></i>'+esc(l.name)+'<b>'+l.count+'</b></div>'}).join('')+'</div></div>'+
      '<div class="card insight"><div class="label">트렌드 읽기</div><p>'+t.insight+'</p></div>'+
      '</aside></div></section>';
    if(d.community&&d.community.items&&d.community.items.length){
      var SRC={hn:['Hacker News','HN'],gn:['GeekNews','GN'],hf:['Hugging Face 오늘의 논문','HF'],dev:['dev.to 개발자 블로그','DEV'],nv:['네이버 블로그','N']};
      var col=function(k){var it=d.community.items.filter(function(x){return x.source===k});if(!it.length)return '';
        return '<div class="card ccol"><div class="label">'+SRC[k][0]+'</div><ol class="clist">'+it.map(function(x,i){
          return '<li class="citem"><span class="rank">'+(i+1)+'</span><div class="cbody"><a class="ct" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title_ko||x.title)+'</a>'+
            (x.title_ko&&x.title_ko!==x.title?'<div class="co">'+esc(x.title)+'</div>':'')+
            '<div class="cm">'+(x.points!=null?'<span class="mono">'+(k==='dev'?'♥ ':'▲ ')+x.points.toLocaleString('en-US')+'</span>':'')+(x.meta?'<span>'+esc(x.meta)+'</span>':'')+(x.discuss?'<a href="'+esc(x.discuss)+'" target="_blank" rel="noopener">댓글 '+(x.comments!=null?x.comments.toLocaleString('en-US')+' ':'')+'↗</a>':(x.comments!=null?'<span>댓글 '+x.comments.toLocaleString('en-US')+'</span>':''))+'</div></div></li>'}).join('')+'</ol></div>'};
      html+='<section id="community"><div class="sec-title"><div><h2>커뮤니티 화제</h2><p>'+esc(d.community.label)+'</p></div></div><div class="cgrid">'+col('hn')+col('gn')+col('hf')+col('dev')+col('nv')+'</div></section>';
    }
    if(d.youtube&&((d.youtube.videos||[]).length||(d.youtube.shorts||[]).length)){
      html+='<section id="youtube"><div class="sec-title"><div><h2>유튜브 인기</h2><p>'+esc(d.youtube.label)+'</p></div>'+
        '<div class="seg" role="group" aria-label="정렬"><button type="button" id="ytViews" aria-pressed="true">조회수</button><button type="button" id="ytRatio" aria-pressed="false">구독자 대비</button></div></div>'+
        ((d.youtube.videos||[]).length?'<div class="label">영상</div><div class="ytgrid" id="ytVideos"></div>':'')+
        ((d.youtube.shorts||[]).length?'<div class="label ytl">숏츠</div><div class="ytgrid shorts" id="ytShorts"></div>':'')+
        '<p class="note ytnote">구독자 대비 = 조회수 ÷ 채널 구독자 수. 3배 이상이면 채널 평소보다 크게 터진 영상이에요.</p></section>';
    }
    html+='<section id="todo" class="grid"><div class="card todo"><div class="label">오늘 해볼 것</div><ul>'+
      d.todo.map(function(x,i){return '<li><label><input type="checkbox" id="t'+i+'"><span>'+esc(x)+'</span></label></li>'}).join('')+
      '</ul></div><div class="card archive"><div class="label">지난 브리핑</div><ol class="issues" id="issueList"></ol><div class="note" id="archNote"></div></div></section>';
    app.innerHTML=html;
    var tc=document.getElementById('tabCommunity');if(tc)tc.hidden=!document.getElementById('community');
    var ty=document.getElementById('tabYoutube');if(ty)ty.hidden=!document.getElementById('youtube');

    // 필터
    var fl=document.getElementById('filters'),grid=document.getElementById('newsGrid');
    var used=['all'].concat(Object.keys(CATS).filter(function(k){return d.news.some(function(n){return n.cat===k})}));
    used.forEach(function(k){
      var b=document.createElement('button');b.type='button';
      var cnt=k==='all'?d.news.length:d.news.filter(function(n){return n.cat===k}).length;
      b.innerHTML=(k==='all'?'':'<span class="dot" style="background:var('+CATS[k][1]+')"></span>')+(k==='all'?'전체':CATS[k][0])+' <span class="mono">'+cnt+'</span>';
      b.setAttribute('aria-pressed',String(k==='all'));
      b.onclick=function(){
        fl.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
        grid.querySelectorAll('.ncard').forEach(function(c){c.hidden=!(k==='all'||c.dataset.cat===k);c.classList.remove('pre')});
      };
      fl.appendChild(b);
    });

    // 트렌딩
    var ol=document.getElementById('repos'),mode='today';
    function rr(){
      var arr=t.repos.slice().sort(function(a,b){return b[mode]-a[mode]}),max=arr[0][mode]||1;
      ol.innerHTML=arr.map(function(r,i){
        var p=r.name.split('/');
        return '<li class="repo"><span class="rank">'+(i+1)+'</span>'+
          '<div class="nm"><a href="https://github.com/'+esc(r.name)+'" target="_blank" rel="noopener"><small>'+esc(p[0])+'/</small>'+esc(p[1])+'</a>'+
          '<span class="lang"><i style="background:var('+(LC[r.lang]||'--line')+')"></i>'+esc(r.lang)+'</span>'+(r.skill?'<span class="kind">스킬</span>':'')+'</div>'+
          '<div class="num"><b>'+(mode==='today'?'+':'')+r[mode].toLocaleString('en-US')+'</b><span>'+(mode==='today'?'오늘':'누적')+'</span></div>'+
          '<p>'+esc(r.desc)+'</p><div class="bar"><i style="width:'+(r[mode]/max*100).toFixed(1)+'%"></i></div></li>';
      }).join('');
    }
    rr();
    var bt=document.getElementById('sortToday'),ba=document.getElementById('sortTotal');
    bt.onclick=function(){mode='today';bt.setAttribute('aria-pressed','true');ba.setAttribute('aria-pressed','false');rr()};
    ba.onclick=function(){mode='total';ba.setAttribute('aria-pressed','true');bt.setAttribute('aria-pressed','false');rr()};

    // 유튜브: 썸네일 누르면 그 자리에서 재생
    if(document.getElementById('youtube')){
      var ymode='views';
      var yr=function(id,arr,short){
        var el=document.getElementById(id);if(!el)return;
        var a=arr.slice().sort(function(x,y){return (y[ymode]||0)-(x[ymode]||0)});
        el.innerHTML=a.map(function(v,i){
          var hot=v.ratio!=null&&v.ratio>=3,t=v.title_ko||v.title;
          return '<article class="card ytc"><button type="button" class="yth" data-id="'+esc(v.id)+'" aria-label="'+esc(t)+' 재생">'+
            '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/'+esc(v.id)+'/'+(short?'hqdefault':'mqdefault')+'.jpg">'+
            '<span class="ytr">'+(i+1)+'</span>'+(v.seconds?'<span class="ytd mono">'+dur(v.seconds)+'</span>':'')+'<span class="ytp" aria-hidden="true">▶</span></button>'+
            '<div class="ytb"><h3><a href="https://www.youtube.com/'+(short?'shorts/':'watch?v=')+esc(v.id)+'" target="_blank" rel="noopener">'+esc(t)+'</a></h3>'+
            (v.title_ko&&v.title_ko!==v.title?'<div class="co">'+esc(v.title)+'</div>':'')+
            (v.desc?'<p>'+esc(v.desc)+'</p>':'')+
            '<div class="cm"><span>'+esc(v.channel)+(v.subs!=null?' · 구독자 '+kn(v.subs):'')+'</span></div>'+
            '<div class="ytm"><span class="mono"><b>'+kn(v.views)+'</b> 회</span>'+(v.ratio!=null?'<span class="ytx mono'+(hot?' hot':'')+'">×'+(v.ratio>=10?Math.round(v.ratio):v.ratio.toFixed(1))+'</span>':'')+'</div></div></article>';
        }).join('');
      };
      var yall=function(){yr('ytVideos',d.youtube.videos||[],false);yr('ytShorts',d.youtube.shorts||[],true)};
      yall();
      document.getElementById('youtube').addEventListener('click',function(e){
        var b=e.target.closest('.yth');if(!b)return;
        var f=document.createElement('iframe');
        f.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(b.dataset.id)+'?autoplay=1&rel=0';
        f.title=b.getAttribute('aria-label');f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;
        f.className='ytf';b.replaceWith(f);
      });
      var yv=document.getElementById('ytViews'),yx=document.getElementById('ytRatio');
      yv.onclick=function(){ymode='views';yv.setAttribute('aria-pressed','true');yx.setAttribute('aria-pressed','false');yall()};
      yx.onclick=function(){ymode='ratio';yx.setAttribute('aria-pressed','true');yv.setAttribute('aria-pressed','false');yall()};
    }

    // 네이버: 최신 호에서만, 네이버가 준 그대로 표시 (호 파일에 저장하지 않음)
    var cg=document.querySelector('#community .cgrid');
    if(d.date===issues[issues.length-1]){
      fetch('data/naver.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(nv){
        var seg=document.getElementById('stSeg');
        if(seg&&d.searchtrend){
          var lbl=document.getElementById('stLabel'),body=document.getElementById('stBody'),srcs={g:[d.searchtrend,d.searchtrend.label]};
          if(nv.trend&&nv.trend.keywords&&nv.trend.keywords.length)srcs.n=[{dates:nv.trend.dates,keywords:nv.trend.keywords,note:'네이버 검색량 상댓값(기간 내 최고=100) · 어제까지 7일 · 출처: NAVER 데이터랩'},'AI 서비스 검색량 · 네이버 데이터랩 · 최근 7일'];
          if(nv.shopping&&nv.shopping.keywords&&nv.shopping.keywords.length)srcs.s=[{dates:nv.shopping.dates,keywords:nv.shopping.keywords,note:'네이버쇼핑 '+nv.shopping.category+' 분야 키워드 클릭량 상댓값(기간 내 최고=100) · 출처: NAVER 데이터랩 쇼핑인사이트'},'AI 기기 쇼핑 관심도 · 네이버쇼핑 '+nv.shopping.category+' · 최근 7일'];
          seg.querySelectorAll('button').forEach(function(bt){bt.hidden=!srcs[bt.dataset.s];bt.onclick=function(){
            var x=srcs[bt.dataset.s];seg.querySelectorAll('button').forEach(function(y){y.setAttribute('aria-pressed',String(y===bt))});
            body.innerHTML=trendInner(x[0]);lbl.textContent=x[1];
          }});
          seg.hidden=Object.keys(srcs).length<2;
        }
        if(!cg)return;
        var fd=function(x){if(!x)return '';if(/^\d{8}$/.test(x))return x.slice(4,6)+'/'+x.slice(6);var t=new Date(x);return isNaN(t)?'':String(t.getMonth()+1).padStart(2,'0')+'/'+String(t.getDate()).padStart(2,'0')};
        [['news','네이버 뉴스'],['blog','네이버 블로그'],['cafe','네이버 카페']].forEach(function(k){
          var b=nv[k[0]];if(!b||!b.items||!b.items.length)return;
          var el=document.createElement('div');el.className='card ccol';
          el.innerHTML='<div class="label">'+k[1]+' 검색결과</div><ol class="clist">'+b.items.map(function(x,i){
            var meta=[x.source,fd(x.date)].filter(Boolean).join(' · ');
            return '<li class="citem"><span class="rank">'+(i+1)+'</span><div class="cbody"><a class="ct" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a>'+
              '<div class="co">'+esc(x.desc)+'</div>'+(meta?'<div class="cm"><span>'+esc(meta)+'</span></div>':'')+'</div></li>'}).join('')+
            '</ol><div class="note">출처: NAVER 검색 · "'+esc(b.query)+'" '+esc(b.sort)+' · '+esc(nv.updated)+'</div>';
          cg.appendChild(el);
        });
      }).catch(function(){});
    }

    // 할 일 체크 (이 브라우저에만 저장)
    document.querySelectorAll('.todo input').forEach(function(cb){
      var key='brief-'+d.date+'-'+cb.id;
      try{cb.checked=localStorage.getItem(key)==='1'}catch(e){}
      cb.addEventListener('change',function(){try{localStorage.setItem(key,cb.checked?'1':'0')}catch(e){}});
    });

    // 지난 브리핑: 발행된 호 목록 (최신순, 최근 10개)
    var list=document.getElementById('issueList'),recent=issues.slice(-10).reverse();
    list.innerHTML=recent.map(function(iso){
      var on=iso===d.date;
      return '<li><a class="issue'+(on?' now':'')+'" href="#'+iso+'"'+(on?' aria-current="page"':'')+'><span class="no">'+fmtDate(iso).slice(5)+'</span><span class="tt" data-date="'+iso+'">'+(on?esc(h.title):'')+'</span></a></li>';
    }).join('');
    recent.forEach(function(iso){
      if(iso===d.date)return;
      getIssue(iso).then(function(x){
        var el=list.querySelector('.tt[data-date="'+iso+'"]');if(!el)return;
        el.textContent=x.headline.title;
        el.previousSibling.textContent='No.'+String(x.issue).padStart(3,'0')+' · '+fmtDate(iso).slice(5);
      }).catch(function(){});
    });
    list.querySelector('.now .no').textContent='No.'+String(d.issue).padStart(3,'0')+' · '+fmtDate(d.date).slice(5);
    document.getElementById('archNote').textContent='지금까지 '+issues.length+'호 발행 · 매일 아침 8시에 새 호가 올라와요';

    // 헤더
    var idx=issues.indexOf(d.date);
    document.getElementById('issueLabel').textContent=fmtDate(d.date,d.weekday)+' · No.'+String(d.issue).padStart(3,'0');
    var pv=document.getElementById('prev'),nx=document.getElementById('next');
    pv.disabled=idx<=0;nx.disabled=idx<0||idx>=issues.length-1;
    pv.onclick=function(){if(idx>0)location.hash=issues[idx-1]};
    nx.onclick=function(){if(idx<issues.length-1)location.hash=issues[idx+1]};
    document.title='AI 모닝 브리핑 · '+fmtDate(d.date);
    observeTabs();
    reveal();
  }

  // 탭 활성화: 스크롤 위치 기준. 클릭하면 그 탭을 바로 켜고 스크롤이 끝날 때까지 고정
  var tabLock=null,spyBound=false;
  function setTab(id){document.querySelectorAll('.tabs a').forEach(function(t){t.classList.toggle('on',t.getAttribute('href')==='#'+id)})}
  function spy(){
    if(tabLock)return;
    var ids=['summary','news','trending','community','youtube','todo'].filter(function(id){return document.getElementById(id)}),line=document.querySelector('.top').getBoundingClientRect().bottom+24,act=ids[0];
    ids.forEach(function(id){var el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=line)act=id});
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)act=ids[ids.length-1];
    setTab(act);
  }
  function observeTabs(){
    if(!spyBound){
      spyBound=true;
      addEventListener('scroll',function(){
        if(tabLock){clearTimeout(tabLock);tabLock=setTimeout(function(){tabLock=null;spy()},150);return}
        spy();
      },{passive:true});
      document.querySelectorAll('.tabs a').forEach(function(a){
        a.addEventListener('click',function(e){
          e.preventDefault();
          var id=a.getAttribute('href').slice(1),el=document.getElementById(id);
          if(!el)return;
          setTab(id);
          clearTimeout(tabLock);tabLock=setTimeout(function(){tabLock=null},800);
          el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
        });
      });
    }
    spy();
  }

  // 화면 아래쪽 요소만 스크롤할 때 나타나는 효과
  function reveal(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
    var io=new IntersectionObserver(function(es){
      var shown=es.filter(function(e){return e.isIntersecting});
      shown.forEach(function(e,i){
        e.target.style.transitionDelay=Math.min(i,4)*70+'ms';
        e.target.classList.remove('pre');io.unobserve(e.target);
        setTimeout(function(){e.target.style.transitionDelay=''},900);
      });
    },{rootMargin:'0px 0px -8% 0px'});
    var els=document.querySelectorAll('.strend,.ncard,.tlist,.side .card,.ccol,.ytc,.todo,.archive');
    els.forEach(function(el){el.classList.add('rv');if(el.getBoundingClientRect().top>innerHeight*0.92){el.classList.add('pre')}});
    requestAnimationFrame(function(){els.forEach(function(el){if(el.classList.contains('pre'))io.observe(el)})});
  }

  var cache={};
  function getIssue(date){
    if(!cache[date])cache[date]=fetch('data/'+date+'.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()});
    return cache[date];
  }
  function load(date){
    if(date===cur)return;
    getIssue(date).then(function(d){cur=date;render(d);scrollTo(0,0)})
      .catch(function(){app.innerHTML='<p class="loading">'+esc(date)+' 브리핑을 찾지 못했어요. 최신 호로 돌아가려면 <a href="./">여기</a>를 눌러 주세요</p>'});
  }
  function route(){
    var h=location.hash.slice(1);
    if(/^\d{4}-\d{2}-\d{2}$/.test(h))load(h);
    else if(!cur)load(issues[issues.length-1]);
  }
  fetch('data/index.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(j){
    issues=(j.issues||[]).slice().sort();
    if(!issues.length){app.innerHTML='<p class="loading">아직 발행된 브리핑이 없어요</p>';return}
    route();
    addEventListener('hashchange',route);
  }).catch(function(){app.innerHTML='<p class="loading">브리핑 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요</p>'});
})();
