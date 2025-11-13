import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "dummy",
  authDomain: "localhost",
  projectId: "ai-agent-platform-grp28",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "dummy",
  appId: "dummy"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
connectFirestoreEmulator(db, "localhost", 8080);

const storage = getStorage(app);
connectStorageEmulator(storage, "localhost", 9199);

export { db, storage };