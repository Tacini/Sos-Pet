import React from 'react';
import styles from './ui.module.css';

/* ── Button ─────────────────────────────────────────────────────────────────── */
export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, className = '', ...props
}) {
  return (
    <button
      className={`${styles.btn} ${styles[`btn-${variant}`]} ${styles[`btn-${size}`]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" color="inherit" /> : children}
    </button>
  );
}

/* ── Input ──────────────────────────────────────────────────────────────────── */
export const Input = React.forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        ref={ref}
        className={`${styles.input} ${error ? styles.inputError : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
});

/* ── Textarea ───────────────────────────────────────────────────────────────── */
export const Textarea = React.forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea
        ref={ref}
        className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
});

/* ── Select ─────────────────────────────────────────────────────────────────── */
export const Select = React.forwardRef(function Select({ label, error, children, className = '', ...props }, ref) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        ref={ref}
        className={`${styles.input} ${styles.select} ${error ? styles.inputError : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
});

/* ── Badge ──────────────────────────────────────────────────────────────────── */
export function Badge({ children, variant = 'default' }) {
  return <span className={`${styles.badge} ${styles[`badge-${variant}`]}`}>{children}</span>;
}

/* ── Spinner ────────────────────────────────────────────────────────────────── */
export function Spinner({ size = 'md', color }) {
  return (
    <span
      className={`${styles.spinner} ${styles[`spinner-${size}`]}`}
      style={color ? { borderTopColor: color } : undefined}
    />
  );
}

/* ── Card ───────────────────────────────────────────────────────────────────── */
export function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.cardClickable : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ── Empty State ────────────────────────────────────────────────────────────── */
export function Empty({ icon, title, description }) {
  return (
    <div className={styles.empty}>
      {icon && <span className={styles.emptyIcon}>{icon}</span>}
      <p className={styles.emptyTitle}>{title}</p>
      {description && <p className={styles.emptyDesc}>{description}</p>}
    </div>
  );
}
