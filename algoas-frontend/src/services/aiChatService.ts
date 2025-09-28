import { FinancialAnalysisService } from './financialAnalysisService'
import { GeminiApiService } from './geminiApiService'

export interface ChatMessage {
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: Date
    analysisData?: any
}

export interface ChatContext {
    userAddress?: string
    portfolioData?: any
    marketData?: any
    walletData?: any
    currentTab?: string
}

export class AIChatService {
    private financialAnalysisService: FinancialAnalysisService
    public geminiApiService: GeminiApiService
    private chatHistory: ChatMessage[] = []
    private context: ChatContext = {}

    constructor() {
        this.financialAnalysisService = new FinancialAnalysisService()
        this.geminiApiService = new GeminiApiService()
    }

    /**
     * Initialize chat with user context
     */
    initializeChat(userAddress: string, portfolioData?: any, marketData?: any) {
        this.context = {
            userAddress,
            portfolioData,
            marketData
        }
        
        // Only add welcome message if chat history is empty
        if (this.chatHistory.length === 0) {
            this.addAIMessage(
                `👋 Hello! I'm your Algorand blockchain expert assistant. ` +
                `I can only answer questions about Algorand and blockchain technologies. ` +
                `I can help you with Algorand staking, DeFi, tokenomics, and comparisons with other blockchains.\n\n` +
                `🔗 **Pera Wallet Connected:** ${userAddress ? `✅ ${userAddress.substring(0, 8)}...${userAddress.substring(-8)}` : '❌ Not connected'}\n` +
                `📊 **Portfolio Data:** ${portfolioData ? '✅ Available' : '❌ Not available'}\n\n` +
                `💡 You can ask questions about portfolio, market, risk analysis and investment recommendations.\n\n` +
                `How can I help you today?`
            )
        }
    }

    /**
     * Get user's wallet summary for display
     */
    getWalletSummary(): string {
        if (!this.context.userAddress) {
            return '❌ Wallet not connected'
        }

        try {
            const userStakes = JSON.parse(localStorage.getItem('userStakes') || '[]')
            const userTransactions = JSON.parse(localStorage.getItem('userTransactions') || '[]')
            
            const userStakeTransactions = userStakes.filter((stake: any) => 
                stake.userAddress === this.context.userAddress
            )
            
            const userTxTransactions = userTransactions.filter((tx: any) => 
                tx.userAddress === this.context.userAddress
            )

            const totalStaked = userStakeTransactions.reduce((sum: number, stake: any) => sum + (stake.amount || 0), 0)
            const activeStakes = userStakeTransactions.filter((stake: any) => stake.status === 'active').length

            return `🔗 **Wallet Summary:**
• **Address:** ${this.context.userAddress.substring(0, 8)}...${this.context.userAddress.substring(-8)}
• **Total Staked:** ${totalStaked.toFixed(2)} ALGO
• **Active Stakes:** ${activeStakes} positions
• **Total Transactions:** ${userTxTransactions.length} transactions
• **Last Transaction:** ${userTxTransactions.length > 0 ? new Date(userTxTransactions[userTxTransactions.length - 1].timestamp).toLocaleDateString('en-US') : 'None'}`
        } catch (error) {
            console.error('Error getting wallet summary:', error)
            return '❌ Wallet data could not be retrieved'
        }
    }

    /**
     * Get user's wallet data and transactions
     */
    async getUserWalletData(): Promise<any> {
        if (!this.context.userAddress) {
            return null
        }

        try {
            // Get user's stake transactions from localStorage
            const userStakes = JSON.parse(localStorage.getItem('userStakes') || '[]')
            const userTransactions = JSON.parse(localStorage.getItem('userTransactions') || '[]')
            
            // Filter transactions for this user
            const userStakeTransactions = userStakes.filter((stake: any) => 
                stake.userAddress === this.context.userAddress
            )
            
            const userTxTransactions = userTransactions.filter((tx: any) => 
                tx.userAddress === this.context.userAddress
            )

            // Get account balance (mock for now)
            const accountBalance = await this.getAccountBalance(this.context.userAddress)

            return {
                address: this.context.userAddress,
                balance: accountBalance,
                stakeTransactions: userStakeTransactions,
                allTransactions: userTxTransactions,
                totalStaked: userStakeTransactions.reduce((sum: number, stake: any) => sum + (stake.amount || 0), 0),
                activeStakes: userStakeTransactions.filter((stake: any) => stake.status === 'active').length,
                lastTransaction: userTxTransactions.length > 0 ? userTxTransactions[userTxTransactions.length - 1] : null
            }
        } catch (error) {
            console.error('Error getting wallet data:', error)
            return null
        }
    }

    /**
     * Get account balance (mock implementation)
     */
    private async getAccountBalance(address: string): Promise<number> {
        try {
            // This would normally call Algorand API
            // For now, return a mock balance
            return Math.random() * 1000 // Mock balance between 0-1000 ALGO
        } catch (error) {
            console.error('Error getting account balance:', error)
            return 0
        }
    }

    /**
     * Process user message and generate AI response
     */
    async processMessage(userMessage: string): Promise<ChatMessage> {
        console.log('🚀 Processing message:', userMessage)
        
        // Add user message to history
        const userMsg = this.addUserMessage(userMessage)
        console.log('✅ User message added to history')
        
        try {
            // Get user's wallet data and transactions
            const userWalletData = await this.getUserWalletData()
            console.log('📊 Wallet Data:', userWalletData)
            
            // Check if we should use real AI API or fallback
            const useRealAI = this.shouldUseRealAI(userMessage)
            console.log('🤖 Using AI API:', useRealAI ? 'Yes' : 'No')
            
            let aiResponse: {content: string, analysisData?: any}
            
            if (useRealAI) {
                // Use Gemini API with wallet data
                const geminiResponse = await this.geminiApiService.generateAIResponse(userMessage, {
                    userAddress: this.context.userAddress,
                    portfolioData: this.context.portfolioData,
                    marketData: this.context.marketData,
                    walletData: userWalletData,
                    chatHistory: this.chatHistory.slice(-5) // Son 5 mesaj
                })
                
                aiResponse = {
                    content: geminiResponse.content,
                    analysisData: {
                        ...geminiResponse.analysisData,
                        source: geminiResponse.source,
                        timestamp: new Date().toISOString()
                    }
                }
                
                console.log('✅ Gemini AI response generated:', geminiResponse.source)
            } else {
                // Use local intent-based responses
                const intent = this.analyzeIntent(userMessage)
                console.log('🎯 Detected intent:', intent)
                
                aiResponse = await this.generateResponse(intent, userMessage)
                console.log('🤖 Generated local response')
            }
            
            // Add AI response to history
            const aiMsg = this.addAIMessage(aiResponse.content, aiResponse.analysisData)
            console.log('✅ AI response added to history')
            
            return aiMsg
            
        } catch (error) {
            console.error('❌ AI Chat processing error:', error)
            return this.addAIMessage(
                'Üzgünüm, şu anda bir hata oluştu. Lütfen tekrar deneyin. 🔄',
                null
            )
        }
    }

