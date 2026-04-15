function hdrIconVisible(iconId) {
  const icons = niGetIcons('hdr');
  const ic = icons.find(i => i.id === iconId);
  return ic ? ic.visible : true;
}

// ===== END NAME FRAMES =====
const RK_CLASS={};
Object.keys(RK_COLOR).forEach(k=>RK_CLASS[k]='rk-'+k);

let cu=null,cr='general',eo=false,pmt3=null,cx3=null,rd={};
// Global badge caches - declared early so renderMsg can use them
let _globalBadges={}, _globalUserBadges={};
// Notification sound state - declared early
let _notifEnabled = localStorage.getItem('ghazal_notif') !== 'off';
let _notifAudioCtx=null;

// صوت غرفة الدردشة العامة (يُشغَّل عند وصول رسالة من شخص آخر)
// _sndSettings معرَّف في misc.js
function _playGeneralSound(){
  if(typeof _sndSettings==='undefined') return;
  if(!_sndSettings.master||!_sndSettings.general) return;
  try{
    if(!_notifAudioCtx) _notifAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
    const ctx=_notifAudioCtx;
    if(ctx.state==='suspended') ctx.resume();
    const o=ctx.createOscillator();const g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(520,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(420,ctx.currentTime+0.06);
    g.gain.setValueAtTime(0.08,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.18);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+0.18);
  }catch(e){}
}

function toast(m,t=''){const el=document.getElementById('toast');el.textContent=m;el.className=`toast on ${t}`;setTimeout(()=>el.className='toast',3000);}
function openM(t){
  const idMap = {news:'news-ov', inbox:'inbox-ov', goldshop:'goldshop-ov', gold:'gold-ov', nogold:'nogold-ov', cp:'cpm', rp:'rpm', v:'vm', l:'lm', r:'rm', report:'report-ov', diary:'diary-ov', friends:'friends-ov'};
  const el = document.getElementById(idMap[t]||t+'m');
  if(el) el.classList.add('on');
  if(t==='l') setTimeout(loadRemembered,50);
}
function closeM(t){
  const idMap = {news:'news-ov', inbox:'inbox-ov', goldshop:'goldshop-ov', gold:'gold-ov', nogold:'nogold-ov', cp:'cpm', rp:'rpm', v:'vm', l:'lm', r:'rm', report:'report-ov', diary:'diary-ov', friends:'friends-ov'};
  const el = document.getElementById(idMap[t]||t+'m');
  if(el) el.classList.remove('on');
}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('on');}));
function setMsg(id,m,t){const el=document.getElementById(id);el.textContent=m;el.className=`fmsg ${t}`;}

const CLIENT_BAD = ['زب','كس','طيز','نيك','شرموط','قحب','عاهر','سكس','sex','porn','fuck','dick','cock','pussy','slut','whore','69','xxx'];
function checkUsername(name) {
  const n = name.toLowerCase().replace(/\s/g,'');
  for (const w of CLIENT_BAD) {
    if (n.includes(w)) return false;
  }
  return true;
}

function joinV(){
  const n=document.getElementById('vn').value.trim();
  if(!n) return setMsg('vm-msg','أدخل اسمك','e');
  if(n.length < 2) return setMsg('vm-msg','الاسم قصير جداً','e');
  if(!checkUsername(n)) return setMsg('vm-msg','❌ الاسم غير مقبول - اختر اسماً لائقاً','e');
  cu={name:n,age:document.getElementById('va').value,gender:document.getElementById('vg').value,rank:'visitor'};
  localStorage.setItem('ghazal_user', JSON.stringify(cu));
  closeM('v');enterChat();
}

async function loginM(){
  const u=document.getElementById('ln').value.trim(),p=document.getElementById('lp').value;
  if(!u||!p)return setMsg('lm-msg','أدخل جميع البيانات','e');
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    const d=await r.json();
    if(!d.ok)return setMsg('lm-msg',d.msg,'e');
    cu={name:d.user.username,rank:d.user.rank,age:d.user.age||22,gender:d.user.gender||'ذكر',points:d.user.points||0,nameColor:d.user.nameColor||null,nameFontSize:d.user.nameFontSize||null,nameFontFamily:d.user.nameFontFamily||null};
    localStorage.setItem('ghazal_user', JSON.stringify(cu));
    // تذكرني
    const rem=document.getElementById('remember-me');
    if(rem&&rem.checked){
      localStorage.setItem('ghazal_remember',JSON.stringify({username:u,password:p}));
    } else {
      localStorage.removeItem('ghazal_remember');
    }
    closeM('l');enterChat();
  }catch(e){setMsg('lm-msg','خطأ في الاتصال','e');}
}

function loadRemembered(){
  try{
    const saved=localStorage.getItem('ghazal_remember');
    if(saved){
      const d=JSON.parse(saved);
      const ln=document.getElementById('ln');
      const lp=document.getElementById('lp');
      const rem=document.getElementById('remember-me');
      if(ln) ln.value=d.username||'';
      if(lp) lp.value=d.password||'';
      if(rem) rem.checked=true;
    }
  }catch(e){}
}

async function regM(){
  const n=document.getElementById('rn').value.trim(),p=document.getElementById('rp').value,p2=document.getElementById('rp2').value;
  const a=document.getElementById('ra').value,g=document.getElementById('rg').value;
  if(!n||!p)return setMsg('rm-msg','أدخل جميع البيانات','e');
  if(!checkUsername(n))return setMsg('rm-msg','❌ اسم المستخدم غير مقبول - اختر اسماً لائقاً','e');
  if(p!==p2)return setMsg('rm-msg','كلمتا المرور غير متطابقتين','e');
  if(p.length<4)return setMsg('rm-msg','كلمة المرور قصيرة','e');
  try{
    const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:n,password:p,gender:g,age:a})});
    const d=await r.json();
    if(!d.ok)return setMsg('rm-msg',d.msg,'e');
    setMsg('rm-msg','تم التسجيل! جاري الدخول...','k');
    cu={name:n,rank:'member',age:a,gender:g};
    localStorage.setItem('ghazal_user', JSON.stringify(cu));
    setTimeout(()=>{closeM('r');enterChat();},800);
  }catch(e){setMsg('rm-msg','خطأ في الاتصال','e');}
}

function enterChat(){
  document.getElementById('landing').style.display='none';
  const cp = document.getElementById('chat-page');
  cp.style.display='flex';
  // إظهار الإعلان والشريط السفلي فقط داخل الشات
  const hssiq = document.getElementById('hssiq-sig');
  if(hssiq) hssiq.style.display='flex';
  const deskBar = document.getElementById('desk-second-bar');
  if(deskBar && window.innerWidth >= 769) deskBar.style.display='flex';
  const bottomBar = document.getElementById('chat-bottom-bar');
  if(bottomBar) { bottomBar.style.display='flex'; bottomBar.style.flexDirection='column'; }
  const mobNav = document.getElementById('mob-nav');
  if(mobNav) mobNav.style.display='flex';
  const topBar = document.getElementById('mob-top-bar');
  if(topBar) topBar.style.display='flex';
  // Force reflow so DOM is ready for renderRooms
  cp.offsetHeight;
  cr='general';
  // رسالة الترحيب: أرسلها فقط إذا مرت 6 ساعات على آخر مرة
  const _welcomeKey = 'ghazal_last_welcome_' + (cu.username || cu.name);
  const _lastWelcome = parseInt(localStorage.getItem(_welcomeKey) || '0');
  const _welcomeInterval = 6 * 60 * 60 * 1000; // 6 ساعات
  const _shouldWelcome = (Date.now() - _lastWelcome) >= _welcomeInterval;
  if (_shouldWelcome) localStorage.setItem(_welcomeKey, Date.now().toString());
  socket.emit('join', Object.assign({}, cu, { requestWelcome: _shouldWelcome }));
  _joinTime = Date.now(); // لتجاهل kicked الناتج عن الانعاش
  if(hasPerm('can_view_admin_panel')){
    document.getElementById('admin-btn').style.display='flex';
  }
  // زر القائمة يظهر للجميع على الديسكتوب — مع احترام إعدادات أيقونات الهيدر
  const dmb = document.getElementById('desk-menu-btn');
  if(dmb) dmb.style.display = hdrIconVisible('hi-menu') ? 'inline-flex' : 'none';
  // Show buttons for registered members
  if(cu.rank !== 'visitor'){
    setTimeout(updateGoldDisplay, 500);
    // إظهار زر الملف الشخصي
    const pb = document.getElementById('profile-btn');
    if(pb) pb.style.display = hdrIconVisible('hi-profile') ? 'flex' : 'none';
    // إظهار متجر الذهب
    const gsb = document.getElementById('gold-shop-btn');
    if(gsb) gsb.style.display = hdrIconVisible('hi-gold') ? 'flex' : 'none';
    // أزرار الموبايل في الشريط العلوي
    const mpt = document.getElementById('mob-profile-top-btn');
    if(mpt) mpt.style.display='flex';
  }
  // إظهار الرسائل الواردة والأخبار للجميع
  const ib = document.getElementById('inbox-btn');
  const nb = document.getElementById('news-btn');
  // تطبيق إعدادات أيقونات الهيدر
  niApplyHdr();
  // تطبيق إظهار/إخفاء inbox وnews بعد niApplyHdr
  if(ib) { if(hdrIconVisible('hi-inbox')) ib.style.setProperty('display','flex','important'); else ib.style.setProperty('display','none','important'); }
  if(nb) { if(hdrIconVisible('hi-news')) nb.style.setProperty('display','flex','important'); else nb.style.setProperty('display','none','important'); }
  // تحميل الأخبار والصندوق
  loadNews();
  loadInbox(); // تحميل الرسائل المحفوظة من localStorage
  updateInboxBadge();
  setTimeout(startNewsAutoDisplay, 3000); // تشغيل التايمر بعد 3 ثوانٍ
  if(cu.rank !== 'visitor') setTimeout(_loadFriendsData, 1200); // تحميل الأصدقاء والطلبات
  showMobAdmin();
  // Show text color button if permitted
  if(hasPerm('can_custom_text_color') || cu.rank !== 'visitor'){
    document.getElementById('txt-color-btn').style.display='flex';
    const saved=getUserPref('textColor');
    if(saved) document.getElementById('txt-color-preview').style.background=saved;
  }
  if(hasPerm('can_use_name_frame') || cu.rank !== 'visitor'){
    document.getElementById('name-frame-btn').style.display='flex';
  }
  const b=document.getElementById('my-badge');
  b.style.display='inline-flex';
  b.textContent=RK_LABEL[cu.rank]||'👁️ زائر';
  b.style.color=RK_COLOR[cu.rank]||'#b0bec5';
  b.style.borderColor=(RK_COLOR[cu.rank]||'#b0bec5')+'55';
  b.style.background=(RK_COLOR[cu.rank]||'#b0bec5')+'15';
}

