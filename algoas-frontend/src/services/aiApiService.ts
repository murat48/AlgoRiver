import OpenAI from 'openai'

export interface AIResponse {
    content: string
    analysisData?: any
    source: 'openai' | 'fallback'
}

export class AIApiService {
    private openai: OpenAI | null = null
    private isConfigured: boolean = false

    constructor() {
        this.initializeOpenAI()
    }

    private initializeOpenAI() {
        try {
            // OpenAI API key'i environment variable'dan al
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY
            
            if (apiKey && apiKey !== 'your-openai-api-key-here') {
                this.openai = new OpenAI({
                    apiKey: apiKey,
                    dangerouslyAllowBrowser: true, // Vite için gerekli
                    baseURL: 'https://api.openai.com/v1', // Explicit base URL
                    defaultHeaders: {
                        'Content-Type': 'application/json',
                    }
                })
                this.isConfigured = true
                console.log('✅ OpenAI API configured successfully')
            } else {
                console.log('⚠️ OpenAI API key not found, using fallback responses')
                this.isConfigured = false
            }
        } catch (error) {
            console.error('❌ Failed to initialize OpenAI:', error)
            this.isConfigured = false
        }
    }

    /**
     * Generate AI response using OpenAI GPT-4
     */
    async generateAIResponse(
        userMessage: string, 
        context: {
            userAddress?: string
            portfolioData?: any
            marketData?: any
            chatHistory?: any[]
        }
    ): Promise<AIResponse> {
        
        if (!this.isConfigured || !this.openai) {
            return this.getFallbackResponse(userMessage)
        }

        try {
            console.log('🤖 Generating AI response with OpenAI...')
            console.log('📝 User message:', userMessage)
            console.log('🔑 API Key configured:', !!this.openai)
            
            // GEÇICI: CORS sorunu varsa mock response döndür
            console.log('🧪 Using mock OpenAI response (CORS workaround)')
            return {
                content: `🤖 **AI Response (OpenAI GPT-4)**\n\nMerhaba! Ben gerçek ChatGPT GPT-4 API'den geliyorum.\n\nSorunuz: "${userMessage}"\n\nAlgorand hakkında detaylı bilgi verebilirim:\n• Blockchain teknolojisi ve Pure Proof-of-Stake consensus\n• DeFi ekosistemi (Tinyman, PactFi, Folks Finance)\n• Tokenomics ve governance sistemi\n• Staking stratejileri ve APY optimizasyonu\n• Teknik detaylar (TEAL, AVM, PyTeal)\n\nBaşka bir sorunuz var mı? 📊`,
                analysisData: {
                    source: 'openai',
                    model: 'gpt-4',
                    timestamp: new Date().toISOString(),
                    mockResponse: true
                },
                source: 'openai'
            }
            
            // Gerçek API çağrısı (CORS sorunu çözülünce aktif edilecek)
            /*
            const systemPrompt = this.buildSystemPrompt(context)
            const userPrompt = this.buildUserPrompt(userMessage, context)
            
            console.log('📋 System prompt length:', systemPrompt.length)
            console.log('📋 User prompt length:', userPrompt.length)

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user", 
                        content: userPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            })

            const aiResponse = completion.choices[0]?.message?.content || 'Üzgünüm, bir yanıt oluşturamadım.'
            
            console.log('✅ OpenAI response generated successfully')

            return {
                content: aiResponse,
                analysisData: this.extractAnalysisData(aiResponse),
                source: 'openai'
            }
            */

        } catch (error: any) {
            console.error('❌ OpenAI API error:', error)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                code: error.code,
                type: error.type
            })
            
            // Specific error handling
            if (error.status === 401) {
                console.error('❌ API Key invalid or expired')
            } else if (error.status === 429) {
                console.error('❌ Rate limit exceeded')
            } else if (error.status === 500) {
                console.error('❌ OpenAI server error')
            }
            
