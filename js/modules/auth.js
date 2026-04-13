/* --- Authentication Logic for Main Site Modal --- */
import { auth } from '../firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

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

export function openLoginModal() {
  const modal = document.getElementById('login-modal');
  const overlay = document.getElementById('overlay');
  if (modal && overlay) {
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('no-scroll');
  }
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
