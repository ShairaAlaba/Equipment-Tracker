import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAQ8lFVuCiMxbdLILWAvYtuhqBghn7FSKw",
  authDomain: "equipment-tracker-88d07.firebaseapp.com",
  projectId: "equipment-tracker-88d07",
  storageBucket: "equipment-tracker-88d07.firebasestorage.app",
  messagingSenderId: "11538762415",
  appId: "1:11538762415:web:93f7348b65ea16df1f225a"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)