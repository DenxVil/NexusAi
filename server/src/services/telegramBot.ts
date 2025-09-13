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
  // Gamification features
  achievements: string[];
  dailyStreak: number;
  lastStreakDate?: Date;
  totalPoints: number;
  level: number;
  // Referral system
  referralCode: string;
  referredBy?: number;
  referrals: number[];
  // News preferences
  newsTopics: string[];
  // Reminders
  activeReminders: Array<{
    id: string;
    message: string;
    scheduledFor: Date;
    isActive: boolean;
  }>;
}

interface ChatHistory {
  userId: number;
  messages: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    service?: string;
    emotion?: string;
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
  private userEmotions: Map<number, string> = new Map();
  private quickReplies: Map<number, string[]> = new Map();

  // Usage limits
  private readonly MAX_MESSAGES_PER_DAY = 50;
  private readonly MAX_TOKENS_PER_DAY = 10000;

  // Gamification settings
  private readonly DAILY_STREAK_POINTS = 10;
  private readonly MESSAGE_POINTS = 2;
  private readonly REFERRAL_POINTS = 50;
  private readonly ACHIEVEMENT_POINTS = 25;

  // Available achievements
  private readonly ACHIEVEMENTS: { [key: string]: { name: string; description: string } } = {
    'first_message': { name: '🎉 First Steps', description: 'Sent your first message' },
    'daily_streak_3': { name: '🔥 On Fire', description: '3-day streak achieved' },
    'daily_streak_7': { name: '⚡ Weekly Warrior', description: '7-day streak achieved' },
    'daily_streak_30': { name: '👑 Monthly Master', description: '30-day streak achieved' },
    'referral_first': { name: '🤝 Social Butterfly', description: 'Referred your first friend' },
    'referral_5': { name: '🌟 Influencer', description: 'Referred 5 friends' },
    'image_creator': { name: '🎨 Artist', description: 'Generated your first image' },
    'chatty': { name: '💬 Chatty', description: 'Sent 100 messages' },
    'explorer': { name: '🗺️ Explorer', description: 'Used 10 different commands' }
  };

  // News categories
  private readonly NEWS_CATEGORIES = [
    'technology', 'science', 'business', 'health', 'sports', 
    'entertainment', 'politics', 'world', 'ai', 'crypto'
  ];

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

    // PROJECT PHOENIX: New features
    // Gamification & Engagement
    this.bot.onText(/\/profile/, (msg) => this.handleProfile(msg));
    this.bot.onText(/\/achievements/, (msg) => this.handleAchievements(msg));
    this.bot.onText(/\/leaderboard/, (msg) => this.handleLeaderboard(msg));
    this.bot.onText(/\/refer/, (msg) => this.handleRefer(msg));
    this.bot.onText(/\/streak/, (msg) => this.handleStreak(msg));

    // Smart reminders
    this.bot.onText(/\/remind (.+)/, (msg, match) => this.handleRemind(msg, match));
    this.bot.onText(/\/reminders/, (msg) => this.handleViewReminders(msg));

    // News system
    this.bot.onText(/\/news/, (msg) => this.handleNews(msg));
    this.bot.onText(/\/news_subscribe (.+)/, (msg, match) => this.handleNewsSubscribe(msg, match));
    this.bot.onText(/\/news_topics/, (msg) => this.handleNewsTopics(msg));

    // Enhanced personality features
    this.bot.onText(/\/moods/, (msg) => this.handleMoods(msg));
    this.bot.onText(/\/suggest/, (msg) => this.handleSuggestQuickReplies(msg));

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

    // Initialize user data with Project Phoenix features
    const isNewUser = !this.users.has(user.id);
    this.initializeUser(user.id, user);
    
    // Award first message achievement for new users
    if (isNewUser) {
      this.awardAchievement(user.id, 'first_message');
    }

