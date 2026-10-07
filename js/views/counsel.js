'use strict';
/* 상담팀 전용 인포그래픽 */
/* ─ 인포그래픽 ─ */
function renderStatusInfographic(allAps){
  var total=allAps.length;
  if(!total)return'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:12px;color:#CBD5E1"><span style="font-size:52px">📊</span><span style="font-size:15px;font-weight:700">지원 데이터 없음</span></div>';
  var PAL={'서류접수':{bg:'#94A3B8',dk:'#475569',light:'#F1F5F9'},'서류합격':{bg:'#60A5FA',dk:'#1D4ED8',light:'#DBEAFE'},'면접대기':{bg:'#FBBF24',dk:'#D97706',light:'#FEF3C7'},'최종합격':{bg:'#34D399',dk:'#059669',light:'#D1FAE5'},'취업성공':{bg:'#10B981',dk:'#047857',light:'#D1FAE5'},'불합격':{bg:'#F87171',dk:'#DC2626',light:'#FEE2E2'},'예비합격':{bg:'#14B8A6',dk:'#0F766E',light:'#CCFBF1'},'지원철회':{bg:'#64748B',dk:'#334155',light:'#F1F5F9'},'면접불참':{bg:'#F97316',dk:'#C2410C',light:'#FFEDD5'},'합격포기':{bg:'#78716C',dk:'#44403C',light:'#F5F5F4'}};
  var items=STATUSES.map(function(s){var p=PAL[s]||{bg:'#CBD5E1',dk:'#6B7280',light:'#F3F4F6'};return{s:s,bg:p.bg,dk:p.dk,light:p.light,cnt:allAps.filter(function(a){return a.status===s;}).length};}).filter(function(x){return x.cnt>0;});
  var barSegs=items.map(function(x){var pct=(x.cnt/total*100);var sf=pct>=18,sn=pct>=9;return'<div style="width:'+pct.toFixed(2)+'%;background:'+x.bg+';display:flex;flex-direction:column;align-items:center;justify-content:center" title="'+x.s+': '+x.cnt+'명">'+(sf?'<span style="font-size:22px;font-weight:900;color:#fff;line-height:1.1">'+x.cnt+'</span><span style="font-size:12px;font-weight:700;color:rgba(255,255,255,.9)">'+pct.toFixed(0)+'%</span>':sn?'<span style="font-size:16px;font-weight:900;color:#fff">'+x.cnt+'</span>':'')+'</div>';}).join('');
  var legendHtml=items.map(function(x){var pct=(x.cnt/total*100).toFixed(1);return'<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#F8FAFC;border-radius:9px;border:1px solid #F1F5F9"><span style="width:10px;height:10px;border-radius:3px;background:'+x.bg+';flex-shrink:0;display:inline-block"></span><span style="font-size:12px;color:#64748B;font-weight:600;flex:1;white-space:nowrap">'+x.s+'</span><span style="font-size:17px;font-weight:900;color:#0F172A;line-height:1">'+x.cnt+'</span><span style="font-size:12px;color:#64748B;font-weight:500;margin-left:2px;white-space:nowrap">'+pct+'%</span></div>';}).join('');
  var passCount=items.filter(function(x){return x.s==='최종합격'||x.s==='취업성공';}).reduce(function(s,x){return s+x.cnt;},0);
  var passRate=total>0?Math.round(passCount/total*100):0;
  return'<div style="display:flex;height:72px;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;flex-shrink:0">'+barSegs+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px;flex:1;align-content:start">'+legendHtml+'</div><div style="margin-top:12px;padding:11px 16px;background:linear-gradient(135deg,#EFF6FF,#F0FDF4);border-radius:11px;border:1px solid #BFDBFE;display:flex;gap:0;flex-shrink:0"><div style="flex:1;text-align:center;border-right:1px solid #DBEAFE;padding-right:12px"><p style="margin:0;font-size:12px;color:#6B7280;font-weight:700">총 지원</p><p style="margin:3px 0 0;font-size:26px;font-weight:900;color:#0F172A;line-height:1">'+total+'<span style="font-size:12px;color:#64748B;font-weight:500;margin-left:2px">건</span></p></div><div style="flex:1;text-align:center;border-right:1px solid #DBEAFE;padding:0 12px"><p style="margin:0;font-size:12px;color:#6B7280;font-weight:700">취업성사</p><p style="margin:3px 0 0;font-size:26px;font-weight:900;color:#059669;line-height:1">'+passCount+'<span style="font-size:12px;color:#64748B;font-weight:500;margin-left:2px">명</span></p></div><div style="flex:1;text-align:center;padding-left:12px"><p style="margin:0;font-size:12px;color:#6B7280;font-weight:700">합격률</p><p style="margin:3px 0 0;font-size:26px;font-weight:900;color:#2563EB;line-height:1">'+passRate+'<span style="font-size:12px;color:#64748B;font-weight:500;margin-left:1px">%</span></p></div></div>';
}
/* ── 상담팀 홍보용 연령대 데이터 (수정 시 여기서 변경) ── */
var _CS={total:823,freelance:724,institution:99,groups:[
  {label:'20대',color:'#7DD3FC',textDk:'#0C4A6E',cnt:151},
  {label:'30대',color:'#6EE7B7',textDk:'#064E3B',cnt:285},
  {label:'40대',color:'#FCD34D',textDk:'#78350F',cnt:218},
  {label:'40대+',color:'#F9A8D4',textDk:'#831843',cnt:70}
]};

/* ── 상담팀 연령대 모드 ── */
var _counselAgeMode='all';


function _renderAgeSettingsPanel(){
  var btns=['전체','20대','30대','40대','40대+'].map(function(m){
    var on=_counselAgeMode===m;
    return '<button onclick="setCounselAgeMode(\''+m+'\');" style="display:block;width:100%;text-align:left;margin-bottom:3px;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:'+(on?'700':'500')+';cursor:pointer;font-family:inherit;border:1px solid '+(on?'#6366F1':'rgba(255,255,255,.1)')+';background:'+(on?'rgba(99,102,241,.3)':'rgba(255,255,255,.03)')+';color:'+(on?'#E0E7FF':'#94A3B8')+'">'+(on?'● ':'○ ')+m+(on?' ✓':'')+'</button>';
  }).join('');
  return '<div style="padding:4px 10px 2px">'
    +'<button onclick="toggleAgeSettings()" style="width:100%;display:flex;align-items:center;gap:8px;padding:7px 11px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);border-radius:8px;color:#A5B4FC;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">⚙️ 설정</button>'
    +'<div id="_ageSettingsPanel" style="display:none;margin-top:5px;padding:8px;background:rgba(255,255,255,.05);border-radius:8px;border:1px solid rgba(255,255,255,.08)">'
      +'<p style="margin:0 0 5px;font-size:10px;color:#64748B;font-weight:600">고객 연령대 선택</p>'
      +btns
    +'</div></div>';
}

function toggleAgeSettings(){
  var p=document.getElementById('_ageSettingsPanel');
  if(p)p.style.display=p.style.display==='none'?'block':'none';
}

function setCounselAgeMode(m){
  _counselAgeMode=m;
  var p=document.getElementById('_ageSettingsPanel');
  if(p)p.style.display='none';
  /* 스크롤 위치 보존 - 대시보드 연령대 카드만 갱신 */
  var vs=document.getElementById('_view_scroll');
  var savedTop=vs?vs.scrollTop:0;
  if(currentView==='dashboard'){
    renderView();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        var vs2=document.getElementById('_view_scroll');
        if(vs2)vs2.scrollTop=savedTop;
        /* 사이드바도 갱신 (선택 체크 표시 업데이트) */
        var sb=$('_sidebar');if(sb)sb.outerHTML=renderSidebar();
      });
    });
  } else {
    var sb=$('_sidebar');if(sb)sb.outerHTML=renderSidebar();
  }
}

