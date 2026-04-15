// STARS
const sc=document.getElementById('stars');
for(let i=0;i<90;i++){const s=document.createElement('div');s.className='star';const sz=Math.random()*2+.5;s.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-duration:${Math.random()*4+2}s;animation-delay:${Math.random()*6}s;`;sc.appendChild(s);}

// ===== GLOBAL UTILITY FUNCTIONS =====
function esc(t){return(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

const socket = (typeof io !== 'undefined') ? io() : {on:function(){},emit:function(){},off:function(){},connected:false};
const AK='ghazal-admin-2024';
const AVC=['#1565c0','#c62828','#6a1b9a','#2e7d32','#e65100','#00838f','#ad1457','#4527a0'];
const RC={general:'linear-gradient(135deg,#1565c0,#0d47a1)',iraq:'linear-gradient(135deg,#c62828,#b71c1c)',youth:'linear-gradient(135deg,#e65100,#bf360c)',feelings:'linear-gradient(135deg,#c2185b,#880e4f)',music:'linear-gradient(135deg,#6a1b9a,#4a148c)',fun:'linear-gradient(135deg,#f57f17,#e65100)',competitions:'linear-gradient(135deg,#f9a825,#e65100)',admin_meeting:'linear-gradient(135deg,#6a0dad,#4a0080)'};
const RK_COLOR={ghost:'#ff4444',owner:'#ff4444',owner_admin:'#ff8c00',owner_vip:'#ffd700',super_admin:'#b044ff',admin:'#00bfff',premium:'#00e5ff',vip:'#ce93d8',gold:'#ffc107',member:'#90caf9',visitor:'#b0bec5'};
const RK_LABEL={ghost:'👑 مالك',owner:'👑 مالك',owner_admin:'💼 أونر إداري',owner_vip:'⭐ أونر',super_admin:'🔱 سوبر أدمن',admin:'⚙️ أدمن',premium:'💎 بريميوم',vip:'🌟 عضو مميز',gold:'🥇 عضو ذهبي',member:'👤 عضو مسجل',visitor:'👁️ زائر'};
const RK_SIZE={ghost:'22px',owner:'22px',owner_admin:'20px',owner_vip:'19px',super_admin:'18px',admin:'17px',premium:'16px',vip:'16px',gold:'15px',member:'14px',visitor:'13px'};
const RK_WEIGHT={ghost:'900',owner:'900',owner_admin:'800',owner_vip:'700',super_admin:'700',admin:'700',premium:'600',vip:'600',gold:'500',member:'400',visitor:'400'};
const RK_GLOW={ghost:'0 0 10px #ff4444',owner:'0 0 10px #ff4444',owner_admin:'0 0 8px #ff8c00',owner_vip:'0 0 8px #ffd700',super_admin:'0 0 6px #b044ff',admin:'0 0 5px #00bfff'};
const ADMIN_RANKS=['owner','owner_admin','owner_vip','super_admin','admin'];

// ===== DYNAMIC PERMISSIONS SYSTEM =====
const ALL_PERMISSIONS = [
  {key:'can_mute',label:'🔇 كتم الأعضاء',desc:'يستطيع كتم أي عضو في الغرفة'},
  {key:'can_unmute',label:'🔊 رفع الكتم',desc:'يستطيع رفع الكتم عن الأعضاء'},
  {key:'can_kick',label:'🚫 طرد من الغرفة',desc:'يستطيع طرد عضو من الغرفة'},
  {key:'can_ban',label:'⛔ حظر نهائي',desc:'يستطيع حظر عضو بشكل نهائي'},
  {key:'can_unban',label:'✅ رفع الحظر',desc:'يستطيع رفع الحظر عن عضو'},
  {key:'can_change_rank',label:'🏅 تغيير الرتب',desc:'يستطيع تغيير رتبة الأعضاء'},
  {key:'can_clear_room',label:'🗑️ مسح الغرفة',desc:'يستطيع مسح رسائل الغرفة'},
  {key:'can_add_room',label:'🏠 إضافة غرفة',desc:'يستطيع إضافة غرف جديدة'},
  {key:'can_delete_room',label:'❌ حذف غرفة',desc:'يستطيع حذف الغرف'},
  {key:'can_manage_words',label:'🚷 إدارة الكلمات',desc:'يستطيع إضافة/حذف الكلمات الممنوعة'},
  {key:'can_reset_pass',label:'🔑 إعادة تعيين كلمة المرور',desc:'يستطيع إعادة تعيين كلمة مرور الأعضاء'},
  {key:'can_manage_quiz',label:'🏆 إدارة المسابقات',desc:'يستطيع إضافة/حذف أسئلة المسابقات'},
  {key:'can_view_admin_panel',label:'👁️ فتح لوحة التحكم',desc:'يستطيع الدخول للوحة التحكم'},
  {key:'can_send_broadcast',label:'📢 إرسال إعلان عام',desc:'يستطيع إرسال رسائل لجميع الغرف'},
  {key:'can_delete_messages',label:'🗑️ حذف رسائل الآخرين',desc:'يستطيع حذف رسائل أي عضو'},
  {key:'can_custom_text_color',label:'🎨 تغيير لون الخط',desc:'يستطيع اختيار لون مخصص لنصوص رسائله'},
  {key:'can_use_name_frame',label:'🖼️ إطار اسم مميز',desc:'يستطيع اختيار براويز جميلة لاسمه في الشات'},
  {key:'can_change_username',label:'✏️ تغيير الاسم',desc:'يستطيع تغيير اسمه من الملف الشخصي أو لوحة التحكم'},
  {key:'can_create_rank',label:'⚡ إنشاء رتبة جديدة',desc:'صلاحية حصرية للمالك فقط — إنشاء رتب مخصصة'},
];

// Default permissions per rank
const DEFAULT_PERMS = {
  ghost:       {can_mute:true,can_unmute:true,can_kick:true,can_ban:true,can_unban:true,can_change_rank:true,can_clear_room:true,can_add_room:true,can_delete_room:true,can_manage_words:true,can_reset_pass:true,can_manage_quiz:true,can_view_admin_panel:true,can_send_broadcast:true,can_delete_messages:true,can_custom_text_color:true,can_use_name_frame:true,can_change_username:true,can_create_rank:true},
  owner:       {can_mute:true,can_unmute:true,can_kick:true,can_ban:true,can_unban:true,can_change_rank:true,can_clear_room:true,can_add_room:true,can_delete_room:true,can_manage_words:true,can_reset_pass:true,can_manage_quiz:true,can_view_admin_panel:true,can_send_broadcast:true,can_delete_messages:true,can_custom_text_color:true,can_use_name_frame:true,can_change_username:true,can_create_rank:true},
  owner_admin: {can_mute:true,can_unmute:true,can_kick:true,can_ban:true,can_unban:true,can_change_rank:true,can_clear_room:true,can_add_room:true,can_delete_room:false,can_manage_words:true,can_reset_pass:true,can_manage_quiz:true,can_view_admin_panel:true,can_send_broadcast:true,can_delete_messages:true,can_custom_text_color:true,can_use_name_frame:true,can_change_username:true,can_create_rank:false},
  owner_vip:   {can_mute:true,can_unmute:true,can_kick:true,can_ban:false,can_unban:false,can_change_rank:false,can_clear_room:true,can_add_room:false,can_delete_room:false,can_manage_words:false,can_reset_pass:false,can_manage_quiz:false,can_view_admin_panel:true,can_send_broadcast:false,can_delete_messages:true,can_custom_text_color:true,can_use_name_frame:true,can_change_username:true,can_create_rank:false},
  super_admin: {can_mute:true,can_unmute:true,can_kick:true,can_ban:true,can_unban:true,can_change_rank:true,can_clear_room:true,can_add_room:true,can_delete_room:false,can_manage_words:true,can_reset_pass:true,can_manage_quiz:true,can_view_admin_panel:true,can_send_broadcast:true,can_delete_messages:true,can_custom_text_color:true,can_use_name_frame:true,can_change_username:true,can_create_rank:false},
  admin:       {can_mute:true,can_unmute:true,can_kick:true,can_ban:false,can_unban:false,can_change_rank:false,can_clear_room:true,can_add_room:false,can_delete_room:false,can_manage_words:false,can_reset_pass:false,can_manage_quiz:false,can_view_admin_panel:true,can_send_broadcast:false,can_delete_messages:true,can_custom_text_color:true,can_use_name_frame:true,can_change_username:true,can_create_rank:false},
  premium:     {can_mute:false,can_unmute:false,can_kick:false,can_ban:false,can_unban:false,can_change_rank:false,can_clear_room:false,can_add_room:false,can_delete_room:false,can_manage_words:false,can_reset_pass:false,can_manage_quiz:false,can_view_admin_panel:false,can_send_broadcast:false,can_delete_messages:false,can_custom_text_color:true,can_use_name_frame:true,can_change_username:true,can_create_rank:false},
  vip:         {can_mute:false,can_unmute:false,can_kick:false,can_ban:false,can_unban:false,can_change_rank:false,can_clear_room:false,can_add_room:false,can_delete_room:false,can_manage_words:false,can_reset_pass:false,can_manage_quiz:false,can_view_admin_panel:false,can_send_broadcast:false,can_delete_messages:false,can_custom_text_color:false,can_use_name_frame:true,can_change_username:false,can_create_rank:false},
  gold:        {can_mute:false,can_unmute:false,can_kick:false,can_ban:false,can_unban:false,can_change_rank:false,can_clear_room:false,can_add_room:false,can_delete_room:false,can_manage_words:false,can_reset_pass:false,can_manage_quiz:false,can_view_admin_panel:false,can_send_broadcast:false,can_delete_messages:false,can_custom_text_color:false,can_use_name_frame:false,can_change_username:false,can_create_rank:false},
  member:      {can_mute:false,can_unmute:false,can_kick:false,can_ban:false,can_unban:false,can_change_rank:false,can_clear_room:false,can_add_room:false,can_delete_room:false,can_manage_words:false,can_reset_pass:false,can_manage_quiz:false,can_view_admin_panel:false,can_send_broadcast:false,can_delete_messages:false,can_custom_text_color:false,can_use_name_frame:false,can_change_username:false,can_create_rank:false},
  visitor:     {can_mute:false,can_unmute:false,can_kick:false,can_ban:false,can_unban:false,can_change_rank:false,can_clear_room:false,can_add_room:false,can_delete_room:false,can_manage_words:false,can_reset_pass:false,can_manage_quiz:false,can_view_admin_panel:false,can_send_broadcast:false,can_delete_messages:false,can_custom_text_color:false,can_use_name_frame:false,can_change_username:false,can_create_rank:false},
};

// Load saved permissions from localStorage or use defaults
let _rankPerms = JSON.parse(localStorage.getItem('ghazal_rank_perms')||'null') || JSON.parse(JSON.stringify(DEFAULT_PERMS));
// Always ensure ghost has full permissions (override localStorage if needed)
_rankPerms['ghost'] = DEFAULT_PERMS['ghost'];

function hasPerm(permKey){ 
  if(cu?.rank === 'ghost') return true; // ghost has all permissions
  return !!(_rankPerms[cu?.rank]?.[permKey]); 
}
function saveRankPerms(){ try{localStorage.setItem('ghazal_rank_perms',JSON.stringify(_rankPerms));}catch(e){} }
// ===== END PERMISSIONS =====

// ===== THEME SYSTEM =====
const THEMES = ['gold','classic','lite'];
let _currentTheme = localStorage.getItem('ghazal_theme') || 'gold';
function applyTheme(t) {
  if (!THEMES.includes(t)) t = 'gold';
  _currentTheme = t;
  document.body.classList.remove(...THEMES.map(x => 'theme-' + x));
  if (t !== 'gold') document.body.classList.add('theme-' + t);
  try { localStorage.setItem('ghazal_theme', t); } catch(e) {}
  THEMES.forEach(th => {
    const el = document.getElementById('topt-' + th);
    if (el) el.classList.toggle('active', th === t);
  });
}
function openThemePicker() {
  document.getElementById('theme-picker-ov').classList.add('on');
}
function toggleTheme() {
  const idx = THEMES.indexOf(_currentTheme);
  applyTheme(THEMES[(idx + 1) % THEMES.length]);
}
applyTheme(_currentTheme);
function upOC(n) {
  document.getElementById('oc').textContent = n;
  document.getElementById('co').textContent = n;
  const oc2 = document.getElementById('oc2');
  if (oc2) oc2.textContent = n;
}

// ===== OWNER NAME (always shown in user list) =====
window._ownerName = null;
async function loadOwnerName(){
  try{
    const r=await fetch('/api/admin/users',{headers:{'x-admin-token':AK}});
    const d=await r.json();
    if(d.ok && d.users){
      const own=d.users.find(u=>u.rank==='owner');
      if(own) window._ownerName=own.username;
    }
  }catch(e){}
}
// Load owner name on startup
setTimeout(loadOwnerName, 2000);

