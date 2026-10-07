'use strict';
/* 지역 현황 */
/* ─ renderView / setView / init ─ */

/* ══════════════════════════════════════════════════════════════
   🗺️  전국 채용현황 페이지 (인라인 SVG 지도)
══════════════════════════════════════════════════════════════ */
function setNationalLoc(loc,e){
  if(e&&e.preventDefault)e.preventDefault();
  if(e&&e.stopPropagation)e.stopPropagation();
  _nationalSelectedLoc=(_nationalSelectedLoc===loc)?null:loc;
  /* 인텔리전트 보드 전체 재렌더 */
  _saveScrollPositions();
  renderView();
}

function _renderNatPanel(){
  var locCounts={};
  LOCATIONS.forEach(function(l){locCounts[l]=JOBS.filter(function(j){return j.location===l;}).length;});
  var totalCount=LOCATIONS.reduce(function(s,l){return s+(locCounts[l]||0);},0);
  /* ── 지역 미지정 집계 (null / 빈 문자열) ── */
  var unlocatedCnt=JOBS.filter(function(j){return !j.location||j.location.trim()==='';}).length;
  if(unlocatedCnt>0){locCounts['미지정']=unlocatedCnt;totalCount+=unlocatedCnt;}
  var allLocs=LOCATIONS.slice();
  if(unlocatedCnt>0)allLocs.push('미지정');

  /* 상단: 선택 지역 또는 전체 요약 */
  var topHtml='';
  if(_nationalSelectedLoc){
    var cnt=locCounts[_nationalSelectedLoc]||0;
    var pct=totalCount>0?(cnt/totalCount*100).toFixed(1):'0.0';
    var isMijung=_nationalSelectedLoc==='미지정';
    topHtml='<div style="padding:18px 20px;background:'+(isMijung?'#F9FAFB':'#FFFBEB')+';border-bottom:1px solid '+(isMijung?'#E5E7EB':'#FDE68A')+'">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'
      +'<span style="font-size:11px;font-weight:700;color:'+(isMijung?'#374151':'#92400E')+';text-transform:uppercase;letter-spacing:.06em">'+(isMijung?'📂 미지정 공고':'📍 선택 지역')+'</span>'
      +'<button onclick="setNationalLoc(\''+_nationalSelectedLoc+'\',event)" style="border:none;background:'+(isMijung?'#E5E7EB':'#FDE68A')+';color:'+(isMijung?'#374151':'#78350F')+';padding:3px 10px;border-radius:99px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">✕ 해제</button>'
      +'</div>'
      +'<p style="margin:0 0 10px;font-size:26px;font-weight:900;color:#000000">'+esc(_nationalSelectedLoc)+'</p>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div style="background:#fff;border-radius:10px;padding:10px 14px;border:1px solid '+(isMijung?'#E5E7EB':'#FDE68A')+'">'
      +'<p style="margin:0;font-size:10px;color:'+(isMijung?'#6B7280':'#92400E')+';font-weight:700">공고 수</p>'
      +'<p style="margin:4px 0 0;font-size:28px;font-weight:900;color:'+(isMijung?'#374151':'#F59E0B')+';line-height:1">'+cnt+'<span style="font-size:12px;color:'+(isMijung?'#6B7280':'#92400E')+';margin-left:2px">건</span></p>'
      +'</div>'
      +'<div style="background:#fff;border-radius:10px;padding:10px 14px;border:1px solid '+(isMijung?'#E5E7EB':'#FDE68A')+'">'
      +'<p style="margin:0;font-size:10px;color:'+(isMijung?'#6B7280':'#92400E')+';font-weight:700">전체 비중</p>'
      +'<p style="margin:4px 0 0;font-size:28px;font-weight:900;color:'+(isMijung?'#374151':'#F59E0B')+';line-height:1">'+pct+'<span style="font-size:12px;color:'+(isMijung?'#6B7280':'#92400E')+';margin-left:1px">%</span></p>'
      +'</div></div></div>';
  }else{
    topHtml='<div style="padding:18px 20px;background:#EFF6FF;border-bottom:1px solid #BFDBFE">'
      +'<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.06em">📊 전체 현황</p>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">'
      +'<div style="background:#fff;border-radius:10px;padding:10px 14px;border:1px solid #BFDBFE">'
      +'<p style="margin:0;font-size:10px;color:#1D4ED8;font-weight:700">총 공고</p>'
      +'<p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#2563EB;line-height:1">'+totalCount+'<span style="font-size:12px;color:#1D4ED8;margin-left:2px">건</span></p>'
      +'</div>'
      +'<div style="background:#fff;border-radius:10px;padding:10px 14px;border:1px solid #BFDBFE">'
      +'<p style="margin:0;font-size:10px;color:#1D4ED8;font-weight:700">집계 지역</p>'
      +'<p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#2563EB;line-height:1">'+LOCATIONS.length+'<span style="font-size:12px;color:#1D4ED8;margin-left:1px">개</span>'+(unlocatedCnt>0?'<span style="font-size:10px;color:#9CA3AF;margin-left:4px">+미지정</span>':'')+'</p>'
      +'</div></div></div>';
  }

  /* 순위 리스트 */
  var sorted=allLocs.slice().sort(function(a,b){return(locCounts[b]||0)-(locCounts[a]||0);});
  var RANK_MEDALS=['🥇','🥈','🥉'];
  var listHtml='<div style="padding:12px 20px 8px;border-bottom:1px solid #F3F4F6">'
    +'<p style="margin:0;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.08em">지역별 순위</p></div>';

  var tableRows=sorted.map(function(loc,i){
    var cnt=locCounts[loc]||0;
    var pct=totalCount>0?(cnt/totalCount*100).toFixed(1):'0.0';
    var isSel=_nationalSelectedLoc===loc;
    var rank=RANK_MEDALS[i]||(i+1)+'';
    var barW=totalCount>0?Math.max(4,Math.round(cnt/totalCount*100))+'%':'4%';
    var isMijung=loc==='미지정';
    return'<div onclick="setNationalLoc(\''+loc+'\',event)" style="display:flex;align-items:center;gap:10px;padding:10px 18px;cursor:pointer;border-bottom:1px solid #F7F7F9;background:'+(isSel?'#F0F0FF':'#FFFFFF')+';transition:background .14s" onmouseover="if(this.style.background!==\'#F0F0FF\')this.style.background=\'#FAFAFA\'" onmouseout="this.style.background=\''+(isSel?'#F0F0FF':'#FFFFFF')+'\'">'
      /* 랭크 */
      +'<span style="min-width:26px;font-size:'+(i<3?'14px':'10px')+';text-align:center">'+(typeof rank==='string'&&rank.length>2?rank:'<span style="font-size:10px;color:#CCCCCC;font-weight:600">'+rank+'위</span>')+'</span>'
      /* 메인 영역 */
      +'<div style="flex:1;min-width:0">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'
          +'<span style="font-size:12px;font-weight:'+(isSel?'800':'600')+';color:'+(isSel?'#4338CA':'#111111')+(isMijung?';opacity:.6':'')+'">'+esc(loc)+'</span>'
          +'<div style="display:flex;align-items:baseline;gap:5px">'
            +'<span style="font-size:16px;font-weight:200;color:'+(isSel?'#4338CA':'#0A0A0A')+';letter-spacing:-.04em;font-variant-numeric:tabular-nums">'+cnt+'</span>'
            +'<span style="font-size:9px;font-weight:500;color:#BBBBBB">'+pct+'%</span>'
          +'</div>'
        +'</div>'
        +'<div style="height:2px;background:#F0F0F4;border-radius:99px;overflow:hidden">'
          +'<div style="height:100%;width:'+barW+';background:'+(isSel?'linear-gradient(90deg,#A5B4FC,#6366F1)':'linear-gradient(90deg,#C7D2FE,#A5B4FC)')+';border-radius:99px;transition:width .35s"></div>'
        +'</div>'
      +'</div>'
    +'</div>';
  }).join('');

  return topHtml+listHtml+tableRows;
}

