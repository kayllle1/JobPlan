'use strict';
/* AI 채용 브리핑 */
/* ── AI 요약 (Supabase Edge Function 'ai-briefing' → Claude) ── */
var _insightStats=null;
var _aiBriefing={key:'',status:'idle',text:'',error:''}; /* idle | loading | done | error */

/* 앞으로 14일 안의 마감·면접·발표 일정 (공고명과 날짜만) */
function _insightUpcoming(jobs){
  var end=new Date(new Date(TODAY).getTime()+14*86400000).toISOString().slice(0,10);
  var out=[];
  jobs.forEach(function(j){
    [['서류마감',j.applyDeadline||j.docDate],['면접',j.interviewDate],['최종발표',j.finalDate]].forEach(function(e){
      var d=(e[1]||'').slice(0,10);
      if(d&&d>=TODAY&&d<=end)out.push({job:j.name,what:e[0],date:d});
    });
  });
  return out.sort(function(a,b){return a.date<b.date?-1:1;}).slice(0,15);
}
function _aiBriefingKey(){return _insightStats?JSON.stringify(_insightStats):'';}

async function requestAiBriefing(){
  if(!_insightStats)return;
  var key=_aiBriefingKey();
  _aiBriefing={key:key,status:'loading',text:'',error:''};
  renderView();
  var res;
  try{res=await SB.functions.invoke('ai-briefing',{body:{period:_insightStats.period,stats:_insightStats}});}
  catch(e){res={error:e};}
  if(_aiBriefing.key!==key)return;
  var data=res&&res.data,err=res&&res.error;
  if(!err&&data&&data.error)err={message:data.error};
  if(err||!data||!data.summary){
    var msg=(err&&err.message)||'응답이 비어 있습니다.';
    if(/Failed to send|not found|404|FunctionsFetchError|FunctionsRelayError/i.test(msg))msg='AI 요약 서버(ai-briefing)가 아직 연결되지 않았어요. 관리자 설정이 필요합니다.';
    _aiBriefing={key:key,status:'error',text:'',error:msg};
  }else{
    _aiBriefing={key:key,status:'done',text:data.summary,error:''};
  }
  if(currentView==='insights')renderView();
}

/* **굵게**, - 목록, 1. 목록만 지원하는 간단한 표시기 (HTML은 모두 이스케이프) */
function _mdLite(t){
  return esc(t).split('\n').map(function(line){
    var l=line.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
    if(/^\s*[-•]\s+/.test(line))return'<div style="padding-left:14px;text-indent:-10px">• '+l.replace(/^\s*[-•]\s+/,'')+'</div>';
    if(/^\s*\d+\.\s+/.test(line))return'<div style="padding-left:16px;text-indent:-14px">'+l.trim()+'</div>';
    if(!line.trim())return'<div style="height:8px"></div>';
    return'<div>'+l+'</div>';
  }).join('');
}