// Check session on load - restore instantly
(function _restoreSession() {
  const saved = localStorage.getItem('ghazal_user');
  if (!saved) return;
  cu = JSON.parse(saved);

  let _entered = false;
  function _doEnter() {
    if (_entered) return;
    _entered = true;
    enterChat();
  }

  // إذا socket متصل فعلاً — ادخل فوراً
  if (socket && socket.connected) {
    _doEnter();
    return;
  }

  // سجّل مستمع connect قبل onload حتى لا يفوتنا
  if (socket) socket.once('connect', _doEnter);

  // عند onload تحقق مرة أخرى (حالة نادرة)
  window.addEventListener('load', () => {
    if (socket && socket.connected) _doEnter();
  });
})();

// عند إعادة الاتصال التلقائي (بعد انقطاع الشبكة) — أعد الدخول
socket.on('reconnect', () => {
  if (cu) {
    setTimeout(() => {
      if (socket.connected) {
        socket.emit('join', Object.assign({}, cu, { requestWelcome: false }));
        _joinTime = Date.now();
      }
    }, 500);
  }
});

// SOCKET EVENTS
socket.on('init',(d)=>{
  rd = d.rooms;
  renderRooms();
  upOC(d.onlineCount);
  // بناء كاش الرتب من الرسائل أولاً
  d.messages.forEach(m=>{
    const uname = m.username || m.user?.name;
    if(!uname) return;
    const msgRank = m.rank || m.user?.rank;
    if(msgRank && msgRank !== 'member' && msgRank !== 'visitor') {
      if(!_rankCache[uname]) _rankCache[uname] = msgRank;
    }
  });
  d.messages.forEach(m=>{
    const uname = m.username || m.user?.name;
    // استخرج ytId من text إذا كان نوعه youtube
    if (m.type === 'youtube' && !m.ytId && m.text && m.text.startsWith('yt:')) {
      m.ytId = m.text.replace('yt:','').trim();
    }
    if(m.user) {
      if(!m.user.avatar && _avatarCache[uname]) m.user.avatar = _avatarCache[uname];
      if(_rankCache[uname]) m.user.rank = _rankCache[uname];
      else if(m.rank) m.user.rank = m.rank;
    }
    if(!m.user && uname) {
      const fallbackRank = _rankCache[uname] || m.rank || 'member';
      m.user = {name:uname, avatar:_avatarCache[uname]||null, rank:fallbackRank};
    }
    renderMsg(m);
  });
  if(d.callCost) callCostCfg = d.callCost;
  // Init gold from user object
  if(d.user) {
    myGold = d.user.gold||0;
    myDiamond = d.user.diamond||0;
    if(d.user.rank !== 'visitor') {
      fetch('/api/gold/' + encodeURIComponent(d.user.name))
        .then(r=>r.json())
        .then(g=>{ if(g.ok){ myGold=g.gold||0; myDiamond=g.diamond||0; updateGoldDisplay(); }})
        .catch(()=>{});
    }
    updateGoldDisplay();
  }
  // Update room counts
  if(d.roomCounts) {
    Object.entries(d.roomCounts).forEach(([id,count]) => {
      const el = document.getElementById('rc-'+id);
      if(el) el.textContent = count + ' متصل';
      const mob = document.getElementById('mrc-'+id);
      if(mob) mob.textContent = count + ' متصل';
    });
  }
  // Re-render rooms and request users after DOM is ready
  setTimeout(()=>{
    renderRooms();
    // Request current room users
    fetch('/api/messages/general').catch(()=>{});
  }, 150);
  // Force room users refresh
  setTimeout(()=>{
    socket.emit('request-room-users', cr);
  }, 500);
});
socket.on('message',m=>{
  if(m.room===cr){
    renderMsg(m);
    const myName=cu?.name||cu?.username;
    if(m.user?.name!==myName && m.username!==myName){
      _playGeneralSound();
    }
  }
});
socket.on('room-counts', counts => {
  Object.entries(counts).forEach(([id, count]) => {
    // Update desktop rooms list
    const el = document.getElementById('rc-' + id);
    if (el) el.textContent = count + ' متصل';
    // Update mobile rooms list
    const mob = document.getElementById('mrc-' + id);
    if (mob) mob.textContent = count + ' متصل';
  });
});

// Global avatar cache for online users
const _avatarCache = {};
const _rankCache = {};
const _shapeCache = {}; // يخزن شكل الصورة: 'circle' أو 'square'

socket.on('room-users',u=>{
  // Update avatar and rank cache
  u.forEach(usr => {
    if(usr.avatar) _avatarCache[usr.name] = usr.avatar;
    if(usr.rank) _rankCache[usr.name] = usr.rank;
    if(usr.avatar_shape) _shapeCache[usr.name] = usr.avatar_shape;
  });
  renderUsers(u);
  document.getElementById('crc').textContent=`🟢 ${u.length} متصل`;
  // Update count in rooms list
  const rcEl = document.getElementById('rc-'+cr);
  if(rcEl) rcEl.textContent = u.length + ' متصل';
  const rcMobEl = document.getElementById('mrc-'+cr);
  if(rcMobEl) rcMobEl.textContent = u.length + ' متصل';
});
socket.on('room-history',d=>{
  if(d.roomId===cr){
    const c=document.getElementById('msgs');
    c.innerHTML=`<div class="welcome">🌟 أهلاً في ${rd[d.roomId]?.name||d.roomId} 🌟</div>`;
    // Update avatar and rank cache from room users
    if(d.users) d.users.forEach(u=>{ 
      if(u.avatar) _avatarCache[u.name]=u.avatar; 
      if(u.rank) _rankCache[u.name]=u.rank;
      if(u.avatar_shape) _shapeCache[u.name]=u.avatar_shape;
    });
    // بناء كاش الرتب من الرسائل نفسها أولاً (قبل العرض)
    d.messages.forEach(m=>{
      const uname = m.username || m.user?.name;
      if(!uname) return;
      const msgRank = m.rank || m.user?.rank;
      if(msgRank && msgRank !== 'member' && msgRank !== 'visitor') {
        if(!_rankCache[uname]) _rankCache[uname] = msgRank;
      }
    });
    // Render messages with avatar and rank from cache
    d.messages.forEach(m=>{
      const uname = m.username || m.user?.name;
      // استخرج ytId من text إذا كان نوعه youtube
      if (m.type === 'youtube' && !m.ytId && m.text && m.text.startsWith('yt:')) {
        m.ytId = m.text.replace('yt:','').trim();
      }
      if(m.user) {
        if(!m.user.avatar && _avatarCache[uname]) m.user.avatar = _avatarCache[uname];
        // الأولوية: كاش المتصلين > كاش الرسائل > رتبة الرسالة الحالية
        if(_rankCache[uname]) m.user.rank = _rankCache[uname];
        else if(m.rank) m.user.rank = m.rank;
      }
      if(!m.user && uname) {
        const fallbackRank = _rankCache[uname] || m.rank || 'member';
        m.user = {name:uname, avatar:_avatarCache[uname]||null, rank:fallbackRank};
      }
      renderMsg(m);
    });
    renderUsers(d.users);
    document.getElementById('crc').textContent=`🟢 ${d.users.length} متصل`;
  }
});
socket.on('online-count',upOC);
socket.on('system-notice',t=>{const c=document.getElementById('msgs');const d=document.createElement('div');d.className='ntc';d.textContent=t;c.appendChild(d);c.scrollTop=c.scrollHeight;});
socket.on('rooms-updated', (newRooms) => {
  rd = newRooms;
  renderRooms();
  // If current room was deleted, switch to general
  if (!rd[cr]) {
    cr = 'general';
    document.getElementById('crn').textContent = rd.general.name;
    document.getElementById('cri').textContent = rd.general.icon;
    document.getElementById('msgs').innerHTML = '<div class="welcome">🌟 تم نقلك للغرفة العامة 🌟</div>';
  }
});

socket.on('room-info-updated', (data) => {
  const el = document.getElementById('ri-' + data.id);
  if (el) {
    el.querySelector('.r-nm').textContent = data.name;
    el.querySelector('.r-ic').textContent = data.icon;
  }
  if (cr === data.id) {
    document.getElementById('crn').textContent = data.name;
    document.getElementById('cri').textContent = data.icon;
  }
});

socket.on('room-deleted', msg => { toast('🗑️ ' + msg, 'e'); });
socket.on('username-changed', d => {
  toast('👤 ' + (d.msg||'تم تغيير اسمك') + ' → ' + d.newName, 'k');
  if (cu) { cu.name = d.newName; if(cu.username) cu.username = d.newName; }
  const saved = localStorage.getItem('ghazal_user');
  if (saved) { const u=JSON.parse(saved); u.name=d.newName; if(u.username) u.username=d.newName; localStorage.setItem('ghazal_user',JSON.stringify(u)); }
  setTimeout(() => logout(), 2500);
});
socket.on('room-access-denied', d => {
  toast(`🔒 لا تملك صلاحية دخول "${d.roomName||d.room}"`, 'e');
  // Snap back to current room visually
  renderRooms();
});
socket.on('room-access-kicked', msg => {
  toast('⚠️ ' + msg, 'e');
  cr='general';
  renderRooms();
  document.getElementById('crn').textContent=rd['general']?.name||'الغرفة العامة';
  document.getElementById('msgs').innerHTML='<div class="welcome">🌟 تم نقلك للغرفة العامة 🌟</div>';
});

socket.on('room-cleared',()=>{document.getElementById('msgs').innerHTML='<div class="welcome">🌟 تم مسح الغرفة 🌟</div>';});
socket.on('muted',m=>{toast('🔇 '+m,'e');const i=document.getElementById('min');i.disabled=true;i.placeholder='أنت مكتوم...';});
socket.on('unmuted',m=>{toast('🔊 '+m,'k');const i=document.getElementById('min');i.disabled=false;i.placeholder='اكتب رسالتك هنا...';});
// وقت آخر دخول — لتجاهل kicked الناتج عن الانعاش
let _joinTime = 0;
socket.on('kicked',m=>{
  // إذا جاء kicked خلال أول 6 ثوانٍ من الدخول → تجاهله (ناتج عن انعاش الصفحة)
  if(Date.now() - _joinTime < 6000) return;
  toast('🚫 '+m,'e');
  setTimeout(()=>logout(),2000);
});
socket.on('username-rejected', msg => {
  // إذا كان المستخدم داخل الشات (chat-page ظاهر) أو جاء خلال 10 ثوانٍ = لا نخرجه
  const chatVisible = document.getElementById('chat-page')?.style.display !== 'none';
  if (chatVisible || Date.now() - _joinTime < 10000) {
    // أعد المحاولة بعد ثانيتين بدون فحص الكلمات المحظورة
    setTimeout(() => {
      if (cu && socket.connected) {
        socket.emit('join', Object.assign({}, cu, { requestWelcome: false }));
      }
    }, 2000);
    return;
  }
  // رفض حقيقي عند تسجيل دخول جديد فقط
  document.getElementById('chat-page').style.display = 'none';
  document.getElementById('landing').style.display = 'flex';
  const hssiq = document.getElementById('hssiq-sig');
  if(hssiq) hssiq.style.display='none';
  const bottomBar = document.getElementById('chat-bottom-bar');
  if(bottomBar) bottomBar.style.display='none';
  const topBar = document.getElementById('mob-top-bar');
  if(topBar) topBar.style.display='none';
  localStorage.removeItem('ghazal_user');
  cu = null;
  setTimeout(() => {
    openM('v');
    setMsg('vm-msg', msg, 'e');
  }, 300);
});