    /**
     * Determine if we should use real AI API or local responses
     */
    private shouldUseRealAI(message: string): boolean {
        // GEÇİCİ TEST: Her zaman AI API kullan
        if (!this.geminiApiService.isAIConfigured()) {
            console.log('❌ Gemini API not configured, using local responses')
            return false
        }
        
        console.log('🧪 TEST MODE: Always using Gemini API')
        return true
        
        // Orijinal kod (şimdilik devre dışı)
        /*
        const lowerMessage = message.toLowerCase()
        
        // Algorand spesifik sorular için AI kullan (en yüksek öncelik)
        const algorandKeywords = [
            'algorand', 'algo', 'defi', 'tokenomics', 'ekonomi', 'ekonomik',
            'token', 'staking', 'consensus', 'ppos', 'teal', 'avm',
            'pyteal', 'reach', 'beaker', 'algokit', 'sdk', 'ekosistem',
            'ecosystem', 'teknik', 'technical', 'karşılaştır', 'compare',
            'vs', 'fark', 'difference', 'özellik', 'feature', 'ayıran',
            'distinguishes', 'avantaj', 'advantage', 'neden', 'why'
        ]
        
        if (algorandKeywords.some(keyword => lowerMessage.includes(keyword))) {
            console.log('✅ Algorand-specific question detected, using AI API')
            return true
        }
        
        // Soru işareti veya "nedir" içeren mesajlar için AI kullan
        if (lowerMessage.includes('?') || lowerMessage.includes('nedir') || lowerMessage.includes('what is')) {
            console.log('✅ Question detected, using AI API')
            return true
        }
        
        // AI API kullanım kriterleri
        const useAIKeywords = [
            'analiz', 'analysis', 'değerlendir', 'evaluate',
            'strateji', 'strategy', 'tavsiye', 'recommend',
            'optimize', 'iyileştir', 'detaylı', 'detailed',
            'kapsamlı', 'comprehensive', 'nasıl', 'how',
            'ne zaman', 'when', 'portfolyo', 'portfolio',
            'yatırım', 'investment', 'piyasa', 'market'
        ]
        
        // AI keywords varsa AI kullan
        if (useAIKeywords.some(keyword => lowerMessage.includes(keyword))) {
            console.log('✅ AI keyword detected, using AI API')
            return true
        }
        
        // Uzun mesajlar için AI kullan
        if (message.length > 30) {
            console.log('✅ Long message detected, using AI API')
            return true
        }
        
        // Kısa mesajlar için local kullan
        console.log('❌ Short/simple message, using local responses')
        return false
        */
    }

    /**
     * Analyze user intent from message
     */
    private analyzeIntent(message: string): string {
        const lowerMessage = message.toLowerCase()
        
        console.log('🔍 Analyzing intent for message:', lowerMessage)
        
        // Check for specific questions FIRST - highest priority
        if (lowerMessage.includes('nedir') || lowerMessage.includes('what is') ||
            lowerMessage.includes('nasıl') || lowerMessage.includes('how') ||
            lowerMessage.includes('ne kadar') || lowerMessage.includes('kaç') ||
            lowerMessage.includes('when') || lowerMessage.includes('?') ||
            lowerMessage.includes('özellik') || lowerMessage.includes('feature') ||
            lowerMessage.includes('fark') || lowerMessage.includes('difference') ||
            lowerMessage.includes('ayıran') || lowerMessage.includes('distinguishes') ||
            lowerMessage.includes('avantaj') || lowerMessage.includes('advantage') ||
            lowerMessage.includes('neden') || lowerMessage.includes('why') ||
            lowerMessage.includes('tokenomics') || lowerMessage.includes('ekonomi') ||
            lowerMessage.includes('ekonomik') || lowerMessage.includes('token') ||
            lowerMessage.includes('defi') || lowerMessage.includes('ekosistem') ||
            lowerMessage.includes('ecosystem') || lowerMessage.includes('teknik') ||
            lowerMessage.includes('technical') || lowerMessage.includes('teal') ||
            lowerMessage.includes('consensus') || lowerMessage.includes('ppos') ||
            lowerMessage.includes('avm') || lowerMessage.includes('pyteal') ||
            lowerMessage.includes('reach') || lowerMessage.includes('beaker') ||
            lowerMessage.includes('algokit') || lowerMessage.includes('sdk')) {
            console.log('✅ Intent: specific_question')
            return 'specific_question'
        }
        
        // Portfolio analysis keywords - more comprehensive
        if (lowerMessage.includes('portfolyo') || lowerMessage.includes('portfolio') || 
            lowerMessage.includes('yatırım') || lowerMessage.includes('investment') ||
            lowerMessage.includes('hesabım') || lowerMessage.includes('balance') ||
            lowerMessage.includes('bakiye') || lowerMessage.includes('wallet') ||
            lowerMessage.includes('cüzdan') || lowerMessage.includes('stake') ||
            lowerMessage.includes('unstake')) {
            console.log('✅ Intent: portfolio_analysis')
            return 'portfolio_analysis'
        }
        
        // Market analysis keywords - more comprehensive
        if (lowerMessage.includes('piyasa') || lowerMessage.includes('market') || 
            lowerMessage.includes('trend') || lowerMessage.includes('fiyat') ||
            lowerMessage.includes('price') || lowerMessage.includes('algo') ||
            lowerMessage.includes('coin') || lowerMessage.includes('kripto') ||
            lowerMessage.includes('crypto') || lowerMessage.includes('bull') ||
            lowerMessage.includes('bear') || lowerMessage.includes('yüksel') ||
            lowerMessage.includes('düş') || lowerMessage.includes('artış')) {
            console.log('✅ Intent: market_analysis')
            return 'market_analysis'
        }
        
        // Risk analysis keywords - more comprehensive
        if (lowerMessage.includes('risk') || lowerMessage.includes('güvenli') || 
            lowerMessage.includes('safe') || lowerMessage.includes('zarar') ||
            lowerMessage.includes('loss') || lowerMessage.includes('tehlikeli') ||
            lowerMessage.includes('dangerous') || lowerMessage.includes('güven') ||
            lowerMessage.includes('security') || lowerMessage.includes('emniyet')) {
            console.log('✅ Intent: risk_analysis')
            return 'risk_analysis'
        }
        
        // Performance analysis keywords - more comprehensive
        if (lowerMessage.includes('performans') || lowerMessage.includes('performance') || 
            lowerMessage.includes('getiri') || lowerMessage.includes('apy') ||
            lowerMessage.includes('yield') || lowerMessage.includes('kazanç') ||
            lowerMessage.includes('profit') || lowerMessage.includes('başarı') ||
            lowerMessage.includes('success') || lowerMessage.includes('roi') ||
            lowerMessage.includes('return') || lowerMessage.includes('kar')) {
            console.log('✅ Intent: performance_analysis')
            return 'performance_analysis'
        }
        
        // Recommendation keywords - more comprehensive
        if (lowerMessage.includes('öner') || lowerMessage.includes('recommend') || 
            lowerMessage.includes('ne yap') || lowerMessage.includes('tavsiye') ||
            lowerMessage.includes('suggest') || lowerMessage.includes('hangi') ||
            lowerMessage.includes('which') || lowerMessage.includes('en iyi') ||
            lowerMessage.includes('best') || lowerMessage.includes('pool') ||
            lowerMessage.includes('yatırım yap') || lowerMessage.includes('invest')) {
            console.log('✅ Intent: recommendation')
            return 'recommendation'
        }
        
        // General help
        if (lowerMessage.includes('yardım') || lowerMessage.includes('help') || 
            lowerMessage.includes('ne yapabilir') || lowerMessage.includes('what can') ||
            lowerMessage.includes('nasıl') || lowerMessage.includes('how') ||
            lowerMessage.includes('kullan') || lowerMessage.includes('use')) {
            console.log('✅ Intent: help')
            return 'help'
        }
        
        
        console.log('✅ Intent: general')
        return 'general'
    }

