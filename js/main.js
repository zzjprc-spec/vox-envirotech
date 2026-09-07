(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");

  // Sticky header background on scroll
  function updateHeader() {
    if (!header) return;
    const scrolled = window.scrollY > 24;
    header.classList.toggle("scrolled", scrolled);
  }

  // Mobile nav toggle
  function closeMobileNav() {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("open");
    document.body.style.overflow = "";
  }

  function toggleMobileNav() {
    if (!navToggle || !mobileNav) return;
    const isOpen = mobileNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  }

  // Smooth-scroll offset and close mobile nav on link click
  function setupAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        const targetId = link.getAttribute("href");
        if (targetId === "#" || targetId.length < 2) return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        closeMobileNav();

        const headerOffset = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset + 4;
        window.scrollTo({ top: top, behavior: "smooth" });
      });
    });
  }

  // Reveal-on-scroll using IntersectionObserver
  function setupReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  // Brochure request modal
  function setupBrochureModal() {
    const modal = document.getElementById("brochureModal");
    if (!modal) return;

    const closeBtn = document.getElementById("brochureClose");
    const doneBtn = document.getElementById("brochureDone");
    const form = document.getElementById("brochureForm");
    const successBox = document.getElementById("brochureSuccess");
    const productInput = document.getElementById("brochureProduct");
    const buttons = document.querySelectorAll(".brochure-btn");

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const companyInput = form.querySelector('input[name="company"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    let lastFocused = null;

    function openModal(product) {
      lastFocused = document.activeElement;
      form.reset();
      productInput.value = product;
      form.hidden = false;
      successBox.hidden = true;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      window.setTimeout(function () {
        if (nameInput) nameInput.focus();
      }, 60);
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-product") || "");
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (doneBtn) doneBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const product = productInput.value;
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const company = companyInput.value.trim();
      const message = messageInput.value.trim();

      if (!name || !email) return;

      const subject = encodeURIComponent("Brochure request: " + product);
      const body = encodeURIComponent(
        "Product: " + product + "\n" +
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Company: " + (company || "—") + "\n" +
        "Project details: " + (message || "—")
      );
      window.location.href =
        "mailto:James.zhou@voxenviro.com?subject=" + subject + "&body=" + body;

      form.hidden = true;
      successBox.hidden = false;
    });
  }

  // Case study request modal
  function setupCaseModal() {
    const modal = document.getElementById("caseModal");
    if (!modal) return;

    const closeBtn = document.getElementById("caseClose");
    const doneBtn = document.getElementById("caseDone");
    const form = document.getElementById("caseForm");
    const successBox = document.getElementById("caseSuccess");
    const caseSelect = document.getElementById("caseSelect");
    const buttons = document.querySelectorAll(".case-btn");

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const companyInput = form.querySelector('input[name="company"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    let lastFocused = null;

    function openModal(group) {
      lastFocused = document.activeElement;
      form.reset();
      form.hidden = false;
      successBox.hidden = true;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      // Best-effort: pre-select the first case in the requested group.
      if (group) {
        try {
          const optgroup = Array.prototype.find.call(
            caseSelect.querySelectorAll("optgroup"),
            function (og) {
              return og.getAttribute("label") === group;
            }
          );
          if (optgroup && optgroup.children && optgroup.children.length) {
            caseSelect.value = optgroup.children[0].value;
          }
        } catch (e) {
          // Keep the default "Select a case…" option.
        }
      }
      window.setTimeout(function () {
        if (nameInput) nameInput.focus();
      }, 60);
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-group") || "");
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (doneBtn) doneBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const caseStudy = caseSelect.value;
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const company = companyInput.value.trim();
      const message = messageInput.value.trim();

      if (!caseStudy || !name || !email) return;

      const subject = encodeURIComponent("Case study request: " + caseStudy);
      const body = encodeURIComponent(
        "Case study: " + caseStudy + "\n" +
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Company: " + (company || "—") + "\n" +
        "Comments: " + (message || "—")
      );
      window.location.href =
        "mailto:James.zhou@voxenviro.com?subject=" + subject + "&body=" + body;

      form.hidden = true;
      successBox.hidden = false;
    });
  }

  // Contact form (inline)
  function setupContactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const successBox = document.getElementById("contactSuccess");
    const resetBtn = document.getElementById("contactReset");

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const companyInput = form.querySelector('input[name="company"]');
    const messageInput = form.querySelector('textarea[name="message"]');

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const company = companyInput.value.trim();
      const message = messageInput.value.trim();

      if (!name || !email || !message) return;

      const subject = encodeURIComponent("Website inquiry from " + name);
      const body = encodeURIComponent(
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Company: " + (company || "—") + "\n\n" +
        "Message:\n" + message
      );
      window.location.href =
        "mailto:James.zhou@voxenviro.com?subject=" + subject + "&body=" + body;

      form.hidden = true;
      successBox.hidden = false;
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        form.reset();
        form.hidden = false;
        successBox.hidden = true;
      });
    }
  }

  // Click-to-enlarge lightbox for the hero theme images.
  function setupLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const boxImg = document.getElementById("lightboxImg");
    const closeBtn = document.getElementById("lightboxClose");
    const images = document.querySelectorAll(".pillar-card img");

    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
    }

    images.forEach(function (img) {
      img.addEventListener("click", function () {
        boxImg.src = img.currentSrc || img.src;
        boxImg.alt = img.alt || "";
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        if (closeBtn) closeBtn.focus();
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !lightbox.hidden) close();
    });
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", closeMobileNav);

  if (navToggle) {
    navToggle.addEventListener("click", toggleMobileNav);
  }

  updateHeader();
  setupAnchors();
  setupReveal();
  setupBrochureModal();
  setupCaseModal();
  setupContactForm();
  setupLightbox();
})();
