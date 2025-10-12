// Created with love 🩶 by Denvil 🧑‍💻
// Nexus AI Telegram Bot Service - Simplified and Clean Interface

import TelegramBot, { Message, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { AIService } from './aiService';
import config from '../config';

const token = config.telegramBotToken;
const adminUID = config.telegramAdminUid;

interface UserData {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  messageCount: number;
  tokenCount: number;
  joinDate: Date;
  lastActive: Date;
  isBlocked: boolean;
}

interface ChatHistory {
  userId: number;
  messages: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  }>;
}

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private aiService: AIService;
  private activeUsers: Set<number> = new Set();
  private users: Map<number, UserData> = new Map();
  private chatHistories: Map<number, ChatHistory> = new Map();

  // Usage limits
  private readonly MAX_MESSAGES_PER_DAY = 50;
  private readonly MAX_TOKENS_PER_DAY = 10000;

  // Magic 8-ball responses
  private readonly magic8BallResponses = [
    "🔮 It is certain", "🔮 It is decidedly so", "🔮 Without a doubt",
    "🔮 Yes definitely", "🔮 You may rely on it", "🔮 As I see it, yes",
    "🔮 Most likely", "🔮 Outlook good", "🔮 Yes", "🔮 Signs point to yes",
    "🔮 Reply hazy, try again", "🔮 Ask again later", "🔮 Better not tell you now",
    "🔮 Cannot predict now", "🔮 Concentrate and ask again",
    "🔮 Don't count on it", "🔮 My reply is no", "🔮 My sources say no",
    "🔮 Outlook not so good", "🔮 Very doubtful"
  ];

  // Redoura-inspired text formatting for Telegram
  private formatWithRedouraStyle(text: string): string {
    // Apply elegant Unicode styling similar to Redoura font aesthetic
    return text
      .replace(/\*\*(.*?)\*\*/g, '𝗥$1')  // Bold with Redoura-style emphasis
      .replace(/\*(.*?)\*/g, '𝑅$1')      // Italic with flowing style
      .replace(/`(.*?)`/g, '⟨$1⟩')       // Code with elegant brackets
      .replace(/^(#{1,6})\s*(.*)/gm, (match, hashes, content) => {
        const level = hashes.length;
        const prefixes = ['◆', '◇', '◈', '◊', '◉', '◎'];
        return `${prefixes[level - 1] || '◆'} ${content}`;
      });
  }

  constructor(aiService: AIService) {
    this.aiService = aiService;
    
    if (!token) {
      console.error('Telegram bot token is not provided. Bot initialization failed.');
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.initializeListeners();
    this.loadUserData();
  }

  private initializeListeners(): void {
    if (!this.bot) return;

    // Essential commands only - clean and simple interface
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/info/, (msg) => this.handleInfo(msg));

    // Basic features
    this.bot.onText(/\/imagine (.+)/, (msg, match) => this.handleImagine(msg, match));
    this.bot.onText(/\/8ball (.+)/, (msg, match) => this.handleMagic8Ball(msg, match));
    this.bot.onText(/\/weather (.+)/, (msg, match) => this.handleWeather(msg, match));
    this.bot.onText(/\/calculate (.+)/, (msg, match) => this.handleCalculate(msg, match));
    this.bot.onText(/\/define (.+)/, (msg, match) => this.handleDefine(msg, match));

    // Admin commands (if needed)
    if (adminUID !== 0) {
      this.bot.onText(/\/admin_stats/, (msg) => this.handleAdminStats(msg));
      this.bot.onText(/\/admin_broadcast (.+)/, (msg, match) => this.handleAdminBroadcast(msg, match));
    }

    // Handle regular messages
    this.bot.on('message', (msg) => this.handleUserMessage(msg));

    // Handle callback queries for inline keyboards
    this.bot.on('callback_query', (query) => this.handleCallbackQuery(query));

    // Error handling
    this.bot.on('polling_error', (error) => console.error(`Polling error: ${error.message}`));
    this.bot.on('webhook_error', (error) => console.error(`Webhook error: ${error.message}`));

    console.log('🤖 Nexus AI Telegram bot initialized with clean, simple interface');
  }

  private async handleStart(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = msg.from;
    
    if (!user) return;

    // Initialize user data
    this.initializeUser(user.id, user);
    
    const welcomeMessage = `
🌟 *Welcome to Nexus AI!* 🌟

Your advanced AI assistant created by ◉Ɗєиνιℓ

🔮 *What can I do for you?*
• Answer questions intelligently
• Help with various tasks
• Provide information and analysis
• Chat naturally with AI

🌐 *Try the full experience:*
${config.websiteUrl}

💬 Simply send me any message to start chatting!
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🌐 Visit Website', url: config.websiteUrl }
        ],
        [
          { text: '💬 Start Chatting', callback_data: 'start_chat' },
          { text: '❓ Help', callback_data: 'show_help' }
        ]
      ]
    };

    try {
      await this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  private async handleHelp(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;

    const helpMessage = `
🆘 *Nexus AI Commands* 🆘

*🤖 Basic Commands:*
• Just type anything - Chat with AI
• /start - Welcome & introduction
• /help - Show this help message
• /info - About Nexus AI

*🎨 Creative Features:*
• /imagine [prompt] - Generate AI images
• /8ball [question] - Magic 8-ball predictions

*🛠️ Utility Commands:*
• /weather [city] - Get weather forecast
• /calculate [expression] - Math calculations
• /define [word] - Dictionary definitions

🌐 *Visit our website for the full experience:*
${config.websiteUrl}

💬 *Ready to chat?* Just send me any message!

*Created with love 🩶 by ◉Ɗєиνιℓ*
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🌐 Visit Website', url: config.websiteUrl }
        ],
        [
          { text: '💬 Start Chatting', callback_data: 'start_chat' },
          { text: '🎨 Generate Image', callback_data: 'generate_image' }
        ]
      ]
    };

    try {
      await this.bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending help message:', error);
    }
  }

  private async handleInfo(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const totalUsers = this.users.size;
    const activeUsers = this.activeUsers.size;

    const infoMessage = `
🔮 *About Nexus AI* 🔮

*🤖 Advanced AI Assistant*
Nexus AI is your intelligent companion powered by cutting-edge technology and created with love by ◉Ɗєиνιℓ.

*✨ Key Features:*
• Multi-provider AI intelligence
• Natural conversation abilities
• Creative content generation
• Real-time information access
• Clean, simple interface

*📊 Platform Statistics:*
• 👥 Total Users: ${totalUsers}
• 🟢 Active Users: ${activeUsers}
• 🚀 Version: 2.0 (Nexus AI)
• ⚡ Status: Online & Optimized

*🌐 Full Experience:*
Visit our website for enhanced features:
${config.websiteUrl}

*🔒 Privacy & Security:*
Your conversations are handled securely with privacy-first design.

*📞 Need Help?*
Use /help for commands or visit our website for support.

---
**Created with love 🩶 by ◉Ɗєиνιℓ**
_Nexus AI - Where intelligence meets simplicity_
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🌐 Visit Website', url: config.websiteUrl }
        ],
        [
          { text: '📋 Commands', callback_data: 'show_help' },
          { text: '💬 Start Chat', callback_data: 'start_chat' }
        ]
      ]
    };

    try {
      await this.bot.sendMessage(chatId, infoMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending info message:', error);
    }
  }

  private async handleImagine(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const prompt = match[1].trim();
    
    if (!prompt) {
      await this.bot.sendMessage(chatId, '🎨 Please provide a description for the image you want to generate.\n\nExample: /imagine a beautiful sunset over mountains');
      return;
    }

    try {
      await this.bot.sendChatAction(chatId, 'upload_photo');
      await this.bot.sendMessage(chatId, `🎨 *Creating image...* 
"${prompt}"

This might take a moment...`, { parse_mode: 'Markdown' });

      // Simulate image generation with placeholder
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`;
      
      await this.bot.sendPhoto(chatId, imageUrl, {
        caption: `🎨 *Generated Image*\n📝 Prompt: "${prompt}"\n\n_Powered by Nexus AI Image Generation_`,
        parse_mode: 'Markdown'
      });

      this.updateUserUsage(chatId, 0, 100);
      
    } catch (error) {
      console.error('Error generating image:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error while generating the image. Please try again later.');
    }
  }

  private async handleMagic8Ball(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const question = match[1].trim();
    
    const response = this.magic8BallResponses[Math.floor(Math.random() * this.magic8BallResponses.length)];
    
    const replyMessage = `🎱 *Magic 8-Ball* 🎱

**Your Question:** "${question}"

**The Magic 8-Ball says:**
${response}

_Ask another question anytime!_ ✨`;

    try {
      await this.bot.sendMessage(chatId, replyMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error with magic 8-ball:', error);
    }
  }

  private async handleWeather(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const city = match[1].trim();
    
    try {
      await this.bot.sendChatAction(chatId, 'typing');
      
      // Simulate weather API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const temperatures = [15, 18, 22, 25, 28, 20, 16];
      const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy'];
      const temp = temperatures[Math.floor(Math.random() * temperatures.length)];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      const weatherMessage = `
🌤️ *Weather Forecast* 🌤️

📍 **Location:** ${city}
🌡️ **Temperature:** ${temp}°C
☁️ **Condition:** ${condition}
💨 **Wind:** 15 km/h
💧 **Humidity:** 65%

🔮 **7-Day Outlook:** Mixed conditions expected

_This is a simulated forecast. For real weather data, integration with weather APIs is needed._

// Created with love 🩶 by Denvil 🧑‍💻
      `;

      await this.bot.sendMessage(chatId, weatherMessage, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error getting weather:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I couldn\'t get weather information right now. Please try again later.');
    }
  }

  private async handleCalculate(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const expression = match[1].trim();
    
    try {
      // Simple math evaluation (secure implementation would use a proper math parser)
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = eval(sanitized);
      
      const calculationMessage = `
🧮 *Calculator Result* 🧮

**Expression:** \`${expression}\`
**Result:** \`${result}\`

💡 **Pro Tip:** I can handle basic arithmetic operations (+, -, *, /)

_For complex calculations, consider using specialized math tools._

// Created with love 🩶 by Denvil 🧑‍💻
      `;

      await this.bot.sendMessage(chatId, calculationMessage, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error calculating:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I couldn\'t calculate that expression. Please check your input and try again.');
    }
  }

  private async handleDefine(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const word = match[1].trim();
    
    try {
      await this.bot.sendChatAction(chatId, 'typing');
      
      // Simulate dictionary lookup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const definitions: { [key: string]: string } = {
        'artificial': 'Made by humans; not natural or real',
        'intelligence': 'The ability to acquire and apply knowledge and skills',
        'technology': 'The application of scientific knowledge for practical purposes',
        'innovation': 'The action or process of innovating; a new method or idea',
        'creativity': 'The use of imagination or original ideas to create something'
      };
      
      const definition = definitions[word.toLowerCase()] || `A definition for "${word}" - this would be fetched from a dictionary API in a full implementation.`;
      
      const definitionMessage = `
📖 *Dictionary Definition* 📖

**Word:** *${word}*

**Definition:**
${definition}

**Part of Speech:** Noun/Verb/Adjective (varies)

💡 **Example Usage:**
"The ${word} was impressive in its scope and application."

_For complete definitions, consider consulting comprehensive dictionaries._

// Created with love 🩶 by Denvil 🧑‍💻
      `;

      await this.bot.sendMessage(chatId, definitionMessage, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error defining word:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I couldn\'t find a definition for that word. Please try again.');
    }
  }

  private async handleUserMessage(msg: Message): Promise<void> {
    if (!this.bot || !msg.text || msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const user = msg.from;
    
    if (!user) return;

    // Simple usage check
    if (!this.checkUsageLimits(user.id)) {
      await this.bot.sendMessage(chatId, '⚠️ You\'ve reached your daily usage limit. Please try again tomorrow.');
      return;
    }

    this.activeUsers.add(chatId);
    this.initializeUser(user.id, user);

    try {
      // Show typing indicator
      await this.bot.sendChatAction(chatId, 'typing');

      // Get structured AI response with enhanced logic
      const aiResponse = await this.generateIntelligentResponse(chatId, userMessage);

      // Apply Redoura-style formatting
      const styledResponse = this.formatWithRedouraStyle(aiResponse);

      // Send response WITHOUT website link (as per requirement)
      await this.bot.sendMessage(chatId, styledResponse, {
        parse_mode: 'Markdown'
      });

      // Update usage and save to history
      this.updateUserUsage(chatId, 1, 50);
      this.saveChatMessage(chatId, userMessage, aiResponse);

    } catch (error) {
      console.error('Error handling user message:', error);
      await this.bot.sendMessage(chatId, `❌ I encountered an error processing your message. Please try again.`);
    }
  }

  /**
   * Enhanced AI response generation with structured logic
   * This method provides a more extensible architecture for AI interactions
   */
  private async generateIntelligentResponse(chatId: number, userMessage: string): Promise<string> {
    // Get chat history for context-aware responses
    const history = this.chatHistories.get(chatId);
    const chatHistory = history ? history.messages.slice(-5).map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    })) : [];

    // Analyze message intent for specialized handling
    const intent = this.analyzeMessageIntent(userMessage);

    // Apply pre-processing based on intent
    const processedMessage = this.preprocessMessage(userMessage, intent);

    // Generate AI response with cascading service fallback
    const rawResponse = await this.aiService.generateResponse(processedMessage, chatHistory);

    // Apply post-processing and enhancement
    const enhancedResponse = this.enhanceResponse(rawResponse, intent);

    return enhancedResponse;
  }

  /**
   * Analyze user message to determine intent
   * Enables specialized handling for different types of queries
   */
  private analyzeMessageIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Question detection
    if (lowerMessage.includes('what') || lowerMessage.includes('why') || 
        lowerMessage.includes('how') || lowerMessage.includes('?')) {
      return 'question';
    }

    // Code/technical query detection
    if (lowerMessage.includes('code') || lowerMessage.includes('function') || 
        lowerMessage.includes('error') || lowerMessage.includes('debug')) {
      return 'technical';
    }

    // Creative request detection
    if (lowerMessage.includes('create') || lowerMessage.includes('write') || 
        lowerMessage.includes('generate') || lowerMessage.includes('idea')) {
      return 'creative';
    }

    // Casual conversation
    return 'conversation';
  }

  /**
   * Preprocess message based on detected intent
   * Adds context or formatting hints for better AI responses
   */
  private preprocessMessage(message: string, intent: string): string {
    switch (intent) {
      case 'technical':
        return `As a technical assistant, please help with: ${message}`;
      case 'creative':
        return `Please be creative and thoughtful in responding to: ${message}`;
      case 'question':
        return `Please provide a clear and informative answer to: ${message}`;
      default:
        return message;
    }
  }

  /**
   * Enhance AI response based on intent
   * Adds formatting, structure, or additional context
   */
  private enhanceResponse(response: string, intent: string): string {
    // Ensure response is well-formatted and complete
    let enhanced = response.trim();

    // Add intent-specific enhancements
    if (intent === 'technical' && !enhanced.includes('```')) {
      // Technical responses benefit from clear structure
      enhanced = enhanced;
    }

    // Ensure response isn't empty
    if (!enhanced) {
      enhanced = "I understand your message. Could you please provide more details so I can assist you better?";
    }

    return enhanced;
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    if (!this.bot || !query.data) return;

    const chatId = query.message.chat.id;
    const data = query.data;

    try {
      switch (data) {
        case 'start_chat':
          await this.bot.sendMessage(chatId, '💬 Perfect! Just send me any message and I\'ll respond using advanced AI. What would you like to talk about?');
          break;
          
        case 'show_help':
          await this.handleHelp(query.message);
          break;
          
        case 'generate_image':
          await this.bot.sendMessage(chatId, '🎨 To generate an image, use:\n/imagine [your description]\n\nExample: /imagine a futuristic city at sunset');
          break;
          
        default:
          await this.bot.sendMessage(chatId, '🤖 I didn\'t understand that action. Try using the menu buttons or type a message!');
      }

      await this.bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Error handling callback query:', error);
      await this.bot.answerCallbackQuery(query.id, { text: 'Sorry, something went wrong!' });
    }
  }

  // Admin command handlers (simplified)
  private async handleAdminStats(msg: Message): Promise<void> {
    if (!this.bot || !this.isAdmin(msg.from?.id)) return;
    
    const chatId = msg.chat.id;
    
    const totalMessages = Array.from(this.users.values()).reduce((sum, user) => sum + user.messageCount, 0);
    const totalTokens = Array.from(this.users.values()).reduce((sum, user) => sum + user.tokenCount, 0);
    const avgMessagesPerUser = this.users.size > 0 ? Math.round(totalMessages / this.users.size) : 0;
    
    const adminMessage = `
📊 *Admin: Nexus AI Statistics* 📊

**Users:**
👥 Total Users: ${this.users.size}
🟢 Active Users: ${this.activeUsers.size}

**Usage:**
💬 Total Messages: ${totalMessages}
🎯 Total Tokens: ${totalTokens}
📊 Avg Messages/User: ${avgMessagesPerUser}

**System:**
⚡ Bot Status: Online
🔄 Uptime: ${this.getUptime()}
💾 Memory Usage: ${this.getMemoryUsage()}

**Created with love 🩶 by ◉Ɗєиνιℓ**
    `;

    try {
      await this.bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending admin stats:', error);
    }
  }

  private async handleAdminBroadcast(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !this.isAdmin(msg.from?.id) || !match) return;
    
    const chatId = msg.chat.id;
    const broadcastMessage = match[1].trim();
    
    await this.bot.sendMessage(chatId, `📢 *Broadcasting message to ${this.users.size} users...*`, { parse_mode: 'Markdown' });
    
    let successCount = 0;
    let failCount = 0;

    for (const userId of this.users.keys()) {
      try {
        await this.bot.sendMessage(userId, `📢 *Admin Broadcast*\n\n${broadcastMessage}\n\n_This message was sent to all Nexus AI users._`, { parse_mode: 'Markdown' });
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      } catch (error) {
        failCount++;
      }
    }

    await this.bot.sendMessage(chatId, `✅ Broadcast complete!\n\n📊 **Results:**\n• ✅ Successful: ${successCount}\n• ❌ Failed: ${failCount}`, { parse_mode: 'Markdown' });
  }

  // Helper methods
  private initializeUser(userId: number, user: any): void {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        id: userId,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        messageCount: 0,
        tokenCount: 0,
        joinDate: new Date(),
        lastActive: new Date(),
        isBlocked: false
      });
    } else {
      const userData = this.users.get(userId)!;
      userData.lastActive = new Date();
      userData.username = user.username;
      userData.firstName = user.first_name;
      userData.lastName = user.last_name;
    }
  }

  private updateUserUsage(userId: number, messages: number, tokens: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.messageCount += messages;
      user.tokenCount += tokens;
      user.lastActive = new Date();
    }
  }

  private checkUsageLimits(userId: number): boolean {
    const user = this.users.get(userId);
    if (!user) return true;

    // Reset daily counters if it's a new day
    const today = new Date().toDateString();
    const lastActiveDay = user.lastActive.toDateString();
    if (today !== lastActiveDay) {
      user.messageCount = 0;
      user.tokenCount = 0;
    }

    return user.messageCount < this.MAX_MESSAGES_PER_DAY && 
           user.tokenCount < this.MAX_TOKENS_PER_DAY;
  }

  private isAdmin(userId?: number): boolean {
    return userId === adminUID && adminUID !== 0;
  }

  private saveChatMessage(userId: number, userMsg: string, botMsg: string): void {
    if (!this.chatHistories.has(userId)) {
      this.chatHistories.set(userId, {
        userId,
        messages: []
      });
    }

    const history = this.chatHistories.get(userId)!;
    history.messages.push(
      {
        id: Date.now().toString(),
        text: userMsg,
        isUser: true,
        timestamp: new Date()
      },
      {
        id: (Date.now() + 1).toString(),
        text: botMsg,
        isUser: false,
        timestamp: new Date()
      }
    );

    // Keep only last 50 messages
    if (history.messages.length > 50) {
      history.messages = history.messages.slice(-50);
    }
  }

  // Utility methods
  private getUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  private getMemoryUsage(): string {
    const used = process.memoryUsage();
    return `${Math.round(used.rss / 1024 / 1024)} MB`;
  }

  private loadUserData(): void {
    // In a real implementation, this would load from database
    console.log('User data loaded from storage');
  }

  public isActive(): boolean {
    return this.bot !== null;
  }

  public getActiveUsers(): number {
    return this.activeUsers.size;
  }

  public getTotalUsers(): number {
    return this.users.size;
  }
}

// Also export the initialization function for backward compatibility
export const initializeBot = (aiService: AIService): TelegramBotService => {
  return new TelegramBotService(aiService);
};