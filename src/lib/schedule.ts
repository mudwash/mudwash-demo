import { 
  collection, 
  doc,
  getDocs, 
  updateDoc, 
  query,
  orderBy,
  where
} from "firebase/firestore";
import { db } from "./firebase";

export interface ScheduleSettings {
  id?: string;
  timeSlots: string[];
  workingDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  blockedDates: string[]; // ISO date strings e.g. "2025-12-25"
  maxBookingsPerSlot: number;
}

const DOC_ID = "main";
const COLLECTION_NAME = "schedule";

const DEFAULT_SCHEDULE: ScheduleSettings = {
  timeSlots: [
    "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
    "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
    "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM",
    "10:00 PM"
  ],
  workingDays: [0, 1, 2, 3, 4, 5, 6], // All days
  blockedDates: [],
  maxBookingsPerSlot: 5
};

export const getSchedule = async (): Promise<ScheduleSettings> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    const { getDoc } = await import("firebase/firestore");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as ScheduleSettings;
    }
    return DEFAULT_SCHEDULE;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return DEFAULT_SCHEDULE;
  }
};

export const updateSchedule = async (settings: Partial<ScheduleSettings>) => {
  const docRef = doc(db, COLLECTION_NAME, DOC_ID);
  const { setDoc } = await import("firebase/firestore");
  await setDoc(docRef, settings, { merge: true });
};
