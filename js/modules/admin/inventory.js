/* ===================================================
   ADMIN INVENTORY MODULE
   =================================================== */

import { db } from '../../firebase-config.js';
import { showToast } from '../utils.js';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export async function loadInventory() {
  const inventoryList = document.getElementById('inventory-list');
  const statTotalProducts = document.getElementById('stat-total-products');
  const statCategories = document.getElementById('stat-categories');

  if (!inventoryList) return;
  inventoryList.innerHTML = '<tr><td colspan="5">Actualizando inventario...</td></tr>';
  
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    inventoryList.innerHTML = ''; let count = 0;
    querySnapshot.forEach((docSnap) => {
      count++;
      const p = docSnap.data();
      const displayImage = p.images && p.images.length > 0 ? p.images[0] : '';
      const row = document.createElement('tr');
      row.style.borderBottom = "1px solid #f0f0f0";
      row.innerHTML = `
        <td style="padding: 15px;"><img src="${displayImage}" style="height: 50px; width: 40px; object-fit: cover;"></td>
        <td style="padding: 15px;">${p.name}</td>
        <td style="padding: 15px;">${p.category}</td>
        <td style="padding: 15px;">S/. ${p.price.toFixed(2)}</td>
        <td style="padding: 15px;"><button class="btn-delete" data-id="${docSnap.id}">Eliminar</button></td>
      `;
      inventoryList.appendChild(row);
    });
    if (statTotalProducts) statTotalProducts.textContent = count;
    const cats = new Set(); querySnapshot.forEach(d => cats.add(d.data().category));
    if (statCategories) statCategories.textContent = cats.size;
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar pieza?")) {
          try { await deleteDoc(doc(db, "products", btn.dataset.id)); showToast("Eliminado"); loadInventory(); }
          catch (e) { showToast("Error: " + e.message, 'error'); }
        }
      };
    });
  } catch (e) { inventoryList.innerHTML = '<tr><td colspan="5">Error de conexión.</td></tr>'; }
}
