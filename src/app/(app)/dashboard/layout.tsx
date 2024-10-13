"use client";
import { ReactNode, useState } from "react";
import styles from "./layout.module.scss";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <img className={styles.logo} src="/logo.svg" />
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
