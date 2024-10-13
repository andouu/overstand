"use client";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { Loader } from "@/app/Components/Loader";
import { REGEX_EMAIL } from "@/app/util/Regex";
import Link from "next/link";
import { useAuth } from "@/app/context/Auth";
import { UnstyledLink } from "@/app/Components/UnstyledLink";

export default function Register() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const validLength = password.length >= 6 || true;
  const validEmail = REGEX_EMAIL.test(email);
  const canSignUp = validLength && validEmail;

  const [error, setError] = useState<string>("");
  useEffect(() => setError(""), [email, password]);

  const { signUpEmailPassword, isLoading } = useAuth();
  const handleRegister = async () => {
    const { error } = await signUpEmailPassword(email, password);
    setError(error);
  };

  return (
    <div className={styles.layout}>
      <div className={styles.left}>
        <UnstyledLink className={styles.logo} href="/">
          <img src="/logo.svg" />
        </UnstyledLink>
        <div className={styles.form}>
          <span className={styles.heading}>Sign Up</span>
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
          <Link href="/login" className={styles.link}>
            I already have an account
          </Link>
          {error && <span className={styles.error}>{error}</span>}
          <button
            className={styles.submit}
            disabled={!canSignUp}
            onClick={handleRegister}
          >
            {isLoading ? <Loader /> : "Continue"}
          </button>
        </div>
      </div>
      <div className={styles.right}>
        <img className={styles.banner} src="/banner_register.png" />
      </div>
    </div>
  );
}
