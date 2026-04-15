// ===== PROFILE SYSTEM =====
// ===== PROFILE SYSTEM - LUXURY DESIGN =====
let _profMusicPlaying = false;
let _profMusicUrl = '';
let _profMusicYT = null;

function openProfile(username) {
  if (!username) return;
  _playClickSound();
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  window._profUser = username;

  _stopProfMusic();

  // Reset
  const avImg = document.getElementById('prof-avatar-img');
  const initEl = document.getElementById('prof-initials');
  if (avImg)   { avImg.style.display = 'none'; avImg.src = ''; }
  if (initEl)  { initEl.style.display = 'flex'; }
  document.getElementById('prof-edit').style.display    = 'none';
  document.getElementById('prof-actions').innerHTML     = '';
  document.getElementById('prof-music-bar').style.display = 'none';
  document.getElementById('prof-points').textContent    = '0';
  document.getElementById('prof-bio').textContent       = '';
  document.getElementById('prof-badges-section').style.display = 'none';
  document.getElementById('prof-badges-row').innerHTML  = '';
  const likeBtn = document.getElementById('prof-like-btn');
  if (likeBtn) likeBtn.style.display = 'none';
  document.getElementById('prof-like-count').textContent = '0';
  const wm = document.getElementById('prof-cover-watermark');
  if (wm) wm.style.display = 'none';
  const ib = document.getElementById('prof-inner-box');
  if (ib) ib.style.backgroundImage = '';

  fetch('/api/profile/' + encodeURIComponent(username))
    .then(r => r.json())
    .then(d => {
      if (!d.ok) { toast('❌ لم يتم العثور على الملف','e'); closeProfile(); return; }
      const p   = d.profile;
      const nc  = RK_COLOR[p.rank]  || '#b0bec5';
      const rkl = RK_LABEL[p.rank]  || '👁️ زائر';
      const glow= RK_GLOW[p.rank]   ? `text-shadow:${RK_GLOW[p.rank]};` : '';
      const col = AVC[(p.username||'?').charCodeAt(0) % AVC.length];
      const myName = cu?.username || cu?.name;
      const isOwn  = p.username === myName;

      // ===== COVER =====
      const coverEl  = document.getElementById('prof-cover');
      const coverImg = document.getElementById('prof-cover-img');
      const coverDef = document.getElementById('prof-cover-default');
      const coverWm  = document.getElementById('prof-cover-watermark');
      const modeBtn  = document.getElementById('cover-mode-toggle');
      const upBtn    = document.getElementById('prof-cover-upload-btn');
      const profIb   = document.getElementById('prof-inner-box');
      const mode     = localStorage.getItem('cmode_' + p.username) || 'box';

      if (upBtn) upBtn.style.display = isOwn ? 'block' : 'none';

      if (p.cover) {
        if (modeBtn) { modeBtn.style.display = isOwn ? 'block' : 'none'; modeBtn.textContent = mode === 'watermark' ? '🌊 علامة مائية' : '🖼️ صندوق'; }
        if (mode === 'watermark') {
          coverEl.style.background = `linear-gradient(160deg,${nc}44,#0d1117 70%)`;
          if (coverImg) coverImg.style.display = 'none';
          if (coverWm)  { coverWm.src = p.cover; coverWm.style.display = 'block'; }
          if (coverDef) coverDef.style.display = 'none';
          if (profIb)   profIb.style.backgroundImage = '';
          // صورة الغلاف الممتدة خلف كل المحتوى
          let bgCover = document.getElementById('prof-bg-cover');
          if (!bgCover) {
            bgCover = document.createElement('img');
            bgCover.id = 'prof-bg-cover';
            bgCover.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;opacity:0.13;pointer-events:none;z-index:0;filter:blur(2px);display:block;';
            profIb.insertBefore(bgCover, profIb.firstChild);
          }
          bgCover.src = p.cover;
          bgCover.style.display = 'block';
        } else {
          coverEl.style.background = '#000';
          if (coverImg) { coverImg.src = p.cover; coverImg.style.display = 'block'; }
          if (coverWm)  coverWm.style.display = 'none';
          if (coverDef) coverDef.style.display = 'none';
          if (profIb)   profIb.style.backgroundImage = '';
          const bgCover = document.getElementById('prof-bg-cover');
          if (bgCover) bgCover.style.display = 'none';
        }
      } else {
        coverEl.style.background = `linear-gradient(160deg,${nc}55 0%,#0d1117 60%,${nc}11 100%)`;
        if (coverImg) coverImg.style.display = 'none';
        if (coverWm)  coverWm.style.display  = 'none';
        if (coverDef) coverDef.style.display = 'flex';
        if (modeBtn)  modeBtn.style.display  = 'none';
        if (profIb)   profIb.style.backgroundImage = '';
        const bgCover = document.getElementById('prof-bg-cover');
        if (bgCover) bgCover.style.display = 'none';
      }
      window._profCover = p.cover || null;
      window._profCoverNc = nc;

      // ===== RINGS =====
      document.getElementById('prof-ring1').style.borderColor  = nc;
      document.getElementById('prof-ring1').style.boxShadow    = `0 0 12px ${nc}66`;
      document.getElementById('prof-ring2').style.borderColor  = nc + '55';

      // ===== AVATAR — إصلاح عدم الظهور =====
      const avInner  = document.getElementById('prof-av-inner');
      const avImgEl  = document.getElementById('prof-avatar-img');
      const initials = document.getElementById('prof-initials');

      initials.textContent   = (p.username||'?').charAt(0).toUpperCase();
      initials.style.background = `linear-gradient(135deg,${col},${col}88)`;
      avInner.style.borderColor = '#fff';
      avInner.style.boxShadow   = '0 4px 20px rgba(0,0,0,.6)';

      // تطبيق شكل الصورة من قاعدة البيانات
      const shape = p.avatar_shape || 'circle';
      avInner.style.borderRadius = shape === 'square' ? '16px' : '50%';
      // تحديث أزرار الشكل إذا كان الملف لصاحبه
      if (isOwn) _refreshShapeBtns(shape);

      if (p.avatar && p.avatar.length > 50) {
        // أظهر الصورة فوراً — لا تنتظر onload
        avImgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        avImgEl.src = p.avatar;
        initials.style.display = 'none';
        avImgEl.onerror = () => { avImgEl.style.display='none'; initials.style.display='flex'; };
      } else {
        avImgEl.style.display = 'none';
        initials.style.display = 'flex';
      }

      // Edit pencil
      document.getElementById('prof-edit-av').style.display = isOwn ? 'flex' : 'none';

      // ===== NAME & RANK =====
      document.getElementById('prof-name').textContent = p.username;
      document.getElementById('prof-name').style.cssText = `font-size:19px;font-weight:800;color:${nc};${glow}margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
      const badge = document.getElementById('prof-badge');
      badge.textContent = rkl;
      badge.style.cssText = `font-size:11px;padding:2px 10px;border-radius:20px;display:inline-block;background:${nc}22;color:${nc};border:1px solid ${nc}55;margin-bottom:4px;`;

      // Bio
      document.getElementById('prof-bio').textContent = p.bio || '';

      // Badges
      if (p.badges && p.badges.length > 0) {
        document.getElementById('prof-badges-section').style.display = 'block';
        const row = document.getElementById('prof-badges-row'); row.innerHTML = '';
        p.badges.forEach(b => {
          const s = document.createElement('span');
          s.title = b.name;
          s.style.cssText = `display:inline-flex;align-items:center;gap:4px;background:${b.color||'#ffd700'}18;border:1px solid ${b.color||'#ffd700'}44;border-radius:20px;padding:4px 10px;font-size:12px;`;
          s.innerHTML = `<span>${b.emoji}</span><span style="color:${b.color||'#ffd700'};font-weight:600;">${b.name}</span>`;
          row.appendChild(s);
        });
      }

      // Stats
      document.getElementById('prof-points').textContent   = (p.points||0).toLocaleString();
      document.getElementById('prof-gender-val').textContent = p.gender||'—';
      document.getElementById('prof-age-val').textContent   = p.age||'—';

      // Music
      if (p.music_url) {
        _profMusicUrl = p.music_url;
        document.getElementById('prof-music-bar').style.display = 'flex';
        document.getElementById('prof-music-title').textContent = p.music_name||'🎵 موسيقى';
        _playProfMusic();
      }

      // ===== LIKE BUTTON =====
      if (!isOwn) {
        const lb = document.getElementById('prof-like-btn');
        const lc = document.getElementById('prof-like-count');
        const likeCount = parseInt(localStorage.getItem('plikes_'+p.username)||'0');
        if (lb) {
          lb.style.display = 'flex';
          if (lc) lc.textContent = likeCount;
          const liked = localStorage.getItem('liked_'+myName+'_'+p.username)==='1';
          lb.style.background   = liked ? 'rgba(255,80,80,.3)' : 'rgba(255,80,80,.12)';
          lb.style.borderColor  = liked ? 'rgba(255,80,80,.6)' : 'rgba(255,80,80,.3)';
        }
      }

      // ===== ACTIONS =====
      const acts = document.getElementById('prof-actions');
      if (!isOwn) {
        acts.innerHTML = `<button class="prof-act-btn" onclick="closeProfile();openPM('${p.username}')" style="background:linear-gradient(135deg,#1565c0,#1976d2);color:#fff;">💌 رسالة خاصة</button>`;
        acts.innerHTML += `<button class="prof-act-btn" onclick="typeof sendFriendRequest==='function'&&sendFriendRequest('${p.username}');closeProfile();" style="background:linear-gradient(135deg,#1a237e,#283593);color:#fff;">🤝 صديق</button>`;
        acts.innerHTML += `<button class="prof-act-btn" onclick="typeof openReportModal==='function'&&openReportModal('${p.username}');closeProfile();" style="background:rgba(255,183,77,.15);border:1px solid rgba(255,183,77,.3);color:#ffb74d;">🚨 إبلاغ</button>`;
        if (hasPerm('can_mute'))  acts.innerHTML += `<button class="prof-act-btn" onclick="socket.emit('admin-mute',{username:'${p.username}'});toast('🔇 تم الكتم','k');closeProfile();" style="background:linear-gradient(135deg,#e65100,#f57c00);color:#fff;">🔇 كتم</button>`;
        if (hasPerm('can_mute'))  acts.innerHTML += `<button class="prof-act-btn" onclick="socket.emit('admin-unmute',{username:'${p.username}'});toast('🔊 فك الكتم','k');closeProfile();" style="background:linear-gradient(135deg,#1b5e20,#2e7d32);color:#fff;">🔊 فك الكتم</button>`;
        if (hasPerm('can_kick'))  acts.innerHTML += `<button class="prof-act-btn" onclick="if(confirm('طرد؟')){socket.emit('admin-kick',{username:'${p.username}'});closeProfile();}" style="background:linear-gradient(135deg,#c62828,#e53935);color:#fff;">🚪 طرد</button>`;
        if (hasPerm('can_ban'))   acts.innerHTML += `<button class="prof-act-btn" onclick="socket.emit('admin-ban',{username:'${p.username}'});toast('⛔ تم الحظر','k');closeProfile();" style="background:linear-gradient(135deg,#880000,#b71c1c);color:#fff;">⛔ حظر</button>`;
        if (hasPerm('can_unban')) acts.innerHTML += `<button class="prof-act-btn" onclick="socket.emit('admin-unban',{username:'${p.username}'});toast('✅ فك الحظر','k');closeProfile();" style="background:linear-gradient(135deg,#1b5e20,#2e7d32);color:#fff;">✅ فك الحظر</button>`;
        if (hasPerm('can_change_rank')) {
          const RO = ['ghost','owner','owner_admin','owner_vip','super_admin','admin','premium','vip','gold','member','visitor'];
          const mi = RO.indexOf(cu?.rank||'visitor'), ti = RO.indexOf(p.rank||'visitor');
          if (mi < ti) {
            if (RO[ti-1] && RO.indexOf(RO[ti-1])>mi) acts.innerHTML += `<button class="prof-act-btn" onclick="profSetRank('${p.username}','${RO[ti-1]}')" style="background:linear-gradient(135deg,#f57f17,#ff8f00);color:#fff;">⭐ ترقية → ${RK_LABEL[RO[ti-1]]||RO[ti-1]}</button>`;
            if (RO[ti+1] && RO.indexOf(RO[ti+1])>mi) acts.innerHTML += `<button class="prof-act-btn" onclick="profSetRank('${p.username}','${RO[ti+1]}')" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);color:#aaa;">⬇️ تخفيض → ${RK_LABEL[RO[ti+1]]||RO[ti+1]}</button>`;
          }
        }
      } else {
        document.getElementById('prof-edit').style.display = 'block';
        const ns = document.getElementById('prof-name-section');
        if (ns) ns.style.display = hasPerm('can_change_username') ? 'block' : 'none';
        document.getElementById('prof-bio-in').value     = p.bio||'';
        document.getElementById('prof-music-in').value   = p.music_url||'';
        document.getElementById('prof-mname-in').value   = p.music_name||'';
        const ageEl = document.getElementById('prof-age-in');
        const genEl = document.getElementById('prof-gender-in');
        if (ageEl) ageEl.value = cu?.age||p.age||'';
        if (genEl) genEl.value = cu?.gender||p.gender||'ذكر';
        // تحديث أزرار الشكل
        _refreshShapeBtns(shape);
        const nsss = document.getElementById('name-style-section');
        if (nsss) {
          const ok = hasPerm('can_custom_text_color')||hasPerm('can_use_name_frame');
          nsss.style.display = ok ? 'block' : 'none';
          if (ok) {
            if (cu?.nameColor    && document.getElementById('ns-color')) document.getElementById('ns-color').value = cu.nameColor;
            if (cu?.nameFontSize && document.getElementById('ns-size'))  document.getElementById('ns-size').value  = cu.nameFontSize;
            if (cu?.nameFontFamily && document.getElementById('ns-font')) document.getElementById('ns-font').value = cu.nameFontFamily;
          }
        }
        if (cu?.rank !== 'visitor') acts.innerHTML = `<button class="prof-act-btn" onclick="closeProfile();openChangePass();" style="background:linear-gradient(135deg,#1a237e,#283593);color:#fff;">🔐 تغيير كلمة المرور</button>`;
      }
    }).catch(err => { console.error('Profile error:',err); toast('❌ خطأ في تحميل الملف','e'); closeProfile(); });
}

