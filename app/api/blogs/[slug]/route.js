import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const blog = await Blog.findOne({ $or: [{ slug: slug.toLowerCase() }, { _id: slug }] });
    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: blog.toJSON() });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const body = await request.json();

    const updated = await Blog.findOneAndUpdate(
      { $or: [{ slug: slug.toLowerCase() }, { _id: slug }] },
      body,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated.toJSON() });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    await Blog.findOneAndDelete({ $or: [{ slug: slug.toLowerCase() }, { _id: slug }] });
    return NextResponse.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
