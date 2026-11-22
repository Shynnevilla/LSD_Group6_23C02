/* ═══════════════════════════════════════════════════════════════
   SHARED IMAGE LIGHTBOX
   Builds the modal once and wires every content <img> on the page.
   Skips images inside <a>, <button>, or [onclick] so existing
   interactions (hero switcher, gallery cards) are left untouched.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (window.__sharedLightboxInit) return;
  window.__sharedLightboxInit = true;

  var modal = document.createElement('div');
  modal.className = 'lightbox-modal';
  modal.id = 'lightboxModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Xem ảnh phóng to');
  modal.innerHTML =
    '<button class="lightbox-close-btn" id="lightboxClose" aria-label="Đóng (ESC)">✕</button>' +
    '<button class="lightbox-nav-btn lightbox-prev-btn" id="lightboxPrev" aria-label="Ảnh trước (←)">❮</button>' +
    '<button class="lightbox-nav-btn lightbox-next-btn" id="lightboxNext" aria-label="Ảnh sau (→)">❯</button>' +
    '<div class="lightbox-content">' +
      '<div class="lightbox-img-wrapper"><img id="lightboxImg" src="" alt="Ảnh tư liệu"></div>' +
      '<div class="lightbox-caption-box">' +
        '<h3 class="lightbox-title" id="lightboxTitle"></h3>' +
        '<p class="lightbox-desc" id="lightboxDesc"></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var imgEl = modal.querySelector('#lightboxImg');
  var titleEl = modal.querySelector('#lightboxTitle');
  var descEl = modal.querySelector('#lightboxDesc');
  var items = [];

  function descFor(img) {
    var scope = img.closest('.content-item, .museum-teaser-card, .content-block-body, .team-cta-box');
    var p = scope ? scope.querySelector('p') : null;
    if (!p) return '';
    return p.textContent.replace(/\s+/g, ' ').trim().slice(0, 240);
  }

  document.querySelectorAll('img').forEach(function (img) {
    if (img.id === 'lightboxImg') return;
    if (img.closest('a, button, [onclick]')) return;
    var src = img.getAttribute('src');
    if (!src) return;
    img.classList.add('lightboxable');
    var i = items.length;
    items.push({
      src: src,
      title: img.getAttribute('alt') || 'Ảnh tư liệu',
      desc: descFor(img)
    });
    img.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      open(i);
    });
  });

  var index = -1;
  var lastFocus = null;

  function render() {
    var item = items[index];
    if (!item) return;
    imgEl.src = item.src;
    imgEl.alt = item.title;
    titleEl.textContent = item.title;
    descEl.textContent = item.desc;
  }

  function open(i) {
    if (!items.length) return;
    lastFocus = document.activeElement;
    index = i;
    render();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.querySelector('#lightboxClose').focus({ preventScroll: true });
  }

  function close() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function next() {
    if (!items.length) return;
    index = (index + 1) % items.length;
    render();
  }

  function prev() {
    if (!items.length) return;
    index = (index - 1 + items.length) % items.length;
    render();
  }

  modal.querySelector('#lightboxClose').addEventListener('click', close);
  modal.querySelector('#lightboxNext').addEventListener('click', next);
  modal.querySelector('#lightboxPrev').addEventListener('click', prev);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  });
})();
