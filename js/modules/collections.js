import { db } from '../firebase-config.js';
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { initScrollAnimations } from './ui.js';

/**
 * Fetches landing page collections and renders them in the grid
 */
export async function renderLandingCollections() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  try {
    const q = query(collection(db, "categories_landing"), orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 2rem;">No hay colecciones para mostrar.</p>';
      return;
    }

    grid.innerHTML = '';
    querySnapshot.forEach((docSnap) => {
      const col = docSnap.data();
      const card = document.createElement('a');
      card.href = "#productos";
      card.className = "category-card";
      card.setAttribute('data-animate', '');
      
      card.innerHTML = `
        <div class="category-card__image-wrap" style="background: #fdfaf7;">
          <img src="${col.image}" alt="${col.name}" class="category-card__image" style="background: #fdfaf7;">
        </div>
        <div class="category-card__info">
          <h3 class="category-card__title">${col.name}</h3>
          <span class="category-card__link">Ver colección &rarr;</span>
        </div>
      `;
      grid.appendChild(card);
    });

    // Re-trigger scroll animations after dynamic load
    setTimeout(() => {
      initScrollAnimations();
    }, 100);

  } catch (error) {
    console.error("Error al renderizar colecciones:", error);
  }
}

/**
 * Fetches first 3 collections and renders them in the footer
 */
export async function renderFooterCollections() {
  const container = document.getElementById('footer-collections');
  if (!container) return;

  try {
    const q = query(collection(db, "categories_landing"), orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = '<p class="footer__link" style="opacity: 0.6;">Sin colecciones</p>';
      return;
    }

    container.innerHTML = '';
    let count = 0;
    querySnapshot.forEach((docSnap) => {
      if (count < 3) {
        const col = docSnap.data();
        const link = document.createElement('a');
        link.href = "#productos";
        link.className = "footer__link";
        link.textContent = col.name;
        // Optional: add filter logic here if needed
        container.appendChild(link);
        count++;
      }
    });

  } catch (error) {
    console.error("Error al renderizar colecciones en el footer:", error);
  }
}

