export const colors = {
  light: {
    background: '#FFFFFF',
    foreground: '#0A0A0A',
    muted: '#6B6B6B',
    border: '#E0E0E0',
    accent: '#3B82F6',
  },
  dark: {
    background: '#0A0A0A',
    foreground: '#F5F5F5',
    muted: '#A3A3A3',
    border: '#2A2A2A',
    accent: '#60A5FA',
  },
};

export type ThemeMode = keyof typeof colors;

export function getColor(mode: ThemeMode, token: keyof typeof colors.light) {
  return colors[mode][token];
}
