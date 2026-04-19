/* --- Product Rendering & Modals (Firestore Integration) --- */
import { db } from '../firebase-config.js';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getUnsplashUrl } from './utils.js';
import { addToCart } from './cart.js';

// Cache for products to avoid redundant fetches
let productsCache = {}; 
let currentViewProducts = [];
let unsubscribeProducts = null;

/**
 * Dynamically renders the 5 most recent categories as filter buttons
 */
export async function renderCategoryFilters() {
  const filtersContainer = document.getElementById('category-filters');
  if (!filtersContainer) return;

  try {
    const catsRef = collection(db, "categories");
    // Obtenemos las 5 categorías (puedes ajustar el orden si prefieres por fecha)
    const q = query(catsRef, orderBy("name", "asc"), limit(5));
    const querySnapshot = await getDocs(q);
    
    // Mantener siempre el botón "Todos"
    filtersContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Todos</button>';

    querySnapshot.forEach((docSnap) => {
      const cat = docSnap.data();
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = cat.name.toLowerCase();
      btn.textContent = cat.name;
      
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts(btn.dataset.filter);
      });
      
      filtersContainer.appendChild(btn);
    });

  } catch (error) {
    console.error("Error al cargar filtros de categoría:", error);
  }
}

export function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; font-family: var(--font-serif); font-style: italic; color: var(--color-gray);">Descubriendo piezas exclusivas...</div>';

  try {
    let q;
    const productsRef = collection(db, "products");
    
    // Si es una categoría específica, limitamos a 5 productos recientes según pides
    if (filter === 'all') {
      q = query(productsRef, orderBy("createdAt", "desc"), limit(12)); 
    } else {
      q = query(productsRef, where("category", "==", filter), orderBy("createdAt", "desc"), limit(5));
    }

    // Unsubscribe from previous listener if it exists
    if (unsubscribeProducts) unsubscribeProducts();

    unsubscribeProducts = onSnapshot(q, (querySnapshot) => {
      currentViewProducts = [];
      querySnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() };
        productsCache[doc.id] = product; 
        currentViewProducts.push(product);
      });

      if (currentViewProducts.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: var(--color-gray);">
            <p style="font-family: var(--font-serif); font-style: italic; font-size: 1.2rem; margin-bottom: 10px;">Lo sentimos</p>
            <p style="font-family: var(--font-sans); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em;">No se encontraron productos en esta categoría.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = currentViewProducts.map(product => {
        const priceHTML = product.salePrice
          ? `<span class="product-card__price--original">S/. ${product.price}</span>
             <span class="product-card__price--sale">S/. ${product.salePrice}</span>`
          : `S/. ${product.price}`;

        const badgeHTML = product.badge
          ? `<span class="product-card__badge">${product.badge}</span>`
          : '';

        const rawImg = (product.images && product.images.length > 0) ? product.images[0] : (product.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80');
        const imgSrc = rawImg.startsWith('http') ? rawImg : getUnsplashUrl(rawImg);

        return `
          <div class="product-card" data-category="${product.category}" data-id="${product.id}">
            <div class="product-card__image-wrap">
              <img src="${imgSrc}" alt="${product.name}" class="product-card__image" loading="lazy">
              ${badgeHTML}
              <div class="product-card__actions">
                <button class="product-card__add-btn" data-id="${product.id}">
                  Añadir al Carrito
                </button>
              </div>
            </div>
            <div class="product-card__info">
              <h3 class="product-card__name">${product.name}</h3>
              <p class="product-card__price">${priceHTML}</p>
            </div>
          </div>
        `;
      }).join('');

      // Reattach listeners
      attachEventListeners(grid);
    }, (error) => {
      console.error("Error en tiempo real:", error);
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Error al cargar la colección.</div>';
    });

  } catch (error) {
    console.error("Error al cargar productos:", error);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Error al cargar la colección. Por favor, intenta de nuevo.</div>';
  }
}

function attachEventListeners(grid) {
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openProductModal(card.dataset.id));
  });

  grid.querySelectorAll('.product-card__add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const product = productsCache[btn.dataset.id];
      if (product) {
        addToCart(product);
      }
    });
  });
}

// --- CLOUDINARY OPTIMIZER ---
const optimizeUrl = (url, params = 'w_800,q_auto,f_auto') => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
  return url.replace('upload/', `upload/${params}/`);
};

export function openProductModal(idOrProduct) {
  // Acepta tanto un objeto producto completo como un string ID
  let product;
  if (typeof idOrProduct === 'object' && idOrProduct !== null) {
    product = idOrProduct;
    // Guardar en cache por si se llama con ID después
    if (product.id) productsCache[product.id] = product;
  } else {
    product = productsCache[idOrProduct];
  }

  if (!product) {
    console.error("Producto no encontrado.");
    return;
  }

  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-content');
  const overlay = document.getElementById('overlay');

  const priceHTML = product.salePrice
    ? `<span class="product-card__price--original">S/. ${product.price}</span>
       <span class="product-card__price--sale">S/. ${product.salePrice}</span>`
    : `S/. ${product.price}`;

  const fallbackImg = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';
  const images = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.image || fallbackImg];
  
  const mainImgSrc = optimizeUrl(images[0]);

  const thumbnailsHTML = images.length > 1 ? `
    <div class="modal__thumbnails">
      ${images.map((img, index) => {
        const thumbSrc = optimizeUrl(img, 'w_200,h_200,c_fill,q_auto,f_auto');
        const fullSrc = optimizeUrl(img);
        return `<img src="${thumbSrc}" alt="${product.name} ${index + 1}" class="modal__thumb ${index === 0 ? 'active' : ''}" data-full="${fullSrc}">`;
      }).join('')}
    </div>
  ` : '';

  if (content) {
    content.innerHTML = `
      <div class="modal__container">
        <div class="modal__media">
          <img id="modal-main-image" src="${mainImgSrc}" alt="${product.name}">
          ${thumbnailsHTML}
        </div>
        <div class="modal__info">
          <span class="modal__category">${product.category}</span>
          <h2 class="modal__title">${product.name}</h2>
          <div class="modal__price">${priceHTML}</div>
          <p class="modal__desc">${product.description || 'Elegancia y estilo exclusivo.'}</p>
          <button class="btn btn--primary add-to-cart-modal" data-id="${product.id}">Agregar al Carrito</button>
        </div>
      </div>
    `;

    // Thumbs logic
    const thumbs = content.querySelectorAll('.modal__thumb');
    const mainImg = content.querySelector('#modal-main-image');
    
    thumbs.forEach(thumb => {
      thumb.onclick = () => {
        mainImg.src = thumb.dataset.full;
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      };
    });

    const addToCartBtn = content.querySelector('.add-to-cart-modal');
    if (addToCartBtn) {
      addToCartBtn.onclick = () => {
        addToCart(product);
        closeModal();
      };
    }
  }

  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
  document.body.classList.add('no-scroll');
}

export function closeModal() {
  const modal = document.getElementById('product-modal');
  const overlay = document.getElementById('overlay');
  if (!modal) return;
  modal.classList.remove('active');
  if (overlay && !document.getElementById('cart-drawer').classList.contains('active')) {
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}
