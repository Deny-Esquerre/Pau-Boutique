/* --- Utility Functions --- */
export function getUnsplashUrl(query, w = 600, h = 800) {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query)}`;
}

export function loadStaticImages() {
  const imageMap = {
    'hero-img': { 
      local: 'images/banners/Banner.png',
      query: 'fashion model elegant boutique runway', 
      w: 1600, h: 900 
    },
    'cat-img-1': { query: 'woman wearing elegant dress fashion', w: 600, h: 800 },
    'cat-img-2': { query: 'woman blazer coat fashion editorial neutral', w: 600, h: 800 },
    'cat-img-3': { query: 'fashion accessories jewelry handbag minimal', w: 600, h: 800 },
    'banner-img': { 
      query: 'fashion editorial dark moody elegant', 
      w: 1600, h: 900 
    },
    'about-img': { 
      local: 'images/about/nosotros.png',
      query: 'boutique clothing store interior elegant', 
      w: 800, h: 1000 
    },
    'insta-img-1': { query: 'fashion outfit street style woman', w: 600, h: 600 },
    'insta-img-2': { query: 'minimalist fashion flatlay', w: 600, h: 600 },
    'insta-img-3': { query: 'woman fashion portrait neutral tones', w: 600, h: 600 },
    'insta-img-4': { query: 'fashion editorial model studio', w: 600, h: 600 },
    'insta-img-5': { query: 'luxury fashion accessories', w: 600, h: 600 },
  };

  Object.entries(imageMap).forEach(([id, { query, w, h, local }]) => {
    const el = document.getElementById(id);
    if (el) {
      // Priorizar imagen local si está definida, de lo contrario usar Unsplash
      el.src = local ? local : getUnsplashUrl(query, w, h);
      el.loading = 'lazy';
      
      // Manejar error de carga si la imagen local no existe
      if (local) {
        el.onerror = () => {
          el.src = getUnsplashUrl(query, w, h);
          el.onerror = null;
        };
      }
    }
  });
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  let icon = 'check-circle';
  if (type === 'error') icon = 'alert-circle';
  if (type === 'warning') icon = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  
  // Initialize lucide for the new icon
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        class: 'lucide-icon'
      },
      nameAttr: 'data-lucide'
    });
  }

  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}
