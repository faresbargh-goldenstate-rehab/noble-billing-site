/* =====================================================================
   Noble Billing — interaction layer
   - Nav state + mobile menu
   - Scroll reveals
   - Count-up figures
   - Live SVG charts (bars / donut / line)
   - Cinematic pinned hero → pain-point zoom → "heals that" (GSAP)
   - Full reduced-motion / no-JS fallbacks
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  // Guard must be initialised BEFORE any init() call — otherwise a hoisted
  // `var started` would reset to false after the first synchronous run and
  // let init() (and buildBars/stageChoreography) execute twice.
  var started = false;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  function init() {
    if (started) return; started = true;
    requestAnimationFrame(function () { document.body.classList.remove("preload"); });
    nav();
    reveals();
    counters();
    buildBars();
    chartObserver();
    pipeline();
    contactForm();
    if (hasGSAP && !reduce) stageChoreography();
  }

  /* ---------------- NAV ---------------- */
  function nav() {
    var el = document.getElementById("nav");
    var burger = document.getElementById("burger");
    var onScroll = function () { el.classList.toggle("scrolled", window.scrollY > 40); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger) {
      burger.addEventListener("click", function () {
        var open = el.classList.toggle("menu-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      el.querySelectorAll(".nav__links a").forEach(function (a) {
        a.addEventListener("click", function () { el.classList.remove("menu-open"); burger.setAttribute("aria-expanded", "false"); });
      });
    }
  }

  /* ---------------- REVEALS ---------------- */
  function reveals() {
    var items = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("in"); }); return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------------- COUNT-UP ---------------- */
  function formatNum(v, decimals) {
    if (decimals > 0) return v.toFixed(decimals);
    return Math.round(v).toLocaleString("en-US");
  }
  function animateCount(el) {
    var to = parseFloat(el.getAttribute("data-to")) || 0;
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var pre = el.getAttribute("data-prefix") || "";
    var suf = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = pre + formatNum(to, decimals) + suf; return; }
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + formatNum(to * eased, decimals) + suf;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = pre + formatNum(to, decimals) + suf;
    }
    requestAnimationFrame(step);
  }
  function counters() {
    var counts = document.querySelectorAll(".count");
    if (!("IntersectionObserver" in window)) { counts.forEach(animateCount); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCount(e.target);
          var metric = e.target.closest(".metric");
          if (metric) metric.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counts.forEach(function (c) { io.observe(c); });
    // metrics bars also fill on view even if count already ran
    document.querySelectorAll(".metric").forEach(function (m) {
      var mo = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); mo.unobserve(x.target); } });
      }, { threshold: 0.4 });
      mo.observe(m);
    });
  }

  /* ---------------- BAR CHART (built dynamically) ---------------- */
  function buildBars() {
    var svg = document.querySelector(".chart--bars .bars");
    if (!svg || svg.querySelector(".bar")) return; // idempotent
    var ns = "http://www.w3.org/2000/svg";

    // gradient defs (referenced by CSS: url(#barGrad), url(#barGrad2))
    var defs = document.createElementNS(ns, "defs");
    defs.innerHTML =
      '<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#2fae76"/><stop offset="100%" stop-color="#116343"/></linearGradient>' +
      '<linearGradient id="barGrad2" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#2fae76"/><stop offset="100%" stop-color="#178a5c"/></linearGradient>';
    svg.appendChild(defs);

    var data = [
      { m: "Jul", v: 0.82 }, { m: "Aug", v: 0.91 }, { m: "Sep", v: 1.04 },
      { m: "Oct", v: 1.18 }, { m: "Nov", v: 1.29 }, { m: "Dec", v: 1.42 }
    ];
    var max = 1.55, W = 320, base = 132, top = 14, bw = 26;
    var slot = W / data.length;
    data.forEach(function (d, i) {
      var h = (d.v / max) * (base - top);
      var x = i * slot + (slot - bw) / 2;
      var y = base - h;
      var rect = document.createElementNS(ns, "rect");
      rect.setAttribute("class", "bar");
      rect.setAttribute("x", x); rect.setAttribute("y", y);
      rect.setAttribute("width", bw); rect.setAttribute("height", h);
      rect.setAttribute("rx", "4");
      rect.style.animationDelay = (0.1 + i * 0.09) + "s";
      svg.appendChild(rect);

      var label = document.createElementNS(ns, "text");
      label.setAttribute("class", "bar-val");
      label.setAttribute("x", x + bw / 2); label.setAttribute("y", y - 6);
      label.setAttribute("text-anchor", "middle");
      label.textContent = "$" + d.v.toFixed(2) + "M";
      svg.appendChild(label);
    });
  }

  /* ---------------- CHART REVEAL ---------------- */
  function chartObserver() {
    var charts = document.querySelectorAll(".chart--bars .bars, .chart--donut, .chart--line");
    if (reduce || !("IntersectionObserver" in window)) { charts.forEach(function (c) { c.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    charts.forEach(function (c) { io.observe(c); });
  }

  /* ---------------- PIPELINE ---------------- */
  function pipeline() {
    var flow = document.getElementById("flow");
    if (!flow) return;
    if (reduce || !("IntersectionObserver" in window)) { flow.classList.add("in"); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { flow.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    io.observe(flow);
  }

  /* ---------------- CONSULTATION FORM ---------------- */
  function contactForm() {
    var form = document.getElementById("consultForm");
    if (!form) return;
    var success = document.getElementById("formSuccess");
    var interest = document.getElementById("interestField");

    // A CTA elsewhere on the page can pre-select the interest + focus the form
    document.querySelectorAll('a[data-interest]').forEach(function (a) {
      a.addEventListener("click", function () {
        var want = a.getAttribute("data-interest");
        if (interest) {
          if (want === "audit") interest.value = "A free revenue audit";
          else if (want === "consultation") interest.value = "Booking a consultation";
        }
        setTimeout(function () {
          var n = form.querySelector('[name="name"]');
          if (n) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }
        }, 620);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (typeof form.checkValidity === "function" && !form.checkValidity()) {
        form.reportValidity(); return;
      }
      var d = new FormData(form);
      var body = [
        "Name: " + (d.get("name") || ""),
        "Work email: " + (d.get("email") || ""),
        "Organization: " + (d.get("org") || ""),
        "Phone: " + (d.get("phone") || ""),
        "Role: " + (d.get("role") || ""),
        "Monthly claim volume: " + (d.get("volume") || ""),
        "Interested in: " + (d.get("interest") || ""),
        "", "Message:", (d.get("message") || "")
      ].join("\n");
      var subject = "Consultation request — " + ((d.get("org") || d.get("name")) || "Noble Billing");
      // Default working transport: opens the visitor's mail client, pre-filled.
      // Swap for a Formspree/Netlify/HubSpot endpoint (change to fetch()) for
      // silent server-side submission — see README.
      try { window.location.href = "mailto:sam@noblebill.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); } catch (e2) {}
      form.hidden = true;
      if (success) { success.hidden = false; success.scrollIntoView({ behavior: "smooth", block: "center" }); }
    });
  }

  /* ---------------- CINEMATIC HERO STAGE ---------------- */
  function stageChoreography() {
    var stage = document.getElementById("stage");
    var sticky = document.getElementById("stageSticky");
    if (!stage || !sticky) return;

    document.body.classList.add("motion");
    gsap.registerPlugin(ScrollTrigger);

    var hero = document.querySelector('.layer--hero');
    var p1 = document.querySelector('.layer--pain[data-pain="1"]');
    var p2 = document.querySelector('.layer--pain[data-pain="2"]');
    var p3 = document.querySelector('.layer--pain[data-pain="3"]');
    var heal = document.querySelector('.layer--heal');
    var cue = document.getElementById("scrollCue");

    // NOTE: no filter:blur() in any tween — blurring full-screen layers every
    // scroll frame is the main source of jank. Depth reads via scale + z + fade.
    gsap.set(hero, { autoAlpha: 1, scale: 1, z: 0 });
    gsap.set([p1, p2, p3, heal], { autoAlpha: 0, scale: 0.5, z: -260 });

    var depth = { v: 0 };

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    // camera fly-through (drives Three.js depth) across the whole intro
    tl.to(depth, { v: 1, duration: 6.6, onUpdate: function () { if (window.NobleHero) window.NobleHero.setDepth(depth.v); } }, 0);

    // hero recedes
    tl.to(cue, { autoAlpha: 0, duration: 0.4 }, 0.2);
    tl.to(hero, { autoAlpha: 0, scale: 0.86, z: -120, ease: "power1.in", duration: 0.9 }, 0.55);

    zoom(tl, p1, 1.25);
    zoom(tl, p2, 3.05);
    zoom(tl, p3, 4.85);

    // heal resolves and holds
    tl.fromTo(heal,
      { autoAlpha: 0, scale: 0.62, z: -260 },
      { autoAlpha: 1, scale: 1, z: 0, ease: "power2.out", duration: 1.1 }, 6.7);
    tl.to({}, { duration: 0.8 }); // hold at end

    function zoom(tl, el, at) {
      tl.fromTo(el,
        { autoAlpha: 0, scale: 0.5, z: -260 },
        { autoAlpha: 1, scale: 1, z: 0, ease: "power2.out", duration: 0.9 }, at);
      tl.to(el,
        { autoAlpha: 0, scale: 1.55, z: 150, ease: "power2.in", duration: 0.9 }, at + 1.0);
    }

    // The body.motion class changes the stage height to 600vh; ScrollTrigger
    // must re-measure AFTER that reflow, otherwise its range collapses to 0.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ScrollTrigger.refresh(); });
    });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
