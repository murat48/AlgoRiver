interface TelegramConfig {
    botToken: string;
    chatId: string;
    enabled: boolean;
}

interface TransactionData {
    type: 'stake' | 'unstake' | 'order_create' | 'order_execute' | 'order_cancel';
    userAddress: string;
    amount?: number;
    poolId?: string;
    poolName?: string;
    orderId?: string;
    price?: number;
    status: 'success' | 'failed';
    txId?: string;
    timestamp: string;
    message?: string;
}

class TelegramBotService {
    private config: TelegramConfig;
    private isEnabled: boolean = false;

    constructor() {
        this.config = {
            botToken: '8276841624:AAFcFlgiXkhZ1UpUSujWWRNGQgX59DkWqSY', // Default bot token
            chatId: '',
            enabled: false
        };
        this.loadConfig();
    }

    private loadConfig(): void {
        try {
            const savedConfig = localStorage.getItem('telegramBotConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                console.log('📱 Loading saved config:', parsedConfig);
                
                // Only update non-empty values, always keep default bot token
                if (parsedConfig.chatId && parsedConfig.chatId.trim()) {
                    this.config.chatId = parsedConfig.chatId.trim();
                }
                if (typeof parsedConfig.enabled === 'boolean') {
                    this.config.enabled = parsedConfig.enabled;
                }
                
                // NEVER override bot token from localStorage - always keep default
                console.log('📱 Final config after load:', this.config);
                this.isEnabled = this.config.enabled && !!this.config.botToken && !!this.config.chatId;
                console.log('📱 Telegram Bot Config loaded:', this.isEnabled ? 'Enabled' : 'Disabled');
            } else {
                console.log('📱 No saved config found, using defaults');
            }
        } catch (error) {
            console.error('❌ Error loading Telegram config:', error);
        }
    }

    private saveConfig(): void {
        try {
            localStorage.setItem('telegramBotConfig', JSON.stringify(this.config));
            console.log('💾 Telegram Bot Config saved');
        } catch (error) {
            console.error('❌ Error saving Telegram config:', error);
        }
    }

    setConfig(botToken: string, chatId: string, enabled: boolean = true): void {
        this.config = {
            botToken: botToken.trim(),
            chatId: chatId.trim(),
            enabled: enabled
        };
        this.isEnabled = enabled && !!this.config.botToken && !!this.config.chatId;
        this.saveConfig();
        console.log('📱 Telegram Bot Config updated:', this.isEnabled ? 'Enabled' : 'Disabled');
    }

    getConfig(): TelegramConfig {
        return { ...this.config };
    }

    isBotEnabled(): boolean {
        return this.isEnabled;
    }

