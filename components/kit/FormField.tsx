import type { ReactNode } from 'react';

type Props = {
  label: string;
  htmlFor?: string;
  hint?: string;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

export function FormField({ label, htmlFor, hint, full, className = '', children }: Props) {
  return (
    <label
      className={`roomio-field${full ? ' roomio-field--full' : ''}${className ? ` ${className}` : ''}`}
      htmlFor={htmlFor}
    >
      <span>{label}</span>
      {children}
      {hint ? <small className="roomio-field-hint">{hint}</small> : null}
    </label>
  );
}
