"use client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth } from "../util/firebase/auth/init";

type AuthContextType = {
  signInEmailPassword: (
    email: string,
    password: string
  ) => Promise<AuthResponse>;
  signUpEmailPassword: (
    email: string,
    password: string
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthResponse =
  | {
      success: true;
      error: "";
    }
  | { success: false; error: string };

export const useAuth = (): AuthContextType => {
  const value = useContext(AuthContext);
  if (!AuthContext || !value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return value;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signInEmailPassword = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    let res: AuthResponse = { success: true, error: "" };
    try {
      setIsLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      setUser(user);
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case "auth/invalid-email": {
          res = { success: false, error: "Invalid email" };
          break;
        }
        case "auth/invalid-credential": {
          res = { success: false, error: "Invalid email or password" };
          break;
        }
        default: {
          res = { success: false, error: "An unknown error occurred" };
          break;
        }
      }
    } finally {
      setIsLoading(false);
    }
    return res;
  };

  const signUpEmailPassword = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    let res: AuthResponse = { success: true, error: "" };
    try {
      setIsLoading(true);
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(user);
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case "auth/invalid-email": {
          res = { success: false, error: "Invalid email" };
          break;
        }
        case "auth/invalid-password": {
          res = { success: false, error: "Invalid password" };
          break;
        }
        case "auth/email-already-in-use": {
          res = { success: false, error: "Email already in use" };
          break;
        }
        default: {
          res = { success: false, error: "An unknown error occurred" };
          break;
        }
      }
    } finally {
      setIsLoading(false);
    }
    return res;
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log(user);
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signInEmailPassword,
        signUpEmailPassword,
        signOut,
        user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
