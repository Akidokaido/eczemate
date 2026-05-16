// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth"; // Correct modular imports

import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore"; // Modular Firestore functions

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebasse Authentication
const firestore = getFirestore(app); // Initialize Firestore (Renamed to `db` for consistency with your imports)
const db = firestore; // Alias for Firestore to match your imports
 

// Export the necessary functions and services
export { 
  db,
  auth, 
  getAuth,
  firestore, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  collection, 
  signOut,
  onAuthStateChanged,
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp


};