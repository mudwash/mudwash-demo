import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "./firebase";

export interface Service {
  id?: string;
  name: string;
  price: string;
  duration: string;
  category: string;
  description: string;
  includedItems?: string[];
  vehiclePricing?: Record<string, string>;
  image: string;

  images?: string[];
  icon?: string;
  active: boolean;
  createdAt?: any;
  order?: number;
}

const COLLECTION_NAME = "services";

export const getServices = async (onlyActive = false) => {
  try {
    console.log("Attempting to fetch services from Firestore...", { onlyActive, collection: COLLECTION_NAME });
    const servicesCol = collection(db, COLLECTION_NAME);
    const q = onlyActive 
      ? query(servicesCol, where("active", "==", true))
      : servicesCol;
      
    const serviceSnapshot = await getDocs(q);
    console.log(`Successfully fetched ${serviceSnapshot.docs.length} services from Firestore.`);
    
    const serviceList = serviceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
    
    // Sort by order ascending, then by createdAt descending
    serviceList.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 9999;
      const orderB = b.order !== undefined ? b.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    return serviceList;
  } catch (error) {
    console.error("Error in getServices:", error);
    throw error;
  }
};

export const addService = async (service: Service) => {
  const servicesCol = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(servicesCol, {
    ...service,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  const serviceRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(serviceRef, updates);
};

export const deleteService = async (id: string) => {
  const serviceRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(serviceRef);
};
