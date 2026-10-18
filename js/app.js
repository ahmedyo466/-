(() => {
const C = window.CONFIG;
const sb = C.supabaseUrl && !C.supabaseUrl.startsWith('YOUR') && window.supabase
  ? window.supabase.createClient(C.supabaseUrl, C.supabaseKey) : null;
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
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ld = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const money = n => n.toLocaleString('ar-EG') + ' ' + C.currency;
const OF = { monthly: 'عرض شهري', weekly: 'عرض أسبوعي', daily: 'عرض يومي' };
let P = [], cats = [], user = null, saved = ld('saved', []), cart = ld('cart', {}), loadErr = '', done = null;
const draft = {};
const byId = id => P.find(p => p.id == id);
const say = t => { document.getElementById('msg').textContent = t || ''; };

const load = async () => {
  if (!sb) { loadErr = 'لم يتم ربط قاعدة البيانات بعد. أضف بيانات Supabase في ملف js/config.js.'; return; }
  const [c, p] = await Promise.all([
    sb.from('categories').select('id,name').order('sort').order('id'),
    sb.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
  ]);
  if (c.error || p.error) { loadErr = 'تعذر تحميل البيانات. تحقق من الاتصال وحاول مرة أخرى.'; return; }
  cats = c.data;
  const s = await sb.from('store_settings').select('store_name,whatsapp').eq('id', 1).maybeSingle();
  if (s.data) {
    C.storeName = s.data.store_name;
    C.whatsapp = s.data.whatsapp;
    document.getElementById('logo').textContent = C.storeName;
    document.title = C.storeName;
  }
  const now = Date.now();
  P = p.data.map(r => {
    const on = r.offer_type !== 'none'
      && (!r.offer_starts_at || Date.parse(r.offer_starts_at) <= now)
      && (!r.offer_ends_at || Date.parse(r.offer_ends_at) > now);
    return { id: r.id, name: r.name, cat: r.category_id, price: Number(r.price),
      old: on && r.old_price ? Number(r.old_price) : 0, offer: on ? r.offer_type : 'none',
      addedAt: Date.parse(r.created_at), stock: r.in_stock, img: r.image_url, demo: r.is_demo };
  });
  loadErr = '';
};

const loadSaved = async () => {
  if (!user) { saved = ld('saved', []); return; }
  const local = ld('saved', []).filter(id => byId(id));
  if (local.length) {
    await sb.from('saved_products').upsert(local.map(id => ({ product_id: id })), { onConflict: 'user_id,product_id', ignoreDuplicates: true });
  }
  sv('saved', []);
  const r = await sb.from('saved_products').select('product_id');
  saved = r.error ? [] : r.data.map(x => x.product_id);
};

const img = p => p.img ? esc(p.img) : 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#ececec"/><rect x="130" y="100" width="140" height="130" rx="8" fill="#cfcfcf"/><text x="200" y="290" font-family="sans-serif" font-size="22" text-anchor="middle" fill="#444">${esc(p.name)}</text><text x="200" y="330" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#666">صورة تجريبية</text></svg>`);

const order = () => {
  let o; try { o = JSON.parse(sessionStorage.getItem('ord')); } catch {}
  const ids = P.map(p => p.id);
  if (!o || o.length !== ids.length || o.some(id => !ids.includes(id))) {
    o = ids.sort(() => Math.random() - .5);
    try { sessionStorage.setItem('ord', JSON.stringify(o)); } catch {}
  }
  return o.map(byId);
};

const card = p => {
  const on = saved.includes(p.id), d = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  return `<article class="card"><a href="#/product/${p.id}"><img src="${img(p)}" alt="${esc(p.name)}" loading="lazy"></a>
  <div class="cb">${p.offer !== 'none' ? `<span class="tag ${p.offer}">${OF[p.offer]}</span>` : ''}
  <a class="name" href="#/product/${p.id}">${esc(p.name)}</a>
  <div><span class="price">${money(p.price)}</span>${d ? `<span class="old">${money(p.old)}</span><span class="sub">خصم ${d}%</span>` : ''}</div>
  <div class="sub">${p.stock ? 'متوفر' : 'غير متوفر'}${p.demo ? ' | منتج تجريبي' : ''}</div>
  <div class="row"><button class="btn pri" data-act="add" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>أضف إلى السلة</button>
  <button class="btn" data-act="save" data-id="${p.id}" aria-pressed="${on}" aria-label="${on ? 'إزالة من المحفوظات' : 'حفظ المنتج'}">${ic('star')}</button></div></div></article>`;
};
const grid = l => `<div class="grid">${l.map(card).join('')}</div>`;
const empty = t => `<p class="empty">${t}</p>`;
const fl = (id, label, inner) => `<div class="f"><label for="${id}">${label}</label>${inner}<div class="er" id="e-${id}" aria-live="polite"></div></div>`;
const stBox = '<div id="st" role="status" style="margin-top:16px"></div>';

const R = {
  home: () => `<h1>منتجات المنزل</h1>${P.length ? grid(order()) : empty('لا توجد منتجات حاليًا.')}`,
  cat: id => {
    const c = cats.find(x => x.id == id);
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
    const note = user ? 'المحفوظات مرتبطة بحسابك.' : 'المحفوظات مرتبطة بهذا المتصفح وهذا الجهاز فقط. سجل الدخول لحفظها في حسابك.';
    return `<h1>المحفوظات</h1><p class="sub">${note}</p>${l.length ? grid(l) : empty('لم تحفظ أي منتج بعد. اضغط على النجمة في أي منتج لحفظه.')}`;
  },
  search: q => {
    const l = P.filter(p => p.name.includes(q.trim()));
    return `<h1>نتائج البحث</h1>${l.length ? grid(l) : empty('لا توجد منتجات تطابق بحثك.')}`;
  },
  product: id => {
    const p = byId(id);
    if (!p) return R.home();
    const c = cats.find(x => x.id === p.cat);
    return `<p><button class="btn" data-act="back">${ic('back')} رجوع</button></p><div class="pd"><img src="${img(p)}" alt="${esc(p.name)}">
    <div><h1>${esc(p.name)}</h1>${c ? `<p class="sub">القسم: ${esc(c.name)}</p>` : ''}${p.offer !== 'none' ? `<span class="tag ${p.offer}">${OF[p.offer]}</span>` : ''}
    <p><span class="price">${money(p.price)}</span>${p.old > p.price ? `<span class="old">${money(p.old)}</span>` : ''}</p>
    <p class="sub">${p.stock ? 'متوفر' : 'غير متوفر'}${p.demo ? ' | منتج تجريبي' : ''}</p>
    <div class="row"><button class="btn pri" data-act="add" data-id="${p.id}" ${p.stock ? '' : 'disabled'}>أضف إلى السلة</button>
    <button class="btn" data-act="save" data-id="${p.id}" aria-pressed="${saved.includes(p.id)}" aria-label="حفظ أو إزالة المنتج">${ic('star')}</button></div></div></div>`;
  },
  cart: () => {
    if (done) {
      return `<h1>تم تسجيل الطلب</h1><div class="box"><p>رقم طلبك: <strong>${done.id.toLocaleString('ar-EG')}</strong></p>
      <p class="sub">تم حفظ طلبك. أرسل التفاصيل للمتجر عبر واتساب ليؤكد الطلب معك.</p>
      <a class="btn pri" target="_blank" rel="noopener" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent(done.msg)}">إرسال التفاصيل عبر واتساب</a></div>
      <p><a class="btn" href="#/">متابعة التسوق</a></p>`;
    }
    const l = Object.keys(cart).map(id => ({ p: byId(id), q: cart[id] })).filter(x => x.p);
    if (!l.length) return `<h1>السلة</h1>${empty('السلة فارغة.')}`;
    const tot = l.reduce((s, x) => s + x.p.price * x.q, 0);
    return `<h1>السلة</h1><div class="box">${l.map(x => `<div class="item"><div><div class="name">${esc(x.p.name)}</div><div class="sub">${money(x.p.price)} للقطعة، الإجمالي ${money(x.p.price * x.q)}</div></div>
    <div class="qty"><button class="btn" data-act="dec" data-id="${x.p.id}" aria-label="تقليل الكمية">${ic('minus')}</button><span>${x.q.toLocaleString('ar-EG')}</span><button class="btn" data-act="inc" data-id="${x.p.id}" aria-label="زيادة الكمية">${ic('plus')}</button><button class="btn" data-act="del" data-id="${x.p.id}" aria-label="حذف المنتج">${ic('trash')}</button></div></div>`).join('')}
    <div class="total">الإجمالي: ${money(tot)}</div>
    <p class="sub">السعر النهائي يتم حسابه عند تسجيل الطلب من أسعار المتجر الحالية.</p></div>
    <form id="of" novalidate><h2>بيانات الطلب</h2>
    ${fl('oname', 'الاسم', `<input id="oname" name="oname" autocomplete="name" value="${esc(draft.oname)}">`)}
    ${fl('ophone', 'رقم الهاتف', `<input id="ophone" name="ophone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(draft.ophone)}">`)}
    ${fl('oaddress', 'عنوان التوصيل', `<textarea id="oaddress" name="oaddress" autocomplete="street-address">${esc(draft.oaddress)}</textarea>`)}
    ${fl('onotes', 'ملاحظات (اختياري)', `<input id="onotes" name="onotes" value="${esc(draft.onotes)}">`)}
    <button class="btn pri" type="submit" id="obtn">تأكيد الطلب</button>${stBox}</form>`;
  },
  complaints: () => `<h1>الشكاوى</h1><form id="cf" novalidate>
    ${fl('name', 'الاسم', '<input id="name" name="name" autocomplete="name">')}
    ${fl('phone', 'رقم الهاتف', '<input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel">')}
    ${fl('order', 'رقم الطلب (إن وجد)', '<input id="order" name="order">')}
    ${fl('type', 'نوع الشكوى', '<select id="type" name="type"><option value="">اختر نوع الشكوى</option><option>مشكلة في منتج</option><option>تأخر الطلب</option><option>مشكلة في السعر أو العرض</option><option>مشكلة في التوصيل</option><option>شكوى أخرى</option></select>')}
    ${fl('details', 'تفاصيل الشكوى', '<textarea id="details" name="details"></textarea>')}
    <button class="btn pri" type="submit" id="cbtn">إرسال الشكوى</button>${stBox}</form>`,
  login: () => user
    ? `<h1>حسابي</h1><p>${esc(user.email)}</p><button class="btn" data-act="logout">تسجيل الخروج</button>`
    : `<h1>تسجيل الدخول</h1><p class="sub">الحساب اختياري. يحفظ مفضلتك في حسابك على أي جهاز.</p><form id="lf" novalidate>
    ${fl('email', 'البريد الإلكتروني', '<input id="email" name="email" type="email" autocomplete="email" dir="ltr">')}
    ${fl('password', 'كلمة المرور (6 أحرف على الأقل)', '<input id="password" name="password" type="password" autocomplete="current-password" dir="ltr">')}
    <div class="row"><button class="btn pri" type="submit" data-mode="in">دخول</button><button class="btn" type="submit" data-mode="up">إنشاء حساب</button></div>
    ${stBox}</form>`
};

const buildNav = () => {
  document.getElementById('nav').innerHTML = [['#/offers', 'العروض'], ['#/new', 'أحدث المنتجات'],
    ...cats.map(c => ['#/cat/' + c.id, esc(c.name)]), ['#/saved', 'المحفوظات'], ['#/complaints', 'الشكاوى'],
    ['#/login', user ? 'حسابي' : 'الدخول']].map(x => `<a href="${x[0]}">${x[1]}</a>`).join('');
};

const render = () => {
  const [r, a = ''] = location.hash.slice(2).split('/');
  const arg = decodeURIComponent(a);
  if (loadErr) {
    M.innerHTML = `<p class="status" style="margin-top:24px">${loadErr}</p><p><button class="btn" data-act="retry">إعادة المحاولة</button></p>`;
  } else {
    M.innerHTML = r === 'cat' ? R.cat(arg) : Object.hasOwn(R, r) && r !== 'home' && r !== 'cat' ? R[r](arg) : R.home();
  }
  document.querySelectorAll('#nav a').forEach(x => {
    const on = x.getAttribute('href').split('/')[1] === r && (r !== 'cat' || x.getAttribute('href') === '#/cat/' + arg);
    on ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current');
  });
  document.getElementById('cartLink').innerHTML = ic('cart') + `<span>${Object.values(cart).reduce((s, n) => s + n, 0).toLocaleString('ar-EG')}</span>`;
  document.getElementById('foot').textContent = C.storeName + (P.some(p => p.demo) ? ' | بعض المنتجات المعروضة تجريبية' : '');
};

const boot = async () => {
  M.innerHTML = '<p class="empty">جار التحميل...</p>';
  await load();
  buildNav();
  render();
};

document.getElementById('logo').textContent = C.storeName;
document.title = C.storeName;
document.getElementById('q').addEventListener('input', e => {
  const v = e.target.value.trim();
  location.hash = v ? '#/search/' + encodeURIComponent(v) : '#/';
});

document.addEventListener('input', e => {
  if (e.target.closest('#of')) draft[e.target.id] = e.target.value;
});

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const id = Number(b.dataset.id), act = b.dataset.act;
  if (act === 'back') return history.back();
  if (act === 'retry') return boot();
  if (act === 'logout') { await sb.auth.signOut(); location.hash = '#/'; return; }
  if (act === 'save') {
    const has = saved.includes(id);
    const before = saved;
    saved = has ? saved.filter(x => x !== id) : [...saved, id];
    if (user) {
      const r = has ? await sb.from('saved_products').delete().eq('product_id', id) : await sb.from('saved_products').insert({ product_id: id });
      if (r.error) { saved = before; say('تعذر تحديث المحفوظات. حاول مرة أخرى.'); } else say('');
    } else sv('saved', saved);
  }
  if (act === 'add' || act === 'inc') cart[id] = (cart[id] || 0) + 1;
  if (act === 'dec') { cart[id] > 1 ? cart[id]-- : delete cart[id]; }
  if (act === 'del') delete cart[id];
  sv('cart', cart);
  const y = scrollY; render(); scrollTo(0, y);
});