function renderNationalStatus(){
  var fFrom=_natFrom,fTo=_natTo,typ=_natType;
  var hasFilter=!!(fFrom||fTo);
  function inRange(ds){var d=(ds||'').slice(0,10);if(!d)return false;if(fFrom&&d<fFrom)return false;if(fTo&&d>fTo)return false;return true;}
  var periodLabel=hasFilter?(fFrom&&fTo?fFrom+' ~ '+fTo:fFrom?fFrom+' 이후':fTo+' 이전'):'전체 기간';

  /* 타입 필터 적용된 baseJobs */
  var baseJobs=JOBS.filter(function(j){
    if(hasFilter&&!inRange(j.docDate))return false;
    if(typ==='추천'&&!j.isRec)return false;
    if(typ==='지원'&&j.isRec)return false;
    return true;
  });

  var locCounts={};
  LOCATIONS.forEach(function(l){locCounts[l]=baseJobs.filter(function(j){return j.location===l;}).length;});
  var unlocatedCnt=baseJobs.filter(function(j){return !j.location||j.location.trim()==='';}).length;
  if(unlocatedCnt>0)locCounts['미지정']=unlocatedCnt;
  var allLocs=LOCATIONS.slice();
  if(unlocatedCnt>0)allLocs.push('미지정');
  var totalJobCount=baseJobs.length;

  var regionStats=allLocs.map(function(loc){
    var lj=loc==='미지정'?baseJobs.filter(function(j){return !j.location||j.location.trim()==='';})
      :baseJobs.filter(function(j){return j.location===loc;});
    var aps=lj.reduce(function(a,j){return a.concat(j.applicants);},[]);
    function pass(arr){return arr.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length;}
    var totalPass=pass(aps);
    return{loc:loc,cnt:lj.length,active:lj.filter(function(j){return !j.isClosed;}).length,
      aps:aps.length,pass:totalPass,rate:aps.length>0?Math.round(totalPass/aps.length*100):0};
  }).sort(function(a,b){return b.cnt-a.cnt;});

  var totalCount=regionStats.reduce(function(s,r){return s+r.cnt;},0);
  var totalAps=regionStats.reduce(function(s,r){return s+r.aps;},0);
  var totalPass=regionStats.reduce(function(s,r){return s+r.pass;},0);
  var overallRate=totalAps>0?Math.round(totalPass/totalAps*100):0;
  var topRegion=regionStats[0];

  /* ── 핸들러 ── */
  window._natClick=function(loc){
    var tbl=document.getElementById('_nat_tbl');
    var sy=tbl?tbl.scrollTop:0;
    _nationalSelectedLoc=(_nationalSelectedLoc===loc)?null:loc;
    renderView();
    setTimeout(function(){var el=document.getElementById('_nat_tbl');if(el)el.scrollTop=sy;},30);
  };
  window._natQuery=function(){
    var f=document.getElementById('_nat_from'),t=document.getElementById('_nat_to');
    _natFrom=f?f.value:'';_natTo=t?t.value:'';
    setTimeout(renderView,150);
  };
  window._natReset=function(){_natFrom='';_natTo='';_nationalSelectedLoc=null;renderView();};
  window._natSetType=function(t){_natType=t;_nationalSelectedLoc=null;renderView();};

  /* ── 색상 ── */
  function rateC(r){return r>=20?'#059669':r>=10?'#D97706':'#94A3B8';}
  function rateBg(r){return r>=20?'#F0FDF4':r>=10?'#FFFBEB':'#F8FAFC';}

  /* ── 테이블 행 ── */
  var tableRows=regionStats.map(function(r,idx){
    var isMijung=r.loc==='미지정';
    var isSel=_nationalSelectedLoc===r.loc;
    var rank=idx+1;
    var rankEl=rank===1?'<span style="font-size:15px">🥇</span>'
      :rank===2?'<span style="font-size:15px">🥈</span>'
      :rank===3?'<span style="font-size:15px">🥉</span>'
      :'<span style="font-size:11px;color:#CBD5E1;font-weight:700;width:18px;display:inline-block;text-align:center">'+rank+'</span>';
    var barW=totalCount>0?Math.round(r.cnt/totalCount*100):0;
    var barC=isSel?'#F59E0B':typ==='추천'?'#059669':typ==='지원'?'#2563EB':rank<=3?'#2563EB':'#93C5FD';
    return'<tr onclick="_natClick(\''+r.loc+'\')"'
      +' style="cursor:pointer;border-bottom:1px solid #F1F5F9;background:'+(isSel?'#FFFBEB':'')+';"'
      +' onmouseover="this.style.background=\''+(isSel?'#FFF7ED':'#F8FAFC')+'\'" onmouseout="this.style.background=\''+(isSel?'#FFFBEB':'')+'\';">'
      +'<td style="padding:11px 14px;white-space:nowrap">'
        +'<div style="display:flex;align-items:center;gap:8px">'
          +'<div style="width:22px;text-align:center;flex-shrink:0">'+rankEl+'</div>'
          +'<div>'
            +'<div style="font-size:14px;font-weight:'+(isSel?'800':'600')+';color:'+(isMijung?'#94A3B8':isSel?'#D97706':'#0F172A')+'">'+esc(r.loc)+'</div>'
            +'<div style="font-size:10px;color:#64748B;margin-top:1px">진행 '+r.active+'건</div>'
          +'</div>'
        +'</div>'
      +'</td>'
      +'<td style="padding:11px 12px">'
        +'<div style="display:flex;align-items:center;gap:8px">'
          +'<div style="flex:1;height:6px;background:#F1F5F9;border-radius:99px;overflow:hidden;min-width:36px"><div style="height:100%;width:'+barW+'%;background:'+barC+';border-radius:99px;transition:width .3s"></div></div>'
          +'<span style="font-size:15px;font-weight:800;color:'+(r.cnt>0?'#0F172A':'#CBD5E1')+';white-space:nowrap">'+r.cnt+'건</span>'
        +'</div>'
      +'</td>'
      +'<td style="padding:11px 12px;text-align:center;font-size:14px;font-weight:700;color:'+(r.aps>0?'#374151':'#E5E7EB')+';white-space:nowrap">'+(r.aps>0?r.aps+'명':'—')+'</td>'
      +'<td style="padding:11px 12px;text-align:center;font-size:14px;font-weight:700;color:'+(r.pass>0?'#059669':'#E5E7EB')+';white-space:nowrap">'+(r.pass>0?r.pass+'명':'—')+'</td>'
      +'<td style="padding:11px 12px;text-align:center">'
        +(r.aps>0?'<span style="background:'+rateBg(r.rate)+';color:'+rateC(r.rate)+';padding:4px 12px;border-radius:8px;font-size:13px;font-weight:800;white-space:nowrap">'+r.rate+'%</span>':'<span style="color:#E5E7EB">—</span>')
      +'</td>'
    +'</tr>';
  }).join('');

  /* ── 오른쪽 패널 ── */
  var panelHtml='';
  if(_nationalSelectedLoc){
    var selJobs=_nationalSelectedLoc==='미지정'
      ?baseJobs.filter(function(j){return !j.location||j.location.trim()==='';})
      :baseJobs.filter(function(j){return j.location===_nationalSelectedLoc;});
    var selSt=regionStats.find(function(r){return r.loc===_nationalSelectedLoc;})||{cnt:0,active:0,aps:0,pass:0,rate:0};
    var typLabel=typ==='추천'?'📌 추천 공고':typ==='지원'?'📝 지원 공고':'전체 공고';
    var typC=typ==='추천'?'#059669':typ==='지원'?'#2563EB':'#374151';
    var jobCards=selJobs.length===0
      ?'<div style="text-align:center;padding:40px 0;color:#CBD5E1"><div style="font-size:32px;margin-bottom:10px">📭</div><div style="font-size:13px;font-weight:600;color:#64748B">공고 없음</div></div>'
      :selJobs.map(function(j){
        var aps=j.applicants.length;
        var pass=j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length;
        var ivWait=j.applicants.filter(function(a){return a.status==='면접대기';}).length;
        var typeColor=j.isRec?'#059669':'#2563EB';
        var typeBg=j.isRec?'#F0FDF4':'#EFF6FF';
        var typeLabel=j.isRec?'📌 추천':'📝 지원';
        return'<div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:13px 16px;margin-bottom:10px;border-left:3px solid '+typeColor+'">'
          +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">'
            +'<div style="font-size:13px;font-weight:700;color:#0F172A;line-height:1.4;flex:1">'+esc(j.name.length>30?j.name.slice(0,30)+'…':j.name)+'</div>'
            +'<div style="display:flex;gap:4px;flex-shrink:0">'
              +'<span style="background:'+typeBg+';color:'+typeColor+';padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700">'+typeLabel+'</span>'
              +(j.isClosed?'<span style="background:#F1F5F9;color:#64748B;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700">마감</span>':'')
            +'</div>'
          +'</div>'
          +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'+badge(j.category)+(j.finalDate?dDayBadge(j.finalDate,false):'')+'</div>'
          +'<div style="display:flex;gap:12px;padding-top:7px;border-top:1px solid #F1F5F9">'
            +'<div style="font-size:12px;color:#64748B">지원 <span style="font-weight:700;color:#374151">'+aps+'</span>명</div>'
            +(pass>0?'<div style="font-size:12px;color:#059669;font-weight:700">✓ 합격 '+pass+'명</div>':'')
            +(ivWait>0?'<div style="font-size:12px;color:#D97706;font-weight:700">🎤 대기 '+ivWait+'명</div>':'')
          +'</div>'
        +'</div>';
      }).join('');

    panelHtml=''
      +'<div style="background:linear-gradient(135deg,#0F172A,#1E3A5F);padding:16px 18px;flex-shrink:0">'
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">'
          +'<div>'
            +'<div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:3px">'+esc(_nationalSelectedLoc)+'</div>'
            +'<div style="font-size:11px;color:#64748B">'+typLabel+' '+selSt.cnt+'건 · 클릭으로 다른 지역 선택</div>'
          +'</div>'
          +'<button onclick="_natClick(\''+_nationalSelectedLoc+'\')" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.12);border:none;font-size:14px;cursor:pointer;color:#64748B;display:flex;align-items:center;justify-content:center">✕</button>'
        +'</div>'
        +'<div style="display:flex;gap:8px">'
          +[['지원자',selSt.aps+'명','#60A5FA'],['합격',selSt.pass+'명','#34D399'],['합격률',(selSt.aps>0?selSt.rate+'%':'—'),'#FBBF24']].map(function(x){
            return'<div style="flex:1;background:rgba(255,255,255,.08);border-radius:9px;padding:8px;text-align:center">'
              +'<div style="font-size:17px;font-weight:900;color:'+x[2]+';line-height:1;margin-bottom:2px">'+x[1]+'</div>'
              +'<div style="font-size:10px;color:#64748B;font-weight:600">'+x[0]+'</div>'
            +'</div>';
          }).join('')
        +'</div>'
      +'</div>'
      +'<div style="flex:1;overflow-y:auto;padding:13px 14px">'+jobCards+'</div>';
  } else {
    panelHtml='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;padding:24px">'
      +'<div style="width:56px;height:56px;border-radius:16px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:26px">📍</div>'
      +'<div style="font-size:15px;font-weight:700;color:#374151">지역을 선택하세요</div>'
      +'<div style="font-size:13px;color:#64748B;text-align:center;line-height:1.8">왼쪽 표에서 지역 행을 클릭하면<br>해당 지역 공고 목록이 표시됩니다</div>'
    +'</div>';
  }

  /* ── 타입 토글 탭 ── */
  function typeTab(val,label,c,bg){
    var on=typ===val;
    return'<button onclick="_natSetType(\''+val+'\')" style="padding:6px 18px;border-radius:9px;border:'+(on?'none':'1px solid #E2E8F0')+';background:'+(on?bg:'#fff')+';color:'+(on?c:'#6B7280')+';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s">'+label+'</button>';
  }
  var typeTabs=''
    +typeTab('','전체','#0F172A','#F1F5F9')
    +typeTab('추천','📌 추천 채용','#fff','#059669')
    +typeTab('지원','📝 지원 채용','#fff','#2563EB');

  return'<div style="display:flex;flex-direction:column;height:100%;overflow:hidden;background:#F7F8FA">'
    +'<div style="flex-shrink:0;background:#fff;border-bottom:1px solid #E5E7EB">'
      /* 타이틀 + KPI */
      +'<div style="padding:11px 16px 8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
        +'<div style="display:flex;align-items:center;gap:10px">'
          +'<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#2563EB,#1E3A8A);display:flex;align-items:center;justify-content:center"><span style="font-size:15px">📊</span></div>'
          +'<div>'
            +'<div style="font-size:15px;font-weight:800;color:#0A0A0A">지역별 채용 현황</div>'
            +'<div style="font-size:10px;color:#9CA3AF">'+(hasFilter?'<span style="color:#7C3AED;font-weight:700">'+esc(periodLabel)+'</span> · ':'')+'서류접수일 기준</div>'
          +'</div>'
        +'</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
          +[['공고',totalJobCount+'건','#1D4ED8','#EFF6FF','#BFDBFE'],['지원자',totalAps+'명','#7C3AED','#F5F3FF','#DDD6FE'],['합격',totalPass+'명','#059669','#F0FDF4','#BBF7D0'],['합격률',overallRate+'%','#D97706','#FFFBEB','#FDE68A']].map(function(x){
            return'<div style="background:'+x[3]+';border:1px solid '+x[4]+';padding:4px 12px;border-radius:8px;font-size:11px;font-weight:700;color:'+x[2]+'"><span style="opacity:.7">'+x[0]+' </span>'+x[1]+'</div>';
          }).join('')
        +'</div>'
      +'</div>'
      /* 추천/지원 토글 + 날짜 조회 */
      +'<div style="padding:0 16px 10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
        +'<div style="display:flex;gap:5px;background:#F8FAFC;padding:4px;border-radius:11px;border:1px solid #E5E7EB">'+typeTabs+'</div>'
        +'<div style="flex:1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:'+(hasFilter?'#F5F3FF':'#F8FAFC')+';border:1.5px solid '+(hasFilter?'#C4B5FD':'#E5E7EB')+';border-radius:10px;padding:6px 12px">'
          +'<span style="font-size:11px;font-weight:700;color:'+(hasFilter?'#7C3AED':'#6B7280')+';white-space:nowrap">📅 서류접수일</span>'
          +'<input id="_nat_from" type="date" value="'+fFrom+'" onkeydown="if(event.key===\'Enter\')_natQuery()" style="border:1px solid '+(hasFilter?'#C4B5FD':'#E2E8F0')+';border-radius:7px;padding:4px 9px;font-size:12px;font-family:inherit;outline:none;color:#1F2937;background:#fff">'
          +'<span style="color:#CBD5E1;font-weight:700">—</span>'
          +'<input id="_nat_to" type="date" value="'+fTo+'" onkeydown="if(event.key===\'Enter\')_natQuery()" style="border:1px solid '+(hasFilter?'#C4B5FD':'#E2E8F0')+';border-radius:7px;padding:4px 9px;font-size:12px;font-family:inherit;outline:none;color:#1F2937;background:#fff">'
          +'<button onclick="_natQuery()" style="background:linear-gradient(135deg,#2563EB,#1E3A8A);color:#fff;border:none;padding:5px 14px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">🔍 조회</button>'
          +(hasFilter?'<button onclick="_natReset()" style="background:#FFF5F5;color:#EF4444;border:1px solid #FEE2E2;padding:5px 10px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">✕ 초기화</button>':'')
        +'</div>'
      +'</div>'
    +'</div>'
    +'<div style="flex:1;min-height:0;display:flex;overflow:hidden">'
      +'<div id="_nat_tbl" style="flex:1;min-width:0;overflow-y:auto;background:#fff;border-right:1px solid #E5E7EB">'
        +(totalJobCount===0
          ?'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;padding:40px"><div style="font-size:36px">🔍</div><div style="font-size:14px;font-weight:700;color:#374151">해당 조건 공고 없음</div><button onclick="_natReset()" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:8px 20px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:6px">초기화 · 전체 보기</button></div>'
          :'<table style="width:100%;border-collapse:collapse">'
            +'<thead><tr style="background:#F8FAFC;border-bottom:2px solid #E5E7EB;position:sticky;top:0;z-index:1">'
              +'<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:.05em;white-space:nowrap">지역</th>'
              +'<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:.05em">공고수</th>'
              +'<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:.05em">지원자</th>'
              +'<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:.05em">합격</th>'
              +'<th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:.05em">합격률</th>'
            +'</tr></thead>'
            +'<tbody>'+tableRows+'</tbody>'
          +'</table>'
        )
      +'</div>'
      +'<div style="flex:1;min-width:0;border-left:1px solid #E5E7EB;display:flex;flex-direction:column;overflow:hidden;background:#F8FAFC">'
        +panelHtml
      +'</div>'
    +'</div>'
  +'</div>';
}



















/* ── 인텔리전트 보드: SVG 지도 불필요 — 빈 stub 유지 ── */
function initNationalSVGMap(){
  /* 슬라이드 패널 애니메이션 */
  var panel=document.getElementById('_map_slide');
  if(panel){setTimeout(function(){panel.style.transform='translateX(0)';},30);}
}
