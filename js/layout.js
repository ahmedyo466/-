(() => {
// إعدادات مركزية: ضع مسارات صور الأقسام (بالترتيب) وصورة القسم الترويجي هنا
const IMG = { tiles: [], promo: '' };
// مثال: tiles: ['img/cat1.jpg','img/cat2.jpg','img/cat3.jpg','img/cat4.jpg'], promo: 'img/promo.jpg'
const TAGLINE = 'كل اللي يخص بيتك .. بأفضل سعر';

const $ = id => document.getElementById(id);
const main = $('main'), banner = $('banner'), nav = $('navwrap');
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x) e.textContent = x; return e; };
const HEART = '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>';
const ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const isHome = () => ['', '#/', '#/home'].includes(location.hash);

$('menu').addEventListener('click', () => {
  const o = nav.classList.toggle('open');
  $('menu').setAttribute('aria-expanded', o);
});
nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); $('menu').setAttribute('aria-expanded', 'false'); } });

const promo = el('section', 'promo');
promo.setAttribute('aria-label', 'مساحة ترويجية');
if (IMG.promo) { const i = el('img'); i.src = IMG.promo; i.alt = ''; promo.append(i); }
main.after(promo);

const fl = el('div', 'wrap flinks');
[['#/', 'الرئيسية'], ['#/offers', 'العروض'], ['#/new', 'أحدث المنتجات'], ['#/saved', 'المحفوظات'], ['#/complaints', 'الشكاوى']]
  .forEach(([h, t]) => { const a = el('a', '', t); a.href = h; fl.append(a); });
fl.append(el('span', '', TAGLINE));
document.querySelector('.fbar').after(fl);

const social = () => {
  const s = $('soc'); s.textContent = '';
  const a = el('a'); a.href = 'https://wa.me/' + (window.CONFIG.whatsapp || ''); a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', 'واتساب');
  a.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.65-4.9A8.5 8.5 0 1 1 8 19.4L3 21z"/></svg>';
  s.append(a);
};
new MutationObserver(social).observe($('nav'), { childList: true });
social();

const decorate = () => {
  const home = isHome();
  banner.hidden = !home; promo.hidden = !home;
  main.querySelectorAll('[data-act=save] svg').forEach(s => { if (s.querySelector('polygon')) s.innerHTML = HEART; });
  const grid = main.querySelector('.grid');
  if (!home || main.querySelector('.panel') || !grid) return;
  const tiles = el('div', 'tiles');
  document.querySelectorAll('#nav a[href^="#/cat/"]').forEach((a, n) => {
    const t = el('a', 'tile'); t.href = a.getAttribute('href');
    if (IMG.tiles[n]) { const i = el('img'); i.src = IMG.tiles[n]; i.alt = ''; t.append(i); }
    t.append(el('span', '', a.textContent));
    const i = el('i'); i.innerHTML = ARROW; t.append(i);
    tiles.append(t);
  });
  const panel = el('section', 'panel');
  const h1 = main.querySelector('h1');
  if (h1) { h1.textContent = 'منتجات مميزة'; panel.append(h1); }
  grid.classList.add('rs'); panel.append(grid);
  main.prepend(panel);
  if (tiles.children.length) main.prepend(tiles);
};
new MutationObserver(decorate).observe(main, { childList: true });
window.addEventListener('hashchange', decorate);
decorate();
})();
