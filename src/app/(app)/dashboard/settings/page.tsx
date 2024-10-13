"use client";
import { useAuth } from "@/app/context/Auth";
import styles from "./page.module.scss";
import { userTwoChars } from "@/app/util/format";
import { BiUser } from "react-icons/bi";

export default function Settings() {
  const { user, signOut } = useAuth();

  return (
    <div className={styles.layout}>
      <h1>Settings</h1>
      <div className={styles.meta}>
        <div className={styles.pfp}>
          {user!.displayName ? (
            userTwoChars(user!.displayName)
          ) : (
            <BiUser size={30} color="royalblue" />
          )}
        </div>
        <div className={styles.details}>
          <span className={styles.name}>
            {user!.displayName ? user!.displayName : "User (No Name)"}
          </span>
        </div>
      </div>
      <button className={styles.logout} onClick={signOut}>
        Log Out
      </button>
    </div>
  );
}
