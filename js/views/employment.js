'use strict';
/* 취업 현황 */
/* ─ 취업 현황 ─ */
function getEmpData(cat){
  var _PAST={'2020':EMP_2020,'2021':EMP_2021,'2022':EMP_2022,'2023':EMP_2023,'2024':EMP_2024,'2025':EMP_2025};
  if(_PAST[empYear]){
    var _isPubEmp=_isCounsel()&&cat==='공공기관';var d=_PAST[empYear].filter(function(r){if(cat==='전체')return true;if(_isPubEmp)return _PUBLIC_CATS&&_PUBLIC_CATS.indexOf(r.category)>=0;return r.category===cat;});
    if(isStaff()){d=d.map(function(r){return Object.assign({},r,{name:maskName(r.name),phone:maskPhone(r.phone),email:maskEmail(r.email)});});}
    return d;
  }
  var result=[];
  JOBS.forEach(function(j){
    var _isPubJ=_isCounsel()&&cat==='공공기관';if(cat!=='전체'){if(_isPubJ){if(!_PUBLIC_CATS||_PUBLIC_CATS.indexOf(j.category)<0)return;}else{if(j.category!==cat)return;}}
    j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).forEach(function(a){
      var st=STUDENTS.find(function(s){return s.id===a.studentId;});
      result.push({name:st?(isStaff()?maskName(st.name):st.name):'(삭제된 학생)',phone:st?(isStaff()?maskPhone(st.phone||''):st.phone||'-'):'-',email:st?(isStaff()?maskEmail(st.email||''):st.email||'-'):'-',jobName:j.name,category:j.category,finalDate:j.finalDate||'',grade:a.grade||'-',memo:a.memo||'',jobType:j.type||''});
    });
  });
  result.sort(function(a,b){return (b.finalDate||'').localeCompare(a.finalDate||'');});
  return result;
}
function setEmpCat(cat){empCat=cat;renderView();}

function _empTabSwitch(t){
  var t1=document.getElementById('_etab1');
  var t2=document.getElementById('_etab2');
  var b1=document.getElementById('_et1');
  var b2=document.getElementById('_et2');
  if(!t1||!t2||!b1||!b2)return;
  t1.style.display=t===1?'block':'none';
  t2.style.display=t===2?'block':'none';
  b1.classList.toggle('on',t===1);
  b2.classList.toggle('on',t===2);
}

