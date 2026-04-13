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

export function initTestimonials() {
  const testimonials = document.querySelectorAll('.testimonial');
  const dotsContainer = document.getElementById('testimonial-dots');
  
  if (!testimonials.length || !dotsContainer) return;

  testimonials.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `testimonials__dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Testimonio ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  let current = 0;
  const dots = dotsContainer.querySelectorAll('.testimonials__dot');

  function goToSlide(index) {
    testimonials[current]?.classList.remove('active');
    dots[current]?.classList.remove('active');
    current = index;
    testimonials[current]?.classList.add('active');
    dots[current]?.classList.add('active');
  }

  setInterval(() => {
    goToSlide((current + 1) % testimonials.length);
  }, 5000);
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
