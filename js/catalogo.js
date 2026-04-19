/* ===================================================
   PAU BOUTIQUE — Catálogo JS
   =================================================== */

import { db } from './firebase-config.js';
import {
  collection, getDocs, onSnapshot,
  query, orderBy, doc, getDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { openProductModal, closeModal } from './modules/products.js';
import { addToCart, openCart, closeCart } from './modules/cart.js';
import { initHeaderScroll, initMobileMenu } from './modules/ui.js';

// --- STATE ---
let allProducts = [];
let filteredProducts = [];
let visibleCount = 12;
const PAGE_SIZE = 12;

const state = {
  category: 'all',
  sort: 'newest',
  priceMin: 0,
  priceMax: 500,
  saleOnly: false
};

// --- CLOUDINARY OPTIMIZER ---
const optimizeUrl = (url, params = 'w_600,q_auto,f_auto') => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('cloudinary.com')) return url.replace('upload/', `upload/${params}/`);
  return url;
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
  initHeaderScroll();
  initMobileMenu();
  setupCartListeners();
  setupModalListeners();
  setupSidebarToggle();
  setupViewToggle();
  setupSortListeners();
  setupPriceSliders();
  setupSaleToggle();
  setupClearFilters();

  // Listen for real-time announcement updates
  onSnapshot(doc(db, 'settings', 'general'), (snap) => {
    if (snap.exists()) {
      const config = snap.data();
      const bar = document.getElementById('announcement-bar');
      const textEl = document.getElementById('announcement-text');
      if (bar && textEl) {
        bar.style.display = config.announcementActive ? 'block' : 'none';
        const text = (config.announcement || "") + " &nbsp; &nbsp; • &nbsp; &nbsp; ";
        textEl.innerHTML = text.repeat(10);
      }
    }
  });

  await loadCategories();

  // Leer parámetro de URL si venimos de un link específico
  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('categoria');
  if (urlCat) {
    // selectCategory actualiza el estado y la UI de los filtros
    selectCategory(urlCat.toLowerCase());
  }

  subscribeProducts();
});

// --- ANNOUNCEMENT ---
async function loadAnnouncement() {
  const bar = document.getElementById('announcement-bar');
  const textEl = document.getElementById('announcement-text');
  if (!bar || !textEl) return;

  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (snap.exists()) {
      const config = snap.data();
      bar.style.display = config.announcementActive ? 'block' : 'none';
      const text = (config.announcement || "") + " &nbsp; &nbsp; • &nbsp; &nbsp; ";
      textEl.innerHTML = text.repeat(10);
    }
  } catch (e) {
    console.error("Error al cargar anuncio:", e);
  }
}

// --- FIREBASE ---
async function loadCategories() {
  try {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    const list = document.getElementById('category-filter-list');
    if (!list) return;

    snap.forEach(docSnap => {
      const cat = docSnap.data();
      const item = document.createElement('label');
      item.className = 'cat-check';
      item.dataset.cat = cat.name.toLowerCase();
      item.innerHTML = `
        <span class="cat-check__indicator"></span>
        <span>${cat.name}</span>
        <span class="cat-check__count">—</span>
      `;
      item.addEventListener('click', () => selectCategory(cat.name.toLowerCase()));
      list.appendChild(item);
    });

    // Listener para "Todas"
    const allBtn = document.querySelector('[data-cat="all"]');
    if (allBtn) allBtn.addEventListener('click', () => selectCategory('all'));
  } catch (e) {
    console.error('Error cargando categorías:', e);
  }
}

function subscribeProducts() {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  onSnapshot(q, snap => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updatePriceRange();
    applyFilters();
  });
}

// --- FILTERS ---
function selectCategory(cat) {
  state.category = cat;
  document.querySelectorAll('.cat-check').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });
  applyFilters();
  updateActiveChips();
}

