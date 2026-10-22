(() => {
  const root = document.documentElement;
  const io = "IntersectionObserver" in window;
  const listeners = [];
  window.siteTheme = { onChange: fn => listeners.push(fn) };

  /* theme: follows the OS until the visitor picks one */
  const themeBtn = document.getElementById("theme");
  const lightMq = matchMedia("(prefers-color-scheme: light)");
  const current = () => root.dataset.theme || (lightMq.matches ? "light" : "dark");
  const syncTheme = () => {
    themeBtn?.setAttribute("aria-label", `Switch to ${current() === "dark" ? "light" : "dark"} theme`);
    listeners.forEach(fn => fn());
  };
  themeBtn?.addEventListener("click", () => {
    const t = current() === "dark" ? "light" : "dark";
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
    syncTheme();
  });
  lightMq.addEventListener?.("change", syncTheme);

  /* nav border after scrolling */
  const nav = document.getElementById("nav");
  const onScroll = () => nav?.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* mark the link whose section is in the middle of the viewport (nav links and the contents rail) */
  const track = links => {
    const targets = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (!io || !targets.length) return;
    const obs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.hash === "#" + e.target.id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
    }), { rootMargin: "-40% 0px -55% 0px" });
    targets.forEach(t => obs.observe(t));
  };
  track([...document.querySelectorAll('.nav-links a[href^="#"]')]);
  track([...document.querySelectorAll(".toc a")]);

  /* reveal on scroll; content stays visible without JS or with reduced motion */
  const reveals = [...document.querySelectorAll(".reveal")];
  if (io && root.classList.contains("motion")) {
    const rObs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); rObs.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: .05 });
    reveals.forEach(el => rObs.observe(el));
  } else reveals.forEach(el => el.classList.add("in"));
  addEventListener("beforeprint", () => reveals.forEach(el => el.classList.add("in")));

  /* pointer glow on project cards */
  document.querySelectorAll(".case").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* copy email, with a selection fallback when the clipboard is refused */
  const copy = document.getElementById("copy");
  if (copy) {
    const label = document.getElementById("copy-label");
    const email = document.getElementById("email"), live = document.getElementById("live");
    let timer;
    const say = msg => { label.textContent = msg; live.textContent = msg; clearTimeout(timer); timer = setTimeout(() => label.textContent = "Copy", 1800); };
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(email.textContent.trim()); say("Copied"); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(email);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); say("Selected");
      }
    });
  }
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  syncTheme();
})();