    /**
     * Generate AI response based on intent
     */
    private async generateResponse(intent: string, userMessage: string): Promise<{content: string, analysisData?: any}> {
        console.log('🤖 Generating response for intent:', intent)
        
        switch (intent) {
            case 'portfolio_analysis':
                return await this.handlePortfolioAnalysis()
                
            case 'market_analysis':
                return await this.handleMarketAnalysis()
                
            case 'risk_analysis':
                return await this.handleRiskAnalysis()
                
            case 'performance_analysis':
                return await this.handlePerformanceAnalysis()
                
            case 'recommendation':
                return await this.handleRecommendation()
                
            case 'help':
                return this.handleHelp()
                
            case 'specific_question':
                return this.handleSpecificQuestion(userMessage)
                
            default:
                return this.handleGeneralQuery(userMessage)
        }
    }

    /**
     * Handle portfolio analysis requests
     */
    private async handlePortfolioAnalysis(): Promise<{content: string, analysisData?: any}> {
        if (!this.context.userAddress) {
            return {
                content: 'Portfolyo analizi için önce cüzdanınızı bağlamanız gerekiyor. 🔗'
            }
        }

        try {
            const portfolioMetrics = await this.financialAnalysisService.analyzePortfolio(this.context.userAddress)
            
            const analysisData = {
                type: 'portfolio_metrics',
                data: portfolioMetrics
            }
            
            const content = `📊 **Portfolyo Analizi Raporu**\n\n` +
                `💰 **Toplam Değer**: ${portfolioMetrics.totalValue.toFixed(2)} ALGO\n` +
                `🎯 **Stake Edilen**: ${portfolioMetrics.totalStaked.toFixed(2)} ALGO\n` +
                `🎁 **Toplam Ödüller**: ${portfolioMetrics.totalRewards.toFixed(2)} ALGO\n` +
                `📈 **APY**: %${portfolioMetrics.apy.toFixed(2)}\n` +
                `⚡ **Performans Skoru**: ${portfolioMetrics.performanceScore}/100\n` +
                `🎲 **Risk Skoru**: ${(portfolioMetrics.riskScore * 100).toFixed(1)}%\n` +
                `📊 **Volatilite**: %${(portfolioMetrics.volatility * 100).toFixed(2)}\n` +
                `🎯 **Sharpe Oranı**: ${portfolioMetrics.sharpeRatio.toFixed(2)}\n` +
                `📉 **Max Düşüş**: %${(portfolioMetrics.maxDrawdown * 100).toFixed(2)}\n` +
                `🏆 **Kazanma Oranı**: %${portfolioMetrics.winRate.toFixed(1)}\n\n` +
                `**Değerlendirme**: ${this.getPortfolioAssessment(portfolioMetrics)}`
            
            return { content, analysisData }
            
        } catch (error) {
            return {
                content: 'Portfolyo analizi sırasında bir hata oluştu. Lütfen tekrar deneyin. 🔄'
            }
        }
    }

    /**
     * Handle market analysis requests
     */
    private async handleMarketAnalysis(): Promise<{content: string, analysisData?: any}> {
        try {
            const marketTrends = await this.financialAnalysisService.getMarketTrends()
            
            const analysisData = {
                type: 'market_trends',
                data: marketTrends
            }
            
            const trendEmoji = marketTrends.overallTrend === 'bullish' ? '🚀' : 
                              marketTrends.overallTrend === 'bearish' ? '📉' : '➡️'
            
            const content = `📈 **Piyasa Analizi**\n\n` +
                `${trendEmoji} **Genel Trend**: ${marketTrends.overallTrend.toUpperCase()}\n` +
                `📊 **Güven Skoru**: ${marketTrends.confidence}/100\n\n` +
                `**Ana Faktörler**:\n` +
                marketTrends.keyFactors.map(factor => `• ${factor}`).join('\n') + '\n\n' +
                `**Piyasa Öngörüleri**:\n` +
                marketTrends.predictions.map(pred => 
                    `• ${pred.timeframe}: ${pred.prediction} (${pred.confidence}% güven)`
                ).join('\n')
            
            return { content, analysisData }
            
        } catch (error) {
            return {
                content: 'Piyasa analizi sırasında bir hata oluştu. Lütfen tekrar deneyin. 🔄'
            }
        }
    }

    /**
     * Handle risk analysis requests
     */
    private async handleRiskAnalysis(): Promise<{content: string, analysisData?: any}> {
        try {
            const riskAssessment = await this.financialAnalysisService.assessRisk(this.context.userAddress || '')
            
            const analysisData = {
                type: 'risk_assessment',
                data: riskAssessment
            }
            
            const riskLevel = riskAssessment.overallRisk
            const riskEmoji = riskLevel === 'low' ? '🟢' : riskLevel === 'medium' ? '🟡' : '🔴'
            
            const content = `🎲 **Risk Analizi Raporu**\n\n` +
                `${riskEmoji} **Genel Risk Seviyesi**: ${riskLevel.toUpperCase()}\n\n` +
                `**Risk Faktörleri**:\n` +
                riskAssessment.riskFactors.map((factor: any) => 
                    `• ${factor.factor}: ${factor.impact.toUpperCase()} - ${factor.description}`
                ).join('\n') + '\n\n' +
                `**Risk Azaltma Önerileri**:\n` +
                riskAssessment.recommendations.map((strategy: any) => 
                    `• ${strategy}`
                ).join('\n') + '\n\n' +
                `**Genel Değerlendirme**: Portfolyonuzun risk seviyesi ${riskLevel} olarak değerlendirilmiştir. Yukarıdaki önerileri dikkate alarak risk yönetiminizi optimize edebilirsiniz.`
            
            return { content, analysisData }
            
        } catch (error) {
            return {
                content: 'Risk analizi sırasında bir hata oluştu. Lütfen tekrar deneyin. 🔄'
            }
        }
    }

    /**
     * Handle performance analysis requests
     */
    private async handlePerformanceAnalysis(): Promise<{content: string, analysisData?: any}> {
        if (!this.context.userAddress) {
            return {
                content: 'Performans analizi için önce cüzdanınızı bağlamanız gerekiyor. 🔗'
            }
        }

        try {
            const portfolioMetrics = await this.financialAnalysisService.analyzePortfolio(this.context.userAddress)
            
            const analysisData = {
                type: 'performance_metrics',
                data: portfolioMetrics
            }
            
            const content = `⚡ **Performans Analizi**\n\n` +
                `📈 **APY**: %${portfolioMetrics.apy.toFixed(2)}\n` +
                `🎯 **Performans Skoru**: ${portfolioMetrics.performanceScore}/100\n` +
                `📊 **Sharpe Oranı**: ${portfolioMetrics.sharpeRatio.toFixed(2)}\n` +
                `📉 **Max Düşüş**: %${(portfolioMetrics.maxDrawdown * 100).toFixed(2)}\n` +
                `🏆 **Kazanma Oranı**: %${portfolioMetrics.winRate.toFixed(1)}\n` +
                `🎲 **Volatilite**: %${(portfolioMetrics.volatility * 100).toFixed(2)}\n\n` +
                `**Performans Değerlendirmesi**:\n` +
                this.getPerformanceAssessment(portfolioMetrics) + '\n\n' +
                `**İyileştirme Önerileri**:\n` +
                this.getPerformanceRecommendations(portfolioMetrics)
            
            return { content, analysisData }
            
        } catch (error) {
            return {
                content: 'Performans analizi sırasında bir hata oluştu. Lütfen tekrar deneyin. 🔄'
            }
        }
    }

