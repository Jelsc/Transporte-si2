// firebase-messaging-sw.js
// Este archivo debe estar en la carpeta public/

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con la del cliente)
const firebaseConfig = {
  apiKey: "",
  authDomain: "transporte-si2.firebaseapp.com",
  projectId: "transporte-si2",
  storageBucket: "transporte-si2.firebasestorage.app",
  messagingSenderId: "543273137943",
  appId: "",
  measurementId: "G-Q6B6L5R1V3"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancia de messaging
const messaging = firebase.messaging();

// Manejar mensajes en background
messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje en background recibido:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/movifleet.svg',
    badge: '/badge-72x72.png',
    tag: payload.data?.tipo || 'general',
    data: payload.data,
    requireInteraction: payload.data?.prioridad === 'critica',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notificación clickeada:', event.notification.data);
  
  event.notification.close();

  // Abrir o enfocar la aplicación
  const urlToOpen = new URL('/', self.location.origin).href;
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
  .then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});