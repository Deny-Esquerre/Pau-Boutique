/* --- Authentication Logic for Main Site Modal --- */
import { auth } from '../firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export async function handleAdminLogin(email, password) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) errorEl.style.display = 'none';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Redirect to admin panel on success
    window.location.href = 'admin.html';
  } catch (error) {
    if (errorEl) {
      errorEl.textContent = "Error: Credenciales inválidas";
      errorEl.style.display = 'block';
    }
    console.error("Login Error:", error.message);
  }
}

/**
 * Abre el modal de login, pero si el usuario ya tiene sesión activa,
 * redirige directamente al dashboard de administrador.
 */
export function openLoginModal() {
  // Verificar si ya hay sesión activa
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Sesión activa → ir directo al panel
      window.location.href = 'admin.html';
    } else {
      // Sin sesión → mostrar modal de login
      const modal = document.getElementById('login-modal');
      const overlay = document.getElementById('overlay');
      if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('no-scroll');
      }
    }
  });
}

export function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  const overlay = document.getElementById('overlay');
  if (modal && overlay) {
    modal.classList.remove('active');
    // Only remove overlay if other drawers/modals aren't active
    if (!document.getElementById('cart-drawer').classList.contains('active')) {
      overlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }
  }
}

/* ------ Newsletter ------ */

/**
 * Muestra un toast de confirmación en pantalla.
 */
function showToast(message, type = 'success') {
  // Evitar duplicados
  const existing = document.getElementById('pau-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'pau-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: ${type === 'success' ? '#1a1a1a' : '#d9534f'};
    color: #fff;
    padding: 1rem 2rem;
    font-family: var(--font-sans, sans-serif);
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 2px;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.35s ease, transform 0.35s ease;
    pointer-events: none;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);

  // Animar entrada
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  // Auto-cerrar después de 4 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * Maneja el formulario del newsletter: guarda el email en Firestore
 * y muestra un mensaje de confirmación al usuario.
 */
export async function handleNewsletterSubscription(email) {
  if (!email || !email.includes('@')) {
    showToast('Por favor ingresa un correo válido.', 'error');
    return;
  }

  try {
    await addDoc(collection(db, 'newsletter_subscribers'), {
      email: email.toLowerCase().trim(),
      subscribedAt: serverTimestamp()
    });
    showToast('¡Bienvenida al mundo PAU! 🌸 Ya eres parte de nuestra comunidad.');
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    showToast('Ocurrió un error. Inténtalo de nuevo.', 'error');
  }
}
