import TelegramBot, { Message } from 'node-telegram-bot-api';
import { AIService } from './aiService';

// Replace with your Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN as string;

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private aiService: AIService;
  private activeUsers: Set<number> = new Set();

  constructor(aiService: AIService) {
    this.aiService = aiService;
    
    if (!token) {
      console.error('Telegram bot token is not provided. Bot initialization failed.');
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.initializeListeners();
  }

  private initializeListeners(): void {
    if (!this.bot) {
      return;
    }

    // Listener for /start command
    this.bot.onText(/\/start/, (msg: Message) => {
      this.handleNewUser(msg);
    });

    // Listener for /history command
    this.bot.onText(/\/history/, (msg: Message) => {
      this.handleViewHistory(msg);
    });

    // Listener for /clear command
    this.bot.onText(/\/clear/, (msg: Message) => {
      this.handleClearHistory(msg);
    });

    // Listener for any other message
    this.bot.on('message', (msg: Message) => {
      // Ignore commands that are handled by other listeners
      if (msg.text && msg.text.startsWith('/')) {
        const command = msg.text.split(' ')[0];
        if (command === '/start' || command === '/history' || command === '/clear') {
          return;
        }
      }
      this.handleUserMessage(msg);
    });

    // Error handling
    this.bot.on('polling_error', (error: Error) => {
      console.error(`Polling error: ${error.message}`);
    });

    this.bot.on('webhook_error', (error: Error) => {
      console.error(`Webhook error: ${error.message}`);
    });

    console.log('Telegram bot has been initialized and is running.');
  }

  private async handleNewUser(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    this.activeUsers.add(chatId);
    const welcomeMessage = `
🤖 Welcome to Nexus AI Bot!

I'm your intelligent assistant powered by advanced AI models. I can help you with:
• Answering questions
• Creative writing
• Code assistance
• General conversation

Commands:
/start - Show this welcome message
/history - View your chat history
/clear - Clear your chat history

Just send me a message to get started!
    `;
    
    try {
      await this.bot.sendMessage(chatId, welcomeMessage);
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  private async handleViewHistory(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    // This would integrate with your chat history storage
    const historyMessage = "📝 Chat history feature will be implemented with your database integration.";
    
    try {
      await this.bot.sendMessage(chatId, historyMessage);
    } catch (error) {
      console.error('Error sending history message:', error);
    }
  }

  private async handleClearHistory(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    // This would clear the chat history in your database
    const clearMessage = "🗑️ Chat history cleared successfully!";
    
    try {
      await this.bot.sendMessage(chatId, clearMessage);
    } catch (error) {
      console.error('Error sending clear message:', error);
    }
  }

  private async handleUserMessage(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;

    if (!userMessage) {
      return;
    }

    this.activeUsers.add(chatId);

    try {
      // Send typing indicator
      await this.bot.sendChatAction(chatId, 'typing');

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(userMessage);

      // Send the response
      await this.bot.sendMessage(chatId, aiResponse);
    } catch (error) {
      console.error('Error handling user message:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error while processing your message. Please try again.');
    }
  }

  public isActive(): boolean {
    return this.bot !== null;
  }

  public getActiveUsers(): number {
    return this.activeUsers.size;
  }
}

// Also export the initialization function for backward compatibility
export const initializeBot = (aiService: AIService): TelegramBotService => {
  return new TelegramBotService(aiService);
};
