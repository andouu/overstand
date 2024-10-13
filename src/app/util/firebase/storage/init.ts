import { getStorage } from "firebase/storage";
import { app } from "../init";

export const storage = getStorage(app);