// ===== Helper: شكل الصورة =====
function _refreshShapeBtns(shape) {
  const cb = document.getElementById('shape-circle-btn');
  const sb = document.getElementById('shape-square-btn');
  if (!cb || !sb) return;
  const on  = 'padding:10px;border-radius:10px;border:2px solid rgba(255,215,0,.6);background:rgba(255,215,0,.12);color:#ffd166;font-family:Cairo,sans-serif;font-size:13px;cursor:pointer;font-weight:700;';
  const off = 'padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:#aaa;font-family:Cairo,sans-serif;font-size:13px;cursor:pointer;';
  cb.style.cssText = shape==='circle' ? on : off;
  sb.style.cssText = shape==='square' ? on : off;
}

function setAvatarShape(shape) {
  if (!window._profUser) return;
  const username = cu?.username || cu?.name;
  // فقط صاحب الملف يستطيع التغيير
  if (window._profUser !== username) return;

  // تطبيق فوري على الواجهة
  const av = document.getElementById('prof-av-inner');
  if (av) av.style.borderRadius = shape === 'square' ? '16px' : '50%';
  _refreshShapeBtns(shape);

  // حفظ في قاعدة البيانات
  fetch('/api/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, avatar_shape: shape })
  }).then(r => r.json()).then(d => {
    if (d.ok) {
      toast(shape === 'circle' ? '⭕ تم حفظ الشكل الدائري' : '🟦 تم حفظ الشكل المربع', 'k');
      // تحديث الـ cache العام في chat.js
      if (typeof _shapeCache !== 'undefined') _shapeCache[username] = shape;
      // تحديث كائن المستخدم الحالي
      if (cu) cu.avatar_shape = shape;
      // تطبيق فوري على كل صور الأفاتار في الصفحة (الشات + قائمة المتصلين)
      const radius = shape === 'square' ? '8px' : '50%';
      document.querySelectorAll('.uav-img[data-owner="' + username + '"]').forEach(el => {
        el.style.borderRadius = radius;
      });
    } else {
      toast('❌ فشل الحفظ', 'e');
    }
  }).catch(() => toast('❌ خطأ في الاتصال', 'e'));
}

