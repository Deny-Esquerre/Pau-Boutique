import { db, messaging, VAPID_KEY } from '../firebase-config.js';
import { getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging.js";
import { collection, doc, setDoc, query, orderBy, limit, onSnapshot, where, Timestamp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { showToast } from './utils.js';

/**
 * Requests permission and registers the FCM token
 */
export async function initNotifications() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones de escritorio.');
    return;
  }

  // Listener para el formulario de Newsletter
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput ? emailInput.value : '';
      const parentContainer = newsletterForm.parentElement;

      showToast("Procesando suscripción...", "warning");

      try {
        // 1. Pedir permiso para notificaciones push
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Registrar Service Worker
          const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
          await saveTokenToFirestore(registration, email);
          
          // Mostrar mensaje de éxito en pantalla
          if (parentContainer) {
            parentContainer.innerHTML = `
              <div class="newsletter__success" style="animation: fadeIn 0.5s ease; padding: 20px;">
                <i data-lucide="check-circle" style="width: 40px; height: 40px; color: var(--color-accent); margin-bottom: 15px;"></i>
                <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 10px;">¡Bienvenida al Mundo PAU!</h3>
                <p style="font-size: 0.9rem; color: var(--color-gray);">Te has suscrito con éxito. Pronto recibirás nuestras novedades directamente en tu navegador.</p>
              </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
          
          showToast("¡Suscrita con éxito!", "success");
        } else {
          // Si no dio permiso Push, al menos confirmar la suscripción por email en pantalla
          if (parentContainer) {
            parentContainer.innerHTML = `
              <div class="newsletter__success" style="animation: fadeIn 0.5s ease; padding: 20px;">
                <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 10px;">¡Gracias por suscribirte!</h3>
                <p style="font-size: 0.9rem; color: var(--color-gray);">Te enviaremos novedades a <strong>${email}</strong>.</p>
              </div>
            `;
          }
          showToast("Suscrita por email.", "success");
        }
      } catch (error) {
        console.error('Error en suscripción:', error);
        showToast("Error al suscribirse: " + error.message, "error");
      }
    });
  }

  // Listener para mensajes en primer plano (cuando la web está abierta)
  onMessage(messaging, (payload) => {
    console.log('Mensaje en primer plano recibido: ', payload);
    const { title, body } = payload.notification;
    showToast(`${title}: ${body}`, "success");
  });

  // Listener de "Pseudo-Push" en tiempo real vía Firestore
  const now = new Date();
  const q = query(
    collection(db, "notifications_history"),
    where("sentAt", ">", Timestamp.fromDate(now)),
    orderBy("sentAt", "desc"),
    limit(1)
  );

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        showToast(`PAU: ${data.title}\n${data.body}`, "success");
      }
    });
  });
}

/**
 * Gets the FCM token and saves it to Firestore
 */
async function saveTokenToFirestore(registration, email = "") {
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      const tokenRef = doc(db, "fcm_tokens", currentToken);
      await setDoc(tokenRef, {
        token: currentToken,
        email: email, // Asociamos el email al token
        userAgent: navigator.userAgent,
        createdAt: new Date(),
        active: true
      });
      localStorage.setItem('notif_subscribed', 'true');
    }
  } catch (error) {
    console.error('Error al guardar token:', error);
  }
}
