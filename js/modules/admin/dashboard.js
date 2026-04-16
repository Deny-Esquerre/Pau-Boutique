/* ===================================================
   ADMIN DASHBOARD MODULE
   =================================================== */

import { db } from '../../firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export async function initDashboard() {
  const statTotalProducts = document.getElementById('stat-total-products');
  const statCategories = document.getElementById('stat-categories');
  const statCategoriesList = document.getElementById('stat-categories-list');
  const statTotalImages = document.getElementById('stat-total-images');
  const categoryChart = document.getElementById('category-chart');
  const recentProductsList = document.getElementById('recent-products-list');

  try {
    const [productsSnap, categoriesSnap] = await Promise.all([
      getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"))),
      getDocs(collection(db, "categories"))
    ]);

    const allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allCategories = categoriesSnap.docs.map(doc => doc.data().name);

    // 1. Core Stats
    if (statTotalProducts) statTotalProducts.textContent = allProducts.length;
    if (statCategories) statCategories.textContent = allCategories.length;

    // 2. Categories List Detail
    if (statCategoriesList) {
      statCategoriesList.textContent = allCategories.length > 0 
        ? allCategories.join(', ') 
        : 'Sin colecciones definidas';
    }

    // 3. Images Count Detail
    if (statTotalImages) {
      const totalImages = allProducts.reduce((sum, p) => {
        const count = Array.isArray(p.images) ? p.images.length : (p.image ? 1 : 0);
        return sum + count;
      }, 0);
      statTotalImages.textContent = totalImages;
    }

    // 4. Elegant Category Chart (Pure CSS)
    if (categoryChart) {
      const counts = {};
      allProducts.forEach(p => {
        const cat = p.category || 'Sin categoría';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      const maxCount = Math.max(...Object.values(counts), 1);
      
      categoryChart.innerHTML = Object.entries(counts).map(([name, count]) => {
        const percentage = (count / maxCount) * 100;
        return `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; font-family: var(--font-sans); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-charcoal);">
              <span>${name}</span>
              <span style="font-weight: 600; color: var(--color-black);">${count}</span>
            </div>
            <div style="width: 100%; height: 4px; background: #f5f5f5; border-radius: 2px; overflow: hidden;">
              <div style="width: ${percentage}%; height: 100%; background: var(--admin-accent); border-radius: 2px; transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 5. Recent Products Table
    if (recentProductsList) {
      const latest = allProducts.slice(0, 5);
      
      if (latest.length === 0) {
        recentProductsList.innerHTML = '<tr><td colspan="4" style="padding: 3rem; text-align: center; color: #999; font-family: var(--font-serif); font-style: italic;">No hay piezas en la colección.</td></tr>';
      } else {
        recentProductsList.innerHTML = latest.map(p => {
          const rawImg = p.images?.[0] || p.image || '';
          const thumb = rawImg.includes('cloudinary.com') 
            ? rawImg.replace('upload/', 'upload/w_80,q_auto,f_auto/') 
            : rawImg;
            
          const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '---';

          return `
            <tr style="border-bottom: 1px solid #fcfcfc;">
              <td style="padding: 15px 0;">
                <img src="${thumb}" style="width: 35px; height: 45px; object-fit: cover; border-radius: 2px; background: #f8f8f8;">
              </td>
              <td style="padding: 15px 0;">
                <p style="margin: 0; font-family: var(--font-serif); font-size: 1rem; color: var(--color-black); line-height: 1.2;">${p.name}</p>
                <span style="font-size: 0.55rem; color: var(--color-gray); text-transform: uppercase; letter-spacing: 0.1em;">${p.category}</span>
              </td>
              <td style="padding: 15px 0; font-family: var(--font-sans); font-size: 0.8rem; font-weight: 500; color: var(--color-black);">S/. ${p.price.toFixed(2)}</td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}