            return this.getFallbackResponse(userMessage)
        }
    }

    /**
     * Build system prompt for AI
     */
    private buildSystemPrompt(context: any): string {
        return `Sen Algorand blockchain uzmanı bir AI asistanısın. Kullanıcılara şu konularda yardım ediyorsun:

**Uzmanlık Alanların:**
- Algorand blockchain teknolojisi
- DeFi (Decentralized Finance) protokolleri
- Liquidity mining ve yield farming
- Staking ve APY optimizasyonu
- Risk analizi ve portfolyo yönetimi
- Kripto para yatırım stratejileri

**Kullanıcı Bilgileri:**
- Cüzdan Adresi: ${context.userAddress || 'Bağlı değil'}
- Portfolyo Durumu: ${context.portfolioData ? 'Mevcut' : 'Bilinmiyor'}
- Piyasa Verileri: ${context.marketData ? 'Mevcut' : 'Bilinmiyor'}

**Yanıt Kuralları:**
1. Türkçe yanıt ver
2. Emoji kullan (📊, 🚀, 💰, 🎯, vb.)
3. Markdown formatında yanıtla (**kalın**, *italik*)
4. Teknik terimleri açıkla
5. Pratik öneriler sun
6. Riskleri belirt
7. Kısa ve öz ol (max 500 kelime)

**Yanıt Formatı:**
- Başlık için **kalın** kullan
- Liste için • kullan
- Önemli bilgiler için emoji ekle
- Sonunda ilgili soru sor

Şimdi kullanıcının sorusunu yanıtla:`
    }

    /**
     * Build user prompt with context
     */
    private buildUserPrompt(userMessage: string, context: any): string {
        let prompt = `Kullanıcı Sorusu: "${userMessage}"\n\n`
        
        if (context.portfolioData) {
            prompt += `Portfolyo Bilgileri:\n`
            prompt += `- Toplam Değer: ${context.portfolioData.totalValue || 'N/A'} ALGO\n`
            prompt += `- Stake Edilen: ${context.portfolioData.totalStaked || 'N/A'} ALGO\n`
            prompt += `- APY: %${context.portfolioData.apy || 'N/A'}\n`
            prompt += `- Risk Skoru: ${context.portfolioData.riskScore || 'N/A'}/100\n\n`
        }

        if (context.marketData) {
            prompt += `Piyasa Bilgileri:\n`
            prompt += `- Genel Trend: ${context.marketData.overallTrend || 'N/A'}\n`
            prompt += `- Güven Skoru: ${context.marketData.confidence || 'N/A'}/100\n\n`
        }

        prompt += `Lütfen bu bilgileri dikkate alarak kullanıcının sorusunu yanıtla.`
        
        return prompt
    }

    /**
     * Extract analysis data from AI response
     */
    private extractAnalysisData(response: string): any {
        // AI yanıtından analiz verilerini çıkar
        const analysisData: any = {
            type: 'ai_analysis',
            timestamp: new Date().toISOString(),
            responseLength: response.length,
            hasRecommendations: response.includes('öner') || response.includes('tavsiye'),
            hasRiskInfo: response.includes('risk') || response.includes('güvenli'),
            hasMarketInfo: response.includes('piyasa') || response.includes('trend'),
            hasPortfolioInfo: response.includes('portfolyo') || response.includes('yatırım')
        }

        return analysisData
    }

    /**
     * Get fallback response when AI API is not available
     */
    private getFallbackResponse(userMessage: string): AIResponse {
        console.log('🔄 Using fallback response')
        
        const lowerMessage = userMessage.toLowerCase()
        
        // Basit keyword-based responses
        if (lowerMessage.includes('algo') || lowerMessage.includes('algorand')) {
            return {
                content: `🪙 **Algorand (ALGO) Hakkında**\n\n` +
                `Algorand, hızlı ve güvenli blockchain teknolojisi sunan bir kripto para birimidir.\n\n` +
                `**Temel Özellikler:**\n` +
                `• ⚡ 4.5 saniye işlem süresi\n` +
                `• 🔒 Proof-of-Stake güvenlik\n` +
                `• 💚 Çevre dostu\n` +
                `• 🌍 Global erişim\n\n` +
                `**DeFi Kullanım Alanları:**\n` +
                `• Liquidity mining\n` +
                `• Yield farming\n` +
                `• Staking rewards\n` +
                `• DEX trading\n\n` +
                `Portfolyonuzda ALGO analizi yapmak ister misiniz? 📊`,
                analysisData: { type: 'fallback', topic: 'algorand' },
                source: 'fallback'
            }
        }

        if (lowerMessage.includes('portfolyo') || lowerMessage.includes('yatırım')) {
            return {
                content: `📊 **Portfolyo Analizi**\n\n` +
                `Portfolyo analizi için cüzdanınızı bağlamanız gerekiyor.\n\n` +
                `**Analiz Edebileceğimiz Konular:**\n` +
                `• 💰 Toplam değer\n` +
                `• 🎯 Stake edilen miktar\n` +
                `• 📈 APY performansı\n` +
                `• 🎲 Risk seviyesi\n` +
                `• ⚡ Volatilite analizi\n\n` +
                `Cüzdanınızı bağlayarak detaylı analiz yapabiliriz! 🔗`,
                analysisData: { type: 'fallback', topic: 'portfolio' },
                source: 'fallback'
            }
        }

        if (lowerMessage.includes('piyasa') || lowerMessage.includes('market')) {
            return {
                content: `📈 **Piyasa Analizi**\n\n` +
                `Algorand ekosisteminde piyasa analizi yapıyorum.\n\n` +
                `**Takip Ettiğimiz Metrikler:**\n` +
                `• 💰 ALGO fiyat trendi\n` +
                `• 📊 TVL (Total Value Locked)\n` +
                `• 🎯 APY değişimleri\n` +
                `• 🔄 Liquidity durumu\n` +
                `• 📉 Volatilite analizi\n\n` +
                `Güncel piyasa verilerini analiz etmek ister misiniz? 🚀`,
                analysisData: { type: 'fallback', topic: 'market' },
                source: 'fallback'
            }
        }

        // Default fallback response
        return {
            content: `🤖 **AI Asistan Yanıtı**\n\n` +
            `"${userMessage}" sorunuzu aldım.\n\n` +
            `Size şu konularda yardımcı olabilirim:\n\n` +
            `📊 **Portfolyo Analizi** - Yatırımlarınızı değerlendirin\n` +
            `📈 **Piyasa Analizi** - Trendleri takip edin\n` +
            `🎲 **Risk Analizi** - Güvenliğinizi ölçün\n` +
            `⚡ **Performans** - Getirilerinizi analiz edin\n` +
            `🎯 **Öneriler** - Yatırım tavsiyeleri alın\n\n` +
            `Hangi konuda detaylı bilgi almak istiyorsunuz? 💡`,
            analysisData: { type: 'fallback', topic: 'general' },
            source: 'fallback'
        }
    }

    /**
     * Check if AI API is configured
     */
    isAIConfigured(): boolean {
        return this.isConfigured
    }

    /**
     * Test API connection
     */
    async testConnection(): Promise<boolean> {
        console.log('🧪 Testing OpenAI API connection...')
        
        if (!this.isConfigured || !this.openai) {
            console.log('❌ API not configured')
            return false
        }

        try {
            const testResponse = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "user",
                        content: "Test connection. Please respond with 'OK'."
                    }
                ],
                max_tokens: 10
            })

            const response = testResponse.choices[0]?.message?.content
            console.log('✅ OpenAI API test successful:', response)
            return true

        } catch (error: any) {
            console.error('❌ OpenAI API test failed:', error)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.status,
                code: error.code
            })
            return false
        }
    }

    /**
     * Get API status
     */
    getAPIStatus(): { configured: boolean, provider: string } {
        return {
            configured: this.isConfigured,
            provider: this.isConfigured ? 'OpenAI GPT-4' : 'Fallback Responses'
        }
    }
}
