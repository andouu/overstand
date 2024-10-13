"use client";
import { ReactNode } from "react";
import styles from "./layout.module.scss";
import { UnstyledLink } from "@/app/Components/UnstyledLink";
import { useSelectedLayoutSegment } from "next/navigation";
import { useAuth } from "@/app/context/Auth";
import { userTwoChars } from "@/app/util/format";
import { BiUser } from "react-icons/bi";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const segment = useSelectedLayoutSegment();

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
            <div className={styles.pfp}>
              {user!.displayName ? userTwoChars(user!.displayName) : <BiUser />}
            </div>
          </UnstyledLink>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
