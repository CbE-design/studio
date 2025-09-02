// Import the functions you need from the SDKs you need
import { initializeApp }from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "van-schalkwyk-trust-mobile",
  "appId": "1:853116909297:web:3f219f7baf9f45668e9b50",
  "storageBucket": "van-schalkwyk-trust-mobile.firebasestorage.app",
  "apiKey": "AIzaSyClK8KfevXUzXNf7Tpfp6es8e-BRc5feG0",
  "authDomain": "van-schalkwyk-trust-mobile.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "853116909297"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };
