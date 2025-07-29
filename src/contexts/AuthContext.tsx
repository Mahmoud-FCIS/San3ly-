
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { saveUserProfile, getUserProfile, updateUserProfile, UserProfile } from '@/services/userService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profileData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Admin email configuration
const ADMIN_EMAIL = 'ADMIN@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const login = async (email: string, password: string) => {
    console.log('Login attempt for:', email);
    
    // Check if this is the admin login
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === '123456') {
      console.log('Admin login detected');
      
      try {
        // Authenticate through Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('Admin authenticated successfully through Firebase Auth');
        
        // Create admin profile
        const adminProfile: UserProfile = {
          uid: user.uid,
          fullName: 'Administrator',
          email: user.email || '',
          accountType: 'admin',
          phone: '',
          bio: '',
          avatar: '',
          country: '',
          city: '',
          address: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setCurrentUser(user);
        setUserProfile(adminProfile);
        
        console.log('Admin login successful');
        return;
      } catch (error) {
        console.error('Admin Firebase authentication failed:', error);
        throw new Error('Invalid admin credentials');
      }
    }
    
    // Regular user login
    console.log('Regular user login attempt');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, profileData: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save user profile to Firestore
    const profile = await saveUserProfile(user, profileData);
    setUserProfile(profile);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No user logged in');
    
    await updateUserProfile(currentUser.uid, updates);
    
    // Update local state
    if (userProfile) {
      setUserProfile({ ...userProfile, ...updates });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) throw new Error('No user logged in');
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    
    // Update password
    await updatePassword(currentUser, newPassword);
  };

  const refreshUserProfile = async () => {
    if (currentUser && !isAdmin) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  const logout = async () => {
    console.log("Logging out...");
    await signOut(auth);
    setUserProfile(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      setCurrentUser(user);
      
      if (user) {
        // Check if this is admin user
        if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          console.log('Admin user detected in auth state change');
          const adminProfile: UserProfile = {
            uid: user.uid,
            fullName: 'Administrator',
            email: user.email,
            accountType: 'admin',
            phone: '',
            bio: '',
            avatar: '',
            country: '',
            city: '',
            address: '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setUserProfile(adminProfile);
        } else {
          // Load regular user profile from Firestore
          try {
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);
          } catch (error) {
            console.error('Error loading user profile:', error);
          }
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    loading,
    refreshUserProfile,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
