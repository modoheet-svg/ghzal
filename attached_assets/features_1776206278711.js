
// تحديث gold display - تأكد من الإصلاح للموبايل
socket.on('shop-updated', items => {
  shopItems = items || [];
  renderShopItems();
});
function updateGoldDisplay() {
  const el = document.getElementById('gold-display');
  const gEl = document.getElementById('my-gold');
  const dEl = document.getElementById('my-diamond');
  if (el && cu && cu.rank !== 'visitor') {
    el.style.display = 'flex';
    if (gEl) gEl.textContent = myGold || 0;
    if (dEl) dEl.textContent = myDiamond || 0;
  }
  // تحديث قيم الموبايل في قائمة المزيد
  const mgv = document.getElementById('mob-gold-val');
  const mdv = document.getElementById('mob-diamond-val');
  if(mgv) mgv.textContent = myGold || 0;
  if(mdv) mdv.textContent = myDiamond || 0;
  // إظهار صف الذهب في الموبايل إذا كان عضواً
  if(cu && cu.rank !== 'visitor') {
    const gr = document.getElementById('mob-gold-row');
    if(gr) gr.style.display = 'flex';
  }
  const gmG = document.getElementById('gm-gold');
  const gmD = document.getElementById('gm-diamond');
  if (gmG) gmG.textContent = myGold || 0;
  if (gmD) gmD.textContent = myDiamond || 0;
  const smG = document.getElementById('shop-my-gold');
  const smD = document.getElementById('shop-my-diamond');
  if(smG) smG.textContent = myGold || 0;
  if(smD) smD.textContent = myDiamond || 0;
}

