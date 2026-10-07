'use strict';

/* ─ 공고관리 필터 기억 (새로고침해도 유지) ─ */
var _JOB_FILTER_KEY='jobplan_job_filters_v1';
function _saveJobFilters(){
  try{localStorage.setItem(_JOB_FILTER_KEY,JSON.stringify({f:{cat:jobFilter.cat,year:jobFilter.year,type:jobFilter.type,recType:jobFilter.recType,location:jobFilter.location,dateFrom:jobFilter.dateFrom,dateTo:jobFilter.dateTo},sort:tableSort,quick:_jobQuick,col:_jobColFilters}));}catch(e){}
}
(function _loadJobFilters(){
  try{
    var raw=localStorage.getItem(_JOB_FILTER_KEY);if(!raw)return;
    var d=JSON.parse(raw)||{};
    if(d.f)Object.keys(d.f).forEach(function(k){if(typeof d.f[k]==='string'&&k in jobFilter)jobFilter[k]=d.f[k];});
    if(d.sort&&typeof d.sort==='object')tableSort={col:d.sort.col||null,dir:d.sort.dir||'none'};
    if(d.quick&&typeof d.quick==='object')_jobQuick={hideClosed:!!d.quick.hideClosed,mode:d.quick.mode||''};
    if(d.col&&typeof d.col==='object')Object.keys(_jobColFilters).forEach(function(k){var c=d.col[k];if(c&&typeof c==='object')_jobColFilters[k]={from:c.from||'',to:c.to||''};});
    if(jobFilter.location&&jobFilter.location!=='__none__')_dashMapLocation=jobFilter.location;
  }catch(e){}
})();

/* ─ 빠른 보기 ─ */
function _jobWeekIv(j){var d=calcDDay(j.interviewDate);return !j.isClosed&&d!=null&&d>=0&&d<=7;}
function _jobHasToday(j){return !j.isClosed&&(isToday(j.docDate)||isToday(j.applyDeadline)||isToday(j.documentPassDate)||isToday(j.interviewDate)||isToday(j.finalDate));}
function _jobQuickOk(j){
  if(_jobQuick.hideClosed&&j.isClosed)return false;
  if(_jobQuick.mode==='today'&&!_jobHasToday(j))return false;
  if(_jobQuick.mode==='weekIv'&&!_jobWeekIv(j))return false;
  if(_jobQuick.mode==='noAps'&&j.applicants.length)return false;
  return true;
}
function toggleJobQuick(key){
  if(key==='hideClosed')_jobQuick.hideClosed=!_jobQuick.hideClosed;
  else _jobQuick.mode=_jobQuick.mode===key?'':key;
  renderView();
}

/* ─ 검색어가 지원자 이름과 맞는지 (마스터·관리자만) ─ */
function _jobApNameHits(j,kw){
  if(!kw||isStaff())return[];
  var out=[];
  j.applicants.forEach(function(a){var st=STUDENTS.find(function(s){return s.id===a.studentId;});if(st&&st.name&&st.name.indexOf(kw)>=0)out.push(st.name);});
  return out;
}

/* ─ 비고 속 합격자 발표 ("서류합격자 : 3명 (…)" / "최종합격자 : 1명 (…)") ─ */
var _PASS_RE={
  doc:/서류\s*합격자?\s*[:：]\s*(?:(\d+)\s*명)?\s*(?:\(((?:[^()]|\([^()]*\))*)\))?/,
  fin:/최종\s*합격자?\s*[:：]\s*(?:(\d+)\s*명)?\s*(?:\(((?:[^()]|\([^()]*\))*)\))?/
};
function parsePassNote(note){
  var rest=String(note||''),out={doc:{n:'',names:''},fin:{n:'',names:''},rest:''};
  ['doc','fin'].forEach(function(k){
    var m=rest.match(_PASS_RE[k]);
    if(m&&(m[1]!==undefined||m[2]!==undefined)){
      var end=m.index+m[0].length,names=(m[2]||'').trim();
      /* 괄호를 닫지 않고 쓴 경우: "3명(2번 김정아(8059) 3번 이00(3902)" → 줄 끝이나 다음 항목 전까지를 명단으로 */
      if(m[2]===undefined){
        var after=rest.slice(end),om=after.match(/^\s*\(/);
        if(om){
          var stop=after.search(/\n|(서류|최종)\s*합격자?\s*[:：]/);if(stop<0)stop=after.length;
          names=after.slice(om[0].length,stop).replace(/[\s\/,·|]+$/,'');if((names.match(/\)/g)||[]).length>(names.match(/\(/g)||[]).length)names=names.replace(/\)$/,'');names=names.trim();
          end+=stop;
        }
      }
      out[k]={n:m[1]||'',names:names};rest=rest.slice(0,m.index)+rest.slice(end);
    }
  });
  out.rest=rest.replace(/^[\s\/,·|]+|[\s\/,·|]+$/g,'').replace(/\n\s*[\/,·|]\s*\n/g,'\n').replace(/^\s*[\/,·|]\s*$/gm,'').replace(/\n{2,}/g,'\n').trim();
  return out;
}
function buildPassNote(doc,fin,rest){
  function part(label,x){if(x.n===''&&!x.names)return'';return label+' : '+(x.n!==''?x.n+'명':'')+(x.names?(x.n!==''?' ':'')+'('+x.names+')':'');}
  var head=[part('서류합격자',doc),part('최종합격자',fin)].filter(Boolean).join(' / ');
  return [head,rest].filter(Boolean).join('\n');
}
var _DOC_PASS_STATUSES=['서류합격','면접대기','예비합격','최종합격','취업성공','면접불참','합격포기'];
function _jobPassFill(kind,jobId){
  var job=JOBS.find(function(j){return j.id===jobId;});if(!job)return;
  var list=kind==='doc'?_DOC_PASS_STATUSES:['최종합격','취업성공'];
  var names=job.applicants.filter(function(a){return list.indexOf(a.status)>=0;}).map(function(a){var st=STUDENTS.find(function(s){return s.id===a.studentId;});return st?st.name:'';}).filter(Boolean);
  var n=$('jf_'+kind+'_n'),nm=$('jf_'+kind+'_names');
  if(n)n.value=names.length;if(nm)nm.value=names.join(', ');
}
function _passSectionHtml(job,parsed){
  function cnt(kind){if(!job)return 0;var list=kind==='doc'?_DOC_PASS_STATUSES:['최종합격','취업성공'];return job.applicants.filter(function(a){return list.indexOf(a.status)>=0;}).length;}
  function row(kind,label,color){
    var x=parsed[kind],c=cnt(kind);
    return'<div style="display:grid;grid-template-columns:92px 84px 1fr auto;gap:8px;align-items:center;margin-bottom:6px">'
      +'<span style="font-size:12px;font-weight:700;color:'+color+'">'+label+'</span>'
      +'<div style="display:flex;align-items:center;gap:4px"><input id="jf_'+kind+'_n" type="number" min="0" value="'+esc(x.n)+'" style="width:56px;padding:7px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit"><span style="font-size:12px;color:#6B7280">명</span></div>'
      +'<input id="jf_'+kind+'_names" type="text" value="'+esc(x.names)+'" placeholder="합격자 번호 또는 이름 (예: 1023, 김00)" style="padding:7px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;min-width:0">'
      +(c?'<button type="button" onclick="_jobPassFill(\''+kind+'\','+job.id+')" title="우리 지원자 중 이 상태인 사람으로 채우기" style="white-space:nowrap;border:1px solid #BFDBFE;background:#EFF6FF;color:#1D4ED8;padding:6px 9px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">우리 지원자 '+c+'명 넣기</button>':'<span></span>')
    +'</div>';
  }
  return'<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 14px;margin-bottom:10px">'
    +'<p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#475569;letter-spacing:.06em">🏆 합격자 발표 <span style="font-weight:500;color:#94A3B8;letter-spacing:0">— 저장하면 비고에 "서류합격자 : N명 (…)" 형식으로 들어갑니다</span></p>'
    +row('doc','서류합격자','#B45309')+row('fin','최종합격자','#059669')
  +'</div>';
}
function _passBadge(job){
  var p=parsePassNote(job.note);if(p.doc.n===''&&p.fin.n===''&&!p.doc.names&&!p.fin.names)return'';
  var t=[];if(p.doc.n!==''||p.doc.names)t.push('서류 '+(p.doc.n!==''?p.doc.n+'명':'✓'));if(p.fin.n!==''||p.fin.names)t.push('최종 '+(p.fin.n!==''?p.fin.n+'명':'✓'));
  var tip=[p.doc.names?'서류: '+p.doc.names:'',p.fin.names?'최종: '+p.fin.names:''].filter(Boolean).join('\n');
  return'<span title="'+esc(tip)+'" style="font-size:10px;font-weight:700;color:#475569;background:#F1F5F9;border:1px solid #E2E8F0;padding:1px 7px;border-radius:99px;white-space:nowrap">🏆 '+t.join(' · ')+'</span>';
}

/* ─ 지원자 상태 바로 변경 ─ */
async function setApStatusInline(apId,sel){
  if(!isAdmin())return;
  var newStatus=sel.value,prev=sel.getAttribute('data-prev');
  if(newStatus===prev)return;
  sel.disabled=true;
  var r=await SB.from('applicants').update({status:newStatus}).eq('id',apId);
  if(r&&r.error){sel.value=prev;sel.disabled=false;customAlert('저장 오류: '+r.error.message);return;}
  _saveScrollPositions();
  await reloadData(['applicants']);
  showToast('상태 변경: '+prev+' → '+newStatus);
}
/* 공고관리 / 지원자 */
/* ─ 합격 확인 ─ */

function showCallJobInfo(jobId){
  var j=JOBS.find(function(x){return String(x.id)===String(jobId);});
  if(!j)return;
  var aps=j.applicants||[];
  var passAps=aps.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';});

  function dateRow(label,val){
    if(!val)return'';
    return'<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid #F1F5F9">'
      +'<span style="font-size:12px;color:#64748B">'+label+'</span>'
      +'<span style="font-size:12px;font-weight:500;color:#0F172A">'+fmt(val)+'</span>'
    +'</div>';
  }

  var html=''
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'
      +badge(j.category)
      +'<div><div style="font-size:15px;font-weight:700;color:#0F172A">'+esc(j.name)+'</div>'
        +(j.location?'<div style="font-size:12px;color:#64748B;margin-top:2px">📍 '+esc(j.location)+'</div>':'')
      +'</div>'
      +(j.jobUrl?'<a href="'+esc(j.jobUrl)+'" target="_blank" style="margin-left:auto;display:flex;align-items:center;gap:4px;background:#EFF6FF;color:#2563EB;padding:5px 10px;border-radius:7px;font-size:12px;font-weight:500;text-decoration:none"><i class="ti ti-external-link" style="font-size:13px"></i>공고 원문</a>':'')
    +'</div>'

    /* 날짜 정보 */
    +'<div style="background:#F8FAFC;border-radius:10px;padding:10px 14px;margin-bottom:12px">'
      +dateRow('서류 접수일', j.docDate)
      +dateRow('서류 합격 발표', j.documentPassDate)
      +dateRow('면접일', j.interviewDate)
      +'<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;'+(j.finalDate?'border-bottom:0.5px solid #F1F5F9':'')+'">'
        +'<span style="font-size:12px;color:#DC2626;font-weight:600">최종합격 발표일</span>'
        +'<span style="font-size:12px;font-weight:700;color:#DC2626">'+(j.finalDate?fmt(j.finalDate):'미등록')+'</span>'
      +'</div>'
      +(!_isCounsel()&&(j.managerName||j.managerPhone)
        ?'<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0">'
          +'<span style="font-size:12px;color:#64748B">담당자</span>'
          +'<span style="font-size:12px;font-weight:500;color:#374151">'+esc(j.managerName||'')+(j.managerPhone?' · '+esc(j.managerPhone):'')+'</span>'
        +'</div>'
        :'')
    +'</div>'

    /* 지원자 현황 */
    +'<div style="margin-bottom:12px">'
      +'<div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">지원자 현황</div>'
      +(aps.length===0
        ?'<div style="font-size:13px;color:#94A3B8;text-align:center;padding:10px;background:#F8FAFC;border-radius:8px">등록된 지원자 없음</div>'
        :'<div style="display:flex;flex-direction:column;gap:4px">'
          +aps.map(function(a){
            var st=STUDENTS.find(function(s){return String(s.id)===String(a.studentId);});
            var sc={'서류접수':'#94A3B8','서류합격':'#2563EB','면접대기':'#D97706','최종합격':'#059669','취업성공':'#059669','불합격':'#DC2626'}[a.status]||'#64748B';
            return'<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#F8FAFC;border-radius:7px">'
              +'<span style="font-size:13px;font-weight:600;color:#0F172A">'+esc(st?st.name:'?')+'</span>'
              +'<span style="font-size:11px;font-weight:600;color:'+sc+';margin-left:auto;background:'+sc+'18;padding:2px 8px;border-radius:99px">'+esc(a.status||'')+'</span>'
            +'</div>';
          }).join('')
        +'</div>'
      )
    +'</div>'

    /* 비고 */
    +(j.note?'<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px 12px;font-size:12px;color:#78350F;line-height:1.6">📝 '+esc(j.note)+'</div>':'')

    +'<div style="display:flex;justify-content:flex-end;padding-top:14px;border-top:1px solid #F3F4F6;margin-top:12px">'
      +btn('닫기','closeModal()','outline')
    +'</div>';

  showModal(j.name, html, '500px');
}

