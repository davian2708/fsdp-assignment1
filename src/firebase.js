import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_REAL_API_KEY",
  authDomain: "ai-agent-platform-grp28.firebaseapp.com",
  projectId: "ai-agent-platform-grp28",
  storageBucket: "ai-agent-platform-grp28.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };