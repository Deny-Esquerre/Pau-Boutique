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

// DOM Elements - Config Testimonials & Announcement
const configAnnouncementInput = document.getElementById('config-announcement');
const configAnnouncementPreview = document.getElementById('announcement-preview');
const configAnnouncementActive = document.getElementById('config-announcement-active');
const testimonialForm = document.getElementById('testimonial-form');
const testimonialsListAdmin = document.getElementById('testimonials-admin-list');
const migrateTBtn = document.getElementById('migrate-testimonials');
const refreshTBtn = document.getElementById('refresh-testimonials');

// DOM Elements - Form & List (Products)
const productForm = document.getElementById('product-form');
const inventoryList = document.getElementById('inventory-list');
const pCategorySelect = document.getElementById('p-category');
const manageCatsBtn = document.getElementById('manage-cats-btn');
const catManagerPanel = document.getElementById('cat-manager-panel');
const closeCatManager = document.getElementById('close-cat-manager');
const catListAdmin = document.getElementById('cat-list-admin');
const newCatInput = document.getElementById('new-cat-name');
const saveCatBtn = document.getElementById('save-new-cat');
const imagesInput = document.getElementById('p-images-input');
const dropzone = document.getElementById('dropzone');
const uploadStatus = document.getElementById('upload-status');
const imagePreview = document.getElementById('image-preview');
let uploadedImages = []; // Array to store multiple URLs

// DOM Elements - Notifications
const notificationForm = document.getElementById('notification-form');
const notifHistoryList = document.getElementById('notifications-history-list');
const statSubscribers = document.getElementById('stat-subscribers');
const statTotalNotifications = document.getElementById('stat-total-notifications');

/* --- Categories Management Logic --- */

async function loadCategories() {
  if (!pCategorySelect || !catListAdmin) return;
  
  try {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    
    // Si no hay categorías, crear las básicas
    if (querySnapshot.empty) {
      const defaults = ["Vestidos", "Abrigos", "Accesorios"];
      for (const cat of defaults) {
        await addDoc(collection(db, "categories"), { name: cat });
      }
      return loadCategories(); // Recargar una vez creadas
    }

    // Actualizar Selector de Producto
    pCategorySelect.innerHTML = '';
    catListAdmin.innerHTML = '';

    querySnapshot.forEach((docSnap) => {
      const cat = docSnap.data();
      const catId = docSnap.id;
      
      // Añadir al selector
      const option = document.createElement('option');
      option.value = cat.name.toLowerCase();
      option.textContent = cat.name;
      pCategorySelect.appendChild(option);

      // Añadir al gestor (Chips)
      const chip = document.createElement('div');
      chip.className = "cat-chip";
      chip.innerHTML = `
        <span>${cat.name}</span>
        <button type="button" class="del-cat" data-id="${catId}" style="background: none; border: none; color: #d9534f; cursor: pointer; font-size: 14px; line-height: 1; padding: 0;">&times;</button>
      `;
      catListAdmin.appendChild(chip);
    });

    // Listener para eliminar categorías
    document.querySelectorAll('.del-cat').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar esta categoría de la lista?")) {
          toggleLoading(true);
          try {
            await deleteDoc(doc(db, "categories", btn.dataset.id));
            showToast("Categoría eliminada");
            loadCategories();
          } catch (error) {
            showToast("Error: " + error.message, "error");
          } finally {
            toggleLoading(false);
          }
        }
      };
    });

  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

// UI Handlers for Categories
if (manageCatsBtn) {
  manageCatsBtn.onclick = () => catManagerPanel.style.display = 'block';
}
if (closeCatManager) {
  closeCatManager.onclick = () => catManagerPanel.style.display = 'none';
}

if (saveCatBtn) {
  saveCatBtn.onclick = async () => {
    const name = newCatInput.value.trim();
    if (!name) return;
    
    toggleLoading(true);
    try {
      await addDoc(collection(db, "categories"), { name: name });
      newCatInput.value = '';
      showToast("¡Categoría añadida!");
      
      // Automatic Notification
      sendGlobalNotification(
        "Nueva Colección",
        `¡Pau Boutique ha añadido la colección "${name}"! Ven a ver lo nuevo.`,
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
      );
      
      loadCategories();
    } catch (error) {
      showToast("Error: " + error.message, "error");
    } finally {
      toggleLoading(false);
    }
  };
}

// DOM Elements - Dashboard
const statTotalProducts = document.getElementById('stat-total-products');
const statCategories = document.getElementById('stat-categories');
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

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  });
});

/* --- Navigation --- */