function getCallTrack(jobId){
}




/* ─ 컬럼별 날짜 필터 팝업 ─ */
function _hasAnyColFilter(){return['docDate','deadline','documentPassDate','interviewDate','finalDate'].some(function(k){return _jobColFilters[k].from||_jobColFilters[k].to;});}
function _buildColFilterBadges(){var lb={docDate:'서류접수',deadline:'서류마감',documentPassDate:'서류합격발표',interviewDate:'면접',finalDate:'최종합격'};return['docDate','deadline','documentPassDate','interviewDate','finalDate'].filter(function(k){return _jobColFilters[k].from||_jobColFilters[k].to;}).map(function(k){var ff=_jobColFilters[k];return'<span style="display:inline-flex;align-items:center;gap:3px;background:#FEF2F2;border:1px solid #FECACA;padding:2px 7px;border-radius:99px;font-size:10px;color:#DC2626;font-weight:600">'+esc(lb[k])+' '+(ff.from?esc(ff.from.slice(5)):'')+' ~ '+(ff.to?esc(ff.to.slice(5)):'')+('<button onclick="clearOneColFilter(\''+k+'\');" style="border:none;background:none;color:#DC2626;cursor:pointer;font-size:11px;font-weight:900;line-height:1;padding:0 0 0 2px">&#x2715;</button>')+'</span>';}).join('');}
function openColFilterPopup(col,btn){var old=document.getElementById('_col_fp');if(old){old.remove();document.removeEventListener('click',_colFpOutside,true);if(_jobColFilters._activeCol===col){_jobColFilters._activeCol=null;return;}}_jobColFilters._activeCol=col;var rect=btn.getBoundingClientRect();var f=_jobColFilters[col]||{from:'',to:''};var labels={docDate:'서류접수일',deadline:'서류마감일',documentPassDate:'서류합격발표일',interviewDate:'면접일',finalDate:'최종합격발표일'};var div=document.createElement('div');div.id='_col_fp';var left=Math.min(rect.left,window.innerWidth-250);var top=rect.bottom+6;if(top+230>window.innerHeight)top=rect.top-225;div.style.cssText='position:fixed;z-index:9998;background:#fff;border-radius:12px;border:1px solid #E2E8F0;box-shadow:0 8px 32px rgba(0,0,0,.2);padding:16px;width:232px;left:'+left+'px;top:'+top+'px;';div.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-size:12px;font-weight:800;color:#0F172A">&#128197; '+esc(labels[col])+'</span><button onclick="closeColFilterPopup()" style="border:none;background:none;color:#64748B;cursor:pointer;font-size:15px;line-height:1;padding:0">&#x2715;</button></div><div style="margin-bottom:8px"><label style="display:block;font-size:10px;color:#6B7280;font-weight:700;margin-bottom:4px;letter-spacing:.06em;text-transform:uppercase">&#xC2DC;&#xC791;&#xC77C;</label><input type="date" id="cf_from" value="'+esc(f.from||'')+'" style="width:100%;padding:7px 8px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;font-family:inherit;outline:none;color:#374151"></div><div style="margin-bottom:14px"><label style="display:block;font-size:10px;color:#6B7280;font-weight:700;margin-bottom:4px;letter-spacing:.06em;text-transform:uppercase">&#xC885;&#xB8CC;&#xC77C;</label><input type="date" id="cf_to" value="'+esc(f.to||'')+'" style="width:100%;padding:7px 8px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;font-family:inherit;outline:none;color:#374151"></div><div style="display:flex;gap:6px"><button onclick="applyColFilter(\''+col+'\');" style="flex:1;background:#2563EB;color:#fff;border:none;padding:8px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">&#x2705;</button><button onclick="clearOneColFilter(\''+col+'\');" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:8px 10px;border-radius:7px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:700">&#xCD08;&#xAE30;&#xD654;</button></div>';document.body.appendChild(div);setTimeout(function(){document.addEventListener('click',_colFpOutside,true);},0);}
function _colFpOutside(e){var fp=document.getElementById('_col_fp');if(!fp)return;if(!fp.contains(e.target)&&!e.target.dataset.cfbtn){closeColFilterPopup();}}
function closeColFilterPopup(){var fp=document.getElementById('_col_fp');if(fp)fp.remove();_jobColFilters._activeCol=null;document.removeEventListener('click',_colFpOutside,true);}
function applyColFilter(col){var fe=document.getElementById('cf_from'),te=document.getElementById('cf_to');if(!fe||!te)return;var from=fe.value||'',to=te.value||'';if(from&&to&&from>to){customAlert('시작일이 종료일보다 늦을 수 없습니다.');return;}_jobColFilters[col]={from:from,to:to};closeColFilterPopup();renderView();}
function clearOneColFilter(col){_jobColFilters[col]={from:'',to:''};closeColFilterPopup();renderView();}
function clearAllColFilters(){['docDate','deadline','documentPassDate','interviewDate','finalDate'].forEach(function(k){_jobColFilters[k]={from:'',to:''};});renderView();}
function toggleJobSelect(jobId){if(_selectedJobIds.has(jobId))_selectedJobIds.delete(jobId);else _selectedJobIds.add(jobId);_saveScrollPositions();renderView();}
function toggleJobSelectAll(ids){var allSel=ids.every(function(id){return _selectedJobIds.has(id);});ids.forEach(function(id){if(allSel)_selectedJobIds.delete(id);else _selectedJobIds.add(id);});_saveScrollPositions();renderView();}
function exportSelectedJobApplicants(){if(isStaff())return;
  if(!_selectedJobIds.size){customAlert('먼저 공고를 선택해주세요.');return;}
  var rows=[];
  _selectedJobIds.forEach(function(jid){
    var job=JOBS.find(function(j){return j.id===jid;});
    if(!job)return;
    if(!job.applicants.length){rows.push({'공고명':job.name,'지원자 성함':'(지원자 없음)','연락처':'','이메일':'','급수':''});return;}
    job.applicants.forEach(function(ap){
      var st=STUDENTS.find(function(s){return s.id===ap.studentId;});
      rows.push({'공고명':job.name,'지원자 성함':st?st.name:'(삭제된 학생)','연락처':st?(st.phone||''):'-','이메일':st?(st.email||''):'-','급수':ap.grade||'-'});
    });
  });
  if(!rows.length){customAlert('선택된 공고에 지원자 데이터가 없습니다.');return;}
  csvExport(rows,'선택공고_지원자명단_'+TODAY);
}

/* ─ 정렬 / 필터 ─ */
/* ─ 날짜 범위 필터 핸들러 (서류마감일 기준) ─ */
function _setJobDateFrom(v){if(jobFilter.dateTo&&v&&v>jobFilter.dateTo){customAlert('시작일이 종료일보다 늦을 수 없습니다.');return;}jobFilter.dateFrom=v;renderView();}
function _setJobDateTo(v){if(jobFilter.dateFrom&&v&&v<jobFilter.dateFrom){customAlert('종료일이 시작일보다 빠를 수 없습니다.');return;}jobFilter.dateTo=v;renderView();}
function _clearJobDateFilter(){jobFilter.dateFrom='';jobFilter.dateTo='';renderView();}

function setTableSort(col){_saveScrollPositions();if(tableSort.col===col){if(tableSort.dir==='asc')tableSort.dir='desc';else if(tableSort.dir==='desc'){tableSort.col=null;tableSort.dir='none';}else tableSort.dir='asc';}else{tableSort.col=col;tableSort.dir='asc';}renderView();}
function getSorted(filtered){
  if(tableSort.col&&tableSort.dir!=='none'){
    var getVal=function(j){if(tableSort.col==='docDate')return j.docDate||'';if(tableSort.col==='deadline')return j.applyDeadline||j.docDate||'';if(tableSort.col==='documentPassDate')return j.documentPassDate||'';if(tableSort.col==='interviewDate')return j.interviewDate||'';if(tableSort.col==='finalDate')return j.finalDate||'';return'';};
    var withVal=filtered.filter(function(j){return getVal(j);});var noVal=filtered.filter(function(j){return !getVal(j);});
    withVal.sort(function(a,b){var va=String(getVal(a)).slice(0,10),vb=String(getVal(b)).slice(0,10);return tableSort.dir==='asc'?va.localeCompare(vb):vb.localeCompare(va);});
    return withVal.concat(noVal);
  }
  return sortByFinalDate(filtered);
}
function sortHeader(label,col){var active=tableSort.col===col&&tableSort.dir!=='none';var arrow=active?(tableSort.dir==='asc'?'&#9650;':'&#9660;'):'';var cfActive=!!(_jobColFilters[col]&&(_jobColFilters[col].from||_jobColFilters[col].to));var icBg=cfActive?'#DBEAFE':'transparent';var icBdr=cfActive?'1px solid #93C5FD':'1px solid transparent';var dot=cfActive?'<span style="font-size:7px;color:#DC2626;margin-left:1px;vertical-align:super;font-weight:900">&#9679;</span>':'';return'<th class="sort-th" style="padding:10px 8px;text-align:left;font-weight:700;color:'+(active?'#2563EB':'#374151')+';font-size:11px;white-space:nowrap;letter-spacing:.04em;background:'+(cfActive?'#EFF6FF':'#F8FAFC')+';user-select:none"><div style="display:inline-flex;align-items:center;gap:3px"><span onclick="setTableSort(\''+col+'\')" style="cursor:pointer">'+label+(active?' <span style="font-size:10px;color:#2563EB;font-weight:900">'+arrow+'</span>':'<span style="font-size:9px;color:#D1D5DB;margin-left:2px">&#8597;</span>')+'</span><button data-cfbtn="1" onclick="event.stopPropagation();openColFilterPopup(\''+col+'\',this)" style="border:'+icBdr+';background:'+icBg+';color:'+(cfActive?'#2563EB':'#CBD5E1')+';padding:1px 4px;border-radius:4px;cursor:pointer;font-size:10px;line-height:1.4;flex-shrink:0;font-family:inherit" title="날짜 범위 필터">&#128197;'+dot+'</button></div></th>';}

function sortByFinalDate(jobs){
  var active=jobs.filter(function(j){return !j.isClosed;}),closed=jobs.filter(function(j){return j.isClosed;});
  active.sort(function(a,b){var fa=a.finalDate?String(a.finalDate).slice(0,10):'',fb=b.finalDate?String(b.finalDate).slice(0,10):'';var aF=fa&&fa>=TODAY,bF=fb&&fb>=TODAY,aP=fa&&fa<TODAY,bP=fb&&fb<TODAY;if(aF&&bF)return fa.localeCompare(fb);if(aF&&!bF)return -1;if(!aF&&bF)return 1;if(aP&&bP)return fb.localeCompare(fa);if(aP&&!bP)return -1;if(!aP&&bP)return 1;return(a.applyDeadline||a.docDate||'9999').localeCompare(b.applyDeadline||b.docDate||'9999');});
  return active.concat(closed);
}
function getFiltered(){return JOBS.filter(function(j){var _isPub=_isCounsel()&&jobFilter.cat==='공공기관';if(jobFilter.cat!=='전체'){if(_isPub){if(!_PUBLIC_CATS||_PUBLIC_CATS.indexOf(j.category)<0)return false;}else{if(j.category!==jobFilter.cat)return false;}}if(jobFilter.year&&!(j.docDate||'').startsWith(jobFilter.year))return false;if(jobFilter.kw&&j.name.indexOf(jobFilter.kw)<0&&!_jobApNameHits(j,jobFilter.kw).length)return false;if(!_jobQuickOk(j))return false;if(jobFilter.recType==='추천'&&!j.isRec)return false;if(jobFilter.recType==='지원'&&j.isRec)return false;if(jobFilter.type!=='전체'&&(j.type||'')!==jobFilter.type)return false;if(jobFilter.location==='__none__'?!!j.location:jobFilter.location&&j.location!==jobFilter.location)return false;if(jobFilter.dateFrom){var dl=j.applyDeadline||j.docDate||'';if(dl&&dl<jobFilter.dateFrom)return false;}if(jobFilter.dateTo){var dl2=j.applyDeadline||j.docDate||'';if(dl2&&dl2>jobFilter.dateTo)return false;}var _cf=_jobColFilters;function _cfOk(v,from,to){if(!from&&!to)return true;if(!v)return false;if(from&&v<from)return false;if(to&&v>to)return false;return true;}if(!_cfOk(j.docDate||'',_cf.docDate.from,_cf.docDate.to))return false;if(!_cfOk(j.applyDeadline||j.docDate||'',_cf.deadline.from,_cf.deadline.to))return false;if(!_cfOk(j.documentPassDate||'',_cf.documentPassDate.from,_cf.documentPassDate.to))return false;if(!_cfOk(j.interviewDate||'',_cf.interviewDate.from,_cf.interviewDate.to))return false;if(!_cfOk(j.finalDate||'',_cf.finalDate.from,_cf.finalDate.to))return false;return true;});}

/* ─ 스크롤 ─ */
function _saveScrollPositions(){var vs=$('_view_scroll'),ts=$('_tbl_scroll');if(vs)_savedScrollTop=vs.scrollTop;if(ts)_savedTblScrollTop=ts.scrollTop;}
function _restoreScrollPositions(){requestAnimationFrame(function(){requestAnimationFrame(function(){var vs=$('_view_scroll'),ts=$('_tbl_scroll');if(vs)vs.scrollTop=_savedScrollTop;if(ts)ts.scrollTop=_savedTblScrollTop;});});}
function toggleDetail(jobId){_saveScrollPositions();if(detailJobs.has(jobId))detailJobs.delete(jobId);else detailJobs.add(jobId);renderView();}
/* 대시보드 등에서 공고 하나를 눌렀을 때: 공고관리로 이동해 그 공고를 펼치고 강조 */
function openJobFromDash(jobId){
  var job=JOBS.find(function(j){return j.id===jobId;});
  if(!job)return;
  if(getFiltered().indexOf(job)<0){
    jobFilter={cat:'전체',year:'',kw:'',type:'전체',recType:'전체',dateFrom:'',dateTo:'',location:''};
    _dashMapLocation=null;_jobQuick={hideClosed:false,mode:''};
    Object.keys(_jobColFilters).forEach(function(k){_jobColFilters[k]={from:'',to:''};});
  }
  expandedJobs.add(jobId);
  setView('jobs');
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    var tr=document.querySelector('tr[data-job-row="'+jobId+'"]');
    if(!tr)return;
    tr.scrollIntoView({block:'center'});
    tr.classList.add('row-flash');
    setTimeout(function(){tr.classList.remove('row-flash');},2200);
  });});
}
function toggleJob(jobId){_saveScrollPositions();if(expandedJobs.has(jobId))expandedJobs.delete(jobId);else expandedJobs.add(jobId);renderView();}