socket.on('profanity-warning', data => {
  // Show warning toast
  toast(data.msg, 'e');
  // Flash input red
  const bar = document.querySelector('.cin-bar');
  bar.style.borderColor = '#ef5350';
  bar.style.background = 'rgba(239,83,80,.08)';
  setTimeout(() => {
    bar.style.borderColor = '';
    bar.style.background = '';
  }, 2000);
  // Clear the input
  document.getElementById('min').value = '';
});

socket.on('spam-warning', msg => {
  // Show warning in input area without toast
  const bar = document.getElementById('min');
  const orig = bar.placeholder;
  bar.placeholder = msg;
  bar.style.color = '#ef9a9a';
  setTimeout(() => { bar.placeholder = 'اكتب رسالتك هنا...'; bar.style.color = ''; }, 2500);
});

socket.on('ad-warning', msg => {
  // تحذير إشهار - رسالة واضحة للعضو
  const bar = document.getElementById('min');
  bar.placeholder = msg;
  bar.style.color = '#ef9a9a';
  setTimeout(() => { bar.placeholder = 'اكتب رسالتك هنا...'; bar.style.color = ''; }, 4000);
  // إظهار نافذة تحذير
  const w = document.createElement('div');
  w.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:linear-gradient(135deg,#1a0a0a,#2d1010);border:2px solid rgba(239,68,68,.5);border-radius:16px;padding:24px;text-align:center;max-width:300px;width:90%;box-shadow:0 0 40px rgba(239,68,68,.3);font-family:Cairo,sans-serif;';
  w.innerHTML = `
    <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
    <div style="color:#fca5a5;font-size:16px;font-weight:700;margin-bottom:8px;">تحذير من الإدارة</div>
    <div style="color:#fecaca;font-size:13px;line-height:1.7;margin-bottom:16px;">${msg}</div>
    <div style="color:rgba(255,255,255,.5);font-size:11px;">يُمنع منعاً باتاً الإشهار لأي موقع أو تطبيق آخر</div>
    <button onclick="this.parentElement.remove()" style="margin-top:14px;background:rgba(239,68,68,.3);border:1px solid rgba(239,68,68,.4);color:#fca5a5;border-radius:8px;padding:7px 20px;cursor:pointer;font-family:Cairo,sans-serif;font-size:13px;">حسناً، فهمت</button>
  `;
  document.body.appendChild(w);
  setTimeout(() => w.remove(), 6000);
});

socket.on('private-message',pm=>{
  const myName=cu?.name||cu?.username;
  const o=pm.from===myName?pm.to:pm.from;
  // حفظ في المخزن المحلي دائماً
  _pmAddMsg(pm);
  const pmWin=document.getElementById('pm');
  // إذا المحادثة مفتوحة مع نفس الشخص - أضف الرسالة
  if(pmWin.classList.contains('on') && pmt3===o){
    const d=document.createElement('div');
    d.className='pmmsg '+(pm.from===myName?'pms':'pmr');
    d.innerHTML=`<span class="pm-txt">${esc(pm.text)}</span><span class="pm-time">${pm.time||''}</span>`;
    document.getElementById('pmm').appendChild(d);
    document.getElementById('pmm').scrollTop=99999;
  }
  if(pm.from!==myName){
    _playPMSound();
    // إضافة الرسالة الخاصة الواردة لصندوق الرسائل
    const inboxItem = {
      id: Date.now() + Math.random(),
      icon: '💌',
      title: 'رسالة خاصة من ' + pm.from,
      body: pm.text,
      from: pm.from,
      time: new Date().toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit',hour12:true}),
      read: false,
      type: 'pm'
    };
    addToInbox(inboxItem);
    // إظهار نافذة المحادثة تلقائياً إذا كانت مغلقة (اختياري - عرض إشعار فقط)
    if(!pmWin.classList.contains('on')) {
      // نافذة مصغرة بدل الفتح الكامل
      const notifBar = document.createElement('div');
      notifBar.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(13,36,68,.97),rgba(10,22,40,.97));border:1px solid rgba(245,166,35,.3);border-radius:12px;padding:10px 16px;z-index:9999;cursor:pointer;color:#fff;font-family:Cairo,sans-serif;font-size:13px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,.4);animation:fadeInUp .3s ease;max-width:280px;';
      notifBar.innerHTML=`<span style="font-size:18px;">💬</span><div><div style="font-weight:700;color:#ffd700;">${esc(pm.from)}</div><div style="color:#ccc;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${esc(pm.text)}</div></div>`;
      notifBar.onclick=()=>{openPM(pm.from);notifBar.remove();};
      document.body.appendChild(notifBar);
      setTimeout(()=>notifBar.remove(),5000);
    }
  }
});

// Welcome message in general room
socket.on('welcome-msg', w => {
  const msgs = document.getElementById('msgs');
  if (!msgs) return;
  const d = document.createElement('div');
  d.style.cssText = 'margin:10px 16px;padding:14px 18px;background:linear-gradient(135deg,rgba(255,215,0,.1),rgba(255,100,0,.07));border:1px solid rgba(255,215,0,.3);border-radius:16px;text-align:center;animation:fadeInUp .5s ease;';
  d.innerHTML = `
    <div style="font-size:20px;margin-bottom:6px;">🌹</div>
    <div style="font-size:13px;font-weight:700;color:#ffd700;margin-bottom:5px;">${esc(w.senderName)}</div>
    <div style="font-size:13px;color:#e0c97f;line-height:1.7;">${esc(w.text).replace(/\n/g,'<br>')}</div>
    <div style="font-size:11px;color:#666;margin-top:6px;">${w.time||''}</div>`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
});

function renderRooms(){
  const c=document.getElementById('rlist');c.innerHTML='';
  Object.entries(rd).forEach(([id,r])=>{
    const isPrivate=r.isPrivate;
    const allowed=!isPrivate||(r.allowedRanks&&r.allowedRanks.includes(cu?.rank));
    const lockBadge=isPrivate?`<span style="font-size:10px;background:rgba(176,68,255,.2);color:#ce93d8;border:1px solid rgba(176,68,255,.3);border-radius:4px;padding:1px 5px;margin-right:4px;">🔒</span>`:'';
    const d=document.createElement('div');
    d.className='ri'+(id===cr?' on':'')+(isPrivate&&!allowed?' ri-locked':'');
    d.id='ri-'+id;
    d.style.opacity=isPrivate&&!allowed?'0.4':'1';
    d.title=isPrivate&&!allowed?'هذه غرفة خاصة - لا تملك صلاحية الدخول':'';
    d.innerHTML=`<div class="r-ic" style="background:${RC[id]||r.color||'#333'}">${r.icon}</div><div style="flex:1;min-width:0;"><div class="r-nm">${lockBadge}${r.name}</div><div class="r-cn" id="rc-${id}">0 متصل</div></div>`;
    d.onclick=()=>swRoom(id,r);c.appendChild(d);
  });
  syncMobLists();
}

function swRoom(id,r){
  if(id===cr)return;cr=id;
  document.querySelectorAll('.ri').forEach(x=>x.classList.remove('on'));
  document.getElementById('ri-'+id)?.classList.add('on');
  document.getElementById('crn').textContent=r.name;
  document.getElementById('cri').textContent=r.icon;
  socket.emit('switch-room',id);
}

