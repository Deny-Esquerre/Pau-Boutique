/* --- Authentication & Session --- */

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Admin autenticado:", user.email);
    if (loginSection) loginSection.style.display = 'none';
    if (adminWrapper) adminWrapper.style.display = 'flex';
    
    // Inicializar navegación y datos
    initAdminNavigation();
    initDashboard();
  } else {
    // Si no hay sesión, volver al inicio
    window.location.href = 'index.html';
  }
});

if (loginForm) {
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
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      window.location.href = 'index.html';
    });
  });
}

/* --- Navigation --- */

function switchModule(moduleId) {
  console.log("Cambiando a módulo:", moduleId);
  
  const allModules = document.querySelectorAll('.module-section');
  const allLinks = document.querySelectorAll('.sidebar__link');

  allModules.forEach(mod => {
    if (mod.id === `mod-${moduleId}`) {
      mod.classList.add('active');
      mod.style.display = 'block'; 
    } else {
      mod.classList.remove('active');
      mod.style.display = 'none';
    }
  });

  allLinks.forEach(link => {
    if (link.dataset.mod === moduleId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  try {
    if (moduleId === 'config') {
      initConfigNavigation();
      initConfigModule();
    }
    if (moduleId === 'notifications') {
      initNotificationsModule();
    }
    if (moduleId === 'inventory') {
      loadInventory();
    }
  } catch (err) {
    console.warn("Error en submódulo:", moduleId, err);
  }

  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (window.innerWidth <= 992 && sidebar) {
    sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  }
}

function initAdminNavigation() {
  const links = document.querySelectorAll('.sidebar__link');
  const toggle = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  const sidebar = document.querySelector('.sidebar');

  links.forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      switchModule(link.dataset.mod);
    };
  });

  if (toggle && sidebar) {
    toggle.onclick = () => {
      const active = sidebar.classList.toggle('active');
      if (overlay) {
        if (active) overlay.classList.add('active');
        else overlay.classList.remove('active');
      }
    };
  }

  if (overlay) {
    overlay.onclick = () => {
      if (sidebar) sidebar.classList.remove('active');
      overlay.classList.remove('active');
    };
  }
  
  // Módulo inicial
  switchModule('dashboard');
}

function initConfigNavigation() {
  const configNavBtns = document.querySelectorAll('.config-nav-btn');
  const subModules = document.querySelectorAll('.sub-module');

  if (configNavBtns.length === 0) return;

  configNavBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const subId = btn.getAttribute('data-sub');
      
      configNavBtns.forEach(b => b.classList.remove('active'));

      subModules.forEach(m => {
        m.classList.remove('active');
        m.style.setProperty('display', 'none', 'important');
      });

      btn.classList.add('active');

      const targetMod = document.getElementById(`sub-mod-${subId}`);
      if (targetMod) {
        targetMod.classList.add('active');
        targetMod.style.setProperty('display', 'block', 'important');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    };
  });
}

const quickLinks = document.querySelectorAll('.quick-link');
quickLinks.forEach(btn => {
  btn.onclick = () => switchModule(btn.dataset.mod);
});