import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Setting from '@/models/Setting';
import { JWT_SECRET } from '@/lib/auth';

const JWT_EXPIRES_IN = '7d';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, email, password, name, role, requiredRole } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === 'register' || name) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return NextResponse.json({ error: 'Registration failed. User already exists.' }, { status: 400 });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name ? name.trim() : 'User',
        email: cleanEmail,
        passwordHash,
        role: role || 'STUDENT'
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const response = NextResponse.json({ user: user.toJSON(), token }, { status: 201 });
      response.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 604800 });
      return response;
    }

    // Default action: Login
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (requiredRole && user.role !== requiredRole) {
      return NextResponse.json({ error: 'Unauthorized role access.' }, { status: 403 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const response = NextResponse.json({ user: user.toJSON(), token });
    response.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 604800 });
    return response;

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.set('token', '', { httpOnly: true, path: '/', expires: new Date(0) });
  return response;
}
