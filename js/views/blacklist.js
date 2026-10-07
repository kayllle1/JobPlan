'use strict';
/* 블랙리스트 */
/* ─ 블랙리스트 시스템 ─ */
function getBlacklistCandidates(){
  var todayMs=new Date(TODAY).getTime();
  var result=[];
  JOBS.forEach(function(j){
    j.applicants.forEach(function(ap){
      if(!ap.interviewDocSent)return;
      var sentMs=new Date(String(ap.interviewDocSent).slice(0,10)).getTime();
      var diff=Math.round((todayMs-sentMs)/86400000);
      if(diff>=7&&(ap.interviewFeedback||'').indexOf('회신완료')<0){
        var st=STUDENTS.find(function(s){return s.id===ap.studentId;});
        if(st&&st.restrictionLevel!=='제한'){
          result.push({student:st,ap:ap,job:j,daysDiff:diff});
        }
      }
    });
  });
  return result;
}
function confirmBlacklist(studentId){
  var st=STUDENTS.find(function(s){return s.id===studentId;});
  if(!st)return;
  var msg='"'+st.name+'" ('+(st.phone||'-')+')\n\n이 학생을 영구 블랙리스트로 등록하시겠습니까?\n\n이후 동일 전화번호 등록 시 경고가 표시됩니다.';
  customConfirm(msg,async function(){
    var r=await SB.from('students').update({restriction_level:'제한'}).eq('id',studentId);
    if(r.error){customAlert('등록 오류: '+(r.error.message||JSON.stringify(r.error)));return;}
    await reloadData(['students']);
    customAlert('✅ 블랙리스트에 등록되었습니다.');
  },'🚫 블랙 확정','#DC2626');
}
function removeFromBlacklist(studentId){
  var st=STUDENTS.find(function(s){return s.id===studentId;});
  if(!st)return;
  var msg='"'+st.name+'"\n\n블랙리스트에서 해제하시겠습니까?';
  customConfirm(msg,async function(){
    var r=await SB.from('students').update({restriction_level:null}).eq('id',studentId);
    if(r.error){customAlert('오류: '+(r.error.message||JSON.stringify(r.error)));return;}
    await reloadData(['students']);
  },'해제','#059669');
}

function renderBlacklist(){
  var blList=STUDENTS.filter(function(s){return s.restrictionLevel==='제한';});
  var candidates=getBlacklistCandidates();

  function blSection(title,icon,color,bg,items,renderRow,empty){
    return'<div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:14px">'
      +'<div style="padding:14px 18px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;gap:8px">'
        +'<div style="width:28px;height:28px;border-radius:8px;background:'+bg+';display:flex;align-items:center;justify-content:center"><i class="ti '+icon+'" style="font-size:14px;color:'+color+'"></i></div>'
        +'<span style="font-size:14px;font-weight:600;color:#0F172A">'+title+'</span>'
        +'<span style="margin-left:auto;background:'+bg+';color:'+color+';padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600">'+items.length+'명</span>'
      +'</div>'
      +(items.length===0
        ?'<div style="padding:24px;text-align:center;color:#94A3B8;font-size:13px">'+empty+'</div>'
        :'<table style="width:100%;border-collapse:collapse"><tbody>'
          +items.map(renderRow).join('')
        +'</tbody></table>'
      )
    +'</div>';
  }

  var blHtml=blSection(
    '등록된 블랙리스트','ti-ban','#DC2626','#FEF2F2',
    blList,
    function(s){
      var apps=JOBS.reduce(function(a,j){return a.concat(j.applicants.filter(function(ap){return ap.studentId===s.id;}));}, []);
      return'<tr style="border-bottom:1px solid #F1F5F9">'
        +'<td style="padding:10px 16px"><div style="font-size:13px;font-weight:600;color:#0F172A">'+esc(s.name)+'</div><div style="font-size:12px;color:#94A3B8;margin-top:2px">'+esc(s.phone)+'</div></td>'
        +'<td style="padding:10px 16px;font-size:12px;color:#64748B">지원 '+apps.length+'건</td>'
        +'<td style="padding:10px 16px;text-align:right"><button onclick="removeFromBlacklist('+s.id+')" style="background:#F1F5F9;border:1px solid #E2E8F0;color:#374151;padding:5px 12px;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit">해제</button></td>'
      +'</tr>';
    },
    '등록된 블랙리스트가 없습니다'
  );

  var candHtml=blSection(
    '잠재 후보 (7일 이상 미회신)','ti-clock','#7C3AED','#F5F3FF',
    candidates,
    function(c){
      return'<tr style="border-bottom:1px solid #F1F5F9">'
        +'<td style="padding:10px 16px"><div style="font-size:13px;font-weight:600;color:#0F172A">'+esc(c.student.name)+'</div><div style="font-size:12px;color:#94A3B8;margin-top:2px">'+esc(c.student.phone)+'</div></td>'
        +'<td style="padding:10px 16px;font-size:12px;color:#64748B;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.job.name.length>22?c.job.name.slice(0,22)+'…':c.job.name)+'</td>'
        +'<td style="padding:10px 16px"><span style="background:#FEF3C7;color:#B45309;padding:2px 9px;border-radius:6px;font-size:12px;font-weight:600">'+c.daysDiff+'일 경과</span></td>'
        +'<td style="padding:10px 16px;text-align:right"><button onclick="confirmBlacklist('+c.student.id+')" style="background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;padding:5px 12px;border-radius:7px;font-size:12px;cursor:pointer;font-family:inherit">블랙 확정</button></td>'
      +'</tr>';
    },
    '해당 조건의 후보가 없습니다'
  );

  return'<div style="display:flex;flex-direction:column;height:100%;background:#FAFAF9">'
    +'<div style="padding:20px 24px 14px;border-bottom:1px solid #E5E7EB;background:#fff;flex-shrink:0">'
      +'<div style="display:flex;align-items:center;gap:10px">'
        +'<div style="width:36px;height:36px;border-radius:10px;background:#FEF2F2;border:1px solid #FECACA;display:flex;align-items:center;justify-content:center"><i class="ti ti-ban" style="font-size:18px;color:#DC2626"></i></div>'
        +'<div>'
          +'<div style="font-size:17px;font-weight:700;color:#0F172A">블랙리스트</div>'
          +'<div style="font-size:12px;color:#64748B;margin-top:1px">등록 '+blList.length+'명 · 잠재후보 '+candidates.length+'명</div>'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<div style="flex:1;overflow-y:auto;padding:16px 24px 24px">'
      +blHtml
      +candHtml
    +'</div>'
  +'</div>';
}
