// ===== QUIZ ADMIN FUNCTIONS =====
let _adminQuizQ = []; // custom questions added by admin

async function loadAdminQuizQuestions(){
  try{
    const r=await fetch('/api/admin/quiz-questions',{headers:{'x-admin-token':AK}});
    const d=await r.json();
    if(d.ok){ _adminQuizQ=d.questions||[]; renderAdminQuizList(); }
  }catch(e){ /* server may not have this route yet */ }
}

function renderAdminQuizList(){
  const el=document.getElementById('qz-list');
  const cnt=document.getElementById('qz-count');
  if(!el) return;
  cnt.textContent=_adminQuizQ.length;
  if(!_adminQuizQ.length){
    el.innerHTML='<p style="color:var(--mut);font-size:12px;text-align:center;padding:12px;">لا توجد أسئلة مضافة بعد</p>';
    return;
  }
  el.innerHTML=_adminQuizQ.map((q,i)=>`
    <div style="background:rgba(245,166,35,.07);border:1px solid rgba(245,166,35,.2);border-radius:10px;padding:10px 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
      <div style="flex:1;">
        <div style="font-size:13px;color:#fff;margin-bottom:4px;">❓ ${q.q}</div>
        <div style="font-size:12px;color:#4caf50;">✅ ${q.a}  <span style="color:var(--mut);margin-right:8px;">${q.hint?'💡 '+q.hint:''}</span>  <span style="color:#ffd700;">${q.points} نقطة</span></div>
      </div>
      <button onclick="deleteAdminQuizQ(${i})" style="background:rgba(255,60,60,.15);border:1px solid rgba(255,60,60,.3);color:#ff6b6b;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:12px;flex-shrink:0;">🗑️ حذف</button>
    </div>
  `).join('');
}

async function addQuizQ(){
  const q=document.getElementById('qz-q').value.trim();
  const a=document.getElementById('qz-a').value.trim();
  const hint=document.getElementById('qz-hint').value.trim();
  const pts=parseInt(document.getElementById('qz-pts').value)||50;
  if(!q||!a){ setMsg('qz-msg','يجب كتابة السؤال والإجابة','e'); return; }
  // Try server route first
  try{
    const r=await fetch('/api/admin/quiz-questions/add',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-admin-token':AK},
      body:JSON.stringify({q,a,hint,points:pts})
    });
    const d=await r.json();
    if(d.ok){
      _adminQuizQ=d.questions||[..._adminQuizQ,{q,a,hint,points:pts}];
      renderAdminQuizList();
      document.getElementById('qz-q').value='';
      document.getElementById('qz-a').value='';
      document.getElementById('qz-hint').value='';
      setMsg('qz-msg','✅ تمت إضافة السؤال للمسابقة','s');
      setTimeout(()=>setMsg('qz-msg','',''),3000);
      return;
    }
  }catch(e){}
  // Fallback: add locally (will reset on server restart)
  _adminQuizQ.push({q,a,hint,points:pts});
  socket.emit('admin-add-quiz-q',{q,a,hint,points:pts,token:AK});
  renderAdminQuizList();
  document.getElementById('qz-q').value='';
  document.getElementById('qz-a').value='';
  document.getElementById('qz-hint').value='';
  setMsg('qz-msg','✅ تمت إضافة السؤال','s');
  setTimeout(()=>setMsg('qz-msg','',''),3000);
}

async function deleteAdminQuizQ(idx){
  const q=_adminQuizQ[idx];
  if(!q) return;
  try{
    const r=await fetch('/api/admin/quiz-questions/remove',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-admin-token':AK},
      body:JSON.stringify({idx})
    });
    const d=await r.json();
    if(d.ok){ _adminQuizQ=d.questions||[]; renderAdminQuizList(); return; }
  }catch(e){}
  _adminQuizQ.splice(idx,1);
  renderAdminQuizList();
}

async function openAdmin(){
  document.getElementById('ap').classList.add('on');
  // ghost and owner see all tabs
  const isGhost = cu?.rank === 'ghost';
  const isOwner = cu?.rank === 'owner' || cu?.rank === 'ghost';
  const isAdmin = ['ghost','owner','owner_admin','owner_vip','super_admin','admin'].includes(cu?.rank);
  const spyBtn = document.getElementById('apt-spy');
  const logBtn = document.getElementById('apt-log');
  const bansBtn = document.getElementById('apt-bans');
  const badgesBtn = document.getElementById('apt-badges');
  if (spyBtn) spyBtn.style.display = isGhost ? '' : 'none';
  if (logBtn) logBtn.style.display = isOwner ? '' : 'none';
  if (bansBtn) bansBtn.style.display = isAdmin ? '' : 'none';
  if (badgesBtn) badgesBtn.style.display = isOwner ? '' : 'none';
  apTab('main');
  await refAdmin();
  loadAdminQuizQuestions();
  loadWelcomeSettings();
}
function closeAdmin(){document.getElementById('ap').classList.remove('on');}

// ===== ADMIN PANEL TABS =====
let _currentApTab = 'main';
function apTab(name){
  _currentApTab = name;
  ['main','rooms','words','quiz','perms','spy','log','bans','muted','reports','badges','gold','news','shop','emoji','rankicons','navicons'].forEach(t=>{
    const btn=document.getElementById('apt-'+t);
    const sec=document.getElementById('ap-sec-'+t);
    const sec2=document.getElementById('ap-sec-main2');
    if(btn) btn.classList.toggle('on', t===name);
    if(sec) sec.style.display = (t===name)?'block':'none';
    if(sec2) sec2.style.display = (name==='main')?'block':'none';
  });
  if(name==='perms') renderPermsUI();
  if(name==='rooms') renderRoomAccessManager();
  if(name==='words') { loadBadWords && loadBadWords(); }
  if(name==='spy') loadSpyConversations();
  if(name==='log') loadActivityLog();
  if(name==='bans') loadBanLog();
  if(name==='muted') loadMutedList();
  if(name==='reports') loadReportsAdmin();
  if(name==='badges') loadBadgesAdmin();
  if(name==='gold') { loadCallCostConfig(); loadGoldUsersTable(); }
  if(name==='news') loadAdminNews();
  if(name==='shop') loadAdminShop();
  if(name==='emoji') renderAdminEmojis();
  if(name==='rankicons') loadRankCustomAdmin();
  if(name==='navicons') renderNavIconsAdmin();
}

// ===== PERMISSIONS UI =====
const RANKS_ORDER = ['owner','owner_admin','owner_vip','super_admin','admin','premium','vip','gold','member','visitor'];