function openEmpCompare(){
  var _PAST={'2020':EMP_2020,'2021':EMP_2021,'2022':EMP_2022,'2023':EMP_2023,'2024':EMP_2024,'2025':EMP_2025};
  var compareYear=empYear!=='2026'?empYear:'2025';
  var dA=_PAST[compareYear]||[];
  var d26=getEmpDataRaw();
  var CATS=['법원','의회','검찰청','공공기관','해바라기','팀벨','사기업','대학교','기타'];
  var GRADES=['1급','2급','3급','미취득'];
  var ALL_YEARS=['2020','2021','2022','2023','2024','2025','2026'];
  var YEAR_COLORS=['#60A5FA','#34D399','#FBBF24','#FB923C','#F472B6','#A78BFA','#2563EB'];

  function cnt(d,key,val){return d.filter(function(r){return r[key]===val;}).length;}

  /* ── 탭1: 비교 연도 vs 2026 ── */
  var tA=dA.length, t26=d26.length, diff=t26-tA;
  var pct=tA?Math.round(diff/tA*1000)/10:0;
  var up=diff>0, dn=diff<0;
  var dCol=up?'#059669':dn?'#DC2626':'#64748B', dBg=up?'#ECFDF5':dn?'#FEF2F2':'#F1F5F9';
  var C_A='#A5B4FC', C_B='#4338CA';   /* 비교 연도 / 2026 */

  function deltaPill(d,big){
    var c=d>0?'#059669':d<0?'#DC2626':'#64748B', b=d>0?'#ECFDF5':d<0?'#FEF2F2':'#F1F5F9';
    var ic=d>0?'ti-trending-up':d<0?'ti-trending-down':'ti-minus';
    return'<span class="ec-pill" style="color:'+c+';background:'+b+(big?';font-size:13px;padding:4px 10px':'')+'"><i class="ti '+ic+'"></i>'+(d>0?'+':'')+d+'</span>';
  }

  var hero='<div class="ec-hero">'
    +'<div class="ec-hero-yr"><span class="ec-dot" style="background:'+C_A+'"></span><div><div class="ec-lbl">'+compareYear+'년</div><div class="ec-num">'+tA+'<small>명</small></div></div></div>'
    +'<i class="ti ti-arrow-right ec-arrow"></i>'
    +'<div class="ec-hero-yr"><span class="ec-dot" style="background:'+C_B+'"></span><div><div class="ec-lbl">2026년</div><div class="ec-num">'+t26+'<small>명</small></div></div></div>'
    +'<div class="ec-hero-diff" style="background:'+dBg+';color:'+dCol+'"><div class="ec-lbl" style="color:'+dCol+'">전년 대비</div><div class="ec-num" style="color:'+dCol+'">'+(diff>0?'+':'')+diff+'<small>명</small></div><div style="font-size:12px;font-weight:700">'+(tA?(pct>0?'+':'')+pct+'%':'')+'</div></div>'
  +'</div>';

  /* 많이 늘어난 곳 / 줄어든 곳 */
  var catDiffs=CATS.map(function(k){return{k:k,a:cnt(dA,'category',k),b:cnt(d26,'category',k)};}).filter(function(r){return r.a||r.b;});
  catDiffs.forEach(function(r){r.d=r.b-r.a;});
  var ups=catDiffs.filter(function(r){return r.d>0;}).sort(function(x,y){return y.d-x.d;}).slice(0,3);
  var dns=catDiffs.filter(function(r){return r.d<0;}).sort(function(x,y){return x.d-y.d;}).slice(0,3);
  function chips(arr){return arr.length?arr.map(function(r){return'<span class="ec-chip">'+r.k+' '+deltaPill(r.d)+'</span>';}).join(''):'<span style="font-size:12px;color:#94A3B8">없음</span>';}
  var insight='<div class="ec-insight">'
    +'<div><div class="ec-ins-t" style="color:#059669"><i class="ti ti-arrow-up-right"></i>많이 늘어난 곳</div><div class="ec-chips">'+chips(ups)+'</div></div>'
    +'<div><div class="ec-ins-t" style="color:#DC2626"><i class="ti ti-arrow-down-right"></i>많이 줄어든 곳</div><div class="ec-chips">'+chips(dns)+'</div></div>'
  +'</div>';

  /* 덤벨 차트: 같은 축 위에 두 해를 점으로, 사이를 선으로 */
  function legend(){return'<div class="ec-legend"><span><i style="background:'+C_A+'"></i>'+compareYear+'</span><span><i style="background:'+C_B+'"></i>2026</span></div>';}
  var maxC=Math.max.apply(null,catDiffs.map(function(r){return Math.max(r.a,r.b);}).concat([1]));
  var dumbRows=catDiffs.slice().sort(function(x,y){return y.b-x.b||y.a-x.a;}).map(function(r){
    var pa=r.a/maxC*100, pb=r.b/maxC*100, lo=Math.min(pa,pb), hi=Math.max(pa,pb);
    var lc=r.d>0?'#A7F3D0':r.d<0?'#FECACA':'#E2E8F0';
    return'<div class="ec-drow"><span class="ec-dname">'+r.k+'</span>'
      +'<div class="ec-track"><div class="ec-line" style="left:'+lo+'%;width:'+(hi-lo)+'%;background:'+lc+'"></div>'
        +'<span class="ec-pt" style="left:'+pa+'%;background:'+C_A+'" title="'+compareYear+'년 '+r.a+'명"></span>'
        +'<span class="ec-pt" style="left:'+pb+'%;background:'+C_B+'" title="2026년 '+r.b+'명"></span></div>'
      +'<span class="ec-dval"><span style="color:#94A3B8">'+r.a+'</span> → <b>'+r.b+'</b></span>'+deltaPill(r.d)
    +'</div>';
  }).join('');
  var catSec='<div class="ec-card"><div class="ec-head"><span class="ec-title">카테고리별 변화</span>'+legend()+'</div>'+dumbRows+'</div>';

  /* 급수 구성비: 해마다 100% 막대 */
  var GR_COL={'1급':'#4338CA','2급':'#6366F1','3급':'#A5B4FC','미취득':'#E2E8F0'};
  function stack(d,y){
    var n=d.length||1;
    return'<div class="ec-srow"><span class="ec-syr">'+y+'</span><div class="ec-stack">'+GRADES.map(function(g){
      var c=cnt(d,'grade',g), p=c/n*100;
      return c?'<div style="width:'+p+'%;background:'+GR_COL[g]+';color:'+(g==='3급'||g==='미취득'?'#312E81':'#fff')+'" title="'+g+' '+c+'명">'+(p>=9?Math.round(p)+'%':'')+'</div>':'';
    }).join('')+'</div></div>';
  }
  var grList=GRADES.map(function(g){
    var a=cnt(dA,'grade',g), b=cnt(d26,'grade',g);
    if(!a&&!b)return'';
    return'<div class="ec-grow"><span><i style="background:'+GR_COL[g]+'"></i>'+g+'</span><span class="ec-dval"><span style="color:#94A3B8">'+a+'</span> → <b>'+b+'</b></span>'+deltaPill(b-a)+'</div>';
  }).join('');
  var grSec='<div class="ec-card"><div class="ec-head"><span class="ec-title">급수 구성</span></div>'+stack(dA,compareYear)+stack(d26,'2026')+'<div class="ec-glist">'+grList+'</div></div>';

  var tab1=hero+insight+'<div class="ec-grid">'+catSec+grSec+'</div>';

  /* ── 탭2: 전체 연도 ── */
  var totals=ALL_YEARS.map(function(y){return y==='2026'?d26.length:(_PAST[y]||[]).length;});
  var maxT=Math.max.apply(null,totals.concat([1]));
  var cols=ALL_YEARS.map(function(y,i){
    var v=totals[i], h=Math.max(2,Math.round(v/maxT*100)), prev=i>0?totals[i-1]:null;
    var cur=y==='2026';
    return'<div class="ec-col'+(cur?' cur':'')+'"><div class="ec-colv">'+v+'</div>'
      +(prev!==null?'<div class="ec-cold" style="color:'+(v>prev?'#059669':v<prev?'#DC2626':'#94A3B8')+'">'+(v>prev?'▲':v<prev?'▼':'–')+(v!==prev?Math.abs(v-prev):'')+'</div>':'<div class="ec-cold">&nbsp;</div>')
      +'<div class="ec-colbar"><div style="height:'+h+'%"></div></div><div class="ec-coly">'+y+'</div></div>';
  }).join('');

  var catRows=CATS.map(function(cat){
    var v=ALL_YEARS.map(function(y){return(y==='2026'?d26:(_PAST[y]||[])).filter(function(r){return r.category===cat;}).length;});
    return v.some(function(x){return x>0;})?{k:cat,vals:v}:null;
  }).filter(Boolean);
  var grRows=GRADES.map(function(g){
    return{k:g,vals:ALL_YEARS.map(function(y){return(y==='2026'?d26:(_PAST[y]||[])).filter(function(r){return r.grade===g;}).length;})};
  });

  /* 히트맵 표: 숫자가 클수록 진한 색 */
  function heat(rows,keyField){
    var mx=Math.max.apply(null,rows.reduce(function(a,r){return a.concat(r.vals);},[1]));
    return'<table class="ec-heat"><thead><tr><th style="text-align:left">'+keyField+'</th>'
      +ALL_YEARS.map(function(y){return'<th'+(y==='2026'?' class="cur"':'')+'>'+y.slice(2)+'</th>';}).join('')+'</tr></thead><tbody>'
      +rows.map(function(r){
        return'<tr><td class="k">'+r.k+'</td>'+r.vals.map(function(v){
          var a=v?0.08+0.82*(v/mx):0;
          return'<td><span style="background:'+(v?'rgba(67,56,202,'+a.toFixed(2)+')':'transparent')+';color:'+(a>0.5?'#fff':v?'#312E81':'#CBD5E1')+'">'+(v||'·')+'</span></td>';
        }).join('')+'</tr>';
      }).join('')+'</tbody></table>';
  }

  var tab2='<div class="ec-card" style="margin-bottom:14px"><div class="ec-head"><span class="ec-title">연도별 합격자 추이</span><span style="font-size:11px;color:#94A3B8">▲▼ 전년 대비</span></div><div class="ec-cols">'+cols+'</div></div>'
    +'<div class="ec-grid">'
    +'<div class="ec-card"><div class="ec-head"><span class="ec-title">카테고리별 연도 추이</span></div>'+heat(catRows,'카테고리')+'</div>'
    +'<div class="ec-card"><div class="ec-head"><span class="ec-title">급수별 연도 추이</span></div>'+heat(grRows,'급수')+'</div>'
    +'</div>';
  var body='<div>'
    +'<div class="ec-seg">'
      +'<button id="_et1" class="on" onclick="_empTabSwitch(1)"><i class="ti ti-arrows-left-right"></i>'+compareYear+' vs 2026</button>'
      +'<button id="_et2" onclick="_empTabSwitch(2)"><i class="ti ti-chart-bar"></i>전체 연도 종합</button>'
    +'</div>'
    +'<div id="_etab1">'+tab1+'</div>'
    +'<div id="_etab2" style="display:none">'+tab2+'</div>'
  +'</div>';
  showModal('취업 현황 연도 비교', body, 'min(98vw,1060px)');
}