function renderAiBriefingCard(){
  var fresh=_aiBriefing.key===_aiBriefingKey();
  var st=fresh?_aiBriefing.status:'idle';
  var btnLabel=st==='loading'?'<span style="display:inline-block;animation:spin 0.8s linear infinite">↻</span> 요약 중…':st==='done'?'↻ 다시 요약':'✨ AI로 요약하기';
  var body;
  if(st==='loading')body='<div style="color:#6D28D9;font-size:13px">현재 기간의 집계 숫자로 요약을 만들고 있어요…</div>';
  else if(st==='done')body='<div style="font-size:13.5px;color:#1E293B;line-height:1.75">'+_mdLite(_aiBriefing.text)+'</div>';
  else if(st==='error')body='<div style="font-size:12.5px;color:#B91C1C;line-height:1.6">⚠️ '+esc(_aiBriefing.error)+'</div>';
  else body='<div style="font-size:12.5px;color:#64748B;line-height:1.6">버튼을 누르면 아래 숫자(공고·지원자·합격 집계와 다가오는 일정)를 AI가 읽고 오늘 챙길 일을 문장으로 정리해 드려요. 지원자 이름·연락처는 보내지 않습니다.</div>';
  return'<div style="background:linear-gradient(135deg,#FAF5FF,#EEF2FF);border:1.5px solid #DDD6FE;border-radius:14px;padding:16px 20px;margin-bottom:14px">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
      +'<span style="font-size:10.5px;font-weight:800;color:#6D28D9;text-transform:uppercase;letter-spacing:.1em">🤖 AI 요약</span>'
      +(st==='done'?'<span style="font-size:10px;color:#8B5CF6;background:#EDE9FE;padding:1px 8px;border-radius:5px;font-weight:700">Claude</span>':'')
      +'<button class="no-print" onclick="requestAiBriefing()" '+(st==='loading'?'disabled ':'')+'style="margin-left:auto;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;opacity:'+(st==='loading'?'.6':'1')+'">'+btnLabel+'</button>'
    +'</div>'+body
  +'</div>';
}
function renderInsights(){
  var fFrom=_insightFrom, fTo=_insightTo;
  var hasFilter=!!(fFrom||fTo);
  var periodLabel=hasFilter?(fFrom&&fTo?fFrom+' ~ '+fTo:fFrom?fFrom+' 이후':fTo+' 이전'):'전체 기간';

  /* ── 기간 내 날짜 판별 ── */
  function inRange(ds){
    var d=(ds||'').slice(0,10); if(!d) return !hasFilter;
    if(fFrom&&d<fFrom) return false;
    if(fTo&&d>fTo) return false;
    return true;
  }

  /* ── 기간 기준 데이터 필터링 ── */
  var filtJobs=hasFilter
    ? JOBS.filter(function(j){ return inRange(j.docDate)||inRange(j.interviewDate)||inRange(j.finalDate)||inRange(j.applyDeadline); })
    : JOBS;

  /* 기간 내 서류접수 공고 → 지원자 집계 */
  var docPeriodJobs=filtJobs.filter(function(j){ return hasFilter?inRange(j.docDate):true; });
  var periodAps=docPeriodJobs.reduce(function(a,j){return a.concat(j.applicants);},[]);

  /* 기간 내 최종발표 공고 → 합격/불합격 */
  var finalPeriodJobs=filtJobs.filter(function(j){ return hasFilter?inRange(j.finalDate):true; });
  var periodPass=finalPeriodJobs.reduce(function(a,j){
    return a.concat(j.applicants.filter(function(ap){return ap.status==='최종합격'||ap.status==='취업성공';}));
  },[]);
  var periodFail=finalPeriodJobs.reduce(function(a,j){
    return a.concat(j.applicants.filter(function(ap){return ap.status==='불합격';}));
  },[]);

  /* 기간 내 면접 공고 → 면접 대기 */
  var ivPeriodJobs=filtJobs.filter(function(j){ return hasFilter?inRange(j.interviewDate):true; });
  var periodIvWait=ivPeriodJobs.reduce(function(a,j){
    return a.concat(j.applicants.filter(function(ap){return ap.status==='면접대기';}));
  },[]);

  /* 스테이지별 집계 */
  var byS={'서류접수':0,'서류합격':0,'면접대기':0,'최종합격':0,'불합격':0};
  periodAps.forEach(function(a){if(byS[a.status]!==undefined)byS[a.status]++;});

  var activeJobs=filtJobs.filter(function(j){return !j.isClosed;});
  var pass=periodPass.length;
  var fail=periodFail.length;
  var passRate=periodAps.length>0?Math.round(pass/periodAps.length*100):0;
  var ivWaitCnt=periodIvWait.length;

  /* 기간 내 날짜별 이벤트 집계 */
  var noApJobs=activeJobs.filter(function(j){return j.applicants.length===0;});
  var unlocated=filtJobs.filter(function(j){return !j.location||j.location.trim()==='';});
  var catMap={};filtJobs.forEach(function(j){var c=j.category||'기타';catMap[c]=(catMap[c]||0)+1;});
  var topCat=Object.entries(catMap).sort(function(a,b){return b[1]-a[1];})[0];

  /* ── 분석 생성 (기간 기준) ── */
  var ts=new Date().toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  var trend=passRate>=20?'상승':passRate>=10?'유지':pass===0&&filtJobs.length>0?'데이터 없음':'하락';
  var trendC=trend==='상승'?'#059669':trend==='하락'?'#DC2626':trend==='유지'?'#D97706':'#94A3B8';
  var trendE=trend==='상승'?'📈':trend==='하락'?'📉':trend==='유지'?'➡️':'📊';
  var trendR=trend==='상승'?'합격률 양호 수준':trend==='유지'?'합격률 평균 수준':trend==='하락'?'합격률 개선 필요':'합격 데이터 없음';

  /* 헤드라인 */
  var headline=hasFilter
    ?('['+periodLabel+'] '+filtJobs.length+'건 공고 · 지원자 '+periodAps.length+'명 · 합격 '+pass+'명')
    :(activeJobs.length+'건 진행 중 · 지원자 '+periodAps.length+'명 · 합격 '+pass+'명');

  /* 종합 분석 */
  var summaryParts=[];
  if(hasFilter){
    summaryParts.push('['+periodLabel+'] 기간에 해당하는 공고 '+filtJobs.length+'건이 분석 대상입니다.');
    if(periodAps.length>0)summaryParts.push('서류접수 기준 지원자 '+periodAps.length+'명 중 최종합격 '+pass+'명(합격률 '+passRate+'%).');
    else summaryParts.push('해당 기간 내 서류접수 데이터가 없습니다.');
    if(ivWaitCnt>0)summaryParts.push('면접 대기 중인 지원자는 '+ivWaitCnt+'명입니다.');
  } else {
    summaryParts.push('전체 공고 '+JOBS.length+'건 중 '+activeJobs.length+'건이 현재 진행 중입니다.');
    if(periodAps.length>0)summaryParts.push('전체 지원자 '+periodAps.length+'명 중 최종합격 '+pass+'명(합격률 '+passRate+'%).');
    if(topCat)summaryParts.push(topCat[0]+' 분야 공고가 '+topCat[1]+'건으로 가장 많습니다.');
  }

  /* 알림 — 기간 기준 */
  var alerts=[];
  if(filtJobs.length===0&&hasFilter){
    alerts.push({title:'해당 기간 공고 없음',desc:'['+periodLabel+'] 범위에 해당하는 공고가 없습니다. 날짜 범위를 변경해보세요.',type:'info'});
  } else {
    if(pass===0&&periodAps.length>0)alerts.push({title:'기간 내 최종합격 없음',desc:'지원자 '+periodAps.length+'명 중 아직 최종합격자가 없습니다. 진행 단계를 확인하세요.',type:'warning'});
    if(passRate>0&&passRate<10)alerts.push({title:'합격률 '+passRate+'% — 낮은 수준',desc:'기간 내 지원자 대비 합격률이 10% 미만입니다. 채용 기준을 재검토하세요.',type:'warning'});
    if(noApJobs.length>0)alerts.push({title:'지원자 없는 공고 '+noApJobs.length+'건',desc:noApJobs.slice(0,3).map(function(j){return j.name.slice(0,18);}).join(', ')+(noApJobs.length>3?' 외':'')+'.',type:'warning'});
    if(ivWaitCnt>0)alerts.push({title:'면접 대기 '+ivWaitCnt+'명',desc:'기간 내 면접 공고의 대기 지원자 결과를 입력해주세요.',type:'info'});
    if(fail>pass&&fail>0)alerts.push({title:'불합격 비율 높음 ('+fail+'명)',desc:'합격 '+pass+'명 대비 불합격 '+fail+'명. 채용 기준 또는 매칭 방식을 검토하세요.',type:'info'});
    if(unlocated.length>0)alerts.push({title:'지역 미입력 '+unlocated.length+'건',desc:'지역 정보가 없는 공고는 전국 현황 통계에서 누락됩니다.',type:'info'});
    if(alerts.length===0)alerts.push({title:'특이사항 없음',desc:'기간 내 긴급하게 처리할 알림이 없습니다.',type:'info'});
  }

  /* 액션 — 기간 기준 */
  var actions=[];
  if(filtJobs.length===0&&hasFilter){
    actions.push({title:'날짜 범위 조정',desc:'다른 기간을 선택하거나 초기화 후 전체 데이터를 확인해보세요.',priority:'medium'});
  } else {
    if(ivWaitCnt>0)actions.push({title:'면접 결과 입력',desc:'기간 내 면접 대기 '+ivWaitCnt+'명의 결과를 공고관리에서 업데이트하세요.',priority:'high'});
    if(passRate<10&&periodAps.length>3)actions.push({title:'합격률 개선 검토',desc:'기간 내 합격률 '+passRate+'%. 서류 기준 또는 지원자 매칭 방식을 재검토하세요.',priority:'high'});
    if(noApJobs.length>0)actions.push({title:'무지원 공고 홍보',desc:noApJobs.length+'건 공고에 지원자가 없습니다. 홍보 채널을 다양화하세요.',priority:'medium'});
    if(unlocated.length>0)actions.push({title:'지역 정보 입력',desc:unlocated.length+'건 지역 미입력 공고를 수정하면 전국 통계 정확도가 높아집니다.',priority:'medium'});
    if(actions.length===0)actions.push({title:'정기 데이터 점검',desc:'기간 내 데이터가 정상 집계되고 있습니다. 정기적으로 공고 상태를 업데이트하세요.',priority:'low'});
  }

  /* 강점 / 개선 — 기간 기준 */
  var positives=[],concerns=[];
  if(filtJobs.length>0){positives.push('기간 내 분석 대상 공고 '+filtJobs.length+'건');}
  if(pass>0)positives.push('최종합격 '+pass+'명 배출');
  if(passRate>=15)positives.push('합격률 '+passRate+'% — 양호');
  if(topCat&&catMap[topCat[0]]>1)positives.push(topCat[0]+' 분야 집중 운영('+catMap[topCat[0]]+'건)');
  if(positives.length===0)positives.push('기간 설정 후 데이터가 쌓이면 강점이 나타납니다');
  if(passRate<10&&periodAps.length>3)concerns.push('합격률 '+passRate+'% — 개선 필요');
  if(noApJobs.length>0)concerns.push('지원자 없는 공고 '+noApJobs.length+'건');
  if(unlocated.length>0)concerns.push('지역 미입력으로 통계 누락');
  if(fail>pass*2&&fail>0)concerns.push('불합격('+fail+'명) > 합격('+pass+'명) 2배');
  if(concerns.length===0)concerns.push('현재 특이 우려사항 없음');

  /* ── HTML 조각 ── */
  function mkAlert(a){
    var c=a.type==='danger'?'#EF4444':a.type==='warning'?'#F59E0B':'#3B82F6';
    var bg=a.type==='danger'?'#FFF1F2':a.type==='warning'?'#FFFBEB':'#EFF6FF';
    var em=a.type==='danger'?'🚨':a.type==='warning'?'⚠️':'ℹ️';
    return'<div style="background:'+bg+';border-left:3.5px solid '+c+';border-radius:0 10px 10px 0;padding:11px 14px;margin-bottom:8px">'
      +'<div style="font-size:13px;font-weight:800;color:'+c+';margin-bottom:4px">'+em+' '+esc(a.title)+'</div>'
      +'<div style="font-size:12px;color:#1F2937;line-height:1.6">'+esc(a.desc)+'</div></div>';
  }
  function mkAction(a){
    var c=a.priority==='high'?'#DC2626':a.priority==='medium'?'#D97706':'#6B7280';
    var lbl=a.priority==='high'?'긴급':a.priority==='medium'?'권장':'참고';
    return'<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F3F4F6">'
      +'<span style="background:'+c+'15;color:'+c+';font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;flex-shrink:0;margin-top:2px">'+lbl+'</span>'
      +'<div><div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:3px">'+esc(a.title)+'</div>'
      +'<div style="font-size:12px;color:#4B5563;line-height:1.6">'+esc(a.desc)+'</div></div></div>';
  }
  var posH=positives.map(function(p){return'<li style="font-size:12px;color:#065F46;padding:4px 0;list-style:none;line-height:1.5">✓ '+esc(p)+'</li>';}).join('');
  var conH=concerns.map(function(p){return'<li style="font-size:12px;color:#991B1B;padding:4px 0;list-style:none;line-height:1.5">△ '+esc(p)+'</li>';}).join('');

  /* KPI 카드 */
  var kpiCards=[
    {lbl:'기간 내 공고',val:filtJobs.length,unit:'건',c:'#2563EB',bg:'#EFF6FF',bd:'#BFDBFE',sub:hasFilter?periodLabel:'전체'},
    {lbl:'지원자',val:periodAps.length,unit:'명',c:'#7C3AED',bg:'#F5F3FF',bd:'#DDD6FE',sub:'서류접수 기준'},
    {lbl:'최종합격',val:pass,unit:'명',c:'#059669',bg:'#F0FDF4',bd:'#BBF7D0',sub:'불합격 '+fail+'명'},
    {lbl:'합격률',val:passRate+'%',unit:'',c:'#D97706',bg:'#FFFBEB',bd:'#FCD34D',sub:'지원자 대비'},
    {lbl:'면접 대기',val:ivWaitCnt,unit:'명',c:'#64748B',bg:'#F8FAFC',bd:'#E2E8F0',sub:'결과 입력 필요'},
  ].map(function(k){
    return'<div style="flex:1;min-width:110px;background:'+k.bg+';border:1.5px solid '+k.bd+';border-radius:14px;padding:14px 16px;text-align:center">'
      +'<div style="font-size:10px;font-weight:700;color:'+k.c+';margin-bottom:6px;letter-spacing:.04em">'+k.lbl+'</div>'
      +'<div style="font-size:28px;font-weight:900;color:'+k.c+';line-height:1">'+k.val+'<span style="font-size:13px;font-weight:600;margin-left:2px">'+k.unit+'</span></div>'
      +'<div style="font-size:10px;color:'+k.c+';opacity:.65;margin-top:4px">'+k.sub+'</div>'
    +'</div>';
  }).join('');

  /* AI 요약에 보낼 집계 숫자 (개인 이름·연락처는 넣지 않는다) */
  _insightStats={
    period:periodLabel,
    jobs:filtJobs.length,activeJobs:activeJobs.length,applicants:periodAps.length,
    finalPass:pass,fail:fail,passRate:passRate,interviewWaiting:ivWaitCnt,
    byStage:byS,byCategory:catMap,
    noApplicantJobs:noApJobs.slice(0,10).map(function(j){return j.name;}),
    unlocatedJobs:unlocated.length,
    upcoming:_insightUpcoming(activeJobs),
    thisWeekInterviewees:getThisWeekInterviews().length,
    docsSentNoReply7d:getLongPendingNoReply().length
  };

  var _insightHtml=''
    +renderAiBriefingCard()
    /* 헤드라인 배너 */
    +'<div style="background:linear-gradient(135deg,#0F172A,#1E3A5F);border-radius:16px;padding:20px 24px;margin-bottom:14px;position:relative;overflow:hidden">'
      +'<div style="position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:80px;opacity:.05;pointer-events:none">✨</div>'
      +'<div style="font-size:10px;font-weight:700;color:#7DD3FC;letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px">SMART BRIEFING · '+ts
        +(hasFilter?' · <span style="background:rgba(255,255,255,.15);padding:2px 10px;border-radius:99px">'+esc(periodLabel)+'</span>':'')
      +'</div>'
      +'<div style="font-size:18px;font-weight:900;color:#fff;line-height:1.4;margin-bottom:11px">'+esc(headline)+'</div>'
      +'<div style="display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.1);border-radius:99px;padding:5px 14px">'
        +'<span style="font-size:14px">'+trendE+'</span>'
        +'<span style="font-size:12px;font-weight:800;color:'+trendC+'">'+trend+'</span>'
        +'<span style="font-size:12px;color:#64748B"> · '+trendR+'</span>'
      +'</div>'
    +'</div>'
    /* KPI 카드 (크게, 명확하게) */
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'+kpiCards+'</div>'
    /* 종합 분석 */
    +'<div style="background:#fff;border-radius:14px;border:1px solid #E5E7EB;padding:16px 20px;margin-bottom:14px">'
      +'<div style="font-size:10.5px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:11px">📋 종합 분석'
        +(hasFilter?' <span style="font-size:10px;background:#EDE9FE;color:#7C3AED;padding:1px 8px;border-radius:5px;font-weight:700">'+esc(periodLabel)+'</span>':'')
      +'</div>'
      +'<div style="font-size:14px;color:#1E293B;line-height:1.9;font-weight:500">'+summaryParts.join(' ')+'</div>'
    +'</div>'
    /* 3단 */
    +'<div style="display:flex;gap:12px;flex-wrap:wrap">'
      +'<div style="flex:1.4;min-width:210px;background:#fff;border-radius:14px;border:1px solid #E5E7EB;padding:16px 18px">'
        +'<div style="font-size:10.5px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:11px">🔔 주요 알림</div>'
        +alerts.map(mkAlert).join('')
      +'</div>'
      +'<div style="flex:1.4;min-width:210px;background:#fff;border-radius:14px;border:1px solid #E5E7EB;padding:16px 18px">'
        +'<div style="font-size:10.5px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">💡 추천 액션</div>'
        +actions.map(mkAction).join('')
      +'</div>'
      +'<div style="flex:1;min-width:170px;display:flex;flex-direction:column;gap:11px">'
        +'<div style="background:#F0FDF4;border-radius:14px;border:1px solid #BBF7D0;padding:14px 16px;flex:1">'
          +'<div style="font-size:11px;font-weight:800;color:#059669;margin-bottom:9px">강점</div>'
          +'<ul style="margin:0;padding:0">'+posH+'</ul></div>'
        +'<div style="background:#FFF1F2;border-radius:14px;border:1px solid #FECDD3;padding:14px 16px;flex:1">'
          +'<div style="font-size:11px;font-weight:800;color:#DC2626;margin-bottom:9px">개선 필요</div>'
          +'<ul style="margin:0;padding:0">'+conH+'</ul></div>'
      +'</div>'
    +'</div>';

  /* ── 조회 / 새로고침 / 출력 함수 ── */
  window._queryInsight=function(){
    var f=document.getElementById('_ins_from_inp');
    var t=document.getElementById('_ins_to_inp');
    _insightFrom=f?f.value:'';
    _insightTo=t?t.value:'';
    var btn=document.getElementById('_ins_query_btn');
    if(btn){btn.disabled=true;btn.textContent='조회 중…';}
    setTimeout(function(){renderView();},200);
  };
  window._refreshInsight=function(){
    var btn=document.getElementById('_ins_refresh_btn');
    var out=document.getElementById('_ins_out');
    if(!btn||!out)return;
    btn.disabled=true;
    btn.innerHTML='<span style="display:inline-block;animation:spin 0.8s linear infinite">↻</span>';
    out.style.opacity='0.4';out.style.transition='opacity .2s';
    setTimeout(function(){renderView();},350);
  };
  window._printInsight=function(){
    var out=document.getElementById('_ins_out');if(!out)return;
    var org=new Date().toLocaleString('ko-KR');
    var pw=window.open('','_blank','width=1100,height=800');
    pw.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>AI 채용 브리핑</title>'
      +'<style>*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
      +'body{font-family:"Apple SD Gothic Neo","Malgun Gothic",sans-serif;margin:0;padding:24px 32px;background:#fff;font-size:13px}'
      +'.no-print{margin-bottom:14px;text-align:right}'
      +'@media print{.no-print{display:none}}</style></head><body>'
      +'<div class="no-print">'
        +'<button onclick="window.print()" style="background:#7C3AED;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px">🖨️ 인쇄 / PDF 저장</button>'
        +'<button onclick="window.close()" style="background:#F1F5F9;color:#1F2937;border:1px solid #E2E8F0;padding:8px 16px;border-radius:8px;font-size:13px;cursor:pointer">닫기</button>'
        +'<span style="margin-left:12px;font-size:11px;color:#64748B">'+org+' · '+esc(periodLabel)+'</span>'
      +'</div>'
      +out.innerHTML+'</body></html>');
    pw.document.close();
  };

  /* ── 최종 HTML ── */
  return'<div style="display:flex;flex-direction:column;height:100%;overflow:hidden;background:#F7F8FA">'
    /* 헤더 */
    +'<div style="flex-shrink:0;padding:11px 18px 10px;background:#fff;border-bottom:1px solid #F1F5F9">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:9px">'
        +'<div style="display:flex;align-items:center;gap:10px">'
          +'<div style="width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#7C3AED,#4F46E5);display:flex;align-items:center;justify-content:center"><span style="font-size:14px">✨</span></div>'
          +'<div>'
            +'<div style="font-size:15px;font-weight:800;color:#0A0A0A">AI 채용 브리핑</div>'
            +'<div style="font-size:10px;color:#9CA3AF">기간을 선택하고 조회하면 해당 기간 데이터로 분석합니다</div>'
          +'</div>'
        +'</div>'
        +'<div style="display:flex;gap:6px;align-items:center">'
          +'<button id="_ins_refresh_btn" onclick="_refreshInsight()" title="현재 설정으로 다시 분석" style="background:#F1F5F9;color:#1F2937;border:1px solid #E2E8F0;padding:7px 11px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;min-width:38px">↻</button>'
          +'<button onclick="_printInsight()" style="background:#F8FAFC;color:#1F2937;border:1px solid #E2E8F0;padding:7px 12px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">🖨️ 출력</button>'
        +'</div>'
      +'</div>'
      /* 날짜 조회 바 */
      +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:'+(hasFilter?'#F5F3FF':'#F8FAFC')+';border:1.5px solid '+(hasFilter?'#C4B5FD':'#E5E7EB')+';border-radius:11px;padding:9px 13px">'
        +'<span style="font-size:12px;font-weight:700;color:'+(hasFilter?'#7C3AED':'#6B7280')+';white-space:nowrap">📅 분석 기간</span>'
        +'<input id="_ins_from_inp" type="date" value="'+fFrom+'" onkeydown="if(event.key===\'Enter\')_queryInsight()" style="border:1px solid '+(hasFilter?'#C4B5FD':'#E2E8F0')+';border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit;outline:none;color:#1F2937;background:#fff">'
        +'<span style="color:#CBD5E1;font-weight:700;font-size:13px">—</span>'
        +'<input id="_ins_to_inp" type="date" value="'+fTo+'" onkeydown="if(event.key===\'Enter\')_queryInsight()" style="border:1px solid '+(hasFilter?'#C4B5FD':'#E2E8F0')+';border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit;outline:none;color:#1F2937;background:#fff">'
        +'<button id="_ins_query_btn" onclick="_queryInsight()" style="background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;border:none;padding:7px 18px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(124,58,237,.3);white-space:nowrap">🔍 조회</button>'
        +(hasFilter
          ?'<button onclick="_insightFrom=\'\';_insightTo=\'\';renderView()" style="background:#FFF5F5;color:#EF4444;border:1px solid #FEE2E2;padding:7px 12px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">✕ 초기화</button>'
            +'<span style="background:#EDE9FE;color:#7C3AED;padding:3px 10px;border-radius:7px;font-size:11px;font-weight:700">'+esc(periodLabel)+' · '+filtJobs.length+'건</span>'
          :'<span style="font-size:11px;color:#64748B">날짜를 선택하고 🔍 조회를 누르면 해당 기간으로 분석합니다</span>'
        )
      +'</div>'
    +'</div>'
    +'<div style="flex:1;overflow-y:auto;padding:14px 18px 28px" id="_ins_out">'+_insightHtml+'</div>'
  +'</div>';
}