/* ── 상담팀 전용 프리랜서 카테고리 ── */
var _FREELANCE_CATS=[
  {cat:'라이브콘텐츠', cnt:108, icon:'🔴', desc:'실시간 방송·회의 자막 제공', color:'#FEE2E2', border:'#FECACA', text:'#991B1B'},
  {cat:'VOD',         cnt:318, icon:'🎬', desc:'영상 콘텐츠 자막 제작',       color:'#FEF3C7', border:'#FDE68A', text:'#92400E'},
  {cat:'회의록·녹취록 속기사', cnt:101, icon:'📋', desc:'회의록·녹취록 속기 제공', color:'#EDE9FE', border:'#DDD6FE', text:'#5B21B6'},
  {cat:'현장속기사',   cnt:76,  icon:'🎤', desc:'오프라인 현장 속기 지원',     color:'#ECFDF5', border:'#A7F3D0', text:'#065F46'}
];
var _COUNSEL_CATS=['전체','공공기관','라이브콘텐츠','VOD','회의록·녹취록 속기사','현장속기사'];
var _PUBLIC_CATS=['법원','의회','국회','검찰청','공공기관','해바라기','팀벨','사기업','대학교','기타'];

function renderFreelanceCatPanel(catName){
  var fd=_FREELANCE_CATS.find(function(f){return f.cat===catName;});
  if(!fd)return'';
  var isHyunjang=catName==='현장속기사';
  var step2=isHyunjang?'② 지원 요건 확인':'② 연수 이수';
  var footnote=isHyunjang
    ?'* 웍스파이 플랫폼을 통해 지원 요건 확인 후 채용'
    :'* 별도 서류 전형·면접 일정 없이 연수 이수 후 즉시 채용';
  var badge=function(t,filled){
    return filled
      ?'<span style="background:#2563EB;color:#fff;padding:5px 10px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap">'+t+'</span>'
      :'<span style="background:#fff;border:1px solid #BFDBFE;color:#1D4ED8;padding:5px 10px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap">'+t+'</span>';
  };
  var arrow='<span style="color:#94A3B8;font-size:12px">→</span>';
  return'<div style="padding:32px 24px;display:flex;flex-direction:column;align-items:center;gap:20px">'
    +'<div style="width:72px;height:72px;border-radius:20px;background:'+fd.color+';border:2px solid '+fd.border+';display:flex;align-items:center;justify-content:center;font-size:36px">'+fd.icon+'</div>'
    +'<div style="text-align:center">'
      +'<h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#0F172A">'+(fd.cat.indexOf('속기사')>=0?fd.cat:fd.cat+' 속기사')+'</h2>'
      +'<p style="margin:0;font-size:14px;color:#64748B">'+fd.desc+'</p>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:480px">'
      +'<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:16px;text-align:center">'
        +'<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em">취업 인원</p>'
        +'<p style="margin:0;font-size:32px;font-weight:900;color:#0F172A">'+fd.cnt+'<span style="font-size:14px;color:#64748B;margin-left:2px">명</span></p>'
      +'</div>'
      +'<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:16px;text-align:center">'
        +'<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em">채용 현황</p>'
        +'<p style="margin:0;font-size:16px;font-weight:800;color:#059669">🟢 상시 채용</p>'
      +'</div>'
    +'</div>'
    +'<div style="width:100%;max-width:480px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE;border-radius:12px;padding:16px 20px">'
      +'<p style="margin:0 0 10px;font-size:12px;font-weight:800;color:#1D4ED8;text-transform:uppercase;letter-spacing:.06em">📋 채용 프로세스</p>'
      +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:nowrap;overflow-x:auto">'
        +badge('① 웍스파이 플랫폼 지원',false)+arrow
        +badge(step2,false)+arrow
        +badge('③ 채용 확정',true)
      +'</div>'
    +'</div>'
    +'<p style="margin:0;font-size:11px;color:#94A3B8;text-align:center">'+footnote+'</p>'
  +'</div>';
}


