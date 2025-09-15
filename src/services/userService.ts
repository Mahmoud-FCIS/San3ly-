import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  accountType: 'client' | 'manufacturer' | 'both' | 'admin';
  phone: string;
  bio: string;
  avatar: string;
  country: string;
  city: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  // Factory-specific fields
  factoryName?: string;
  specialization?: string;
  establishedYear?: number;
  employeeCount?: string;
  certifications?: string[];
  description?: string;

  // National ID images (base64)
  idFrontBase64?: string;
  idBackBase64?: string;
}

export const saveUserProfile = async (user: User, profileData: any): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  
  const profile: UserProfile = {
    uid: user.uid,
    fullName: profileData.fullName || '',
    email: user.email || '',
    accountType: profileData.accountType || 'client',
    phone: profileData.phone || '',
    bio: profileData.bio || '',
    avatar: profileData.avatar || '',
    country: profileData.country || '',
    city: profileData.city || '',
    address: profileData.address || '',
    createdAt: new Date(),
    updatedAt: new Date(),
    factoryName: profileData.factoryName || '',
    specialization: profileData.specialization || '',
    establishedYear: profileData.establishedYear || '',
    employeeCount: profileData.employeeCount || '',
    certifications: profileData.certifications || [],
    description: profileData.description || ''
  };

  await setDoc(userRef, profile);
  return profile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  } else {
    return null;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);
};
