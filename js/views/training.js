'use strict';
/* 연수 관리 */
/* ─ 사이드바 ─ */


/* ════════════════════════════════════════════════════════════
   연수 관리 모듈 v4.0  —  JobMS 소리자바 아카데미
   DB 컬럼 매핑:
     training_courses      → id, course_name, type, created_at
     training_participants → id, course_id(integer), student_name,
                             phone_number, license_info, status,
                             first_test_score(TEXT = 특이사항),
                             first_test_result(= 테스트통과유무), created_at
════════════════════════════════════════════════════════════ */

/* ─ 연수 진행 상태 배지 (텍스트 중심) ─ */
function trStatusBadge(status){
  var map={
    '수료'   :{bg:'#D1FAE5',color:'#065F46',border:'#A7F3D0',label:'수료 완료'},
    '진행 중':{bg:'#DBEAFE',color:'#1E40AF',border:'#BFDBFE',label:'진행중'},
    '중도포기':{bg:'#F3F4F6',color:'#6B7280',border:'#E5E7EB',label:'중도 포기'}
  };
  var s=map[status]||{bg:'#F3F4F6',color:'#6B7280',border:'#E5E7EB',label:status||'-'};
  return'<span style="background:'+s.bg+';color:'+s.color+';border:1px solid '+s.border+
    ';padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;display:inline-block">'+
    esc(s.label)+'</span>';
}

/* ─ 테스트 통과 유무 배지 (텍스트 중심) ─ */
/* ─ 테스트 통과 유무 배지: 아이콘 없이 텍스트 위주 ─ */
function trSuryoBadge(val){
  if(!val||val.trim()==='')return'<span style="color:#CBD5E1;font-size:11px">미입력</span>';
  var isPass=(val==='합격');
  return isPass
    ?'<div style="display:inline-flex;flex-direction:column;gap:2px">'+
      '<span style="background:#D1FAE5;color:#065F46;border:1px solid #A7F3D0;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:800">합격</span>'+
      '<span style="font-size:9px;color:#059669;font-weight:600;text-align:center">2차 심화 가능</span></div>'
    :'<div style="display:inline-flex;flex-direction:column;gap:2px">'+
      '<span style="background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:800">불합격</span>'+
      '<span style="font-size:9px;color:#DC2626;font-weight:600;text-align:center">1차 재시험</span></div>';
}

/* ─ 상태+결과 조합 경고 메시지 생성 ─ */
function trComboWarning(status,result){
  /* "수료 완료 + 테스트 불합격" → 재시험 필요 안내 */
  if(status==='수료'&&result==='불합격'){
    return'<div style="background:linear-gradient(135deg,#FFF7ED,#FEF3C7);border:1.5px solid #F59E0B;border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:flex-start;gap:10px">'+
      '<span style="font-size:20px;flex-shrink:0;margin-top:1px">⚠️</span>'+
      '<div><p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#92400E">연수 이수 — 테스트 재시험 필요</p>'+
      '<p style="margin:0;font-size:11px;color:#78350F;line-height:1.6">연수는 이수하였으나, 테스트 결과에 따라 1차 재시험이 필요합니다.<br>담당자에게 확인 후 일정을 조율해 주세요.</p></div></div>';
  }
  /* "진행 중 + 테스트 합격" → 수료 처리 권장 */
  if(status==='진행 중'&&result==='합격'){
    return'<div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px">'+
      '<span style="font-size:18px;flex-shrink:0">🎯</span>'+
      '<p style="margin:0;font-size:11px;color:#166534">테스트 합격이 확인되었습니다. 연수 수료 처리를 진행해 주세요.</p></div>';
  }
  return'';
}

/* ─ 특이사항 팝업 모달 ─
   테이블의 특이사항 칸을 클릭하면 전체 내용이 팝업으로 표시되고
   textarea에서 직접 수정 후 저장할 수 있습니다.
─ */
function openTrNoteModal(participantId){
  var p=TR_PARTICIPANTS.find(function(x){return x.id===participantId;});
  if(!p)return;
  var c=TR_COURSES.find(function(x){return x.id===p.course_id;});
  var cName=c?c.course_name:'(기수 미상)';
  var typeIcon=c&&c.type==='meeting'?'📝':'🎥';
  /* 수강생 정보 헤더 + 편집 가능한 textarea */
  var body=
    '<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
    '<span style="font-size:16px;font-weight:900;color:#0F172A">'+esc(p.student_name)+'</span>'+
    '<span style="font-size:11px;color:#6B7280">'+esc(p.phone_number||'')+'</span>'+
    (p.license_info?'<span style="background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;border:1px solid #BFDBFE">'+esc(p.license_info)+'</span>':'')+
    '<span style="font-size:11px;color:#64748B;margin-left:auto">'+typeIcon+' '+esc(cName)+'</span>'+
    '</div>'+
    '<p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:.06em">📝 특이사항 / 데일리 피드백</p>'+
    '<p style="margin:0 0 8px;font-size:11px;color:#B45309">Enter 키로 날짜별 내용을 구분해 입력하면 줄바꿈이 그대로 저장됩니다.</p>'+
    /* 줄바꿈 완벽 적용된 편집 textarea */
    '<textarea id="tn_content" rows="12" '+
    'placeholder="예)&#10;4/1 수업 태도 매우 성실&#10;4/2 과제 미제출&#10;4/3 출석 확인" '+
    'style="width:100%;padding:12px 14px;border:1.5px solid #FDE68A;border-radius:8px;'+
    'font-size:13px;line-height:1.8;resize:vertical;font-family:inherit;'+
    'background:#FFFBEB;color:#1E293B;outline:none;white-space:pre-wrap">'+esc(p.first_test_score||'')+'</textarea>'+
    '<div style="display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px solid #F3F4F6;margin-top:14px">'+
    btn('취소','closeModal()','outline')+' '+
    btn('💾 저장','saveTrNote('+participantId+')','primary')+
    '</div>';
  showModal('📝 특이사항 / 데일리 피드백 — '+esc(p.student_name),body,'560px');
}

/* 특이사항 저장 (Supabase 즉시 반영) */
async function saveTrNote(participantId){
  var el=document.getElementById('tn_content');
  if(!el)return;
  var val=el.value;
  var r=await SB.from('training_participants').update({first_test_score:val||null}).eq('id',participantId);
  if(r.error){customAlert('저장 오류: '+(r.error.message||JSON.stringify(r.error)));return;}
  closeModal();await reloadData(['training_participants']);
}

/* ─ CSV 양식 다운로드 ─ */
function downloadTrTemplate(){if(isStaff())return;
  var csv='\uFEFF이름,휴대전화,자격증,상태,특이사항,테스트통과유무\n'
         +'홍길동,010-0000-0000,3급,진행 중,수업 태도 성실,합격\n';
  /* 상태 허용값: 수료 / 진행 중 / 중도포기   테스트통과유무 허용값: 합격 / 불합격 */
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='연수_등록양식.csv';a.click();
  URL.revokeObjectURL(url);
}

