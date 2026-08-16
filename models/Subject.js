import mongoose from 'mongoose';
import { STATUS } from '@/lib/enums';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  overviewText: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.DRAFT
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalChapters: {
    type: Number,
    default: 0
  },
  totalQuestionsCount: {
    type: Number,
    default: 0
  },
  mcqQuestionsCount: {
    type: Number,
    default: 0
  },
  shortQuestionsCount: {
    type: Number,
    default: 0
  },
  longQuestionsCount: {
    type: Number,
    default: 0
  },
  chaptersConfig: [{
    chapterNumber: Number,
    chapterName: String,
    topics: [{
      topicName: String,
      isImportant: { type: Boolean, default: false }
    }]
  }],
  notes: [{
    title: String,
    fileUrl: String,
    category: String,
    description: String
  }],
  pastPaperLinks: [{
    title: String,
    url: String,
    year: String,
    term: String
  }],
  videoLectures: [{
    title: String,
    youtubeUrl: String,
    duration: String,
    topic: String
  }],
  faqs: [{
    question: String,
    answer: String
  }]
}, { timestamps: true });

subjectSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
export default Subject;
