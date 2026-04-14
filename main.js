/* ====================================================
   COZY HOME — main.js
   WhatsApp link builder · product renderer · UI helpers
   ==================================================== */

const STORE = {
  name:      'Cozy Home',
  nameAr:    'كوزي هوم',
  wa:        '+21600000000',   // ← replace with real WhatsApp number in Phase 04
  domain:    'cozy-home.tn',
  currency:  'TND',
};

/* ── WhatsApp deep-link builder ───────────────────── */
function buildWaLink(product, customMsg) {
  const msg = customMsg || product.whatsapp_msg ||
    `Salam! Je veux commander: *${product.name}* - ${product.price} ${STORE.currency}\nCozy Home 🏠`;
  return `https://wa.me/${STORE.wa.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
}

/* ── Format price ─────────────────────────────────── */
function fmtPrice(n) {
  return n.toFixed(3).replace('.', ',') + ' TND';
}

/* ── Discount percent ─────────────────────────────── */
function discountPct(price, compare) {
  if (!compare || compare <= price) return 0;
  return Math.round((1 - price / compare) * 100);
}

/* ── Load products.json ───────────────────────────── */
async function loadProducts() {
  try {
    const res  = await fetch('/products.json');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products || []);
  } catch {
    return [];
  }
}

/* ── Build product card HTML ──────────────────────── */
function productCardHTML(p) {
  const disc  = discountPct(p.price, p.compare_price);
  const img   = p.images && p.images[0]
    ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy">`
    : `<div class="product-card__img-placeholder">🏠</div>`;
  const badge = disc > 0
    ? `<span class="product-card__badge">-${disc}%</span>`
    : p.featured ? `<span class="product-card__badge product-card__badge--new">Nouveau</span>` : '';
  const chips = (p.highlights || []).slice(0,3)
    .map(h => `<span class="highlight-chip">${h}</span>`).join('');
  const waLink = buildWaLink(p);

  return `
  <article class="product-card" data-id="${p.id}" data-cat="${p.category||''}">
    <a href="/product.html?id=${p.id}" class="product-card__img">
      ${img}
      ${badge}
    </a>
    <div class="product-card__body">
      <a href="/product.html?id=${p.id}">
        <div class="product-card__name">${p.name}</div>
        ${p.name_ar ? `<div class="product-card__name-ar text-ar">${p.name_ar}</div>` : ''}
      </a>
      ${chips ? `<div class="product-card__highlights">${chips}</div>` : ''}
      <div class="product-card__prices">
        <span class="price-current">${fmtPrice(p.price)}</span>
        ${p.compare_price ? `<span class="price-compare">${fmtPrice(p.compare_price)}</span>` : ''}
        ${disc > 0 ? `<span class="price-save">-${disc}%</span>` : ''}
      </div>
    </div>
    <div class="product-card__footer">
      <a href="${waLink}" target="_blank" rel="noopener"
         class="btn-wa"
         onclick="window._track&&_track('wa_click',{product_id:'${p.id}',price:${p.price}})">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.073.528 4.024 1.456 5.727L.057 23.158a.5.5 0 00.621.621l5.378-1.41A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.002-1.367l-.358-.213-3.712.974.99-3.614-.234-.372A9.818 9.818 0 1112 21.818z"/>
        </svg>
        Commander via WhatsApp
      </a>
    </div>
  </article>`;
}

