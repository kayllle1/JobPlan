'use strict';
/* 대시보드 */
/* ─ 스마트 알림 ─ */
function getThisWeekInterviews(){
  var result=[],todayMs=new Date(TODAY).getTime(),weekMs=todayMs+7*86400000;
  JOBS.forEach(function(j){
    if(!j.interviewDate||j.isClosed)return;
    var d=new Date(String(j.interviewDate).slice(0,10)).getTime();
    if(d>=todayMs&&d<=weekMs){
      j.applicants.filter(function(a){return a.status==='면접대기';}).forEach(function(a){
        var st=STUDENTS.find(function(s){return s.id===a.studentId;});
        if(st)result.push({studentName:st.name,jobName:j.name,interviewDate:j.interviewDate,category:j.category});
      });
    }
  });
  return result;
}
function getLongPendingNoReply(){
  var result=[],todayMs=new Date(TODAY).getTime();
  JOBS.forEach(function(j){
    j.applicants.forEach(function(a){
      if(!a.interviewDocSent)return;
      var sentMs=new Date(String(a.interviewDocSent).slice(0,10)).getTime();
      var diff=Math.round((todayMs-sentMs)/86400000);
      if(diff>=7&&(a.interviewFeedback||'').indexOf('회신완료')<0){
        var st=STUDENTS.find(function(s){return s.id===a.studentId;});
        if(st)result.push({studentName:st.name,jobName:j.name,daysDiff:diff,category:j.category});
      }
    });
  });
  return result;
}
function renderSmartAlerts(){
  var interviews=getThisWeekInterviews();
  if(!interviews.length)return'';
  var ivHtml='<div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;padding:12px 14px">'
    +'<div style="font-size:11px;font-weight:800;color:#7C3AED;margin-bottom:8px">📅 이번 주 면접 예정자 ('+interviews.length+'명)</div>'
    +interviews.map(function(i){
      return'<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #EDE9FE;flex-wrap:wrap">'
        +'<span style="font-size:12px;font-weight:700;color:#1E293B">'+esc(i.studentName)+'</span>'
        +'<span style="font-size:10px;color:#7C3AED;background:#EDE9FE;padding:1px 6px;border-radius:4px">'+esc(i.category)+'</span>'
        +'<span style="font-size:11px;color:#64748B;flex:1;min-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(i.jobName.length>18?i.jobName.slice(0,18)+'…':i.jobName)+'</span>'
        +'<span style="margin-left:auto;font-size:11px;color:#7C3AED;font-weight:700;white-space:nowrap">'+fmt(i.interviewDate)+'</span>'
        +'</div>';
    }).join('')
    +'</div>';
  return'<div id="dash-alerts">'+ivHtml+'</div>';
}

