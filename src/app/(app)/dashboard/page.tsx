"use client";
import { useAuth } from "@/app/context/Auth";
import styles from "./page.module.scss";
import { useState } from "react";
import { RiBookFill } from "react-icons/ri";
import { BiWorld } from "react-icons/bi";

export default function Dashboard() {
  const [library, setLibrary] = useState<"mine" | "global">("mine");

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              library === "mine" ? styles.selected : undefined
            }`}
            onClick={() => setLibrary("mine")}
          >
            <RiBookFill />
            <span>My Library</span>
          </button>
          <button
            className={`${styles.tab} ${
              library === "global" ? styles.selected : undefined
            }`}
            onClick={() => setLibrary("global")}
          >
            <BiWorld />
            <span>All books</span>
          </button>
        </div>
      </aside>
      <div className={styles.content}></div>
    </div>
  );
}
