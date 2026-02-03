import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export function waitForAuthReady() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}