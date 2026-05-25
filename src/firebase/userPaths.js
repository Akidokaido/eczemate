// src/firebase/userPaths.js
// Centralized helper for the role-based Firestore user structure:
//   users/patients/accounts/{uid}
//   users/doctors/accounts/{uid}
//   users/admins/accounts/{uid}

import { doc, collection, getDoc } from "firebase/firestore";
import { firestore } from "./config";

// Map singular role names → plural collection names
const ROLE_COLLECTIONS = {
  patient: "patients",
  doctor: "doctors",
  admin: "admins",
};

const ALL_ROLES = ["patient", "doctor", "admin"];

/**
 * Get the Firestore doc reference for a user by role and uid.
 * Path: users/{roleCollection}/accounts/{uid}
 */
export const getUserDocRef = (role, uid) => {
  const col = ROLE_COLLECTIONS[role];
  if (!col) throw new Error(`Unknown role: ${role}`);
  return doc(firestore, "users", col, "accounts", uid);
};

/**
 * Get the Firestore collection reference for all users of a given role.
 * Path: users/{roleCollection}/accounts
 */
export const getUserCollectionRef = (role) => {
  const col = ROLE_COLLECTIONS[role];
  if (!col) throw new Error(`Unknown role: ${role}`);
  return collection(firestore, "users", col, "accounts");
};

/**
 * Find a user across all role subcollections by UID.
 * Returns { data, role } or null if not found.
 * Runs all role lookups in parallel for faster login.
 * Gracefully handles permission errors for individual subcollections.
 */
export const findUserByUid = async (uid) => {
  const results = await Promise.all(
    ALL_ROLES.map(async (role) => {
      try {
        const ref = getUserDocRef(role, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          return { data: snap.data(), role };
        }
      } catch (err) {
        // Log full error so permission denials are visible in console
        console.warn(`Could not check ${role} subcollection:`, err.code, err.message);
      }
      return null;
    })
  );

  // Return the first non-null result
  return results.find((r) => r !== null) ?? null;
};

export { ROLE_COLLECTIONS, ALL_ROLES };
