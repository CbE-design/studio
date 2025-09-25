'use server';

import { collection, getDocs, type CollectionReference, type DocumentData, type Firestore } from "firebase/firestore";

/**
 * Fetches documents from a Firestore collection.
 * This is intended for server-side one-time fetches.
 * NOTE: This basic version does not include detailed error handling for permissions.
 *
 * @param {Firestore} db The Firestore instance.
 * @param {string} collectionPath The path to the collection.
 * @returns {Promise<DocumentData[]>} A promise that resolves with an array of document data.
 * @throws Throws an error if the fetch fails for any reason.
 */
export async function getDocsFromServer(db: Firestore, collectionPath: string): Promise<DocumentData[]> {
  const collectionRef = collection(db, collectionPath);
  try {
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.error(`Error fetching collection from ${collectionPath}:`, error);
    // Re-throw the original error to be handled by the caller
    throw error;
  }
}
