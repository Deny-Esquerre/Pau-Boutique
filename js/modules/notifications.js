/* --- Web Push Notifications Module --- */
import { db, messaging, VAPID_KEY } from '../firebase-config.js';
import { getToken } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging.js";
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

/**
 * Requests permission and registers the FCM token
 */
export async function initNotifications() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones de escritorio.');
    return;
  }

  // Si ya tenemos permiso o el usuario aún no ha decidido
  if (Notification.permission === 'default' || Notification.permission === 'granted') {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await saveTokenToFirestore();
      }
    } catch (error) {
      console.error('Error al solicitar permiso de notificación:', error);
    }
  }
}

/**
 * Gets the FCM token and saves it to Firestore
 */
async function saveTokenToFirestore() {
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      // Usamos el token como ID del documento para evitar duplicados
      const tokenRef = doc(collection(db, "fcm_tokens"), currentToken);
      await setDoc(tokenRef, {
        token: currentToken,
        userAgent: navigator.userAgent,
        lastSeen: new Date(),
        active: true
      });
      console.log('Token de notificación registrado correctamente.');
    } else {
      console.log('No se pudo obtener el token de registro. Verifica los permisos.');
    }
  } catch (error) {
    console.error('Error al guardar el token FCM en Firestore:', error);
  }
}
