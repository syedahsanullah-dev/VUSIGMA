import mongoose from 'mongoose';
import { STATUS, CATEGORY } from '@/lib/enums';

const quizSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  subjectCode: {
    type: String,
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  quizType: {
    type: String,
    enum: ['CHAPTER_QUIZ', 'MIDTERM_EXAM', 'FINALTERM_EXAM', 'PAST_PAPER', 'CUSTOM'],
    default: 'CHAPTER_QUIZ'
  },
  category: {
    type: String,
    enum: Object.values(CATEGORY),
    default: CATEGORY.MIXED
  },
  chapters: [{
    type: Number
  }],
  topics: [{
    type: String
  }],
  questionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  timeLimitMinutes: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    lowercase: true,
    enum: Object.values(STATUS),
    default: STATUS.DRAFT
  },
  isActive: {
    type: Boolean,
    default: true
  },
  questionCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

quizSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.subjectId && typeof ret.subjectId === 'object') {
      ret.subjectId = ret.subjectId._id ? ret.subjectId._id.toString() : ret.subjectId.toString();
    } else if (ret.subjectId) {
      ret.subjectId = ret.subjectId.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
export default Quiz;
