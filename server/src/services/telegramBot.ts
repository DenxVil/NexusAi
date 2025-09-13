import TelegramBot, { Message, RegExpExecArray } from 'node-telegram-bot-api';
import { handleUserMessage, handleNewUser, handleViewHistory, handleClearHistory } from '../controllers/messageController';

// Replace with your Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN as string;

let bot: TelegramBot;

const initializeBot = () => {
  if (!token) {
    console.error('Telegram bot token is not provided. Bot initialization failed.');
    return;
  }

  bot = new TelegramBot(token, { polling: true });

  // Listener for /start command
  bot.onText(/\/start/, (msg: Message) => {
    handleNewUser(bot, msg);
  });

  // Listener for /history command
  bot.onText(/\/history/, (msg: Message) => {
    handleViewHistory(bot, msg);
  });

  // Listener for /clear command
  bot.onText(/\/clear/, (msg: Message) => {
    handleClearHistory(bot, msg);
  });

  // Listener for any other message
  bot.on('message', (msg: Message) => {
    // Ignore commands that are handled by other listeners
    if (msg.text && msg.text.startsWith('/')) {
      const command = msg.text.split(' ')[0];
      if (command === '/start' || command === '/history' || command === '/clear') {
        return;
      }
    }
    handleUserMessage(bot, msg);
  });

  // Error handling
  bot.on('polling_error', (error: Error) => {
    console.error(`Polling error: ${error.message}`);
  });

  bot.on('webhook_error', (error: Error) => {
    console.error(`Webhook error: ${error.message}`);
  });

  console.log('Telegram bot has been initialized and is running.');
};

export { initializeBot };
