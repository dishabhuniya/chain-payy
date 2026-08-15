import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let db: any = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  } catch (e) {
    console.warn('Firebase initialization failed, falling back to local storage:', e);
  }
}

// Local Storage Fallback Implementation
const localDb = {
  get: (collectionName: string, id: string) => {
    const data = localStorage.getItem(`${collectionName}_${id}`);
    return data ? JSON.parse(data) : null;
  },
  set: (collectionName: string, id: string, value: any) => {
    const item = { id, ...value };
    localStorage.setItem(`${collectionName}_${id}`, JSON.stringify(item));
    
    // Update collection list
    const listKey = `${collectionName}_list`;
    const list = localDb.list(collectionName);
    const index = list.findIndex((item: any) => item.id === id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem(listKey, JSON.stringify(list));
  },
  list: (collectionName: string) => {
    const listKey = `${collectionName}_list`;
    const data = localStorage.getItem(listKey);
    return data ? JSON.parse(data) : [];
  },
  add: (collectionName: string, value: any) => {
    const id = Math.random().toString(36).substring(2, 11);
    localDb.set(collectionName, id, value);
    return id;
  }
};

// Interface definitions
export interface UserProfile {
  address: string;
  name: string;
  avatar: string;
  bio: string;
  createdAt: number;
}

export interface LoanMetadata {
  loanId: string; // On-chain loan ID (stringified)
  title: string;
  description: string;
  category: string;
  reason: string;
  borrowerAddress: string;
  createdAt: number;
}

export interface FeedbackData {
  address: string;
  feedbackText: string;
  rating: number;
  createdAt: number;
}

// Service Methods
export const firebaseService = {
  async getUserProfile(address: string): Promise<UserProfile | null> {
    if (db) {
      const docRef = doc(db, 'profiles', address);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } else {
      return localDb.get('profiles', address);
    }
  },

  async updateUserProfile(address: string, profile: Partial<UserProfile>): Promise<void> {
    const defaultProfile: UserProfile = {
      address,
      name: profile.name || `User ${address.substring(0, 6)}`,
      avatar: profile.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      bio: profile.bio || '',
      createdAt: Date.now(),
    };

    if (db) {
      const docRef = doc(db, 'profiles', address);
      const docSnap = await getDoc(docRef);
      const existing = docSnap.exists() ? docSnap.data() : {};
      await setDoc(docRef, { ...defaultProfile, ...existing, ...profile });
    } else {
      const existing = localDb.get('profiles', address) || {};
      localDb.set('profiles', address, { ...defaultProfile, ...existing, ...profile });
    }
  },

  async getLoanMetadata(loanId: string): Promise<LoanMetadata | null> {
    if (db) {
      const docRef = doc(db, 'loans', loanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as LoanMetadata;
      }
      return null;
    } else {
      return localDb.get('loans', loanId);
    }
  },

  async saveLoanMetadata(loanId: string, metadata: Omit<LoanMetadata, 'createdAt'>): Promise<void> {
    const fullMetadata: LoanMetadata = {
      ...metadata,
      loanId,
      createdAt: Date.now(),
    };

    if (db) {
      const docRef = doc(db, 'loans', loanId);
      await setDoc(docRef, fullMetadata);
    } else {
      localDb.set('loans', loanId, fullMetadata);
    }
  },

  async getAllLoansMetadata(): Promise<Record<string, LoanMetadata>> {
    const result: Record<string, LoanMetadata> = {};
    if (db) {
      const querySnapshot = await getDocs(collection(db, 'loans'));
      querySnapshot.forEach((doc) => {
        result[doc.id] = doc.data() as LoanMetadata;
      });
    } else {
      const list = localDb.list('loans');
      list.forEach((item: any) => {
        result[item.id] = item as LoanMetadata;
      });
    }
    return result;
  },

  async submitFeedback(address: string, feedbackText: string, rating: number): Promise<void> {
    const data: FeedbackData = {
      address,
      feedbackText,
      rating,
      createdAt: Date.now(),
    };

    if (db) {
      await addDoc(collection(db, 'feedback'), data);
    } else {
      localDb.add('feedback', data);
    }
  },
};
