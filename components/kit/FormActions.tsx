import type { ReactNode } from 'react';

type Props = {
  className?: string;
  children: ReactNode;
};

export function FormActions({ className = '', children }: Props) {
  return <div className={`roomio-form-actions${className ? ` ${className}` : ''}`}>{children}</div>;
}
