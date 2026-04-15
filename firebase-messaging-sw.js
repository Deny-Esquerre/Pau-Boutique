// Import and configure the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA24Bo_g5ghQxjZjzoavJkzm0LL57zpJM8",
  authDomain: "pauboutique.firebaseapp.com",
  projectId: "pauboutique",
  storageBucket: "pauboutique.firebasestorage.app",
  messagingSenderId: "322088329733",
  appId: "1:322088329733:web:65256e7dad3fad574f726c"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/images/logo/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