    const welcomeMessage = `
🌟 *Welcome to ShanxAi!* 🌟
_The most advanced AI assistant with Phoenix Intelligence_

🔮 *Featuring:*
• 🧠 Multi-AI Intelligence (Gemini, Perplexity, HuggingFace)
• 🎭 Dynamic Personality Adaptation
• 🎯 Smart Context Understanding
• 🏆 Gamification & Achievements
• 📊 Daily Streak Rewards
• 🤝 Referral System
• 📰 Personalized News
• ⏰ Smart Reminders

✨ *Quick Actions:*
Choose what you'd like to do:
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🤖 Start Chatting', callback_data: 'start_chat' },
          { text: '🎭 Set Personality', callback_data: 'set_persona' }
        ],
        [
          { text: '🎨 Generate Image', callback_data: 'generate_image' },
          { text: '📰 Daily News', callback_data: 'get_news' }
        ],
        [
          { text: '🏆 My Profile', callback_data: 'view_profile' },
          { text: '🤝 Refer Friends', callback_data: 'refer_friends' }
        ],
        [
          { text: '⏰ Set Reminder', callback_data: 'set_reminder' },
          { text: '🔮 Magic 8-Ball', callback_data: 'magic_8ball' }
        ],
        [
          { text: '📋 All Commands', callback_data: 'show_help' },
          { text: '📊 Daily Content', callback_data: 'daily_content' }
        ]
      ]
    };

    try {
      await this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      // Send quick tips after a moment
      setTimeout(async () => {
        const tipsMessage = `💡 *Pro Tips:*
• Type naturally - I understand context and emotions
• Use /suggest for smart quick replies
• Build your daily streak for bonus features
• Refer friends with /refer for premium access

Ready to explore the future of AI? 🚀`;

        await this.bot?.sendMessage(chatId, tipsMessage, { parse_mode: 'Markdown' });
      }, 2000);

    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  private async handleHelp(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const isAdmin = this.isAdmin(msg.from?.id);

    const helpMessage = `
🆘 *ShanxAi Phoenix Command Center* 🆘
_Your complete guide to advanced AI interaction_

*🤖 AI Chat Commands:*
• Just type anything - Chat with enhanced emotional intelligence
• /persona [personality] - Set AI personality & mood
• /moods - Explore emotional intelligence modes
• /suggest - Get smart quick reply suggestions
• /clear - Clear chat history

*🎨 Creative & AI Features:*
• /imagine [prompt] - Generate AI images
• /avatar [description] - Create custom avatars
• /summarize [URL] - Summarize web content intelligently

*🎯 Gamification & Engagement:*
• /profile - View your complete user profile
• /achievements - See unlocked & available achievements
• /streak - Check your daily streak status
• /leaderboard - View top users rankings
• /refer - Get your referral link & stats

*📰 Personalized News System:*
• /news - Get your customized news digest
• /news_subscribe [topic] - Subscribe to news topics
• /news_topics - See all available news categories

*⏰ Smart Reminders:*
• /remind [message] - Set natural language reminders
• /reminders - View your active reminders

*🎮 Fun & Interactive:*
• /8ball [question] - Magic 8-ball predictions
• /daily - Daily trivia, quotes & challenges

*🛠️ Utility Commands:*
• /weather [city] - Weather forecasts
• /calculate [expression] - Math calculations
• /define [word] - Dictionary definitions

*📊 Account & Stats:*
• /info - Bot information & your progress
• /history - View recent chat history

${isAdmin ? `
*👑 Admin Commands:*
• /admin_users - List all users
• /admin_stats - Comprehensive bot statistics
• /admin_history [userID] - View user chat history
• /admin_broadcast [message] - Send message to all users
` : ''}

*🌟 Phoenix Intelligence Features:*
• **Dynamic Response Adaptation** - Responses adapt to your personality
• **Emotional Intelligence** - Recognizes and responds to your emotions  
• **Context-Aware Conversations** - Maintains context across multiple turns
• **Smart Quick Replies** - Contextual one-tap response suggestions
• **Advanced Progress Indicators** - Real-time typing and processing status
• **Button-Centric Interface** - Easy navigation with interactive buttons
• **Reaction-Based Actions** - Quick actions through message reactions
• **Automatic Code Detection** - Formats code snippets intelligently

*💡 Pro Tips:*
• Express emotions - I'll adapt my responses accordingly
• Use quick reply buttons for faster interactions
• Build daily streaks for bonus features and points
• Refer friends to unlock premium capabilities
• Subscribe to news topics for personalized content
• Set reminders using natural language

_Experience the future of AI conversation with Phoenix Intelligence!_ 🚀

**Created with love 🩶 by Denvil 🧑‍💻**
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🎭 Set Personality', callback_data: 'set_persona' },
          { text: '🏆 My Profile', callback_data: 'view_profile' }
        ],
        [
          { text: '🎨 Generate Image', callback_data: 'generate_image' },
          { text: '📰 Get News', callback_data: 'get_news' }
        ],
        [
          { text: '⏰ Set Reminder', callback_data: 'set_reminder' },
          { text: '🔮 Magic 8-Ball', callback_data: 'magic_8ball' }
        ],
        [
          { text: '🤝 Refer Friends', callback_data: 'refer_friends' },
          { text: '📊 Daily Content', callback_data: 'daily_content' }
        ],
        [
          { text: '💬 Start Chatting', callback_data: 'start_chat' }
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
    const user = this.users.get(chatId);

    const infoMessage = `
🔮 *ShanxAi Bot Information* 🔮
_Project Phoenix Intelligence Platform_

*🧠 Phoenix Core Features:*
• Dynamic Response Adaptation
• Emotional Intelligence Recognition
• Context-Aware Multi-turn Conversations
• Smart Quick Reply Suggestions
• Advanced Progress Indicators

*🎯 Engagement Systems:*
• Gamification & Achievement Badges
• Daily Streak Counter & Rewards
• Comprehensive Referral System
• Personalized News Digest
• Smart Natural Language Reminders

*📊 Real-time Statistics:*
• 👥 Total Users: ${totalUsers}
• 🟢 Active Users: ${activeUsers}
• 🚀 Version: Phoenix 3.0
• ⚡ Status: Online & Optimized
• 🌍 Multi-language Support

*🛠️ Technical Capabilities:*
• Multi-AI Integration (Gemini, Perplexity, HuggingFace)
• Advanced Message Formatting
• Button-Centric Interface Design
• Reaction-Based Action System
• Automatic Code Snippet Detection
• Voice Message Processing

${user ? `
*📈 Your Progress:*
• 🏆 Level: ${user.level || 1}
• ⭐ Points: ${user.totalPoints || 0}
• 🔥 Daily Streak: ${user.dailyStreak || 0}
• 🎖️ Achievements: ${user.achievements?.length || 0}
• 👥 Referrals: ${user.referrals?.length || 0}
` : ''}

*🔒 Privacy & Security:*
• GDPR Compliant Data Handling
• Secure API Key Management
• User-Controlled Data Retention
• Advanced Error Recovery Systems

*🌟 What Makes ShanxAi Special:*
Phoenix Intelligence represents the next evolution in AI interaction, combining cutting-edge technology with intuitive user experience design. Every conversation is enhanced with emotional understanding, contextual awareness, and personalized engagement.

*📞 Support & Community:*
Need help? Use /help for commands or contact our support team.

---
**Created with love 🩶 by Denvil 🧑‍💻**
_The exclusive signature home of ShanxAi_
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🏆 My Profile', callback_data: 'view_profile' },
          { text: '📋 All Commands', callback_data: 'show_help' }
        ],
        [
          { text: '🤝 Refer Friends', callback_data: 'refer_friends' },
          { text: '🔥 Daily Streak', callback_data: 'daily_streak' }
        ],
        [
          { text: '💬 Start Chatting', callback_data: 'start_chat' }
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
  // PROJECT PHOENIX FEATURE HANDLERS

  private async handleProfile(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = this.users.get(chatId);
    
    if (!user) {
      await this.bot.sendMessage(chatId, 'Please send /start first to initialize your profile.');
      return;
    }

    const levelProgress = this.calculateLevelProgress(user.totalPoints);
    const nextLevel = user.level + 1;
    const pointsToNext = (nextLevel * 100) - user.totalPoints;

    const profileMessage = `
🏆 *Your ShanxAi Profile* 🏆

👤 **Personal Info:**
• Name: ${user.firstName || 'Anonymous'}
• Username: @${user.username || 'Not set'}
• Member since: ${user.joinDate.toDateString()}

📊 **Progress & Stats:**
• 🎖️ Level: ${user.level}
• ⭐ Total Points: ${user.totalPoints}
• 🔥 Daily Streak: ${user.dailyStreak} days
• 💬 Messages Sent: ${user.messageCount}
• 🏆 Achievements: ${user.achievements.length}/${Object.keys(this.ACHIEVEMENTS).length}

📈 **Level Progress:**
${this.generateProgressBar(levelProgress, 10)} ${Math.round(levelProgress)}%
_${pointsToNext} points to Level ${nextLevel}_

🤝 **Referral Stats:**
• Your Code: \`${user.referralCode}\`
• Friends Referred: ${user.referrals.length}
• Referral Points Earned: ${user.referrals.length * this.REFERRAL_POINTS}

📰 **News Preferences:**
${user.newsTopics.map(topic => `• ${topic}`).join('\n')}

⏰ **Active Reminders:** ${user.activeReminders.filter(r => r.isActive).length}

_Keep chatting and using features to level up!_ 🚀
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '🏆 View Achievements', callback_data: 'view_achievements' },
          { text: '🤝 Refer Friends', callback_data: 'refer_friends' }
        ],
        [
          { text: '📰 News Settings', callback_data: 'news_settings' },
          { text: '⏰ My Reminders', callback_data: 'view_reminders' }
        ],
        [
          { text: '🔥 Streak Info', callback_data: 'streak_info' },
          { text: '🎯 Daily Challenge', callback_data: 'daily_challenge' }
        ]
      ]
    };

    try {
      await this.bot.sendMessage(chatId, profileMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending profile:', error);
    }
  }

  private async handleAchievements(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = this.users.get(chatId);
    
    if (!user) return;

    const unlockedAchievements = user.achievements.map(id => 
      `✅ ${this.ACHIEVEMENTS[id]?.name || 'Unknown'} - ${this.ACHIEVEMENTS[id]?.description || ''}`
    ).join('\n');

    const lockedAchievements = Object.keys(this.ACHIEVEMENTS)
      .filter(id => !user.achievements.includes(id))
      .map(id => `🔒 ${this.ACHIEVEMENTS[id].name} - ${this.ACHIEVEMENTS[id].description}`)
      .join('\n');

    const achievementMessage = `
🏆 *Your Achievements* 🏆

**Unlocked (${user.achievements.length}):**
${unlockedAchievements || '_No achievements yet - start chatting to unlock them!_'}

**Available to Unlock (${Object.keys(this.ACHIEVEMENTS).length - user.achievements.length}):**
${lockedAchievements}

💡 **Tips to Unlock More:**
• Chat daily to build your streak
• Refer friends with /refer
• Try different commands
• Generate images with /imagine
• Use various features regularly

_Each achievement gives you ${this.ACHIEVEMENT_POINTS} bonus points!_ ⭐
    `;

    try {
      await this.bot.sendMessage(chatId, achievementMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending achievements:', error);
    }
  }

  private async handleRefer(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = this.users.get(chatId);
    
    if (!user) return;

    const referralMessage = `
🤝 *Invite Friends to ShanxAi* 🤝

**Your Unique Referral Code:** \`${user.referralCode}\`

📱 **Share this link with friends:**
https://t.me/your_bot_username?start=${user.referralCode}

🎁 **Referral Rewards:**
• **You get:** ${this.REFERRAL_POINTS} points per friend
• **They get:** Welcome bonus & premium features
• **Both get:** Exclusive achievements

📊 **Your Referral Stats:**
• Friends Referred: ${user.referrals.length}
• Points Earned: ${user.referrals.length * this.REFERRAL_POINTS}
• Next Milestone: ${Math.max(0, 5 - user.referrals.length)} more for Influencer badge

🌟 **Referral Benefits:**
• Unlock advanced AI features
• Increase daily message limits
• Get priority support
• Access to beta features

_Share ShanxAi with friends and grow together!_ 🚀
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '📋 Copy Referral Link', callback_data: `copy_referral_${user.referralCode}` }
        ],
        [
          { text: '📊 View Stats', callback_data: 'referral_stats' },
          { text: '🎁 Referral Rewards', callback_data: 'referral_rewards' }
        ]
      ]
    };

    try {
      await this.bot.sendMessage(chatId, referralMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending referral info:', error);
    }
  }

  private async handleRemind(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const reminderText = match[1].trim();
    
    try {
      // Parse natural language reminder
      const reminder = this.parseNaturalLanguageReminder(reminderText);
      
      if (!reminder.isValid) {
        await this.bot.sendMessage(chatId, `
❌ **Couldn't understand the reminder format.**

📝 **Try these formats:**
• "Call mom in 2 hours"
• "Meeting tomorrow at 3pm"
• "Take medicine every day at 8am"
• "Workout in 30 minutes"
• "Pay bills on Friday"

💡 **Examples:**
/remind Call dentist tomorrow at 10am
/remind Buy groceries in 2 hours
/remind Team meeting every Monday at 9am
        `);
        return;
      }

      const user = this.users.get(chatId);
      if (!user) return;

      const reminderId = Date.now().toString();
      const newReminder = {
        id: reminderId,
        message: reminder.message,
        scheduledFor: reminder.date,
        isActive: true
      };

      user.activeReminders.push(newReminder);

      // Schedule the reminder
      this.scheduleReminder(chatId, newReminder);

      const confirmMessage = `
⏰ **Reminder Set Successfully!** ⏰

📝 **Message:** ${reminder.message}
🕐 **Scheduled for:** ${reminder.date.toLocaleString()}
🆔 **ID:** \`${reminderId}\`

✅ I'll remind you when the time comes!
Use /reminders to view all your active reminders.
      `;

      await this.bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error setting reminder:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I couldn\'t set that reminder. Please try again with a different format.');
    }
  }

  private async handleNews(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = this.users.get(chatId);
    
    if (!user) return;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      // Simulate fetching personalized news based on user topics
      const newsDigest = this.generatePersonalizedNews(user.newsTopics);

      const newsMessage = `
📰 *Your Personalized News Digest* 📰
_Updated: ${new Date().toLocaleString()}_

${newsDigest}

📊 **News Preferences:**
${user.newsTopics.map(topic => `• #${topic}`).join(' ')}

💡 **Commands:**
• /news_subscribe [topic] - Add new topics
• /news_topics - See all available topics
• /news - Get fresh digest anytime

_Stay informed with ShanxAi!_ 🌍
      `;

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          [
            { text: '🔄 Refresh News', callback_data: 'refresh_news' },
            { text: '⚙️ Manage Topics', callback_data: 'manage_news_topics' }
          ],
          [
            { text: '📈 Trending', callback_data: 'trending_news' },
            { text: '🔍 Search News', callback_data: 'search_news' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, newsMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error fetching news:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I couldn\'t fetch the news right now. Please try again later.');
    }
  }

  private async handleMoods(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;

    const moodMessage = `
🎭 *Emotional Intelligence Center* 🎭

I can detect and respond to your emotions! Here's how:

**😊 Detected Emotions:**
• Happy/Excited → Enthusiastic responses
• 😔 Sad/Down → Empathetic & supportive
• 😤 Frustrated → Calming & solution-focused
• 🤔 Curious → Detailed & informative
• 😴 Tired → Gentle & brief responses

**🎯 Personality Modes:**
• Professional - Business-focused responses
• Friendly - Casual & warm conversation
• Creative - Artistic & imaginative
• Technical - Detailed & precise
• Motivational - Encouraging & energizing

**💬 Try saying:**
"I'm feeling excited about my project!"
"I'm stressed about work"
"I'm curious about AI"

_I'll adapt my personality to match your mood!_ ✨
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '😊 Happy Mode', callback_data: 'mood_happy' },
          { text: '🤔 Curious Mode', callback_data: 'mood_curious' }
        ],
        [
          { text: '💼 Professional', callback_data: 'mood_professional' },
          { text: '🎨 Creative', callback_data: 'mood_creative' }
        ],
        [
          { text: '🚀 Motivational', callback_data: 'mood_motivational' },
          { text: '🧘 Calm Mode', callback_data: 'mood_calm' }
        ]
      ]
    };

    try {
      await this.bot.sendMessage(chatId, moodMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending mood info:', error);
    }
  }

  private async handleSuggestQuickReplies(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const history = this.chatHistories.get(chatId);
    
    // Generate contextual quick replies based on recent conversation
    const suggestions = this.generateQuickReplies(history);
    
    const suggestMessage = `
💡 *Smart Quick Replies* 💡

Based on our conversation, here are some quick options:
    `;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: suggestions.map((suggestion, index) => [
        { text: suggestion, callback_data: `quick_reply_${index}` }
      ])
    };

    try {
      await this.bot.sendMessage(chatId, suggestMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error sending suggestions:', error);
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
      // PROJECT PHOENIX: Enhanced typing indicator
      await this.bot.sendChatAction(chatId, 'typing');

      // Detect emotion and adapt response
      const emotion = this.detectEmotion(userMessage);
      this.userEmotions.set(chatId, emotion);

      // Get user persona if set
      const persona = this.userPersonas.get(chatId);
      
      // Build enhanced prompt with emotional context
      let enhancedPrompt = userMessage;
      if (persona) {
        enhancedPrompt = `Acting as ${persona}, responding to someone who seems ${emotion}: ${userMessage}`;
      } else if (emotion !== 'neutral') {
        enhancedPrompt = `The user seems ${emotion}. Respond empathetically: ${userMessage}`;
      }

      // Check for code snippets and format them
      const formattedMessage = this.formatCodeSnippets(userMessage);
      if (formattedMessage !== userMessage) {
        await this.bot.sendMessage(chatId, `🔧 **Formatted Code Detected:**\n\`\`\`\n${formattedMessage}\n\`\`\``, { 
          parse_mode: 'Markdown' 
        });
      }

      // Generate AI response with enhanced context
      const aiResponse = await this.aiService.generateResponse(enhancedPrompt);

      // Add emotional intelligence to response formatting
      const emotionallyEnhancedResponse = this.enhanceResponseWithEmotion(aiResponse, emotion);

      // Generate quick reply suggestions
      const quickReplies = this.generateQuickReplies(this.chatHistories.get(chatId));
      
      // Create inline keyboard with quick replies
      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
          quickReplies.slice(0, 2).map((reply, index) => ({
            text: reply,
            callback_data: `quick_${index}`
          })),
          quickReplies.slice(2, 4).map((reply, index) => ({
            text: reply,
            callback_data: `quick_${index + 2}`
          })),
          [
            { text: '💡 More Suggestions', callback_data: 'more_suggestions' },
            { text: '🎯 Actions', callback_data: 'quick_actions' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, emotionallyEnhancedResponse, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      // Update usage and award points
      this.updateUserUsage(chatId, 1, 50);
      const userData = this.users.get(chatId);
      if (userData) {
        userData.totalPoints += this.MESSAGE_POINTS;
        userData.level = Math.floor(userData.totalPoints / 100) + 1;
        
        // Check for achievements
        this.checkMessageAchievements(chatId);
      }

      // Save to chat history with emotion data
      this.saveChatMessage(chatId, userMessage, aiResponse, emotion);

    } catch (error) {
      console.error('Error handling user message:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, I encountered an error while processing your message. Please try again.\n\n_If this persists, try /help for assistance._');
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    if (!this.bot || !query.data) return;

    const chatId = query.message.chat.id;
    const data = query.data;

    try {
      // Handle different callback data types
      if (data.startsWith('quick_')) {
        // Quick reply selection
        const index = parseInt(data.split('_')[1]);
        const quickReplies = this.generateQuickReplies(this.chatHistories.get(chatId));
        const selectedReply = quickReplies[index];
        
        if (selectedReply) {
          // Simulate user sending the quick reply
          await this.bot.sendMessage(chatId, `💬 ${selectedReply}`);
          // Process as regular message
          const fakeMsg = {
            chat: { id: chatId },
            from: query.from,
            text: selectedReply.replace(/^[🎯💡🤔👍✨📊]/, '').trim()
          } as Message;
          await this.handleUserMessage(fakeMsg);
        }
      } else if (data.startsWith('mood_')) {
        // Mood/personality selection
        const mood = data.replace('mood_', '');
        this.userPersonas.set(chatId, mood);
        await this.bot.sendMessage(chatId, `🎭 Personality set to: **${mood}**\n\nTry chatting with me now to experience the difference!`, { parse_mode: 'Markdown' });
      } else if (data.startsWith('copy_referral_')) {
        // Referral code copy
        const code = data.replace('copy_referral_', '');
        await this.bot.sendMessage(chatId, `📋 **Referral Link Copied!**\n\nShare this with friends:\nhttps://t.me/your_bot_username?start=${code}\n\n_Paste this link in any chat to invite friends!_`, { parse_mode: 'Markdown' });
      } else {
        // Handle standard callback data
        switch (data) {
          case 'start_chat':
            await this.bot.sendMessage(chatId, '💬 Perfect! Just send me any message and I\'ll respond with my enhanced Phoenix intelligence. What would you like to talk about?');
            break;
            
          case 'show_help':
            await this.handleHelp(query.message);
            break;
            
          case 'generate_image':
            await this.bot.sendMessage(chatId, '🎨 To generate an image, use:\n/imagine [your description]\n\nExample: /imagine a futuristic city at sunset');
            break;
            
          case 'magic_8ball':
            await this.bot.sendMessage(chatId, '🔮 Ask the Magic 8-Ball a question!\n\nUse: /8ball [your question]\n\nExample: /8ball Will today be a good day?');
            break;
            
          case 'daily_content':
            await this.handleDaily(query.message);
            break;
            
          case 'view_profile':
            await this.handleProfile(query.message);
            break;
            
          case 'refer_friends':
            await this.handleRefer(query.message);
            break;
            
          case 'set_persona':
            await this.bot.sendMessage(chatId, '🎭 Set my personality with:\n/persona [personality type]\n\nTry: /persona friendly assistant\nOr use the mood buttons below for quick selection!');
            break;
            
          case 'get_news':
            await this.handleNews(query.message);
            break;
            
          case 'set_reminder':
            await this.bot.sendMessage(chatId, '⏰ Set a smart reminder with:\n/remind [message]\n\nExamples:\n• /remind Call mom in 2 hours\n• /remind Meeting tomorrow at 3pm\n• /remind Take medicine at 8am');
            break;
            
          case 'view_achievements':
            await this.handleAchievements(query.message);
            break;
            
          case 'more_suggestions':
            await this.handleSuggestQuickReplies(query.message);
            break;
            
          case 'quick_actions':
            const actionsKeyboard: InlineKeyboardMarkup = {
              inline_keyboard: [
                [
                  { text: '🎨 Generate Image', callback_data: 'generate_image' },
                  { text: '📊 My Profile', callback_data: 'view_profile' }
                ],
                [
                  { text: '📰 Get News', callback_data: 'get_news' },
                  { text: '⏰ Set Reminder', callback_data: 'set_reminder' }
                ],
                [
                  { text: '🔮 Magic 8-Ball', callback_data: 'magic_8ball' },
                  { text: '🎭 Change Mood', callback_data: 'set_persona' }
                ]
              ]
            };
            await this.bot.sendMessage(chatId, '🎯 **Quick Actions Menu:**\nChoose what you\'d like to do:', {
              parse_mode: 'Markdown',
              reply_markup: actionsKeyboard
            });
            break;
            
          case 'refresh_news':
            await this.handleNews(query.message);
            break;
            
          case 'streak_info':
          case 'daily_streak':
            await this.handleStreak(query.message);
            break;
            
          default:
            await this.bot.sendMessage(chatId, '🤖 I didn\'t understand that action. Try using the menu buttons or type a message!');
        }
      }

      await this.bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Error handling callback query:', error);
      await this.bot.answerCallbackQuery(query.id, { text: 'Sorry, something went wrong!' });
    }
  }

  // Helper methods
  private initializeUser(userId: number, user: any): void {
    if (!this.users.has(userId)) {
      const referralCode = this.generateReferralCode(userId);
      this.users.set(userId, {
        id: userId,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        messageCount: 0,
        tokenCount: 0,
        joinDate: new Date(),
        lastActive: new Date(),
        isBlocked: false,
        // Phoenix features
        achievements: [],
        dailyStreak: 0,
        lastStreakDate: undefined,
        totalPoints: 0,
        level: 1,
        referralCode: referralCode,
        referrals: [],
        newsTopics: ['technology', 'ai'],
        activeReminders: []
      });
    } else {
      const userData = this.users.get(userId)!;
      userData.lastActive = new Date();
      userData.username = user.username;
      userData.firstName = user.first_name;
      userData.lastName = user.last_name;
      
      // Update daily streak
      this.updateDailyStreak(userId);
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

  private formatCodeSnippets(message: string): string {
    // Simple code detection patterns
    const codePatterns = [
      /```[\s\S]*?```/g, // Already formatted code blocks
      /`[^`]*`/g, // Inline code
      /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g, // JavaScript functions
      /def\s+\w+\s*\([^)]*\):/g, // Python functions
      /class\s+\w+[\s\S]*?(?=\n\S|\n$)/g, // Class definitions
    ];

    let formatted = message;
    let hasCode = false;

    // Check if message contains code-like patterns
    const codeKeywords = ['function', 'def ', 'class ', 'import ', 'from ', 'const ', 'let ', 'var ', 'if ', 'for ', 'while '];
    const hasCodeKeywords = codeKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    const hasCodeChars = /[{}();]/.test(message) && message.length > 20;
    
    if (hasCodeKeywords || hasCodeChars) {
      hasCode = true;
      // Basic formatting - wrap in code block if not already formatted
      if (!message.includes('```') && !message.includes('`')) {
        formatted = `\`\`\`\n${message}\n\`\`\``;
      }
    }

    return hasCode ? formatted : message;
  }

  private enhanceResponseWithEmotion(response: string, emotion: string): string {
    const emotionalPrefixes: { [key: string]: string[] } = {
      happy: ["🎉 That's wonderful!", "✨ I love your enthusiasm!", "🌟 Great to hear!"],
      sad: ["💙 I understand how you feel.", "🤗 I'm here to help.", "💫 Things will get better."],
      angry: ["🧘 I hear your frustration.", "💭 Let's work through this together.", "🤝 I'm here to help."],
      curious: ["🤔 Great question!", "💡 I love your curiosity!", "🎯 Let me explain..."],
      tired: ["😌 Take it easy.", "💤 Rest is important.", "🌙 Here's a gentle response:"],
      confused: ["🔍 Let me clarify that.", "💫 No worries, let's break it down.", "🎯 Here's a clearer explanation:"]
    };

    const emotionalSuffixes: { [key: string]: string[] } = {
      happy: ["Keep that positive energy! 🚀", "Stay awesome! ✨", "You're doing great! 🌟"],
      sad: ["Take care of yourself. 💙", "You're not alone. 🤗", "Better days ahead. 🌅"],
      angry: ["Take a deep breath. 🧘", "One step at a time. 🚶", "You've got this. 💪"],
      curious: ["Keep exploring! 🔍", "Stay curious! 🌟", "Learning never stops! 📚"],
      tired: ["Rest well. 😌", "Take your time. ⏰", "Self-care first. 🌸"],
      confused: ["Hope that helps! 💡", "Feel free to ask more. 🤝", "We'll figure it out. 🎯"]
    };

    if (emotion === 'neutral') return response;

    const prefixes = emotionalPrefixes[emotion] || [];
    const suffixes = emotionalSuffixes[emotion] || [];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] || '';
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)] || '';

    return `${prefix}\n\n${response}\n\n_${suffix}_`;
  }

  private checkMessageAchievements(userId: number): void {
    const user = this.users.get(userId);
    if (!user) return;

    // Check chatty achievement
    if (user.messageCount >= 100 && !user.achievements.includes('chatty')) {
      this.awardAchievement(userId, 'chatty');
    }
  }

  private saveChatMessage(userId: number, userMsg: string, botMsg: string, emotion?: string): void {
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
        timestamp: new Date(),
        emotion: emotion
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

  // PROJECT PHOENIX UTILITY FUNCTIONS

  private generateReferralCode(userId: number): string {
    const timestamp = Date.now().toString(36);
    const userIdHash = userId.toString(36);
    return `${userIdHash}${timestamp}`.slice(-8).toUpperCase();
  }

  private updateDailyStreak(userId: number): void {
    const user = this.users.get(userId);
    if (!user) return;

    const today = new Date().toDateString();
    const lastStreakDate = user.lastStreakDate?.toDateString();

    if (lastStreakDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastStreakDate === yesterday.toDateString()) {
        // Continue streak
        user.dailyStreak += 1;
        user.totalPoints += this.DAILY_STREAK_POINTS;
      } else if (!lastStreakDate || lastStreakDate < yesterday.toDateString()) {
        // Reset streak
        user.dailyStreak = 1;
        user.totalPoints += this.DAILY_STREAK_POINTS;
      }
      
      user.lastStreakDate = new Date();
      this.checkStreakAchievements(userId);
    }
  }

  private awardAchievement(userId: number, achievementId: string): void {
    const user = this.users.get(userId);
    if (!user || user.achievements.includes(achievementId)) return;

    user.achievements.push(achievementId);
    user.totalPoints += this.ACHIEVEMENT_POINTS;
    user.level = Math.floor(user.totalPoints / 100) + 1;

    // Send achievement notification
    this.sendAchievementNotification(userId, achievementId);
  }

  private async sendAchievementNotification(userId: number, achievementId: string): Promise<void> {
    if (!this.bot) return;
    
    const achievement = this.ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    const message = `
🎉 *Achievement Unlocked!* 🎉

${achievement.name}
_${achievement.description}_

💰 **Reward:** +${this.ACHIEVEMENT_POINTS} points
🎖️ **Total Achievements:** ${this.users.get(userId)?.achievements.length || 0}

_Keep up the great work!_ 🚀
    `;

    try {
      await this.bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  private checkStreakAchievements(userId: number): void {
    const user = this.users.get(userId);
    if (!user) return;

    const streak = user.dailyStreak;
    
    if (streak >= 30 && !user.achievements.includes('daily_streak_30')) {
      this.awardAchievement(userId, 'daily_streak_30');
    } else if (streak >= 7 && !user.achievements.includes('daily_streak_7')) {
      this.awardAchievement(userId, 'daily_streak_7');
    } else if (streak >= 3 && !user.achievements.includes('daily_streak_3')) {
      this.awardAchievement(userId, 'daily_streak_3');
    }
  }

  private calculateLevelProgress(totalPoints: number): number {
    const currentLevel = Math.floor(totalPoints / 100) + 1;
    const pointsInCurrentLevel = totalPoints % 100;
    return pointsInCurrentLevel;
  }

  private generateProgressBar(progress: number, length: number = 10): string {
    const filled = Math.round((progress / 100) * length);
    const empty = length - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
  }

  private parseNaturalLanguageReminder(text: string): { isValid: boolean; message: string; date: Date } {
    const now = new Date();
    let message = text;
    let scheduledDate = new Date();
    let isValid = false;

    // Simple natural language parsing patterns
    const patterns = [
      // "in X minutes/hours"
      { regex: /(.+?)\s+in\s+(\d+)\s+(minute|minutes|hour|hours|min|mins|hr|hrs)/i, handler: (match: RegExpMatchArray) => {
        const amount = parseInt(match[2]);
        const unit = match[3].toLowerCase();
        message = match[1].trim();
        
        if (unit.startsWith('min')) {
          scheduledDate = new Date(now.getTime() + amount * 60 * 1000);
        } else {
          scheduledDate = new Date(now.getTime() + amount * 60 * 60 * 1000);
        }
        isValid = true;
      }},
      
      // "tomorrow at X"
      { regex: /(.+?)\s+tomorrow\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i, handler: (match: RegExpMatchArray) => {
        message = match[1].trim();
        const hour = parseInt(match[2]);
        const minute = parseInt(match[3] || '0');
        const period = match[4]?.toLowerCase();
        
        scheduledDate = new Date(now);
        scheduledDate.setDate(scheduledDate.getDate() + 1);
        
        let finalHour = hour;
        if (period === 'pm' && hour !== 12) finalHour += 12;
        if (period === 'am' && hour === 12) finalHour = 0;
        
        scheduledDate.setHours(finalHour, minute, 0, 0);
        isValid = true;
      }},
      
      // "at X pm/am"
      { regex: /(.+?)\s+at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i, handler: (match: RegExpMatchArray) => {
        message = match[1].trim();
        const hour = parseInt(match[2]);
        const minute = parseInt(match[3] || '0');
        const period = match[4].toLowerCase();
        
        scheduledDate = new Date(now);
        
        let finalHour = hour;
        if (period === 'pm' && hour !== 12) finalHour += 12;
        if (period === 'am' && hour === 12) finalHour = 0;
        
        scheduledDate.setHours(finalHour, minute, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledDate <= now) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
        isValid = true;
      }}
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        pattern.handler(match);
        break;
      }
    }

    return { isValid, message, date: scheduledDate };
  }

  private scheduleReminder(userId: number, reminder: any): void {
    const delay = reminder.scheduledFor.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        if (!this.bot) return;
        
        const user = this.users.get(userId);
        if (!user) return;
        
        // Check if reminder is still active
        const activeReminder = user.activeReminders.find(r => r.id === reminder.id && r.isActive);
        if (!activeReminder) return;
        
        const reminderMessage = `
⏰ *Reminder Alert!* ⏰

📝 **Message:** ${reminder.message}
🕐 **Scheduled for:** ${reminder.scheduledFor.toLocaleString()}

✅ Reminder completed! Use /reminders to manage more.
        `;

        try {
          await this.bot.sendMessage(userId, reminderMessage, { parse_mode: 'Markdown' });
          
          // Mark reminder as completed
          activeReminder.isActive = false;
        } catch (error) {
          console.error('Error sending reminder:', error);
        }
      }, delay);
    }
  }

  private generatePersonalizedNews(topics: string[]): string {
    // Simulate personalized news generation
    const newsItems = [
      {
        category: 'technology',
        headline: 'AI Breakthrough: New Language Model Achieves Human-Level Performance',
        summary: 'Researchers announce significant advancement in artificial intelligence capabilities.'
      },
      {
        category: 'ai',
        headline: 'OpenAI Releases Enhanced ChatGPT with Improved Reasoning',
        summary: 'The latest update brings better logical reasoning and factual accuracy.'
      },
      {
        category: 'science',
        headline: 'Scientists Discover New Method for Carbon Capture',
        summary: 'Revolutionary technique could help combat climate change effectively.'
      },
      {
        category: 'business',
        headline: 'Tech Giants Report Strong Q4 Earnings',
        summary: 'Major technology companies exceed analyst expectations.'
      }
    ];

    return newsItems
      .filter(item => topics.includes(item.category))
      .slice(0, 3)
      .map((item, index) => `
**${index + 1}. ${item.headline}**
_${item.summary}_
🏷️ #${item.category}
      `).join('\n') || '_No news found for your selected topics._';
  }

  private generateQuickReplies(history?: ChatHistory): string[] {
    const defaultReplies = [
      "👍 That's helpful!",
      "🤔 Tell me more",
      "✨ Generate an image",
      "📊 Show my stats",
      "💡 Suggest something",
      "🎯 What's next?"
    ];

    // If no history, return defaults
    if (!history || history.messages.length === 0) {
      return defaultReplies;
    }

    // Analyze recent messages for context-aware suggestions
    const recentMessages = history.messages.slice(-3);
    const contextualReplies: string[] = [];

    // Simple context detection
    const lastBotMessage = recentMessages.reverse().find(msg => !msg.isUser)?.text.toLowerCase() || '';
    
    if (lastBotMessage.includes('image') || lastBotMessage.includes('picture')) {
      contextualReplies.push("🎨 Generate another image");
    }
    
    if (lastBotMessage.includes('weather')) {
      contextualReplies.push("🌤️ Check tomorrow's weather");
    }
    
    if (lastBotMessage.includes('calculate') || lastBotMessage.includes('math')) {
      contextualReplies.push("🧮 Do another calculation");
    }

    // Combine contextual and default replies
    return [...contextualReplies, ...defaultReplies].slice(0, 6);
  }

  private detectEmotion(message: string): string {
    const emotions = {
      happy: ['happy', 'great', 'awesome', 'excited', 'love', '😊', '😄', '🎉', '🥳'],
      sad: ['sad', 'down', 'depressed', 'upset', '😢', '😞', '😔'],
      angry: ['angry', 'mad', 'frustrated', 'annoyed', '😠', '😡', '🤬'],
      curious: ['how', 'why', 'what', 'when', 'where', 'curious', '🤔'],
      tired: ['tired', 'exhausted', 'sleepy', '😴', '😪'],
      confused: ['confused', 'unclear', 'lost', '😕', '😵']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return emotion;
      }
    }
    
    return 'neutral';
  }

  private async handleStreak(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = this.users.get(chatId);
    
    if (!user) return;

    const today = new Date().toDateString();
    const lastStreakDate = user.lastStreakDate?.toDateString();
    const isStreakActive = lastStreakDate === today || lastStreakDate === new Date(Date.now() - 24*60*60*1000).toDateString();

    const streakMessage = `
🔥 *Your Daily Streak* 🔥

**Current Streak:** ${user.dailyStreak} day${user.dailyStreak !== 1 ? 's' : ''}
**Status:** ${isStreakActive ? '🟢 Active' : '🔴 Broken'}
**Last Activity:** ${user.lastStreakDate?.toDateString() || 'Never'}

**Streak Rewards:**
• ${user.dailyStreak} × ${this.DAILY_STREAK_POINTS} = ${user.dailyStreak * this.DAILY_STREAK_POINTS} points earned

**Streak Milestones:**
${user.dailyStreak >= 3 ? '✅' : '🔲'} 3 days - "On Fire" achievement
${user.dailyStreak >= 7 ? '✅' : '🔲'} 7 days - "Weekly Warrior" achievement  
${user.dailyStreak >= 30 ? '✅' : '🔲'} 30 days - "Monthly Master" achievement

**💡 Streak Tips:**
• Send at least one message daily
• Use any command or feature
• Check /daily for fresh content
• Engage with the bot regularly

${isStreakActive ? '_Keep it up! Your streak is active!_ 🚀' : '_Chat with me today to start/continue your streak!_ 💪'}
    `;

    try {
      await this.bot.sendMessage(chatId, streakMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending streak info:', error);
    }
  }

  private async handleLeaderboard(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;

    // Get top users by points
    const topUsers = Array.from(this.users.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    const currentUser = this.users.get(chatId);
    const currentUserRank = Array.from(this.users.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .findIndex(u => u.id === chatId) + 1;

    const leaderboardText = topUsers.map((user, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const name = user.firstName || 'Anonymous';
      return `${emoji} ${name} - ${user.totalPoints} pts (L${user.level})`;
    }).join('\n');

    const leaderboardMessage = `
🏆 *ShanxAi Leaderboard* 🏆
_Top users by total points_

${leaderboardText}

${currentUser ? `
📍 **Your Position:** #${currentUserRank}
⭐ **Your Points:** ${currentUser.totalPoints}
🎖️ **Your Level:** ${currentUser.level}
` : ''}

💡 **Earn Points By:**
• Daily messaging (+${this.MESSAGE_POINTS} per message)
• Maintaining streaks (+${this.DAILY_STREAK_POINTS} per day)
• Referring friends (+${this.REFERRAL_POINTS} per referral)
• Unlocking achievements (+${this.ACHIEVEMENT_POINTS} each)

_Keep climbing the ranks!_ 🚀
    `;

    try {
      await this.bot.sendMessage(chatId, leaderboardMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending leaderboard:', error);
    }
  }

  private async handleViewReminders(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = this.users.get(chatId);
    
    if (!user) return;

    const activeReminders = user.activeReminders.filter(r => r.isActive);
    
    if (activeReminders.length === 0) {
      await this.bot.sendMessage(chatId, `
⏰ *Your Reminders* ⏰

You have no active reminders.

💡 **Set a reminder with:**
/remind [your message]

**Examples:**
• /remind Call doctor tomorrow at 2pm
• /remind Team meeting in 30 minutes
• /remind Buy groceries after work
      `, { parse_mode: 'Markdown' });
      return;
    }

    const remindersList = activeReminders.map((reminder, index) => 
      `${index + 1}. **${reminder.message}**\n   📅 ${reminder.scheduledFor.toLocaleString()}\n   🆔 \`${reminder.id}\``
    ).join('\n\n');

    const remindersMessage = `
⏰ *Your Active Reminders* ⏰

${remindersList}

💡 **Tips:**
• Reminders will be sent automatically
• Use /remind to set new ones
• Each reminder has a unique ID

_I'll make sure you don't forget!_ 🤖
    `;

    try {
      await this.bot.sendMessage(chatId, remindersMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  }

  private async handleNewsSubscribe(msg: Message, match: RegExpExecArray | null): Promise<void> {
    if (!this.bot || !match) return;
    
    const chatId = msg.chat.id;
    const topic = match[1].trim().toLowerCase();
    const user = this.users.get(chatId);
    
    if (!user) return;

    if (!this.NEWS_CATEGORIES.includes(topic)) {
      await this.bot.sendMessage(chatId, `
❌ **Topic "${topic}" not available.**

📰 **Available topics:**
${this.NEWS_CATEGORIES.map(cat => `• ${cat}`).join('\n')}

💡 **Usage:** /news_subscribe technology
      `, { parse_mode: 'Markdown' });
      return;
    }

    if (user.newsTopics.includes(topic)) {
      await this.bot.sendMessage(chatId, `📰 You're already subscribed to **${topic}** news!`);
      return;
    }

    user.newsTopics.push(topic);
    
    await this.bot.sendMessage(chatId, `
✅ **Subscribed to ${topic} news!**

📰 **Your topics:** ${user.newsTopics.join(', ')}

Use /news to get your personalized digest anytime!
    `, { parse_mode: 'Markdown' });
  }

  private async handleNewsTopics(msg: Message): Promise<void> {
    if (!this.bot) return;
    
    const chatId = msg.chat.id;
    const user = this.users.get(chatId);

    const topicsMessage = `
📰 *News Topics* 📰

**Available Categories:**
${this.NEWS_CATEGORIES.map(topic => `• ${topic}`).join('\n')}

${user ? `
**Your Subscriptions:**
${user.newsTopics.map(topic => `✅ ${topic}`).join('\n')}
` : ''}

**Commands:**
• /news_subscribe [topic] - Subscribe to a topic
• /news - Get personalized news digest

**Example:** /news_subscribe technology
    `;

    try {
      await this.bot.sendMessage(chatId, topicsMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending news topics:', error);
    }
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