'use strict';

/* ─ 자료실 보조 상태 ─ */
var _vaultOpenItems=new Set(),_vaultKwClosedItems=new Set(),_vaultKwCollapsed=new Set(),_vaultLastKw='',_vaultFreqOpen=false;
function _vaultKwMatch(v){var kw=vaultKw.trim();return !!kw&&v.content.indexOf(kw)>=0;}
function _vaultIsOpen(v){return _vaultKwMatch(v)?!_vaultKwClosedItems.has(v.id):_vaultOpenItems.has(v.id);}
function vaultToggleRead(id){
  var v=VAULT.find(function(x){return x.id===id;});if(!v)return;
  var set=_vaultKwMatch(v)?_vaultKwClosedItems:_vaultOpenItems;
  if(set.has(id))set.delete(id);else set.add(id);
  _saveScrollPositions();renderView();
}
/* 검색어 형광펜 */
function _vaultHl(text){
  var kw=vaultKw.trim(),t=String(text||'');
  if(!kw)return esc(t);
  return t.split(kw).map(esc).join('<mark style="background:#FEF08A;color:inherit;padding:0 1px;border-radius:2px">'+esc(kw)+'</mark>');
}
/* 자료 전체 내용 (번호 질문이면 목록, 아니면 원문) */
function _vaultFullHtml(item,cc){
  var qs=parseQsShared(item.content);
  if(qs.length>=2)return'<ol style="margin:0;padding:0 0 0 22px;display:flex;flex-direction:column;gap:5px">'+qs.map(function(q){return'<li style="font-size:12.5px;color:#1F2937;line-height:1.6;padding-left:2px">'+_vaultHl(q)+'</li>';}).join('')+'</ol>';
  return'<div style="font-size:12.5px;color:#1F2937;line-height:1.7;white-space:pre-wrap">'+_vaultHl(item.content)+'</div>';
}

/* ─ 질문 복사 (카톡 등에 붙여넣기용) ─ */
function _vaultPlainText(items){
  var byInst={},order=[];
  items.slice().sort(function(a,b){return (b.year||0)-(a.year||0);}).forEach(function(v){var k=v.institutionName||'(기관명 없음)';if(!byInst[k]){byInst[k]=[];order.push(k);}byInst[k].push(v);});
  return order.map(function(k){
    return'['+k+' 면접 기출]\n'+byInst[k].map(function(v){
      var qs=parseQsShared(v.content);
      var body=qs.length>=2?qs.map(function(q,i){return(i+1)+'. '+q;}).join('\n'):v.content.trim();
      return(v.year?v.year+'년\n':'')+body;
    }).join('\n\n');
  }).join('\n\n\n');
}
function _copyText(text,msg){
  function fallback(){var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(ta);if(ok)showToast(msg);else customAlert('복사하지 못했어요. 브라우저 권한을 확인해 주세요.');}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){showToast(msg);},fallback);else fallback();
}
function copyVaultItem(id){var v=VAULT.find(function(x){return x.id===id;});if(v)_copyText(_vaultPlainText([v]),'질문을 복사했어요. 카톡 등에 붙여넣으세요');}
function copySelectedVaultText(){
  var sel=VAULT.filter(function(v){return selectedVaultItems.has(v.id);});
  if(!sel.length)return customAlert('복사할 자료를 체크해주세요.');
  _copyText(_vaultPlainText(sel),sel.length+'개 자료의 질문을 복사했어요');
}

