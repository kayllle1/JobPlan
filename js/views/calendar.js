'use strict';
/* 일정 캘린더 */
/* ══ 일정 캘린더 ══ */
var _calMonth=MONTH;


function openCalJobLink(jobId, encodedUrl){
  var url=encodedUrl?decodeURIComponent(encodedUrl):'';
  if(url){
    window.open(url,'_blank');
  } else {
    openCalJobModal(jobId);
  }
}

function openCalJobModal(jobId){
  var job=JOBS.find(function(j){return String(j.id)===String(jobId);});
  if(!job)return;
  var ex=document.getElementById('_calJobModal');if(ex)ex.remove();
  function fd(ds){return ds?String(ds).slice(0,10):'-';}
  var cat=job.category||'기타';
  var catC={'법원':'#3B82F6','의회':'#7C3AED','국회':'#EC4899','검찰청':'#EF4444','공공기관':'#059669','라이브콘텐츠':'#F59E0B','VOD':'#F97316','데이터속기사':'#06B6D4','현장속기사':'#8B5CF6'};
  var cc=catC[cat]||'#64748B';
  var dates=[
    ['📋 서류접수',fd(job.docDate),'#3B82F6'],
    ['🚫 지원마감',fd(job.applyDeadline),'#EF4444'],
    ['✅ 서류합격',fd(job.documentPassDate),'#7C3AED'],
    ['🎤 면접',fd(job.interviewDate),'#F59E0B'],
    ['🏆 합격발표',fd(job.finalDate),'#059669']
  ];
  var dateCards=dates.map(function(x){
    return '<div style="background:#F8FAFC;border-radius:8px;padding:8px 12px">'
      +'<div style="font-size:10px;color:#94A3B8;font-weight:600;margin-bottom:2px">'+x[0]+'</div>'
      +'<div style="font-size:13px;font-weight:700;color:'+(x[1]==='-'?'#CBD5E1':x[2])+'">'+x[1]+'</div>'
    +'</div>';
  }).join('');
  var memoHtml=job.memo
    ?'<div style="background:#FFFBEB;border-radius:8px;padding:10px 12px;margin-bottom:12px">'
      +'<div style="font-size:11px;color:#B45309;font-weight:700;margin-bottom:4px">📝 메모</div>'
      +'<div style="font-size:12px;color:#78350F;line-height:1.5">'+esc(job.memo)+'</div>'
    +'</div>':'';
  var el=document.createElement('div');
  el.id='_calJobModal';
  el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  el.onclick=function(e){if(e.target===el)el.remove();};
  el.innerHTML='<div style="background:#fff;border-radius:16px;width:min(520px,100%);max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
    +'<div style="padding:20px 24px 16px;border-bottom:1px solid #F1F5F9;display:flex;align-items:flex-start;gap:12px">'
      +'<div style="width:36px;height:36px;border-radius:10px;background:'+cc+'18;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
        +'<i class="ti ti-building" style="font-size:18px;color:'+cc+'"></i>'
      +'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:16px;font-weight:800;color:#0F172A;line-height:1.3">'+esc(job.name)+'</div>'
        +'<div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">'
          +'<span style="background:'+cc+'18;color:'+cc+';font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px">'+cat+'</span>'
          +(job.location?'<span style="background:#F1F5F9;color:#64748B;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px">'+esc(job.location)+'</span>':'')
        +'</div>'
      +'</div>'
      +'<button id="_calModalClose" style="background:none;border:none;font-size:20px;color:#94A3B8;cursor:pointer;line-height:1;padding:0">×</button>'
    +'</div>'
    +'<div style="padding:16px 24px">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">'+dateCards+'</div>'
      +memoHtml
      +'<div style="display:flex;gap:8px;justify-content:flex-end;padding-top:12px;border-top:1px solid #F1F5F9">'
        +'<button id="_calModalCancel" style="padding:8px 16px;border-radius:8px;border:1.5px solid #E2E8F0;background:#fff;color:#374151;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">닫기</button>'
        +'<button id="_calModalGo" style="padding:8px 16px;border-radius:8px;border:none;background:#2563EB;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">공고관리에서 보기</button>'
      +'</div>'
    +'</div>'
  +'</div>';
  document.body.appendChild(el);
  document.getElementById('_calModalClose').onclick=function(){el.remove();};
  document.getElementById('_calModalCancel').onclick=function(){el.remove();};
  document.getElementById('_calModalGo').onclick=function(){
    el.remove();
    currentView='jobs';
    jobFilter.cat=cat;
    renderView();
    setTimeout(function(){toggleDetail(String(jobId));},350);
  };
}

