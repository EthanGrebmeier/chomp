/**
 * Generates a random 8-character alphanumeric join code.
 * Uses a-z, A-Z, and 0-9 (case-sensitive).
 */
export const generateJoinCode = (): string => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