function renderMsg(m){
  const c=document.getElementById('msgs');
  if(m.type==='system'){
    const d=document.createElement('div');d.className='sys';d.textContent=m.text;c.appendChild(d);
    c.scrollTop=c.scrollHeight;return;
  }
  if(m.type==='quiz'){
    const d=document.createElement('div');
    d.style.cssText='display:flex;align-items:flex-start;gap:8px;padding:8px 12px;background:linear-gradient(135deg,rgba(249,168,37,.13),rgba(255,215,0,.05));border-right:3px solid #ffd700;margin:4px 8px;border-radius:8px;flex-wrap:wrap;';
    d.innerHTML=`<span style="background:#ffd700;color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;flex-shrink:0;">🏆 مسابقات</span><span style="color:#fff;font-size:14px;line-height:1.5;flex:1;">${esc(m.text)}</span><span style="color:#666;font-size:11px;">${m.time||''}</span>`;
    c.appendChild(d);c.scrollTop=c.scrollHeight;return;
  }
  const u=m.user||{name:m.username||'?',rank:'visitor'};
  const col=AVC[(u.name||'?').charCodeAt(0)%AVC.length];
  const nc=RK_COLOR[u.rank]||'#b0bec5';
  const rkl=RK_LABEL[u.rank]||'👁️ زائر';
  const fs=RK_SIZE[u.rank]||'14px';
  const fw=RK_WEIGHT[u.rank]||'400';
  const glow=RK_GLOW[u.rank]?`text-shadow:${RK_GLOW[u.rank]};`:'';
  // Name frame
  const nFrame = u.nameFrame||'none';
  const nfClass = getNameFrameClass(nFrame);
  const nfWrap = getNameFrameWrap(nFrame);
  const isAnimated = ['hearts','flowers','stars'].includes(nFrame);
  const nameInner = `<span class="${nfClass}" style="${nfClass?'':`color:${nc};font-size:${fs};font-weight:${fw};${glow}`}cursor:pointer;" onclick="ghzlShowPopup('${esc(u.name)}',u.rank||'visitor')">${u.name}</span>`;
  const nameHtml = nfWrap
    ? `<span class="${nfWrap} nf-particle-wrap" ${isAnimated?`data-frame="${nFrame}"`:''}  style="font-size:${fs};font-weight:${fw};color:${nc};">${nameInner}</span>`
    : `<span class="mn" style="color:${nc};font-size:${fs};font-weight:${fw};${glow}cursor:pointer;" onclick="ghzlShowPopup('${esc(u.name)}',u.rank||'visitor')">${u.name}</span>`;
  // Text color
  const txColor = u.textColor ? `color:${u.textColor};` : '';
  // User badges (from global cache)
  const userBadgeIds = _globalUserBadges[u.name] || [];
  const badgesHtml = userBadgeIds.slice(0,3).map(bid => {
    const b = _globalBadges[bid];
    return b ? `<span title="${b.name}" style="font-size:14px;cursor:default;" class="msg-badge">${b.emoji}</span>` : '';
  }).join('');
  const avSrc = u.avatar || _avatarCache[u.name] || null;
  const avShape = u.avatar_shape || _shapeCache[u.name] || 'circle';
  const avRadius = avShape === 'square' ? '8px' : '50%';
  const avHtml=avSrc?`<img src="${avSrc}" class="uav-img" data-owner="${esc(u.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:${avRadius};">`:`${u.name.charAt(0)}`;

  // Detect message type: image, gif, youtube, text
  let contentHtml = '';
  if (m.type === 'chat-image') {
    const isGif = m.imageType === 'gif';
    contentHtml = `<img src="${m.imageData}" class="${isGif?'chat-gif':'chat-img'}" onclick="openImgFull('${m.imageData}')" alt="صورة">`;
  } else if (m.type === 'chat-big-emoji') {
    contentHtml = `<span class="chat-big-emoji">${esc(m.sticker||'')}</span>`;
  } else if (m.type === 'chat-text-sticker') {
    contentHtml = `<span class="chat-text-sticker">${esc(m.sticker||'')}</span>`;
  } else if (m.type === 'youtube') {
    // ytId قد يكون في m.ytId مباشرة أو مستخرجاً من m.text (yt:VIDEO_ID)
    let ytId = m.ytId || '';
    if (!ytId && m.text && m.text.startsWith('yt:')) {
      ytId = m.text.replace('yt:', '').trim();
    }
    if (ytId && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
      contentHtml = `<div class="yt-embed"><iframe src="https://www.youtube.com/embed/${ytId}?autoplay=0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    } else {
      contentHtml = `<div class="mx">🎥 فيديو يوتيوب</div>`;
    }
  } else {
    // تطبيق تنسيق الخط إذا كان موجوداً
    let fmtStyle = txColor;
    let fmtText = esc(m.text||'');
    if (m.fmt) {
      if (m.fmt.bold) fmtStyle += 'font-weight:700;';
      if (m.fmt.italic) fmtStyle += 'font-style:italic;';
      if (m.fmt.underline) fmtStyle += 'text-decoration:underline;';
      if (m.fmt.font) fmtStyle += `font-family:${m.fmt.font},Cairo,sans-serif;`;
      if (m.fmt.size) fmtStyle += `font-size:${m.fmt.size};`;
    } else if (m.text && m.text.startsWith('[fmt:')) {
      // parse legacy fmt tags
      const fmtMatch = m.text.match(/^\[fmt:([^\]]+)\](.*?)\[\/fmt\]$/s);
      if (fmtMatch) {
        const tags = fmtMatch[1].split(',');
        fmtText = esc(fmtMatch[2]);
        tags.forEach(t => {
          if (t === 'b') fmtStyle += 'font-weight:700;';
          if (t === 'i') fmtStyle += 'font-style:italic;';
          if (t === 'u') fmtStyle += 'text-decoration:underline;';
          if (t.startsWith('f:')) fmtStyle += `font-family:${t.slice(2)},Cairo,sans-serif;`;
          if (t.startsWith('s:')) fmtStyle += `font-size:${t.slice(2)};`;
        });
      }
    }
    contentHtml = `<div class="mx" style="${fmtStyle}">${fmtText}</div>`;
  }

  // ===== QUOTE BLOCK =====
  let quoteHtml = '';
  if(m.quote && m.quote.sender && m.quote.text){
    quoteHtml = `<div class="msg-quote" onclick="void(0)">
      <div class="msg-quote-name">↩ ${esc(m.quote.sender)}</div>
      <div class="msg-quote-text">${esc(String(m.quote.text).slice(0,120))}</div>
    </div>`;
  }

  const d=document.createElement('div');d.className='msg';d.dataset.sender=u.name;
  d.innerHTML=`<div class="av" style="background:linear-gradient(135deg,${col},${col}99);border:2px solid ${nc}33;cursor:pointer;overflow:hidden;border-radius:${avRadius};" 
    onclick="ghzlShowPopup('${esc(u.name)}',u.rank||'visitor')"
    onmouseenter="showAvatarTooltip(this,'${esc(u.name)}',${u.points||0})"
    onmouseleave="hideAvatarTooltip()">${avHtml}</div>
    <div class="mc"><div class="mh">
      ${nameHtml}
      <span class="mb" style="background:${nc}22;color:${nc};border:1px solid ${nc}44;border-radius:20px;padding:1px 8px;font-size:11px;">${rkl}</span>
      ${badgesHtml}
      <span class="mt">${m.time||''}</span>
      <button class="msg-reply-btn" onclick="(function(){const info=getMsgInfo(this.closest('.msg'));if(info)setQuote(info.name,info.text);}).call(this)" title="رد">↩</button>
    </div>${quoteHtml}${contentHtml}</div>`;
  c.appendChild(d);
  c.scrollTop=c.scrollHeight;
}

function renderUsers(users){
  const c=document.getElementById('ulist');c.innerHTML='';
  document.getElementById('uc').textContent=users.length;
  const g={owner:[],owner_admin:[],owner_vip:[],super_admin:[],admin:[],premium:[],vip:[],gold:[],member:[],visitor:[]};
  users.forEach(u=>{(g[u.rank]||g.visitor).push(u);});

  // إذا المالك غير متصل في الغرفة، أضفه كمعروض دائماً (من الأعضاء المسجلين)
  if(g.owner.length===0 && window._ownerName){
    const fakeOwner={name:window._ownerName,rank:'owner',gender:'',age:'',offline:true};
    addSec(c,'👑 المالك',[fakeOwner]);
  } else if(g.owner.length){
    addSec(c,'👑 المالك',g.owner);
  }

  if(g.owner_admin.length)addSec(c,'💼 أونر إداري',g.owner_admin);
  if(g.owner_vip.length)addSec(c,'⭐ أونر',g.owner_vip);
  if(g.super_admin.length)addSec(c,'🔱 سوبر أدمن',g.super_admin);
  if(g.admin.length)addSec(c,'⚙️ أدمن',g.admin);
  if(g.premium.length)addSec(c,'💎 بريميوم',g.premium);
  if(g.vip.length)addSec(c,'🌟 مميز',g.vip);
  if(g.gold.length)addSec(c,'🥇 ذهبي',g.gold);
  if(g.member.length)addSec(c,'👥 أعضاء',g.member);
  if(g.visitor.length)addSec(c,'👁️ زوار',g.visitor);
  syncMobLists();
}

function addSec(c,t,users){
  const l=document.createElement('div');l.className='usl';l.textContent=t;c.appendChild(l);
  users.forEach(u=>{
    const col=AVC[(u.name||'?').charCodeAt(0)%AVC.length];
    const nc=RK_COLOR[u.rank]||'#fff';
    const fs=RK_SIZE[u.rank]||'14px';
    const fw=RK_WEIGHT[u.rank]||'400';
    const glow=RK_GLOW[u.rank]?`text-shadow:${RK_GLOW[u.rank]};`:'';
    const d=document.createElement('div');d.className='ui';
    if(u.offline){
      d.style.cssText='opacity:0.5;cursor:default;';
      const offShape = u.avatar_shape || _shapeCache[u.name] || 'circle';
      const offRadius = offShape === 'square' ? '8px' : '50%';
      d.innerHTML=`<div class="uav" style="background:linear-gradient(135deg,${col},${col}99);border:2px solid ${nc}33;filter:grayscale(0.5);overflow:hidden;border-radius:${offRadius};">
        ${u.avatar?`<img src="${u.avatar}" class="uav-img" data-owner="${esc(u.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:${offRadius};">`:`${(u.name||'?').charAt(0)}`}
        <div class="udot" style="background:#555!important;box-shadow:none!important;"></div></div>
        <div style="flex:1;min-width:0;"><div class="un" style="color:${nc};font-size:${fs};font-weight:${fw};${glow}">${u.name}</div><div class="um" style="color:#666;">⚫ غير متصل</div></div>`;
    } else {
      const nFrame = u.nameFrame||'none';
      const nfWrap = getNameFrameWrap(nFrame);
      const isAnimated = ['hearts','flowers','stars'].includes(nFrame);
      // Apply custom name style if set
      const customColor = u.nameColor || nc;
      const customSize = u.nameFontSize || fs;
      const customFont = u.nameFontFamily ? `font-family:${u.nameFontFamily};` : '';
      const nameStyle = `font-size:${customSize};font-weight:${fw};color:${customColor};${glow}${customFont}`;
      const nameHtml = nfWrap
        ? `<span class="${nfWrap} nf-particle-wrap" ${isAnimated?`data-frame="${nFrame}"`:''}  style="${nameStyle}">${u.name}</span>`
        : `<span style="${nameStyle}">${u.name}</span>`;
      const onShape = u.avatar_shape || _shapeCache[u.name] || 'circle';
      const onRadius = onShape === 'square' ? '8px' : '50%';
      d.innerHTML=`<div class="uav" style="background:linear-gradient(135deg,${col},${col}99);border:2px solid ${nc}44;overflow:hidden;position:relative;border-radius:${onRadius};" 
        onmouseenter="showAvatarTooltip(this,'${esc(u.name)}',${u.points||0})"
        onmouseleave="hideAvatarTooltip()">
        ${u.avatar?`<img src="${u.avatar}" class="uav-img" data-owner="${esc(u.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:${onRadius};">`:`${(u.name||'?').charAt(0)}`}
        <div class="udot"></div></div>
        <div style="flex:1;min-width:0;"><div class="un">${nameHtml}</div><div class="um">${u.gender==='أنثى'?'👩':'👨'} ${u.gender||''} · ${u.age||''}</div></div>`;
      d.addEventListener('contextmenu',e=>{e.preventDefault();ghzlShowPopup(u.name, u.rank||'visitor');});
      d.onclick=()=>ghzlShowPopup(u.name, u.rank||'visitor');
    }
    c.appendChild(d);
  });
}


// ===== EMOJI LIBRARY ===== (moved to emoji.js)
// الإيموجي تُحمَّل الآن من /emojis/config.json عبر emoji.js
// eo declared in emoji.js

// Open rooms panel - works on both mobile and desktop
function openRoomsPanel() {
  if (window.innerWidth <= 768) {
    openMobDrawer('rooms');
  }
}

let lastSent = {text:'', time:0};
function sm(){
  const i=document.getElementById('min');
  const t=i.value.trim();
  if(!t)return;
  const now=Date.now();
  if(t===lastSent.text && now-lastSent.time < 3000){
    i.placeholder='⚠️ لا تكرر نفس الرسالة';
    setTimeout(()=>i.placeholder='اكتب رسالتك هنا...',2000);
    return;
  }
  lastSent={text:t,time:now};
  // إرسال النص العادي فقط — التنسيق يُرسل منفصلاً عبر msgData.fmt
  const msgData={text:t};
  if(cu.rank !== 'visitor' && getUserPref('textColor')) msgData.textColor=getUserPref('textColor');
  if(cu.rank !== 'visitor' && getUserPref('nameFrame')) msgData.nameFrame=getUserPref('nameFrame');
  // إضافة بيانات التنسيق فقط إذا كان هناك تنسيق مفعّل
  if(typeof _fmtBold!=='undefined' && (_fmtBold||_fmtItalic||_fmtUnderline||_fmtFont||_fmtSize)) {
    msgData.fmt = { bold:!!_fmtBold, italic:!!_fmtItalic, underline:!!_fmtUnderline, font:_fmtFont||'', size:_fmtSize||'' };
  }
  // ===== QUOTE: أرسل بيانات الاقتباس إذا كان مفعلاً =====
  if(_quoteData){ msgData.quote = _quoteData; cancelQuote(); }
  socket.emit('chat-message',msgData);
  i.value='';
  updateFmtPreview && updateFmtPreview();
  if(eo)te();
}
function hk(e){if(e.key==='Enter')sm();}

// ===== TEXT COLOR PICKER =====
let _colorPickerOpen=false, _framePickerOpen=false;

function buildColorSwatches(){
  const sw=document.getElementById('color-swatches');
  if(!sw||sw.children.length>0) return; // already built
  const colors=['#ffffff','#ffd700','#ff4444','#ff8c00','#00bfff','#00e676','#b044ff','#ff69b4','#00ffff','#ff6b35','#a8edff','#f8f9fa'];
  colors.forEach(c=>{
    const d=document.createElement('div');
    d.style.cssText='width:28px;height:28px;border-radius:50%;background:'+c+';cursor:pointer;border:2px solid transparent;transition:.2s;flex-shrink:0;';
    d.title=c;
    d.onmouseover=function(){this.style.transform='scale(1.2)';};
    d.onmouseout=function(){this.style.transform='scale(1)';};
    d.onclick=function(){setTextColor(c);};
    sw.appendChild(d);
  });
  // Custom color input
  const wrap=document.createElement('div');
  wrap.style.cssText='display:flex;align-items:center;gap:6px;';
  const inp=document.createElement('input');
  inp.type='color'; inp.value='#ffffff';
  inp.style.cssText='width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;padding:0;';
  inp.onchange=function(){setTextColor(this.value);};
  const lbl=document.createElement('span');
  lbl.style.cssText='font-size:11px;color:var(--mut);';
  lbl.textContent='مخصص';
  wrap.appendChild(inp); wrap.appendChild(lbl);
  sw.appendChild(wrap);
}

function buildFrameOptions(){
  const fo=document.getElementById('frame-options');
  if(!fo) return;
  fo.innerHTML='';
  const cur=getUserPref('nameFrame')||'none';
  // Title
  const title=document.createElement('div');
  title.style.cssText='font-size:11px;color:var(--mut);margin-bottom:10px;font-weight:700;letter-spacing:1px;';
  title.textContent='✨ اختر إطاراً لاسمك — انقر للمعاينة';
  fo.appendChild(title);
  // Photoshop-style grid
  const grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:6px;';
  NAME_FRAMES.forEach(f=>{
    const isActive=f.key===cur;
    const d=document.createElement('div');
    d.id='nfopt-'+f.key;
    d.style.cssText=`position:relative;padding:9px 6px 7px;border-radius:10px;background:${isActive?'rgba(255,215,0,.1)':'rgba(255,255,255,.04)'};border:${isActive?'2px solid #ffd700':'1px solid rgba(255,255,255,.1)'};cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;overflow:hidden;`;
    d.onmouseover=function(){if(!this._active){this.style.background='rgba(255,255,255,.09)';this.style.borderColor='rgba(255,215,0,.4)';}};
    d.onmouseout=function(){if(!this._active){this.style.background='rgba(255,255,255,.04)';this.style.borderColor='rgba(255,255,255,.1)';}};
    d.onclick=function(){setNameFrame(f.key);};
    d._active=isActive;
    // Checkmark if active
    if(isActive){
      const chk=document.createElement('span');
      chk.style.cssText='position:absolute;top:3px;left:5px;font-size:9px;color:#ffd700;font-weight:900;';
      chk.textContent='✓';
      d.appendChild(chk);
    }
    // Animated spark badge
    if(f.animated){
      const sp=document.createElement('span');
      sp.style.cssText='position:absolute;top:3px;right:5px;font-size:9px;color:#ffd700;';
      sp.textContent='✨';
      d.appendChild(sp);
    }
    // Icon
    const iconEl=document.createElement('div');
    iconEl.style.cssText='font-size:19px;line-height:1;';
    iconEl.textContent=f.icon||'✖️';
    // Preview name with the frame style applied
    const previewWrap=document.createElement('span');
    if(f.key!=='none') previewWrap.className=`nfw-${f.key}`;
    previewWrap.style.cssText='font-size:11px;font-weight:700;white-space:nowrap;display:inline-block;';
    previewWrap.textContent='اسمك';
    // Label
    const labelEl=document.createElement('div');
    labelEl.style.cssText='font-size:9px;color:#999;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    labelEl.textContent=f.label.replace(/^[\p{Emoji}\s]+/u,'').trim()||f.label;
    d.appendChild(iconEl); d.appendChild(previewWrap); d.appendChild(labelEl);
    grid.appendChild(d);
  });
  fo.appendChild(grid);
}

function toggleColorPicker(){
  _framePickerOpen=false;
  document.getElementById('frame-picker-popup').style.display='none';
  _colorPickerOpen=!_colorPickerOpen;
  if(_colorPickerOpen) buildColorSwatches();
  document.getElementById('color-picker-popup').style.display=_colorPickerOpen?'block':'none';
}
function toggleFramePicker(){
  _colorPickerOpen=false;
  document.getElementById('color-picker-popup').style.display='none';
  _framePickerOpen=!_framePickerOpen;
  if(_framePickerOpen){ buildFrameOptions(); highlightActiveFrame(); }
  document.getElementById('frame-picker-popup').style.display=_framePickerOpen?'block':'none';
}
function setTextColor(c){
  if(!c){
    setUserPref('textColor',null);
    document.getElementById('txt-color-preview').style.background='#b0bec5';
    document.getElementById('txt-color-btn').style.borderColor='rgba(255,255,255,.15)';
  } else {
    setUserPref('textColor',c);
    document.getElementById('txt-color-preview').style.background=c;
    document.getElementById('txt-color-btn').style.borderColor=c;
  }
  document.getElementById('color-picker-popup').style.display='none';
  _colorPickerOpen=false;
  toast('🎨 تم تغيير لون الخط','k');
}
function setNameFrame(key){
  setUserPref('nameFrame',key==='none'?null:key);
  highlightActiveFrame();
  document.getElementById('frame-picker-popup').style.display='none';
  _framePickerOpen=false;
  const lbl=NAME_FRAMES.find(f=>f.key===key)?.label||'بدون إطار';
  toast(`🖼️ تم اختيار إطار: ${lbl}`,'k');
}
function highlightActiveFrame(){
  const cur=getUserPref('nameFrame')||'none';
  NAME_FRAMES.forEach(f=>{
    const el=document.getElementById('nfopt-'+f.key);
    if(el) el.style.borderColor=(f.key===cur)?'#ffd700':'rgba(255,255,255,.1)';
  });
}
document.addEventListener('click',e=>{
  if(_colorPickerOpen&&!e.target.closest('#color-picker-popup')&&!e.target.closest('#txt-color-btn')){
    _colorPickerOpen=false;document.getElementById('color-picker-popup').style.display='none';
  }
  if(_framePickerOpen&&!e.target.closest('#frame-picker-popup')&&!e.target.closest('#name-frame-btn')){
    _framePickerOpen=false;document.getElementById('frame-picker-popup').style.display='none';
  }
});
// ===== END COLOR/FRAME PICKERS =====
// te() defined above
function ae(e){
  document.getElementById('min').value += e;
  document.getElementById('min').focus();
  // Don't close picker after selecting emoji
}
document.addEventListener('click',e=>{if(eo&&!e.target.closest('#ep')&&!e.target.closest('.ibe')){eo=false;document.getElementById('ep').classList.remove('on');}});

function openCtx(e,n){
  e.stopPropagation();
  cx3=n;const m=document.getElementById('ctx');
  const notSelf=n!==cu?.name;
  document.getElementById('cx-mute').style.display=(notSelf&&hasPerm('can_mute'))?'flex':'none';
  document.getElementById('cx-unmute').style.display=(notSelf&&hasPerm('can_unmute'))?'flex':'none';
  document.getElementById('cx-kick').style.display=(notSelf&&hasPerm('can_kick'))?'flex':'none';
  // Position smartly — keep inside viewport
  const x = e.clientX, y = e.clientY;
  m.style.top = (y + 8) + 'px';
  m.style.right = 'auto';
  m.style.left = Math.min(x, window.innerWidth - 180) + 'px';
  m.classList.add('on');
}
document.addEventListener('click',e=>{if(!e.target.closest('.ctx'))document.getElementById('ctx').classList.remove('on');});
function cxProfile(){openProfile(cx3);document.getElementById('ctx').classList.remove('on');}
function cxPM(){openPM(cx3);document.getElementById('ctx').classList.remove('on');}
function cxMute(){if(cx3){socket.emit('admin-mute',{username:cx3});toast('🔇 تم كتم '+cx3,'k');}document.getElementById('ctx').classList.remove('on');}
function cxUnmute(){if(cx3){socket.emit('admin-unmute',{username:cx3});toast('🔊 رفع الكتم','k');}document.getElementById('ctx').classList.remove('on');}
function cxKick(){if(cx3&&confirm(`طرد ${cx3}؟`)){socket.emit('admin-kick',{username:cx3});}document.getElementById('ctx').classList.remove('on');}

// تخزين محلي للمحادثات الخاصة
const _pmStore = {}; // { 'username': [{from,to,text,time},...] }

function _pmAddMsg(msg) {
  const myName = cu?.name || cu?.username;
  const other = msg.from === myName ? msg.to : msg.from;
  if (!other) return;
  if (!_pmStore[other]) _pmStore[other] = [];
  // تجنب التكرار
  const key = msg.from + '|' + msg.to + '|' + msg.text + '|' + msg.time;
  if (_pmStore[other].some(m => (m.from+'|'+m.to+'|'+m.text+'|'+m.time) === key)) return;
  _pmStore[other].push(msg);
  if (_pmStore[other].length > 500) _pmStore[other].shift();
}

function openPM(n) {
  if (n === cu?.name) return;
  pmt3 = n;
  document.getElementById('pmt2').textContent = n;
  const pmm = document.getElementById('pmm');
  pmm.innerHTML = '';
  document.getElementById('pm').classList.add('on');
  document.getElementById('pmi').focus();
  // عرض المحادثة المخزنة محلياً
  if (_pmStore[n] && _pmStore[n].length > 0) {
    _renderPMHistory(n, _pmStore[n]);
  }
  // طلب التاريخ من السيرفر
  socket.emit('load-pm-history', { with: n });
}

function _renderPMMsg(pm, myName) {
  const d = document.createElement('div');
  d.className = 'pmmsg ' + (pm.from === myName ? 'pms' : 'pmr');
  if (pm.type === 'pm-image') {
    const isGif = pm.imageType === 'gif';
    d.innerHTML = `<img src="${pm.imageData}" class="${isGif?'chat-gif':'chat-img'}" onclick="openImgFull('${pm.imageData}')" alt="صورة" style="max-width:200px;max-height:180px;border-radius:10px;display:block;cursor:pointer;"><span class="pm-time">${pm.time||''}</span>`;
  } else if (pm.type === 'pm-voice') {
    const dur = pm.duration || 0;
    const m = Math.floor(dur/60), s = dur%60;
    const durStr = m+':'+(s<10?'0':'')+s;
    const uid = 'pmv_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    d.innerHTML = `<div class="voice-msg-bubble" onclick="playVoiceMsg('${uid}','${pm.data}')"><div class="vplay" id="vplay_${uid}">▶</div><div class="vwav">${Array(6).fill(0).map((_,i)=>`<div class="vbar" style="animation-delay:${i*0.15}s;"></div>`).join('')}</div><div class="vdur">🎤 ${durStr}</div></div><audio id="${uid}" src="${pm.data}" style="display:none"></audio><span class="pm-time">${pm.time||''}</span>`;
  } else {
    d.innerHTML = `<span class="pm-txt">${esc(pm.text)}</span><span class="pm-time">${pm.time||''}</span>`;
  }
  return d;
}

function _renderPMHistory(n, msgs) {
  const myName = cu?.name || cu?.username;
  const pmm = document.getElementById('pmm');
  pmm.innerHTML = '';
  msgs.forEach(pm => pmm.appendChild(_renderPMMsg(pm, myName)));
  pmm.scrollTop = 99999;
}

// استقبال تاريخ محادثة خاصة من السيرفر
socket.on('pm-conv-history', (data) => {
  const myName = cu?.name || cu?.username;
  if (!data.messages || !data.with) return;
  // احفظ في المخزن المحلي
  data.messages.forEach(m => _pmAddMsg(m));
  // إذا المحادثة مفتوحة مع نفس الشخص - أعد عرضها
  if (pmt3 === data.with) {
    _renderPMHistory(data.with, _pmStore[data.with] || data.messages);
  }
});

// استقبال كل الرسائل الفائتة عند الدخول
socket.on('pm-history-load', (data) => {
  if (!data.messages) return;
  data.messages.forEach(m => _pmAddMsg(m));
});

function closePM(){document.getElementById('pm').classList.remove('on');pmt3=null;document.getElementById('pm-opts-menu').style.display='none';}
function spm(){const i=document.getElementById('pmi');const t=i.value.trim();if(!t||!pmt3)return;socket.emit('private-message',{to:pmt3,text:t});i.value='';}
function hpk(e){if(e.key==='Enter')spm();}

function handlePMImageUpload(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file || !cu || !pmt3) return;
  if (file.size > 3 * 1024 * 1024) { toast('❌ الصورة كبيرة جداً (الحد 3MB)', 'e'); return; }
  const isGif = file.type === 'image/gif';
  const reader = new FileReader();
  reader.onload = e => {
    const data = e.target.result;
    socket.emit('pm-image', { to: pmt3, imageData: data, imageType: isGif ? 'gif' : 'image' });
    toast('✅ تم إرسال الصورة', 'k');
  };
  reader.readAsDataURL(file);
}

// استقبال صورة خاصة واردة
socket.on('pm-image-msg', (msg) => {
  const myName = cu?.name || cu?.username;
  const other = msg.from === myName ? msg.to : msg.from;
  _pmAddMsg(msg);
  if (pmt3 === other) {
    const pmm = document.getElementById('pmm');
    pmm.appendChild(_renderPMMsg(msg, myName));
    pmm.scrollTop = 99999;
  }
});

// قائمة المستخدمين المقفولين محلياً
let _pmLockedUsers = new Set(JSON.parse(localStorage.getItem('ghazal_pm_locked')||'[]'));
function _savePmLocked(){ try{localStorage.setItem('ghazal_pm_locked',JSON.stringify([..._pmLockedUsers]));}catch(e){} }

// PM Options Menu
function togglePMOptions(e){
  e.stopPropagation();
  const m=document.getElementById('pm-opts-menu');
  const lockBtn=document.getElementById('pm-lock-btn');
  if(lockBtn){
    const isLocked=_pmLockedUsers.has(pmt3);
    lockBtn.textContent=isLocked?'🔓 فك قفل الخاص':'🔒 قفل الخاص';
    lockBtn.style.color=isLocked?'#4ade80':'#fbbf24';
  }
  m.style.display=m.style.display==='none'?'block':'none';
}
document.addEventListener('click',function(e){
  const m=document.getElementById('pm-opts-menu');
  if(m&&!e.target.closest('#pm-opts-btn')&&!e.target.closest('#pm-opts-menu'))m.style.display='none';
});
function pmOptAction(act){
  document.getElementById('pm-opts-menu').style.display='none';
  const target=pmt3;
  if(!target)return;
  if(act==='friend'){if(typeof sendFriendRequest==='function'){sendFriendRequest(target);}else{socket.emit('friend-request',{to:target});toast('📩 تم إرسال طلب صداقة إلى '+target,'k');}}
  else if(act==='like'){socket.emit('user-like',{to:target});toast('❤️ تم الإعجاب بـ '+target,'k');}
  else if(act==='poke'){socket.emit('user-poke',{to:target});toast('👉 تم نكز '+target,'k');}
  else if(act==='mute'){toast('🔇 تم كتم '+target,'k');}
  else if(act==='block'){socket.emit('block-user',{username:target});closePM();toast('🚫 تم حظر '+target,'r');}
  else if(act==='report'){socket.emit('report-user',{username:target,reason:'إبلاغ من المحادثة الخاصة'});toast('⚠️ تم إبلاغ عن '+target,'r');}
  else if(act==='clear-chat'){
    if(!confirm('هل تريد مسح تاريخ هذه المحادثة؟ لن يمكن استعادتها.')) return;
    socket.emit('pm-clear-history', { with: target });
  }
  else if(act==='pmlock'){
    if(_pmLockedUsers.has(target)){
      _pmLockedUsers.delete(target);
      socket.emit('pm-unlock-user',{target});
      _savePmLocked();
      toast('🔓 تم فك قفل الخاص عن '+target,'k');
    } else {
      _pmLockedUsers.add(target);
      socket.emit('pm-lock-user',{target});
      _savePmLocked();
      toast('🔒 تم قفل الخاص من '+target,'k');
    }
  }
}
socket.on('pm-locked',()=>{ toast('🔒 هذا المستخدم أوقف استقبال رسائلك الخاصة','e'); });

socket.on('pm-cleared', (data) => {
  // امسح من _pmStore المحلي
  if (_pmStore[data.with]) delete _pmStore[data.with];
  // إذا كانت المحادثة مفتوحة - امسح العرض
  if (pmt3 === data.with) {
    const pmm = document.getElementById('pmm');
    if (pmm) pmm.innerHTML = '';
  }
  toast('🗑️ تم مسح المحادثة', 'k');
});

// PM Emoji Picker
const PM_EMOJIS=['😊','😂','❤️','😍','🥰','😘','😭','😅','🤣','😆','🙈','😤','😡','💔','🌹','💫','✨','🔥','💎','👑','🎉','🎊','💪','🙏','👍','👏','🤝','💯','🎵','🎶','🌙','⭐','🌟','💐','🌸','🍀','🦋','🌊','❄️','☀️'];
let _pmEmojiOpen=false;
function buildPMEmojiPicker(){
  const p=document.getElementById('pm-emoji-picker');
  if(!p||p.children.length>0) return;
  PM_EMOJIS.forEach(em=>{
    const b=document.createElement('button');
    b.textContent=em;
    b.style.cssText='background:none;border:none;cursor:pointer;font-size:20px;padding:3px;border-radius:6px;transition:.15s;';
    b.onmouseover=function(){this.style.background='rgba(255,255,255,.1)';};
    b.onmouseout=function(){this.style.background='none';};
    b.onclick=function(){const inp=document.getElementById('pmi');if(inp){inp.value+=em;inp.focus();}};
    p.appendChild(b);
  });
}
function togglePMEmoji(){
  _pmEmojiOpen=!_pmEmojiOpen;
  const p=document.getElementById('pm-emoji-picker');
  if(!p) return;
  if(_pmEmojiOpen){buildPMEmojiPicker();p.style.display='flex';}
  else p.style.display='none';
  document.getElementById('pm-emoji-btn').style.color=_pmEmojiOpen?'#ffd700':'#b0bec5';
}
// Notification Sound
function toggleNotifSound(){
  _notifEnabled=!_notifEnabled;
  localStorage.setItem('ghazal_notif',_notifEnabled?'on':'off');
  const btn=document.getElementById('notif-bell');
  if(btn){btn.textContent=_notifEnabled?'🔔':'🔕';btn.style.color=_notifEnabled?'#ffd700':'#666';btn.style.borderColor=_notifEnabled?'rgba(255,215,0,.2)':'rgba(255,255,255,.1)';}
  toast(_notifEnabled?'🔔 صوت الإشعارات مفعّل':'🔕 صوت الإشعارات مطفأ','k');
}
// Init bell state on load
setTimeout(()=>{
  const btn=document.getElementById('notif-bell');
  if(btn&&!_notifEnabled){btn.textContent='🔕';btn.style.color='#666';btn.style.borderColor='rgba(255,255,255,.1)';}
},500);
function _playNotifSound(){
  if(!_sndSettings.master||!_sndSettings.notif) return;
  try{
    if(!_notifAudioCtx) _notifAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
    const ctx=_notifAudioCtx;
    const o=ctx.createOscillator();const g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);
    o.frequency.setValueAtTime(880,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+0.1);
    g.gain.setValueAtTime(0.3,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
    o.start(ctx.currentTime);o.stop(ctx.currentTime+0.4);
  }catch(e){}
}
// Welcome Message Admin Settings
async function saveWelcomeMessage(){
  const enabled=document.getElementById('welcome-enabled')?.checked;
  const senderName=document.getElementById('welcome-sender')?.value.trim();
  const text=document.getElementById('welcome-text')?.value.trim();
  const msg=document.getElementById('welcome-msg');
  try{
    const r=await fetch('/api/admin/welcome-message',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({enabled,senderName,text})});
    const d=await r.json();
    if(msg){msg.style.color=d.ok?'#4ade80':'#f87171';msg.textContent=d.ok?'✅ تم الحفظ':'❌ خطأ';}
  }catch(e){if(msg){msg.style.color='#f87171';msg.textContent='❌ خطأ';}}
}
function toggleWelcomeEnabled(){saveWelcomeMessage();}
async function loadWelcomeSettings(){
  try{
    const r=await fetch('/api/admin/welcome-message',{headers:{'x-admin-token':AK}});
    const d=await r.json();
    if(!d.ok) return;
    const w=d.welcome;
    const cb=document.getElementById('welcome-enabled');
    const sn=document.getElementById('welcome-sender');
    const tx=document.getElementById('welcome-text');
    if(cb) cb.checked=w.enabled;
    if(sn) sn.value=w.senderName||'';
    if(tx) tx.value=w.text||'';
  }catch(e){}
}

// ========== فتح الملف الشخصي ==========
function openMyProfile() {
  if(!cu) return;
  // نفس دالة فتح الملف الشخصي الموجودة
  if(typeof openProfile === 'function') {
    openProfile(cu.name);
  } else if(typeof showProfile === 'function') {
    showProfile(cu.name);
  }
}

// تحميل المتجر عند فتح الشات
// ========== إدارة الإيموجيات ==========

// مزامنة معاينة الإيموجي أثناء الكتابة
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('emoji-add-input');
  if(inp) {
    inp.addEventListener('input', () => {
      const val = inp.value.trim();
      const preview = document.getElementById('emoji-add-preview');
      const bulk = document.getElementById('emoji-bulk-preview');
      const emojis = parseEmojiInput(val);
      if(preview) preview.textContent = emojis[0] || '';
      if(bulk) {
        if(emojis.length > 1) {
          bulk.style.display = 'flex';
          bulk.innerHTML = emojis.map(e=>`<span title="${e}" style="cursor:default;">${e}</span>`).join('');
        } else {
          bulk.style.display = 'none';
        }
      }
    });
  }
});

function parseEmojiInput(val) {
  if(!val) return [];
  // فصل بفاصلة أو مسافة
  return val.split(/[,،\s]+/).map(e=>e.trim()).filter(e=>e.length>0);
}

function adminAddEmoji() {
  const inp = document.getElementById('emoji-add-input');
  const cat = document.getElementById('emoji-cat-select')?.value || 'faces';
  const msg = document.getElementById('emoji-add-msg');
  if(!inp || !inp.value.trim()) { if(msg) { msg.textContent='❌ أدخل إيموجي أولاً'; msg.style.color='#f87171'; setTimeout(()=>msg.textContent='',2000); } return; }
  const emojis = parseEmojiInput(inp.value.trim());
  if(!emojis.length) return;
  // إضافة للمصفوفة
  if(!EMOJIS[cat]) EMOJIS[cat] = [];
  let added = 0;
  emojis.forEach(e => {
    if(!EMOJIS[cat].includes(e)) { EMOJIS[cat].push(e); added++; }
  });
  inp.value = '';
  document.getElementById('emoji-add-preview').textContent = '';
  document.getElementById('emoji-bulk-preview').style.display = 'none';
  renderAdminEmojis();
  // تحديث الـ picker إذا كان مفتوحاً
  if(currentCat === cat) renderEmojiGrid(cat);
  if(msg) {
    msg.textContent = added > 0 ? `✅ تم إضافة ${added} إيموجي` : '⚠️ كل الإيموجيات موجودة مسبقاً';
    msg.style.color = added > 0 ? '#4ade80' : '#fcd34d';
    setTimeout(()=>msg.textContent='', 3000);
  }
}

function adminAddEmojiPreset(type) {
  const presets = {
    iraq: { cat:'iraqi', emojis:['🇮🇶','🏛️','🌴','🏺','⚔️','🦁','🐪','🌙','☀️','🌊','🏜️','🎭','🎪','🥁','🍖','🍲','🫖','🎋','🌾','🏔️'] },
    love:  { cat:'hearts', emojis:['💘','💝','💖','💗','💓','💞','💕','❣️','💟','🫀','💑','👫','💏','🥰','😍','😘','😗','☺️','🫦','💋'] },
    fun:   { cat:'faces',  emojis:['🤣','😂','😝','😜','🤪','😛','🤭','🫢','🙈','🙉','🙊','🤡','👻','💀','🎭','🤸','🥳','🎉','🎊','🥸'] }
  };
  const p = presets[type];
  if(!p) return;
  if(!EMOJIS[p.cat]) EMOJIS[p.cat] = [];
  let added = 0;
  p.emojis.forEach(e => { if(!EMOJIS[p.cat].includes(e)) { EMOJIS[p.cat].push(e); added++; } });
  document.getElementById('emoji-cat-select').value = p.cat;
  document.getElementById('emoji-view-cat').value = p.cat;
  renderAdminEmojis();
  if(currentCat === p.cat) renderEmojiGrid(p.cat);
  const msg = document.getElementById('emoji-add-msg');
  if(msg) { msg.textContent=`✅ تم إضافة ${added} إيموجي`; msg.style.color='#4ade80'; setTimeout(()=>msg.textContent='',3000); }
}

function adminDeleteEmoji(cat, emoji) {
  if(!EMOJIS[cat]) return;
  EMOJIS[cat] = EMOJIS[cat].filter(e => e !== emoji);
  renderAdminEmojis();
  if(currentCat === cat) renderEmojiGrid(cat);
}

function adminResetEmojis() {
  if(!confirm('هل تريد استعادة الإيموجيات الافتراضية؟ سيتم حذف ما أضفته!')) return;
  // نعيد تحميل الصفحة لاستعادة EMOJIS الافتراضية
  location.reload();
}

function renderAdminEmojis() {
  const grid = document.getElementById('admin-emoji-grid');
  if(!grid) return;
  const filterCat = document.getElementById('emoji-view-cat')?.value || 'all';
  const cats = filterCat === 'all' ? Object.keys(EMOJIS) : [filterCat];
  let html = '';
  const catNames = {faces:'😊 وجوه',hearts:'❤️ قلوب',nature:'🌹 طبيعة',food:'🍕 طعام',activity:'⚽ نشاط',travel:'🌍 سفر',animals:'🐶 حيوانات',symbols:'💯 رموز',flags:'🇮🇶 أعلام',iraqi:'🗣️ عراقي',greetings:'🤲 تحيات'};
  cats.forEach(cat => {
    const emojis = EMOJIS[cat] || [];
    if(!emojis.length) return;
    html += `<div style="width:100%;margin-bottom:4px;">
      <div style="font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:8px;padding:4px 8px;background:rgba(167,139,250,.1);border-radius:6px;display:inline-block;">${catNames[cat]||cat} (${emojis.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
    emojis.forEach(e => {
      html += `<div style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;cursor:default;transition:.2s;" 
        onmouseover="this.querySelector('.del-btn').style.display='flex'" 
        onmouseout="this.querySelector('.del-btn').style.display='none'">
        <span style="font-size:22px;">${e}</span>
        <button class="del-btn" onclick="adminDeleteEmoji('${cat}','${e.replace(/'/g,"\\'")}')" 
          style="display:none;position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#ef4444;border:none;border-radius:50%;color:white;font-size:11px;cursor:pointer;align-items:center;justify-content:center;padding:0;z-index:1;">✕</button>
      </div>`;
    });
    html += `</div></div>`;
  });
  if(!html) html = '<div style="color:var(--mut);font-size:13px;padding:20px;width:100%;text-align:center;">لا توجد إيموجيات</div>';
  grid.innerHTML = html;
}


// =====================================================
// ===== نظام الصداقة الكامل =====
// =====================================================

let _friendsList    = [];
let _friendRequests = [];
let _pendingRequests = []; // طلبات أرسلتها أنا ولم تُقبل بعد

// إرسال طلب صداقة
function sendFriendRequest(username) {
  if (!username || !cu) return;
  const myName = cu.name || cu.username;
  if (username === myName) return toast('لا يمكنك إضافة نفسك!','e');
  if (_friendsList.find(f => f.username === username)) return toast('أنتم أصدقاء بالفعل 👫','e');
  if (_pendingRequests.includes(username)) return toast('تم إرسال الطلب مسبقاً ⏳','e');
  _pendingRequests.push(username);
  socket.emit('friend-request', { to: username });
}

// تحميل الأصدقاء والطلبات من السيرفر
function _loadFriendsData() {
  socket.emit('load-friends', {});
}

// تحديث شارة عدد الطلبات الواردة
function updateFriendBadge() {
  const count = _friendRequests.length;
  // شارة على أيقونة الأصدقاء في الهيدر
  const badge = document.getElementById('freq-badge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-flex' : 'none'; }
  // نقطة حمراء بديلة
  const dot = document.getElementById('friends-hdr-dot');
  if (dot) dot.style.display = count > 0 ? 'block' : 'none';
}

// رسم قائمة الأصدقاء
function renderFriendsList() {
  const el = document.getElementById('friends-list-tab');
  if (!el) return;
  if (!_friendsList.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--mut);padding:40px 20px;flex-direction:column;display:flex;align-items:center;gap:8px;"><div style="font-size:40px;">👥</div><div>لا يوجد أصدقاء بعد</div><div style="font-size:12px;opacity:.6;">أضف أصدقاء من خلال الضغط على اسم أي عضو</div></div>';
    return;
  }
  el.innerHTML = _friendsList.map(f => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.07);margin-bottom:6px;">
      <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#000;flex-shrink:0;">${(f.username||'?')[0].toUpperCase()}</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:13px;color:#fff;">${esc(f.username)}</div>
        <div style="font-size:11px;color:var(--mut);">❤️ صديق</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button onclick="openPM('${esc(f.username)}')" style="background:rgba(0,191,255,.12);border:1px solid rgba(0,191,255,.25);color:#00bfff;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:13px;">💬</button>
        <button onclick="removeFriend('${esc(f.username)}')" style="background:rgba(244,67,54,.1);border:1px solid rgba(244,67,54,.2);color:#f44336;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:12px;font-family:'Cairo',sans-serif;">إزالة</button>
      </div>
    </div>`).join('');
}

// رسم طلبات الصداقة الواردة
function renderFriendRequests() {
  const el = document.getElementById('friends-requests-tab');
  if (!el) return;
  if (!_friendRequests.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--mut);padding:40px 20px;flex-direction:column;display:flex;align-items:center;gap:8px;"><div style="font-size:40px;">📩</div><div>لا توجد طلبات معلقة</div></div>';
    return;
  }
  el.innerHTML = _friendRequests.map(r => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,215,0,.05);border-radius:12px;border:1px solid rgba(255,215,0,.15);margin-bottom:6px;">
      <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1565c0,#42a5f5);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;">${(r.from||'?')[0].toUpperCase()}</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:13px;color:#fff;">${esc(r.from)}</div>
        <div style="font-size:11px;color:var(--mut);">🤝 يريد إضافتك كصديق</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button onclick="acceptFriendRequest('${esc(r.from)}')" style="background:rgba(0,230,118,.15);border:1px solid rgba(0,230,118,.3);color:#00e676;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:12px;font-family:'Cairo',sans-serif;">✓ قبول</button>
        <button onclick="rejectFriendRequest('${esc(r.from)}')" style="background:rgba(244,67,54,.1);border:1px solid rgba(244,67,54,.2);color:#f44336;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:12px;font-family:'Cairo',sans-serif;">✕ رفض</button>
      </div>
    </div>`).join('');
}

