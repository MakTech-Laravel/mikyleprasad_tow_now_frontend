/* eslint-disable no-undef */
// Replace with your Firebase config values from the Firebase Console (Web app).
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Dev web app config (match Firebase Console → Project settings → Your apps).
firebase.initializeApp({
  apiKey: 'AIzaSyAlh8KrDnyE-6m9DyqBQ-kFU3cdqey2mfQ',
  authDomain: 'mahfuz-ahemd-zisan.firebaseapp.com',
  projectId: 'mahfuz-ahemd-zisan',
  storageBucket: 'mahfuz-ahemd-zisan.firebasestorage.app',
  messagingSenderId: '409176007220',
  appId: '1:409176007220:web:b35e82fa26a63fc73ba061',
  measurementId: 'G-4Z800HK9WY',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'TowTrack';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
  };
  self.registration.showNotification(title, options);
});
