(() => {
const C = window.CONFIG, M = document.getElementById('main');
if (!window.supabase || !C.supabaseUrl || C.supabaseUrl.startsWith('YOUR')) return;
const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => n.toLocaleString('ar-EG') + ' ' + C.currency;
const OF = { monthly: 'عرض شهري', weekly: 'عرض أسبوعي', daily: 'عرض يومي' };
const norm = s => String(s || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const SW = { 'أسود': '#111', 'أبيض': '#fff', 'أحمر': '#f21d2f', 'أصفر': '#ffd21c', 'أزرق': '#1d5fd1', 'أخضر': '#1e8a3c' };
const QK = [['أقل من 100', '', 100], ['100 إلى 250', 100, 250], ['250 إلى 500', 250, 500], ['أكثر من 500', 500, '']];
const fresh = () => ({ cat: [], min: '', max: '', colors: [], brands: [], stock: false, sort: 'new', q: '' });
let P = [], cats = [], ready = false, loading = null, F = fresh(), shown = 12, last = '';

const st = document.createElement('style');
st.textContent = `.bc{font-size:13px;color:#5c5a55;margin-top:16px}.bc a{color:inherit}
.bar2{display:flex;gap:8px;margin-bottom:12px}.bar2 select{flex:1;min-width:0}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.chip{min-height:36px;padding:0 12px;border-radius:999px;border:0;background:var(--k);color:var(--y);font:inherit;font-size:13px;cursor:pointer}
.more{display:flex;justify-content:center;margin-bottom:28px}
.sh-back{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:11;opacity:0;visibility:hidden;transition:opacity .2s,visibility .2s}
.sheet{position:fixed;inset-inline:0;bottom:0;margin-inline:auto;max-width:560px;max-height:85vh;overflow-y:auto;background:var(--k);color:#fff;border-radius:18px 18px 0 0;border-top:4px solid var(--y);padding:16px 16px calc(16px + env(safe-area-inset-bottom));z-index:12;transform:translateY(100%);visibility:hidden;transition:transform .2s,visibility .2s}
.sheet.open{transform:none;visibility:visible}.sh-back.open{opacity:1;visibility:visible}
.sheet h3{margin:16px 0 8px;font-size:15px;color:var(--y)}
.sheet .chk{display:flex;align-items:center;gap:8px;min-height:40px;font-weight:400}
.sheet input[type=checkbox]{width:20px;min-height:20px}
.sheet .pr{display:flex;gap:8px}.sheet .pr input{background:#1b1b1b;color:#fff;border-color:#303030}
.sheet .qk{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.sheet .acts{display:flex;gap:8px;margin-top:20px}.sheet .acts .pri{flex:1}
.sw{display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid #777}`;
document.head.append(st);

const back = document.createElement('div'); back.className = 'sh-back';
const sheet = document.createElement('form'); sheet.className = 'sheet'; sheet.setAttribute('aria-label', 'الفلاتر');
document.body.append(back, sheet);

const load = () => loading || (loading = (async () => {
  const [c, p] = await Promise.all([sb.from('categories').select('id,name').order('sort').order('id'), sb.from('products').select('*').eq('is_active', true)]);
  if (c.error || p.error) { loading = null; return false; }
  cats = c.data; const now = Date.now();
  P = p.data.map(r => {
    const on = r.offer_type !== 'none' && (!r.offer_starts_at || Date.parse(r.offer_starts_at) <= now) && (!r.offer_ends_at || Date.parse(r.offer_ends_at) > now);
    return { id: r.id, name: r.name, desc: r.description || '', cat: r.category_id, price: Number(r.price), old: on && r.old_price ? Number(r.old_price) : 0,
      offer: on ? r.offer_type : 'none', at: Date.parse(r.created_at), stock: r.in_stock, img: r.image_url, demo: r.is_demo,
      brand: r.brand || '', colors: Array.isArray(r.colors) ? r.colors : [] };
  });
  ready = true; return true;
})());

const img = p => p.img ? esc(p.img) : 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#1d1d1d"/><rect x="130" y="100" width="140" height="130" rx="8" fill="#333"/><text x="200" y="290" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#bbb">${esc(p.name)}</text><text x="200" y="330" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">صورة تجريبية</text></svg>`);
const card = p => {
  const d = p.old > p.price ? Math.round((1 - p.old ? 1 - p.price / p.old : 0) * 100) : 0;
  return `<article class="card"><a href="#/product/${p.id}"><img src="${img(p)}" alt="${esc(p.name)}" loading="lazy"></a>
  <div class="cb">${p.offer !== 'none' ? `<span class="tag ${p.offer}">${OF[p.offer]}</span>` : ''}
  <a class="name" href="#/product/${p.id}">${esc(p.name)}</a>
  <div><span class="price">${money(p.price)}</span>${d ? `<span class="old">${money(p.old)}</span><span class="sub">خصم ${d}%</span>` : ''}</div>
  <div class="sub">${p.stock ? 'متوفر' : 'غير متوفر'}${p.demo ? ' | منتج تجريبي' : ''}</div>
  <div class="row"><button class="btn pri" data-act="add" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>أضف إلى السلة</button></div></div></article>`;
};

const parseQ = q => {
  let t = norm(q), min = '', max = '';
  t = t.replace(/(?:اقل من|تحت)\s*(\d+)/, (m, n) => { max = n; return ''; });
  t = t.replace(/(?:اكثر من|فوق)\s*(\d+)/, (m, n) => { min = n; return ''; });
  return { words: t.split(/\s+/).filter(Boolean), min, max };
};
const apply = () => {
  const s = parseQ(F.q), mn = Number(F.min || s.min || 0), mx = Number(F.max || s.max || 0);
  const l = P.filter(p => {
    if (F.cat.length && !F.cat.includes(p.cat)) return false;
    if (mn && p.price < mn) return false;
    if (mx && p.price > mx) return false;
    if (F.colors.length && !p.colors.some(c => F.colors.includes(c))) return false;
    if (F.brands.length && !F.brands.includes(p.brand)) return false;
    if (F.stock && !p.stock) return false;
    const hay = norm([p.name, p.brand, p.desc, (cats.find(c => c.id === p.cat) || {}).name].join(' '));
    return s.words.every(w => hay.includes(w));
  });
  return l.sort({ new: (a, b) => b.at - a.at, asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price }[F.sort]);
};

const chipsOf = () => {
  const c = [];
  F.cat.forEach(id => c.push(['cat:' + id, (cats.find(x => x.id === id) || {}).name || 'قسم']));
  if (F.min || F.max) c.push(['price', 'السعر: ' + (F.min || '0') + ' إلى ' + (F.max || 'أي سعر')]);
  F.colors.forEach(x => c.push(['color:' + x, 'اللون: ' + x]));
  F.brands.forEach(x => c.push(['brand:' + x, x]));
  if (F.stock) c.push(['stock', 'المتاح فقط']);
  return c;
};

const render = () => {
  const l = apply(), one = F.cat.length === 1 && !F.q ? cats.find(x => x.id === F.cat[0]) : null;
  const title = one ? one.name : F.q ? 'نتائج البحث عن «' + F.q + '»' : 'جميع المنتجات';
  const chips = chipsOf();
  M.innerHTML = `<div class="shop"><nav class="bc" aria-label="مسار التنقل"><a href="#/">الرئيسية</a> / <a href="#/search/">المنتجات</a>${one || F.q ? ' / ' + esc(one ? one.name : 'بحث') : ''}</nav>
  <h1>${esc(title)}</h1><p class="sub">${l.length.toLocaleString('ar-EG')} منتج</p>
  <div class="bar2"><button class="btn pri" type="button" data-shop="open">الفلاتر${chips.length ? ' (' + chips.length.toLocaleString('ar-EG') + ')' : ''}</button>
  <select id="ssort" aria-label="ترتيب المنتجات"><option value="new">الأحدث</option><option value="asc">السعر: من الأقل</option><option value="desc">السعر: من الأعلى</option></select></div>
  ${chips.length ? `<div class="chips">${chips.map(c => `<button class="chip" type="button" data-rm="${esc(c[0])}">${esc(c[1])} ×</button>`).join('')}<button class="chip" type="button" data-shop="clear">مسح الكل</button></div>` : ''}
  ${l.length ? `<div class="grid">${l.slice(0, shown).map(card).join('')}</div>${l.length > shown ? '<div class="more"><button class="btn" type="button" data-shop="more">عرض المزيد</button></div>' : ''}`
    : `<p class="empty">لا توجد منتجات تطابق اختياراتك.</p>${chips.length ? '<button class="btn pri" type="button" data-shop="clear">مسح الفلاتر</button>' : ''}`}</div>`;
  M.querySelector('#ssort').value = F.sort;
};

const uniq = f => [...new Set(P.flatMap(f).filter(Boolean))];
const openSheet = () => {
  const ck = (n, v, on, t, sw) => `<label class="chk"><input type="checkbox" data-g="${n}" value="${esc(v)}" ${on ? 'checked' : ''}> ${sw ? `<span class="sw" style="background:${sw}"></span>` : ''}${esc(t)}</label>`;
  const cl = uniq(p => p.colors), br = uniq(p => [p.brand]);
  sheet.innerHTML = `<h2>تصفية النتائج</h2>
  <h3>القسم</h3>${cats.map(c => ck('cat', c.id, F.cat.includes(c.id), c.name)).join('')}
  <h3>السعر (ج.م)</h3><div class="pr"><input id="fmin" inputmode="numeric" placeholder="من" aria-label="السعر من" value="${esc(F.min)}"><input id="fmax" inputmode="numeric" placeholder="إلى" aria-label="السعر إلى" value="${esc(F.max)}"></div>
  <div class="qk">${QK.map((q, i) => `<button class="chip" type="button" data-qk="${i}">${q[0]}</button>`).join('')}</div>
  <h3>اللون</h3>${cl.length ? cl.map(c => ck('color', c, F.colors.includes(c), c, SW[c])).join('') : '<p class="sub">لا توجد ألوان مسجلة للمنتجات بعد.</p>'}
  <h3>العلامة التجارية</h3>${br.length ? br.map(b => ck('brand', b, F.brands.includes(b), b)).join('') : '<p class="sub">لا توجد علامات تجارية مسجلة بعد.</p>'}
  <h3>التوفر</h3>${ck('stock', '1', F.stock, 'المتاح فقط')}
  <div class="acts"><button class="btn pri" type="submit">تطبيق الفلاتر</button><button class="btn" type="button" data-shop="clear">مسح الكل</button></div>`;
  sheet.classList.add('open'); back.classList.add('open');
  sheet.querySelector('input').focus();
};
const closeSheet = () => { sheet.classList.remove('open'); back.classList.remove('open'); };

sheet.addEventListener('submit', e => {
  e.preventDefault();
  const g = n => [...sheet.querySelectorAll(`[data-g=${n}]:checked`)].map(i => i.value);
  const num = v => String(v).trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
  F.cat = g('cat').map(Number); F.colors = g('color'); F.brands = g('brand'); F.stock = g('stock').length > 0;
  F.min = num(sheet.querySelector('#fmin').value); F.max = num(sheet.querySelector('#fmax').value);
  if (F.min && F.max && Number(F.min) > Number(F.max)) [F.min, F.max] = [F.max, F.min];
  shown = 12; closeSheet(); render();
});
sheet.addEventListener('click', e => {
  const q = e.target.closest('[data-qk]');
  if (q) { const k = QK[q.dataset.qk]; sheet.querySelector('#fmin').value = k[1]; sheet.querySelector('#fmax').value = k[2]; }
});
back.addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

document.addEventListener('click', e => {
  if (!M.querySelector('.shop') && !e.target.closest('.sheet')) return;
  const s = e.target.closest('[data-shop]'), r = e.target.closest('[data-rm]');
  if (s) {
    const a = s.dataset.shop;
    if (a === 'open') openSheet();
    if (a === 'more') { shown += 12; render(); }
    if (a === 'clear') { const k = F.cat.length === 1 && !F.q ? F.cat : []; F = { ...fresh(), q: F.q, sort: F.sort }; closeSheet(); shown = 12; render(); }
  }
  if (r) {
    const [t, v] = r.dataset.rm.split(/:(.*)/s);
    if (t === 'cat') F.cat = F.cat.filter(x => x !== Number(v));
    if (t === 'price') F.min = F.max = '';
    if (t === 'color') F.colors = F.colors.filter(x => x !== v);
    if (t === 'brand') F.brands = F.brands.filter(x => x !== v);
    if (t === 'stock') F.stock = false;
    shown = 12; render();
  }
});
document.addEventListener('change', e => { if (e.target.id === 'ssort') { F.sort = e.target.value; render(); } });

const route = () => { const [r, a = ''] = location.hash.slice(2).split('/'); return ['search', 'cat'].includes(r) ? { r, a: decodeURIComponent(a) } : null; };
const go = async () => {
  const rt = route();
  if (!rt || M.querySelector('.shop')) return;
  if (location.hash !== last) {
    last = location.hash; F = fresh(); shown = 12;
    if (rt.r === 'cat') F.cat = [Number(rt.a)]; else F.q = rt.a.trim();
  }
  if (!ready) {
    M.innerHTML = '<div class="shop"><p class="empty">جار التحميل...</p></div>';
    const ok = await load();
    if (!route()) return;
    if (!ok) { M.innerHTML = '<div class="shop"><p class="status" style="margin-top:24px">تعذر تحميل المنتجات. حاول مرة أخرى.</p></div>'; return; }
    if (M.querySelector('.shop')) render();
    return;
  }
  render();
};
new MutationObserver(go).observe(M, { childList: true });
window.addEventListener('hashchange', () => setTimeout(go, 0));
go();
})();
