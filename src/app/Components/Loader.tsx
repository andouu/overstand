import styles from "./Loader.module.scss";

interface LoaderProps {
  width?: string | number;
  height?: string | number;
  color?: string;
  thickness?: string | number;
}

export const Loader = ({ width, height, color, thickness }: LoaderProps) => {
  return (
    <div
      className={styles.loader}
      style={{ width, height, borderTopColor: color, borderWidth: thickness }}
    />
  );
};
