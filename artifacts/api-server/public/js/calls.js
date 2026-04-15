// ===== PM DRAG & RESIZE =====
(function(){
  const pm = document.getElementById('pm');
  const handle = document.getElementById('pm-drag-handle');
  let dragging = false, ox = 0, oy = 0;
  handle.addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true;
    ox = e.clientX - pm.getBoundingClientRect().left;
    oy = e.clientY - pm.getBoundingClientRect().top;
    pm.style.transition = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    let x = e.clientX - ox, y = e.clientY - oy;
    x = Math.max(0, Math.min(window.innerWidth - pm.offsetWidth, x));
    y = Math.max(0, Math.min(window.innerHeight - pm.offsetHeight, y));
    pm.style.left = x + 'px';
    pm.style.top = y + 'px';
    pm.style.bottom = 'auto';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
  // Touch support
  handle.addEventListener('touchstart', e => {
    if (e.target.tagName === 'BUTTON') return;
    const t = e.touches[0];
    dragging = true;
    ox = t.clientX - pm.getBoundingClientRect().left;
    oy = t.clientY - pm.getBoundingClientRect().top;
  }, {passive:true});
  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const t = e.touches[0];
    pm.style.left = Math.max(0, t.clientX - ox) + 'px';
    pm.style.top = Math.max(0, t.clientY - oy) + 'px';
    pm.style.bottom = 'auto';
  }, {passive:true});
  document.addEventListener('touchend', () => { dragging = false; });
})();

let _pmMaximized = false;
let _pmLastPos = { left:'16px', bottom:'16px', top:'auto', width:'340px', height:'440px' };
function togglePMSize() {
  const pm = document.getElementById('pm');
  const btn = document.getElementById('pm-max-btn');
  if (_pmMaximized) {
    pm.style.width = _pmLastPos.width;
    pm.style.height = _pmLastPos.height;
    pm.style.left = _pmLastPos.left;
    pm.style.top = _pmLastPos.top;
    pm.style.bottom = _pmLastPos.bottom;
    if(btn) btn.textContent = '⛶';
    _pmMaximized = false;
  } else {
    _pmLastPos = {
      left: pm.style.left || '16px',
      top: pm.style.top || 'auto',
      bottom: pm.style.bottom || '16px',
      width: pm.style.width || '340px',
      height: pm.style.height || '440px'
    };
    const w = Math.min(560, window.innerWidth - 32);
    const h = Math.min(640, window.innerHeight - 32);
    pm.style.width = w + 'px';
    pm.style.height = h + 'px';
    pm.style.left = Math.round((window.innerWidth - w) / 2) + 'px';
    pm.style.top = Math.round((window.innerHeight - h) / 2) + 'px';
    pm.style.bottom = 'auto';
    if(btn) btn.textContent = '⊡';
    _pmMaximized = true;
  }
}

// ===== أزرار تحكم النافذة الجديدة =====
let _pmMinimized = false;
function togglePMMinimize() {
  const pm = document.getElementById('pm');
  _pmMinimized = !_pmMinimized;
  if (_pmMinimized) {
    pm.classList.add('minimized');
  } else {
    pm.classList.remove('minimized');
    const msgs = document.getElementById('pmm');
    if(msgs) setTimeout(()=>{ msgs.scrollTop = msgs.scrollHeight; }, 50);
  }
}
function togglePMMaximize() {
  const pm = document.getElementById('pm');
  // إذا كان مصغراً، أعده أولاً
  if(_pmMinimized){ _pmMinimized=false; pm.classList.remove('minimized'); }
  if (_pmMaximized) {
    pm.style.width = _pmLastPos.width || '340px';
    pm.style.height = _pmLastPos.height || '440px';
    pm.style.left = _pmLastPos.left || '16px';
    pm.style.top = _pmLastPos.top || 'auto';
    pm.style.bottom = _pmLastPos.bottom || '16px';
    _pmMaximized = false;
  } else {
    _pmLastPos = {
      left: pm.style.left || '16px',
      top: pm.style.top || 'auto',
      bottom: pm.style.bottom || '16px',
      width: pm.style.width || '340px',
      height: pm.style.height || '440px'
    };
    const w = Math.min(560, window.innerWidth - 32);
    const h = Math.min(640, window.innerHeight - 32);
    pm.style.width = w + 'px';
    pm.style.height = h + 'px';
    pm.style.left = Math.round((window.innerWidth - w) / 2) + 'px';
    pm.style.top = Math.round((window.innerHeight - h) / 2) + 'px';
    pm.style.bottom = 'auto';
    _pmMaximized = true;
  }
}

