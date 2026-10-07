'use strict';
/* 취업처 관리 */
/* ══════════════════════════════════════════════════════════════
   취업처 관리 (Employer Directory)
══════════════════════════════════════════════════════════════ */
async function loadEmployers(){
  try{var r=await SB.from('employers').select('*').order('name',{ascending:true});EMPLOYERS=(r&&!r.error)?safeArr(r):[];}
  catch(e){EMPLOYERS=[];}
}
function getFilteredEmployers(){
  return EMPLOYERS.filter(function(e){
    if(_empCatF!=='전체'&&e.category!==_empCatF)return false;
    if(_empLocF&&e.location!==_empLocF)return false;
    if(_empKw){var kw=_empKw.toLowerCase();return[(e.name||''),(e.contact_person||''),(e.dept||''),(e.memo||''),(e.stenographer_info||'')].some(function(s){return s.toLowerCase().indexOf(kw)>=0;});}
    return true;
  });
}
function openEmployerModal(empId){
  if(!isAdmin()){customAlert('⛔ 마스터 계정만 사용 가능합니다.');return;}
  var emp=empId?EMPLOYERS.find(function(x){return x.id===empId;}):null;
  var v=emp||{};
  var catOpts=CATS.filter(function(c){return c!=='전체';}).map(function(c){return'<option value="'+c+'"'+(v.category===c?' selected':'')+'>'+c+'</option>';}).join('');
  var locOpts=LOCATIONS.map(function(l){return'<option value="'+l+'"'+(v.location===l?' selected':'')+'>'+l+'</option>';}).join('');
  var body=''
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 14px">'
      +fInp('기관명 *','ef_name','text',v.name||'')
      +'<div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">카테고리</label><select id="ef_cat" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit"><option value="">-- 선택 --</option>'+catOpts+'</select></div>'
      +'<div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">지역</label><select id="ef_loc" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit"><option value="">-- 선택 --</option>'+locOpts+'</select></div>'
      +fInp('채용담당 부서','ef_dept','text',v.dept||'')
      +fInp('채용 담당자','ef_person','text',v.contact_person||'')
      +fInp('담당 연락처','ef_phone','tel',v.contact_phone||'')
      +fInp('이메일 주소','ef_email','email',v.contact_email||'')
      +fInp('등록일','ef_confirmed','date',v.last_confirmed||TODAY)
    +'</div>'
    +'<div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">대표속기사 정보</label>'+(_isCounsel()?'<div style="padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;background:#F1F5F9;filter:blur(4px);user-select:none;pointer-events:none;min-height:36px">'+esc(v.stenographer_info||'-')+'</div>':'<textarea id="ef_steno" rows="2" placeholder="성명, 연락처, 입사일 등" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit">'+esc(v.stenographer_info||'')+'</textarea>')+'</div>'
    +'<div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">특이사항 메모</label><textarea id="ef_memo" rows="3" placeholder="특이사항, 채용 성향, 주의사항 등" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit">'+esc(v.memo||'')+'</textarea></div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'
      +btn('취소','closeModal()','outline')
      +' '+btn(empId?'💾 저장':'✅ 등록','saveEmployer('+(empId||'null')+')','primary')
    +'</div>';
  showModal(empId?'취업처 수정 — '+esc(v.name||''):'새 취업처 등록',body,'640px');
}
async function saveEmployer(empId){
  if(!isAdmin())return;
  var nm=($('ef_name')&&$('ef_name').value.trim())||'';
  if(!nm){customAlert('기관명을 입력하세요.');return;}
  var data={
    name:nm, category:($('ef_cat')&&$('ef_cat').value)||'',
    location:($('ef_loc')&&$('ef_loc').value)||'',
    dept:($('ef_dept')&&$('ef_dept').value.trim())||'',
    contact_person:($('ef_person')&&$('ef_person').value.trim())||'',
    contact_phone:($('ef_phone')&&$('ef_phone').value.trim())||'',
    contact_email:($('ef_email')&&$('ef_email').value.trim())||'',
    stenographer_info:($('ef_steno')&&$('ef_steno').value.trim())||'',
    memo:($('ef_memo')&&$('ef_memo').value.trim())||'',
    last_confirmed:dateOrNull(($('ef_confirmed')&&$('ef_confirmed').value)||'')
  };
  var r=empId?await SB.from('employers').update(data).eq('id',empId):await SB.from('employers').insert(data);
  if(r.error){customAlert('저장 오류: '+(r.error.message||JSON.stringify(r.error)));return;}
  closeModal();await loadEmployers();renderView();
}
function deleteEmployer(empId){
  if(!isAdmin())return;
  var e=EMPLOYERS.find(function(x){return x.id===empId;});
  customConfirm('「'+esc(e?e.name:'이 취업처')+'」를 삭제하시겠습니까?',async function(){
    await deleteWithTrash({kind:'취업처',label:e?e.name:'',
      snapshot:[{table:'employers',column:'id',values:[empId]}],
      run:function(){return SB.from('employers').delete().eq('id',empId);}});
  });
}

