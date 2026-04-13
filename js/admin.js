/* ===================================================
   ADMIN DASHBOARD LOGIC (Modular Version)
   =================================================== */

import { auth, db, CLOUDINARY_CONFIG } from './firebase-config.js';
import { products as initialProducts } from './modules/data.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// DOM Elements - Shell
const loginSection = document.getElementById('login-section');
const adminWrapper = document.getElementById('admin-wrapper');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const sidebarLinks = document.querySelectorAll('.sidebar__link');
const modules = document.querySelectorAll('.module-section');
const loadingOverlay = document.getElementById('loading-overlay');

// DOM Elements - Form & List
const productForm = document.getElementById('product-form');
const inventoryList = document.getElementById('inventory-list');
const uploadWidgetBtn = document.getElementById('upload-widget');
const imagePreview = document.getElementById('image-preview');
const pImageUrlInput = document.getElementById('p-image-url');

// DOM Elements - Dashboard
const statTotalProducts = document.getElementById('stat-total-products');
const quickLinks = document.querySelectorAll('.quick-link');
const migrateBtn = document.getElementById('migrate-btn');

/* --- Authentication & Session --- */

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    adminWrapper.style.display = 'flex';
    initDashboard();
  } else {
    loginSection.style.display = 'flex';
    adminWrapper.style.display = 'none';
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  toggleLoading(true);
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    toggleLoading(false);
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

/* --- Navigation --- */

function switchModule(moduleId) {
  modules.forEach(mod => mod.id === `mod-${moduleId}` ? mod.classList.add('active') : mod.classList.remove('active'));
  sidebarLinks.forEach(link => link.dataset.mod === moduleId ? link.classList.add('active') : link.classList.remove('active'));
}

sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchModule(link.dataset.mod);
  });
});

quickLinks.forEach(btn => {
  btn.addEventListener('click', () => switchModule(btn.dataset.mod));
});

/* --- Dashboard Init --- */

async function initDashboard() {
  await loadInventory();
}

/* --- Cloudinary --- */

const myWidget = cloudinary.createUploadWidget({
  cloudName: CLOUDINARY_CONFIG.cloudName, 
  uploadPreset: CLOUDINARY_CONFIG.uploadPreset
}, (error, result) => { 
  if (!error && result && result.event === "success") { 
    const url = result.info.secure_url;
    pImageUrlInput.value = url;
    imagePreview.style.display = 'block';
    imagePreview.querySelector('img').src = url;
  }
});

if (uploadWidgetBtn) uploadWidgetBtn.addEventListener("click", () => myWidget.open(), false);

/* --- Firestore CRUD --- */

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  toggleLoading(true);

  const productData = {
    name: document.getElementById('p-name').value,
    price: parseFloat(document.getElementById('p-price').value),
    description: document.getElementById('p-desc').value,
    category: document.getElementById('p-category').value,
    badge: document.getElementById('p-badge').value,
    image: pImageUrlInput.value || 'https://source.unsplash.com/800x1000/?fashion',
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "products"), productData);
    alert("Producto añadido con éxito");
    productForm.reset();
    imagePreview.style.display = 'none';
    loadInventory();
    switchModule('inventory');
  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    toggleLoading(false);
  }
});

async function loadInventory() {
  if (!inventoryList) return;
  inventoryList.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center;">Actualizando inventario...</td></tr>';
  
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    inventoryList.innerHTML = '';
    let count = 0;

    querySnapshot.forEach((docSnap) => {
      count++;
      const p = docSnap.data();
      const row = document.createElement('tr');
      row.style.borderBottom = "1px solid #f0f0f0";
      row.innerHTML = `
        <td style="padding: 15px;"><img src="${p.image}" style="height: 50px; width: 40px; object-fit: cover; border-radius: 4px;"></td>
        <td style="padding: 15px; font-weight: 500;">${p.name}</td>
        <td style="padding: 15px; color: #666;">${p.category}</td>
        <td style="padding: 15px; font-weight: 600;">S/. ${p.price.toFixed(2)}</td>
        <td style="padding: 15px;">
          <button class="btn-delete" data-id="${docSnap.id}" style="color: #d9534f; border: none; background: none; cursor: pointer; text-decoration: underline;">Eliminar</button>
        </td>
      `;
      inventoryList.appendChild(row);
    });

    statTotalProducts.textContent = count;

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm("¿Eliminar esta pieza de la colección?")) {
          toggleLoading(true);
          try {
            await deleteDoc(doc(db, "products", btn.dataset.id));
            loadInventory();
          } catch (error) {
            alert("Error: " + error.message);
          } finally {
            toggleLoading(false);
          }
        }
      });
    });

  } catch (error) {
    inventoryList.innerHTML = '<tr><td colspan="5">Error al conectar con la base de datos.</td></tr>';
  }
}

/* --- Helpers --- */

function toggleLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

if (migrateBtn) {
  migrateBtn.addEventListener('click', async () => {
    if (confirm("¿Migrar productos iniciales?")) {
      toggleLoading(true);
      try {
        for (const product of initialProducts) {
          const { id, ...data } = product;
          await addDoc(collection(db, "products"), { ...data, createdAt: new Date() });
        }
        alert("Migración terminada");
        loadInventory();
      } catch (error) {
        alert("Error: " + error.message);
      } finally {
        toggleLoading(false);
      }
    }
  });
}
