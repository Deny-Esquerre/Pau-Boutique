/* --- Cart Logic --- */
import { getUnsplashUrl, showToast } from './utils.js';

let cart = [];

/**
 * Adds a product to the cart.
 * Accepts the product object directly from Firebase modules.
 */
export function addToCart(product) {
  if (!product) return;

  // Check if already in cart (optional: increase quantity if needed)
  cart.push({ ...product });
  updateCartUI();
  
  // Notificación y abrir carrito
  showToast(`${product.name} añadido al carrito`);
  openCart();
}

export function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

export function updateCartUI() {
  const countEl = document.querySelector('.cart-count');
  if (countEl) {
    countEl.textContent = cart.length;
    countEl.style.transform = 'scale(1.3)';
    setTimeout(() => countEl.style.transform = 'scale(1)', 200);
  }

  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  
  if (cart.length === 0) {
    cartItems.innerHTML = `<p style="text-align: center; color: var(--color-gray); margin-top: 2rem;">Tu carrito está vacío</p>`;
    cartTotal.textContent = 'S/. 0.00';
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => {
    const rawImg = (item.images && item.images.length > 0) ? item.images[0] : (item.image || '');
    const imgSrc = rawImg.startsWith('http') ? rawImg : getUnsplashUrl(rawImg, 200, 250);

    return `
      <div class="cart-item">
        <img src="${imgSrc}" alt="${item.name}" class="cart-item__img">
        <div class="cart-item__info">
          <h4>${item.name}</h4>
          <p>S/. ${item.salePrice || item.price}</p>
          <button class="cart-item__remove" data-index="${index}">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.salePrice || item.price) || 0;
    return sum + price;
  }, 0);
  cartTotal.textContent = `S/. ${total.toFixed(2)}`;

  // Add listeners to remove buttons
  cartItems.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.onclick = () => removeFromCart(parseInt(btn.dataset.index));
  });
}

export function openCart() {
  document.getElementById('cart-drawer').classList.add('active');
  document.getElementById('overlay').classList.add('active');
  document.body.classList.add('no-scroll');
}

export function closeCart() {
  document.getElementById('cart-drawer').classList.remove('active');
  if (!document.getElementById('product-modal').classList.contains('active')) {
    document.getElementById('overlay').classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}
