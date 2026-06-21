import type { ReactNode } from 'react';
import { Card } from './Card';

type Props = {
  title?: string;
  description?: string;
  className?: string;
  children: ReactNode;
};

export function FormSection({ title, description, className = '', children }: Props) {
  return (
    <Card className={`roomio-form${className ? ` ${className}` : ''}`}>
      {title ? <h2 className="roomio-card-title">{title}</h2> : null}
      {description ? <p className="roomio-page-desc">{description}</p> : null}
      {children}
    </Card>
  );
}