function switchModule(moduleId) {
  modules.forEach(mod => mod.id === `mod-${moduleId}` ? mod.classList.add('active') : mod.classList.remove('active'));
  sidebarLinks.forEach(link => link.dataset.mod === moduleId ? link.classList.add('active') : link.classList.remove('active'));
  
  if (moduleId === 'config') {
    initConfigModule();
  }
  if (moduleId === 'notifications') {
    initNotificationsModule();
  }

  // Close sidebar on mobile after selection
  if (window.innerWidth <= 992) {
    sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }
}

// Sub-navigation for Config
const configNavBtns = document.querySelectorAll('.config-nav-btn');
const subModules = document.querySelectorAll('.sub-module');

configNavBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const subId = btn.dataset.sub;
    
    // Update buttons
    configNavBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update sub-modules
    subModules.forEach(mod => {
      if (mod.id === `sub-mod-${subId}`) {
        mod.classList.add('active');
      } else {
        mod.classList.remove('active');
      }
    });
  });
});

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
  if (config) {
    if (configAnnouncementInput) configAnnouncementInput.value = config.announcement || '';
    if (configAnnouncementPreview) configAnnouncementPreview.textContent = config.announcement || '';
    if (configAnnouncementActive) configAnnouncementActive.checked = config.announcementActive !== false;
  }
  loadTestimonialsAdmin();
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
    toggleLoading(true);
    
    const newAnnouncement = configAnnouncementInput.value.trim();
    const isActive = configAnnouncementActive.checked;
    
    if (!newAnnouncement) {
      showToast("El texto del anuncio no puede estar vacío", "error");
      toggleLoading(false);
      return;
    }

    try {
      const success = await updateConfig({ 
        announcement: newAnnouncement,
        announcementActive: isActive,
        updatedAt: new Date()
      });
      
      if (success) {
        showToast("¡Barra de anuncios actualizada con éxito!");
        if (configAnnouncementPreview) {
          configAnnouncementPreview.textContent = newAnnouncement;
        }
      } else {
        throw new Error("La base de datos rechazó la actualización");
      }
    } catch (error) {
      console.error("Error al actualizar configuración:", error);
      const errorMsg = error.message.includes("permission-denied") 
        ? "Error: No tienes permisos en Firebase para cambiar la configuración." 
        : "Error: " + error.message;
      showToast(errorMsg, "error");
    } finally {
      toggleLoading(false);
    }
  });
}

/* --- Testimonials Logic --- */

async function loadTestimonialsAdmin() {
  if (!testimonialsListAdmin) return;
  testimonialsListAdmin.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Cargando testimonios de la boutique...</p>';
  
  try {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    testimonialsListAdmin.innerHTML = '';

    if (querySnapshot.empty) {
      testimonialsListAdmin.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--color-warm-white); border: 1px dashed #ddd; border-radius: 4px;">
          <p style="color: #666; font-size: 0.85rem; margin-bottom: 1rem;">No hay testimonios en la base de datos.</p>
          <p style="color: #999; font-size: 0.75rem;">Haz clic en 'Migrar Iniciales' para cargar los comentarios de la web.</p>
        </div>
      `;
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const t = docSnap.data();
      const item = document.createElement('div');
      item.style.background = "#fff";
      item.style.padding = "2.5rem";
      item.style.borderRadius = "2px";
      item.style.border = "1px solid #f0f0f0";
      item.style.textAlign = "center";
      item.style.position = "relative";
      item.style.transition = "all 0.4s ease";
      
      item.innerHTML = `
        <div style="padding: 0 1rem;">
          <p style="margin: 0; font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-dark); line-height: 1.6; font-style: italic;">"${t.quote}"</p>
          <div style="margin-top: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="width: 30px; height: 1px; background: var(--admin-accent); opacity: 0.5;"></div>
            <span style="font-size: 0.75rem; color: var(--color-gray); text-transform: uppercase; font-family: var(--font-sans); letter-spacing: 0.2em; font-weight: 500;">— ${t.author}</span>
          </div>
        </div>
        <button class="btn-delete-t" data-id="${docSnap.id}" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #d9534f; cursor: pointer; padding: 5px; opacity: 0.4; transition: opacity 0.3s;" title="Eliminar">
          <i data-lucide="x" style="width: 16px;"></i>
        </button>
      `;

      item.onmouseenter = () => { if(item.querySelector('.btn-delete-t')) item.querySelector('.btn-delete-t').style.opacity = "1"; item.style.borderColor = "var(--admin-accent)"; };
      item.onmouseleave = () => { if(item.querySelector('.btn-delete-t')) item.querySelector('.btn-delete-t').style.opacity = "0.4"; item.style.borderColor = "#f0f0f0"; };

      testimonialsListAdmin.appendChild(item);
    });
    
    lucide.createIcons();

    // Listeners para eliminar
    document.querySelectorAll('.btn-delete-t').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("¿Eliminar este testimonio de la boutique?")) {
          toggleLoading(true);
          try {
            await deleteDoc(doc(db, "testimonials", btn.dataset.id));
            showToast("Testimonio eliminado");
            loadTestimonialsAdmin();
          } catch (error) {
            showToast("Error al eliminar: " + error.message, "error");
          } finally {
            toggleLoading(false);
          }
        }
      });
    });

  } catch (error) {
    console.error("Error Firestore Testimonios:", error);
    testimonialsListAdmin.innerHTML = '<p style="padding: 2rem; text-align: center; color: #d9534f;">Error al cargar datos.</p>';
  }
}

if (testimonialForm) {
  testimonialForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoading(true);

    const tAuthor = document.getElementById('t-author').value.trim();
    const tQuote = document.getElementById('t-quote').value.trim();

    try {
      await addDoc(collection(db, "testimonials"), {
        author: tAuthor,
        quote: tQuote,
        createdAt: new Date()
      });
      showToast("¡Nuevo testimonio publicado correctamente!");
      testimonialForm.reset();
      loadTestimonialsAdmin();
    } catch (error) {
      showToast("Error: " + error.message, "error");
    } finally {
      toggleLoading(false);
    }
  });
}

if (migrateTBtn) {
  migrateTBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    toggleLoading(true);
    const initialTestimonials = [
      {
        author: "María Fernanda R.",
        quote: "La calidad de cada prenda es excepcional. PAU Boutique es mi tienda favorita para encontrar piezas únicas que no encuentro en ningún otro lugar.",
        createdAt: new Date()
      },
      {
        author: "Carolina S.",
        quote: "Cada vez que necesito un look especial, confío en PAU. La atención personalizada y las colecciones son simplemente perfectas.",
        createdAt: new Date()
      },
      {
        author: "Valentina M.",
        quote: "Elegancia en cada detalle. Las telas, los cortes, los acabados... todo habla de un compromiso real con la moda de calidad.",
        createdAt: new Date()
      }
    ];

    try {
      for (const t of initialTestimonials) {
        await addDoc(collection(db, "testimonials"), t);
      }
      showToast("¡Testimonios migrados con éxito!");
      loadTestimonialsAdmin();
    } catch (error) {
      showToast("Error: " + error.message, "error");
    } finally {
      toggleLoading(false);
    }
  });
}

if (refreshTBtn) {
  refreshTBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loadTestimonialsAdmin();
  });
}

/* --- Dashboard Init --- */

async function initDashboard() {
  await loadInventory();
  await loadCategories();
}

/* --- Drag & Drop para el Dropzone --- */
if (dropzone) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }, false);
}

/* --- Cloudinary (Subida Nativa) --- */

if (imagesInput) {
  imagesInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
}

async function handleFiles(fileList) {
  const files = Array.from(fileList);
  if (files.length === 0) return;
  
  if (uploadedImages.length + files.length > 3) {
    showToast("Máximo 3 imágenes permitidas", "error");
    if (imagesInput) imagesInput.value = "";
    return;
  }

  uploadStatus.textContent = "Preparando imágenes...";
  
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    try {
      uploadStatus.textContent = `Subiendo: ${file.name}...`;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Error en la subida");
      }

      const result = await response.json();
      if (result.secure_url) {
        uploadedImages.push(result.secure_url);
        renderPreviews();
        showToast(`¡${file.name} lista!`, "success");
      }
    } catch (error) {
      console.error("Error al subir a Cloudinary:", error);
      showToast(`No se pudo subir ${file.name}.`, "error");
    }
  }

  uploadStatus.textContent = "";
  if (imagesInput) imagesInput.value = ""; 
}

function renderPreviews() {
  imagePreview.innerHTML = "";
  if (uploadedImages.length === 0) {
    imagePreview.innerHTML = '<p style="font-size: 0.8rem; color: #999;">No hay fotos seleccionadas</p>';
    return;
  }

  uploadedImages.forEach((url, index) => {
    const item = document.createElement('div');
    item.className = "preview-item";
    item.style.position = "relative";
    item.innerHTML = `
      <img src="${url}" alt="Preview ${index + 1}">
      <button type="button" class="remove-img" data-index="${index}">&times;</button>
    `;
    
    item.querySelector('.remove-img').onclick = (e) => {
      e.preventDefault();
      uploadedImages.splice(index, 1);
      renderPreviews();
    };
    
    imagePreview.appendChild(item);
  });
}

/* --- Firestore CRUD (Products) --- */

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (uploadedImages.length === 0) {
    if (!confirm("No has subido ninguna imagen. ¿Deseas crear el producto con una imagen por defecto?")) {
      return;
    }
  }

  toggleLoading(true);

  const productData = {
    name: document.getElementById('p-name').value.trim(),
    price: parseFloat(document.getElementById('p-price').value),
    description: document.getElementById('p-desc').value.trim(),
    category: document.getElementById('p-category').value,
    badge: document.getElementById('p-badge').value.trim(),
    images: uploadedImages.length > 0 ? uploadedImages : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'],
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "products"), productData);
    showToast("¡Pieza añadida con éxito a la boutique!");
    
    productForm.reset();
    uploadedImages = [];
    renderPreviews();
    
    await loadInventory();
    setTimeout(() => switchModule('inventory'), 500);
  } catch (error) {
    console.error("Error Firestore:", error);
    showToast("Error al guardar: " + error.message, 'error');
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
      const displayImage = p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';
      
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
    
    const categories = new Set();
    querySnapshot.forEach(docSnap => categories.add(docSnap.data().category));
    if (statCategories) statCategories.textContent = categories.size;

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

function toggleLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

if (migrateBtn) {
  migrateBtn.addEventListener('click', async () => {
    if (confirm("¿Migrar productos iniciales?")) {
      toggleLoading(true);
      try {
        for (const product of initialProducts) {
          const { id, image, ...data } = product;
          const productData = { ...data, images: [image], createdAt: new Date() };
          await addDoc(collection(db, "products"), productData);
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
/* --- Notifications Logic --- */

async function initNotificationsModule() {
  loadSubscribersCount();
  loadNotificationsHistory();
}

async function loadSubscribersCount() {
  if (!statSubscribers) return;
  try {
    const querySnapshot = await getDocs(collection(db, "fcm_tokens"));
    statSubscribers.textContent = querySnapshot.size;
  } catch (error) {
    console.error("Error al contar suscriptores:", error);
  }
}

async function loadNotificationsHistory() {
  if (!notifHistoryList) return;
  try {
    const q = query(collection(db, "notifications_history"), orderBy("sentAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      notifHistoryList.innerHTML = '<p style="text-align: center; color: #999; padding: 1rem;">No hay mensajes enviados recientemente.</p>';
      return;
    }

    notifHistoryList.innerHTML = '';
    statTotalNotifications.textContent = querySnapshot.size;

    querySnapshot.forEach(docSnap => {
      const n = docSnap.data();
      const div = document.createElement('div');
      div.style.padding = "15px";
      div.style.border = "1px solid #eee";
      div.style.borderRadius = "4px";
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      
      div.innerHTML = `
        <div style="text-align: left;">
          <p style="font-weight: 600; font-size: 0.9rem; margin: 0;">${n.title}</p>
          <p style="font-size: 0.8rem; color: #666; margin: 5px 0 0;">${n.body}</p>
          <span style="font-size: 0.65rem; color: #999;">${new Date(n.sentAt.toDate()).toLocaleString()}</span>
        </div>
        ${n.image ? `<img src="${n.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : ''}
      `;
      notifHistoryList.appendChild(div);
    });
  } catch (error) {
    console.error("Error al cargar historial:", error);
  }
}

