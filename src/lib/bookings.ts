import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  query,
  where 
} from "firebase/firestore";
import { db } from "./firebase";

export interface Booking {
  id?: string;
  customerName: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  location: string;
  amount: string;
  status: "Pending" | "Completed" | "Cancelled";
  createdAt?: any;
}

export const COLLECTION_NAME = "bookings";

export const getBookings = async () => {
  const bookingsCol = collection(db, COLLECTION_NAME);
  const q = query(bookingsCol, orderBy("createdAt", "desc"));
  const bookingSnapshot = await getDocs(q);
  return bookingSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[];
};

export const getUserBookings = async (email: string) => {
  const bookingsCol = collection(db, COLLECTION_NAME);
  // Remove orderBy to avoid requiring a composite index
  const q = query(bookingsCol, where("email", "==", email));
  const bookingSnapshot = await getDocs(q);
  const bookings = bookingSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Booking[];
  
  // Sort in memory by createdAt descending
  return bookings.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

export const createBooking = async (booking: Omit<Booking, "id" | "createdAt">) => {
  const bookingsCol = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(bookingsCol, {
    ...booking,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateBookingStatus = async (id: string, status: Booking["status"]) => {
  const bookingRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(bookingRef, { status });
};

export const deleteBooking = async (id: string) => {
  const { deleteDoc } = await import("firebase/firestore");
  const bookingRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(bookingRef);
};