    /**
     * Handle recommendation requests
     */
    private async handleRecommendation(): Promise<{content: string, analysisData?: any}> {
        try {
            const poolAnalysis = await this.financialAnalysisService.analyzePools(['pool1', 'pool2', 'pool3'])
            
            const analysisData = {
                type: 'pool_recommendations',
                data: poolAnalysis
            }
            
            const content = `🎯 **Yatırım Önerileri**\n\n` +
                `**En İyi Pool'lar**:\n` +
                poolAnalysis.map((pool: any, index: number) => 
                    `${index + 1}. **${pool.poolName}**\n` +
                    `   📈 APY: %${pool.apy.toFixed(2)}\n` +
                    `   🎯 Risk: ${pool.riskLevel}\n` +
                    `   💰 TVL: ${pool.tvl.toFixed(2)} ALGO\n` +
                    `   ⭐ Likidite Skoru: ${pool.liquidityScore}/100\n` +
                    `   📊 Öneri: ${pool.recommendation.toUpperCase()}\n`
                ).join('\n') + '\n\n' +
                `**Genel Değerlendirme**:\n` +
                `• Toplam ${poolAnalysis.length} pool analiz edildi\n` +
                `• Ortalama APY: %${(poolAnalysis.reduce((sum: number, pool: any) => sum + pool.apy, 0) / poolAnalysis.length).toFixed(2)}\n` +
                `• Risk dağılımı: ${poolAnalysis.filter((p: any) => p.riskLevel === 'low').length} düşük, ${poolAnalysis.filter((p: any) => p.riskLevel === 'medium').length} orta, ${poolAnalysis.filter((p: any) => p.riskLevel === 'high').length} yüksek`
            
            return { content, analysisData }
            
        } catch (error) {
            return {
                content: 'Yatırım önerileri alınırken bir hata oluştu. Lütfen tekrar deneyin. 🔄'
            }
        }
    }

    /**
     * Handle help requests
     */
    private handleHelp(): {content: string, analysisData?: any} {
        const content = `🤖 **AI Analiz Asistanı Yardım**\n\n` +
            `Size şu konularda yardımcı olabilirim:\n\n` +
            `📊 **Portfolyo Analizi**: "Portfolyom nasıl?" veya "Yatırımlarımı analiz et"\n` +
            `📈 **Piyasa Analizi**: "Piyasa nasıl?" veya "Trend analizi yap"\n` +
            `🎲 **Risk Analizi**: "Risk seviyem nedir?" veya "Güvenli mi?"\n` +
            `⚡ **Performans**: "Performansım nasıl?" veya "Getiri analizi"\n` +
            `🎯 **Öneriler**: "Ne önerirsin?" veya "Hangi pool'a yatırım yapayım?"\n\n` +
            `**Örnek Sorular**:\n` +
            `• "Portfolyomun risk seviyesi nedir?"\n` +
            `• "Hangi pool'lar en iyi performansı gösteriyor?"\n` +
            `• "Piyasa trendi nasıl, ne yapmalıyım?"\n` +
            `• "APY'mi nasıl artırabilirim?"\n\n` +
            `💡 **İpucu**: Sorularınızı Türkçe veya İngilizce sorabilirsiniz!`
        
        return { content, analysisData: null }
    }