function setEmpYear(y){empYear=y;empCat='전체';empKw='';renderView();}
function _getEmpYearSelect(){
  if(_isCounsel())return'';
  var yrs=['2026','2025','2024','2023','2022','2021','2020'];
  var opts=yrs.map(function(y){return'<option value="'+y+'"'+(empYear===y?' selected':'')+'>'+y+'년</option>';}).join('');
  return'<select onchange="setEmpYear(this.value)" style="margin-left:10px;padding:5px 14px;border:1.5px solid #2563EB;border-radius:8px;font-size:13px;font-weight:700;color:#2563EB;background:#EFF6FF;font-family:inherit;cursor:pointer;vertical-align:middle">'+opts+'</select>';
}
function getEmpDataRaw(){
  var result=[];
  JOBS.forEach(function(j){
    j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).forEach(function(a){
      var st=STUDENTS.find(function(s){return s.id===a.studentId;});
      result.push({name:st?st.name:'',phone:st?st.phone||'-':'-',email:st?st.email||'-':'-',jobName:j.name,category:j.category,finalDate:j.finalDate||'',grade:a.grade||'-',memo:a.memo||'',jobType:j.type||''});
    });
  });
  return result;
}
function onEmpKwCompositionStart(){_empComposing=true;clearTimeout(_empTimer);}
function onEmpKwCompositionEnd(el){_empComposing=false;clearTimeout(_empTimer);var v=el.value;_empTimer=setTimeout(function(){empKw=v;renderView();},0);}
function onEmpKwInput(el){if(_empComposing)return;clearTimeout(_empTimer);var v=el.value;_empTimer=setTimeout(function(){empKw=v;renderView();},200);}
function clearEmpKw(){empKw='';_empComposing=false;clearTimeout(_empTimer);renderView();}
function onBlKwCompositionStart(){_blComposing=true;clearTimeout(_blTimer);}
function onBlKwCompositionEnd(el){_blComposing=false;clearTimeout(_blTimer);var v=el.value;_blTimer=setTimeout(function(){blKw=v;renderView();},0);}
function onBlKwInput(el){if(_blComposing)return;clearTimeout(_blTimer);var v=el.value;_blTimer=setTimeout(function(){blKw=v;renderView();},200);}
function clearBlKw(){blKw='';_blComposing=false;clearTimeout(_blTimer);renderView();}
function exportEmpCsv(){if(isStaff())return;var list=getEmpData(empCat);if(!list.length)return customAlert('내보낼 취업자 데이터가 없습니다.');csvExport(list.map(function(r,i){return{'No':i+1,'이름':r.name,'연락처':r.phone,'이메일':r.email,'기관유형':r.category,'공고명':r.jobName,'채용형태':r.jobType||'-','최종합격발표일':r.finalDate?fmt(r.finalDate):'-','급수':r.grade,'메모':r.memo};}),('취업자명단_'+(empCat==='전체'?'전체기관':empCat)+'_'+TODAY));}
function renderEmployment(){
  var allList=getEmpData('전체');
  var _rawList=getEmpData(empCat);
  var list=empKw.trim()?_rawList.filter(function(r){var kw=empKw.trim();return r.name.indexOf(kw)>=0||r.phone.indexOf(kw)>=0||r.category.indexOf(kw)>=0||r.jobName.indexOf(kw)>=0;}):_rawList;
  var catCounts={};(_isCounsel()?['법원','의회','국회','검찰청','공공기관','해바라기','사기업','대학교','기타']:CATS.slice(1)).forEach(function(c){catCounts[c]=getEmpData(c).length;});
  if(_isCounsel()&&empYear!=='2026'){empYear='2026';}
  var _empCatList=_isCounsel()
    ?['공공기관','라이브콘텐츠','VOD','회의록·녹취록 속기사','현장속기사']
    :CATS.slice(1);
  var tabs=[['전체',_isCounsel()?allList.length+_FREELANCE_CATS.reduce(function(s,f){return s+f.cnt;},0):allList.length]]
    .concat(_empCatList.map(function(cat){
      var isFL=_FREELANCE_CATS.some(function(f){return f.cat===cat;});
      var cnt=isFL?(_FREELANCE_CATS.find(function(f){return f.cat===cat;})||{cnt:0}).cnt:(catCounts[cat]||0);
      return[cat,cnt];
    })).map(function(entry){
    var c=entry[0],cnt=entry[1];var active=empCat===c;var cc=CAT_COLORS[c]||'#2563EB';
    return'<button onclick="setEmpCat(\''+c+'\')" style="white-space:nowrap;padding:7px 15px;border-radius:99px;border:1.5px solid '+(active?cc:'#E2E8F0')+';background:'+(active?cc:'#fff')+';color:'+(active?'#fff':'#374151')+';font-size:12px;font-weight:'+(active?700:500)+';cursor:pointer;font-family:inherit;flex-shrink:0;display:inline-flex;align-items:center;gap:6px">'+c+'<span style="font-size:10px;background:'+(active?'rgba(255,255,255,.28)':'#F3F4F6')+';color:'+(active?'#fff':'#6B7280')+';padding:1px 7px;border-radius:99px;font-weight:700">'+cnt+'</span></button>';
  }).join('');
var tableRows=(_isCounsel()&&empCat!=='전체'&&_FREELANCE_CATS.some(function(f){return f.cat===empCat;}))
    ?renderFreelanceCatEmpRows(empCat)
    :list.length===0?'<tr><td colspan="7" style="padding:56px 20px;text-align:center"><div style="display:flex;flex-direction:column;align-items:center;gap:10px"><span style="font-size:40px">🏢</span><span style="font-size:14px;color:#64748B;font-weight:700">'+(empCat==='전체'?'아직 취업자가 없습니다.':'['+empCat+'] 분야 취업자가 없습니다.')+'</span></div></td></tr>':list.map(function(r,i){var fd=calcDDay(r.finalDate);var fdText=fd===null?'':fd===0?'<span style="color:#059669;font-size:9px;font-weight:700">✓ 오늘</span>':'';return'<tr class="emp-tr emp-row-anim" style="border-bottom:1px solid #F0FDF4;animation-delay:'+Math.min(i*0.025,0.3)+'s"><td style="padding:11px 16px;text-align:center;color:#64748B;font-size:11px;font-weight:700">'+(i+1)+'</td><td style="padding:11px 14px"><span style="font-weight:800;font-size:13px;color:#0F172A">'+esc(r.name)+'</span></td><td style="padding:11px 14px;color:#1F2937;font-size:12px">'+esc(r.phone)+'</td><td style="padding:11px 14px"><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">'+badge(r.category)+'<span style="font-size:12px;color:#1F2937;font-weight:600">'+esc(r.jobName.length>32?r.jobName.slice(0,32)+'…':r.jobName)+'</span></div></td><td style="padding:11px 14px">'+(r.jobType?'<span style="padding:2px 9px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap;background:#F1F5F9;color:#374151;border:1px solid #E2E8F0">'+esc(r.jobType)+'</span>':'<span style="color:#CBD5E1;font-size:11px">-</span>')+'</td><td style="padding:11px 14px;white-space:nowrap">'+(r.finalDate?'<div><span style="font-size:12px;font-weight:700;color:#059669">'+fmt(r.finalDate)+'</span>'+(fdText?'<br><span style="font-size:10px">'+fdText+'</span>':'')+'</div>':'<span style="color:#CBD5E1;font-size:11px">-</span>')+'</td><td style="padding:11px 14px">'+(r.grade&&r.grade!=='-'?'<span style="background:#F1F5F9;color:#1F2937;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;border:1px solid #E2E8F0">'+esc(r.grade)+'</span>':'<span style="color:#CBD5E1">-</span>')+'</td>'+(isStaff()?'':'<td style="padding:11px 14px;max-width:160px"><span style="font-size:11px;color:#9CA3AF;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.memo||'-')+'</span></td>')+'</tr>';}).join('');
  return'<div id="_view_scroll" style="padding:24px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:16px"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;flex-shrink:0"><div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">🏆 취업 현황</h2>'+(_isCounsel()?'':_getEmpYearSelect())+'<p style="margin:4px 0 0;font-size:12px;color:#64748B">'+(empYear!=='2026'?empYear+'년 합격/취업성공자 명단':'기관별 최종합격/취업성공자 명단')+'</p></div>'+(isStaff()?'':'<div style="display:flex;gap:8px;align-items:center">'+'<button onclick="openEmpCompare()" style="background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(37,99,235,.35);flex-shrink:0">📊 연도 비교</button>'+'<button onclick="exportEmpCsv()" style="background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(5,150,105,.35);flex-shrink:0">📥 명단 다운로드<span style="font-size:11px;background:rgba(255,255,255,.25);padding:2px 9px;border-radius:99px">'+(empCat==='전체'?'전체':empCat)+' · '+list.length+'명</span></button>'+'</div>')+'</div><div style="background:#fff;border-radius:14px;border:1px solid #D1FAE5;overflow:hidden;flex-shrink:0"><div style="padding:14px 20px;background:linear-gradient(135deg,#064E3B,#065F46);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">🏢</span><div><p style="margin:0;font-size:9px;color:#6EE7B7;font-weight:700;letter-spacing:.14em;text-transform:uppercase">기관별 취업 현황</p><p style="margin:3px 0 0;font-size:16px;font-weight:800;color:#fff">'+(empCat==='전체'?'전체 기관':empCat)+''+(_isCounsel()?'':'<span style="font-size:12px;font-weight:500;color:#6EE7B7;margin-left:8px">취업자 '+list.length+'명</span>')+'</p></div></div>'+(!isStaff()&&list.length>0?'<button onclick="exportEmpCsv()" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">📥 CSV 다운로드</button>':'')+'</div><div style="padding:10px 16px 8px;border-bottom:1px solid #ECFDF5;background:#F0FDF4"><div style="display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px">'+tabs+'</div>'+(_isCounsel()?'':'<div style="padding:5px 16px 7px;background:#F0FDF4;border-top:1px solid #D1FAE5;display:flex;flex-wrap:wrap;gap:5px;align-items:center"><span style="font-size:10px;font-weight:700;color:#065F46">채용형태:</span>'+Object.entries(list.reduce(function(acc,r){var t=r.jobType||'미입력';acc[t]=(acc[t]||0)+1;return acc;},{})).sort(function(a,b){return b[1]-a[1];}).filter(function(e){return e[1]>0;}).map(function(e){return'<span style="background:#fff;border:1px solid #A7F3D0;color:#065F46;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap">'+esc(e[0])+' <strong>'+e[1]+'</strong></span>';}).join('')+'</div>')+'<div style="padding:8px 16px 10px;background:#F0FDF4;border-top:1px solid #D1FAE5;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div style="position:relative;flex:1;min-width:180px;max-width:360px"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none">🔍</span><input oncompositionstart="onEmpKwCompositionStart()" oncompositionend="onEmpKwCompositionEnd(this)" oninput="onEmpKwInput(this)" value="'+esc(empKw)+'" placeholder="이름·연락정보·기관·공고명 검색..." autocomplete="off" style="width:100%;padding:7px 10px 7px 32px;border:1px solid #A7F3D0;border-radius:7px;font-size:12px;outline:none;font-family:inherit;background:#fff"></div>'+( empKw?'<button onclick="clearEmpKw()" style="border:none;background:#D1FAE5;color:#065F46;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 초기화</button><span style="font-size:12px;color:#059669;font-weight:700;white-space:nowrap;margin-left:4px">'+list.length+'명 검색됨</span>':'')+'</div></div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px;min-width:760px"><thead><tr style="background:#F0FDF4;border-bottom:2px solid #D1FAE5">'+['No.','이름','연락처','기관 / 공고명','채용형태','최종합격발표일','급수'].concat(isStaff()?[]:['메모']).map(function(h){return'<th style="padding:10px 14px;text-align:left;font-weight:700;color:#065F46;font-size:11px;white-space:nowrap;letter-spacing:.04em">'+h+'</th>';}).join('')+'</tr></thead><tbody>'+tableRows+'</tbody></table></div>'+(list.length>0?'<div style="padding:10px 20px;background:#F9FAFB;border-top:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><span style="font-size:12px;color:#6B7280">총 <strong style="color:#065F46">'+list.length+'</strong>명</span>'+(isStaff()?'':'<button onclick="exportEmpCsv()" style="background:#059669;color:#fff;border:none;padding:7px 16px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📥 엑셀(CSV)</button>')+'</div>':'')+'</div></div>';
}
