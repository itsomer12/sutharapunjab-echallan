import { cookies } from 'next/headers';
import { verifyToken } from './auth';

/** Returns an authenticated admin session, or null for an unauthenticated request. */
export function getAdminSession() {
  const token = cookies().get('token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  return payload?.role === 'ADMIN' ? payload : null;
}
