"use client";
import Link from "next/link";
import { useAuth } from "./context/Auth";
import styles from "./page.module.scss";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SUBJECTS = [
  "Math",
  "Physics",
  "Biology",
  "Chemistry",
  "Computer Science",
  "History",
];

export default function Home() {
  const [subject, setSubject] = useState<number>(0);
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
          {/* <span>
            Learn <motion.span>{SUBJECTS[subject]}</motion.span> at the speed of
            AI.
          </span> */}
        </div>
      </div>
    </div>
  );
}
