"use client";
import { ReactNode } from "react";
import styles from "./layout.module.scss";
import { UnstyledLink } from "@/app/Components/UnstyledLink";
import { useSelectedLayoutSegment } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  console.log(segment);

  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <UnstyledLink href="/">
          <img className={styles.logo} src="/logo.svg" />
        </UnstyledLink>
        <div className={styles.actionRow}>
          <UnstyledLink
            className={`${styles.library} ${
              segment === null ? styles.selected : undefined
            }`}
            href="/dashboard"
          >
            My Library
          </UnstyledLink>
          <UnstyledLink
            className={`${styles.library} ${
              segment === "global" ? styles.selected : undefined
            }`}
            href="/dashboard/global"
          >
            Global Library
          </UnstyledLink>
          <UnstyledLink href="/dashboard/settings">
            <div className={styles.pfp}>AZ</div>
          </UnstyledLink>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