// ===== WebRTC CALLS (FIXED) =====
let _pc = null, _localStream = null, _callTarget = null, _callType = null;
let _callTimer = null, _callSecs = 0, _isCaller = false;
let _pendingOffer = null, _callMuted = false, _camOff = false, _callEnding = false;

// ICE config — يُجلب من السيرفر ديناميكياً قبل كل مكالمة
let _iceConfig = null;

async function _getIceConfig() {
  const _fallback = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };
  try {
    const r = await fetch('/api/turn-credentials');
    const d = await r.json();
    // Metered يُرجع مصفوفة مباشرة أو { iceServers: [...] }
    let servers = null;
    if (Array.isArray(d)) {
      servers = d;
    } else if (d.iceServers && Array.isArray(d.iceServers)) {
      servers = d.iceServers;
    }
    if (servers && servers.length > 0) {
      // تحقق أن كل عنصر عنده urls صحيح
      servers = servers.filter(s => s && (s.urls || (Array.isArray(s.urls) && s.urls.length)));
      if (servers.length > 0) {
        _iceConfig = { iceServers: servers, iceCandidatePoolSize: 10 };

        return _iceConfig;
      }
    }
  } catch(e) { console.warn('Failed to fetch TURN credentials:', e); }
  console.warn('Using fallback ICE (STUN only)');
  return _fallback;
}

// للتوافق مع الكود القديم
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ===== ICE QUEUE — يحفظ candidates قبل setRemoteDescription =====
let _iceQueue = [];

