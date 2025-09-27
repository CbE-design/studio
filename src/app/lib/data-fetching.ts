'use server';

import { db } from './firebase-admin';
import type { DocumentData } from 'firebase-admin/firestore';

/**
 * Fetches documents from a Firestore collection using the Admin SDK.
 * This is intended for server-side one-time fetches.
 *
 * @param {Firestore} db The Firestore Admin instance.
 * @param {string} collectionPath The path to the collection.
 * @returns {Promise<DocumentData[]>} A promise that resolves with an array of document data.
 * @throws Throws an error if the fetch fails for any reason.
 */
export async function getDocsFromServer(
  db: FirebaseFirestore.Firestore,
  collectionPath: string
): Promise<DocumentData[]> {
  try {
    const querySnapshot = await db.collection(collectionPath).get();
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.error(`Error fetching collection from ${collectionPath}:`, error);
    // Re-throw the original error to be handled by the caller
    throw error;
  }
}