async function sendGlobalNotification(title, body, image = "") {
  try {
    // 1. Guardar en el historial
    const notifData = {
      title,
      body,
      image,
      sentAt: new Date(),
      status: 'pending' // En un sistema real, un backend enviaría esto
    };
    await addDoc(collection(db, "notifications_history"), notifData);
    
    // 2. Simulación de envío PUSH (En un entorno real aquí se llamaría a una Cloud Function)
    // Para propósitos de demostración, mostramos un éxito.
    console.log(`Push Notification Triggered: ${title} - ${body}`);
    
    // Si estamos en el módulo de notificaciones, recargar
    loadNotificationsHistory();
    
    return true;
  } catch (error) {
    console.error("Error enviando notificación:", error);
    return false;
  }
}

if (notificationForm) {
  notificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoading(true);

    const title = document.getElementById('notif-title').value.trim();
    const body = document.getElementById('notif-body').value.trim();
    const image = document.getElementById('notif-image').value.trim();

    const success = await sendGlobalNotification(title, body, image);
    
    if (success) {
      showToast("¡Notificación enviada a la cola de envío!");
      notificationForm.reset();
      loadSubscribersCount();
    } else {
      showToast("Error al enviar la notificación", "error");
    }
    
    toggleLoading(false);
  });
}
