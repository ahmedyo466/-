(() => {
const C = window.CONFIG;
const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey);
const A = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => Number(String(v).trim().replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x)).replace('٫', '.'));
const OFN = { none: 'بدون عرض', monthly: 'شهري', weekly: 'أسبوعي', daily: 'يومي' };
const ST = { new: 'جديدة', in_progress: 'قيد المراجعة', done: 'تم الحل' };
const OST = { new: 'جديد', confirmed: 'مؤكد', shipped: 'خرج للتوصيل', delivered: 'تم التسليم', cancelled: 'ملغي' };
const fm = (t, ok = true) => ({ t, ok });
let tab = 'products', cats = [], prods = [], comps = [], ords = [], settings = null, editing = null, flash = null;

const fl = (id, label, inner) => `<div class="f"><label for="${id}">${label}</label>${inner}<div class="er" id="e-${id}" aria-live="polite"></div></div>`;
const loc = iso => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const setSt = (t, ok) => {
  const st = document.getElementById('st');
  if (!st) return;
  st.className = t ? 'status' : '';
  st.style.cssText = ok ? 'color:var(--ok);border-color:var(--ok)' : '';
  st.textContent = t;
};
const errs = (er, keys) => keys.forEach(k => { const e = document.getElementById('e-' + k); if (e) e.textContent = er[k] || ''; });
const stBox = '<div id="st" role="status" style="margin-top:16px"></div>';
const money = n => Number(n).toLocaleString('ar-EG') + ' ' + C.currency;

const showLogin = () => {
  A.innerHTML = `<h1>دخول الإدارة</h1><form id="lf" novalidate>
  ${fl('email', 'البريد الإلكتروني', '<input id="email" name="email" type="email" dir="ltr" autocomplete="email">')}
  ${fl('password', 'كلمة المرور', '<input id="password" name="password" type="password" dir="ltr" autocomplete="current-password">')}
  <button class="btn pri" type="submit">دخول</button>${stBox}</form>`;
};

const vProducts = () => {
  if (editing !== null) return vForm();
  const list = prods.length ? prods.map(p => `<div class="item"><div><div class="name">${esc(p.name)}</div>
  <div class="sub">${money(p.price)} | ${OFN[p.offer_type]} | ${p.in_stock ? 'متوفر' : 'غير متوفر'} | ${p.is_active ? 'ظاهر' : 'مخفي'}${p.is_demo ? ' | تجريبي' : ''}</div></div>
  <button class="btn" data-a="edit" data-id="${p.id}">تعديل</button></div>`).join('') : '<p class="empty">لا توجد منتجات.</p>';
  return `<button class="btn pri" data-a="new">إضافة منتج</button><div class="box" style="margin-top:16px">${list}</div>`;
};

