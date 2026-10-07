'use strict';
/* 화면 전환 / 로그인 UI / 시작 */
function renderView(){
  _saveScrollPositions();
  var focusedId=document.activeElement?document.activeElement.id:null;
  var cursorPos=(document.activeElement&&typeof document.activeElement.selectionStart==='number')?document.activeElement.selectionStart:null;
  var main=$('_main');if(!main)return;
  try{
    if(currentView==='dashboard'){main.innerHTML=renderDashboard();setTimeout(initDashAnimations,60);}
    else if(currentView==='calendar')main.innerHTML=renderCalendar();
    else if(currentView==='insights')main.innerHTML=renderInsights();
    else if(currentView==='national'){main.innerHTML=renderNationalStatus();setTimeout(initNationalSVGMap,60);}
    else if(currentView==='identify')main.innerHTML=renderIdentifyStatus();
    else if(currentView==='inst_history')main.innerHTML=renderInstHistory();
    else if(currentView==='jobs')main.innerHTML=renderJobs();
    else if(currentView==='students')main.innerHTML=renderStudents();
    else if(currentView==='employment')main.innerHTML=renderEmployment();
    else if(currentView==='interview')main.innerHTML=renderInterviewRoom();
    else if(currentView==='employers'){main.innerHTML=renderEmployerDB();setTimeout(fixEmpTbl,0);}
    else if(currentView==='blacklist')main.innerHTML=renderBlacklist();
    else if(currentView==='favorites')main.innerHTML=renderFavorites();
    else if(currentView==='members')main.innerHTML=renderMemberSearch();
    
    else if(currentView==='training')main.innerHTML=renderTraining();
    else if(currentView==='trash')main.innerHTML=renderTrash();
  }catch(e){console.error('renderView error',e);main.innerHTML='<div style="padding:40px;text-align:center;color:#DC2626">렌더링 오류: '+(e.message||String(e))+'</div>';}
  var sb=$('_sidebar');if(sb)sb.outerHTML=renderSidebar();
  _restoreScrollPositions();
  var searchIds=['jobSearchInput','studentSearchInput','vaultSearchInput','trSearchInput','_memberSearchInput'];
  if(focusedId&&searchIds.indexOf(focusedId)>=0){requestAnimationFrame(function(){var el=$(focusedId);if(el){el.focus();if(cursorPos!==null){try{el.setSelectionRange(cursorPos,cursorPos);}catch(e){}}}});}
}
/* 날짜 입력칸: 연도를 4자리까지만 입력되게 (min/max가 없는 칸에 자동 적용) */
function _limitDateInputs(root){
  (root.querySelectorAll?root.querySelectorAll('input[type="date"]'):[]).forEach(function(el){
    if(!el.getAttribute('max'))el.setAttribute('max','2100-12-31');
    if(!el.getAttribute('min'))el.setAttribute('min','1900-01-01');
  });
}
new MutationObserver(function(muts){
  muts.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){if(n.matches&&n.matches('input[type="date"]'))_limitDateInputs(n.parentNode||n);else _limitDateInputs(n);}});});
}).observe(document.documentElement,{childList:true,subtree:true});
function setView(v){
  /* 스태프 접근 제한 */
  if(isStaff2()&&STAFF2_VIEWS.indexOf(v)<0)v='training';
  else if(isStaff()&&!isStaff2()&&STAFF_VIEWS.indexOf(v)<0)v='dashboard';
  _savedScrollTop=0;_savedTblScrollTop=0;currentView=v;
  $('app').innerHTML=renderSidebar()+'<main id="_main" style="flex:1;overflow:hidden;background:#FAFAF9;color:#0F172A;display:flex;flex-direction:column;min-height:0"></main>';
  renderView();
}

/* ── 로그인 UI 핸들러 ── */
var _loginRole='master';

