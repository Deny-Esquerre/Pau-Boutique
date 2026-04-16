/* ===================================================
   ADMIN DASHBOARD MODULE
   =================================================== */

import { db } from '../../firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export async function initDashboard() {
  const statTotalProducts = document.getElementById('stat-total-products');
  const statCategories = document.getElementById('stat-categories');
  
  if (statTotalProducts || statCategories) {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      if (statTotalProducts) statTotalProducts.textContent = querySnapshot.size;
      
      if (statCategories) {
        const cats = new Set();
        querySnapshot.forEach(docSnap => cats.add(docSnap.data().category));
        statCategories.textContent = cats.size;
      }
    } catch (e) { console.error("Error dashboard stats:", e); }
  }
}
