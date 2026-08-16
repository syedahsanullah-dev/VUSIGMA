import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const JWT_SECRET = process.env.JWT_SECRET ;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] JWT_SECRET environment variable is not defined in production!');
}

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(req = null) {
  try {
    let token = null;

    // 1. Try to extract token from Request Authorization Header (Bearer token)
    if (req) {
      const authHeader = req.headers?.get?.('authorization') || req.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (req.cookies?.get) {
        token = req.cookies.get('token')?.value;
      }
    }

    // 2. Fallback to next/headers cookies if token not found from request
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    }

    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export default { JWT_SECRET, signToken, verifyToken, getAuthUser };
