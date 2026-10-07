'use strict';
/* 면접 자료실 */
/* ══ 면접 자료실 v7.5 — 기관별 아코디언 ══ */
function renderInterviewRoom(){
  var counts={};IV_CATS.forEach(function(c){counts[c]=VAULT.filter(function(v){return v.category===c;}).length;});
  var total=VAULT.length;
  var catBadges=['전체'].concat(IV_CATS).map(function(c){
    var cnt=c==='전체'?total:(counts[c]||0);var cc=IV_COLORS[c]||'#2563EB';var active=vaultFilter===c;
    return'<button onclick="setVaultFilter(\''+c+'\')" style="display:inline-flex;align-items:center;gap:6px;padding:7px 15px;border-radius:99px;border:1.5px solid '+(active?cc:'#E2E8F0')+';background:'+(active?cc:'#fff')+';color:'+(active?'#fff':'#374151')+';font-size:12px;font-weight:'+(active?700:500)+';cursor:pointer;font-family:inherit;flex-shrink:0;transition:all .12s">'+c+'<span style="font-size:10px;background:'+(active?'rgba(255,255,255,.28)':'#F3F4F6')+';color:'+(active?'#fff':'#6B7280')+';padding:1px 7px;border-radius:99px;font-weight:700">'+cnt+'</span></button>';
  }).join('');

  var groups=getGroupedVault();
  _vaultGroups=groups;   /* 인덱스 참조용 저장 */
  var selCount=selectedVaultItems.size;

  /* 선택 액션 바 */
  var selBar=selCount>0?'<div style="background:linear-gradient(135deg,#F0F9FF,#E0F2FE);border:1.5px solid #7DD3FC;border-radius:12px;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">📋</span><div><p style="margin:0;font-size:13px;font-weight:800;color:#0284C7">'+selCount+'개 항목 선택됨</p><p style="margin:2px 0 0;font-size:11px;color:#38BDF8">각 질문 옆에 시기 (25.02) 표시 · 중복 질문도 연도별로 모두 포함</p></div></div><div style="display:flex;gap:8px;flex-shrink:0"><button onclick="vaultClearSelection()" style="background:#fff;color:#0284C7;border:1px solid #7DD3FC;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 선택 해제</button><button onclick="printSelectedVaultPDF()" style="background:linear-gradient(135deg,#E8B84B,#C99A1E);color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px;box-shadow:0 3px 10px rgba(200,154,30,.35);white-space:nowrap">📄 선택 항목 PDF 출력</button></div></div>':'';

  /* 그룹 렌더 */
  var groupsHtml=groups.length===0
    ?'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:60px 20px;color:#CBD5E1;background:#fff;border-radius:14px;border:1px solid #E5E7EB"><span style="font-size:56px">📚</span><span style="font-size:16px;font-weight:700;color:#64748B">'+(vaultKw?'"'+vaultKw+'" 검색 결과 없음':(vaultFilter==='전체'?'면접 자료가 없습니다':vaultFilter+' 자료가 없습니다'))+'</span><button onclick="openVaultModal(null)" style="background:#0EA5E9;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px">+ 새 면접 내용 등록</button></div>'
    :groups.map(function(g,idx){
      var isExpanded=expandedInstitutions.has(g.institutionName);
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
        return'<div class="entry-row'+(isSel?' sel':'')+'"><label style="display:flex;align-items:center;gap:12px;cursor:pointer;flex:1;min-width:0"><input type="checkbox" '+(isSel?'checked':'')+' onchange="vaultToggleItem('+item.id+')" style="width:16px;height:16px;cursor:pointer;accent-color:#0EA5E9;flex-shrink:0"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;flex-wrap:wrap">'+(item.year?'<span style="background:'+cc+'18;color:'+cc+';border:1px solid '+cc+'33;padding:1px 9px;border-radius:99px;font-size:11px;font-weight:800">'+item.year+'년</span>':'')+'<span style="font-size:10px;color:#64748B">'+(item.createdAt?item.createdAt.slice(0,10).replace(/-/g,'.'):'')+'  등록</span>'+(qCount>=2?'<span style="font-size:10px;color:#0EA5E9;background:#F0F9FF;border:1px solid #BAE6FD;padding:1px 7px;border-radius:99px;font-weight:700">'+qCount+'문항</span>':'')+'</div><p style="margin:0;font-size:11px;color:#6B7280;line-height:1.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(preview)+'</p></div></label><div style="display:flex;gap:5px;flex-shrink:0;align-items:center;margin-left:8px"><button onclick="openVaultModal('+item.id+')" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;padding:4px 9px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">✏</button><button onclick="deleteVault('+item.id+')" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:4px 9px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">🗑</button><button onclick="printVaultPDF('+item.id+')" style="background:linear-gradient(135deg,#E8B84B,#C99A1E);color:#fff;border:none;padding:4px 9px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">📄</button></div></div>';
      }).join(''):'';

      return'<div class="inst-group"><div class="inst-header'+(isExpanded?' expanded':'')+'" onclick="vaultToggleGroup('+idx+')"><span style="background:'+cc+';color:#fff;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:800;white-space:nowrap;flex-shrink:0">'+esc(g.category)+'</span><span style="font-size:14px;font-weight:800;color:#0F172A;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">'+esc(g.institutionName)+'</span>'+(yearsArr.length>0?'<span style="font-size:10px;color:#64748B;background:#F1F5F9;border:1px solid #E2E8F0;padding:2px 9px;border-radius:99px;white-space:nowrap;flex-shrink:0">'+yearsArr.slice(0,3).join(' · ')+(yearsArr.length>3?' 외 '+(yearsArr.length-3)+'건':'')+'</span>':'')+'<span style="font-size:11px;color:#64748B;white-space:nowrap;flex-shrink:0">'+g.items.length+'개 자료</span>'+(selInGroup>0?'<span style="background:#0EA5E9;color:#fff;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;flex-shrink:0">'+selInGroup+'선택</span>':'')+'<button onclick="event.stopPropagation();vaultToggleAllInGroup('+idx+')" style="background:'+(allSel?'#DBEAFE':'#F1F5F9')+';color:'+(allSel?'#1D4ED8':'#475569')+';border:1px solid '+(allSel?'#BFDBFE':'#E2E8F0')+';padding:4px 11px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0">'+(allSel?'전체해제':'전체선택')+'</button><span style="color:'+(isExpanded?'#2563EB':'#94A3B8')+';font-size:14px;font-weight:700;flex-shrink:0">'+(isExpanded?'▲':'▼')+'</span></div>'+(isExpanded?'<div class="inst-body">'+entriesHtml+'</div>':'')+'</div>';
    }).join('');

  return'<div id="_view_scroll" style="padding:24px;height:100%;overflow-y:auto;display:flex;flex-direction:column;gap:14px"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;flex-shrink:0"><div><h2 style="margin:0;font-size:20px;font-weight:800;color:#0F172A">📚 면접 자료실</h2><p style="margin:4px 0 0;font-size:12px;color:#64748B">SORIZAVA ACADEMY · 공식 면접 족보 보관함 · 전체 <strong>'+total+'</strong>건 · <strong>'+groups.length+'</strong>개 기관<br><span style="font-size:11px">기관 헤더의 <strong>전체선택</strong> → <strong>선택 항목 PDF 출력</strong>으로 연도별 통합 출력</span></p></div><button onclick="openVaultModal(null)" style="background:linear-gradient(135deg,#0EA5E9,#0284C7);color:#fff;border:none;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px;box-shadow:0 3px 12px rgba(14,165,233,.3);flex-shrink:0">📝 새 면접 내용 등록</button></div>'+selBar+'<div style="background:#fff;border-radius:12px;border:1px solid #E5E7EB;padding:14px 16px;flex-shrink:0;display:flex;flex-direction:column;gap:10px"><div class="cat-tab-wrap">'+catBadges+'</div><div style="display:flex;gap:8px;align-items:center"><input id="vaultSearchInput" value="'+esc(vaultKw)+'" oncompositionstart="onVaultKwCompositionStart()" oncompositionend="onVaultKwCompositionEnd(this)" oninput="onVaultKwInput(this)" placeholder="🔍 기관명 또는 내용으로 검색..." style="flex:1;padding:8px 12px;border:1px solid #E2E8F0;border-radius:8px;font-size:12px;outline:none;font-family:inherit" autocomplete="off">'+(vaultKw?'<button onclick="vaultKw=\'\';renderView()" style="border:none;background:#F1F5F9;color:#64748B;padding:7px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap">✕ 초기화</button>':'')+'<span style="font-size:11px;color:#64748B;white-space:nowrap">'+groups.length+'개 기관</span></div></div><div style="display:flex;flex-direction:column;gap:0">'+groupsHtml+'</div></div>';
}

