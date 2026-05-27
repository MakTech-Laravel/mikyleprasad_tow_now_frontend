// Disabled — see docs/FIREBASE_DISABLE_AND_RESTORE.md
// FIREBASE-DISABLED: restore full script from that doc (section "Service worker file").

// /* eslint-disable no-undef */
// importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');
//
// firebase.initializeApp({
//   apiKey: '...',
//   authDomain: 'mahfuz-ahemd-zisan.firebaseapp.com',
//   projectId: 'mahfuz-ahemd-zisan',
//   storageBucket: 'mahfuz-ahemd-zisan.firebasestorage.app',
//   messagingSenderId: '409176007220',
//   appId: '1:409176007220:web:b35e82fa26a63fc73ba061',
//   measurementId: 'G-4Z800HK9WY',
// });
//
// const messaging = firebase.messaging();
//
// messaging.onBackgroundMessage((payload) => {
//   const title = payload.notification?.title || 'TowTrack';
//   const options = {
//     body: payload.notification?.body || '',
//     icon: '/icons/icon-192.png',
//     badge: '/icons/badge-72.png',
//   };
//   self.registration.showNotification(title, options);
// });
