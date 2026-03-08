importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyDyMIjt5aSZov-09TUWuAi4eIC95JZL0cQ",
  authDomain: "samtek-vms-test.firebaseapp.com",
  projectId: "samtek-vms-test",
  messagingSenderId: "875177878168",
  appId: "1:875177878168:web:aab00f4daa93442dd3a6ed",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload,
  );
  const notificationTitle =
    payload.notification?.title || payload.data?.title || "SAMTEK VMS Alert";
  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "New vehicle crossing detected",
    icon: "/truck-icon.png",
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