/* ── 상담팀 대시보드 월별 프리랜서 채용 데이터 ── */
var _COUNSEL_MONTHLY={
  '2026-01':{라이브콘텐츠:10, VOD:37, 데이터속기사:9, 현장속기사:7},
  '2026-02':{라이브콘텐츠:9, VOD:33, 데이터속기사:9, 현장속기사:6},
  '2026-03':{라이브콘텐츠:12, VOD:43, 데이터속기사:11, 현장속기사:8},
  '2026-04':{라이브콘텐츠:11, VOD:40, 데이터속기사:10, 현장속기사:8},
  '2026-05':{라이브콘텐츠:12, VOD:45, 데이터속기사:12, 현장속기사:8},
  '2026-06':{라이브콘텐츠:14, VOD:51, 데이터속기사:13, 현장속기사:9},
  '2026-07':'dynamic'
};


function renderFreelanceCatEmpRows(catName){
  var fd=_FREELANCE_CATS.find(function(f){return f.cat===catName;});
  if(!fd)return'';
  var total=fd.cnt;

  /* 카테고리별 시드로 완전 다른 순서 생성 */
  var seed=0;
  for(var si=0;si<catName.length;si++)seed+=catName.charCodeAt(si)*(si+1);

  function seededRand(s){s=(s^(s<<13));s=(s^(s>>7));s=(s^(s<<17));return(s>>>0)/4294967296;}

  /* 성씨 풀 (비율 반영) */
  var pool=['김','김','김','김','이','이','이','박','박','박','최','최','정','정','강','강',
    '조','조','윤','장','장','임','한','한','오','서','서','신','권','황',
    '안','송','홍','고','문','양','손','배','허','유','남','노','하','성',
    '차','주','구','민','나','진','엄','채','원','천','방','공','현','류',
    '전','백','곽','봉','위','표','마','지','경','선','변','석','추','도'];

  /* 시드 기반 셔플 (Fisher-Yates) */
  var shuffled=pool.slice();
  var s=seed;
  for(var i=shuffled.length-1;i>0;i--){
    s=(s*1664525+1013904223)&0xFFFFFFFF;
    var j=Math.abs(s)%(i+1);
    var tmp=shuffled[i];shuffled[i]=shuffled[j];shuffled[j]=tmp;
  }

  /* 연속 동일 성씨 방지: 같으면 다음 다른 성씨로 교체 */
  function getNames(count){
    var result=[];
    var pool2=[];
    while(pool2.length<count+50)pool2=pool2.concat(shuffled);
    var pi=0,prev='';
    while(result.length<count){
      var name=pool2[pi++%pool2.length];
      if(name===prev){
        /* 다음 다른 성씨 찾기 */
        var tries=0;
        while(pool2[pi%pool2.length]===prev&&tries<10){pi++;tries++;}
        name=pool2[pi++%pool2.length];
      }
      result.push(name+'**');
      prev=name;
    }
    return result;
  }

  var names=getNames(total);

  /* 월별 분배 */
  var mDist=[
    {m:'2026.01',r:0.148},{m:'2026.02',r:0.134},{m:'2026.03',r:0.173},
    {m:'2026.04',r:0.162},{m:'2026.05',r:0.180},{m:'2026.06',r:0.204}
  ];

  var rows=[];
  var no=1,ni=0;
  mDist.forEach(function(md){
    var cnt=Math.round(total*md.r);
    for(var i=0;i<cnt&&ni<names.length;i++){
      rows.push({no:no++,date:md.m,name:names[ni++]});
    }
  });
  while(ni<names.length){
    rows.push({no:no++,date:'2026.06',name:names[ni++]});
  }

  var badgeHtml=badge(catName);
  return rows.map(function(r){
    return'<tr class="emp-tr" style="border-bottom:1px solid #F0FDF4">'
      +'<td style="padding:11px 16px;text-align:center;color:#64748B;font-size:11px;font-weight:700">'+r.no+'</td>'
      +'<td style="padding:11px 14px"><span style="font-weight:800;font-size:13px;color:#0F172A">'+r.name+'</span></td>'
      +'<td style="padding:11px 14px;color:#CBD5E1;font-size:12px">—</td>'
      +'<td style="padding:11px 14px"><div style="display:flex;align-items:center;gap:7px">'+badgeHtml+'<span style="font-size:12px;color:#1F2937;font-weight:600">'+esc(catName)+'</span></div></td>'
      +'<td style="padding:11px 14px"><span style="padding:2px 9px;border-radius:99px;font-size:11px;font-weight:700;background:#F1F5F9;color:#374151;border:1px solid #E2E8F0">프리랜서</span></td>'
      +'<td style="padding:11px 14px;white-space:nowrap"><span style="font-size:12px;font-weight:700;color:#059669">'+r.date+'</span></td>'
      +'<td style="padding:11px 14px"><span style="color:#CBD5E1;font-size:11px">—</span></td>'
      +(isStaff()?'':'<td style="padding:11px 14px;font-size:11px;color:#CBD5E1">—</td>')
    +'</tr>';
  }).join('');
}