/* ─ 기수 추가 모달 ─ */
function openTrCourseModal(){
  if(isStaff2())return;
  showModal('📋 기수 추가',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+
    fInp('기수 명칭 *','trc_name','text','','placeholder="예: 2026년 4월 1기"')+
    fSel('과정 유형','trc_type',['VOD 연수','회의록 연수'],'VOD 연수')+'</div>'+
    '<div style="background:#EFF6FF;border-radius:8px;padding:10px 14px;margin-bottom:12px;border:1px solid #BFDBFE">'+
    '<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#1D4ED8">📌 등록 순서</p>'+
    '<p style="margin:0;font-size:11px;color:#1F2937;line-height:1.8">① 기수 명칭 입력 → ② CSV 양식 다운로드 → ③ 양식 작성 후 업로드 → ④ 등록 완료</p></div>'+
    '<div style="background:#F8FAFC;border-radius:8px;padding:10px 14px;margin-bottom:12px;border:1px solid #E5E7EB">'+
    '<p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase">CSV 컬럼 순서</p>'+
    '<code style="font-size:11px;color:#1F2937;background:#F1F5F9;padding:4px 8px;border-radius:4px;display:block">이름, 휴대전화, 자격증, 상태, 특이사항, 테스트통과유무</code>'+
    '<p style="margin:5px 0 0;font-size:10px;color:#64748B">상태: <strong>수료</strong> / <strong>진행 중</strong> / <strong>중도포기</strong>&nbsp;&nbsp;테스트통과유무: <strong>합격</strong> / <strong>불합격</strong></p></div>'+
    '<div style="margin-bottom:12px">'+
    '<label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">CSV 파일 업로드 <span style="font-weight:400;color:#64748B">(선택)</span></label>'+
    '<input type="file" id="trc_file" accept=".csv" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit">'+
    '</div>'+
    '<div id="trc_preview" style="margin-bottom:8px"></div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #F3F4F6;gap:8px;flex-wrap:wrap">'+
    '<button onclick="downloadTrTemplate()" style="background:#F1F5F9;color:#1F2937;border:1px solid #E2E8F0;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📥 CSV 양식 다운로드</button>'+
    '<div style="display:flex;gap:8px">'+btn('취소','closeModal()','outline')+' '+btn('✅ 기수 등록','saveTrCourse()','primary')+'</div>'+
    '</div>','580px');
  setTimeout(function(){
    var fi=document.getElementById('trc_file');
    if(fi)fi.onchange=function(){_previewTrCsv(this.files[0],'trc_preview');};
  },80);
}

/* ─ 기수 저장 ─ */
async function saveTrCourse(){
  if(isStaff2())return;
  var name=document.getElementById('trc_name')&&document.getElementById('trc_name').value.trim();
  if(!name)return customAlert('기수 명칭을 입력하세요');
  var typeEl=document.getElementById('trc_type');
  var typeVal=typeEl&&typeEl.value==='회의록 연수'?'meeting':'vod';
  var rc=await SB.from('training_courses').insert({course_name:name,type:typeVal}).select().single();
  if(rc.error){customAlert('기수 등록 오류: '+(rc.error.message||JSON.stringify(rc.error)));return;}
  var courseId=rc.data.id;
  if(window._trImportRows&&window._trImportRows.length){
    var result=await _bulkUpsertParticipants(courseId,window._trImportRows);
    window._trImportRows=null;
    closeModal();await reloadData(['training_courses']);
    trCourseId=courseId;renderView();
    customAlert('✅ 기수 등록 완료!\n수강생 '+result.ok+'명 등록'+(result.fail>0?'\n⚠️ 실패 '+result.fail+'명':''));
  }else{
    closeModal();await reloadData(['training_courses']);
    trCourseId=courseId;renderView();
  }
}

/* ─ CSV 미리보기 ─ */
function _previewTrCsv(file,previewId){
  if(!file)return;
  var prev=document.getElementById(previewId);if(!prev)return;
  Papa.parse(file,{
    header:true,skipEmptyLines:true,
    complete:function(res){
      var rows=res.data.filter(function(r){return r['이름']&&r['이름'].trim();});
      if(!rows.length){
        prev.innerHTML='<div style="background:#FEF2F2;border-radius:6px;padding:8px 12px;border:1px solid #FECACA"><span style="font-size:12px;color:#DC2626">❌ 유효한 데이터가 없습니다.</span></div>';
        window._trImportRows=null;return;
      }
      window._trImportRows=rows;
      prev.innerHTML='<div style="background:#F0FDF4;border-radius:6px;padding:8px 12px;border:1px solid #BBF7D0;display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:16px">✅</span>'+
        '<span style="font-size:12px;font-weight:700;color:#065F46">'+rows.length+'명 인식 완료 — 등록 버튼으로 확정하세요</span></div>';
    },
    error:function(err){
      prev.innerHTML='<div style="background:#FEF2F2;border-radius:6px;padding:8px 12px;border:1px solid #FECACA"><span style="font-size:12px;color:#DC2626">❌ '+esc(err.message||String(err))+'</span></div>';
    }
  });
}

/* ─ 수강생 일괄 Upsert (phone_number 복합키) ─ */
async function _bulkUpsertParticipants(courseId,rows){
  var allowedStatus=['수료','진행 중','중도포기'];
  var ok=0,fail=0;
  var slice=rows.slice(0,100);
  for(var i=0;i<slice.length;i++){
    var r=slice[i];
    var status=allowedStatus.includes(r['상태'])?r['상태']:'진행 중';
    var obj={
      course_id:Number(courseId),
      student_name:(r['이름']||'').trim(),
      phone_number:(r['휴대전화']||'').trim(),
      license_info:(r['자격증']||'').trim()||null,
      status:status,
      first_test_score:(r['특이사항']||'').trim()||null,
      first_test_result:(r['테스트통과유무']||'').trim()||null
    };
    if(!obj.student_name)continue;
    var res=obj.phone_number
      ?await SB.from('training_participants').upsert(obj,{onConflict:'course_id,phone_number'})
      :await SB.from('training_participants').insert(obj);
    if(res.error)fail++;else ok++;
  }
  return{ok:ok,fail:fail};
}

