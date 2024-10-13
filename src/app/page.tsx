"use client";
import Link from "next/link";
import { useAuth } from "./context/Auth";
import styles from "./page.module.scss";
// import { useState } from "react";

// const SUBJECTS = [
//   "Math",
//   "Physics",
//   "Biology",
//   "Chemistry",
//   "Computer Science",
//   "History",
// ];

export default function Home() {
  // const [subject, setSubject] = useState<number>(0);
  const { user } = useAuth();

  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <img className={styles.logo} src="/logo.svg" />
        <div className={styles.buttonGroup}>
          {user ? (
            <Link href="/dashboard">
              <button className={styles.em}>Dashboard</button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button className={styles.em}>Login</button>
              </Link>
              <Link href="/register">
                <button>Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.tag}>
          <div className={styles.text}>
            <span className={styles.big}>Learn at the Speed of AI.</span>
            <p className={styles.description}>
              From a one second screenshot to detailed explanation, Overstand
              leverages state-of-the-art LLMs to contextualize textbooks and
              accelerate your learning.
            </p>
            {user ? (
              <Link className={styles.button} href="/dashboard">
                Dashboard
              </Link>
            ) : (
              <Link className={styles.button} href="/register">
                Sign Up
              </Link>
            )}
          </div>
          <div className={styles.visual}></div>
        </div>
      </div>
    </div>
  );
}
