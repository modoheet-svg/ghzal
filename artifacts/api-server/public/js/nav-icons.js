// ========== إدارة أيقونات الشريط (النظام القديم - تحويل للنظام الجديد) ==========
function getNavIcons() { return niGetIcons('mob'); }
function saveNavIcons(icons) { niSaveIcons('mob', icons); }
function applyNavIcons() { niApplyAll(); }

let _niCurrentBar = 'mob';

const NI_DEFAULTS = {
  mob: [
    { id:'ni-news',    emoji:'📰', label:'الأخبار',   action:"openNews()",             color:'', visible:true },
    { id:'ni-app',     emoji:'📱', label:'التطبيق',   action:"openPolicy('terms')",    color:'', visible:true },
    { id:'ni-privacy', emoji:'🔒', label:'الخصوصية',  action:"openPolicy('terms')",    color:'', visible:true },
    { id:'ni-sound',   emoji:'🔊', label:'الأصوات',   action:"toggleNotifSound()",     color:'', visible:true },
    { id:'ni-rooms',   emoji:'🏠', label:'الغرف',     action:"openMobDrawer('rooms')", color:'', visible:true },
    { id:'ni-more',    emoji:'👥', label:'القائمة',   action:"openMobMore()",          color:'', visible:true },
  ],
  desk: [
    { id:'di-profile', emoji:'👤', label:'ملفي',      action:"openMyProfile()",        color:'', visible:true },
    { id:'di-diary',   emoji:'📖', label:'يوميات',    action:"openDiary()",             color:'', visible:true },
    { id:'di-inbox',   emoji:'✉️', label:'الرسائل',   action:"openInbox()",            color:'', visible:true },
    { id:'di-friends', emoji:'🤝', label:'صداقة',     action:"openFriends()",           color:'', visible:true },
    { id:'di-notif',   emoji:'🔔', label:'إشعار',     action:"toggleNotifSound()",     color:'', visible:true },
    { id:'di-news',    emoji:'📰', label:'الأخبار',   action:"openNews()",             color:'', visible:true },
  ],
  bb: [
    { id:'bi-rooms',   emoji:'🏠', label:'الغرف',     action:"ghzlBbSwitch(this,'rooms')",   color:'', visible:true },
    { id:'bi-members', emoji:'👥', label:'الأعضاء',   action:"ghzlBbSwitch(this,'members')", color:'', visible:true },
    { id:'bi-settings',emoji:'⚙️', label:'الضبط',     action:"ghzlBbSwitch(this,'settings')",color:'', visible:true },
    { id:'bi-profile', emoji:'👤', label:'ملفي',      action:"openMyProfile()",              color:'', visible:true },
    { id:'bi-news',    emoji:'📢', label:'أخبار',     action:"openNews()",                   color:'', visible:true },
  ],
  hdr: [
    { id:'hi-gold',    emoji:'🛒', label:'المتجر',    action:"openGoldShop()",       color:'', visible:true },
    { id:'hi-news',    emoji:'📢', label:'الأخبار',   action:"openNews()",           color:'', visible:true },
    { id:'hi-profile', emoji:'👤', label:'ملفي',      action:"openMyProfile()",      color:'', visible:true },
    { id:'hi-menu',    emoji:'☰',  label:'القائمة',   action:"openMobMore()",        color:'', visible:true },
    { id:'hi-notif',   emoji:'🔔', label:'الجرس',     action:"toggleNotifSound()",   color:'', visible:true },
    { id:'hi-theme',   emoji:'🎨', label:'الثيم',     action:"openThemePicker()",    color:'', visible:true },
    { id:'hi-settings',emoji:'⚙️', label:'الضبط',     action:"ghzlToggleSettings()", color:'', visible:true },
    { id:'hi-exit',    emoji:'🚪', label:'خروج',      action:"logout()",             color:'', visible:true },
  ],
};

