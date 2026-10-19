(() => {
const C = window.CONFIG, M = document.getElementById('main');
if (!window.supabase || !C.supabaseUrl || C.supabaseUrl.startsWith('YOUR')) return;
const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => n.toLocaleString('ar-EG') + ' ' + C.currency;
const OF = { monthly: 'عرض شهري', weekly: 'عرض أسبوعي', daily: 'عرض يومي' };
const cache = {};

const st = document.createElement('style');
st.textContent = `.det{display:grid;gap:16px;padding-bottom:24px}
.det .pic{background:var(--inner);border:1px solid var(--line);border-radius:14px;padding:12px}
.det .pic img{width:100%;aspect-ratio:1;object-fit:contain;display:block;border:0;border-radius:0}
.det .info{background:var(--card);color:#fff;border:1px solid var(--line);border-top:4px solid var(--y);border-radius:14px;padding:16px}
.det h1{margin:8px 0;font-size:22px}
.det .price{font-size:24px;color:var(--y)}
.det .sub{color:var(--mut)}
.det .desc{color:#ddd;white-space:pre-wrap}
.det .btn:not(.pri){background:var(--inner);color:#fff;border-color:var(--line)}
.det .btn.pri{width:100%;min-height:48px}
.det .btn[aria-pressed=true]{color:var(--rd);border-color:var(--rd)}
.qtyr{display:flex;align-items:center;gap:12px;margin:16px 0}
.qtyr output{min-width:32px;text-align:center;font-weight:700;font-size:18px}
.acts2{display:flex;gap:8px}
.bc2{font-size:13px;color:#5c5a55;margin-top:16px}.bc2 a{color:inherit}
.cont{margin:16px 0}
@media(min-width:700px){.det{grid-template-columns:1fr 1fr}}`;
document.head.append(st);

const rowOf = r => {
  const now = Date.now();
  const on = r.offer_type !== 'none' && (!r.offer_starts_at || Date.parse(r.offer_starts_at) <= now) && (!r.offer_ends_at || Date.parse(r.offer_ends_at) > now);
  return { id: r.id, name: r.name, price: Number(r.price), old: on && r.old_price ? Number(r.old_price) : 0, offer: on ? r.offer_type : 'none', img: r.image_url, stock: r.in_stock, demo: r.is_demo };
};
const img = p => p.img ? esc(p.img) : 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#1d1d1d"/><rect x="130" y="100" width="140" height="130" rx="8" fill="#333"/><text x="200" y="290" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#bbb">${esc(p.name)}</text><text x="200" y="330" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#888">صورة تجريبية</text></svg>`);
const card = p => `<article class="card"><a href="#/product/${p.id}"><img src="${img(p)}" alt="${esc(p.name)}" loading="lazy"></a>
  <div class="cb">${p.offer !== 'none' ? `<span class="tag ${p.offer}">${OF[p.offer]}</span>` : ''}<a class="name" href="#/product/${p.id}">${esc(p.name)}</a>
  <div><span class="price">${money(p.price)}</span>${p.old > p.price ? `<span class="old">${money(p.old)}</span>` : ''}</div>
  <div class="sub">${p.stock ? 'متوفر' : 'غير متوفر'}</div>
  <div class="row"><button class="btn pri" data-act="add" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>أضف إلى السلة</button></div></div></article>`;

const fetchP = async id => {
  const r = await sb.from('products').select('*').eq('id', id).eq('is_active', true).maybeSingle();
  if (r.error || !r.data) return null;
  const cid = r.data.category_id;
  const [c, s] = cid ? await Promise.all([
    sb.from('categories').select('id,name').eq('id', cid).maybeSingle(),
    sb.from('products').select('*').eq('category_id', cid).eq('is_active', true).neq('id', id).limit(4)
  ]) : [{ data: null }, { data: [] }];
  return { r: r.data, cat: c.data, sim: (s.data || []).map(rowOf) };
};

const showProduct = async id => {
  const d = cache[id] || (cache[id] = await fetchP(id));
  if (!d || !location.hash.startsWith('#/product/' + id) || M.querySelector('.det-wrap')) return;
  const save = M.querySelector('[data-act=save]');
  const p = rowOf(d.r), r = d.r, disc = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const colors = Array.isArray(r.colors) ? r.colors : [];
  M.innerHTML = `<div class="det-wrap"><nav class="bc2" aria-label="مسار التنقل"><a href="#/">الرئيسية</a> / ${d.cat ? `<a href="#/cat/${d.cat.id}">${esc(d.cat.name)}</a> / ` : ''}${esc(r.name)}</nav>
  <div class="det" style="margin-top:12px"><div class="pic"><img src="${img(p)}" alt="${esc(r.name)}"></div>
  <div class="info">${p.offer !== 'none' ? `<span class="tag ${p.offer}" style="position:static;display:inline-block">${OF[p.offer]}</span>` : ''}
  <h1>${esc(r.name)}</h1>${r.brand ? `<p class="sub">العلامة التجارية: ${esc(r.brand)}</p>` : ''}
  <p><span class="price">${money(p.price)}</span>${disc ? `<span class="old">${money(p.old)}</span><span class="sub">خصم ${disc}%</span>` : ''}</p>
  <p class="sub">${p.stock ? 'متوفر' : 'غير متوفر حاليًا'}${p.demo ? ' | منتج تجريبي' : ''}</p>
  ${colors.length ? `<p class="sub">الألوان المتاحة: ${colors.map(esc).join('، ')}</p>` : ''}
  ${r.description ? `<h2>الوصف</h2><p class="desc">${esc(r.description)}</p>` : ''}
  ${p.stock ? `<div class="qtyr"><button class="btn" type="button" data-det="dec" aria-label="تقليل الكمية">−</button><output data-q="1" aria-live="polite">١</output><button class="btn" type="button" data-det="inc" aria-label="زيادة الكمية">+</button></div>` : ''}
  <div class="acts2"><button class="btn pri" type="button" data-det="add" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>أضف إلى السلة</button><span class="slot"></span></div></div></div>
  ${d.sim.length ? `<h2 style="margin-top:8px">منتجات مشابهة</h2><div class="grid">${d.sim.map(card).join('')}</div>` : ''}</div>`;
  if (save) M.querySelector('.slot').replaceWith(save); else M.querySelector('.slot').remove();
};

const cartExtra = () => {
  if (location.hash !== '#/cart' || M.querySelector('.cont')) return;
  const p = document.createElement('p'); p.className = 'cont';
  p.innerHTML = '<a class="btn" href="#/search/">متابعة التسوق</a>';
  const e = M.querySelector('.empty');
  e ? e.after(p) : M.querySelector('h1') && M.querySelector('h1').after(p);
};

const go = () => {
  const m = location.hash.match(/^#\/product\/(\d+)/);
  if (m) showProduct(Number(m[1])); else cartExtra();
};
new MutationObserver(go).observe(M, { childList: true });
window.addEventListener('hashchange', () => setTimeout(go, 0));

document.addEventListener('click', e => {
  const b = e.target.closest('[data-det]');
  if (!b || b.disabled) return;
  const o = M.querySelector('.qtyr output');
  let q = o ? Number(o.dataset.q) : 1;
  if (b.dataset.det === 'inc') q = Math.min(q + 1, 20);
  if (b.dataset.det === 'dec') q = Math.max(q - 1, 1);
  if (o) { o.dataset.q = q; o.textContent = q.toLocaleString('ar-EG'); }
  if (b.dataset.det === 'add') {
    const t = document.createElement('button');
    t.dataset.act = 'add'; t.dataset.id = b.dataset.id; t.hidden = true;
    document.body.append(t);
    for (let i = 0; i < q; i++) t.click();
    t.remove();
  }
});
go();
})();
