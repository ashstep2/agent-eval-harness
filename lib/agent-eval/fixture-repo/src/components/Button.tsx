import { ReactNode } from 'react';
import { getColor, ThemeMode } from '../theme/tokens';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  mode?: ThemeMode;
}

export function Button({ children, variant = 'primary', mode = 'light' }: ButtonProps) {
  const background =
    variant === 'primary' ? getColor(mode, 'foreground') : 'transparent';
  const color =
    variant === 'primary' ? getColor(mode, 'background') : getColor(mode, 'foreground');

  return (
    <button
      style={{
        background,
        color,
        border: `1px solid ${getColor(mode, 'border')}`,
        padding: '8px 16px',
        borderRadius: 999,
      }}
    >
      {children}
    </button>
  );
}
