'use strict';
/* 휴지통 / 삭제 되돌리기
   삭제 직전에 지워질 행(연쇄로 함께 지워지는 행 포함)을 deleted_items 테이블에 보관한다.
   deleted_items 테이블이 아직 없으면 이번 접속 동안만 브라우저 메모리에 보관한다.
   (테이블 생성 SQL: supabase/sql/deleted_items.sql) */
var TRASH_TABLE='deleted_items';
var _trashItems=[];          /* 휴지통 목록 캐시 */
var _trashLoaded=false;
var _trashTableMissing=false;
var _trashLocal=[];          /* 테이블이 없을 때 쓰는 임시 보관함 */
var _trashLocalSeq=0;

function _isMissingTableError(e){
  if(!e)return false;
  var m=String(e.message||e)+' '+(e.code||'');
  return e.code==='42P01'||e.code==='PGRST205'||m.indexOf(TRASH_TABLE)>=0&&(m.indexOf('does not exist')>=0||m.indexOf('schema cache')>=0);
}

/* 삭제를 휴지통 보관과 함께 실행한다.
   opt.kind      : 항목 종류 (예: '공고', '학생')
   opt.label     : 화면에 보일 이름
   opt.snapshot  : [{table, column, values}] 보관할 행. 부모 테이블을 먼저 적는다 (복원 순서)
   opt.run       : 실제 삭제를 수행하는 함수. {error}를 돌려준다
   opt.reload    : 삭제 후 다시 불러올 테이블 목록 (없으면 snapshot의 테이블)
   opt.after     : 삭제 성공 후 화면 상태 정리 함수 (선택) */
async function deleteWithTrash(opt){
  var groups=[];
  for(var i=0;i<opt.snapshot.length;i++){
    var s=opt.snapshot[i];
    if(!s.values||!s.values.length)continue;
    var r=await SB.from(s.table).select('*').in(s.column,s.values);
    if(r.error){customAlert('삭제 전 백업 오류: '+(r.error.message||JSON.stringify(r.error))+'\n\n삭제를 진행하지 않았습니다.');return false;}
    var rows=safeArr(r);
    if(rows.length)groups.push({table:s.table,rows:rows});
  }
  var res=await opt.run();
  if(res&&res.error){customAlert('삭제 오류: '+(res.error.message||JSON.stringify(res.error)));return false;}
  var entry={kind:opt.kind,label:opt.label||'',payload:groups,deleted_by:(_currentUser&&_currentUser.type)||'',deleted_at:new Date().toISOString()};
  entry=await _saveTrashEntry(entry);
  if(opt.after)opt.after();
  var reload=opt.reload||opt.snapshot.map(function(s){return s.table;});
  reload=reload.filter(function(t){return DATA_TABLES[t];});
  _trashLoaded=false;
  await reloadData(reload);
  showUndoToast(opt.kind+' "'+_trashShort(opt.label)+'" 삭제됨',entry);
  return true;
}

async function _saveTrashEntry(entry){
  if(!_trashTableMissing){
    var r=await SB.from(TRASH_TABLE).insert(entry).select().single();
    if(!r.error&&r.data)return r.data;
    if(r.error&&!_isMissingTableError(r.error))console.warn('휴지통 저장 실패',r.error);
    if(r.error&&_isMissingTableError(r.error))_trashTableMissing=true;
  }
  entry.id='local-'+(++_trashLocalSeq);entry._local=true;
  _trashLocal.unshift(entry);
  return entry;
}

function _trashShort(s){s=String(s||'');return s.length>22?s.slice(0,22)+'…':s;}

