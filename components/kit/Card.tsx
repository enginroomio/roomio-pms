import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'rack';
  as?: 'div' | 'section' | 'article';
};

export function Card({ children, className = '', variant = 'default', as: Tag = 'div' }: Props) {
  const variantClass = variant === 'rack' ? ' roomio-card--rack' : '';
  return <Tag className={`roomio-card${variantClass}${className ? ` ${className}` : ''}`}>{children}</Tag>;
}
