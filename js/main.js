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
  initScrollAnimations,
  openInfoModal
} from './modules/ui.js';
import { handleNewsletterSubscription } from './modules/auth.js';
import { applyConfig } from './modules/config.js';
import { initNotifications } from './modules/notifications.js';
import { renderLandingCollections, renderFooterCollections } from './modules/collections.js';
import { openLoginModal, closeLoginModal, handleAdminLogin } from './modules/auth.js';

document.addEventListener('DOMContentLoaded', () => {

  // Initialize Modules
  loadStaticImages();
  renderProducts();
  renderLandingCollections();
  renderFooterCollections();
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
  const loginForm = document.getElementById('login-form');
  const newsletterForm = document.getElementById('newsletter-form');
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
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
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

  // Newsletter subscription
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput) {
        handleNewsletterSubscription(emailInput.value);
        emailInput.value = '';
      }
    });
  }

  // Information Modals Listeners
  const shippingLinks = ['link-shipping', 'link-shipping-footer'];
  const returnsLinks = ['link-returns', 'link-returns-footer'];
  const aboutLinks = ['link-about', 'link-about-footer'];

  const shippingContent = `
    <div style="font-family: var(--font-sans); color: var(--color-charcoal); line-height: 1.7;">
      <p style="margin-bottom: 1.5rem;"><strong>Primer pedido:</strong> ¡El envío es totalmente gratis!</p>
      <p style="margin-bottom: 1.5rem;"><strong>Pedidos posteriores:</strong> El cliente cubre el costo del delivery.</p>
      <p style="margin-bottom: 1.5rem;">El costo de envío por cambio o devolución será cubierto por <strong>Pau Boutique</strong> si el error es nuestro. Si es por otro motivo, el costo de retorno corre por cuenta del cliente.</p>
      <p style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1.5rem;">
        <strong>Cómo Solicitar:</strong><br>
        Escribe a <a href="mailto:pau2025d@gmail.com" style="color: var(--color-black); text-decoration: underline;">pau2025d@gmail.com</a><br>
        WhatsApp: <a href="https://wa.me/51923389040" target="_blank" style="color: var(--color-black); text-decoration: underline;">923 389 040</a><br>
        Con descripción de pedido y motivo de cambio/devolución.
      </p>
    </div>
  `;

  const returnsContent = `
    <div style="font-family: var(--font-sans); color: var(--color-charcoal); line-height: 1.7;">
      <h3 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 0.8rem; color: var(--color-black);">Cambios</h3>
      <p style="margin-bottom: 1.5rem;">Puedes cambiar tu producto dentro de los <strong>5 días posteriores a la recepción</strong>. El producto debe estar sin usar, con etiquetas y en su empaque original.</p>
      
      <h3 style="font-family: var(--font-serif); font-size: 1.2rem; margin-bottom: 0.8rem; color: var(--color-black);">Devoluciones</h3>
      <p style="margin-bottom: 1.5rem;">Las devoluciones son aceptadas solo por productos defectuosos, dañados o erróneos. El reembolso se realiza en un código de descuento o reembolso a tu método de pago original, según corresponda.</p>
      
      <p style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1.5rem;">
        <strong>Contacto para solicitudes:</strong><br>
        WhatsApp: <a href="https://wa.me/51923389040" target="_blank" style="color: var(--color-black); text-decoration: underline;">923 389 040</a>
      </p>
    </div>
  `;

  const aboutContent = `
    <div style="font-family: var(--font-sans); color: var(--color-charcoal); line-height: 1.8;">
      <p style="margin-bottom: 1rem;">En <strong>Pau Boutique</strong> creemos que la moda es una forma de expresión y confianza. Iniciamos este sueño hace 8 años vendiendo joyas de acero quirúrgico.</p>
      <p style="margin-bottom: 1rem;">Descubrimos la oportunidad de ofrecer prendas que hagan sentir cómodas, seguras y lindas a otras mujeres. Creciendo poco a poco, hoy contamos con un espacio organizado para brindarte lo mejor.</p>
      <p>Hoy no solo vendemos ropa, ayudamos a que cada mujer se sienta segura, cómoda y auténtica en su día a día.</p>
    </div>
  `;

  shippingLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openInfoModal('Política de Envíos', shippingContent);
      });
    }
  });

  returnsLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openInfoModal('Cambios y Devoluciones', returnsContent);
      });
    }
  });

  aboutLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openInfoModal('Sobre Nosotros', aboutContent);
      });
    }
  });

});