// تبديل التبويبات داخل نافذة الأصدقاء
function showFriendsTab(tab) {
  const listTab = document.getElementById('friends-list-tab');
  const reqTab  = document.getElementById('friends-requests-tab');
  const btnList = document.getElementById('ftab-list');
  const btnReq  = document.getElementById('ftab-requests');
  if (tab === 'list') {
    if(listTab) listTab.style.display = 'flex';
    if(reqTab)  reqTab.style.display  = 'none';
    if(btnList) { btnList.classList.add('on'); }
    if(btnReq)  { btnReq.classList.remove('on'); }
    renderFriendsList();
  } else {
    if(listTab) listTab.style.display = 'none';
    if(reqTab)  reqTab.style.display  = 'flex';
    if(btnList) { btnList.classList.remove('on'); }
    if(btnReq)  { btnReq.classList.add('on'); }
    renderFriendRequests();
  }
}

// فتح نافذة الأصدقاء
function openFriendsOverlay() {
  const ov = document.getElementById('friends-ov');
  if (!ov) return;
  ov.classList.add('on');
  _loadFriendsData();
  showFriendsTab('list');
}

function acceptFriendRequest(fromUser) {
  socket.emit('friend-accept', { from: fromUser });
  _friendRequests = _friendRequests.filter(r => r.from !== fromUser);
  updateFriendBadge();
  renderFriendRequests();
}