/* ─ 공고 상세/행 ─ */
function renderDetailPanel(job){
  var dl=function(lbl,val,hi){return'<div style="min-width:100px"><p style="margin:0;font-size:10px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em">'+lbl+'</p><p style="margin:3px 0 0;font-size:13px;font-weight:600;color:'+(hi||'#111827')+'">'+esc(val||'-')+'</p></div>';};
  var fdNum=calcDDay(job.finalDate);
  var rows='<div style="display:flex;flex-wrap:wrap;gap:14px 24px;padding:12px 16px;border-bottom:1px solid #DBEAFE">'+dl('카테고리',job.category)+dl('채용형태',job.type)+(job.applyDeadline?dl('서류 마감일',fmt(job.applyDeadline)):'')+dl('서류접수일',fmt(job.docDate),isToday(job.docDate)?'#DC2626':'')+dl('서류합격발표일',fmt(job.documentPassDate),isToday(job.documentPassDate)?'#DC2626':'')+dl('면접일',fmt(job.interviewDate),isToday(job.interviewDate)?'#DC2626':'')+dl('최종합격발표일',fmt(job.finalDate),(fdNum!==null&&fdNum<=3&&fdNum>=0)?'#DC2626':'')+dl('근무 시작',fmt(job.startDate))+dl('근무 종료',job.endDate?fmt(job.endDate):'무기한')+'</div>';
  if(job.jobUrl)rows+='<div style="padding:8px 16px;border-bottom:1px solid #DBEAFE;display:flex;align-items:center;gap:10px"><span style="font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.05em">공고 URL</span><a href="'+esc(job.jobUrl)+'" target="_blank" style="font-size:12px;color:#2563EB;text-decoration:underline;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:420px">'+esc(job.jobUrl)+'</a></div>';
  if(job.isRec)rows+='<div style="padding:10px 16px;border-bottom:1px solid #DBEAFE;background:#F0F7FF"><p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.05em">📌 추천 공고 정보</p><div style="display:flex;flex-wrap:wrap;gap:14px 24px">'+dl('제출 서류',job.submitDocs)+dl('제출 기한',fmt(job.submitDeadline))+(!_isCounsel()?dl('담당자',job.managerName)+dl('연락처',job.managerPhone)+dl('이메일',job.managerEmail):'')+'</div></div>';
  if(job.note)rows+='<div style="padding:8px 16px;border-bottom:1px solid #DBEAFE"><span style="font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.05em">비고 </span><span style="font-size:12px;color:#374151">'+esc(job.note)+'</span></div>';

  /* ── 최종합격자 신원 확인 (신규) ── */
  if(job.finalDate&&(!job.isRec||job.isReA)){
    var confirmedAps=job.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';});
    var confirmedNums=confirmedAps.map(function(a){return a.examNumber;}).filter(Boolean);
    var announced=job.finalPassAnnouncedCount;
    var confirmedCnt=confirmedAps.length;
    var missing=(announced!=null)?Math.max(0,announced-confirmedCnt):null;
    var kb=job.idKeyboard||'확인중';

    rows+='<div style="padding:12px 16px;border-top:1px dashed #93C5FD;background:#F8FAFF">'
      +'<p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.05em">➕ 최종합격자 신원 확인</p>'
      +'<div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-bottom:10px">'
        +'<div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">발표된 최종합격 인원</label>'
          +'<div style="display:flex;align-items:center;gap:6px">'
          +'<input id="id_announced_'+job.id+'" type="number" min="0" value="'+(announced!=null?announced:'')+'" placeholder="명" style="width:80px;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit">'
          +'<span style="font-size:12px;color:#6B7280">명</span>'
          +(parseNoteCount(job.note)!=null&&announced==null?'<button onclick="event.stopPropagation();document.getElementById(\'id_announced_'+job.id+'\').value='+parseNoteCount(job.note)+'" style="font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid #BFDBFE;background:#EFF6FF;color:#2563EB;cursor:pointer;font-family:inherit;white-space:nowrap">비고에서 불러오기 ('+parseNoteCount(job.note)+'명)</button>':'')
          +'</div></div>'
        +'<div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">우리쪽 신원 확인</label>'
          +'<span style="display:inline-block;padding:6px 10px;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:6px;color:#374151;font-size:12px;min-width:60px">'+confirmedCnt+'명'+(confirmedNums.length>0?' ('+confirmedNums.map(esc).join(', ')+')':'')+'</span></div>'
        +'<div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">키보드 기종</label>'
          +'<select id="id_kb_'+job.id+'" style="padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;background:#fff">'
          +['확인중','소리자바','카스','알려주지 않음'].map(function(k){return'<option value="'+k+'" '+(kb===k?'selected':'')+'>'+k+'</option>';}).join('')
          +'</select></div>'
        +(missing!=null?(missing>0
            ?'<span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap">⚠ '+missing+'명 미확인</span>'
            :'<span style="background:#F0FDF4;color:#059669;border:1px solid #6EE7B7;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap">✓ 전원 확인됨</span>'
          ):'')
      +'</div>'
      +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">'
        +'<div style="flex:1;min-width:160px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">담당자명 / 부서</label>'
          +'<input id="id_cname_'+job.id+'" type="text" value="'+esc(job.idContactName)+'" placeholder="예: 총무과 박서연" style="width:100%;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;box-sizing:border-box"></div>'
        +'<div style="flex:1;min-width:140px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">연락처</label>'
          +'<input id="id_cphone_'+job.id+'" type="text" value="'+esc(job.idContactPhone)+'" placeholder="전화번호" style="width:100%;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;box-sizing:border-box"></div>'
      +'</div>'
      +'<div style="margin-bottom:10px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em">메모</label>'
        +'<textarea id="id_memo_'+job.id+'" rows="2" placeholder="통화 내용, 특이사항…" style="width:100%;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;resize:none;line-height:1.5;box-sizing:border-box">'+esc(job.idMemo)+'</textarea></div>'
      +(isAdmin()?'<div style="display:flex;justify-content:flex-end"><button onclick="saveIdentify('+job.id+')" style="background:#2563EB;color:#fff;border:none;padding:6px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px">💾 저장</button></div>':'')
    +'</div>';
  }
  return'<tr><td colspan="12" style="padding:0"><div class="job-detail-panel">'+rows+'</div></td></tr>';
}
function renderJobRow(job,rowNum){
  var deadline=job.applyDeadline||job.docDate,dlDNum=calcDDay(deadline),finalDNum=calcDDay(job.finalDate);
  var tD=!job.isClosed&&isToday(job.docDate),tDP=!job.isClosed&&isToday(job.documentPassDate),tI=!job.isClosed&&isToday(job.interviewDate),tF=!job.isClosed&&isToday(job.finalDate);
  var isUrgent=!job.isClosed&&tF,over=isTrulyOver(job);
  var cTotal=job.applicants.length,cDocP=job.applicants.filter(function(a){return a.status==='서류합격';}).length,cInter=job.applicants.filter(function(a){return a.status==='면접대기';}).length,cPass=job.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length,cFail=job.applicants.filter(function(a){return a.status==='불합격';}).length,cRes=job.applicants.filter(function(a){return a.status==='예비합격';}).length,cWd=job.applicants.filter(function(a){return WITHDRAWN_STATUSES.indexOf(a.status)>=0;});
  var rowClass='tbl-tr',rowBg='#fff';if(isUrgent)rowClass='row-urgent';else if(!job.isClosed&&(tD||tDP||tI))rowBg='#FFFBEB';else if(job.isClosed)rowBg='#F9FAFB';
  var isOpen=expandedJobs.has(job.id),isDetail=detailJobs.has(job.id);
  var apRows='';
  if(isOpen){
    var _apStatusOrder={'최종합격':0,'예비합격':0.5,'면접대기':1,'서류합격':2,'서류접수':3,'불합격':4,'합격포기':5,'면접불참':6,'지원철회':7};
    var _sortedAps=job.applicants.slice().sort(function(a,b){
      var oa=_apStatusOrder[a.status]!==undefined?_apStatusOrder[a.status]:3;
      var ob=_apStatusOrder[b.status]!==undefined?_apStatusOrder[b.status]:3;
      return oa-ob;
    });
    var apBody=job.applicants.length===0?'<tr><td colspan="9" style="padding:14px 20px;color:#CBD5E1;font-size:12px;font-style:italic">등록된 지원자가 없습니다.</td></tr>':_sortedAps.map(function(ap){
      var st=STUDENTS.find(function(s){return s.id===ap.studentId;});
      var otherJ=JOBS.filter(function(j){return j.id!==job.id&&j.applicants.some(function(a){return a.studentId===ap.studentId;});});
      var isDup=otherJ.length>0,sc=STATUS_COLORS[ap.status]||'#6B7280';
      var statusBadge='<span style="background:'+sc+'22;color:'+sc+';padding:2px 7px;border-radius:99px;font-size:10px;font-weight:700;border:1px solid '+sc+'44;white-space:nowrap">'+esc(ap.status)+'</span>';
      var nameCell='<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap"><button onclick="openEditApModal('+job.id+','+ap.id+')" style="border:none;background:none;cursor:pointer;color:'+(isDup?'#D97706':'#2563EB')+';font-weight:700;font-size:12px;text-decoration:underline;padding:0;font-family:inherit">'+esc(st?(isStaff()?maskName(st.name):st.name):'?')+'</button>'+(isDup?'<span style="font-size:9px;background:#FEF3C7;color:#92400E;padding:1px 6px;border-radius:99px;font-weight:800;white-space:nowrap">중복:'+otherJ.slice(0,2).map(function(j){return j.name.slice(0,4);}).join(',')+'</span>':'')+(ap.examNumber?'<span style="font-size:9px;background:#FEF9C3;color:#854D0E;padding:1px 5px;border-radius:99px;font-weight:700;white-space:nowrap">번호:'+esc(ap.examNumber)+'</span>':'')+'</div>';
      return'<tr class="acc-tr" style="border-bottom:1px solid #EFF6FF;background:#FAFEFF">'+(isAdmin()?'<td style="padding:8px 10px 8px 14px;text-align:center"><input type="checkbox" class="bulk_ap_cb" data-job="'+job.id+'" data-ap="'+ap.id+'" onchange="toggleBulkAp('+job.id+','+ap.id+',this.checked)" style="accent-color:#2563EB;cursor:pointer"></td>':'')+'<td style="padding:8px 10px 8px 14px;white-space:nowrap">'+(isAdmin()?'<select class="ap-st-sel" data-prev="'+esc(ap.status)+'" onchange="setApStatusInline('+ap.id+',this)" title="눌러서 상태 바로 변경" style="background:'+sc+'18;color:'+sc+';border:1px solid '+sc+'55;padding:3px 6px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;outline:none">'+STATUSES.concat(STATUSES.indexOf(ap.status)<0?[ap.status]:[]).map(function(s){return'<option value="'+esc(s)+'"'+(s===ap.status?' selected':'')+' style="color:#0F172A;background:#fff">'+esc(s)+'</option>';}).join('')+'</select>':statusBadge)+'</td><td style="padding:8px 10px">'+nameCell+'</td><td style="padding:8px 10px;color:#1F2937;font-size:12px;white-space:nowrap">'+(st&&st.age?(isStaff()?'--세':st.age+'세'):'<span style="color:#CBD5E1">-</span>')+'</td><td style="padding:8px 10px;font-size:12px;white-space:nowrap">'+(st&&st.phone?(isStaff()?'<span style="color:#CBD5E1;font-size:11px">비공개</span>':'<a href="tel:'+esc(st.phone)+'" style="color:#2563EB;text-decoration:none;font-weight:600">'+esc(st.phone)+'</a>'):'<span style="color:#CBD5E1">-</span>')+'</td><td style="padding:8px 10px;font-size:11px;color:#6B7280;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(st&&st.email?(isStaff()?'<span style="color:#CBD5E1;font-size:11px">비공개</span>':esc(st.email)):'<span style="color:#CBD5E1">-</span>')+'</td><td style="padding:8px 10px;color:#6B7280;font-size:12px;white-space:nowrap">'+esc(ap.grade)+'</td><td style="padding:8px 10px;font-size:12px;color:#1F2937;white-space:nowrap">'+(ap.examNumber?'<span style="font-weight:600">'+esc(ap.examNumber)+'</span>':'<span style="color:#CBD5E1">-</span>')+'</td><td style="padding:8px 10px;color:#64748B;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px">'+(isStaff()?'<span style="color:#CBD5E1">비공개</span>':esc(ap.memo||'-'))+'</td><td style="padding:8px 10px;white-space:nowrap"><div style="display:flex;gap:4px">'+(isAdmin()?btn('수정','openEditApModal('+job.id+','+ap.id+')','outline',true)+' '+btn('삭제','deleteAp('+job.id+','+ap.id+')','danger',true):'<span style="font-size:10px;color:#CBD5E1">조회 전용</span>')+'</div></td></tr>';
    }).join('');
    var _bulkBar=isAdmin()?'<div style="padding:7px 12px;background:#EFF6FF;border-bottom:1px solid #DBEAFE;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><label style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#1E40AF;cursor:pointer"><input type="checkbox" id="bulk_all_'+job.id+'" onchange="toggleBulkAll('+job.id+',this.checked)" style="accent-color:#2563EB"> 전체 선택</label><span id="bulk_cnt_'+job.id+'" style="font-size:11px;color:#2563EB;font-weight:700"></span><select id="bulk_st_'+job.id+'" style="padding:4px 8px;border:1px solid #BFDBFE;border-radius:5px;font-size:11px;font-family:inherit;background:#fff">'+STATUSES.map(function(s){return'<option value="'+s+'">'+statusOptionLabel(s)+'</option>';}).join('')+'</select><button onclick="applyBulkStatus('+job.id+')" style="background:#2563EB;color:#fff;border:none;padding:4px 12px;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">일괄 변경</button></div>':'';
    apRows='<tr><td colspan="12" style="padding:0"><div style="background:#F8FAFF;border-left:3px solid #2563EB">'+_bulkBar+'<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#EFF6FF">'+(isAdmin()?'<th style="padding:7px 10px;width:32px;background:#EFF6FF;border-bottom:1px solid #DBEAFE"></th>':'')+['상태','이름','나이','연락처','이메일','급수','응시번호','메모','관리'].map(function(h){return'<th style="padding:7px 10px;text-align:left;font-weight:700;color:#1E40AF;font-size:11px;border-bottom:1px solid #DBEAFE;white-space:nowrap">'+h+'</th>';}).join('')+'</tr></thead><tbody>'+apBody+'</tbody></table></div></td></tr>';
  }
  var hasScheduleToday=tD||tDP||tI;
  var nameCell='<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">'+(isUrgent?'<span style="background:#FFEDD5;color:#EA580C;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:800;border:1px solid #FDBA74;white-space:nowrap">🔥최종발표</span>':'')+(hasScheduleToday?'<span style="color:#F59E0B;font-size:14px">★</span>':'')+(job.isRec?badge('추천','#7C3AED'):'')+(job.isReA?badge('재공고','#DC2626'):'')+(job.isClosed?badge('마감','#9CA3AF'):'')+' <button class="job-name-btn" onclick="_saveScrollPositions();toggleDetail('+job.id+')" style="border:none;background:none;padding:0;cursor:pointer;font-weight:700;font-size:13px;color:'+(isDetail?'#2563EB':'#0F172A')+';text-align:left;font-family:inherit;display:inline-flex;align-items:center;gap:4px">'+esc(job.name)+'<span style="font-size:10px;color:'+(isDetail?'#2563EB':'#94A3B8')+'">'+(isDetail?'▲':'▼')+'</span></button>'+(hasScheduleToday?'<span style="font-size:9px;background:#FEF3C7;color:#92400E;padding:1px 6px;border-radius:99px;font-weight:800">'+[tD&&'서류접수',tDP&&'합격발표',tI&&'면접'].filter(Boolean).join('/')+' D-DAY</span>':'')+_passBadge(job)+(function(){var h=_jobApNameHits(job,jobFilter.kw);return h.length&&job.name.indexOf(jobFilter.kw)<0?'<span style="font-size:10px;font-weight:700;color:#1D4ED8;background:#DBEAFE;padding:1px 7px;border-radius:99px;white-space:nowrap">👤 '+esc(h.slice(0,2).join(', '))+(h.length>2?' 외 '+(h.length-2)+'명':'')+' 지원</span>':'';})()+'</div>';
  var countCell='<div style="display:flex;flex-wrap:wrap;gap:3px;align-items:center"><span style="background:#DBEAFE;color:#1E40AF;padding:2px 7px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap">지원 '+cTotal+'</span>'+(cDocP>0?'<span style="background:#FEF3C7;color:#92400E;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap">서류합격 '+cDocP+'</span>':'')+(cInter>0?'<span style="background:#FDE68A;color:#78350F;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap">면접대기 '+cInter+'</span>':'')+(cPass>0?'<span style="background:#D1FAE5;color:#065F46;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap">합격 '+cPass+'</span>':'')+(cRes>0?'<span style="background:#CCFBF1;color:#0F766E;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap">예비 '+cRes+'</span>':'')+(cFail>0?'<span style="background:#FEE2E2;color:#991B1B;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap">불합격 '+cFail+'</span>':'')+(cWd.length>0?'<span title="'+esc(WITHDRAWN_STATUSES.map(function(w){var n=cWd.filter(function(a){return a.status===w;}).length;return n?w+' '+n:'';}).filter(Boolean).join(', '))+'" style="background:#F1F5F9;color:#475569;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap;border:1px dashed #CBD5E1">포기 '+cWd.length+'</span>':'')+'<button onclick="_saveScrollPositions();toggleJob('+job.id+')" style="border:none;background:'+(isOpen?'#2563EB':'#E2E8F0')+';color:'+(isOpen?'#fff':'#475569')+';border-radius:5px;padding:3px 8px;font-size:11px;cursor:pointer;font-weight:700;font-family:inherit;white-space:nowrap">'+(isOpen?'▲':'▼')+'</button></div>';
  var urlBtn=job.jobUrl?'<a href="'+esc(job.jobUrl)+'" target="_blank" style="background:#F0FDF4;color:#059669;border:1px solid #6EE7B7;padding:4px 9px;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;gap:3px">🔗 공고</a>':'';
  /* 관리자만 수정/삭제/지원추가 버튼 표시 */
  var manageBtns=isAdmin()
    ?'<div style="display:flex;gap:4px;flex-wrap:nowrap;align-items:center;margin-right:4px">'+urlBtn+' '+btn('✏','openJobModal('+job.id+')','outline',true)+' '+'<button onclick="openJobModal(null,'+job.id+')" title="이 공고를 복사해서 새 공고 등록" style="background:#fff;color:#1F2937;border:1px solid #D1D5DB;padding:4px 9px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">⧉ 복사</button>'+' '+btn('🗑','confirmDeleteJob('+job.id+')','danger',true)+' '+btn('+지원','openAddApModal('+job.id+')','primary',true)+'</div>'
    :'<div style="display:flex;gap:4px;flex-wrap:nowrap;align-items:center;margin-right:4px">'+urlBtn+'</div>';
  var docDateText=job.docDate?'<span style="color:'+(tD?'#DC2626':'#475569')+';font-weight:'+(tD?700:400)+';font-size:11px">'+fmt(job.docDate)+'</span>':'<span style="color:#1E293B;font-size:11px">-</span>';
  var dlText=job.isClosed?'<span style="color:#9CA3AF;font-size:10px">마감됨</span>':deadline?'<div style="display:flex;flex-direction:column;gap:2px">'+dDayBadge(deadline,false)+'<span style="color:'+(dlDNum!==null&&dlDNum>=0&&dlDNum<=3?'#DC2626':dlDNum!==null&&dlDNum>=0&&dlDNum<=7?'#D97706':'#6B7280')+';font-size:10px;font-weight:'+(dlDNum!==null&&dlDNum>=0&&dlDNum<=7?700:400)+'">'+fmt(deadline)+'</span></div>':'<span style="color:#1E293B">-</span>';
  var dpText=job.documentPassDate?'<span style="color:'+(tDP?'#DC2626':'#475569')+';font-weight:'+(tDP?700:400)+';font-size:11px">'+fmt(job.documentPassDate)+'</span>':'<span style="color:#1E293B">-</span>';
  var finalText=job.finalDate?'<div style="display:flex;flex-direction:column;gap:2px">'+dDayBadge(job.finalDate,job.isClosed)+'<span style="color:'+(tF?'#EA580C':finalDNum!==null&&finalDNum>=0&&finalDNum<=3?'#DC2626':'#475569')+';font-weight:'+((tF||(finalDNum!==null&&finalDNum>=0&&finalDNum<=3))?700:400)+';font-size:10px">'+fmt(job.finalDate)+'</span></div>':'<span style="color:#1E293B">-</span>';
  var typeCell=job.type?'<span style="background:#F1F5F9;color:#1F2937;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;white-space:nowrap;display:inline-block;border:1px solid #E2E8F0">'+esc(job.type)+'</span>':'<span style="color:#1E293B">-</span>';
  return'<tr class="'+rowClass+'" data-job-row="'+job.id+'" style="border-bottom:1px solid #F1F5F9;'+(rowBg!='#fff'&&!isUrgent?'background:'+rowBg+';':'')+(over?'opacity:.65;':'')+'"><td style="padding:10px 8px;text-align:center">'+(_selectedJobIds.has(job.id)?'<input type="checkbox" checked onchange="toggleJobSelect('+job.id+')" style="width:15px;height:15px;cursor:pointer;accent-color:#2563EB">':'<input type="checkbox" onchange="toggleJobSelect('+job.id+')" style="width:15px;height:15px;cursor:pointer;accent-color:#2563EB">')+'</td><td style="padding:10px 8px;text-align:center;color:#64748B;font-size:11px;font-weight:700;white-space:nowrap">'+rowNum+'</td><td style="padding:10px 10px;white-space:nowrap">'+badge(job.category)+'</td><td style="padding:10px 10px;white-space:nowrap">'+typeCell+'</td><td style="padding:10px 10px;min-width:180px">'+nameCell+'</td><td style="padding:10px 10px;white-space:nowrap">'+docDateText+'</td><td style="padding:10px 10px;white-space:nowrap">'+dlText+'</td><td style="padding:10px 10px;font-size:11px;white-space:nowrap">'+dpText+'</td><td style="padding:10px 10px;font-size:11px;white-space:nowrap;color:'+(tI?'#DC2626':'#475569')+';font-weight:'+(tI?700:400)+'">'+fmt(job.interviewDate)+'</td><td style="padding:10px 10px;white-space:nowrap">'+finalText+'</td>'+(_isCounsel()?'':'<td style="padding:10px 10px">'+countCell+'</td>')+'<td style="padding:10px 32px 10px 10px;min-width:180px">'+(_isCounsel()?'':manageBtns)+'</td></tr>'+(isDetail?renderDetailPanel(job):'')+apRows;
}