/* ── Render a product grid into a container ───────── */
async function renderProductGrid(containerId, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const all = await loadProducts();
  let products = all.filter(p => p.active !== false);

  if (opts.featured) products = products.filter(p => p.featured);
  if (opts.limit)    products = products.slice(0, opts.limit);
  if (opts.category) products = products.filter(p => p.category === opts.category);

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🏠</div>
        <h3>Aucun produit disponible</h3>
        <p>Revenez bientôt — de nouveaux articles arrivent chaque semaine.</p>
      </div>`;
    return;
  }

  container.innerHTML = products.map(productCardHTML).join('');
  return products;
}

/* ── Filter buttons ───────────────────────────────── */
function initFilters(gridId) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      const all = await loadProducts();
      const container = document.getElementById(gridId);
      let products = all.filter(p => p.active !== false);
      if (cat) products = products.filter(p => p.category === cat);
      container.innerHTML = products.map(productCardHTML).join('');
      window._track && _track('filter', { category: cat });
    });
  });
}

/* ── Search ───────────────────────────────────────── */
function initSearch(inputId, gridId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let all = [];
  loadProducts().then(p => { all = p.filter(x => x.active !== false); });
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    const filtered = q
      ? all.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.name_ar || '').includes(q) ||
          (p.description || '').toLowerCase().includes(q))
      : all;
    document.getElementById(gridId).innerHTML = filtered.map(productCardHTML).join('');
    window._track && _track('search', { query: q, results: filtered.length });
  });
}

/* ── Product detail page loader ───────────────────── */
async function loadProductDetail() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = '/products.html'; return; }

  const all = await loadProducts();
  const p   = all.find(x => x.id === id);
  if (!p)   { location.href = '/products.html'; return; }

  // Track view
  window._track && _track('product_view', { product_id: p.id, price: p.price });

  document.title = `${p.name} — Cozy Home`;

  // Images gallery
  const images = p.images && p.images.length ? p.images : [];
  const mainEl = document.getElementById('detail-main-img');
  const thumbsEl = document.getElementById('detail-thumbs');
  if (mainEl) {
    if (images[0]) {
      mainEl.innerHTML = `<img src="${images[0]}" alt="${p.name}" id="main-img-el">`;
    } else {
      mainEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:4rem;">🏠</div>`;
    }
  }
  if (thumbsEl && images.length > 1) {
    thumbsEl.innerHTML = images.map((src, i) => `
      <div class="product-detail__thumb ${i===0?'active':''}" onclick="switchImg('${src}',this)">
        <img src="${src}" alt="">
      </div>`).join('');
  }

  // Info
  const infoEl = document.getElementById('detail-info');
  if (!infoEl) return;
  const disc = discountPct(p.price, p.compare_price);
  const waLink = buildWaLink(p);

  infoEl.innerHTML = `
    <span class="product-detail__category">${p.category || 'Maison'}</span>
    <div>
      <h1 class="product-detail__name">${p.name}</h1>
      ${p.name_ar ? `<div class="product-detail__name-ar text-ar">${p.name_ar}</div>` : ''}
    </div>
    <div class="product-detail__prices">
      <span class="price-current-lg">${fmtPrice(p.price)}</span>
      ${p.compare_price ? `<span class="price-compare-lg">${fmtPrice(p.compare_price)}</span>` : ''}
      ${disc > 0 ? `<span class="price-save-lg">-${disc}% 🔥</span>` : ''}
    </div>
    ${p.highlights && p.highlights.length ? `
    <div class="product-detail__highlights">
      <h4>✨ Points forts</h4>
      <ul>${p.highlights.map(h=>`<li>${h}</li>`).join('')}</ul>
    </div>` : ''}
    ${p.description ? `
    <div class="product-detail__desc">
      <h4>Description</h4>
      <p>${p.description}</p>
    </div>` : ''}
    ${p.description_ar ? `
    <div class="product-detail__desc text-ar">
      <h4>الوصف</h4>
      <p>${p.description_ar}</p>
    </div>` : ''}
    <div class="product-detail__actions">
      <a href="${waLink}" target="_blank" rel="noopener"
         class="product-detail__wa-btn"
         onclick="window._track&&_track('wa_click', {product_id:'${p.id}',price:${p.price},page:'detail'})">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.073.528 4.024 1.456 5.727L.057 23.158a.5.5 0 00.621.621l5.378-1.41A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.002-1.367l-.358-.213-3.712.974.99-3.614-.234-.372A9.818 9.818 0 1112 21.818z"/>
        </svg>
        Commander maintenant — **${fmtPrice(p.price)}**
      </a>
      <div class="product-detail__cod">
        💵 Paiement à la livraison (COD) &nbsp;|&nbsp; 🚚 Livraison 24–48h
      </div>
    </div>
  `;

  // Related products
  const relGrid = document.getElementById('related-grid');
  if (relGrid) {
    const related = all.filter(x => x.active !== false && x.id !== p.id && x.category === p.category).slice(0, 4);
    relGrid.innerHTML = related.length
      ? related.map(productCardHTML).join('')
      : '';
  }
}

/* ── Switch gallery image ─────────────────────────── */
function switchImg(src, el) {
  const main = document.getElementById('main-img-el');
  if (main) main.src = src;
  document.querySelectorAll('.product-detail__thumb').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}

/* ── Toast notification ───────────────────────────── */
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ── Mobile nav toggle ────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const toggle  = document.querySelector('.nav__mobile-toggle');
  const navLinks = document.querySelector('.nav__links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
  }
});

/* ── Expose globals ───────────────────────────────── */
window.STORE             = STORE;
window.buildWaLink       = buildWaLink;
window.fmtPrice          = fmtPrice;
window.loadProducts      = loadProducts;
window.renderProductGrid = renderProductGrid;
window.initFilters       = initFilters;
window.initSearch        = initSearch;
window.loadProductDetail = loadProductDetail;
window.switchImg         = switchImg;
window.showToast         = showToast;
