/* --- Product Rendering & Modals --- */
import { products } from './data.js';
import { getUnsplashUrl } from './utils.js';
import { addToCart } from './cart.js';

export function renderProducts(filter = 'all') {
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
      <div class="product-card" data-category="${product.category}" data-id="${product.id}">
        <div class="product-card__image-wrap">
          <img src="${getUnsplashUrl(product.image)}" alt="${product.name}" class="product-card__image" loading="lazy">
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

  // Add click listeners to cards and buttons
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openProductModal(parseInt(card.dataset.id)));
  });

  grid.querySelectorAll('.product-card__add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(parseInt(btn.dataset.id));
    });
  });
}

export function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-content');
  const overlay = document.getElementById('overlay');

  const priceHTML = product.salePrice
    ? `<span class="product-card__price--original">S/. ${product.price}</span>
       <span class="product-card__price--sale">S/. ${product.salePrice}</span>`
    : `S/. ${product.price}`;

  content.innerHTML = `
    <div class="modal__container">
      <div class="modal__media">
        <img src="${getUnsplashUrl(product.image, 800, 1000)}" alt="${product.name}">
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

  // Listener for dynamic button
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
