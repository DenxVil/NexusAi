// Created with love 🩶 by Denvil 🧑‍💻
// Telegram Chat Model for persistent storage of chat histories

import mongoose, { Document, Schema } from 'mongoose';

export interface ITelegramMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ITelegramChat extends Document {
  telegramUserId: number;
  messages: ITelegramMessage[];
  lastActivity: Date;
}

const telegramMessageSchema = new Schema<ITelegramMessage>({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: [10000, 'Message text cannot exceed 10000 characters']
  },
  isUser: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const telegramChatSchema = new Schema<ITelegramChat>({
  telegramUserId: {
    type: Number,
    required: [true, 'Telegram user ID is required'],
    unique: true,
    index: true
  },
  messages: [telegramMessageSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
telegramChatSchema.index({ telegramUserId: 1 });
telegramChatSchema.index({ lastActivity: -1 });

// Limit messages to last 50 before saving
telegramChatSchema.pre('save', function(next) {
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-50);
  }
  this.lastActivity = new Date();
  next();
});

export const TelegramChat = mongoose.model<ITelegramChat>('TelegramChat', telegramChatSchema);
