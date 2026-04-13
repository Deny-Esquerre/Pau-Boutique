/* ===================================================
   ADMIN DASHBOARD LOGIC (Firebase & Cloudinary)
   =================================================== */

import { auth, db, CLOUDINARY_CONFIG } from './firebase-config.js';
import { products as initialProducts } from './modules/data.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
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

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const migrateBtn = document.getElementById('migrate-btn');
const productForm = document.getElementById('product-form');
const inventoryList = document.getElementById('inventory-list');
const uploadWidgetBtn = document.getElementById('upload-widget');
const imagePreview = document.getElementById('image-preview');
const pImageUrlInput = document.getElementById('p-image-url');
const loadingOverlay = document.getElementById('loading-overlay');
const tempRegisterBtn = document.getElementById('temp-register');

/* --- Authentication --- */

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    showDashboard();
    loadInventory();
  } else {
    showLogin();
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  toggleLoading(true);
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    alert("Error de acceso: " + error.message);
  } finally {
    toggleLoading(false);
  }
});

// Temporary Register (Only for first-time setup)
if (tempRegisterBtn) {
  tempRegisterBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (!email || !pass) {
      alert("Por favor, ingresa los datos en el formulario antes de registrarte.");
      return;
    }

    if (confirm("¿Deseas crear esta cuenta como administradora? Úsalo solo una vez.")) {
      toggleLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, pass);
        alert("Cuenta creada con éxito. Ahora puedes gestionar tu boutique.");
      } catch (error) {
        alert("Error al crear cuenta: " + error.message);
      } finally {
        toggleLoading(false);
      }
    }
  });
}

// Logout
logoutBtn.addEventListener('click', () => signOut(auth));

function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
}

function showLogin() {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
}

/* --- Cloudinary Widget --- */

const myWidget = cloudinary.createUploadWidget({
  cloudName: CLOUDINARY_CONFIG.cloudName, 
  uploadPreset: CLOUDINARY_CONFIG.uploadPreset
}, (error, result) => { 
  if (!error && result && result.event === "success") { 
    const url = result.info.secure_url;
    pImageUrlInput.value = url;
    imagePreview.style.display = 'block';
    imagePreview.querySelector('img').src = url;
    alert("Imagen subida con éxito");
  }
});

uploadWidgetBtn.addEventListener("click", () => myWidget.open(), false);

/* --- Firestore CRUD --- */

// Add Product
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  toggleLoading(true);

  const productData = {
    name: document.getElementById('p-name').value,
    price: parseFloat(document.getElementById('p-price').value),
    description: document.getElementById('p-desc').value,
    category: document.getElementById('p-category').value,
    badge: document.getElementById('p-badge').value,
    image: pImageUrlInput.value || 'https://source.unsplash.com/800x1000/?fashion', // fallback
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "products"), productData);
    alert("Producto guardado correctamente");
    productForm.reset();
    imagePreview.style.display = 'none';
    loadInventory();
  } catch (error) {
    alert("Error al guardar: " + error.message);
  } finally {
    toggleLoading(false);
  }
});

// Load Inventory
async function loadInventory() {
  inventoryList.innerHTML = '<tr><td colspan="5">Cargando inventario...</td></tr>';
  
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    inventoryList.innerHTML = '';

    querySnapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${p.image}" style="height: 50px; width: 40px; object-fit: cover;"></td>
        <td>${p.name}</td>
        <td><span class="badge" style="text-transform: uppercase; font-size: 0.7rem;">${p.category}</span></td>
        <td>$${p.price.toFixed(2)}</td>
        <td>
          <button class="btn-delete" data-id="${docSnap.id}">Eliminar</button>
        </td>
      `;
      inventoryList.appendChild(row);
    });

    // Attach Delete Listeners
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm("¿Estás seguro de eliminar este producto?")) {
          toggleLoading(true);
          try {
            await deleteDoc(doc(db, "products", btn.dataset.id));
            loadInventory();
          } catch (error) {
            alert("Error al eliminar: " + error.message);
          } finally {
            toggleLoading(false);
          }
        }
      });
    });

  } catch (error) {
    inventoryList.innerHTML = '<tr><td colspan="5">Error al cargar datos.</td></tr>';
  }
}

/* --- Helpers --- */
function toggleLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Data Migration Utility
if (migrateBtn) {
  migrateBtn.addEventListener('click', async () => {
    if (confirm("¿Deseas migrar los productos iniciales de data.js a Firestore? Esto podría duplicar datos si ya los migraste.")) {
      toggleLoading(true);
      try {
        for (const product of initialProducts) {
          // Prepare data (Firestore doesn't need numerical ID in the body as it generates its own)
          const { id, ...data } = product;
          await addDoc(collection(db, "products"), {
            ...data,
            createdAt: new Date()
          });
        }
        alert("Migración completada con éxito");
        loadInventory();
      } catch (error) {
        alert("Error en la migración: " + error.message);
      } finally {
        toggleLoading(false);
      }
    }
  });
}
