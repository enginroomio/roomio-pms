import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export function Input({ className = '', ...props }: InputProps) {
  return <input className={`roomio-input${className ? ` ${className}` : ''}`} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return <textarea className={`roomio-input${className ? ` ${className}` : ''}`} {...props} />;
}
