(() => {
const C = window.CONFIG, P = window.PRODUCTS;
const M = document.getElementById('main');
const IC = {
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  back: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'
};
const ic = n => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ld = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const money = n => n.toLocaleString('ar-EG') + ' ' + C.currency;
const byId = id => P.find(p => p.id == id);
const OF = { monthly: 'عرض شهري', weekly: 'عرض أسبوعي', daily: 'عرض يومي' };
let saved = ld('saved', []), cart = ld('cart', {});

const img = p => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#ececec"/><rect x="130" y="100" width="140" height="130" rx="8" fill="#cfcfcf"/><text x="200" y="290" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#444">${esc(p.name)}</text><text x="200" y="330" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#666">صورة تجريبية</text></svg>`);

const order = () => {
  let o; try { o = JSON.parse(sessionStorage.getItem('ord')); } catch {}
  if (!o || o.length !== P.length) {
    o = P.map(p => p.id).sort(() => Math.random() - .5);
    try { sessionStorage.setItem('ord', JSON.stringify(o)); } catch {}
  }
  return o.map(byId);
};

const card = p => {
  const on = saved.includes(p.id), d = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  return `<article class="card"><a href="#/product/${p.id}"><img src="${img(p)}" alt="${esc(p.name)} (صورة تجريبية)" loading="lazy"></a>
  <div class="cb">${p.offer !== 'none' ? `<span class="tag ${p.offer}">${OF[p.offer]}</span>` : ''}
  <a class="name" href="#/product/${p.id}">${esc(p.name)}</a>
  <div><span class="price">${money(p.price)}</span>${d ? `<span class="old">${money(p.old)}</span><span class="sub">خصم ${d}%</span>` : ''}</div>
  <div class="sub">${p.stock ? 'متوفر' : 'غير متوفر'}</div>
  <div class="row"><button class="btn pri" data-act="add" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>أضف إلى السلة</button>
  <button class="btn" data-act="save" data-id="${p.id}" aria-pressed="${on}" aria-label="${on ? 'إزالة من المحفوظات' : 'حفظ المنتج'}">${ic('star')}</button></div></div></article>`;
};
const grid = l => `<div class="grid">${l.map(card).join('')}</div>`;
const empty = t => `<p class="empty">${t}</p>`;

const R = {
  home: () => `<h1>منتجات المنزل</h1>${grid(order())}`,
  cat: id => {
    const c = C.categories.find(x => x.id == id);
    if (!c) return R.home();
    const l = P.filter(p => p.cat == c.id);
    return `<h1>${esc(c.name)}</h1>${l.length ? grid(l) : empty('لا توجد منتجات في هذا القسم بعد.')}`;
  },
  offers: t => {
    const tabs = Object.keys(OF).map(k => `<a class="${k}" href="#/offers/${k}" ${t === k ? 'aria-current="page"' : ''}>${OF[k]}</a>`).join('');
    let body = empty('اختر نوع العرض لعرض المنتجات.');
    if (OF[t]) {
      const l = P.filter(p => p.offer === t);
      body = l.length ? grid(l) : empty('لا توجد منتجات في هذا النوع من العروض حاليًا.');
    }
    return `<h1>العروض</h1><div class="offers">${tabs}</div>${body}`;
  },
  new: () => {
    const l = [...P].sort((a, b) => b.addedAt - a.addedAt).slice(0, 12);
    return `<h1>أحدث المنتجات</h1>${l.length ? grid(l) : empty('لا توجد منتجات جديدة حاليًا.')}`;
  },
  saved: () => {
    const l = saved.map(byId).filter(Boolean);
    return `<h1>المحفوظات</h1><p class="sub">المحفوظات مرتبطة بهذا المتصفح وهذا الجهاز فقط.</p>${l.length ? grid(l) : empty('لم تحفظ أي منتج بعد. اضغط على النجمة في أي منتج لحفظه.')}`;
  },
  search: q => {
    const l = P.filter(p => p.name.includes(q.trim()));
    return `<h1>نتائج البحث</h1>${l.length ? grid(l) : empty('لا توجد منتجات تطابق بحثك.')}`;
  },
  product: id => {
    const p = byId(id);
    if (!p) return R.home();
    return `<p><button class="btn" data-act="back">${ic('back')} رجوع</button></p><div class="pd"><img src="${img(p)}" alt="${esc(p.name)} (صورة تجريبية)">
    <div><h1>${esc(p.name)}</h1><p class="sub">القسم: ${esc(C.categories.find(c => c.id === p.cat).name)}</p>${p.offer !== 'none' ? `<span class="tag ${p.offer}">${OF[p.offer]}</span>` : ''}
    <p><span class="price">${money(p.price)}</span>${p.old > p.price ? `<span class="old">${money(p.old)}</span>` : ''}</p>
    <p class="sub">${p.stock ? 'متوفر' : 'غير متوفر'}</p>
    <div class="row"><button class="btn pri" data-act="add" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>أضف إلى السلة</button>
    <button class="btn" data-act="save" data-id="${p.id}" aria-pressed="${saved.includes(p.id)}" aria-label="حفظ أو إزالة المنتج">${ic('star')}</button></div></div></div>`;
  },
  cart: () => {
    const l = Object.keys(cart).map(id => ({ p: byId(id), q: cart[id] })).filter(x => x.p);
    if (!l.length) return `<h1>السلة</h1>${empty('السلة فارغة.')}`;
    const tot = l.reduce((s, x) => s + x.p.price * x.q, 0);
    const msg = `طلب جديد من ${C.storeName}\n` + l.map(x => `- ${x.p.name} × ${x.q} = ${money(x.p.price * x.q)}`).join('\n') + `\nالإجمالي: ${money(tot)}`;
    return `<h1>السلة</h1><div class="box">${l.map(x => `<div class="item"><div><div class="name">${esc(x.p.name)}</div><div class="sub">${money(x.p.price)} للقطعة، الإجمالي ${money(x.p.price * x.q)}</div></div>
    <div class="qty"><button class="btn" data-act="dec" data-id="${x.p.id}" aria-label="تقليل الكمية">${ic('minus')}</button><span>${x.q.toLocaleString('ar-EG')}</span><button class="btn" data-act="inc" data-id="${x.p.id}" aria-label="زيادة الكمية">${ic('plus')}</button><button class="btn" data-act="del" data-id="${x.p.id}" aria-label="حذف المنتج">${ic('trash')}</button></div></div>`).join('')}
    <div class="total">الإجمالي: ${money(tot)}</div>
    <a class="btn pri" target="_blank" rel="noopener" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}">إرسال الطلب عبر واتساب</a>
    <p class="sub">رقم واتساب الحالي تجريبي. فتح واتساب لا يسجل الطلب في قاعدة بيانات.</p></div>`;
  },
  complaints: () => {
    const fl = (id, label, inner) => `<div class="f"><label for="${id}">${label}</label>${inner}<div class="er" id="e-${id}" aria-live="polite"></div></div>`;
    return `<h1>الشكاوى</h1><form id="cf" novalidate>
    ${fl('name', 'الاسم', '<input id="name" name="name" autocomplete="name">')}
    ${fl('phone', 'رقم الهاتف', '<input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel">')}
    ${fl('order', 'رقم الطلب (إن وجد)', '<input id="order" name="order">')}
    ${fl('type', 'نوع الشكوى', '<select id="type" name="type"><option value="">اختر نوع الشكوى</option><option>مشكلة في منتج</option><option>تأخر الطلب</option><option>مشكلة في السعر أو العرض</option><option>مشكلة في التوصيل</option><option>شكوى أخرى</option></select>')}
    ${fl('details', 'تفاصيل الشكوى', '<textarea id="details" name="details"></textarea>')}
    <button class="btn pri" type="submit">إرسال الشكوى</button><div id="st" role="status" style="margin-top:16px"></div></form>`;
  }
};

const render = () => {
  const [r, a = ''] = location.hash.slice(2).split('/');
  const arg = decodeURIComponent(a);
  const h = r === 'cat' ? R.cat(arg) : Object.hasOwn(R, r) && r !== 'home' && r !== 'cat' ? R[r](arg) : R.home();
  M.innerHTML = h;
  document.querySelectorAll('#nav a').forEach(x => x.toggleAttribute('aria-current', x.getAttribute('href').split('/')[1] === r && (r !== 'cat' || x.getAttribute('href') === '#/cat/' + arg)));
  document.querySelectorAll('#nav a[aria-current]').forEach(x => x.setAttribute('aria-current', 'page'));
  document.getElementById('cartLink').innerHTML = ic('cart') + `<span>${Object.values(cart).reduce((s, n) => s + n, 0).toLocaleString('ar-EG')}</span>`;
};

document.getElementById('nav').innerHTML = [['#/offers', 'العروض'], ['#/new', 'أحدث المنتجات'],
  ...C.categories.map(c => ['#/cat/' + c.id, esc(c.name)]), ['#/saved', 'المحفوظات'], ['#/complaints', 'الشكاوى']]
  .map(x => `<a href="${x[0]}">${x[1]}</a>`).join('');
document.getElementById('foot').textContent = C.storeName + ' | بيانات المنتجات تجريبية في هذه المرحلة';
document.title = C.storeName;
document.getElementById('logo').textContent = C.storeName;

document.getElementById('q').addEventListener('input', e => {
  const v = e.target.value.trim();
  location.hash = v ? '#/search/' + encodeURIComponent(v) : '#/';
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const id = Number(b.dataset.id), act = b.dataset.act;
  if (act === 'back') return history.back();
  if (act === 'save') saved = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
  if (act === 'add' || act === 'inc') cart[id] = (cart[id] || 0) + 1;
  if (act === 'dec') { cart[id] > 1 ? cart[id]-- : delete cart[id]; }
  if (act === 'del') delete cart[id];
  sv('saved', saved); sv('cart', cart);
  const y = scrollY; render(); scrollTo(0, y);
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'cf') return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const ph = (d.phone || '').trim().replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x));
  const er = {};
  if (!d.name.trim()) er.name = 'اكتب اسمك';
  if (!/^01[0125]\d{8}$/.test(ph)) er.phone = 'اكتب رقم موبايل مصري صحيح من 11 رقمًا';
  if (!d.type) er.type = 'اختر نوع الشكوى';
  if (d.details.trim().length < 10) er.details = 'اكتب تفاصيل الشكوى (10 أحرف على الأقل)';
  ['name', 'phone', 'type', 'details'].forEach(k => { document.getElementById('e-' + k).textContent = er[k] || ''; });
  const st = document.getElementById('st');
  st.className = Object.keys(er).length ? '' : 'status';
  st.textContent = Object.keys(er).length ? '' : 'لم يتم إرسال الشكوى. حفظ الشكاوى في قاعدة البيانات يبدأ في المرحلة الثانية.';
});

window.addEventListener('hashchange', () => { render(); scrollTo(0, 0); M.focus({ preventScroll: true }); });
render();
})();
