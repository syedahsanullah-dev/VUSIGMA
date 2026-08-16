import mongoose from 'mongoose';
import { STATUS, CATEGORY } from '@/lib/enums';

const questionSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    enum: Object.values(CATEGORY),
    default: CATEGORY.MCQ
  },
  questionText: {
    type: String,
    required: true
  },
  questionTextUrdu: {
    type: String,
    default: ''
  },
  options: {
    type: [String],
    default: []
  },
  optionsUrdu: {
    type: [String],
    default: []
  },
  correctOption: {
    type: Number,
    default: 0
  },
  explanation: {
    type: String,
    default: ''
  },
  explanationUrdu: {
    type: String,
    default: ''
  },
  solution: {
    type: String,
    default: ''
  },
  solutionUrdu: {
    type: String,
    default: ''
  },
  chapter: {
    type: Number,
    default: 1
  },
  chapterNumber: {
    type: Number,
    default: 1
  },
  topic: {
    type: String,
    default: 'General'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  imageBase64: {
    type: String,
    default: ''
  },
  imagesBase64: [{
    type: String
  }],
  codeSnippet: {
    type: String,
    default: ''
  },
  codeLanguage: {
    type: String,
    default: 'cpp'
  },
  solutionCode: {
    type: String,
    default: ''
  },
  solutionCodeLanguage: {
    type: String,
    default: 'cpp'
  },
  hasCode: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.PUBLISHED
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  isRepeated: {
    type: Boolean,
    default: false
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  isConceptual: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index for fast subject + category query performance
questionSchema.index({ subjectCode: 1, category: 1 });

questionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
export default Question;
