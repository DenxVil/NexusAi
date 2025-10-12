// Created with love 🩶 by Denvil 🧑‍💻
// Telegram User Model for persistent storage

import mongoose, { Document, Schema } from 'mongoose';

export interface ITelegramUser extends Document {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  messageCount: number;
  tokenCount: number;
  joinDate: Date;
  lastActive: Date;
  isBlocked: boolean;
  dailyMessageCount: number;
  dailyTokenCount: number;
  lastResetDate: Date;
}

const telegramUserSchema = new Schema<ITelegramUser>({
  telegramId: {
    type: Number,
    required: [true, 'Telegram ID is required'],
    unique: true,
    index: true
  },
  username: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  messageCount: {
    type: Number,
    default: 0
  },
  tokenCount: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  dailyMessageCount: {
    type: Number,
    default: 0
  },
  dailyTokenCount: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
telegramUserSchema.index({ telegramId: 1 });
telegramUserSchema.index({ lastActive: -1 });

export const TelegramUser = mongoose.model<ITelegramUser>('TelegramUser', telegramUserSchema);