function applyFilters() {
  let result = [...allProducts];

  // Categoría
  if (state.category !== 'all') {
    result = result.filter(p => (p.category || '').toLowerCase() === state.category);
  }

  // Precio
  result = result.filter(p => {
    const price = parseFloat(p.salePrice || p.price) || 0;
    return price >= state.priceMin && price <= state.priceMax;
  });

  // Solo oferta
  if (state.saleOnly) {
    result = result.filter(p => p.salePrice);
  }

  // Ordenar
  result = sortProducts(result, state.sort);

  filteredProducts = result;
  visibleCount = PAGE_SIZE;
  updateCounts();
  renderGrid();
  updateActiveChips();
}

function sortProducts(arr, sort) {
  const copy = [...arr];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => parseFloat(a.salePrice || a.price) - parseFloat(b.salePrice || b.price));
    case 'price_desc':
      return copy.sort((a, b) => parseFloat(b.salePrice || b.price) - parseFloat(a.salePrice || a.price));
    case 'name_asc':
      return copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    default: // newest — ya vienen ordenados por createdAt desc
      return copy;
  }
}

function updateCounts() {
  document.getElementById('results-count').textContent = filteredProducts.length;

  // Counts por categoría
  document.querySelectorAll('.cat-check').forEach(el => {
    const cat = el.dataset.cat;
    const countEl = el.querySelector('.cat-check__count');
    if (!countEl) return;
    if (cat === 'all') {
      countEl.textContent = allProducts.length;
    } else {
      const n = allProducts.filter(p => (p.category || '').toLowerCase() === cat).length;
      countEl.textContent = n;
    }
  });
}

function updatePriceRange() {
  const prices = allProducts.map(p => parseFloat(p.salePrice || p.price) || 0);
  if (!prices.length) return;
  const maxPrice = Math.ceil(Math.max(...prices) / 10) * 10;
  const minInput = document.getElementById('price-min');
  const maxInput = document.getElementById('price-max');
  minInput.max = maxPrice;
  maxInput.max = maxPrice;
  maxInput.value = maxPrice;
  state.priceMax = maxPrice;
  document.getElementById('price-max-label').textContent = `S/. ${maxPrice}`;
}

// --- RENDER ---
function renderGrid() {
  const grid = document.getElementById('cat-grid');
  const empty = document.getElementById('cat-empty');
  const loadWrap = document.getElementById('load-more-wrap');
  const visible = filteredProducts.slice(0, visibleCount);

  if (filteredProducts.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    loadWrap.style.display = 'none';
    return;
  }

  empty.style.display = 'none';

  grid.innerHTML = visible.map(p => {
    const priceHTML = p.salePrice
      ? `<span class="product-card__price--original">S/. ${p.price}</span>
         <span class="product-card__price--sale">S/. ${p.salePrice}</span>`
      : `S/. ${p.price}`;
    const imgSrc = optimizeUrl(p.images?.[0] || p.image || '');
    return `
      <div class="product-card" data-id="${p.id}" style="cursor:pointer">
        <div class="product-card__image-wrap">
          <img src="${imgSrc}" alt="${p.name}" class="product-card__image" loading="lazy">
          ${p.badge ? `<span class="product-card__badge">${p.badge}</span>` : ''}
          ${p.salePrice ? '<span class="product-card__badge" style="left:auto;right:12px;background:#8b4513">OFERTA</span>' : ''}
          <div class="product-card__actions">
            <button class="product-card__add-btn" data-id="${p.id}">Añadir al Carrito</button>
          </div>
        </div>
        <div class="product-card__info">
          <span style="font-family:var(--font-sans);font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--color-gray);display:block;margin-bottom:4px">${p.category || ''}</span>
          <h3 class="product-card__name">${p.name}</h3>
          <p class="product-card__price">${priceHTML}</p>
        </div>
      </div>
    `;
  }).join('');

  // Event listeners tarjetas
  grid.querySelectorAll('.product-card').forEach(card => {
    card.onclick = () => {
      const product = filteredProducts.find(p => p.id === card.dataset.id);
      if (product) openProductModal(product);
    };
  });

  grid.querySelectorAll('.product-card__add-btn').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const product = filteredProducts.find(p => p.id === btn.dataset.id);
      if (product) addToCart(product);
    };
  });

  // Load more
  loadWrap.style.display = visibleCount < filteredProducts.length ? 'block' : 'none';
}

