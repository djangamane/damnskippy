import mongoose from '../platform/mongodb';

export interface User {
  id: string;
  email: string;
  password?: string;
  displayName?: string;
  isPaidUser: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface UserCreate {
  email: string;
  password: string;
  displayName?: string;
}

export interface UserUpdate {
  displayName?: string;
  isPaidUser?: boolean;
  lastLoginAt?: Date;
}

export interface UserResponse {
  data: User | null;
  error: Error | null;
  message?: string;
}

export interface UsersResponse {
  data: User[] | null;
  error: Error | null;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    trim: true
  },
  isPaidUser: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
}, {
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Add any pre-save hooks or methods here
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

export const UserModel = mongoose.model('User', userSchema); 