/* ─ 대시보드 ─ */
function renderDashboard(){
  var allAps=JOBS.reduce(function(acc,j){return acc.concat(j.applicants);},[]);
  var active=JOBS.filter(function(j){return !j.isClosed;});
  var totalEmp=getEmpData('전체').length;
  var finalSids=JOBS.reduce(function(acc,j){return acc.concat(j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).map(function(a){return a.studentId;}));}, []);
  var todayEvents=JOBS.reduce(function(acc,j){
    if(j.isClosed)return acc;
    if(isToday(j.docDate))acc.push({jname:j.name,type:'서류접수',c:'#60A5FA'});
    if(isToday(j.documentPassDate))acc.push({jname:j.name,type:'서류합격발표',c:'#34D399'});
    if(isToday(j.interviewDate))acc.push({jname:j.name,type:'면접',c:'#A78BFA'});
    if(isToday(j.finalDate))acc.push({jname:j.name,type:'최종합격발표',c:'#FBBF24'});
    return acc;
  },[]);
  var activeSorted=sortByFinalDate(active);
  var ivWaitCount=allAps.filter(function(a){return a.status==='면접대기';}).length;
  var passCount=allAps.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length;
  var _now=new Date();

  var recentPassJobs=JOBS.filter(function(j){return j.applicants.some(function(a){return a.status==='최종합격'||a.status==='취업성공';});}).sort(function(a,b){return(b.finalDate||'').localeCompare(a.finalDate||'');}).slice(0,4);
  var urgentJobList=JOBS.filter(function(j){if(j.isClosed||!j.finalDate)return false;var d=Math.ceil((new Date(j.finalDate)-_now)/86400000);return d>=0&&d<=7;}).sort(function(a,b){return(a.finalDate||'').localeCompare(b.finalDate||'');});

  var kpiDefs=[
    {label:'전체 공고',val:JOBS.length,icon:'ti-file-text',accent:'#2563EB',ibg:'#EFF6FF',ic:'#2563EB',sub:'진행중 '+active.length+'건',id:'kpi0'},
    {label:'진행 중',val:active.length,icon:'ti-player-play',accent:'#059669',ibg:'#F0FDF4',ic:'#059669',sub:'전체 '+JOBS.length+'건 중',id:'kpi1'},
    {label:'전체 지원자',val:allAps.length,icon:'ti-users',accent:'#7C3AED',ibg:'#F5F3FF',ic:'#7C3AED',sub:'면접대기 '+ivWaitCount+'명',id:'kpi2'},
    {label:'취업 완료',val:totalEmp,icon:'ti-trophy',accent:'#D97706',ibg:'#FFFBEB',ic:'#D97706',sub:'최종합격 '+passCount+'명 포함',id:'kpi3'}
  ];
  var kpiHtml=kpiDefs.map(function(k){
    return'<div style="background:#fff;border:1px solid #E5E7EB;border-left:3px solid '+k.accent+';border-radius:12px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
      +'<div><div style="font-size:11px;font-weight:600;color:'+k.accent+';text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">'+k.label+'</div>'
      +'<div class="dk-num dk-num-anim" id="'+k.id+'" data-target="'+k.val+'" style="font-size:30px;font-weight:700;color:#0F172A;line-height:1;font-variant-numeric:tabular-nums">0</div>'
      +'<div style="font-size:12px;color:#94A3B8;margin-top:5px">'+k.sub+'</div></div>'
      +'<div style="width:44px;height:44px;border-radius:12px;background:'+k.ibg+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti '+k.icon+'" style="font-size:22px;color:'+k.ic+'"></i></div>'
    +'</div>';
  }).join('');

  var recentPassHtml='<div style="flex:1;min-width:240px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,.04)">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><div style="width:28px;height:28px;border-radius:8px;background:#F0FDF4;display:flex;align-items:center;justify-content:center"><i class="ti ti-trophy" style="font-size:15px;color:#059669"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">최근 합격 공고</span></div>'
    +(recentPassJobs.length===0?'<div style="text-align:center;padding:14px;color:#CBD5E1;font-size:12px">합격 공고 없음</div>'
      :recentPassJobs.map(function(j){var p=j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length;return'<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F1F5F9"><span style="font-size:12px;color:#1F2937;font-weight:500;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px">'+esc(j.name.length>22?j.name.slice(0,22)+'…':j.name)+'</span><span style="font-size:12px;font-weight:700;color:#059669;white-space:nowrap">✓ '+p+'명</span></div>';}).join(''))
  +'</div>';

  var urgentHtml='<div style="flex:1;min-width:240px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,.04)">'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><div style="width:28px;height:28px;border-radius:8px;background:#FFF1F2;display:flex;align-items:center;justify-content:center"><i class="ti ti-alarm" style="font-size:15px;color:#EF4444"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">마감 임박 <span style="font-size:11px;color:#EF4444">(7일 이내)</span></span></div>'
    +(urgentJobList.length===0?'<div style="text-align:center;padding:14px;color:#CBD5E1;font-size:12px">임박 공고 없음</div>'
      :urgentJobList.slice(0,4).map(function(j){var d=Math.ceil((new Date(j.finalDate)-_now)/86400000);var dc=d<=2?'#DC2626':d<=5?'#D97706':'#374151';var db=d<=2?'#FFF1F2':d<=5?'#FFFBEB':'#F8FAFC';return'<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F1F5F9"><span style="font-size:12px;color:#1F2937;font-weight:500;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px">'+esc(j.name.length>20?j.name.slice(0,20)+'…':j.name)+'</span><span style="background:'+db+';color:'+dc+';font-size:11px;font-weight:700;padding:2px 9px;border-radius:7px;white-space:nowrap">'+(d===0?'D-day':'D-'+d)+'</span></div>';}).join(''))
  +'</div>';

  var interviews=getThisWeekInterviews();
  var alertHtml='';
  if(!isStaff()&&interviews.length){
    alertHtml='<div style="padding:0 24px 8px;flex-shrink:0"><div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;padding:11px 14px"><div style="font-size:12px;font-weight:700;color:#7C3AED;margin-bottom:8px;display:flex;align-items:center;gap:6px"><i class="ti ti-calendar-event" style="font-size:14px"></i>이번 주 면접 예정자 ('+interviews.length+'명)</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+interviews.map(function(iv){return'<div style="display:flex;align-items:center;gap:5px;background:#EDE9FE;padding:4px 10px;border-radius:6px"><span style="font-size:12px;font-weight:600;color:#3B0764">'+esc(iv.studentName)+'</span><span style="font-size:11px;color:#7C3AED">'+esc(iv.jobName.length>14?iv.jobName.slice(0,14)+'…':iv.jobName)+'</span><span style="font-size:11px;color:#6D28D9;font-weight:600">'+fmt(iv.interviewDate)+'</span></div>';}).join('')+'</div></div></div>';
  }

  var _pd=getDashPeriod();var _pFrom=_pd.from,_pTo=_pd.to;
  function _inP(ds){var d=(ds||'').slice(0,10);return d>=_pFrom&&d<=_pTo;}
  var _activeJobs=JOBS.filter(function(j){return !j.isClosed;});
  var _totalRecruitKpi=_activeJobs.reduce(function(s,j){var n=Number(j.recruitmentCount);return s+(isNaN(n)?0:n);},0);
  var _pJobs=JOBS.filter(function(j){return _inP(j.docDate);});
  var _pAps=_pJobs.reduce(function(acc,j){return acc.concat(j.applicants);}, []);
  var _fJobs=JOBS.filter(function(j){return _inP(j.finalDate);});
  var _fPass=_fJobs.reduce(function(acc,j){return acc.concat(j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}));}, []);
  var _fFail=_fJobs.reduce(function(acc,j){return acc.concat(j.applicants.filter(function(a){return a.status==='불합격';}));}, []);
  var _passRate=_pAps.length>0?Math.round(_fPass.length/_pAps.length*100):0;
  var _pBtns=['today','week','month','prev'].map(function(m){var lb={today:'오늘',week:'이번 주',month:'이번 달',prev:'전월'}[m];var isSel=_dashPeriodMode===m;return'<button onclick="setDashPeriod(\''+m+'\')" class="dk-chip'+(isSel?' sel':'')+'" style="font-family:inherit;font-size:12px">'+lb+'</button>';}).join('');
  function _stat(ic,lbl,val,unit,sub,c){return'<div style="padding:12px 16px;min-width:90px"><div style="display:flex;align-items:center;gap:5px;margin-bottom:4px"><span style="font-size:14px">'+ic+'</span><span style="font-size:11px;font-weight:600;color:'+c+';letter-spacing:.04em">'+lbl+'</span></div><div style="font-size:24px;font-weight:700;color:#0F172A;line-height:1;font-variant-numeric:tabular-nums">'+val+'<span style="font-size:12px;font-weight:600;color:'+c+';margin-left:2px">'+unit+'</span></div>'+(sub?'<div style="font-size:11px;color:#94A3B8;margin-top:3px">'+sub+'</div>':'')+'</div>';}
  var _statDiv='<div style="width:1px;background:#E5E7EB;align-self:stretch;margin:2px 0"></div>';
  var _dashPH='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px"><div style="display:flex;align-items:center;gap:6px"><span style="width:3px;height:14px;background:linear-gradient(180deg,#3B82F6,#2563EB);border-radius:99px;display:inline-block"></span><span style="font-size:11px;font-weight:700;color:#3B82F6;letter-spacing:.1em;text-transform:uppercase">기간별 채용 현황</span></div><div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">'+_pBtns+'<div style="display:flex;align-items:center;gap:3px;border:0.5px solid '+(_dashPeriodMode==='custom'?'#93C5FD':'#E2E8F0')+';border-radius:7px;padding:3px 8px;background:'+(_dashPeriodMode==='custom'?'#EFF6FF':'#F8FAFC')+'"><input id="_dp_from" type="date" value="'+_pFrom+'" onchange="setDashPeriod(\'custom\',this.value,document.getElementById(\'_dp_to\').value)" style="border:none;background:transparent;font-size:11px;color:#1F2937;font-family:inherit;outline:none;cursor:pointer;width:102px"><span style="font-size:11px;color:#CBD5E1">—</span><input id="_dp_to" type="date" value="'+_pTo+'" onchange="setDashPeriod(\'custom\',document.getElementById(\'_dp_from\').value,this.value)" style="border:none;background:transparent;font-size:11px;color:#1F2937;font-family:inherit;outline:none;cursor:pointer;width:102px"></div><button onclick="setDashPeriod(\''+_dashPeriodMode+'\')" style="background:#1D4ED8;color:#fff;border:none;padding:5px 12px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">조회</button></div></div>'
    +'<div style="display:flex;align-items:center;flex-wrap:wrap;gap:0">'+_stat('📋','진행 공고',_activeJobs.length,'건','채용인원 '+_totalRecruitKpi+'명','#2563EB')+_statDiv+_stat('👤','기간 지원자',_pAps.length,'명','서류접수일 기준','#7C3AED')+_statDiv+_stat('🏆','최종 합격',_fPass.length,'명','불합격 '+_fFail.length+'명','#059669')+_statDiv+_stat('📈','합격률',_passRate,'%','지원 '+_pAps.length+'명 기준','#D97706')+'</div>';

  var mLabel=(function(){var p=selectedMonth.split('-');return p[0]+'년 '+parseInt(p[1])+'월';})();
  var _FIXED_CATS=_isCounsel()
    ?['법원','의회','국회','검찰청','공공기관','해바라기','사기업','대학교','기타','라이브콘텐츠','VOD','데이터속기사','현장속기사']
    :['법원','의회','국회','검찰청','공공기관','해바라기','팀벨','사기업','대학교','기타'];
  var _monthJobs=JSON.parse(JSON.stringify(JOBS)).filter(function(j){return parseDocMonth(j.docDate)===selectedMonth;});
  var _instMap={};_FIXED_CATS.forEach(function(c){_instMap[c]={total:0,jobs:[]};});
  _monthJobs.forEach(function(j){
    var _validCats=_isCounsel()?['법원','의회','국회','검찰청','공공기관','해바라기','사기업','대학교','기타']:_FIXED_CATS.slice(0,9);
    var cat=(_validCats.indexOf(j.category||'기타')>=0)?j.category:'기타';
    var cnt=Number(j.recruitmentCount)||0;
    if(_instMap[cat]){_instMap[cat].total+=cnt;_instMap[cat].jobs.push({name:j.name,count:cnt});}
  });
  /* 상담팀: 프리랜서 월별 데이터 추가 */
  if(_isCounsel()){
    var _mData=_COUNSEL_MONTHLY[selectedMonth]||{};
    /* 현재 월이면 경과 일수 비례 계산 */
    if(_mData==='dynamic'||selectedMonth===getKSTDateString().slice(0,7)){
      var _now2=new Date();
      var _dayElapsed=_now2.getDate();
      var _daysInMonth=new Date(_now2.getFullYear(),_now2.getMonth()+1,0).getDate();
      var _ratio=_dayElapsed/_daysInMonth;
      var _base={라이브콘텐츠:12,VOD:44,데이터속기사:12,현장속기사:8};
      _mData={};
      Object.keys(_base).forEach(function(k){_mData[k]=Math.max(1,Math.round(_base[k]*_ratio));});
    }
    ['라이브콘텐츠','VOD','데이터속기사','현장속기사'].forEach(function(cat){
      var n=_mData[cat]||0;
      if(n>0){
        _instMap[cat].total+=n;
        _instMap[cat].jobs.push({name:cat+' 속기사',count:n});
      }
    });
  }
  var _instEntries=_FIXED_CATS.slice();var _totalRecruit=_instEntries.reduce(function(s,k){return s+_instMap[k].total;},0);
  var selDetail='';
  if(_dashInstSel&&_instMap[_dashInstSel]){var sd=_instMap[_dashInstSel];var cc=CAT_COLORS[_dashInstSel]||'#2563EB';var jlHtml=sd.jobs.filter(function(j){return j.name;}).map(function(j){return'<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-bottom:0.5px solid #F8FAFC;font-size:12px"><span style="color:#1F2937;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:10px">'+esc(j.name.length>34?j.name.slice(0,34)+'…':j.name)+'</span><span style="font-weight:600;color:'+cc+';white-space:nowrap">'+j.count+'명</span></div>';}).join('');selDetail='<div style="margin-top:10px;background:'+cc+'08;border:0.5px solid '+cc+'25;border-radius:10px;overflow:hidden"><div style="padding:11px 14px;background:'+cc+'10;border-bottom:0.5px solid '+cc+'20;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:8px"><div style="font-size:14px;font-weight:500;color:#0F172A">'+esc(_dashInstSel)+'</div><div style="font-size:13px;font-weight:600;color:'+cc+'">총 '+sd.total+'명</div></div><button onclick="setDashInstSel(\''+_dashInstSel+'\')" style="border:none;background:#F1F5F9;color:#64748B;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit">✕ 닫기</button></div>'+(jlHtml?'<div style="max-height:130px;overflow-y:auto">'+jlHtml+'</div>':'<div style="padding:14px;text-align:center;color:#94A3B8;font-size:12px">이번 달 공고 없음</div>')+'</div>';}
  var chipsHtml=_instEntries.map(function(k){var cc=CAT_COLORS[k]||'#6B7280';var isSel=_dashInstSel===k;var hasData=_instMap[k].total>0;var cs=isSel?'background:'+cc+';border-color:'+cc+';color:#fff;box-shadow:0 2px 6px '+cc+'40;':hasData?'border-color:'+cc+'40;color:'+cc+';background:'+cc+'08;':'border-color:#E2E8F0;color:#CBD5E1;background:#F8FAFC;';return'<button onclick="setDashInstSel(\''+k+'\')" class="dk-chip'+(isSel?' sel':'')+'" style="'+cs+'font-family:inherit;font-size:12px">'+esc(k)+' <span style="font-size:12px;font-weight:700">'+_instMap[k].total+'</span></button>';}).join('');

  var eventContent=todayEvents.length===0?'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px"><i class="ti ti-calendar-off" style="font-size:30px;color:#E2E8F0"></i><span style="font-size:13px;color:#94A3B8">오늘 예정된 일정 없음</span></div>':todayEvents.map(function(ev){return'<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:0.5px solid #F1F5F9"><div style="width:6px;height:6px;border-radius:50%;background:'+ev.c+';flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;color:#0F172A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(ev.jname.length>18?ev.jname.slice(0,18)+'…':ev.jname)+'</div></div><span style="font-size:11px;font-weight:500;padding:2px 8px;border-radius:5px;background:'+ev.c+'18;color:'+ev.c+';white-space:nowrap">'+ev.type+'</span></div>';}).join('');

  var activeContent=activeSorted.length===0?'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px"><i class="ti ti-file-off" style="font-size:30px;color:#E2E8F0"></i><span style="font-size:13px;color:#94A3B8">진행 중인 공고 없음</span></div>':activeSorted.map(function(j){var dd=j.finalDate?Math.ceil((new Date(j.finalDate)-_now)/86400000):-1;var dc=dd>=0&&dd<=3?'#DC2626':dd>=0&&dd<=7?'#D97706':'#94A3B8';return'<div style="display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:0.5px solid #F1F5F9">'+badge(j.category)+'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:500;color:#0F172A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(j.name.length>16?j.name.slice(0,16)+'…':j.name)+'</div></div><span style="font-size:11px;color:'+dc+';white-space:nowrap;font-weight:500">'+(dd>=0?'D-'+dd:j.applicants.length+'명')+'</span></div>';}).join('');

  return'<div id="dash-root" style="display:flex;flex-direction:column;height:100%;overflow-y:auto;background:#FAFAF9;padding-bottom:8px">'
  +'<div style="padding:16px 24px 10px;flex-shrink:0">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">'
      +'<div><div style="display:flex;align-items:center;gap:8px;margin-bottom:2px"><span style="width:3px;height:18px;background:linear-gradient(180deg,#3B82F6,#7C3AED);border-radius:99px;display:inline-block;flex-shrink:0"></span><p style="margin:0;font-size:11px;color:#3B82F6;font-weight:700;letter-spacing:.15em;text-transform:uppercase">'+(_isCounsel()?'한국AI속기사협회 채용 시스템':'SORIZAVA ARCHIVE')+'</p></div><h2 style="margin:0 0 2px 11px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-.03em">대시보드</h2><p style="margin:0 0 0 11px;font-size:12px;color:#64748B">'+TODAY+' KST · 실시간 채용 현황</p></div>'
      +(isStaff()?'':'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button onclick="showMonthlyReport()" style="background:#7C3AED;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(124,58,237,.25)">📊 월별 보고서</button>'+(totalEmp>0?'<button onclick="setView(\'employment\')" style="background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(5,150,105,.25)">🏆 취업현황 <span style="font-size:11px;background:rgba(255,255,255,.25);padding:1px 7px;border-radius:99px">'+totalEmp+'명</span></button>':'')+'</div>')
    +'</div>'
  +'</div>'
  +(isStaff()
    ?'<div style="padding:10px 24px 4px;display:flex;gap:12px;flex-wrap:wrap;flex-shrink:0">'+recentPassHtml+urgentHtml+'</div>'
    :'<div class="dk-kpi" style="padding-top:4px">'+kpiHtml+'</div><div style="padding:10px 24px 4px;display:flex;gap:12px;flex-wrap:wrap;flex-shrink:0">'+recentPassHtml+urgentHtml+'</div>'
  )
  +(isStaff()?'':alertHtml)
  +'<div class="dk-monthly"><div class="dk-monthly-bar" style="flex-direction:column;align-items:stretch">'+_dashPH+'</div></div>'
  +'<div class="dk-recruit" style="margin-top:10px"><div style="background:#fff;border-radius:12px;border:1px solid #E5E7EB;padding:13px 18px;box-shadow:0 1px 4px rgba(0,0,0,.04)"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:8px;background:#EFF6FF;display:flex;align-items:center;justify-content:center"><i class="ti ti-chart-bar" style="font-size:14px;color:#2563EB"></i></div><div><div style="font-size:13px;font-weight:600;color:#0F172A">'+mLabel+' 기관별 채용 인원</div><div style="font-size:11px;color:#94A3B8;margin-top:1px">서류 접수일 기준</div></div></div><div style="display:flex;align-items:center;gap:6px">'+(_totalRecruit>0?'<span style="background:#EFF6FF;color:#1D4ED8;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600">총 '+_totalRecruit+'명 예정</span>':'')+'<span style="color:#94A3B8;font-size:12px">공고 '+_monthJobs.length+'건</span></div></div><div id="dash-rec-content"><div style="display:flex;flex-wrap:wrap;gap:6px">'+chipsHtml+'</div>'+selDetail+'</div></div></div>'
  +(isStaff()
    /* ── 스태프: 상단 2열 + 하단 전폭 ── */
    ?'<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 360px;gap:14px;padding:12px 22px 24px;flex-shrink:0">'
      /* 최종합격자 연령대 */
      +'<div class="dk-grid-card"><div class="dk-grid-head"><div style="width:24px;height:24px;border-radius:7px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-users" style="font-size:13px;color:#059669"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">최종합격자 연령대</span><span style="margin-left:auto;background:#F0FDF4;color:#059669;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">'+(_isCounsel()?'🗓 2026년 1월~현재 누적':'합격 '+finalSids.length+'명')+'</span></div><div class="dk-grid-body" style="flex:1;overflow:hidden">'+(_isCounsel()?renderAgeInfographicCounsel():renderAgeInfographic(finalSids))+'</div></div>'/* 오늘의 주요 일정 */
      +'<div class="dk-grid-card"><div class="dk-grid-head"><div style="width:24px;height:24px;border-radius:7px;background:#FFFBEB;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-calendar" style="font-size:13px;color:#B45309"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">오늘의 주요 일정</span>'+(todayEvents.length>0?'<span style="margin-left:auto;background:#FEF3C7;color:#B45309;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">'+todayEvents.length+'건</span>':'')+'</div><div class="dk-grid-body" style="min-height:160px">'+eventContent+'</div></div>'
      
      /* 진행 중인 공고 — 2열 전폭 */
      +'<div class="dk-grid-card" style="grid-column:1/-1"><div class="dk-grid-head"><div style="width:24px;height:24px;border-radius:7px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-file-text" style="font-size:13px;color:#2563EB"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">진행 중인 공고</span><span style="font-size:12px;color:#94A3B8;margin-left:4px">임박순</span><span style="margin-left:auto;background:#EFF6FF;color:#1D4ED8;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">'+active.length+'건</span></div>'
        +'<div style="padding:12px 16px;overflow-y:auto;flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;align-content:start">'+activeSorted.map(function(j){var dd=j.finalDate?Math.ceil((new Date(j.finalDate)-_now)/86400000):-1;var dc=dd>=0&&dd<=3?'#DC2626':dd>=0&&dd<=7?'#D97706':'#94A3B8';var bg=dd>=0&&dd<=3?'#FCEBEB':dd>=0&&dd<=7?'#FFFBEB':'#F8FAFC';return'<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#F8FAFC;border-radius:8px;border:0.5px solid #E2E8F0">'+badge(j.category)+'<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500;color:#0F172A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(j.name.length>18?j.name.slice(0,18)+'…':j.name)+'</div>'+(_isCounsel()?'':'<div style="font-size:11px;color:#94A3B8;margin-top:1px">지원자 '+j.applicants.length+'명</div>')+'  </div>'+(dd>=0?'<span style="font-size:11px;font-weight:600;color:'+dc+';background:'+bg+';padding:2px 7px;border-radius:6px;white-space:nowrap;flex-shrink:0">'+(dd===0?'D-day':'D-'+dd)+'</span>':'')+'</div>';}).join('')+'</div>'
      +'</div>'
    +'</div>'
    /* ── 마스터: 2×2 그리드 ── */
    :'<div class="dk-4grid">'
      /* 카드1: 오늘의 주요 일정 */
      +'<div class="dk-grid-card"><div class="dk-grid-head"><div style="width:24px;height:24px;border-radius:7px;background:#FFFBEB;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-calendar" style="font-size:13px;color:#B45309"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">오늘의 주요 일정</span>'+(todayEvents.length>0?'<span style="margin-left:auto;background:#FEF3C7;color:#B45309;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">'+todayEvents.length+'건</span>':'')+'</div><div class="dk-grid-body" style="min-height:180px">'+eventContent+'</div></div>'
      /* 카드2: 지원 진행 상태 */
      +'<div class="dk-grid-card"><div class="dk-grid-head"><div style="width:24px;height:24px;border-radius:7px;background:#F5F3FF;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-chart-donut" style="font-size:13px;color:#7C3AED"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">지원 진행 상태</span><span style="margin-left:auto;background:#F5F3FF;color:#7C3AED;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">전체 '+allAps.length+'건</span></div><div class="dk-grid-body">'+renderStatusInfographicDark(allAps)+'</div></div>'
      /* 카드3: 진행 중인 공고 */
      +'<div class="dk-grid-card"><div class="dk-grid-head"><div style="width:24px;height:24px;border-radius:7px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-file-text" style="font-size:13px;color:#2563EB"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">진행 중인 공고</span><span style="font-size:12px;color:#94A3B8;margin-left:4px">임박순</span><span style="margin-left:auto;background:#EFF6FF;color:#1D4ED8;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">'+active.length+'건</span></div><div class="dk-grid-body" style="flex:1;overflow-y:auto;min-height:0">'+activeContent+'</div></div>'
      /* 카드4: 최종합격자 연령대 */
      +'<div class="dk-grid-card"><div class="dk-grid-head"><div style="width:24px;height:24px;border-radius:7px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-users" style="font-size:13px;color:#059669"></i></div><span style="font-size:13px;font-weight:600;color:#0F172A">최종합격자 연령대</span><span style="margin-left:auto;background:#F0FDF4;color:#059669;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">합격 '+finalSids.length+'명</span></div><div class="dk-grid-body" style="flex:1;overflow:hidden">'+renderAgeInfographic(finalSids)+'</div></div>'
    +'</div>'
  )
+'</div>';
}

/* ── 지원 상태 인포그래픽 (다크 테마) ── */
function renderStatusInfographicDark(allAps){
  var total=allAps.length;
  if(!total)return'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:12px"><span style="font-size:48px;opacity:.3">📊</span><span style="font-size:14px;font-weight:700;color:#64748B">지원 데이터 없음</span></div>';
  var PAL={'서류접수':{bg:'#94A3B8'},'서류합격':{bg:'#3B82F6'},'면접대기':{bg:'#FBBF24'},'최종합격':{bg:'#10B981'},'취업성공':{bg:'#34D399'},'불합격':{bg:'#F87171'},'예비합격':{bg:'#14B8A6'},'지원철회':{bg:'#64748B'},'면접불참':{bg:'#F97316'},'합격포기':{bg:'#78716C'}};
  var items=STATUSES.map(function(s){var p=PAL[s]||{bg:'#94A3B8'};return{s:s,bg:p.bg,cnt:allAps.filter(function(a){return a.status===s;}).length};}).filter(function(x){return x.cnt>0;});
  var barSegs=items.map(function(x){var pct=(x.cnt/total*100);var sf=pct>=18,sn=pct>=9;return'<div style="width:'+pct.toFixed(2)+'%;background:'+x.bg+';display:flex;flex-direction:column;align-items:center;justify-content:center;transition:all .3s" title="'+x.s+': '+x.cnt+'명">'+(sf?'<span style="font-size:20px;font-weight:900;color:#fff;line-height:1.1">'+x.cnt+'</span><span style="font-size:12px;font-weight:700;color:rgba(255,255,255,.85)">'+pct.toFixed(0)+'%</span>':sn?'<span style="font-size:15px;font-weight:900;color:#fff">'+x.cnt+'</span>':'')+'</div>';}).join('');
  var legendHtml=items.map(function(x){var pct=(x.cnt/total*100).toFixed(1);return'<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#F8FAFC;border-radius:8px;border:1px solid #F1F5F9"><span style="width:10px;height:10px;border-radius:3px;background:'+x.bg+';flex-shrink:0"></span><span style="font-size:12px;color:#64748B;flex:1">'+x.s+'</span><span style="font-size:16px;font-weight:900;color:#0F172A">'+x.cnt+'</span><span style="font-size:12px;color:#64748B;margin-left:2px">'+pct+'%</span></div>';}).join('');
  var passCount=items.filter(function(x){return x.s==='최종합격'||x.s==='취업성공';}).reduce(function(s,x){return s+x.cnt;},0);
  var passRate=total>0?Math.round(passCount/total*100):0;
  return'<div style="display:flex;height:60px;border-radius:10px;overflow:hidden;flex-shrink:0;box-shadow:0 1px 6px rgba(0,0,0,.1)">'+barSegs+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;flex:1;align-content:start">'+legendHtml+'</div><div style="margin-top:10px;padding:10px 14px;background:linear-gradient(135deg,#EFF6FF,#F0FDF4);border-radius:10px;border:1px solid #BFDBFE;display:flex;gap:0;flex-shrink:0"><div style="flex:1;text-align:center;border-right:1px solid #DBEAFE;padding-right:10px"><p style="margin:0;font-size:12px;color:#6B7280;font-weight:700">총 지원</p><p style="margin:2px 0 0;font-size:24px;font-weight:900;color:#0F172A;line-height:1">'+total+'<span style="font-size:12px;color:#64748B;font-weight:500;margin-left:2px">건</span></p></div><div style="flex:1;text-align:center;border-right:1px solid #DBEAFE;padding:0 10px"><p style="margin:0;font-size:12px;color:#6B7280;font-weight:700">취업성사</p><p style="margin:2px 0 0;font-size:24px;font-weight:900;color:#059669;line-height:1">'+passCount+'<span style="font-size:12px;color:#64748B;font-weight:500;margin-left:2px">명</span></p></div><div style="flex:1;text-align:center;padding-left:10px"><p style="margin:0;font-size:12px;color:#6B7280;font-weight:700">합격률</p><p style="margin:2px 0 0;font-size:24px;font-weight:900;color:#2563EB;line-height:1">'+passRate+'<span style="font-size:12px;color:#64748B;font-weight:500;margin-left:1px">%</span></p></div></div>';
}

/* ── 지도 필터 설정 ── */
function setMapLocationFilter(loc){
  _dashMapLocation=(_dashMapLocation===loc)?null:loc;
  jobFilter.location=_dashMapLocation||'';
  renderView();
}

/* ── 대시보드 카운트업 + 지도 초기화 ── */
function initDashAnimations(){
  /* Count-up for KPI cards */
  document.querySelectorAll('.dk-num[data-target]').forEach(function(el){
    var target=parseInt(el.getAttribute('data-target'))||0;
    if(!target){el.textContent='0';return;}
    var duration=Math.min(1200,400+target*2);
    var startTime=performance.now();
    var ease=function(t){return 1-Math.pow(1-t,3);};
    (function tick(now){
      var elapsed=now-startTime;
      var progress=Math.min(elapsed/duration,1);
      el.textContent=Math.round(target*ease(progress));
      if(progress<1)requestAnimationFrame(tick);
    })(startTime);
  });
}

/* ── ECharts 3D 대한민국 지도 ── */
function initKoreaMap(){
  var mapDom=document.getElementById('korea-map-3d');
  if(!mapDom)return;
  if(typeof echarts==='undefined'){
    showMapFallback(mapDom);
    return;
  }
  /* Dispose previous instance */
  if(_mapChartInstance){try{_mapChartInstance.dispose();}catch(e){}   _mapChartInstance=null;}

  function buildChart(geoJSON){
    try{
      var mapData=geoJSON;
      /* 속성 이름 정규화 */
      if(mapData&&mapData.features){
        mapData.features.forEach(function(f){
          if(!f.properties)f.properties={};
          var n=f.properties.name||f.properties.NAME||f.properties.CTP_KOR_NM||f.properties.NAME_1||'';
          f.properties.name=n;
        });
      }
      echarts.registerMap('korea_adm',mapData);
    }catch(e){console.warn('registerMap error',e);}
    var chart=echarts.init(mapDom,null,{renderer:'canvas'});
    _mapChartInstance=chart;
    applyMapOption(chart,geoJSON);
    chart.on('click',function(params){
      if(params.componentType!=='series')return;
      var gName=params.name;
      var loc=geoNameToLoc(gName);
      if(!loc)return;
      _dashMapLocation=(_dashMapLocation===loc)?null:loc;
      jobFilter.location=_dashMapLocation||'';
      applyMapOption(chart,geoJSON);
      /* 지역 칩 UI 업데이트 */
      document.querySelectorAll('.dk-chip').forEach(function(el){
        var txt=el.textContent.trim().split(' ')[0];
        if(_dashMapLocation&&txt===_dashMapLocation){el.classList.add('sel','gold');}
        else{el.classList.remove('sel','gold');}
      });
      /* 폴백 탭 UI 업데이트 */
      document.querySelectorAll('.map-fallback-tab').forEach(function(el){
        var txt=el.getAttribute('data-loc');
        if(_dashMapLocation&&txt===_dashMapLocation){el.classList.add('sel');}
        else{el.classList.remove('sel');}
      });
      /* 필터 해제 버튼 업데이트 */
      var head=document.querySelector('.dk-map-head');
      if(head){
        var oldBtn=head.querySelector('#map-clear-btn');
        if(oldBtn)oldBtn.remove();
        if(_dashMapLocation){
          var btn2=document.createElement('button');
          btn2.id='map-clear-btn';
          btn2.setAttribute('onclick','setMapLocationFilter(null)');
          btn2.style.cssText='background:#FFFBEB;color:#D97706;border:1px solid #FCD34D;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit';
          btn2.textContent='✕ '+_dashMapLocation+' 필터 해제';
          var rightDiv=head.querySelector('div:last-child');
          if(rightDiv)rightDiv.prepend(btn2);
        }
      }
    });
    window.addEventListener('resize',function(){if(chart&&!chart.isDisposed())chart.resize();});
  }

  function applyMapOption(chart,geoJSON){
    /* 지역별 공고 수 집계 */
    var locCounts={};
    LOCATIONS.forEach(function(l){locCounts[l]=JOBS.filter(function(j){return j.location===l;}).length;});
    var maxCnt=Math.max.apply(null,Object.values(locCounts).concat([1]));

    /* 모든 GeoJSON 지역에 대한 데이터 생성 */
    var allGeoNames=[];
    if(geoJSON&&geoJSON.features){
      geoJSON.features.forEach(function(f){
        var name=(f.properties&&(f.properties.name||f.properties.CTP_KOR_NM||f.properties.NAME_1))||'';
        if(name)allGeoNames.push(name);
      });
    }

    var seriesData=allGeoNames.map(function(gName){
      var loc=geoNameToLoc(gName);
      var cnt=loc?(locCounts[loc]||0):0;
      var isSel=_dashMapLocation&&loc===_dashMapLocation;
      var isMapped=!!loc&&LOCATIONS.indexOf(loc)>=0;
      var baseH=isMapped?(2+Math.round(cnt/maxCnt*5)):1.5;
      var h=isSel?12:baseH;
      var itemColor=isSel?'#F59E0B':isMapped&&cnt>0?'#1D4ED8':isMapped?'#93C5FD':'#DBEAFE';
      return{
        name:gName,
        value:cnt,
        regionHeight:h,
        itemStyle:{
          color:itemColor,
          opacity:isMapped?1:0.8
        },
        label:{show:isMapped&&(cnt>0||isSel),formatter:function(p){var l=geoNameToLoc(p.name);return l||'';},textStyle:{color:isSel?'#fff':'#fff',fontSize:10,fontWeight:'bold'}}
      };
    });

    chart.setOption({
      backgroundColor:'transparent',
      series:[{
        type:'map3D',
        map:'korea_adm',
        boxWidth:92,
        boxHeight:14,
        regionHeight:2,
        shading:'lambert',
        light:{
          main:{intensity:2.2,shadow:true,shadowQuality:'high',alpha:45,beta:35},
          ambient:{intensity:0.7},
          ambientCubemap:{diffuseIntensity:0.6}
        },
        viewControl:{
          distance:88,alpha:38,beta:3,
          rotateSensitivity:0.7,zoomSensitivity:0.8,panSensitivity:0,
          panMouseButton:'right',rotateMouseButton:'left',
          animationDurationUpdate:700,animationEasingUpdate:'cubicOut'
        },
        itemStyle:{color:'#BFDBFE',opacity:1,borderWidth:1,borderColor:'rgba(59,130,246,.4)'},
        emphasis:{
          itemStyle:{color:'#F59E0B',opacity:1,borderWidth:1.5,borderColor:'#D97706'},
          label:{show:true,textStyle:{color:'#fff',fontWeight:'bold',fontSize:13,textBorderColor:'#1E293B',textBorderWidth:2}}
        },
        label:{show:false},
        data:seriesData,
        animation:true,
        animationDurationUpdate:600,
        animationEasingUpdate:'cubicOut'
      }]
    },true);
  }

  function showMapFallback(dom){
    var locCounts={};
    LOCATIONS.forEach(function(l){locCounts[l]=JOBS.filter(function(j){return j.location===l;}).length;});
    var tabs=LOCATIONS.map(function(loc){
      var cnt=locCounts[loc]||0;
      var isSel=_dashMapLocation===loc;
      return'<button class="map-fallback-tab'+(isSel?' sel':'')+'" data-loc="'+loc+'" onclick="setMapLocationFilter(\''+loc+'\')">'+loc+' <span style="font-weight:900">'+cnt+'</span></button>';
    }).join('');
    dom.innerHTML='<div style="padding:20px 16px"><p style="margin:0 0 12px;font-size:11px;color:#64748B;font-weight:600">📍 지역별 공고 현황 (지도 로딩 불가 — 탭으로 필터링)</p><div style="display:flex;flex-wrap:wrap;gap:8px">'+tabs+'</div></div>';
  }

  /* 인라인 GeoJSON 직접 사용 — 외부 fetch 불필요 */
  if(!_mapGeoJSON){
    try{
      var gj=JSON.parse(JSON.stringify(KOREA_MAP_DATA));/* deep-clone */
      /* name 속성 정규화 (이미 한국어 이름으로 세팅됨) */
      if(gj&&gj.features){
        gj.features.forEach(function(f){
          if(!f.properties)f.properties={};
          f.properties.name=f.properties.name||'';
        });
      }
      _mapGeoJSON=gj;
    }catch(e){
      console.warn('GeoJSON init error',e);
      showMapFallback(mapDom);
      return;
    }
  }
  buildChart(_mapGeoJSON);
}
