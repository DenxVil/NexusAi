import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    responseTime?: number;
  };
}

export interface IChat extends Document {
  title: string;
  userId: mongoose.Types.ObjectId;
  messages: IMessage[];
  isActive: boolean;
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  };
  metadata: {
    totalMessages: number;
    totalTokens: number;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [10000, 'Message content cannot exceed 10000 characters']
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    model: String,
    tokens: Number,
    responseTime: Number
  }
}, { _id: false });

const chatSchema = new Schema<IChat>({
  title: {
    type: String,
    required: [true, 'Chat title is required'],
    trim: true,
    maxlength: [100, 'Chat title cannot exceed 100 characters']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: 1,
      max: 4000
    },
    systemPrompt: {
      type: String,
      maxlength: [1000, 'System prompt cannot exceed 1000 characters']
    }
  },
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ userId: 1, isActive: 1 });
chatSchema.index({ 'metadata.lastActivity': -1 });

// Update metadata when messages are added
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.metadata.totalMessages = this.messages.length;
    this.metadata.lastActivity = new Date();
  }
  next();
});

export const Chat = mongoose.model<IChat>('Chat', chatSchema);