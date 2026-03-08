import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const requestFCMToken = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM is not supported in this browser.");
      return null;
    }
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn(
          "Valid Firebase VAPID key not found in environment variables. Push notifications are disabled in this environment.",
        );
        return null;
      }
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
      });
      if (currentToken) {
        return currentToken;
      } else {
        console.warn(
          "No registration token available. Request permission to generate one.",
        );
        return null;
      }
    } else {
      console.warn("Notification permission completely denied.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
};

export const setupMessageListener = (callback: (payload: any) => void) => {
  isSupported().then((supported) => {
    if (supported) {
      const messaging = getMessaging(app);
      return onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });
  return () => {};
};

export { app };
