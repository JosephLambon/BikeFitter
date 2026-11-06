/* BikeFitter design study: runs in <head>, before first paint.
   Picks the style, typeface and theme, then sets them on <html> as
   data-style, data-font and data-theme. Order of precedence:
   URL (?style=logbook&font=2&theme=dark) > saved choice > default.
   Workstand is BikeFitter's chosen style (6 November 2026), so it is the default.
   Logbook and Velodrome stay switchable for reference only.
   The default theme follows the device until the visitor toggles it. */
(function () {
  var d = document.documentElement, S = ['logbook', 'velodrome', 'workstand'];
  var q = { get: function () { return null; } };
  try { q = new URLSearchParams(location.search); } catch (e) { /* very old browser */ }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }

  var s = q.get('style');
  if (S.indexOf(s) !== -1) put('bf-style', s); else s = get('bf-style');
  if (S.indexOf(s) === -1) s = 'workstand';

  var f = q.get('font');
  if (/^[123]$/.test(f || '')) put('bf-font-' + s, f); else f = get('bf-font-' + s);
  if (!/^[123]$/.test(f || '')) f = '1';

  var t = q.get('theme');
  if (t === 'light' || t === 'dark') put('bf-theme', t); else t = get('bf-theme');
  if (t !== 'light' && t !== 'dark') t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  d.setAttribute('data-style', s);
  d.setAttribute('data-font', f);
  d.setAttribute('data-theme', t);
})();
