// ===== MOBILE FUNCTIONS =====
const isMobile = () => window.innerWidth <= 768;

function openMobDrawer(type) {
  document.getElementById('mob-' + type).classList.add('open');
}
function closeMobDrawer(type) {
  document.getElementById('mob-' + type).classList.remove('open');
}
function mobTab(tab) {
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('mn-' + tab)?.classList.add('active');
}
function mobAdmin() {
  openAdmin();
}

// Sync mobile room/user lists
function syncMobLists() {
  // Sync rooms to mobile drawer
  const rlistMob = document.getElementById('rlist-mob');
  if (rlistMob && Object.keys(rd).length) {
    rlistMob.innerHTML = '';
    Object.entries(rd).forEach(([id, r]) => {
      const d = document.createElement('div');
      d.className = 'ri' + (id === cr ? ' on' : '');
      d.style.cssText = 'padding:14px 16px;margin-bottom:6px;cursor:pointer;';
      d.innerHTML = `<div class="r-ic" style="width:40px;height:40px;font-size:20px;background:${RC[id]||'#333'};border-radius:10px;display:flex;align-items:center;justify-content:center;">${r.icon}</div>
        <div style="flex:1;margin-right:10px;">
          <div class="r-nm" style="font-size:14px;">${r.name}</div>
          <div class="r-cn" style="font-size:12px;color:var(--mut);" id="mrc-${id}">0 متصل</div>
        </div>`;
      d.onclick = () => {
        swRoom(id, r);
        closeMobDrawer('rooms');
        // Update active state in mobile list
        rlistMob.querySelectorAll('.ri').forEach(x => x.classList.remove('on'));
        d.classList.add('on');
      };
      rlistMob.appendChild(d);
    });
  }

  // Sync users to mobile drawer - with PM and call buttons
  const ulistMob = document.getElementById('ulist-mob');
  if (ulistMob) {
    ulistMob.innerHTML = '';
    const ulist = document.getElementById('ulist');
    if (!ulist) return;
    // Get all user items from desktop list
    ulist.querySelectorAll('.ui').forEach(ui => {
      const nameEl = ui.querySelector('.un');
      if (!nameEl) return;
      const uname = nameEl.textContent.trim();
      const myName = cu?.name || cu?.username;
      if (uname === myName) return; // skip self
      // Get rank color from the name element style
      const nc = nameEl.style.color || '#b0bec5';
      // Get avatar
      const avEl = ui.querySelector('.av');
      const avHtml = avEl ? avEl.outerHTML.replace('onclick="openProfile', 'onclick="openProfile') : '';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;margin-bottom:6px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);';
      row.innerHTML = `
        <div style="cursor:pointer;flex-shrink:0;" onclick="openProfile('${uname}');closeMobDrawer('users');">
          ${avEl ? avEl.outerHTML : `<div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:15px;">${uname.charAt(0)}</div>`}
        </div>
        <div style="flex:1;min-width:0;cursor:pointer;" onclick="openProfile('${uname}');closeMobDrawer('users');">
          <div style="font-size:13px;font-weight:700;color:${nc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${uname}</div>
          <div style="font-size:11px;color:#666;margin-top:1px;">${nameEl.getAttribute('data-rank-label') || ''}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button onclick="event.stopPropagation();openPM('${uname}');closeMobDrawer('users');"
            style="width:34px;height:34px;border-radius:10px;background:rgba(245,166,35,.15);border:1px solid rgba(245,166,35,.3);color:#ffd700;font-size:16px;cursor:pointer;">💌</button>
          <button onclick="event.stopPropagation();startCall('audio','${uname}');closeMobDrawer('users');"
            style="width:34px;height:34px;border-radius:10px;background:rgba(0,191,255,.1);border:1px solid rgba(0,191,255,.2);color:#00bfff;font-size:16px;cursor:pointer;">📞</button>
          <button onclick="event.stopPropagation();startCall('video','${uname}');closeMobDrawer('users');"
            style="width:34px;height:34px;border-radius:10px;background:rgba(76,175,80,.1);border:1px solid rgba(76,175,80,.2);color:#4caf50;font-size:16px;cursor:pointer;">📹</button>
        </div>`;
      ulistMob.appendChild(row);
    });
    // If empty
    if (!ulistMob.children.length) {
      ulistMob.innerHTML = '<div style="text-align:center;color:#555;padding:30px;font-size:13px;">لا يوجد متصلون الآن</div>';
    }
  }
}

// Show admin button on mobile for admins
function showMobAdmin() {
  if (isMobile() && cu && ['ghost','owner','owner_admin','owner_vip','super_admin','admin'].includes(cu.rank)) {
    document.getElementById('mn-admin').style.display = 'flex';
    document.getElementById('admin-btn').style.display = '';
  }
}

// Show users button on mobile - handled by CSS

