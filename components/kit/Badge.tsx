type Tone = 'neutral' | 'teal' | 'blue' | 'amber' | 'rose' | 'success' | 'danger';

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

const toneClass: Record<Tone, string> = {
  neutral: '',
  teal: ' roomio-badge--teal',
  blue: ' roomio-badge--blue',
  amber: ' roomio-badge--amber',
  rose: ' roomio-badge--rose',
  success: ' roomio-badge--success',
  danger: ' roomio-badge--danger',
};

export function Badge({ children, tone = 'neutral', className = '' }: Props) {
  return (
    <span className={`roomio-badge${toneClass[tone]}${className ? ` ${className}` : ''}`}>
      {children}
    </span>
  );
}