/* 휴지통 항목을 원래 자리로 되돌린다 (같은 id로 다시 넣는다) */
async function restoreTrash(entryId){
  var entry=_findTrash(entryId);
  if(!entry){customAlert('휴지통 항목을 찾을 수 없습니다.');return;}
  var groups=entry.payload||[];
  for(var i=0;i<groups.length;i++){
    var g=groups[i];
    var r=await SB.from(g.table).upsert(g.rows,{onConflict:'id'});
    if(r.error){customAlert('복원 오류 ('+g.table+'): '+(r.error.message||JSON.stringify(r.error)));return;}
  }
  await _removeTrashEntry(entry);
  var tables=groups.map(function(g){return g.table;});
  _hideUndoToast();
  await reloadData(tables.filter(function(t){return DATA_TABLES[t];}));
  showToast(entry.kind+' "'+_trashShort(entry.label)+'" 복원 완료');
}

async function _removeTrashEntry(entry){
  if(entry._local){_trashLocal=_trashLocal.filter(function(x){return x.id!==entry.id;});}
  else{var r=await SB.from(TRASH_TABLE).delete().eq('id',entry.id);if(r.error)console.warn('휴지통 항목 삭제 실패',r.error);}
  _trashItems=_trashItems.filter(function(x){return String(x.id)!==String(entry.id);});
}

function _findTrash(id){
  var all=_trashLocal.concat(_trashItems);
  if(_lastUndoEntry)all.push(_lastUndoEntry);
  return all.find(function(x){return String(x.id)===String(id);});
}

/* 휴지통에서 완전히 지우기 */
function purgeTrash(entryId){
  if(!isAdmin())return;
  var entry=_findTrash(entryId);if(!entry)return;
  customConfirm(entry.kind+' "'+entry.label+'"\n\n휴지통에서 완전히 삭제하시겠습니까?\n이후에는 복원할 수 없습니다.',async function(){
    await _removeTrashEntry(entry);renderView();
  },'완전 삭제','#DC2626');
}

