import { db } from '../firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

/* --- UI Effects --- */

export function initHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }, { passive: true });
}

export function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      mobileNav.classList.toggle('open');
    });
  }
}

export async function initTestimonials() {
  const container = document.getElementById('testimonials-carousel');
  const dotsContainer = document.getElementById('testimonial-dots');
  
  if (!container || !dotsContainer) return;

  try {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = '<p style="text-align: center; color: var(--color-gray); font-family: var(--font-serif); font-style: italic; padding: 2rem;">Próximamente más experiencias...</p>';
      return;
    }

    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    let index = 0;
    querySnapshot.forEach((docSnap) => {
      const t = docSnap.data();
      const isActive = index === 0;
      
      const testimonialEl = document.createElement('div');
      testimonialEl.className = `testimonial${isActive ? ' active' : ''}`;
      testimonialEl.innerHTML = `
        <p class="testimonial__quote">"${t.quote}"</p>
        <span class="testimonial__author">— ${t.author}</span>
      `;
      container.appendChild(testimonialEl);

      const dot = document.createElement('button');
      dot.className = `testimonials__dot${isActive ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Testimonio ${index + 1}`);
      const currentIndex = index;
      dot.addEventListener('click', () => goToSlide(currentIndex));
      dotsContainer.appendChild(dot);

      index++;
    });

    const testimonials = container.querySelectorAll('.testimonial');
    const dots = dotsContainer.querySelectorAll('.testimonials__dot');
    let current = 0;

    function goToSlide(newIndex) {
      if (testimonials[current]) testimonials[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = newIndex;
      if (testimonials[current]) testimonials[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }

    if (testimonials.length > 1) {
      setInterval(() => {
        goToSlide((current + 1) % testimonials.length);
      }, 6000);
    }

  } catch (error) {
    console.error("Error loading testimonials:", error);
    container.innerHTML = '<p style="text-align: center; color: #d9534f;">No se pudieron cargar los testimonios.</p>';
  }
}

export function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || !href.startsWith('#')) return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

export function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible', 'in-view');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-animate], .hero').forEach(el => observer.observe(el));
}

export function openInfoModal(title, htmlContent) {
  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-content');
  const overlay = document.getElementById('overlay');

  if (!modal || !content || !overlay) return;

  content.innerHTML = `
    <div class="modal__info" style="padding: 3rem 2rem; max-width: 100%; text-align: left; align-items: flex-start;">
      <h2 class="modal__title" style="margin-bottom: 1.5rem; font-size: 1.8rem; text-align: left; width: 100%;">${title}</h2>
      <div class="modal__desc" style="text-align: left; width: 100%;">
        ${htmlContent}
      </div>
      <button class="btn btn--primary" style="margin-top: 2rem; width: 100%;" onclick="document.getElementById('modal-close').click()">Cerrar</button>
    </div>
  `;

  modal.classList.add('active');
  overlay.classList.add('active');
  document.body.classList.add('no-scroll');
}

