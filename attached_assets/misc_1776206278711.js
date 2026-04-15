// ===== ACTIVITY PING - يحافظ على المستخدم النشط متصلاً =====
// يُرسل ping كل دقيقة لمنع الإخراج بسبب الخمول
const _activityPingInterval = setInterval(() => {
  if (cu && socket.connected) {
    socket.emit('activity-ping');
  }
}, 60 * 1000);

// معالجة انقطاع الاتصال المؤقت
// disconnect handler في profile.js

// reconnect handler موجود في chat.js

socket.on('reconnect_error', () => {
  setTimeout(() => {
    if (!socket.connected) socket.connect();
  }, 2000);
});

/* =====================================================
   ===== POPUP MENU — القائمة المنبثقة =====
   ===================================================== */
// ghzlIgnoreList declared in profile.js

/* ===== SADA-STYLE POPUP ===== */
// _ghzlPopupLiked declared in profile.js
// _ghzlPopupLikeCount declared in profile.js
// _ghzlPopupUser declared in profile.js

// ghzlPopupSwitchTab — معرَّفة في profile.js

// ghzlPopupLike — معرَّفة في profile.js

// ghzlShowPopup — معرَّفة في profile.js
// ghzlClosePopup — معرَّفة في profile.js
// ghzlUnignore — معرَّفة في profile.js
// ghzlRenderIgnore — معرَّفة في profile.js

/* Override openCtx to show our popup */
// _origOpenCtx declared in profile.js
openCtx = function(e, n){
  e.stopPropagation();
  ghzlShowPopup(n, '');
};

/* Override addSec click to use our popup */
// _origAddSec declared in profile.js

/* =====================================================
   ===== SETTINGS PANEL — لوحة الضبط =====
   ===================================================== */
let _ghzlSettingsOpen = false;

function ghzlToggleSettings(){
  _ghzlSettingsOpen = !_ghzlSettingsOpen;
  const p = document.getElementById('ghzl-settings-panel');
  if(!p) return;
  p.style.display = 'block';
  requestAnimationFrame(()=>{ p.classList.toggle('on', _ghzlSettingsOpen); });
  if(_ghzlSettingsOpen){
    // تعبئة معلوماتي
    if(cu){
      const sn=document.getElementById('ghzl-si-name'); if(sn)sn.textContent=cu.name||'—';
      const sr=document.getElementById('ghzl-si-rank'); if(sr){sr.textContent=RK_LABEL[cu.rank]||'—';sr.style.color=RK_COLOR[cu.rank]||'#fff';}
      const sg=document.getElementById('ghzl-si-gold'); if(sg)sg.textContent=myGold||0;
      const sd=document.getElementById('ghzl-si-diamond'); if(sd)sd.textContent=myDiamond||0;
      const sge=document.getElementById('ghzl-si-gender'); if(sge)sge.textContent=cu.gender||'—';
      const sa=document.getElementById('ghzl-si-age'); if(sa)sa.textContent=cu.age||'—';
    }
    ghzlRenderIgnore();
    setTimeout(()=>document.addEventListener('click',_ghzlOutside),100);
  } else {
    document.removeEventListener('click',_ghzlOutside);
  }
}
function _ghzlOutside(e){
  const p=document.getElementById('ghzl-settings-panel');
  if(p&&!p.contains(e.target)&&!e.target.closest('.ghzl-settings-btn')&&!e.target.closest('.ghzl-bb-item')){
    _ghzlSettingsOpen=false; p.classList.remove('on');
    document.removeEventListener('click',_ghzlOutside);
  }
}
function ghzlSpTab(btn,tab){
  document.querySelectorAll('.ghzl-sp-tab').forEach(t=>t.classList.remove('on'));
  btn.classList.add('on');
  ['myinfo','status','sounds','privacy','ignore'].forEach(t=>{
    const el=document.getElementById('ghzl-sp-'+t); if(el)el.style.display=t===tab?'':'none';
  });
  if(tab==='ignore')ghzlRenderIgnore();
  if(tab==='sounds')ghzlSyncSoundUI();
}
function ghzlSetStatus(btn,val){
  document.querySelectorAll('.ghzl-status-opt').forEach(o=>o.classList.remove('on'));
  btn.classList.add('on');
  toast('✅ تم تغيير حالتك','k');
}
function ghzlSaveStatusTxt(){
  const t=document.getElementById('ghzl-status-txt')?.value?.trim();
  if(t)toast('✅ تم حفظ نص الحالة','k');
}

// ===== إعدادات الأصوات =====
const _sndSettings = {
  master:  localStorage.getItem('ghazal_snd_master')  !== 'off',
  general: localStorage.getItem('ghazal_snd_general') !== 'off',
  msg:     localStorage.getItem('ghazal_snd_msg')     !== 'off',
  notif:   localStorage.getItem('ghazal_notif')       !== 'off',
  click:   localStorage.getItem('ghazal_snd_click')   !== 'off',
  call:    localStorage.getItem('ghazal_snd_call')    !== 'off',
};

// ===== FIX: إدارة AudioContext مع دعم سياسة المتصفح =====
// _notifAudioCtx معرَّف في chat.js — لا نُعيد تعريفه هنا
let _audioCtxReady = false;

function _initAudioCtx() {
  if (_audioCtxReady) return;
  try {
    if (!_notifAudioCtx) {
      _notifAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_notifAudioCtx.state === 'suspended') {
      _notifAudioCtx.resume();
    }
    _audioCtxReady = true;
  } catch(e) {
    console.warn('AudioContext init failed:', e);
  }
}

