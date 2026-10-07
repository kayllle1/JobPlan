'use strict';
/* 기관별 채용 이력 */
/* ─ 기관별 채용 이력 ─ */
var _ihKw=''; var _ihCat='전체'; var _ihOpenKey=''; var _ihComposing=false; var _ihSort='jobs'; var _ihSortDir='desc';

function extractInst(name){
  return name
    .replace(/\s*(공개채용|채용공고|채용|공고|모집|실무수습|속기사|속기직|회의록|기간제|임기제|한시임기제|의회임기제|계약직|공무직|업무지원|인턴)\s*/gi,' ')
    .replace(/\(.*?\)/g,'').replace(/\[.*?\]/g,'')
    .replace(/\d{4}/g,'').replace(/\s+/g,' ').trim()||name;
}

function buildInstGroups(){
  var groups={};
  JOBS.forEach(function(j){
    var key=extractInst(j.name);
    if(!groups[key])groups[key]={key:key,cat:j.category,jobs:[],totalAps:0,totalPass:0};
    groups[key].cat=j.category;
    groups[key].jobs.push(j);
    groups[key].totalAps+=(j.applicants||[]).length;
    groups[key].totalPass+=(j.applicants||[]).filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}).length;
  });
  return Object.values(groups);
}

function sortInstList(list){
  return list.slice().sort(function(a,b){
    var av,bv;
    if(_ihSort==='jobs'){av=a.jobs.length;bv=b.jobs.length;}
    else if(_ihSort==='aps'){av=a.totalAps;bv=b.totalAps;}
    else if(_ihSort==='pass'){av=a.totalPass;bv=b.totalPass;}
    else if(_ihSort==='rate'){av=a.totalAps>0?a.totalPass/a.totalAps:0;bv=b.totalAps>0?b.totalPass/b.totalAps:0;}
    else{av=a.key;bv=b.key;return _ihSortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av);}
    return _ihSortDir==='asc'?av-bv:bv-av;
  });
}