/* 저장된 비밀번호 불러오기 */
function loadSavedPw(role){
  var pw=document.getElementById('_login_pw');
  var cb=document.getElementById('_login_save_pw');
  var clrBtn=document.getElementById('_login_clear_pw');
  var saved=null;
  try{saved=localStorage.getItem('sorizava_pw_'+role);}catch(e){}
  if(saved&&pw){
    pw.value=saved;
    if(cb)cb.checked=true;
    if(clrBtn)clrBtn.style.display='inline-flex';
  } else {
    if(pw)pw.value='';
    if(cb)cb.checked=false;
    if(clrBtn)clrBtn.style.display='none';
  }
}
function clearSavedPw(){
  try{localStorage.removeItem('sorizava_pw_master');localStorage.removeItem('sorizava_pw_staff');}catch(e){}
  var pw=document.getElementById('_login_pw');
  var cb=document.getElementById('_login_save_pw');
  var clrBtn=document.getElementById('_login_clear_pw');
  if(pw)pw.value='';
  if(cb)cb.checked=false;
  if(clrBtn)clrBtn.style.display='none';
}
function selectRole(r){
  _loginRole=r;
  var mb=document.getElementById('_login_role_master');
  var sb=document.getElementById('_login_role_staff');
  var s2b=document.getElementById('_login_role_staff2');
  var btns=[mb,sb,s2b];
  btns.forEach(function(b){
    if(!b)return;
    b.style.background='transparent';
    b.style.border='1.5px solid rgba(255,255,255,.1)';
    var sp=b.querySelector('span');var ic=b.querySelector('i');
    if(sp)sp.style.color='#94A3B8';
    if(ic)ic.style.color='#94A3B8';
  });
  var active=r==='master'?mb:r==='staff'?sb:s2b;
  var color=r==='master'?'#2563EB':r==='staff'?'#7C3AED':'#059669';
  var iconColor=r==='master'?'#60A5FA':r==='staff'?'#A78BFA':'#34D399';
  if(active){
    active.style.background='rgba('+( r==='master'?'37,99,235':r==='staff'?'124,58,237':'5,150,105')+',.15)';
    active.style.border='1.5px solid '+color;
    var sp=active.querySelector('span');var ic=active.querySelector('i');
    if(sp)sp.style.color='#fff';
    if(ic)ic.style.color=iconColor;
  }
  var err=document.getElementById('_login_err');
  if(err)err.style.display='none';
  var pw=document.getElementById('_login_pw');
  if(pw)pw.focus();
  loadSavedPw(r);
}
function doLogout(){
  _currentUser=null;
  try{localStorage.removeItem('sorizava_session');}catch(e){}
  var app=document.getElementById('app');
  var ls=document.getElementById('_login_screen');
  if(app)app.style.display='none';
  if(ls)ls.style.display='flex';
  var pw=document.getElementById('_login_pw');
  var err=document.getElementById('_login_err');
  if(pw)pw.value='';
  if(err)err.style.display='none';
  selectRole('master');
  setTimeout(function(){loadSavedPw('master');},50);
}

async function init(){
  /* 저장된 세션 확인 → 자동 로그인 */
  var saved=null;
  try{saved=localStorage.getItem('sorizava_session');}catch(e){}
  if(saved&&(saved==='master'||saved==='staff'||saved==='staff2')){
    _currentUser={type:saved};
    document.getElementById('_login_screen').style.display='none';
    var _appEl=document.getElementById('app');_appEl.style.display='flex';_appEl.style.flexDirection='row';
    var allowedViews=saved==='staff2'?STAFF2_VIEWS:saved==='staff'?STAFF_VIEWS:null;
    if(allowedViews&&allowedViews.indexOf(currentView)<0)currentView=saved==='staff2'?'training':'dashboard';
    setView(currentView);
    showLoading();
    try{await loadAllData();}finally{hideLoading();}
    setupRealtime();
  } else {
    document.getElementById('app').style.display='none';
    document.getElementById('_login_screen').style.display='flex';
  }
}
init();
