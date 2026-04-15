// ========== نظام الإيموجي الديناميكي ==========
// يقرأ الإيموجي من /emojis/config.json
// لإضافة إيموجي جديد: أضفه في config.json فقط بدون تعديل الكود

let EMOJIS = {};
let EMOJI_CATS = [];
let currentCat = 'faces';
let _emojiLoaded = false;

// تحميل الإيموجي من config.json
async function loadEmojiConfig() {
  try {
    const res = await fetch('/emojis/config.json?v=' + Date.now());
    const data = await res.json();

    EMOJI_CATS = data.categories;

    // بناء كائن EMOJIS للاستخدام في الكود
    EMOJIS = {};
    data.categories.forEach(cat => {
      EMOJIS[cat.id] = cat.emojis;
    });

    _emojiLoaded = true;

    // بناء أزرار الفئات
    buildCatButtons();

    // عرض الفئة الأولى
    renderEmojiGrid(currentCat);

  } catch(e) {
    console.warn('فشل تحميل config.json، يُستخدم الإيموجي الافتراضي', e);
    _emojiLoaded = true;
  }
}

// بناء أزرار الفئات ديناميكياً
function buildCatButtons() {
  const catsEl = document.querySelector('.ep-cats');
  if (!catsEl) return;

  catsEl.innerHTML = '';

  EMOJI_CATS.forEach((cat, idx) => {
    // تخطى الفئات الفارغة (مثل custom إذا كانت فارغة)
    if (cat.id === 'custom' && cat.emojis.length === 0) return;

    const btn = document.createElement('button');
    btn.className = 'ep-cat' + (idx === 0 ? ' active' : '');

    // أيقونة الفئة
    if (cat.icon.length <= 2 || /^\p{Emoji}/u.test(cat.icon)) {
      btn.textContent = cat.icon;
    } else {
      btn.textContent = cat.icon;
      btn.style.fontSize = '10px';
      btn.style.padding = '4px 6px';
    }

    btn.title = cat.label;
    btn.onclick = (e) => showCat(cat.id, e.target);
    catsEl.appendChild(btn);
  });
}

// عرض فئة معينة
function showCat(cat, btnEl) {
  currentCat = cat;
  document.querySelectorAll('.ep-cat').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderEmojiGrid(cat);
}

// عرض الإيموجي في الشبكة
function renderEmojiGrid(cat) {
  const grid = document.getElementById('ep-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = EMOJIS[cat] || EMOJIS['faces'] || [];

  list.forEach(em => {
    const b = document.createElement('button');
    b.className = 'eb';
    b.textContent = em;
    b.onclick = () => ae(em);
    grid.appendChild(b);
  });
}

// فتح/إغلاق picker
function te() {
  eo = !eo;
  const picker = document.getElementById('ep');
  picker.classList.toggle('on', eo);
  if (eo) {
    if (!_emojiLoaded) {
      loadEmojiConfig();
    } else {
      renderEmojiGrid(currentCat);
    }
  }
}

// تحميل الإيموجي عند بدء الصفحة
document.addEventListener('DOMContentLoaded', () => {
  loadEmojiConfig();
});