function buildInstRows(filtered){
  var KB_BADGE={'소리자바':'background:#EFF6FF;color:#1D4ED8','카스':'background:#FEF3C7;color:#92400E'};
  if(!filtered.length) return'<tr><td colspan="8" style="padding:40px;text-align:center;color:#CBD5E1;font-size:13px">표시할 기관이 없습니다.</td></tr>';
  return filtered.map(function(g){
    var isOpen=_ihOpenKey===g.key;
    var rate=g.totalAps>0?Math.round(g.totalPass/g.totalAps*100):0;
    var rateColor=rate>=50?'#059669':rate>=25?'#D97706':'#DC2626';
    var rateBg=rate>=50?'#F0FDF4':rate>=25?'#FFFBEB':'#FEF2F2';

    /* 최근 합격자 + 연락처 뒷자리 */
    var passAps=[];
    g.jobs.forEach(function(j){
      (j.applicants||[]).forEach(function(a){
        if(a.status==='최종합격'||a.status==='취업성공'){
          var st=STUDENTS.find(function(s){return s.id===a.studentId;});
          if(st)passAps.push({name:st.name,phone:st.phone||'',date:j.finalDate||''});
        }
      });
    });
    passAps.sort(function(a,b){return b.date.localeCompare(a.date);});
    var recentPass=passAps.length>0
      ?passAps.slice(0,2).map(function(p){
          var tail=p.phone.replace(/[^0-9]/g,'').slice(-4);
          return esc(p.name)+(tail?'('+tail+')':'');
        }).join(' · ')
      :'<span style="color:#CBD5E1">-</span>';

    /* 신원확인 현황 데이터 */
    var j1=g.jobs.find(function(j){return j.idKeyboard&&j.idKeyboard!=='확인중';});
    var kbBadge=j1?'<span style="padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700;'+(KB_BADGE[j1.idKeyboard]||'background:#F1F5F9;color:#64748B')+'">'+esc(j1.idKeyboard)+'</span>':'';

    /* 펼침 상세 */
    var detail=isOpen
      ?'<tr style="border-bottom:1px solid #DBEAFE" id="ih_detail_'+encodeURIComponent(g.key)+'">'
        +'<td colspan="8" style="padding:0 0 0 40px;background:#F8FAFF">'
        +'<div style="padding:12px 20px 14px;display:flex;flex-direction:column;gap:8px">'
        +'<p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:.05em">📋 공고별 지원 이력</p>'
        +g.jobs.map(function(j){
          var jAps=j.applicants||[];
          return'<div style="background:#fff;border:1px solid #DBEAFE;border-radius:8px;padding:10px 14px">'
            +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">'
              +'<span style="font-size:12px;font-weight:700;color:#1F2937">'+esc(j.name)+'</span>'
              +(j.finalDate?'<span style="font-size:11px;color:#64748B">발표 '+fmt(j.finalDate)+'</span>':'')
              +(j.isClosed?'<span style="background:#F3F4F6;color:#9CA3AF;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;margin-left:auto">마감</span>':'<span style="background:#F0FDF4;color:#059669;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;margin-left:auto">진행중</span>')
            +'</div>'
            +(jAps.length===0
              ?'<span style="font-size:11px;color:#CBD5E1">지원자 없음</span>'
              :'<div style="display:flex;gap:5px;flex-wrap:wrap">'
                +jAps.map(function(a){
                  var st=STUDENTS.find(function(s){return s.id===a.studentId;});
                  var sname=st?(isStaff()?maskName(st.name):st.name):'?';
                  var phone=st?st.phone||'':'';
                  var tail=phone.replace(/[^0-9]/g,'').slice(-4);
                  var sc={'최종합격':'#059669','취업성공':'#059669','불합격':'#DC2626','면접대기':'#D97706','서류합격':'#2563EB'}[a.status]||'#64748B';
                  var sbg={'최종합격':'#F0FDF4','취업성공':'#F0FDF4','불합격':'#FEF2F2','면접대기':'#FFFBEB','서류합격':'#EFF6FF'}[a.status]||'#F8FAFC';
                  var icon={'최종합격':'✓ ','취업성공':'✓ '}[a.status]||'';
                  return'<span style="background:'+sbg+';color:'+sc+';border:1px solid '+sc+'33;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">'+icon+esc(sname)+(tail?' ('+tail+')':'')+'<span style="font-size:10px;opacity:.8;margin-left:3px">'+esc(a.status)+'</span></span>';
                }).join('')
              +'</div>'
            )
          +'</div>';
        }).join('')
        +'</div></td></tr>'
      :'';

    var rowKey=g.key.replace(/'/g,"\\'");
    return'<tr style="border-bottom:1px solid '+(isOpen?'#DBEAFE':'#F1F5F9')+';background:'+(isOpen?'#EFF6FF':'#fff')+';cursor:pointer" onclick="_ihOpenKey=\''+rowKey+'\'===_ihOpenKey?\'\':\'' +rowKey+'\';updateInstTable()">'
      +'<td style="padding:10px 8px;text-align:center;color:'+(isOpen?'#2563EB':'#94A3B8')+';font-weight:700;font-size:12px">'+(isOpen?'▼':'▶')+'</td>'
      +'<td style="padding:10px;font-weight:700;color:#1F2937;white-space:nowrap">'+esc(g.key)+'</td>'
      +'<td style="padding:10px;text-align:center">'+badge(g.cat)+'</td>'
      +'<td style="padding:10px;text-align:center;color:#374151;font-weight:600">'+g.jobs.length+'회</td>'
      +'<td style="padding:10px;text-align:center;color:#374151">'+g.totalAps+'명</td>'
      +'<td style="padding:10px;text-align:center"><span style="color:'+(g.totalPass>0?'#059669':'#CBD5E1')+';font-weight:700">'+g.totalPass+'명</span></td>'
      +'<td style="padding:10px;text-align:center"><span style="background:'+rateBg+';color:'+rateColor+';padding:2px 9px;border-radius:99px;font-size:11px;font-weight:700">'+rate+'%</span></td>'
      +'<td style="padding:10px;font-size:11px;color:#374151;max-width:180px">'+recentPass+'</td>'
    +'</tr>'
    +detail;
  }).join('');
}

function getFilteredInst(){
  var list=buildInstGroups();
  list=sortInstList(list);
  var kw=(_ihKw||'').trim().toLowerCase();
  return list.filter(function(g){
    if(_ihCat!=='전체'&&g.cat!==_ihCat)return false;
    if(kw&&g.key.toLowerCase().indexOf(kw)<0)return false;
    return true;
  });
}

function updateInstTable(){
  var filtered=getFilteredInst();
  var tb=document.getElementById('ihTableBody');
  if(!tb){renderView();return;}
  tb.innerHTML=buildInstRows(filtered);
  var cnt=document.getElementById('ihResultCnt');
  if(cnt)cnt.textContent=filtered.length+'곳';
}

function renderInstHistory(){
  var list=buildInstGroups();
  var totalInst=list.length;
  var totalAps=list.reduce(function(s,g){return s+g.totalAps;},0);
  var totalPass=list.reduce(function(s,g){return s+g.totalPass;},0);

  /* 카테고리 탭 */
  var catCounts={'전체':list.length};
  list.forEach(function(g){catCounts[g.cat]=(catCounts[g.cat]||0)+1;});
  var catList=['전체'].concat(CATS.slice(1).filter(function(c){return catCounts[c];}));

  var filtered=getFilteredInst();

  /* 정렬 버튼 helper */
  function sortBtn(label,key){
    var active=_ihSort===key;
    var dir=active?(_ihSortDir==='desc'?'↓':'↑'):'';
    return'<button onclick="_ihSort=\''+key+'\';_ihSortDir=_ihSort===\''+key+'\'&&_ihSortDir===\'desc\'?\'asc\':\'desc\';updateInstTable()" style="padding:5px 12px;border-radius:99px;border:1px solid '+(active?'#2563EB':'#E2E8F0')+';background:'+(active?'#EFF6FF':'#fff')+';color:'+(active?'#2563EB':'#374151')+';font-size:11px;font-weight:'+(active?700:500)+';cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .15s" onmousedown="this.style.transform=\'scale(0.93)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'">'+label+(dir?' '+dir:'')+'</button>';
  }

  return'<div id="_view_scroll" style="padding:20px 32px 24px 24px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:10px">'
  +'<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;flex-shrink:0">'
    +'<div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">기관별 채용 이력</h2>'
      +'<p style="margin:3px 0 0;font-size:12px;color:#64748B">기관 '+totalInst+'곳 · 총 지원 '+totalAps+'건 · 최종합격 '+totalPass+'명 · 검색 <span id="ihResultCnt">'+filtered.length+'곳</span></p></div>'
  +'</div>'
  +'<div style="flex-shrink:0;display:flex;gap:6px;flex-wrap:wrap">'
    +catList.map(function(c){
      var a=c===_ihCat;
      var cc=c==='전체'?'#2563EB':(CAT_COLORS[c]||'#2563EB');
      var style=a
        ?'background:'+cc+';color:#fff;border:1.5px solid '+cc+';box-shadow:0 2px 8px '+cc+'40;'
        :'background:'+cc+'0D;color:'+cc+';border:1.5px solid '+cc+'30;';
      return'<button onclick="_ihCat=\''+c+'\';updateInstTable()" style="white-space:nowrap;padding:6px 14px;border-radius:99px;font-size:12px;font-weight:'+(a?700:500)+';cursor:pointer;font-family:inherit;transition:all .15s;'+style+'\" onmouseover="this.style.opacity=\'0.85\'" onmouseout="this.style.opacity=\'1\'" onmousedown="this.style.transform=\'scale(0.95)\'" onmouseup="this.style.transform=\'scale(1)\'">'+c+' <span style="font-size:10px;opacity:.8">'+(catCounts[c]||0)+'</span></button>';
    }).join('')
  +'</div>'
  +'<div style="background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;flex-shrink:0">'
    +'<i class="ti ti-search" style="font-size:14px;color:#94A3B8"></i>'
    +'<input id="ihSearchInput" value="'+esc(_ihKw)+'" oncompositionstart="_ihComposing=true" oncompositionend="_ihComposing=false;_ihKw=this.value;updateInstTable()" oninput="if(!_ihComposing){_ihKw=this.value;updateInstTable()}" placeholder="기관명 검색…" style="border:none;outline:none;font-size:13px;font-family:inherit;width:100%" autocomplete="off">'
    +(_ihKw?'<button onclick="_ihKw=\'\';document.getElementById(\'ihSearchInput\').value=\'\';updateInstTable()" style="border:none;background:#F1F5F9;color:#64748B;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;font-family:inherit">✕</button>':'')
  +'</div>'
  +'<div style="display:flex;gap:5px;align-items:center;flex-shrink:0;flex-wrap:wrap">'
    +'<span style="font-size:11px;color:#64748B;font-weight:600">정렬:</span>'
    +sortBtn('공고수','jobs')+sortBtn('총 지원','aps')+sortBtn('최종합격','pass')+sortBtn('합격률','rate')+sortBtn('가나다','key')
  +'</div>'
  +'<div style="background:#fff;border-radius:10px;border:1px solid #E5E7EB;overflow:auto;flex:1;min-height:0">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px">'
      +'<colgroup><col style="width:3%"><col style="width:22%"><col style="width:10%"><col style="width:8%"><col style="width:9%"><col style="width:9%"><col style="width:9%"><col style="width:30%"></colgroup>'
      +'<thead><tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;position:sticky;top:0;z-index:2">'
        +'<th style="padding:10px 8px;background:#F8FAFC"></th>'
        +'<th style="padding:10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px;background:#F8FAFC">기관명</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px;background:#F8FAFC">카테고리</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px;background:#F8FAFC">공고 수</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px;background:#F8FAFC">총 지원</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px;background:#F8FAFC">최종합격</th>'
        +'<th style="padding:10px;text-align:center;font-weight:700;color:#1F2937;font-size:11px;background:#F8FAFC">합격률</th>'
        +'<th style="padding:10px;text-align:left;font-weight:700;color:#1F2937;font-size:11px;background:#F8FAFC">최근 합격자</th>'
      +'</tr></thead>'
      +'<tbody id="ihTableBody">'+buildInstRows(filtered)+'</tbody>'
    +'</table>'
  +'</div>'
  +'</div>';
}
