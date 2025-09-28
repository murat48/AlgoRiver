import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TrailingStopLossClient } from './TrailingStopLossClient'

export interface TrailingOrderData {
    id: string;
    assetId: string;
    assetName: string;
    assetSymbol: string;
    amount: string;
    entryPrice: string;
    currentPrice: string;
    stopPrice: string;
    trailDistance: string;
    trailDistanceType: 'percentage' | 'price';
    targetPrice?: string;
    highWaterMark: string;
    status: 'active' | 'triggered' | 'cancelled' | 'executed';
    createdAt: string;
    updatedAt: string;
    pnl: string;
    pnlPercentage: string;
    userAddress: string;
    orderType: 'trailing' | 'bracket';
    takeProfitPrice?: string;
    executionPrice?: string;
    executionTime?: string;
    txId?: string;
}

class PriceTrackingService {
    private algoPrice: number = 0;
    private priceCallbacks: ((price: number) => void)[] = [];
    private priceUpdateInterval?: NodeJS.Timeout;

    startPriceTracking() {
        if (!this.priceUpdateInterval) {
            this.updatePrice();
            this.priceUpdateInterval = setInterval(() => {
                this.updatePrice();
            }, 10000);
        }
    }

    stopPriceTracking() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = undefined;
        }
    }

    private async updatePrice() {
        // Try multiple price sources
        const priceSources = [
            {
                name: 'CoinGecko',
                url: 'https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd',
                parser: (data: any) => data.algorand?.usd
            },
            {
                name: 'CoinCap',
                url: 'https://api.coincap.io/v2/assets/algorand',
                parser: (data: any) => parseFloat(data.data?.priceUSD)
            }
        ];

        for (const source of priceSources) {
            try {
                console.log(`🔄 Fetching ALGO price from ${source.name}...`);
                const response = await fetch(source.url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log(`📊 ${source.name} response:`, data);
                
                const price = source.parser(data);
                if (price && price > 0) {
                    this.algoPrice = price;
                    console.log(`✅ ALGO price updated from ${source.name}:`, this.algoPrice);
                    this.notifyPriceCallbacks(this.algoPrice);
                    return; // Success, exit the function
                } else {
                    console.warn(`⚠️ Invalid price data from ${source.name}:`, data);
                }
            } catch (error) {
                console.error(`❌ Error fetching price from ${source.name}:`, error);
            }
        }

        // If all sources fail, use fallback price
        console.warn('⚠️ All price sources failed, using fallback price');
        this.algoPrice = 0.15; // Default ALGO price
        this.notifyPriceCallbacks(this.algoPrice);
    }

    getCurrentPrice(): number {
        return this.algoPrice;
    }

    setManualPrice(price: number): void {
        console.log(`🧪 PriceTrackingService: Setting manual price to $${price}`);
        this.algoPrice = price;
        this.notifyPriceCallbacks(this.algoPrice);
    }

    onPriceUpdate(callback: (price: number) => void) {
        this.priceCallbacks.push(callback);
        if (this.algoPrice > 0) {
            callback(this.algoPrice);
        }
    }

    private notifyPriceCallbacks(price: number) {
        this.priceCallbacks.forEach(callback => callback(price));
    }
}

export class TrailingStopDataService {
    private priceService: PriceTrackingService;
    private algorandClient: AlgorandClient;
    private contractClient: TrailingStopLossClient;
    private readonly APP_ID = '746503417'; // New deployed App ID

    constructor() {
        this.priceService = new PriceTrackingService();
        
        // Force TestNet configuration with explicit URLs
        this.algorandClient = AlgorandClient.fromConfig({
            algodConfig: {
                server: 'https://testnet-api.algonode.cloud',
                port: 443,
                token: ''
            },
            indexerConfig: {
                server: 'https://testnet-idx.algonode.cloud',
                port: 443,
                token: ''
            }
        });
        
        this.contractClient = new TrailingStopLossClient({
            algorand: this.algorandClient,
            appId: BigInt(this.APP_ID)
        });
        
        console.log('🏗️ TrailingStopDataService initialized');
        console.log('🔗 AlgorandClient:', this.algorandClient);
        console.log('📱 App ID:', this.APP_ID);
        
        // Log network configuration
        try {
            console.log('🌐 Network Config:', {
                algodUrl: (this.algorandClient as any).algod?.client?.baseURL || 'Unknown',
                indexerUrl: (this.algorandClient as any).indexer?.client?.baseURL || 'Unknown'
            });
        } catch (error) {
            console.log('⚠️ Could not get network config:', error);
        }
    }