function rejectFriendRequest(fromUser) {
  socket.emit('friend-reject', { from: fromUser });
  _friendRequests = _friendRequests.filter(r => r.from !== fromUser);
  updateFriendBadge();
  renderFriendRequests();
  toast('تم رفض الطلب', 'k');
}

function removeFriend(username) {
  if (!confirm('هل تريد إزالة ' + username + ' من قائمة أصدقائك؟')) return;
  socket.emit('friend-remove', { username });
  _friendsList = _friendsList.filter(f => f.username !== username);
  renderFriendsList();
  toast('تمت إزالة ' + username, 'k');
}

// ===== Socket Events =====

// استقبال بيانات الأصدقاء والطلبات
socket.on('friends-data', (data) => {
  _friendsList    = data.friends  || [];
  _friendRequests = data.requests || [];
  // مزامنة الطلبات المرسلة لمنع الإرسال المزدوج
  if (data.sent) _pendingRequests = data.sent;
  updateFriendBadge();
  renderFriendsList();
  renderFriendRequests();
});

// طلب صداقة وارد — إشعار فوري
socket.on('friend-request-incoming', (data) => {
  if (!_friendRequests.find(r => r.from === data.from)) {
    _friendRequests.unshift({ from: data.from, time: data.time });
  }
  updateFriendBadge();

  // إشعار بصري فوري
  const notif = document.createElement('div');
  notif.id = 'freq-notif-' + data.from;
  notif.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(13,36,68,.97),rgba(10,22,40,.97));border:1px solid rgba(245,166,35,.35);border-radius:16px;padding:14px 16px;z-index:99999;color:#fff;font-family:Cairo,sans-serif;font-size:13px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,.6);min-width:280px;max-width:340px;';
  notif.innerHTML = `
    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1565c0,#42a5f5);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;flex-shrink:0;">${(data.from||'?')[0].toUpperCase()}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-weight:700;color:#ffd700;margin-bottom:2px;">${esc(data.from)}</div>
      <div style="color:#ccc;font-size:12px;margin-bottom:10px;">أرسل لك طلب صداقة 🤝</div>
      <div style="display:flex;gap:8px;">
        <button onclick="acceptFriendRequest('${esc(data.from)}');document.getElementById('freq-notif-${esc(data.from)}')?.remove();" style="background:rgba(0,230,118,.18);border:1px solid rgba(0,230,118,.35);color:#00e676;border-radius:8px;padding:5px 14px;cursor:pointer;font-size:12px;font-family:Cairo,sans-serif;">✓ قبول</button>
        <button onclick="rejectFriendRequest('${esc(data.from)}');document.getElementById('freq-notif-${esc(data.from)}')?.remove();" style="background:rgba(244,67,54,.12);border:1px solid rgba(244,67,54,.28);color:#f44336;border-radius:8px;padding:5px 14px;cursor:pointer;font-size:12px;font-family:Cairo,sans-serif;">✕ رفض</button>
      </div>
    </div>
    <button onclick="this.closest('[id^=freq-notif]').remove()" style="background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:18px;line-height:1;padding:0;flex-shrink:0;">✕</button>`;
  document.body.appendChild(notif);
  // إزالة تلقائية بعد 12 ثانية
  setTimeout(() => notif.remove(), 12000);
  // صوت إشعار
  if (typeof _playNotifSound === 'function') _playNotifSound();
});

