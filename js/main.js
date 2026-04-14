/* ===================================================
   PAU BOUTIQUE — Main Entry Point
   =================================================== */

import { loadStaticImages } from './modules/utils.js';
import { renderProducts, renderCategoryFilters, closeModal } from './modules/products.js';
import { closeCart, openCart } from './modules/cart.js';
import { 
  initHeaderScroll, 
  initMobileMenu, 
  initTestimonials, 
  initSmoothScroll, 
  initScrollAnimations 
} from './modules/ui.js';
import { openLoginModal, closeLoginModal, handleAdminLogin } from './modules/auth.js';
import { applyConfig } from './modules/config.js';
import { initNotifications } from './modules/notifications.js';
import { renderLandingCollections } from './modules/collections.js';

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Modules
  loadStaticImages();
  renderProducts();
  renderLandingCollections();
  applyConfig();
  initHeaderScroll();
  initMobileMenu();
  initTestimonials();
  initSmoothScroll();
  initScrollAnimations();
  initNotifications();

  // Global UI Listeners
  const overlay = document.getElementById('overlay');
  const cartIcon = document.querySelector('.nav-link--icon[aria-label="Carrito"]');
  const cartClose = document.getElementById('cart-close');
  const modalClose = document.getElementById('modal-close');
  const loginClose = document.getElementById('login-close');
  const openLoginBtns = document.querySelectorAll('.open-login');
  const loginForm = document.getElementById('admin-login-form');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  }

  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (loginClose) loginClose.addEventListener('click', closeLoginModal);

  openLoginBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openLoginModal();
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value;
      const pass = document.getElementById('admin-password').value;
      handleAdminLogin(email, pass);
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeCart();
      closeModal();
      closeLoginModal();
    });
  }

  // Filter functionality
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.filter);
    });
  });

});
