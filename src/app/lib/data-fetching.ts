'use server';

import { collection, getDocs, type CollectionReference, type DocumentData, type Firestore } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionServerError } from "@/firebase/server-errors";

/**
 * Fetches documents from a Firestore collection and provides detailed, contextual errors for permission issues.
 * This is intended for server-side one-time fetches.
 *
 * @param {Firestore} db The Firestore instance.
 * @param {string} collectionPath The path to the collection.
 * @returns {Promise<DocumentData[]>} A promise that resolves with an array of document data.
 * @throws {FirestorePermissionServerError} Throws a detailed error if the request is denied by security rules.
 */
export async function getDocsWithContextualError(db: Firestore, collectionPath: string): Promise<DocumentData[]> {
  const collectionRef = collection(db, collectionPath);
  try {
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    // Check if it's likely a permissions error
    if (error.code === 'permission-denied' || error.message.includes('permission-denied')) {
      const permissionError = new FirestorePermissionServerError({
        path: (collectionRef as CollectionReference).path,
        operation: 'list',
      });
      // On the server, we directly throw the error to be caught by Next.js error boundaries.
      // We don't use the client-side errorEmitter here.
      throw permissionError;
    }
    // Re-throw other types of errors
    throw error;
  }
}
