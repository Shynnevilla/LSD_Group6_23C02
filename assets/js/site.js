/* ═══════════════════════════════════════════════════════════════
   SITE BEHAVIOUR
   One module for every page. All animation is opt-in: reduced-motion
   users and touch devices skip the expensive effects entirely.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smallScreen = window.matchMedia("(max-width: 768px)");
  const finePointer = window.matchMedia("(pointer: fine)");

  const raf = window.requestAnimationFrame.bind(window);
  const caf = window.cancelAnimationFrame.bind(window);

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  /* ─── Decorative particle field ─────────────────────────────── */
  function initParticles() {
    const canvas = $("#particle-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COLORS = ["#D4AF37", "#8B0000", "#74C69D", "#457B9D"];
    const LINK_DISTANCE = 120;
    const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE;

    let width = 0;
    let height = 0;

    function draw() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      const count = smallScreen.matches ? 36 : 64;
      const particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      }));

      for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = 0.5;
        ctx.fill();
      }

      if (width > 900) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i += 1) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j += 1) {
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distanceSq = dx * dx + dy * dy;
            if (distanceSq >= LINK_DISTANCE_SQ) continue;
            const alpha = 0.08 * (1 - Math.sqrt(distanceSq) / LINK_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(212, 175, 55, ${alpha.toFixed(3)})`;
            ctx.stroke();
          }
        }
      }
    }

    draw();

    let resizeTimer = 0;
    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(draw, 180);
      },
      { passive: true },
    );
  }

  /* ─── Navigation, progress bar and mobile menu ──────────────── */
  function initNavigation() {
    const nav = $("#main-nav");
    const progress = $("#navProgress");
    const backToTop = $("#backToTop");
    const navToggle = $("#navToggle");
    const navLinks = $("#navLinks");

    let maxScroll = 0;
    let queued = false;

    const measure = () => {
      maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };

    const update = () => {
      queued = false;
      const y = window.scrollY;
      if (progress && maxScroll > 0) {
        progress.style.transform = `scaleX(${Math.min(y / maxScroll, 1).toFixed(4)})`;
      }
      nav?.classList.toggle("scrolled", y > 60);
      backToTop?.classList.toggle("visible", y > 500);
    };

    const requestUpdate = () => {
      if (queued) return;
      queued = true;
      raf(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener(
      "resize",
      () => {
        measure();
        requestUpdate();
      },
      { passive: true },
    );
    window.addEventListener(
      "load",
      () => {
        measure();
        requestUpdate();
      },
      { once: true },
    );

    if ("ResizeObserver" in window) {
      new ResizeObserver(measure).observe(document.body);
    }

    measure();
    update();

    backToTop?.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    });

    if (navToggle && navLinks) {
      navToggle.setAttribute("aria-expanded", "false");
      const setMenu = (open) => {
        navLinks.classList.toggle("open", open);
        navToggle.setAttribute("aria-expanded", String(open));
      };
      navToggle.addEventListener("click", () =>
        setMenu(!navLinks.classList.contains("open")),
      );
      navLinks.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenu(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenu(false);
      });
      document.addEventListener("click", (event) => {
        if (!navLinks.classList.contains("open")) return;
        if (event.target.closest("#main-nav")) return;
        setMenu(false);
      });
    }

    $("#heroBtn")?.addEventListener("click", (event) => {
      const targetSelector = event.currentTarget.dataset.scrollTarget;
      const target = targetSelector && document.querySelector(targetSelector);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  /* ─── Scroll reveal ─────────────────────────────────────────── */
  function initReveal() {
    const elements = $$(
      ".reveal, .reveal-left, .reveal-right, .stagger, .timeline-node, .vision-node",
    );
    if (elements.length === 0) return;

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -30px 0px" },
    );

    elements.forEach((element) => observer.observe(element));
  }

  /* ─── Count-up statistics ───────────────────────────────────── */
  function initCounters() {
    const grid = $("#statsGrid");
    const numbers = $$(".stat-number");
    if (!grid || numbers.length === 0) return;

    const finish = (element, value, suffix) => {
      element.textContent = value + suffix;
    };

    const animate = (element) => {
      const target = Number.parseFloat(element.dataset.target || "0");
      const suffix = element.dataset.suffix || "";
      const isFloat = target % 1 !== 0;
      const duration = 1800;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 4;
        const current = eased * target;
        element.textContent =
          (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
        if (progress < 1) {
          raf(tick);
        } else {
          finish(element, isFloat ? target.toFixed(1) : target, suffix);
        }
      };

      raf(tick);
    };

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      numbers.forEach((element) => {
        const target = Number.parseFloat(element.dataset.target || "0");
        const suffix = element.dataset.suffix || "";
        finish(element, target % 1 !== 0 ? target.toFixed(1) : target, suffix);
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          numbers.forEach(animate);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(grid);
  }

  /* ─── Tabs ──────────────────────────────────────────────────── */
  function initTabs() {
    const buttons = $$(".tab-btn");
    if (buttons.length === 0) return;
    const panels = $$(".tab-panel");

    const select = (button) => {
      const tabId = button.dataset.tab;
      for (const other of buttons) {
        const active = other === button;
        other.classList.toggle("active", active);
        other.setAttribute("aria-selected", String(active));
      }
      for (const panel of panels) {
        const active = panel.id === `tab-${tabId}`;
        panel.classList.toggle("active", active);
        if (active) {
          panel
            .querySelectorAll(".reveal, .reveal-left, .reveal-right, .stagger")
            .forEach((element) => element.classList.add("visible"));
        }
      }
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => select(button));
    });
  }

  /* ─── Expandable timeline cards ─────────────────────────────── */
  function initTimelineCards() {
    const cards = $$(".timeline-card");
    if (cards.length === 0) return;

    cards.forEach((card) => {
      card.setAttribute(
        "aria-expanded",
        String(card.classList.contains("expanded")),
      );
      if (!card.matches("button, a")) {
        card.setAttribute("role", "button");
        card.tabIndex = 0;
      }

      const activate = (event) => {
        if (event.target.closest("a, button")) return;

        const wasExpanded = card.classList.contains("expanded");
        $$(".timeline-card.expanded").forEach((other) => {
          other.classList.remove("expanded");
          other.setAttribute("aria-expanded", "false");
        });
        $$(".timeline-dot.active").forEach((dot) =>
          dot.classList.remove("active"),
        );

        if (wasExpanded) return;

        card.classList.add("expanded");
        card.setAttribute("aria-expanded", "true");
        const node = card.closest(".timeline-node");
        node?.querySelector(".timeline-dot")?.classList.add("active");
      };

      card.addEventListener("click", activate);
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate(event);
      });
    });
  }

  /* ─── Pointer tilt ──────────────────────────────────────────── */
  function initTilt() {
    if (reducedMotion.matches || !finePointer.matches) return;

    const groups = [
      [".stat-card", 8, 600],
      [".pillar-card", 6, 800],
      [".era-banner-card", 4, 1000],
      [".museum-teaser-card", 6, 800],
      [".vision-card", 6, 800],
      [".highlight-card", 6, 800],
      [".team-card", 6, 800],
      [".diary-card", 4, 1000],
      [".reflection-box", 5, 800],
    ];

    for (const [selector, maxTilt, perspective] of groups) {
      for (const card of $$(selector)) {
        let rect = null;
        let pending = 0;
        let rotateX = 0;
        let rotateY = 0;

        const apply = () => {
          pending = 0;
          card.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        };

        const reset = () => {
          rect = null;
          rotateX = 0;
          rotateY = 0;
          cancelAnimationFrame(pending);
          pending = 0;
          card.style.transform = "";
        };

        card.addEventListener(
          "pointerenter",
          () => {
            rect = card.getBoundingClientRect();
          },
          { passive: true },
        );

        card.addEventListener(
          "pointermove",
          (event) => {
            if (!rect) rect = card.getBoundingClientRect();
            rotateY =
              ((event.clientX - rect.left) / rect.width - 0.5) * maxTilt;
            rotateX =
              -((event.clientY - rect.top) / rect.height - 0.5) * maxTilt;
            if (!pending) pending = raf(apply);
          },
          { passive: true },
        );

        card.addEventListener("pointerleave", reset, { passive: true });
        card.addEventListener("pointercancel", reset, { passive: true });
      }
    }
  }

  /* ─── Museum gallery filters ────────────────────────────────── */
  function initGalleryFilters() {
    const buttons = $$(".gallery-filter-btn");
    const grid = $("#galleryGrid");
    if (!grid || buttons.length === 0) return;
    const cards = $$(".gallery-card", grid);

    const apply = (category) => {
      for (const card of cards) {
        card.hidden = category !== "all" && card.dataset.category !== category;
      }
    };

    for (const button of buttons) {
      button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("active")),
      );
      button.addEventListener("click", () => {
        for (const other of buttons) {
          const active = other === button;
          other.classList.toggle("active", active);
          other.setAttribute("aria-pressed", String(active));
        }
        apply(button.dataset.filter || "all");
      });
    }
  }

  /* ─── Hero photo switcher (team page) ───────────────────────── */
  function initHeroPhotoSwitcher() {
    const main = $("#heroMainPhoto");
    const frame = $(".hero-photo-frame");
    const title = $("#heroPhotoCaptionTitle");
    const subtitle = $("#heroPhotoCaptionSub");
    const buttons = $$(".hero-thumb-btn");
    if (!main || buttons.length === 0) return;

    let request = 0;

    const show = async (button, animate = true) => {
      const id = ++request;
      const src = button.dataset.photoSrc;
      const nextTitle = button.dataset.photoTitle || "";
      const nextSubtitle = button.dataset.photoSubtitle || "";
      const full = button.dataset.photoFull || src;

      buttons.forEach((other) => {
        const active = other === button;
        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", String(active));
      });

      const needsSwap = main.getAttribute("src") !== src;
      if (animate && needsSwap) {
        main.style.opacity = "0";
        if (!reducedMotion.matches) {
          await new Promise((resolve) => setTimeout(resolve, 160));
        }
        if (id !== request) return;
      }

      main.src = src;
      main.alt = nextTitle;
      try {
        await main.decode();
      } catch {
        /* decode() rejects for cached/broken sources; the browser still swaps. */
      }
      if (id !== request) return;

      title && (title.textContent = nextTitle);
      subtitle && (subtitle.textContent = nextSubtitle);
      main.style.opacity = "1";

      if (frame) {
        frame.dataset.lightboxSrc = full;
        frame.dataset.lightboxTitle = nextTitle;
        frame.dataset.lightboxDesc = nextSubtitle;
      }
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => show(button));
    });

    show(
      buttons.find((button) => button.classList.contains("active")) ||
        buttons[0],
      false,
    );
  }

  onReady(() => {
    initParticles();
    initNavigation();
    initReveal();
    initCounters();
    initTabs();
    initTimelineCards();
    initTilt();
    initGalleryFilters();
    initHeroPhotoSwitcher();
  });
})();
