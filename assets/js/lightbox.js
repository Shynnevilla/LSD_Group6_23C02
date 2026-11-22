/* ═══════════════════════════════════════════════════════════════
   SHARED IMAGE LIGHTBOX
   Builds one native <dialog> and upgrades every content image.
   Navigation follows DOM order across galleries and diary photos.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  if (window.__siteLightboxReady) return;
  window.__siteLightboxReady = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const modal = document.createElement('dialog');
  modal.className = 'lightbox-modal';
  modal.setAttribute('aria-label', 'Xem ảnh phóng to');
  modal.innerHTML = `
    <button type="button" class="lightbox-close-btn" data-lightbox-close aria-label="Đóng (Esc)">✕</button>
    <button type="button" class="lightbox-nav-btn lightbox-prev-btn" data-lightbox-prev aria-label="Ảnh trước (←)">❮</button>
    <button type="button" class="lightbox-nav-btn lightbox-next-btn" data-lightbox-next aria-label="Ảnh sau (→)">❯</button>
    <div class="lightbox-content">
      <div class="lightbox-img-wrapper">
        <img data-lightbox-image src="" alt="">
      </div>
      <div class="lightbox-caption-box">
        <h3 class="lightbox-title" data-lightbox-title></h3>
        <p class="lightbox-desc" data-lightbox-desc></p>
      </div>
    </div>`;

  const image = $('[data-lightbox-image]', modal);
  const title = $('[data-lightbox-title]', modal);
  const description = $('[data-lightbox-desc]', modal);
  const closeButton = $('[data-lightbox-close]', modal);
  const nextButton = $('[data-lightbox-next]', modal);
  const previousButton = $('[data-lightbox-prev]', modal);

  const sources = [];
  let current = -1;
  let lastFocus = null;

  function itemFor(element) {
    if (element.matches('[data-lightbox]')) {
      const inner = element.matches('img') ? element : element.querySelector('img');
      return {
        src: element.dataset.lightboxSrc || (inner && inner.getAttribute('src')) || '',
        title: element.dataset.lightboxTitle || (inner && inner.alt) || 'Ảnh tư liệu',
        desc: element.dataset.lightboxDesc || '',
      };
    }
    return {
      src: element.getAttribute('src') || '',
      title: element.alt || 'Ảnh tư liệu',
      desc: element.dataset.desc || '',
    };
  }

  function preload(offset) {
    if (sources.length < 2) return;
    const next = sources[(current + offset + sources.length) % sources.length];
    const item = itemFor(next);
    if (!item.src) return;
    const preloadImage = new Image();
    preloadImage.src = item.src;
  }

  function render() {
    const element = sources[current];
    if (!element) return;
    const item = itemFor(element);
    if (!item.src) return;

    image.src = item.src;
    image.alt = item.title;
    title.textContent = item.title;
    description.textContent = item.desc;
    description.hidden = !item.desc;

    preload(1);
    preload(-1);
  }

  function open(index) {
    if (index < 0 || index >= sources.length) return;
    lastFocus = document.activeElement;
    current = index;
    render();
    if (!modal.open) {
      document.body.classList.add('lightbox-open');
      modal.showModal();
    }
    closeButton.focus({ preventScroll: true });
  }

  function close() {
    if (modal.open) modal.close();
  }

  function step(offset) {
    if (sources.length === 0) return;
    current = (current + offset + sources.length) % sources.length;
    render();
  }

  function activate(element, handler) {
    if (!element.matches('button, a')) {
      element.setAttribute('role', 'button');
      element.tabIndex = 0;
    }
    element.addEventListener('click', (event) => {
      if (event.target.closest('a, button') && !element.matches('button')) return;
      event.preventDefault();
      handler();
    });
    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      handler();
    });
  }

  function register() {
    const explicit = $$('[data-lightbox]');
    const explicitImages = new Set();
    for (const element of explicit) {
      const inner = element.matches('img') ? element : element.querySelector('img');
      if (inner) explicitImages.add(inner);
      if (!itemFor(element).src) continue;
      sources.push(element);
      activate(element, () => open(sources.indexOf(element)));
    }

    for (const element of $$('img')) {
      if (element === image) continue;
      if (explicitImages.has(element)) continue;
      if (element.closest('[data-lightbox], a, button, [onclick]')) continue;
      if (!element.getAttribute('src')) continue;
      element.classList.add('lightboxable');
      sources.push(element);
      activate(element, () => open(sources.indexOf(element)));
    }
  }

  closeButton.addEventListener('click', close);
  nextButton.addEventListener('click', () => step(1));
  previousButton.addEventListener('click', () => step(-1));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    }
  });

  modal.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    image.src = '';
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(modal);
    register();
  }, { once: true });
})();
