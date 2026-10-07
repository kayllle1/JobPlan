'use strict';
/* 공용 UI (모달, 토스트, PDF, 월간 보고서) */
/* ─ UI 헬퍼 ─ */
function btn(label,onclick,variant,sm){
  variant=variant||'primary';sm=sm||false;
  var vs={primary:'background:#2563EB;color:#fff;border:none',success:'background:#059669;color:#fff;border:none',danger:'background:#DC2626;color:#fff;border:none',outline:'background:#fff;color:#1F2937;border:1px solid #D1D5DB',warn:'background:#D97706;color:#fff;border:none',info:'background:#7C3AED;color:#fff;border:none'};
  return'<button onclick="'+onclick+'" style="'+vs[variant]+';padding:'+(sm?'4px 9px':'7px 14px')+';border-radius:6px;font-size:'+(sm?'11px':'12px')+';font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:inherit">'+label+'</button>';
}
function badge(t,c){var cc=c||CAT_COLORS[t]||'#6B7280';return'<span style="background:'+cc+'1A;color:'+cc+';padding:2px 7px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap;display:inline-block;border:1px solid '+cc+'33">'+esc(t)+'</span>';}
function fInp(label,id,type,value,extra){type=type||'text';value=value||'';extra=extra||'';return'<div style="margin-bottom:10px">'+(label?'<label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">'+label+'</label>':'')+'<input id="'+id+'" type="'+type+'" value="'+esc(value)+'" '+extra+' style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;outline:none;font-family:inherit"></div>';}
function fSel(label,id,opts,value){value=value||'';var options=opts.map(function(o){return'<option value="'+esc(o)+'" '+(o===value?'selected':'')+'>'+esc(o)+'</option>';}).join('');return'<div style="margin-bottom:10px">'+(label?'<label style="display:block;font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px;text-transform:uppercase;letter-spacing:.06em">'+label+'</label>':'')+'<select id="'+id+'" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;background:#fff;font-family:inherit">'+options+'</select></div>';}
function customAlert(msg){var old=$('_alert');if(old)old.remove();var div=document.createElement('div');div.id='_alert';div.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;z-index:11000;backdrop-filter:blur(2px)';div.innerHTML='<div style="background:#fff;border-radius:12px;width:420px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden"><div style="padding:20px 20px 8px;display:flex;align-items:flex-start;gap:12px"><span style="font-size:22px">ℹ️</span><p style="margin:0;font-size:13px;color:#111827;line-height:1.6;white-space:pre-wrap">'+esc(msg)+'</p></div><div style="padding:12px 20px 18px;display:flex;justify-content:flex-end"><button onclick="document.getElementById(\'_alert\').remove()" style="background:#2563EB;color:#fff;border:none;padding:8px 22px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">확인</button></div></div>';document.body.appendChild(div);}
function showToast(msg,type){
  var old=document.getElementById('_toast');if(old)old.remove();
  var cfg={success:{bg:'#0F172A',icon:'✓',bar:'#22C55E'},error:{bg:'#7F1D1D',icon:'✕',bar:'#EF4444'},info:{bg:'#1E3A5F',icon:'ℹ',bar:'#3B82F6'}}[type||'success']||{bg:'#0F172A',icon:'✓',bar:'#22C55E'};
  var t=document.createElement('div');t.id='_toast';
  t.style.cssText='position:fixed;bottom:28px;right:28px;z-index:12000;display:flex;align-items:center;gap:10px;background:'+cfg.bg+';color:#fff;padding:13px 18px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font-family:Pretendard,sans-serif;font-size:13px;font-weight:600;max-width:320px;animation:_toastIn .2s ease;border-left:3px solid '+cfg.bar;
  t.innerHTML='<span style="font-size:16px;flex-shrink:0">'+cfg.icon+'</span><span>'+esc(msg)+'</span>';
  if(!document.getElementById('_toast_style')){var s=document.createElement('style');s.id='_toast_style';s.textContent='@keyframes _toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes _toastOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(12px)}}';document.head.appendChild(s);}
  document.body.appendChild(t);
  setTimeout(function(){if(t.parentNode){t.style.animation='_toastOut .2s ease forwards';setTimeout(function(){if(t.parentNode)t.remove();},200);}},3000);
}

function customConfirm(msg,onYes,yesLabel,yesColor){
  yesLabel=yesLabel||'확인';yesColor=yesColor||'#2563EB';
  var old=$('_cfrm');if(old)old.remove();
  var fn='_cfrmYes_'+Date.now();
  window[fn]=async function(){var el=$('_cfrm');if(el)el.remove();delete window[fn];try{await onYes();}catch(e){customAlert('오류: '+e.message);}};
  var div=document.createElement('div');div.id='_cfrm';div.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;z-index:11000;backdrop-filter:blur(2px)';
  div.innerHTML='<div style="background:#fff;border-radius:12px;width:380px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.28);overflow:hidden"><div style="padding:20px 20px 8px;display:flex;align-items:flex-start;gap:12px"><span style="font-size:22px">'+(yesColor==='#DC2626'?'⚠️':'❓')+'</span><p style="margin:0;font-size:14px;color:#111827;line-height:1.6;white-space:pre-wrap">'+esc(msg)+'</p></div><div style="padding:12px 20px 18px;display:flex;justify-content:flex-end;gap:8px"><button onclick="document.getElementById(\'_cfrm\').remove()" style="background:#fff;color:#1F2937;border:1px solid #D1D5DB;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">취소</button><button onclick="'+fn+'()" style="background:'+yesColor+';color:#fff;border:none;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">'+yesLabel+'</button></div></div>';
  document.body.appendChild(div);
}
function showModal(title,body,w){w=w||'600px';var old=$('_modal');if(old)old.remove();var div=document.createElement('div');div.id='_modal';div.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.65);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(3px)';div.innerHTML='<div style="background:#fff;border-radius:14px;width:'+w+';max-width:95vw;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 25px 80px rgba(0,0,0,.3);overflow:hidden"><div style="padding:14px 20px;background:linear-gradient(135deg,#1E3A5F,#1E40AF);display:flex;justify-content:space-between;align-items:center;flex-shrink:0"><h3 style="margin:0;font-size:14px;font-weight:700;color:#fff">'+esc(title)+'</h3><button onclick="closeModal()" style="border:none;background:rgba(255,255,255,.15);color:#fff;font-size:16px;font-weight:700;border-radius:6px;padding:3px 8px;cursor:pointer;font-family:inherit">✕</button></div><div id="_modal_body" style="padding:20px;overflow-y:auto;flex:1">'+body+'</div></div>';document.body.appendChild(div);}
function closeModal(){var m=$('_modal');if(m)m.remove();}
function confirmDeleteJob(jobId){var job=JOBS.find(function(j){return j.id===jobId;});if(!job)return;var n=job.applicants.length;customConfirm('"'+job.name+'"\n\n공고를 삭제하시겠습니까?'+(n>0?'\n\n주의: 지원자 '+n+'명 데이터도 함께 삭제됩니다.':''),function(){return executeDeleteJob(jobId);},'삭제','#DC2626');}
async function executeDeleteJob(jobId){
  var job=JOBS.find(function(j){return j.id===jobId;});
  await deleteWithTrash({kind:'공고',label:job?job.name:'',
    snapshot:[{table:'jobs',column:'id',values:[jobId]},{table:'applicants',column:'job_id',values:[jobId]}],
    run:function(){return SB.from('jobs').delete().eq('id',jobId);},
    after:function(){expandedJobs.delete(jobId);detailJobs.delete(jobId);}});
}

/* ─ PDF 공용 ─ */
function buildWatermark(){var rows=Array.from({length:22},function(){return'<div class="pdf-wm-r">'+Array.from({length:8},function(){return'<span class="pdf-wm-c">SORIZAVA ACADEMY</span>';}).join('')+'</div>';}).join('');return'<div class="pdf-wm">'+rows+'</div>';}
function yearLabel(year){return year?'\''+String(year).slice(2)+'년':'';}

/* ─ PDF: 단일 자료 출력 ─ */
function printVaultPDF(vaultId){
  var v=VAULT.find(function(x){return x.id===vaultId;});
  if(!v){customAlert('자료를 찾을 수 없습니다.');return;}
  var qs=parseQsShared(v.content);
  var isQ=qs.length>=2;
  var yl=yearLabel(v.year);
  /* 타이틀: [기관명] 면접 기출 완벽 가이드 */
  var mainTitle=esc(v.institutionName)+' 면접 기출 완벽 가이드';
  var subParts=[];
  if(isQ)subParts.push('총 '+qs.length+'개 문항');
  if(yl)subParts.push(yl+' 기출');
  var subText=subParts.join(' · ');
  var bodyHtml=isQ
    ?'<div class="pdf-ql">'+qs.map(function(q,i){return'<div class="pdf-qi"><span class="pdf-qi-n">'+String(i+1).padStart(2,'0')+'</span><span class="pdf-qi-t">'+esc(q)+'</span>'+(yl?'<span class="pdf-qi-date">'+yl+'</span>':'')+'</div>';}).join('')+'</div>'
    :'<div class="pdf-raw">'+esc(v.content)+'</div>';
  var hdrHtml='<div class="pdf-hdr"><span class="pdf-hdr-title">'+mainTitle+'</span>'+(subText?'<span class="pdf-hdr-sub">'+esc(subText)+'</span>':'')+'</div>';
  var html='<div class="pdf-wrap">'+buildWatermark()+'<div class="pdf-pg">'+hdrHtml+bodyHtml+'<div class="pdf-ftr"><div class="pdf-ftr-brand">SORIZAVA ACADEMY</div><div class="pdf-ftr-sec">본 자료의 저작권은 SORIZAVA ACADEMY에 있습니다.<br>무단 배포 시 법적 책임을 물을 수 있습니다.</div></div></div></div>';
  var pt=$('_print_target');if(!pt)return;
  pt.innerHTML=html;window.print();setTimeout(function(){pt.innerHTML='';},1500);
}

/* ─ PDF: 선택 항목 통합 출력 ─ */
function printSelectedVaultPDF(){
  if(!selectedVaultItems.size){customAlert('PDF로 출력할 자료를 체크해주세요.');return;}
  var selected=VAULT.filter(function(v){return selectedVaultItems.has(v.id);});
  if(!selected.length)return;
  var instNames=[...new Set(selected.map(function(v){return v.institutionName;}))];
  var isSingle=instNames.length===1;
  var sorted=selected.slice().sort(function(a,b){return (a.year||9999)-(b.year||9999)||a.institutionName.localeCompare(b.institutionName);});
  var allItems=[],hasQ=false;
  sorted.forEach(function(v){
    var qs=parseQsShared(v.content);
    var yl=yearLabel(v.year);
    if(qs.length>=2){hasQ=true;qs.forEach(function(q){allItems.push({q:q,yl:yl});});}
    else if(v.content.trim()){allItems.push({q:v.content.trim(),yl:yl,raw:true});}
  });
  /* 타이틀 */
  var mainTitle=isSingle?esc(instNames[0])+' 면접 기출 완벽 가이드':'통합 면접 기출 완벽 가이드';
  var subText=isSingle
    ?('총 '+allItems.length+'개 문항 · '+selected.length+'개 연도 통합')
    :(instNames.length+'개 기관 · 총 '+allItems.length+'개 문항');
  var bodyHtml=hasQ
    ?'<div class="pdf-ql">'+allItems.map(function(item,i){return'<div class="pdf-qi"><span class="pdf-qi-n">'+String(i+1).padStart(2,'0')+'</span><span class="pdf-qi-t">'+esc(item.raw?item.q.slice(0,200):item.q)+'</span>'+(item.yl?'<span class="pdf-qi-date">'+item.yl+'</span>':'')+'</div>';}).join('')+'</div>'
    :'<div class="pdf-raw">'+allItems.map(function(i){return esc(i.q);}).join('\n\n')+'</div>';
  var hdrHtml='<div class="pdf-hdr"><span class="pdf-hdr-title">'+mainTitle+'</span><span class="pdf-hdr-sub">'+esc(subText)+'</span></div>';
  var html='<div class="pdf-wrap">'+buildWatermark()+'<div class="pdf-pg">'+hdrHtml+bodyHtml+'<div class="pdf-ftr"><div class="pdf-ftr-brand">SORIZAVA ACADEMY</div><div class="pdf-ftr-sec">본 자료의 저작권은 SORIZAVA ACADEMY에 있습니다.<br>무단 배포 시 법적 책임을 물을 수 있습니다.</div></div></div></div>';
  var pt=$('_print_target');if(!pt)return;
  pt.innerHTML=html;window.print();setTimeout(function(){pt.innerHTML='';},1500);
}

/* ─ 월간 보고서 ─ */
function showMonthlyReport(){if(isStaff())return;
  var m=selectedMonth||MONTH;var parts=m.split('-');var yy=parts[0],mm=parts[1];
  var label=yy+'년 '+parseInt(mm)+'월';
  var newJobs=JOBS.filter(function(j){return (j.createdAt||'').slice(0,7)===m;});
  var newJobsByCat={};CATS.slice(1).forEach(function(c){var cnt=newJobs.filter(function(j){return j.category===c;}).length;if(cnt>0)newJobsByCat[c]=cnt;});
  var docMonthJobs=JOBS.filter(function(j){return (j.docDate||'').slice(0,7)===m;});
  var monthApplicants=docMonthJobs.reduce(function(acc,j){return acc.concat(j.applicants);}, []);
  var finalMonthJobs=JOBS.filter(function(j){return (j.finalDate||'').slice(0,7)===m;});
  var finalPass=finalMonthJobs.reduce(function(acc,j){return acc.concat(j.applicants.filter(function(a){return a.status==='최종합격'||a.status==='취업성공';}));}, []);
  var rate=monthApplicants.length>0?Math.round(finalPass.length/monthApplicants.length*100):0;
  var catCounts={};finalPass.forEach(function(a){var job=JOBS.find(function(j){return j.id===a.jobId;});if(job)catCounts[job.category]=(catCounts[job.category]||0)+1;});
  var top3=Object.entries(catCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,3);
  var sep='─'.repeat(32);
  var reportText='📊 '+label+' 취업 실적 보고서\n'+sep+'\n\n■ 신규 공고: '+newJobs.length+'건\n'+(Object.keys(newJobsByCat).length>0?Object.entries(newJobsByCat).map(function(e){return'    · '+e[0]+': '+e[1]+'건';}).join('\n'):'    · 없음')+'\n\n■ 이번 달 총 지원자: '+monthApplicants.length+'명\n■ 이번 달 최종합격: '+finalPass.length+'명\n■ 취업 성공률: '+rate+'%\n\n■ 주요 취업 기관 TOP 3\n'+(top3.length>0?top3.map(function(e,i){return'    '+(i+1)+'위. '+e[0]+' — '+e[1]+'명';}).join('\n'):'    · 데이터 없음')+'\n\n'+sep+'\n※ JobMS v7.5 자동 생성 · '+TODAY+' KST 기준';
  var catBadgesHtml=Object.keys(newJobsByCat).length>0?Object.entries(newJobsByCat).map(function(e){var c=e[0],n=e[1];return'<span style="display:inline-flex;align-items:center;gap:4px;background:'+(CAT_COLORS[c]||'#6B7280')+'18;color:'+(CAT_COLORS[c]||'#6B7280')+';border:1px solid '+(CAT_COLORS[c]||'#6B7280')+'33;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">'+c+' <strong>'+n+'건</strong></span>';}).join(''):'<span style="color:#CBD5E1;font-size:12px">없음</span>';
  var top3Html=top3.length>0?top3.map(function(e,i){var c=e[0],n=e[1];return'<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #F3F4F6;">'+'<div style="width:26px;height:26px;border-radius:50%;background:'+(['#F59E0B','#9CA3AF','#D97706'][i])+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff;flex-shrink:0">'+(i+1)+'</div>'+badge(c)+'<span style="flex:1;font-size:13px;font-weight:700;color:#374151">'+c+' 분야</span><span style="font-size:18px;font-weight:900;color:#0F172A">'+n+'<span style="font-size:11px;font-weight:500;color:#64748B;margin-left:2px">명</span></span></div>';}).join(''):'<div style="padding:20px;text-align:center;color:#CBD5E1;font-size:12px">이번 달 최종합격 데이터 없음</div>';
  function kpiRow(ic,lbl,val,sub,c,bg){return'<div style="background:'+bg+';border-radius:12px;padding:14px 18px;border:1px solid '+c+'33;flex:1;min-width:0"><p style="margin:0;font-size:10px;color:'+c+';font-weight:700">'+ic+' '+lbl+'</p><p style="margin:4px 0 2px;font-size:28px;font-weight:900;color:#0F172A;line-height:1">'+val+'</p><p style="margin:0;font-size:10px;color:'+c+';opacity:.7">'+sub+'</p></div>';}
  var bodyHtml='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">'+kpiRow('📋','신규 공고',newJobs.length+'건','이번 달 등록','#2563EB','#EFF6FF')+kpiRow('👤','총 지원자',monthApplicants.length+'명','서류접수일 기준','#7C3AED','#F5F3FF')+kpiRow('🏆','최종합격',finalPass.length+'명','합격발표일 기준','#059669','#F0FDF4')+kpiRow('📈','취업 성공률',rate+'%','합격/지원자','#D97706','#FFFBEB')+'</div><div style="margin-bottom:16px"><p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em">📋 신규 공고 카테고리별</p><div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px;background:#F8FAFC;border-radius:8px;border:1px solid #E5E7EB">'+catBadgesHtml+'</div></div><div style="margin-bottom:16px"><p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.06em">🥇 주요 취업 기관 TOP 3</p><div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden">'+top3Html+'</div></div><div style="background:#1E293B;border-radius:10px;padding:14px 16px;margin-bottom:16px"><p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em">📝 보고서 미리보기</p><pre style="margin:0;font-size:11px;color:#1E293B;line-height:1.75;white-space:pre-wrap;font-family:inherit">'+esc(reportText)+'</pre></div><div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid #F3F4F6">'+btn('✕ 닫기','closeModal()','outline')+'<button onclick="exportDashboardExcel()" style="background:linear-gradient(135deg,#059669,#047857);color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px">📥 엑셀 내보내기</button>'+'<button onclick="(function(){var t=window._reportText||\'\';if(!t)return;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){customAlert(\'✅ 보고서가 클립보드에 복사되었습니다!\');});}else{var ta=document.createElement(\'textarea\');ta.value=t;ta.style.cssText=\'position:fixed;left:-9999px\';document.body.appendChild(ta);ta.select();try{document.execCommand(\'copy\');customAlert(\'✅ 복사 완료!\');}catch(e){}document.body.removeChild(ta);}})()" style="background:#475569;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px">📋 보고서 복사</button></div>';
  window._reportText=reportText;
  window._reportExcelData={label,newJobs,monthApplicants,finalPass,rate,top3,newJobsByCat,catBadgesHtml:undefined};
  showModal('📊 '+label+' 실적 보고서',bodyHtml,'680px');
}