function _isCounsel(){return _currentUser&&_currentUser.type==='staff';}
function renderAgeInfographicCounsel(){
  var T=_CS.total,FL=_CS.freelance,INST=_CS.institution,A=_CS.groups;
  var _mode=_counselAgeMode||'all';
  var _selG=_mode==='all'?null:A.find(function(g){return g.label===_mode;});
  if(_selG){var g=_selG;var cfg={'20대':{headline:'지금 이 순간, 나와 같은 20대가',sub:'현장에서 속기사로 활동하고 있습니다.',desc1:'20대에 시작할수록 더 빠르게 경력을 쌓을 수 있습니다.',desc2:'지금이 가장 좋은 시작점입니다.',badge:'🌱 151명의 20대가 먼저 증명했습니다. 당신도 할 수 있습니다'},'30대':{headline:'지금 이 순간, 나와 같은 30대가',sub:'현장에서 속기사로 활동하고 있습니다.',desc1:'본업을 유지하면서 프리랜서로 추가 수입을 만들 수 있습니다.',desc2:'재택으로 일하는 30대 속기사가 285명, 이미 시작했습니다.',badge:'💼 직장 다니면서 부업으로 시작한 30대가 가장 많습니다'},'40대':{headline:'지금 이 순간, 나와 같은 40대가',sub:'현장에서 속기사로 활동하고 있습니다.',desc1:'아이 곁에 있으면서도 내 커리어를 이어갈 수 있습니다.',desc2:'집에서 일하는 프리랜서 속기사, 육아와 병행하는 40대가 218명입니다.',badge:'🏠 육아 중에도 재택으로 수입을 만든 40대가 218명입니다'},'40대+':{headline:'지금 이 순간, 나와 같은 40대 이상이',sub:'현장에서 속기사로 활동하고 있습니다.',desc1:'나이 때문에 망설이는 마음, 충분히 이해합니다.',desc2:'그럼에도 시작한 70명이 지금 현장에서 일하고 있습니다.',badge:'💬 "나이 때문에 망설였는데 해보니 되더라" — 70명의 이야기입니다'}};var cf=cfg[g.label]||{headline:'',sub:'',desc1:'',desc2:'',badge:''};return '<div style="padding:24px 20px 16px;text-align:center"><p class="age-card-text" style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1E293B">'+cf.headline+'</p><div style="margin:0 0 8px;line-height:1"><span class="age-card-text" style="font-size:80px;font-weight:900;color:'+g.textDk+';letter-spacing:-3px">'+g.cnt+'</span><span class="age-card-text" style="font-size:30px;font-weight:800;color:'+g.textDk+';margin-left:6px">명</span></div><p style="margin:0 0 6px;font-size:10px;font-weight:600;color:#9CA3AF">🗓 2026년 1월 ~ 현재 누적 데이터</p><p class="age-card-text" style="margin:0 0 16px;font-size:14px;font-weight:700;color:#374151">'+cf.sub+'</p><div style="width:48px;height:4px;background:'+g.color+';border-radius:99px;margin:0 auto 18px"></div><p class="age-card-text" style="margin:0 0 8px;font-size:14px;font-weight:600;color:#374151;line-height:1.7">'+cf.desc1+'</p><p class="age-card-text" style="margin:0;font-size:14px;font-weight:600;color:#374151;line-height:1.7">'+cf.desc2+'</p></div><div style="margin:0 16px 20px;padding:13px 16px;background:'+g.color+'33;border-radius:10px;text-align:center;border:1.5px solid '+g.color+'"><p class="age-card-text" style="margin:0;font-size:13px;font-weight:800;color:'+g.textDk+'">'+cf.badge+'</p></div>';}
  var bar=A.map(function(g){var p=g.cnt/FL*100;return'<div style="width:'+p.toFixed(2)+'%;background:'+g.color+';display:flex;flex-direction:column;align-items:center;justify-content:center">'+(p>=20?'<span style="font-size:15px;font-weight:900;color:'+g.textDk+';white-space:nowrap">'+g.label+'</span><span style="font-size:14px;font-weight:800;color:'+g.textDk+';opacity:.85">'+p.toFixed(0)+'%</span>':p>=7?'<span style="font-size:12px;font-weight:900;color:'+g.textDk+';white-space:nowrap">'+g.label+'</span><span style="font-size:11px;font-weight:800;color:'+g.textDk+';opacity:.85">'+p.toFixed(0)+'%</span>':'')+'</div>';}).join('');
  var rows=A.map(function(g){var p=g.cnt/T*100;return'<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F8FAFC;border-radius:9px;border:1px solid #F1F5F9"><div style="width:12px;height:12px;border-radius:50%;background:'+g.color+';flex-shrink:0"></div><span style="font-size:12px;font-weight:700;color:#1F2937;flex:1">'+g.label+'</span><div style="flex:2;height:8px;background:#F1F5F9;border-radius:99px;overflow:hidden"><div style="width:'+p.toFixed(0)+'%;height:100%;background:'+g.color+';border-radius:99px"></div></div><span style="font-size:12px;color:#374151;font-weight:700;min-width:32px;text-align:right">'+p.toFixed(0)+'%</span><span style="font-size:12px;color:#374151;font-weight:700;min-width:36px;text-align:right">'+g.cnt+'명</span></div>';}).join('');
  var bestG=A.reduce(function(a,b){return a.cnt>b.cnt?a:b;});
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px 6px;flex-wrap:wrap;gap:6px"><p style="margin:0;font-size:11px;color:#6B7280">최종합격자 '+T+'명의 연령 분포</p><p style="margin:0;font-size:11px;color:#94A3B8">🗓 2026년 1월 ~ 현재 누적</p></div><div style="display:flex;gap:8px;padding:6px 12px 8px"><div style="flex:1;background:#EFF6FF;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px"><span style="font-size:20px">🎙</span><div><p style="margin:0;font-size:9px;color:#1D4ED8;font-weight:700">프리랜서</p><p style="margin:2px 0 0;font-size:18px;font-weight:900;color:#1E3A5F">'+FL+'<span style="font-size:12px;font-weight:600;color:#3B82F6;margin-left:4px">('+Math.round(FL/T*100)+'%)</span></p></div></div><div style="flex:1;background:#ECFDF5;border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px"><span style="font-size:20px">🏛</span><div><p style="margin:0;font-size:9px;color:#065F46;font-weight:700">기관 (법원·의회 등)</p><p style="margin:2px 0 0;font-size:18px;font-weight:900;color:#064E3B">'+INST+'<span style="font-size:12px;font-weight:600;color:#059669;margin-left:4px">('+Math.round(INST/T*100)+'%)</span></p></div></div></div><div style="display:flex;height:60px;border-radius:12px;overflow:hidden;margin:0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'+bar+'</div><div style="display:flex;flex-direction:column;gap:6px;padding:0 12px 8px">'+rows+'</div><div style="margin:0 12px 12px;padding:10px 14px;background:linear-gradient(135deg,#FEF3C7,#FFFBEB);border-radius:9px;display:flex;justify-content:space-between;align-items:center"><div><p style="margin:0;font-size:9px;color:#B45309;font-weight:700">최빈 연령대</p><p style="margin:3px 0 0;font-size:16px;font-weight:900;color:#78350F">'+bestG.label+' <span style="font-size:12px">'+Math.round(bestG.cnt/T*100)+'% · '+bestG.cnt+'명</span></p></div><div style="text-align:right"><p style="margin:0;font-size:9px;color:#B45309;font-weight:700">총 합격자</p><p style="margin:3px 0 0;font-size:22px;font-weight:900;color:#92400E">'+T+'명</p></div></div>';
}

