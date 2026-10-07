'use strict';
/* 신원 확인 현황 */
/* ─ 신원 확인 현황 ─ */
var _idShowOnlyMissing=false;
var _idCat='전체';
var _idSelectedJobId=null;
var _idKw=''; var _idComposing=false;

function renderIdentifyStatus(){
  /* 최종합격 발표일 있는 모든 공고 (추천 포함, 추천은 배지로 구별) */
  var jobs=JOBS.filter(function(j){return j.finalDate;});
  /* 최신 발표일순 */
  jobs=jobs.slice().sort(function(a,b){return(b.finalDate||'').localeCompare(a.finalDate||'');});

  var rowsData=jobs.map(function(j){
    var confirmedAps=j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';});
    var confirmedNums=confirmedAps.map(function(a){return a.examNumber;}).filter(Boolean);
    var announced=j.finalPassAnnouncedCount;
    var confirmedCnt=confirmedAps.length;
    var missing=(announced!=null)?Math.max(0,announced-confirmedCnt):null;
    return{job:j,confirmedCnt:confirmedCnt,confirmedNums:confirmedNums,announced:announced,missing:missing};
  });

  var missingCnt=rowsData.filter(function(r){return r.missing!=null&&r.missing>0;}).length;

  /* 카테고리 탭 (전체 + 데이터에 존재하는 카테고리만, CATS 순서 유지) */
  var catCounts={};
  rowsData.forEach(function(r){catCounts[r.job.category]=(catCounts[r.job.category]||0)+1;});
  var catList=['전체'].concat(CATS.slice(1).filter(function(c){return catCounts[c];}));
  if(_idCat!=='전체'&&!catCounts[_idCat])_idCat='전체';

  var byCat=_idCat==='전체'?rowsData:rowsData.filter(function(r){return r.job.category===_idCat;});
  var kw=(_idKw||'').trim().toLowerCase();
  var byKw=kw===''?byCat:byCat.filter(function(r){return r.job.name.toLowerCase().indexOf(kw)>=0;});
  var shown=_idShowOnlyMissing?byKw.filter(function(r){return r.missing!=null&&r.missing>0;}):byKw;

  var KB_BADGE={
    '소리자바':'background:#EFF6FF;color:#1D4ED8',
    '카스':'background:#FEF3C7;color:#92400E',
    '알려주지 않음':'background:#FEF2F2;color:#DC2626',
    '확인중':''
  };

  var tblRows=shown.length===0
    ?'<tr><td colspan="7" style="padding:40px;text-align:center;color:#CBD5E1;font-size:13px">표시할 공고가 없습니다.</td></tr>'
    :shown.map(function(r){
      var j=r.job;
      var hasMissing=r.missing!=null&&r.missing>0;
      var bg=hasMissing?'#FEF2F2':'#fff';
      var ratioColor=r.announced==null?'#94A3B8':hasMissing?'#DC2626':'#059669';
      var ratioText=r.announced!=null?(r.confirmedCnt+' / '+r.announced):(r.confirmedCnt+' / -');
      var numsText=r.confirmedNums.length>0?r.confirmedNums.map(esc).join(', '):'<span style="color:#CBD5E1">-</span>';
      var kb=j.idKeyboard||'확인중';
      var kbCell=kb!=='확인중'?'<span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;'+KB_BADGE[kb]+'">'+kb+'</span>':'<span style="color:#CBD5E1">-</span>';
      var contactText=(j.idContactName||j.idContactPhone)
        ?esc(j.idContactName)+(j.idContactPhone?' ('+esc(j.idContactPhone)+')':'')
        :'<span style="color:#CBD5E1">-</span>';
      var memoText=j.idMemo?esc(j.idMemo):'<span style="color:#CBD5E1">-</span>';

      var jName=esc(j.name).replace(/'/g,"\\'");
      return'<tr data-jobid="'+j.id+'" style="border-bottom:1px solid #F1F5F9;background:'+(bg)+';cursor:pointer;transition:background .1s" onclick="_idSelectedJobId='+j.id+';updateIdPanel()" '
        +'onmouseover="this.style.background=\'#F8FAFF\'" onmouseout="this.style.background=\''+(hasMissing?'#FEF2F2':'#fff')+'\'">'
        +'<td style="padding:10px;font-weight:700;color:#1F2937;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+badge(j.category)+' '+(j.isRec?'<span style="background:#D1FAE5;color:#065F46;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;border:1px solid #6EE7B7">추천</span> ':'')+( j.isReA?'<span style="background:#FEE2E2;color:#DC2626;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;border:1px solid #FECACA">재공고</span> ':'')+esc(j.name)+'</td>'
        +'<td style="padding:10px;text-align:center;color:#64748B;white-space:nowrap;font-size:12px">'+fmt(j.finalDate)+'</td>'
        +'<td style="padding:10px;text-align:center"><span style="color:'+ratioColor+';font-weight:700">'+ratioText+'</span></td>'
        +'<td style="padding:10px;text-align:center;font-size:12px;color:#374151">'+numsText+'</td>'
        +'<td style="padding:10px;text-align:center">'+kbCell+'</td>'
        +'<td style="padding:10px;font-size:12px;color:#374151;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+contactText+'</td>'
        +'<td style="padding:10px;font-size:12px;color:#64748B;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+memoText+'</td>'
      +'</tr>';
    }).join('');

  return'<div style="display:flex;height:100%;overflow:hidden">'
  +'<div id="_view_scroll" style="padding:20px 16px 24px 24px;flex:1;min-width:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px">'
  +'<div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0;flex-wrap:wrap;gap:8px">'
    +'<div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">신원 확인 현황</h2>'
      +'<p style="margin:3px 0 0;font-size:12px;color:#64748B">최종합격자 발표된 공고 '+rowsData.length+'건 · 미확인 '+missingCnt+'건</p></div>'
    +'<div style="display:flex;gap:8px">'
      +'<button onclick="_idShowOnlyMissing=false;renderView()" style="background:'+(!_idShowOnlyMissing?'#2563EB':'#fff')+';color:'+(!_idShowOnlyMissing?'#fff':'#374151')+';border:1.5px solid '+(!_idShowOnlyMissing?'#2563EB':'#E2E8F0')+';padding:6px 14px;border-radius:99px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">전체 '+rowsData.length+'</button>'
      +'<button onclick="_idShowOnlyMissing=true;renderView()" style="background:'+(_idShowOnlyMissing?'#DC2626':'#fff')+';color:'+(_idShowOnlyMissing?'#fff':'#374151')+';border:1.5px solid '+(_idShowOnlyMissing?'#DC2626':'#E2E8F0')+';padding:6px 14px;border-radius:99px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">미확인만 '+missingCnt+'</button>'
    +'</div>'
  +'</div>'
  +'<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0">'
    +catList.map(function(c){
      var cnt=c==='전체'?rowsData.length:(catCounts[c]||0);
      var a=c===_idCat;
      return'<button onclick="_idCat=\''+c+'\';renderView()" style="white-space:nowrap;padding:6px 14px;border-radius:99px;border:1.5px solid '+(a?'#2563EB':'#E2E8F0')+';background:'+(a?'#2563EB':'#fff')+';color:'+(a?'#fff':'#374151')+';font-size:12px;font-weight:'+(a?700:500)+';cursor:pointer;font-family:inherit">'+c+'</button>';
    }).join('')
  +'</div>'
    +'<div style="position:relative;flex-shrink:0">'
    +'<i class="ti ti-search" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:14px;color:#94A3B8;pointer-events:none"></i>'
    +'<input id="_idKwInput" value="'+esc(_idKw)+'" placeholder="기관명으로 검색…" oncompositionstart="_idComposing=true" oncompositionend="_idComposing=false;_idKw=this.value;updateIdRows()" oninput="if(!_idComposing){_idKw=this.value;updateIdRows()}" style="width:100%;padding:9px 12px 9px 34px;border:1px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:inherit;outline:none;background:#F8FAFC;box-sizing:border-box" autocomplete="off">'
    +(_idKw?'<button onclick="_idKw=\'\';var el=document.getElementById(\'_idKwInput\');if(el)el.value=\'\';updateIdRows()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:#F1F5F9;color:#64748B;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;font-family:inherit">✕</button>':'')
  +'</div>'
  +'<div style="background:#fff;border-radius:10px;border:1px solid #E5E7EB;overflow:auto;flex:1;min-height:0">'
    +'<table id="_id_tbl" style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px">'
      +'<colgroup><col style="width:22%"><col style="width:10%"><col style="width:9%"><col style="width:13%"><col style="width:9%"><col style="width:15%"><col style="width:22%"></colgroup>'
      +'<thead><tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;position:sticky;top:0;z-index:2">'
        +'<th style="padding:10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px">공고명</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px">발표일</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px">발표/확인</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px">확인 응시번호</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px">키보드</th>'
        +'<th style="padding:10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px">담당자 / 연락처</th>'
        +'<th style="padding:10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px">메모</th>'
      +'</tr></thead>'
      +'<tbody>'+tblRows+'</tbody>'
    +'</table>'
  +'</div>'
  +'<div style="font-size:11px;color:#94A3B8;text-align:right;flex-shrink:0">행을 클릭하면 오른쪽에 공고 상세가 표시됩니다</div>'
  +'</div>'
  /* 오른쪽 상세 패널 */
  +'<div id="_id_panel" style="width:420px;min-width:360px;border-left:1px solid #E5E7EB;overflow-y:auto;background:#F8FAFF;flex-shrink:0;display:flex;flex-direction:column">'
    +(_idSelectedJobId?renderIdJobPanel(_idSelectedJobId):'<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#CBD5E1;padding:40px;text-align:center"><i class="ti ti-hand-click" style="font-size:48px"></i><div style="font-size:13px">왼쪽 표에서<br>공고를 클릭하세요</div></div>')
  +'</div>'
  +'</div>';
}

/* ─ 비고에서 최종합격 인원 파싱 ─ */
function renderIdJobPanel(jobId){
  var j=JOBS.find(function(x){return x.id===jobId;});
  if(!j)return'<div style="padding:24px;color:#CBD5E1;font-size:13px">공고를 찾을 수 없습니다.</div>';
  var confirmedAps=j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';});
  var confirmedNums=confirmedAps.map(function(a){return a.examNumber;}).filter(Boolean);
  var announced=j.finalPassAnnouncedCount;
  var confirmedCnt=confirmedAps.length;
  var missing=(announced!=null)?Math.max(0,announced-confirmedCnt):null;

  var apsHtml=j.applicants.length===0
    ?'<div style="color:#CBD5E1;font-size:12px;padding:8px 0">등록된 지원자 없음</div>'
    :'<div style="display:flex;flex-direction:column;gap:4px">'
      +j.applicants.map(function(a){
        var st=STUDENTS.find(function(s){return s.id===a.studentId;});
        var sc={'최종합격':'#059669','취업성공':'#059669','불합격':'#DC2626','면접대기':'#D97706','서류합격':'#2563EB'}[a.status]||'#64748B';
        return'<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:#F8FAFC;border-radius:6px">'
          +'<span style="font-size:12px;font-weight:600;color:#0F172A;flex:1">'+esc(st?st.name:'?')+'</span>'
          +(a.examNumber?'<span style="font-size:10px;color:#94A3B8">'+esc(a.examNumber)+'</span>':'')
          +'<span style="font-size:11px;font-weight:600;color:'+sc+';background:'+sc+'18;padding:1px 7px;border-radius:99px">'+esc(a.status)+'</span>'
        +'</div>';
      }).join('')
    +'</div>';

  var kb=j.idKeyboard||'확인중';
  var isAdm=isAdmin();
  return'<div style="padding:16px;display:flex;flex-direction:column;gap:12px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between">'
      +'<div style="font-size:14px;font-weight:800;color:#0F172A;line-height:1.4">'+esc(j.name)+'</div>'
      +(j.jobUrl?'<a href="'+esc(j.jobUrl)+'" target="_blank" style="font-size:11px;background:#EFF6FF;color:#2563EB;padding:4px 9px;border-radius:5px;text-decoration:none;white-space:nowrap;font-weight:600">🔗 공고</a>':'')
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">'
      +(j.docDate?'<div style="background:#F8FAFC;border-radius:6px;padding:6px 9px"><span style="color:#94A3B8;font-size:10px;display:block;margin-bottom:1px">서류접수</span><strong>'+fmt(j.docDate)+'</strong></div>':'')
      +(j.documentPassDate?'<div style="background:#F8FAFC;border-radius:6px;padding:6px 9px"><span style="color:#94A3B8;font-size:10px;display:block;margin-bottom:1px">서류합격발표</span><strong>'+fmt(j.documentPassDate)+'</strong></div>':'')
      +(j.interviewDate?'<div style="background:#F8FAFC;border-radius:6px;padding:6px 9px"><span style="color:#94A3B8;font-size:10px;display:block;margin-bottom:1px">면접일</span><strong>'+fmt(j.interviewDate)+'</strong></div>':'')
      +(j.finalDate?'<div style="background:#FEF2F2;border-radius:6px;padding:6px 9px"><span style="color:#DC2626;font-size:10px;display:block;margin-bottom:1px">최종합격발표</span><strong style="color:#DC2626">'+fmt(j.finalDate)+'</strong></div>':'')
    +'</div>'
    +(j.note?'<div style="font-size:12px;color:#374151;background:#FFFBEB;border:1px solid #FDE68A;border-radius:7px;padding:8px 10px;line-height:1.6">📝 '+esc(j.note)+'</div>':'')
    +'<div>'
      +'<div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">지원자 현황</div>'
      +apsHtml
    +'</div>'
    +'<div style="border-top:1px dashed #93C5FD;padding-top:12px">'
      +'<div style="font-size:11px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">➕ 최종합격자 신원 확인</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:flex-end">'
        +'<div><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px">발표 인원</div>'
          +'<div style="display:flex;align-items:center;gap:4px">'
            +'<input id="id_announced_'+j.id+'" type="number" min="0" value="'+(announced!=null?announced:'')+'" placeholder="명" style="width:60px;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit">'
            +(parseNoteCount(j.note)!=null&&announced==null?'<button onclick="document.getElementById(\'id_announced_'+j.id+'\').value='+parseNoteCount(j.note)+'" style="font-size:10px;padding:3px 7px;border-radius:4px;border:1px solid #BFDBFE;background:#EFF6FF;color:#2563EB;cursor:pointer;font-family:inherit;white-space:nowrap">비고('+parseNoteCount(j.note)+')</button>':'')
          +'</div>'
        +'</div>'
        +'<div><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px">우리쪽 확인</div>'
          +'<span style="display:inline-block;padding:6px 8px;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:6px;color:#374151;font-size:12px">'+confirmedCnt+'명'+(confirmedNums.length>0?' ('+confirmedNums.join(', ')+')':'')+'</span>'
        +'</div>'
        +(missing!=null?(missing>0
          ?'<span style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:6px 9px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap">⚠ '+missing+'명 미확인</span>'
          :'<span style="background:#F0FDF4;color:#059669;border:1px solid #6EE7B7;padding:6px 9px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap">✓ 전원확인</span>'
        ):'')
      +'</div>'
      +'<div style="display:flex;gap:8px;margin-bottom:8px">'
        +'<div style="flex:1"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px">키보드 기종</div>'
          +'<select id="id_kb_'+j.id+'" style="width:100%;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;background:#fff">'
          +['확인중','소리자바','카스','알려주지 않음'].map(function(k){return'<option value="'+k+'" '+(kb===k?'selected':'')+'>'+k+'</option>';}).join('')
          +'</select>'
        +'</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;margin-bottom:8px">'
        +'<div style="flex:1"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px">담당자명 / 부서</div>'
          +'<input id="id_cname_'+j.id+'" type="text" value="'+esc(j.idContactName)+'" placeholder="예: 총무과 박서연" style="width:100%;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;box-sizing:border-box">'
        +'</div>'
        +'<div style="flex:1"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px">연락처</div>'
          +'<input id="id_cphone_'+j.id+'" type="text" value="'+esc(j.idContactPhone)+'" placeholder="전화번호" style="width:100%;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;box-sizing:border-box">'
        +'</div>'
      +'</div>'
      +'<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px">메모</div>'
        +'<textarea id="id_memo_'+j.id+'" rows="2" placeholder="통화 내용…" style="width:100%;padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit;resize:none;line-height:1.5;box-sizing:border-box">'+esc(j.idMemo)+'</textarea>'
      +'</div>'
      +(isAdm?'<button onclick="saveIdentify('+j.id+')" style="width:100%;background:#2563EB;color:#fff;border:none;padding:8px;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 저장</button>':'')
    +'</div>'
  +'</div>';
}

function updateIdRows(){
  var tbody=document.querySelector('#_id_tbl tbody');
  if(!tbody){renderView();return;}
  var jobs=JOBS.filter(function(j){return j.finalDate;});
  jobs=jobs.slice().sort(function(a,b){return(b.finalDate||'').localeCompare(a.finalDate||'');});
  var rowsData=jobs.map(function(j){
    var confirmedAps=j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';});
    var confirmedNums=confirmedAps.map(function(a){return a.examNumber;}).filter(Boolean);
    var announced=j.finalPassAnnouncedCount;
    var confirmedCnt=confirmedAps.length;
    var missing=(announced!=null)?Math.max(0,announced-confirmedCnt):null;
    return{job:j,confirmedCnt:confirmedCnt,confirmedNums:confirmedNums,announced:announced,missing:missing};
  });
  var byCat=_idCat==='전체'?rowsData:rowsData.filter(function(r){return r.job.category===_idCat;});
  var kw=(_idKw||'').trim().toLowerCase();
  var byKw=kw===''?byCat:byCat.filter(function(r){return r.job.name.toLowerCase().indexOf(kw)>=0;});
  var shown=_idShowOnlyMissing?byKw.filter(function(r){return r.missing!=null&&r.missing>0;}):byKw;
  var KB_BADGE={'소리자바':'background:#EFF6FF;color:#1D4ED8','카스':'background:#FEF3C7;color:#92400E','알려주지 않음':'background:#FEF2F2;color:#DC2626'};
  tbody.innerHTML=shown.length===0
    ?'<tr><td colspan="7" style="padding:40px;text-align:center;color:#CBD5E1;font-size:13px">검색 결과가 없습니다.</td></tr>'
    :shown.map(function(r){
      var j=r.job;var hasMissing=r.missing!=null&&r.missing>0;var bg=hasMissing?'#FEF2F2':'#fff';
      var ratioColor=r.announced==null?'#94A3B8':hasMissing?'#DC2626':'#059669';
      var ratioText=r.announced!=null?(r.confirmedCnt+' / '+r.announced):(r.confirmedCnt+' / -');
      var numsText=r.confirmedNums.length>0?r.confirmedNums.map(esc).join(', '):'<span style="color:#CBD5E1">-</span>';
      var kb=j.idKeyboard||'확인중';var kbStyle=KB_BADGE[kb]||'';
      var kbCell=kb!=='확인중'?'<span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;'+kbStyle+'">'+kb+'</span>':'<span style="color:#CBD5E1">-</span>';
      var contactText=(j.idContactName||j.idContactPhone)?esc(j.idContactName||'')+(j.idContactPhone?' ('+esc(j.idContactPhone)+')':''):'<span style="color:#CBD5E1">-</span>';
      var memoText=j.idMemo?esc(j.idMemo):'<span style="color:#CBD5E1">-</span>';
      return'<tr data-jobid="'+j.id+'" style="border-bottom:1px solid #F1F5F9;background:'+bg+';cursor:pointer;transition:background .1s" onclick="_idSelectedJobId='+j.id+';updateIdPanel()" onmouseover="this.style.background=\'#F8FAFF\'" onmouseout="this.style.background=\''+bg+'\'">'
        +'<td style="padding:10px;font-weight:700;color:#1F2937;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+badge(j.category)+' '+(j.isRec?'<span style="background:#D1FAE5;color:#065F46;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;border:1px solid #6EE7B7">추천</span> ':'')+( j.isReA?'<span style="background:#FEE2E2;color:#DC2626;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;border:1px solid #FECACA">재공고</span> ':'')+esc(j.name)+'</td>'
        +'<td style="padding:10px;text-align:center;color:#64748B;white-space:nowrap;font-size:12px">'+fmt(j.finalDate)+'</td>'
        +'<td style="padding:10px;text-align:center"><span style="color:'+ratioColor+';font-weight:700">'+ratioText+'</span></td>'
        +'<td style="padding:10px;text-align:center;font-size:12px;color:#374151">'+numsText+'</td>'
        +'<td style="padding:10px;text-align:center">'+kbCell+'</td>'
        +'<td style="padding:10px;font-size:12px;color:#374151;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+contactText+'</td>'
        +'<td style="padding:10px;font-size:12px;color:#64748B;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+memoText+'</td>'
      +'</tr>';
    }).join('');
}

function updateIdPanel(){
  var panel=document.getElementById('_id_panel');
  if(!panel){renderView();return;}
  panel.innerHTML=_idSelectedJobId?renderIdJobPanel(_idSelectedJobId):'';
  /* 선택된 행 하이라이트 */
  document.querySelectorAll('#_id_tbl tbody tr').forEach(function(tr){
    tr.style.background=tr.getAttribute('data-jobid')===String(_idSelectedJobId)?'#EFF6FF':'';
  });
}


function parseNoteCount(note){
  if(!note)return null;
  var m=note.match(/최종합격자\s*[:：]\s*(\d+)\s*명/);
  if(m)return parseInt(m[1]);
  m=note.match(/최종합격\s*[:：]\s*(\d+)\s*명/);
  if(m)return parseInt(m[1]);
  m=note.match(/최종\s*(\d+)\s*명/);
  if(m)return parseInt(m[1]);
  return null;
}
