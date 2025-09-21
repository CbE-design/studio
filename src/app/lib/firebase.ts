// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-3883937532-b7f00",
  "appId": "1:653581985755:web:e57973f0b7a6f2436fe9fe",
  "apiKey": "AIzaSyBHWld1vQcm_cnfYGmd3Nz0COppTheVtGw",
  "authDomain": "studio-3883937532-b7f00.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "653581985755"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
