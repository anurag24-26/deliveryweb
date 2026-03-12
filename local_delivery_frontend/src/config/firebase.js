import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuqGsuv9Ifp_ShT1m2mNkmAGMaxOaDkq4",
  authDomain: "barhalganjfooddelivery.firebaseapp.com",
  projectId: "barhalganjfooddelivery",
  storageBucket: "barhalganjfooddelivery.firebasestorage.app",
  messagingSenderId: "779290499097",
  appId: "1:779290499097:web:7c518c3ecc3e303017f288",
  measurementId: "G-2KN2Q7RKS7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);  // ← this is the only line PhoneVerification.jsx needs
export default app;
 