import { GoogleGenAI } from '@google/genai'

export interface GeminiResponse {
    content: string
    analysisData?: any
    source: 'gemini' | 'fallback'
}

export class GeminiApiService {
    private genAI: GoogleGenAI | null = null
    private isConfigured: boolean = false

    constructor() {
        this.initializeGemini()
    }

    private initializeGemini() {
        try {
            // Gemini API key'i environment variable'dan al
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
            
            console.log('🔍 Initializing Gemini API...')
            console.log('🔑 API Key found:', !!apiKey)
            console.log('🔑 API Key starts with AIza:', apiKey?.startsWith('AIza'))
            console.log('🔑 API Key length:', apiKey?.length)
            console.log('🔑 Full API Key:', apiKey)
            console.log('🌐 Environment:', import.meta.env.MODE)
            console.log('📁 All env vars:', Object.keys(import.meta.env).filter(key => key.includes('GEMINI')))
            
            if (apiKey && apiKey !== 'your-gemini-api-key-here') {
                console.log('🚀 Creating GoogleGenAI instance...')
                this.genAI = new GoogleGenAI({ apiKey })
                this.isConfigured = true
                console.log('✅ Gemini API configured successfully')
                console.log('🎯 GenAI ready:', !!this.genAI)
            } else {
                console.log('⚠️ Gemini API key not found, using fallback responses')
                console.log('📝 Expected format: AIzaSy...')
                console.log('📝 Current value:', apiKey)
                this.isConfigured = false
            }
        } catch (error: any) {
            console.error('❌ Gemini API initialization failed:', error)
            console.error('❌ Error stack:', error.stack)
            this.isConfigured = false
        }
    }

    /**
     * Generate AI response using Gemini
     */
    async generateAIResponse(
        userMessage: string, 
        context: {
            userAddress?: string
            portfolioData?: any
            marketData?: any
            walletData?: any
            chatHistory?: any[]
        }
    ): Promise<GeminiResponse> {
        
        if (!this.isConfigured || !this.genAI) {
            return this.getFallbackResponse(userMessage)
        }

        try {
            console.log('🤖 Generating AI response with Gemini...')
            console.log('📝 User message:', userMessage)
            console.log('🔑 API Key configured:', !!this.genAI)
            
            // Gerçek Gemini API çağrısı
            const systemPrompt = this.buildSystemPrompt(context)
            const fullPrompt = `${systemPrompt}\n\nKullanıcı Sorusu: ${userMessage}\n\nLütfen Algorand uzmanı olarak profesyonel ve detaylı bir yanıt ver:`
            
            console.log('📋 Full prompt length:', fullPrompt.length)
            console.log('🔑 Making real API call to Gemini...')

            const response = await this.genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `You are an Algorand blockchain expert AI assistant. You ONLY answer questions about Algorand and blockchain technologies. Always respond in English.

User Question: ${userMessage}

Context:
- Wallet Address: ${context.userAddress || 'Not connected'}
- Portfolio Data: ${context.portfolioData ? 'Available' : 'Not available'}
- Wallet Data: ${context.walletData ? JSON.stringify(context.walletData, null, 2) : 'Not available'}

Please provide a detailed, professional response about Algorand blockchain technologies in English. Use emojis and organize information with bullet points.`,
            })
            
            const aiResponse = response.text || 'Sorry, I could not generate a response.'
            
            console.log('✅ Gemini response generated successfully')
            console.log('📄 Response preview:', aiResponse.substring(0, 100) + '...')

