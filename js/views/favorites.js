'use strict';
/* 즐겨찾기 */
/* ─ 즐겨찾기 ─ */
var _favKw=''; var _favComposing=false; var _favSort='name'; /* name | initial */

function isFavorite(studentId){
  return FAVORITES.some(function(f){return f.student_id===studentId||f.student_id===String(studentId);});
}

async function toggleFavorite(studentId){
  if(!isAdmin())return;
  var existing=FAVORITES.find(function(f){return f.student_id===studentId||f.student_id===String(studentId);});
  if(existing){
    var r=await SB.from('favorites').delete().eq('id',existing.id);
    if(r.error){customAlert('삭제 오류: '+r.error.message);return;}
    await reloadData(['favorites']);
  } else {
    var stu=STUDENTS.find(function(s){return s.id===studentId||s.id===String(studentId);});
    var r2=await SB.from('favorites').insert({student_id:String(studentId),name:stu?stu.name:'',memo:'',tags:''});
    if(r2.error){customAlert('등록 오류: '+r2.error.message);return;}
    await reloadData(['favorites']);
    setView('favorites');
  }
}

async function saveFavMemo(studentId){
  var memo=($('fav_memo_'+studentId)&&$('fav_memo_'+studentId).value)||'';
  var tags=($('fav_tags_'+studentId)&&$('fav_tags_'+studentId).value)||'';
  var existing=FAVORITES.find(function(f){return f.student_id===String(studentId);});
  if(!existing)return;
  var r=await SB.from('favorites').update({memo:memo,tags:tags}).eq('id',existing.id);
  if(r.error){customAlert('저장 오류: '+r.error.message);return;}
  showToast('저장되었습니다 ✓');
  await reloadData(['favorites']);
}