async function _flushIceQueue() {
  while (_iceQueue.length && _pc && _pc.remoteDescription) {
    const c = _iceQueue.shift();
    try { await _pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
  }
}

function _setupPC(iceConfig) {
  _pc = new RTCPeerConnection(iceConfig || ICE);

  // إرسال ICE للطرف الآخر
  _pc.onicecandidate = e => {
    if (e.candidate && _callTarget)
      socket.emit('call-ice', { to: _callTarget, candidate: e.candidate });
  };

  // استقبال stream الطرف الآخر → إظهاره في remote-video
  _pc.ontrack = e => {

    const rv = document.getElementById('remote-video');
    if (e.streams && e.streams[0]) {
      rv.srcObject = e.streams[0];
      if (_callType !== 'video') {
        // إخفاء بصري فقط — لا نستخدم opacity:0 لأنه يوقف الصوت في Chrome
        rv.style.position = 'fixed';
        rv.style.left = '-9999px';
        rv.style.width = '1px';
        rv.style.height = '1px';
        rv.style.opacity = '1';
        rv.style.display = 'block';
      } else {
        rv.style.position = '';
        rv.style.left = '';
        rv.style.width = '';
        rv.style.height = '';
        rv.style.opacity = '';
        rv.style.display = 'block';
      }
      // تأكد من عدم كتم الصوت
      rv.muted = false;
      rv.volume = 1.0;
      rv.play().catch(e => console.warn('rv.play() failed:', e));
      // fallback: إذا بقي connectionState في connecting، ابدأ العداد عند وصول الصوت
      setTimeout(() => {
        if (_pc && _pc.connectionState !== 'connected') {
          document.getElementById('call-status').textContent = '🟢 متصل';
          if (!_callTimer) _callTimerStart();
        }
      }, 1000);
    }
  };

  _pc.onconnectionstatechange = () => {
    const st = _pc?.connectionState;

    if (st === 'connected') {
      document.getElementById('call-status').textContent = '🟢 متصل';
      _callTimerStart();
    } else if (st === 'disconnected' || st === 'failed') {
      if (!_callEnding) { toast('📵 انقطع الاتصال', 'k'); endCall(); }
    }
  };

  _pc.onicegatheringstatechange = () => {

  };
}

function _attachLocalVideo(stream, isVideo) {
  const lv = document.getElementById('local-video');
  const rv = document.getElementById('remote-video');
  const wrap = document.getElementById('call-video-wrap');

  // ضروري لإظهار الفيديو المحلي في المتصفح بدون صوت
  lv.muted = true;
  lv.autoplay = true;
  lv.setAttribute('playsinline', '');

  if (isVideo) {
    lv.srcObject = stream;
    lv.style.display = 'block';
    lv.play().catch(() => {});
    rv.style.display = 'block';
    if (wrap) wrap.style.minHeight = '220px';
  } else {
    lv.style.display = 'none';
    rv.style.width = '0'; rv.style.height = '0';
    rv.style.position = 'absolute'; rv.style.opacity = '0';
    rv.style.display = 'block';
  }
}


function _callTimerStart() {
  _callSecs = 0;
  clearInterval(_callTimer); _callTimer = null;
  _callTimer = setInterval(() => {
    _callSecs++;
    const m = Math.floor(_callSecs/60), s = _callSecs%60;
    const el = document.getElementById('call-timer-disp');
    if (el) el.textContent = (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  }, 1000);
}

function toggleLocalVideoSize(el) {
  if (el._big) {
    el.style.width = '120px'; el.style.height = '90px';
    el.style.bottom = '8px'; el.style.right = '8px';
    el.style.left = 'auto'; el.style.top = 'auto';
    el._big = false;
  } else {
    el.style.width = '100%'; el.style.height = '100%';
    el.style.bottom = '0'; el.style.right = '0';
    el.style.left = '0'; el.style.top = '0';
    el.style.borderRadius = '14px';
    el._big = true;
  }
}

function showCallModal(name, type, status) {
  const modal = document.getElementById('call-modal');
  modal.style.display = 'flex';
  document.getElementById('call-name').textContent = name;
  document.getElementById('call-status').textContent = status;
  document.getElementById('call-avatar').textContent = (name||'?').charAt(0).toUpperCase();
  document.getElementById('call-timer-disp').textContent = '00:00';
  const isVideo = type === 'video';
  const camBtn = document.getElementById('call-cam-btn');
  camBtn.style.display = isVideo ? 'flex' : 'none';
  document.getElementById('remote-video').style.display = isVideo ? 'block' : 'none';
  document.getElementById('local-video').style.display = 'none'; // يُظهره _attachLocalVideo بعد srcObject
}
function _showPermissionHelp(errName, wantVideo) {
  let msg = '';
  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
    msg = `<div style="font-family:'Cairo',sans-serif;direction:rtl;max-width:320px;">
        <div style="font-size:18px;margin-bottom:8px;">🎤 تم رفض إذن ${wantVideo?'الكاميرا و':''}الميكروفون</div>
        <div style="font-size:13px;color:#ccc;line-height:1.7;margin-bottom:12px;">لتفعيل المكالمة يجب السماح للموقع باستخدام ${wantVideo?'الكاميرا و':''}الميكروفون:</div>
        <div style="font-size:12px;color:#ffd700;line-height:2;">
          🔒 اضغط على أيقونة القفل في شريط العنوان<br>
          ← اختر <b>إعدادات الموقع</b><br>
          ← غيّر ${wantVideo?'الكاميرا و':''}الميكروفون إلى <b>سماح</b><br>
          ← أعد تحميل الصفحة ثم حاول مجدداً
        </div></div>`;
  } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    msg = `<div style="font-family:'Cairo',sans-serif;direction:rtl;">
      <div style="font-size:16px;margin-bottom:6px;">⚠️ لم يتم العثور على ${wantVideo?'كاميرا أو ':''} ميكروفون</div>
      <div style="font-size:13px;color:#ccc;">تأكد من توصيل الجهاز وأنه يعمل بشكل صحيح.</div></div>`;
  } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
    msg = `<div style="font-family:'Cairo',sans-serif;direction:rtl;">
      <div style="font-size:16px;margin-bottom:6px;">⚠️ ${wantVideo?'الكاميرا أو ':''} الميكروفون مستخدم من تطبيق آخر</div>
      <div style="font-size:13px;color:#ccc;">أغلق التطبيقات الأخرى التي تستخدم الميكروفون ثم حاول مجدداً.</div></div>`;
  } else {
    msg = `<div style="font-family:'Cairo',sans-serif;direction:rtl;">
      <div style="font-size:16px;margin-bottom:6px;">❌ تعذّر الوصول للميكروفون</div>
      <div style="font-size:13px;color:#ccc;">${errName || 'خطأ غير معروف'}</div></div>`;
  }
  const existing = document.getElementById('perm-err-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'perm-err-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);';
  modal.innerHTML = `<div style="background:linear-gradient(135deg,#0d2244,#0a1628);border:1px solid rgba(255,100,100,.3);border-radius:18px;padding:24px 28px;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.8);">
      ${msg}
      <button onclick="document.getElementById('perm-err-modal').remove()" style="margin-top:16px;width:100%;background:rgba(255,100,100,.15);border:1px solid rgba(255,100,100,.3);color:#ff6b6b;border-radius:10px;padding:9px;cursor:pointer;font-size:13px;font-family:'Cairo',sans-serif;">حسناً</button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
}

async function _getMedia(wantVideo) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    _showPermissionHelp('NotSupported', wantVideo);
    throw new Error('المتصفح لا يدعم المكالمات - استخدم Chrome او Firefox او Edge');
  }
  if (wantVideo) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 640, height: 480, facingMode: 'user' } });
    } catch(e) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' ||
          e.name === 'NotFoundError'   || e.name === 'NotReadableError') {
        _showPermissionHelp(e.name, wantVideo);
        throw e;
      }
      console.warn('Camera failed, trying audio only:', e.message);
      toast('⚠️ لم يتم الوصول للكاميرا، سيتم الاتصال بالصوت فقط', 'k');
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch(e) {
    _showPermissionHelp(e.name, false);
    throw e;
  }
}

// Mobile helper — open PM with user then optionally start call
function startCall(type, username){
  openPM(username);
  if(type === 'audio' || type === 'video'){
    setTimeout(() => startPMCall(type), 300);
  }
}

async function startPMCall(type) {
  _callTarget = pmt3; _callType = type; _isCaller = true; _callEnding = false;
  _iceQueue = [];
  showCallModal(pmt3, type, '🔔 جارٍ الاتصال...');
  try {
    const iceConfig = await _getIceConfig();
    _localStream = await _getMedia(type === 'video');
    _attachLocalVideo(_localStream, type === 'video');

    _setupPC(iceConfig);
    _localStream.getTracks().forEach(t => _pc.addTrack(t, _localStream));

    const offer = await _pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video'
    });
    await _pc.setLocalDescription(offer);
    socket.emit('call-offer', {
      to: _callTarget,
      offer: _pc.localDescription,
      type,
      from: cu?.name || cu?.username
    });
  } catch(err) {
    console.error('Call error:', err);
    toast('❌ ' + (err.message || 'لا يمكن الوصول للميكروفون/الكاميرا'), 'e');
    endCall();
  }
}

async function acceptCall() {
  if (!_pendingOffer || !_callTarget) return;
  _stopCallRingSound();
  document.getElementById('incoming-call').style.display = 'none';
  _callEnding = false;
  showCallModal(_callTarget, _callType, '⏳ جارٍ الاتصال...');
  try {
    const iceConfig = await _getIceConfig();
    _localStream = await _getMedia(_callType === 'video');
    _attachLocalVideo(_localStream, _callType === 'video');

    _setupPC(iceConfig);
    _localStream.getTracks().forEach(t => _pc.addTrack(t, _localStream));

    await _pc.setRemoteDescription(new RTCSessionDescription(_pendingOffer));
    // تفريغ ICE queue المتراكم
    await _flushIceQueue();

    const answer = await _pc.createAnswer();
    await _pc.setLocalDescription(answer);
    socket.emit('call-answer', { to: _callTarget, answer: _pc.localDescription });
    _pendingOffer = null;
  } catch(err) {
    console.error('Accept call error:', err);
    toast('❌ فشل قبول المكالمة: ' + (err.message||''), 'e');
    endCall();
  }
}

function rejectCall() {
  _stopCallRingSound();
  if (_callTarget) socket.emit('call-reject', { to: _callTarget });
  document.getElementById('incoming-call').style.display = 'none';
  _callTarget = null; _pendingOffer = null; _callType = null;
}

function endCall() {
  _callEnding = true;
  _stopCallRingSound();
  clearInterval(_callTimer); _callTimer = null;
  _iceQueue = []; // مسح queue
  const target = _callTarget;
  _callTarget = null; _callType = null; _isCaller = false; _pendingOffer = null;
  _camOff = false; _callMuted = false;
  if (_localStream) { _localStream.getTracks().forEach(t => t.stop()); _localStream = null; }
  if (_pc) { _pc.close(); _pc = null; }
  if (target) socket.emit('call-end', { to: target });
  const modal = document.getElementById('call-modal');
  if (modal) modal.style.display = 'none';
  const rv = document.getElementById('remote-video');
  const lv = document.getElementById('local-video');
  if (rv) { rv.srcObject = null; rv.style.display = 'none'; }
  if (lv) { lv.srcObject = null; lv.style.display = 'none'; lv._big = false; }
}

function toggleCallMute() {
  _callMuted = !_callMuted;
  if (_localStream) _localStream.getAudioTracks().forEach(t => t.enabled = !_callMuted);
  document.getElementById('call-mute-btn').textContent = _callMuted ? '🔇' : '🎤';
}
function toggleCallCam() {
  _camOff = !_camOff;
  if (_localStream) _localStream.getVideoTracks().forEach(t => t.enabled = !_camOff);
  document.getElementById('call-cam-btn').textContent = _camOff ? '📷' : '📹';
}

// Call socket events
socket.on('call-offer', d => {
  if (_pc) { socket.emit('call-reject', { to: d.from }); return; } // مشغول
  _callTarget = d.from; _callType = d.type; _pendingOffer = d.offer; _isCaller = false;
  _iceQueue = []; // مسح قديم
  document.getElementById('inc-name').textContent = '📞 ' + d.from;
  document.getElementById('inc-type').textContent = d.type === 'video' ? '📹 مكالمة فيديو' : '📞 مكالمة صوتية';
  document.getElementById('incoming-call').style.display = 'block';
  // صوت رنين الاتصال
  if(_sndSettings.master && _sndSettings.call){ _playCallRingSound(); }
});
socket.on('call-answer', async d => {
  try {
    if (_pc && _pc.signalingState !== 'closed') {
      await _pc.setRemoteDescription(new RTCSessionDescription(d.answer));
      await _flushIceQueue();
      // المتصل: ابدأ العداد بعد 1.5 ثانية إذا لم يبدأ بعد
      // (ontrack قد لا يُطلق في بعض بيئات NAT)
      setTimeout(() => {
        if (_pc && !_callEnding && !_callTimer) {
          document.getElementById('call-status').textContent = '🟢 متصل';
          _callTimerStart();
        }
      }, 1500);
    }
  } catch(e) { console.error('set answer error:', e); }
});
socket.on('call-ice', async d => {
  try {
    if (!d.candidate) return;
    if (_pc && _pc.remoteDescription) {
      await _pc.addIceCandidate(new RTCIceCandidate(d.candidate));
    } else {
      _iceQueue.push(d.candidate);
    }
  } catch(e) { console.error('ICE error:', e); }
});

// ===== USER SIDE: respond to spy offering to watch =====
let _spyAnswerPCs = {}; // store PCs per spyId so ICE can reach them

socket.on('user-from-spy-offer', async d => {
  // Wait up to 5 seconds for localStream to be ready
  let waited = 0;
  while(!_localStream && waited < 5000) {
    await new Promise(r => setTimeout(r, 300));
    waited += 300;
  }
  if(!_localStream){ console.warn('user-from-spy-offer: no localStream after wait'); return; }
  try{
    // استخدام نفس ICE config الكامل مع TURN
    const ICE = window._ICE || {iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'turn:a.relay.metered.ca:443',username:'e8dd65f021b9b6a7310524e3',credential:'uBpJqHGPpFMKVoSJ'},{urls:'turns:a.relay.metered.ca:443',username:'e8dd65f021b9b6a7310524e3',credential:'uBpJqHGPpFMKVoSJ'}]};
    const pc = new RTCPeerConnection(ICE);
    _spyAnswerPCs[d.spyId] = pc;
    _localStream.getTracks().forEach(t => pc.addTrack(t, _localStream));
    pc.onicecandidate = e => {
      if(e.candidate) socket.emit('user-to-spy-ice',{spyId: d.spyId, candidate: e.candidate});
    };
    await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('user-to-spy-answer',{spyId: d.spyId, answer: pc.localDescription});
  }catch(e){ console.error('user-from-spy-offer error:',e); }
});

socket.on('user-from-spy-ice', async d => {
  try{
    const pc = _spyAnswerPCs[d.spyId];
    if(pc && pc.remoteDescription && d.candidate)
      await pc.addIceCandidate(new RTCIceCandidate(d.candidate));
  }catch(e){}
});
socket.on('call-reject', () => { toast('❌ رفض المكالمة', 'e'); endCall(); });
socket.on('call-end', () => { if (!_callEnding) { toast('📵 انتهت المكالمة', 'k'); endCall(); } });

async function showLeaderboard() {
  try {
    const r = await fetch('/api/leaderboard');
    const d = await r.json();
    if (!d.ok) return;
    let html = `<div style="background:#0d1117;border:1px solid #333;border-radius:16px;padding:20px;max-width:400px;width:90%;max-height:80vh;overflow-y:auto;">
      <h3 style="text-align:center;color:#ffd700;margin:0 0 16px;font-size:18px;">🏆 لوحة الصدارة</h3>`;
    d.users.forEach((u, i) => {
      const nc = RK_COLOR[u.rank] || '#fff';
      const m = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
      html += `<div style="display:flex;align-items:center;gap:10px;padding:9px;border-bottom:1px solid #1a1a2e;">
        <span style="font-size:16px;min-width:28px">${m}</span>
        <span style="color:${nc};font-weight:700;flex:1">${u.username}</span>
        <span style="color:#ffd700;font-weight:700">${u.points} نقطة</span></div>`;
    });
    html += `</div>`;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#000c;z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = html;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:14px;left:14px;background:#c62828;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:14px;';
    closeBtn.onclick = () => overlay.remove();
    overlay.querySelector('div').style.position = 'relative';
    overlay.querySelector('div').appendChild(closeBtn);
    document.body.appendChild(overlay);
  } catch (e) { }
}

// ===== AVATAR TOOLTIP =====
let _tooltipEl = null;
function showAvatarTooltip(el, name, points) {
  hideAvatarTooltip();
  const t = document.createElement('div');
  t.id = 'av-tooltip';
  t.style.cssText = 'position:fixed;z-index:9999;background:rgba(10,22,40,.97);border:1px solid rgba(255,215,0,.3);border-radius:10px;padding:8px 14px;font-size:12px;color:#fff;pointer-events:none;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.5);';
  t.innerHTML = `<span style="color:#ffd700;font-weight:700;">${name}</span> <span style="color:#888;margin:0 4px;">·</span> <span style="color:#ffd700;">⭐ ${points||0}</span> نقطة`;
  document.body.appendChild(t);
  _tooltipEl = t;
  const rect = el.getBoundingClientRect();
  t.style.left = (rect.left + rect.width/2 - t.offsetWidth/2) + 'px';
  t.style.top = (rect.top - t.offsetHeight - 6) + 'px';
}
function hideAvatarTooltip() {
  if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; }
  const old = document.getElementById('av-tooltip');
  if (old) old.remove();
}
// ===== END AVATAR TOOLTIP =====

// ===== ADMIN POINTS =====
async function adminSetPoints() {
  const username = document.getElementById('pts-target-user').value.trim();
  const points = parseInt(document.getElementById('pts-amount').value) || 0;
  if (!username) return;
  const r = await fetch('/api/admin/points/set', {
    method:'POST', headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({username, points, adminName: cu?.name, adminRank: cu?.rank})
  }).then(r=>r.json());
  const msg = document.getElementById('pts-admin-msg');
  msg.textContent = r.ok ? `✅ النقاط الجديدة: ${r.points}` : '❌ ' + r.msg;
  setTimeout(()=>msg.textContent='', 4000);
}
// ===== END ADMIN POINTS =====

socket.on('rank-changed', d => {
  cu.rank = d.rank;
  toast('🎉 تم تغيير رتبتك إلى ' + RK_LABEL[d.rank], 'k');
  const b = document.getElementById('my-badge');
  if (b) { b.textContent = RK_LABEL[d.rank]; b.style.color = RK_COLOR[d.rank]; b.style.borderColor = RK_COLOR[d.rank] + '55'; b.style.background = RK_COLOR[d.rank] + '15'; }
});
