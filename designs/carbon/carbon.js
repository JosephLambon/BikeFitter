/* BikeFitter: Carbon. Shared behaviour for every Carbon page.
   - Appearance: [data-theme-toggle] buttons switch between dark (default) and light.
     The choice is stored in localStorage; an inline script in each <head> applies it
     before first paint so the page never flashes the wrong colours.
   - Menu: on narrow screens, .menu-btn opens and closes the nav links. */
(function () {
  'use strict';
  var KEY = 'bikefitter-carbon-theme', root = document.documentElement;

  function theme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function label() {
    var next = theme() === 'light' ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      b.setAttribute('title', 'Switch to ' + next + ' mode');
    });
  }
  function setTheme(t) {
    if (t === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    try { localStorage.setItem(KEY, t); } catch (e) { /* storage unavailable: still works for this page */ }
    label();
  }

  document.addEventListener('DOMContentLoaded', function () {
    label();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () { setTheme(theme() === 'light' ? 'dark' : 'light'); });
    });

    var nav = document.querySelector('.nav'), menu = nav && nav.querySelector('.menu-btn');
    if (!menu) return;
    function open(on) {
      nav.classList.toggle('is-open', on);
      menu.setAttribute('aria-expanded', on ? 'true' : 'false');
      menu.setAttribute('aria-label', on ? 'Close menu' : 'Menu');
    }
    menu.addEventListener('click', function () { open(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { open(false); menu.focus(); }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', function (m) { if (m.matches) open(false); });
  });
})();
