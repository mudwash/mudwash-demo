import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

export interface Garage {
  id?: string;
  name: string;
  image: string;
  distance: string;
  location?: string;
  rating?: number;
  createdAt?: any;
}

const COLLECTION_NAME = "garages";

export const getGarages = async () => {
  if (!db) return [];
  const col = collection(db, COLLECTION_NAME);
  const q = query(col);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Garage[];
};

export const createGarage = async (garage: Omit<Garage, "id" | "createdAt">) => {
  if (!db) return null;
  const col = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(col, {
    ...garage,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateGarage = async (id: string, garage: Partial<Garage>) => {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, garage);
};

export const deleteGarage = async (id: string) => {
  if (!db) return;
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