function renderPermsUI(){
  const c = document.getElementById('perms-container');
  if(!c) return;
  // Show create-rank section only for owner
  const crs = document.getElementById('create-rank-section');
  if(crs) crs.style.display = (cu?.rank==='owner'||cu?.rank==='ghost') ? 'block' : 'none';
  if(cu?.rank==='owner'||cu?.rank==='ghost') setupCreateRankPreview();
  const isOwner = cu?.rank === 'owner' || cu?.rank === 'ghost';
  c.innerHTML = RANKS_ORDER.map(rk => {
    const rColor = RK_COLOR[rk]||'#b0bec5';
    const rLabel = RK_LABEL[rk]||rk;
    const perms = _rankPerms[rk]||{};
    const allOn = ALL_PERMISSIONS.every(p=>perms[p.key]);
    const locked = rk==='owner'; // owner always has all, can't be edited
    const lockedPerms = ['can_create_rank']; // these perms are owner-only always
    return `
    <div class="perm-card" id="pcard-${rk}">
      <div class="perm-rank-hdr">
        <span style="font-size:18px;font-weight:800;color:${rColor};text-shadow:0 0 8px ${rColor}44;">${rLabel}</span>
        <span style="font-size:11px;color:var(--mut);flex:1;">(${rk})</span>
        ${locked?'<span style="font-size:11px;color:#ffd700;background:rgba(255,215,0,.1);padding:3px 10px;border-radius:6px;">🔒 مثبت</span>':`
        <button onclick="toggleAllPerms('${rk}',${!allOn})" style="font-size:11px;padding:4px 12px;background:${allOn?'rgba(239,68,68,.15)':'rgba(34,197,94,.15)'};color:${allOn?'#f87171':'#4ade80'};border:1px solid ${allOn?'rgba(239,68,68,.3)':'rgba(34,197,94,.3)'};border-radius:6px;cursor:pointer;">
          ${allOn?'❌ إلغاء الكل':'✅ تحديد الكل'}
        </button>`}
      </div>
      <div class="perm-grid">
        ${ALL_PERMISSIONS.map(p=>{
          const isOwnerOnly = p.key==='can_create_rank';
          const isLocked = locked || (isOwnerOnly && rk!=='owner');
          const checked = locked ? true : (isOwnerOnly && rk!=='owner') ? false : !!perms[p.key];
          const ownerOnlyBadge = isOwnerOnly ? `<span style="font-size:10px;background:rgba(255,68,68,.15);color:#f87171;border:1px solid rgba(255,68,68,.3);border-radius:4px;padding:1px 6px;margin-right:4px;">مالك فقط</span>` : '';
          return `
          <label class="perm-item${checked?' active':''}${isOwnerOnly?' perm-owner-only':''}" id="pi-${rk}-${p.key}" ${isLocked?'style="opacity:.5;pointer-events:none;"':''}>
            <input type="checkbox" class="perm-cb" ${checked?'checked':''} ${isLocked?'disabled':''}
              onchange="togglePerm('${rk}','${p.key}',this.checked)">
            <div class="perm-lbl">
              <strong>${p.label}${ownerOnlyBadge}</strong>
              ${p.desc}
            </div>
          </label>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function togglePerm(rank, permKey, val){
  if(!_rankPerms[rank]) _rankPerms[rank]={};
  _rankPerms[rank][permKey] = val;
  // Update item style
  const item = document.getElementById(`pi-${rank}-${permKey}`);
  if(item) item.classList.toggle('active', val);
  // Update toggle-all button
  renderPermsToggleBtn(rank);
}

function renderPermsToggleBtn(rank){
  const card = document.getElementById('pcard-'+rank);
  if(!card) return;
  const perms = _rankPerms[rank]||{};
  const allOn = ALL_PERMISSIONS.every(p=>perms[p.key]);
  const btn = card.querySelector('button[onclick^="toggleAllPerms"]');
  if(btn){
    btn.textContent = allOn?'❌ إلغاء الكل':'✅ تحديد الكل';
    btn.style.background = allOn?'rgba(239,68,68,.15)':'rgba(34,197,94,.15)';
    btn.style.color = allOn?'#f87171':'#4ade80';
    btn.style.borderColor = allOn?'rgba(239,68,68,.3)':'rgba(34,197,94,.3)';
    btn.setAttribute('onclick',`toggleAllPerms('${rank}',${!allOn})`);
  }
}

function toggleAllPerms(rank, val){
  if(!_rankPerms[rank]) _rankPerms[rank]={};
  ALL_PERMISSIONS.forEach(p=>{
    _rankPerms[rank][p.key]=val;
    const item=document.getElementById(`pi-${rank}-${p.key}`);
    if(item){
      item.classList.toggle('active',val);
      const cb=item.querySelector('.perm-cb');
      if(cb) cb.checked=val;
    }
  });
  renderPermsToggleBtn(rank);
}

function savePermsAll(){
  saveRankPerms();
  // Apply immediately to current user
  const msg=document.getElementById('perms-msg');
  if(msg){
    msg.textContent='✅ تم حفظ الصلاحيات بنجاح! تنطبق فوراً على جميع الأعضاء.';
    msg.style.color='#4ade80';
    setTimeout(()=>{msg.textContent='';},3000);
  }
  // Refresh admin button visibility
  const ab=document.getElementById('admin-btn');
  if(ab) ab.style.display=hasPerm('can_view_admin_panel')?'flex':'none';
  toast('✅ تم حفظ الصلاحيات','k');
}

function resetPermsToDefault(){
  if(!confirm('هل تريد استعادة الصلاحيات الافتراضية لجميع الرتب؟')) return;
  _rankPerms = JSON.parse(JSON.stringify(DEFAULT_PERMS));
  saveRankPerms();
  renderPermsUI();
  toast('↩️ تم استعادة الصلاحيات الافتراضية','k');
}

// ===== CREATE NEW RANK (Owner Only) =====
function setupCreateRankPreview(){
  ['nr-key','nr-label','nr-emoji','nr-color','nr-size','nr-glow'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('input',updateRankPreview);
    if(el) el.addEventListener('change',updateRankPreview);
  });
}
function updateRankPreview(){
  const emoji=document.getElementById('nr-emoji')?.value||'🌟';
  const label=document.getElementById('nr-label')?.value||'اسم الرتبة';
  const color=document.getElementById('nr-color')?.value||'#9c27b0';
  const size=document.getElementById('nr-size')?.value||'15px';
  const glow=document.getElementById('nr-glow')?.checked;
  const prev=document.getElementById('nr-preview');
  if(!prev) return;
  prev.textContent=`${emoji} ${label}`;
  prev.style.color=color;
  prev.style.fontSize=size;
  prev.style.background=color+'15';
  prev.style.borderColor=color+'44';
  if(glow) prev.style.textShadow=`0 0 8px ${color}`;
  else prev.style.textShadow='none';
}
function createNewRank(){
  if(cu?.rank!=='owner'&&cu?.rank!=='ghost'){toast('⛔ هذه الصلاحية للمالك فقط','e');return;}
  const key=(document.getElementById('nr-key')?.value||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const label=(document.getElementById('nr-label')?.value||'').trim();
  const emoji=(document.getElementById('nr-emoji')?.value||'🌟').trim();
  const color=document.getElementById('nr-color')?.value||'#9c27b0';
  const size=document.getElementById('nr-size')?.value||'15px';
  const glow=document.getElementById('nr-glow')?.checked;
  const msg=document.getElementById('nr-msg');
  if(!key){msg.style.color='#f87171';msg.textContent='❌ أدخل مفتاح الرتبة';return;}
  if(!label){msg.style.color='#f87171';msg.textContent='❌ أدخل اسم الرتبة';return;}
  if(RK_COLOR[key]){msg.style.color='#f87171';msg.textContent='❌ هذا المفتاح موجود مسبقاً';return;}
  // Add to runtime rank data
  RK_COLOR[key]=color;
  RK_LABEL[key]=`${emoji} ${label}`;
  RK_SIZE[key]=size;
  RK_WEIGHT[key]='600';
  if(glow) RK_GLOW[key]=`0 0 6px ${color}`;
  // Add default perms (all false)
  _rankPerms[key]={};
  ALL_PERMISSIONS.forEach(p=>{ _rankPerms[key][p.key]=false; });
  DEFAULT_PERMS[key]={};
  ALL_PERMISSIONS.forEach(p=>{ DEFAULT_PERMS[key][p.key]=false; });
  // Save custom ranks
  try{
    const customRanks=JSON.parse(localStorage.getItem('ghazal_custom_ranks')||'[]');
    customRanks.push({key,label:`${emoji} ${label}`,color,size,glow});
    localStorage.setItem('ghazal_custom_ranks',JSON.stringify(customRanks));
  }catch(e){}
  saveRankPerms();
  msg.style.color='#4ade80';
  msg.textContent=`✅ تم إنشاء رتبة "${emoji} ${label}" بنجاح!`;
  // Clear inputs
  ['nr-key','nr-label','nr-emoji'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  // Re-render perms to show new rank
  setTimeout(()=>{renderPermsUI();msg.textContent='';},1500);
  toast(`⚡ رتبة جديدة: ${emoji} ${label}`,'k');
}
// Load saved custom ranks on startup
(function loadCustomRanks(){
  try{
    const cr=JSON.parse(localStorage.getItem('ghazal_custom_ranks')||'[]');
    cr.forEach(({key,label,color,size,glow})=>{
      if(!RK_COLOR[key]){
        RK_COLOR[key]=color; RK_LABEL[key]=label; RK_SIZE[key]=size||'15px'; RK_WEIGHT[key]='600';
        if(glow) RK_GLOW[key]=`0 0 6px ${color}`;
        if(!_rankPerms[key]){_rankPerms[key]={};ALL_PERMISSIONS.forEach(p=>{_rankPerms[key][p.key]=false;});}
      }
    });
  }catch(e){}
})();
// ===== END CREATE RANK =====

// ===== PM SPY SYSTEM =====
let _spyUser1=null, _spyUser2=null, _spyPC=null, _spyStream=null;
let _spyStream2=null, _spyZoomed=0, _spyTrackCount=0, _spyPC2=null;

function spyToggleZoom(cam){
  const grid=document.getElementById('spy-cams-grid');
  const w1=document.getElementById('spy-cam1-wrap');
  const w2=document.getElementById('spy-cam2-wrap');
  if(_spyZoomed===cam){
    // Un-zoom → back to split
    _spyZoomed=0;
    grid.style.gridTemplateColumns='1fr 1fr';
    w1.style.display='block';
    w2.style.display='block';
  } else {
    // Zoom chosen cam
    _spyZoomed=cam;
    if(cam===1){
      grid.style.gridTemplateColumns='1fr';
      w1.style.display='block';
      w2.style.display='none';
    } else {
      grid.style.gridTemplateColumns='1fr';
      w1.style.display='none';
      w2.style.display='block';
    }
  }
}

async function loadSpyConversations(){
  const c=document.getElementById('spy-conv-list');
  if(!c) return;
  if(cu?.rank!=='owner'&&cu?.rank!=='ghost'){
    c.innerHTML='<p style="color:#f87171;font-size:13px;">⛔ هذه الصلاحية للمالك فقط.</p>';
    return;
  }
  c.innerHTML='<p style="color:#888;font-size:12px;">جارٍ التحميل...</p>';
  try{
    const r=await fetch('/api/admin/pm-conversations',{headers:{'x-admin-token':AK}});
    const d=await r.json();
    if(!d.ok){ c.innerHTML='<p style="color:#f87171;font-size:12px;">❌ خطأ</p>'; return; }
    if(!d.conversations.length){
      c.innerHTML='<p style="color:var(--mut);font-size:12px;">لا توجد محادثات خاصة في هذه الجلسة بعد.</p>';
      return;
    }
    c.innerHTML='';
    d.conversations.forEach(conv=>{
      const div=document.createElement('div');
      const hasCall=conv.hasActiveCall;
      div.style.cssText='background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:.2s;';
      div.onmouseover=function(){this.style.background='rgba(239,68,68,.12)';};
      div.onmouseout=function(){this.style.background='rgba(239,68,68,.06)';};
      div.innerHTML=`
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:#f87171;">${conv.users[0]} ↔ ${conv.users[1]}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:2px;">${conv.count} رسالة${conv.lastTime?' · '+conv.lastTime:''}</div>
          ${hasCall?`<div style="font-size:11px;color:#4ade80;margin-top:3px;display:flex;align-items:center;gap:4px;"><span style="width:7px;height:7px;background:#4ade80;border-radius:50%;animation:pulse 1s infinite;display:inline-block;"></span>${conv.callType==='video'?'📹 مكالمة فيديو نشطة':'📞 مكالمة صوتية نشطة'}</div>`:''}
        </div>
        <button onclick="spyOn('${conv.users[0]}','${conv.users[1]}')" style="background:${hasCall?'rgba(74,222,128,.2)':'rgba(239,68,68,.2)'};color:${hasCall?'#4ade80':'#f87171'};border:1px solid ${hasCall?'rgba(74,222,128,.3)':'rgba(239,68,68,.3)'};border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px;font-family:'Cairo',sans-serif;flex-shrink:0;">${hasCall?'📹 دخول المكالمة':'👁️ مراقبة'}</button>`;
      c.appendChild(div);
    });
  }catch(e){ c.innerHTML='<p style="color:#f87171;font-size:12px;">❌ خطأ في التحميل</p>'; }
}

function openSpyWindow(){
  const u1=document.getElementById('spy-user1')?.value.trim();
  const u2=document.getElementById('spy-user2')?.value.trim();
  if(!u1||!u2){ toast('❌ أدخل اسمي المستخدمين','e'); return; }
  if(u1===u2){ toast('❌ اسمان مختلفان مطلوبان','e'); return; }
  spyOn(u1,u2);
}

function spyOn(user1,user2){
  if(cu?.rank!=='owner'&&cu?.rank!=='ghost'){ toast('⛔ للمالك فقط','e'); return; }
  // Leave previous
  if(_spyUser1&&_spyUser2) socket.emit('spy-leave',{user1:_spyUser1,user2:_spyUser2});
  _stopSpyCall();
  _pendingReceiverSid = null;
  _spyUser1=user1; _spyUser2=user2;
  document.getElementById('spy-title').textContent=user1+' ↔ '+user2;
  document.getElementById('spy-call-section').style.display='none';
  document.getElementById('spy-call-status').textContent='لا توجد مكالمة نشطة';
  document.getElementById('spy-msgs').innerHTML='<div style="color:#555;font-size:12px;text-align:center;padding:20px;">جارٍ التحميل...</div>';
  document.getElementById('spy-modal').style.display='flex';
  socket.emit('spy-join',{user1,user2,adminName:cu?.name});
}

function closeSpyModal(){
  if(_spyUser1&&_spyUser2) socket.emit('spy-leave',{user1:_spyUser1,user2:_spyUser2});
  _stopSpyCall();
  _spyUser1=null; _spyUser2=null;
  document.getElementById('spy-modal').style.display='none';
}

function _stopSpyCall(){
  if(_spyPC){ _spyPC.close(); _spyPC=null; }
  if(_spyPC2){ _spyPC2.close(); _spyPC2=null; }
  if(_spyStream){ _spyStream.getTracks().forEach(t=>t.stop()); _spyStream=null; }
  if(_spyStream2){ _spyStream2.getTracks().forEach(t=>t.stop()); _spyStream2=null; }
  _spyTrackCount=0; _spyZoomed=0;
  const sv=document.getElementById('spy-video');
  const sv2=document.getElementById('spy-video2');
  if(sv){ sv.srcObject=null; }
  if(sv2){ sv2.srcObject=null; }
  const grid=document.getElementById('spy-cams-grid');
  const w1=document.getElementById('spy-cam1-wrap');
  const w2=document.getElementById('spy-cam2-wrap');
  if(grid) grid.style.gridTemplateColumns='1fr 1fr';
  if(w1) w1.style.display='block';
  if(w2) w2.style.display='block';
  const ph=document.getElementById('spy-cam2-placeholder');
  if(ph) ph.style.display='flex';
}


function renderSpyMsg(pm){
  const c=document.getElementById('spy-msgs');
  if(!c) return;
  const placeholder=c.querySelector('[data-placeholder]');
  if(placeholder) placeholder.remove();
  const isLeft=pm.from===_spyUser1;
  const nc=RK_COLOR[pm.fromRank]||'#b0bec5';
  const d=document.createElement('div');
  d.style.cssText='display:flex;flex-direction:column;align-items:'+(isLeft?'flex-start':'flex-end')+';margin-bottom:4px;';
  let contentHtml='';
  if(pm.type==='pm-image' && pm.imageData){
    contentHtml=`<img src="${pm.imageData}" style="max-width:200px;max-height:180px;border-radius:8px;display:block;cursor:pointer;" onclick="openImgFull('${pm.imageData}')" alt="صورة">`;
  } else {
    contentHtml=`<div style="font-size:13px;color:#e0e0e0;line-height:1.5;">${esc(pm.text||'')}</div>`;
  }
  d.innerHTML=`<div style="max-width:80%;background:${isLeft?'rgba(239,68,68,.1)':'rgba(255,255,255,.05)'};border:1px solid ${isLeft?'rgba(239,68,68,.2)':'rgba(255,255,255,.1)'};border-radius:${isLeft?'4px 14px 14px 14px':'14px 4px 14px 14px'};padding:8px 12px;">
    <div style="font-size:11px;color:${nc};font-weight:700;margin-bottom:3px;">${esc(pm.from)}</div>
    ${contentHtml}
    <div style="font-size:10px;color:#555;margin-top:4px;">${pm.time||''}</div>
  </div>`;
  c.appendChild(d);
  c.scrollTop=c.scrollHeight;
}

// Socket listeners for spy
socket.on('spy-history',(d)=>{
  const c=document.getElementById('spy-msgs');
  if(!c) return;
  c.innerHTML='';
  if(!d.messages.length){
    const p=document.createElement('div');
    p.setAttribute('data-placeholder','1');
    p.style.cssText='color:#555;font-size:12px;text-align:center;padding:20px;';
    p.textContent='لا توجد رسائل محفوظة بعد. المراقبة الفعلية تعمل 🔴';
    c.appendChild(p);
  } else {
    d.messages.forEach(m=>renderSpyMsg(m));
  }
  const info=document.getElementById('spy-info');
  if(info) info.textContent=d.messages.length+' رسالة محفوظة · تحديث فوري للرسائل الجديدة';
});

socket.on('spy-pm',(pm)=>{
  if(document.getElementById('spy-modal').style.display==='none') return;
  if(pm.from===_spyUser1||pm.from===_spyUser2||pm.to===_spyUser1||pm.to===_spyUser2) renderSpyMsg(pm);
});

// ===== SPY WebRTC - CLEAN IMPLEMENTATION =====
const ICE_CFG_SPY = { iceServers:[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:stun.cloudflare.com:3478'},
  {urls:'turn:a.relay.metered.ca:443',username:'e8dd65f021b9b6a7310524e3',credential:'uBpJqHGPpFMKVoSJ'},
  {urls:'turns:a.relay.metered.ca:443',username:'e8dd65f021b9b6a7310524e3',credential:'uBpJqHGPpFMKVoSJ'}
]};

function _makeSpyPC(camNum, userSid){
  const pc = new RTCPeerConnection(ICE_CFG_SPY);
  pc._targetSid = userSid; // for routing answers back
  pc.ontrack = e => {
    if(e.track.kind === 'video'){
      const stream = e.streams[0] || new MediaStream([e.track]);
      if(camNum === 1){
        _spyStream = stream;
        const sv = document.getElementById('spy-video');
        sv.srcObject = stream; sv.play().catch(()=>{});
        const lbl = document.getElementById('spy-cam1-label');
        if(lbl && _spyUser1) lbl.textContent = '📹 ' + _spyUser1;
      } else {
        _spyStream2 = stream;
        const sv2 = document.getElementById('spy-video2');
        sv2.srcObject = stream; sv2.play().catch(()=>{});
        const ph = document.getElementById('spy-cam2-placeholder');
        if(ph) ph.style.display = 'none';
        const lbl2 = document.getElementById('spy-cam2-label');
        if(lbl2 && _spyUser2) lbl2.textContent = '📹 ' + _spyUser2;
        document.getElementById('spy-call-status').textContent = '🔴 كلتا الكاميرتين نشطتان';
      }
      document.getElementById('spy-call-section').style.display = 'block';
      document.getElementById('spy-call-status').textContent = camNum===2
        ? '🔴 كلتا الكاميرتين نشطتان' : '🔴 كاميرا 1 نشطة — انتظار الثانية...';
    } else if(e.track.kind === 'audio' && camNum === 1){
      const sa = document.getElementById('spy-audio');
      sa.srcObject = e.streams[0]||new MediaStream([e.track]);
      sa.play().catch(()=>{});
    }
  };
  pc.onicecandidate = e => {
    if(e.candidate) socket.emit('spy-to-user-ice',{targetSid: userSid, candidate: e.candidate});
  };
  pc.onconnectionstatechange = ()=>{
    const st = pc.connectionState;
    if(st==='failed'||st==='disconnected') console.warn('SpyPC'+camNum+' state:',st);
  };
  return pc;
}

// Step 1: Server tells spy that call started — spy connects to CALLER
socket.on('spy-call-offer', async (d) => {
  if(document.getElementById('spy-modal').style.display==='none') return;
  document.getElementById('spy-call-section').style.display='block';
  document.getElementById('spy-call-status').textContent='⏳ مكالمة '+(d.type==='video'?'فيديو':'صوتية')+' — جارٍ الاتصال...';
  _stopSpyCall();
  try {
    _spyPC = _makeSpyPC(1, d.callerSid);
    _spyPC.addTransceiver('video',{direction:'recvonly'});
    _spyPC.addTransceiver('audio',{direction:'recvonly'});
    const offer = await _spyPC.createOffer();
    await _spyPC.setLocalDescription(offer);
    socket.emit('spy-to-user-offer',{targetSid: d.callerSid, offer: _spyPC.localDescription});
    // Check if receiver-ready was already buffered, connect after short delay
    setTimeout(async () => {
      if(_pendingReceiverSid) {
        const pd = _pendingReceiverSid; _pendingReceiverSid = null;
        await _connectSpyToReceiver(pd);
      }
    }, 800);
  } catch(e){ console.error('spy-call-offer PC1 error:',e); }
});

// Step 2: Server tells spy that receiver accepted — spy connects to RECEIVER too
let _pendingReceiverSid = null;
socket.on('spy-receiver-ready', async (d) => {
  // Always buffer — process when modal is open and PC1 is ready
  _pendingReceiverSid = d;
  const modalOpen = document.getElementById('spy-modal').style.display !== 'none';
  if(!modalOpen) return; // will be processed when spyOn() is called via spy-join
  if(!_spyPC || _spyPC.signalingState === 'closed') {
    // PC1 not ready yet — wait for it
    setTimeout(async () => {
      if(_pendingReceiverSid && _spyPC && document.getElementById('spy-modal').style.display !== 'none') {
        const pd = _pendingReceiverSid; _pendingReceiverSid = null;
        await _connectSpyToReceiver(pd);
      }
    }, 2000);
    return;
  }
  _pendingReceiverSid = null;
  await _connectSpyToReceiver(d);
});

async function _connectSpyToReceiver(d) {
  try {
    if(_spyPC2){ _spyPC2.close(); _spyPC2=null; }
    _spyPC2 = _makeSpyPC(2, d.receiverSid);
    _spyPC2.addTransceiver('video',{direction:'recvonly'});
    _spyPC2.addTransceiver('audio',{direction:'recvonly'});
    const offer = await _spyPC2.createOffer();
    await _spyPC2.setLocalDescription(offer);
    socket.emit('spy-to-user-offer',{targetSid: d.receiverSid, offer: _spyPC2.localDescription});
  } catch(e){ console.error('spy-receiver PC2 error:',e); }
}

// ICE from either call party forwarded to spy (for existing _spyPC/_spyPC2)
socket.on('spy-call-ice', async (d) => {
  // forward to both PCs — they'll reject wrong candidates
  try{ if(_spyPC&&_spyPC.remoteDescription&&d.candidate) await _spyPC.addIceCandidate(new RTCIceCandidate(d.candidate)); }catch(e){}
  try{ if(_spyPC2&&_spyPC2.remoteDescription&&d.candidate) await _spyPC2.addIceCandidate(new RTCIceCandidate(d.candidate)); }catch(e){}
});

// User (caller or receiver) sends answer back to spy — route by userSid
socket.on('spy-from-user-answer', async (d) => {
  // d.userSid tells us which PC this answer belongs to
  try{
    if(_spyPC && _spyPC._targetSid === d.userSid && _spyPC.signalingState==='have-local-offer'){
      await _spyPC.setRemoteDescription(new RTCSessionDescription(d.answer));
    } else if(_spyPC2 && _spyPC2._targetSid === d.userSid && _spyPC2.signalingState==='have-local-offer'){
      await _spyPC2.setRemoteDescription(new RTCSessionDescription(d.answer));
    } else {
      // Fallback: try whichever is waiting
      if(_spyPC && _spyPC.signalingState==='have-local-offer'){
        await _spyPC.setRemoteDescription(new RTCSessionDescription(d.answer));
      } else if(_spyPC2 && _spyPC2.signalingState==='have-local-offer'){
        await _spyPC2.setRemoteDescription(new RTCSessionDescription(d.answer));
      }
    }
  }catch(e){ console.error('spy-from-user-answer error:',e); }
});

// ICE from user to spy
socket.on('spy-from-user-ice', async (d) => {
  try{ if(_spyPC&&_spyPC.remoteDescription&&d.candidate) await _spyPC.addIceCandidate(new RTCIceCandidate(d.candidate)); }catch(e){}
  try{ if(_spyPC2&&_spyPC2.remoteDescription&&d.candidate) await _spyPC2.addIceCandidate(new RTCIceCandidate(d.candidate)); }catch(e){}
});

socket.on('spy-call-active',(d)=>{
  if(document.getElementById('spy-modal').style.display==='none') return;
  document.getElementById('spy-call-section').style.display='block';
  document.getElementById('spy-call-status').textContent='⏳ مكالمة نشطة — جارٍ الاتصال...';
  // Server already sends spy-call-offer with saved offer — this is just fallback
});

socket.on('spy-call-ended',()=>{
  _stopSpyCall();
  document.getElementById('spy-call-section').style.display='none';
  document.getElementById('spy-call-status').textContent='⚫ انتهت المكالمة';
  toast('📵 انتهت مكالمة المراقبة','k');
});
// ===== END SPY SYSTEM =====

// ===== ACTIVITY LOG =====
let _allLogEntries = [];
const ACTION_COLORS = {
  '🚫': '#f87171', '⛔': '#f87171', '✅': '#4ade80', '🏅': '#fbbf24',
  '🔑': '#60a5fa', '🗑️': '#fb923c', '🏠': '#34d399', '✏️': '#a78bfa',
  '🔇': '#fb923c', '🔊': '#34d399', '⚙️': '#94a3b8', '👑': '#ffd700'
};

async function loadActivityLog() {
  if (cu?.rank !== 'owner' && cu?.rank !== 'ghost') {
    document.getElementById('activity-log-list').innerHTML = '<p style="color:#f87171;font-size:13px;">⛔ للمالك فقط.</p>';
    return;
  }
  try {
    const r = await fetch('/api/admin/activity-log', { headers: { 'x-admin-token': AK } });
    const d = await r.json();
    if (!d.ok) return;
    _allLogEntries = d.log;
    renderLog(_allLogEntries);
  } catch(e) {
    document.getElementById('activity-log-list').innerHTML = '<p style="color:#f87171;font-size:12px;">❌ خطأ في تحميل السجل</p>';
  }
}

function renderLog(entries) {
  const c = document.getElementById('activity-log-list');
  if (!c) return;
  if (!entries.length) {
    c.innerHTML = '<p style="color:var(--mut);font-size:12px;text-align:center;padding:20px;">لا توجد إجراءات مسجلة بعد في هذه الجلسة.</p>';
    return;
  }
  c.innerHTML = '';
  entries.forEach(e => {
    const div = document.createElement('div');
    const rankColor = RK_COLOR[e.rank] || '#94a3b8';
    const firstEmoji = e.action.charAt(0);
    const acColor = ACTION_COLORS[firstEmoji] || '#94a3b8';
    div.style.cssText = 'background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-right:3px solid '+acColor+';border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:12px;';
    div.innerHTML = `
      <div style="font-size:20px;flex-shrink:0;">${firstEmoji}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:13px;font-weight:700;color:${rankColor};">${e.admin}</span>
          <span style="font-size:10px;background:rgba(255,255,255,.06);border-radius:6px;padding:2px 7px;color:#888;">${RK_LABEL[e.rank]||e.rank}</span>
          <span style="font-size:12px;color:${acColor};">${e.action}</span>
          ${e.target?`<span style="font-size:12px;color:#fff;font-weight:600;">${e.target}</span>`:''}
        </div>
        ${e.details?`<div style="font-size:11px;color:#888;margin-top:3px;">${e.details}</div>`:''}
      </div>
      <div style="font-size:11px;color:#555;flex-shrink:0;text-align:left;">${e.time}</div>`;
    c.appendChild(div);
  });
}

function filterLog() {
  const q = document.getElementById('log-filter')?.value.toLowerCase().trim();
  if (!q) { renderLog(_allLogEntries); return; }
  const filtered = _allLogEntries.filter(e =>
    e.admin.toLowerCase().includes(q) ||
    e.action.toLowerCase().includes(q) ||
    (e.target||'').toLowerCase().includes(q) ||
    (e.details||'').toLowerCase().includes(q)
  );
  renderLog(filtered);
}
// ===== END ACTIVITY LOG =====

// ===== BAN LOG =====
let _allBanEntries=[];
async function loadBanLog(){
  const c=document.getElementById('ban-log-list');
  if(!c) return;
  c.innerHTML='<p style="color:#888;font-size:12px;">جارٍ التحميل...</p>';
  try{
    const r=await fetch('/api/admin/ban-log',{headers:{'x-admin-token':AK}});
    const d=await r.json();
    if(!d.ok){ c.innerHTML='<p style="color:#f87171;">❌ خطأ</p>'; return; }
    _allBanEntries=d.log;
    renderBanLog(_allBanEntries);
  }catch(e){ c.innerHTML='<p style="color:#f87171;font-size:12px;">❌ خطأ في التحميل</p>'; }
}
function renderBanLog(entries){
  const c=document.getElementById('ban-log-list');
  if(!c) return;
  if(!entries.length){ c.innerHTML='<p style="color:var(--mut);font-size:12px;text-align:center;padding:20px;">لا يوجد سجل حظر.</p>'; return; }
  c.innerHTML='';
  entries.forEach(e=>{
    const div=document.createElement('div');
    const active=e.active!==false;
    div.style.cssText='background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:12px 14px;';
    div.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:20px;">${active?'🚫':'✅'}</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:${active?'#f87171':'#4ade80'};">${e.username}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:2px;">
            ${e.reason?`السبب: <span style="color:#fbbf24;">${e.reason}</span> · `:''}
            بواسطة: <span style="color:#a78bfa;">${e.bannedBy||''}</span>
            ${e.time?' · '+e.time:''}
          </div>
          ${!active&&e.unbannedBy?`<div style="font-size:11px;color:#4ade80;margin-top:2px;">رُفع الحظر بواسطة: ${e.unbannedBy} ${e.unbannedTime?'· '+e.unbannedTime:''}</div>`:''}
        </div>
        <span style="font-size:11px;background:${active?'rgba(239,68,68,.15)':'rgba(74,222,128,.1)'};color:${active?'#f87171':'#4ade80'};border:1px solid ${active?'rgba(239,68,68,.3)':'rgba(74,222,128,.2)'};border-radius:6px;padding:3px 10px;flex-shrink:0;">${active?'محظور الآن':'رُفع الحظر'}</span>
        ${active&&hasPerm('can_unban')?`<button onclick="aUnban('${e.username}')" class="aab ab-unban" style="flex-shrink:0;">✅ رفع</button>`:''}
      </div>`;
    c.appendChild(div);
  });
}
function filterBanLog(){
  const q=document.getElementById('ban-filter')?.value.toLowerCase().trim();
  if(!q){ renderBanLog(_allBanEntries); return; }
  renderBanLog(_allBanEntries.filter(e=>(e.username||'').toLowerCase().includes(q)||(e.reason||'').toLowerCase().includes(q)||(e.bannedBy||'').toLowerCase().includes(q)));
}
// ===== END BAN LOG =====

// ===== MUTED USERS MANAGEMENT =====
async function loadMutedList() {
  const c = document.getElementById('muted-list');
  const bar = document.getElementById('muted-count-bar');
  const countTxt = document.getElementById('muted-count-txt');
  if (!c) return;
  c.innerHTML = '<p style="color:#888;font-size:12px;text-align:center;padding:20px;">جارٍ التحميل...</p>';
  try {
    const r = await fetch('/api/admin/muted', { headers: { 'x-admin-token': AK } });
    const d = await r.json();
    if (!d.ok) { c.innerHTML = '<p style="color:#f87171;">❌ خطأ</p>'; return; }
    const list = d.muted || [];
    // تحديث شريط العداد
    if (bar && countTxt) {
      if (list.length > 0) {
        bar.style.display = 'block';
        countTxt.textContent = list.length + ' عضو مكتوم حالياً';
      } else {
        bar.style.display = 'none';
      }
    }
    if (!list.length) {
      c.innerHTML = '<div style="text-align:center;color:var(--mut);padding:40px;font-size:13px;"><div style="font-size:40px;margin-bottom:10px;">🔊</div><div>لا يوجد أعضاء مكتومون حالياً</div></div>';
      return;
    }
    c.innerHTML = '';
    list.forEach(u => {
      const div = document.createElement('div');
      div.style.cssText = 'background:rgba(144,202,249,.05);border:1px solid rgba(144,202,249,.18);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px;';
      div.innerHTML = `
        <span style="font-size:24px;flex-shrink:0;">🔇</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:700;color:#90caf9;">${esc(u.username)}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:3px;display:flex;gap:10px;flex-wrap:wrap;">
            <span>${u.online ? '<span style="color:#69f0ae;">● متصل الآن</span>' : '<span style="color:#f87171;">● غير متصل</span>'}</span>
            ${u.room ? `<span>الغرفة: ${esc(u.room)}</span>` : ''}
            ${u.rank ? `<span>الرتبة: ${esc(u.rank)}</span>` : ''}
          </div>
        </div>
        <button onclick="adminUnmuteUser('${u.username.replace(/'/g,"\\'")}', this)"
          style="background:linear-gradient(135deg,rgba(0,230,118,.2),rgba(0,200,100,.15));
          border:1px solid rgba(0,230,118,.35);color:#69f0ae;border-radius:8px;
          padding:7px 16px;cursor:pointer;font-size:12px;font-family:'Cairo',sans-serif;font-weight:700;flex-shrink:0;white-space:nowrap;">
          🔊 فك الكتم
        </button>`;
      c.appendChild(div);
    });
  } catch(e) {
    c.innerHTML = '<p style="color:#f87171;font-size:12px;text-align:center;padding:20px;">❌ خطأ في التحميل</p>';
  }
}

async function adminUnmuteUser(username, btn) {
  if (!confirm('فك الكتم عن ' + username + '؟')) return;
  try {
    btn.disabled = true;
    btn.textContent = '...';
    const r = await fetch('/api/admin/unmute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': AK },
      body: JSON.stringify({ username, adminName: cu?.name, adminRank: cu?.rank })
    });
    const d = await r.json();
    if (d.ok) {
      toast('🔊 تم فك الكتم عن ' + username, 'k');
      // كمان افك الكتم عبر socket مباشرة
      socket.emit('admin-unmute', { username });
      // أعد تحميل القائمة
      setTimeout(loadMutedList, 500);
    } else {
      toast('❌ فشل: ' + (d.msg || ''), 'e');
      btn.disabled = false;
      btn.textContent = '🔊 فك الكتم';
    }
  } catch(e) {
    toast('❌ خطأ في الاتصال', 'e');
    btn.disabled = false;
    btn.textContent = '🔊 فك الكتم';
  }
}
// ===== END MUTED USERS =====

// ===== REPORTS ADMIN =====
async function loadReportsAdmin() {
  const el = document.getElementById('reports-list');
  if (!el) return;
  el.innerHTML = '<p style="text-align:center;color:#888;font-size:12px;padding:20px;">جارٍ التحميل...</p>';
  try {
    const r = await fetch('/api/admin/reports', { headers: { 'x-admin-token': AK } });
    const d = await r.json();
    if (!d.ok) { el.innerHTML = '<p style="color:#f87171;">❌ خطأ</p>'; return; }
    const reports = d.reports || [];
    if (!reports.length) {
      el.innerHTML = '<div style="text-align:center;color:var(--mut);padding:40px;"><div style="font-size:40px;margin-bottom:10px;">✅</div>لا توجد بلاغات</div>';
      return;
    }
    el.innerHTML = '';
    reports.forEach(rp => {
      const div = document.createElement('div');
      div.style.cssText = 'background:rgba(255,183,77,.05);border:1px solid rgba(255,183,77,.2);border-radius:12px;padding:12px 16px;';
      div.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;">
          <span style="font-size:22px;flex-shrink:0;">🚨</span>
          <div style="flex:1;min-width:200px;">
            <div style="font-size:13px;font-weight:700;color:#ffb74d;">بلاغ ضد: ${esc(rp.reported)}</div>
            <div style="font-size:12px;color:#fff;margin:4px 0;background:rgba(255,255,255,.05);border-radius:6px;padding:4px 8px;">${esc(rp.reason)}</div>
            ${rp.details ? `<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:3px;">تفاصيل: ${esc(rp.details)}</div>` : ''}
            <div style="font-size:11px;color:var(--mut);margin-top:4px;">
              من: <span style="color:#90caf9;">${esc(rp.from)}</span>
              · الغرفة: ${esc(rp.room||'')}
              · ${rp.time||''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">
            <button onclick="cx3='${rp.reported}';cxMute();toast('🔇 تم كتم '+cx3,'k')" style="background:rgba(255,183,77,.15);border:1px solid rgba(255,183,77,.3);color:#ffb74d;border-radius:7px;padding:4px 10px;cursor:pointer;font-size:11px;font-family:'Cairo',sans-serif;">🔇 كتم</button>
            <button onclick="cx3='${rp.reported}';cxKick()" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#f87171;border-radius:7px;padding:4px 10px;cursor:pointer;font-size:11px;font-family:'Cairo',sans-serif;">🚪 طرد</button>
          </div>
        </div>`;
      el.appendChild(div);
    });
  } catch(e) {
    el.innerHTML = '<p style="color:#f87171;font-size:12px;text-align:center;padding:20px;">❌ خطأ في التحميل</p>';
  }
}

async function clearReportsAdmin() {
  if (!confirm('مسح جميع البلاغات؟')) return;
  await fetch('/api/admin/reports/clear', { method:'POST', headers:{'x-admin-token':AK} });
  toast('🗑️ تم مسح البلاغات', 'k');
  loadReportsAdmin();
}
// ===== END REPORTS ADMIN =====

// ===== BADGES SYSTEM =====
let _allBadges=[], _allUserBadges={};

async function loadBadgesAdmin(){
  try{
    const r=await fetch('/api/badges');
    const d=await r.json();
    if(!d.ok) return;
    _allBadges=d.badges; _allUserBadges=d.userBadges||{};
    renderBadgesAdmin();
  }catch(e){}
}

function renderBadgesAdmin(){
  const c=document.getElementById('badges-list');
  if(!c) return;
  if(!_allBadges.length){ c.innerHTML='<p style="color:var(--mut);font-size:12px;">لا توجد شارات بعد.</p>'; return; }
  c.innerHTML='';
  _allBadges.forEach(b=>{
    const div=document.createElement('div');
    div.style.cssText='background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.12);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:12px;';
    div.innerHTML=`
      <span style="font-size:24px;">${b.emoji}</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:${b.color||'#ffd700'};">${b.name}</div>
        ${b.description?`<div style="font-size:11px;color:var(--mut);">${b.description}</div>`:''}
      </div>
      <button onclick="deleteBadge(${b.id},'${b.name}')" class="aab ab-ban" style="flex-shrink:0;font-size:11px;">🗑️ حذف</button>`;
    c.appendChild(div);
  });
}

async function createBadge(){
  const name=document.getElementById('badge-name')?.value.trim();
  const emoji=document.getElementById('badge-emoji')?.value.trim();
  const color=document.getElementById('badge-color')?.value;
  const desc=document.getElementById('badge-desc')?.value.trim();
  const msg=document.getElementById('badge-create-msg');
  if(!name||!emoji){ if(msg){msg.style.color='#f87171';msg.textContent='❌ الاسم والإيموجي مطلوبان';} return; }
  try{
    const r=await fetch('/api/admin/badges/add',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({name,emoji,color,description:desc,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});
    const d=await r.json();
    if(d.ok){ if(msg){msg.style.color='#4ade80';msg.textContent='✅ تم إنشاء الشارة';} loadBadgesAdmin(); document.getElementById('badge-name').value=''; document.getElementById('badge-emoji').value=''; document.getElementById('badge-desc').value=''; }
    else{ if(msg){msg.style.color='#f87171';msg.textContent='❌ '+d.msg;} }
  }catch(e){ if(msg){msg.style.color='#f87171';msg.textContent='❌ خطأ';} }
}

async function deleteBadge(id,name){
  if(!confirm('حذف شارة "'+name+'"؟')) return;
  const r=await fetch('/api/admin/badges/delete',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({id,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});
  const d=await r.json();
  if(d.ok){ toast('🗑️ تم حذف الشارة','k'); loadBadgesAdmin(); }
  else toast('❌ '+d.msg,'e');
}

async function loadUserBadgesAdmin(){
  const username=document.getElementById('badge-assign-user')?.value.trim();
  if(!username){ toast('❌ أدخل اسم العضو','e'); return; }
  const c=document.getElementById('user-badges-admin');
  c.innerHTML='<p style="color:#888;font-size:12px;">جارٍ التحميل...</p>';
  try{
    const r=await fetch('/api/user-badges/'+encodeURIComponent(username));
    const d=await r.json();
    const userBadgeIds=(d.badges||[]).map(b=>b.id);
    c.innerHTML='<div style="font-size:12px;color:#fbbf24;margin-bottom:10px;">اختر الشارات لـ '+username+':</div>';
    if(!_allBadges.length){ c.innerHTML+='<p style="color:var(--mut);font-size:12px;">لا توجد شارات متاحة.</p>'; return; }
    _allBadges.forEach(b=>{
      const has=userBadgeIds.includes(b.id);
      const row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:6px;';
      row.innerHTML=`
        <span style="font-size:20px;">${b.emoji}</span>
        <span style="font-size:13px;color:${b.color||'#ffd700'};flex:1;">${b.name}</span>
        ${has
          ?`<button onclick="revokeBadge('${username}',${b.id},this)" class="aab ab-ban" style="font-size:11px;">🚫 سحب</button>`
          :`<button onclick="assignBadge('${username}',${b.id},this)" class="aab ab-unban" style="font-size:11px;">🎖️ منح</button>`
        }`;
      c.appendChild(row);
    });
  }catch(e){ c.innerHTML='<p style="color:#f87171;font-size:12px;">❌ خطأ</p>'; }
}

async function assignBadge(username,badgeId,btn){
  const r=await fetch('/api/admin/badges/assign',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({username,badgeId,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});
  const d=await r.json();
  if(d.ok){ toast('🎖️ تم منح الشارة لـ '+username,'k'); loadUserBadgesAdmin(); }
  else toast('❌ '+d.msg,'e');
}

async function revokeBadge(username,badgeId,btn){
  const r=await fetch('/api/admin/badges/revoke',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({username,badgeId,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});
  const d=await r.json();
  if(d.ok){ toast('✅ تم سحب الشارة','k'); loadUserBadgesAdmin(); }
  else toast('❌ '+d.msg,'e');
}

// Load badges on startup for display in messages/profile
async function loadGlobalBadges(){
  try{
    const r=await fetch('/api/badges');
    const d=await r.json();
    if(!d.ok) return;
    _globalBadges={}; d.badges.forEach(b=>{ _globalBadges[b.id]=b; });
    _globalUserBadges=d.userBadges||{};
  }catch(e){}
}
setTimeout(loadGlobalBadges,2000);

// Handle badge received notification
socket.on('badge-received',b=>{
  toast('🎖️ حصلت على شارة جديدة: '+b.emoji+' '+b.name,'k');
  loadGlobalBadges(); // Refresh
});
// ===== END BADGES SYSTEM =====

// ===== ROOM ACCESS MANAGER =====
function renderRoomAccessManager(){
  const c=document.getElementById('room-access-list');
  if(!c) return;
  // Only show for owner
  if(cu?.rank!=='owner'&&cu?.rank!=='ghost'){
    c.innerHTML='<p style="color:var(--mut);font-size:13px;">هذا القسم متاح للمالك فقط.</p>';
    return;
  }
  const privateRooms=Object.entries(rd).filter(([id,r])=>r.isPrivate);
  if(!privateRooms.length){
    c.innerHTML='<p style="color:var(--mut);font-size:13px;">لا توجد غرف خاصة حالياً.</p>';
    return;
  }
  const allRanks=['owner','owner_admin','owner_vip','super_admin','admin','premium','vip','gold','member'];
  c.innerHTML=privateRooms.map(([roomId,room])=>{
    const allowed=room.allowedRanks||[];
    return `
    <div style="background:rgba(10,22,40,.8);border:1px solid rgba(176,68,255,.2);border-radius:12px;padding:16px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <span style="font-size:20px;">${room.icon}</span>
        <span style="font-size:14px;font-weight:700;color:#ce93d8;">${room.name}</span>
        <span style="font-size:11px;color:var(--mut);">(${roomId})</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        ${allRanks.map(rk=>{
          const isChecked=allowed.includes(rk);
          const rColor=RK_COLOR[rk]||'#b0bec5';
          const rLabel=RK_LABEL[rk]||rk;
          return `
          <label id="ra-${roomId}-${rk}" style="display:flex;align-items:center;gap:7px;padding:7px 12px;background:${isChecked?rColor+'18':'rgba(255,255,255,.03)'};border:1px solid ${isChecked?rColor+'55':'rgba(255,255,255,.08)'};border-radius:10px;cursor:pointer;transition:.2s;min-width:140px;">
            <input type="checkbox" ${isChecked?'checked':''} style="accent-color:${rColor};width:16px;height:16px;cursor:pointer;"
              onchange="toggleRoomRank('${roomId}','${rk}',this.checked,this)">
            <span style="font-size:12px;color:${rColor};font-weight:600;">${rLabel}</span>
          </label>`;
        }).join('')}
      </div>
      <button onclick="saveRoomAccess('${roomId}')" class="btn btn-p" style="padding:8px 18px;font-size:12px;">💾 حفظ صلاحيات ${room.name}</button>
    </div>`;
  }).join('');
}

// Pending changes per room
let _roomAccessPending={};
function toggleRoomRank(roomId, rank, val, el){
  if(!_roomAccessPending[roomId]){
    // Start from current allowed list
    _roomAccessPending[roomId]=[...(rd[roomId]?.allowedRanks||[])];
  }
  if(val && !_roomAccessPending[roomId].includes(rank)) _roomAccessPending[roomId].push(rank);
  if(!val) _roomAccessPending[roomId]=_roomAccessPending[roomId].filter(r=>r!==rank);
  // Update label style
  const lbl=document.getElementById(`ra-${roomId}-${rank}`);
  if(lbl){
    const rColor=RK_COLOR[rank]||'#b0bec5';
    lbl.style.background=val?rColor+'18':'rgba(255,255,255,.03)';
    lbl.style.borderColor=val?rColor+'55':'rgba(255,255,255,.08)';
  }
}

async function saveRoomAccess(roomId){
  if(cu?.rank!=='owner'&&cu?.rank!=='ghost'){toast('⛔ للمالك فقط','e');return;}
  const allowedRanks=_roomAccessPending[roomId]||(rd[roomId]?.allowedRanks||[]);
  const msg=document.getElementById('room-access-msg');
  try{
    const r=await fetch('/api/admin/room-access',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-admin-token':AK},
      body:JSON.stringify({roomId,allowedRanks})
    });
    const d=await r.json();
    if(d.ok){
      if(rd[roomId]) rd[roomId].allowedRanks=allowedRanks;
      delete _roomAccessPending[roomId];
      if(msg){msg.style.color='#4ade80';msg.textContent=`✅ تم حفظ صلاحيات ${rd[roomId]?.name||roomId}`;setTimeout(()=>msg.textContent='',3000);}
      toast('✅ تم حفظ صلاحيات الغرفة','k');
      renderRooms();
    } else {
      if(msg){msg.style.color='#f87171';msg.textContent='❌ '+(d.msg||'خطأ');}
    }
  }catch(e){
    if(msg){msg.style.color='#f87171';msg.textContent='❌ خطأ في الاتصال';}
  }
}
// ===== END ROOM ACCESS MANAGER =====

async function refAdmin(){
  // Online users table
  const onlineTbl = document.getElementById('online-tbl');
  const onlineUsers = Object.values({});
  onlineTbl.innerHTML = '<p style="color:var(--mut);font-size:12px;">المتصلون يظهرون في قائمة اليسار</p>';

  // All users
  try{
    const r=await fetch('/api/admin/users',{headers:{'x-admin-token':AK}});
    const d=await r.json();if(!d.ok)return;
    document.getElementById('atbl2').innerHTML=`<table class="atbl">
      <thead><tr><th>الاسم</th><th>الرتبة</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
      <tbody>${d.users.map(u=>`<tr>
        <td><strong style="color:${RK_COLOR[u.rank]||'#fff'}">${u.username}</strong></td>
        <td><span style="font-size:11px;">${RK_LABEL[u.rank]||'عضو'}</span></td>
        <td>${u.is_banned?'<span class="tag-ban">🚫 محظور</span>':'<span class="tag-ok">✅ نشط</span>'}</td>
        <td>
          ${!u.is_banned?`<button class="aab ab-ban" onclick="aBan('${u.username}')">🚫 حظر</button>`:`<button class="aab ab-unban" onclick="aUnban('${u.username}')">✅ رفع</button>`}
          ${hasPerm('can_change_username')?`<button class="aab" style="background:rgba(255,183,77,.15);color:#ffcc80;border:1px solid rgba(255,183,77,.3);" onclick="adminRenameUser('${u.username}')">✏️ اسم</button>`:''}
          <select onchange="aRank('${u.username}',this.value)" style="background:#0d1f3c;color:white;border:1px solid rgba(245,166,35,.3);border-radius:7px;padding:3px 7px;font-family:'Cairo',sans-serif;font-size:11px;margin:2px;">
            <option value="" disabled selected>تغيير الرتبة</option>
            <option value="visitor">👁️ زائر</option>
            <option value="member">👤 عضو مسجل</option>
            <option value="gold">🥇 عضو ذهبي</option>
            <option value="vip">🌟 عضو مميز</option>
            <option value="premium">💎 بريميوم</option>
            <option value="admin">⚙️ أدمن</option>
            <option value="super_admin">🔱 سوبر أدمن</option>
            <option value="owner_vip">⭐ أونر</option>
            <option value="owner_admin">💼 أونر إداري</option>
            <option value="owner">👑 مالك</option>
          </select>
        </td>
      </tr>`).join('')}</tbody></table>`;
  }catch(e){console.error(e);}

  // Load bad words
  await loadBadWords();

  // Rooms management table
  document.getElementById('rooms-tbl').innerHTML=`<table class="atbl">
    <thead><tr><th>الأيقونة</th><th>الاسم</th><th>الإجراءات</th></tr></thead>
    <tbody>${Object.entries(rd).map(([id,r])=>`<tr>
      <td style="font-size:22px;text-align:center;">${r.icon}</td>
      <td>
        <strong>${r.name}</strong>
        <div style="font-size:10px;color:var(--mut);">${id}</div>
      </td>
      <td>
        <button class="aab" style="background:rgba(66,165,245,.2);color:#90caf9;border:1px solid rgba(66,165,245,.3);" onclick="editRoomModal('${id}','${r.name}','${r.icon}','${r.color||'#1565c0'}')">✏️ تعديل</button>
        <button class="aab ab-ban" onclick="clearRoom('${id}')">🗑️ مسح</button>
        ${id!=='general'?`<button class="aab" style="background:rgba(239,83,80,.3);color:#ef9a9a;border:1px solid rgba(239,83,80,.4);" onclick="deleteRoom('${id}','${r.name}')">❌ حذف</button>`:'<span style="font-size:10px;color:var(--mut);">محمية</span>'}
      </td>
    </tr>`).join('')}</tbody></table>`;
}

// Admin reset warnings
async function aResetWarn(n) {
  socket.emit('admin-resetwarn', { username: n });
  toast('✅ تم إعادة تعيين تحذيرات ' + n, 'k');
}

async function aBan(n){if(!confirm(`حظر ${n}؟`))return;const reason=prompt('سبب الحظر (اختياري):','')||'';const r=await fetch('/api/admin/ban',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({username:n,reason,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});const d=await r.json();if(d.ok){toast('🚫 تم حظر '+n,'k');refAdmin();}}
async function aUnban(n){const r=await fetch('/api/admin/unban',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({username:n,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});const d=await r.json();if(d.ok){toast('✅ رفع الحظر عن '+n,'k');refAdmin();}}
async function aRank(n,rank){if(!rank)return;const r=await fetch('/api/admin/setrank',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({username:n,rank,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});const d=await r.json();if(d.ok){toast('✅ تم تغيير رتبة '+n,'k');refAdmin();}}
async function clearRoom(id){if(!confirm(`مسح رسائل ${rd[id]?.name}؟`))return;const r=await fetch('/api/admin/clearroom',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({room:id,adminName:cu?.name||cu?.username,adminRank:cu?.rank})});const d=await r.json();if(d.ok)toast('🗑️ تم مسح الغرفة','k');}

function logout(){
  localStorage.removeItem('ghazal_user');
  socket.disconnect();
  cu = null;
  cr = 'general';
  document.getElementById('chat-page').style.display='none';
  document.getElementById('landing').style.display='flex';
  // إخفاء الإعلان والشريط عند الخروج
  const hssiq = document.getElementById('hssiq-sig');
  if(hssiq) hssiq.style.display='none';
  const deskBar2 = document.getElementById('desk-second-bar');
  if(deskBar2) deskBar2.style.display='none';
  const bottomBar = document.getElementById('chat-bottom-bar');
  if(bottomBar) bottomBar.style.display='none';
  const mobNav = document.getElementById('mob-nav');
  if(mobNav) mobNav.style.display='none';
  const topBar = document.getElementById('mob-top-bar');
  if(topBar) topBar.style.display='none';
  document.getElementById('msgs').innerHTML='<div class="welcome">🌟 أهلاً وسهلاً بكم في غزل عراقي 🌟</div>';
  document.getElementById('rlist').innerHTML='';
  document.getElementById('ulist').innerHTML='';
}
// ROOM MANAGEMENT FUNCTIONS
function pickIcon(icon) {
  document.getElementById('new-room-icon').value = icon;
}

async function addRoom() {
  const name = document.getElementById('new-room-name').value.trim();
  const icon = document.getElementById('new-room-icon').value.trim() || '🏠';
  const color = document.getElementById('new-room-color').value;
  const msgEl = document.getElementById('add-room-msg');

  if (!name) return (msgEl.textContent='أدخل اسم الغرفة', msgEl.className='fmsg e');

  try {
    const r = await fetch('/api/admin/addroom', {method:'POST', headers:{'Content-Type':'application/json','x-admin-token':AK}, body:JSON.stringify({name,icon,color})});
    const d = await r.json();
    if (!d.ok) return (msgEl.textContent=d.msg, msgEl.className='fmsg e');
    msgEl.textContent = '✅ تم إضافة غرفة ' + name;
    msgEl.className = 'fmsg k';
    document.getElementById('new-room-name').value='';
    document.getElementById('new-room-icon').value='';
    toast('✅ تم إضافة غرفة: ' + name, 'k');
    await refAdmin();
    setTimeout(()=>msgEl.className='fmsg', 3000);
  } catch(e) { msgEl.textContent='خطأ في الاتصال'; msgEl.className='fmsg e'; }
}

async function deleteRoom(id, name) {
  if (!confirm('حذف غرفة ' + name + '؟ سيتم نقل المتصلين للغرفة العامة')) return;
  const r = await fetch('/api/admin/deleteroom', {method:'POST', headers:{'Content-Type':'application/json','x-admin-token':AK}, body:JSON.stringify({id})});
  const d = await r.json();
  if (d.ok) { toast('🗑️ تم حذف ' + name, 'k'); refAdmin(); }
  else toast('❌ ' + d.msg, 'e');
}

// Edit room modal
let editingRoomId = null;
function editRoomModal(id, name, icon, color) {
  editingRoomId = id;
  // Create inline edit row
  const row = document.querySelector(`[data-room-id="${id}"]`);
  
  // Simple prompt-based edit for now
  const newName = prompt('اسم الغرفة الجديد:', name);
  if (newName === null) return;
  const newIcon = prompt('أيقونة الغرفة:', icon);
  if (newIcon === null) return;
  
  editRoom(id, newName.trim() || name, newIcon.trim() || icon, color);
}

async function editRoom(id, name, icon, color) {
  try {
    const r = await fetch('/api/admin/editroom', {method:'POST', headers:{'Content-Type':'application/json','x-admin-token':AK}, body:JSON.stringify({id,name,icon,color})});
    const d = await r.json();
    if (d.ok) { toast('✅ تم تعديل الغرفة', 'k'); refAdmin(); }
    else toast('❌ ' + d.msg, 'e');
  } catch(e) { toast('خطأ في الاتصال','e'); }
}

// ===== BAD WORDS MANAGEMENT =====
let bwData = { default: [], custom: [] };
let currentBWTab = 'custom';

async function loadBadWords() {
  try {
    const r = await fetch('/api/admin/badwords', { headers: { 'x-admin-token': AK } });
    const d = await r.json();
    if (!d.ok) return;
    bwData = d;
    document.getElementById('custom-count').textContent = d.custom.length;
    document.getElementById('default-count').textContent = d.default.length;
    renderBadWords();
  } catch(e) { console.error(e); }
}

function showBWTab(tab) {
  currentBWTab = tab;
  document.getElementById('bw-tab-custom').classList.toggle('on', tab === 'custom');
  document.getElementById('bw-tab-default').classList.toggle('on', tab === 'default');
  renderBadWords();
}

function filterBadWords() {
  renderBadWords();
}

function renderBadWords() {
  const search = (document.getElementById('bw-search')?.value || '').toLowerCase();
  const list = document.getElementById('bw-list');
  if (!list) return;
  
  const words = currentBWTab === 'custom' ? bwData.custom : bwData.default;
  const filtered = search ? words.filter(w => w.includes(search)) : words;
  
  if (filtered.length === 0) {
    list.innerHTML = `<div style="color:var(--mut);font-size:12px;padding:10px;">${search ? 'لا توجد نتائج' : currentBWTab === 'custom' ? 'لا توجد كلمات مضافة بعد' : ''}</div>`;
    return;
  }

  list.innerHTML = filtered.map(w => `
    <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(239,83,80,.12);border:1px solid rgba(239,83,80,.25);border-radius:20px;padding:4px 10px;font-size:12px;color:#ef9a9a;">
      <span>${w}</span>
      <button onclick="${currentBWTab === 'custom' ? `removeBadWord('${w}')` : `removeDefaultWord('${w}')`}" 
        style="background:transparent;border:none;color:#ef5350;cursor:pointer;font-size:14px;padding:0;line-height:1;">×</button>
    </div>
  `).join('');
}

async function addBadWord() {
  const input = document.getElementById('new-bad-word');
  const word = input.value.trim();
  const msgEl = document.getElementById('bw-msg');
  if (!word) return (msgEl.textContent='أدخل الكلمة', msgEl.className='fmsg e');
  
  try {
    const r = await fetch('/api/admin/badwords/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': AK },
      body: JSON.stringify({ word })
    });
    const d = await r.json();
    if (!d.ok) return (msgEl.textContent=d.msg, msgEl.className='fmsg e');
    
    msgEl.textContent = '✅ تمت إضافة: ' + word;
    msgEl.className = 'fmsg k';
    input.value = '';
    bwData.custom = d.custom;
    document.getElementById('custom-count').textContent = d.custom.length;
    currentBWTab = 'custom';
    showBWTab('custom');
    toast('✅ تمت إضافة كلمة ممنوعة جديدة', 'k');
    setTimeout(() => msgEl.className='fmsg', 3000);
  } catch(e) { msgEl.textContent='خطأ'; msgEl.className='fmsg e'; }
}

async function removeBadWord(word) {
  if (!confirm('حذف "' + word + '" من القائمة؟')) return;
  const r = await fetch('/api/admin/badwords/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': AK },
    body: JSON.stringify({ word })
  });
  const d = await r.json();
  if (d.ok) {
    bwData.custom = d.custom;
    document.getElementById('custom-count').textContent = d.custom.length;
    renderBadWords();
    toast('🗑️ تم حذف الكلمة', 'k');
  }
}

async function removeDefaultWord(word) {
  if (!confirm('حذف "' + word + '" من القائمة الافتراضية؟')) return;
  const r = await fetch('/api/admin/badwords/removedefault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': AK },
    body: JSON.stringify({ word })
  });
  const d = await r.json();
  if (d.ok) {
    bwData.default = bwData.default.filter(w => w !== word);
    document.getElementById('default-count').textContent = bwData.default.length;
    renderBadWords();
    toast('🗑️ تم حذف الكلمة', 'k');
  }
}

function openChangePass(){
  if(cu?.rank === 'visitor'){
    toast('⚠️ الزوار لا يملكون كلمة مرور — سجّل كعضو أولاً','e');
    return;
  }
  document.getElementById('cp-old').value='';
  document.getElementById('cp-new').value='';
  // support both old and new field names
  const c1=document.getElementById('cp-new2'); if(c1) c1.value='';
  const c2=document.getElementById('cp-con'); if(c2) c2.value='';
  const m1=document.getElementById('cpm-msg'); if(m1){m1.textContent='';m1.className='fmsg';}
  const m2=document.getElementById('cp-msg'); if(m2){m2.textContent='';}
  openM('cp');
}

// دالة تغيير كلمة المرور للنموذج الجديد
async function doChangePass(){
  const oldp=document.getElementById('cp-old').value;
  const newp=document.getElementById('cp-new').value;
  const conf=document.getElementById('cp-con')?.value || document.getElementById('cp-new2')?.value;
  const msgEl=document.getElementById('cp-msg')||document.getElementById('cpm-msg');
  if(!oldp||!newp||!conf){if(msgEl){msgEl.style.color='#f87171';msgEl.textContent='❌ أدخل جميع الحقول';} return;}
  if(newp!==conf){if(msgEl){msgEl.style.color='#f87171';msgEl.textContent='❌ كلمة المرور غير متطابقة';} return;}
  if(newp.length<4){if(msgEl){msgEl.style.color='#f87171';msgEl.textContent='❌ كلمة المرور قصيرة (4 أحرف على الأقل)';} return;}
  try{
    const r=await fetch('/api/changepass',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:cu.name,oldpassword:oldp,newpassword:newp})});
    const d=await r.json();
    if(!d.ok){if(msgEl){msgEl.style.color='#f87171';msgEl.textContent='❌ '+d.msg;} return;}
    if(msgEl){msgEl.style.color='#4ade80';msgEl.textContent='✅ تم تغيير كلمة المرور بنجاح!';}
    setTimeout(()=>closeM('cp'),2000);
  }catch(e){if(msgEl){msgEl.style.color='#f87171';msgEl.textContent='❌ خطأ في الاتصال';}}
}

async function changeMyPass(){
  const oldp=document.getElementById('cp-old').value;
  const newp=document.getElementById('cp-new').value;
  const newp2=document.getElementById('cp-new2').value;
  const msgEl=document.getElementById('cpm-msg');

  if(!oldp||!newp||!newp2)return(msgEl.textContent='أدخل جميع الحقول',msgEl.className='fmsg e');
  if(newp!==newp2)return(msgEl.textContent='كلمة المرور الجديدة غير متطابقة',msgEl.className='fmsg e');
  if(newp.length<4)return(msgEl.textContent='كلمة المرور قصيرة جداً (4 أحرف على الأقل)',msgEl.className='fmsg e');
  if(oldp===newp)return(msgEl.textContent='كلمة المرور الجديدة مطابقة للقديمة',msgEl.className='fmsg e');

  try{
    const r=await fetch('/api/changepass',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:cu.name,oldpassword:oldp,newpassword:newp})});
    const d=await r.json();
    if(!d.ok)return(msgEl.textContent=d.msg,msgEl.className='fmsg e');
    msgEl.textContent='✅ تم تغيير كلمة المرور بنجاح!';
    msgEl.className='fmsg k';
    toast('✅ تم تغيير كلمة المرور بنجاح','k');
    setTimeout(()=>{closeM('cp');},2000);
  }catch(e){msgEl.textContent='خطأ في الاتصال';msgEl.className='fmsg e';}
}

async function resetPassInline(){
  const u=document.getElementById('rpu-inline').value.trim();
  const p=document.getElementById('rpp-inline').value;
  const msgEl=document.getElementById('rpi-msg');
  if(!u||!p)return (msgEl.textContent='أدخل اسم المستخدم وكلمة المرور',msgEl.className='fmsg e');
  if(p.length<4)return (msgEl.textContent='كلمة المرور قصيرة جداً',msgEl.className='fmsg e');
  try{
    const r=await fetch('/api/admin/resetpass',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({username:u,newpassword:p})});
    const d=await r.json();
    if(!d.ok)return (msgEl.textContent=d.msg,msgEl.className='fmsg e');
    msgEl.textContent='✅ تم تغيير كلمة مرور '+u+' بنجاح';
    msgEl.className='fmsg k';
    document.getElementById('rpu-inline').value='';
    document.getElementById('rpp-inline').value='';
    toast('✅ تم تغيير كلمة مرور '+u,'k');
    setTimeout(()=>msgEl.className='fmsg',3000);
  }catch(e){msgEl.textContent='خطأ في الاتصال';msgEl.className='fmsg e';}
}

// ===== GOLD & DIAMOND SYSTEM =====
// myGold declared in features.js

// gold-updated handler في features.js

// call-no-gold handler في features.js

// call-cost-updated handler في features.js

// showGoldModal — معرَّفة في features.js

// Admin gold functions
async function saveCallCost() {
  const voice = parseInt(document.getElementById('cfg-voice-cost').value) || 0;
  const video = parseInt(document.getElementById('cfg-video-cost').value) || 0;
  const r = await fetch('/api/admin/call-cost', {
    method:'POST', headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({voice, video, adminName: cu?.name, adminRank: cu?.rank})
  }).then(r=>r.json());
  const msg = document.getElementById('cfg-cost-msg');
  msg.textContent = r.ok ? '✅ تم الحفظ' : '❌ ' + r.msg;
  setTimeout(() => msg.textContent = '', 3000);
}

async function adminSetGold() {
  const username = document.getElementById('gold-target-user').value.trim();
  const gold = parseInt(document.getElementById('gold-amount').value) || 0;
  const diamond = parseInt(document.getElementById('diamond-amount').value) || 0;
  if (!username) return;
  const r = await fetch('/api/admin/gold/set', {
    method:'POST', headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({username, gold, diamond, adminName: cu?.name, adminRank: cu?.rank})
  }).then(r=>r.json());
  const msg = document.getElementById('gold-admin-msg');
  msg.textContent = r.ok ? `✅ تم | ذهب:${r.gold} ماس:${r.diamond}` : '❌ ' + r.msg;
  setTimeout(() => msg.textContent = '', 4000);
  loadGoldUsersTable();
}

async function adminResetGold() {
  const username = document.getElementById('gold-target-user').value.trim();
  if (!username) return;
  if (!confirm(`إعادة تعيين ذهب وماس ${username} إلى صفر؟`)) return;
  const r = await fetch('/api/admin/gold/reset', {
    method:'POST', headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({username, adminName: cu?.name, adminRank: cu?.rank})
  }).then(r=>r.json());
  const msg = document.getElementById('gold-admin-msg');
  msg.textContent = r.ok ? '✅ تمت إعادة التعيين' : '❌ ' + r.msg;
  setTimeout(() => msg.textContent = '', 3000);
  loadGoldUsersTable();
}

async function loadGoldUsersTable() {
  const tbl = document.getElementById('gold-users-tbl');
  if (!tbl) return;
  // Build table from online users
  const users = Array.from(document.querySelectorAll('[data-uname]')).map(el => el.dataset.uname).filter(Boolean);
  if (users.length === 0) { tbl.innerHTML = '<p style="color:var(--mut);font-size:12px;">لا يوجد متصلون الآن</p>'; return; }
  tbl.innerHTML = '<p style="color:var(--mut);font-size:11px;margin-bottom:8px;">اضغط على اسم عضو لتحديد الحقل تلقائياً</p>' +
    users.map(u => `<div onclick="document.getElementById('gold-target-user').value='${u}'" style="cursor:pointer;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:5px;font-size:13px;display:flex;justify-content:space-between;align-items:center;transition:.2s;" onmouseenter="this.style.background='rgba(255,215,0,.07)'" onmouseleave="this.style.background='rgba(255,255,255,.03)'"><span>${u}</span><span style="color:#ffd700;font-size:11px;">انقر للتحديد</span></div>`).join('');
}

async function loadCallCostConfig() {
  try {
    const r = await fetch('/api/admin/call-cost', {headers:{'x-admin-token':'ghazal-admin-2024'}}).then(r=>r.json());
    if (r.ok) {
      const vc = document.getElementById('cfg-voice-cost');
      const vdc = document.getElementById('cfg-video-cost');
      if (vc) vc.value = r.config.voice;
      if (vdc) vdc.value = r.config.video;
      callCostCfg = r.config;
    }
  } catch(e){}
}
// ===== END GOLD & DIAMOND SYSTEM =====

// ===== YOUTUBE IN CHAT =====
// _pendingYtId declared in features.js
// getYouTubeId — معرَّفة في features.js
// detectYouTube — معرَّفة في features.js
// sendYouTubeMsg — معرَّفة في features.js
// cancelYouTube — معرَّفة في features.js
// youtube-message handler في features.js
// ===== END YOUTUBE IN CHAT =====

// ===== CHAT IMAGE SEND =====
// sendChatImage — معرَّفة في features.js
// openImgFull — معرَّفة في features.js
// chat-image-msg handler في features.js
// ===== END CHAT IMAGE =====

// ===== NAME STYLE IN USER LIST =====
// Listen for ranks-updated event
// ranks-updated handler في features.js

async function saveNameStyle() {
  const nameColor = document.getElementById('ns-color')?.value || null;
  const nameFontSize = document.getElementById('ns-size')?.value || null;
  const nameFontFamily = document.getElementById('ns-font')?.value || null;
  const username = cu?.name;
  if (!username) return;
  const r = await fetch('/api/name-style', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username, nameColor, nameFontSize, nameFontFamily})
  }).then(r=>r.json());
  if (r.ok) {
    toast('✅ تم حفظ تنسيق الاسم', 'k');
    // Update session
    if (cu) { cu.nameColor=nameColor; cu.nameFontSize=nameFontSize; cu.nameFontFamily=nameFontFamily; }
    const saved = localStorage.getItem('ghazal_user');
    if (saved) { const u=JSON.parse(saved); u.nameColor=nameColor; u.nameFontSize=nameFontSize; u.nameFontFamily=nameFontFamily; localStorage.setItem('ghazal_user',JSON.stringify(u)); }
  } else toast('❌ ' + r.msg, 'e');
}
// ===== END NAME STYLE =====

// ===== ADMIN RANK ICONS =====
async function loadRankCustomAdmin() {
  const c = document.getElementById('rank-custom-container');
  if (!c) return;
  const r = await fetch('/api/admin/rank-custom', {headers:{'x-admin-token':'ghazal-admin-2024'}}).then(r=>r.json());
  if (!r.ok) return;
  const rankNames = {owner:'مالك',owner_admin:'أونر إداري',owner_vip:'أونر',super_admin:'سوبر أدمن',admin:'أدمن',premium:'بريميوم',vip:'مميز',gold:'ذهبي',member:'عضو',visitor:'زائر'};
  const defaultIcons = {owner:'👑',owner_admin:'💼',owner_vip:'⭐',super_admin:'🔱',admin:'⚙️',premium:'💎',vip:'🌟',gold:'🥇',member:'👤',visitor:'👁️'};

  // أيقونات منظمة بفئات — مثل فوتوشوب
  const emojiCategories = [
    {label:'👑 ملكية وتيجان', icons:['👑','🫅','🤴','👸','💎','🏆','⭐','🌟','✨','🔱','🥇','🎖️','🏅','🎗️','💫','🌠']},
    {label:'⚔️ فروسية وقتال', icons:['🛡️','⚔️','🗡️','🏹','🪖','🏰','🚩','🔑','🗝️','💣','☠️','💀','🪬','🔐','🛠️','⚙️']},
    {label:'🔥 قوة وعناصر',   icons:['🔥','⚡','❄️','🌪️','⛈️','☄️','🌌','💥','🌊','☀️','🌙','🌈','🌋','💧','🌬️','⚗️']},
    {label:'🦁 مخلوقات',      icons:['🦁','🦅','🐉','🦄','🐺','🐯','🦊','🐻','🐍','🐙','🦋','🦸','🦹','🧙','🥷','👾']},
    {label:'🌹 طبيعة وزهور',  icons:['🌹','🌸','🍀','🌺','🌼','🌻','🌷','🌿','🌴','🌵','🍁','🍄','🌾','🎋','🌱','🪷']},
    {label:'🔮 سحر وغموض',    icons:['🔮','🪄','🎭','👻','😈','🃏','🎪','🧿','♾️','⚛️','🌀','🕸️','🪞','🧬','💠','🔷']},
    {label:'♔ رموز شطرنج',   icons:['♔','♕','♖','♗','♘','♙','★','☆','✦','✧','⬡','◈','✴️','🔶','🟣','⚫']},
    {label:'🎵 فنون وترفيه',  icons:['🎭','🎨','🎬','🎤','🎧','🎵','🎶','🎸','🏆','🎯','🎲','🃏','🎪','🚀','🌍','💰']},
  ];

  const categorySections = emojiCategories.map(cat=>`
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;color:#888;font-weight:700;margin-bottom:7px;letter-spacing:.5px;">${cat.label}</div>
      <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;">
        ${cat.icons.map(e=>`<span class="rank-emoji-quick-btn" data-emoji="${e}" onclick="selectEmoji('${e}')" title="${e}" style="font-size:21px;cursor:pointer;padding:6px 4px;border-radius:8px;transition:all .15s;border:1px solid transparent;text-align:center;display:block;line-height:1;" onmouseenter="this.style.background='rgba(255,255,255,.13)';this.style.borderColor='rgba(255,215,0,.35)';this.style.transform='scale(1.12)'" onmouseleave="this.style.background='';this.style.borderColor='transparent';this.style.transform=''">${e}</span>`).join('')}
      </div>
    </div>`).join('');

  c.innerHTML = `
    <div style="font-size:11px;color:var(--mut);margin-bottom:12px;line-height:1.7;">
      اختر فئة وانقر على الإيموجي، ثم اختر صف الرتبة لتطبيقه عليها
    </div>
    <div style="padding:12px;background:rgba(255,255,255,.03);border-radius:12px;margin-bottom:14px;max-height:260px;overflow-y:auto;">
      ${categorySections}
    </div>
    <div id="rank-rows">
    ${Object.keys(rankNames).map(rk => {
      const curLabel = r.rankCustom[rk]?.label || r.ranks[rk]?.label || `${defaultIcons[rk]} ${rankNames[rk]}`;
      const parts = curLabel.split(' ');
      const curIcon = parts[0] || defaultIcons[rk];
      const curName = parts.slice(1).join(' ') || rankNames[rk];
      return `<div class="rank-edit-row" data-rank="${rk}" onclick="selectRankRow('${rk}')" style="display:flex;align-items:center;gap:8px;padding:10px;background:rgba(255,255,255,.03);border-radius:10px;margin-bottom:6px;border:1px solid rgba(255,255,255,.06);cursor:pointer;transition:.2s;" id="row-${rk}">
        <div id="preview-${rk}" style="font-size:26px;width:40px;text-align:center;" title="الأيقونة الحالية">${curIcon}</div>
        <input type="text" value="${curIcon}" id="icon-${rk}" class="fi" style="width:60px;text-align:center;font-size:18px;padding:6px;" placeholder="🔥" onclick="event.stopPropagation()" oninput="document.getElementById('preview-${rk}').textContent=this.value||'?';selectRankRow('${rk}')">
        <input type="text" value="${curName}" id="name-${rk}" class="fi" style="flex:1;direction:rtl;" placeholder="اسم الرتبة..." onclick="event.stopPropagation();selectRankRow('${rk}')">
        <button onclick="event.stopPropagation();updateRankLabel('${rk}')" style="padding:6px 12px;background:rgba(255,215,0,.15);border:1px solid rgba(255,215,0,.3);color:#ffd700;border-radius:8px;cursor:pointer;font-size:12px;font-family:'Cairo',sans-serif;white-space:nowrap;">💾 حفظ</button>
        <button onclick="event.stopPropagation();resetRankLabel('${rk}')" style="padding:6px 10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:8px;cursor:pointer;font-size:11px;" title="إعادة تعيين">↩</button>
      </div>`;
    }).join('')}
    </div>`;
}

// _selectedEmoji declared in features.js
// _selectedRank declared in features.js

// selectEmoji — معرَّفة في features.js

// selectRankRow — معرَّفة في features.js

// applyEmojiToRow — معرَّفة في features.js

async function updateRankLabel(rank) {
  const icon = document.getElementById('icon-'+rank)?.value?.trim() || '';
  const name = document.getElementById('name-'+rank)?.value?.trim() || '';
  if (!name) return toast('❌ أدخل اسم الرتبة', 'e');
  const label = icon ? `${icon} ${name}` : name;
  const r = await fetch('/api/admin/rank-custom', {
    method:'POST', headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({rank, label, icon, name})
  }).then(r=>r.json());
  if (r.ok) {
    toast(`✅ تم حفظ رتبة "${label}"`, 'k');
    const preview = document.getElementById('preview-'+rank);
    if (preview) preview.textContent = icon || '?';
    // إعادة تحميل الرتب لتحديث الواجهة
    setTimeout(() => loadRankCustomAdmin(), 500);
  } else toast('❌ ' + r.msg, 'e');
}

async function resetRankLabel(rank) {
  const r = await fetch('/api/admin/rank-custom/reset', {
    method:'POST', headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({rank})
  }).then(r=>r.json());
  if (r.ok) { toast('✅ تمت إعادة التعيين للافتراضي', 'k'); loadRankCustomAdmin(); }
}
// ===== END ADMIN RANK ICONS =====

