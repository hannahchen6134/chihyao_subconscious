// 智堯網站 — 共用 JS（分頁用）

// Nav scroll
var nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', function() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
}

// Hamburger
var hamburger = document.getElementById('hamburger');
var drawer = document.getElementById('navDrawer');
var overlay = document.getElementById('navOverlay');
if (hamburger && drawer && overlay) {
  function closeDrawer() {
    hamburger.classList.remove('open');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  hamburger.addEventListener('click', function() {
    var isOpen = drawer.classList.contains('open');
    if (isOpen) closeDrawer();
    else {
      hamburger.classList.add('open');
      drawer.classList.add('open');
      overlay.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
    }
  });
  overlay.addEventListener('click', closeDrawer);
  drawer.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', closeDrawer); });
}

// Fade in
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-in').forEach(function(el) { observer.observe(el); });

// FAQ 手風琴
document.querySelectorAll('.faq-question').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var answer = this.nextElementSibling;
    var isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-answer').forEach(function(a) { a.classList.remove('open'); });
    document.querySelectorAll('.faq-question').forEach(function(b) { b.setAttribute('aria-expanded', 'false'); });
    if (!isOpen) {
      answer.classList.add('open');
      this.setAttribute('aria-expanded', 'true');
    }
  });
});

// 價格直接顯示（不做 count-up 動畫，避免數字變高的視覺壓力）
document.querySelectorAll('.num-count').forEach(function(el) {
  var target = parseInt(el.dataset.target, 10);
  if (!isNaN(target)) el.textContent = target.toLocaleString();
});
