/* BikeFitter design study: shared behaviour for the three named styles.
   The page markup is the same in Logbook, Velodrome and Workstand. Each
   stylesheet (styles/<name>.css) decides how it looks.

   This script is loaded at the very top of <body>. It writes the icon set and
   the site header straight away (so they paint with the page), then fills in
   the footer, the preview bar and each page's behaviour once the page has loaded.
   In the real build these become components; here they keep 6 pages in step. */
(function () {
  'use strict';
  var d = document.documentElement;

  /* ---------- Styles and their typefaces (all from Google Fonts) ---------- */
  var STYLES = {
    logbook: {
      name: 'Logbook',
      line: 'A fitter’s notebook: every page measured, labelled and indexed.',
      fonts: ['Instrument Sans + IBM Plex Mono', 'Schibsted Grotesk + Martian Mono', 'Newsreader + JetBrains Mono'],
      swatches: [['--bg', 'Paper'], ['--surface', 'Card'], ['--ink', 'Graphite'], ['--ink-2', 'Pencil'], ['--rule', 'Ruled line'], ['--link', 'Ink blue: you can act'], ['--mark', 'Highlighter: remember this']]
    },
    velodrome: {
      name: 'Velodrome',
      line: 'A race-day programme: bold headlines, painted track lines and big numbers.',
      fonts: ['Archivo + Source Serif 4 + JetBrains Mono', 'Barlow Condensed + Literata + IBM Plex Mono', 'Sofia Sans Extra Condensed + Newsreader + Space Mono'],
      swatches: [['--bg', 'Paper'], ['--surface', 'Infield'], ['--ink', 'Ink'], ['--ink-2', 'Grey'], ['--band', 'Band'], ['--blue', 'Blue line'], ['--red', 'Red line']]
    },
    workstand: {
      name: 'Workstand',
      line: 'A tidy workshop: every tool has its place and its own colour.',
      fonts: ['Geist + Geist Mono', 'Plus Jakarta Sans + JetBrains Mono', 'Figtree + DM Mono'],
      swatches: [['--bg', 'Bench'], ['--surface', 'Shelf'], ['--ink', 'Ink'], ['--ink-2', 'Label'], ['--learn', 'Learn blue'], ['--fit', 'Fit green'], ['--bike', 'Bike amber']]
    }
  };
  var ORDER = ['logbook', 'velodrome', 'workstand'];

  /* ---------- Source register (§7.3). Content cites sources by id only. ---------- */
  var SOURCES = {
    'hogg-height': { who: 'Steve Hogg', title: 'Seat height: how hard can it be?', url: 'https://www.stevehoggbikefitting.com/bikefit/2011/02/seat-height-how-hard-can-it-be/', note: 'The critique of inside-leg formulas and the 80% figure are in his reply to a reader on 26 July 2011.' },
    'hogg-addendum': { who: 'Steve Hogg', title: 'Addendum to seat height: how hard can it be?', url: 'https://www.stevehoggbikefitting.com/bikefit/2011/05/addendum-to-seat-height-how-hard-can-it-be-2/', note: 'In his reply to a reader on 8 May 2011.' },
    'steinmetz': { who: 'Mat Steinmetz', title: 'Guidelines for making adjustments after a bike fit', org: 'TrainingPeaks', url: 'https://www.trainingpeaks.com/blog/guidelines-for-making-adjustments-after-a-bike-fit/' },
    'cyclefit': { who: 'Jimmy Wilson', title: 'How to fit cycling cleats correctly', org: 'Cyclefit', url: 'https://www.cyclefit.co.uk/journal/how-to-fit-cycling-cleats-correctly' }
  };
  var VERIFIED = '6 November 2026';

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  function style() { return d.getAttribute('data-style'); }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Icons: original line drawings on a 24 px grid ---------- */
  function sym(id, body) { return '<symbol id="i-' + id + '" viewBox="0 0 24 24">' + body + '</symbol>'; }
  var ICONS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
    sym('mark', '<circle cx="6" cy="15.5" r="3.6"/><circle cx="18" cy="15.5" r="3.6"/><path d="M6 15.5 10 8h6.5L18 15.5M10 8l3.2 7.5h-7.2M9 6h3"/>') +
    sym('learn', '<path d="M3.5 5.5c2.8-1 5.6-1 8.5.6v13c-2.9-1.6-5.7-1.6-8.5-.6zM20.5 5.5c-2.8-1-5.6-1-8.5.6v13c2.9-1.6 5.7-1.6 8.5-.6z"/>') +
    sym('fit', '<circle cx="10" cy="11" r="6.5"/><circle cx="10" cy="11" r="1.6"/><path d="M10 17.5h10.5v-3H16M13.5 17.5v-1.6M16.5 17.5v-1.6"/>') +
    sym('bike', '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.8"/><path d="M12 3.5v6.7M4.6 16.3l5.8-3.3M19.4 16.3l-5.8-3.3"/>') +
    sym('arrow', '<path d="M5 12h14M13 6l6 6-6 6"/>') +
    sym('sun', '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>') +
    sym('moon', '<path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"/>') +
    sym('menu', '<path d="M4 8h16M4 16h16"/>') +
    sym('research', '<path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/>') +
    sym('expert', '<circle cx="12" cy="12" r="8"/>') +
    sym('thumb', '<path d="M12 4 21 19.5H3z"/>') +
    sym('info', '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/>') +
    '</svg>';

  /* ---------- Header: written now, so it paints with the page ---------- */
  var page = document.body.getAttribute('data-page') || '';
  var pillarOf = { learn: 'learn', lesson: 'learn', fit: 'fit', bike: 'bike' };
  var LINKS = [['learn', 'learn.html', 'Learn'], ['fit', 'fit.html', 'Check your fit'], ['bike', 'bike.html', 'Explore the bike']];
  var head = '<a class="skip" href="#main">Skip to content</a><header class="site-head"><nav class="nav wrap" aria-label="Main">' +
    '<a class="brand" href="index.html"' + (page === 'home' ? ' aria-current="page"' : '') + '><span class="mark" aria-hidden="true"><svg class="ico"><use href="#i-mark"/></svg></span><span class="brand-name">BikeFitter</span></a>' +
    '<ul class="nav-links" id="nav-links">' + LINKS.map(function (l, i) {
      var cur = pillarOf[page] === l[0];
      return '<li data-pillar="' + l[0] + '"><a href="' + l[1] + '"' + (cur ? ' aria-current="page"' : '') + '><span class="nav-n" aria-hidden="true">0' + (i + 1) + '</span>' +
        '<svg class="ico nav-ico" aria-hidden="true"><use href="#i-' + l[0] + '"/></svg><span class="nav-t">' + l[2] + '</span></a></li>';
    }).join('') + '</ul>' +
    '<div class="nav-tools"><button class="theme-btn" type="button" data-theme-toggle><svg class="ico i-sun" aria-hidden="true"><use href="#i-sun"/></svg><svg class="ico i-moon" aria-hidden="true"><use href="#i-moon"/></svg><span class="theme-t" aria-hidden="true"></span></button>' +
    '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><svg class="ico" aria-hidden="true"><use href="#i-menu"/></svg><span class="menu-t" aria-hidden="true">Menu</span></button></div>' +
    '</nav></header>';
  document.currentScript.insertAdjacentHTML('afterend', ICONS + head);

  /* ---------- Everything else waits for the page ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    footer();
    theme();
    menu();
    review();
    toc();
    var run = { home: home, bike: bike, fit: fit, lesson: lesson, style: guide }[page];
    if (run) run();
    names();
  });

  function names() {
    var s = STYLES[style()];
    document.querySelectorAll('[data-style-name]').forEach(function (el) { el.textContent = s.name; });
    document.querySelectorAll('[data-style-line]').forEach(function (el) { el.textContent = s.line; });
  }
  function changed() { names(); document.dispatchEvent(new CustomEvent('bf:change')); }

  /* ---------- Footer ---------- */
  function footer() {
    var f = document.querySelector('.foot');
    if (!f) return;
    var ids = (f.getAttribute('data-sources') || '').split(/\s+/).filter(Boolean);
    var list = ids.map(function (id) {
      var s = SOURCES[id];
      return '<li id="src-' + id + '">' + s.who + ', <a href="' + s.url + '">' + s.title + '</a>' + (s.org ? ', ' + s.org : '') + '. ' + (s.note ? s.note + ' ' : '') + 'Last verified ' + VERIFIED + '.</li>';
    }).join('');
    f.innerHTML = '<div class="wrap foot-in">' +
      '<p class="foot-brand" aria-hidden="true">BikeFitter</p>' +
      (list ? '<h2 class="foot-h">Sources</h2><ol class="foot-sources">' + list + '</ol>' : '') +
      '<p class="foot-note">BikeFitter gives starting points, not prescriptions. It isn’t medical advice: if you have pain, numbness or an injury, see a qualified bike fitter, a physiotherapist or your GP.</p>' +
      '<nav class="foot-nav" aria-label="Footer"><a href="index.html">Home</a><a href="learn.html">Learn</a><a href="fit.html">Check your fit</a><a href="bike.html">Explore the bike</a><a href="style.html">Style guide</a><a href="../index.html">All design directions</a></nav>' +
      '<p class="foot-meta">Design study in the <span data-style-name></span> style. Last content review ' + VERIFIED + '.</p></div>';
  }

  /* ---------- Theme ---------- */
  function theme() {
    function label() {
      var next = d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
        b.setAttribute('aria-label', 'Switch to ' + next + ' mode');
        b.setAttribute('title', 'Switch to ' + next + ' mode');
        var t = b.querySelector('.theme-t'); if (t) t.textContent = next === 'dark' ? 'Dark' : 'Light';
      });
    }
    label();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        d.setAttribute('data-theme', t); put('bf-theme', t); label(); changed();
      });
    });
  }

  /* ---------- Phone menu ---------- */
  function menu() {
    var hd = document.querySelector('.site-head'), btn = hd && hd.querySelector('.menu-btn');
    if (!btn) return;
    function open(on) { hd.classList.toggle('is-open', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false'); btn.setAttribute('aria-label', on ? 'Close menu' : 'Menu'); }
    btn.addEventListener('click', function () { open(!hd.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hd.classList.contains('is-open')) { open(false); btn.focus(); } });
    window.matchMedia('(min-width: 761px)').addEventListener('change', function (m) { if (m.matches) open(false); });
  }

  /* ---------- Preview bar: switch style and typeface (design review only) ---------- */
  function review() {
    var bar = document.createElement('aside');
    bar.className = 'review'; bar.setAttribute('aria-label', 'Design preview controls');
    bar.innerHTML = '<button class="review-toggle" type="button" aria-expanded="true">Preview</button><div class="review-body">' +
      '<label>Style <select data-review="style">' + ORDER.map(function (k) { return '<option value="' + k + '">' + STYLES[k].name + '</option>'; }).join('') + '</select></label>' +
      '<label>Typeface <select data-review="font"></select></label><a href="style.html">Style guide</a></div>';
    document.body.appendChild(bar);
    var sSel = bar.querySelector('[data-review="style"]'), fSel = bar.querySelector('[data-review="font"]'), tog = bar.querySelector('.review-toggle');
    function fill() {
      fSel.innerHTML = STYLES[style()].fonts.map(function (n, i) { return '<option value="' + (i + 1) + '">' + n + '</option>'; }).join('');
      fSel.value = d.getAttribute('data-font'); sSel.value = style();
    }
    fill();
    sSel.addEventListener('change', function () {
      d.setAttribute('data-style', sSel.value); put('bf-style', sSel.value);
      d.setAttribute('data-font', get('bf-font-' + sSel.value) || '1');
      fill(); changed();
    });
    fSel.addEventListener('change', function () { d.setAttribute('data-font', fSel.value); put('bf-font-' + style(), fSel.value); changed(); });
    function collapse(on) { bar.classList.toggle('is-collapsed', on); tog.setAttribute('aria-expanded', on ? 'false' : 'true'); put('bf-review', on ? 'closed' : 'open'); }
    var saved = get('bf-review');
    if (saved === 'closed' || (!saved && window.matchMedia('(max-width: 600px)').matches)) { bar.classList.add('is-collapsed'); tog.setAttribute('aria-expanded', 'false'); }
    tog.addEventListener('click', function () { collapse(!bar.classList.contains('is-collapsed')); });
  }

  /* ---------- "On this page" index with reading progress ---------- */
  function toc() {
    var nav = document.querySelector('.toc'), main = document.getElementById('main');
    if (!nav || !main) return;
    var items = Array.prototype.slice.call(main.querySelectorAll('[data-toc]'));
    var words = (main.textContent || '').trim().split(/\s+/).length;
    nav.innerHTML = '<p class="toc-h">On this page</p><ol>' + items.map(function (el) {
      return '<li><a href="#' + el.id + '">' + el.getAttribute('data-toc') + '</a></li>';
    }).join('') + '</ol><div class="read" aria-hidden="true"><span class="read-bar"><i></i></span><span class="read-pc">0%</span></div>' +
      '<p class="read-time">' + Math.max(1, Math.round(words / 230)) + ' min read</p>';
    var links = nav.querySelectorAll('a'), bar = nav.querySelector('.read-bar i'), pc = nav.querySelector('.read-pc'), ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight, p = max > 0 ? clamp(window.scrollY / max) : 1;
      bar.style.width = (p * 100) + '%'; pc.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
      var cur = 0;
      items.forEach(function (el, i) { if (el.getBoundingClientRect().top < window.innerHeight * 0.35) cur = i; });
      links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Pages ---------- */
  function home() {
    BikeExplorer.mount(document.getElementById('hero-bike'), { interactive: false, dims: true, dimValues: false });
    var tile = document.getElementById('tile-bike');
    if (!tile) return;
    var mini = BikeExplorer.mount(tile, { interactive: false }), ticking = false;
    function update() {
      ticking = false;
      if (reduce.matches) { mini.setProgress(0.7); return; }
      var r = tile.getBoundingClientRect(), vh = window.innerHeight;
      mini.setProgress(clamp((clamp((vh - r.top) / (vh + r.height)) - 0.2) / 0.45) * 0.8);
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    update();
  }

  function lesson() {
    BikeExplorer.mount(document.getElementById('lesson-bike'), { interactive: false, dims: ['saddle'], dimValues: false });
  }

  // Scrolling through the reel takes the bike apart. The button and slider do the same in place,
  // without moving the page. Scroll only takes control back once it "catches" the bike's state.
  function bike() {
    var reel = document.getElementById('reel'), slider = document.getElementById('explode'), btn = document.getElementById('explode-btn');
    var h1 = document.getElementById('head-1'), h2 = document.getElementById('head-2');
    var api = BikeExplorer.mount(document.getElementById('stage-bike'), { lessonHref: 'learn.html' });
    var progress = 0, follow = true, lastM = 0, anim = null;
    var meter = document.querySelector('.explode-pc');
    function mapped() {
      var travel = reel.offsetHeight - window.innerHeight;
      if (travel <= 0) return progress;
      return clamp((clamp((window.scrollY - reel.offsetTop) / travel) - 0.1) / 0.7);
    }
    function set(e) {
      progress = clamp(e);
      api.setProgress(progress);
      slider.value = Math.round(progress * 100);
      slider.setAttribute('aria-valuetext', progress < 0.01 ? 'Together' : progress > 0.99 ? 'Fully apart' : Math.round(progress * 100) + '% apart');
      if (meter) meter.textContent = String(Math.round(progress * 100)).padStart(2, '0') + '%';
      d.style.setProperty('--explode', progress.toFixed(3));
      btn.querySelector('.btn-t').textContent = progress > 0.5 ? 'Put it back together' : 'Take it apart';
      var t = reduce.matches ? 0 : clamp((progress - 0.02) / 0.18);
      h1.style.opacity = 1 - t; h1.style.transform = 'translateY(' + (-16 * t) + 'px)';
      h2.style.opacity = t; h2.style.transform = 'translateY(' + (16 * (1 - t)) + 'px)';
    }
    function takeOver() { follow = false; lastM = mapped(); }
    function stop() { if (anim) { cancelAnimationFrame(anim); anim = null; } }
    function animateTo(target) {
      stop(); takeOver();
      if (reduce.matches) { set(target); return; }
      var from = progress, start = null, dur = 300 + 1100 * Math.abs(target - from);
      function step(ts) {
        if (start === null) start = ts;
        var k = clamp((ts - start) / dur);
        set(from + (target - from) * k);
        anim = k < 1 ? requestAnimationFrame(step) : null;
      }
      anim = requestAnimationFrame(step);
    }
    btn.addEventListener('click', function () { animateTo(progress > 0.5 ? 0 : 1); });
    slider.addEventListener('input', function () { stop(); takeOver(); set(slider.value / 100); });
    function onScroll() {
      if (reduce.matches) return;
      var m = mapped();
      if (!follow && !anim && (m - progress) * (lastM - progress) <= 0) follow = true;
      lastM = m;
      if (follow) set(m);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    set(0); onScroll();
  }

  function fit() {
    BikeExplorer.mount(document.getElementById('fit-bike'), { interactive: false, dims: ['saddle'], dimValues: false });
    // A ±3 mm test range around the rider's current saddle height. Basis: Mat Steinmetz suggests
    // self-adjusting a saddle by no more than 2–3 mm after a fit; Steve Hogg tests height in 3 mm steps.
    var form = document.querySelector('[data-fit-form]'), input = form.querySelector('input[name="saddle"]');
    var error = form.querySelector('[data-fit-error]'), result = document.getElementById('fit-result'), fmt = new Intl.NumberFormat('en-GB');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mm = Math.round(parseFloat(String(input.value).replace(',', '.')));
      if (!isFinite(mm) || mm < 550 || mm > 900) { error.hidden = false; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      error.hidden = true; input.removeAttribute('aria-invalid');
      result.querySelector('[data-lo]').textContent = fmt.format(mm - 3);
      result.querySelector('[data-hi]').textContent = fmt.format(mm + 3);
      result.querySelector('[data-now]').textContent = fmt.format(mm);
      result.classList.remove('is-new'); void result.offsetWidth; result.classList.add('is-new');
    });
    ruler(document.getElementById('ruler-g'));
  }

  function ruler(g) {
    if (!g) return;
    var x0 = 40, k = 100, s = '';
    function X(v) { return x0 + v * k; }
    s += '<rect class="body" x="' + (x0 - 24) + '" y="110" width="' + (12 * k + 48) + '" height="96"/>';
    for (var i = 0; i <= 24; i++) {
      var v = i / 2, major = i % 2 === 0;
      s += '<line class="tick' + (major ? ' major' : '') + '" x1="' + X(v) + '" x2="' + X(v) + '" y1="110" y2="' + (major ? 146 : 130) + '"/>';
      if (major) s += '<text class="num" x="' + X(v) + '" y="178">' + v + '</text>';
    }
    function bracket(a, b, y, label, cls) {
      s += '<rect class="span ' + cls + '" x="' + X(a) + '" y="' + y + '" width="' + Math.max(4, X(b) - X(a)) + '" height="6"/>';
      s += '<line class="cap ' + cls + '" x1="' + X(a) + '" x2="' + X(a) + '" y1="' + (y + 3) + '" y2="110"/>';
      if (b !== a) s += '<line class="cap ' + cls + '" x1="' + X(b) + '" x2="' + X(b) + '" y1="' + (y + 3) + '" y2="110"/>';
      s += '<text class="tag-t ' + cls + '" x="' + (X(a) + X(b)) / 2 + '" y="' + (y - 12) + '">' + label + '</text>';
    }
    bracket(2, 3, 72, '2–3 mm', 'a'); bracket(3, 3, 32, '3 mm', 'b'); bracket(5, 10, 72, '5–10 mm', 'a'); bracket(10, 10, 32, '10 mm', 'b');
    g.innerHTML = s;
  }

  /* Style guide: swatches read live from the active style's tokens. */
  function guide() {
    var host = document.getElementById('swatches'), fonts = document.getElementById('font-list'), bikeEl = document.getElementById('guide-bike');
    if (bikeEl) { var api = BikeExplorer.mount(bikeEl, { lessonHref: 'learn.html' }); api.setProgress(0.55); api.select('saddle'); }
    function hex(v) {
      v = v.trim();
      var m = v.match(/^rgba?\(([^)]+)\)$/);
      if (!m) return v;
      var p = m[1].split(',').map(function (n) { return parseFloat(n); });
      return '#' + p.slice(0, 3).map(function (n) { return ('0' + Math.round(n).toString(16)).slice(-2); }).join('');
    }
    function draw() {
      var s = STYLES[style()], cs = getComputedStyle(d);
      host.innerHTML = s.swatches.map(function (w) {
        return '<li><span class="chip" style="background:var(' + w[0] + ')"></span><b>' + w[1] + '</b><code>' + w[0] + '</code><span>' + hex(cs.getPropertyValue(w[0])) + '</span></li>';
      }).join('');
      fonts.innerHTML = s.fonts.map(function (n, i) { return '<li' + (String(i + 1) === d.getAttribute('data-font') ? ' aria-current="true"' : '') + '>' + n + (i === 0 ? ' (default)' : '') + '</li>'; }).join('');
    }
    draw();
    document.addEventListener('bf:change', draw);
  }
})();
