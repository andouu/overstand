import { Loader } from "./Loader";
import styles from "./LoadingPage.module.scss";

export const LoadingPage = () => {
  return (
    <div className={styles.wrapper}>
      <img className={styles.logo} src="/logo.svg" />
      <div className={styles.tag}>
        <Loader width="1.5rem" height="1.5rem" thickness="2px" color="gray" />
        Loading...
      </div>
    </div>
  );
};
