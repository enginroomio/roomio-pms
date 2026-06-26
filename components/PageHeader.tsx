import type { ReactNode } from 'react';

type Props = {
  breadcrumb?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  stackClassName?: string;
  hideHeader?: boolean;
  children: ReactNode;
};

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  stackClassName,
  hideHeader,
  children,
}: Props) {
  return (
    <div className={`roomio-page-stack${stackClassName ? ` ${stackClassName}` : ''}`}>
      {hideHeader ? null : (
        <div className="roomio-page-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div>
            {breadcrumb ? <div className="roomio-breadcrumb">{breadcrumb}</div> : null}
            {title ? <h1 className="roomio-page-title">{title}</h1> : null}
            {description ? <p className="roomio-page-desc">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function ModulePlaceholder({
  breadcrumb,
  title,
  phase,
}: {
  breadcrumb: string;
  title: string;
  phase: string;
}) {
  return (
    <PageHeader breadcrumb={breadcrumb} title={title} description={`${phase} — yakında aktif olacak.`}>
      <div className="roomio-card roomio-placeholder">
        <span className="roomio-badge">{phase}</span>
        <p style={{ marginTop: 16 }}>Bu modül adım adım geliştiriliyor.</p>
      </div>
    </PageHeader>
  );
}
