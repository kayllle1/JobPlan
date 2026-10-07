'use strict';
/* DB 변환 / 데이터 로드 / 실시간 연동 */
/* ─ DB 변환 ─ */
function dbToStudent(r){return{id:r.id,name:r.name,age:r.age,phone:r.phone||'',email:r.email||'',counselingMemo:r.counseling_memo||'',isWarning:!!r.is_warning,restrictionLevel:r.restriction_level||null};}
function dbToJob(r){return{id:r.id,name:r.name,category:r.category||'기타',type:r.type||'',location:r.location||'',isRec:!!r.is_rec,isReA:!!r.is_rea,isClosed:!!r.is_closed,applyStartDate:r.apply_start_date||'',applyDeadline:r.apply_deadline||'',documentPassDate:r.document_pass_date||'',jobUrl:r.job_url||'',docDate:r.doc_date||'',interviewDate:r.interview_date||'',finalDate:r.final_date||'',startDate:r.start_date||'',endDate:r.end_date||'',note:r.note||'',submitDocs:r.submit_docs||'',submitDeadline:r.submit_deadline||'',managerName:r.manager_name||'',managerPhone:r.manager_phone||'',managerEmail:r.manager_email||'',createdAt:r.created_at||'',recruitmentCount:r.recruitment_count!=null?Number(r.recruitment_count):null,finalPassAnnouncedCount:r.final_pass_announced_count!=null?Number(r.final_pass_announced_count):null,idKeyboard:r.id_keyboard||'확인중',idContactName:r.id_contact_name||'',idContactPhone:r.id_contact_phone||'',idMemo:r.id_memo||'',applicants:[]};}
function dbToVault(r){return{id:r.id,category:r.category||'',institutionName:r.institution_name||'',year:r.year||null,content:r.content||'',createdAt:r.created_at||''};}
function dbToApplicant(r){return{id:r.id,jobId:r.job_id,studentId:r.student_id,status:r.status||'서류접수',grade:r.grade||'3급',announceType:r.announce_type||'홈페이지',memo:r.memo||'',examNumber:r.exam_number||'',interviewDocSent:r.interview_doc_sent||'',interviewFeedback:r.interview_feedback||''};}

/* ─ 데이터 로드 ─ */
/* safeArr: Supabase 응답에서 순수 plain-object 배열만 추출
   (DataCloneError 방지 — headers/prototype 등 비직렬화 객체 제거) */
function safeArr(res){
  try{
    var raw=res&&res.data;
    if(!raw||!Array.isArray(raw))return[];
    /* JSON round-trip으로 non-cloneable 속성 완전 제거 */
    return JSON.parse(JSON.stringify(raw));
  }catch(e){return[];}
}
/* 테이블별 조회 방법과 전역 변수 반영 방법.
   한 테이블이 바뀌면 그 테이블만 다시 불러온다. (required: 실패 시 화면 갱신 중단) */
var _rawJobs=[],_rawApplicants=[];
var DATA_TABLES={
  students:{required:true,query:function(){return SB.from('students').select('*').order('created_at',{ascending:false});},apply:function(rows){STUDENTS=rows.map(dbToStudent);}},
  jobs:{required:true,query:function(){return SB.from('jobs').select('*').order('created_at',{ascending:false});},apply:function(rows){_rawJobs=rows;}},
  applicants:{required:true,query:function(){return SB.from('applicants').select('*');},apply:function(rows){_rawApplicants=rows;}},
  interview_vault:{query:function(){return SB.from('interview_vault').select('*').order('year',{ascending:false}).order('created_at',{ascending:false});},apply:function(rows){VAULT=rows.map(dbToVault);}},
  training_courses:{query:function(){return SB.from('training_courses').select('*').order('created_at',{ascending:false});},apply:function(rows){TR_COURSES=rows;}},
  training_participants:{query:function(){return SB.from('training_participants').select('*').order('created_at',{ascending:false});},apply:function(rows){TR_PARTICIPANTS=rows;}},
  employers:{query:function(){return SB.from('employers').select('*').order('name',{ascending:true});},apply:function(rows){EMPLOYERS=rows;}},
  favorites:{query:function(){return SB.from('favorites').select('*').order('created_at',{ascending:false});},apply:function(rows){FAVORITES=rows;}}
};
/* DB에서 함께 지워지는(연쇄 삭제) 테이블: 앞의 테이블이 바뀌면 뒤의 테이블도 다시 불러온다 */
var DATA_CASCADE={students:['applicants','favorites'],jobs:['applicants'],training_courses:['training_participants']};

/* 공고(jobs)에 지원자(applicants)를 붙여 JOBS를 만든다 */
function _rebuildJobs(){
  var byJob={};
  _rawApplicants.map(dbToApplicant).forEach(function(a){(byJob[a.jobId]=byJob[a.jobId]||[]).push(a);});
  JOBS=_rawJobs.map(dbToJob).map(function(j){j.applicants=byJob[j.id]||[];return j;});
}

