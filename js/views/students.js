'use strict';
/* 속기사 DB / 이력 */
/* ─ 학생 DB ─ */
function renderStudents(){
  var statusTabs=['전체','진행중','취업완료','지원가능'];
  var tabsHtml=statusTabs.map(function(t){var active=studentFilter.statusTab===t;var cnt=t==='전체'?STUDENTS.length:STUDENTS.filter(function(s){return getStudentStatus(s.id).label===t;}).length;return'<button onclick="setStudentStatusTab(\''+t+'\')" style="white-space:nowrap;padding:5px 13px;border-radius:99px;border:1.5px solid '+(active?'#2563EB':'#E2E8F0')+';background:'+(active?'#2563EB':'#fff')+';color:'+(active?'#fff':'#374151')+';font-size:12px;font-weight:'+(active?700:500)+';cursor:pointer;font-family:inherit;flex-shrink:0">'+t+'</button>';}).join('');
  var filtered=filterStudents();
  var rows=filtered.length===0?'<tr><td colspan="8" style="padding:40px;text-align:center;color:#CBD5E1">데이터가 없습니다.</td></tr>':filtered.map(function(s,i){
    var apps=getApps(s.id),pass=apps.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length,ongoing=apps.filter(function(a){return ENDED_STATUSES.indexOf(a.status)<0;}).length;
    var st=getStudentStatus(s.id);var stBadge='<span style="background:'+st.bg+';color:'+st.color+';border:1px solid '+st.border+';padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap">'+st.emoji+' '+st.label+'</span>';
    var resBadge=getRestrictionBadge(s);var isRestricted=s.restrictionLevel==='제한';
    return'<tr class="tbl-tr'+(isRestricted?' row-restricted':'')+'" style="border-bottom:1px solid #F1F5F9"><td style="padding:10px 14px;text-align:center;color:#64748B;font-size:11px;font-weight:700">'+(i+1)+'</td><td style="padding:10px 14px"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><button onclick="openHistoryModal('+s.id+')" style="border:none;background:none;cursor:pointer;color:#2563EB;font-weight:700;text-decoration:underline;font-size:13px;padding:0;font-family:inherit">'+esc(s.name)+'</button>'+resBadge+'</div></td><td style="padding:10px 14px">'+stBadge+'</td><td style="padding:10px 14px;color:#374151">'+(s.age?s.age+'세':'<span style="color:#CBD5E1;font-size:11px">미등록</span>')+'</td><td style="padding:10px 14px;color:#6B7280;font-size:12px">'+esc(s.phone)+'</td><td style="padding:10px 14px;color:#9CA3AF;font-size:12px">'+esc(s.email)+'</td><td style="padding:10px 14px"><span style="font-size:12px;color:#1F2937;font-weight:600">지원 '+apps.length+'건</span>'+(pass>0?'<span style="margin-left:6px;font-size:10px;background:#D1FAE5;color:#065F46;padding:1px 6px;border-radius:99px;font-weight:700;border:1px solid #A7F3D0">합격 '+pass+'</span>':'')+(ongoing>0?'<span style="margin-left:4px;font-size:10px;background:#DBEAFE;color:#1E40AF;padding:1px 6px;border-radius:99px;font-weight:700;border:1px solid #BFDBFE">진행 '+ongoing+'</span>':'')+(s.counselingMemo?'<span style="margin-left:4px;font-size:9px;background:#FFFBEB;color:#92400E;padding:1px 6px;border-radius:99px;font-weight:700;border:1px solid #FEF3C7">📝메모</span>':'')+'</td><td style="padding:10px 14px;display:flex;gap:4px">'+(isFavorite(s.id)?'<button onclick="toggleFavorite(\''+s.id+'\')" style="border:1px solid #FCD34D;background:#FFFBEB;color:#B45309;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:14px">⭐</button> ':'<button onclick="toggleFavorite(\''+s.id+'\')" style="border:1px solid #E2E8F0;background:#F8FAFC;color:#94A3B8;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:14px">☆</button> ')+btn('🗺️ 여정','showStudentJourney('+s.id+')','info',true)+' '+btn('수정','openEditStudentModal('+s.id+')','outline',true)+' '+btn('삭제','deleteStudent('+s.id+')','danger',true)+'</td></tr>';
  }).join('');
  var hasFilter=studentFilter.kw||studentFilter.grade!=='전체';
  return'<div id="_view_scroll" style="padding:20px 24px 24px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;align-items:center;flex-shrink:0"><div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">속기사 DB</h2><p style="margin:3px 0 0;font-size:12px;color:#64748B">총 '+filtered.length+'명 / 전체 '+STUDENTS.length+'명</p></div><div style="display:flex;gap:8px;align-items:center">'+btn('📥 CSV 내보내기','exportStudents()','success')+' '+btn('+ 학생 추가','openAddStudentModal()','primary')+'</div></div><div class="cat-tab-wrap" style="flex-shrink:0">'+tabsHtml+'</div><div style="background:#fff;border-radius:10px;padding:10px 14px;border:1px solid #E5E7EB;display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0"><input id="studentSearchInput" value="'+esc(studentFilter.kw)+'" oncompositionstart="onStuCompositionStart()" oncompositionend="onStuCompositionEnd(this)" oninput="onStuInput(this)" placeholder="🔍 이름 · 연락처 · 기관명 통합 검색..." style="padding:7px 12px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;width:260px;outline:none;font-family:inherit" autocomplete="off"><select id="gradeFilter" onchange="onStudentGradeChange(this.value)" style="padding:7px 10px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+['전체'].concat(GRADES).map(function(g){return'<option value="'+g+'" '+(g===studentFilter.grade?'selected':'')+'>'+(g==='전체'?'전체 급수':g)+'</option>';}).join('')+'</select>'+(hasFilter?'<button onclick="studentFilter={kw:\'\',grade:\'전체\',statusTab:studentFilter.statusTab};renderView()" style="border:none;background:#F1F5F9;color:#64748B;padding:7px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 필터 초기화</button>':'')+'</div><div id="_tbl_scroll" style="background:#fff;border-radius:10px;border:1px solid #E5E7EB;overflow:auto;flex:1;min-height:0"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;position:sticky;top:0;z-index:2">'+['No.','이름 / 등급','상태','나이','연락처','이메일','지원현황','관리'].map(function(h){return'<th style="padding:10px 14px;text-align:left;font-weight:700;color:#1F2937;font-size:11px;letter-spacing:.04em;background:#F8FAFC">'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}

/* ─ 학생 CRUD ─ */
function restrictionRadios(current){var opts=[{v:'',l:'✅ 없음'},{v:'주의',l:'⚠️ 주의'},{v:'제한',l:'🚫 제한'}];return'<div style="display:flex;gap:8px;flex-wrap:wrap">'+opts.map(function(o){return'<label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;padding:5px 12px;border-radius:6px;border:1px solid '+((current||'')===o.v?'#2563EB':'#E5E7EB')+';background:'+((current||'')===o.v?'#EFF6FF':'#fff')+';color:'+((current||'')===o.v?'#1D4ED8':'#374151')+'"><input type="radio" name="stu_restriction" value="'+o.v+'" '+((current||'')===o.v?'checked':'')+' style="accent-color:#2563EB">'+o.l+'</label>';}).join('')+'</div>';}
function openAddStudentModal(){showModal('학생 추가','<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+fInp('이름 *','ns2_nm')+' '+fInp('나이','ns2_ag','number')+' '+fInp('연락처','ns2_ph')+' '+fInp('이메일','ns2_em','email')+'</div><div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">신뢰 등급</label>'+restrictionRadios('')+'</div><div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">★ 상담 메모</label><textarea id="ns2_cm" rows="3" placeholder="상담 내용을 입력하세요..." style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit"></textarea></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">'+btn('취소','closeModal()','outline')+' '+btn('등록','saveNewStudent()','primary')+'</div>','480px');}
async function saveNewStudent(){
  var nm=$('ns2_nm')&&$('ns2_nm').value.trim();if(!nm)return customAlert('이름을 입력하세요');
  var ph=($('ns2_ph')&&$('ns2_ph').value)||'';
  if(ph.trim()){
    var normalized=ph.replace(/\D/g,'');
    var blMatch=normalized.length>=6?STUDENTS.find(function(s){return s.restrictionLevel==='제한'&&(s.phone||'').replace(/\D/g,'')===normalized;}):null;
    if(blMatch){customAlert('⚠️ 이 학생은 과거 미회신 이력이 있는 블랙리스트입니다!\n\n주와 전화번호: '+ph+'\n일치 블랙: '+blMatch.name+'\n\n등록이 차단되었습니다. 블랙리스트 메뉴에서 해제 후 다시 시도하세요.');return;}
  }
  var rl=document.querySelector('input[name="stu_restriction"]:checked');
  var rlVal=rl?rl.value:null;
  var f={name:nm,age:parseInt($('ns2_ag')&&$('ns2_ag').value)||null,phone:ph,email:($('ns2_em')&&$('ns2_em').value)||'',counseling_memo:($('ns2_cm')&&$('ns2_cm').value)||'',restriction_level:rlVal||null};
  var r=await SB.from('students').insert(f);
  if(r.error){var f2={name:f.name,age:f.age,phone:f.phone,email:f.email};var r2=await SB.from('students').insert(f2);if(r2.error){customAlert('저장 오류: '+r2.error.message);return;}}
  closeModal();await reloadData(['students']);
}
function openEditStudentModal(id){var s=STUDENTS.find(function(st){return st.id===id;});if(!s)return;showModal('학생 정보 수정','<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+fInp('이름','es_nm','text',s.name)+' '+fInp('나이','es_ag','number',s.age)+' '+fInp('연락처','es_ph','text',s.phone)+' '+fInp('이메일','es_em','email',s.email)+'</div><div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">신뢰 등급</label>'+restrictionRadios(s.restrictionLevel||'')+'</div><div style="margin-bottom:12px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">★ 상담 메모</label><textarea id="es_cm" rows="4" placeholder="상담 내용을 입력하세요..." style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit">'+esc(s.counselingMemo||'')+'</textarea></div><div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 14px;margin-bottom:12px"><p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#065F46">🏆 취업완료 일괄처리</p><button onclick="markStudentEmployed('+id+')" style="background:#059669;color:#fff;border:none;padding:8px 18px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🏆 취업완료 일괄처리</button></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">'+btn('취소','closeModal()','outline')+' '+btn('저장','saveStudent('+id+')','primary')+'</div>','480px');}
async function saveStudent(id){
  var nm=$('es_nm')&&$('es_nm').value.trim();
  if(!nm)return customAlert('이름을 입력하세요');
  var rl=document.querySelector('input[name="stu_restriction"]:checked');
  var rlVal=rl?rl.value:null;
  var memo=($('es_cm')&&$('es_cm').value)||'';
  var f={name:nm,age:parseInt($('es_ag')&&$('es_ag').value)||null,phone:($('es_ph')&&$('es_ph').value)||'',email:($('es_em')&&$('es_em').value)||'',counseling_memo:memo,restriction_level:rlVal||null};
  var r=await SB.from('students').update(f).eq('id',id);
  if(r.error){
    var f2={name:f.name,age:f.age,phone:f.phone,email:f.email,restriction_level:f.restriction_level};
    await SB.from('students').update(f2).eq('id',id);
    await SB.from('students').update({counseling_memo:memo}).eq('id',id);
  }
  var _si=STUDENTS.findIndex(function(st){return st.id===id;});
  if(_si>=0){STUDENTS[_si].counselingMemo=memo;STUDENTS[_si].name=f.name;STUDENTS[_si].age=f.age;STUDENTS[_si].phone=f.phone;STUDENTS[_si].email=f.email;STUDENTS[_si].restrictionLevel=f.restriction_level||null;}
  closeModal();await reloadData(['students']);
}
async function markStudentEmployed(stuId){var apps=getApps(stuId).filter(function(a){return ENDED_STATUSES.indexOf(a.status)<0;});if(!apps.length){customAlert('변경할 진행중 지원 건이 없습니다.');return;}customConfirm('진행중인 지원 '+apps.length+'건을 모두\n"취업성공" 상태로 변경하시겠습니까?',async function(){for(var i=0;i<apps.length;i++){await SB.from('applicants').update({status:'취업성공'}).eq('id',apps[i].id);}closeModal();await reloadData(['applicants']);customAlert('✅ '+apps.length+'건이 취업성공으로 변경되었습니다.');},'취업성공 처리','#059669');}
function deleteStudent(id){customConfirm('학생을 삭제하면 관련 지원이력도 함께 삭제됩니다.\n계속하시겠습니까?',async function(){
  var st=STUDENTS.find(function(s){return s.id===id;});
  await deleteWithTrash({kind:'학생',label:st?st.name:'',
    snapshot:[{table:'students',column:'id',values:[id]},{table:'applicants',column:'student_id',values:[id]},{table:'favorites',column:'student_id',values:[String(id)]}],
    run:function(){return SB.from('students').delete().eq('id',id);}});
},'삭제','#DC2626');}
/* ─ 이력 팝업 ─ */
var _historyExpandedJobId=null;
function buildJobInlineDetail(jobId){var job=JOBS.find(function(j){return j.id===jobId;});if(!job)return'';var items=[];if(job.type)items.push('<span style="color:#6B7280">채용형태</span> <strong>'+esc(job.type)+'</strong>');if(job.docDate)items.push('<span style="color:#6B7280">서류접수</span> <strong>'+fmt(job.docDate)+'</strong>');if(job.interviewDate)items.push('<span style="color:#6B7280">면접일</span> <strong style="color:#7C3AED">'+fmt(job.interviewDate)+'</strong>');if(job.finalDate)items.push('<span style="color:#6B7280">최종합격발표</span> <strong style="color:#059669">'+fmt(job.finalDate)+'</strong>');if(job.startDate)items.push('<span style="color:#6B7280">근무시작</span> <strong>'+fmt(job.startDate)+'</strong>');var extraHtml='';if(job.jobUrl)extraHtml+='<div style="flex:1;min-width:100%"><span style="color:#6B7280">공고URL</span> <a href="'+esc(job.jobUrl)+'" target="_blank" style="color:#2563EB;font-size:10px;word-break:break-all">'+esc(job.jobUrl.length>40?job.jobUrl.slice(0,40)+'…':job.jobUrl)+'</a></div>';return'<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;margin-top:6px;font-size:11px"><div style="display:flex;flex-wrap:wrap;gap:10px 20px">'+items.map(function(i){return'<div>'+i+'</div>';}).join('')+extraHtml+'</div></div>';}
function showStudentJourney(studentId){
  var s=STUDENTS.find(function(st){return st.id===studentId;});
  if(!s)return;

  var allApps=getApps(studentId);
  var jobMap={};
  allApps.forEach(function(ap){
    if(!jobMap[ap.jobId]||ap.id>jobMap[ap.jobId].id)jobMap[ap.jobId]=ap;
  });
  var entries=Object.values(jobMap).sort(function(a,b){
    return (b.docDate||'').localeCompare(a.docDate||'');
  });

  var totalPass=entries.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length;
  var totalIv=entries.filter(function(a){return ['면접대기','예비합격','최종합격','취업성공','불합격','합격포기'].indexOf(a.status)>=0;}).length;
  var totalOngoing=entries.filter(function(a){return ENDED_STATUSES.indexOf(a.status)<0;}).length;

  var STAGES=[
    {key:'서류접수',label:'서류접수',c:'#3B82F6',bg:'#EFF6FF'},
    {key:'서류합격',label:'서류합격',c:'#7C3AED',bg:'#F5F3FF'},
    {key:'면접대기',label:'면접',c:'#F59E0B',bg:'#FFFBEB'},
    {key:'최종합격',label:'최종합격',c:'#059669',bg:'#F0FDF4'},
  ];
  var STAGE_RANK={'서류접수':0,'서류합격':1,'면접대기':2,'예비합격':2,'최종합격':3,'취업성공':3,'합격포기':3,'면접불참':1,'불합격':99};

  function buildStages(ap){
    var cur=STAGE_RANK[ap.status]!==undefined?STAGE_RANK[ap.status]:-1;
    var isFail=ap.status==='불합격';
    return'<div style="display:flex;align-items:center;margin:12px 0 8px;">'
      +STAGES.map(function(st,idx){
        var done=cur>=idx;
        var isCur=cur===idx;
        var stC=done?st.c:'#CBD5E1';
        var icon=isFail&&isCur?'✕':(done?'✓':'');
        return'<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">'
          +'<div style="width:34px;height:34px;border-radius:50%;background:'+(done?stC:'#F1F5F9')+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;border:2.5px solid '+stC+(isCur?';box-shadow:0 0 0 4px '+stC+'35':'')+'">'+icon+'</div>'
          +'<div style="font-size:11px;font-weight:700;color:'+stC+';text-align:center;line-height:1.3;white-space:nowrap">'+st.label+'</div>'
        +'</div>'
        +(idx<STAGES.length-1
          ?'<div style="flex:1;height:3px;background:'+(cur>idx?stC:'#E5E7EB')+';margin-bottom:20px;border-radius:99px"></div>'
          :'');
      }).join('')
    +'</div>';
  }

  var cards=entries.length===0
    ?'<div style="text-align:center;padding:40px 0;color:#CBD5E1"><div style="font-size:40px;margin-bottom:10px">📭</div><div style="font-size:15px;font-weight:600">지원 이력이 없습니다</div></div>'
    :entries.map(function(ap){
      var isFinal=ap.status==='최종합격'||ap.status==='취업성공';
      var isFail=ap.status==='불합격';
      var borderC=isFinal?'#059669':isFail?'#EF4444':'#E2E8F0';
      var topBg=isFinal?'linear-gradient(135deg,#064E3B,#059669)':isFail?'linear-gradient(135deg,#7F1D1D,#DC2626)':'linear-gradient(135deg,#F8FAFC,#F1F5F9)';
      var topTxt=isFinal||isFail?'#fff':'#374151';
      var j=JOBS.find(function(jb){return jb.id===ap.jobId;});

      /* 날짜 행 */
      var dateRow='';
      if(j){
        var dateParts=[];
        if(j.docDate)dateParts.push('<span style="display:inline-flex;align-items:center;gap:4px;background:#EFF6FF;color:#1D4ED8;padding:4px 10px;border-radius:7px;font-size:12px;font-weight:700">📥 서류접수 '+fmt(j.docDate)+'</span>');
        if(j.interviewDate)dateParts.push('<span style="display:inline-flex;align-items:center;gap:4px;background:#FFFBEB;color:#D97706;padding:4px 10px;border-radius:7px;font-size:12px;font-weight:700">🎤 면접일 '+fmt(j.interviewDate)+'</span>');
        if(j.finalDate)dateParts.push('<span style="display:inline-flex;align-items:center;gap:4px;background:#F0FDF4;color:#059669;padding:4px 10px;border-radius:7px;font-size:12px;font-weight:700">🏁 발표일 '+fmt(j.finalDate)+'</span>');
        if(dateParts.length>0)dateRow='<div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 16px 12px;border-top:1px solid #F1F5F9">'+dateParts.join('')+'</div>';
      }

      return'<div style="border:2px solid '+borderC+';border-radius:16px;overflow:hidden;margin-bottom:14px;box-shadow:'+(isFinal?'0 4px 18px rgba(5,150,105,.2)':isFail?'0 2px 10px rgba(239,68,68,.12)':'0 1px 6px rgba(0,0,0,.06)')+';">'
        /* 헤더 */
        +'<div style="padding:13px 16px;background:'+topBg+';display:flex;align-items:flex-start;justify-content:space-between;gap:10px">'
          +'<div style="flex:1;min-width:0">'
            +'<div style="font-size:15px;font-weight:800;color:'+topTxt+';line-height:1.4;margin-bottom:6px">'+esc(ap.jobName)+'</div>'
            +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
              /* 카테고리 배지 */
              +(ap.category?'<span style="background:rgba(255,255,255,'+(isFinal||isFail?'.2':'.8')+'11);backdrop-filter:blur(4px);border:1.5px solid rgba(255,255,255,'+(isFinal||isFail?'.3':'.5')+');color:'+topTxt+';padding:3px 10px;border-radius:7px;font-size:12px;font-weight:700">'+esc(ap.category)+'</span>':'')
              /* 현재 상태 배지 */
              +'<span style="background:rgba(255,255,255,.15);color:'+topTxt+';padding:3px 10px;border-radius:7px;font-size:12px;font-weight:700;border:1.5px solid rgba(255,255,255,.3)">'+esc(ap.status)+'</span>'
            +'</div>'
          +'</div>'
          +'<span style="font-size:26px;flex-shrink:0">'+(isFinal?'🏆':isFail?'😔':ap.status==='면접대기'?'🎤':'📋')+'</span>'
        +'</div>'
        /* 스테이지 */
        +'<div style="padding:4px 16px 0">'
          +buildStages(ap)
          +(ap.memo&&!isStaff()?'<div style="margin-bottom:10px;padding:8px 12px;background:#F8FAFC;border-radius:8px;border-left:3px solid #93C5FD;font-size:13px;color:#1F2937;line-height:1.6">'+esc(ap.memo)+'</div>':'')
          +(ap.interviewFeedback?'<div style="margin-bottom:10px;padding:8px 12px;background:#FFFBEB;border-radius:8px;border-left:3px solid #FBBF24;font-size:13px;color:#1F2937;line-height:1.6">💬 '+esc(ap.interviewFeedback)+'</div>':'')
        +'</div>'
        /* 날짜 정보 */
        +dateRow
      +'</div>';
    }).join('');

  var passRate=entries.length>0?Math.round(totalPass/entries.length*100):0;

  var body=''
    /* 상단 배너 */
    +'<div style="background:linear-gradient(135deg,#0F172A,#1E3A5F);border-radius:16px;padding:20px 22px;margin-bottom:16px;position:relative;overflow:hidden">'
      +'<div style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:72px;opacity:.07;pointer-events:none">🌱</div>'
      +'<div style="font-size:10px;font-weight:700;color:#7DD3FC;letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px">JOURNEY OVERVIEW</div>'
      +'<div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:14px">'+esc(s.name)+'님의 취업 여정</div>'
      +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
        +[['총 지원',entries.length,'건','#60A5FA'],['면접 진행',totalIv,'건','#FBBF24'],['최종 합격',totalPass,'건','#34D399'],['진행 중',totalOngoing,'건','#A78BFA']].map(function(x){
          return'<div style="background:rgba(255,255,255,.09);border-radius:10px;padding:9px 14px;text-align:center;min-width:74px">'
            +'<div style="font-size:24px;font-weight:900;color:'+x[3]+';line-height:1">'+x[1]+'<span style="font-size:12px;margin-left:2px">'+x[2]+'</span></div>'
            +'<div style="font-size:10px;color:#64748B;margin-top:3px">'+x[0]+'</div>'
          +'</div>';
        }).join('')
      +'</div>'
    +'</div>'
    /* 성공률 바 */
    +'<div style="margin-bottom:16px;padding:12px 14px;background:#F8FAFC;border-radius:12px;border:1px solid #E5E7EB">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">'
        +'<span style="font-size:13px;font-weight:700;color:#374151">취업 성공률</span>'
        +'<span style="font-size:16px;font-weight:900;color:#059669">'+passRate+'%</span>'
      +'</div>'
      +'<div style="height:9px;background:#E5E7EB;border-radius:99px;overflow:hidden">'
        +'<div style="height:100%;width:'+passRate+'%;background:linear-gradient(90deg,#34D399,#059669);border-radius:99px"></div>'
      +'</div>'
      +'<div style="margin-top:6px;font-size:12px;color:#64748B">'+entries.length+'건 지원 중 '+totalPass+'건 합격</div>'
    +'</div>'
    /* 공고별 카드 */
    +'<div style="font-size:12px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">📋 공고별 진행 현황 · '+entries.length+'건</div>'
    +cards
    +'<div style="display:flex;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:1px solid #F3F4F6;gap:8px">'
      +btn('📋 이력 상세보기','closeModal();openHistoryModal('+studentId+')','outline')
      +' '+btn('✏ 학생 수정','closeModal();openEditStudentModal('+studentId+')','outline')
    +'</div>';

  showModal('🌱 '+s.name+' · 취업 여정 타임라인', body, '700px');
}


function openHistoryModal(studentId){var s=STUDENTS.find(function(st){return st.id===studentId;});if(!s)return;_historyExpandedJobId=null;_renderHistoryModal(studentId,s);}
function _renderHistoryModal(studentId,s){var apps=getApps(studentId),sorted=apps.slice().sort(function(a,b){return (b.docDate||'').localeCompare(a.docDate||'');});var pass=apps.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length;var ongoing=apps.filter(function(a){return ENDED_STATUSES.indexOf(a.status)<0;}).length;var tlRows=sorted.length===0?'<div style="text-align:center;padding:30px;color:#CBD5E1;font-size:13px">지원 이력 없음</div>':sorted.map(function(ap,i){var sc=STATUS_COLORS[ap.status]||'#6B7280',isLast=i===sorted.length-1,isExpanded=_historyExpandedJobId===ap.jobId;return'<div style="position:relative;padding-left:28px;padding-bottom:'+(isLast?'0':'16px')+'">'+(isLast?'':'<div style="position:absolute;left:7px;top:18px;bottom:0;width:2px;background:#E5E7EB"></div>')+'<div style="position:absolute;left:0;top:4px;width:16px;height:16px;border-radius:50%;background:'+sc+';border:3px solid #fff;box-shadow:0 0 0 2px '+sc+'44"></div><div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:10px 14px"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:5px">'+(ap.docDate?'<span style="font-size:10px;color:#64748B;font-weight:600">'+fmt(ap.docDate)+'</span>':'')+badge(ap.category)+'<span style="background:'+sc+'22;color:'+sc+';padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700;border:1px solid '+sc+'44">'+esc(ap.status)+'</span>'+(ap.grade?'<span style="font-size:10px;color:#64748B">'+esc(ap.grade)+'</span>':'')+((ap.status==='최종합격'||ap.status==='취업성공')?'<span style="font-size:11px">🎉</span>':'')+'</div><div style="display:flex;align-items:center;gap:6px"><button onclick="_historyExpandedJobId='+(isExpanded?'null':ap.jobId)+';_reRenderHistory('+studentId+')" style="border:none;background:none;cursor:pointer;color:#2563EB;font-weight:700;font-size:13px;text-decoration:underline;padding:0;font-family:inherit;text-align:left">'+esc(ap.jobName)+'</button><span style="font-size:10px;color:#64748B">'+(isExpanded?'▲ 닫기':'▼ 공고 상세')+'</span></div>'+(isExpanded?buildJobInlineDetail(ap.jobId):'')+( ap.memo?'<p style="margin:6px 0 0;font-size:11px;color:#6B7280">'+esc(ap.memo)+'</p>':'')+( ap.interviewDocSent?'<p style="margin:4px 0 0;font-size:10px;color:#64748B">자료발송: '+fmt(ap.interviewDocSent)+'</p>':'')+( ap.interviewFeedback?'<p style="margin:3px 0 0;font-size:11px;color:#475569">'+esc(ap.interviewFeedback)+'</p>':'')+'</div></div>';}).join('');var memoSection=s.counselingMemo?'<div style="background:#FFFBEB;border:1px solid #FEF3C7;border-radius:8px;padding:12px 14px;margin-bottom:14px"><p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.06em">📝 상담 메모</p><p style="margin:0;font-size:13px;color:#1F2937;line-height:1.7;white-space:pre-wrap">'+esc(s.counselingMemo)+'</p></div>':'';var resBadge=getRestrictionBadge(s),stObj=getStudentStatus(s.id);showModal(s.name+' — 지원이력 & 타임라인',memoSection+'<div style="display:flex;gap:10px;margin-bottom:16px;padding:10px 14px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;flex-wrap:wrap;align-items:center"><span style="background:'+stObj.bg+';color:'+stObj.color+';border:1px solid '+stObj.border+';padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">'+stObj.emoji+' '+stObj.label+'</span>'+(resBadge?'<span style="color:#D1D5DB">|</span>'+resBadge:'')+'<span style="color:#D1D5DB">|</span><span style="font-size:13px;color:#374151"><strong>'+apps.length+'</strong>건 지원</span><span style="color:#D1D5DB">|</span><span style="font-size:13px;color:#059669"><strong>'+pass+'</strong>건 합격</span><span style="color:#D1D5DB">|</span><span style="font-size:13px;color:#2563EB"><strong>'+ongoing+'</strong>건 진행 중</span></div><p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em">📅 지원 타임라인 · 기관명 클릭 시 공고 상세 토글</p><div style="padding-left:4px">'+tlRows+'</div><div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid #F3F4F6;gap:8px;flex-wrap:wrap">'+btn('📥 CSV 내보내기','exportHistory('+studentId+')','success')+' '+btn('✏ 학생 수정','closeModal();openEditStudentModal('+studentId+')','outline')+'</div>'+getTrHistoryHtml(s.phone||''),'660px');}
window._reRenderHistory=function(studentId){var s=STUDENTS.find(function(st){return st.id===studentId;});if(!s)return;_renderHistoryModal(studentId,s);};
/* ─ CSV ─ */
function exportJobs(){if(isStaff())return;csvExport(getSorted(getFiltered()).map(function(j,i){return{'No':i+1,'카테고리':j.category,'채용형태':j.type,'공고명':j.name,'서류접수일':j.docDate||'','서류마감일':j.applyDeadline||'','서류합격발표일':j.documentPassDate||'','면접일':j.interviewDate||'','최종합격발표일':j.finalDate||'','공고URL':j.jobUrl||'','지원자수':j.applicants.length,'상태':j.isClosed?'마감':'진행'}; }),'공고목록_v75');}
function exportStudents(){var filtered=filterStudents();csvExport(filtered.map(function(s,i){var apps=getApps(s.id),st=getStudentStatus(s.id);return{'No':i+1,'이름':s.name,'상태':st.label,'등급제한':s.restrictionLevel||'없음','나이':s.age||'미등록','연락처':s.phone,'이메일':s.email,'지원횟수':apps.length,'최종합격':apps.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length,'상담메모':s.counselingMemo||''};}),'학생DB_v75');}
function exportHistory(studentId){var s=STUDENTS.find(function(st){return st.id===studentId;});if(!s)return;csvExport(getApps(studentId).map(function(a){return{'기관명':a.jobName,'카테고리':a.category,'서류접수일':a.docDate||'','최종합격발표일':a.finalDate||'','상태':a.status,'급수':a.grade,'발표방식':a.announceType,'메모':a.memo||''};}),s.name+'_지원이력');}