const setSt = (t, ok) => {
  const st = document.getElementById('st');
  st.className = t ? 'status' : '';
  st.style.cssText = ok ? 'color:var(--ok);border-color:var(--ok)' : '';
  st.textContent = t;
};
const errs = (er, keys) => keys.forEach(k => { document.getElementById('e-' + k).textContent = er[k] || ''; });
const digits = s => s.trim().replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x));

document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id !== 'cf' && f.id !== 'lf' && f.id !== 'of') return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  if (f.id === 'cf') {
    const ph = digits(d.phone || '');
    const er = {};
    if (d.name.trim().length < 2) er.name = 'اكتب اسمك';
    if (!/^01[0125]\d{8}$/.test(ph)) er.phone = 'اكتب رقم موبايل مصري صحيح من 11 رقمًا';
    if (!d.type) er.type = 'اختر نوع الشكوى';
    if (d.details.trim().length < 10) er.details = 'اكتب تفاصيل الشكوى (10 أحرف على الأقل)';
    errs(er, ['name', 'phone', 'type', 'details']);
    if (Object.keys(er).length) return setSt('');
    if (!sb) return setSt('قاعدة البيانات غير مربوطة بعد، لذلك لم يتم إرسال الشكوى.');
    const btn = document.getElementById('cbtn');
    btn.disabled = true; setSt('جار الإرسال...');
    const r = await sb.from('complaints').insert({ name: d.name.trim(), phone: ph, order_number: d.order.trim() || null, type: d.type, details: d.details.trim(), user_id: user ? user.id : null });
    btn.disabled = false;
    if (r.error) return setSt('تعذر إرسال الشكوى. حاول مرة أخرى بعد قليل.');
    f.reset(); setSt('تم إرسال شكواك وحفظها. سنراجعها ونتواصل معك.', true);
  } else if (f.id === 'lf') {
    const mode = e.submitter && e.submitter.dataset.mode;
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) er.email = 'اكتب بريدًا إلكترونيًا صحيحًا';
    if (d.password.length < 6) er.password = 'كلمة المرور 6 أحرف على الأقل';
    errs(er, ['email', 'password']);
    if (Object.keys(er).length) return setSt('');
    if (!sb) return setSt('قاعدة البيانات غير مربوطة بعد.');
    setSt('جار التنفيذ...');
    const cred = { email: d.email.trim(), password: d.password };
    const r = mode === 'up' ? await sb.auth.signUp(cred) : await sb.auth.signInWithPassword(cred);
    if (r.error) return setSt(mode === 'up' ? 'تعذر إنشاء الحساب. قد يكون البريد مستخدمًا.' : 'تعذر الدخول. تأكد من البريد وكلمة المرور.');
    if (!r.data.session) return setSt('تم إنشاء الحساب. افتح بريدك لتأكيده ثم سجل الدخول.', true);
    location.hash = '#/saved';
  } else {
    const nm = d.oname.trim(), ph = digits(d.ophone || ''), ad = d.oaddress.trim(), nt = d.onotes.trim();
    const er = {};
    if (nm.length < 2) er.oname = 'اكتب اسمك';
    if (!/^01[0125]\d{8}$/.test(ph)) er.ophone = 'اكتب رقم موبايل مصري صحيح من 11 رقمًا';
    if (ad.length < 5) er.oaddress = 'اكتب عنوان التوصيل بالتفصيل';
    errs(er, ['oname', 'ophone', 'oaddress']);
    if (Object.keys(er).length) return setSt('');
    const items = Object.keys(cart).filter(id => byId(id)).map(id => ({ id: Number(id), qty: cart[id] }));
    if (!items.length) return setSt('السلة فارغة.');
    if (!sb) return setSt('قاعدة البيانات غير مربوطة بعد، لذلك لم يتم تسجيل الطلب.');
    const btn = document.getElementById('obtn');
    btn.disabled = true; setSt('جار تسجيل الطلب...');
    const r = await sb.rpc('place_order', { p_name: nm, p_phone: ph, p_address: ad, p_notes: nt, p_items: items });
    btn.disabled = false;
    if (r.error) return setSt('تعذر تسجيل الطلب. قد يكون أحد المنتجات غير متوفر الآن. حدّث الصفحة وحاول مرة أخرى.');
    const tot = items.reduce((s, x) => s + byId(x.id).price * x.qty, 0);
    const msg = `طلب رقم ${r.data} من ${C.storeName}\nالاسم: ${nm}\nالهاتف: ${ph}\nالعنوان: ${ad}\n` +
      items.map(x => `- ${byId(x.id).name} × ${x.qty} = ${money(byId(x.id).price * x.qty)}`).join('\n') +
      `\nالإجمالي: ${money(tot)}` + (nt ? `\nملاحظات: ${nt}` : '');
    done = { id: r.data, msg };
    cart = {}; sv('cart', cart); draft.onotes = '';
    render();
  }
});

window.addEventListener('hashchange', () => {
  if (location.hash !== '#/cart') done = null;
  render(); scrollTo(0, 0); M.focus({ preventScroll: true });
});

if (sb) {
  sb.auth.onAuthStateChange((_ev, session) => {
    setTimeout(async () => {
      user = session ? session.user : null;
      await loadSaved(); buildNav(); render();
    }, 0);
  });
}
boot().then(() => loadSaved()).then(render);
})();
