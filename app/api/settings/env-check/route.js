import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const mongoUri = process.env.MONGODB_URI || '';
    const isCloud = mongoUri.includes('mongodb+srv');
    const isConnected = mongoose.connection.readyState === 1;

    let uriMasked = 'Database URI not set';
    if (mongoUri) {
      uriMasked = isCloud
        ? mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
        : 'Configured (Custom / Standalone URI)';
    }

    const jwtSecret = process.env.JWT_SECRET;

    return NextResponse.json({
      mongodb: {
        status: isConnected ? (isCloud ? 'Atlas Connected ☁️' : 'Database Connected 🏠') : 'DISCONNECTED',
        uriMasked
      },
      jwtSecret: {
        status: jwtSecret ? 'CONFIGURED ✅' : 'MISSING ❌',
        length: jwtSecret.length
      },
      serverPort: process.env.PORT || 3000,
      nodeEnv: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
