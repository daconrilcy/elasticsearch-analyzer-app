import styles from './Spinner.module.scss';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Spinner({ size = 'medium', className = '' }: SpinnerProps) {
  return (
    <div className={`${styles.spinner} ${styles[size]} ${className}`}>
      <div className={styles.spinnerInner}></div>
    </div>
  );
}

