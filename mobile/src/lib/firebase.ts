import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBHWld1vQcm_cnfYGmd3Nz0COppTheVtGw',
  authDomain: 'studio-3883937532-b7f00.firebaseapp.com',
  projectId: 'studio-3883937532-b7f00',
  storageBucket: 'studio-3883937532-b7f00.firebasestorage.app',
  messagingSenderId: '653581985755',
  appId: '1:653581985755:web:e57973f0b7a6f2436fe9fe',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const firestore = getFirestore(app);

export { app, auth, firestore };
