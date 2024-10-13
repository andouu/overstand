import { app } from "../init";
import { getAuth } from "firebase/auth";

export const auth = getAuth(app);