function _noLocBtn(){
  var n=JOBS.filter(function(j){return !j.location&&!j.isClosed;}).length;
  if(!n)return '';
  var on=jobFilter.location==='__none__';
  return '<button onclick="jobFilter.location=\'__none__\';renderView()"'
    +' style="background:'+(on?'#DC2626':'#FEE2E2')+';color:'+(on?'#fff':'#DC2626')+';'
    +'border:1px solid #FECACA;padding:6px 12px;border-radius:6px;font-size:12px;'
    +'font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0">'
    +'📍 지역 미설정 '+n+'건</button>';
}
function renderJobs(){
  _saveJobFilters();
  var filtered=getFiltered(),sorted=getSorted(filtered);
  var years=[...new Set(JOBS.map(function(j){return j.docDate?j.docDate.slice(0,4):'';}).filter(Boolean))].sort().reverse();
  var _activeCats=_isCounsel()?_COUNSEL_CATS:CATS;
  var catTabs=_activeCats.map(function(c){
    var isFreelanceCat=_FREELANCE_CATS.some(function(f){return f.cat===c;});
    var cnt=c==='전체'?JOBS.length
      :isFreelanceCat?(_FREELANCE_CATS.find(function(f){return f.cat===c;})||{cnt:0}).cnt
      :JOBS.filter(function(j){return j.category===c;}).length;var a=c===jobFilter.cat;return'<button onclick="jobFilter.cat=\''+c+'\';renderView()" style="white-space:nowrap;padding:6px 14px;border-radius:99px;border:1.5px solid '+(a?'#2563EB':'#E2E8F0')+';background:'+(a?'#2563EB':'#fff')+';color:'+(a?'#fff':'#374151')+';font-size:12px;font-weight:'+(a?700:500)+';cursor:pointer;font-family:inherit;flex-shrink:0">'+c+'</button>';}).join('');
  var sortHint=tableSort.col&&tableSort.dir!=='none'?'<span style="color:#2563EB;font-weight:600">'+({docDate:'서류접수일',deadline:'서류마감일',documentPassDate:'서류합격발표일',interviewDate:'면접일',finalDate:'최종합격발표일'}[tableSort.col]||'')+' '+(tableSort.dir==='asc'?'오래된순↑':'최신순↓')+'</span>':'<span style="color:#2563EB;font-weight:600">최종합격발표일 임박순</span>';
  /* 상담팀 + 프리랜서 카테고리: 특별 패널 반환 */
  if(_isCounsel()&&_FREELANCE_CATS.some(function(f){return f.cat===jobFilter.cat;})){
    return '<div id="_view_scroll" style="padding:12px 16px 24px;height:100%;overflow-y:auto">'
      +'<div class="cat-tab-wrap" style="flex-shrink:0">'+catTabs+'</div>'
      +'<div style="background:#fff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;margin-top:8px">'+renderFreelanceCatPanel(jobFilter.cat)+'</div>'
    +'</div>';
  }
  var tblRows=sorted.length===0?'<tr><td colspan="12" style="padding:40px;text-align:center;color:#CBD5E1;font-size:13px">공고가 없습니다.</td></tr>':sorted.map(function(j,i){return renderJobRow(j,i+1);}).join('');
  var sTh=function(label){return'<th style="padding:10px 10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px;white-space:nowrap;letter-spacing:.04em;background:#F8FAFC">'+label+'</th>';};
  var locBadge=jobFilter.location?'<span style="display:inline-flex;align-items:center;gap:4px;background:#FFF7ED;border:1px solid #FED7AA;padding:4px 10px;border-radius:99px;font-size:11px;color:#D97706;font-weight:700">📍 '+esc(jobFilter.location)+' <button onclick="jobFilter.location=\'\';_dashMapLocation=null;renderView()" style="border:none;background:none;color:#D97706;cursor:pointer;font-size:12px;font-weight:900;padding:0 0 0 3px;line-height:1;font-family:inherit">✕</button></span>':'';
  return'<div id="_view_scroll" style="padding:20px 32px 24px 24px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:10px">'
  /* 자동 마감 대기 공고 */
  +function(){
    var autoClose=JOBS.filter(function(j){
      if(j.isClosed||j.isRec)return false;
      if(j.finalDate&&j.finalDate.slice(0,10)<TODAY)return true;
      var dl=j.applyDeadline||j.docDate;
      return !!(dl&&dl.slice(0,10)<TODAY&&!j.interviewDate&&!j.finalDate);
    });
    if(!isAdmin()||!autoClose.length)return'';
    var jobListHtml=autoClose.map(function(j){
      return'<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:0.5px solid #FDE68A">'+badge(j.category)+'<span style="font-size:12px;font-weight:600;color:#78350F">'+esc(j.name)+'</span>'+(j.finalDate?'<span style="font-size:11px;color:#92400E;margin-left:auto">발표일 '+fmt(j.finalDate)+'</span>':'')+'</div>';
    }).join('');
    return'<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;overflow:hidden;flex-shrink:0">'
      +'<div style="padding:10px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
        +'<span style="font-size:16px">📋</span>'
        +'<div style="flex:1;font-size:13px;color:#92400E;font-weight:600">마감 처리 대기 '+autoClose.length+'건 — 기간이 지났지만 마감 처리되지 않은 공고가 있습니다</div>'
        +'<button onclick="document.getElementById(\'_autoclose_list\').style.display=document.getElementById(\'_autoclose_list\').style.display===\'none\'?\'block\':\'none\'" style="background:transparent;color:#92400E;border:1px solid #FDE68A;padding:4px 10px;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">공고 목록 ▼</button>'
        +'<button onclick="confirmAutoClose(['+autoClose.map(function(j){return j.id;}).join(',')+'],'+autoClose.length+')" style="background:#D97706;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">일괄 마감 처리</button>'
      +'</div>'
      +'<div id="_autoclose_list" style="display:none;padding:6px 16px 10px;border-top:0.5px solid #FDE68A">'+jobListHtml+'</div>'
    +'</div>';
  }()
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0">'
    +'<div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">공고 관리</h2>'
    +'<p style="margin:3px 0 0;font-size:12px;color:#64748B">'+sorted.length+'건 표시 / 전체 '+JOBS.length+'건 · '+sortHint+(jobFilter.location?' · <span style="color:#D97706;font-weight:700">📍 '+esc(jobFilter.location)+'</span> 필터 중':'')+(isAdmin()?'':' <span style="background:#FEF3C7;color:#92400E;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700;border:1px solid #FDE68A">조회 전용 모드</span>')+'</p></div>'
    +'<div style="display:flex;gap:8px">'
      +(isStaff()?'':(_selectedJobIds.size>0?'<button onclick="exportSelectedJobApplicants()" style="background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;border:none;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;white-space:nowrap">👥 선택 공고 지원자 명단<span style="font-size:10px;background:rgba(255,255,255,.25);padding:1px 7px;border-radius:99px">'+_selectedJobIds.size+'개 공고</span></button>':''))
      +(isStaff()?'':' '+btn('📥 CSV 내보내기','exportJobs()','success'))
      +(isAdmin()?' '+btn('+ 새 공고 등록','openJobModal(null)','primary'):'')
    +'</div>'
  +'</div>'
  +'<div class="cat-tab-wrap" style="flex-shrink:0">'+catTabs+'</div>'
  +'<div style="background:#fff;border-radius:10px;padding:10px 14px;border:1px solid #E5E7EB;display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0">'
    +'<select onchange="jobFilter.year=this.value;renderView()" style="padding:7px 10px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;background:#fff;font-family:inherit"><option value="">전체 연도</option>'+years.map(function(y){return'<option value="'+y+'" '+(y===jobFilter.year?'selected':'')+'>'+y+'</option>';}).join('')+'</select>'
    +'<select onchange="jobFilter.recType=this.value;renderView()" style="padding:7px 10px;border:1px solid '+(jobFilter.recType!=='전체'?'#059669':'#E2E8F0')+';border-radius:6px;font-size:12px;background:'+(jobFilter.recType!=='전체'?'#F0FDF4':'#fff')+';font-family:inherit;color:'+(jobFilter.recType!=='전체'?'#059669':'#374151')+'"><option value="전체">전체(추천/지원)</option><option value="추천" '+(jobFilter.recType==='추천'?'selected':'')+'>추천</option><option value="지원" '+(jobFilter.recType==='지원'?'selected':'')+'>지원</option></select>'
    +'<select onchange="jobFilter.location=this.value;_dashMapLocation=this.value||null;renderView()" style="padding:7px 10px;border:1px solid '+(jobFilter.location?'#F59E0B':'#E2E8F0')+';border-radius:6px;font-size:12px;background:'+(jobFilter.location?'#FFFBEB':'#fff')+';font-family:inherit;color:'+(jobFilter.location?'#D97706':'#374151')+'"><option value="">📍 전체 지역</option>'+LOCATIONS.map(function(l){return'<option value="'+l+'" '+(l===jobFilter.location?'selected':'')+'>'+l+'</option>';}).join('')+'</select>'
    +_noLocBtn()
    +'<input id="jobSearchInput" value="'+esc(jobFilter.kw)+'" oncompositionstart="onJobCompositionStart()" oncompositionend="onJobCompositionEnd(this)" oninput="onJobInput(this)" placeholder="'+(isStaff()?'🔍 공고명 실시간 검색...':'🔍 공고명 또는 지원자 이름 검색...')+'" style="padding:7px 12px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;min-width:160px;outline:none;font-family:inherit;flex:1" autocomplete="off">'
    +(locBadge?locBadge+' ':'')
    +(jobFilter.kw?'<button onclick="jobFilter.kw=\'\';renderView()" style="border:none;background:#F1F5F9;color:#64748B;padding:7px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 초기화</button>':'')
    +(tableSort.col&&tableSort.dir!=='none'?'<button onclick="tableSort={col:null,dir:\'none\'};renderView()" style="border:none;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:7px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 정렬 해제</button>':'')
    +(_hasAnyColFilter()?'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;width:100%;padding-top:6px;margin-top:4px;border-top:1px dashed #FECACA"><span style="font-size:10px;color:#DC2626;font-weight:700;flex-shrink:0">📅 날짜필터:</span>'+_buildColFilterBadges()+'<button onclick="clearAllColFilters()" style="background:#DC2626;color:#fff;border:none;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;margin-left:auto">✕ 전체 초기화</button></div>':'')
  +'</div>'
  +function(){
    /* 빠른 보기 */
    var base=JOBS;
    var defs=[['hideClosed','🔒 마감 숨기기',base.filter(function(j){return j.isClosed;}).length],['today','★ 오늘 일정',base.filter(_jobHasToday).length],['weekIv','🗓 이번 주 면접',base.filter(_jobWeekIv).length],['noAps','👻 지원자 없음',base.filter(function(j){return !j.isClosed&&!j.applicants.length;}).length]];
    return'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex-shrink:0"><span style="font-size:11px;font-weight:700;color:#64748B">빠른 보기:</span>'
      +defs.map(function(d){var on=d[0]==='hideClosed'?_jobQuick.hideClosed:_jobQuick.mode===d[0];return'<button onclick="toggleJobQuick(\''+d[0]+'\')" style="padding:4px 11px;border-radius:99px;border:1px solid '+(on?'#2563EB':'#E2E8F0')+';background:'+(on?'#2563EB':'#fff')+';color:'+(on?'#fff':'#475569')+';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">'+d[1]+' <span style="opacity:.75">'+d[2]+'</span></button>';}).join('')
    +'</div>';
  }()
  +function(){
    /* 현재 카테고리 기준으로 채용형태 카운트 */
    var catJobs=JOBS.filter(function(j){if(jobFilter.cat!=='전체'&&j.category!==jobFilter.cat)return false;if(jobFilter.recType==='추천'&&!j.isRec)return false;if(jobFilter.recType==='지원'&&j.isRec)return false;return true;});
    var typeCounts={};
    catJobs.forEach(function(j){var t=j.type||'기타';typeCounts[t]=(typeCounts[t]||0)+1;});
    var typeList=JOB_TYPES.filter(function(t){return typeCounts[t]>0;});
    if(!typeList.length)return'';
    if(_isCounsel())return'';
    return'<div style="display:flex;gap:5px;flex-wrap:wrap;flex-shrink:0;padding:0 2px">'
      +'<span style="font-size:11px;color:#64748B;font-weight:600;padding-top:7px;white-space:nowrap">채용형태:</span>'
      +typeList.map(function(t){
        var cnt=typeCounts[t]||0;
        var a=jobFilter.type===t;
        return'<button onclick="jobFilter.type=jobFilter.type===\''+t+'\'?\'전체\':\''+t+'\';renderView()" '
          +'onmousedown="this.style.transform=\'scale(0.93)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'" '
          +'style="white-space:nowrap;padding:5px 12px;border-radius:99px;border:1.5px solid '+(a?'#7C3AED':'#E2E8F0')+';background:'+(a?'#7C3AED':'#fff')+';color:'+(a?'#fff':'#374151')+';font-size:11px;font-weight:'+(a?700:500)+';cursor:pointer;font-family:inherit;transition:all .15s">'+t+'</button>';
      }).join('')
      +(jobFilter.type!=='전체'&&jobFilter.type!=='추천'&&jobFilter.type!=='지원'?'<button onclick="jobFilter.type=\'전체\';renderView()" style="border:none;background:#EDE9FE;color:#7C3AED;padding:5px 10px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 형태 초기화</button>':'')
    +'</div>';
  }()
  +'<div id="_tbl_scroll" style="background:#fff;border-radius:10px;border:1px solid #E5E7EB;overflow:auto;flex:1;min-height:0">'
    +'<table style="width:100%;border-collapse:collapse;font-size:13px;min-width:1360px">'
      +'<thead><tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;position:sticky;top:0;z-index:2">'
        +'<th style="padding:10px 8px;text-align:center;background:#F8FAFC;width:36px">'+(sorted.length>0?'<input type="checkbox" '+(sorted.every(function(j){return _selectedJobIds.has(j.id);})?'checked':'')+' onchange="toggleJobSelectAll(['+sorted.map(function(j){return j.id;}).join(',')+'])" style="width:15px;height:15px;cursor:pointer;accent-color:#2563EB">':'')+'</th>'
        +sTh('No.')+sTh('카테고리')+sTh('채용 형태')+sTh('공고명 (▼ 상세)')+sortHeader('서류접수일','docDate')+sortHeader('서류마감일','deadline')+sortHeader('서류합격발표일','documentPassDate')+sortHeader('면접일','interviewDate')+sortHeader('최종합격발표일','finalDate')+(_isCounsel()?'':sTh('지원현황'))
        +'<th style="padding:10px 32px 10px 10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px;white-space:nowrap;letter-spacing:.04em;background:#F8FAFC;min-width:180px">'+(_isCounsel()?'':'관리')+'</th>'
      +'</tr></thead>'
      +'<tbody>'+tblRows+'</tbody>'
    +'</table>'
  +'</div>'
  +'</div>';
}