function updateFavList(){
  var favContent=document.getElementById('_fav_content');
  if(!favContent){renderView();return;}
  var kw=(_favKw||'').trim().toLowerCase();
  var list=FAVORITES.filter(function(f){
    if(!kw)return true;
    return(f.name||'').toLowerCase().includes(kw)||(f.phone||'').includes(kw)||(f.tags||'').toLowerCase().includes(kw)||(f.memo||'').toLowerCase().includes(kw);
  });

  /* 정렬 */
  list=list.slice().sort(function(a,b){
    var an=a.name||(STUDENTS.find(function(s){return String(s.id)===String(a.student_id);})||{name:''}).name||'';
    var bn=b.name||(STUDENTS.find(function(s){return String(s.id)===String(b.student_id);})||{name:''}).name||'';
    return an.localeCompare(bn,'ko');
  });

  var palettes=[['#DBEAFE','#1D4ED8'],['#D1FAE5','#065F46'],['#EDE9FE','#5B21B6'],['#FEF3C7','#92400E'],['#FCE7F3','#9D174D'],['#CCFBF1','#0F766E']];

  function cardHtml(f){
    var sid=f.student_id;
    var st=STUDENTS.find(function(s){return String(s.id)===String(sid);});
    var name=f.name||(st?st.name:'')||'';
    var phone=f.phone||(st?st.phone||'':'');
    var av=palettes[sid.toString().split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)%palettes.length];
    var tagList=(f.tags||'').split(/[\n,]/).map(function(t){return t.trim();}).filter(Boolean);
    return'<div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);display:flex;flex-direction:column">'
      +'<div style="background:linear-gradient(135deg,'+av[0]+','+av[0]+'cc);padding:14px 16px 10px;display:flex;align-items:center;gap:12px">'
        +'<div style="width:40px;height:40px;border-radius:50%;background:'+av[1]+';display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex-shrink:0">'+(name||'?')[0]+'</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:800;color:#0F172A">'+esc(f.name||'')+'</div>'
          +'<div style="font-size:12px;color:#64748B;margin-top:1px;display:flex;align-items:center;gap:6px">'
            +(phone?'<a href="tel:'+esc(phone)+'" style="color:#2563EB;text-decoration:none;font-weight:600">'+esc(f.phone)+'</a>':'<span style="color:#CBD5E1">연락처 없음</span>')
            +(phone?'<button onclick="event.stopPropagation();navigator.clipboard&&navigator.clipboard.writeText(\''+esc(f.phone)+'\').then(function(){showToast(\'복사 완료!\')})" style="border:none;background:'+av[1]+'22;color:'+av[1]+';padding:2px 7px;border-radius:5px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:700">복사</button>':'')
          +'</div>'
        +'</div>'
      +'</div>'
      +'<div style="padding:10px 14px;flex:1;display:flex;flex-direction:column;gap:8px">'
        +'<div>'
          +'<div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">특징 / 태그</div>'
          +'<textarea id="fav_tags_'+sid+'" rows="2" placeholder="예: 적극적\\n법원 인맥" style="width:100%;padding:7px 10px;border:1px solid #E2E8F0;border-radius:7px;font-size:12px;font-family:inherit;color:#0F172A;outline:none;background:#F8FAFC;resize:none;line-height:1.5;box-sizing:border-box" onfocus="this.style.borderColor=\'#BFDBFE\'" onblur="this.style.borderColor=\'#E2E8F0\'">'+esc(f.tags||'')+'</textarea>'
        +'</div>'
        +'<div>'
          +'<div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">메모</div>'
          +'<textarea id="fav_memo_'+sid+'" rows="3" placeholder="메모를 입력하세요…" style="width:100%;padding:7px 10px;border:1px solid #E2E8F0;border-radius:7px;font-size:12px;font-family:inherit;color:#0F172A;outline:none;background:#F8FAFC;resize:none;line-height:1.5;box-sizing:border-box" onfocus="this.style.borderColor=\'#BFDBFE\'" onblur="this.style.borderColor=\'#E2E8F0\'">'+esc(f.memo||'')+'</textarea>'
        +'</div>'
        +'<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:2px">'
          +'<button onclick="saveFavMemo('+sid+')" style="background:#0F172A;color:#fff;border:none;padding:6px 14px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">저장</button>'
          +'<button onclick="toggleFavorite('+sid+')" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;padding:6px 10px;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit">제거</button>'
        +'</div>'
      +'</div>'
    +'</div>';
  }

  if(list.length===0){
    favContent.innerHTML='<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px"><div style="font-size:52px">⭐</div><div style="font-size:16px;font-weight:600;color:#374151">'+(FAVORITES.length===0?'즐겨찾기가 비어있습니다':'검색 결과 없음')+'</div></div>';
    return;
  }

  var html='';
  if(_favSort==='initial'){
    /* 성씨별 그룹핑 */
    var groups={};
    list.forEach(function(f){var st2=STUDENTS.find(function(s){return String(s.id)===String(f.student_id);});var nm=f.name||(st2?st2.name:'')||'?';var g=nm[0];if(!groups[g])groups[g]=[];groups[g].push(Object.assign({},f,{_resolved_name:nm}));});
    var initials=Object.keys(groups).sort(function(a,b){return a.localeCompare(b,'ko');});
    html=initials.map(function(init){
      return'<div style="margin-bottom:20px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
          +'<div style="width:28px;height:28px;border-radius:8px;background:#0F172A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0">'+esc(init)+'</div>'
          +'<span style="font-size:13px;font-weight:700;color:#374151">'+esc(init)+'씨 <span style="color:#94A3B8;font-weight:400">'+groups[init].length+'명</span></span>'
          +'<div style="flex:1;height:1px;background:#F1F5F9"></div>'
        +'</div>'
        +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">'
          +groups[init].map(cardHtml).join('')
        +'</div>'
      +'</div>';
    }).join('');
  } else {
    html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">'+list.map(cardHtml).join('')+'</div>';
  }
  favContent.innerHTML=html;
}