/* ─ vault CRUD ─ */
function openVaultModal(vaultId){
  var v=vaultId!=null?VAULT.find(function(x){return x.id===vaultId;}):null;
  var f=v||{category:IV_CATS[0],institutionName:'',year:new Date().getFullYear(),content:''};
  var yearOpts=[''].concat(Array.from({length:10},function(_,i){return new Date().getFullYear()-i;}));
  showModal(v?'면접 자료 수정':'새 면접 내용 등록','<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 12px;margin-bottom:4px">'+fSel('① 카테고리','vf_cat',IV_CATS,f.category)+fInp('② 기관명 *','vf_inst','text',f.institutionName,'placeholder="예: ○○지방법원, ○○시의회"')+'<div style="margin-bottom:10px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">③ 실시 연도</label><select id="vf_year" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+yearOpts.map(function(y){return'<option value="'+y+'" '+(String(y)===String(f.year||'')?'selected':'')+'>'+(y||'연도 미상')+'</option>';}).join('')+'</select></div></div><div style="margin-bottom:4px"><label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">④ 면접 내용 * <span style="font-weight:400;color:#64748B">— 번호 형식(1. / ① / Q:)으로 입력 시 자동 파싱</span></label><textarea id="vf_content" rows="12" placeholder="면접 질문, 기출문제, 면접 후기 등을 자유롭게 입력하세요." style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;resize:vertical;font-family:inherit;line-height:1.75">'+esc(f.content||'')+'</textarea></div><div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'+btn('취소','closeModal()','outline')+' '+(v?btn('📄 PDF 출력','printVaultPDF('+v.id+')','warn')+' ':'')+btn(v?'💾 저장':'✅ 등록','saveVault('+(vaultId!=null?vaultId:'null')+')','primary')+'</div>','720px');
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
