/* ============================================================
   DB GROUP FZCO — interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---- Scroll progress bar ---- */
  var prog = document.createElement('div');
  prog.id = 'scroll-prog';
  document.body.appendChild(prog);
  function updateProg() {
    var doc = document.documentElement;
    var scrolled = doc.scrollTop || document.body.scrollTop;
    var total = (doc.scrollHeight - doc.clientHeight) || 1;
    prog.style.width = (scrolled / total * 100) + '%';
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(updateProg); }, { passive: true });
  updateProg();

  /* ---- Word-split for section headings ---- */
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (/^\s+$/.test(part)) {
            el.appendChild(document.createTextNode(part));
          } else if (part.length) {
            var ww = document.createElement('span'); ww.className = 'word-wrap';
            var w  = document.createElement('span'); w.className  = 'word';
            w.textContent = part; ww.appendChild(w); el.appendChild(ww);
          }
        });
      } else {
        var ww = document.createElement('span'); ww.className = 'word-wrap';
        var w  = document.createElement('span'); w.className  = 'word';
        w.appendChild(node); ww.appendChild(w); el.appendChild(ww);
      }
    });
    Array.prototype.forEach.call(el.querySelectorAll('.word'), function (w, i) {
      w.style.transitionDelay = (0.06 + i * 0.07) + 's';
    });
  }
  Array.prototype.forEach.call(
    document.querySelectorAll('.section h2, .hero h1'),
    splitWords
  );

  /* ---- Header shadow on scroll ---- */
  var header = document.getElementById('header');
  var onScroll = function () {
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Partner logo walls (monochrome wordmark placeholders) ---- */
  var GROUPS = {
    suppliers: ['Sucden', 'EDF Man', 'Cargill', 'Alvean', 'Mewah'],
    buyers:    ['ShopUp', 'Silq', 'C&A', 'Al Ain Farms', 'Agro Corp'],
    shipping:  ['DP World', 'Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd'],
    insurance: ['Marsh', 'Orient', 'Sukoon', 'Coface', 'AXA'],
    banks:     ['HBL', 'Emirates NBD', 'Mashreq', 'ADCB', 'Standard Chartered']
  };
  Object.keys(GROUPS).forEach(function (key) {
    var row = document.querySelector('.logo-row[data-group="' + key + '"]');
    if (!row) return;
    GROUPS[key].forEach(function (name) {
      var el = document.createElement('div');
      el.className = 'logo';
      el.innerHTML = name + '<small>logo</small>';
      row.appendChild(el);
    });
  });

  /* ---- Scroll-driven reveals / counters / bars ----
     (IntersectionObserver is unreliable in sandboxed preview frames,
      so we use rAF-throttled scroll-position checks instead.) ---- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  var bars = Array.prototype.slice.call(document.querySelectorAll('[data-fill]'));

  function inView(el, ratio) {
    var r = el.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    var trigger = h * (ratio || 0.9);
    return r.top < trigger && r.bottom > 0;
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      var shown = (target % 1 === 0) ? Math.round(val) : val.toFixed(1);
      el.textContent = shown + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- Progress bars ---- */
  function fillBar(el) {
    el.style.width = (el.getAttribute('data-fill') || 0) + '%';
  }

  function checkAll() {
    for (var i = reveals.length - 1; i >= 0; i--) {
      if (inView(reveals[i], 0.92)) { reveals[i].classList.add('in'); reveals.splice(i, 1); }
    }
    for (var j = counters.length - 1; j >= 0; j--) {
      if (inView(counters[j], 0.85)) { animateCount(counters[j]); counters.splice(j, 1); }
    }
    for (var k = bars.length - 1; k >= 0; k--) {
      if (inView(bars[k], 0.85)) { fillBar(bars[k]); bars.splice(k, 1); }
    }
  }

  var ticking = false;
  function onScrollCheck() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { checkAll(); ticking = false; });
  }
  window.addEventListener('scroll', onScrollCheck, { passive: true });
  window.addEventListener('resize', onScrollCheck, { passive: true });
  window.addEventListener('load', checkAll);
  checkAll();
  setTimeout(checkAll, 200);

  /* ---- Active nav link on scroll-spy ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.menu a'));
  var spySections = links
    .map(function (l) { var id = l.getAttribute('href'); return id && id.length > 1 ? document.querySelector(id) : null; })
    .filter(Boolean);
  function spyCheck() {
    var pos = window.scrollY + (window.innerHeight * 0.4);
    var current = null;
    spySections.forEach(function (s) {
      if (s.offsetTop <= pos) current = s;
    });
    if (current) {
      var id = '#' + current.id;
      links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === id); });
    }
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    requestAnimationFrame(function () { spyCheck(); });
  }, { passive: true });

  /* ---- Logo marquees: clone items in every .logo-track for seamless loop ---- */
  Array.prototype.forEach.call(document.querySelectorAll('.logo-track'), function (track) {
    Array.prototype.slice.call(track.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  });

  /* ---- Testimonial marquee: clone cards for seamless loop ---- */
  var tstTrack = document.querySelector('.tst-track');
  if (tstTrack) {
    Array.prototype.slice.call(tstTrack.children).forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      tstTrack.appendChild(clone);
    });
  }

  /* ---- Hero parallax ---- */
  var heroBg = document.querySelector('.hero-bg .ph');
  if (heroBg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var rafParallax = null;
    window.addEventListener('scroll', function () {
      if (rafParallax) return;
      rafParallax = requestAnimationFrame(function () {
        heroBg.style.transform = 'translateY(' + (window.scrollY * 0.35) + 'px)';
        rafParallax = null;
      });
    }, { passive: true });
  }

  /* ---- Mobile menu (simple) ---- */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var menu = document.querySelector('.menu');
      if (!menu) return;
      var open = menu.style.display === 'flex';
      menu.style.cssText = open ? '' : 'display:flex;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:#fff;padding:16px var(--gut);gap:4px;box-shadow:var(--shadow);border-bottom:1px solid var(--line);';
    });
  }

  /* ---- Contact form submission ---- */
  var contactForm = document.querySelector('.cform');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      
      var successMsg = document.getElementById('contact-success-msg');
      if (successMsg) {
        successMsg.style.display = 'block';
        contactForm.reset();
        
        setTimeout(function () {
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
        
        setTimeout(function () {
          successMsg.style.display = 'none';
        }, 5000);
      }
    });
  }
})();