/* ─ 기수 삭제 ─ */
function deleteTrCourse(id){
  if(isStaff())return;
  var c=TR_COURSES.find(function(x){return x.id===id;});if(!c)return;
  var cnt=TR_PARTICIPANTS.filter(function(p){return p.course_id===id;}).length;
  customConfirm('"'+c.course_name+'"\n\n기수를 삭제하시겠습니까?'+(cnt>0?'\n\n⚠️ 소속 수강생 '+cnt+'명 데이터도 삭제됩니다.':''),async function(){
    await deleteWithTrash({kind:'연수 기수',label:c.course_name,
      snapshot:[{table:'training_courses',column:'id',values:[id]},{table:'training_participants',column:'course_id',values:[id]}],
      run:function(){return SB.from('training_courses').delete().eq('id',id);},
      after:function(){if(trCourseId===id){trCourseId=null;}trSelectedIds.clear();}});
  },'삭제','#DC2626');
}

/* ─ CSV 업로드 모달 ─ */
function openTrUploadModal(courseId){
  if(isStaff())return;
  var c=TR_COURSES.find(function(x){return x.id===courseId;});
  showModal('📤 수강생 일괄 업로드 — '+(c?esc(c.course_name):''),
    '<div style="background:#EFF6FF;border-radius:8px;padding:10px 14px;margin-bottom:12px;border:1px solid #BFDBFE">'+
    '<p style="margin:0;font-size:11px;color:#374151"><strong>CSV 컬럼 순서:</strong> 이름, 휴대전화, 자격증, 상태, 특이사항, 테스트통과유무</p></div>'+
    '<div style="margin-bottom:12px"><input type="file" id="tru_file" accept=".csv" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;font-family:inherit"></div>'+
    '<div id="tru_preview" style="margin-bottom:8px"></div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #F3F4F6;gap:8px">'+
    '<button onclick="downloadTrTemplate()" style="background:#F1F5F9;color:#1F2937;border:1px solid #E2E8F0;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📥 양식 다운로드</button>'+
    '<div style="display:flex;gap:8px">'+btn('취소','closeModal()','outline')+' '+btn('📤 일괄 등록','executeTrUpload('+courseId+')','primary')+'</div>'+
    '</div>','540px');
  setTimeout(function(){
    var fi=document.getElementById('tru_file');
    if(fi)fi.onchange=function(){_previewTrCsv(this.files[0],'tru_preview');};
  },80);
}
async function executeTrUpload(courseId){
  var rows=window._trImportRows;
  if(!rows||!rows.length){customAlert('먼저 CSV 파일을 선택하고 미리보기를 확인하세요.');return;}
  var result=await _bulkUpsertParticipants(courseId,rows);
  window._trImportRows=null;
  closeModal();await reloadData(['training_participants']);
  customAlert('✅ 등록 완료!\n성공: '+result.ok+'명'+(result.fail>0?'\n실패: '+result.fail+'명':''));
}

/* ─ 수강생 추가/수정 모달 ─ */
function openTrMemberModal(courseId,participantId){
  if(isStaff2())return;
  var p=participantId!=null?TR_PARTICIPANTS.find(function(x){return x.id===participantId;}):null;
  var f=p||{student_name:'',phone_number:'',license_info:'',status:'진행 중',first_test_score:'',first_test_result:''};
  var suryoOpts=['합격','불합격'].map(function(o){
    return'<option value="'+o+'" '+(o===(f.first_test_result||'')?'selected':'')+'>'+o+'</option>';
  }).join('');
  /* 상태+결과 조합 경고 */
  var comboWarning=trComboWarning(f.status||'',f.first_test_result||'');
  showModal(p?'수강생 수정':'수강생 추가',
    comboWarning+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">'+
    fInp('이름 *','trm_nm','text',f.student_name||'')+
    fInp('휴대전화','trm_ph','text',f.phone_number||'','placeholder="010-0000-0000"')+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 12px">'+
    fInp('자격증','trm_gr','text',f.license_info||'','placeholder="1급/2급/3급"')+
    /* 연수 진행 상태 */
    '<div style="margin-bottom:10px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">연수 진행 상태</label>'+
    '<select id="trm_st" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+
    ['진행 중','수료','중도포기'].map(function(o){var labels={'진행 중':'진행중','수료':'수료 완료','중도포기':'중도 포기'};return'<option value="'+o+'" '+((f.status||'진행 중')===o?'selected':'')+'>'+labels[o]+'</option>';}).join('')+
    '</select></div>'+
    /* 테스트 통과 유무 */
    '<div style="margin-bottom:10px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">테스트 통과 유무</label>'+
    '<select id="trm_r1" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+
    '<option value="">미입력</option>'+
    '<option value="합격" '+(f.first_test_result==='합격'?'selected':'')+'>합격 — 2차 심화 가능</option>'+
    '<option value="불합격" '+(f.first_test_result==='불합격'?'selected':'')+'>불합격 — 1차 재시험</option>'+
    '</select></div></div>'+
    /* 특이사항 Textarea */
    '<div style="background:#FFFBEB;border-radius:8px;padding:12px 14px;margin-bottom:12px;border:1px solid #FEF3C7">'+
    '<p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#92400E;text-transform:uppercase">📝 특이사항 / 데일리 피드백</p>'+
    '<p style="margin:0 0 8px;font-size:10px;color:#B45309">Enter 키로 날짜별 피드백을 구분하면 줄바꿈이 그대로 저장됩니다.</p>'+
    '<textarea id="trm_s1" rows="5" placeholder="예)&#10;4/1 수업 태도 매우 성실&#10;4/2 과제 미제출&#10;4/3 출석" style="width:100%;padding:8px 10px;border:1px solid #FDE68A;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;line-height:1.7;white-space:pre-wrap">'+esc(f.first_test_score||'')+'</textarea></div>'+
    '<div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'+
    btn('취소','closeModal()','outline')+' '+
    btn(p?'💾 저장':'✅ 추가','saveTrMember('+courseId+','+(participantId!=null?participantId:'null')+')','primary')+'</div>',
  '560px');
}

/* ─ 수강생 저장 ─ */
async function saveTrMember(courseId,participantId){
  if(isStaff2())return;
  var nm=document.getElementById('trm_nm')&&document.getElementById('trm_nm').value.trim();
  if(!nm)return customAlert('이름을 입력하세요');
  var ph=(document.getElementById('trm_ph')&&document.getElementById('trm_ph').value)||'';
  var f={
    course_id:Number(courseId),
    student_name:nm,
    phone_number:ph.trim(),
    license_info:(document.getElementById('trm_gr')&&document.getElementById('trm_gr').value)||null,
    status:(document.getElementById('trm_st')&&document.getElementById('trm_st').value)||'진행 중',
    first_test_score:(document.getElementById('trm_s1')&&document.getElementById('trm_s1').value)||null,
    first_test_result:(document.getElementById('trm_r1')&&document.getElementById('trm_r1').value)||null
  };
  var r=participantId!=null
    ?await SB.from('training_participants').update(f).eq('id',participantId)
    :await SB.from('training_participants').insert(f);
  if(r.error){customAlert('저장 오류: '+(r.error.message||JSON.stringify(r.error)));return;}
  closeModal();await reloadData(['training_participants']);
}

