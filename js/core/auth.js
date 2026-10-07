'use strict';
/* 로그인 / 권한 / 개인정보 마스킹 */
/* ════════════════════════════════════════════════
   AUTH — 로그인 권한 시스템
   마스터: 전체 권한  |  스태프: 제한 접근 + 개인정보 마스킹
════════════════════════════════════════════════ */
var _currentUser=null; /* {type:'master'|'staff'|'staff2'} */
var _CREDS={master:'sorizava2026',staff:'staff2026',staff2:'staff2_2026'};
function isAdmin(){return _currentUser&&_currentUser.type==='master';}
function isStaff(){return _currentUser&&(_currentUser.type==='staff'||_currentUser.type==='staff2');}
function isStaff2(){return _currentUser&&_currentUser.type==='staff2';}
function isLoggedIn(){return !!_currentUser;}

/* 스태프 접근 가능 뷰 */
var STAFF_VIEWS=['dashboard','jobs','employment','calendar','employers','favorites','national'];
var STAFF2_VIEWS=['training'];

/* 개인정보 마스킹 */
function maskName(n){if(!n)return'***';return n[0]+'**';}
function maskPhone(p){if(!p)return'***-****-****';var m=p.replace(/[^0-9]/g,'');return m.slice(0,3)+'-****-'+m.slice(-4);}
function maskEmail(e){if(!e)return'***@***.***';var i=e.indexOf('@');return(i>1?e.slice(0,2):'*')+'***'+(i>=0?e.slice(i):'@***.***');}

/* 로그인 처리 */
function doLogin(type){
  var pw=document.getElementById('_login_pw');
  var err=document.getElementById('_login_err');
  if(!pw||!err)return;
  var val=pw.value.trim();
  if(val===_CREDS[type]){
    _currentUser={type:type};
    try{
      localStorage.setItem('sorizava_session',type);
      var cb=document.getElementById('_login_save_pw');
      if(cb&&cb.checked){localStorage.setItem('sorizava_pw_'+type,val);}
      else{localStorage.removeItem('sorizava_pw_'+type);}
    }catch(e){}
    document.getElementById('_login_screen').style.display='none';
    var _appEl=document.getElementById('app');_appEl.style.display='flex';_appEl.style.flexDirection='row';
    if(type==='staff')currentView='dashboard';
    if(type==='staff2')currentView='training';
    setView(currentView);
    showLoading();
    loadAllData().finally(hideLoading).then(function(){setupRealtime();});
  } else {
    err.textContent='비밀번호가 올바르지 않습니다.';
    err.style.display='block';
    pw.focus();pw.select();
  }
}
