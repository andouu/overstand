import { getFirestore } from "firebase/firestore";
import { app } from "../firebase/init";

export const db = getFirestore(app);