// --- ACTIVE CHIPS ---
function updateActiveChips() {
  const wrap = document.getElementById('active-filters');
  const chips = [];

  if (state.category !== 'all') {
    chips.push({ label: state.category, key: 'category' });
  }
  if (state.saleOnly) {
    chips.push({ label: 'En oferta', key: 'sale' });
  }

  wrap.innerHTML = chips.map(c => `
    <span class="cat-chip">
      ${c.label}
      <button class="cat-chip__remove" data-key="${c.key}" aria-label="Quitar filtro">&times;</button>
    </span>
  `).join('');

  wrap.querySelectorAll('.cat-chip__remove').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.key === 'category') selectCategory('all');
      if (btn.dataset.key === 'sale') {
        state.saleOnly = false;
        document.getElementById('filter-sale').checked = false;
        applyFilters();
      }
    };
  });
}

// --- LISTENERS SETUP ---
function setupSortListeners() {
  document.querySelectorAll('input[name="sort"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.sort = radio.value;
      applyFilters();
    });
  });
}

function setupPriceSliders() {
  const minInput = document.getElementById('price-min');
  const maxInput = document.getElementById('price-max');
  const minLabel = document.getElementById('price-min-label');
  const maxLabel = document.getElementById('price-max-label');

  const update = () => {
    let min = parseInt(minInput.value);
    let max = parseInt(maxInput.value);
    if (min > max) [min, max] = [max, min];
    state.priceMin = min;
    state.priceMax = max;
    minLabel.textContent = `S/. ${min}`;
    maxLabel.textContent = `S/. ${max}`;
    applyFilters();
  };

  minInput.addEventListener('input', update);
  maxInput.addEventListener('input', update);
}

function setupSaleToggle() {
  document.getElementById('filter-sale').addEventListener('change', e => {
    state.saleOnly = e.target.checked;
    applyFilters();
  });
}

function setupClearFilters() {
  const clearBtn = document.getElementById('clear-filters');
  const emptyBtn = document.getElementById('empty-clear');

  const clear = () => {
    state.category = 'all';
    state.sort = 'newest';
    state.saleOnly = false;
    document.querySelector('input[value="newest"]').checked = true;
    document.getElementById('filter-sale').checked = false;
    document.getElementById('price-min').value = 0;
    document.getElementById('price-max').value = document.getElementById('price-max').max;
    state.priceMin = 0;
    state.priceMax = parseInt(document.getElementById('price-max').max);
    document.getElementById('price-min-label').textContent = 'S/. 0';
    document.getElementById('price-max-label').textContent = `S/. ${state.priceMax}`;
    document.querySelectorAll('.cat-check').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === 'all');
    });
    applyFilters();
  };

  clearBtn.addEventListener('click', clear);
  emptyBtn.addEventListener('click', clear);

  document.getElementById('load-more-btn').addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderGrid();
  });
}

function setupSidebarToggle() {
  const sidebar = document.getElementById('cat-sidebar');
  const overlay = document.getElementById('cat-overlay');
  const openBtn = document.getElementById('filter-toggle');
  const closeBtn = document.getElementById('sidebar-close');

  const open = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
}

function setupViewToggle() {
  const grid = document.getElementById('cat-grid');
  document.getElementById('view-grid').addEventListener('click', () => {
    grid.classList.remove('list-view');
    document.getElementById('view-grid').classList.add('active');
    document.getElementById('view-list').classList.remove('active');
  });
  document.getElementById('view-list').addEventListener('click', () => {
    grid.classList.add('list-view');
    document.getElementById('view-list').classList.add('active');
    document.getElementById('view-grid').classList.remove('active');
  });
}

function setupCartListeners() {
  document.getElementById('cart-toggle').onclick = e => { e.preventDefault(); openCart(); };
  document.getElementById('cart-close').onclick = closeCart;
  document.getElementById('overlay').onclick = () => { closeCart(); closeModal(); };
}

function setupModalListeners() {
  document.getElementById('modal-close').onclick = closeModal;
}