async function deleteTrMember(participantId){
  if(isStaff2())return;
  customConfirm('이 수강생 데이터를 삭제하시겠습니까?',async function(){
    var p=TR_PARTICIPANTS.find(function(x){return x.id===participantId;});
    await deleteWithTrash({kind:'수강생',label:p?(p.student_name||''):'',
      snapshot:[{table:'training_participants',column:'id',values:[participantId]}],
      run:function(){return SB.from('training_participants').delete().eq('id',participantId);},
      after:function(){trSelectedIds.delete(participantId);}});
  },'삭제','#DC2626');
}

/* ─ 체크박스 제어 ─ */
function toggleTrSelect(id){
  if(trSelectedIds.has(id))trSelectedIds.delete(id);
  else trSelectedIds.add(id);
  _saveScrollPositions();renderView();
}
function toggleTrSelectAll(ids){
  var allSelected=ids.every(function(id){return trSelectedIds.has(id);});
  ids.forEach(function(id){if(allSelected)trSelectedIds.delete(id);else trSelectedIds.add(id);});
  _saveScrollPositions();renderView();
}

/* ─ 일괄 수료 처리 ─ */
async function bulkCompleteTr(){
  var ids=Array.from(trSelectedIds);
  if(!ids.length)return customAlert('수료 처리할 수강생을 체크해주세요.');
  customConfirm('선택한 '+ids.length+'명을 "수료 완료" 상태로 변경하시겠습니까?',async function(){
    var ok=0,fail=0;
    for(var i=0;i<ids.length;i++){
      var r=await SB.from('training_participants').update({status:'수료'}).eq('id',ids[i]);
      if(r.error)fail++;else ok++;
    }
    trSelectedIds.clear();
    await reloadData(['training_participants']);
    customAlert('✅ 수료 처리 완료!\n성공: '+ok+'명'+(fail>0?'\n실패: '+fail+'명':''));
  },'✅ 수료 완료 처리','#059669');
}

/* ─ IME 안전 검색 핸들러 ─ */
function onTrKwCompositionStart(){_trKwComposing=true;clearTimeout(_trKwTimer);}
function onTrKwCompositionEnd(el){_trKwComposing=false;clearTimeout(_trKwTimer);var v=el.value;_trKwTimer=setTimeout(function(){trKw=v;renderView();},0);}
function onTrKwInput(el){if(_trKwComposing)return;clearTimeout(_trKwTimer);var v=el.value;_trKwTimer=setTimeout(function(){trKw=v;renderView();},200);}
function setTrStatus(s){trTestFilter='';trStatus=s;renderView();}
function resetTrKw(){trKw='';renderView();}
function resetTrTestFilter(){trTestFilter='';renderView();}
/* 테스트 필터 토글 (같은 값 클릭 시 해제) */
function setTrTestFilter(v){trTestFilter=(trTestFilter===v)?'':v;trStatus='전체';renderView();}
function setTrCourse(v){
  trCourseId=v?Number(v):null;
  trStatus='전체';
  trTestFilter='';
  trSelectedIds.clear();
  renderView();
}

/* ─ 기수 드롭다운: 연도별 그룹화 ─ */
function renderTrCourseSelect(){
  if(!TR_COURSES.length)return'<span style="font-size:12px;color:#64748B">등록된 기수 없음</span>';
  var yearMap={};
  TR_COURSES.forEach(function(c){
    var m=c.course_name.match(/(\d{4})/);
    var year=m?m[1]+'년':'기타';
    if(!yearMap[year])yearMap[year]=[];
    yearMap[year].push(c);
  });
  var years=Object.keys(yearMap).sort(function(a,b){return b.localeCompare(a);});
  var opts='<option value="">기수 선택...</option>';
  years.forEach(function(year){
    opts+='<optgroup label="── '+year+' ──">';
    yearMap[year].forEach(function(c){
      var typeLabel=c.type==='meeting'?'📝':'🎥';
      opts+='<option value="'+c.id+'" '+(trCourseId===c.id?'selected':'')+'>'+typeLabel+' '+esc(c.course_name)+'</option>';
    });
    opts+='</optgroup>';
  });
  return'<select onchange="setTrCourse(this.value)" style="padding:7px 10px;border:1px solid #E2E8F0;border-radius:6px;font-size:12px;background:#fff;font-family:inherit;min-width:180px">'+opts+'</select>';
}

/* ─ 누적 수료생 집계 (전체 기수 합산) ─ */
function getTrCumulativeStats(){
  /* VOD 기수(type='vod')와 회의록 기수(type='meeting')의 수료생 수를 각각 집계 */
  var vodCourseIds=TR_COURSES.filter(function(c){return c.type!=='meeting';}).map(function(c){return c.id;});
  var meetingCourseIds=TR_COURSES.filter(function(c){return c.type==='meeting';}).map(function(c){return c.id;});
  var totalSuryo=TR_PARTICIPANTS.filter(function(p){return p.status==='수료';}).length;
  var vodSuryo=TR_PARTICIPANTS.filter(function(p){return p.status==='수료'&&vodCourseIds.indexOf(p.course_id)>=0;}).length;
  var meetingSuryo=TR_PARTICIPANTS.filter(function(p){return p.status==='수료'&&meetingCourseIds.indexOf(p.course_id)>=0;}).length;
  var totalParticipants=TR_PARTICIPANTS.length;
  return{total:totalSuryo,vod:vodSuryo,meeting:meetingSuryo,participants:totalParticipants,courses:TR_COURSES.length};
}

/* ─ 기수별 집계 (선택 기수만) ─ */
function getTrStats(){
  /* 선택된 기수의 수강생 통계를 계산합니다 */
  var course={total:0,suryo:0,ongoing:0,drop:0,pass:0,fail:0,advanced:0};
  if(trCourseId!=null){
    var cp=TR_PARTICIPANTS.filter(function(p){return p.course_id===trCourseId;});
    course.total=cp.length;
    course.suryo=cp.filter(function(p){return p.status==='수료';}).length;
    course.ongoing=cp.filter(function(p){return p.status==='진행 중';}).length;
    course.drop=cp.filter(function(p){return p.status==='중도포기';}).length;
    course.pass=cp.filter(function(p){return p.first_test_result==='합격';}).length;
    course.fail=cp.filter(function(p){return p.first_test_result==='불합격';}).length;
    /* 심화 대상자: 수료 완료 + 테스트 합격인 학생 */
    course.advanced=cp.filter(function(p){return p.status==='수료'&&p.first_test_result==='합격';}).length;
  }
  /* 비율 계산 (0으로 나누기 방지) */
  course.suryoRate=course.total>0?Math.round(course.suryo/course.total*100):0;
  course.passRate=course.total>0?Math.round(course.pass/course.total*100):0;
  course.advRate=course.suryo>0?Math.round(course.advanced/course.suryo*100):0;
  return{course:course};
}