    setTransactionSigner(transactionSigner: any) {
        console.log('🔐 Setting transaction signer:', transactionSigner);
        this.algorandClient.setDefaultSigner(transactionSigner);
    }

    async testNetworkConnection(): Promise<{ success: boolean; message: string }> {
        try {
            console.log('🧪 Testing network connection...');
            
            // Test algod connection
            const algodStatus = await (this.algorandClient as any).algod.status();
            console.log('✅ Algod connection successful:', algodStatus);
            
            // Test indexer connection
            const health = await (this.algorandClient as any).indexer.health();
            console.log('✅ Indexer connection successful:', health);
            
            return {
                success: true,
                message: '✅ Network connection successful!'
            };
        } catch (error) {
            console.error('❌ Network connection test failed:', error);
            return {
                success: false,
                message: `❌ Network connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    // 🎯 AUTOMATIC SELLING SYSTEM
    private executionInterval: NodeJS.Timeout | null = null;
    private isExecutionRunning = false;

    startAutomaticExecution(): void {
        if (this.isExecutionRunning) {
            console.log('⚠️ Automatic execution already running');
            return;
        }

        console.log('🚀 Starting automatic execution system...');
        this.isExecutionRunning = true;

        // Check every 30 seconds for execution conditions
        this.executionInterval = setInterval(async () => {
            try {
                await this.checkAndExecuteOrders();
            } catch (error) {
                console.error('❌ Error in automatic execution:', error);
            }
        }, 30000); // 30 seconds

        console.log('✅ Automatic execution system started');
    }

    stopAutomaticExecution(): void {
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
        this.isExecutionRunning = false;
        console.log('🛑 Automatic execution system stopped');
    }

    async checkAndExecuteOrders(): Promise<void> {
        try {
            console.log('🔍 Checking orders for execution...');
            
            const orders = this.getOrdersFromStorage();
            const activeOrders = orders.filter(order => order.status === 'active');
            
            if (activeOrders.length === 0) {
                console.log('📝 No active orders to check');
                return;
            }

            console.log(`📊 Found ${activeOrders.length} active orders`);

            for (const order of activeOrders) {
                await this.checkOrderExecution(order);
            }
        } catch (error) {
            console.error('❌ Error checking orders:', error);
        }
    }

    async checkOrderExecution(order: TrailingOrderData): Promise<void> {
        try {
            console.log(`🔍 Checking order ${order.id} for execution...`);
            
            // Get current price
            const currentPrice = this.getCurrentPrice();
            if (currentPrice <= 0) {
                console.log('⚠️ Invalid current price, skipping order check');
                return;
            }

            // Update order with current price
            order.currentPrice = currentPrice.toString();
            
            // Check if price has risen (update high water mark)
            if (parseFloat(order.currentPrice) > parseFloat(order.highWaterMark)) {
                order.highWaterMark = order.currentPrice;
                console.log(`📈 High water mark updated to ${order.highWaterMark} for order ${order.id}`);
            }

            // Calculate new stop price based on trail distance
            const newStopPrice = this.calculateStopPrice(
                parseFloat(order.highWaterMark), 
                parseFloat(order.trailDistance)
            );
            
            // Update stop price if it's higher (trailing up)
            if (parseFloat(newStopPrice) > parseFloat(order.stopPrice)) {
                order.stopPrice = newStopPrice;
                console.log(`📈 Stop price updated to ${order.stopPrice} for order ${order.id}`);
            }

            // Check execution condition
            const shouldExecute = parseFloat(order.currentPrice) <= parseFloat(order.stopPrice);
            
            if (shouldExecute) {
                console.log(`🚨 EXECUTION TRIGGERED for order ${order.id}!`);
                console.log(`💰 Current Price: ${order.currentPrice}`);
                console.log(`🛑 Stop Price: ${order.stopPrice}`);
                
                await this.executeOrder(order);
            } else {
                console.log(`✅ Order ${order.id} still safe - Current: ${order.currentPrice}, Stop: ${order.stopPrice}`);
            }

            // Save updated order
            this.updateOrderInStorage(order);
            
        } catch (error) {
            console.error(`❌ Error checking order ${order.id}:`, error);
        }
    }

    async executeOrder(order: TrailingOrderData): Promise<void> {
        try {
            console.log(`🚀 Executing order ${order.id}...`);
            console.log(`📋 Execution Details:`, {
                orderId: order.id,
                assetId: order.assetId,
                amount: order.amount,
                executionPrice: order.currentPrice,
                userAddress: order.userAddress,
                stopPrice: order.stopPrice,
                highWaterMark: order.highWaterMark
            });
            
            // Check if we have a transaction signer (we'll assume it's set if we got this far)
            console.log('🔐 Transaction signer check: Assuming signer is available');
            
            // Call smart contract to execute the order
            const result = await this.contractClient.send.executeTrailingOrder({
                args: {
                    orderId: order.id,
                    assetId: order.assetId,
                    amount: order.amount,
                    executionPrice: order.currentPrice,
                    userAddress: order.userAddress
                },
                sender: order.userAddress
            });

            console.log('✅ Order executed successfully:', result);

            // Update order status
            order.status = 'executed';
            order.updatedAt = new Date().toISOString();
            order.txId = result.txIds[0];

            // Calculate PnL
            const entryPrice = parseFloat(order.entryPrice);
            const executionPrice = parseFloat(order.currentPrice);
            const pnl = (executionPrice - entryPrice) * parseFloat(order.amount);
            const pnlPercentage = ((executionPrice - entryPrice) / entryPrice) * 100;

            order.pnl = pnl.toString();
            order.pnlPercentage = pnlPercentage.toString();

            // Save updated order
            this.updateOrderInStorage(order);

            console.log(`💰 Order ${order.id} executed! PnL: ${pnl.toFixed(2)} ALGO (${pnlPercentage.toFixed(2)}%)`);

            // Send notification (you can implement this)
            this.sendExecutionNotification(order);

        } catch (error) {
            console.error(`❌ Error executing order ${order.id}:`, error);
            
            // Mark order as cancelled (closest available status)
            order.status = 'cancelled';
            order.updatedAt = new Date().toISOString();
            this.updateOrderInStorage(order);
        }
    }

    private sendExecutionNotification(order: TrailingOrderData): void {
        // You can implement browser notifications, email, or other notification methods
        console.log(`📢 NOTIFICATION: Order ${order.id} executed at ${order.currentPrice}!`);
        
        // Browser notification (if permission granted)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Order Executed!', {
                body: `Order ${order.id} executed at $${order.currentPrice}. PnL: ${order.pnl} ALGO`,
                icon: '/favicon.ico'
            });
        }
    }

    private updateOrderInStorage(order: TrailingOrderData): void {
        const orders = this.getOrdersFromStorage();
        const index = orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
            orders[index] = order;
            this.saveOrdersToStorage(orders);
        }
    }

    // 🧪 MANUAL TESTING FUNCTIONS
    private generateUniqueOrderId(assetId: string): string {
        const timestamp = Date.now();
        const randomPart1 = Math.random().toString(36).substring(2, 8).toUpperCase();
        const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderId = `TSL_${assetId}_${timestamp}_${randomPart1}_${randomPart2}`;
        console.log(`🆔 Generated unique Order ID: ${orderId}`);
        return orderId;
    }

    setManualPrice(price: number): void {
        console.log(`🧪 Setting manual price: $${price}`);
        this.priceService.setManualPrice(price);
    }

    async testOrderExecution(orderId: string, testPrice: number, executeIfTriggered: boolean = false): Promise<{ success: boolean; message: string }> {
        try {
            console.log(`🧪 Testing order ${orderId} with price $${testPrice}`);
            console.log(`🧪 Execute if triggered: ${executeIfTriggered}`);
            
            const orders = this.getOrdersFromStorage();
            console.log(`📊 Total orders in storage: ${orders.length}`);
            console.log(`📋 All orders:`, orders);
            
            const order = orders.find(o => o.id === orderId);
            console.log(`🔍 Found order:`, order);
            
            if (!order) {
                return { success: false, message: '❌ Order not found' };
            }

            if (order.status !== 'active') {
                return { success: false, message: '❌ Order is not active' };
            }

            // Set manual price
            this.setManualPrice(testPrice);
            
            // Update order with test price
            order.currentPrice = testPrice.toString();
            
            // Check if price has risen (update high water mark)
            if (parseFloat(order.currentPrice) > parseFloat(order.highWaterMark)) {
                order.highWaterMark = order.currentPrice;
                console.log(`📈 High water mark updated to ${order.highWaterMark} for order ${order.id}`);
            }

            // Calculate new stop price based on trail distance
            const newStopPrice = this.calculateStopPrice(
                parseFloat(order.highWaterMark), 
                parseFloat(order.trailDistance)
            );
            
            // Update stop price if it's higher (trailing up)
            if (parseFloat(newStopPrice) > parseFloat(order.stopPrice)) {
                order.stopPrice = newStopPrice;
                console.log(`📈 Stop price updated to ${order.stopPrice} for order ${order.id}`);
            }

            // Check execution condition
            const shouldExecute = parseFloat(order.currentPrice) <= parseFloat(order.stopPrice);
            
            console.log(`🧪 Test Results for Order ${orderId}:`);
            console.log(`💰 Current Price: $${order.currentPrice}`);
            console.log(`📈 High Water Mark: $${order.highWaterMark}`);
            console.log(`🛑 Stop Price: $${order.stopPrice}`);
            console.log(`🚨 Should Execute: ${shouldExecute ? 'YES' : 'NO'}`);

            // Save updated order
            this.updateOrderInStorage(order);

            if (shouldExecute) {
                if (executeIfTriggered) {
                    console.log(`🚀 Executing order ${orderId} as requested...`);
                    await this.executeOrder(order);
                    return { 
                        success: true, 
                        message: `🚨 ORDER EXECUTED!\n💰 Current: $${order.currentPrice}\n🛑 Stop: $${order.stopPrice}\n📊 Difference: ${(parseFloat(order.currentPrice) - parseFloat(order.stopPrice)).toFixed(4)}\n✅ Order status updated to executed` 
                    };
                } else {
                    return { 
                        success: true, 
                        message: `🚨 EXECUTION WOULD BE TRIGGERED!\n💰 Current: $${order.currentPrice}\n🛑 Stop: $${order.stopPrice}\n📊 Difference: ${(parseFloat(order.currentPrice) - parseFloat(order.stopPrice)).toFixed(4)}\n\n💡 Use "Execute Order" button to actually execute` 
                    };
                }
            } else {
                return { 
                    success: true, 
                    message: `✅ Order still safe\n💰 Current: $${order.currentPrice}\n🛑 Stop: $${order.stopPrice}\n📊 Safety margin: ${(parseFloat(order.stopPrice) - parseFloat(order.currentPrice)).toFixed(4)}` 
                };
            }

        } catch (error) {
            console.error('❌ Error testing order:', error);
            return { 
                success: false, 
                message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }

    startPriceTracking() {
        this.priceService.startPriceTracking();
    }

    stopPriceTracking() {
        this.priceService.stopPriceTracking();
    }

    getCurrentPrice(): number {
        return this.priceService.getCurrentPrice();
    }

    onPriceUpdate(callback: (price: number) => void) {
        this.priceService.onPriceUpdate(callback);
    }

    updateOrderPrices() {
        const currentPrice = this.getCurrentPrice();
        if (currentPrice === 0) return;

        const orders = this.getOrdersFromStorage();
        let hasUpdates = false;

        orders.forEach(order => {
            if (order.status === 'active') {
                order.currentPrice = currentPrice.toString();

                if (currentPrice > parseFloat(order.highWaterMark)) {
                    order.highWaterMark = currentPrice.toString();
                    const newStopPrice = currentPrice * (1 - parseFloat(order.trailDistance) / 100);
                    order.stopPrice = newStopPrice.toFixed(6);
                }

                const entryPrice = parseFloat(order.entryPrice);
                const pnl = (currentPrice - entryPrice) * parseFloat(order.amount);
                const pnlPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;

                order.pnl = pnl.toFixed(2);
                order.pnlPercentage = pnlPercentage.toFixed(2);
                order.updatedAt = new Date().toISOString();

                if (currentPrice <= parseFloat(order.stopPrice)) {
                    order.status = 'triggered';
                    console.log(`Order ${order.id} triggered at price ${currentPrice}`);
                }

                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            this.saveOrdersToStorage(orders);
        }
    }

    async createOrder(orderData: {
        assetId: string;
        amount: string;
        trailDistance: string;
        initialPrice: string;
        userAddress: string;
    }, transactionSigner?: any): Promise<{ success: boolean; orderId?: string; message: string; txId?: string }> {
        try {
            console.log('🚀 Creating trailing stop order via smart contract:', orderData);

            if (!transactionSigner) {
                throw new Error('Transaction signer is required');
            }

            // Skip balance check - let the transaction fail naturally if insufficient funds
            console.log('🚀 Proceeding with order creation - balance will be checked by the network');

            // Call the smart contract
            const result = await this.contractClient.send.createTrailingOrder({
                args: {
                    assetId: orderData.assetId,
                    amount: orderData.amount,
                    trailDistance: orderData.trailDistance,
                    initialPrice: orderData.initialPrice,
                    userAddress: orderData.userAddress
                },
                sender: orderData.userAddress,
                signer: transactionSigner
            });

            const txId = result.txIds[0];
            const contractResponse = result.return || 'Order created successfully';
            
            console.log('✅ Smart contract response:', contractResponse);
            console.log('📋 Transaction ID:', txId);

            // Generate unique order ID using the new function
            const orderId = this.generateUniqueOrderId(orderData.assetId);

            // Save to local storage for UI display
            const orderRecord: TrailingOrderData = {
                id: orderId,
                assetId: orderData.assetId,
                assetName: 'Algorand',
                assetSymbol: 'ALGO',
                amount: orderData.amount,
                entryPrice: orderData.initialPrice,
                currentPrice: orderData.initialPrice,
                stopPrice: this.calculateStopPrice(parseFloat(orderData.initialPrice), parseFloat(orderData.trailDistance)),
                trailDistance: orderData.trailDistance,
                trailDistanceType: 'percentage',
                highWaterMark: orderData.initialPrice,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                pnl: '0',
                pnlPercentage: '0',
                userAddress: orderData.userAddress,
                orderType: 'trailing',
                txId: txId
            };

            this.saveOrderToStorage(orderRecord);

            return {
                success: true,
                orderId: orderId,
                message: `✅ Order created successfully! Contract Response: ${contractResponse}`,
                txId: txId
            };
        } catch (error) {
            console.error('❌ Order creation error:', error);
            console.error('❌ Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace',
                cause: (error as any)?.cause,
                code: (error as any)?.code,
                data: (error as any)?.data
            });
            
            // Check if it's a network error
            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                return {
                    success: false,
                    message: `❌ Network Error: Unable to connect to Algorand TestNet. Please check your internet connection and try again.`
                };
            }
            
            return {
                success: false,
                message: `❌ Order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    async getUserOrders(userAddress: string): Promise<TrailingOrderData[]> {
        try {
            const orders = this.getOrdersFromStorage();
            return orders.filter(order => order.userAddress === userAddress);
        } catch (error) {
            console.error('Error fetching user orders:', error);
            return [];
        }
    }

    async getAccountBalance(userAddress: string): Promise<number> {
        try {
            console.log('🔍 Fetching balance for address:', userAddress);
            
            // Try multiple API sources in parallel
            const apiPromises = [
                // Algonode API
                fetch(`https://testnet-api.algonode.cloud/v2/accounts/${userAddress}`)
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null),
                
                // PureStake API
                fetch(`https://testnet-algorand.api.purestake.io/ps2/v2/accounts/${userAddress}`, {
                    headers: {
                        'X-API-Key': 'demo' // Demo key for PureStake
                    }
                })
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null),
                
                // AlgoExplorer API
                fetch(`https://testnet.algoexplorer.io/api/v2/accounts/${userAddress}`)
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null)
            ];
            
            const results = await Promise.allSettled(apiPromises);
            
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result.status === 'fulfilled' && result.value) {
                    const data = result.value;
                    const apiName = ['Algonode', 'PureStake', 'AlgoExplorer'][i];
                    
                    console.log(`📊 ${apiName} API response:`, data);
                    
                    const balance = data.amount || data.account?.amount || 0;
                    if (balance > 0) {
                        console.log(`✅ ${apiName} API success - Balance:`, balance, 'microAlgos');
                        return balance;
                    }
                }
            }
            