function renderEmployerDB(){
  var list=getFilteredEmployers();
  var allIds=list.map(function(e){return e.id;});
  var allChecked=allIds.length>0&&allIds.every(function(id){return _empSelected.has(id);});
  var detailEmp=_empDetailId?EMPLOYERS.find(function(e){return e.id===_empDetailId;}):null;

  /* ── 카테고리 탭 ── */
  var catTabs=['전체'].concat(CATS.filter(function(c){return c!=='전체';})).map(function(c){
    var cnt=c==='전체'?EMPLOYERS.length:EMPLOYERS.filter(function(e){return e.category===c;}).length;
    var on=c===_empCatF;
    return'<button onclick="_empCatF=\''+c+'\';renderView()" style="white-space:nowrap;padding:5px 13px;border-radius:99px;border:1.5px solid '+(on?'#7C3AED':'#E2E8F0')+';background:'+(on?'#7C3AED':'#fff')+';color:'+(on?'#fff':'#374151')+';font-size:12px;font-weight:'+(on?700:500)+';cursor:pointer;font-family:inherit;flex-shrink:0">'+c+(cnt>0?' <span style="font-size:10px;opacity:.75">'+cnt+'</span>':'')+'</button>';
  }).join('');

  var locOpts='<option value="">📍 전체 지역</option>'+LOCATIONS.map(function(l){return'<option value="'+l+'"'+(_empLocF===l?' selected':'')+'>'+l+'</option>';}).join('');

  /* ── 테이블 행 ── */
  var tableRows=list.length===0
    ?'<tr><td colspan="8" style="padding:48px;text-align:center"><div style="display:flex;flex-direction:column;align-items:center;gap:10px"><span style="font-size:36px">🏢</span><span style="font-size:14px;color:#64748B;font-weight:600">'+(EMPLOYERS.length===0?'아직 등록된 취업처가 없습니다':'검색 결과가 없습니다.')+'</span>'+(isAdmin()&&EMPLOYERS.length===0?'<button onclick="openEmployerModal(null)" style="margin-top:6px;background:#7C3AED;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">+ 첫 취업처 등록</button>':'')+'</div></td></tr>'
    :list.map(function(e,idx){
      var isDetail=_empDetailId===e.id;
      var isSel=_empSelected.has(e.id);
      var hasMemo=!!(e.memo&&e.memo.trim());
      var regDate=(e.created_at||e.last_confirmed||'').slice(0,10);var daysAgo=regDate?Math.floor((new Date()-new Date(regDate))/86400000):-1;
      var confText=daysAgo<0?'—'
        :daysAgo===0?'오늘'
        :daysAgo<=30?daysAgo+'일 전'
        :daysAgo+'일 전';
      var confColor=daysAgo<0?'#CBD5E1':daysAgo===0?'#059669':daysAgo<=30?'#D97706':'#DC2626';
      return'<tr onclick="openEmpDetail('+e.id+')"'
        +' style="cursor:pointer;border-bottom:1px solid #F1F5F9;background:'+(isDetail?'#FFF7ED':isSel?'#F5F3FF':'')+(isDetail?';border-left:3px solid #F59E0B':'')+'" onmouseover="this.style.background=\''+(isDetail?'#FFF7ED':isSel?'#F5F3FF':'#F8FAFC')+'\'" onmouseout="this.style.background=\''+(isDetail?'#FFF7ED':isSel?'#F5F3FF':'')+'\'">'
        +'<td onclick="event.stopPropagation()" style="padding:10px 8px;text-align:center;width:36px"><input type="checkbox" '+(isSel?'checked':'')+' onchange="toggleEmpSelect('+e.id+')" style="width:15px;height:15px;cursor:pointer;accent-color:#7C3AED"></td>'
        +'<td style="padding:10px 10px;text-align:center;color:#64748B;font-size:11px;font-weight:700">'+(idx+1)+'</td>'
        +'<td style="padding:10px 10px;white-space:nowrap">'+badge(e.category||'기타')+'</td>'
        +'<td style="padding:10px 10px;font-size:12px;color:#64748B;white-space:nowrap">'+(e.location||'—')+'</td>'
        /* 기관명 + 부서 */
        +'<td style="padding:10px 12px;min-width:160px">'
          +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
            +'<span style="font-size:13px;font-weight:700;color:'+(isDetail?'#D97706':'#0F172A')+'">'+esc(e.name)+'</span>'
            +(e.dept?'<span style="font-size:11px;background:#F1F5F9;color:#475569;padding:2px 8px;border-radius:5px;font-weight:600;border:1px solid #E2E8F0;white-space:nowrap">'+esc(e.dept)+'</span>':'')
            +(hasMemo?'<span style="font-size:10px;background:#FFF7ED;color:#D97706;padding:1px 6px;border-radius:4px;font-weight:700;border:1px solid #FED7AA">메모</span>':'')
            +(e.stenographer_info?'<span style="font-size:10px;background:#F0FDF4;color:#059669;padding:1px 6px;border-radius:4px;font-weight:700;border:1px solid #BBF7D0">속기사</span>':'')
          +'</div>'
        +'</td>'
        +'<td style="padding:10px 10px;font-size:12px;color:#1F2937;white-space:nowrap">'+(e.contact_person?esc(e.contact_person):'<span style="color:#CBD5E1">—</span>')+'</td>'
        +'<td style="padding:10px 10px;font-size:12px;white-space:nowrap">'+(_isCounsel()?'<span style="color:#CBD5E1">—</span>':(e.contact_phone?'<a href="tel:'+esc(e.contact_phone)+'" onclick="event.stopPropagation()" style="color:#2563EB;text-decoration:none;font-weight:600">'+esc(e.contact_phone)+'</a>':'<span style="color:#CBD5E1">—</span>'))+'</td>'
        +'</tr>';
    }).join('');

  /* ── 우측 상세 패널 ── */
  var panelHtml='';
  if(detailEmp){
    var d=detailEmp;
    var regDate2=(d.created_at||d.last_confirmed||'').slice(0,10);var daysAgo2=regDate2?Math.floor((new Date()-new Date(regDate2))/86400000):-1;
    panelHtml=''
      /* 다크 헤더 */
      +'<div style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:16px 18px;flex-shrink:0">'
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">'
          +'<div style="flex:1;min-width:0">'
            +'<div style="font-size:18px;font-weight:900;color:#fff;line-height:1.3;margin-bottom:5px">'+esc(d.name)+'</div>'
            +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
              +(d.category?'<span style="background:rgba(255,255,255,.12);color:#E2E8F0;padding:2px 9px;border-radius:5px;font-size:11px;font-weight:600">'+esc(d.category)+'</span>':'')
              +(d.location?'<span style="background:rgba(255,255,255,.08);color:#64748B;padding:2px 9px;border-radius:5px;font-size:11px">📍 '+esc(d.location)+'</span>':'')
              +(d.dept?'<span style="background:rgba(255,255,255,.08);color:#64748B;padding:2px 9px;border-radius:5px;font-size:11px">'+esc(d.dept)+'</span>':'')
            +'</div>'
          +'</div>'
          +'<button onclick="openEmpDetail('+d.id+')" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.1);border:none;cursor:pointer;color:#64748B;font-size:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center">✕</button>'
        +'</div>'
        +(isAdmin()?'<div style="display:flex;gap:6px">'+btn('✏ 수정','openEmployerModal('+d.id+')','outline',true)+' '+btn('삭제','deleteEmployer('+d.id+')','danger',true)+'</div>':'')
      +'</div>'
      /* 본문 */
      +'<div style="flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px">'
        /* 연락처 정보 */
        +(_isCounsel()?'':
        '<div style="background:#F8FAFC;border-radius:10px;padding:12px 14px;border:1px solid #E5E7EB">'
          +'<div style="font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">연락처</div>'
          +'<div style="display:flex;flex-direction:column;gap:7px">'
            +(d.contact_person?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;color:#64748B;min-width:56px">담당자</span><span style="font-size:13px;font-weight:600;color:#0F172A">'+esc(d.contact_person)+'</span></div>':'')
            +(d.contact_phone?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;color:#64748B;min-width:56px">전화</span><a href="tel:'+esc(d.contact_phone)+'" style="font-size:13px;font-weight:600;color:#2563EB;text-decoration:none">'+esc(d.contact_phone)+'</a></div>':'')
            +(d.contact_email?'<div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;color:#64748B;min-width:56px">이메일</span><a href="mailto:'+esc(d.contact_email)+'" style="font-size:13px;color:#7C3AED;text-decoration:none;overflow:hidden;text-overflow:ellipsis">'+esc(d.contact_email)+'</a></div>':'')
            +(!d.contact_person&&!d.contact_phone&&!d.contact_email?'<div style="font-size:12px;color:#CBD5E1;text-align:center;padding:4px 0">연락처 정보 없음</div>':'')
          +'</div>'
        +'</div>'
        ) /* 연락처 끝 */
        /* 대표속기사 */
        +(d.stenographer_info?'<div style="background:#F0FDF4;border-radius:10px;padding:12px 14px;border:1px solid #BBF7D0">'
          +'<div style="font-size:10px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">대표속기사</div>'
          +(_isCounsel()
            ?'<div style="font-size:13px;color:#0F172A;line-height:1.6;filter:blur(4px);user-select:none;pointer-events:none">'+esc(d.stenographer_info)+'</div>'
            :'<div style="font-size:13px;color:#0F172A;line-height:1.6">'+esc(d.stenographer_info)+'</div>')
        +'</div>':'')
        /* 특이사항 메모 — 강조 표시 */
        +(_isCounsel()?'':(d.memo?'<div style="background:#FFFBEB;border-radius:10px;padding:12px 14px;border:1px solid #FDE68A">'
          +'<div style="font-size:10px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">📋 특이사항 메모</div>'
          +'<div style="font-size:13px;color:#0F172A;line-height:1.7;white-space:pre-wrap">'+esc(d.memo)+'</div>'
        +'</div>'
        :'<div style="background:#F8FAFC;border-radius:10px;padding:12px 14px;border:1px dashed #E2E8F0;text-align:center">'
          +'<div style="font-size:12px;color:#CBD5E1">특이사항 메모 없음</div>'
        +'</div>'))
        /* 최종확인일 */
        +(d.last_confirmed?'<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#F8FAFC;border-radius:8px;border:1px solid #E5E7EB">'
          +'<span style="font-size:11px;color:#64748B">등록일</span>'
          +'<span style="font-size:13px;font-weight:700;color:#374151">'+fmt((d.created_at||d.last_confirmed||'').slice(0,10))+'</span>'
          +(daysAgo2>=0?'<span style="font-size:11px;color:'+(daysAgo2===0?'#059669':daysAgo2<=30?'#D97706':'#DC2626')+'">('+(daysAgo2===0?'오늘':daysAgo2+'일 전')+')</span>':'')
        +'</div>':'')
      +'</div>';
  } else {
    panelHtml=''
      +'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;padding:24px;color:#64748B">'
        +'<div style="width:56px;height:56px;border-radius:16px;background:#F5F3FF;display:flex;align-items:center;justify-content:center;font-size:26px">🏢</div>'
        +'<div style="font-size:15px;font-weight:700;color:#374151">취업처를 선택하세요</div>'
        +'<div style="font-size:13px;text-align:center;line-height:1.8">행을 클릭하면<br>상세 정보와 메모가 표시됩니다</div>'
      +'</div>';
  }

  return'<div style="display:flex;flex-direction:column;height:100%;overflow:hidden">'
    /* ── 헤더 ── */
    +'<div style="flex-shrink:0;padding:16px 20px 12px;background:#fff;border-bottom:1px solid #E5E7EB">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px">'
        +'<div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">취업처 관리</h2>'
          +'<p style="margin:3px 0 0;font-size:12px;color:#64748B">총 '+EMPLOYERS.length+'개 기관 · 검색 '+list.length+'건'
            +(_empSelected.size>0?' · <span style="color:#DC2626;font-weight:700">'+_empSelected.size+'개 선택됨</span>':'')
          +'</p>'
        +'</div>'
        +'<div style="display:flex;gap:7px;flex-wrap:wrap;align-items:center">'
          +(_empSelected.size>0&&isAdmin()?'<button onclick="deleteSelectedEmployers()" style="background:#EF4444;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🗑 선택삭제 '+_empSelected.size+'개</button>':'')
          +(isStaff()?'':btn('📤 가져오기','openEmployerImportModal()','outline'))
          +(isStaff()?'':' '+btn('📥 내보내기','exportEmployers()','success'))
          +(isAdmin()?' '+btn('+ 등록','openEmployerModal(null)','primary'):'')
        +'<div style="display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;flex:1;min-width:0">'+catTabs+'</div>'
        +'<div style="display:flex;gap:6px;flex-shrink:0">'
          +'<input value="'+esc(_empKw)+'" oninput="_empKw=this.value;renderView()" placeholder="🔍 검색..." style="padding:6px 10px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;width:160px;outline:none;font-family:inherit">'
          +'<select onchange="_empLocF=this.value;renderView()" style="padding:6px 9px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+locOpts+'</select>'
          +(_empKw||_empLocF?'<button onclick="_empKw=\'\';_empLocF=\'\';renderView()" style="background:#F1F5F9;color:#64748B;border:none;padding:6px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit">✕</button>':'')
        +'</div>'
      +'</div>'
    +'</div>'
    /* ── 본문: 테이블 + 상세 패널 ── */
    +'<div style="flex:1;min-height:0;display:flex;overflow:hidden">'
      /* 테이블 */
      +'<div id="_emp_tbl" style="flex:1;min-width:0;overflow-y:auto;background:#fff;border-right:1px solid #E5E7EB">'
        +'<table style="width:100%;border-collapse:collapse;font-size:13px;min-width:680px">'
          +'<thead><tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;position:sticky;top:0;z-index:2">'
            +'<th style="padding:9px 8px;text-align:center;background:#F8FAFC;width:36px">'
              +(list.length>0?'<input type="checkbox" '+(allChecked?'checked':'')+' onchange="toggleEmpSelectAll(['+allIds.join(',')+'])" style="width:15px;height:15px;cursor:pointer;accent-color:#7C3AED">':'')
            +'</th>'
            +['No.','카테고리','지역','기관명 / 부서','담당자','연락처'].map(function(h){return'<th style="padding:9px 10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px;white-space:nowrap;letter-spacing:.04em;background:#F8FAFC">'+h+'</th>';}).join('')
          +'</tr></thead>'
          +'<tbody>'+tableRows+'</tbody>'
        +'</table>'
      +'</div>'
      /* 우측 상세 패널 */
      +'<div style="width:360px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;background:#fff;box-shadow:-2px 0 8px rgba(0,0,0,.04)">'
        +panelHtml
      +'</div>'
    +'</div>'
  +'</div>';
}
function toggleEmpSelect(id){var t=document.getElementById('_emp_tbl');var st=t?t.scrollTop:0;if(_empSelected.has(id))_empSelected.delete(id);else _empSelected.add(id);renderView();setTimeout(function(){fixEmpTbl(st);},0);}
function fixEmpTbl(restoreTop){var t=document.getElementById('_emp_tbl');if(!t)return;var top=t.getBoundingClientRect().top;var avail=window.innerHeight-top;if(avail>100){t.style.height=avail+'px';t.style.overflowY='auto';}if(restoreTop!=null)t.scrollTop=restoreTop;}
function openEmpDetail(id){var t=document.getElementById('_emp_tbl');var st=t?t.scrollTop:0;_empDetailId=(_empDetailId===id)?null:id;renderView();setTimeout(function(){fixEmpTbl(st);},0);}
function toggleEmpSelectAll(ids){var allOn=ids.every(function(id){return _empSelected.has(id);});if(allOn){ids.forEach(function(id){_empSelected.delete(id);});}else{ids.forEach(function(id){_empSelected.add(id);});}renderView();}
function deleteSelectedEmployers(){
  if(!isAdmin()||!_empSelected.size)return;
  customConfirm('선택한 '+_empSelected.size+'개 취업처를 삭제하시겠습니까?',async function(){
    var ids=Array.from(_empSelected);
    var first=EMPLOYERS.find(function(x){return x.id===ids[0];});
    await deleteWithTrash({kind:'취업처',label:(first?first.name:'취업처')+(ids.length>1?' 외 '+(ids.length-1)+'곳':''),
      snapshot:[{table:'employers',column:'id',values:ids}],
      run:function(){return SB.from('employers').delete().in('id',ids);},
      after:function(){_empSelected.clear();}});
  });
}
function exportEmployers(){if(isStaff())return;
  if(!EMPLOYERS.length){customAlert('내보낼 데이터가 없습니다.');return;}
  csvExport(EMPLOYERS.map(function(e,i){return{'No':i+1,'카테고리':e.category||'','지역':e.location||'','기관명':e.name||'','채용담당부서':e.dept||'','채용담당자':e.contact_person||'','연락처':e.contact_phone||'','이메일':e.contact_email||'','대표속기사':e.stenographer_info||'','특이사항':e.memo||'','등록일':e.last_confirmed||''};}), '취업처목록_'+TODAY);
}
function openEmployerImportModal(){
  if(!isAdmin()){customAlert('⛔ 마스터 계정만 사용 가능합니다.');return;}
  var templateCols=['카테고리','지역','기관명','채용담당부서','채용담당자','연락처','이메일','대표속기사','특이사항','등록일'];
  var body=''
    +'<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px 16px;margin-bottom:16px">'
      +'<div style="font-size:12px;font-weight:700;color:#1D4ED8;margin-bottom:6px">📋 CSV 형식 안내</div>'
      +'<div style="font-size:11px;color:#1E40AF;line-height:1.8">첫 행은 반드시 컬럼 헤더여야 합니다.<br>'
        +'필수: <strong>기관명</strong> · 나머지는 선택 사항<br>'
        +'최종확인일 형식: YYYY-MM-DD (예: 2026-05-01)</div>'
      +'<button onclick="downloadEmpTemplate()" style="margin-top:8px;background:#2563EB;color:#fff;border:none;padding:6px 14px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">📥 템플릿 다운로드</button>'
    +'</div>'
    +'<div style="margin-bottom:16px">'
      +'<label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">CSV 파일 선택</label>'
      +'<input type="file" id="emp_csv_file" accept=".csv" onchange="previewEmpCsv()" style="width:100%;padding:10px;border:2px dashed #E2E8F0;border-radius:8px;font-size:12px;font-family:inherit;cursor:pointer;background:#F8FAFC">'
    +'</div>'
    +'<div id="emp_csv_preview" style="display:none;margin-bottom:14px">'
      +'<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">미리보기</div>'
      +'<div id="emp_csv_preview_table" style="overflow:auto;max-height:200px;border:1px solid #E5E7EB;border-radius:8px"></div>'
      +'<div id="emp_csv_info" style="margin-top:6px;font-size:12px;color:#059669;font-weight:600"></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'
      +btn('취소','closeModal()','outline')
      +' <button id="_emp_import_btn" onclick="executeEmpImport()" style="display:none;background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;padding:7px 18px;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">📤 가져오기</button>'
    +'</div>';
  showModal('취업처 CSV 가져오기', body, '560px');
}
window._empCsvRows=[];
function downloadEmpTemplate(){if(isStaff())return;
  var header='카테고리,지역,기관명,채용담당부서,채용담당자,연락처,이메일,대표속기사,특이사항,최종확인일\n';
  var sample='법원,서울,○○지방법원,인사과,홍길동,02-1234-5678,hr@court.go.kr,김속기 010-9999-8888,연 1회 채용,2026-05-01\n';
  var blob=new Blob(['\uFEFF'+header+sample],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='취업처_템플릿.csv';a.click();
}
function previewEmpCsv(){
  var file=document.getElementById('emp_csv_file');
  if(!file||!file.files||!file.files[0])return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var text=ev.target.result.replace(/^\uFEFF/,'');
    var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
    if(lines.length<2){customAlert('데이터가 없습니다. (헤더 + 1행 이상 필요)');return;}
    var headers=lines[0].split(',').map(function(h){return h.trim().replace(/^"|"$/g,'');});
    var nameIdx=headers.indexOf('기관명');
    if(nameIdx<0){customAlert('"기관명" 컬럼이 없습니다. 템플릿을 사용해주세요.');return;}
    var COL_MAP={'카테고리':'category','지역':'location','기관명':'name','채용담당부서':'dept','채용담당자':'contact_person','연락처':'contact_phone','이메일':'contact_email','대표속기사':'stenographer_info','특이사항':'memo','등록일':'last_confirmed'};
    _empCsvRows=[];
    for(var i=1;i<lines.length;i++){
      var cols=lines[i].split(',').map(function(c){return c.trim().replace(/^"|"$/g,'');});
      if(!cols[nameIdx])continue;
      var row={};
      headers.forEach(function(h,hi){var key=COL_MAP[h];if(key)row[key]=cols[hi]||'';});
      if(!row.name)continue;
      if(row.last_confirmed&&!/^\d{4}-\d{2}-\d{2}$/.test(row.last_confirmed))row.last_confirmed=null;
      _empCsvRows.push(row);
    }
    var previewHtml='<table style="width:100%;border-collapse:collapse;font-size:11px">'
      +'<thead><tr style="background:#F8FAFC">'+['기관명','카테고리','지역','담당자'].map(function(h){return'<th style="padding:5px 8px;text-align:left;color:#6B7280;font-weight:700;border-bottom:1px solid #E5E7EB">'+h+'</th>';}).join('')+'</tr></thead><tbody>'
      +_empCsvRows.slice(0,5).map(function(r){return'<tr style="border-bottom:1px solid #F1F5F9"><td style="padding:5px 8px;font-weight:600">'+esc(r.name||'-')+'</td><td style="padding:5px 8px;color:#64748B">'+esc(r.category||'-')+'</td><td style="padding:5px 8px;color:#64748B">'+esc(r.location||'-')+'</td><td style="padding:5px 8px;color:#64748B">'+esc(r.contact_person||'-')+'</td></tr>';}).join('')
      +(_empCsvRows.length>5?'<tr><td colspan="4" style="padding:5px 8px;color:#64748B;text-align:center">외 '+(_empCsvRows.length-5)+'행 더...</td></tr>':'')
      +'</tbody></table>';
    var prev=document.getElementById('emp_csv_preview');
    var prevTbl=document.getElementById('emp_csv_preview_table');
    var info=document.getElementById('emp_csv_info');
    var importBtn=document.getElementById('_emp_import_btn');
    if(prev)prev.style.display='block';
    if(prevTbl)prevTbl.innerHTML=previewHtml;
    if(info)info.textContent='✅ '+_empCsvRows.length+'개 행 인식됨 · 기존 데이터 유지하고 추가됩니다';
    if(importBtn)importBtn.style.display='inline-block';
  };
  reader.readAsText(file.files[0],'UTF-8');
}
async function executeEmpImport(){
  if(!isAdmin()||!_empCsvRows.length)return;
  var btn=document.getElementById('_emp_import_btn');
  if(btn){btn.disabled=true;btn.textContent='가져오는 중...';}
  var r=await SB.from('employers').insert(_empCsvRows);
  if(r.error){
    if(btn){btn.disabled=false;btn.textContent='📤 가져오기';}
    customAlert('가져오기 오류: '+r.error.message);return;
  }
  closeModal();await loadEmployers();renderView();
  customAlert('✅ '+_empCsvRows.length+'개 취업처를 가져왔습니다.');
  _empCsvRows=[];
}
