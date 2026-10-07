'use strict';
/* 공용 유틸 (날짜, CSV, 검색, 메모) */
/* ─ 유틸 ─ */
var fmt=function(d){return d?String(d).replace(/-/g,'.'):'-';};
/* ─ 날짜 문자열에서 YYYY-MM 추출 (여러 형식 대응: YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD 등) ─ */
function parseDocMonth(dateStr){
  if(!dateStr)return'';
  var s=String(dateStr).trim();
  var m=s.match(/(\d{4})[-.\\/년\s](\d{1,2})/);
  if(m)return m[1]+'-'+('0'+m[2]).slice(-2);
  /* 8자리 숫자 YYYYMMDD 형식도 처리 */
  var m2=s.match(/^(\d{4})(\d{2})/);
  if(m2)return m2[1]+'-'+m2[2];
  return'';
}
/* ─ 대시보드 기관별 채용 인원 기관 선택 토글 ─ */
function setDashInstSel(cat){
  _dashInstSel=(_dashInstSel===cat)?null:cat;
  var root=document.getElementById('dash-rec-content');
  if(!root){renderView();return;}
  renderView();
}

/* ── 기간 선택 헬퍼 ── */
function getDashPeriod(){
  var now=new Date();
  var pad=function(n){return String(n).padStart(2,'0');};
  var fmt=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
  if(_dashPeriodMode==='today'){var t=fmt(now);return{from:t,to:t};}
  if(_dashPeriodMode==='week'){
    var day=now.getDay();
    var mon=new Date(now);mon.setDate(now.getDate()-(day===0?6:day-1));
    var sun=new Date(mon);sun.setDate(mon.getDate()+6);
    return{from:fmt(mon),to:fmt(sun)};
  }
  if(_dashPeriodMode==='month'){
    var y=now.getFullYear(),m=now.getMonth()+1;
    var last=new Date(y,m,0).getDate();
    return{from:y+'-'+pad(m)+'-01',to:y+'-'+pad(m)+'-'+last};
  }
  if(_dashPeriodMode==='prev'){
    var d=new Date(now.getFullYear(),now.getMonth()-1,1);
    var y=d.getFullYear(),m=d.getMonth()+1;
    var last=new Date(y,m,0).getDate();
    return{from:y+'-'+pad(m)+'-01',to:y+'-'+pad(m)+'-'+last};
  }
  /* custom */
  var t=fmt(now);
  return{from:_dashDateFrom||t,to:_dashDateTo||t};
}
function setDashPeriod(mode,fr,to){
  _dashPeriodMode=mode;
  if(fr)_dashDateFrom=fr;
  if(to)_dashDateTo=to;
  /* selectedMonth 동기화 */
  var p=getDashPeriod();
  selectedMonth=p.from.slice(0,7);
  _dashInstSel=null;
  _dashLastRefresh=(new Date()).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  renderView();
}
var $=function(id){return document.getElementById(id);};
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function dateOrNull(v){if(!v||!String(v).trim())return null;var yr=parseInt(String(v).slice(0,4),10);if(yr<1900||yr>2100)return null;return v;}
function isToday(d){return !!d&&String(d).slice(0,10)===TODAY;}
function calcDDay(ds){
  if(!ds)return null;
  var s=String(ds).slice(0,10);
  var parts=s.split('-').map(Number);
  var tparts=TODAY.split('-').map(Number);
  return Math.round((new Date(parts[0],parts[1]-1,parts[2])-new Date(tparts[0],tparts[1]-1,tparts[2]))/86400000);
}
function isTrulyOver(job){
  if(job.isClosed)return true;
  if(job.finalDate&&String(job.finalDate).slice(0,10)>=TODAY)return false;
  if(job.interviewDate&&String(job.interviewDate).slice(0,10)>=TODAY)return false;
  var dl=job.applyDeadline||job.docDate;
  return !!(dl&&String(dl).slice(0,10)<TODAY);
}
function dDayBadge(dateStr,closed){
  if(closed)return '<span style="background:#F3F4F6;color:#9CA3AF;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;border:1px solid #E5E7EB;white-space:nowrap">마감됨</span>';
  var d=calcDDay(dateStr);
  if(d===null)return'';
  if(d<0)return'<span style="background:#F3F4F6;color:#9CA3AF;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;border:1px solid #E5E7EB;white-space:nowrap">기간만료</span>';
  if(d===0)return'<span style="background:#FEE2E2;color:#DC2626;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:800;border:1px solid #FECACA;white-space:nowrap">🔴 D-DAY</span>';
  if(d<=3)return'<span style="background:#FEE2E2;color:#DC2626;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:800;border:1px solid #FECACA;white-space:nowrap">D-'+d+'</span>';
  if(d<=7)return'<span style="background:#FEF3C7;color:#D97706;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;border:1px solid #FDE68A;white-space:nowrap">D-'+d+'</span>';
  return'<span style="background:#DBEAFE;color:#1D4ED8;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;border:1px solid #BFDBFE;white-space:nowrap">D-'+d+'</span>';
}
function csvExport(data,name){
  if(!data||!data.length)return;
  var hdrs=Object.keys(data[0]);
  var rows=data.map(function(r){return hdrs.map(function(h){return'"'+String(r[h]!=null?r[h]:'').replace(/"/g,'""')+'"';}).join(',');});
  var csv=[hdrs.join(',')].concat(rows).join('\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();URL.revokeObjectURL(url);
}
function getApps(sid){
  return JOBS.reduce(function(acc,j){
    j.applicants.forEach(function(a){
      if(a.studentId===sid)acc.push(Object.assign({},a,{jobName:j.name,category:j.category,docDate:j.docDate,finalDate:j.finalDate,interviewDate:j.interviewDate}));
    });
    return acc;
  },[]);
}

/* ─ 질문 파싱 (공용) ─ */
function parseQsShared(text){
  try{
    var lines=text.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length>0;});
    var pat=/^(\d{1,2}[\.\)\s]+|Q[\.\:\s]+|[①-⑳]\s*)/;
    var qs=[],buf='';
    lines.forEach(function(line){
      if(pat.test(line)){if(buf)qs.push(buf.trim());buf=line.replace(pat,'').trim();}
      else{buf=buf?(buf+' '+line):line;}
    });
    if(buf)qs.push(buf.trim());
    return qs.filter(function(q){return q.length>1;});
  }catch(e){return[];}
}

/* ─ 자료실 그룹화 ─ */
function getGroupedVault(){
  try{
    var filtered=VAULT.slice();
    if(vaultFilter!=='전체')filtered=filtered.filter(function(v){return v.category===vaultFilter;});
    if(vaultKw.trim()){
      var kw=vaultKw.trim();
      filtered=filtered.filter(function(v){return v.institutionName.indexOf(kw)>=0||v.content.indexOf(kw)>=0;});
    }
    var groupMap={};
    filtered.forEach(function(v){
      var k=v.institutionName||'(기관명 없음)';
      if(!groupMap[k])groupMap[k]={institutionName:k,category:v.category,items:[]};
      groupMap[k].items.push(v);
    });
    var groups=Object.values(groupMap);
    groups.forEach(function(g){
      g.items.sort(function(a,b){
        if((b.year||0)!==(a.year||0))return (b.year||0)-(a.year||0);
        return (b.createdAt||'').localeCompare(a.createdAt||'');
      });
      var latest=g.items[0];
      g.category=latest?latest.category:g.category;
    });
    groups.sort(function(a,b){
      var aMax=Math.max.apply(null,a.items.map(function(i){return i.year||0;}));
      var bMax=Math.max.apply(null,b.items.map(function(i){return i.year||0;}));
      if(bMax!==aMax)return bMax-aMax;
      return a.institutionName.localeCompare(b.institutionName);
    });
    return groups;
  }catch(e){console.error('getGroupedVault error',e);customAlert('그룹화 오류: '+(e.message||JSON.stringify(e)));return[];}
}

/* ─ 아코디언 / 선택 제어 (인덱스 기반, onclick용) ─ */
function vaultToggleGroup(idx){
  try{
    _saveScrollPositions();
    var g=_vaultGroups[idx];
    if(!g)return;
    var name=g.institutionName;
    if(expandedInstitutions.has(name))expandedInstitutions.delete(name);
    else expandedInstitutions.add(name);
    renderView();
  }catch(e){console.error('vaultToggleGroup',e);customAlert('오류: '+(e.message||String(e)));}
}
function vaultToggleAllInGroup(idx){
  try{
    _saveScrollPositions();
    var g=_vaultGroups[idx];
    if(!g)return;
    var allSel=g.items.every(function(i){return selectedVaultItems.has(i.id);});
    g.items.forEach(function(i){if(allSel)selectedVaultItems.delete(i.id);else selectedVaultItems.add(i.id);});
    renderView();
  }catch(e){console.error(e);}
}
function vaultToggleItem(id){
  try{
    _saveScrollPositions();
    if(selectedVaultItems.has(id))selectedVaultItems.delete(id);
    else selectedVaultItems.add(id);
    renderView();
  }catch(e){console.error(e);}
}
function vaultClearSelection(){selectedVaultItems.clear();renderView();}

/* ─ 학생 상태 ─ */
function getStudentStatus(sid){
  var apps=getApps(sid);
  if(!apps.length)return{label:'지원가능',emoji:'🟢',color:'#059669',bg:'#D1FAE5',border:'#6EE7B7'};
  if(apps.some(function(a){return a.status==='최종합격'||a.status==='취업성공';}))return{label:'취업완료',emoji:'🔵',color:'#1D4ED8',bg:'#DBEAFE',border:'#93C5FD'};
  if(apps.some(function(a){return['최종합격','취업성공','불합격'].indexOf(a.status)<0;}))return{label:'진행중',emoji:'🟡',color:'#D97706',bg:'#FEF3C7',border:'#FDE68A'};
  return{label:'지원가능',emoji:'🟢',color:'#059669',bg:'#D1FAE5',border:'#6EE7B7'};
}
function getRestrictionBadge(student){
  if(!student.restrictionLevel){
    var todayMs=new Date(TODAY).getTime();
    var isNoReply=JOBS.some(function(j){return j.applicants.some(function(ap){
      if(ap.studentId!==student.id||!ap.interviewDocSent)return false;
      var diff=Math.round((todayMs-new Date(String(ap.interviewDocSent).slice(0,10)).getTime())/86400000);
      return diff>=7&&(ap.interviewFeedback||'').indexOf('회신완료')<0;
    });});
    if(isNoReply)return'<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;border:1px solid #FDE68A;display:inline-flex;align-items:center;gap:3px;vertical-align:middle;flex-shrink:0">⚠️ 미회신</span>';
    return'';
  }
  if(student.restrictionLevel==='제한')return'<span style="background:#DC2626;color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;display:inline-flex;align-items:center;gap:3px;vertical-align:middle;flex-shrink:0">🚫 블랙</span>';
  if(student.restrictionLevel==='주의')return'<span style="background:#FEF3C7;color:#000;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;border:1px solid #FDE68A;display:inline-flex;align-items:center;gap:3px;vertical-align:middle;flex-shrink:0">⚠️ 주의</span>';
  return'';
}
function filterStudents(){
  var kw=studentFilter.kw.trim().toLowerCase();
  return STUDENTS.filter(function(s){
    if(kw){
      var nameMatch=s.name.toLowerCase().indexOf(kw)>=0;
      var phoneMatch=(s.phone||'').indexOf(kw)>=0;
      var emailMatch=(s.email||'').toLowerCase().indexOf(kw)>=0;
      /* 기관명/공고명 검색 — 이 학생이 지원한 공고 중 이름에 키워드가 있는지 */
      var jobMatch=JOBS.some(function(j){
        if(!j.applicants.some(function(a){return a.studentId===s.id||a.studentId===String(s.id);}))return false;
        return j.name.toLowerCase().indexOf(kw)>=0||
               (j.category||'').toLowerCase().indexOf(kw)>=0||
               (j.location||'').toLowerCase().indexOf(kw)>=0;
      });
      if(!nameMatch&&!phoneMatch&&!emailMatch&&!jobMatch)return false;
    }
    if(studentFilter.grade!=='전체'&&!getApps(s.id).some(function(a){return a.grade===studentFilter.grade;}))return false;
    if(studentFilter.statusTab!=='전체'){var st=getStudentStatus(s.id);if(st.label!==studentFilter.statusTab)return false;}
    return true;
  });
}

/* ─ 퀵 메모 ─ */
function appendMemoText(fieldId,prefix){
  var el=$(fieldId);if(!el)return;
  var now=new Date(new Date().getTime()+9*3600000);
  var text=prefix+' '+now.toISOString().slice(0,10)+' '+now.toISOString().slice(11,16);
  el.value=el.value?(el.value+'\n'+text):text;el.focus();
}
function quickMemoButtons(fieldId){
  var btns=[{label:'📤 자료발송',p:'[자료발송]'},{label:'📣 회신당부',p:'[회신당부]'},{label:'📵 연락두절',p:'[연락두절]'},{label:'✅ 회신완료',p:'[회신완료]'}];
  return'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px">'+btns.map(function(b){return'<button type="button" onclick="appendMemoText(\''+fieldId+'\',\''+b.p+'\')" style="background:#F1F5F9;color:#1F2937;border:1px solid #E2E8F0;padding:4px 10px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">'+b.label+'</button>';}).join('')+'</div>';
}