            console.log('❌ All API methods failed, returning 0');
            return 0;
            
        } catch (error) {
            console.error('❌ Error fetching account balance:', error);
            return 0;
        }
    }

    async getOrderDetails(orderId: string): Promise<string> {
        try {
            const result = await this.contractClient.send.getOrderDetails({
                args: {
                    orderId: orderId
                },
                sender: 'YIWNSMNTHC3AJJPUWJQVBNOU7LTIOS4HVSPZL5UUKWETPTFCKAAI4RYHNA' // Default sender
            });
            
            return result.return || 'Order details not found';
        } catch (error) {
            console.error('Error fetching order details:', error);
            return 'Error fetching order details';
        }
    }

    async getPlatformStats(): Promise<string> {
        try {
            const result = await this.contractClient.send.getPlatformStats({
                args: {},
                sender: 'YIWNSMNTHC3AJJPUWJQVBNOU7LTIOS4HVSPZL5UUKWETPTFCKAAI4RYHNA' // Default sender
            });
            
            return result.return || 'Platform stats not available';
        } catch (error) {
            console.error('Error fetching platform stats:', error);
            return 'Error fetching platform stats';
        }
    }

    async cancelOrder(orderId: string, userAddress: string, transactionSigner?: any): Promise<{ success: boolean; message: string; txId?: string }> {
        try {
            if (!transactionSigner) {
                throw new Error('Transaction signer is required');
            }

            const result = await this.contractClient.send.cancelTrailingOrder({
                args: {
                    orderId: orderId,
                    userAddress: userAddress
                },
                sender: userAddress,
                signer: transactionSigner
            });

            const txId = result.txIds[0];
            const contractResponse = result.return || 'Order cancelled successfully';

            // Update local storage
            const orders = this.getOrdersFromStorage();
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].status = 'cancelled';
                orders[orderIndex].txId = txId;
                this.saveOrdersToStorage(orders);
            }

            return {
                success: true,
                message: `✅ Order cancelled successfully! ${contractResponse}`,
                txId: txId
            };
        } catch (error) {
            console.error('Error cancelling order:', error);
            return {
                success: false,
                message: `❌ Error cancelling order: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    private calculateStopPrice(entryPrice: number, trailDistance: number): string {
        const stopPrice = entryPrice * (1 - trailDistance / 100);
        return stopPrice.toFixed(6);
    }

    private saveOrderToStorage(order: TrailingOrderData) {
        const orders = this.getOrdersFromStorage();
        orders.push(order);
        this.saveOrdersToStorage(orders);
    }

    private getOrdersFromStorage(): TrailingOrderData[] {
        try {
            const stored = localStorage.getItem('trailingStopOrders');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading orders from storage:', error);
            return [];
        }
    }

    private saveOrdersToStorage(orders: TrailingOrderData[]) {
        try {
            localStorage.setItem('trailingStopOrders', JSON.stringify(orders));
        } catch (error) {
            console.error('Error saving orders to storage:', error);
        }
    }
}

const trailingStopDataService = new TrailingStopDataService();
export default trailingStopDataService;