"use client";
import styles from "./page.module.scss";
import { useState } from "react";

export default function Dashboard() {
  const [library, setLibrary] = useState<"mine" | "global">("mine");

  return (
    <div className={styles.layout}>
      <h1>My Library</h1>
    </div>
  );
}
