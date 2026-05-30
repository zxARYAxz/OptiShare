import { customAlphabet } from "nanoid";

/** Short, URL-safe IDs like xH7b2Kp9 */
const generateId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8
);

export function createShareId(): string {
  return generateId();
}

export function createSessionId(): string {
  return `sess_${generateId()}${generateId()}`;
}
