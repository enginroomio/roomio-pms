import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
};

export function FormGrid({ children, columns = 1, className = '' }: Props) {
  const colsClass = columns === 2 ? ' roomio-form-grid--2' : '';
  return <div className={`roomio-form-grid${colsClass}${className ? ` ${className}` : ''}`}>{children}</div>;
}
