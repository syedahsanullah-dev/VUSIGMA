import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { logAuditAction } from '@/utils/auditLogger';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, role, password } = body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const auditDetails = { ...updateData };
    delete auditDetails.passwordHash;
    await logAuditAction({ user: authUser, headers: request.headers }, 'UPDATE', 'User', updated._id, auditDetails);

    return NextResponse.json(updated.toJSON());
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    await logAuditAction({ user: authUser, headers: request.headers }, 'DELETE', 'User', id);
    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
