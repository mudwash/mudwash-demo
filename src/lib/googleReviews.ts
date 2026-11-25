import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

export const REVIEW_CATEGORIES = [
  "General",
  "Exterior Wash",
  "Interior Cleaning",
  "Full Detailing",
  "Ceramic Coating",
  "Paint Protection",
  "Enhancements",
  "Odor / Humidity",
  "Mobile Service",
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number] | string;

export interface GoogleReview {
  id?: string;
  name: string;
  text: string;
  rating: number;
  category: ReviewCategory;
  /** Optional free-form tags for finer segregation */
  tags?: string[];
  /** Relative time label as shown on Google, e.g. "4 weeks ago" */
  timeLabel?: string;
  /** Show on the public homepage Google Reviews strip */
  showOnWebsite?: boolean;
  active?: boolean;
  order?: number;
  createdAt?: Date | { seconds: number; nanoseconds: number };
  updatedAt?: Date | { seconds: number; nanoseconds: number };
}

const COLLECTION_NAME = "googleReviews";

/** Seed used when the collection is empty — matches current homepage reviews. */
export const SEED_REVIEWS: Omit<GoogleReview, "id">[] = [
  {
    name: "Jad Salman",
    text: "Great services, Mohammed Kashif and Seth owusu did a great job",
    rating: 5,
    category: "Full Detailing",
    tags: ["team"],
    timeLabel: "4 weeks ago",
    showOnWebsite: true,
    active: true,
    order: 1,
  },
  {
    name: "Артур Кешишян",
    text: "Clear and fast seth owusu and muhammad kashif",
    rating: 5,
    category: "Exterior Wash",
    tags: ["team", "fast"],
    timeLabel: "4 weeks ago",
    showOnWebsite: true,
    active: true,
    order: 2,
  },
  {
    name: "Dina Badran",
    text: "Had an excellent experience with Mudwash. My SUV had a strong humidity smell after being parked for over a month and they fixed it completely. Highly recommend!",
    rating: 5,
    category: "Odor / Humidity",
    tags: ["SUV", "odor"],
    timeLabel: "4 weeks ago",
    showOnWebsite: true,
    active: true,
    order: 3,
  },
  {
    name: "Mohamad Mourad",
    text: "Amazing work and service. The people here are absolute pros. Big thanks to Seth and Muhammad Kashif for the professionalism and attention to detail!!!",
    rating: 5,
    category: "Full Detailing",
    tags: ["team", "pros"],
    timeLabel: "4 weeks ago",
    showOnWebsite: true,
    active: true,
    order: 4,
  },
];

export function formatReviewForCustomer(review: GoogleReview): string {
  const stars = "★".repeat(Math.min(5, Math.max(1, review.rating || 5)));
  const categoryLine = review.category && review.category !== "General"
    ? `\nService: ${review.category}`
    : "";

  return `${stars} Google Review — Mudwash${categoryLine}

"${review.text}"

— ${review.name}
Verified Google Review`;
}

export function getReviewInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export const getGoogleReviews = async (opts?: {
  onlyActive?: boolean;
  onlyWebsite?: boolean;
  category?: string;
}) => {
  const colRef = collection(db, COLLECTION_NAME);
  // Client-side filters avoid composite indexes for active/website/category.
  const q = query(colRef, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  let data = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as GoogleReview[];

  if (opts?.onlyActive) {
    data = data.filter((r) => r.active !== false);
  }
  if (opts?.onlyWebsite) {
    data = data.filter((r) => r.showOnWebsite === true && r.active !== false);
  }
  if (opts?.category && opts.category !== "All") {
    data = data.filter((r) => r.category === opts.category);
  }

  data.sort((a, b) => (a.order || 0) - (b.order || 0));
  return data;
};

export const createGoogleReview = async (review: Omit<GoogleReview, "id">) => {
  const colRef = collection(db, COLLECTION_NAME);
  const now = new Date();
  const docRef = await addDoc(colRef, {
    ...review,
    rating: review.rating ?? 5,
    category: review.category || "General",
    tags: review.tags || [],
    showOnWebsite: review.showOnWebsite ?? false,
    active: review.active ?? true,
    order: review.order ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateGoogleReview = async (
  id: string,
  review: Partial<GoogleReview>
) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const { id: _id, ...rest } = review as GoogleReview;
  await updateDoc(docRef, {
    ...rest,
    updatedAt: new Date(),
  });
};

export const deleteGoogleReview = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

/** Seed the collection with starter reviews if it is empty. Returns count seeded. */
export const seedGoogleReviewsIfEmpty = async () => {
  const existing = await getGoogleReviews();
  if (existing.length > 0) return 0;

  let seeded = 0;
  for (const review of SEED_REVIEWS) {
    await createGoogleReview(review);
    seeded += 1;
  }
  return seeded;
};
