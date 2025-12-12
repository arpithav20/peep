import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyABrq_-fLAv0AzerBcm6Wrsba0jT3ofMBU",
  authDomain: "peep-51e7d.firebaseapp.com",
  projectId: "peep-51e7d",
  storageBucket: "peep-51e7d.firebasestorage.app",
  messagingSenderId: "41301416960",
  appId: "1:41301416960:web:470cab211324890d52cce5",
  measurementId: "G-P6RR8MYFRW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Enable offline persistence and handle connection issues
export const enableFirestoreNetwork = async () => {
  await enableNetwork(db);
  console.log('Firestore network enabled');
};

export const disableFirestoreNetwork = async () => {
  await disableNetwork(db);
  console.log('Firestore network disabled');
};

export default app;