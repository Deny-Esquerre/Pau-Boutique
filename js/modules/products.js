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
let productsCache = [];
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
      productsCache = [];
      querySnapshot.forEach((doc) => {
        productsCache.push({ id: doc.id, ...doc.data() });
      });

      if (productsCache.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: var(--color-gray);">
            <p style="font-family: var(--font-serif); font-style: italic; font-size: 1.2rem; margin-bottom: 10px;">Lo sentimos</p>
            <p style="font-family: var(--font-sans); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em;">No se encontraron productos en esta categoría.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = productsCache.map(product => {
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
                  Vista Rápida
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
      addToCart(btn.dataset.id);
    });
  });
}

export function openProductModal(id) {
  const product = productsCache.find(p => p.id === id);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-content');
  const overlay = document.getElementById('overlay');

  const priceHTML = product.salePrice
    ? `<span class="product-card__price--original">S/. ${product.price}</span>
       <span class="product-card__price--sale">S/. ${product.salePrice}</span>`
    : `S/. ${product.price}`;

  const rawImg = (product.images && product.images.length > 0) ? product.images[0] : product.image;
  const imgSrc = rawImg.startsWith('http') ? rawImg : getUnsplashUrl(rawImg, 800, 1000);

  content.innerHTML = `
    <div class="modal__container">
      <div class="modal__media">
        <img src="${imgSrc}" alt="${product.name}">
      </div>
      <div class="modal__info">
        <span class="modal__category">${product.category}</span>
        <h2 class="modal__title">${product.name}</h2>
        <div class="modal__price">${priceHTML}</div>
        <p class="modal__desc">${product.description}</p>
        <button class="btn btn--primary add-to-cart-modal" data-id="${product.id}">Agregar al Carrito</button>
      </div>
    </div>
  `;

  content.querySelector('.add-to-cart-modal').onclick = () => {
    addToCart(product.id);
    closeModal();
  };

  modal.classList.add('active');
  overlay.classList.add('active');
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
