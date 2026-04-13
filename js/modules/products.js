/* --- Product Rendering & Modals (Firestore Integration) --- */
import { db } from '../firebase-config.js';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getUnsplashUrl } from './utils.js';
import { addToCart } from './cart.js';

// Cache for products to avoid redundant fetches
let productsCache = [];

export async function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Cargando colección...</div>';

  try {
    let q;
    const productsRef = collection(db, "products");
    
    if (filter === 'all') {
      q = query(productsRef, orderBy("createdAt", "desc"));
    } else {
      q = query(productsRef, where("category", "==", filter), orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(q);
    productsCache = [];
    
    querySnapshot.forEach((doc) => {
      productsCache.push({ id: doc.id, ...doc.data() });
    });

    if (productsCache.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">No se encontraron productos en esta categoría.</div>';
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

      // Check if image is a full URL (Cloudinary) or just a keyword (Unsplash)
      const imgSrc = product.image.startsWith('http') ? product.image : getUnsplashUrl(product.image);

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

  const imgSrc = product.image.startsWith('http') ? product.image : getUnsplashUrl(product.image, 800, 1000);

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
  modal.classList.remove('active');
  if (!document.getElementById('cart-drawer').classList.contains('active')) {
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}