function renderCalendar(){
  var parts=_calMonth.split('-');
  var cy=parseInt(parts[0]),cm=parseInt(parts[1]);
  var firstDay=new Date(cy,cm-1,1).getDay();
  var daysInMonth=new Date(cy,cm,0).getDate();
  var daysInPrev=new Date(cy,cm-1,0).getDate();

  /* ── 이벤트 수집 ── */
  var evMap={};
  JOBS.forEach(function(j){
    if(j.isClosed)return;
    var jn=j.name.length>16?j.name.slice(0,16)+'…':j.name;
    var cat=j.category||'기타';
    function mark(ds,lbl,c){
      if(!ds)return;
      var d=String(ds).slice(0,10);
      if(d.slice(0,7)!==_calMonth)return;
      if(!evMap[d])evMap[d]=[];
      evMap[d].push({lbl:lbl,c:c,jn:jn,fullName:j.name,cat:cat,jobId:j.id,jobUrl:j.jobUrl||'',isRec:!!j.isRec});
    }
    mark(j.docDate,'서류접수','#3B82F6');
    mark(j.applyDeadline,'지원마감','#EF4444');
    mark(j.documentPassDate,'서류합격','#7C3AED');
    mark(j.interviewDate,'면접','#F59E0B');
    mark(j.finalDate,'합격발표','#059669');
  });

  /* 각 날짜 이벤트를 지정 순서로 정렬 */
  var EV_ORDER={'서류접수':0,'지원마감':1,'서류합격':2,'면접':3,'합격발표':4};
  Object.keys(evMap).forEach(function(d){
    evMap[d].sort(function(a,b){
      return (EV_ORDER[a.lbl]!==undefined?EV_ORDER[a.lbl]:99)
           - (EV_ORDER[b.lbl]!==undefined?EV_ORDER[b.lbl]:99);
    });
  });

  /* ── 날짜 셀 생성 ── */
  var cells=[];
  for(var p=firstDay-1;p>=0;p--)cells.push({day:daysInPrev-p,cur:false});
  for(var d=1;d<=daysInMonth;d++)cells.push({day:d,cur:true});
  var rem=(7-cells.length%7)%7;
  for(var n=1;n<=rem;n++)cells.push({day:n,cur:false});

  var DOW=['일','월','화','수','목','금','토'];
  var dowHtml=DOW.map(function(d,i){
    return'<div style="text-align:center;font-size:11px;font-weight:700;padding:8px 0 6px;color:'+(i===0?'#EF4444':i===6?'#3B82F6':'#64748B')+'">'+d+'</div>';
  }).join('');

  /* ── 셀 렌더 (이벤트 카드 포함) ── */
  var gridCells=cells.map(function(cell){
    if(!cell.cur){
      return'<div style="min-height:120px;background:#FAFAFA;border:1px solid #F1F5F9;border-radius:6px;padding:6px;opacity:.4">'
        +'<span style="font-size:14px;color:#CBD5E1">'+cell.day+'</span>'
      +'</div>';
    }
    var dStr=cy+'-'+(cm<10?'0':'')+cm+'-'+(cell.day<10?'0':'')+cell.day;
    var isT=dStr===TODAY;
    var evs=evMap[dStr]||[];
    /* 이벤트 카드: 레이블 + 기관명 */
    var eHtml=evs.map(function(ev){
      return'<div title="'+esc(ev.fullName)+' · '+ev.lbl+'" onclick="openCalJobLink(\''+ev.jobId+'\',\''+encodeURIComponent(ev.jobUrl||'')+'\')" style="margin-top:4px;background:'+ev.c+'18;border-left:3px solid '+ev.c+';border-radius:0 6px 6px 0;padding:3px 6px 3px 7px;cursor:pointer">'
        +'<div style="font-size:10.5px;font-weight:800;color:'+ev.c+';line-height:1.3">'+ev.lbl+'</div>'
        +'<div style="font-size:11px;font-weight:600;color:#1E293B;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(ev.jn)+(ev.isRec?'<span style="background:#FEF3C7;color:#92400E;font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;margin-left:3px"> 추천</span>':'')+'</div>'
      +'</div>';
    }).join('');

    return'<div '+(isT?'id="cal-today"':'')+' style="min-height:120px;border:1.5px solid '+(isT?'#3B82F6':'#E5E7EB')+';border-radius:8px;background:'+(isT?'#EFF6FF':'#FFFFFF')+';padding:6px;box-shadow:'+(isT?'0 0 0 2px #BFDBFE':'none')+'">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px">'
        +'<span style="font-size:14px;font-weight:'+(isT?'900':'700')+';width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:'+(isT?'#2563EB':'transparent')+';color:'+(isT?'#fff':'#374151')+'">'+cell.day+'</span>'
        +(evs.length>0?'<span style="font-size:10px;font-weight:700;color:#64748B">'+evs.length+'건</span>':'')
      +'</div>'
      +eHtml
    +'</div>';
  }).join('');

  /* ── 이번달 전체 이벤트 수 ── */
  var allEvs=[];
  Object.keys(evMap).sort().forEach(function(d){evMap[d].forEach(function(ev){allEvs.push(Object.assign({},ev,{date:d}));});});

  /* ── 월 이동 ── */
  function adj(n){var d=new Date(cy,cm-1+n,1);return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1);}

  /* ── 범례 ── */
  var legend=[['서류접수','#3B82F6'],['지원마감','#EF4444'],['서류합격','#7C3AED'],['면접','#F59E0B'],['합격발표','#059669']].map(function(x){
    return'<div style="display:flex;align-items:center;gap:5px"><div style="width:3px;height:16px;border-radius:99px;background:'+x[1]+'"></div><span style="font-size:12px;color:#4B5563;font-weight:700">'+x[0]+'</span></div>';
  }).join('');

  return'<div style="display:flex;flex-direction:column;height:100%;background:#F8FAFC;overflow:hidden">'
    /* 헤더 */
    +'<div style="flex-shrink:0;padding:13px 20px 11px;background:#fff;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
      +'<div style="display:flex;align-items:center;gap:10px">'
        +'<div style="width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#0EA5E9,#0284C7);display:flex;align-items:center;justify-content:center"><span style="font-size:14px">📅</span></div>'
        +'<div>'
          +'<div style="font-size:15px;font-weight:800;color:#0A0A0A">일정 캘린더</div>'
          +'<div style="font-size:10px;color:#9CA3AF">'+cy+'년 '+cm+'월 · 총 '+allEvs.length+'건 일정</div>'
        +'</div>'
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:8px">'
        +legend
        +'<div style="width:1px;height:18px;background:#E2E8F0;margin:0 4px"></div>'
        +'<button onclick="_calMonth=\''+adj(-1)+'\';renderView()" style="border:1px solid #E2E8F0;background:#fff;color:#1F2937;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;font-family:inherit">‹</button>'
        +'<span style="font-size:14px;font-weight:800;color:#0F172A;min-width:72px;text-align:center">'+cy+'. '+cm+'</span>'
        +'<button onclick="_calMonth=\''+adj(1)+'\';renderView()" style="border:1px solid #E2E8F0;background:#fff;color:#1F2937;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;font-family:inherit">›</button>'
        +'<input type="month" value="'+_calMonth+'" onchange="_calMonth=this.value;renderView()" style="border:1px solid #E2E8F0;border-radius:8px;padding:5px 10px;font-size:11.5px;font-family:inherit;outline:none;color:#1F2937;background:#F8FAFC;cursor:pointer">'
        +(_calMonth===MONTH
          ?'<button onclick="var el=document.getElementById(\'cal-today\');if(el)el.scrollIntoView({behavior:\'smooth\',block:\'center\'})" style="border:1px solid #BFDBFE;background:#EFF6FF;color:#1D4ED8;padding:5px 13px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">📍 오늘</button>'
          :'<button onclick="_calMonth=MONTH;renderView();setTimeout(function(){var el=document.getElementById(\'cal-today\');if(el)el.scrollIntoView({behavior:\'smooth\',block:\'center\'});},120)" style="border:1px solid #2563EB;background:#2563EB;color:#fff;padding:5px 13px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 1px 4px rgba(37,99,235,.3)">↩ 오늘</button>'
        )
      +'</div>'
    +'</div>'
    /* 캘린더 그리드 (전체 높이 사용) */
    +'<div style="flex:1;overflow-y:auto;padding:14px 18px 18px">'
      +'<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px">'+dowHtml+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">'+gridCells+'</div>'
    +'</div>'
  +'</div>';
}
