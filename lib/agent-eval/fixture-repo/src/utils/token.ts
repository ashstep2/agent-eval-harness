export function validateToken(token: string): string | null {
  if (!token.startsWith('Bearer ')) {
    return null;
  }
  const value = token.slice('Bearer '.length).trim();
  return value.length > 0 ? value : null;
}
