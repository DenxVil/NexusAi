import TelegramBot from 'node-telegram-bot-api';
import { AIService } from './aiService';

export class TelegramBotService {
    private bot: TelegramBot | null = null;
    private aiService: AIService;
    private userSessions: Map<number, any> = new Map();

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.initialize();
    }

    private initialize() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!token) {
            console.warn('⚠️ TELEGRAM_BOT_TOKEN not found. Telegram bot will not be available.');
            return;
        }

        try {
            this.bot = new TelegramBot(token, { polling: true });
            this.setupCommands();
            this.setupMessageHandlers();
            console.log('🤖 Telegram bot initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Telegram bot:', error);
        }
    }

    private setupCommands() {
        if (!this.bot) return;

        // Set bot commands
        this.bot.setMyCommands([
            { command: 'start', description: 'Start interacting with Nexus Ai' },
            { command: 'help', description: 'Show help information' },
            { command: 'clear', description: 'Clear your chat history' },
            { command: 'status', description: 'Check bot status' },
            { command: 'model', description: 'Switch AI model (gemini/perplexity/huggingface)' }
        ]);

        // Handle /start command
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const userName = msg.from?.first_name || 'there';
            
            this.userSessions.set(chatId, {
                userId: msg.from?.id,
                username: msg.from?.username,
                firstName: msg.from?.first_name,
                currentModel: 'gemini',
                chatHistory: []
            });

            const welcomeMessage = `
🔮 *Welcome to Nexus Ai, ${userName}!*

I'm your advanced AI assistant powered by multiple AI models. Here's what I can do:

🤖 *Features:*
• Chat with advanced AI models (Gemini, Perplexity, HuggingFace)
• Get intelligent responses for any question
• Switch between different AI models
• Maintain conversation context

🛠️ *Commands:*
/help - Show this help message
/clear - Clear your chat history
/model <name> - Switch AI model (gemini/perplexity/huggingface)
/status - Check bot status

Just send me a message to start chatting! 💬

*Created by ◉Ɗєиνιℓ*
            `;

            this.sendMessage(chatId, welcomeMessage);
        });

        // Handle /help command
        this.bot.onText(/\/help/, (msg) => {
            const helpMessage = `
🔮 *Nexus Ai Help*

*Available Commands:*
/start - Initialize the bot
/help - Show this help message
/clear - Clear your chat history
/model <name> - Switch AI model
/status - Check bot status

*AI Models Available:*
• *gemini* - Google's advanced language model
• *perplexity* - Research-focused AI
• *huggingface* - Open-source AI models

*How to use:*
1. Just send me any message or question
2. I'll respond using the current AI model
3. Use /model <name> to switch models
4. Use /clear to start fresh

*Support:*
Telegram: @xDenvil_bot
Email: NexusAisupport@gmail.com

*Created by ◉Ɗєиνιℓ*
            `;

            this.sendMessage(msg.chat.id, helpMessage);
        });

        // Handle /clear command
        this.bot.onText(/\/clear/, (msg) => {
            const chatId = msg.chat.id;
            const session = this.userSessions.get(chatId);
            
            if (session) {
                session.chatHistory = [];
                this.userSessions.set(chatId, session);
            }

            this.sendMessage(chatId, '🗑️ Your chat history has been cleared. Starting fresh!');
        });

        // Handle /status command
        this.bot.onText(/\/status/, (msg) => {
            const chatId = msg.chat.id;
            const session = this.userSessions.get(chatId) || { currentModel: 'gemini' };
            
            const statusMessage = `
🔮 *Nexus Ai Status*

*Current Settings:*
• AI Model: ${session.currentModel}
• Chat History: ${session.chatHistory?.length || 0} messages
• Status: ✅ Online and ready

*Available Models:*
• gemini (Google's advanced AI)
• perplexity (Research-focused)
• huggingface (Open-source models)

Use /model <name> to switch models.
            `;

            this.sendMessage(chatId, statusMessage);
        });

        // Handle /model command
        this.bot.onText(/\/model (.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const modelName = match?.[1]?.toLowerCase().trim();
            
            const validModels = ['gemini', 'perplexity', 'huggingface'];
            
            if (!modelName || !validModels.includes(modelName)) {
                const message = `
❌ Invalid model name. Available models:
• gemini
• perplexity  
• huggingface

Usage: /model gemini
                `;
                this.sendMessage(chatId, message);
                return;
            }

            let session = this.userSessions.get(chatId);
            if (!session) {
                session = {
                    userId: msg.from?.id,
                    username: msg.from?.username,
                    firstName: msg.from?.first_name,
                    currentModel: modelName,
                    chatHistory: []
                };
            } else {
                session.currentModel = modelName;
            }
            
            this.userSessions.set(chatId, session);
            
            this.sendMessage(chatId, `✅ AI model switched to *${modelName}*. You can now chat with the new model!`);
        });
    }

    private setupMessageHandlers() {
        if (!this.bot) return;

        // Handle all text messages (except commands)
        this.bot.on('message', async (msg) => {
            // Skip commands
            if (msg.text?.startsWith('/')) return;
            
            const chatId = msg.chat.id;
            const messageText = msg.text;

            if (!messageText) return;

            try {
                // Show typing indicator
                await this.bot?.sendChatAction(chatId, 'typing');

                // Get or create user session
                let session = this.userSessions.get(chatId);
                if (!session) {
                    session = {
                        userId: msg.from?.id,
                        username: msg.from?.username,
                        firstName: msg.from?.first_name,
                        currentModel: 'gemini',
                        chatHistory: []
                    };
                    this.userSessions.set(chatId, session);
                }

                // Add user message to history
                session.chatHistory.push({
                    role: 'user',
                    content: messageText,
                    timestamp: new Date()
                });

                // Get AI response
                const response = await this.aiService.generateResponse(
                    messageText,
                    session.currentModel,
                    session.chatHistory
                );

                // Add AI response to history
                session.chatHistory.push({
                    role: 'assistant',
                    content: response,
                    timestamp: new Date()
                });

                // Limit history to last 20 messages to prevent memory issues
                if (session.chatHistory.length > 20) {
                    session.chatHistory = session.chatHistory.slice(-20);
                }

                this.userSessions.set(chatId, session);

                // Send response
                await this.sendMessage(chatId, response);

            } catch (error) {
                console.error('Error processing message:', error);
                
                const errorMessage = `
❌ Sorry, I encountered an error while processing your message.

This might be due to:
• API key not configured for the current model
• Network connectivity issues
• Rate limiting

Try again in a moment, or use /model to switch to a different AI model.
                `;
                
                await this.sendMessage(chatId, errorMessage);
            }
        });

        // Handle errors
        this.bot.on('error', (error) => {
            console.error('Telegram bot error:', error);
        });

        // Handle polling errors
        this.bot.on('polling_error', (error) => {
            console.error('Telegram bot polling error:', error);
        });
    }

    private async sendMessage(chatId: number, text: string) {
        if (!this.bot) return;

        try {
            await this.bot.sendMessage(chatId, text, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        } catch (error) {
            console.error('Error sending message:', error);
            // Fallback without markdown
            try {
                await this.bot.sendMessage(chatId, text.replace(/[*_`]/g, ''));
            } catch (fallbackError) {
                console.error('Error sending fallback message:', fallbackError);
            }
        }
    }

    public isActive(): boolean {
        return this.bot !== null;
    }

    public getActiveUsers(): number {
        return this.userSessions.size;
    }

    public getUserSession(chatId: number) {
        return this.userSessions.get(chatId);
    }

    public stop() {
        if (this.bot) {
            this.bot.stopPolling();
            this.bot = null;
            console.log('🛑 Telegram bot stopped');
        }
    }
}