function toggleCoverMode() {
  if (!window._profUser) return;
  const key  = 'cmode_' + window._profUser;
  const cur  = localStorage.getItem(key) || 'box';
  const next = cur==='box' ? 'watermark' : 'box';
  localStorage.setItem(key, next);
  const nc     = window._profCoverNc || '#ffd700';
  const cover  = window._profCover;
  const ib     = document.getElementById('prof-inner-box');
  const ci     = document.getElementById('prof-cover-img');
  const wm     = document.getElementById('prof-cover-watermark');
  const ce     = document.getElementById('prof-cover');
  const mt     = document.getElementById('cover-mode-toggle');
  if (next==='watermark') {
    ce.style.background = `linear-gradient(160deg,${nc}44,#0d1117 70%)`;
    if (ci) ci.style.display = 'none';
    if (wm && cover) { wm.src=cover; wm.style.display='block'; }
    if (ib) ib.style.backgroundImage = '';
    if (ib && cover) {
      let bgCover = document.getElementById('prof-bg-cover');
      if (!bgCover) {
        bgCover = document.createElement('img');
        bgCover.id = 'prof-bg-cover';
        bgCover.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;opacity:0.13;pointer-events:none;z-index:0;filter:blur(2px);display:block;';
        ib.insertBefore(bgCover, ib.firstChild);
      }
      bgCover.src = cover;
      bgCover.style.display = 'block';
    }
    if (mt) mt.textContent = '🌊 علامة مائية';
    toast('🌊 وضع العلامة المائية','k');
  } else {
    ce.style.background = '#000';
    if (wm) wm.style.display='none';
    if (ib) ib.style.backgroundImage='';
    const bgCover = document.getElementById('prof-bg-cover');
    if (bgCover) bgCover.style.display = 'none';
    if (ci && cover) { ci.src=cover; ci.style.display='block'; }
    if (mt) mt.textContent = '🖼️ صندوق';
    toast('🖼️ وضع الصندوق','k');
  }
}

function openProfLightbox(type) {
  let src = '';
  if (type==='avatar') {
    const img = document.getElementById('prof-avatar-img');
    if (!img || img.style.display==='none' || !img.src || img.src.endsWith('/')) return;
    src = img.src;
  } else {
    const img = document.getElementById('prof-cover-img');
    if (!img || img.style.display==='none' || !img.src || img.src.endsWith('/')) return;
    src = img.src;
  }
  if (!src) return;
  const lb = document.getElementById('prof-lightbox');
  const li = document.getElementById('prof-lightbox-img');
  if (lb && li) { li.src=src; lb.style.display='flex'; }
}

function closeProfLightbox() {
  const lb = document.getElementById('prof-lightbox');
  if (lb) lb.style.display='none';
}

function toggleProfileLike() {
  const myName = cu?.username||cu?.name;
  if (!myName || !window._profUser || myName===window._profUser) return;
  const lk = 'plikes_'+window._profUser, mk = 'liked_'+myName+'_'+window._profUser;
  let cnt = parseInt(localStorage.getItem(lk)||'0');
  const had = localStorage.getItem(mk)==='1';
  if (had) { cnt=Math.max(0,cnt-1); localStorage.removeItem(mk); }
  else      { cnt++; localStorage.setItem(mk,'1'); }
  localStorage.setItem(lk,String(cnt));
  document.getElementById('prof-like-count').textContent = cnt;
  const lb = document.getElementById('prof-like-btn');
  if (lb) { lb.style.background=!had?'rgba(255,80,80,.3)':'rgba(255,80,80,.12)'; lb.style.borderColor=!had?'rgba(255,80,80,.6)':'rgba(255,80,80,.3)'; lb.style.transform='scale(1.1)'; setTimeout(()=>{lb.style.transform='scale(1)';},200); }
  toast(!had?'❤️ تم الإعجاب!':'💔 تم إلغاء الإعجاب','k');
}

async function profSetRank(username, rank) {
  if (!confirm('تغيير رتبة '+username+' إلى '+(RK_LABEL[rank]||rank)+'؟')) return;
  try {
    const r = await fetch('/api/admin/setrank',{method:'POST',headers:{'Content-Type':'application/json','x-admin-token':AK},body:JSON.stringify({username,rank,adminName:cu?.name,adminRank:cu?.rank})});
    const d = await r.json();
    if (d.ok) { toast('✅ تم تغيير الرتبة','k'); closeProfile(); } else toast('❌ '+(d.msg||'خطأ'),'e');
  } catch(e){ toast('❌ خطأ في الاتصال','e'); }
}

function closeProfile() {
  const m = document.getElementById('profile-modal');
  if (m) m.style.display = 'none';
  _stopProfMusic();
}