    /**
     * Handle specific questions
     */
    private handleSpecificQuestion(userMessage: string): {content: string, analysisData?: any} {
        const lowerMessage = userMessage.toLowerCase()
        
        // Common specific questions with direct answers
        if (lowerMessage.includes('algo nedir') || lowerMessage.includes('what is algo') ||
            lowerMessage.includes('algorand nedir') || lowerMessage.includes('what is algorand')) {
            return {
                content: `🪙 **Algorand (ALGO) Nedir?**\n\n` +
                `Algorand, hızlı ve güvenli blockchain teknolojisi sunan bir kripto para birimidir.\n\n` +
                `**Özellikler:**\n` +
                `• ⚡ Hızlı işlemler (4.5 saniye)\n` +
                `• 🔒 Güvenli Proof-of-Stake\n` +
                `• 💚 Çevre dostu\n` +
                `• 🌍 Global erişim\n\n` +
                `**DeFi Kullanımı:**\n` +
                `• Liquidity mining\n` +
                `• Yield farming\n` +
                `• Staking rewards\n` +
                `• DEX trading\n\n` +
                `Portfolyonuzda ALGO analizi yapmak ister misiniz? 📊`,
                analysisData: null
            }
        }
        
        if (lowerMessage.includes('staking nedir') || lowerMessage.includes('what is staking')) {
            return {
                content: `🎯 **Staking Nedir?**\n\n` +
                `Staking, kripto para birimlerinizi blockchain ağında kilitleyerek ödül kazanma işlemidir.\n\n` +
                `**Nasıl Çalışır:**\n` +
                `• 💰 ALGO'larınızı stake edersiniz\n` +
                `• 🔒 Belirli süre kilitleme\n` +
                `• 🎁 APY ödülleri alırsınız\n` +
                `• 📈 Pasif gelir elde edersiniz\n\n` +
                `**Avantajlar:**\n` +
                `• Risk düşük\n` +
                `• Güvenli gelir\n` +
                `• Ağ güvenliğine katkı\n\n` +
                `Staking performansınızı analiz etmek ister misiniz? 📊`,
                analysisData: null
            }
        }
        
        if (lowerMessage.includes('apy nedir') || lowerMessage.includes('what is apy')) {
            return {
                content: `📈 **APY (Annual Percentage Yield) Nedir?**\n\n` +
                `APY, yıllık yüzde getiri oranıdır. Yatırımınızdan ne kadar kazanç elde edeceğinizi gösterir.\n\n` +
                `**Hesaplama:**\n` +
                `• 💰 Ana para + bileşik faiz\n` +
                `• 📊 Yıllık bazda\n` +
                `• 🎯 Net getiri oranı\n\n` +
                `**Örnek:**\n` +
                `• %10 APY = 100 ALGO → 110 ALGO (1 yıl)\n` +
                `• %15 APY = 100 ALGO → 115 ALGO (1 yıl)\n\n` +
                `Mevcut APY'nizi kontrol etmek ister misiniz? 🎯`,
                analysisData: null
            }
        }
        
        if (lowerMessage.includes('risk nedir') || lowerMessage.includes('what is risk')) {
            return {
                content: `🎲 **Risk Analizi Nedir?**\n\n` +
                `Risk analizi, yatırımlarınızın potansiyel kayıplarını değerlendirme sürecidir.\n\n` +
                `**Risk Türleri:**\n` +
                `• 📉 Piyasa riski\n` +
                `• 🔒 Likidite riski\n` +
                `• 💰 Volatilite riski\n` +
                `• 🏦 Smart contract riski\n\n` +
                `**Risk Seviyeleri:**\n` +
                `• 🟢 Düşük: %0-30\n` +
                `• 🟡 Orta: %30-60\n` +
                `• 🔴 Yüksek: %60-100\n\n` +
                `Portfolyonuzun risk seviyesini analiz etmek ister misiniz? 🛡️`,
                analysisData: null
            }
        }
        
        if (lowerMessage.includes('defi nedir') || lowerMessage.includes('what is defi')) {
            return {
                content: `🏦 **DeFi (Decentralized Finance) Nedir?**\n\n` +
                `DeFi, merkezi olmayan finansal hizmetler sunan blockchain tabanlı sistemlerdir.\n\n` +
                `**DeFi Özellikleri:**\n` +
                `• 🏦 Bankasız finans\n` +
                `• 🔓 Açık kaynak kod\n` +
                `• 🌍 Global erişim\n` +
                `• 💰 Düşük maliyet\n` +
                `• ⚡ Hızlı işlemler\n\n` +
                `**Algorand DeFi:**\n` +
                `• Liquidity Mining\n` +
                `• Yield Farming\n` +
                `• Staking Rewards\n` +
                `• DEX Trading\n\n` +
                `Algorand DeFi ekosisteminde yatırım yapmak ister misiniz? 🚀`,
                analysisData: null
            }
        }
        
        if (lowerMessage.includes('liquidity nedir') || lowerMessage.includes('what is liquidity')) {
            return {
                content: `💧 **Liquidity (Likidite) Nedir?**\n\n` +
                `Likidite, bir varlığın hızlıca nakde çevrilebilme kolaylığıdır.\n\n` +
                `**Likidite Türleri:**\n` +
                `• 💰 Yüksek Likidite: Kolay alım-satım\n` +
                `• 🔒 Düşük Likidite: Zor alım-satım\n` +
                `• 📊 Orta Likidite: Dengeli işlem\n\n` +
                `**Liquidity Mining:**\n` +
                `• Pool'lara likidite sağlama\n` +
                `• APY ödülleri alma\n` +
                `• Pasif gelir elde etme\n` +
                `• Risk-getiri dengesi\n\n` +
                `Likidite mining stratejinizi analiz etmek ister misiniz? 📈`,
                analysisData: null
            }
        }
        
        if (lowerMessage.includes('yield farming nedir') || lowerMessage.includes('what is yield farming')) {
            return {
                content: `🌾 **Yield Farming Nedir?**\n\n` +
                `Yield Farming, kripto varlıklarınızı farklı protokollerde kullanarak maksimum getiri elde etme stratejisidir.\n\n` +
                `**Nasıl Çalışır:**\n` +
                `• 💰 Token'larınızı stake edersiniz\n` +
                `• 🎁 Ödül token'ları alırsınız\n` +
                `• 📈 APY optimizasyonu yaparsınız\n` +
                `• 🔄 Otomatik compound edersiniz\n\n` +
                `**Riskler:**\n` +
                `• Smart contract riski\n` +
                `• Impermanent loss\n` +
                `• Volatilite riski\n\n` +
                `Yield farming stratejinizi optimize etmek ister misiniz? 🎯`,
                analysisData: null
            }
        }
        
        // Algorand specific questions about features and differences
        if (lowerMessage.includes('algorand') && (lowerMessage.includes('özellik') || lowerMessage.includes('fark') || lowerMessage.includes('ayıran'))) {
            return {
                content: `🚀 **Algorand'ın Diğer Blockchain'lerden Ayıran Özellikleri:**\n\n` +
                `**⚡ Hız ve Performans:**\n` +
                `• 4.5 saniye finality (Bitcoin: 60 dk, Ethereum: 6-15 dk)\n` +
                `• 6000+ TPS kapasitesi (Bitcoin: 7 TPS, Ethereum: 15 TPS)\n` +
                `• Anında işlem onayı\n` +
                `• Düşük latency (< 1 saniye)\n` +
                `• Deterministic finality\n\n` +
                `**🔒 Güvenlik:**\n` +
                `• Pure Proof-of-Stake (PPoS)\n` +
                `• Byzantine fault tolerance\n` +
                `• %51 saldırı koruması\n` +
                `• Matematiksel güvenlik\n` +
                `• No forking risk\n` +
                `• Cryptographic sortition\n\n` +
                `**💚 Çevre Dostu:**\n` +
                `• Düşük enerji tüketimi (Bitcoin'in %0.001'i)\n` +
                `• Carbon negative\n` +
                `• Sürdürülebilir blockchain\n` +
                `• ESG uyumlu\n` +
                `• Green blockchain sertifikası\n\n` +
                `**🌍 Kullanım Kolaylığı:**\n` +
                `• Basit geliştirme (Python, JavaScript, Go)\n` +
                `• Düşük transaction fee (0.001 ALGO)\n` +
                `• Global erişim\n` +
                `• Kurumsal uyumluluk\n` +
                `• Regulatory compliance\n\n` +
                `**💡 DeFi Avantajları:**\n` +
                `• Hızlı finality\n` +
                `• Düşük slippage\n` +
                `• Efficient AMM\n` +
                `• Scalable DeFi\n` +
                `• Atomic transfers\n` +
                `• Smart contracts (TEAL)\n\n` +
                `**🏗️ Teknik Detaylar:**\n` +
                `• Consensus: Pure Proof-of-Stake\n` +
                `• Block time: 4.5 saniye\n` +
                `• Transaction fee: 0.001 ALGO\n` +
                `• Smart contract: TEAL (Transaction Execution Approval Language)\n` +
                `• Virtual machine: AVM (Algorand Virtual Machine)\n\n` +
                `Algorand ekosisteminde yatırım stratejinizi geliştirmek ister misiniz? 📊`,
                analysisData: null
            }
        }
        
        // Algorand Tokenomics and Economics
        if (lowerMessage.includes('algorand') && (lowerMessage.includes('tokenomics') || lowerMessage.includes('ekonomi') || lowerMessage.includes('ekonomik') || lowerMessage.includes('token'))) {
            return {
                content: `💰 **Algorand Tokenomics ve Ekonomik Model:**\n\n` +
                `**🪙 ALGO Token Detayları:**\n` +
                `• Toplam arz: 10 milyar ALGO\n` +
                `• Dolaşımda: ~7.5 milyar ALGO\n` +
                `• Market cap: ~$2.5 milyar\n` +
                `• Token standardı: Native token\n` +
                `• Decimal: 6 (mikroALGO)\n\n` +
                `**📊 Token Dağılımı:**\n` +
                `• %25: Algorand Inc.\n` +
                `• %25: Algorand Foundation\n` +
                `• %50: Community rewards\n\n` +
                `**🎯 Ekonomik Model:**\n` +
                `• Deflationary mechanism\n` +
                `• Governance rewards\n` +
                `• Staking rewards (~6-8% APY)\n` +
                `• Transaction fees: 0.001 ALGO\n` +
                `• No mining rewards\n\n` +
                `**🏛️ Governance:**\n` +
                `• Decentralized governance\n` +
                `• Voting power: ALGO miktarına göre\n` +
                `• Governance rewards: %8-12 APY\n` +
                `• Quarterly voting periods\n\n` +
                `**💎 DeFi Ekosistemi:**\n` +
                `• TVL: ~$200 milyon\n` +
                `• DEX'ler: Tinyman, PactFi, WagmiSwap\n` +
                `• Lending: Folks Finance, AlgoFi\n` +
                `• Stablecoins: USDC, USDT, USDCa\n\n` +
                `**📈 Yatırım Potansiyeli:**\n` +
                `• Kurumsal adoption artışı\n` +
                `• CBDC projeleri\n` +
                `• DeFi ekosistem büyümesi\n` +
                `• NFT ve gaming projeleri\n\n` +
                `Algorand tokenomics analizi yapmak ister misiniz? 📊`,
                analysisData: null
            }
        }
        
        // Algorand DeFi Ecosystem
        if (lowerMessage.includes('algorand') && (lowerMessage.includes('defi') || lowerMessage.includes('ekosistem') || lowerMessage.includes('ecosystem'))) {
            return {
                content: `🏦 **Algorand DeFi Ekosistemi:**\n\n` +
                `**🔄 DEX'ler (Decentralized Exchanges):**\n` +
                `• **Tinyman**: İlk AMM, %0.3 fee\n` +
                `• **PactFi**: Concentrated liquidity\n` +
                `• **WagmiSwap**: Multi-pool AMM\n` +
                `• **HumbleSwap**: Community-driven\n\n` +
                `**💰 Lending/Borrowing:**\n` +
                `• **Folks Finance**: Institutional DeFi\n` +
                `• **AlgoFi**: Lending ve borrowing\n` +
                `• **GARD**: Stablecoin lending\n` +
                `• **Pact**: Multi-asset lending\n\n` +
                `**🏛️ Stablecoins:**\n` +
                `• **USDC**: Circle's USD Coin\n` +
                `• **USDT**: Tether USD\n` +
                `• **USDCa**: Algorand native USDC\n` +
                `• **GARD**: Algorand stablecoin\n\n` +
                `**🎯 Yield Farming:**\n` +
                `• Liquidity mining rewards\n` +
                `• Governance token rewards\n` +
                `• Multi-pool strategies\n` +
                `• Auto-compounding\n\n` +
                `**🔒 Security Features:**\n` +
                `• Formal verification\n` +
                `• Audit requirements\n` +
                `• Insurance protocols\n` +
                `• Bug bounty programs\n\n` +
                `**📊 TVL ve Metrikler:**\n` +
                `• Total Value Locked: ~$200M\n` +
                `• Daily volume: ~$50M\n` +
                `• Active users: ~100K\n` +
                `• Protocols: 50+\n\n` +
                `**🚀 Gelecek Projeler:**\n` +
                `• Cross-chain bridges\n` +
                `• Institutional DeFi\n` +
                `• CBDC integration\n` +
                `• Gaming protocols\n\n` +
                `Algorand DeFi stratejinizi optimize etmek ister misiniz? 🎯`,
                analysisData: null
            }
        }
        
        // Algorand Technical Details
        if (lowerMessage.includes('algorand') && (lowerMessage.includes('teknik') || lowerMessage.includes('technical') || lowerMessage.includes('teal') || lowerMessage.includes('consensus'))) {
            return {
                content: `🏗️ **Algorand Teknik Detayları:**\n\n` +
                `**⚙️ Consensus Algoritması:**\n` +
                `• **Pure Proof-of-Stake (PPoS)**\n` +
                `• Byzantine fault tolerance\n` +
                `• Cryptographic sortition\n` +
                `• No forking risk\n` +
                `• Deterministic finality\n\n` +
                `**💻 Smart Contract Teknolojisi:**\n` +
                `• **TEAL**: Transaction Execution Approval Language\n` +
                `• **AVM**: Algorand Virtual Machine\n` +
                `• **PyTeal**: Python wrapper\n` +
                `• **Reach**: High-level language\n` +
                `• **Beaker**: Development framework\n\n` +
                `**🔧 Geliştirici Araçları:**\n` +
                `• **Algorand SDK**: Python, JavaScript, Go, Java\n` +
                `• **AlgoKit**: Modern development toolkit\n` +
                `• **Algorand Studio**: IDE\n` +
                `• **AlgoExplorer**: Block explorer\n` +
                `• **Algorand TestNet**: Test environment\n\n` +
                `**📡 Network Özellikleri:**\n` +
                `• Block time: 4.5 saniye\n` +
                `• Transaction fee: 0.001 ALGO\n` +
                `• Throughput: 6000+ TPS\n` +
                `• Latency: < 1 saniye\n` +
                `• Finality: Deterministic\n\n` +
                `**🔐 Güvenlik Özellikleri:**\n` +
                `• Formal verification\n` +
                `• Cryptographic proofs\n` +
                `• No slashing risk\n` +
                `• Quantum-resistant\n` +
                `• Audit-friendly\n\n` +
                `**🌐 Network Katmanları:**\n` +
                `• **Consensus Layer**: PPoS\n` +
                `• **Network Layer**: Gossip protocol\n` +
                `• **Application Layer**: Smart contracts\n` +
                `• **Infrastructure Layer**: Nodes\n\n` +
                `**📊 Performans Metrikleri:**\n` +
                `• CPU usage: Minimal\n` +
                `• Memory usage: Low\n` +
                `• Bandwidth: Efficient\n` +
                `• Energy consumption: Ultra-low\n\n` +
                `Algorand geliştirme konusunda detaylı bilgi almak ister misiniz? 🚀`,
                analysisData: null
            }
        }
        
        // General blockchain questions
        if (lowerMessage.includes('blockchain') && (lowerMessage.includes('özellik') || lowerMessage.includes('fark') || lowerMessage.includes('ayıran'))) {
            return {
                content: `🔗 **Blockchain Teknolojisinin Temel Özellikleri:**\n\n` +
                `**🔒 Güvenlik:**\n` +
                `• Kriptografik hash\n` +
                `• Immutable ledger\n` +
                `• Decentralized consensus\n` +
                `• Tamper-proof\n\n` +
                `**🌍 Merkeziyetsizlik:**\n` +
                `• Aracısız işlemler\n` +
                `• Global erişim\n` +
                `• Censorship resistance\n` +
                `• Peer-to-peer\n\n` +
                `**⚡ Şeffaflık:**\n` +
                `• Public ledger\n` +
                `• Traceable transactions\n` +
                `• Audit trail\n` +
                `• Open source\n\n` +
                `**💰 Ekonomik Model:**\n` +
                `• Token economics\n` +
                `• Incentive mechanisms\n` +
                `• Fee structures\n` +
                `• Value distribution\n\n` +
                `**🚀 Algorand'ın Üstünlükleri:**\n` +
                `• Hızlı finality\n` +
                `• Düşük maliyet\n` +
                `• Çevre dostu\n` +
                `• Kurumsal uyumluluk\n\n` +
                `Algorand ekosisteminde detaylı analiz yapmak ister misiniz? 📈`,
                analysisData: null
            }
        }
        
        // Algorand Staking Details
        if (lowerMessage.includes('algorand') && (lowerMessage.includes('staking') || lowerMessage.includes('stake') || lowerMessage.includes('ödül') || lowerMessage.includes('reward'))) {
            return {
                content: `🎯 **Algorand Staking Detayları:**\n\n` +
                `**🔒 Staking Mekanizması:**\n` +
                `• **Pure Proof-of-Stake (PPoS)**\n` +
                `• Minimum stake: 1 ALGO\n` +
                `• Anında unstaking\n` +
                `• No slashing risk\n` +
                `• No lock-up period\n\n` +
                `**💰 Reward Oranları:**\n` +
                `• Staking rewards: ~6-8% APY\n` +
                `• Governance rewards: ~8-12% APY\n` +
                `• Combined rewards: ~14-20% APY\n` +
                `• Daily distribution\n` +
                `• Compound interest\n\n` +
                `**🏛️ Governance Staking:**\n` +
                `• Commit period: 3 ay\n` +
                `• Voting power: Stake miktarına göre\n` +
                `• Quarterly rewards\n` +
                `• Proposal voting\n` +
                `• Parameter changes\n\n` +
                `**⚡ Staking Avantajları:**\n` +
                `• Pasif gelir\n` +
                `• Ağ güvenliğine katkı\n` +
                `• Düşük risk\n` +
                `• Kolay başlangıç\n` +
                `• Liquidity korunur\n\n` +
                `**📊 Staking Stratejileri:**\n` +
                `• **Conservative**: Sadece staking\n` +
                `• **Balanced**: Staking + governance\n` +
                `• **Aggressive**: Staking + DeFi\n` +
                `• **Hybrid**: Multi-platform\n\n` +
                `**🔧 Staking Araçları:**\n` +
                `• **Pera Wallet**: Mobile staking\n` +
                `• **Algorand Wallet**: Desktop\n` +
                `• **Ledger**: Hardware wallet\n` +
                `• **Exchanges**: Binance, Coinbase\n\n` +
                `**📈 Staking Optimizasyonu:**\n` +
                `• Regular compounding\n` +
                `• Governance participation\n` +
                `• Multi-wallet strategy\n` +
                `• Tax optimization\n\n` +
                `Staking stratejinizi optimize etmek ister misiniz? 🚀`,
                analysisData: null
            }
        }
        
        // Algorand vs Other Blockchains
        if (lowerMessage.includes('algorand') && (lowerMessage.includes('vs') || lowerMessage.includes('karşılaştır') || lowerMessage.includes('compare') || lowerMessage.includes('fark'))) {
            return {
                content: `⚖️ **Algorand vs Diğer Blockchain'ler:**\n\n` +
                `**🚀 Algorand vs Bitcoin:**\n` +
                `• Finality: 4.5s vs 60dk\n` +
                `• TPS: 6000+ vs 7\n` +
                `• Energy: Ultra-low vs High\n` +
                `• Smart contracts: Yes vs No\n` +
                `• Fees: $0.0002 vs $5-50\n\n` +
                `**⚡ Algorand vs Ethereum:**\n` +
                `• Finality: 4.5s vs 6-15dk\n` +
                `• TPS: 6000+ vs 15\n` +
                `• Energy: Ultra-low vs High\n` +
                `• Fees: $0.0002 vs $5-100\n` +
                `• Scalability: Native vs Layer 2\n\n` +
                `**🔗 Algorand vs Solana:**\n` +
                `• Finality: Deterministic vs Probabilistic\n` +
                `• TPS: 6000+ vs 65000+\n` +
                `• Energy: Ultra-low vs Low\n` +
                `• Downtime: None vs Occasional\n` +
                `• Security: Formal vs Informal\n\n` +
                `**💎 Algorand vs Cardano:**\n` +
                `• Finality: 4.5s vs 20s\n` +
                `• TPS: 6000+ vs 250\n` +
                `• Energy: Ultra-low vs Low\n` +
                `• Smart contracts: TEAL vs Plutus\n` +
                `• Adoption: Growing vs Slow\n\n` +
                `**🏆 Algorand'ın Üstünlükleri:**\n` +
                `• Deterministic finality\n` +
                `• No forking risk\n` +
                `• Quantum-resistant\n` +
                `• Carbon negative\n` +
                `• Institutional adoption\n\n` +
                `**📊 Karşılaştırma Tablosu:**\n` +
                `| Özellik | Algorand | Bitcoin | Ethereum | Solana |\n` +
                `|---------|----------|---------|----------|--------|\n` +
                `| Finality | 4.5s | 60dk | 6-15dk | ~1s |\n` +
                `| TPS | 6000+ | 7 | 15 | 65000+ |\n` +
                `| Fees | $0.0002 | $5-50 | $5-100 | $0.00025 |\n` +
                `| Energy | Ultra-low | High | High | Low |\n` +
                `| Smart Contracts | Yes | No | Yes | Yes |\n\n` +
                `Hangi blockchain ile detaylı karşılaştırma yapmak istiyorsunuz? 🔍`,
                analysisData: null
            }
        }
        
        // Algorand Development and Tools
        if (lowerMessage.includes('algorand') && (lowerMessage.includes('geliştirme') || lowerMessage.includes('development') || lowerMessage.includes('araç') || lowerMessage.includes('tool') || lowerMessage.includes('sdk'))) {
            return {
                content: `🛠️ **Algorand Geliştirme Araçları:**\n\n` +
                `**📚 Programlama Dilleri:**\n` +
                `• **Python**: Algorand SDK, PyTeal\n` +
                `• **JavaScript**: Algorand SDK, React\n` +
                `• **Go**: Algorand SDK\n` +
                `• **Java**: Algorand SDK\n` +
                `• **Rust**: Algorand SDK\n\n` +
                `**🔧 Geliştirme Araçları:**\n` +
                `• **AlgoKit**: Modern development toolkit\n` +
                `• **Algorand Studio**: Visual IDE\n` +
                `• **AlgoExplorer**: Block explorer\n` +
                `• **Algorand TestNet**: Test environment\n` +
                `• **Algorand Sandbox**: Local development\n\n` +
                `**💻 Smart Contract Dilleri:**\n` +
                `• **TEAL**: Low-level assembly\n` +
                `• **PyTeal**: Python wrapper\n` +
                `• **Reach**: High-level language\n` +
                `• **Beaker**: Development framework\n` +
                `• **Clarity**: Cross-chain language\n\n` +
                `**🌐 Web3 Araçları:**\n` +
                `• **use-wallet**: React wallet integration\n` +
                `• **algokit-utils**: Utility functions\n` +
                `• **algosdk**: Core SDK\n` +
                `• **@algorandfoundation/algokit**: Foundation tools\n\n` +
                `**📖 Dokümantasyon:**\n` +
                `• **Developer Portal**: docs.algorand.com\n` +
                `• **API Reference**: Complete API docs\n` +
                `• **Tutorials**: Step-by-step guides\n` +
                `• **Examples**: Code samples\n` +
                `• **Community**: Discord, GitHub\n\n` +
                `**🚀 Başlangıç Adımları:**\n` +
                `1. Algorand TestNet hesabı oluştur\n` +
                `2. AlgoKit kurulumu\n` +
                `3. İlk smart contract\n` +
                `4. Frontend entegrasyonu\n` +
                `5. MainNet deployment\n\n` +
                `**💡 Proje Örnekleri:**\n` +
                `• DeFi protocols\n` +
                `• NFT marketplaces\n` +
                `• Gaming applications\n` +
                `• CBDC implementations\n` +
                `• Supply chain solutions\n\n` +
                `Hangi geliştirme konusunda detaylı bilgi almak istiyorsunuz? 🎯`,
                analysisData: null
            }
        }
        
        // Default specific question response
        return {
            content: `🤔 **Spesifik Sorunuz:** "${userMessage}"\n\n` +
            `Bu soruyu daha iyi yanıtlayabilmem için:\n\n` +
            `• 📊 Portfolyo analizi mi istiyorsunuz?\n` +
            `• 📈 Piyasa trendi mi?\n` +
            `• 🎲 Risk değerlendirmesi mi?\n` +
            `• 🎯 Yatırım önerisi mi?\n\n` +
            `Hangi konuda detaylı bilgi almak istiyorsunuz? 💡`,
            analysisData: null
        }
    }

