import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';
import { getAuthUser } from '@/lib/auth';

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export async function GET(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    const isStaff = authUser && (authUser.role === 'SUPER_ADMIN' || authUser.role === 'admin');

    const filter = isStaff ? {} : { status: 'published' };
    const blogs = await Blog.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: blogs.map(b => b.toJSON()),
      count: blogs.length
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, excerpt, content, category, author, readTime, coverImage, status, tags, relatedSubjectCode } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
    }

    let slug = body.slug ? slugify(body.slug) : slugify(title);
    const existing = await Blog.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const newBlog = await Blog.create({
      title: title.trim(),
      slug,
      excerpt: excerpt || title,
      content,
      category: category || 'Exam Preparation',
      author: author || 'VU SIGMA Academic Team',
      readTime: readTime || '5 min read',
      coverImage: coverImage || '',
      status: status || 'published',
      tags: Array.isArray(tags) ? tags : [],
      relatedSubjectCode: relatedSubjectCode ? relatedSubjectCode.toUpperCase() : ''
    });

    return NextResponse.json({ success: true, data: newBlog.toJSON() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
