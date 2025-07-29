
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6p21ZsJclU2qaWn1xpvio53PyIlcki84",
  authDomain: "san3ly-10402.firebaseapp.com",
  projectId: "san3ly-10402",
  storageBucket: "san3ly-10402.firebasestorage.app",
  messagingSenderId: "1010447515179",
  appId: "1:1010447515179:web:d44c8f0df96c86c441b46e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
