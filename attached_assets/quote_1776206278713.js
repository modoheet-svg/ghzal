// =====================================================
// ===== نظام الاقتباس (QUOTE / REPLY SYSTEM) =====
// =====================================================
let _quoteData = null;
let _longPressTimer = null;
const LONG_PRESS_MS = 550;

function cancelQuote(){
  _quoteData = null;
  const bar = document.getElementById('quote-preview-bar');
  if(bar) bar.classList.remove('on');
}

function setQuote(senderName, text){
  if(!senderName || !text) return;
  _quoteData = { sender: senderName, text: text };
  const nameEl = document.getElementById('quote-preview-name');
  const textEl = document.getElementById('quote-preview-text');
  const bar    = document.getElementById('quote-preview-bar');
  if(nameEl) nameEl.textContent = '↩ ' + senderName;
  if(textEl) textEl.textContent = text.length > 90 ? text.slice(0,90)+'...' : text;
  if(bar){ bar.classList.add('on'); }
  // Focus input
  const inp = document.getElementById('min');
  if(inp) { inp.focus(); }
}

// Helper: get sender name and text from a .msg element
function getMsgInfo(msgEl){
  if(!msgEl) return null;
  // Try multiple selectors for name
  const nameEl = msgEl.querySelector('.mn span, .mn, [class*="nf-"] span, [class*="nfw-"] span');
  // For text - only plain text messages
  const textEl = msgEl.querySelector('.mx');
  if(!textEl) return null; // skip images/youtube
  const name = (nameEl ? nameEl.textContent : msgEl.dataset.sender || '').trim();
  const text = textEl.textContent.trim();
  if(!name || !text) return null;
  return { name, text };
}

// ===== TOUCH: Long Press =====
document.addEventListener('DOMContentLoaded', () => {
  const msgsContainer = document.getElementById('msgs');
  if(!msgsContainer) return;

  msgsContainer.addEventListener('touchstart', e => {
    const msgEl = e.target.closest('.msg');
    if(!msgEl) return;
    _longPressTimer = setTimeout(() => {
      const info = getMsgInfo(msgEl);
      if(!info) return;
      // Visual feedback
      msgEl.classList.add('long-pressed');
      setTimeout(() => msgEl.classList.remove('long-pressed'), 600);
      // Vibrate if supported
      if(navigator.vibrate) navigator.vibrate([40]);
      setQuote(info.name, info.text);
    }, LONG_PRESS_MS);
  }, { passive: true });

  msgsContainer.addEventListener('touchend', () => {
    clearTimeout(_longPressTimer);
  }, { passive: true });

  msgsContainer.addEventListener('touchmove', () => {
    clearTimeout(_longPressTimer);
  }, { passive: true });

  // ===== DESKTOP: زر الرد على الرسالة (يُضاف من chat.js) =====
});
