import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Exam Preparation'
  },
  author: {
    type: String,
    default: 'VU SIGMA Academic Team'
  },
  readTime: {
    type: String,
    default: '5 min read'
  },
  coverImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  },
  tags: [{
    type: String
  }],
  relatedSubjectCode: {
    type: String,
    default: ''
  }
}, { timestamps: true });

blogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
export default Blog;