/* ─ 삭제 직후 '되돌리기' 토스트 ─ */
var _lastUndoEntry=null,_undoTimer=null;
function showUndoToast(msg,entry){
  _lastUndoEntry=entry;
  _hideUndoToast();
  var old=document.getElementById('_toast');if(old)old.remove();
  var t=document.createElement('div');t.id='_undo_toast';
  t.style.cssText='position:fixed;bottom:28px;right:28px;z-index:12000;display:flex;align-items:center;gap:14px;background:#0F172A;color:#fff;padding:12px 14px 12px 18px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font-size:13px;font-weight:600;max-width:440px;border-left:4px solid #F59E0B';
  t.innerHTML='<span>🗑️</span><span style="flex:1">'+esc(msg)+'<span style="display:block;font-size:11px;font-weight:500;color:#94A3B8;margin-top:2px">'+(isAdmin()?'휴지통에서 언제든 복원할 수 있어요':'바로 되돌릴 수 있어요')+'</span></span>'
    +'<button onclick="restoreTrash(\''+String(entry.id).replace(/'/g,'')+'\')" style="background:#F59E0B;color:#0F172A;border:none;padding:7px 14px;border-radius:7px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap">↶ 되돌리기</button>'
    +'<button onclick="_hideUndoToast()" title="닫기" style="background:transparent;color:#94A3B8;border:none;font-size:16px;cursor:pointer;padding:0 2px">×</button>';
  document.body.appendChild(t);
  _undoTimer=setTimeout(_hideUndoToast,10000);
}
function _hideUndoToast(){clearTimeout(_undoTimer);var el=document.getElementById('_undo_toast');if(el)el.remove();}

/* ─ 휴지통 화면 ─ */
async function loadTrash(){
  var r=await SB.from(TRASH_TABLE).select('*').order('deleted_at',{ascending:false});
  if(r.error){_trashTableMissing=_isMissingTableError(r.error);_trashItems=[];if(!_trashTableMissing)console.warn('휴지통 불러오기 실패',r.error);}
  else{_trashTableMissing=false;_trashItems=safeArr(r);}
  _trashLoaded=true;
}

function renderTrash(){
  if(!_trashLoaded){
    loadTrash().then(function(){if(currentView==='trash')renderView();});
    return'<div style="padding:40px;text-align:center;color:#64748B">휴지통 불러오는 중…</div>';
  }
  var items=_trashLocal.concat(_trashItems);
  function cnt(e){return(e.payload||[]).map(function(g){return(TRASH_TABLE_LABEL[g.table]||g.table)+' '+g.rows.length+'건';}).join(' · ');}
  function when(s){if(!s)return'-';var d=new Date(s);return isNaN(d)?String(s).slice(0,16):d.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}
  var rows=items.map(function(e){
    var idArg='\''+String(e.id).replace(/'/g,'')+'\'';
    return'<tr style="border-bottom:1px solid #F1F5F9">'
      +'<td style="padding:10px 14px;white-space:nowrap"><span style="background:#F1F5F9;color:#334155;font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px">'+esc(e.kind||'')+'</span></td>'
      +'<td style="padding:10px 14px;font-weight:700;color:#0F172A">'+esc(e.label||'')+'</td>'
      +'<td style="padding:10px 14px;color:#64748B;font-size:12px">'+esc(cnt(e))+'</td>'
      +'<td style="padding:10px 14px;color:#64748B;font-size:12px;white-space:nowrap">'+when(e.deleted_at)+(e._local?' <span style="color:#D97706">(임시)</span>':'')+'</td>'
      +'<td style="padding:10px 14px;text-align:right;white-space:nowrap">'
        +'<button onclick="restoreTrash('+idArg+')" style="background:#2563EB;color:#fff;border:none;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">↶ 복원</button> '
        +'<button onclick="purgeTrash('+idArg+')" style="background:#fff;color:#DC2626;border:1px solid #FECACA;padding:6px 10px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">완전 삭제</button>'
      +'</td></tr>';
  }).join('');
  var notice=_trashTableMissing
    ?'<div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:12.5px;color:#92400E;line-height:1.7">'
      +'<b>휴지통 테이블이 아직 없어요.</b> 지금은 삭제한 항목이 이 브라우저를 닫기 전까지만 보관됩니다.<br>'
      +'Supabase SQL Editor에서 <code>supabase/sql/deleted_items.sql</code> 을 한 번 실행하면 팀 전체가 같은 휴지통을 계속 쓸 수 있어요.</div>'
    :'';
  return'<div style="display:flex;flex-direction:column;height:100%;overflow:hidden;background:#F7F8FA">'
    +'<div style="flex-shrink:0;padding:14px 20px;background:#fff;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;gap:10px">'
      +'<span style="font-size:20px">🗑️</span><div><div style="font-size:15px;font-weight:800;color:#0A0A0A">휴지통</div>'
      +'<div style="font-size:11px;color:#9CA3AF">삭제한 공고·지원자·학생·면접자료·연수·취업처를 함께 지워진 데이터까지 그대로 복원합니다</div></div>'
      +'<button onclick="_trashLoaded=false;renderView()" style="margin-left:auto;background:#F1F5F9;color:#1F2937;border:1px solid #E2E8F0;padding:7px 12px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">↻ 새로고침</button>'
    +'</div>'
    +'<div style="flex:1;overflow-y:auto;padding:16px 20px 28px">'+notice
      +(items.length
        ?'<div style="background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden"><table style="width:100%;border-collapse:collapse;font-size:13px">'
          +'<thead><tr style="background:#F8FAFC;color:#64748B;font-size:11px;text-align:left"><th style="padding:9px 14px">종류</th><th style="padding:9px 14px">이름</th><th style="padding:9px 14px">함께 보관된 데이터</th><th style="padding:9px 14px">삭제 시각</th><th></th></tr></thead>'
          +'<tbody>'+rows+'</tbody></table></div>'
        :'<div style="padding:60px;text-align:center;color:#94A3B8;font-size:13px">휴지통이 비어 있어요</div>')
    +'</div></div>';
}
var TRASH_TABLE_LABEL={students:'학생',jobs:'공고',applicants:'지원자',interview_vault:'면접자료',training_courses:'연수 기수',training_participants:'수강생',employers:'취업처',favorites:'즐겨찾기'};
