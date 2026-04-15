// ===== NAME FRAMES & TEXT COLOR =====
const NAME_FRAMES = [
  {key:'none',     label:'بدون إطار',      preview:'اسمك', icon:'✖️'},
  {key:'gold',     label:'🥇 ذهبي',        preview:'اسمك', icon:'🥇'},
  {key:'fire',     label:'🔥 ناري',        preview:'اسمك', icon:'🔥'},
  {key:'ice',      label:'❄️ جليدي',      preview:'اسمك', icon:'❄️'},
  {key:'galaxy',   label:'🌌 مجرة',       preview:'اسمك', icon:'🌌'},
  {key:'rose',     label:'🌹 وردي',       preview:'اسمك', icon:'🌹'},
  {key:'emerald',  label:'💚 زمردي',      preview:'اسمك', icon:'💚'},
  {key:'royal',    label:'👑 ملكي',       preview:'اسمك', icon:'👑'},
  {key:'neon',     label:'⚡ نيون',        preview:'اسمك', icon:'⚡'},
  {key:'plasma',   label:'🔮 بلازما',     preview:'اسمك', icon:'🔮'},
  {key:'silver',   label:'🩶 فضي',        preview:'اسمك', icon:'🩶'},
  {key:'ocean',    label:'🌊 أزرق محيط',  preview:'اسمك', icon:'🌊'},
  {key:'sunset',   label:'🌅 غروب',       preview:'اسمك', icon:'🌅'},
  {key:'purple',   label:'💜 بنفسجي',     preview:'اسمك', icon:'💜'},
  {key:'red',      label:'❤️ أحمر',       preview:'اسمك', icon:'❤️'},
  {key:'cyan',     label:'🩵 سماوي',      preview:'اسمك', icon:'🩵'},
  {key:'hearts',   label:'💗 قلوب طائرة', preview:'اسمك', icon:'💗', animated:true},
  {key:'flowers',  label:'🌸 زهور طائرة', preview:'اسمك', icon:'🌸', animated:true},
  {key:'stars',    label:'⭐ نجوم طائرة', preview:'اسمك', icon:'⭐', animated:true},
  {key:'glow',     label:'✨ توهج',        preview:'اسمك', icon:'✨', animated:true},
  {key:'rainbow',  label:'🌈 قوس قزح',   preview:'اسمك', icon:'🌈', animated:true},
  {key:'diamond',  label:'💎 ماسي',       preview:'اسمك', icon:'💎', animated:true},
  {key:'crown',    label:'🔱 تاج ذهبي',  preview:'اسمك', icon:'🔱'},
  {key:'snow',     label:'❄️ ثلج متساقط', preview:'اسمك', icon:'☃️', animated:true},
  {key:'money',    label:'💰 مال طائر',   preview:'اسمك', icon:'💰', animated:true},
  {key:'lightning',label:'⚡ صواعق',      preview:'اسمك', icon:'⚡', animated:true},
  {key:'butterfly',label:'🦋 فراشات',     preview:'اسمك', icon:'🦋', animated:true},
  {key:'music',    label:'🎵 موسيقى',     preview:'اسمك', icon:'🎵', animated:true},
  {key:'fire2',    label:'🔥 نار متقدة',  preview:'اسمك', icon:'🕯️', animated:true},
];

// User display prefs (saved locally per user)
let _userPrefs = JSON.parse(localStorage.getItem('ghazal_user_prefs')||'{}');
// {textColor: '#ff0000', nameFrame: 'fire'}

function getUserPref(k){ return _userPrefs[k]||null; }
function setUserPref(k,v){ _userPrefs[k]=v; try{localStorage.setItem('ghazal_user_prefs',JSON.stringify(_userPrefs));}catch(e){} }

function getNameFrameClass(frame){ return frame&&frame!=='none'?`nf-${frame}`:''; }
function getNameFrameWrap(frame){ return frame&&frame!=='none'?`nfw-${frame}`:''; }

// Animated particle emitter for hearts/flowers/stars frames
const FRAME_PARTICLES = {
  hearts:    ['💗','💕','❤️','💖'],
  flowers:   ['🌸','🌺','🌼','🌷'],
  stars:     ['⭐','✨','💫','🌟'],
  snow:      ['❄️','🌨️','⛄','❄'],
  money:     ['💰','💵','💎','🪙'],
  butterfly: ['🦋','🌺','🌸','🌼'],
  fire2:     ['🔥','✨','💥','🕯️'],
  music:     ['🎵','🎶','🎼','🎸'],
};
function spawnParticle(el, frame) {
  const particles = FRAME_PARTICLES[frame];
  if (!particles || !el) return;
  const p = document.createElement('span');
  p.className = 'nf-particle';
  p.textContent = particles[Math.floor(Math.random()*particles.length)];
  p.style.left = (Math.random()*100)+'%';
  p.style.animationDuration = (1+Math.random())+'s';
  p.style.animationDelay = (Math.random()*0.5)+'s';
  el.appendChild(p);
  setTimeout(()=>p.remove(), 2000);
}
// Start particle intervals for animated frames in DOM
function startParticles() {
  clearInterval(window._particleInterval);
  window._particleInterval = setInterval(()=>{
    document.querySelectorAll('[data-frame]').forEach(el=>{
      const f = el.dataset.frame;
      if (FRAME_PARTICLES[f]) spawnParticle(el, f);
    });
  }, 800);
}
startParticles();