/* ─ 기수 전체 수료/진행중 일괄 처리 ─ */
function bulkCourseStatus(courseId,newStatus){
  if(isStaff())return;
  var allM=TR_PARTICIPANTS.filter(function(p){return p.course_id===courseId;});
  if(!allM.length)return customAlert('해당 기수에 수강생이 없습니다.');
  var cName=(TR_COURSES.find(function(c){return c.id===courseId;})||{course_name:'해당 기수'}).course_name;
  var label=newStatus==='수료'?'수료 완료':'진행중';
  var yLabel=newStatus==='수료'?'전체 수료 완료':'진행중으로 해제';
  var yColor=newStatus==='수료'?'#059669':'#2563EB';
  customConfirm(cName+' — 전체 '+allM.length+'명을 ['+label+'] 상태로 변경하시겠습니까?',async function(){
    var ok=0,fail=0;
    for(var i=0;i<allM.length;i++){
      var r=await SB.from('training_participants').update({status:newStatus}).eq('id',allM[i].id);
      if(r.error)fail++;else ok++;
    }
    trSelectedIds.clear();await reloadData(['training_participants']);
    customAlert('완료! '+label+' '+ok+'명'+(fail>0?' / 실패 '+fail+'명':''));
  },yLabel,yColor);
}

/* ─ 현재 보이는 수강생 엑셀(CSV) 내보내기 ─ */
function exportTrMembers(mems){
  if(isStaff())return;
  if(!mems||!mems.length)return customAlert('내보낼 데이터가 없습니다.');
  var cmap={};TR_COURSES.forEach(function(c){cmap[c.id]=c.course_name;});
  var stLabel={'수료':'수료 완료','진행 중':'진행중','중도포기':'중도 포기'};
  var data=mems.map(function(p,i){
    return{'No':i+1,'기수명':cmap[p.course_id]||'-','이름':p.student_name||'',
      '휴대전화':p.phone_number||'','자격증':p.license_info||'',
      '연수 진행 상태':stLabel[p.status]||p.status||'',
      '테스트 통과 유무':(p.first_test_result==='합격'?'합격 (2차 심화 가능)':
                         p.first_test_result==='불합격'?'불합격 (1차 재시험)':'-'),
      '특이사항':p.first_test_score||''};
  });
  csvExport(data,'연수수강생명단_'+TODAY);
}

