/* ===================================================
   ADMIN ORCHESTRATOR (Scalable Modular Version)
   =================================================== */

import { auth } from './firebase-config.js';
import { showToast } from './modules/utils.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

// Modules
import { initDashboard } from './modules/admin/dashboard.js';
import { initProducts } from './modules/admin/products.js';
import { loadInventory } from './modules/admin/inventory.js';
import { initConfig } from './modules/admin/config.js';
import { initNotifications } from './modules/admin/notifications.js';

// Cache for HTML modules
const cache = {};

// Permanent DOM Elements
const loginSection = document.getElementById('login-section');
const adminWrapper = document.getElementById('admin-wrapper');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mainContent = document.getElementById('main-content');

/* --- NAVIGATION SYSTEM --- */

async function switchModule(moduleId) {
  if (!mainContent) return;

  // Actualizar links de la sidebar
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.classList.toggle('active', link.dataset.mod === moduleId);
  });

  // Carga dinámica de HTML con caché
  if (!cache[moduleId]) {
    try {
      const response = await fetch(`./components/admin/${moduleId}.html`);
      if (!response.ok) throw new Error("Módulo no encontrado");
      cache[moduleId] = await response.text();
    } catch (error) {
      console.error(error);
      showToast("Error al cargar interfaz", "error");
      return;
    }
  }

  // Inyectar HTML
  mainContent.innerHTML = cache[moduleId];

  // IMPORTANTE: Asegurar que la sección inyectada tenga la clase 'active' para ser visible por CSS
  const injectedSection = mainContent.querySelector('.module-section');
  if (injectedSection) {
    injectedSection.classList.add('active');
  }

  // Inicializar lógica del módulo
  try {
    switch (moduleId) {
      case 'dashboard': await initDashboard(); break;
      case 'products': initProducts(); break;
      case 'inventory': await loadInventory(); break;
      case 'config': initConfig(); break;
      case 'notifications': await initNotifications(); break;
    }
    
    // Refresh Icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) { console.warn(`Error init module ${moduleId}:`, err); }

  // Cerrar sidebar en móvil
  if (window.innerWidth <= 992 && sidebar) {
    sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }
}

function initAdminNavigation() {
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      switchModule(link.dataset.mod);
    };
  });

  if (sidebarToggle) {
    sidebarToggle.onclick = () => {
      const active = sidebar.classList.toggle('active');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active', active);
    };
  }

  if (sidebarOverlay) {
    sidebarOverlay.onclick = () => {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    };
  }
}

/* --- AUTHENTICATION --- */

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginSection) loginSection.style.display = 'none';
    if (adminWrapper) adminWrapper.style.display = 'flex';
    initAdminNavigation();
    switchModule('dashboard');
  } else {
    window.location.href = 'index.html';
  }
});

if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    toggleLoading(true);
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      showToast("Bienvenida");
    } catch (error) { showToast(error.message, 'error'); } finally { toggleLoading(false); }
  };
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    signOut(auth).then(() => { window.location.href = 'index.html'; });
  };
}

function toggleLoading(show) { if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none'; }
