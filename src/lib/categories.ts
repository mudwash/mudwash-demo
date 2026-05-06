import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "./firebase";

export interface Category {
  id?: string;
  name: string;
  icon: string;
  badge?: string | null;
  order: number;
}

const COLLECTION_NAME = "categories";

export const getCategories = async () => {
  try {
    const col = collection(db, COLLECTION_NAME);
    const q = query(col, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Return defaults if none in DB
      return [
        { id: "Exterior Wash", name: "Exterior Wash", icon: "Waves", order: 1 },
        { id: "Interior Cleaning", name: "Interior Cleaning", icon: "Sparkles", badge: "30% OFF", order: 2 },
        { id: "Full Detailing", name: "Full Detailing", icon: "Car", order: 3 },
        { id: "Ceramic Coating", name: "Ceramic Coating", icon: "ShieldCheck", order: 4 },
        { id: "Paint Protection", name: "Paint Protection", icon: "Paintbrush", order: 5 },
        { id: "Enhancements", name: "Enhancements", icon: "Zap", badge: "POPULAR", order: 6 },
      ];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const addCategory = async (category: Omit<Category, "id">) => {
  const col = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(col, category);
  return docRef.id;
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
};
