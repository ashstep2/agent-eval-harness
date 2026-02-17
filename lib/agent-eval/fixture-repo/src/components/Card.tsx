import { ReactNode } from 'react';
import { getColor, ThemeMode } from '../theme/tokens';

interface CardProps {
  children: ReactNode;
  mode?: ThemeMode;
}

export function Card({ children, mode = 'light' }: CardProps) {
  return (
    <div
      style={{
        background: getColor(mode, 'background'),
        color: getColor(mode, 'foreground'),
        border: `1px solid ${getColor(mode, 'border')}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}