/* ─ 연수 관리 메인 뷰 v7.0 ─ */
function renderTraining(){
  /* ── 누적 통계 및 기수별 집계 ── */
  var cumul=getTrCumulativeStats();   /* 전체 누적 수료생 */
  var stats=getTrStats();             /* 선택 기수 통계 */
  var curCourse=trCourseId!=null?TR_COURSES.find(function(c){return c.id===trCourseId;}):null;

  /* ── 수강생 필터링 로직 ──
     1) 검색어 있으면 전체 기수에서 이름/번호 뒷4자리 검색
     2) 기수 선택 시 해당 기수 수강생만 표시
     3) 상태(trStatus) 필터 적용
     4) 테스트결과(trTestFilter) 필터 적용
        - 'advanced' = 수료 완료 + 테스트 합격(심화 대상자)
  */
  var members;
  if(trKw.trim()){
    var kw=trKw.trim();
    members=TR_PARTICIPANTS.filter(function(p){
      return p.student_name.indexOf(kw)>=0||(p.phone_number||'').slice(-4).indexOf(kw)>=0;
    });
  }else if(trCourseId!=null){
    members=TR_PARTICIPANTS.filter(function(p){return p.course_id===trCourseId;});
  }else{
    members=[];
  }
  if(trStatus!=='전체')members=members.filter(function(p){return p.status===trStatus;});
  if(trTestFilter==='합격')members=members.filter(function(p){return p.first_test_result==='합격';});
  else if(trTestFilter==='불합격')members=members.filter(function(p){return p.first_test_result==='불합격';});
  else if(trTestFilter==='advanced'){
    /* 심화 대상자: 수료 완료 AND 테스트 합격 */
    members=members.filter(function(p){return p.status==='수료'&&p.first_test_result==='합격';});
  }
  window._trCurrentMembers=members; /* 엑셀 다운로드용 */

  var visibleIds=members.map(function(p){return p.id;});
  var allInCourse=trCourseId!=null?TR_PARTICIPANTS.filter(function(p){return p.course_id===trCourseId;}):[];

  /* ── 통계 카드 렌더 함수 ──
     클릭 시 해당 필터를 적용하고, 활성 카드는 배경색으로 강조 표시
  */
  /* ── 통계 카드 렌더 함수 ──
     isA(활성) 상태: 진한 컬러 배경 위에 숫자·라벨 모두 순백/밝은 회색으로
     비활성 상태:   흰 배경 위에 컬러 텍스트 사용
  ── */
  function sc(icon,label,val,pct,sub,c,bg,filterType,filterVal){
    var isA=(filterType==='status')?(trTestFilter===''&&trStatus===filterVal)
              :(filterType==='test')?trTestFilter===filterVal:false;
    var clickFn=(filterType==='status')?"setTrStatus('"+filterVal+"')"
                :(filterType==='test')?"setTrTestFilter('"+filterVal+"')":'';
    /* 활성 카드 텍스트 색상 — 배경이 진한 컬러이므로 최대 대비 */
    var aLabel='#F1F5F9';  /* 밝은 회색: 라벨 텍스트 */
    var aNum  ='#FFFFFF';  /* 순백: 핵심 숫자 */
    var aSuffix='#E2E8F0'; /* 밝은 회색: 명/% 단위 */
    var aSub  ='#E2E8F0';  /* 밝은 회색: 보조 설명 */
    return'<div onclick="'+clickFn+'" style="'+
      'background:'+(isA?c:'#fff')+';'+
      'border:2px solid '+(isA?c:c+'33')+';'+
      'border-radius:10px;padding:10px 14px;flex:1;min-width:85px;max-width:145px;'+
      'cursor:'+(clickFn?'pointer':'default')+';transition:all .12s;user-select:none">'+
      '<p style="margin:0;font-size:10px;color:'+(isA?aLabel:c)+';font-weight:700;white-space:nowrap">'+icon+' '+label+'</p>'+
      '<p style="margin:3px 0 1px;font-size:21px;font-weight:900;color:'+(isA?aNum:'#0F172A')+';line-height:1">'+val+
      '<span style="font-size:10px;color:'+(isA?aSuffix:'#94A3B8')+';font-weight:400;margin-left:2px">명</span></p>'+
      /* 백분율(%) 자동 표시 */
      (pct!==null?'<p style="margin:1px 0 0;font-size:11px;font-weight:800;color:'+(isA?aNum:c)+'">'+pct+'%</p>':'')+
      (sub?'<p style="margin:0;font-size:9px;color:'+(isA?aSub:c)+';font-weight:600">'+sub+'</p>':'')+
      '</div>';
  }

  /* ── 7종 통계 카드 (기수 선택 시만 표시) ── */
  var statsHtml=trCourseId!=null?
    '<div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;align-items:stretch">'+
    '<div style="background:#1E293B;border-radius:10px;padding:10px 14px;display:flex;flex-direction:column;justify-content:center;min-width:100px;flex-shrink:0">'+
    '<p style="margin:0;font-size:9px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.08em">선택 기수</p>'+
    '<p style="margin:4px 0 0;font-size:12px;font-weight:800;color:#1E293B;line-height:1.3">'+esc((curCourse?curCourse.course_name:'').slice(0,12))+'</p>'+
    (curCourse?'<p style="margin:3px 0 0;font-size:10px;color:#475569">'+(curCourse.type==='meeting'?'📝 회의록':'🎥 VOD')+'</p>':'')+
    '</div>'+
    sc('👥','총원',stats.course.total,null,null,'#374151','#F8FAFC','status','전체')+
    sc('✅','수료 완료',stats.course.suryo,stats.course.suryoRate,'클릭하여 필터','#059669','#F0FDF4','status','수료')+
    sc('📘','진행중',stats.course.ongoing,null,'클릭하여 필터','#2563EB','#EFF6FF','status','진행 중')+
    sc('⬜','중도 포기',stats.course.drop,null,'클릭하여 필터','#6B7280','#F9FAFB','status','중도포기')+
    '<div style="width:1px;background:#E2E8F0;flex-shrink:0;margin:2px 0"></div>'+
    sc('🏆','테스트 합격',stats.course.pass,stats.course.passRate,'2차 심화 가능','#059669','#F0FDF4','test','합격')+
    sc('🔄','테스트 불합격',stats.course.fail,null,'1차 재시험','#DC2626','#FEF2F2','test','불합격')+
    '<div style="width:1px;background:#E2E8F0;flex-shrink:0;margin:2px 0"></div>'+
    sc('⭐','심화 대상자',stats.course.advanced,stats.course.advRate,'수료+합격','#7C3AED','#F5F3FF','test','advanced')+
    '</div>':'';

  /* ── 활성 필터 배지 ── */
  var filterBadge='';
  if(trTestFilter==='합격'){
    filterBadge='<span style="background:#D1FAE5;color:#065F46;border:1px solid #A7F3D0;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:6px">'+
      '🏆 테스트 합격자만 표시 <button onclick="resetTrTestFilter()" style="border:none;background:none;color:#065F46;cursor:pointer;font-size:13px;font-weight:900;line-height:1">✕</button></span>';
  }else if(trTestFilter==='불합격'){
    filterBadge='<span style="background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:6px">'+
      '🔄 테스트 불합격(1차 재시험 대상)만 표시 <button onclick="resetTrTestFilter()" style="border:none;background:none;color:#991B1B;cursor:pointer;font-size:13px;font-weight:900;line-height:1">✕</button></span>';
  }else if(trTestFilter==='advanced'){
    filterBadge='<span style="background:#EDE9FE;color:#5B21B6;border:1px solid #C4B5FD;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:6px">'+
      '⭐ 심화 대상자(수료+합격)만 표시 <button onclick="resetTrTestFilter()" style="border:none;background:none;color:#5B21B6;cursor:pointer;font-size:13px;font-weight:900;line-height:1">✕</button></span>';
  }

  /* ── 수강생 테이블 바디 ── */
  var allChecked=visibleIds.length>0&&visibleIds.every(function(id){return trSelectedIds.has(id);});
  var tbody='';
  if(!trKw.trim()&&trCourseId==null){
    tbody='<tr><td colspan="9" style="padding:60px 20px;text-align:center">'+
      '<div style="display:flex;flex-direction:column;align-items:center;gap:12px">'+
      '<span style="font-size:48px">🎓</span>'+
      '<span style="font-size:14px;font-weight:700;color:#64748B">기수를 선택하거나, 위 검색창에 이름을 입력하세요</span>'+
      '<span style="font-size:12px;color:#CBD5E1">이름 검색 시 전체 기수에서 해당 수강생을 찾습니다</span>'+
      '</div></td></tr>';
  }else if(members.length===0){
    tbody='<tr><td colspan="9" style="padding:48px 20px;text-align:center">'+
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px">'+
      '<span style="font-size:40px">🔍</span>'+
      '<span style="font-size:14px;color:#64748B;font-weight:700">검색/필터 결과가 없습니다</span>'+
      '</div></td></tr>';
  }else{
    tbody=members.map(function(p,i){
      var isSel=trSelectedIds.has(p.id);
      /* 전체 기수 검색 시 소속 기수명 표시 */
      var courseInfo='';
      if(trKw.trim()){
        var pC=TR_COURSES.find(function(c){return c.id===p.course_id;});
        if(pC)courseInfo='<div style="font-size:9px;color:#64748B;margin-top:2px">'+(pC.type==='meeting'?'📝':'🎥')+' '+esc(pC.course_name.slice(0,14))+'</div>';
      }
      /* 특이사항: 첫 줄 미리보기 + 클릭 시 전체 팝업 편집 모달 오픈 */
      var noteLines=(p.first_test_score||'').split('\n');
      var notePreview=noteLines[0].slice(0,18);
      var noteMore=noteLines.length>1||noteLines[0].length>18;
      var noteCell=p.first_test_score
        /* 내용 있음: 미리보기 텍스트 + 클릭 버튼 */
        ?'<div style="max-width:140px">'+
          '<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:#1F2937;margin-bottom:3px">'+esc(notePreview)+(noteMore?'…':'')+'</div>'+
          '<button onclick="openTrNoteModal('+p.id+')" '+
          'style="border:none;background:#FFFBEB;color:#92400E;border:1px solid #FDE68A;'+
          'padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">'+
          (noteMore?'▼ '+noteLines.length+'줄 전체 보기':'✏ 수정')+'</button></div>'
        /* 내용 없음: 추가 버튼 */
        :'<button onclick="openTrNoteModal('+p.id+')" '+
          'style="border:none;background:#F8FAFC;color:#64748B;border:1px solid #E5E7EB;'+
          'padding:2px 8px;border-radius:4px;font-size:10px;cursor:pointer;font-family:inherit;white-space:nowrap">'+
          '+ 입력</button>';
      return'<tr class="tbl-tr'+(isSel?' row-urgent':'')+'" style="border-bottom:1px solid #F1F5F9">'+
        (!isStaff2()?'<td style="padding:10px 8px;text-align:center"><input type="checkbox" '+(isSel?'checked':'')+' onchange="toggleTrSelect('+p.id+')" style="width:15px;height:15px;cursor:pointer;accent-color:#2563EB"></td>':'')+
        '<td style="padding:10px 12px;text-align:center;color:#64748B;font-size:11px;font-weight:700">'+(i+1)+'</td>'+
        '<td style="padding:8px 12px"><span style="font-weight:700;font-size:13px;color:#0F172A">'+esc(p.student_name)+'</span>'+courseInfo+'</td>'+
        '<td style="padding:10px 12px;color:#6B7280;font-size:12px">'+esc(p.phone_number||'-')+'</td>'+
        '<td style="padding:10px 12px">'+(p.license_info?'<span style="background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;border:1px solid #BFDBFE">'+esc(p.license_info)+'</span>':'<span style="color:#CBD5E1">-</span>')+'</td>'+
        '<td style="padding:8px 12px">'+trStatusBadge(p.status)+'</td>'+
        '<td style="padding:8px 12px">'+noteCell+'</td>'+
        '<td style="padding:8px 12px">'+trSuryoBadge(p.first_test_result)+'</td>'+
        '<td style="padding:10px 12px;white-space:nowrap"><div style="display:flex;gap:4px">'+
        (!isStaff2()?btn('\u270F','openTrMemberModal('+p.course_id+','+p.id+')','outline',true)+' '+btn('\uD83D\uDDD1','deleteTrMember('+p.id+')','danger',true):'')+'</div></td></tr>'
    }).join('');
  }

  /* ── 테이블 헤더 ── */
  var thead='<tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;position:sticky;top:0;z-index:2">'+
    '<th style="padding:10px 8px;text-align:center;background:#F8FAFC;width:36px">'+
    (!isStaff2()&&visibleIds.length>0?'<input type="checkbox" '+(allChecked?'checked':'')+
    ' onchange="toggleTrSelectAll(['+visibleIds.join(',')+'])" style="width:15px;height:15px;cursor:pointer;accent-color:#2563EB">':'')+
    '</th>'+
    ['No.','이름','연락처','자격증','연수 진행 상태','특이사항 / 데일리 피드백','테스트 통과 유무','관리'].map(function(h){
      return'<th style="padding:10px 12px;text-align:left;font-weight:700;color:#1F2937;font-size:11px;white-space:nowrap;letter-spacing:.04em;background:#F8FAFC">'+h+'</th>';
    }).join('')+'</tr>';

  /* ════════════════════════════
     최종 HTML 조립
  ════════════════════════════ */
  return'<div id="_view_scroll" style="padding:20px 24px 24px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:12px">'+

    /* ① 상단 헤더: 제목 + 일괄처리 버튼 */
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;flex-shrink:0">'+
    '<div>'+
    '<h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">🎓 연수 관리</h2>'+
    '<p style="margin:3px 0 0;font-size:12px;color:#64748B">Sorizava Archive v1.0 · 기수별 수강생 관리 · 심화 대상자 추적</p>'+
    '</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
    (trSelectedIds.size>0?'<button onclick="bulkCompleteTr()" style="background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">✅ 선택 '+trSelectedIds.size+'명 수료 완료</button>':'')+
    (isStaff()?'':(trCourseId!=null?btn('+ 수강생 추가','openTrMemberModal('+trCourseId+',null)','primary'):''))+
    (isStaff()?'':btn('+ 기수 추가','openTrCourseModal()','outline'))+
    '</div></div>'+

    /* ② 누적 수료생 배너 (항상 표시) */
    '<div style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:12px;padding:14px 20px;flex-shrink:0;border:1px solid rgba(255,255,255,.06)">'+
    '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px">'+
    '<div style="flex-shrink:0">'+
    '<p style="margin:0;font-size:9px;color:#64748B;font-weight:700;letter-spacing:.14em;text-transform:uppercase">SORIZAVA ARCHIVE</p>'+
    '<p style="margin:3px 0 0;font-size:15px;font-weight:800"><span style="color:#60A5FA">누적 수료생</span></p>'+
    '</div>'+
    /* 구분선 */
    '<div style="width:1px;background:rgba(255,255,255,.08);height:36px;flex-shrink:0"></div>'+
    /* 전체 수료생 */
    '<div style="text-align:center;flex:1;min-width:80px">'+
    '<p style="margin:0;font-size:10px;color:#CBD5E1;font-weight:700">전체</p>'+
    '<p style="margin:2px 0 0;font-size:28px;font-weight:900;color:#fff;line-height:1">'+cumul.total+'<span style="font-size:11px;color:#64748B;margin-left:2px">명</span></p>'+
    '</div>'+
    '<div style="width:1px;background:rgba(255,255,255,.08);height:36px;flex-shrink:0"></div>'+
    /* VOD 수료생 */
    '<div style="text-align:center;flex:1;min-width:80px">'+
    '<p style="margin:0;font-size:10px;color:#CBD5E1;font-weight:700">🎥 VOD 수료</p>'+
    '<p style="margin:2px 0 0;font-size:24px;font-weight:900;color:#60A5FA;line-height:1">'+cumul.vod+'<span style="font-size:10px;color:#64748B;margin-left:2px">명</span></p>'+
    '</div>'+
    '<div style="width:1px;background:rgba(255,255,255,.08);height:36px;flex-shrink:0"></div>'+
    /* 회의록 수료생 */
    '<div style="text-align:center;flex:1;min-width:80px">'+
    '<p style="margin:0;font-size:10px;color:#CBD5E1;font-weight:700">📝 회의록 수료</p>'+
    '<p style="margin:2px 0 0;font-size:24px;font-weight:900;color:#A78BFA;line-height:1">'+cumul.meeting+'<span style="font-size:10px;color:#64748B;margin-left:2px">명</span></p>'+
    '</div>'+
    '<div style="width:1px;background:rgba(255,255,255,.08);height:36px;flex-shrink:0"></div>'+
    /* 전체 기수 수 */
    '<div style="text-align:center;flex:1;min-width:80px">'+
    '<p style="margin:0;font-size:10px;color:#CBD5E1;font-weight:700">등록 기수</p>'+
    '<p style="margin:2px 0 0;font-size:24px;font-weight:900;color:#34D399;line-height:1">'+cumul.courses+'<span style="font-size:10px;color:#64748B;margin-left:2px">개</span></p>'+
    '</div>'+
    '<div style="width:1px;background:rgba(255,255,255,.08);height:36px;flex-shrink:0"></div>'+
    /* 전체 수강생 수 */
    '<div style="text-align:center;flex:1;min-width:80px">'+
    '<p style="margin:0;font-size:10px;color:#CBD5E1;font-weight:700">총 수강생</p>'+
    '<p style="margin:2px 0 0;font-size:24px;font-weight:900;color:#FBBF24;line-height:1">'+cumul.participants+'<span style="font-size:10px;color:#64748B;margin-left:2px">명</span></p>'+
    '</div>'+
    '</div></div>'+

    /* ③ 이름 상시 검색창 (기수 선택 여부와 무관하게 항상 노출) */
    '<div style="background:#fff;border-radius:10px;padding:12px 16px;border:1.5px solid #BFDBFE;flex-shrink:0">'+
    '<p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:.06em">🔍 이름 상시 검색 — 전체 기수에서 즉시 검색</p>'+
    '<div style="display:flex;gap:8px;align-items:center">'+
    '<input id="trSearchInput" value="'+esc(trKw)+'" '+
    'oncompositionstart="onTrKwCompositionStart()" '+
    'oncompositionend="onTrKwCompositionEnd(this)" '+
    'oninput="onTrKwInput(this)" '+
    'placeholder="수강생 이름 또는 전화번호 뒷 4자리 입력..." '+
    'style="flex:1;padding:9px 14px;border:1.5px solid '+(trKw?'#2563EB':'#E2E8F0')+';border-radius:8px;font-size:13px;outline:none;font-family:inherit;background:'+(trKw?'#EFF6FF':'#fff')+'" autocomplete="off">'+
    (trKw?'<button onclick="resetTrKw()" style="border:none;background:#F1F5F9;color:#64748B;padding:9px 14px;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap;font-weight:600">✕ 초기화</button>':'')+
    (trKw?'<span style="font-size:12px;color:#2563EB;font-weight:700;white-space:nowrap">'+members.length+'명 발견</span>':'')+
    '</div>'+
    (trKw?'<p style="margin:6px 0 0;font-size:11px;color:#6B7280">'+(members.length>0?'전체 기수에서 검색됩니다. 특정 기수로 좁히려면 아래에서 기수를 선택하세요.':'일치하는 수강생이 없습니다.')+'</p>':
    '<p style="margin:6px 0 0;font-size:11px;color:#64748B">기수를 선택하지 않아도 이름만 입력하면 전체 수강생에서 검색합니다.</p>')+
    '</div>'+

    /* ④ 기수 선택 + 전체 관리 버튼 */
    '<div style="background:#fff;border-radius:10px;padding:12px 16px;border:1px solid #E5E7EB;flex-shrink:0">'+
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+
    '<span style="font-size:11px;font-weight:700;color:#1F2937;white-space:nowrap">기수 선택:</span>'+
    renderTrCourseSelect()+
    (isStaff()?'':(trCourseId!=null?'<button onclick="openTrUploadModal('+trCourseId+')" style="background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;padding:7px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">📤 CSV 업로드</button>':''))+
    (trCourseId!=null?'<button onclick="downloadTrTemplate()" style="background:#F1F5F9;color:#1F2937;border:1px solid #E2E8F0;padding:7px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">📥 양식</button>':'')+
    /* 기수 전체 수료/진행중 일괄 전환 */
    (isStaff()?'':(trCourseId!=null?'<button onclick="bulkCourseStatus('+trCourseId+',\'수료\')" style="background:#059669;color:#fff;border:none;padding:7px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">✅ 기수 전체 수료</button>':''))+
    (isStaff()?'':(trCourseId!=null?'<button onclick="bulkCourseStatus('+trCourseId+',\'진행 중\')" style="background:#2563EB;color:#fff;border:none;padding:7px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">🔄 진행중으로 해제</button>':''))+
    (isStaff()?'':(trCourseId!=null?'<button onclick="deleteTrCourse('+trCourseId+')" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:7px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">🗑 기수 삭제</button>':''))+
    '</div>'+
    /* 활성 필터 배지 표시 */
    (filterBadge?'<div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+filterBadge+'<span style="font-size:11px;color:#64748B">'+members.length+'명</span></div>':
      (trCourseId!=null?'<div style="margin-top:8px;font-size:11px;color:#64748B">전체 '+allInCourse.length+'명 · 카드 클릭으로 필터링</div>':''))+
    '</div>'+

    /* ⑤ 7종 통계 카드 */
    statsHtml+

    /* ⑥ 엑셀 다운로드 버튼 (명단이 있을 때만 표시, 스태프 숨김) */
    (members.length>0&&!isStaff()?
      '<div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;flex-shrink:0">'+
      '<span style="font-size:11px;color:#64748B">현재 '+members.length+'명 표시 중</span>'+
      '<button onclick="exportTrMembers(window._trCurrentMembers)" '+
      'style="background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;padding:7px 16px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px">'+
      '📥 현재 명단 엑셀 다운로드 <span style="font-size:10px;background:rgba(255,255,255,.25);padding:1px 7px;border-radius:99px">'+members.length+'명</span></button>'+
      '</div>'
    :'')+

    /* ⑦ 수강생 테이블 */
    '<div id="_tbl_scroll" style="background:#fff;border-radius:10px;border:1px solid #E5E7EB;overflow:auto;flex:1;min-height:0">'+
    '<table style="width:100%;border-collapse:collapse;font-size:13px;min-width:850px">'+
    '<thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div></div>';
}


