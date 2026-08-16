import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { logAuditAction } from '@/utils/auditLogger';

export async function GET(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const users = await User.find().sort({ createdAt: -1 });
    return NextResponse.json(users.map(u => u.toJSON()));
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role || 'STUDENT'
    });

    await logAuditAction({ user: authUser, headers: request.headers }, 'CREATE', 'User', user._id, { email: user.email, role: user.role });

    return NextResponse.json(user.toJSON(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