const NI_BAR_LABELS = { mob:'📱 شريط الموبايل السفلي', desk:'💻 شريط اللابتوب الثاني', bb:'🔲 الشريط السفلي الرئيسي', hdr:'🖥️ هيدر اللابتوب الرئيسي' };
const NI_STORAGE_KEY = { mob:'ghazal_ni_mob', desk:'ghazal_ni_desk', bb:'ghazal_ni_bb', hdr:'ghazal_ni_hdr' };

function niGetIcons(bar) {
  try {
    const s = localStorage.getItem(NI_STORAGE_KEY[bar]);
    if (s) return JSON.parse(s);
  } catch(e) {}
  return JSON.parse(JSON.stringify(NI_DEFAULTS[bar] || []));
}

function niSaveIcons(bar, icons) {
  try { localStorage.setItem(NI_STORAGE_KEY[bar], JSON.stringify(icons)); } catch(e) {}
}

function niApplyAll() { niApplyMob(); niApplyDesk(); niApplyBb(); niApplyHdr(); }

function niApplyHdr() {
  // خريطة كاملة بين id الأيقونة و id الزر في HTML
  const HDR_BTN_MAP = {
    'hi-gold':     'gold-shop-btn',
    'hi-inbox':    'inbox-btn',
    'hi-news':     'news-btn',
    'hi-profile':  'profile-btn',
    'hi-menu':     'desk-menu-btn',
    'hi-notif':    'notif-bell',
    'hi-theme':    'hdr-theme-btn',
    'hi-settings': 'hdr-settings-btn',
    'hi-exit':     'hdr-exit-btn',
  };
  const allHdrIcons = niGetIcons('hdr');
  allHdrIcons.forEach(ic => {
    const btnId = HDR_BTN_MAP[ic.id];
    if (!btnId) return;
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (!ic.visible) {
      btn.style.setProperty('display', 'none', 'important');
    }
    if (ic.color) btn.style.color = ic.color;
  });
}


function niApplyMob() {
  const mobNav = document.getElementById('mob-nav');
  if (!mobNav) return;
  const icons = niGetIcons('mob').filter(i => i.visible);
  let html = icons.map(ic => {
    const isSound = ic.id === 'ni-sound';
    const isNews  = ic.id === 'ni-news';
    const isMore  = ic.id === 'ni-more';
    const isRooms = ic.id === 'ni-rooms';
    const extraId = isRooms ? ' id="mn-rooms"' : isMore ? ' id="mn-more"' : '';
    const emojiHtml = isSound
      ? `<span style="font-size:20px;" id="mob-sound-icon">${ic.emoji}</span>`
      : `<span style="font-size:20px;">${ic.emoji}</span>`;
    const badge = isNews
      ? `<span id="mob-news-dot" style="display:none;position:absolute;top:5px;right:10px;width:8px;height:8px;background:#e53935;border-radius:50%;"></span>`
      : isMore
      ? `<span id="mob-more-badge" style="display:none;position:absolute;top:6px;right:10px;background:#e53935;color:white;border-radius:50%;width:14px;height:14px;font-size:8px;align-items:center;justify-content:center;font-weight:700;">!</span>`
      : '';
    const colorStyle = ic.color ? `color:${ic.color};` : '';
    const relStyle = (isNews || isMore) ? 'position:relative;' : '';
    return `<button class="mob-nav-btn"${extraId} onclick="${ic.action}" style="${relStyle}${colorStyle}">${emojiHtml}<span>${ic.label}</span>${badge}</button>`;
  }).join('');
  html += `<button class="mob-nav-btn" id="mn-admin" onclick="mobAdmin()" style="display:none;"><span style="font-size:20px;">👑</span><span>الأدمن</span></button>`;
  mobNav.innerHTML = html;
}

