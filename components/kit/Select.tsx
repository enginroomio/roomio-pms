import type { ReactNode, SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  children: ReactNode;
};

export function Select({ className = '', children, ...props }: Props) {
  return (
    <select className={`roomio-select${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </select>
  );
}
