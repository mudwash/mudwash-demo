import { 
  collection, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

export interface VehicleType {
  id?: string;
  name: string;
  surcharge: number;
  locationOverrides?: Record<string, number>;
  order: number;
  icon?: string;
}

const COLLECTION_NAME = "vehicleTypes";

export const getVehicleTypes = async () => {
  try {
    const col = collection(db, COLLECTION_NAME);
    const q = query(col, orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Seed defaults if empty
      return [
        { id: "sedan", name: "Sedan", surcharge: 0, order: 1 },
        { id: "suv", name: "SUV", surcharge: 100, order: 2 },
        { id: "van", name: "Van", surcharge: 150, order: 3 },
        { id: "adventure", name: "Adventure", surcharge: -100, order: 4 },
      ];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VehicleType[];
  } catch (error) {
    console.error("Error fetching vehicle types:", error);
    return [];
  }
};

export const updateVehicleType = async (id: string, data: Partial<VehicleType>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
};
