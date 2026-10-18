(() => {
const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');
document.body.appendChild(toast);
let t;

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act="add"],[data-act="inc"]');
  if (!b || b.disabled) return;
  const id = b.dataset.id, act = b.dataset.act;
  setTimeout(() => {
    const nb = document.querySelector(`[data-act="add"][data-id="${id}"]`);
    if (nb) nb.classList.add('added');
    const n = document.querySelector('#cartLink span');
    if (n) n.classList.add('bump');
    if (act === 'add') {
      toast.textContent = 'تمت الإضافة إلى السلة';
      toast.classList.add('show');
      clearTimeout(t);
      t = setTimeout(() => toast.classList.remove('show'), 1600);
    }
  }, 0);
});

const main = document.getElementById('main');
window.addEventListener('hashchange', () => {
  main.classList.add('enter');
  setTimeout(() => main.classList.remove('enter'), 250);
});
})();
