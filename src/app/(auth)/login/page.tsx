"use client";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { Loader } from "@/app/Components/Loader";
import { REGEX_EMAIL } from "@/app/util/Regex";
import Link from "next/link";
import { useAuth } from "@/app/context/Auth";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const validLength = password.length >= 6;
  const validEmail = REGEX_EMAIL.test(email);
  const canSignUp = validLength && validEmail;

  const [error, setError] = useState<string>("");
  useEffect(() => setError(""), [email, password]);

  const { signInEmailPassword, isLoading } = useAuth();
  const handleLogin = async () => {
    const { error } = await signInEmailPassword(email, password);
    setError(error);
  };

  return (
    <div className={styles.layout}>
      <div className={styles.left}>
        <div className={styles.form}>
          <span className={styles.heading}>Welcome Back!</span>
          <span className={styles.subheading}>
            Supercharge your productivity with AI, using Overstand.
          </span>
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
          />
          <div className={styles.inputWithSlot}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
            />
            <button
              className={styles.slot}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <FiEye strokeWidth={2.5} size={16} color="gray" />
              ) : (
                <FiEyeOff strokeWidth={2.5} size={16} color="gray" />
              )}
            </button>
          </div>
          <Link href="/register" className={styles.link}>
            Register for an account
          </Link>
          {error && (
            <span className={styles.error}>{error}There was an error</span>
          )}
          <button
            className={styles.submit}
            disabled={!canSignUp}
            onClick={handleLogin}
          >
            {isLoading ? <Loader /> : "Continue"}
          </button>
        </div>
      </div>
      <div className={styles.right}>
        <img className={styles.banner} src="/banner_login.png" />
      </div>
    </div>
  );
}
