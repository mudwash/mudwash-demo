import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

export interface Addon {
  id?: string;
  name: string;
  price: string;
  description?: string;
  image?: string;
  active?: boolean;
  order?: number;
  icon?: string;
}

const COLLECTION_NAME = "addons";

export const getAddons = async (onlyActive = false) => {
  const colRef = collection(db, COLLECTION_NAME);
  let q = query(colRef);
  
  if (onlyActive) {
    q = query(colRef, where("active", "==", true));
  } else {
    q = query(colRef, orderBy("order", "asc"));
  }
  
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Addon[];

  if (onlyActive) {
    data.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  
  return data;
};

export const createAddon = async (addon: Omit<Addon, "id">) => {
  const colRef = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(colRef, {
    ...addon,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateAddon = async (id: string, addon: Partial<Addon>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, addon);
};

export const deleteAddon = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