    /**
     * Handle general queries
     */
    private handleGeneralQuery(userMessage: string): {content: string, analysisData?: any} {
        // Algorand dışındaki konular için uyarı
        const nonAlgorandKeywords = [
            'bitcoin', 'ethereum', 'solana', 'cardano', 'polygon', 'avalanche',
            'binance', 'coinbase', 'kraken', 'crypto', 'kripto', 'borsa',
            'hisse', 'stock', 'forex', 'altcoin', 'meme', 'dogecoin', 'shiba',
            'politika', 'siyaset', 'spor', 'futbol', 'müzik', 'film', 'oyun',
            'yemek', 'seyahat', 'sağlık', 'eğitim', 'iş', 'kariyer'
        ]
        
        const lowerMessage = userMessage.toLowerCase()
        const isNonAlgorand = nonAlgorandKeywords.some(keyword => lowerMessage.includes(keyword))
        
        if (isNonAlgorand) {
            return {
                content: `🤖 **Algorand Blockchain Expert**

Sorry, I can only help with Algorand blockchain technologies.

**My Expertise Areas (ONLY Algorand):**
• 🚀 **Algorand Technology**: Pure Proof-of-Stake, TEAL, AVM, AlgoKit
• 💰 **Algorand DeFi**: Tinyman, PactFi, Folks Finance, WagmiSwap, AlgoFi
• 🪙 **ALGO Tokenomics**: Governance, staking, tokenomics
• ⚖️ **Algorand vs Other Blockchains**: Bitcoin, Ethereum, Solana comparisons

**Example Questions:**
• "What is Algorand?"
• "How does ALGO staking work?"
• "What are Algorand DeFi protocols?"
• "What are the differences between Algorand and Ethereum?"

You can ask me questions about Algorand! 🎯`,
                analysisData: { source: 'fallback', restricted: true }
            }
        }
        
        const responses = [
            `🤖 **Algorand Blockchain Expert**

I received your message: "${userMessage}". I can only help with Algorand blockchain technologies.

**My Expertise Areas (ONLY Algorand):**
• 🚀 **Algorand Technology**: Pure Proof-of-Stake, TEAL, AVM, AlgoKit
• 💰 **Algorand DeFi**: Tinyman, PactFi, Folks Finance, WagmiSwap, AlgoFi
• 🪙 **ALGO Tokenomics**: Governance, staking, tokenomics
• ⚖️ **Algorand vs Other Blockchains**: Bitcoin, Ethereum, Solana comparisons

**Quick Access:**
• "What is Algorand?" - Basic information
• "How does ALGO staking work?" - Staking guide
• "What are Algorand DeFi protocols?" - DeFi ecosystem
• "What are the differences between Algorand and Ethereum?" - Comparison

What Algorand topic would you like to learn about? 🎯`,
            
            `🚀 **Algorand Blockchain Expert**

I can help you with "${userMessage}". I'm an expert in Algorand and blockchain technologies only.

**Topics I Can Analyze:**
• 📊 **Algorand Staking**: APY optimization, strategies
• 💰 **Algorand DeFi**: Yield farming, liquidity mining
• 🛡️ **Risk Analysis**: Portfolio security
• 📈 **Performance**: Algorand investment analysis
• ⚖️ **Comparison**: Comparisons with other blockchains

**Example Questions:**
• "What is Algorand staking strategy?"
• "What DeFi protocols exist on Algorand?"
• "How does ALGO tokenomics work?"
• "How does Algorand compare to Solana?"

How can I help you? 🤖`,
            
            `💬 **Algorand Blockchain Expert**

Thank you for your message: "${userMessage}"! I'm an expert in the Algorand ecosystem.

**Services I Can Provide:**
• 🎯 **Personalized Algorand Analysis**
• 📊 **Real-time Algorand Data**
• 🛡️ **Algorand Risk Assessment**
• 📈 **Algorand Performance Tracking**
• 💡 **Algorand Investment Recommendations**

**My Expertise Areas:**
• Algorand blockchain technology
• Algorand DeFi ecosystem
• ALGO tokenomics and governance
• Algorand vs other blockchain comparisons

What Algorand topic would you like detailed information about? 🔍`
        ]
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        return { content: randomResponse, analysisData: null }
    }

