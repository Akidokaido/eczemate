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
  apiKey: "AIzaSyCGSMjwn6cViUzy2oRAMPOtd8rNZwT2TIY",  // Make sure to add your actual API key here
  authDomain: "eczemate.firebaseapp.com",
  projectId: "eczemate",
  storageBucket: "eczemate.firebasestorage.app",
  messagingSenderId: "677677113696",
  appId: "1:677677113696:web:b91e096eb4218ac9687e05",
  measurementId: "G-F4J7N0KLMQ"
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