// ===== قائمة المزيد في الموبايل =====
function openMobMore() {
  const d = document.getElementById('mob-more-drawer');
  if(d) d.style.display = 'block';
  // تحديث بيانات المستخدم في القائمة
  if(cu && cu.rank !== 'visitor') {
    const hdr = document.getElementById('mob-menu-user-hdr');
    if(hdr) hdr.style.display = 'block';
    const nm = document.getElementById('mob-menu-name');
    if(nm) nm.textContent = cu.name || '';
    const rk = document.getElementById('mob-menu-rank');
    if(rk) rk.textContent = RK_LABEL[cu.rank] || '';
    // avatar
    const av = document.getElementById('mob-menu-avatar');
    if(av && cu.avatar) av.innerHTML = `<img src="${cu.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    // الذهب
    const gr = document.getElementById('mob-gold-row');
    if(gr) gr.style.display = 'flex';
    const gv = document.getElementById('mob-gold-val');
    const dv = document.getElementById('mob-diamond-val');
    if(gv) gv.textContent = myGold || 0;
    if(dv) dv.textContent = myDiamond || 0;
    // إظهار الأزرار الخاصة بالأعضاء
    ['mob-menu-profile','mob-menu-chpass','mob-menu-shop','mob-menu-goldshop','mob-menu-goldshop2'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.style.display = 'flex';
    });
  }
  // اسم الغرفة الحالية
  const roomEl = document.getElementById('mob-menu-room');
  if(roomEl) {
    const rname = document.querySelector('.cr-nm');
    if(rname) roomEl.textContent = rname.textContent || 'الغرفة العامة';
  }
}
function closeMobMore() {
  const d = document.getElementById('mob-more-drawer');
  if(d) d.style.display = 'none';
}
document.addEventListener('click', function(e) {
  const drawer = document.getElementById('mob-more-drawer');
  const btn = document.getElementById('mn-more');
  const deskBtn = document.getElementById('desk-menu-btn');
  if(drawer && drawer.style.display==='block'
    && !drawer.contains(e.target)
    && e.target !== btn && !btn?.contains(e.target)
    && e.target !== deskBtn && !deskBtn?.contains(e.target)) {
    closeMobMore();
  }
});
function updateMobMoreBadge() {
  const total = (newsItems.filter(n=>!n.read).length) + (inboxItems.filter(i=>!i.read).length);
  const badge = document.getElementById('mob-more-badge');
  if(badge) { badge.style.display = total > 0 ? 'flex' : 'none'; badge.textContent = total > 9 ? '9+' : total; }
}

// ========== نظام الأخبار والإعلانات ==========
let newsItems = []; // {id, type, title, body, time, read:false}
let inboxItems = []; // {id, from, title, body, time, read, type}
let shopItems = []; // {id, name, icon, gold, diamond, desc, price}
let shopOrders = []; // {id, username, itemId, itemName, time, done}

// ===== تخزين الصندوق في localStorage =====
function _inboxKey() { return 'inbox_' + (cu?.name || 'guest'); }

function saveInbox() {
  try {
    const key = _inboxKey();
    // نحتفظ بآخر 100 رسالة فقط
    const toSave = inboxItems.slice(-100);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch(e) {}
}

function loadInbox() {
  try {
    const key = _inboxKey();
    const saved = localStorage.getItem(key);
    if(saved) {
      inboxItems = JSON.parse(saved) || [];
    }
  } catch(e) { inboxItems = []; }
}

function addToInbox(item) {
  inboxItems.push(item);
  saveInbox();
  updateInboxBadge();
  // إذا الصندوق مفتوح - أعد رسمه فوراً
  const ov = document.getElementById('inbox-ov');
  if (ov && ov.classList.contains('on')) renderInboxList();
}

// ===== بناء قائمة المحادثات (واتساب ستايل) =====
function _buildConversations() {
  const convMap = {};
  inboxItems.forEach(item => {
    if (item.type !== 'pm' || !item.from) return;
    const key = item.from;
    if (!convMap[key]) convMap[key] = { from: key, msgs: [], unread: 0 };
    convMap[key].msgs.push(item);
    if (!item.read) convMap[key].unread++;
  });
  return Object.values(convMap).sort((a,b) => {
    const ta = a.msgs[a.msgs.length-1]?.id || 0;
    const tb = b.msgs[b.msgs.length-1]?.id || 0;
    return tb - ta;
  });
}

function _buildNotifications() {
  return inboxItems.filter(i => i.type !== 'pm').reverse();
}

// تحميل الأخبار من السيرفر
async function loadNews() {
  try {
    const r = await fetch('/api/news').then(r=>r.json());
    if(r.ok) {
      newsItems = r.news || [];
      updateNewsBadge();
      renderNewsList();
    }
  } catch(e) {}
}

function updateNewsBadge() {
  const unread = newsItems.filter(n=>!n.read).length;
  const badge = document.getElementById('news-badge');
  if(badge) {
    if(unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  }
  updateMobMoreBadge();
}

function openNews() {
  renderNewsList();
  // تحديد الكل كمقروء
  newsItems.forEach(n => n.read = true);
  updateNewsBadge();
  openM('news');
}

// تخزين اللايكات محلياً
let newsLikes = JSON.parse(localStorage.getItem('ghazal_news_likes') || '{}');
// إعداد العرض التلقائي للأخبار
let newsAutoInterval = parseInt(localStorage.getItem('ghazal_news_interval') || '600'); // ثانية (10 دقائق)
let _newsAutoTimer = null;

function likeNews(id) {
  if(!cu) return;
  const key = String(id);
  newsLikes[key] = !newsLikes[key];
  localStorage.setItem('ghazal_news_likes', JSON.stringify(newsLikes));
  renderNewsList();
}

function startNewsAutoDisplay() {
  if (_newsAutoTimer) clearInterval(_newsAutoTimer);
  if (!newsAutoInterval || newsAutoInterval < 60) return;
  _newsAutoTimer = setInterval(() => {
    if (!newsItems.length || !cu) return;
    // اختر خبراً عشوائياً
    const n = newsItems[Math.floor(Math.random() * newsItems.length)];
    if (!n) return;
    const typeLabels = {news:'📰', broadcast:'📣', update:'🚀'};
    const icon = typeLabels[n.type] || '📰';
    // أرسل في الدردشة كرسالة نظام
    const msgs = document.getElementById('msgs');
    if (!msgs) return;
    const d = document.createElement('div');
    d.style.cssText = 'margin:8px 0;padding:10px 14px;background:linear-gradient(135deg,rgba(0,200,100,.1),rgba(0,200,100,.05));border:1px solid rgba(0,200,100,.2);border-radius:12px;text-align:center;animation:mi .3s ease;cursor:pointer;';
    d.innerHTML = `<span style="font-size:13px;color:#00e676;">${icon} <b>${n.title}</b></span><span style="font-size:11px;color:var(--mut);margin-right:8px;">— اضغط للقراءة</span>`;
    d.onclick = () => openNews();
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }, newsAutoInterval * 1000);
}

function setNewsInterval(seconds) {
  newsAutoInterval = Math.max(60, parseInt(seconds) || 600);
  localStorage.setItem('ghazal_news_interval', newsAutoInterval);
  startNewsAutoDisplay();
}

function saveNewsInterval() {
  const val = parseInt(document.getElementById('news-interval-val')?.value) || 10;
  const unit = parseInt(document.getElementById('news-interval-unit')?.value) || 60;
  const seconds = val * unit;
  setNewsInterval(seconds);
  const msg = document.getElementById('news-interval-msg');
  if (msg) {
    msg.textContent = `✅ تم الحفظ — كل ${val} ${unit===60?'دقيقة':'ساعة'}`;
    setTimeout(() => msg.textContent = '', 3000);
  }
}

function renderNewsList() {
  const el = document.getElementById('news-list');
  if(!el) return;
  if(!newsItems.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--mut);padding:30px;font-size:13px;">لا توجد أخبار حالياً</div>';
    return;
  }
  const typeColors = {news:'#64c8ff', broadcast:'#ff8c00', update:'#00e676'};
  const typeLabels = {news:'📰 خبر', broadcast:'📣 إعلان', update:'🚀 تحديث'};
  el.innerHTML = [...newsItems].reverse().map(n => {
    const liked = newsLikes[String(n.id)];
    const likeCount = (n.likes || 0) + (liked ? 1 : 0);
    return `
    <div class="news-card" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;transition:.2s;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${typeColors[n.type]||'#64c8ff'}22;color:${typeColors[n.type]||'#64c8ff'};border:1px solid ${typeColors[n.type]||'#64c8ff'}44;">${typeLabels[n.type]||'📰 خبر'}</span>
        <span style="font-size:10px;color:var(--mut);margin-right:auto;">${n.time||''}</span>
      </div>
      <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">${n.title||''}</div>
      <div style="font-size:12px;color:var(--mut);line-height:1.7;margin-bottom:10px;">${(n.body||'').replace(/\n/g,'<br>')}</div>
      <div style="display:flex;align-items:center;gap:10px;border-top:1px solid rgba(255,255,255,.06);padding-top:8px;">
        <button onclick="likeNews(${n.id})" style="display:flex;align-items:center;gap:5px;background:${liked?'rgba(255,64,100,.2)':'rgba(255,255,255,.05)'};border:1px solid ${liked?'rgba(255,64,100,.4)':'rgba(255,255,255,.1)'};border-radius:20px;padding:4px 12px;cursor:pointer;color:${liked?'#ff4064':'var(--mut)'};font-size:12px;font-family:'Cairo',sans-serif;transition:.2s;">
          ${liked?'❤️':'🤍'} <span>${likeCount > 0 ? likeCount : 'إعجاب'}</span>
        </button>
        <button onclick="likeNews('h'+${n.id})" style="display:flex;align-items:center;gap:5px;background:${newsLikes['h'+n.id]?'rgba(255,215,0,.2)':'rgba(255,255,255,.05)'};border:1px solid ${newsLikes['h'+n.id]?'rgba(255,215,0,.4)':'rgba(255,255,255,.1)'};border-radius:20px;padding:4px 12px;cursor:pointer;color:${newsLikes['h'+n.id]?'#ffd700':'var(--mut)'};font-size:12px;font-family:'Cairo',sans-serif;transition:.2s;">
          ${newsLikes['h'+n.id]?'💛':'🤍'} <span>أحببته</span>
        </button>
      </div>
    </div>`;
  }).join('');
}

// إضافة خبر (أدمن)
async function adminAddNews() {
  const type = document.getElementById('news-type').value;
  const title = document.getElementById('news-title').value.trim();
  const body = document.getElementById('news-body').value.trim();
  const msg = document.getElementById('news-admin-msg');
  if(!title || !body) { msg.style.color='#f87171'; msg.textContent='❌ العنوان والمحتوى مطلوبان'; return; }
  try {
    const r = await fetch('/api/admin/news/add', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
      body: JSON.stringify({type, title, body, adminName: cu?.name, adminRank: cu?.rank})
    }).then(r=>r.json());
    if(r.ok) {
      msg.style.color='#4ade80'; msg.textContent='✅ تم النشر';
      document.getElementById('news-title').value='';
      document.getElementById('news-body').value='';
      loadAdminNews();
      setTimeout(()=>msg.textContent='',3000);
    } else { msg.style.color='#f87171'; msg.textContent='❌ '+r.msg; }
  } catch(e) { msg.style.color='#f87171'; msg.textContent='❌ خطأ في الاتصال'; }
}

async function loadAdminNews() {
  try {
    const r = await fetch('/api/admin/news', {
      headers:{'x-admin-token':'ghazal-admin-2024'}
    }).then(r=>r.json());
    const el = document.getElementById('news-admin-list');
    if(!el) return;
    if(!r.news || !r.news.length) {
      el.innerHTML='<div style="text-align:center;color:var(--mut);padding:20px;font-size:13px;">لا توجد أخبار</div>';
      return;
    }
    el.innerHTML = [...r.news].reverse().map((n,i) => `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(0,230,118,.15);border-radius:10px;padding:12px;display:flex;gap:10px;align-items:start;">
        <div style="flex:1;">
          <div style="font-size:12px;color:#00e676;margin-bottom:3px;">${n.type==='broadcast'?'📣 إعلان':n.type==='update'?'🚀 تحديث':'📰 خبر'} — ${n.time||''}</div>
          <div style="font-size:13px;font-weight:700;color:#fff;">${n.title}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:3px;">${(n.body||'').substring(0,80)}${n.body?.length>80?'...':''}</div>
        </div>
        <button onclick="adminDeleteNews(${n.id})" style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;flex-shrink:0;">🗑️</button>
      </div>
    `).join('');
  } catch(e) {}
}

async function adminDeleteNews(id) {
  await fetch('/api/admin/news/delete', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({id})
  });
  loadAdminNews();
}

// ========== نظام الرسائل الواردة ==========
function openInbox() {
  loadInbox(); // تحميل من localStorage عند كل فتح
  renderInboxList();
  // تحديد كل الرسائل كمقروءة وحفظ
  inboxItems.forEach(i=>i.read=true);
  saveInbox();
  updateInboxBadge();
  openM('inbox');
}

function closeInbox() {
  closeM('inbox');
}

function updateInboxBadge() {
  // عدد المحادثات غير المقروءة (مش عدد الرسائل)
  const convs = _buildConversations ? _buildConversations() : [];
  const unreadConvs = convs.filter(c=>c.unread>0).length;
  const unreadNotifs = inboxItems.filter(i=>i.type!=='pm'&&!i.read).length;
  const unread = unreadConvs + unreadNotifs;
  const badge = document.getElementById('inbox-badge');
  if(badge) {
    if(unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  }
  // تحديث شارة الرسائل في الشريط العلوي للموبايل
  ['topbar-inbox-badge','mob-inbox-badge2'].forEach(id => {
    const b = document.getElementById(id);
    if(b) { b.textContent = unread > 9 ? '9+' : unread; b.style.display = unread > 0 ? 'flex' : 'none'; }
  });
  updateMobMoreBadge();
}

function renderInboxList() {
  const el = document.getElementById('inbox-list');
  if(!el) return;

  const convs = _buildConversations();
  const notifs = _buildNotifications();

  if(!convs.length && !notifs.length) {
    el.innerHTML='<div style="text-align:center;color:var(--mut);padding:40px 20px;font-size:13px;"><div style="font-size:48px;margin-bottom:12px;">📭</div><div>لا توجد رسائل</div></div>';
    return;
  }

  let html = '';

  // ===== قسم المحادثات الخاصة (واتساب ستايل) =====
  if(convs.length) {
    html += '<div style="font-size:10px;font-weight:700;color:var(--gold);letter-spacing:2px;padding:4px 2px 8px;opacity:.8;">💬 المحادثات الخاصة</div>';
    convs.forEach(conv => {
      const last = conv.msgs[conv.msgs.length-1];
      const unread = conv.unread;
      const avatarLetter = (conv.from||'?')[0].toUpperCase();
      html += `
        <div onclick="closeInbox();openPM('${conv.from.replace(/'/g,"\'")}');"
          style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;cursor:pointer;transition:.18s;
          background:${unread?'rgba(100,200,255,.07)':'rgba(255,255,255,.02)'};
          border:1px solid ${unread?'rgba(100,200,255,.22)':'rgba(255,255,255,.06)'};
          margin-bottom:4px;"
          onmouseover="this.style.background='rgba(245,166,35,.08)';this.style.borderColor='rgba(245,166,35,.25)'"
          onmouseout="this.style.background='${unread?'rgba(100,200,255,.07)':'rgba(255,255,255,.02)'}';this.style.borderColor='${unread?'rgba(100,200,255,.22)':'rgba(255,255,255,.06)'}'">
          <!-- أفاتار دائري -->
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));
            display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#000;flex-shrink:0;">
            ${avatarLetter}
          </div>
          <!-- محتوى -->
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
              <span style="font-size:13px;font-weight:700;color:#fff;">${esc(conv.from)}</span>
              <span style="font-size:10px;color:var(--mut);">${last?.time||''}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12px;color:${unread?'rgba(255,255,255,.85)':'rgba(255,255,255,.45)'};
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;
                font-weight:${unread?600:400};">
                ${esc((last?.body||last?.text||'').substring(0,40))}
              </span>
              ${unread ? `<span style="min-width:20px;height:20px;border-radius:50%;background:#25d366;
                color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;
                justify-content:center;flex-shrink:0;margin-right:4px;">${unread>99?'99+':unread}</span>` : ''}
            </div>
          </div>
        </div>`;
    });
  }

  // ===== قسم الإشعارات والإعلانات =====
  if(notifs.length) {
    html += '<div style="font-size:10px;font-weight:700;color:var(--gold);letter-spacing:2px;padding:12px 2px 8px;opacity:.8;">📢 الإشعارات</div>';
    notifs.forEach(item => {
      html += `
        <div style="background:${item.read?'rgba(255,255,255,.02)':'rgba(100,200,255,.05)'};
          border:1px solid ${item.read?'rgba(255,255,255,.06)':'rgba(100,200,255,.2)'};
          border-radius:12px;padding:10px 12px;margin-bottom:4px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:18px;">${item.icon||'📩'}</span>
            <span style="font-size:12px;font-weight:700;color:#fff;flex:1;">${esc(item.title||'إشعار')}</span>
            <span style="font-size:10px;color:var(--mut);">${item.time||''}</span>
            ${!item.read?'<span style="width:7px;height:7px;border-radius:50%;background:#64c8ff;flex-shrink:0;"></span>':''}
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,.6);line-height:1.7;">${esc(item.body||'').substring(0,120)}</div>
          <button onclick="event.stopPropagation();deleteInboxItem(${item.id})"
            style="margin-top:6px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);
            color:#f87171;border-radius:6px;padding:2px 10px;cursor:pointer;font-size:10px;font-family:'Cairo',sans-serif;">
            🗑️ حذف
          </button>
        </div>`;
    });
  }

  el.innerHTML = html;
}

function deleteInboxItem(id) {
  inboxItems = inboxItems.filter(i => i.id !== id);
  saveInbox();
  updateInboxBadge();
  renderInboxList();
}

function deleteConvInbox(fromUser) {
  inboxItems = inboxItems.filter(i => !(i.type==='pm' && i.from===fromUser));
  saveInbox();
  updateInboxBadge();
  renderInboxList();
}

function markAllRead() {
  inboxItems.forEach(i=>i.read=true);
  saveInbox();
  updateInboxBadge();
  renderInboxList();
}

function clearAllInbox() {
  if(!confirm('هل تريد حذف كل الرسائل؟')) return;
  inboxItems = [];
  saveInbox();
  updateInboxBadge();
  renderInboxList();
}

// استقبال إعلان فوري عبر socket
socket.on('broadcast-msg', data => {
  const item = {
    id: Date.now(),
    icon: '📣',
    title: data.title || 'إعلان',
    body: data.body || '',
    from: data.from || 'الإدارة',
    time: data.time || new Date().toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit',hour12:true}),
    read: false,
    type: 'broadcast'
  };
  addToInbox(item);
  toast('📣 ' + item.title);
});

// استقبال خبر جديد
socket.on('new-news', data => {
  newsItems.push({...data, read: false});
  updateNewsBadge();
  toast('📰 خبر جديد: ' + data.title, 3000);
});

// ========== متجر الذهب ==========
async function loadShopItems() {
  try {
    const r = await fetch('/api/shop').then(r=>r.json());
    if(r.ok) shopItems = r.items || [];
  } catch(e) {}
}

function openGoldShop() {
  const gEl = document.getElementById('shop-my-gold');
  const dEl = document.getElementById('shop-my-diamond');
  if(gEl) gEl.textContent = myGold || 0;
  if(dEl) dEl.textContent = myDiamond || 0;
  renderShopItems();
  openM('goldshop');
}

function renderShopItems() {
  const el = document.getElementById('goldshop-items');
  if(!el) return;
  if(!shopItems.length) {
    el.innerHTML='<div style="text-align:center;color:var(--mut);grid-column:1/-1;padding:20px;font-size:13px;">المتجر فارغ حالياً</div>';
    return;
  }
  el.innerHTML = shopItems.map(item => `
    <div class="shop-card" onclick="buyShopItem(${item.id},'${item.name.replace(/'/g,"\\'")}')">
      <div style="font-size:36px;margin-bottom:8px;">${item.icon||'💰'}</div>
      <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;">${item.name}</div>
      ${item.gold>0?`<div style="font-size:12px;color:#ffd700;">💰 ${item.gold} ذهب</div>`:''}
      ${item.diamond>0?`<div style="font-size:12px;color:#64c8ff;">💎 ${item.diamond} ماس</div>`:''}
      ${item.desc?`<div style="font-size:11px;color:var(--mut);margin-top:4px;">${item.desc}</div>`:''}
      <div style="margin-top:10px;background:linear-gradient(135deg,#ff8c00,#ffd700);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;color:#000;">${item.price||'اتصل بنا'}</div>
    </div>
  `).join('');
}

async function buyShopItem(itemId, itemName) {
  if(!cu || cu.rank==='visitor') { toast('❌ يجب تسجيل الدخول أولاً'); return; }
  if(!confirm(`هل تريد طلب شراء "${itemName}"؟\nسيتم إرسال طلبك للإدارة.`)) return;
  try {
    const r = await fetch('/api/shop/buy', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({itemId, username: cu.name})
    }).then(r=>r.json());
    if(r.ok) {
      toast('✅ تم إرسال طلبك! ستتواصل معك الإدارة قريباً', 4000);
      closeM('goldshop');
    } else { toast('❌ '+(r.msg||'حدث خطأ')); }
  } catch(e) { toast('❌ خطأ في الاتصال'); }
}

// أدمن: إضافة عنصر للمتجر
async function adminAddShopItem() {
  const name = document.getElementById('shop-item-name').value.trim();
  const icon = document.getElementById('shop-item-icon').value.trim() || '💰';
  const gold = parseInt(document.getElementById('shop-item-gold').value)||0;
  const diamond = parseInt(document.getElementById('shop-item-diamond').value)||0;
  const desc = document.getElementById('shop-item-desc').value.trim();
  const price = document.getElementById('shop-item-price').value.trim();
  const msg = document.getElementById('shop-admin-msg');
  if(!name) { msg.style.color='#f87171'; msg.textContent='❌ اسم العنصر مطلوب'; return; }
  try {
    const r = await fetch('/api/admin/shop/add', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
      body: JSON.stringify({name, icon, gold, diamond, desc, price, adminName: cu?.name})
    }).then(r=>r.json());
    if(r.ok) {
      msg.style.color='#4ade80'; msg.textContent='✅ تمت الإضافة';
      ['shop-item-name','shop-item-icon','shop-item-gold','shop-item-diamond','shop-item-desc','shop-item-price'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.value='';
      });
      loadAdminShop();
      loadShopItems();
      setTimeout(()=>msg.textContent='',3000);
    } else { msg.style.color='#f87171'; msg.textContent='❌ '+r.msg; }
  } catch(e) { msg.style.color='#f87171'; msg.textContent='❌ خطأ'; }
}

async function loadAdminShop() {
  try {
    const r = await fetch('/api/admin/shop', {
      headers:{'x-admin-token':'ghazal-admin-2024'}
    }).then(r=>r.json());

    // رسم عناصر المتجر
    const el = document.getElementById('shop-items-admin');
    if(el) {
      if(!r.items||!r.items.length) {
        el.innerHTML='<div style="text-align:center;color:var(--mut);grid-column:1/-1;padding:20px;font-size:13px;">المتجر فارغ</div>';
      } else {
        el.innerHTML = r.items.map(item=>`
          <div style="background:rgba(255,140,0,.05);border:1px solid rgba(255,140,0,.2);border-radius:10px;padding:12px;display:flex;gap:10px;align-items:center;">
            <span style="font-size:24px;">${item.icon||'💰'}</span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;color:#fff;">${item.name}</div>
              <div style="font-size:11px;color:var(--mut);">${item.gold?'💰'+item.gold:''} ${item.diamond?'💎'+item.diamond:''} — ${item.price||'بلا سعر'}</div>
            </div>
            <button onclick="adminDeleteShopItem(${item.id})" style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px;">🗑️</button>
          </div>
        `).join('');
      }
    }

    // رسم الطلبات
    const ordEl = document.getElementById('shop-orders-list');
    if(ordEl) {
      const pending = (r.orders||[]).filter(o=>!o.done);
      if(!pending.length) {
        ordEl.innerHTML='<div style="text-align:center;color:var(--mut);padding:14px;font-size:12px;">لا توجد طلبات معلقة</div>';
      } else {
        ordEl.innerHTML = pending.map(o=>`
          <div style="background:rgba(255,215,0,.05);border:1px solid rgba(255,215,0,.2);border-radius:10px;padding:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;color:#ffd700;">${o.username}</div>
              <div style="font-size:12px;color:var(--mut);">طلب: ${o.itemName} — ${o.time||''}</div>
            </div>
            <button onclick="adminApproveOrder(${o.id},'${o.username}',${o.itemGold||0},${o.itemDiamond||0})" style="background:rgba(0,230,118,.15);border:1px solid rgba(0,230,118,.3);color:#4ade80;border-radius:8px;padding:5px 12px;cursor:pointer;font-size:12px;">✅ تأكيد وإضافة الذهب</button>
          </div>
        `).join('');
      }
    }
  } catch(e) {}
}

async function adminDeleteShopItem(id) {
  if(!confirm('حذف هذا العنصر؟')) return;
  await fetch('/api/admin/shop/delete', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({id})
  });
  loadAdminShop(); loadShopItems();
}

async function adminApproveOrder(orderId, username, gold, diamond) {
  // أضف الذهب للمستخدم
  if(gold > 0 || diamond > 0) {
    await fetch('/api/admin/gold/set', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
      body: JSON.stringify({username, gold, diamond, adminName: cu?.name, adminRank: cu?.rank})
    });
  }
  // أغلق الطلب
  await fetch('/api/admin/shop/order-done', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-admin-token':'ghazal-admin-2024'},
    body: JSON.stringify({orderId})
  });
  toast(`✅ تم إضافة الذهب لـ ${username}`);
  loadAdminShop();
}

// ===== GOLD & DIAMOND SYSTEM =====
let myGold = 0, myDiamond = 0, callCostCfg = {voice:10, video:20};

socket.on('gold-updated', d => {
  myGold = d.gold || 0;
  myDiamond = d.diamond || 0;
  updateGoldDisplay();
});

socket.on('call-no-gold', d => {
  const type = d.type === 'video' ? 'مرئية' : 'صوتية';
  document.getElementById('nogold-msg').innerHTML =
    `لإجراء مكالمة ${type} تحتاج <b style="color:#ffd700">${d.required} 🪙 ذهب</b><br>رصيدك الحالي: <b>${d.have} 🪙</b><br><br>أرسل رسائل أكثر لكسب الذهب!`;
  openM('nogold');
});

socket.on('call-cost-updated', cfg => { callCostCfg = cfg; });

function showGoldModal() {
  updateGoldDisplay();
  openM('gold');
}

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
let _pendingYtId = null;
function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function detectYouTube(val) {
  const ytId = getYouTubeId(val);
  const bar = document.getElementById('yt-preview-bar');
  if (ytId) {
    _pendingYtId = ytId;
    document.getElementById('yt-preview-title').textContent = '▶ رابط يوتيوب — اضغط إرسال لمشاركته';
    if (bar) bar.style.display = 'flex';
  } else {
    _pendingYtId = null;
    if (bar) bar.style.display = 'none';
  }
}
function sendYouTubeMsg() {
  if (!_pendingYtId || !cu) return;
  socket.emit('chat-youtube', { ytId: _pendingYtId });
  document.getElementById('min').value = '';
  _pendingYtId = null;
  document.getElementById('yt-preview-bar').style.display = 'none';
}
function cancelYouTube() {
  _pendingYtId = null;
  document.getElementById('min').value = '';
  document.getElementById('yt-preview-bar').style.display = 'none';
}
socket.on('youtube-message', m => { if(m.room===cr) renderMsg(m); });
// ===== END YOUTUBE IN CHAT =====

// ===== CHAT IMAGE SEND =====
function sendChatImage(event) {
  const file = event.target.files[0];
  if (!file || !cu) return;
  if (file.size > 3 * 1024 * 1024) { toast('❌ الصورة كبيرة جداً (الحد 3MB)', 'e'); return; }
  const isGif = file.type === 'image/gif';
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target.result;
    // Send as temporary message (not stored on server)
    socket.emit('chat-image', { imageData: data, imageType: isGif ? 'gif' : 'image' });
    toast('✅ تم إرسال الصورة', 'k');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}
function openImgFull(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:pointer;';
  overlay.onclick = () => overlay.remove();
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:12px;object-fit:contain;';
  overlay.appendChild(img);
  document.body.appendChild(overlay);
}
socket.on('chat-image-msg', m => { if(m.room===cr) renderMsg(m); });
// ===== END CHAT IMAGE =====

// ===== NAME STYLE IN USER LIST =====
// Listen for ranks-updated event
socket.on('ranks-updated', updatedRanks => {
  Object.assign(RK_LABEL, Object.fromEntries(Object.entries(updatedRanks).map(([k,v])=>[k,v.label])));
  renderRooms();
});

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

let _selectedEmoji = null;
let _selectedRank = null; // الرتبة المحددة حالياً

function selectEmoji(e) {
  _selectedEmoji = e;
  // تمييز الأيقونة المختارة بصرياً
  document.querySelectorAll('.rank-emoji-quick-btn').forEach(el => {
    const isSelected = el.dataset.emoji === e;
    el.style.background = isSelected ? 'rgba(255,215,0,.25)' : '';
    el.style.outline = isSelected ? '2px solid #ffd700' : '';
  });
  // إذا كانت هناك رتبة محددة، نطبق عليها مباشرة
  if (_selectedRank) {
    const iconInput = document.getElementById('icon-' + _selectedRank);
    const preview = document.getElementById('preview-' + _selectedRank);
    if (iconInput) iconInput.value = e;
    if (preview) preview.textContent = e;
    toast(`✅ تم تطبيق ${e} على الرتبة — اضغط حفظ`, 'k');
  } else {
    toast(`✅ تم اختيار ${e} — انقر على صف الرتبة لتطبيقه`, 'k');
  }
}

function selectRankRow(rk) {
  _selectedRank = rk;
  // تمييز الصف المحدد
  document.querySelectorAll('.rank-edit-row').forEach(el => {
    el.style.background = el.dataset.rank === rk ? 'rgba(255,215,0,.08)' : '';
    el.style.border = el.dataset.rank === rk ? '1px solid rgba(255,215,0,.3)' : '1px solid rgba(255,255,255,.06)';
  });
  // إذا كان هناك إيموجي محدد نطبقه
  if (_selectedEmoji) {
    const iconInput = document.getElementById('icon-' + rk);
    const preview = document.getElementById('preview-' + rk);
    if (iconInput) iconInput.value = _selectedEmoji;
    if (preview) preview.textContent = _selectedEmoji;
  }
}

function applyEmojiToRow(rk) {
  selectRankRow(rk);
  if (!_selectedEmoji) { toast('⚠️ اختر إيموجي أولاً من القائمة أعلاه', 'e'); return; }
  const iconInput = document.getElementById('icon-'+rk);
  const preview = document.getElementById('preview-'+rk);
  if (iconInput) iconInput.value = _selectedEmoji;
  if (preview) preview.textContent = _selectedEmoji;
  toast(`✅ تم تطبيق ${_selectedEmoji} — اضغط حفظ`, 'k');
}

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


// ============================================================
// ====== نظام اليوميات ========================================
// ============================================================
let _diaryPosts = [];

function openDiary(viewUser) {
  loadDiaryPosts(viewUser || cu?.name);
  openM('diary');
  showDiaryTab('wall');
}

function showDiaryTab(tab) {
  const wall = document.getElementById('diary-wall');
  const write = document.getElementById('diary-write');
  if(wall) wall.style.display = tab === 'wall' ? 'flex' : 'none';
  if(write) write.style.display = tab === 'write' ? 'flex' : 'none';
  if(wall) wall.style.flexDirection = 'column';
  if(write) write.style.flexDirection = 'column';
  ['wall','write'].forEach(t => {
    const btn = document.getElementById('diary-tab-' + t);
    if (!btn) return;
    if (t === tab) {
      btn.style.background = 'rgba(255,215,0,.15)';
      btn.style.borderColor = 'rgba(255,215,0,.35)';
      btn.style.color = '#ffd166';
    } else {
      btn.style.background = 'rgba(255,255,255,.08)';
      btn.style.borderColor = 'rgba(255,255,255,.15)';
      btn.style.color = '#fff';
    }
  });
}

function loadDiaryPosts(author) {
  const target = author || cu?.name;
  const saved = localStorage.getItem('diary_' + target);
  _diaryPosts = saved ? JSON.parse(saved) : [];
  renderDiaryPosts(target);
}

function renderDiaryPosts(author) {
  const list = document.getElementById('diary-posts-list');
  if (!list) return;
  const myName = cu?.name;
  const isOwn = author === myName;
  const visible = _diaryPosts.filter(p => {
    if (isOwn) return true;
    if (p.privacy === 'private') return false;
    return true;
  }).sort((a,b) => (b.ts||0) - (a.ts||0));

  if (!visible.length) {
    list.innerHTML = '<div style="text-align:center;color:var(--mut);padding:40px;"><div style="font-size:40px;margin-bottom:10px;">📭</div>لا توجد يوميات بعد</div>';
    return;
  }
  list.innerHTML = '';
  visible.forEach(p => {
    const privIcon = p.privacy === 'private' ? '🔒' : p.privacy === 'friends' ? '👥' : '🌍';
    const div = document.createElement('div');
    div.style.cssText = 'background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 16px;margin-bottom:10px;';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#fff;">${esc(p.title||'بلا عنوان')}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:3px;">${privIcon} ${p.time||''} — ${esc(p.author||'')}</div>
        </div>
        ${isOwn ? `<button onclick="deleteDiaryPost('${p.id}')" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#f87171;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-family:'Cairo',sans-serif;">🗑️</button>` : ''}
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.8;white-space:pre-wrap;">${esc(p.body||'')}</div>`;
    list.appendChild(div);
  });
}

function submitDiaryPost() {
  const title = document.getElementById('diary-title-inp')?.value?.trim();
  const body = document.getElementById('diary-body-inp')?.value?.trim();
  const privacy = document.getElementById('diary-privacy')?.value || 'public';
  if (!body) { toast('⚠️ اكتب محتوى اليومية', 'e'); return; }
  const post = {
    id: 'dp_' + Date.now(),
    author: cu?.name || 'مجهول',
    title: title || 'يومية جديدة',
    body, privacy,
    time: new Date().toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',hour12:false}),
    ts: Date.now()
  };
  _diaryPosts.unshift(post);
  localStorage.setItem('diary_' + cu.name, JSON.stringify(_diaryPosts.slice(0, 200)));
  document.getElementById('diary-title-inp').value = '';
  document.getElementById('diary-body-inp').value = '';
  toast('✅ تم نشر اليومية', 'k');
  showDiaryTab('wall');
  renderDiaryPosts(cu.name);
}

function deleteDiaryPost(id) {
  if (!confirm('حذف هذه اليومية؟')) return;
  _diaryPosts = _diaryPosts.filter(p => p.id !== id);
  localStorage.setItem('diary_' + cu?.name, JSON.stringify(_diaryPosts));
  renderDiaryPosts(cu?.name);
  toast('🗑️ تم الحذف', 'k');
}

