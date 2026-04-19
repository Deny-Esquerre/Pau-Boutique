/* ===================================================
   PAU BOUTIQUE — Main Entry Point (Optimized & Cached)
   =================================================== */

import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, orderBy, query, onSnapshot, where, limit } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { loadStaticImages } from './modules/utils.js';
import { closeModal, openProductModal } from './modules/products.js';
import { closeCart, openCart, addToCart } from './modules/cart.js';
import { 
  initHeaderScroll, initMobileMenu, initTestimonials, 
  initSmoothScroll, initScrollAnimations, openInfoModal
} from './modules/ui.js';
import { handleNewsletterSubscription, openLoginModal, closeLoginModal, handleAdminLogin } from './modules/auth.js';
import { initNotifications } from './modules/notifications.js';

// --- CONFIGURATION ---
const CACHE_KEY = 'pb_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// --- CACHE ENGINE ---
const cacheManager = {
  get(key) {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const item = cache[key];
    if (item && (Date.now() - item.timestamp < CACHE_TTL)) return item.data;
    return null;
  },
  set(key, data) {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }
};

// --- CLOUDINARY OPTIMIZER ---
const optimizeUrl = (url, params) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
  return url.replace('upload/', `upload/${params}/`);
};

// --- OPTIMIZED DATA FETCHERS ---
const fetchConfigCached = async () => {
  const cached = cacheManager.get('config');
  if (cached) return cached;
  const snap = await getDoc(doc(db, 'settings', 'general'));
  const data = snap.exists() ? snap.data() : null;
  if (data) cacheManager.set('config', data);
  return data;
};

const fetchCollectionsCached = async () => {
  const cached = cacheManager.get('collections');
  if (cached) return cached;
  const q = query(collection(db, "categories_landing"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (data.length) cacheManager.set('collections', data);
  return data;
};

// --- RENDERERS (Optimized with Cloudinary) ---
const applyConfigOptimized = (config) => {
  if (!config) return;
  const heroImg = document.getElementById('hero-img');
  const bImg = document.getElementById('banner-img');
  
  if (config.heroImage && heroImg) heroImg.src = optimizeUrl(config.heroImage, 'w_1400,q_auto,f_auto');
  if (config.bannerImage && bImg) bImg.src = optimizeUrl(config.bannerImage, 'w_1400,q_auto,f_auto');
  
  document.getElementById('announcement-bar').style.display = config.announcementActive ? 'block' : 'none';
  document.getElementById('announcement-text').textContent = config.announcement;
  document.getElementById('hero-subtitle').textContent = config.heroSubtitle;
  document.getElementById('hero-title').innerHTML = config.heroTitle;
  document.getElementById('hero-btn').textContent = config.heroBtnText;
  document.getElementById('hero-container').style.opacity = "1";
  
  const bTitle = document.getElementById('banner-title');
  if (bTitle) {
    bTitle.textContent = config.bannerTitle;
    document.getElementById('banner-subtitle').textContent = config.bannerSubtitle;
    document.getElementById('banner-desc').textContent = config.bannerDesc;
    document.getElementById('banner-btn').textContent = config.bannerBtnText;
    document.getElementById('banner-container').style.opacity = "1";
  }
};

const renderCollectionsOptimized = (cols) => {
  const grid = document.getElementById('categories-grid');
  const footer = document.getElementById('footer-collections');
  if (!grid || !cols) return;

  grid.innerHTML = cols.map(col => `
    <a href="#productos" class="category-card" data-animate>
      <div class="category-card__image-wrap">
        <img src="${optimizeUrl(col.image, 'w_600,q_auto,f_auto')}" alt="${col.name}" class="category-card__image" loading="lazy">
      </div>
      <div class="category-card__info">
        <h3 class="category-card__title">${col.name}</h3>
        <span class="category-card__link">Ver colección &rarr;</span>
      </div>
    </a>
  `).join('');

  if (footer) {
    footer.innerHTML = cols.slice(0, 3).map(col => `<a href="#productos" class="footer__link">${col.name}</a>`).join('');
  }
  initScrollAnimations();
};

const renderProductsFresh = () => {
  const grid = document.getElementById('products-grid');
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(12));
  
  onSnapshot(q, (snap) => {
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    grid.innerHTML = products.map(p => {
      const priceHTML = p.salePrice
        ? `<span class="product-card__price--original">S/. ${p.price}</span>
           <span class="product-card__price--sale">S/. ${p.salePrice}</span>`
        : `S/. ${p.price}`;
      return `
        <div class="product-card" data-id="${p.id}" style="cursor:pointer">
          <div class="product-card__image-wrap">
            <img src="${optimizeUrl(p.images?.[0] || p.image, 'w_600,q_auto,f_auto')}" alt="${p.name}" class="product-card__image" loading="lazy">
            ${p.badge ? `<span class="product-card__badge">${p.badge}</span>` : ''}
            <div class="product-card__actions">
              <button class="product-card__add-btn" data-id="${p.id}">Añadir al Carrito</button>
            </div>
          </div>
          <div class="product-card__info">
            <h3 class="product-card__name">${p.name}</h3>
            <p class="product-card__price">${priceHTML}</p>
          </div>
        </div>
      `;
    }).join('');

    // Click en tarjeta → abrir modal con datos completos
    grid.querySelectorAll('.product-card').forEach(card => {
      card.onclick = () => {
        const product = products.find(item => item.id === card.dataset.id);
        if (product) openProductModal(product);
      };
    });

    // Botón añadir al carrito (sin propagar al click de la tarjeta)
    grid.querySelectorAll('.product-card__add-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const p = products.find(item => item.id === btn.dataset.id);
        if (p) addToCart(p);
      };
    });
  });
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  // Promise.all for parallel loading
  const [config, collections] = await Promise.all([
    fetchConfigCached(),
    fetchCollectionsCached(),
    renderProductsFresh()
  ]);

  applyConfigOptimized(config);
  renderCollectionsOptimized(collections);

  // Remove Skeletons
  const hideSkeletons = () => {
    document.querySelectorAll('.skeleton').forEach(s => s.style.display = 'none');
    document.getElementById('hero-img').style.opacity = "1";
    document.getElementById('banner-img').style.opacity = "1";
  };
  
  window.addEventListener('load', hideSkeletons);
  setTimeout(hideSkeletons, 2000);

  // UI Modules
  loadStaticImages();
  initHeaderScroll();
  initMobileMenu();
  initTestimonials();
  initSmoothScroll();
  initScrollAnimations();
  initNotifications();

  // Listeners
  document.querySelector('.nav-link--icon[aria-label="Carrito"]').onclick = (e) => { e.preventDefault(); openCart(); };
  document.getElementById('cart-close').onclick = closeCart;
  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('login-close').onclick = closeLoginModal;
  document.querySelectorAll('.open-login').forEach(btn => btn.onclick = (e) => { e.preventDefault(); openLoginModal(); });
  document.getElementById('overlay').onclick = () => { closeCart(); closeModal(); closeLoginModal(); };

  document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    handleAdminLogin(document.getElementById('login-email').value, document.getElementById('login-password').value);
  };
});
