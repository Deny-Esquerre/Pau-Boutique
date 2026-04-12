/* ===================================================
   PAU BOUTIQUE — Main Entry Point
   =================================================== */

import { loadStaticImages } from './modules/utils.js';
import { renderProducts, closeModal } from './modules/products.js';
import { closeCart, openCart } from './modules/cart.js';
import { 
  initHeaderScroll, 
  initMobileMenu, 
  initTestimonials, 
  initSmoothScroll, 
  initScrollAnimations 
} from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Modules
  loadStaticImages();
  renderProducts();
  initHeaderScroll();
  initMobileMenu();
  initTestimonials();
  initSmoothScroll();
  initScrollAnimations();

  // Global UI Listeners
  const overlay = document.getElementById('overlay');
  const cartIcon = document.querySelector('.nav-link--icon[aria-label="Carrito"]');
  const cartClose = document.getElementById('cart-close');
  const modalClose = document.getElementById('modal-close');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      openCart();
    });
  }

  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeCart();
      closeModal();
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
