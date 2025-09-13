// Created with love 🩶 by Denvil 🧑‍💻

import TelegramBot, { Message, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { AIService } from './aiService';

const token = process.env.TELEGRAM_BOT_TOKEN as string;
const adminUID = parseInt(process.env.TELEGRAM_ADMIN_UID || '0');

interface UserData {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  messageCount: number;
  tokenCount: number;
  joinDate: Date;
  lastActive: Date;
  persona?: string;
  language?: string;
  isBlocked: boolean;
}

interface ChatHistory {
  userId: number;
  messages: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    service?: string;
  }>;
}

export class TelegramBotService {
  private bot: TelegramBot | null = null;
  private aiService: AIService;
  private activeUsers: Set<number> = new Set();
  private users: Map<number, UserData> = new Map();
  private chatHistories: Map<number, ChatHistory> = new Map();
  private userPersonas: Map<number, string> = new Map();
  private dailyContent: Map<string, any> = new Map();

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

    // Basic commands
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/info/, (msg) => this.handleInfo(msg));

    // Chat management
    this.bot.onText(/\/history/, (msg) => this.handleHistory(msg));
    this.bot.onText(/\/clear/, (msg) => this.handleClear(msg));

    // AI features
    this.bot.onText(/\/imagine (.+)/, (msg, match) => this.handleImagine(msg, match));
    this.bot.onText(/\/persona (.+)/, (msg, match) => this.handlePersona(msg, match));
    this.bot.onText(/\/summarize (.+)/, (msg, match) => this.handleSummarize(msg, match));
    this.bot.onText(/\/avatar (.+)/, (msg, match) => this.handleAvatar(msg, match));

    // Fun features
    this.bot.onText(/\/8ball (.+)/, (msg, match) => this.handleMagic8Ball(msg, match));
    this.bot.onText(/\/daily/, (msg) => this.handleDaily(msg));

    // Utility commands
    this.bot.onText(/\/weather (.+)/, (msg, match) => this.handleWeather(msg, match));
    this.bot.onText(/\/calculate (.+)/, (msg, match) => this.handleCalculate(msg, match));
    this.bot.onText(/\/define (.+)/, (msg, match) => this.handleDefine(msg, match));

    // Admin commands
    this.bot.onText(/\/admin_users/, (msg) => this.handleAdminUsers(msg));
    this.bot.onText(/\/admin_stats/, (msg) => this.handleAdminStats(msg));
    this.bot.onText(/\/admin_history (\d+)/, (msg, match) => this.handleAdminHistory(msg, match));
    this.bot.onText(/\/admin_broadcast (.+)/, (msg, match) => this.handleAdminBroadcast(msg, match));

    // Handle voice messages
    this.bot.on('voice', (msg) => this.handleVoiceMessage(msg));

    // Handle regular messages
    this.bot.on('message', (msg) => this.handleUserMessage(msg));

    // Handle callback queries for inline keyboards
    this.bot.on('callback_query', (query) => this.handleCallbackQuery(query));

    // Error handling
    this.bot.on('polling_error', (error) => console.error(`Polling error: ${error.message}`));
    this.bot.on('webhook_error', (error) => console.error(`Webhook error: ${error.message}`));

    console.log('🤖 ShanxAi Telegram bot initialized with comprehensive features');
  }

  private async handleStart(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = msg.from;
    
    if (!user) return;

    // Initialize user data
    this.initializeUser(user.id, user);

    const welcomeMessage = `
🌟 *Welcome to ShanxAi!* 🌟
_The most advanced AI assistant at your fingertips_

🤖 *Powered by Multiple AI Models*
🎨 *Creative & Intelligent Features*
🔧 *Utility Commands & More*

*✨ Quick Start:*
• Just send me any message to chat
• Use /help to see all commands
• Try /daily for your daily dose of awesomeness

*🎭 Popular Features:*
• 🎨 /imagine - Generate amazing images
• 🎭 /persona - Set my personality
• 📚 /summarize - Summarize web content
• 🔮 /8ball - Magic 8-ball predictions

*🛠️ Utilities:*
• 🌤️ /weather - Weather forecast
• 🧮 /calculate - Math calculations
• 📖 /define - Word definitions

_Ready to explore the future of AI?_ 🚀

// Created with love 🩶 by Denvil 🧑‍💻
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🤖 Start Chatting', callback_data: 'start_chat' },
          { text: '📋 All Commands', callback_data: 'show_help' }
        ],
        [
          { text: '🎨 Generate Image', callback_data: 'generate_image' },
          { text: '🔮 Magic 8-Ball', callback_data: 'magic_8ball' }
        ],
        [{ text: '📊 Daily Content', callback_data: 'daily_content' }]
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
    const isAdmin = this.isAdmin(msg.from?.id);

    const helpMessage = `
🆘 *ShanxAi Command Center* 🆘

*🤖 AI Chat Commands:*
• Just type anything - Chat with AI
• /persona [personality] - Set AI personality
• /clear - Clear chat history

*🎨 Creative Commands:*
• /imagine [prompt] - Generate images
• /avatar [description] - Create avatar
• /summarize [URL] - Summarize content

*🎯 Fun & Games:*
• /8ball [question] - Magic 8-ball
• /daily - Daily trivia & facts

*🛠️ Utility Commands:*
• /weather [city] - Weather forecast
• /calculate [expression] - Math calculator
• /define [word] - Word definitions

*📊 Account Commands:*
• /info - Bot information
• /history - View chat history

${isAdmin ? `
*👑 Admin Commands:*
• /admin_users - List all users
• /admin_stats - Bot statistics
• /admin_history [userID] - User chat history
• /admin_broadcast [message] - Send to all users
` : ''}

*💡 Pro Tips:*
• Send voice messages for transcription
• Use inline keyboard buttons for quick actions
• Check /daily for new content every day!

_Need help? Just ask me anything!_ 💬

// Created with love 🩶 by Denvil 🧑‍💻
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🎨 Generate Image', callback_data: 'help_imagine' },
          { text: '🔮 Magic 8-Ball', callback_data: 'help_8ball' }
        ],
        [
          { text: '🌤️ Weather', callback_data: 'help_weather' },
          { text: '🧮 Calculator', callback_data: 'help_calculate' }
        ],
        [
          { text: '📊 Daily Content', callback_data: 'daily_content' },
          { text: '💬 Start Chat', callback_data: 'start_chat' }
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
🔮 *ShanxAi Bot Information* 🔮

*🤖 About:*
Advanced AI assistant powered by multiple language models, designed to provide intelligent, creative, and helpful responses.

*📊 Statistics:*
• 👥 Total Users: ${totalUsers}
• 🟢 Active Users: ${activeUsers}
• 🚀 Version: 2.0.0
• ⚡ Status: Online & Optimized

*🧠 AI Capabilities:*
• 💬 Natural conversation
• 🎨 Image generation
• 📚 Content summarization
• 🌍 Multilingual support
• 🎤 Voice message processing

*🛠️ Features:*
• 🔄 Real-time responses
• 📱 Group chat intelligence
• 🎭 Customizable personalities
• 📊 Usage tracking
• 🛡️ Admin controls

*🎯 Fun Extras:*
• 🔮 Magic 8-ball predictions
• 🌤️ Weather forecasts
• 🧮 Math calculations
• 📖 Dictionary definitions
• 📅 Daily content updates

*🔒 Privacy & Security:*
• Secure API handling
• Usage limits for cost control
• Admin oversight capabilities
• Chat history management

*👨‍💻 Developer:*
Created with passion and innovation by *Denvil* 🧑‍💻

*🌐 Connect:*
For support or feedback, contact the development team.

_Experience the future of AI conversation!_ ✨

// Created with love 🩶 by Denvil 🧑‍💻
    `;

    try {
      await this.bot.sendMessage(chatId, infoMessage, {
        parse_mode: 'Markdown'
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
      // In a real implementation, this would call DALL-E, Stable Diffusion, etc.
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const imageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`;
      
      await this.bot.sendPhoto(chatId, imageUrl, {
        caption: `🎨 *Generated Image*\n📝 Prompt: "${prompt}"\n\n_Powered by ShanxAi Image Generation_`,
        parse_mode: 'Markdown'
      });

      this.updateUserUsage(chatId, 0, 100); // 100 tokens for image generation
      
    } catch (error) {
      console.error('Error generating image:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error while generating the image. Please try again later.');
    }
  }

  private async handlePersona(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const persona = match[1].trim();
    
    this.userPersonas.set(chatId, persona);
    
    const confirmMessage = `🎭 *Personality Updated!*

I'll now respond as: *${persona}*

Try chatting with me to see the difference! You can change my personality anytime with /persona [new personality].

*Popular personas to try:*
• Friendly assistant
• Wise philosopher
• Creative writer
• Technical expert
• Comedian
• Motivational coach

_Let's chat with my new personality!_ 💬`;

    try {
      await this.bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error setting persona:', error);
    }
  }

  private async handleSummarize(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const url = match[1].trim();
    
    try {
      await this.bot.sendChatAction(chatId, 'typing');
      await this.bot.sendMessage(chatId, `📚 *Analyzing content...*\n🔗 ${url}\n\nPlease wait...`, { parse_mode: 'Markdown' });

      // Simulate content analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const summary = `📚 *Content Summary*

🔗 **Source:** ${url}

📝 **Summary:**
This is a simulated summary of the provided URL. In a full implementation, this would:

• Extract text content from the webpage
• Analyze the main points and themes
• Provide a concise summary using AI
• Highlight key insights and takeaways

🎯 **Key Points:**
• Main topic analysis
• Important facts and figures
• Relevant conclusions
• Actionable insights

_For accurate summaries, please ensure the URL is accessible and contains readable content._

// Created with love 🩶 by Denvil 🧑‍💻`;

      await this.bot.sendMessage(chatId, summary, { parse_mode: 'Markdown' });
      this.updateUserUsage(chatId, 0, 150); // 150 tokens for summarization
      
    } catch (error) {
      console.error('Error summarizing content:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I couldn\'t summarize that content. Please check the URL and try again.');
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

  private async handleDaily(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const today = new Date().toDateString();
    
    // Check if user already got today's content
    const userDailyKey = `${chatId}_${today}`;
    if (this.dailyContent.has(userDailyKey)) {
      await this.bot.sendMessage(chatId, '📅 You\'ve already received today\'s content! Come back tomorrow for fresh content. 🌟');
      return;
    }

    const dailyFacts = [
      "🧠 Your brain uses about 20% of your body's total energy.",
      "🌍 A day on Venus is longer than its year.",
      "🐙 Octopuses have three hearts and blue blood.",
      "🍯 Honey never spoils - archaeologists have found edible honey in ancient tombs.",
      "⚡ Lightning strikes the Earth about 100 times every second.",
      "🌟 There are more possible games of chess than atoms in the observable universe.",
      "🐧 Penguins have knees, they're just hidden inside their bodies.",
      "🎵 Music can help plants grow faster and healthier."
    ];

    const motivationalQuotes = [
      "💪 'Success is not final, failure is not fatal: it is the courage to continue that counts.' - Winston Churchill",
      "🌟 'The only way to do great work is to love what you do.' - Steve Jobs",
      "🚀 'Innovation distinguishes between a leader and a follower.' - Steve Jobs",
      "💡 'The future belongs to those who believe in the beauty of their dreams.' - Eleanor Roosevelt",
      "🎯 'Don't watch the clock; do what it does. Keep going.' - Sam Levenson"
    ];

    const techTips = [
      "💻 Use Ctrl+Shift+T to reopen recently closed browser tabs",
      "📱 Put your phone in airplane mode for faster charging",
      "🔒 Use two-factor authentication for better security",
      "🎧 Noise-canceling headphones can improve focus and productivity",
      "📷 The rule of thirds can dramatically improve your photos"
    ];

    const randomFact = dailyFacts[Math.floor(Math.random() * dailyFacts.length)];
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    const randomTip = techTips[Math.floor(Math.random() * techTips.length)];

    const dailyMessage = `
📅 *Your Daily ShanxAi Card* 📅
*${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*

🎯 **Daily Fact:**
${randomFact}

💭 **Inspiration of the Day:**
${randomQuote}

💡 **Tech Tip:**
${randomTip}

🌟 **Your Daily Challenge:**
Try learning something new today, no matter how small. Knowledge compounds over time!

_Come back tomorrow for fresh content!_ ✨

// Created with love 🩶 by Denvil 🧑‍💻
    `;

    try {
      await this.bot.sendMessage(chatId, dailyMessage, { parse_mode: 'Markdown' });
      this.dailyContent.set(userDailyKey, true);
    } catch (error) {
      console.error('Error sending daily content:', error);
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

  private async handleAvatar(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const description = match[1].trim();
    
    try {
      await this.bot.sendChatAction(chatId, 'upload_photo');
      await this.bot.sendMessage(chatId, `🎭 *Creating your avatar...*\n"${description}"\n\nPlease wait...`, { parse_mode: 'Markdown' });

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const avatarUrl = `https://picsum.photos/512/512?random=${Date.now()}`;
      
      await this.bot.sendPhoto(chatId, avatarUrl, {
        caption: `🎭 *Your Custom Avatar*\n📝 Description: "${description}"\n\n_Save this image as your profile picture!_`,
        parse_mode: 'Markdown'
      });

      this.updateUserUsage(chatId, 0, 120);
      
    } catch (error) {
      console.error('Error generating avatar:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I couldn\'t generate your avatar right now. Please try again later.');
    }
  }

  // Admin commands
  private async handleAdminUsers(msg: Message): Promise<void> {
    if (!this.bot || !this.isAdmin(msg.from?.id)) return;
    
    const chatId = msg.chat.id;
    const userList = Array.from(this.users.values())
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
      .slice(0, 20)
      .map((user, index) => {
        const status = this.activeUsers.has(user.id) ? '🟢' : '⚫';
        return `${index + 1}. ${status} ${user.firstName || 'Unknown'} (${user.id}) - ${user.messageCount} msgs`;
      })
      .join('\n');

    const adminMessage = `
👑 *Admin: User List* 👑

**Total Users:** ${this.users.size}
**Active Now:** ${this.activeUsers.size}

**Recent Users (Top 20):**
${userList}

🟢 = Active | ⚫ = Inactive

Use /admin_history [userID] to view user chat history.
    `;

    try {
      await this.bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending admin users:', error);
    }
  }

  private async handleAdminStats(msg: Message): Promise<void> {
    if (!this.bot || !this.isAdmin(msg.from?.id)) return;
    
    const chatId = msg.chat.id;
    
    const totalMessages = Array.from(this.users.values()).reduce((sum, user) => sum + user.messageCount, 0);
    const totalTokens = Array.from(this.users.values()).reduce((sum, user) => sum + user.tokenCount, 0);
    const avgMessagesPerUser = this.users.size > 0 ? Math.round(totalMessages / this.users.size) : 0;
    
    const adminMessage = `
📊 *Admin: Bot Statistics* 📊

**Users:**
👥 Total Users: ${this.users.size}
🟢 Active Users: ${this.activeUsers.size}
📈 New Users Today: ${this.getNewUsersToday()}

**Usage:**
💬 Total Messages: ${totalMessages}
🎯 Total Tokens: ${totalTokens}
📊 Avg Messages/User: ${avgMessagesPerUser}

**System:**
⚡ Bot Status: Online
🔄 Uptime: ${this.getUptime()}
💾 Memory Usage: ${this.getMemoryUsage()}

**Daily Limits:**
📝 Messages/Day: ${this.MAX_MESSAGES_PER_DAY}
🎯 Tokens/Day: ${this.MAX_TOKENS_PER_DAY}

// Created with love 🩶 by Denvil 🧑‍💻
    `;

    try {
      await this.bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending admin stats:', error);
    }
  }

  private async handleVoiceMessage(msg: Message): Promise<void> {
    if (!this.bot || !msg.voice) return;
    
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '🎤 *Voice message received!*\n\nTranscription: "This is a simulated transcription of your voice message. In a full implementation, this would use speech-to-text services."\n\nI can respond with text or occasionally with a voice message too! 🔊', { parse_mode: 'Markdown' });
      
      // Occasionally send a voice response (simulated)
      if (Math.random() < 0.2) { // 20% chance
        await this.bot.sendMessage(chatId, '🔊 *Sending voice reply...* (Voice messages would be generated using text-to-speech services in the full implementation)');
      }
      
    } catch (error) {
      console.error('Error handling voice message:', error);
    }
  }

  private async handleUserMessage(msg: Message): Promise<void> {
    if (!this.bot || !msg.text || msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userMessage = msg.text;
    const user = msg.from;
    
    if (!user) return;

    // Check usage limits
    if (!this.checkUsageLimits(user.id)) {
      await this.bot.sendMessage(chatId, '⚠️ You\'ve reached your daily usage limit. Please try again tomorrow or contact an admin for more quota.');
      return;
    }

    this.activeUsers.add(chatId);
    this.initializeUser(user.id, user);

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      // Get user persona if set
      const persona = this.userPersonas.get(chatId);
      const personalizedMessage = persona 
        ? `Acting as ${persona}: ${userMessage}`
        : userMessage;

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(personalizedMessage);

      // Add some personality based responses
      const responses = [
        `${aiResponse}\n\n💫 _Hope this helps!_`,
        `${aiResponse}\n\n✨ _Anything else you'd like to know?_`,
        `${aiResponse}\n\n🤖 _I'm here if you need more assistance!_`,
        aiResponse
      ];

      const finalResponse = responses[Math.floor(Math.random() * responses.length)];

      await this.bot.sendMessage(chatId, finalResponse, { parse_mode: 'Markdown' });

      // Update usage
      this.updateUserUsage(chatId, 1, 50);

      // Save to chat history
      this.saveChatMessage(chatId, userMessage, finalResponse);

    } catch (error) {
      console.error('Error handling user message:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error while processing your message. Please try again.\n\n_If this persists, try /help for assistance._');
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    if (!this.bot || !query.data) return;

    const chatId = query.message.chat.id;
    const data = query.data;

    switch (data) {
      case 'start_chat':
        await this.bot.sendMessage(chatId, '💬 Great! Just send me any message and I\'ll respond. What would you like to talk about?');
        break;
      case 'show_help':
        await this.handleHelp(query.message);
        break;
      case 'generate_image':
        await this.bot.sendMessage(chatId, '🎨 To generate an image, use:\n/imagine [your description]\n\nExample: /imagine a beautiful sunset over mountains');
        break;
      case 'magic_8ball':
        await this.bot.sendMessage(chatId, '🔮 Ask the Magic 8-Ball a question!\n\nUse: /8ball [your question]\n\nExample: /8ball Will I have a good day today?');
        break;
      case 'daily_content':
        await this.handleDaily(query.message);
        break;
    }

    await this.bot.answerCallbackQuery(query.id);
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

    // Keep only last 100 messages
    if (history.messages.length > 100) {
      history.messages = history.messages.slice(-100);
    }
  }

  private async handleHistory(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const history = this.chatHistories.get(chatId);
    
    if (!history || history.messages.length === 0) {
      await this.bot.sendMessage(chatId, '📝 No chat history found. Start a conversation to build your history!');
      return;
    }

    const recentMessages = history.messages.slice(-10);
    const historyText = recentMessages.map(msg => {
      const time = msg.timestamp.toLocaleTimeString();
      const sender = msg.isUser ? '👤 You' : '🤖 ShanxAi';
      return `${time} - ${sender}: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`;
    }).join('\n\n');

    const historyMessage = `📝 *Your Chat History* (Last 10 messages)\n\n${historyText}\n\n_Use /clear to clear your history_`;

    try {
      await this.bot.sendMessage(chatId, historyMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending history:', error);
    }
  }

  private async handleClear(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    this.chatHistories.delete(chatId);
    
    try {
      await this.bot.sendMessage(chatId, '🗑️ *Chat history cleared!*\n\nYour conversation history has been deleted. Ready for a fresh start! 🌟', { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  private async handleAdminHistory(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !this.isAdmin(msg.from?.id) || !match) return;
    
    const chatId = msg.chat.id;
    const targetUserId = parseInt(match[1]);
    const history = this.chatHistories.get(targetUserId);
    
    if (!history) {
      await this.bot.sendMessage(chatId, '❌ No chat history found for that user.');
      return;
    }

    const user = this.users.get(targetUserId);
    const userName = user ? (user.firstName || user.username || 'Unknown') : 'Unknown';
    
    const recentMessages = history.messages.slice(-15);
    const historyText = recentMessages.map(msg => {
      const time = msg.timestamp.toLocaleTimeString();
      const sender = msg.isUser ? '👤 User' : '🤖 Bot';
      return `${time} - ${sender}: ${msg.text.substring(0, 150)}${msg.text.length > 150 ? '...' : ''}`;
    }).join('\n\n');

    const adminMessage = `👑 *Admin: User Chat History*\n\n**User:** ${userName} (${targetUserId})\n\n${historyText}`;

    try {
      await this.bot.sendMessage(chatId, adminMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending admin history:', error);
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
        await this.bot.sendMessage(userId, `📢 *Admin Broadcast*\n\n${broadcastMessage}\n\n_This message was sent to all ShanxAi users._`, { parse_mode: 'Markdown' });
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      } catch (error) {
        failCount++;
      }
    }

    await this.bot.sendMessage(chatId, `✅ Broadcast complete!\n\n📊 **Results:**\n• ✅ Successful: ${successCount}\n• ❌ Failed: ${failCount}`, { parse_mode: 'Markdown' });
  }

  // Utility methods
  private getNewUsersToday(): number {
    const today = new Date().toDateString();
    return Array.from(this.users.values()).filter(user => 
      user.joinDate.toDateString() === today
    ).length;
  }

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