// تأكيد إرسال الطلب
socket.on('friend-request-sent', (data) => {
  toast('📩 تم إرسال طلب صداقة إلى ' + data.to, 'k');
});

// الشخص صديق بالفعل
socket.on('friend-already', (data) => {
  toast('أنتم أصدقاء بالفعل 👫', 'e');
  _pendingRequests = _pendingRequests.filter(u => u !== data.to);
});

// شخص قبل طلبك
socket.on('friend-accepted', (data) => {
  toast('🎉 ' + data.by + ' قبل طلب صداقتك!', 'k');
  _pendingRequests = _pendingRequests.filter(u => u !== data.by);
  if (!_friendsList.find(f => f.username === data.by)) {
    _friendsList.unshift({ username: data.by });
  }
  _friendRequests = _friendRequests.filter(r => r.from !== data.by);
  updateFriendBadge();
  renderFriendsList();
  renderFriendRequests();
  if (typeof _playNotifSound === 'function') _playNotifSound();
});

// تأكيد الإزالة
socket.on('friend-removed', (data) => {
  _friendsList = _friendsList.filter(f => f.username !== data.username);
  _pendingRequests = _pendingRequests.filter(u => u !== data.username);
  renderFriendsList();
});

// ===== STICKER PANEL =====
const STICKER_CATS = {
  hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💓','💗','💖','💘','💝','😍','🥰','😘','💋','💌','🫀','❤️‍🔥','💔','🩷','🩵','🫶'],
  happy: ['😂','🤣','😊','😁','😄','😃','😆','😅','😜','🤪','😋','🥴','😎','🤩','🥳','🙈','🙉','🙊','😸','😹','🤭','😂','🤗','🤑','😏'],
  iraqi: ['هههه 😂','ولله 😊','چذاب 🤣','يمه 😍','يلعن 💢','شلونك 🙋','گلبي 💙','ربي 🤲','الله 🙏','احه 😤','يبه 😂','شد حيلك 💪','ابن الحلال 🏅','ما اكو 🤷','شبيك 🧐','والله 😶','بس چذا ✋','يخويه 😄','تعبتني 😭','حياك الله 🌸'],
  greet: ['👋','🤝','🫂','👏','🙌','🤲','🙏','💪','🫡','✌️','🤙','🤞','👍','🫶','🤗','🫵','☀️ صباح الخير','🌙 مساء الخير','السلام عليكم 🤲','هلا والله 😊'],
  react: ['😡','😤','💢','😭','😢','😰','😱','🤯','😵','🫠','😴','🥺','😞','😔','😩','😣','😫','🤦','🤷','🙄','😒','😑','😶','🫥','💀','☠️'],
  nature: ['🌹','🌷','🌸','🌺','🌻','🌼','💐','🪷','🌿','🌱','🍀','🌙','⭐','🌟','💫','✨','🌈','🌊','❄️','🔥','🦋','🌍','☀️','🌤️','🌠','🪩']
};

