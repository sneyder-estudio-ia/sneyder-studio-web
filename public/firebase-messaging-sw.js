// Firebase Messaging Service Worker
// Este service worker maneja notificaciones push en segundo plano (background)

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Inicializar Firebase en el Service Worker con las credenciales del proyecto
firebase.initializeApp({
  apiKey: "AIzaSyDPzoG5vLSSZZfGoyeQtPf5jMGbAYHtRuk",
  authDomain: "sneyder-studio.firebaseapp.com",
  projectId: "sneyder-studio",
  storageBucket: "sneyder-studio.firebasestorage.app",
  messagingSenderId: "557509713837",
  appId: "1:557509713837:web:e3195edafe39c653058b24",
  measurementId: "G-1Y03M2RN79",
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano (app cerrada o minimizada)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Mensaje en segundo plano recibido:", payload);

  const notificationTitle = payload.notification?.title || "Sneyder Studio";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva notificación",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: payload.data?.tag || "sneyder-notification",
    data: payload.data || {},
    actions: [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Cerrar" },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en la notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarse en ella
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Si no hay ventana, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