    /**
     * Get portfolio assessment based on metrics
     */
    private getPortfolioAssessment(metrics: any): string {
        if (metrics.apy > 15 && metrics.riskScore < 0.3) {
            return "Mükemmel! Yüksek getiri ve düşük risk ile çok iyi bir portfolyoya sahipsiniz. 🎉"
        } else if (metrics.apy > 10 && metrics.riskScore < 0.5) {
            return "İyi bir portfolyo! Dengeli getiri ve risk profili ile güvenli bir yatırım stratejiniz var. 👍"
        } else if (metrics.apy < 5) {
            return "Getiri oranınız düşük. Daha yüksek APY'li pool'lara yatırım yapmayı düşünebilirsiniz. 📈"
        } else if (metrics.riskScore > 0.7) {
            return "Risk seviyeniz yüksek. Diversifikasyon yaparak riski azaltabilirsiniz. 🛡️"
        } else {
            return "Orta seviye bir portfolyo. Optimizasyon için daha fazla analiz yapabiliriz. 🔍"
        }
    }

    /**
     * Get performance assessment
     */
    private getPerformanceAssessment(metrics: any): string {
        if (metrics.performanceScore > 80) {
            return "Harika performans! Portfolyonuz çok iyi çalışıyor. 🏆"
        } else if (metrics.performanceScore > 60) {
            return "İyi performans gösteriyorsunuz. Biraz optimizasyon ile daha da iyileştirebilirsiniz. 📈"
        } else {
            return "Performansınızı artırmak için stratejinizi gözden geçirmenizi öneririm. 🔄"
        }
    }

