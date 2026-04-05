import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCo4RIsapTYTAio7IMj-eCaFtUxpPUwbCI",
  authDomain: "casa-da-empada-7e07d.firebaseapp.com",
  projectId: "casa-da-empada-7e07d",
  storageBucket: "casa-da-empada-7e07d.firebasestorage.app",
  messagingSenderId: "698699143504",
  appId: "1:698699143504:web:b6963273f43404d7ef7455"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
