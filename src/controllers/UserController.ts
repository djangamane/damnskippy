import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import type { User, UserCreate, UserUpdate, UserResponse, UsersResponse } from '../models/User';

export class UserController {
  static async signUp({ email, password, displayName }: UserCreate): Promise<UserResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return {
          data: null,
          error: new Error('User already exists'),
          message: 'An account with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const user = new UserModel({
        email: email.toLowerCase(),
        password: hashedPassword,
        displayName: displayName || null,
        isPaidUser: false,
        createdAt: new Date()
      });

      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        data: userResponse as User,
        error: null,
        message: 'Account created successfully. You can now sign in.'
      };
    } catch (error) {
      console.error('Sign-up process error:', error);
      return {
        data: null,
        error: error as Error,
        message: 'An error occurred during sign-up. Please try again.'
      };
    }
  }

  static async signIn({ email, password }: { email: string; password: string }): Promise<UserResponse> {
    try {
      // Find user by email
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return {
          data: null,
          error: new Error('Invalid credentials'),
          message: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          data: null,
          error: new Error('Invalid credentials'),
          message: 'Invalid email or password'
        };
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return { 
        data: userResponse as User, 
        error: null 
      };
    } catch (error) {
      console.error('Sign-in error:', error);
      return {
        data: null,
        error: error as Error,
        message: 'An error occurred during sign-in'
      };
    }
  }

  static async getCurrentUser(userId: string): Promise<UserResponse> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return { 
          data: null, 
          error: new Error('User not found') 
        };
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return { 
        data: userResponse as User, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: error as Error 
      };
    }
  }

  static async update(userId: string, updates: UserUpdate): Promise<UserResponse> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { ...updates },
        { new: true }
      );

      if (!user) {
        return { 
          data: null, 
          error: new Error('User not found') 
        };
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return { 
        data: userResponse as User, 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: error as Error 
      };
    }
  }

  static async delete(userId: string): Promise<{ error: Error | null }> {
    try {
      const result = await UserModel.findByIdAndDelete(userId);
      if (!result) {
        throw new Error('User not found');
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
} 