// ============================================================
// ====== تبويبات upanel (المتصلون / الأصدقاء) ================
// ============================================================
let _upanelMode = 'online';

function switchUPanel(tab) {
  _upanelMode = tab;
  const ulist   = document.getElementById('ulist');
  const ucbar   = document.querySelector('.ucbar');
  const srchBar = document.querySelector('.upanel-search-bar');
  const friendsEl = document.getElementById('upanel-friends-list');

  ['online','friends'].forEach(t => {
    const btn = document.getElementById('utab-' + t);
    if (btn) {
      if (t === tab) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  if (tab === 'online') {
    if (ulist)   ulist.style.display   = '';
    if (ucbar)   ucbar.style.display   = '';
    if (srchBar) srchBar.style.display = '';
    if (friendsEl) friendsEl.classList.remove('active');
    upanelSearch('');
    const inp = document.getElementById('upanel-search');
    if (inp) inp.value = '';
  } else {
    if (ulist)   ulist.style.display   = 'none';
    if (ucbar)   ucbar.style.display   = 'none';
    if (srchBar) srchBar.style.display = 'none';
    if (friendsEl) friendsEl.classList.add('active');
    renderUpanelFriends();
  }
}

function renderUpanelFriends() {
  // تستخدم _friendsList من نظام الصداقة الجديد في chat.js
  const list = (typeof _friendsList !== 'undefined') ? _friendsList : [];
  const el = document.getElementById('upanel-friends-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--mut);font-size:12px;"><div style="font-size:32px;margin-bottom:8px;">👥</div>قائمة أصدقائك فارغة<br><span style="font-size:10px;">اضغط على اسم عضو واختر إضافة صديق</span></div>';
    const badge = document.getElementById('upf-badge');
    if (badge) badge.style.display = 'none';
    return;
  }
  el.innerHTML = '';
  list.forEach(f => {
    const name = f.username || f;
    const isOnline = !!document.querySelector(`[data-uname="${name}"]`);
    const div = document.createElement('div');
    div.onclick = () => openPM(name);
    div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-radius:8px;transition:.15s;';
    div.onmouseenter = function(){ this.style.background='rgba(255,255,255,.05)'; };
    div.onmouseleave = function(){ this.style.background=''; };
    div.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#000;flex-shrink:0;">${(name[0]||'?').toUpperCase()}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(name)}</div>
        <div style="font-size:10px;color:${isOnline?'#69f0ae':'#90a4ae'};">${isOnline?'● متصل':'● غائب'}</div>
      </div>`;
    el.appendChild(div);
  });
  const badge = document.getElementById('upf-badge');
  if (badge) { badge.textContent = list.length; badge.style.display = list.length ? 'inline' : 'none'; }
}

function upanelSearch(q) {
  const ulist = document.getElementById('ulist');
  if (!ulist) return;
  q = (q || '').trim().toLowerCase();
  ulist.querySelectorAll('.ui').forEach(item => {
    const nm = (item.dataset.uname || item.textContent || '').toLowerCase();
    item.style.display = (!q || nm.includes(q)) ? '' : 'none';
  });
}