const vForm = () => {
  const isNew = editing === 'new';
  const p = isNew ? { offer_type: 'none', in_stock: true, is_active: true, is_demo: false } : prods.find(x => x.id === editing);
  const cs = cats.map(c => `<option value="${c.id}" ${p.category_id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const of = Object.keys(OFN).map(k => `<option value="${k}" ${p.offer_type === k ? 'selected' : ''}>${OFN[k]}</option>`).join('');
  const img = p.image_url ? `<img src="${esc(p.image_url)}" alt="الصورة الحالية" width="96" style="display:block;margin-bottom:8px;border-radius:8px">` : '';
  return `<h2>${isNew ? 'إضافة منتج' : 'تعديل المنتج'}</h2><form id="pf" novalidate>
  ${fl('name', 'اسم المنتج', `<input id="name" name="name" value="${esc(p.name)}">`)}
  ${fl('description', 'الوصف', `<textarea id="description" name="description">${esc(p.description)}</textarea>`)}
  ${fl('category', 'القسم', `<select id="category" name="category"><option value="">بدون قسم</option>${cs}</select>`)}
  ${fl('price', 'السعر الحالي (ج.م)', `<input id="price" name="price" inputmode="decimal" value="${esc(p.price)}">`)}
  ${fl('old_price', 'السعر السابق (اكتبه فقط عند وجود خصم حقيقي)', `<input id="old_price" name="old_price" inputmode="decimal" value="${esc(p.old_price)}">`)}
  ${fl('offer', 'نوع العرض', `<select id="offer" name="offer">${of}</select>`)}
  ${fl('starts', 'بداية العرض (اختياري)', `<input id="starts" name="starts" type="datetime-local" value="${loc(p.offer_starts_at)}">`)}
  ${fl('ends', 'نهاية العرض (اختياري)', `<input id="ends" name="ends" type="datetime-local" value="${loc(p.offer_ends_at)}">`)}
  ${fl('image', 'صورة المنتج (JPG أو PNG أو WebP، حتى 2 ميجا)', `${img}<input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp">`)}
  <div class="f"><label class="chk"><input type="checkbox" name="in_stock" ${p.in_stock ? 'checked' : ''}> متوفر</label>
  <label class="chk"><input type="checkbox" name="is_active" ${p.is_active ? 'checked' : ''}> ظاهر في المتجر</label>
  <label class="chk"><input type="checkbox" name="is_demo" ${p.is_demo ? 'checked' : ''}> منتج تجريبي</label></div>
  <div class="row"><button class="btn pri" type="submit" id="sbtn">حفظ</button><button class="btn" type="button" data-a="cancel">إلغاء</button>
  ${isNew ? '' : `<button class="btn" type="button" data-a="del" data-id="${p.id}">حذف</button>`}</div>${stBox}</form>`;
};

const vCats = () => `<div class="box">${cats.map(c => `<div class="item"><input id="cn-${c.id}" value="${esc(c.name)}" aria-label="اسم القسم" maxlength="40"><button class="btn" data-a="savecat" data-id="${c.id}">حفظ</button></div>`).join('')}</div>`;

const vOrders = () => ords.length ? ords.map(o => `<div class="box"><div class="name">طلب رقم ${o.id.toLocaleString('ar-EG')} | ${esc(o.customer_name)} | <span dir="ltr">${esc(o.phone)}</span></div>
  <div class="sub">${new Date(o.created_at).toLocaleString('ar-EG')}</div>
  <p>${esc(o.address)}</p>${o.notes ? `<p class="sub">ملاحظات: ${esc(o.notes)}</p>` : ''}
  <div>${(o.order_items || []).map(i => `<div class="sub">${esc(i.product_name)} × ${i.qty.toLocaleString('ar-EG')} = ${money(i.unit_price * i.qty)}</div>`).join('')}</div>
  <div class="total">الإجمالي: ${money(o.total)}</div><label for="o${o.id}">الحالة</label>
  <select id="o${o.id}" data-oid="${o.id}">${Object.keys(OST).map(k => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${OST[k]}</option>`).join('')}</select></div>`).join('')
  : '<p class="empty">لا توجد طلبات.</p>';

const vComps = () => comps.length ? comps.map(c => `<div class="box"><div class="name">${esc(c.name)} | <span dir="ltr">${esc(c.phone)}</span></div>
  <div class="sub">${esc(c.type)}${c.order_number ? ' | طلب ' + esc(c.order_number) : ''} | ${new Date(c.created_at).toLocaleString('ar-EG')}</div>
  <p style="white-space:pre-wrap">${esc(c.details)}</p><label for="s${c.id}">الحالة</label>
  <select id="s${c.id}" data-cid="${c.id}">${Object.keys(ST).map(k => `<option value="${k}" ${c.status === k ? 'selected' : ''}>${ST[k]}</option>`).join('')}</select></div>`).join('')
  : '<p class="empty">لا توجد شكاوى.</p>';

const vSettings = () => !settings ? '<p class="status">لا توجد إعدادات.</p>' : `<form id="sf" novalidate>
  ${fl('store_name', 'اسم المتجر', `<input id="store_name" name="store_name" value="${esc(settings.store_name)}">`)}
  ${fl('whatsapp', 'رقم واتساب بالصيغة الدولية بدون + (مثال 201012345678)', `<input id="whatsapp" name="whatsapp" inputmode="numeric" dir="ltr" value="${esc(settings.whatsapp)}">`)}
  ${settings.whatsapp === '201000000000' ? '<p class="sub">الرقم الحالي تجريبي. اكتب رقم المتجر الحقيقي.</p>' : ''}
  <button class="btn pri" type="submit">حفظ الإعدادات</button>${stBox}</form>`;

const draw = (ok = true) => {
  const tabs = [['products', 'المنتجات'], ['orders', 'الطلبات'], ['categories', 'الأقسام'], ['complaints', 'الشكاوى'], ['settings', 'الإعدادات']]
    .map(([k, l]) => `<button class="btn ${tab === k ? 'on' : ''}" data-a="tab" data-t="${k}">${l}</button>`).join('');
  const body = !ok ? '<p class="status">تعذر تحميل البيانات. حاول مرة أخرى.</p>' : { products: vProducts, orders: vOrders, categories: vCats, complaints: vComps, settings: vSettings }[tab]();
  const fb = flash ? `<p class="status" style="margin-top:16px;${flash.ok ? 'color:var(--ok);border-color:var(--ok)' : ''}">${esc(flash.t)}</p>` : '';
  A.innerHTML = `<h1>لوحة الإدارة</h1><div class="row" style="flex-wrap:wrap">${tabs}<button class="btn" data-a="out">خروج</button></div>${fb}<div style="margin-top:16px">${body}</div>`;
};

const loadTab = async () => {
  let err = null;
  if (tab === 'products' || tab === 'categories') {
    const [c, p] = await Promise.all([
      sb.from('categories').select('*').order('sort').order('id'),
      sb.from('products').select('*').order('created_at', { ascending: false })
    ]);
    err = c.error || p.error; cats = c.data || []; prods = p.data || [];
  }
  if (tab === 'orders') {
    const r = await sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100);
    err = r.error; ords = r.data || [];
  }
  if (tab === 'complaints') {
    const r = await sb.from('complaints').select('*').order('created_at', { ascending: false }).limit(100);
    err = r.error; comps = r.data || [];
  }
  if (tab === 'settings') {
    const r = await sb.from('store_settings').select('*').eq('id', 1).maybeSingle();
    err = r.error; settings = r.data;
  }
  return !err;
};
const go = async (t, f = null) => {
  tab = t; editing = null; flash = f;
  A.innerHTML = '<p class="empty">جار التحميل...</p>';
  draw(await loadTab());
};

const init = async () => {
  const { data } = await sb.auth.getSession();
  if (!data.session) return showLogin();
  const r = await sb.from('profiles').select('is_admin').eq('id', data.session.user.id).maybeSingle();
  if (r.error || !r.data || !r.data.is_admin) {
    A.innerHTML = '<h1>غير مسموح</h1><p>هذا الحساب ليس لديه صلاحية الإدارة.</p><button class="btn" data-a="out">تسجيل الخروج</button>';
    return;
  }
  go('products');
};

const saveProduct = async f => {
  const d = new FormData(f), er = {};
  const name = d.get('name').trim(), priceRaw = d.get('price').trim(), price = num(priceRaw);
  const oldRaw = d.get('old_price').trim(), old = oldRaw === '' ? null : num(oldRaw);
  const ot = d.get('offer'), s = d.get('starts'), e = d.get('ends'), file = d.get('image');
  if (name.length < 2) er.name = 'اكتب اسم المنتج';
  if (priceRaw === '' || !Number.isFinite(price) || price < 0) er.price = 'اكتب سعرًا صحيحًا';
  if (old !== null && (!Number.isFinite(old) || old <= price)) er.old_price = 'السعر السابق لازم يكون أكبر من السعر الحالي';
  if (s && e && new Date(e) <= new Date(s)) er.ends = 'نهاية العرض لازم تكون بعد البداية';
  const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  if (file && file.size && (!types[file.type] || file.size > 2097152)) er.image = 'اختر صورة JPG أو PNG أو WebP لا تزيد عن 2 ميجا';
  errs(er, ['name', 'price', 'old_price', 'ends', 'image']);
  if (Object.keys(er).length) return setSt('');
  const btn = document.getElementById('sbtn');
  btn.disabled = true; setSt('جار الحفظ...');
  let url = editing === 'new' ? null : prods.find(x => x.id === editing).image_url;
  if (file && file.size) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${types[file.type]}`;
    const up = await sb.storage.from('product-images').upload(path, file, { contentType: file.type });
    if (up.error) { btn.disabled = false; return setSt('تعذر رفع الصورة. حاول مرة أخرى.'); }
    url = sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  }
  const row = {
    name, description: d.get('description').trim() || null,
    category_id: d.get('category') ? Number(d.get('category')) : null,
    price, old_price: old, offer_type: ot,
    offer_starts_at: ot !== 'none' && s ? new Date(s).toISOString() : null,
    offer_ends_at: ot !== 'none' && e ? new Date(e).toISOString() : null,
    in_stock: !!d.get('in_stock'), is_active: !!d.get('is_active'), is_demo: !!d.get('is_demo'), image_url: url
  };
  const r = editing === 'new' ? await sb.from('products').insert(row) : await sb.from('products').update(row).eq('id', editing);
  btn.disabled = false;
  if (r.error) return setSt('تعذر حفظ المنتج. راجع البيانات وحاول مرة أخرى.');
  go('products', fm('تم حفظ المنتج.'));
};

const saveSettings = async f => {
  const d = new FormData(f), er = {};
  const nm = d.get('store_name').trim();
  const wa = d.get('whatsapp').trim().replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x));
  if (nm.length < 2) er.store_name = 'اكتب اسم المتجر';
  if (!/^[0-9]{10,15}$/.test(wa)) er.whatsapp = 'اكتب الرقم أرقامًا فقط من 10 إلى 15 رقمًا، بدون + أو مسافات';
  errs(er, ['store_name', 'whatsapp']);
  if (Object.keys(er).length) return setSt('');
  setSt('جار الحفظ...');
  const r = await sb.from('store_settings').update({ store_name: nm, whatsapp: wa }).eq('id', 1);
  if (r.error) return setSt('تعذر حفظ الإعدادات.');
  settings = { ...settings, store_name: nm, whatsapp: wa };
  setSt('تم حفظ الإعدادات.', true);
};

A.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const a = b.dataset.a, id = Number(b.dataset.id);
  if (a === 'tab') return go(b.dataset.t);
  if (a === 'out') { await sb.auth.signOut(); return showLogin(); }
  if (a === 'new') { editing = 'new'; flash = null; return draw(); }
  if (a === 'edit') { editing = id; flash = null; return draw(); }
  if (a === 'cancel') { editing = null; return draw(); }
  if (a === 'del') {
    if (!confirm('حذف المنتج نهائيًا؟')) return;
    const r = await sb.from('products').delete().eq('id', id);
    if (r.error) return setSt('تعذر حذف المنتج.');
    return go('products', fm('تم حذف المنتج.'));
  }
  if (a === 'savecat') {
    const nm = document.getElementById('cn-' + id).value.trim();
    if (nm.length < 1 || nm.length > 40) return go('categories', fm('اسم القسم لازم يكون من حرف إلى 40 حرفًا.', false));
    const r = await sb.from('categories').update({ name: nm }).eq('id', id);
    return go('categories', r.error ? fm('تعذر حفظ القسم.', false) : fm('تم حفظ اسم القسم.'));
  }
});

A.addEventListener('change', async e => {
  const s = e.target.closest('[data-cid], [data-oid]');
  if (!s) return;
  const isOrder = !!s.dataset.oid, id = Number(isOrder ? s.dataset.oid : s.dataset.cid);
  const r = await sb.from(isOrder ? 'orders' : 'complaints').update({ status: s.value }).eq('id', id);
  if (!r.error) (isOrder ? ords : comps).find(c => c.id === id).status = s.value;
  flash = r.error ? fm('تعذر تحديث الحالة.', false) : fm('تم تحديث الحالة.');
  const y = scrollY; draw(); scrollTo(0, y);
});

A.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'lf') {
    const d = new FormData(f);
    setSt('جار الدخول...');
    const r = await sb.auth.signInWithPassword({ email: d.get('email').trim(), password: d.get('password') });
    if (r.error) return setSt('تعذر الدخول. تأكد من البريد وكلمة المرور.');
    return init();
  }
  if (f.id === 'pf') return saveProduct(f);
  if (f.id === 'sf') return saveSettings(f);
});

init();
})();
