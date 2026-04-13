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

  // Listener para mensajes en primer plano (cuando la web está abierta)
  onMessage(messaging, (payload) => {
    console.log('Mensaje en primer plano recibido: ', payload);
    const { title, body } = payload.notification;
    
    // Mostramos un toast o una alerta de Lucide
    if (window.showToast) {
       showToast(`${title}: ${body}`, "success");
    } else {
       alert(`${title}\n${body}`);
    }
  });

  // Listener de "Pseudo-Push": Detectar nuevos mensajes en Firestore en tiempo real
  // Esto permite ver notificaciones mientras la web está abierta sin configuraciones complejas de servidor.
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
        console.log("Nueva notificación detectada (Live):", data);
        showToast(`Pau Boutique: ${data.title}\n${data.body}`, "success");
      }
    });
  });
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
      // Opcional: Avisar al usuario una sola vez
      if (!localStorage.getItem('notif_subscribed')) {
        showToast("¡Gracias por suscribirte a nuestras novedades!", "success");
        localStorage.setItem('notif_subscribed', 'true');
      }
    } else {
      console.log('No se pudo obtener el token de registro. Verifica los permisos.');
    }
  } catch (error) {
    console.error('Error al guardar el token FCM en Firestore:', error);
  }
}