function niApplyDesk() {
  const bar = document.getElementById('desk-second-bar');
  if (!bar) return;
  const icons = niGetIcons('desk').filter(i => i.visible);
  bar.innerHTML = icons.map(ic => {
    const colorStyle = ic.color ? `color:${ic.color}` : 'color:#90b4d4';
    const isNotif = ic.id === 'di-notif';
    const iconHtml = isNotif
      ? `<span style="font-size:16px;" id="desk-notif-icon">${ic.emoji}</span>`
      : `<span style="font-size:16px;">${ic.emoji}</span>`;
    return `<button onclick="${ic.action||'void(0)'}" style="display:flex;align-items:center;gap:5px;background:none;border:none;${colorStyle};font-family:'Cairo',sans-serif;font-size:11px;cursor:pointer;padding:4px 10px;border-radius:6px;transition:.2s;" onmouseover="this.style.background='rgba(255,255,255,.05)'" onmouseout="this.style.background='none'">${iconHtml}<span>${ic.label}</span></button>`;
  }).join('');
}

function niApplyBb() {
  const inner = document.querySelector('.ghzl-bb-inner');
  if (!inner) return;
  const icons = niGetIcons('bb').filter(i => i.visible);
  inner.innerHTML = icons.map((ic, idx) => {
    const colorStyle = ic.color ? `style="color:${ic.color}"` : '';
    return `<button class="ghzl-bb-item${idx===0?' on':''}" onclick="${ic.action}" ${colorStyle}><span class="ghzl-bb-icon">${ic.emoji}</span><span class="ghzl-bb-label">${ic.label}</span></button>`;
  }).join('');
}

function niSwitchBar(bar) {
  _niCurrentBar = bar;
  ['mob','desk','bb','hdr'].forEach(b => {
    const btn = document.getElementById('ni-tab-'+b);
    if (!btn) return;
    if (b === bar) {
      btn.style.borderColor = 'rgba(56,189,248,.5)';
      btn.style.background = 'rgba(56,189,248,.15)';
      btn.style.color = '#38bdf8';
    } else {
      btn.style.borderColor = 'rgba(255,255,255,.1)';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--mut)';
    }
  });
  const lbl = document.getElementById('ni-bar-label');
  if (lbl) lbl.textContent = '📋 أيقونات ' + NI_BAR_LABELS[bar].replace(/^[^\s]+ /,'');
  const sel = document.getElementById('ni-bar');
  if (sel) sel.value = bar;
  niCancelEdit();
  renderNavIconsAdmin();
}

