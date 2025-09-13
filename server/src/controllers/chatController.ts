import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Chat, IMessage } from '../models/Chat';
import { AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { title, systemPrompt } = req.body;
    const userId = req.user?._id;

    const chat = new Chat({
      title,
      userId,
      settings: {
        systemPrompt,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000
      }
    });

    await chat.save();

    res.status(201).json({
      success: true,
      data: { chat }
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error creating chat' }
    });
  }
};

export const getUserChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const chats = await Chat.find({ userId, isActive: true })
      .sort({ 'metadata.lastActivity': -1 })
      .skip(skip)
      .limit(limit)
      .select('-messages'); // Exclude messages for performance

    const total = await Chat.countDocuments({ userId, isActive: true });

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error getting chats' }
    });
  }
};

export const getChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?._id;

    const chat = await Chat.findOne({ _id: chatId, userId, isActive: true });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: { message: 'Chat not found' }
      });
    }

    res.json({
      success: true,
      data: { chat }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error getting chat' }
    });
  }
};

export const addMessage = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { chatId } = req.params;
    const { content, role = 'user' } = req.body;
    const userId = req.user?._id;

    const chat = await Chat.findOne({ _id: chatId, userId, isActive: true });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: { message: 'Chat not found' }
      });
    }

    const message: IMessage = {
      id: uuidv4(),
      content,
      role,
      timestamp: new Date()
    };

    chat.messages.push(message);
    chat.metadata.lastActivity = new Date();
    
    await chat.save();

    res.json({
      success: true,
      data: { message, chat }
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error adding message' }
    });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?._id;

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: { message: 'Chat not found' }
      });
    }

    chat.isActive = false;
    await chat.save();

    res.json({
      success: true,
      data: { message: 'Chat deleted successfully' }
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error deleting chat' }
    });
  }
};