/* ─ 공고 모달 ─ */
function buildVaultRefPanel(jobCat){
  var ivCat=jobCatToIV(jobCat)||null;
  if(!ivCat)return'<div style="padding:10px;font-size:11px;color:#CBD5E1;text-align:center">이 카테고리의 자료실 데이터 없음</div>';
  var related=VAULT.filter(function(v){return v.category===ivCat;}).sort(function(a,b){return (b.year||0)-(a.year||0);}).slice(0,6);
  if(!related.length)return'<div style="padding:10px;font-size:11px;color:#CBD5E1;text-align:center">'+ivCat+' 카테고리 자료 없음</div>';
  return related.map(function(v,i){
    var fnId='_vRef_'+Date.now()+'_'+i;
    window[fnId]=function(){var ta=document.createElement('textarea');ta.value=v.content;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');customAlert('✅ "'+v.institutionName+'" ('+(v.year||'?')+'년) 내용이 클립보드에 복사되었습니다!');}catch(e){customAlert('복사 실패.');}document.body.removeChild(ta);};
    return'<div style="padding:8px 10px;border-bottom:1px solid #F3F4F6;cursor:pointer" onclick="'+fnId+'()" title="클릭→클립보드 복사"><div style="display:flex;align-items:center;justify-content:space-between;gap:6px"><div style="min-width:0;flex:1"><p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#1F2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(v.year?'['+v.year+'년] ':'')+esc(v.institutionName.length>18?v.institutionName.slice(0,18)+'…':v.institutionName)+'</p><p style="margin:0;font-size:10px;color:#9CA3AF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(v.content.length>40?v.content.slice(0,40)+'…':v.content)+'</p></div><span style="font-size:9px;color:#0EA5E9;font-weight:700;white-space:nowrap;flex-shrink:0">📋 복사</span></div></div>';
  }).join('');
}
function buildRecSection(f){f=f||{};return'<div style="background:#F0F7FF;border-radius:8px;padding:14px;margin-bottom:8px"><p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.06em">📌 추천 공고 정보</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">'+fInp('제출 서류','jf_sd','text',f.submitDocs||'')+' '+fInp('제출 기한','jf_sl','date',f.submitDeadline||'')+' '+fInp('담당자 이름','jf_mn','text',f.managerName||'')+' '+fInp('담당자 연락처','jf_mp','text',f.managerPhone||'')+'</div>'+fInp('담당자 이메일','jf_me','email',f.managerEmail||'')+'</div>';}
function toggleRecF(){var isRec=$('jf_rc')&&$('jf_rc').checked;var el=$('jf_rec');if(!el)return;if(!isRec){el.innerHTML='';}else if(!document.getElementById('jf_sd')){el.innerHTML=buildRecSection({});}}
function openJobModal(jobId,copyFromId){if(!isAdmin()){customAlert("⛔ 마스터 계정만 사용 가능한 기능입니다.");return;}
  var job=jobId!=null?JOBS.find(function(j){return j.id===jobId;}):null;
  var _src=!job&&copyFromId!=null?JOBS.find(function(j){return j.id===copyFromId;}):null;
  var _cf=null;if(_src){var _c={};Object.keys(_src).forEach(function(k){if(k==='applicants')return;_c[k]=/(Date|Deadline)$/.test(k)?'':_src[k];});_c.isClosed=false;_c.note='';_cf=_c;}
  var f=_cf||job||{name:'',category:'법원',type:'한시임기제',location:'',isRec:false,docDate:'',documentPassDate:'',interviewDate:'',finalDate:'',startDate:'',endDate:'',isReA:false,isClosed:false,note:'',applyDeadline:'',jobUrl:'',submitDocs:'',submitDeadline:'',managerEmail:'',managerName:'',managerPhone:'',recruitmentCount:null};
  var _jfPass=parsePassNote(f.note);window._jfPassOrig={pass:_jfPass,note:f.note||''};
  var ivCat=jobCatToIV(f.category)||'';var vaultPanel=buildVaultRefPanel(f.category);
  var chks=[['isRec','jf_rc','📌 추천 채용'],['isReA','jf_ra','🔄 재공고'],['isClosed','jf_cl','🔒 마감']];
  var rcVal=f.recruitmentCount!=null?String(f.recruitmentCount):'';
  var locOpts=[''].concat(LOCATIONS).map(function(o){return'<option value="'+esc(o)+'" '+(o===(f.location||'')?'selected':'')+'>'+( o?o:'지역 선택...')+'</option>';}).join('');
  var nameAndCountRow='<div style="display:grid;grid-template-columns:1fr 110px 110px;gap:0 12px;margin-bottom:10px"><div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">③ 공고명 *</label><input id="jf_name" type="text" value="'+esc(f.name)+'" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;outline:none;font-family:inherit"></div><div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">채용 인원 (명)</label><input id="jf_rc_cnt" type="number" min="0" step="1" value="'+esc(rcVal)+'" placeholder="예: 2" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;outline:none;font-family:inherit"></div><div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">📍 지역 선택</label><select id="jf_loc" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+locOpts+'</select></div></div>';
  showModal(job?'공고 수정':_src?'공고 복사 — 새 공고로 등록 (날짜만 입력하세요)':'새 공고 등록','<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px;margin-bottom:4px">'+fSel('① 카테고리','jf_cat',CATS.slice(1),f.category)+' '+fSel('② 채용 형태','jf_type',JOB_TYPES,f.type)+'</div>'+nameAndCountRow+'<div style="background:#F0FDF4;border-radius:8px;padding:12px 14px;margin-bottom:12px;border:1px solid #BBF7D0"><p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:.06em">접수 단계</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">'+fInp('④ 서류접수일','jf_dd','date',f.docDate||'')+' '+fInp('⑤ 서류마감일 (D-Day 기준)','jf_ad','date',f.applyDeadline||'')+'</div></div><div style="background:#FFF7ED;border-radius:8px;padding:12px 14px;margin-bottom:12px;border:1px solid #FED7AA"><p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#C2410C;text-transform:uppercase;letter-spacing:.06em">심사 단계</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">'+fInp('⑥ 서류합격발표일','jf_dpd','date',f.documentPassDate||'')+' '+fInp('⑦ 면접일','jf_id','date',f.interviewDate||'')+'</div></div><div style="background:#FFF1F2;border-radius:8px;padding:12px 14px;margin-bottom:12px;border:1px solid #FECDD3"><p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#BE123C;text-transform:uppercase;letter-spacing:.06em">합격 발표</p>'+fInp('⑧ 최종합격발표일 ★','jf_fd','date',f.finalDate||'')+'</div><div style="background:#F5F3FF;border-radius:8px;padding:12px 14px;margin-bottom:12px;border:1px solid #DDD6FE"><p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#6D28D9;text-transform:uppercase;letter-spacing:.06em">임용 단계</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">'+fInp('⑨ 근무 시작일','jf_sd2','date',f.startDate||'')+' '+fInp('⑩ 근무 종료일','jf_ed','date',f.endDate||'')+'</div></div>'+fInp('⑪ 🔗 공고 원문 URL','jf_url','url',f.jobUrl||'','placeholder="https://..."')+'<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">'+chks.map(function(x){return'<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;padding:6px 12px;border:1px solid #E5E7EB;border-radius:6px;background:'+(f[x[0]]?'#EFF6FF':'#fff')+';color:'+(f[x[0]]?'#2563EB':'#374151')+'"><input type="checkbox" id="'+x[1]+'" '+(f[x[0]]?'checked':'')+(x[1]==='jf_rc'?' onchange="toggleRecF()"':'')+'>'+x[2]+'</label>';}).join('')+'</div><div id="jf_rec">'+(f.isRec?buildRecSection(f):'')+'</div><div style="margin-bottom:12px">'+_passSectionHtml(job,_jfPass)+'<label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">비고</label><textarea id="jf_note" rows="2" placeholder="그 밖의 메모" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit">'+esc(_jfPass.rest)+'</textarea></div>'+(ivCat?'<div style="background:#F0F9FF;border-radius:10px;padding:12px;margin-bottom:4px;border:1px solid #BAE6FD"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><p style="margin:0;font-size:10px;font-weight:800;color:#0284C7;text-transform:uppercase;letter-spacing:.06em">📚 면접 자료실 참조 ('+ivCat+') — 클릭 시 클립보드 복사</p><button type="button" onclick="setView(\'interview\')" style="background:none;border:1px solid #BAE6FD;color:#0EA5E9;padding:3px 10px;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">자료실 열기 →</button></div><div style="background:#fff;border-radius:8px;border:1px solid #BAE6FD;max-height:160px;overflow-y:auto">'+vaultPanel+'</div></div>':'')+'<div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'+btn('취소','closeModal()','outline')+' '+btn(job?'💾 저장':'✅ 등록','saveJob('+(jobId!=null?jobId:'null')+')','primary')+'</div>','720px');
}
function _jfNoteValue(){
  var o=window._jfPassOrig||{pass:parsePassNote(''),note:''};
  function v(id){var e=$(id);return e?String(e.value).trim():'';}
  var doc={n:v('jf_doc_n'),names:v('jf_doc_names')},fin={n:v('jf_fin_n'),names:v('jf_fin_names')},rest=$('jf_note')?$('jf_note').value.trim():'';
  /* 아무것도 안 바꿨으면 원래 비고를 그대로 둔다 */
  if(doc.n===o.pass.doc.n&&doc.names===o.pass.doc.names&&fin.n===o.pass.fin.n&&fin.names===o.pass.fin.names&&rest===o.pass.rest)return o.note;
  return buildPassNote(doc,fin,rest);
}
async function saveJob(jobId){
  var name=$('jf_name')&&$('jf_name').value.trim();if(!name)return customAlert('공고명을 입력하세요');
  var _rcVal=$('jf_rc_cnt')&&$('jf_rc_cnt').value.trim()!==''?parseInt($('jf_rc_cnt').value):null;
  var f={name:name,category:$('jf_cat').value,type:$('jf_type').value,location:($('jf_loc')&&$('jf_loc').value)||'',is_rec:!!$('jf_rc').checked,is_rea:!!$('jf_ra').checked,is_closed:!!$('jf_cl').checked,doc_date:dateOrNull($('jf_dd')&&$('jf_dd').value),apply_deadline:dateOrNull($('jf_ad')&&$('jf_ad').value),document_pass_date:dateOrNull($('jf_dpd')&&$('jf_dpd').value),interview_date:dateOrNull($('jf_id')&&$('jf_id').value),final_date:dateOrNull($('jf_fd')&&$('jf_fd').value),start_date:dateOrNull($('jf_sd2')&&$('jf_sd2').value),end_date:dateOrNull($('jf_ed')&&$('jf_ed').value),job_url:($('jf_url')&&$('jf_url').value)||'',note:_jfNoteValue(),submit_docs:($('jf_sd')&&$('jf_sd').value)||'',submit_deadline:dateOrNull($('jf_sl')&&$('jf_sl').value),manager_name:($('jf_mn')&&$('jf_mn').value)||'',manager_phone:($('jf_mp')&&$('jf_mp').value)||'',manager_email:($('jf_me')&&$('jf_me').value)||'',recruitment_count:_rcVal};
  var r=jobId!=null?await SB.from('jobs').update(f).eq('id',jobId):await SB.from('jobs').insert(f);
  if(r.error){customAlert('저장 오류: '+r.error.message);return;}
  closeModal();await reloadData(['jobs']);
}
async function saveIdentify(jobId){
  if(!isAdmin())return;
  var announcedEl=$('id_announced_'+jobId);
  var announced=announcedEl&&announcedEl.value.trim()!==''?parseInt(announcedEl.value):null;
  var kb=$('id_kb_'+jobId)?$('id_kb_'+jobId).value:'확인중';
  var cname=$('id_cname_'+jobId)?$('id_cname_'+jobId).value:'';
  var cphone=$('id_cphone_'+jobId)?$('id_cphone_'+jobId).value:'';
  var memo=$('id_memo_'+jobId)?$('id_memo_'+jobId).value:'';

  var r=await SB.from('jobs').update({
    final_pass_announced_count:announced,
    id_keyboard:kb,
    id_contact_name:cname,
    id_contact_phone:cphone,
    id_memo:memo
  }).eq('id',jobId);
  if(r.error){customAlert('저장 오류: '+r.error.message);return;}

  var job=JOBS.find(function(j){return j.id===jobId;});
  if(job){
    job.finalPassAnnouncedCount=announced;
    job.idKeyboard=kb;
    job.idContactName=cname;
    job.idContactPhone=cphone;
    job.idMemo=memo;
  }
  renderView();
  showToast('저장되었습니다 ✓');
}

/* ─ 지원자 CRUD ─ */
var _addApJobId=null,_addApSelectedSid=null;
function openAddApModal(jobId){if(!isAdmin()){customAlert("⛔ 마스터 계정만 사용 가능한 기능입니다.");return;}_addApJobId=jobId;_addApSelectedSid=null;var job=JOBS.find(function(j){return j.id===jobId;});if(!job)return;
var ivSection='<div id="ap_interview_wrap" style="display:none"><div style="background:#FFFBEB;border:1px solid #FEF3C7;border-radius:8px;padding:12px 14px;margin-bottom:10px"><p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.06em">📋 면접 관련 기록</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+fInp('응시번호','ap_exam','text','')+' '+fInp('면접자료 발송일','ap_docsent','date','')+'</div>'+quickMemoButtons('ap_feedback')+'<div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">면접 회신 내용</label><textarea id="ap_feedback" rows="2" placeholder="면접 후 회신 내용..." style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit"></textarea></div></div></div>';
var stSelHtml='<div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">상태</label><select id="ap_st" onchange="toggleAddApInterviewSection(this.value)" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit;margin-bottom:10px">'+STATUSES.map(function(s){return'<option value="'+s+'" '+(s==='서류접수'?'selected':'')+'>'+statusOptionLabel(s)+'</option>';}).join('')+'</select></div>';
showModal('지원자 추가 — '+job.name.slice(0,22),'<div style="margin-bottom:4px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">학생 이름 검색</label><input id="ap_search" oninput="updateApSearch('+jobId+')" placeholder="이름 입력 → 기존 학생 검색 / 없으면 신규 등록" style="width:100%;padding:9px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:13px;outline:none;font-family:inherit" autocomplete="off"></div><div id="ap_search_results" style="margin-bottom:4px"></div><div id="ap_selected_info"></div><hr style="border:none;border-top:1px solid #F3F4F6;margin:12px 0"><p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em">지원 정보</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+stSelHtml+' '+fSel('급수','ap_gr',GRADES,'3급')+' '+fSel('발표방식','ap_an',ANNOUNCE,'홈페이지')+' <div></div></div>'+quickMemoButtons('ap_mm')+'<div style="margin-bottom:10px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">메모</label><textarea id="ap_mm" rows="2" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit"></textarea></div>'+ivSection+'<div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'+btn('취소','closeModal()','outline')+' '+'<button id="_ap_save_more_btn" onclick="saveAddAp('+jobId+',true)" title="저장한 뒤 창을 닫지 않고 다음 지원자를 바로 입력" style="background:#fff;color:#1D4ED8;border:1px solid #93C5FD;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:inherit">저장하고 계속 추가</button> '+'<button id="_ap_save_btn" onclick="saveAddAp('+jobId+')" style="background:#2563EB;color:#fff;border:none;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:inherit">추가</button>'+'</div>','580px');}
function updateApSearch(jobId){
  var val=$('ap_search')&&$('ap_search').value.trim();
  var results=$('ap_search_results'),selInfo=$('ap_selected_info');
  if(!results)return;
  if(!val){results.innerHTML='';if(selInfo)selInfo.innerHTML='';_addApSelectedSid=null;return;}
  var job=JOBS.find(function(j){return j.id===jobId;});
  if(!job)return;

  /* ── [Step 1] 현재 공고 기등록 지원자 이름 실시간 매칭 ── */
  var alreadyAps=job.applicants.filter(function(ap){
    var st=STUDENTS.find(function(s){return s.id===ap.studentId;});
    return st&&st.name.indexOf(val)>=0;
  });
  if(alreadyAps.length>0){
    /* 이미 등록된 지원자 발견 → 경고 카드 + 신규 등록 차단 */
    var dupCards=alreadyAps.map(function(ap){
      var st=STUDENTS.find(function(s){return s.id===ap.studentId;})||{};
      var sc=STATUS_COLORS[ap.status]||'#94A3B8';
      return'<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #FEE2E2;flex-wrap:wrap;gap:8px">'
        +'<div>'
        +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">'
        +'<span style="font-weight:800;font-size:13px;color:#991B1B">'+esc(st.name||'?')+'</span>'
        +'<span style="background:'+sc+'22;color:'+sc+';border:1px solid '+sc+'44;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700">'+esc(ap.status)+'</span>'
        +'<span style="background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700">'+esc(ap.grade||'-')+'</span>'
        +'</div>'
        +'<span style="font-size:11px;color:#6B7280">'+(st.phone?esc(st.phone):'연락처 없음')+(st.age?' · '+st.age+'세':'')+'</span>'
        +'</div>'
        +'<span style="font-size:10px;color:#DC2626;font-weight:700;white-space:nowrap">등록 완료</span>'
        +'</div>';
    }).join('');
    results.innerHTML='<div style="background:#FFF5F5;border:1.5px solid #FCA5A5;border-radius:10px;overflow:hidden;margin-bottom:4px">'
      +'<div style="background:linear-gradient(135deg,#DC2626,#B91C1C);padding:9px 14px;display:flex;align-items:center;gap:8px">'
      +'<span style="font-size:15px">⚠️</span>'
      +'<span style="font-size:12px;font-weight:800;color:#fff">이미 이 공고에 등록된 지원자입니다</span>'
      +'<span style="font-size:10px;color:#FECACA;margin-left:4px">'+alreadyAps.length+'명 일치</span>'
      +'</div>'
      +dupCards
      +'<div style="padding:8px 14px;background:#FEF2F2;border-top:1px solid #FEE2E2">'
      +'<p style="margin:0;font-size:11px;color:#991B1B">중복 등록은 불가합니다. 기존 지원자를 수정하려면 공고 행의 ▼ 버튼을 눌러 지원자 목록에서 수정하세요.</p>'
      +'</div></div>';
    /* 저장 버튼 비활성화 */
    var saveBtn=$('_ap_save_btn');if(saveBtn)saveBtn.disabled=true;var _smb=$('_ap_save_more_btn');if(_smb)_smb.disabled=true;
    return;
  }

  /* ── [Step 2] 중복 없음 → 기존 학생 검색 로직 ── */
  var saveBtn=$('_ap_save_btn');if(saveBtn)saveBtn.disabled=false;var _smb=$('_ap_save_more_btn');if(_smb)_smb.disabled=false;
  var available=STUDENTS.filter(function(s){return !job.applicants.find(function(a){return a.studentId===s.id;});});
  var matches=available.filter(function(s){return s.name.indexOf(val)>=0;});
  var todayMs=new Date(TODAY).getTime();
  function _snrBadge(s){
    if(s.restrictionLevel==='제한')return'<span style="background:#DC2626;color:#fff;padding:1px 7px;border-radius:4px;font-size:10px;font-weight:800;margin-left:4px">🚫 블랙</span>';
    var isNR=JOBS.some(function(j){return j.applicants.some(function(ap){
      if(ap.studentId!==s.id||!ap.interviewDocSent)return false;
      var diff=Math.round((todayMs-new Date(String(ap.interviewDocSent).slice(0,10)).getTime())/86400000);
      return diff>=7&&(ap.interviewFeedback||'').indexOf('회신완료')<0;
    });});
    return isNR?'<span style="background:#FEF3C7;color:#92400E;padding:1px 7px;border-radius:4px;font-size:10px;font-weight:800;border:1px solid #FDE68A;margin-left:4px">⚠️ 미회신</span>':'';
  }
  if(matches.length>0){
    results.innerHTML='<div style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:4px">'
      +'<div style="background:#F8FAFC;padding:6px 12px;font-size:10px;font-weight:700;color:#6B7280">기존 학생 '+matches.length+'명</div>'
      +matches.map(function(s){
        var bg=s.restrictionLevel==='제한'?'background:#FFF5F5;':'';
        return'<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid #F3F4F6;'+bg+'">'
          +'<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px">'
          +'<span style="font-weight:700;font-size:13px">'+esc(s.name)+'</span>'
          +_snrBadge(s)
          +'<span style="font-size:11px;color:#6B7280;margin-left:4px">'+(s.age||'?')+'세 · '+esc(s.phone)+'</span>'
          +'</div>'
          +'<button onclick="selectExistingAp('+s.id+',\''+esc(s.name)+'\')" style="background:#2563EB;color:#fff;border:none;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">선택</button>'
          +'</div>';
      }).join('')
      +'<div style="padding:8px 12px;border-top:1px solid #F3F4F6;background:#FAFAFA;display:flex;justify-content:space-between;align-items:center">'
      +'<span style="font-size:11px;color:#9CA3AF">찾는 학생이 없나요?</span>'
      +'<button onclick="selectNewAp(\''+esc(val)+'\')" style="background:#059669;color:#fff;border:none;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">신규 등록</button>'
      +'</div></div>';
  }else{
    results.innerHTML='<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:10px 14px;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between">'
      +'<span style="font-size:12px;color:#92400E">일치하는 학생이 없습니다.</span>'
      +'<button onclick="selectNewAp(\''+esc(val)+'\')" style="background:#059669;color:#fff;border:none;padding:5px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;margin-left:10px">신규 등록</button>'
      +'</div>';
  }
}
function selectExistingAp(sid,name){
  var st=STUDENTS.find(function(s){return s.id===sid;});
  if(st){
    var todayMs=new Date(TODAY).getTime();
    var isBlack=st.restrictionLevel==='제한';
    var isNoReply=!isBlack&&JOBS.some(function(j){return j.applicants.some(function(ap){
      if(ap.studentId!==sid||!ap.interviewDocSent)return false;
      var diff=Math.round((todayMs-new Date(String(ap.interviewDocSent).slice(0,10)).getTime())/86400000);
      return diff>=7&&(ap.interviewFeedback||'').indexOf('회신완료')<0;
    });});
    if(isBlack)customAlert('🚫 이 학생은 영구 블랙리스트입니다!\n\n'+name+' / '+(st.phone||'-')+'\n\n블랙리스트 해제 후 등록 가능합니다.');
    else if(isNoReply)customAlert('⚠️ 이 학생은 과거 미회신 이력이 있는 블랙리스트입니다!\n\n'+name+' / '+(st.phone||'-')+'\n\n신중히 검토 후 진행하세요.');
  }
  _addApSelectedSid=sid;
  /* Feature 2: 급수 자동 완성 — 해당 학생의 가장 최근 지원 기록에서 grade 추출 */
  (function(){
    var _grEl=$('ap_gr');if(!_grEl)return;
    var _allAps=[];
    JOBS.forEach(function(j){j.applicants.forEach(function(a){
      if(a.studentId===sid)_allAps.push(a);
    });});
    if(_allAps.length){
      /* 가장 최근(id 기준 내림차순) 지원의 grade 사용 */
      _allAps.sort(function(a,b){return b.id-a.id;});
      var _latestGrade=_allAps[0].grade||'';
      if(_latestGrade){_grEl.value=_latestGrade;}
    }
  })();
  var r=$('ap_search_results');if(r)r.innerHTML='';
  var s=$('ap_search');if(s){s.value=name;s.disabled=true;s.style.background='#F3F4F6';}
  var si=$('ap_selected_info');if(si)si.innerHTML='<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between"><span style="font-size:12px;font-weight:700;color:#1E40AF">✅ 기존 학생 선택됨: '+esc(name)+'</span><button onclick="clearApSelection()" style="background:none;border:1px solid #93C5FD;color:#2563EB;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">변경</button></div>';
}

/* ─ 신규 등록 시 이름 중복 체크 (Feature 1) ─ */
function checkDupApName(){
  var nm=$('ns_nm');var warn=$('_ns_dup_warn');var saveBtn=$('_ap_save_btn');
  if(!nm)return;
  var val=nm.value.trim();
  if(!val){if(warn)warn.style.display='none';if(saveBtn)saveBtn.disabled=false;var _smb0=$('_ap_save_more_btn');if(_smb0)_smb0.disabled=false;return;}
  var job=JOBS.find(function(j){return j.id===_addApJobId;});
  if(!job){if(warn)warn.style.display='none';return;}
  /* 이미 이 공고 지원자 중 동일 이름 존재 여부 */
  var isDup=job.applicants.some(function(ap){
    var st=STUDENTS.find(function(s){return s.id===ap.studentId;});
    return st&&st.name===val;
  });
  if(warn)warn.style.display=isDup?'block':'none';
  if(saveBtn)saveBtn.disabled=!!isDup;var _smb1=$('_ap_save_more_btn');if(_smb1)_smb1.disabled=!!isDup;
}
function selectNewAp(nameVal){_addApSelectedSid='new';var r=$('ap_search_results');if(r)r.innerHTML='';var s=$('ap_search');if(s){s.disabled=true;s.style.background='#F3F4F6';}var si=$('ap_selected_info');if(si)si.innerHTML='<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 14px;margin-bottom:4px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><span style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.06em">신규 학생 정보 입력</span><button onclick="clearApSelection()" style="background:none;border:1px solid #86EFAC;color:#15803D;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">변경</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+fInp('이름 *','ns_nm','text',nameVal,'oninput="checkDupApName()"')+'<div id="_ns_dup_warn" style="display:none;color:#DC2626;font-size:11px;font-weight:700;margin:-6px 0 8px;padding:4px 8px;background:#FEE2E2;border-radius:5px;border:1px solid #FECACA">⚠️ 이미 이 공고에 등록된 지원자입니다.</div>'+('<div style="margin-bottom:10px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">출생연도</label><div style="display:flex;gap:6px;align-items:center"><input id="ns_by" type="number" min="1940" max="2020" placeholder="예: 2006" oninput="calcNsAge()" style="flex:1;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;outline:none;font-family:inherit"><span id="ns_age_display" style="font-size:13px;color:#2563EB;font-weight:800;white-space:nowrap;min-width:44px"></span></div><input type="hidden" id="ns_ag"></div>')+'  '+fInp('연락처','ns_ph')+'  '+fInp('이메일','ns_em','email')+'</div></div>';}
function clearApSelection(){_addApSelectedSid=null;var s=$('ap_search');if(s){s.value='';s.disabled=false;s.style.background='';s.focus();}var r=$('ap_search_results');if(r)r.innerHTML='';var si=$('ap_selected_info');if(si)si.innerHTML='';}
async function saveAddAp(jobId,more){if(!isAdmin())return;
  if(!_addApSelectedSid)return customAlert('학생을 검색하여 선택하거나 신규 등록을 먼저 해주세요.');
  var sid;
  if(_addApSelectedSid==='new'){
    var nm=$('ns_nm')&&$('ns_nm').value.trim();if(!nm)return customAlert('이름을 입력하세요');
    /* Feature 1: 이름 중복 최종 방어 */
    var _dupJob=JOBS.find(function(j){return j.id===_addApJobId;});
    if(_dupJob&&_dupJob.applicants.some(function(ap){var _ds=STUDENTS.find(function(s){return s.id===ap.studentId;});return _ds&&_ds.name===nm;})){return customAlert('⚠️ 이미 이 공고에 등록된 지원자입니다.\n\n['+nm+']');}
    var ph=($('ns_ph')&&$('ns_ph').value)||'';
    if(ph.trim()){
      var normalized=ph.replace(/\D/g,'');
      var blMatch=normalized.length>=6?STUDENTS.find(function(s){return s.restrictionLevel==='제한'&&(s.phone||'').replace(/\D/g,'')===normalized;}):null;
      if(blMatch){customAlert('⚠️ 이 학생은 과거 미회신 이력이 있는 블랙리스트입니다!\n\n주와 전화번호: '+ph+'\n일치 블랙: '+blMatch.name+'\n\n등록이 차단되었습니다.');return;}
    }
    var rs=await SB.from('students').insert({name:nm,age:parseInt($('ns_ag')&&$('ns_ag').value)||null,phone:ph,email:($('ns_em')&&$('ns_em').value)||''}).select().single();
    if(rs.error){customAlert('학생 등록 오류: '+rs.error.message);return;}
    sid=rs.data.id;
  }else{sid=_addApSelectedSid;}
  var ra=await SB.from('applicants').insert({job_id:jobId,student_id:sid,status:($('ap_st')&&$('ap_st').value)||'서류접수',grade:($('ap_gr')&&$('ap_gr').value)||'3급',announce_type:($('ap_an')&&$('ap_an').value)||'홈페이지',memo:($('ap_mm')&&$('ap_mm').value)||'',exam_number:($('ap_exam')&&$('ap_exam').value)||'',interview_doc_sent:($('ap_docsent')&&$('ap_docsent').value)||null,interview_feedback:($('ap_feedback')&&$('ap_feedback').value)||''});
  if(ra.error){customAlert('지원자 추가 오류: '+ra.error.message);return;}
  closeModal();_saveScrollPositions();await reloadData(['applicants','students']);
  if(more){openAddApModal(jobId);var _s=$('ap_search');if(_s)_s.focus();showToast('추가했어요. 다음 지원자를 입력하세요');}
}
function openEditApModal(jobId,apId){if(!isAdmin()){customAlert("⛔ 마스터 계정만 사용 가능한 기능입니다.");return;}var job=JOBS.find(function(j){return j.id===jobId;}),ap=job&&job.applicants.find(function(a){return a.id===apId;}),st=ap&&STUDENTS.find(function(s){return s.id===ap.studentId;});if(!ap||!st)return;var showIv=['면접대기','예비합격','최종합격','취업성공','불합격','면접불참','합격포기'].indexOf(ap.status)>=0;var ivSection='<div id="ea_interview_wrap" style="display:'+(showIv?'block':'none')+'"><div style="background:#FFFBEB;border:1px solid #FEF3C7;border-radius:8px;padding:12px 14px;margin-bottom:14px"><p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.06em">📋 면접 관련 기록</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+fInp('응시번호','ea_exam','text',ap.examNumber||'')+' '+fInp('면접자료 발송일','ea_docsent','date',ap.interviewDocSent||'')+'</div>'+quickMemoButtons('ea_feedback')+'<div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">면접 회신 내용</label><textarea id="ea_feedback" rows="3" placeholder="면접 후 회신 내용..." style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit">'+esc(ap.interviewFeedback||'')+'</textarea></div></div></div>';var stOpts=STATUSES.map(function(s){return'<option value="'+s+'" '+(s===ap.status?'selected':'')+'>'+statusOptionLabel(s)+'</option>';}).join('')+(!STATUSES.includes(ap.status)?'<option value="'+ap.status+'" selected>'+ap.status+'(기존)</option>':'');showModal('지원자 수정 — '+st.name,'<div style="background:#EFF6FF;border-radius:8px;padding:12px 14px;margin-bottom:14px"><p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.06em">개인정보 (학생 DB 동기화)</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+fInp('이름','ea_nm','text',st.name)+' '+fInp('나이','ea_ag','number',st.age)+' '+fInp('연락처','ea_ph','text',st.phone)+' '+fInp('이메일','ea_em','email',st.email)+'</div></div><p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em">공고 정보 — '+esc(job.name.slice(0,22))+'</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px"><div><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">상태</label><select id="ea_st" onchange="toggleInterviewSection(this.value)" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit;margin-bottom:10px">'+stOpts+'</select></div>'+fSel('급수','ea_gr',GRADES,GRADES.includes(ap.grade)?ap.grade:'3급')+' '+fSel('발표방식','ea_an',ANNOUNCE,ap.announceType)+'</div>'+quickMemoButtons('ea_mm')+'<div style="margin-bottom:14px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">메모</label><textarea id="ea_mm" rows="2" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit">'+esc(ap.memo||'')+'</textarea></div>'+ivSection+'<div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'+btn('취소','closeModal()','outline')+' '+btn('💾 저장 (DB 동기화)','saveEditAp('+jobId+','+apId+','+ap.studentId+')','primary')+'</div>','580px');}
async function exportDashboardExcel(){
  var d=window._reportExcelData;
  if(!d){customAlert('보고서를 먼저 열어주세요.');return;}
  try{
    var XLSX=await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
    var wb=XLSX.utils.book_new();

    /* 시트 1: 요약 */
    var summary=[
      ['소리자바 아카데미 취업 실적 보고서'],
      ['기간',d.label],
      ['생성일',TODAY],
      [],
      ['항목','건수'],
      ['신규 공고',d.newJobs.length+'건'],
      ['총 지원자',d.monthApplicants.length+'명'],
      ['최종합격',d.finalPass.length+'명'],
      ['취업 성공률',d.rate+'%'],
    ];
    Object.entries(d.newJobsByCat||{}).forEach(function(e){summary.push(['카테고리 — '+e[0],e[1]+'건']);});
    d.top3.forEach(function(e,i){summary.push(['TOP '+(i+1)+' 기관 — '+e[0],e[1]+'명']);});
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summary),'요약');

    /* 시트 2: 최종합격자 목록 */
    var passList=[['이름','기관명','카테고리','합격발표일','급수','응시번호']];
    d.finalPass.forEach(function(ap){
      var job=JOBS.find(function(j){return j.applicants.some(function(a){return a.id===ap.id;});});
      var st=STUDENTS.find(function(s){return s.id===ap.studentId;});
      passList.push([st?st.name:'?',job?job.name:'?',job?job.category:'?',job?job.finalDate:'',ap.grade,ap.examNumber||'']);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(passList),'최종합격자');

    /* 시트 3: 신규 공고 목록 */
    var jobList=[['공고명','카테고리','서류접수일','최종합격발표일','지원자수']];
    d.newJobs.forEach(function(j){
      jobList.push([j.name,j.category,j.docDate||'',j.finalDate||'',j.applicants.length]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(jobList),'신규공고');

    XLSX.writeFile(wb,'소리자바_취업실적_'+d.label.replace(/\s/g,'_')+'.xlsx');
    showToast('엑셀 파일 다운로드 완료');
  }catch(e){
    customAlert('엑셀 내보내기 오류: '+e.message);
  }
}

function confirmAutoClose(ids,cnt){
  var rows=ids.map(function(id){
    var j=JOBS.find(function(x){return x.id===id;});
    if(!j)return'';
    return'<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #F1F5F9">'+badge(j.category)
      +'<span style="font-size:13px;font-weight:600;color:#0F172A;flex:1">'+esc(j.name)+'</span>'
      +(j.finalDate?'<span style="font-size:11px;color:#64748B">발표일 '+fmt(j.finalDate)+'</span>':'')
    +'</div>';
  }).join('');
  showModal('마감 처리 확인',
    '<p style="margin:0 0 12px;font-size:13px;color:#374151">아래 <strong>'+cnt+'개 공고</strong>를 마감 처리하겠습니까?</p>'
    +'<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:8px 14px;margin-bottom:16px;max-height:260px;overflow-y:auto">'+rows+'</div>'
    +'<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:6px;padding:8px 12px;font-size:12px;color:#92400E;margin-bottom:16px">⚠ 마감 처리 후에도 공고 수정에서 개별 취소 가능합니다.</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px">'+btn('취소','closeModal()','outline')+'<button onclick="closeModal();autoCloseJobs(['+ids.join(',')+'])" style="background:#D97706;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">✓ 마감 처리</button></div>',
    '480px'
  );
}

async function autoCloseJobs(ids){
  if(!isAdmin())return;
  var r=await SB.from('jobs').update({is_closed:true}).in('id',ids);
  if(r&&r.error){customAlert('오류: '+r.error.message);return;}
  await reloadData(['jobs']);
  showToast(ids.length+'개 공고 마감 처리 완료');
}

function toggleBulkAp(jobId,apId,checked){
  if(checked)_bulkApIds.add(apId);else _bulkApIds.delete(apId);
  _bulkApJobId=jobId;
  var cnt=document.getElementById('bulk_cnt_'+jobId);
  if(cnt)cnt.textContent=_bulkApIds.size>0?_bulkApIds.size+'명 선택':'';
  var allCb=document.getElementById('bulk_all_'+jobId);
  if(allCb){var cbs=document.querySelectorAll('[data-job="'+jobId+'"]');allCb.indeterminate=_bulkApIds.size>0&&_bulkApIds.size<cbs.length;allCb.checked=_bulkApIds.size===cbs.length&&cbs.length>0;}
}
function toggleBulkAll(jobId,checked){
  _bulkApJobId=jobId;_bulkApIds.clear();
  var cbs=document.querySelectorAll('[data-job="'+jobId+'"]');
  cbs.forEach(function(cb){cb.checked=checked;if(checked)_bulkApIds.add(Number(cb.getAttribute('data-ap')));});
  var cnt=document.getElementById('bulk_cnt_'+jobId);
  if(cnt)cnt.textContent=_bulkApIds.size>0?_bulkApIds.size+'명 선택':'';
}
async function applyBulkStatus(jobId){
  if(!isAdmin()||!_bulkApIds.size)return customAlert('변경할 지원자를 선택하세요.');
  var st=document.getElementById('bulk_st_'+jobId);
  if(!st)return;
  var newStatus=st.value;
  var ids=Array.from(_bulkApIds);
  var r=await SB.from('applicants').update({status:newStatus}).in('id',ids);
  if(r&&r.error){customAlert('오류: '+r.error.message);return;}
  _bulkApIds.clear();_bulkApJobId=null;
  await reloadData(['applicants']);
  showToast(ids.length+'명 → '+newStatus+' 처리 완료');
}

function toggleInterviewSection(status){var show=['면접대기','예비합격','최종합격','불합격','면접불참','합격포기'].indexOf(status)>=0;var wrap=$('ea_interview_wrap');if(wrap)wrap.style.display=show?'block':'none';}
function toggleAddApInterviewSection(status){var show=['면접대기','예비합격','최종합격','불합격','면접불참','합격포기'].indexOf(status)>=0;var wrap=$('ap_interview_wrap');if(wrap)wrap.style.display=show?'block':'none';}
async function saveEditAp(jobId,apId,studentId){if(!isAdmin())return;var nm=$('ea_nm')&&$('ea_nm').value.trim();if(!nm)return customAlert('이름을 입력하세요');var newDocSent=dateOrNull($('ea_docsent')&&$('ea_docsent').value);var ap=null;for(var ji=0;ji<JOBS.length;ji++){var found=JOBS[ji].applicants.find(function(a){return a.id===apId;});if(found){ap=found;break;}}var results=await Promise.all([SB.from('applicants').update({status:$('ea_st').value,grade:$('ea_gr').value,announce_type:$('ea_an').value,memo:($('ea_mm')&&$('ea_mm').value)||'',exam_number:($('ea_exam')&&$('ea_exam').value)||'',interview_doc_sent:newDocSent,interview_feedback:($('ea_feedback')&&$('ea_feedback').value)||''}).eq('id',apId),SB.from('students').update({name:nm,age:parseInt($('ea_ag')&&$('ea_ag').value)||null,phone:($('ea_ph')&&$('ea_ph').value)||'',email:($('ea_em')&&$('ea_em').value)||''}).eq('id',studentId)]);if(results[0].error||results[1].error){var _ae=results[0].error,_se=results[1].error;customAlert('저장 오류: '+((_ae&&(_ae.message||JSON.stringify(_ae)))||(_se&&(_se.message||JSON.stringify(_se)))||'알 수 없는 오류'));return;}closeModal();await reloadData(['applicants','students']);}
function deleteAp(jobId,apId){if(!isAdmin()){customAlert("⛔ 마스터 계정만 사용 가능한 기능입니다.");return;}customConfirm('이 지원자를 삭제하시겠습니까?',async function(){
  var job=JOBS.find(function(j){return j.id===jobId;});var ap=job&&job.applicants.find(function(a){return a.id===apId;});var st=ap&&STUDENTS.find(function(s){return s.id===ap.studentId;});
  await deleteWithTrash({kind:'지원자',label:(st?st.name:'지원자')+(job?' · '+job.name:''),
    snapshot:[{table:'applicants',column:'id',values:[apId]}],
    run:function(){return SB.from('applicants').delete().eq('id',apId);}});
},'삭제','#DC2626');}
