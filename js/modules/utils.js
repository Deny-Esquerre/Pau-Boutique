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
