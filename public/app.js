(function(){
  var CATS={invest:["투자","--c-invest"],chip:["반도체","--c-chip"],market:["시장","--c-market"],policy:["규제·정책","--c-policy"],startup:["스타트업","--c-startup"],model:["모델","--c-model"],korea:["한국","--c-korea"]};
  var LC={TypeScript:"--l-ts",Python:"--l-py",Go:"--l-go",JavaScript:"--l-js"};
  var CATCOL=["var(--star)","var(--accent)","var(--line)"];
  var app=document.getElementById('app'),issues=[],cur=null;

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function link(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.name)+' ↗</a>'}
  function pct(n){return (n>0?'+':n<0?'−':'')+Math.abs(n).toFixed(2)+'%'}
  function fmtDate(d,w){var p=d.split('-');return p[0]+'.'+p[1]+'.'+p[2]+(w?' '+w:'')}

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
      var SRC={hn:['Hacker News','HN'],gn:['GeekNews','GN']};
      var col=function(k){var it=d.community.items.filter(function(x){return x.source===k});if(!it.length)return '';
        return '<div class="card ccol"><div class="label">'+SRC[k][0]+'</div><ol class="clist">'+it.map(function(x,i){
          return '<li class="citem"><span class="rank">'+(i+1)+'</span><div class="cbody"><a class="ct" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title_ko||x.title)+'</a>'+
            (x.title_ko&&x.title_ko!==x.title?'<div class="co">'+esc(x.title)+'</div>':'')+
            '<div class="cm"><span class="mono">▲ '+x.points.toLocaleString('en-US')+'</span><a href="'+esc(x.discuss)+'" target="_blank" rel="noopener">댓글 '+x.comments.toLocaleString('en-US')+' ↗</a></div></div></li>'}).join('')+'</ol></div>'};
      html+='<section id="community"><div class="sec-title"><div><h2>커뮤니티 화제</h2><p>'+esc(d.community.label)+'</p></div></div><div class="cgrid">'+col('hn')+col('gn')+'</div></section>';
    }
    html+='<section id="todo" class="grid"><div class="card todo"><div class="label">오늘 해볼 것</div><ul>'+
      d.todo.map(function(x,i){return '<li><label><input type="checkbox" id="t'+i+'"><span>'+esc(x)+'</span></label></li>'}).join('')+
      '</ul></div><div class="card archive"><div class="label">지난 브리핑</div><ol class="issues" id="issueList"></ol><div class="note" id="archNote"></div></div></section>';
    app.innerHTML=html;
    var tc=document.getElementById('tabCommunity');if(tc)tc.hidden=!document.getElementById('community');

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
    var ids=['summary','news','trending','community','todo'].filter(function(id){return document.getElementById(id)}),line=document.querySelector('.top').getBoundingClientRect().bottom+24,act=ids[0];
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
    var els=document.querySelectorAll('.ncard,.tlist,.side .card,.ccol,.todo,.archive');
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
