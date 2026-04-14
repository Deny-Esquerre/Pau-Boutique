import { db } from '../firebase-config.js';
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

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
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No hay colecciones para mostrar.</p>';
      return;
    }

    grid.innerHTML = '';
    querySnapshot.forEach((docSnap) => {
      const col = docSnap.data();
      const card = document.createElement('a');
      card.href = "#productos";
      card.className = "category-card";
      card.setAttribute('data-animate', '');
      card.onclick = () => {
        // Al hacer clic, filtramos los productos (si existe la lógica)
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
          if (btn.dataset.filter === col.name.toLowerCase()) {
            btn.click();
          }
        });
      };

      card.innerHTML = `
        <div class="category-card__image-wrap">
          <img src="${col.image}" alt="${col.name}" class="category-card__image">
        </div>
        <div class="category-card__info">
          <h3 class="category-card__title">${col.name}</h3>
          <span class="category-card__link">Ver colección &rarr;</span>
        </div>
      `;
      grid.appendChild(card);
    });

  } catch (error) {
    console.error("Error al renderizar colecciones:", error);
  }
}
