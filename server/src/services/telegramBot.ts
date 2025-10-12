// Created with love 🩶 by Denvil 🧑‍💻
// Nexus AI Telegram Bot Service - Simplified and Clean Interface

import TelegramBot, { Message, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { AIService } from './aiService';
import config from '../config';
import { TelegramUser, ITelegramUser } from '../models/TelegramUser';
import { TelegramChat, ITelegramChat } from '../models/TelegramChat';

const token = config.telegramBotToken;
const adminUID = config.telegramAdminUid;

// Command handler type definition
type CommandHandler = (msg: Message, match?: RegExpExecArray | null) => Promise<void>;

interface CommandDefinition {
  pattern: RegExp;
  handler: CommandHandler;
  description: string;
}

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private aiService: AIService;
  private activeUsers: Set<number> = new Set();
  private commands: Map<string, CommandDefinition> = new Map();

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
    this.registerCommands();
    this.initializeListeners();
  }

  /**
   * Register all available commands in the command map
   */
  private registerCommands(): void {
    // Essential commands
    this.commands.set('/start', {
      pattern: /\/start/,
      handler: this.handleStart.bind(this),
      description: 'Welcome & introduction'
    });
    
    this.commands.set('/help', {
      pattern: /\/help/,
      handler: this.handleHelp.bind(this),
      description: 'Show help message'
    });
    
    this.commands.set('/info', {
      pattern: /\/info/,
      handler: this.handleInfo.bind(this),
      description: 'About Nexus AI'
    });

    // Feature commands
    this.commands.set('/imagine', {
      pattern: /\/imagine (.+)/,
      handler: this.handleImagine.bind(this),
      description: 'Generate AI images'
    });
    
    this.commands.set('/8ball', {
      pattern: /\/8ball (.+)/,
      handler: this.handleMagic8Ball.bind(this),
      description: 'Magic 8-ball predictions'
    });
    
    this.commands.set('/weather', {
      pattern: /\/weather (.+)/,
      handler: this.handleWeather.bind(this),
      description: 'Get weather forecast'
    });
    
    this.commands.set('/calculate', {
      pattern: /\/calculate (.+)/,
      handler: this.handleCalculate.bind(this),
      description: 'Math calculations'
    });
    
    this.commands.set('/define', {
      pattern: /\/define (.+)/,
      handler: this.handleDefine.bind(this),
      description: 'Dictionary definitions'
    });

    // Admin commands
    if (adminUID !== 0) {
      this.commands.set('/admin_stats', {
        pattern: /\/admin_stats/,
        handler: this.handleAdminStats.bind(this),
        description: 'Admin statistics'
      });
      
      this.commands.set('/admin_broadcast', {
        pattern: /\/admin_broadcast (.+)/,
        handler: this.handleAdminBroadcast.bind(this),
        description: 'Broadcast message to all users'
      });
    }
  }

  /**
   * Initialize bot listeners using the command map
   */
  private initializeListeners(): void {
    if (!this.bot) return;

    // Register all commands from the command map
    this.commands.forEach((cmd, cmdName) => {
      this.bot!.onText(cmd.pattern, async (msg, match) => {
        try {
          await cmd.handler(msg, match ?? null);
        } catch (error) {
          console.error(`Error handling command ${cmdName}:`, error);
          await this.sendErrorMessage(msg.chat.id, 'An error occurred while processing your command.');
        }
      });
    });

    // Handle regular messages
    this.bot.on('message', async (msg) => {
      try {
        await this.handleUserMessage(msg);
      } catch (error) {
        console.error('Error handling user message:', error);
        await this.sendErrorMessage(msg.chat.id, 'An error occurred while processing your message.');
      }
    });

    // Handle callback queries for inline keyboards
    this.bot.on('callback_query', async (query) => {
      try {
        await this.handleCallbackQuery(query);
      } catch (error) {
        console.error('Error handling callback query:', error);
        if (this.bot && query.id) {
          await this.bot.answerCallbackQuery(query.id, { text: 'Sorry, something went wrong!' });
        }
      }
    });

    // Error handling
    this.bot.on('polling_error', (error) => console.error(`Polling error: ${error.message}`));
    this.bot.on('webhook_error', (error) => console.error(`Webhook error: ${error.message}`));

    console.log('🤖 Nexus AI Telegram bot initialized with clean, simple interface');
  }

  /**
   * Send a user-friendly error message
   */
  private async sendErrorMessage(chatId: number, message: string): Promise<void> {
    try {
      if (this.bot) {
        await this.bot.sendMessage(chatId, `❌ ${message}\n\nPlease try again or use /help for assistance.`);
      }
    } catch (error) {
      console.error('Error sending error message:', error);
    }
  }

  private async handleStart(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = msg.from;
    
    if (!user) return;

    try {
      // Initialize user data in database
      await this.initializeUser(user.id, user);
      
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

      await this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error in handleStart:', error);
      await this.sendErrorMessage(chatId, 'Failed to initialize. Please try again.');
    }
  }

  private async handleHelp(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;

    try {
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

      await this.bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error in handleHelp:', error);
      await this.sendErrorMessage(chatId, 'Failed to send help message.');
    }
  }

  private async handleInfo(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;

    try {
      const totalUsers = await TelegramUser.countDocuments();
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

      await this.bot.sendMessage(chatId, infoMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error in handleInfo:', error);
      await this.sendErrorMessage(chatId, 'Failed to retrieve information.');
    }
  }

  private async handleImagine(msg: Message, match?: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const prompt = match[1]?.trim();
    
    try {
      if (!prompt) {
        await this.bot.sendMessage(chatId, '🎨 Please provide a description for the image you want to generate.\n\nExample: /imagine a beautiful sunset over mountains');
        return;
      }

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

      await this.updateUserUsage(chatId, 0, 100);
      
    } catch (error) {
      console.error('Error in handleImagine:', error);
      await this.sendErrorMessage(chatId, 'Failed to generate image. Please try again later.');
    }
  }

  private async handleMagic8Ball(msg: Message, match?: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const question = match[1]?.trim();
    
    try {
      if (!question) {
        await this.bot.sendMessage(chatId, '🎱 Please ask a question.\n\nExample: /8ball Will I have a good day?');
        return;
      }

      const response = this.magic8BallResponses[Math.floor(Math.random() * this.magic8BallResponses.length)];
      
      const replyMessage = `🎱 *Magic 8-Ball* 🎱

**Your Question:** "${question}"

**The Magic 8-Ball says:**
${response}

_Ask another question anytime!_ ✨`;

      await this.bot.sendMessage(chatId, replyMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleMagic8Ball:', error);
      await this.sendErrorMessage(chatId, 'Failed to consult the Magic 8-Ball.');
    }
  }

  private async handleWeather(msg: Message, match?: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const city = match[1]?.trim();
    
    try {
      if (!city) {
        await this.bot.sendMessage(chatId, '🌤️ Please provide a city name.\n\nExample: /weather London');
        return;
      }

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
      console.error('Error in handleWeather:', error);
      await this.sendErrorMessage(chatId, 'Failed to get weather information.');
    }
  }

  private async handleCalculate(msg: Message, match?: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const expression = match[1]?.trim();
    
    try {
      if (!expression) {
        await this.bot.sendMessage(chatId, '🧮 Please provide a mathematical expression.\n\nExample: /calculate 2 + 2 * 5');
        return;
      }

      // Simple math evaluation (secure implementation would use a proper math parser)
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      if (!sanitized) {
        await this.bot.sendMessage(chatId, '❌ Invalid expression. Please use only numbers and operators (+, -, *, /).');
        return;
      }

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
      console.error('Error in handleCalculate:', error);
      await this.sendErrorMessage(chatId, 'Failed to calculate the expression. Please check your input.');
    }
  }

  private async handleDefine(msg: Message, match?: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const word = match[1]?.trim();
    
    try {
      if (!word) {
        await this.bot.sendMessage(chatId, '📖 Please provide a word to define.\n\nExample: /define intelligence');
        return;
      }

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
      console.error('Error in handleDefine:', error);
      await this.sendErrorMessage(chatId, 'Failed to find definition.');
    }
  }

  private async handleUserMessage(msg: Message): Promise<void> {
    if (!this.bot || !msg.text || msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const user = msg.from;
    
    if (!user) return;

    try {
      // Simple usage check
      const canProceed = await this.checkUsageLimits(user.id);
      if (!canProceed) {
        await this.bot.sendMessage(chatId, '⚠️ You\'ve reached your daily usage limit. Please try again tomorrow.');
        return;
      }

      this.activeUsers.add(chatId);
      await this.initializeUser(user.id, user);

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
      await this.updateUserUsage(chatId, 1, 50);
      await this.saveChatMessage(chatId, userMessage, aiResponse);

    } catch (error) {
      console.error('Error in handleUserMessage:', error);
      await this.sendErrorMessage(chatId, 'An error occurred while processing your message.');
    }
  }

  /**
   * Enhanced AI response generation with structured logic
   * This method provides a more extensible architecture for AI interactions
   */
  private async generateIntelligentResponse(chatId: number, userMessage: string): Promise<string> {
    try {
      // Get chat history from database for context-aware responses
      const chatDoc = await TelegramChat.findOne({ telegramUserId: chatId });
      const chatHistory = chatDoc ? chatDoc.messages.slice(-5).map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
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
    } catch (error) {
      console.error('Error in generateIntelligentResponse:', error);
      return "I'm having trouble generating a response right now. Please try again.";
    }
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
      console.error('Error in handleCallbackQuery:', error);
      if (this.bot && query.id) {
        await this.bot.answerCallbackQuery(query.id, { text: 'Sorry, something went wrong!' });
      }
    }
  }

  // Admin command handlers (simplified)
  private async handleAdminStats(msg: Message): Promise<void> {
    if (!this.bot || !this.isAdmin(msg.from?.id)) return;
    
    const chatId = msg.chat.id;
    
    try {
      const allUsers = await TelegramUser.find();
      const totalMessages = allUsers.reduce((sum, user) => sum + user.messageCount, 0);
      const totalTokens = allUsers.reduce((sum, user) => sum + user.tokenCount, 0);
      const avgMessagesPerUser = allUsers.length > 0 ? Math.round(totalMessages / allUsers.length) : 0;
      
      const adminMessage = `
📊 *Admin: Nexus AI Statistics* 📊

**Users:**
👥 Total Users: ${allUsers.length}
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

      await this.bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleAdminStats:', error);
      await this.sendErrorMessage(chatId, 'Failed to retrieve statistics.');
    }
  }

  private async handleAdminBroadcast(msg: Message, match?: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !this.isAdmin(msg.from?.id) || !match) return;
    
    const chatId = msg.chat.id;
    const broadcastMessage = match[1]?.trim();
    
    try {
      if (!broadcastMessage) {
        await this.bot.sendMessage(chatId, '❌ Please provide a broadcast message.');
        return;
      }

      const allUsers = await TelegramUser.find();
      await this.bot.sendMessage(chatId, `📢 *Broadcasting message to ${allUsers.length} users...*`, { parse_mode: 'Markdown' });
      
      let successCount = 0;
      let failCount = 0;

      for (const user of allUsers) {
        try {
          await this.bot.sendMessage(user.telegramId, `📢 *Admin Broadcast*\n\n${broadcastMessage}\n\n_This message was sent to all Nexus AI users._`, { parse_mode: 'Markdown' });
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
          failCount++;
          console.error(`Failed to send broadcast to user ${user.telegramId}:`, error);
        }
      }

      await this.bot.sendMessage(chatId, `✅ Broadcast complete!\n\n📊 **Results:**\n• ✅ Successful: ${successCount}\n• ❌ Failed: ${failCount}`, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleAdminBroadcast:', error);
      await this.sendErrorMessage(chatId, 'Failed to broadcast message.');
    }
  }

  // Helper methods
  private async initializeUser(userId: number, user: any): Promise<void> {
    try {
      const existingUser = await TelegramUser.findOne({ telegramId: userId });
      
      if (!existingUser) {
        await TelegramUser.create({
          telegramId: userId,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          messageCount: 0,
          tokenCount: 0,
          joinDate: new Date(),
          lastActive: new Date(),
          isBlocked: false,
          dailyMessageCount: 0,
          dailyTokenCount: 0,
          lastResetDate: new Date()
        });
      } else {
        existingUser.lastActive = new Date();
        existingUser.username = user.username;
        existingUser.firstName = user.first_name;
        existingUser.lastName = user.last_name;
        await existingUser.save();
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  }

  private async updateUserUsage(userId: number, messages: number, tokens: number): Promise<void> {
    try {
      const user = await TelegramUser.findOne({ telegramId: userId });
      if (user) {
        user.messageCount += messages;
        user.tokenCount += tokens;
        user.dailyMessageCount += messages;
        user.dailyTokenCount += tokens;
        user.lastActive = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('Error updating user usage:', error);
    }
  }

  private async checkUsageLimits(userId: number): Promise<boolean> {
    try {
      const user = await TelegramUser.findOne({ telegramId: userId });
      if (!user) return true;

      // Reset daily counters if it's a new day
      const today = new Date().toDateString();
      const lastResetDay = user.lastResetDate.toDateString();
      if (today !== lastResetDay) {
        user.dailyMessageCount = 0;
        user.dailyTokenCount = 0;
        user.lastResetDate = new Date();
        await user.save();
      }

      return user.dailyMessageCount < this.MAX_MESSAGES_PER_DAY && 
             user.dailyTokenCount < this.MAX_TOKENS_PER_DAY;
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return true; // Allow on error to avoid blocking users
    }
  }

  private isAdmin(userId?: number): boolean {
    return userId === adminUID && adminUID !== 0;
  }

  private async saveChatMessage(userId: number, userMsg: string, botMsg: string): Promise<void> {
    try {
      let chatDoc = await TelegramChat.findOne({ telegramUserId: userId });
      
      if (!chatDoc) {
        chatDoc = await TelegramChat.create({
          telegramUserId: userId,
          messages: [],
          lastActivity: new Date()
        });
      }

      chatDoc.messages.push(
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

      await chatDoc.save();
    } catch (error) {
      console.error('Error saving chat message:', error);
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

  public isActive(): boolean {
    return this.bot !== null;
  }

  public getActiveUsers(): number {
    return this.activeUsers.size;
  }

  public async getTotalUsers(): Promise<number> {
    try {
      return await TelegramUser.countDocuments();
    } catch (error) {
      console.error('Error getting total users:', error);
      return 0;
    }
  }
}

// Also export the initialization function for backward compatibility
export const initializeBot = (aiService: AIService): TelegramBotService => {
  return new TelegramBotService(aiService);
};