function renderFavorites(){
  var kw=_favKw.trim().toLowerCase();
  var list=FAVORITES.map(function(f){
    var stu=STUDENTS.find(function(s){return String(s.id)===String(f.student_id);})||{};
    return Object.assign({},f,{
      name: stu.name||f.name||'?',
      phone: stu.phone||'',
      email: stu.email||''
    });
  }).filter(function(f){
    if(!kw)return true;
    return (f.name||'').toLowerCase().includes(kw)
      ||(f.phone||'').includes(kw)
      ||(f.tags||'').toLowerCase().includes(kw)
      ||(f.memo||'').toLowerCase().includes(kw);
  });

  return'<div style="display:flex;flex-direction:column;height:100%;background:#F8FAFC">'

    /* 헤더 */
    +'<div style="padding:18px 24px 14px;border-bottom:1px solid #E5E7EB;background:#fff;flex-shrink:0">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'
        +'<div style="display:flex;align-items:center;gap:10px">'
          +'<div style="width:38px;height:38px;border-radius:10px;background:#FFFBEB;border:1px solid #FDE68A;display:flex;align-items:center;justify-content:center;font-size:20px">⭐</div>'
          +'<div>'
            +'<div style="font-size:17px;font-weight:700;color:#0F172A">즐겨찾기</div>'
            +'<div style="font-size:12px;color:#64748B;margin-top:1px">우선 연락할 인재 '+FAVORITES.length+'명 등록됨</div>'
          +'</div>'
        +'</div>'
      +'</div>'
      +'<div style="margin-top:12px;position:relative">'
        +'<i class="ti ti-search" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:14px;color:#94A3B8"></i>'
        +'<input type="text" placeholder="이름, 연락처, 태그, 메모 검색…" value="'+esc(_favKw)+'" id="favSearchInput" oncompositionstart="_favComposing=true" oncompositionend="_favComposing=false;_favKw=this.value;updateFavList()" oninput="if(!_favComposing){_favKw=this.value;updateFavList()}" style="width:100%;padding:9px 12px 9px 34px;border:1px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:inherit;outline:none;color:#0F172A;background:#F8FAFC;box-sizing:border-box">'
      +'</div>'
      +'<div style="margin-top:8px;display:flex;gap:6px;align-items:center">'
        +'<span style="font-size:11px;color:#94A3B8;font-weight:600">정렬:</span>'
        +'<button onclick="_favSort=\'name\';updateFavList()" onmousedown="this.style.transform=\'scale(0.93)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'" style="padding:4px 12px;border-radius:99px;border:1.5px solid '+(_favSort==='name'?'#2563EB':'#E2E8F0')+';background:'+(_favSort==='name'?'#2563EB':'#fff')+';color:'+(_favSort==='name'?'#fff':'#374151')+';font-size:11px;font-weight:'+(_favSort==='name'?700:500)+';cursor:pointer;font-family:inherit;transition:all .15s">가나다순</button>'
        +'<button onclick="_favSort=\'initial\';updateFavList()" onmousedown="this.style.transform=\'scale(0.93)\'" onmouseup="this.style.transform=\'scale(1)\'" onmouseleave="this.style.transform=\'scale(1)\'" style="padding:4px 12px;border-radius:99px;border:1.5px solid '+(_favSort==='initial'?'#2563EB':'#E2E8F0')+';background:'+(_favSort==='initial'?'#2563EB':'#fff')+';color:'+(_favSort==='initial'?'#fff':'#374151')+';font-size:11px;font-weight:'+(_favSort==='initial'?700:500)+';cursor:pointer;font-family:inherit;transition:all .15s">성씨별</button>'
        +(_favKw?'<button onclick="_favKw=\'\';var el=document.getElementById(\'favSearchInput\');if(el)el.value=\'\';updateFavList()" style="margin-left:auto;border:none;background:#F1F5F9;color:#64748B;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit">✕ 초기화</button>':'')
      +'</div>'
    +'</div>'

    /* 컨텐츠 */
    +(list.length===0
      ?'<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">'
        +'<div style="font-size:52px">⭐</div>'
        +'<div style="font-size:16px;font-weight:600;color:#374151">'+(FAVORITES.length===0?'즐겨찾기가 비어있습니다':'검색 결과 없음')+'</div>'
        +'<div style="font-size:13px;color:#94A3B8;text-align:center;line-height:1.6">'+(FAVORITES.length===0?'학생관리에서 ☆ 버튼을 눌러<br>자주 연락할 인재를 등록하세요':'다른 검색어를 시도해보세요')+'</div>'
      +'</div>'

      :'<div id="_fav_content" style="flex:1;overflow-y:auto;padding:16px 24px 24px">'
        +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">'
          +list.map(function(f){
            var sid=f.student_id;
            var initial=(f.name||'?')[0];
            var palettes=[
              ['#DBEAFE','#1D4ED8'],['#D1FAE5','#065F46'],['#EDE9FE','#5B21B6'],
              ['#FEF3C7','#92400E'],['#FCE7F3','#9D174D'],['#CCFBF1','#0F766E']
            ];
            var av=palettes[sid.toString().split('').reduce(function(a,c){return a+c.charCodeAt(0);},0)%palettes.length];
            var tagList=(f.tags||'').split(',').map(function(t){return t.trim();}).filter(Boolean);

            return'<div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);display:flex;flex-direction:column">'

              /* 카드 상단: 인물 정보 */
              +'<div style="padding:16px 16px 12px;border-bottom:1px solid #F1F5F9">'
                +'<div style="display:flex;align-items:flex-start;gap:12px">'
                  +'<div style="width:46px;height:46px;border-radius:12px;background:'+av[0]+';color:'+av[1]+';font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+esc(initial)+'</div>'
                  +'<div style="flex:1;min-width:0">'
                    +'<div style="font-size:15px;font-weight:700;color:#0F172A;margin-bottom:6px">'+esc(isStaff()?maskName(f.name):f.name)+'</div>'
                    /* 전화번호 */
                    +(f.phone
                      ?'<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
                        +'<i class="ti ti-phone" style="font-size:13px;color:#64748B;flex-shrink:0"></i>'
                        +'<span style="font-size:13px;color:#374151">'+esc(isStaff()?'***-****-****':f.phone)+'</span>'
                        +(!isStaff()?'<button onclick="navigator.clipboard.writeText(\''+esc(f.phone)+'\').then(function(){customAlert(\'연락처가 복사되었습니다 ✓\')})" style="margin-left:auto;border:none;background:#F1F5F9;color:#64748B;padding:2px 8px;border-radius:5px;font-size:11px;cursor:pointer;font-family:inherit" onmouseover="this.style.background=\'#E2E8F0\'" onmouseout="this.style.background=\'#F1F5F9\'">복사</button>':'')
                      +'</div>'
                      :''
                    )
                    /* 이메일 */
                    +(f.email
                      ?'<div style="display:flex;align-items:center;gap:6px">'
                        +'<i class="ti ti-mail" style="font-size:13px;color:#64748B;flex-shrink:0"></i>'
                        +'<span style="font-size:12px;color:#64748B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(f.email)+'</span>'
                      +'</div>'
                      :''
                    )
                  +'</div>'
                  +(isAdmin()?'<button onclick="toggleFavorite(\''+sid+'\')" style="border:1px solid #FECACA;background:#FEF2F2;color:#DC2626;padding:4px 8px;border-radius:7px;font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;flex-shrink:0;white-space:nowrap" onmouseover="this.style.background=\'#FEE2E2\'" onmouseout="this.style.background=\'#FEF2F2\'">해제</button>':'')
                +'</div>'
                /* 태그 */
                +(tagList.length>0
                  ?'<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:5px">'+tagList.map(function(t){return'<span style="background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;padding:2px 9px;border-radius:99px;font-size:11px;font-weight:500">'+esc(t)+'</span>';}).join('')+'</div>'
                  :''
                )
              +'</div>'

              /* 메모 영역 */
              +'<div style="padding:12px 16px;flex:1;display:flex;flex-direction:column;gap:8px">'
                +(isAdmin()
                  ?'<div>'
                    +'<div style="font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">특징 / 태그</div>'
                    +'<textarea id="fav_tags_'+sid+'" rows="2" placeholder="예: 적극적, 정보전달&#10;법원 인맥 넓음" style="width:100%;padding:7px 10px;border:1px solid #E2E8F0;border-radius:7px;font-size:12px;font-family:inherit;color:#0F172A;outline:none;background:#F8FAFC;resize:none;line-height:1.5;box-sizing:border-box" onfocus="this.style.borderColor=&apos;#BFDBFE&apos;" onblur="this.style.borderColor=&apos;#E2E8F0&apos;">'+esc(f.tags||'')+'</textarea>'
                  +'</div>'
                  +'<div>'
                    +'<div style="font-size:11px;font-weight:600;color:#94A3B8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">메모</div>'
                    +'<textarea id="fav_memo_'+sid+'" rows="3" placeholder="이 분에 대해 기록해두고 싶은 것들&#10;예: 법원 쪽 인맥 넓음, 정보 공유 적극적, 연락 잘 됨…" style="width:100%;padding:7px 10px;border:1px solid #E2E8F0;border-radius:7px;font-size:12px;font-family:inherit;color:#0F172A;outline:none;resize:none;background:#F8FAFC;line-height:1.6;box-sizing:border-box" onfocus="this.style.borderColor=\'#BFDBFE\'" onblur="this.style.borderColor=\'#E2E8F0\'">'+esc(f.memo||'')+'</textarea>'
                    +'<button onclick="saveFavMemo(\''+sid+'\')" style="width:100%;margin-top:6px;background:#0F172A;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:600;color:#fff;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px" onmouseover="this.style.background=\'#1E293B\'" onmouseout="this.style.background=\'#0F172A\'">'
                      +'<i class="ti ti-device-floppy" style="font-size:14px"></i> 저장'
                    +'</button>'
                  +'</div>'
                  :'<div style="font-size:13px;color:#374151;line-height:1.6;background:#F8FAFC;border-radius:8px;padding:10px 12px;flex:1">'
                    +(f.memo||'<span style="color:#94A3B8">메모 없음</span>')
                  +'</div>'
                )
              +'</div>'

              /* 카드 하단: 등록일 */
              +'<div style="padding:8px 16px;border-top:1px solid #F8FAFC;background:#FAFAFA">'
                +'<span style="font-size:11px;color:#CBD5E1">등록일 '+((f.created_at||'').slice(0,10)||'-')+'</span>'
              +'</div>'

            +'</div>';
          }).join('')
        +'</div>'
      +'</div>'
    )
  +'</div>';
}
