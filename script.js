document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("navigation");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const navAnchors = Array.from(nav.querySelectorAll("a"));
  const pipelineShell = document.getElementById("pipeline-shell");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  let reduceMotion = motionQuery.matches;
  const finePointer = finePointerQuery.matches;
  let scrollTicking = false;

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    header.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navAnchors.forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) {
      setMenu(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      setMenu(false);
    }
  });

  const scrollBar = document.querySelector(".scroll-progress span");

  const updateScrollState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);

    if (scrollBar) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
      scrollBar.style.transform = `scaleX(${progress})`;
    }

    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateScrollState);
      }
    },
    { passive: true }
  );
  updateScrollState();

  const revealElements = Array.from(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach((element, index) => {
      if (element.matches(".project-card, .skill-card")) {
        element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
      }
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  const tiltCards = Array.from(document.querySelectorAll(".tilt-card"));
  const resetTilt = (card) => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  if (finePointer && !reduceMotion) {
    tiltCards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => resetTilt(card));
    });
  }

  const resetPipelineParallax = () => {
    if (!pipelineShell) return;
    pipelineShell.style.setProperty("--shift-x", "0px");
    pipelineShell.style.setProperty("--shift-y", "0px");
    pipelineShell.style.setProperty("--canvas-shift-x", "0px");
    pipelineShell.style.setProperty("--canvas-shift-y", "0px");
  };

  const cursorGlow = document.querySelector(".cursor-glow");

  if (cursorGlow && finePointer && !reduceMotion) {
    let cursorX = 0;
    let cursorY = 0;
    let cursorFrame = 0;

    const renderCursor = () => {
      cursorGlow.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      cursorFrame = 0;
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        cursorX = event.clientX;
        cursorY = event.clientY;
        cursorGlow.classList.add("is-active");
        if (!cursorFrame) {
          cursorFrame = requestAnimationFrame(renderCursor);
        }
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", () => cursorGlow.classList.remove("is-active"));
    window.addEventListener("blur", () => cursorGlow.classList.remove("is-active"));
  }

  if (pipelineShell && finePointer) {
    let pipelineFrame = 0;
    let pipelineX = 0;
    let pipelineY = 0;

    const renderPipelineParallax = () => {
      pipelineShell.style.setProperty("--shift-x", `${(pipelineX * 10).toFixed(2)}px`);
      pipelineShell.style.setProperty("--shift-y", `${(pipelineY * 7).toFixed(2)}px`);
      pipelineShell.style.setProperty("--canvas-shift-x", `${(pipelineX * 4).toFixed(2)}px`);
      pipelineShell.style.setProperty("--canvas-shift-y", `${(pipelineY * 3).toFixed(2)}px`);
      pipelineFrame = 0;
    };

    pipelineShell.addEventListener(
      "pointermove",
      (event) => {
        if (reduceMotion) return;
        const rect = pipelineShell.getBoundingClientRect();
        pipelineX = (event.clientX - rect.left) / rect.width - 0.5;
        pipelineY = (event.clientY - rect.top) / rect.height - 0.5;
        if (!pipelineFrame) pipelineFrame = requestAnimationFrame(renderPipelineParallax);
      },
      { passive: true }
    );

    pipelineShell.addEventListener("pointerleave", () => {
      pipelineX = 0;
      pipelineY = 0;
      if (!pipelineFrame) pipelineFrame = requestAnimationFrame(renderPipelineParallax);
    });
  }

  motionQuery.addEventListener?.("change", (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      cursorGlow?.classList.remove("is-active");
      tiltCards.forEach(resetTilt);
      resetPipelineParallax();
    }
  });

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }
});