/* 지정한 테이블만 동시에 불러와 반영하고 화면을 한 번만 다시 그린다 */
async function reloadData(tables){
  var want=(tables&&tables.length)?tables.slice():Object.keys(DATA_TABLES);
  want.forEach(function(t){(DATA_CASCADE[t]||[]).forEach(function(c){if(want.indexOf(c)<0)want.push(c);});});
  want=want.filter(function(t){return DATA_TABLES[t];});
  try{
    var res=await Promise.all(want.map(function(t){
      return Promise.resolve(DATA_TABLES[t].query()).catch(function(e){return{error:e};});
    }));
    var errs=[];
    res.forEach(function(r,i){if(r&&r.error&&DATA_TABLES[want[i]].required)errs.push(r.error);});
    if(errs.length){
      var msg=errs.map(function(e){return(typeof e==='object'&&e.message)?e.message:String(e);}).join(' / ');
      console.error('DB error',errs);
      customAlert('DB 에러: '+msg);
      return;
    }
    res.forEach(function(r,i){DATA_TABLES[want[i]].apply((r&&!r.error)?safeArr(r):[]);});
    if(want.indexOf('jobs')>=0||want.indexOf('applicants')>=0)_rebuildJobs();
    if(want.indexOf('jobs')>=0)await _autoCloseExpiredJobs();
    console.log('Loaded ['+want.join(',')+']: students='+STUDENTS.length+' jobs='+JOBS.length+' vault='+VAULT.length+' employers='+EMPLOYERS.length+' favorites='+FAVORITES.length);
    renderView();
  }catch(err){console.error('reloadData error',err);customAlert('네트워크 오류: '+(err&&err.message||String(err)));}
}
/* 전체 다시 불러오기 (로그인 직후 등) */
function loadAllData(){return reloadData();}

/* 자동 마감: 최종합격발표일이 지난 공고를 조용히 마감 처리 (교육팀만) */
async function _autoCloseExpiredJobs(){
  if(!isAdmin())return;
  try{
    var toAutoClose=JOBS.filter(function(j){
      if(j.isClosed||j.isRec)return false;
      if(j.finalDate&&j.finalDate.slice(0,10)<TODAY)return true;
      var dl=j.applyDeadline||j.docDate;
      return !!(dl&&dl.slice(0,10)<TODAY&&!j.interviewDate&&!j.finalDate);
    });
    if(toAutoClose.length>0){
      var acIds=toAutoClose.map(function(j){return j.id;});
      var acR=await SB.from('jobs').update({is_closed:true}).in('id',acIds);
      if(!acR.error){
        toAutoClose.forEach(function(j){j.isClosed=true;});
        _rawJobs.forEach(function(r){if(acIds.indexOf(r.id)>=0)r.is_closed=true;});
        showToast(acIds.length+'개 공고가 마감일 경과로 자동 마감 처리되었습니다');
      }
    }
  }catch(ace){console.warn('자동 마감 처리 실패',ace);}
}

/* 실시간 변경: 바뀐 테이블만 모아 두었다가 0.5초 뒤 한 번에 다시 불러온다 */
var _dirtyTables={};
function scheduleReload(table){
  if(table)_dirtyTables[table]=true;
  clearTimeout(_reloadTimer);
  _reloadTimer=setTimeout(function(){
    var t=Object.keys(_dirtyTables);_dirtyTables={};
    reloadData(t.length?t:null);
  },500);
}
function setupRealtime(){
  var ch=SB.channel('jobms-v75');
  Object.keys(DATA_TABLES).forEach(function(t){
    ch=ch.on('postgres_changes',{event:'*',schema:'public',table:t},function(){scheduleReload(t);});
  });
  ch.subscribe(function(s){
    _dbConnected=(s==='SUBSCRIBED');
    var dot=$('_conn_dot'),txt=$('_conn_txt');
    if(dot)dot.style.background=_dbConnected?'#10B981':'#F59E0B';
    if(txt)txt.textContent=_dbConnected?'실시간 연동 활성':'연결 중...';
  });
}
function showLoading(){if($('_loading'))return;var d=document.createElement('div');d.id='_loading';d.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:20000;backdrop-filter:blur(2px)';d.innerHTML='<div style="background:#fff;border-radius:14px;padding:28px 36px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)"><div style="font-size:36px;animation:spin 1s linear infinite;display:inline-block">⟳</div><p style="margin:10px 0 0;font-size:13px;color:#6B7280;font-weight:600">Supabase 연결 중...</p></div>';document.body.appendChild(d);}
function hideLoading(){var el=$('_loading');if(el)el.remove();}