function renderNavIconsAdmin() {
  const icons = niGetIcons(_niCurrentBar);
  const container = document.getElementById('navicons-current-list');
  if (!container) return;
  if (!icons.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--mut);padding:16px;font-size:13px;">لا توجد أيقونات</div>';
    return;
  }
  container.innerHTML = icons.map((ic, idx) => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.03);border:1px solid ${ic.visible?'rgba(56,189,248,.2)':'rgba(255,255,255,.06)'};border-radius:10px;transition:.2s;">
      <div style="display:flex;flex-direction:column;gap:2px;">
        <button onclick="niMoveUp(${idx})" ${idx===0?'disabled':''} style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:${idx===0?'rgba(255,255,255,.2)':'#90b4d4'};border-radius:5px;width:22px;height:20px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;">▲</button>
        <button onclick="niMoveDown(${idx})" ${idx===icons.length-1?'disabled':''} style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:${idx===icons.length-1?'rgba(255,255,255,.2)':'#90b4d4'};border-radius:5px;width:22px;height:20px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;">▼</button>
      </div>
      <span style="font-size:24px;width:32px;text-align:center;${ic.color?'color:'+ic.color:''}">${ic.emoji}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;color:${ic.visible?'#e2e8f0':'var(--mut)'};">${ic.label}</div>
        <div style="font-size:10px;color:var(--mut);font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;">${ic.action||'—'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
        <button onclick="niEditIcon(${idx})" title="تعديل" style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);color:#fbbf24;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;">✏️</button>
        <button onclick="niToggleVisible(${idx})" title="${ic.visible?'إخفاء':'إظهار'}" style="background:${ic.visible?'rgba(56,189,248,.12)':'rgba(255,255,255,.05)'};border:1px solid ${ic.visible?'rgba(56,189,248,.25)':'rgba(255,255,255,.1)'};color:${ic.visible?'#38bdf8':'var(--mut)'};border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;">${ic.visible?'👁️':'🙈'}</button>
        <button onclick="niMoveToBar(${idx})" title="نقل لشريط آخر" style="background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);color:#a78bfa;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;">↗️</button>
        <button onclick="niDeleteIcon(${idx})" title="حذف" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;">🗑️</button>
      </div>
    </div>
  `).join('');
}

function niMoveUp(idx) {
  const icons = niGetIcons(_niCurrentBar);
  if (idx <= 0) return;
  [icons[idx-1], icons[idx]] = [icons[idx], icons[idx-1]];
  niSaveIcons(_niCurrentBar, icons); niApplyAll(); renderNavIconsAdmin();
}

function niMoveDown(idx) {
  const icons = niGetIcons(_niCurrentBar);
  if (idx >= icons.length-1) return;
  [icons[idx], icons[idx+1]] = [icons[idx+1], icons[idx]];
  niSaveIcons(_niCurrentBar, icons); niApplyAll(); renderNavIconsAdmin();
}

function niToggleVisible(idx) {
  const icons = niGetIcons(_niCurrentBar);
  icons[idx].visible = !icons[idx].visible;
  niSaveIcons(_niCurrentBar, icons); niApplyAll(); renderNavIconsAdmin();
  toast(icons[idx].visible ? `✅ تم إظهار "${icons[idx].label}"` : `🙈 تم إخفاء "${icons[idx].label}"`, 'k');
}

function niDeleteIcon(idx) {
  const icons = niGetIcons(_niCurrentBar);
  const name = icons[idx]?.label || '';
  if (!confirm(`هل تريد حذف أيقونة "${name}" نهائياً؟`)) return;
  icons.splice(idx, 1);
  niSaveIcons(_niCurrentBar, icons); niApplyAll(); renderNavIconsAdmin();
  toast(`🗑️ تم حذف "${name}"`, 'k');
}

function niMoveToBar(idx) {
  const icons = niGetIcons(_niCurrentBar);
  const ic = icons[idx];
  if (!ic) return;
  const bars = { mob:'📱 الموبايل', desk:'💻 اللابتوب', bb:'🔲 الرئيسي' };
  const options = Object.keys(bars).filter(b => b !== _niCurrentBar);
  const choice = prompt(`انقل "${ic.label}" إلى:\n1- ${bars[options[0]]}\n2- ${bars[options[1]]}\nاكتب رقم الاختيار:`);
  const targetBar = choice === '1' ? options[0] : choice === '2' ? options[1] : null;
  if (!targetBar) return;
  const targetIcons = niGetIcons(targetBar);
  targetIcons.push({ ...ic, id: 'ni-custom-'+Date.now() });
  niSaveIcons(targetBar, targetIcons);
  icons.splice(idx, 1);
  niSaveIcons(_niCurrentBar, icons);
  niApplyAll(); renderNavIconsAdmin();
  toast(`↗️ تم نقل "${ic.label}" إلى ${bars[targetBar]}`, 'k');
}

function niEditIcon(idx) {
  const icons = niGetIcons(_niCurrentBar);
  const ic = icons[idx];
  if (!ic) return;
  document.getElementById('ni-edit-idx').value = idx;
  document.getElementById('ni-emoji').value = ic.emoji;
  document.getElementById('ni-label').value = ic.label;
  document.getElementById('ni-action').value = ic.action || '';
  document.getElementById('ni-color').value = ic.color || '';
  document.getElementById('ni-bar').value = _niCurrentBar;
  document.getElementById('ni-preview-icon').textContent = ic.emoji;
  document.getElementById('ni-form-title').textContent = '✏️ تعديل الأيقونة';
  document.getElementById('ni-save-btn').textContent = '💾 حفظ التعديل';
  document.getElementById('ni-cancel-btn').style.display = 'inline-flex';
  document.getElementById('ap-sec-navicons').scrollTo({ top: 9999, behavior:'smooth' });
}

function niCancelEdit() {
  document.getElementById('ni-edit-idx').value = '-1';
  document.getElementById('ni-emoji').value = '';
  document.getElementById('ni-label').value = '';
  document.getElementById('ni-action').value = '';
  const colorEl = document.getElementById('ni-color');
  if (colorEl) colorEl.value = '';
  const prevEl = document.getElementById('ni-preview-icon');
  if (prevEl) prevEl.textContent = '❓';
  document.getElementById('ni-form-title').textContent = '➕ إضافة أيقونة جديدة';
  document.getElementById('ni-save-btn').textContent = '➕ إضافة';
  document.getElementById('ni-cancel-btn').style.display = 'none';
}

function adminSaveNavIcon() {
  const emoji  = document.getElementById('ni-emoji')?.value?.trim();
  const label  = document.getElementById('ni-label')?.value?.trim();
  const action = document.getElementById('ni-action')?.value?.trim() || '';
  const color  = document.getElementById('ni-color')?.value?.trim() || '';
  const bar    = document.getElementById('ni-bar')?.value || _niCurrentBar;
  const editIdx = parseInt(document.getElementById('ni-edit-idx')?.value ?? '-1');
  const msg    = document.getElementById('ni-msg');

  if (!emoji || !label) {
    if (msg) { msg.style.color='#f87171'; msg.textContent='❌ الإيموجي والاسم مطلوبان'; setTimeout(()=>msg.textContent='',3000); }
    return;
  }

  if (editIdx >= 0 && bar === _niCurrentBar) {
    const icons = niGetIcons(_niCurrentBar);
    icons[editIdx] = { ...icons[editIdx], emoji, label, action, color };
    niSaveIcons(_niCurrentBar, icons);
    toast(`✅ تم تعديل "${label}"`, 'k');
  } else if (editIdx >= 0 && bar !== _niCurrentBar) {
    const srcIcons = niGetIcons(_niCurrentBar);
    const ic = { ...srcIcons[editIdx], emoji, label, action, color, visible:true };
    srcIcons.splice(editIdx, 1);
    niSaveIcons(_niCurrentBar, srcIcons);
    const dstIcons = niGetIcons(bar);
    dstIcons.push({ ...ic, id:'ni-custom-'+Date.now() });
    niSaveIcons(bar, dstIcons);
    toast(`↗️ تم نقل وتعديل "${label}"`, 'k');
  } else {
    const icons = niGetIcons(bar);
    icons.push({ id:'ni-custom-'+Date.now(), emoji, label, action, color, visible:true });
    niSaveIcons(bar, icons);
    toast(`✅ تمت إضافة "${label}"`, 'k');
    if (bar !== _niCurrentBar) niSwitchBar(bar);
  }

  niApplyAll(); niCancelEdit(); renderNavIconsAdmin();
  if (msg) { msg.style.color='#4ade80'; msg.textContent='✅ تم الحفظ'; setTimeout(()=>msg.textContent='',2500); }
}

function adminResetNavIcons() {
  if (!confirm(`هل تريد إعادة تعيين "${NI_BAR_LABELS[_niCurrentBar]}" للوضع الافتراضي؟`)) return;
  localStorage.removeItem(NI_STORAGE_KEY[_niCurrentBar]);
  niApplyAll(); renderNavIconsAdmin();
  toast('🔄 تمت إعادة التعيين', 'k');
}

niApplyAll();
