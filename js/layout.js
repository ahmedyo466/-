(() => {
// إعدادات مركزية: مسارات صور الأقسام (بالترتيب) وصورة القسم الترويجي
const IMG = { tiles: [], promo: '' };
const TAGLINE = 'كل اللي يخص بيتك .. بأفضل سعر';

const $ = id => document.getElementById(id);
const main = $('main'), banner = $('banner');
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; };
const svg = d => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const P = {
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrow: '<path d="m15 18-6-6 6-6"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  wa: '<path d="M3 21l1.65-4.9A8.5 8.5 0 1 1 8 19.4L3 21z"/>'
};
const isHome = () => ['', '#/', '#/home'].includes(location.hash);
const link = (h, t) => { const a = el('a', '', t); a.href = h; return a; };

// القائمة الجانبية
const scrim = el('div', 'scrim'), drawer = el('aside', 'drawer');
drawer.setAttribute('aria-label', 'القائمة');
document.body.append(scrim, drawer);
const open = o => {
  drawer.classList.toggle('open', o); scrim.classList.toggle('open', o);
  $('menu').setAttribute('aria-expanded', o);
  if (o) drawer.querySelector('button').focus(); else $('menu').focus();
};
const buildDrawer = () => {
  drawer.textContent = '';
  const h = el('div', 'dh'), im = el('img'); im.src = 'img/logo.jpg'; im.alt = 'عالم التوفير';
  const x = el('button', 'ic'); x.type = 'button'; x.setAttribute('aria-label', 'إغلاق'); x.innerHTML = svg(P.x);
  h.append(im, x); drawer.append(h);
  [['#/', 'الرئيسية'], ['#/search/', 'جميع المنتجات'], ['#/offers', 'العروض'], ['#/new', 'أحدث المنتجات']].forEach(([a, t]) => drawer.append(link(a, t)));
  drawer.append(el('h3', '', 'الأقسام'));
  document.querySelectorAll('#nav a[href^="#/cat/"]').forEach(a => drawer.append(link(a.getAttribute('href'), a.textContent)));
  drawer.append(el('h3', '', 'حسابي'));
  [['#/saved', 'المحفوظات'], ['#/cart', 'السلة'], ['#/login', 'حسابي'], ['#/complaints', 'الشكاوى']].forEach(([a, t]) => drawer.append(link(a, t)));
};
$('menu').addEventListener('click', () => open(true));
scrim.addEventListener('click', () => open(false));
drawer.addEventListener('click', e => { if (e.target.closest('button') || e.target.closest('a')) open(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) open(false); });

// شريط التنقل السفلي
const bn = el('nav', 'bn'); bn.setAttribute('aria-label', 'التنقل السفلي');
const bi = (t, ic, h) => { const a = el(h ? 'a' : 'button'); if (h) a.href = h; else a.type = 'button'; a.innerHTML = svg(P[ic]) + `<span>${t}</span>`; return a; };
const bHome = bi('الرئيسية', 'home', '#/'), bCat = bi('الأقسام', 'grid'), bSearch = bi('بحث', 'search'), bCart = bi('السلة', 'cart', '#/cart'), bAcc = bi('حسابي', 'user', '#/login');
const badge = el('i'); badge.hidden = true; bCart.append(badge);
bn.append(bHome, bCat, bSearch, bCart, bAcc); document.body.append(bn);
bCat.addEventListener('click', () => open(true));
bSearch.addEventListener('click', () => { scrollTo(0, 0); $('q').focus(); });
const syncBadge = () => { const s = document.querySelector('#cartLink span'); const n = s ? s.textContent.trim() : ''; badge.textContent = n; badge.hidden = !n || n === '٠' || n === '0'; };
new MutationObserver(syncBadge).observe($('cartLink'), { childList: true, subtree: true, characterData: true });
const mark = () => {
  const h = location.hash;
  [[bHome, isHome()], [bCart, h === '#/cart'], [bAcc, h === '#/login']].forEach(([b, on]) => on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
};

// القسم الترويجي
const promo = el('section', 'promo'); promo.setAttribute('aria-label', 'مساحة ترويجية');
if (IMG.promo) { const i = el('img'); i.src = IMG.promo; i.alt = ''; promo.append(i); }
main.after(promo);

// الفوتر
const fl = el('div', 'wrap flinks');
[['#/', 'الرئيسية'], ['#/offers', 'العروض'], ['#/new', 'أحدث المنتجات'], ['#/saved', 'المحفوظات'], ['#/complaints', 'الشكاوى']].forEach(([h, t]) => fl.append(link(h, t)));
fl.append(el('span', '', TAGLINE));
document.querySelector('.fbar').after(fl);
const social = () => {
  const s = $('soc'); s.textContent = '';
  const a = el('a'); a.href = 'https://wa.me/' + (window.CONFIG.whatsapp || ''); a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', 'واتساب'); a.innerHTML = svg(P.wa).replace('width="22" height="22"', 'width="26" height="26"');
  s.append(a);
};
new MutationObserver(() => { social(); buildDrawer(); }).observe($('nav'), { childList: true });
social(); buildDrawer();

// تزيين الصفحة
const decorate = () => {
  const home = isHome();
  banner.hidden = !home; promo.hidden = !home;
  mark(); syncBadge();
  main.querySelectorAll('[data-act=save] svg').forEach(s => { if (s.querySelector('polygon')) s.innerHTML = P.heart; });
  if (location.hash === '#/search/') { const t = main.querySelector('h1'); if (t) t.textContent = 'جميع المنتجات'; }
  const grid = main.querySelector('.grid');
  if (!home || main.querySelector('.panel') || !grid) return;
  const tiles = el('div', 'tiles');
  document.querySelectorAll('#nav a[href^="#/cat/"]').forEach((a, n) => {
    const t = el('a', 'tile'); t.href = a.getAttribute('href');
    if (IMG.tiles[n]) { const i = el('img'); i.src = IMG.tiles[n]; i.alt = ''; t.append(i); }
    t.append(el('span', '', a.textContent));
    const i = el('i'); i.innerHTML = svg(P.arrow); t.append(i);
    tiles.append(t);
  });
  const panel = el('section', 'panel'), ph = el('div', 'ph'), h1 = main.querySelector('h1');
  if (h1) { h1.textContent = 'المنتجات'; h1.removeAttribute('class'); ph.append(h1); }
  ph.append(link('#/search/', 'عرض الكل'));
  panel.append(ph, grid); main.prepend(panel);
  if (tiles.children.length) main.prepend(tiles);
};
new MutationObserver(decorate).observe(main, { childList: true });
window.addEventListener('hashchange', decorate);
decorate();
})();