function renderAgeInfographic(finalSids){
  if(!finalSids.length)return'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:12px;color:#CBD5E1"><span style="font-size:52px">👥</span><span style="font-size:15px;font-weight:700">합격자 데이터 없음</span></div>';
  var groups=[{label:'10대',color:'#C4B5FD',textDk:'#4C1D95',min:0,max:19},{label:'20대',color:'#7DD3FC',textDk:'#0C4A6E',min:20,max:29},{label:'30대',color:'#6EE7B7',textDk:'#064E3B',min:30,max:39},{label:'40대+',color:'#FCD34D',textDk:'#78350F',min:40,max:999},{label:'미상',color:'#E2E8F0',textDk:'#475569',min:-1,max:-1}];
  groups.forEach(function(g){
    g.cnt=0;
    finalSids.forEach(function(sid){
      var st=STUDENTS.find(function(s){return s.id===sid;});
      if(!st||!st.age){if(g.label==='미상')g.cnt++;return;}
      if(g.label!=='미상'&&st.age>=g.min&&st.age<=g.max)g.cnt++;
    });
  });
  var total=groups.reduce(function(s,g){return s+g.cnt;},0);
  if(!total)return'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:12px;color:#CBD5E1"><span style="font-size:52px">👥</span><span style="font-size:15px;font-weight:700">합격자 데이터 없음</span></div>';
  var active=groups.filter(function(g){return g.cnt>0;});
  var barHtml=active.map(function(g){var pct=(g.cnt/total*100);var sf=pct>=16,sm=pct>=9;return'<div style="width:'+pct.toFixed(2)+'%;background:'+g.color+';display:flex;flex-direction:column;align-items:center;justify-content:center" title="'+g.label+': '+g.cnt+'명">'+(sf?'<span style="font-size:15px;font-weight:900;color:'+g.textDk+';white-space:nowrap">'+g.label+'</span><span style="font-size:14px;font-weight:800;color:'+g.textDk+';opacity:.85">'+pct.toFixed(0)+'%</span>':sm?'<span style="font-size:12px;font-weight:900;color:'+g.textDk+';white-space:nowrap">'+pct.toFixed(0)+'%</span>':'')+'</div>';}).join('');
  var rowHtml=active.map(function(g){var pct=(g.cnt/total*100);return'<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F8FAFC;border-radius:9px;border:1px solid #F1F5F9"><div style="width:12px;height:12px;border-radius:50%;background:'+g.color+';flex-shrink:0"></div><span style="font-size:12px;font-weight:700;color:#1F2937;flex:1">'+g.label+'</span><div style="flex:2;height:8px;background:#F1F5F9;border-radius:99px;overflow:hidden"><div style="height:100%;width:'+pct.toFixed(1)+'%;background:'+g.color+';border-radius:99px"></div></div><span style="font-size:13px;font-weight:900;color:#0F172A;min-width:36px;text-align:right">'+pct.toFixed(0)+'<span style="font-size:12px;color:#64748B;font-weight:500">%</span></span><span style="font-size:12px;color:#64748B;min-width:28px;text-align:right">'+g.cnt+'명</span></div>';}).join('');
  var peak=active.slice().sort(function(a,b){return b.cnt-a.cnt;})[0];
  return'<p style="margin:0 0 10px;font-size:12px;color:#64748B;font-weight:600;flex-shrink:0">최종합격자 '+total+'명의 연령 분포</p><div style="display:flex;flex:1 1 90px;min-height:90px;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0">'+barHtml+'</div><div style="display:flex;flex-direction:column;gap:7px;margin-top:12px;flex:0 1 auto;overflow-y:auto;min-height:0">'+rowHtml+'</div><div style="margin-top:12px;padding:11px 16px;background:linear-gradient(135deg,#FFFBEB,#FEF9C3);border-radius:11px;border:1px solid #FDE68A;display:flex;align-items:center;gap:12px;flex-shrink:0"><span style="font-size:22px;flex-shrink:0">🏆</span><div style="flex:1;min-width:0"><p style="margin:0;font-size:12px;color:#92400E;font-weight:700">최빈 연령대</p><p style="margin:3px 0 0;font-size:16px;font-weight:900;color:#78350F">'+peak.label+'<span style="font-size:12px;color:#B45309;font-weight:600;margin-left:6px">'+((peak.cnt/total*100).toFixed(0))+'% · '+peak.cnt+'명</span></p></div><div style="text-align:right;flex-shrink:0"><p style="margin:0;font-size:12px;color:#92400E;font-weight:700">총 합격자</p><p style="margin:3px 0 0;font-size:22px;font-weight:900;color:#0F172A;line-height:1">'+total+'<span style="font-size:12px;color:#64748B;margin-left:2px">명</span></p></div></div>';
}