function _getYouTubeId(url) {
  if (!url) return null;
  // يوتيوب: watch?v=, youtu.be/, embed/
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function _playProfMusic() {
  if (!_profMusicUrl) return;
  const ytId = _getYouTubeId(_profMusicUrl);
  if (ytId) {
    _playYoutube(ytId);
  } else {
    // رابط مباشر mp3/soundcloud
    const audio = document.getElementById('profile-audio');
    audio.src = _profMusicUrl;
    audio.play().then(() => {
      _profMusicPlaying = true;
      document.getElementById('prof-disc').classList.add('spinning');
      document.getElementById('prof-play-icon').textContent = '⏸';
      document.getElementById('prof-music-sub').textContent = '▶ يشغل الآن';
    }).catch(() => {
      document.getElementById('prof-music-sub').textContent = 'اضغط ▶ للتشغيل';
    });
  }
}

function _playYoutube(ytId) {
  // إنشاء أو تحديث iframe يوتيوب مخفي
  let frame = document.getElementById('yt-music-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'yt-music-frame';
    frame.style.cssText = 'display:none;width:0;height:0;position:absolute;';
    frame.allow = 'autoplay';
    document.body.appendChild(frame);
  }
  frame.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1`;
  _profMusicPlaying = true;
  _profMusicYT = ytId;
  document.getElementById('prof-disc').classList.add('spinning');
  document.getElementById('prof-play-icon').textContent = '⏸';
  document.getElementById('prof-music-sub').textContent = '▶ يشغل الآن';
}

function _stopYoutube() {
  const frame = document.getElementById('yt-music-frame');
  if (frame) { frame.src = ''; frame.remove(); }
  _profMusicYT = null;
}

function _stopProfMusic() {
  // وقف audio العادي
  const audio = document.getElementById('profile-audio');
  audio.pause();
  audio.src = '';
  // وقف يوتيوب
  _stopYoutube();
  _profMusicPlaying = false;
  _profMusicUrl = '';
  const disc = document.getElementById('prof-disc');
  if (disc) disc.classList.remove('spinning');
  const pi = document.getElementById('prof-play-icon');
  if (pi) pi.textContent = '▶';
  const sub = document.getElementById('prof-music-sub');
  if (sub) sub.textContent = 'يشغل تلقائياً';
}

function toggleProfMusic() {
  const ytId = _getYouTubeId(_profMusicUrl);
  if (_profMusicPlaying) {
    // إيقاف
    if (ytId) {
      _stopYoutube();
    } else {
      const audio = document.getElementById('profile-audio');
      audio.pause();
    }
    _profMusicPlaying = false;
    document.getElementById('prof-disc').classList.remove('spinning');
    document.getElementById('prof-play-icon').textContent = '▶';
    document.getElementById('prof-music-sub').textContent = 'متوقف — اضغط للتشغيل';
  } else {
    // تشغيل
    if (ytId) {
      _playYoutube(ytId);
    } else {
      const audio = document.getElementById('profile-audio');
      audio.play().then(() => {
        _profMusicPlaying = true;
        document.getElementById('prof-disc').classList.add('spinning');
        document.getElementById('prof-play-icon').textContent = '⏸';
        document.getElementById('prof-music-sub').textContent = '▶ يشغل الآن';
      });
    }
  }
}

function profAvatarClick() {
  const name = document.getElementById('prof-name').textContent;
  const myName = cu?.username || cu?.name;
  if (name === myName) document.getElementById('prof-avatar-file').click();
}

function handleAvatarUpload(e) {
  const f = e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const data = ev.target.result;
    if (f.type === 'image/gif') {
      if (f.size > 3 * 1024 * 1024) { toast('❌ حجم GIF كبير جداً (الحد 3MB)', 'e'); return; }
      window._pendingAvatar = data;
      document.getElementById('prof-avatar-img').src = data;
      document.getElementById('prof-avatar-img').style.display = 'block';
      document.getElementById('prof-initials').style.display = 'none';
      toast('✅ تم اختيار GIF المتحركة، اضغط حفظ', 'k');
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // نقطع ونضغط بأبعاد 200x200
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      // ضغط تدريجي حتى يصبح الحجم مقبولاً
      let quality = 0.85;
      let compressed = canvas.toDataURL('image/jpeg', quality);
      while (compressed.length > 3 * 1024 * 1024 && quality > 0.3) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }
      window._pendingAvatar = compressed;
      document.getElementById('prof-avatar-img').src = compressed;
      document.getElementById('prof-avatar-img').style.display = 'block';
      document.getElementById('prof-initials').style.display = 'none';
      toast('✅ تم اختيار الصورة، اضغط حفظ', 'k');
    };
    img.src = data;
  };
  reader.readAsDataURL(f);
}

// رفع صورة الغلاف - مع ضغط وتغيير حجم تلقائي
function handleCoverUpload(e) {
  const f = e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const data = ev.target.result;
    // GIF: ضغط مباشر بدون تغيير حجم
    if (f.type === 'image/gif') {
      if (f.size > 3 * 1024 * 1024) { toast('❌ حجم GIF كبير جداً (الحد 3MB)', 'e'); return; }
      window._pendingCover = data;
      const img = document.getElementById('prof-cover-img');
      const def = document.getElementById('prof-cover-default');
      if (img) { img.src = data; img.style.display = 'block'; }
      if (def) def.style.display = 'none';
      toast('✅ تم اختيار GIF الغلاف، اضغط حفظ', 'k');
      return;
    }
    // صور عادية: ضغط وتغيير حجم تلقائي
    const imgEl = new Image();
    imgEl.onload = () => {
      const canvas = document.createElement('canvas');
      // أقصى أبعاد لصورة الغلاف: 900×300
      const MAX_W = 900, MAX_H = 300;
      let w = imgEl.width, h = imgEl.height;
      // حساب النسبة للحفاظ على التناسب مع الحد الأقصى
      const ratio = Math.min(MAX_W / w, MAX_H / h, 1);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      // ضغط تدريجي حتى يصبح الحجم مقبولاً
      let quality = 0.85;
      let compressed = canvas.toDataURL('image/jpeg', quality);
      while (compressed.length > 3 * 1024 * 1024 && quality > 0.3) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }
      window._pendingCover = compressed;
      const imgDom = document.getElementById('prof-cover-img');
      const def = document.getElementById('prof-cover-default');
      if (imgDom) { imgDom.src = compressed; imgDom.style.display = 'block'; }
      if (def) def.style.display = 'none';
      toast('✅ تم اختيار صورة الغلاف، اضغط حفظ', 'k');
    };
    imgEl.src = data;
  };
  reader.readAsDataURL(f);
}

function saveProfile() {
  const bio = document.getElementById('prof-bio-in').value.trim();
  const music_url = document.getElementById('prof-music-in').value.trim();
  const music_name = document.getElementById('prof-mname-in').value.trim();
  const avatar = window._pendingAvatar || null;
  const cover = window._pendingCover || null;
  const username = cu?.username || cu?.name;
  const newAge = parseInt(document.getElementById('prof-age-in')?.value) || cu?.age;
  const newGender = document.getElementById('prof-gender-in')?.value || cu?.gender;
  if (!username) { toast('❌ يجب تسجيل الدخول أولاً', 'e'); return; }
  fetch('/api/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, bio, music_url, music_name, avatar, cover, age: newAge, gender: newGender })
  }).then(r => r.json()).then(d => {
    if (d.ok) {
      if (cu) { cu.age = newAge; cu.gender = newGender; }
      const saved = localStorage.getItem('ghazal_user');
      if (saved) { const u=JSON.parse(saved); u.age=newAge; u.gender=newGender; localStorage.setItem('ghazal_user',JSON.stringify(u)); }
      socket.emit('update-profile-info', { age: newAge, gender: newGender });
      toast('✅ تم حفظ الملف الشخصي', 'k');
      window._pendingAvatar = null;
      window._pendingCover = null;
      closeProfile();
    } else toast('❌ ' + d.msg, 'e');
  }).catch(() => toast('❌ خطأ في الحفظ', 'e'));
}

async function changeUsername() {
  if (!hasPerm('can_change_username')) { toast('⛔ لا تملك صلاحية تغيير الاسم', 'e'); return; }
  const inp = document.getElementById('prof-newname-in');
  const msg = document.getElementById('prof-name-msg');
  const newName = inp?.value.trim();
  if (!newName) { msg.style.color='#f87171'; msg.textContent='❌ أدخل الاسم الجديد'; return; }
  if (newName.length < 2 || newName.length > 20) { msg.style.color='#f87171'; msg.textContent='❌ الاسم بين 2 و 20 حرف'; return; }
  const oldName = cu?.username || cu?.name;
  if (newName === oldName) { msg.style.color='#f87171'; msg.textContent='❌ الاسم نفسه الحالي'; return; }
  msg.style.color='#888'; msg.textContent='جارٍ التغيير...';
  try {
    const r = await fetch('/api/change-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName })
    });
    const d = await r.json();
    if (d.ok) {
      msg.style.color='#4ade80'; msg.textContent='✅ تم تغيير الاسم بنجاح! سيتم تسجيل الخروج...';
      // Update local session
      if (cu) { cu.name = newName; if(cu.username) cu.username = newName; }
      const saved = localStorage.getItem('ghazal_user');
      if (saved) {
        const u = JSON.parse(saved); u.name = newName; if(u.username) u.username = newName;
        localStorage.setItem('ghazal_user', JSON.stringify(u));
      }
      toast('✅ تم تغيير الاسم — أعد تسجيل الدخول', 'k');
      setTimeout(() => { closeProfile(); logout(); }, 2000);
    } else {
      msg.style.color='#f87171'; msg.textContent='❌ ' + (d.msg || 'خطأ');
    }
  } catch(e) { msg.style.color='#f87171'; msg.textContent='❌ خطأ في الاتصال'; }
}

// Admin: rename any user (owner only) - called from admin panel
async function adminRenameUser(oldName) {
  const newName = prompt('الاسم الجديد لـ ' + oldName + ':', oldName);
  if (!newName || newName.trim() === oldName) return;
  const nm = newName.trim();
  if (nm.length < 2 || nm.length > 20) { toast('❌ الاسم بين 2 و 20 حرف', 'e'); return; }
  try {
    const r = await fetch('/api/admin/rename-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': AK },
      body: JSON.stringify({ oldName, newName: nm })
    });
    const d = await r.json();
    if (d.ok) { toast('✅ تم تغيير اسم ' + oldName + ' إلى ' + nm, 'k'); refAdmin(); }
    else toast('❌ ' + (d.msg || 'خطأ'), 'e');
  } catch(e) { toast('❌ خطأ في الاتصال', 'e'); }
}

// ===== VOICE MESSAGES =====
let _mediaRec = null, _recChunks = [], _recTimer = null, _recSecs = 0, _recTarget = 'room';

function _startRecTimer(displayId) {
  _recSecs = 0;
  clearInterval(_recTimer);
  _recTimer = setInterval(() => {
    _recSecs++;
    const m = Math.floor(_recSecs/60), s = _recSecs%60;
    const el = document.getElementById(displayId);
    if (el) el.textContent = m+':'+(s<10?'0':'')+s;
    if (_recSecs >= 60) { // max 60s
      if (_recTarget === 'room') sendVoiceRec();
      else sendPMVoice();
    }
  }, 1000);
}

async function _startRecording(target) {
  if (_mediaRec) return;
  _recTarget = target;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _recChunks = [];
    _mediaRec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    _mediaRec.ondataavailable = e => { if (e.data.size) _recChunks.push(e.data); };
    _mediaRec.start(100);
    if (target === 'room') {
      document.getElementById('voice-rec-bar').style.display = 'flex';
      document.getElementById('voice-rec-btn').style.color = '#ff4444';
      _startRecTimer('voice-rec-time');
    } else {
      document.getElementById('pm-voice-bar').style.display = 'flex';
      document.getElementById('pm-voice-btn').style.color = '#ff4444';
      _startRecTimer('pm-rec-time');
    }
  } catch(e) {
    toast('❌ لا يمكن الوصول للميكروفون', 'e');
  }
}

function _stopRecording() {
  clearInterval(_recTimer);
  if (_mediaRec) {
    _mediaRec.stream.getTracks().forEach(t => t.stop());
    _mediaRec = null;
  }
  document.getElementById('voice-rec-bar').style.display = 'none';
  document.getElementById('voice-rec-btn').style.color = '#b0bec5';
  document.getElementById('pm-voice-bar').style.display = 'none';
  document.getElementById('pm-voice-btn').style.color = '#b0bec5';
}

function toggleVoiceRec() { _mediaRec ? sendVoiceRec() : _startRecording('room'); }
function togglePMVoiceRec() { _mediaRec ? sendPMVoice() : _startRecording('pm'); }
function cancelVoiceRec() { _stopRecording(); _recChunks = []; }
function cancelPMVoice() { _stopRecording(); _recChunks = []; }

function _buildVoiceBlob(cb) {
  if (!_mediaRec) return;
  _mediaRec.onstop = () => {
    const blob = new Blob(_recChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onload = ev => cb(ev.target.result, blob);
    reader.readAsDataURL(blob);
  };
  _mediaRec.stop();
  _mediaRec.stream.getTracks().forEach(t => t.stop());
  _mediaRec = null;
  clearInterval(_recTimer);
}

function sendVoiceRec() {
  _buildVoiceBlob((b64, blob) => {
    _stopRecording();
    const dur = _recSecs;
    // إرسال عبر socket كـ base64
    socket.emit('voice-message', { room: cr, data: b64, duration: dur, from: cu?.name||cu?.username });
    // عرض محلياً فوراً
    appendVoiceMsg(b64, dur, cu?.name||cu?.username, true);
  });
}

function sendPMVoice() {
  if (!pmt3) return;
  _buildVoiceBlob((b64, blob) => {
    _stopRecording();
    const dur = _recSecs;
    socket.emit('pm-voice-message', { to: pmt3, data: b64, duration: dur, from: cu?.name||cu?.username });
    appendPMVoiceMsg(b64, dur, cu?.name||cu?.username, true);
  });
}

function appendVoiceMsg(b64, dur, fromName, isMine) {
  const msgs = document.getElementById('msgs');
  const d = document.createElement('div');
  d.className = 'msg ' + (isMine ? 'mine' : '');
  const m = Math.floor(dur/60), s = dur%60;
  const durStr = m+':'+(s<10?'0':'')+s;
  const uid = 'vm_'+Date.now();
  d.innerHTML = `<div style="display:flex;flex-direction:column;${isMine?'align-items:flex-end':'align-items:flex-start'}">
    ${!isMine?`<span style="font-size:11px;color:#888;margin-bottom:3px;">${fromName}</span>`:''}
    <div class="voice-msg-bubble" onclick="playVoiceMsg('${uid}','${b64}')">
      <div class="vplay" id="vplay_${uid}">▶</div>
      <div class="vwav">${Array(8).fill(0).map((_,i)=>`<div class="vbar" style="animation-delay:${i*0.15}s;height:${4+Math.random()*16}px"></div>`).join('')}</div>
      <div class="vdur">🎤 ${durStr}</div>
    </div>
    <audio id="${uid}" src="${b64}" style="display:none"></audio>
  </div>`;
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function appendPMVoiceMsg(b64, dur, fromName, isMine) {
  const pmm = document.getElementById('pmm');
  const d = document.createElement('div');
  d.className = 'pm-msg ' + (isMine ? 'mine' : '');
  const m = Math.floor(dur/60), s = dur%60;
  const durStr = m+':'+(s<10?'0':'')+s;
  const uid = 'pmv_'+Date.now();
  d.innerHTML = `<div class="voice-msg-bubble" onclick="playVoiceMsg('${uid}','${b64}')">
    <div class="vplay" id="vplay_${uid}">▶</div>
    <div class="vwav">${Array(6).fill(0).map((_,i)=>`<div class="vbar" style="animation-delay:${i*0.15}s;"></div>`).join('')}</div>
    <div class="vdur">🎤 ${durStr}</div>
  </div>
  <audio id="${uid}" src="${b64}" style="display:none"></audio>`;
  pmm.appendChild(d);
  pmm.scrollTop = pmm.scrollHeight;
}

let _curVoiceAudio = null;
function playVoiceMsg(uid, b64) {
  if (_curVoiceAudio && _curVoiceAudio !== uid) {
    const prev = document.getElementById(_curVoiceAudio);
    if (prev) { prev.pause(); prev.currentTime = 0; }
    const prevBtn = document.getElementById('vplay_' + _curVoiceAudio);
    if (prevBtn) prevBtn.textContent = '▶';
  }
  const audio = document.getElementById(uid);
  const btn = document.getElementById('vplay_' + uid);
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    if (btn) btn.textContent = '⏸';
    _curVoiceAudio = uid;
    audio.onended = () => { if (btn) btn.textContent = '▶'; _curVoiceAudio = null; };
  } else {
    audio.pause();
    if (btn) btn.textContent = '▶';
    _curVoiceAudio = null;
  }
}

// Receive voice messages
socket.on('voice-message', d => {
  if (d.room === cr) appendVoiceMsg(d.data, d.duration, d.from, false);
});
socket.on('pm-voice-message', d => {
  const myName = cu?.name || cu?.username;
  const isMine = d.from === myName;
  if (typeof _pmAddMsg === 'function') _pmAddMsg(d);
  const other = isMine ? d.to : d.from;
  if (pmt3 === other || pmt3 === d.from) appendPMVoiceMsg(d.data, d.duration, d.from, isMine);
});

function loadRankLabels() {
  try {
    const saved = localStorage.getItem('ghazal_rank_labels');
    if (saved) {
      const labels = JSON.parse(saved);
      Object.assign(RK_LABEL, labels);
    }
  } catch(e) {}
}

// تحميل فوري عند البدء
loadRankLabels();

// Override ranks-updated to also save to localStorage
const _origRanksUpdated = null;
socket.on('ranks-updated', updatedRanks => {
  Object.keys(updatedRanks).forEach(k => {
    if (updatedRanks[k].label) RK_LABEL[k] = updatedRanks[k].label;
    if (updatedRanks[k].color) RK_COLOR[k] = updatedRanks[k].color;
  });
  saveRankLabels();
  // إعادة رسم كل العناصر
  renderRooms();
  // تحديث شارة الرتبة في الهيدر
  const rankBadge = document.getElementById('my-rank-badge');
  if (rankBadge && cu?.rank) rankBadge.textContent = RK_LABEL[cu.rank] || cu.rank;
  // تحديث قائمة المستخدمين
  const ulistEl = document.getElementById('ulist');
  if (ulistEl && ulistEl.children.length) {
    // إعادة render بيانات المستخدمين الحاليين
    if (typeof renderUsers === 'function') socket.emit('request-room-users', cr);
  }
});

// ============================================================
// ====== 5. إظهار سبب الحظر عند الطرد =======================
// ============================================================
// Override kicked handler to show reason
socket.off('kicked');
socket.on('kicked', m => {
  // إظهار نافذة توضح سبب الحظر/الطرد
  const isBan = m.includes('حظر') || m.includes('ban');
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#1a0a0a,#2d0f0f);border:1px solid rgba(239,68,68,.4);border-radius:20px;padding:32px 28px;max-width:380px;width:90%;text-align:center;box-shadow:0 0 40px rgba(239,68,68,.2);">
      <div style="font-size:52px;margin-bottom:16px;">${isBan ? '⛔' : '🚪'}</div>
      <div style="font-size:18px;font-weight:900;color:#f87171;margin-bottom:12px;">${isBan ? 'تم حظرك من الموقع' : 'تم طردك من الغرفة'}</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.8;margin-bottom:20px;background:rgba(239,68,68,.08);border-radius:10px;padding:12px 16px;">${esc(m)}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:20px;">سيتم تسجيل خروجك تلقائياً...</div>
      <button onclick="logout()" style="background:linear-gradient(135deg,#c62828,#b71c1c);border:none;color:#fff;border-radius:10px;padding:10px 28px;cursor:pointer;font-size:13px;font-weight:700;font-family:'Cairo',sans-serif;">خروج</button>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => logout(), 4000);
});

// ============================================================
// ====== 6. تنسيق الخط في شريط الكتابة ======================
// ============================================================
let _fmtBold = false, _fmtItalic = false, _fmtUnderline = false;
let _fmtFont = '', _fmtSize = '';
let _fmtToolbarOpen = false;

function toggleFormatToolbar() {
  _fmtToolbarOpen = !_fmtToolbarOpen;
  const tb = document.getElementById('format-toolbar-popup');
  if (tb) tb.style.display = _fmtToolbarOpen ? 'block' : 'none';
  const btn = document.getElementById('fmt-toggle-btn');
  if (btn) {
    btn.style.color = _fmtToolbarOpen ? '#ffd166' : '#b0bec5';
    btn.style.borderColor = _fmtToolbarOpen ? 'rgba(255,215,0,.4)' : 'rgba(255,255,255,.1)';
    btn.style.background = _fmtToolbarOpen ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.05)';
  }
  updateFmtPreview();
}

function applyFmt(type) {
  if (type === 'bold') _fmtBold = !_fmtBold;
  if (type === 'italic') _fmtItalic = !_fmtItalic;
  if (type === 'underline') _fmtUnderline = !_fmtUnderline;
  // تحديث لون الأزرار
  const styles = {bold:'B',italic:'I',underline:'U'};
  const states = {bold:_fmtBold,italic:_fmtItalic,underline:_fmtUnderline};
  document.querySelectorAll('[onclick*="applyFmt"]').forEach(btn => {
    const t = btn.getAttribute('onclick').match(/'(\w+)'/)?.[1];
    if (t && states[t] !== undefined) {
      btn.style.background = states[t] ? 'rgba(255,215,0,.2)' : 'rgba(255,255,255,.06)';
      btn.style.borderColor = states[t] ? 'rgba(255,215,0,.5)' : 'rgba(255,255,255,.12)';
      btn.style.color = states[t] ? '#ffd166' : '#fff';
    }
  });
  updateFmtPreview();
}

function applyFont(val) { _fmtFont = val; updateFmtPreview(); }
function applySize(val) { _fmtSize = val; updateFmtPreview(); }

function clearFmt() {
  _fmtBold = _fmtItalic = _fmtUnderline = false;
  _fmtFont = ''; _fmtSize = '';
  document.getElementById('fmt-font').value = '';
  document.getElementById('fmt-size').value = '';
  document.querySelectorAll('[onclick*="applyFmt"]').forEach(btn => {
    btn.style.background = 'rgba(255,255,255,.06)';
    btn.style.borderColor = 'rgba(255,255,255,.12)';
    btn.style.color = '#fff';
  });
  updateFmtPreview();
}

function updateFmtPreview() {
  const prev = document.getElementById('fmt-preview');
  const inp = document.getElementById('min');
  if (!prev) return;
  const txt = inp?.value || 'معاينة النص...';
  let st = '';
  if (_fmtFont) st += `font-family:${_fmtFont},Cairo,sans-serif;`;
  if (_fmtSize) st += `font-size:${_fmtSize};`;
  if (_fmtBold) st += 'font-weight:700;';
  if (_fmtItalic) st += 'font-style:italic;';
  if (_fmtUnderline) st += 'text-decoration:underline;';
  prev.innerHTML = `<span style="${st}">${esc(txt)}</span>`;
}

// _buildFmtTag removed - fmt sent as object via msgData.fmt

// إضافة زر الأصدقاء في قائمة البوب أب إذا لم يكن موجوداً
// (يتم ذلك عند بناء ghzlOpenPopup)

socket.on('connect', () => {
  setTimeout(loadShopItems, 2000);
  // تحميل بيانات الأصدقاء عند الاتصال
  if (cu?.name && typeof _loadFriendsData === 'function') {
    _loadFriendsData();
    updateFriendBadge();
  }
  // إذا كان المستخدم مسجلاً وعاد للصفحة - أعد الانضمام للغرفة
  if (cu && cr) {
    socket.emit('join', Object.assign({}, cu, { requestWelcome: false }));
  }
});

// إعادة الاتصال التلقائي عند العودة للصفحة (من واتساب أو تطبيق آخر)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && cu) {
    if (!socket.connected) {
      socket.connect();
    } else {
      // أرسل ping وتأكد من وجود العضو في الغرفة
      socket.emit('activity-ping');
      setTimeout(() => {
        if (cu && cr) socket.emit('rejoin', { user: cu, room: cr });
      }, 300);
    }
  }
});

// ===== ACTIVITY PING - يحافظ على المستخدم النشط متصلاً =====
// يُرسل ping كل دقيقة لمنع الإخراج بسبب الخمول
setInterval(() => {
  if (cu && socket.connected) {
    socket.emit('activity-ping');
  }
}, 60 * 1000);

// معالجة انقطاع الاتصال المؤقت
socket.on('disconnect', (reason) => {

  // محاولة إعادة الاتصال فوراً
  setTimeout(() => {
    if (!socket.connected) socket.connect();
  }, 500);
});

socket.on('reconnect', () => {
  // عند إعادة الاتصال - أعد الانضمام للغرفة
  if (cu && cr) {
    socket.emit('join', Object.assign({}, cu, { requestWelcome: false }));
  }
});

socket.on('reconnect_error', () => {
  setTimeout(() => {
    if (!socket.connected) socket.connect();
  }, 2000);
});

// تحديث gold display - تأكد من الإصلاح للموبايل
socket.on('shop-updated', items => {
  shopItems = items || [];
  renderShopItems();
});
// updateGoldDisplay — معرَّفة في features.js

/* =====================================================
   ===== POPUP MENU — القائمة المنبثقة =====
   ===================================================== */
let ghzlIgnoreList = JSON.parse(localStorage.getItem('ghzal_ignore_list') || '[]');

/* ===== SADA-STYLE POPUP ===== */
let _ghzlPopupLiked = false;
let _ghzlPopupLikeCount = 0;
let _ghzlPopupUser = '';

function ghzlPopupSwitchTab(tab){
  document.getElementById('ghzl-tab-info').classList.toggle('on', tab==='info');
  document.getElementById('ghzl-tab-actions').classList.toggle('on', tab==='actions');
  document.getElementById('ghzl-panel-info').classList.toggle('on', tab==='info');
  document.getElementById('ghzl-panel-actions').classList.toggle('on', tab==='actions');
}

function ghzlPopupLike(){
  _ghzlPopupLiked = !_ghzlPopupLiked;
  _ghzlPopupLikeCount += _ghzlPopupLiked ? 1 : -1;
  if(_ghzlPopupLikeCount < 0) _ghzlPopupLikeCount = 0;
  const btn = document.getElementById('ghzl-popup-like-btn');
  const cnt = document.getElementById('ghzl-popup-like-count');
  if(btn){ btn.classList.toggle('liked', _ghzlPopupLiked); btn.textContent = _ghzlPopupLiked ? '❤️ معجب' : '❤️ إعجاب'; }
  if(cnt) cnt.textContent = _ghzlPopupLikeCount;
}

function ghzlShowPopup(username, rank) {
  _ghzlPopupUser = username;
  const notSelf = username !== (cu && cu.name);
  const isOwner = cu && ['owner','owner_admin','super_admin','owner_vip'].includes(cu.rank);
  const ri = { color: RK_COLOR[rank] || '#b0bec5', label: RK_LABEL[rank] || 'زائر' };
  const col = AVC[(username||'?').charCodeAt(0) % AVC.length];
  const init = (username||'?').charAt(0).toUpperCase();

  // Reset tabs to info
  ghzlPopupSwitchTab('info');

  // Avatar — reset to initials, size controlled by CSS .popup-av
  const av = document.getElementById('ghzl-popup-av');
  if(av){
    av.style.background = `linear-gradient(135deg,${col},${col}99)`;
    av.innerHTML = `<span style="font-size:44px;font-weight:900;color:#fff;">${init}</span>`;
  }

  // Name & rank
  const un = document.getElementById('ghzl-popup-uname');
  if(un){ un.textContent = username; un.style.color = ri.color; }
  const ur = document.getElementById('ghzl-popup-urank');
  if(ur){ ur.textContent = ri.label; ur.style.cssText = `font-size:11px;margin-top:3px;padding:2px 8px;border-radius:20px;display:inline-block;background:${ri.color}22;color:${ri.color};border:1px solid ${ri.color}44;`; }

  // Cover background color based on rank
  const coverEl = document.getElementById('ghzl-popup-cover');
  const coverImg = document.getElementById('ghzl-popup-cover-img');
  const coverDef = document.getElementById('ghzl-popup-cover-def');
  if(coverEl) coverEl.style.background = `linear-gradient(160deg,${ri.color}55 0%,#0d1117 70%,${ri.color}11 100%)`;
  if(coverImg) coverImg.style.display = 'none';
  if(coverDef) coverDef.style.display = 'flex';

  // Likes reset
  _ghzlPopupLiked = false;
  _ghzlPopupLikeCount = Math.floor(Math.random()*200)+5;
  const likeBtn = document.getElementById('ghzl-popup-like-btn');
  const likeCnt = document.getElementById('ghzl-popup-like-count');
  if(likeBtn){ likeBtn.classList.remove('liked'); likeBtn.textContent = '❤️ إعجاب'; }
  if(likeCnt) likeCnt.textContent = _ghzlPopupLikeCount;

  // Info panel — fill with available data
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('ghzl-pi-seen').textContent = timeStr;
  document.getElementById('ghzl-pi-room').textContent = document.querySelector('.ri.on .r-nm')?.textContent || 'الغرفة العامة';
  document.getElementById('ghzl-pi-join').textContent = '—';
  document.getElementById('ghzl-pi-gender').textContent = '—';
  document.getElementById('ghzl-pi-age').textContent = '—';

  // Try to fetch profile data to fill info
  fetch('/api/profile/' + encodeURIComponent(username))
    .then(r=>r.json()).then(d=>{
      if(!d.ok) return;
      const p = d.profile;
      if(p.joined) document.getElementById('ghzl-pi-join').textContent = p.joined;
      if(p.gender) document.getElementById('ghzl-pi-gender').textContent = p.gender;
      if(p.age) document.getElementById('ghzl-pi-age').textContent = p.age;
      if(p.cover){ coverImg.src = p.cover; coverImg.style.display='block'; coverDef.style.display='none'; }
      if(p.avatar && p.avatar.length > 10){
        av.innerHTML = '';
        const img = document.createElement('img');
        img.src = p.avatar;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        img.onerror = () => { av.innerHTML = `<span style="font-size:44px;font-weight:900;color:#fff;">${init}</span>`; };
        av.appendChild(img);
      }
      // تطبيق شكل الصورة من قاعدة البيانات
      const avShape = p.avatar_shape || 'circle';
      av.style.borderRadius = avShape === 'square' ? '16px' : '50%';
      // تطبيق نفس الشكل على الصورة داخل الـ av
      const avImg = av.querySelector('img');
      if(avImg) avImg.style.borderRadius = avShape === 'square' ? '16px' : '50%';
    }).catch(()=>{});

  // Build actions
  const acts = document.getElementById('ghzl-panel-actions');
  let h = '';
  if(notSelf){
  h += `<button class="popup-action" onclick="ghzlClosePopup();openPM('${esc(username)}')"><span class="popup-action-icon">💬</span> محادثة خاصة</button>`;
  h += `<button class="popup-action" onclick="ghzlClosePopup();sendFriendRequest('${esc(username)}')"><span class="popup-action-icon">🤝</span> إضافة صديق</button>`;
  h += `<button class="popup-action" onclick="ghzlClosePopup();openProfile('${esc(username)}')"><span class="popup-action-icon">👤</span> الملف الشخصي</button>`;
  h += `<button class="popup-action"><span class="popup-action-icon">📞</span> الاتصال به</button>`;
  h += `<button class="popup-action" onclick="ghzlClosePopup();ghzlSendNudge('${esc(username)}')"><span class="popup-action-icon">👋</span> إرسال نكز</button>`;
  h += `<button class="popup-action"><span class="popup-action-icon">🎁</span> إرسال هدية</button>`;
  h += `<button class="popup-action danger" onclick="ghzlClosePopup();ghzlIgnoreUser('${esc(username)}')"><span class="popup-action-icon">🚫</span> عمل تجاهل</button>`;
  h += `<button class="popup-action warn" onclick="ghzlClosePopup();openReportModal('${esc(username)}')"><span class="popup-action-icon">🚨</span> إبلاغ</button>`;
  // Admin/owner actions
  if(hasPerm('can_mute')) h+=`<button class="popup-action danger" onclick="ghzlClosePopup();cx3='${esc(username)}';cxMute()"><span class="popup-action-icon">🔇</span> كتم</button>`;
  if(hasPerm('can_mute')) h+=`<button class="popup-action success" onclick="ghzlClosePopup();cx3='${esc(username)}';cxUnmute()"><span class="popup-action-icon">🔊</span> فك الكتم</button>`;
  if(hasPerm('can_kick')) h+=`<button class="popup-action danger" onclick="ghzlClosePopup();cx3='${esc(username)}';cxKick()"><span class="popup-action-icon">🚪</span> طرد</button>`;
  if(hasPerm('can_ban')) h+=`<button class="popup-action danger" onclick="ghzlClosePopup();socket.emit('admin-ban',{username:'${esc(username)}'});toast('⛔ تم الحظر','k')"><span class="popup-action-icon">⛔</span> حظر</button>`;
  if(isOwner || hasPerm('can_ban')) h+=`<button class="popup-action success" onclick="ghzlClosePopup();socket.emit('admin-unban',{username:'${esc(username)}'}); toast('✅ تم فك الحظر','k')"><span class="popup-action-icon">✅</span> فك الحظر</button>`;
  if(isOwner) h+=`<button class="popup-action gold" onclick="ghzlClosePopup();promoteUser && promoteUser('${esc(username)}')"><span class="popup-action-icon">⭐</span> ترقية</button>`;
  if(isOwner) h+=`<button class="popup-action warn" onclick="ghzlClosePopup();demoteUser && demoteUser('${esc(username)}')"><span class="popup-action-icon">⬇️</span> تخفيض رتبة</button>`;
  } else {
  h += `<button class="popup-action" onclick="ghzlClosePopup();openMyProfile()"><span class="popup-action-icon">👤</span> ملفي الشخصي</button>`;
  h += `<button class="popup-action" onclick="ghzlClosePopup();ghzlToggleSettings()"><span class="popup-action-icon">⚙️</span> إعداداتي</button>`;
  }
  acts.innerHTML = h;
  document.getElementById('ghzl-popup-overlay').classList.add('on');
}
function ghzlClosePopup(){ document.getElementById('ghzl-popup-overlay')?.classList.remove('on'); }
function ghzlSendNudge(u){ toast('👋 تم إرسال نكز لـ '+u,'k'); }
function ghzlIgnoreUser(u){
  if(!ghzlIgnoreList.includes(u)){ ghzlIgnoreList.push(u); localStorage.setItem('ghzal_ignore_list',JSON.stringify(ghzlIgnoreList)); }
  toast('🚫 تم تجاهل '+u,'k');
  ghzlRenderIgnore();
  document.querySelectorAll(`.msg[data-sender="${u}"]`).forEach(m=>m.style.display='none');
}
function ghzlUnignore(u){
  ghzlIgnoreList=ghzlIgnoreList.filter(x=>x!==u);
  localStorage.setItem('ghzal_ignore_list',JSON.stringify(ghzlIgnoreList));
  toast('✅ تمت إزالة '+u,'k');
  ghzlRenderIgnore();
}
function ghzlRenderIgnore(){
  const el=document.getElementById('ghzl-ignore-list'); if(!el)return;
  if(!ghzlIgnoreList.length){ el.innerHTML='<div style="text-align:center;padding:20px;color:var(--mut);font-size:13px;">قائمة التجاهل فارغة</div>'; return; }
  el.innerHTML=ghzlIgnoreList.map(u=>`<div class="ghzl-ignore-item"><span>${esc(u)}</span><button class="ghzl-ignore-rm" onclick="ghzlUnignore('${esc(u)}')">إزالة</button></div>`).join('');
}

/* Override openCtx to show our popup */
const _origOpenCtx = typeof openCtx === 'function' ? openCtx : null;
openCtx = function(e, n){
  e.stopPropagation();
  ghzlShowPopup(n, '');
};

/* Override addSec click to use our popup */
const _origAddSec = typeof addSec === 'function' ? addSec : null;