    /**
     * Get performance recommendations
     */
    private getPerformanceRecommendations(metrics: any): string {
        const recommendations = []
        
        if (metrics.apy < 10) {
            recommendations.push("• Daha yüksek APY'li pool'lara yatırım yapın")
        }
        
        if (metrics.riskScore > 0.6) {
            recommendations.push("• Risk dağılımınızı artırın (diversifikasyon)")
        }
        
        if (metrics.volatility > 0.3) {
            recommendations.push("• Daha stabil pool'lara yatırım yapın")
        }
        
        if (metrics.sharpeRatio < 1.0) {
            recommendations.push("• Risk-getiri dengesini optimize edin")
        }
        
        if (recommendations.length === 0) {
            recommendations.push("• Mevcut stratejinizi koruyun, çok iyi gidiyor!")
        }
        
        return recommendations.join('\n')
    }

    /**
     * Add user message to chat history
     */
    public addUserMessage(content: string): ChatMessage {
        const message: ChatMessage = {
            id: this.generateMessageId(),
            type: 'user',
            content,
            timestamp: new Date()
        }
        
        this.chatHistory.push(message)
        return message
    }

    /**
     * Add AI message to chat history
     */
    public addAIMessage(content: string, analysisData?: any): ChatMessage {
        const message: ChatMessage = {
            id: this.generateMessageId(),
            type: 'ai',
            content,
            timestamp: new Date(),
            analysisData
        }
        
        this.chatHistory.push(message)
        return message
    }

    /**
     * Generate unique message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Get chat history
     */
    getChatHistory(): ChatMessage[] {
        return [...this.chatHistory]
    }

    /**
     * Clear chat history
     */
    clearChatHistory(): void {
        this.chatHistory = []
    }

    /**
     * Update context
     */
    updateContext(newContext: Partial<ChatContext>): void {
        this.context = { ...this.context, ...newContext }
    }

    /**
     * Get AI API status
     */
    getAIStatus(): {configured: boolean, provider: string} {
        return this.geminiApiService.getAPIStatus()
    }
}
