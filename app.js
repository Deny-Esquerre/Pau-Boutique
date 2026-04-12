/* ===================================================
   PAU BOUTIQUE — Application Logic
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Product Data ----
  const products = [
    { id: 1, name: 'Vestido Noir Elegance', price: 389, category: 'vestidos', badge: 'Nuevo', image: 'fashion model elegant black dress studio' },
    { id: 2, name: 'Blazer Oversize Camel', price: 459, category: 'abrigos', badge: '', image: 'woman camel blazer fashion editorial' },
    { id: 3, name: 'Collar Cadena Dorada', price: 129, category: 'accesorios', badge: '', image: 'gold chain necklace jewelry minimal' },
    { id: 4, name: 'Vestido Midi Satín', price: 349, salePrice: 279, category: 'vestidos', badge: 'Sale', image: 'woman satin midi dress champagne color' },
    { id: 5, name: 'Abrigo Lana Premium', price: 599, category: 'abrigos', badge: 'Nuevo', image: 'woman wool coat beige winter' },
    { id: 6, name: 'Bolso Clutch Negro', price: 189, category: 'accesorios', badge: '', image: 'black leather clutch bag minimal' },
    { id: 7, name: 'Vestido Wrap Terracota', price: 299, category: 'vestidos', badge: '', image: 'woman terracotta wrap dress fashion' },
    { id: 8, name: 'Cinturón Cuero Artesanal', price: 99, category: 'accesorios', badge: '', image: 'leather belt handmade brown minimal' },
  ];

  // ---- Unsplash Image Loader ----
  function getUnsplashUrl(query, w = 600, h = 800) {
    return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query)}`;
  }

  // ---- Load Static Images ----
  function loadStaticImages() {
    const imageMap = {
      'hero-img': { query: 'fashion model elegant boutique runway', w: 1600, h: 900 },
      'cat-img-1': { query: 'woman wearing elegant dress fashion', w: 600, h: 800 },
      'cat-img-2': { query: 'woman blazer coat fashion editorial neutral', w: 600, h: 800 },
      'cat-img-3': { query: 'fashion accessories jewelry handbag minimal', w: 600, h: 800 },
      'banner-img': { query: 'fashion editorial dark moody elegant', w: 1600, h: 900 },
      'about-img': { query: 'boutique clothing store interior elegant', w: 800, h: 1000 },
      'insta-img-1': { query: 'fashion outfit street style woman', w: 600, h: 600 },
      'insta-img-2': { query: 'minimalist fashion flatlay', w: 600, h: 600 },
      'insta-img-3': { query: 'woman fashion portrait neutral tones', w: 600, h: 600 },
      'insta-img-4': { query: 'fashion editorial model studio', w: 600, h: 600 },
      'insta-img-5': { query: 'luxury fashion accessories', w: 600, h: 600 },
    };

    Object.entries(imageMap).forEach(([id, { query, w, h }]) => {
      const el = document.getElementById(id);
      if (el) {
        el.src = getUnsplashUrl(query, w, h);
        el.loading = 'lazy';
      }
    });
  }

  // ---- Render Products ----
  function renderProducts(filter = 'all') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    
    grid.innerHTML = filtered.map(product => {
      const priceHTML = product.salePrice
        ? `<span class="product-card__price--original">S/. ${product.price}</span>
           <span class="product-card__price--sale">S/. ${product.salePrice}</span>`
        : `S/. ${product.price}`;

      const badgeHTML = product.badge
        ? `<span class="product-card__badge">${product.badge}</span>`
        : '';

      return `
        <a href="#" class="product-card" data-category="${product.category}">
          <div class="product-card__image-wrap">
            <img src="${getUnsplashUrl(product.image)}" alt="${product.name}" class="product-card__image" loading="lazy">
            ${badgeHTML}
            <div class="product-card__actions">
              <button class="product-card__add-btn" onclick="event.preventDefault(); addToCart(${product.id})">
                Agregar al Carrito
              </button>
            </div>
          </div>
          <div class="product-card__info">
            <h3 class="product-card__name">${product.name}</h3>
            <p class="product-card__price">${priceHTML}</p>
          </div>
        </a>
      `;
    }).join('');
  }

  // ---- Filter Buttons ----
  function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts(btn.dataset.filter);
      });
    });
  }

  // ---- Cart ----
  let cartCount = 0;
  window.addToCart = function(productId) {
    cartCount++;
    const countEl = document.querySelector('.cart-count');
    if (countEl) {
      countEl.textContent = cartCount;
      countEl.style.transform = 'scale(1.3)';
      setTimeout(() => countEl.style.transition = 'transform 0.2s ease', 0);
      setTimeout(() => countEl.style.transform = 'scale(1)', 200);
    }
  };

  // ---- Scroll Animations ----
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible', 'in-view');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-animate], .hero').forEach(el => observer.observe(el));
  }

  // ---- Header Scroll Effect ----
  function initHeaderScroll() {
    const header = document.getElementById('header');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ---- Mobile Menu ----
  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (toggle && mobileNav) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        mobileNav.classList.toggle('open');
      });

      mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('active');
          mobileNav.classList.remove('open');
        });
      });
    }
  }

  // ---- Testimonials Carousel ----
  function initTestimonials() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dotsContainer = document.getElementById('testimonial-dots');
    
    if (!testimonials.length || !dotsContainer) return;

    // Create dots
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
      testimonials[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = index;
      testimonials[current].classList.add('active');
      dots[current].classList.add('active');
    }

    // Auto-advance
    setInterval(() => {
      goToSlide((current + 1) % testimonials.length);
    }, 5000);
  }

  // ---- Newsletter ----
  function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('.newsletter__input');
        if (input && input.value) {
          input.value = '';
          input.placeholder = '¡Gracias por suscribirte!';
          setTimeout(() => {
            input.placeholder = 'Tu correo electrónico';
          }, 3000);
        }
      });
    }
  }

  // ---- Smooth Scroll for anchor links ----
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ---- Initialize Everything ----
  loadStaticImages();
  renderProducts();
  initFilters();
  initScrollAnimations();
  initHeaderScroll();
  initMobileMenu();
  initTestimonials();
  initNewsletter();
  initSmoothScroll();

});