/* ─ 통합 이력 모달: 연수 참여 이력 ─ */
function getTrHistoryHtml(phone){
  if(!phone||!phone.trim())return'';
  var phoneDigits=phone.replace(/\D/g,'');
  var list=TR_PARTICIPANTS.filter(function(p){
    return p.phone_number&&p.phone_number.replace(/\D/g,'')===phoneDigits;
  });
  if(!list.length)return'';
  var rows=list.map(function(p){
    var c=TR_COURSES.find(function(x){return x.id===p.course_id;});
    var typeIcon=c&&c.type==='meeting'?'📝':'🎥';
    var combo=trComboWarning(p.status||'',p.first_test_result||'');
    return'<div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:10px 14px;margin-bottom:6px">'+
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'+
      '<span style="font-size:13px;font-weight:700;color:#374151">'+typeIcon+' '+(c?esc(c.course_name):'(삭제된 기수)')+'</span>'+
      trStatusBadge(p.status)+
      (p.license_info?'<span style="background:#EFF6FF;color:#2563EB;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;border:1px solid #BFDBFE">'+esc(p.license_info)+'</span>':'')+
      trSuryoBadge(p.first_test_result)+
      '</div>'+
      (combo?'<div style="margin-top:8px">'+combo+'</div>':'')+
      (p.first_test_score?'<p style="margin:6px 0 0;font-size:11px;color:#1F2937;white-space:pre-wrap;line-height:1.6;background:#FFFBEB;border-radius:6px;padding:6px 10px;border:1px solid #FEF3C7">'+esc(p.first_test_score)+'</p>':'')+
      '</div>';
  }).join('');
  return'<div style="margin-top:16px;padding-top:14px;border-top:1px solid #F3F4F6">'+
    '<p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em">🎓 연수 참여 이력 ('+list.length+'건)</p>'+
    rows+'</div>';
}