            return {
                content: aiResponse,
                analysisData: this.extractAnalysisData(aiResponse),
                source: 'gemini'
            }

        } catch (error: any) {
            console.error('❌ Gemini API error:', error)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                code: error.code,
                type: error.type
            })
            
            // Specific error handling
            if (error.status === 400) {
                console.error('❌ Bad request - check prompt format')
            } else if (error.status === 401) {
                console.error('❌ API Key invalid or expired')
            } else if (error.status === 429) {
                console.error('❌ Rate limit exceeded')
            } else if (error.status === 500) {
                console.error('❌ Gemini server error')
            }
            
            return this.getFallbackResponse(userMessage)
        }
    }

    /**
     * Generate enhanced mock response that simulates Gemini AI
     */
    private generateEnhancedMockResponse(userMessage: string, context: any): string {
        const lowerMessage = userMessage.toLowerCase()
        
        // Algorand spesifik sorular
        if (lowerMessage.includes('algorand') || lowerMessage.includes('algo')) {
            return `🚀 **Algorand Hakkında Detaylı Analiz** (Gemini Pro AI)

Merhaba! Algorand konusunda size yardımcı olmaktan mutluluk duyarım.

## 🔮 Algorand'ın Temel Özellikleri:

**⚡ Performans:**
• **4.5 saniye finality** - Bitcoin'den 800x daha hızlı
• **6000+ TPS kapasitesi** - Ethereum'dan 400x daha yüksek
• **0.001 ALGO transaction fee** - Ultra düşük maliyet

**🔒 Güvenlik & Consensus:**
• **Pure Proof-of-Stake (PPoS)** - Matematiksel güvenlik
• **Byzantine Fault Tolerance** - %33 kötü niyetli node'a karşı dayanıklı
• **Fork riski yok** - Deterministik finality

**💚 Sürdürülebilirlik:**
• **Carbon negative** - Çevre dostu blockchain
• **Düşük enerji tüketimi** - Bitcoin'in %0.001'i

## 📊 DeFi Ekosistemi:

**🔄 DEX'ler:**
• Tinyman - İlk AMM protokolü
• PactFi - Concentrated liquidity
• WagmiSwap - Multi-asset pools

**💰 Lending/Borrowing:**
• Folks Finance - Kurumsal DeFi
• AlgoFi - Yield optimization
• GARD - Stablecoin protocol

## 🎯 Yatırım Potansiyeli:

**Güçlü Yanlar:**
• Kurumsal adoption artışı
• CBDC projeleri (El Salvador, Nigeria)
• Developer-friendly ecosystem
• Strong fundamentals

**Risk Faktörleri:**
• Market volatility
• Competition from other L1s
• Regulatory uncertainty

Hangi konuda daha detaylı bilgi almak istiyorsunuz? 🤔`
        }
        
        // Staking soruları
        if (lowerMessage.includes('staking') || lowerMessage.includes('stake')) {
            return `🎯 **Algorand Staking Rehberi** (Gemini Pro AI)

## 💰 Staking Oranları:
• **Basic Staking**: ~6-8% APY
• **Governance Staking**: ~8-12% APY
• **Combined Strategy**: ~14-20% APY

## 🔒 Staking Avantajları:
• **Risk-free staking** - Slashing yok
• **Anında unstaking** - Lock period yok
• **Compound rewards** - Otomatik reinvestment

## 📈 Optimizasyon Stratejileri:
1. **Conservative**: Sadece governance staking
2. **Balanced**: Governance + DeFi yield
3. **Aggressive**: Multi-protocol farming

Staking stratejinizi optimize etmek için portfolyo analizinize ihtiyacım var. Hangi miktarda ALGO stake etmeyi planlıyorsunuz? 🚀`
        }
        
        // DeFi soruları
        if (lowerMessage.includes('defi') || lowerMessage.includes('yield')) {
            return `🏦 **Algorand DeFi Ekosistemi** (Gemini Pro AI)

## 📊 TVL ve Metrikler:
• **Total Value Locked**: ~$200M
• **Daily Volume**: ~$50M
• **Active Protocols**: 50+
• **Unique Users**: ~100K

## 🔄 Yield Farming Fırsatları:

**Yüksek APY Pools:**
• ALGO/USDC: %15-25 APY
• ALGO/USDT: %12-20 APY
• Multi-asset pools: %20-40 APY

**Risk Seviyeleri:**
• 🟢 **Düşük Risk**: Stablecoin pairs (%8-15)
• 🟡 **Orta Risk**: ALGO pairs (%15-25)
• 🔴 **Yüksek Risk**: Alt-coin pairs (%25-50)

## ⚠️ Risk Yönetimi:
• Impermanent loss hesaplaması
• Protocol audit durumu
• Liquidity depth analizi
• Exit strategy planlaması

Hangi risk seviyesinde yatırım yapmayı düşünüyorsunuz? 🎯`
        }
        
        // Genel sorular
        return `🤖 **AI Asistan Yanıtı** (Gemini Pro)

Sorunuz: "${userMessage}"

Size Algorand blockchain ekosistemi hakkında detaylı bilgi verebilirim:

## 🎯 Uzmanlık Alanlarım:
• **Blockchain Teknolojisi**: PPoS, TEAL, AVM
• **DeFi Protocols**: DEX, lending, yield farming
• **Investment Strategy**: Portfolio optimization, risk analysis
• **Technical Analysis**: Market trends, price prediction

## 📊 Analiz Edebileceğim Konular:
• Portfolio performance ve optimization
• Risk assessment ve management
• Market trends ve predictions
• Staking strategies ve APY optimization

Hangi konuda daha spesifik bilgi almak istiyorsunuz?

💡 **Öneri**: "Algorand staking stratejisi", "DeFi yield farming" veya "portfolio analizi" gibi spesifik sorular sorabilirsiniz.`
    }

    /**
     * Test API connection
     */
    async testConnection(): Promise<boolean> {
        console.log('🧪 Testing Gemini API connection...')
        console.log('🔍 isConfigured:', this.isConfigured)
        console.log('🔍 genAI exists:', !!this.genAI)
        
        if (!this.isConfigured || !this.genAI) {
            console.log('❌ API not configured')
            console.log('📝 Debug info:')
            console.log('  - isConfigured:', this.isConfigured)
            console.log('  - genAI:', !!this.genAI)
            return false
        }

        try {
            console.log('📡 Making test request to Gemini...')
            console.log('🔑 API Key being used:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...')
            
            const response = await this.genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: "Test connection. Please respond with 'OK'.",
            })
            
            const text = response.text
            
            console.log('✅ Gemini API test successful:', text)
            console.log('🎉 Real Gemini API is working!')
            return true

        } catch (error: any) {
            console.error('❌ Gemini API test failed:', error)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                code: error.code,
                name: error.name,
                stack: error.stack?.substring(0, 200)
            })
            
            // Check specific error types
            if (error.message?.includes('API_KEY_INVALID')) {
                console.error('🔑 API Key is invalid - please check your key')
            } else if (error.message?.includes('PERMISSION_DENIED')) {
                console.error('🚫 Permission denied - API key may not have access')
            } else if (error.message?.includes('QUOTA_EXCEEDED')) {
                console.error('📊 Quota exceeded - rate limit reached')
            } else if (error.message?.includes('SERVICE_UNAVAILABLE')) {
                console.error('🌐 Service unavailable - try again later')
            }
            
            return false
        }
    }

    /**
     * Build system prompt for AI
     */
    private buildSystemPrompt(context: any): string {
        return `You are an Algorand blockchain expert AI assistant. You ONLY answer questions about Algorand and blockchain technologies.

**Your Expertise Areas (ONLY):**
- Algorand blockchain technology and Pure Proof-of-Stake consensus
- Algorand DeFi ecosystem (Tinyman, PactFi, Folks Finance, WagmiSwap, AlgoFi)
- ALGO tokenomics and governance system
- Algorand staking strategies and APY optimization
- Algorand smart contract development (TEAL, PyTeal, Reach, Beaker, AlgoKit)
- Algorand yield farming and liquidity mining
- Algorand risk analysis and portfolio optimization
- Algorand vs other blockchain comparisons (Bitcoin, Ethereum, Solana, Cardano)
- General blockchain technology knowledge (only in Algorand context)

**Response Style:**
- Professional but friendly
- Technical details but understandable
- Current data and examples
- Use emojis for visual richness
- Well-organized bullet points
- Practical recommendations and actionable insights

**User Information:**
- Wallet Address: ${context.userAddress || 'Not connected'}
- Portfolio Data: ${context.portfolioData ? 'Available' : 'Not available'}
- Market Data: ${context.marketData ? 'Available' : 'Not available'}
- Wallet Data: ${context.walletData ? JSON.stringify(context.walletData, null, 2) : 'Not available'}

**IMPORTANT RULES:**
- ONLY answer questions about Algorand and blockchain technologies
- For non-Algorand topics: "Sorry, I can only help with Algorand blockchain technologies. You can ask me questions about Algorand."
- Always provide current and accurate information
- Mention uncertainty when it exists
- Provide educational information, not investment advice
- Respond in English
- Stay focused on Algorand ecosystem
- Be objective when comparing with other blockchains`
    }

    /**
     * Extract analysis data from AI response
     */
    private extractAnalysisData(response: string): any {
        return {
            model: 'gemini-pro',
            timestamp: new Date().toISOString(),
            responseLength: response.length,
            hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(response),
            hasBulletPoints: response.includes('•') || response.includes('-'),
            hasNumbers: /\d/.test(response)
        }
    }

    /**
     * Get fallback response when API fails
     */
    private getFallbackResponse(userMessage: string): GeminiResponse {
        return {
            content: `🤖 **Gemini API Fallback**\n\nSorry, I cannot access Gemini API at the moment.\n\nYour question: "${userMessage}"\n\nPlease try again later or contact the system administrator.`,
            analysisData: {
                source: 'fallback',
                timestamp: new Date().toISOString(),
                reason: 'API unavailable'
            },
            source: 'fallback'
        }
    }

    /**
     * Check if AI is configured
     */
    isAIConfigured(): boolean {
        return this.isConfigured
    }

    /**
     * Get API status
     */
    getAPIStatus(): { configured: boolean, provider: string } {
        return {
            configured: this.isConfigured,
            provider: this.isConfigured ? 'Google Gemini Pro' : 'Fallback Responses'
        }
    }
}
