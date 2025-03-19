import mongoose from '../platform/mongodb';

export interface ResearchThread {
  id: string;
  userId: string;
  query: string;
  result: string;
  timestamp: Date;
  tags?: string[];
}

const researchThreadSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  query: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tags: {
    type: [String],
    default: []
  },
  isPaidUser: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const ResearchThreadModel = mongoose.model('ResearchThread', researchThreadSchema); 