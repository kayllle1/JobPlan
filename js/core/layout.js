'use strict';
/* 사이드바 */
function renderSidebar(){
  var totalEmp=getEmpData('전체').length;
  var ivCount=JOBS.reduce(function(acc,j){return acc+j.applicants.filter(function(a){return a.status==='면접대기';}).length;},0);
  var vaultCount=VAULT.length;
  var _blCands=getBlacklistCandidates();
  var blTotal=_blCands.length+STUDENTS.filter(function(s){return s.restrictionLevel==='제한';}).length;
  var trTotalCnt=TR_PARTICIPANTS.length;

  function pill(txt,active){
    return'<span style="margin-left:auto;background:'+(active?'rgba(255,255,255,.2)':'rgba(255,255,255,.07)')+';color:'+(active?'#fff':'#94A3B8')+';padding:1px 8px;border-radius:99px;font-size:9px;font-weight:700;flex-shrink:0">'+txt+'</span>';
  }
  function badge2(id,active){
    if(isStaff())return'';
    if(id==='employment'&&totalEmp>0)return pill(totalEmp,active);
    if(id==='jobs'&&ivCount>0)return pill('면접 '+ivCount,active);
    if(id==='interview'&&vaultCount>0)return pill(vaultCount,active);
    if(id==='training'&&trTotalCnt>0)return pill(trTotalCnt,active);
    if(id==='blacklist'&&blTotal>0)return pill(blTotal>9?'9+':blTotal,active);
    if(id==='favorites'&&FAVORITES.length>0)return pill(FAVORITES.length,active);
    return'';
  }

  function navBtn(id,icon,label){
    var a=currentView===id;
    return'<button onclick="setView(\''+id+'\')" style="width:100%;text-align:left;padding:8px 11px;border-radius:9px;border:none;cursor:pointer;font-size:12.5px;font-weight:'+(a?700:500)+';background:'+(a?'rgba(96,165,250,.18)':'transparent')+';color:'+(a?'#7DD3FC':'#8194AA')+';margin-bottom:1px;display:flex;align-items:center;gap:9px;font-family:inherit;transition:background .12s,color .12s" onmouseover="this.style.background=\''+(a?'rgba(96,165,250,.18)':'rgba(255,255,255,.06)')+'\';this.style.color=\''+(a?'#7DD3FC':'#CBD5E1')+'\';" onmouseout="this.style.background=\''+(a?'rgba(96,165,250,.18)':'transparent')+'\';this.style.color=\''+(a?'#7DD3FC':'#8194AA')+'\';">'
      +(a?'<div style="width:2.5px;height:14px;border-radius:99px;background:#38BDF8;flex-shrink:0"></div>':'<div style="width:2.5px;height:14px;flex-shrink:0"></div>')
      +'<span style="font-size:14px;width:20px;text-align:center;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center">'+icon+'</span>'
      +'<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+label+'</span>'
      +badge2(id,a)
    +'</button>';
  }

  /* 섹션 헤더: 컬러 액센트 바 + 밝은 레이블 */
  function section(accentColor,label){
    return'<div style="display:flex;align-items:center;gap:7px;padding:16px 11px 6px;margin-top:2px">'
      +'<div style="width:14px;height:1.5px;border-radius:99px;background:'+accentColor+';flex-shrink:0"></div>'
      +'<span style="font-size:9.5px;font-weight:700;color:'+accentColor+';letter-spacing:.14em;text-transform:uppercase;opacity:.85">'+label+'</span>'
      +'<div style="flex:1;height:1px;background:rgba(255,255,255,.06)"></div>'
    +'</div>';
  }

  var navHtml='';
  if(isStaff2()){
    /* 연수팀: 연수관리만 */
    navHtml+=section('#A78BFA','도구')
      +navBtn('training','🎓','연수 관리');
  } else if(isStaff()){
    /* 상담팀: 연수관리 제외 */
    navHtml+=navBtn('dashboard','📊','대시보드')
      +section('#38BDF8','인사이트')
      +navBtn('calendar','📅','일정 캘린더')
      +navBtn('employers','🏢','취업처 관리')
      +section('#34D399','채용 관리')
      +navBtn('jobs','📋','공고관리')
      +navBtn('favorites','⭐','즐겨찾기')
      +navBtn('employment','🏆','취업 현황')
      +(isStaff()?'':navBtn('national','📊','지역 현황'));
  } else {
    navHtml+=navBtn('dashboard','📊','대시보드')
      +section('#38BDF8','인사이트')
      +navBtn('insights','✨','AI 브리핑')
      +navBtn('calendar','📅','일정 캘린더')
      +navBtn('employers','🏢','취업처 관리')
      +section('#34D399','채용 관리')
      +navBtn('jobs','📋','공고관리')
      +navBtn('students','👥','속기사 DB')
      +(!_isCounsel()&&!isStaff2()?navBtn('members','🔍','속기사 찾기'):'')
      +navBtn('favorites','⭐','즐겨찾기')
      +navBtn('employment','🏆','취업 현황')
      +navBtn('national','📊','지역 현황')
      +navBtn('inst_history','🏛️','기관별 채용 이력')
      +navBtn('identify','🔍','신원 확인 현황')
      +section('#A78BFA','도구')
      +navBtn('interview','📚','면접 자료실')
      +navBtn('training','🎓','연수 관리')
      +navBtn('blacklist','🚫','블랙리스트')
      +navBtn('trash','🗑️','휴지통');
  }

  return'<aside id="_sidebar" style="width:210px;background:#0C1524;display:flex;flex-direction:column;flex-shrink:0;box-shadow:2px 0 24px rgba(0,0,0,.35);border-right:1px solid rgba(255,255,255,.05)">'
    /* 로고 */
    +(isStaff()
      ?'<div style="padding:0;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center"><img src="data:image/png;base64,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" style="width:210px;height:78px;object-fit:cover;object-position:center" alt="한국AI속기사협회"></div>'
      :'<div style="padding:17px 15px 13px;border-bottom:1px solid rgba(255,255,255,.06)">'
        +'<p style="margin:0 0 4px;font-size:8.5px;color:#3B5068;font-weight:700;letter-spacing:.22em;text-transform:uppercase">SORIZAVA ACADEMY</p>'
        +'<div style="display:flex;align-items:baseline;gap:5px">'
          +'<span style="font-size:19px;font-weight:900;background:linear-gradient(135deg,#60A5FA,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1.2">Sorizava</span>'
          +'<span style="font-size:14px;font-weight:400;color:#3B5068">Archive</span>'
        +'</div>'
        +'<p style="margin:4px 0 0;font-size:9px;color:#2A3F52">v1.0 · Archive System</p>'
      +'</div>')
    /* 네비 */
    +'<nav style="flex:1;padding:8px 7px 6px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1E3347 transparent">'+navHtml+'</nav>'
    /* 하단 */
    +'<div style="padding:10px 14px 13px;border-top:1px solid rgba(255,255,255,.05)">'
      +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">'
        +'<span style="width:6px;height:6px;border-radius:50%;background:'+(_dbConnected?'#10B981':'#F59E0B')+';display:inline-block;box-shadow:0 0 6px '+(_dbConnected?'rgba(16,185,129,.5)':'rgba(245,158,11,.5)')+'"></span>'
        +'<span id="_conn_txt" style="font-size:10px;color:#3B5068;font-weight:600">'+(_dbConnected?'실시간 연동 활성':'연결 중...')+'</span>'
      +'</div>'
      +'<p style="margin:0;font-size:9.5px;color:#2A3F52">'+TODAY+' (KST)</p>'
      +(isStaff()?'<div style="margin-top:8px;padding:5px 8px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);border-radius:7px;font-size:10px;color:#FBBF24;font-weight:700">⚡ STAFF MODE</div>':'')
    +'</div>'
    +(isStaff()?_renderAgeSettingsPanel():'')
    +'<div style="padding:8px 10px 12px;border-top:1px solid rgba(255,255,255,.05)">'
      +'<button onclick="doLogout()" style="width:100%;display:flex;align-items:center;gap:8px;padding:8px 11px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:8px;color:#FCA5A5;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .12s" onmouseover="this.style.background=\'rgba(239,68,68,.2)\'" onmouseout="this.style.background=\'rgba(239,68,68,.1)\'"><i class="ti ti-logout" style="font-size:14px" aria-hidden="true"></i>로그아웃</button>'
    +'</div>'
  +'</aside>';
}
