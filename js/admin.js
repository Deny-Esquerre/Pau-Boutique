/* ===================================================
   ADMIN DASHBOARD LOGIC (Modular Version)
   =================================================== */

import { auth, db, CLOUDINARY_CONFIG } from './firebase-config.js';
import { products as initialProducts } from './modules/data.js';
import { showToast } from './modules/utils.js';
import { fetchConfig, updateConfig } from './modules/config.js';
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
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const configForm = document.getElementById('config-form');
const configAnnouncementInput = document.getElementById('config-announcement');
const configAnnouncementPreview = document.getElementById('announcement-preview');

// DOM Elements - Form & List
const productForm = document.getElementById('product-form');
const inventoryList = document.getElementById('inventory-list');
const imagesInput = document.getElementById('p-images-input');
const uploadStatus = document.getElementById('upload-status');
const imagePreview = document.getElementById('image-preview');
let uploadedImages = []; // Array to store multiple URLs

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
    showToast("Bienvenida, Pau");
  } catch (error) {
    showToast("Error: " + error.message, 'error');
  } finally {
    toggleLoading(false);
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

/* --- Navigation --- */

function switchModule(moduleId) {
  modules.forEach(mod => mod.id === `mod-${moduleId}` ? mod.classList.add('active') : mod.classList.remove('active'));
  sidebarLinks.forEach(link => link.dataset.mod === moduleId ? link.classList.add('active') : link.classList.remove('active'));
  
  if (moduleId === 'config') {
    initConfigModule();
  }

  // Close sidebar on mobile after selection
  if (window.innerWidth <= 992) {
    sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }
}

sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchModule(link.dataset.mod);
  });
});

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    const isActive = sidebar.classList.toggle('active');
    if (sidebarOverlay) {
      if (isActive) sidebarOverlay.classList.add('active');
      else sidebarOverlay.classList.remove('active');
    }
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });
}

quickLinks.forEach(btn => {
  btn.addEventListener('click', () => switchModule(btn.dataset.mod));
});

/* --- Configuration Module --- */

async function initConfigModule() {
  const config = await fetchConfig();
  if (config && configAnnouncementInput) {
    configAnnouncementInput.value = config.announcement;
    if (configAnnouncementPreview) {
      configAnnouncementPreview.textContent = config.announcement;
    }
  }
}

if (configAnnouncementInput) {
  configAnnouncementInput.addEventListener('input', (e) => {
    if (configAnnouncementPreview) {
      configAnnouncementPreview.textContent = e.target.value;
    }
  });
}

if (configForm) {
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newAnnouncement = configAnnouncementInput.value;
    const success = await updateConfig({ announcement: newAnnouncement });
    if (success) {
      showToast("Configuración del sitio actualizada con éxito");
    } else {
      showToast("Error al actualizar la configuración", "error");
    }
  });
}

/* --- Dashboard Init --- */

async function initDashboard() {
  await loadInventory();
}

/* --- Cloudinary (Subida Nativa) --- */

if (imagesInput) {
  imagesInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (uploadedImages.length + files.length > 3) {
      showToast("Máximo 3 imágenes permitidas", "error");
      return;
    }

    uploadStatus.textContent = "Subiendo fotos...";
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (result.secure_url) {
          uploadedImages.push(result.secure_url);
          renderPreviews();
          showToast("Imagen lista", "success");
        }
      } catch (error) {
        console.error("Error al subir a Cloudinary:", error);
        showToast("Error al subir una imagen", "error");
      }
    }

    uploadStatus.textContent = "";
    imagesInput.value = ""; // Limpiar input para permitir re-selección
  });
}

function renderPreviews() {
  imagePreview.innerHTML = uploadedImages.map((url, index) => `
    <div class="preview-item" style="position: relative; display: inline-block; margin-right: 10px;">
      <img src="${url}" alt="Preview ${index + 1}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
      <button type="button" class="remove-img" data-index="${index}" style="position: absolute; top: -5px; right: -5px; background: #000; color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; line-height: 20px;">&times;</button>
    </div>
  `).join('');

  // Listener para eliminar fotos
  imagePreview.querySelectorAll('.remove-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.index);
      uploadedImages.splice(idx, 1);
      renderPreviews();
    });
  });
}

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
    images: uploadedImages.length > 0 ? uploadedImages : ['https://source.unsplash.com/800x1000/?fashion'],
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "products"), productData);
    showToast("Pieza guardada en la colección con éxito");
    productForm.reset();
    uploadedImages = [];
    imagePreview.innerHTML = '';
    loadInventory();
    switchModule('inventory');
  } catch (error) {
    showToast("Error: " + error.message, 'error');
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
      // Handle both legacy 'image' and new 'images' array
      const displayImage = p.images && p.images.length > 0 ? p.images[0] : (p.image || 'https://source.unsplash.com/800x1000/?fashion');
      
      const row = document.createElement('tr');
      row.style.borderBottom = "1px solid #f0f0f0";
      row.innerHTML = `
        <td style="padding: 15px;"><img src="${displayImage}" style="height: 50px; width: 40px; object-fit: cover; border-radius: 4px;"></td>
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
            showToast("Pieza eliminada");
            loadInventory();
          } catch (error) {
            showToast("Error: " + error.message, 'error');
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
        showToast("Migración terminada");
        loadInventory();
      } catch (error) {
        showToast("Error: " + error.message, 'error');
      } finally {
        toggleLoading(false);
      }
    }
  });
}
