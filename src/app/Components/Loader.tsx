import styles from "./Loader.module.scss";

interface LoaderProps {
  width?: string | number;
  height?: string | number;
}

export const Loader = ({ width, height }: LoaderProps) => {
  return <div className={styles.loader} style={{ width, height }} />;
};
