// Created with love 🩶 by Denvil 🧑‍💻
// Enhanced Error Monitoring Service with Telegram Notifications

import TelegramBot from 'node-telegram-bot-api';
import config from '../config';

interface ErrorReport {
  timestamp: Date;
  error: Error;
  context: {
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  environment: string;
  stackTrace?: string;
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  responseTime: number;
  errorCount: number;
  activeConnections: number;
}

export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private telegramBot: TelegramBot | null = null;
  private adminChatId: string = '@p_harsh9'; // Target Telegram user
  private errorCount: number = 0;
  private lastErrorTime: Date | null = null;
  private alertThreshold: number = 5; // Max errors in 10 minutes before critical alert
  private errorBuffer: ErrorReport[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  private constructor() {
    this.initializeTelegramBot();
    this.startHealthMonitoring();
  }

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  private initializeTelegramBot(): void {
    if (config.telegramBotToken) {
      try {
        this.telegramBot = new TelegramBot(config.telegramBotToken, { polling: false });
        console.log('🤖 Error monitoring Telegram bot initialized');
      } catch (error) {
        console.error('Failed to initialize error monitoring Telegram bot:', error);
      }
    }
  }

  private startHealthMonitoring(): void {
    // Monitor system health every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Reset error count every hour
    setInterval(() => {
      this.errorCount = 0;
    }, 60 * 60 * 1000);
  }

  public async reportError(error: Error, context: Partial<ErrorReport['context']> = {}): Promise<void> {
    const errorReport: ErrorReport = {
      timestamp: new Date(),
      error,
      context,
      severity: this.determineSeverity(error),
      environment: config.nodeEnv,
      stackTrace: error.stack
    };

    // Add to buffer
    this.addToBuffer(errorReport);
    this.errorCount++;
    this.lastErrorTime = new Date();

    // Log error
    console.error(`[ERROR MONITOR] ${errorReport.severity.toUpperCase()}:`, error.message);
    console.error('Context:', context);
    console.error('Stack:', error.stack);

    // Send notification based on severity
    await this.sendNotification(errorReport);

    // Check if critical threshold reached
    if (this.errorCount >= this.alertThreshold) {
      await this.sendCriticalAlert();
    }
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    const stack = (error.stack || '').toLowerCase();

    // Critical errors
    if (
      message.includes('econnrefused') ||
      message.includes('database') ||
      message.includes('mongo') ||
      message.includes('out of memory') ||
      stack.includes('uncaughtexception')
    ) {
      return 'critical';
    }

    // High severity
    if (
      message.includes('timeout') ||
      message.includes('rate limit') ||
      message.includes('api key') ||
      message.includes('authentication')
    ) {
      return 'high';
    }

    // Medium severity
    if (
      message.includes('validation') ||
      message.includes('not found') ||
      message.includes('permission')
    ) {
      return 'medium';
    }

    return 'low';
  }

  private addToBuffer(errorReport: ErrorReport): void {
    this.errorBuffer.push(errorReport);
    if (this.errorBuffer.length > this.MAX_BUFFER_SIZE) {
      this.errorBuffer.shift(); // Remove oldest error
    }
  }

  private async sendNotification(errorReport: ErrorReport): Promise<void> {
    if (!this.telegramBot) return;

    const { severity, error, context, timestamp, environment } = errorReport;

    // Only send notifications for medium, high, and critical errors
    if (severity === 'low') return;

    const emoji = this.getSeverityEmoji(severity);
    const message = this.formatErrorMessage(errorReport);

    try {
      await this.telegramBot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    } catch (telegramError) {
      console.error('Failed to send Telegram notification:', telegramError);
    }
  }

  private getSeverityEmoji(severity: ErrorReport['severity']): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '❓';
    }
  }

  private formatErrorMessage(errorReport: ErrorReport): string {
    const { severity, error, context, timestamp, environment } = errorReport;
    const emoji = this.getSeverityEmoji(severity);

    return `${emoji} <b>Nexus AI Error Alert</b>

🔥 <b>Severity:</b> ${severity.toUpperCase()}
🕒 <b>Time:</b> ${timestamp.toISOString()}
🌍 <b>Environment:</b> ${environment}

❌ <b>Error:</b> ${error.message}

${context.endpoint ? `🎯 <b>Endpoint:</b> ${context.method} ${context.endpoint}` : ''}
${context.userId ? `👤 <b>User:</b> ${context.userId}` : ''}
${context.ip ? `🌐 <b>IP:</b> ${context.ip}` : ''}

📊 <b>Stats:</b> ${this.errorCount} errors in last hour
💾 <b>Memory:</b> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

${severity === 'critical' ? '🆘 <b>IMMEDIATE ACTION REQUIRED!</b>' : ''}`;
  }

  private async sendCriticalAlert(): Promise<void> {
    if (!this.telegramBot) return;

    const message = `🆘 <b>CRITICAL ALERT - Nexus AI</b>

🚨 <b>Multiple errors detected!</b>
📈 <b>Error count:</b> ${this.errorCount} in last hour
⏰ <b>Threshold exceeded at:</b> ${new Date().toISOString()}

🔧 <b>Recommended Actions:</b>
• Check server logs immediately
• Verify database connectivity  
• Monitor system resources
• Consider scaling or restart

💻 <b>System Status:</b>
${this.getSystemStatus()}

<b>This requires immediate attention!</b>`;

    try {
      await this.telegramBot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });
    } catch (telegramError) {
      console.error('Failed to send critical alert:', telegramError);
    }
  }

  private getSystemStatus(): string {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return `• Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB
• Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
• Environment: ${config.nodeEnv}
• Last Error: ${this.lastErrorTime?.toISOString() || 'None'}`;
  }

  private async performHealthCheck(): Promise<void> {
    const metrics = this.getSystemMetrics();
    
    // Send health report if memory usage is high or too many errors
    if (metrics.memory.percentage > 80 || this.errorCount > 10) {
      await this.sendHealthWarning(metrics);
    }
  }

  private getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    
    return {
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      uptime: process.uptime(),
      responseTime: 0, // Would be calculated from actual requests
      errorCount: this.errorCount,
      activeConnections: 0 // Would be tracked from actual connections
    };
  }

  private async sendHealthWarning(metrics: SystemMetrics): Promise<void> {
    if (!this.telegramBot) return;

    const message = `⚠️ <b>Nexus AI Health Warning</b>

📊 <b>System Metrics:</b>
• Memory: ${Math.round(metrics.memory.percentage)}% (${Math.round(metrics.memory.used / 1024 / 1024)}MB)
• Uptime: ${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m
• Errors (1h): ${metrics.errorCount}

${metrics.memory.percentage > 80 ? '🔴 High memory usage detected!' : ''}
${metrics.errorCount > 10 ? '🔴 High error rate detected!' : ''}

Consider monitoring the application closely.`;

    try {
      await this.telegramBot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });
    } catch (telegramError) {
      console.error('Failed to send health warning:', telegramError);
    }
  }

  public async sendStartupNotification(): Promise<void> {
    if (!this.telegramBot) return;

    const message = `🚀 <b>Nexus AI Started</b>

✅ <b>Server Status:</b> Online
🌍 <b>Environment:</b> ${config.nodeEnv}
⏰ <b>Started at:</b> ${new Date().toISOString()}
💾 <b>Memory:</b> ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

🔧 <b>Services:</b>
• Telegram Bot: ${config.enableTelegramBot ? '✅' : '❌'}
• Rate Limiting: ${config.enableRateLimiting ? '✅' : '❌'}
• Socket.IO: ${config.enableSocketIO ? '✅' : '❌'}

Ready to serve requests! 🎯`;

    try {
      await this.telegramBot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML'
      });
    } catch (telegramError) {
      console.error('Failed to send startup notification:', telegramError);
    }
  }

  public getErrorSummary(): {
    totalErrors: number;
    recentErrors: ErrorReport[];
    systemHealth: SystemMetrics;
  } {
    return {
      totalErrors: this.errorBuffer.length,
      recentErrors: this.errorBuffer.slice(-10),
      systemHealth: this.getSystemMetrics()
    };
  }
}

export default ErrorMonitoringService;