/* ─ 자주 나온 질문 ─ */
function _qKey(q){return String(q).replace(/[\s\.\,\?\!\~\'\"“”‘’·…\-]/g,'').toLowerCase();}
function getFrequentQuestions(items){
  var map={};
  items.forEach(function(v){
    var seen={};
    parseQsShared(v.content).forEach(function(q){
      var k=_qKey(q);if(k.length<4||seen[k])return;seen[k]=1;
      var e=map[k]||(map[k]={q:q,n:0,years:{},insts:{}});
      e.n++;if(v.year)e.years[v.year]=1;e.insts[v.institutionName]=1;
    });
  });
  return Object.keys(map).map(function(k){return map[k];}).filter(function(e){return e.n>=2;}).sort(function(a,b){return b.n-a.n||a.q.localeCompare(b.q);});
}
function toggleVaultFreq(){_vaultFreqOpen=!_vaultFreqOpen;renderView();}
function _vaultFreqPanel(items){
  if(!_vaultFreqOpen)return'';
  var list=getFrequentQuestions(items).slice(0,40);
  var scope=(vaultFilter==='전체'?'전체 카테고리':vaultFilter)+(vaultKw.trim()?' · "'+esc(vaultKw.trim())+'" 검색 결과':'');
  return'<div style="background:#fff;border:1px solid #DDD6FE;border-radius:12px;overflow:hidden;flex-shrink:0">'
    +'<div style="padding:11px 16px;background:#F5F3FF;border-bottom:1px solid #EDE9FE;display:flex;align-items:center;gap:8px"><i class="ti ti-repeat" style="font-size:16px;color:#7C3AED"></i><span style="font-size:13px;font-weight:700;color:#4C1D95">자주 나온 질문</span><span style="font-size:11px;color:#7C3AED">'+scope+' · 두 번 이상 나온 질문</span><button onclick="toggleVaultFreq()" style="margin-left:auto;border:none;background:#EDE9FE;color:#6D28D9;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">닫기</button></div>'
    +(list.length?'<div style="max-height:360px;overflow-y:auto">'+list.map(function(e,i){
      var ys=Object.keys(e.years).map(Number).sort();var yr=ys.length?(ys[0]===ys[ys.length-1]?ys[0]+'':ys[0]+'~'+ys[ys.length-1]):'';
      var ins=Object.keys(e.insts);
      return'<div style="display:flex;align-items:center;gap:10px;padding:8px 16px;border-bottom:1px solid #F5F3FF"><span style="font-size:11px;font-weight:800;color:#A78BFA;min-width:20px">'+(i+1)+'</span><span style="flex:1;font-size:12.5px;color:#1F2937;min-width:0">'+esc(e.q)+'</span><span style="font-size:11px;color:#64748B;white-space:nowrap;max-width:260px;overflow:hidden;text-overflow:ellipsis" title="'+esc(ins.join(', '))+'">'+esc(ins.slice(0,2).join(', '))+(ins.length>2?' 외 '+(ins.length-2):'')+'</span><span style="font-size:11px;color:#7C3AED;background:#F5F3FF;border:1px solid #DDD6FE;padding:1px 8px;border-radius:99px;font-weight:800;white-space:nowrap">'+e.n+'회'+(yr?' · '+yr:'')+'</span></div>';
    }).join('')+'</div>':'<div style="padding:18px;text-align:center;font-size:12px;color:#94A3B8">두 번 이상 나온 질문이 아직 없어요. (같은 문장으로 적힌 질문만 묶어요)</div>')
  +'</div>';
}

/* ─ 공고와 연결 ─ */
function _nsp(s){return String(s||'').replace(/\s+/g,'');}
function _instMatchesJob(inst,job){var a=_nsp(inst);return a.length>=2&&_nsp(job.name).indexOf(a)>=0;}
function vaultOpenJobsFor(inst){
  jobFilter={cat:'전체',year:'',kw:inst,type:'전체',recType:'전체',dateFrom:'',dateTo:'',location:''};_dashMapLocation=null;_jobQuick={hideClosed:true,mode:''};
  Object.keys(_jobColFilters).forEach(function(k){_jobColFilters[k]={from:'',to:''};});
  setView('jobs');
}
/* 공고관리에서 쓰는: 이 공고 기관의 자료 */
function vaultItemsForJob(job){
  var best='',items=[];
  VAULT.forEach(function(v){if(_instMatchesJob(v.institutionName,job)&&_nsp(v.institutionName).length>=_nsp(best).length){if(_nsp(v.institutionName).length>_nsp(best).length){best=v.institutionName;items=[];}items.push(v);}});
  return{inst:best,items:items};
}
function openVaultForInst(inst){vaultFilter='전체';vaultKw=inst;expandedInstitutions.add(inst);setView('interview');}

/* ─ 기관명 자동완성 ─ */
function _vaultInstBook(){
  var map={};
  VAULT.forEach(function(v){if(v.institutionName&&!map[v.institutionName])map[v.institutionName]={name:v.institutionName,cat:v.category,n:0};if(map[v.institutionName])map[v.institutionName].n++;});
  JOBS.forEach(function(j){
    var nm=String(j.name||'').replace(/\s*\([^)]*\)/g,'').replace(/\s+(속기사|채용|공고|모집)(\s.*)?$/,'').trim();
    if(nm&&!map[nm])map[nm]={name:nm,cat:jobCatToIV(j.category)||'',n:0};
  });
  return Object.keys(map).sort().map(function(k){return map[k];});
}
function _vfInstInput(el){
  var nm=String(el.value||'').trim(),hint=$('vf_inst_hint');if(!hint)return;
  if(!nm){hint.innerHTML='';return;}
  var book=_vaultInstBook(),hit=book.find(function(b){return b.name===nm;});
  if(hit){
    if(hit.cat&&$('vf_cat')&&IV_CATS.indexOf(hit.cat)>=0)$('vf_cat').value=hit.cat;
    hint.innerHTML='<span style="color:#059669">✓ '+(hit.n?'이미 있는 기관이에요 (자료 '+hit.n+'개). 같은 묶음에 들어가요':'공고관리에 있는 기관이에요')+(hit.cat?' · 카테고리 '+esc(hit.cat):'')+'</span>';
    return;
  }
  var k=_nsp(nm).slice(0,3);
  var similar=k.length>=2?book.filter(function(b){return b.n&&_nsp(b.name).indexOf(k)===0;}).slice(0,3):[];
  hint.innerHTML=similar.length?'<span style="color:#B45309">새 기관으로 등록돼요. 혹시 이 기관인가요? </span>'+similar.map(function(b){return'<button type="button" onclick="var e=$(\'vf_inst\');e.value=this.textContent;_vfInstInput(e)" style="border:1px solid #FDE68A;background:#FFFBEB;color:#92400E;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;margin-left:4px">'+esc(b.name)+'</button>';}).join(''):'<span style="color:#64748B">새 기관으로 등록돼요</span>';
}
/* 면접 자료실 */
/* ══ 면접 자료실 v7.5 — 기관별 아코디언 ══ */
function renderInterviewRoom(){
  var counts={};IV_CATS.forEach(function(c){counts[c]=VAULT.filter(function(v){return v.category===c;}).length;});
  var total=VAULT.length;
  var catBadges=['전체'].concat(IV_CATS).map(function(c){
    var cnt=c==='전체'?total:(counts[c]||0);var cc=IV_COLORS[c]||'#2563EB';var active=vaultFilter===c;
    return'<button onclick="setVaultFilter(\''+c+'\')" style="'+(!cnt&&!active?'opacity:.45;':'')+'display:inline-flex;align-items:center;gap:6px;padding:7px 15px;border-radius:99px;border:1.5px solid '+(active?cc:'#E2E8F0')+';background:'+(active?cc:'#fff')+';color:'+(active?'#fff':'#374151')+';font-size:12px;font-weight:'+(active?700:500)+';cursor:pointer;font-family:inherit;flex-shrink:0;transition:all .12s">'+c+'<span style="font-size:10px;background:'+(active?'rgba(255,255,255,.28)':'#F3F4F6')+';color:'+(active?'#fff':'#6B7280')+';padding:1px 7px;border-radius:99px;font-weight:700">'+cnt+'</span></button>';
  }).join('');

  if(_vaultLastKw!==vaultKw){_vaultLastKw=vaultKw;_vaultKwCollapsed.clear();_vaultKwClosedItems.clear();}
  var groups=getGroupedVault();
  _vaultGroups=groups;   /* 인덱스 참조용 저장 */
  var selCount=selectedVaultItems.size;

  /* 선택 액션 바 */
  var selBar=selCount>0?'<div style="background:linear-gradient(135deg,#F0F9FF,#E0F2FE);border:1.5px solid #7DD3FC;border-radius:12px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">📋</span><div><p style="margin:0;font-size:13px;font-weight:800;color:#0284C7">'+selCount+'개 항목 선택됨</p><p style="margin:2px 0 0;font-size:11px;color:#38BDF8">각 질문 옆에 시기 (25.02) 표시 · 중복 질문도 연도별로 모두 포함</p></div></div><div style="display:flex;gap:8px;flex-shrink:0"><button onclick="vaultClearSelection()" style="background:#fff;color:#0284C7;border:1px solid #7DD3FC;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 선택 해제</button><button onclick="copySelectedVaultText()" style="background:#fff;color:#0F172A;border:1px solid #CBD5E1;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:5px"><i class="ti ti-copy" style="font-size:14px"></i> 질문 복사</button><button onclick="printSelectedVaultPDF()" style="background:linear-gradient(135deg,#E8B84B,#C99A1E);color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px;box-shadow:0 3px 10px rgba(200,154,30,.35);white-space:nowrap">📄 선택 항목 PDF 출력</button></div></div>':'';

  /* 그룹 렌더 */
  var groupsHtml=groups.length===0
    ?'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:60px 20px;color:#CBD5E1;background:#fff;border-radius:14px;border:1px solid #E5E7EB"><span style="font-size:56px">📚</span><span style="font-size:16px;font-weight:700;color:#64748B">'+(vaultKw?'"'+vaultKw+'" 검색 결과 없음':(vaultFilter==='전체'?'면접 자료가 없습니다':vaultFilter+' 자료가 없습니다'))+'</span><button onclick="openVaultModal(null)" style="background:#0EA5E9;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px">+ 새 면접 내용 등록</button></div>'
    :groups.map(function(g,idx){
      var isExpanded=vaultKw.trim()?!_vaultKwCollapsed.has(g.institutionName):expandedInstitutions.has(g.institutionName);
      var cc=IV_COLORS[g.category]||'#6B7280';
      var selInGroup=g.items.filter(function(i){return selectedVaultItems.has(i.id);}).length;
      var allSel=g.items.length>0&&g.items.every(function(i){return selectedVaultItems.has(i.id);});
      var yearsArr=[...new Set(g.items.map(function(i){return i.year;}).filter(Boolean))].sort(function(a,b){return b-a;});

      var entriesHtml=isExpanded?g.items.map(function(item){
        var isSel=selectedVaultItems.has(item.id);
        var qs=parseQsShared(item.content);
        var qCount=qs.length;
        var rawLines=item.content.split('\n').map(function(l){return l.trim();}).filter(function(l){return l;}).slice(0,2);
        var preview=rawLines.join(' · ').slice(0,90)+(item.content.length>90?'…':'');
        var isOpen=_vaultIsOpen(item);
        return'<div class="entry-row vrow'+(isSel?' sel':'')+(isOpen?' open':'')+'" style="flex-wrap:wrap"><div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0"><label style="display:flex;align-items:center;cursor:pointer;flex-shrink:0"><input type="checkbox" '+(isSel?'checked':'')+' onchange="vaultToggleItem('+item.id+')" style="width:16px;height:16px;cursor:pointer;accent-color:#0EA5E9"></label><div class="vrow-read" onclick="vaultToggleRead('+item.id+')" title="'+(isOpen?'눌러서 접기':'눌러서 전체 보기')+'"><div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;flex-wrap:wrap">'+(item.year?'<span style="background:'+cc+'18;color:'+cc+';border:1px solid '+cc+'33;padding:1px 9px;border-radius:99px;font-size:11px;font-weight:800">'+item.year+'년</span>':'')+'<span style="font-size:10px;color:#64748B">'+(item.createdAt?item.createdAt.slice(0,10).replace(/-/g,'.'):'')+'  등록</span>'+(qCount>=2?'<span style="font-size:10px;color:#0EA5E9;background:#F0F9FF;border:1px solid #BAE6FD;padding:1px 7px;border-radius:99px;font-weight:700">'+qCount+'문항</span>':'')+'<span class="vrow-tog"><i class="ti ti-chevron-'+(isOpen?'up':'down')+'"></i>'+(isOpen?'접기':'전체 보기')+'</span></div>'+(isOpen?'':'<p style="margin:0;font-size:11px;color:#6B7280;line-height:1.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_vaultHl(preview)+'</p>')+'</div></div><div class="vrow-acts"><button class="vrow-btn" onclick="copyVaultItem('+item.id+')" title="질문 복사"><i class="ti ti-copy"></i></button><button class="vrow-btn" onclick="openVaultModal('+item.id+')" title="수정"><i class="ti ti-pencil"></i></button><button class="vrow-btn" onclick="printVaultPDF('+item.id+')" title="PDF 출력"><i class="ti ti-file-type-pdf"></i></button><button class="vrow-btn del" onclick="deleteVault('+item.id+')" title="삭제"><i class="ti ti-trash"></i></button></div>'+(isOpen?'<div style="flex-basis:100%;margin:10px 0 2px 28px;padding:12px 14px;background:#fff;border:1px solid #E2E8F0;border-left:3px solid '+cc+';border-radius:8px">'+_vaultFullHtml(item,cc)+'</div>':'')+'</div>';
      }).join(''):'';

      return'<div class="inst-group"><div class="inst-header'+(isExpanded?' expanded':'')+'" onclick="vaultToggleGroup('+idx+')"><span style="background:'+cc+';color:#fff;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:800;white-space:nowrap;flex-shrink:0">'+esc(g.category)+'</span><span style="font-size:14px;font-weight:800;color:#0F172A;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">'+_vaultHl(g.institutionName)+'</span>'+(function(){var n=JOBS.filter(function(j){return !j.isClosed&&_instMatchesJob(g.institutionName,j);}).length;return n?'<button data-inst="'+esc(g.institutionName)+'" onclick="event.stopPropagation();vaultOpenJobsFor(this.dataset.inst)" title="공고관리에서 이 기관 공고 보기" style="border:1px solid #BBF7D0;background:#F0FDF4;color:#047857;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;display:inline-flex;align-items:center;gap:3px"><i class="ti ti-briefcase" style="font-size:12px"></i>진행 공고 '+n+'건</button>':'';})()+''+'<span class="vh-meta">'+(yearsArr.length>0?yearsArr.slice(0,3).join('·')+(yearsArr.length>3?' 외':'')+' · ':'')+'자료 '+g.items.length+'</span>'+(selInGroup>0?'<span style="background:#0EA5E9;color:#fff;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;flex-shrink:0">'+selInGroup+'선택</span>':'')+(isExpanded||selInGroup>0?'<button onclick="event.stopPropagation();vaultToggleAllInGroup('+idx+')" style="background:'+(allSel?'#DBEAFE':'#F1F5F9')+';color:'+(allSel?'#1D4ED8':'#475569')+';border:1px solid '+(allSel?'#BFDBFE':'#E2E8F0')+';padding:4px 11px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0">'+(allSel?'전체해제':'전체선택')+'</button>':'')+'<i class="ti ti-chevron-'+(isExpanded?'up':'down')+'" style="color:'+(isExpanded?'#2563EB':'#94A3B8')+';font-size:18px;flex-shrink:0"></i></div>'+(isExpanded?'<div class="inst-body">'+entriesHtml+'</div>':'')+'</div>';
    }).join('');

  return'<div id="_view_scroll" style="padding:24px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:14px"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;flex-shrink:0"><div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">📚 면접 자료실</h2><p style="margin:4px 0 0;font-size:12px;color:#64748B">SORIZAVA ACADEMY · 공식 면접 족보 보관함 · 전체 <strong>'+total+'</strong>건 · <strong>'+groups.length+'</strong>개 기관</p></div><button onclick="openVaultModal(null)" style="background:#2563EB;color:#fff;border:none;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;flex-shrink:0"><i class="ti ti-plus" style="font-size:16px"></i>새 면접 내용 등록</button></div>'+selBar+'<div style="background:#fff;border-radius:12px;border:1px solid #E5E7EB;padding:14px 16px;flex-shrink:0;display:flex;flex-direction:column;gap:10px"><div class="cat-tab-wrap">'+catBadges+'</div><div style="display:flex;gap:8px;align-items:center"><input id="vaultSearchInput" value="'+esc(vaultKw)+'" oncompositionstart="onVaultKwCompositionStart()" oncompositionend="onVaultKwCompositionEnd(this)" oninput="onVaultKwInput(this)" placeholder="🔍 기관명 또는 내용으로 검색..." style="flex:1;padding:8px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:12px;outline:none;font-family:inherit" autocomplete="off">'+(vaultKw?'<button onclick="vaultKw=\'\';renderView()" style="border:none;background:#F1F5F9;color:#64748B;padding:7px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 초기화</button>':'')+'<span style="font-size:11px;color:#64748B;white-space:nowrap">'+groups.length+'개 기관</span><button onclick="toggleVaultFreq()" style="border:1px solid '+(_vaultFreqOpen?'#7C3AED':'#DDD6FE')+';background:'+(_vaultFreqOpen?'#7C3AED':'#F5F3FF')+';color:'+(_vaultFreqOpen?'#fff':'#6D28D9')+';padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:5px"><i class="ti ti-repeat" style="font-size:14px"></i>자주 나온 질문</button></div></div>'+_vaultFreqPanel(groups.reduce(function(a,g){return a.concat(g.items);},[]))+'<div style="display:flex;flex-direction:column;gap:0">'+groupsHtml+'</div></div>';
}

/* ─ vault CRUD ─ */
function openVaultModal(vaultId){
  var v=vaultId!=null?VAULT.find(function(x){return x.id===vaultId;}):null;
  var f=v||{category:IV_CATS[0],institutionName:'',year:new Date().getFullYear(),content:''};
  var yearOpts=[''].concat(Array.from({length:10},function(_,i){return new Date().getFullYear()-i;}));
  showModal(v?'면접 자료 수정':'새 면접 내용 등록','<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 12px;margin-bottom:4px">'+fSel('① 카테고리','vf_cat',IV_CATS,f.category)+fInp('② 기관명 *','vf_inst','text',f.institutionName,'placeholder="예: ○○지방법원, ○○시의회" list="vf_inst_list" autocomplete="off" oninput="_vfInstInput(this)" onchange="_vfInstInput(this)"')+'<datalist id="vf_inst_list">'+_vaultInstBook().map(function(b){return'<option value="'+esc(b.name)+'">'+(b.n?'자료 '+b.n+'개':'공고관리')+(b.cat?' · '+esc(b.cat):'')+'</option>';}).join('')+'</datalist>'+'<div style="margin-bottom:10px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">③ 실시 연도</label><select id="vf_year" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+yearOpts.map(function(y){return'<option value="'+y+'" '+(String(y)===String(f.year||'')?'selected':'')+'>'+(y||'연도 미상')+'</option>';}).join('')+'</select></div></div><div id="vf_inst_hint" style="font-size:11px;font-weight:600;margin:-4px 0 8px;min-height:14px"></div><div style="margin-bottom:4px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">④ 면접 내용 * <span style="font-weight:400;color:#64748B">— 번호 형식(1. / ① / Q:)으로 입력 시 자동 파싱</span></label><textarea id="vf_content" rows="12" placeholder="면접 질문, 기출문제, 면접 후기 등을 자유롭게 입력하세요." style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;line-height:1.75">'+esc(f.content||'')+'</textarea></div><div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'+btn('취소','closeModal()','outline')+' '+(v?btn('📄 PDF 출력','printVaultPDF('+v.id+')','warn')+' ':'')+btn(v?'💾 저장':'✅ 등록','saveVault('+(vaultId!=null?vaultId:'null')+')','primary')+'</div>','720px');
}
async function saveVault(vaultId){
  var cat=$('vf_cat')&&$('vf_cat').value;
  var inst=$('vf_inst')&&$('vf_inst').value.trim();if(!inst)return customAlert('기관명을 입력하세요');
  var cont=$('vf_content')&&$('vf_content').value.trim();if(!cont)return customAlert('면접 내용을 입력하세요');
  var yr=$('vf_year')&&$('vf_year').value;
  var f={category:cat,institution_name:inst,year:yr?parseInt(yr):null,content:cont};
  var r=vaultId!=null?await SB.from('interview_vault').update(f).eq('id',vaultId):await SB.from('interview_vault').insert(f);
  if(r.error){customAlert('저장 오류: '+(r.error.message||JSON.stringify(r.error)));return;}
  closeModal();await reloadData(['interview_vault']);
}
function deleteVault(vaultId){
  var v=VAULT.find(function(x){return x.id===vaultId;});if(!v)return;
  customConfirm('"'+v.institutionName+'" ('+( v.year||'연도 미상')+'년)\n\n이 면접 자료를 삭제하시겠습니까?',async function(){
    await deleteWithTrash({kind:'면접자료',label:v.institutionName+(v.year?' ('+v.year+')':''),
      snapshot:[{table:'interview_vault',column:'id',values:[vaultId]}],
      run:function(){return SB.from('interview_vault').delete().eq('id',vaultId);},
      after:function(){selectedVaultItems.delete(vaultId);}});
  },'삭제','#DC2626');
}
