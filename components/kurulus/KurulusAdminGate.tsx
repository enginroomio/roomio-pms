'use client';

import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useSession } from '@/components/auth/SessionProvider';
import { hasPermission } from '@/lib/auth/roles';

export function useKurulusAdmin(): boolean {
  const { user } = useSession();
  return hasPermission(user, 'settings.admin');
}

type KurulusFieldProps = {
  canAdmin: boolean;
  label: string;
  fieldClassName?: string;
};

export function KurulusFormInput({
  canAdmin,
  label,
  fieldClassName = 'roomio-field',
  disabled,
  className = 'roomio-input',
  ...props
}: KurulusFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={fieldClassName}>
      <span>{label}</span>
      <input className={className} {...props} disabled={!canAdmin || disabled} />
    </label>
  );
}

export function KurulusFormSelect({
  canAdmin,
  label,
  fieldClassName = 'roomio-field',
  disabled,
  className = 'roomio-input',
  children,
  ...props
}: KurulusFieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={fieldClassName}>
      <span>{label}</span>
      <select className={className} {...props} disabled={!canAdmin || disabled}>
        {children}
      </select>
    </label>
  );
}

export function KurulusFormCheckbox({
  canAdmin,
  label,
  fieldClassName = 'roomio-field roomio-field--checkbox',
  disabled,
  ...props
}: KurulusFieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <label className={fieldClassName}>
      <input type="checkbox" {...props} disabled={!canAdmin || disabled} />
      <span>{label}</span>
    </label>
  );
}

export function KurulusInlineInput({
  canAdmin,
  className = 'roomio-input',
  disabled,
  ...props
}: { canAdmin: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return <input className={className} {...props} disabled={!canAdmin || disabled} />;
}

export function KurulusAdminGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGate permission="settings.admin" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function KurulusEditButton({
  onClick,
  label = 'Düzenle',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <KurulusAdminGate fallback={<span className="roomio-page-desc">—</span>}>
      <button type="button" className="roomio-link-btn" onClick={onClick}>
        {label}
      </button>
    </KurulusAdminGate>
  );
}
