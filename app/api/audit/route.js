import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (searchParams.get('action')) filter.action = searchParams.get('action');
    if (searchParams.get('resource')) filter.resource = searchParams.get('resource');
    if (searchParams.get('adminId')) filter.adminId = searchParams.get('adminId');

    const totalLogs = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total: totalLogs,
        page,
        pages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
  }
}