    async testConnection(): Promise<{ success: boolean; message: string }> {
        const botToken = this.config.botToken || '8276841624:AAFcFlgiXkhZ1UpUSujWWRNGQgX59DkWqSY';
        console.log('🧪 Testing connection with bot token:', botToken);
        
        if (!botToken || botToken.trim() === '') {
            return { success: false, message: '❌ Bot token is not configured' };
        }

        if (!this.config.chatId) {
            return { success: false, message: '❌ Chat ID is not configured. Please enter your Chat ID first.' };
        }

        try {
            const testMessage = `🤖 Test Message\n\n✅ Telegram bot integration is working!\n⏰ Time: ${new Date().toLocaleString()}\n\nBot: @mrtkestanbar_bot`;
            const result = await this.sendMessage(testMessage);
            
            if (result.success) {
                return { success: true, message: '✅ Telegram bot connection successful!' };
            } else {
                return { success: false, message: `❌ Telegram bot test failed: ${result.message}` };
            }
        } catch (error) {
            console.error('❌ Telegram bot test error:', error);
            return { success: false, message: `❌ Telegram bot test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    async sendTestMessage(): Promise<{ success: boolean; message: string }> {
        try {
            const botToken = this.config.botToken || '8276841624:AAFcFlgiXkhZ1UpUSujWWRNGQgX59DkWqSY';
            const testMessage = `🚀 AlgoAS Test Message\n\n✅ Your Telegram bot is working!\n⏰ Time: ${new Date().toLocaleString()}\n\nBot: @mrtkestanbar_bot\n\nTo get your Chat ID:\n1. Send any message to @mrtkestanbar_bot\n2. Check the updates API\n3. Copy your chat ID from the response`;
            
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const payload = {
                chat_id: '@mrtkestanbar_bot', // Send to bot's own chat
                text: testMessage,
                parse_mode: 'HTML'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.ok) {
                console.log('📱 Test message sent successfully');
                return { success: true, message: '✅ Test message sent! Check your Telegram.' };
            } else {
                console.error('❌ Telegram API error:', data);
                return { success: false, message: `❌ Failed to send test message: ${data.description || 'Unknown error'}` };
            }
        } catch (error) {
            console.error('❌ Error sending test message:', error);
            return { success: false, message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    private async sendMessage(message: string): Promise<{ success: boolean; message: string }> {
        const botToken = this.config.botToken || '8276841624:AAFcFlgiXkhZ1UpUSujWWRNGQgX59DkWqSY';
        
        if (!this.config.chatId) {
            return { success: false, message: 'Chat ID is not configured' };
        }

        try {
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const payload = {
                chat_id: this.config.chatId,
                text: message,
                parse_mode: 'HTML'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.ok) {
                console.log('📱 Telegram message sent successfully');
                return { success: true, message: 'Message sent successfully' };
            } else {
                console.error('❌ Telegram API error:', data);
                return { success: false, message: `Telegram API error: ${data.description || 'Unknown error'}` };
            }
        } catch (error) {
            console.error('❌ Error sending Telegram message:', error);
            return { success: false, message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    async sendTransactionNotification(data: TransactionData): Promise<void> {
        const botToken = this.config.botToken || '8276841624:AAFcFlgiXkhZ1UpUSujWWRNGQgX59DkWqSY';
        
        if (!this.config.chatId) {
            console.log('📱 Chat ID not configured, skipping notification');
            return;
        }

        try {
            const message = this.formatTransactionMessage(data);
            const result = await this.sendMessage(message);
            
            if (result.success) {
                console.log('📱 Transaction notification sent to Telegram');
            } else {
                console.error('❌ Failed to send Telegram notification:', result.message);
            }
        } catch (error) {
            console.error('❌ Error sending Telegram notification:', error);
        }
    }

    private formatTransactionMessage(data: TransactionData): string {
        const statusEmoji = data.status === 'success' ? '✅' : '❌';
        const typeEmoji = this.getTypeEmoji(data.type);
        const timestamp = new Date(data.timestamp).toLocaleString();

        let message = `${statusEmoji} <b>${this.getTypeLabel(data.type)}</b>\n\n`;
        
        message += `👤 <b>User:</b> <code>${data.userAddress.slice(0, 8)}...${data.userAddress.slice(-8)}</code>\n`;
        message += `⏰ <b>Time:</b> ${timestamp}\n`;

        if (data.amount) {
            message += `💰 <b>Amount:</b> ${data.amount.toLocaleString()} ALGO\n`;
        }

        if (data.poolName) {
            message += `🏊 <b>Pool:</b> ${data.poolName}\n`;
        }

        if (data.orderId) {
            message += `🆔 <b>Order ID:</b> <code>${data.orderId}</code>\n`;
        }

        if (data.price) {
            message += `💲 <b>Price:</b> $${data.price.toFixed(4)}\n`;
        }

        if (data.txId) {
            message += `🔗 <b>TX ID:</b> <code>${data.txId}</code>\n`;
        }

        if (data.message) {
            message += `\n📝 <b>Details:</b> ${data.message}`;
        }

        return message;
    }

    private getTypeEmoji(type: string): string {
        const emojis: { [key: string]: string } = {
            'stake': '💰',
            'unstake': '💸',
            'order_create': '🎯',
            'order_execute': '🚀',
            'order_cancel': '🛑'
        };
        return emojis[type] || '📊';
    }

    private getTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            'stake': 'Stake Transaction',
            'unstake': 'Unstake Transaction',
            'order_create': 'Trailing Stop Order Created',
            'order_execute': 'Trailing Stop Order Executed',
            'order_cancel': 'Trailing Stop Order Cancelled'
        };
        return labels[type] || 'Transaction';
    }

    async sendDailySummary(summary: {
        totalTransactions: number;
        stakeTransactions: number;
        unstakeTransactions: number;
        orderTransactions: number;
        totalVolume: number;
        date: string;
    }): Promise<void> {
        if (!this.isEnabled) {
            return;
        }

        try {
            const message = `📊 <b>Daily Summary - ${summary.date}</b>\n\n` +
                `📈 <b>Total Transactions:</b> ${summary.totalTransactions}\n` +
                `💰 <b>Stake Transactions:</b> ${summary.stakeTransactions}\n` +
                `💸 <b>Unstake Transactions:</b> ${summary.unstakeTransactions}\n` +
                `🎯 <b>Order Transactions:</b> ${summary.orderTransactions}\n` +
                `💵 <b>Total Volume:</b> ${summary.totalVolume.toLocaleString()} ALGO`;

            await this.sendMessage(message);
            console.log('📱 Daily summary sent to Telegram');
        } catch (error) {
            console.error('❌ Error sending daily summary:', error);
        }
    }
}

// Singleton instance
export const telegramBotService = new TelegramBotService();
export type { TelegramConfig, TransactionData };