let _stickerPanelOpen = false;
let _currentStkCat = 'hearts';

function toggleStickerPanel() {
  const panel = document.getElementById('sticker-panel');
  if (!panel) return;
  _stickerPanelOpen = !_stickerPanelOpen;
  panel.style.display = _stickerPanelOpen ? 'block' : 'none';
  const btn = document.getElementById('sticker-btn');
  if (btn) { btn.style.background = _stickerPanelOpen ? 'rgba(138,43,226,.3)' : 'rgba(138,43,226,.08)'; }
  if (_stickerPanelOpen) { showStkCat(_currentStkCat); }
}

function showStkCat(cat) {
  _currentStkCat = cat;
  document.querySelectorAll('.stk-tab').forEach(b => b.classList.remove('active'));
  const tabs = document.querySelectorAll('.stk-tab');
  const catOrder = ['hearts','happy','iraqi','greet','react','nature'];
  const idx = catOrder.indexOf(cat);
  if (tabs[idx]) tabs[idx].classList.add('active');
  const grid = document.getElementById('stk-grid');
  if (!grid) return;
  const stickers = STICKER_CATS[cat] || [];
  const isText = cat === 'iraqi' || cat === 'greet';
  grid.innerHTML = stickers.map(s => {
    const isTextStk = typeof s === 'string' && (s.includes(' ') || s.length > 4);
    return `<div class="stk-item${isTextStk ? ' text-stk' : ''}" onclick="sendSticker('${s.replace(/'/g,"\\'")}', ${isTextStk})" title="${s}">${s}</div>`;
  }).join('');
}

function sendSticker(sticker, isText) {
  if (!socket || !cu) { toast('يجب تسجيل الدخول أولاً', 'e'); return; }
  socket.emit('chat-sticker', { sticker, isText: !!isText });
  const panel = document.getElementById('sticker-panel');
  if (panel) panel.style.display = 'none';
  _stickerPanelOpen = false;
  const btn = document.getElementById('sticker-btn');
  if (btn) btn.style.background = 'rgba(138,43,226,.08)';
}

socket.on('chat-sticker-msg', (msg) => {
  renderMsg(msg);
  autoScroll();
  if (msg.username !== (cu && cu.name)) {
    if (typeof _playNotifSound === 'function') _playNotifSound();
  }
});
// ===== END STICKER PANEL =====