// تفعيل الصوت عند أول تفاعل من المستخدم (مطلوب من المتصفحات الحديثة)
['click','keydown','touchstart'].forEach(evt => {
  document.addEventListener(evt, function _unlock() {
    _initAudioCtx();
    if (_notifAudioCtx && _notifAudioCtx.state === 'suspended') {
      _notifAudioCtx.resume();
    }
    document.removeEventListener(evt, _unlock);
  }, { once: true });
});

function _getCtx() {
  if (!_notifAudioCtx) _initAudioCtx();
  if (_notifAudioCtx && _notifAudioCtx.state === 'suspended') {
    _notifAudioCtx.resume();
  }
  return _notifAudioCtx;
}

function ghzlSoundToggle(key, val){
  if(key==='master'){
    ['general','msg','notif','click','call'].forEach(k=>{
      _sndSettings[k]=val;
      localStorage.setItem(k==='notif'?'ghazal_notif':'ghazal_snd_'+k, val?'on':'off');
      const el=document.getElementById('snd-'+k); if(el) el.checked=val;
    });
    _sndSettings.master=val;
    localStorage.setItem('ghazal_snd_master', val?'on':'off');
    // sync the global notif flag
    _notifEnabled=val;
    localStorage.setItem('ghazal_notif', val?'on':'off');
    const bell=document.getElementById('notif-bell');
    if(bell){bell.textContent=val?'🔔':'🔕';bell.style.color=val?'#ffd700':'#666';bell.style.borderColor=val?'rgba(255,215,0,.2)':'rgba(255,255,255,.1)';}
  } else {
    _sndSettings[key]=val;
    localStorage.setItem(key==='notif'?'ghazal_notif':'ghazal_snd_'+key, val?'on':'off');
    if(key==='notif'){
      _notifEnabled=val;
      const bell=document.getElementById('notif-bell');
      if(bell){bell.textContent=val?'🔔':'🔕';bell.style.color=val?'#ffd700':'#666';bell.style.borderColor=val?'rgba(255,215,0,.2)':'rgba(255,255,255,.1)';}
    }
  }
  // تشغيل صوت تجريبي عند التفعيل للتأكيد
  if(val) setTimeout(()=>_playTestBeep(), 100);
  toast(val?'🔊 تم تفعيل الصوت':'🔇 تم كتم الصوت','k');
}

// مزامنة حالة المفاتيح عند فتح لوحة الأصوات
function ghzlSyncSoundUI(){
  ['master','general','msg','notif','click','call'].forEach(k=>{
    const el=document.getElementById('snd-'+k); if(el) el.checked=_sndSettings[k];
  });
}

// صوت تجريبي قصير للتأكيد عند تفعيل أي مفتاح
function _playTestBeep(){
  const ctx = _getCtx(); if(!ctx) return;
  try{
    const o=ctx.createOscillator(); const g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(520, ctx.currentTime);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.2);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.2);
  }catch(e){}
}

// تشغيل صوت رسالة خاصة
function _playPMSound(){
  if(!_sndSettings.master||!_sndSettings.msg) return;
  const ctx = _getCtx(); if(!ctx) return;
  try{
    const o=ctx.createOscillator(); const g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(660,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.08);
    o.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+0.18);
    g.gain.setValueAtTime(0.25,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.35);
  }catch(e){}
}

// تشغيل صوت الضغط على الاسم
function _playClickSound(){
  if(!_sndSettings.master||!_sndSettings.click) return;
  const ctx = _getCtx(); if(!ctx) return;
  try{
    const o=ctx.createOscillator(); const g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(440,ctx.currentTime);
    g.gain.setValueAtTime(0.1,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.12);
  }catch(e){}
}

// تشغيل رنين الاتصال الوارد
let _callRingInterval=null;
function _playCallRingSound(){
  _stopCallRingSound();
  _callRingInterval=setInterval(()=>{
    if(!_sndSettings.master||!_sndSettings.call){_stopCallRingSound();return;}
    const ctx = _getCtx(); if(!ctx) return;
    try{
      [0, 0.18].forEach(offset=>{
        const o=ctx.createOscillator(); const g=ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(700,ctx.currentTime+offset);
        g.gain.setValueAtTime(0.22,ctx.currentTime+offset);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+offset+0.14);
        o.start(ctx.currentTime+offset); o.stop(ctx.currentTime+offset+0.14);
      });
    }catch(e){}
  }, 1800);
}
function _stopCallRingSound(){
  if(_callRingInterval){clearInterval(_callRingInterval);_callRingInterval=null;}
}

/* Bottom bar للموبايل */
function ghzlBbSwitch(btn, tab){
  document.querySelectorAll('.ghzl-bb-item').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const rp=document.getElementById('rpanel'); const up=document.getElementById('upanel');
  if(tab==='rooms'){if(rp)rp.style.display='';if(up)up.style.display='none';}
  else if(tab==='members'){if(up)up.style.display='';if(rp)rp.style.display='none';}
  else if(tab==='settings'){if(rp)rp.style.display='none';if(up)up.style.display='none';ghzlToggleSettings();}
}

/* Init bottom bar on mobile */
document.addEventListener('DOMContentLoaded',()=>{
  if(window.innerWidth<=640){
    const bb=document.getElementById('ghzl-bottom-bar');
    if(bb)bb.classList.add('on');
  }
  // مزامنة حالة الأصوات من localStorage عند التحميل
  ghzlSyncSoundUI();
});
