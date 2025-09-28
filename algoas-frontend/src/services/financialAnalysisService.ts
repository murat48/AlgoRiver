import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

export interface FinancialMetrics {
    totalValue: number
    totalStaked: number
    totalRewards: number
    apy: number
    riskScore: number
    performanceScore: number
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
}

export interface PoolAnalysis {
    poolId: string
    poolName: string
    tvl: number
    apy: number
    riskLevel: 'low' | 'medium' | 'high'
    volatility: number
    liquidityScore: number
    recommendation: 'buy' | 'hold' | 'sell'
    confidence: number
    predictedApy: number
    marketTrend: 'bullish' | 'bearish' | 'neutral'
}

export interface PortfolioOptimization {
    suggestedAllocation: Array<{
        poolId: string
        percentage: number
        reason: string
    }>
    expectedReturn: number
    riskLevel: number
    diversificationScore: number
}

export class FinancialAnalysisService {
    private algorandClient: AlgorandClient
    private priceHistory: Map<string, number[]> = new Map()
    private marketData: any = {}

    constructor() {
        try {
            this.algorandClient = AlgorandClient.fromEnvironment()
            console.log('✅ FinancialAnalysisService: AlgorandClient initialized successfully')
        } catch (error) {
            console.error('❌ FinancialAnalysisService: Failed to initialize AlgorandClient:', error)
            // Fallback configuration
            this.algorandClient = AlgorandClient.fromConfig({
                algodConfig: {
                    server: 'https://testnet-api.algonode.cloud',
                    port: 443,
                    token: '',
                },
                indexerConfig: {
                    server: 'https://testnet-idx.algonode.cloud',
                    port: 443,
                    token: '',
                },
            })
            console.log('✅ FinancialAnalysisService: Using fallback AlgorandClient configuration')
        }
    }

    /**
     * Analyze user's portfolio performance
     */
    async analyzePortfolio(userAddress: string): Promise<FinancialMetrics> {
        try {
            console.log('🔍 Starting portfolio analysis for:', userAddress)
            
            // Validate address
            if (!userAddress || userAddress.length < 50) {
                throw new Error('Invalid Algorand address provided')
            }
            
            // Get account information with timeout
            console.log('📡 Fetching account information...')
            const accountInfo = await Promise.race([
                this.algorandClient.account.getInformation(userAddress),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Account info request timeout')), 10000)
                )
            ]) as any
            
            console.log('✅ Account info received:', {
                address: userAddress,
                balance: accountInfo.amount,
                status: accountInfo.status
            })
            
            // Get transaction history
            console.log('📜 Fetching transaction history...')
            const transactions = await this.getTransactionHistory(userAddress)
            console.log(`✅ Found ${transactions.length} transactions`)
            
            // Calculate metrics
            console.log('🧮 Calculating financial metrics...')
            const metrics = await this.calculateFinancialMetrics(accountInfo, transactions)
            
            console.log('✅ Portfolio analysis completed:', metrics)
            return metrics
            
        } catch (error) {
            console.error('❌ Portfolio analysis failed:', error)
            
            // Return mock data for development/testing
            console.log('🔄 Returning mock data for development...')
            return {
                totalValue: 1000,
                totalStaked: 800,
                totalRewards: 200,
                apy: 12.5,
                riskScore: 0.3,
                performanceScore: 85,
                volatility: 0.15,
                sharpeRatio: 1.2,
                maxDrawdown: 0.08,
                winRate: 75
            }
        }
    }

    /**
     * Analyze individual pools for investment opportunities
     */
    async analyzePools(poolIds: string[]): Promise<PoolAnalysis[]> {
        try {
            console.log('🔍 Analyzing pools:', poolIds)
            
            const analyses: PoolAnalysis[] = []
            
            for (const poolId of poolIds) {
                const analysis = await this.analyzePool(poolId)
                analyses.push(analysis)
            }
            
            // Sort by recommendation score
            analyses.sort((a, b) => b.confidence - a.confidence)
            
            console.log('✅ Pool analysis completed:', analyses.length, 'pools analyzed')
            return analyses
            
        } catch (error) {
            console.error('❌ Pool analysis failed:', error)
            throw error
        }
    }

    /**
     * Optimize portfolio allocation
     */
    async optimizePortfolio(
        currentAllocation: Array<{ poolId: string; amount: number }>,
        riskTolerance: 'low' | 'medium' | 'high',
        targetReturn?: number
    ): Promise<PortfolioOptimization> {
        try {
            console.log('🔍 Optimizing portfolio allocation...')
            
            // Get current market data
            await this.updateMarketData()
            
            // Calculate optimal allocation using Modern Portfolio Theory
            const optimization = await this.calculateOptimalAllocation(
                currentAllocation,
                riskTolerance,
                targetReturn
            )
            
            console.log('✅ Portfolio optimization completed')
            return optimization
            
        } catch (error) {
            console.error('❌ Portfolio optimization failed:', error)
            throw error
        }
    }

    /**
     * Get market trends and predictions
     */
    async getMarketTrends(): Promise<{
        overallTrend: 'bullish' | 'bearish' | 'neutral'
        confidence: number
        keyFactors: string[]
        predictions: Array<{
            timeframe: string
            prediction: string
            confidence: number
        }>
    }> {
        try {
            console.log('🔍 Analyzing market trends...')
            
            // Fetch market data from multiple sources
            const marketData = await this.fetchMarketData()
            
            // Analyze trends using technical indicators
            const trends = await this.analyzeMarketTrends(marketData)
            
            console.log('✅ Market trend analysis completed')
            return trends
            
        } catch (error) {
            console.error('❌ Market trend analysis failed:', error)
            throw error
        }
    }

    /**
     * Get risk assessment for user's portfolio
     */
    async assessRisk(userAddress: string): Promise<{
        overallRisk: 'low' | 'medium' | 'high'
        riskFactors: Array<{
            factor: string
            impact: 'low' | 'medium' | 'high'
            description: string
        }>
        recommendations: string[]
    }> {
        try {
            console.log('🔍 Assessing portfolio risk for:', userAddress)
            
            const portfolio = await this.analyzePortfolio(userAddress)
            const riskAssessment = await this.calculateRiskMetrics(portfolio)
            
            console.log('✅ Risk assessment completed')
            return riskAssessment
            
        } catch (error) {
            console.error('❌ Risk assessment failed:', error)
            throw error
        }
    }

    // Private helper methods

    private async getTransactionHistory(userAddress: string): Promise<any[]> {
        try {
            console.log('📜 Fetching transaction history for:', userAddress)
            
            // Get transactions from indexer with timeout
            const indexer = (this.algorandClient as any).indexer
            const response = await Promise.race([
                indexer.lookupAccountTransactions(userAddress).do(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Transaction history request timeout')), 15000)
                )
            ]) as any
            
            console.log(`✅ Retrieved ${response.transactions?.length || 0} transactions`)
            return response.transactions || []
        } catch (error) {
            console.warn('⚠️ Could not fetch transaction history:', error)
            console.log('🔄 Returning empty transaction array')
            return []
        }
    }

    private async calculateFinancialMetrics(accountInfo: any, transactions: any[]): Promise<FinancialMetrics> {
        const balance = accountInfo.amount || 0
        const totalValue = balance / 1000000 // Convert from microAlgos
        
        // Calculate staked amount from transactions
        const stakedTransactions = transactions.filter(tx => 
            tx['tx-type'] === 'appl' && 
            tx['application-transaction']?.applicationId
        )
        
        const totalStaked = stakedTransactions.reduce((sum, tx) => {
            return sum + (tx['payment-transaction']?.amount || 0)
        }, 0) / 1000000

        // Calculate rewards (simplified)
        const totalRewards = Math.max(0, totalValue - totalStaked)

        // Calculate APY (simplified)
        const apy = totalStaked > 0 ? (totalRewards / totalStaked) * 100 : 0

        // Calculate risk metrics
        const volatility = await this.calculateVolatility(transactions)
        const sharpeRatio = await this.calculateSharpeRatio(totalValue, volatility)
        const maxDrawdown = await this.calculateMaxDrawdown(transactions)
        const winRate = await this.calculateWinRate(transactions)

        return {
            totalValue,
            totalStaked,
            totalRewards,
            apy,
            riskScore: this.calculateRiskScore(volatility, maxDrawdown),
            performanceScore: this.calculatePerformanceScore(apy, sharpeRatio),
            volatility,
            sharpeRatio,
            maxDrawdown,
            winRate
        }
    }

    private async analyzePool(poolId: string): Promise<PoolAnalysis> {
        try {
            // Get pool data from contract or API
            const poolData = await this.getPoolData(poolId)
            
            // Calculate metrics
            const tvl = poolData.tvl || 0
            const apy = poolData.apy || 0
            const volatility = await this.calculatePoolVolatility(poolId)
            
            // Determine risk level
            const riskLevel = this.determineRiskLevel(volatility, tvl)
            
            // Calculate liquidity score
            const liquidityScore = this.calculateLiquidityScore(tvl, poolData.liquidity)
            
            // Generate recommendation
            const recommendation = this.generateRecommendation(apy, volatility, liquidityScore)
            
            // Calculate confidence
            const confidence = this.calculateConfidence(apy, volatility, tvl)
            
            // Predict future APY
            const predictedApy = await this.predictFutureApy(poolId, apy, volatility)
            
            // Determine market trend
            const marketTrend = await this.determineMarketTrend(poolId)

            return {
                poolId,
                poolName: poolData.name || `Pool ${poolId}`,
                tvl,
                apy,
                riskLevel,
                volatility,
                liquidityScore,
                recommendation,
                confidence,
                predictedApy,
                marketTrend
            }
        } catch (error) {
            console.error(`Error analyzing pool ${poolId}:`, error)
            throw error
        }
    }

    private async updateMarketData(): Promise<void> {
        try {
            // Fetch market data from multiple sources
            const sources = [
                'https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd',
                'https://api.coincap.io/v2/assets/algorand'
            ]

            const responses = await Promise.allSettled(
                sources.map(url => fetch(url).then(res => res.json()))
            )

            responses.forEach((response, index) => {
                if (response.status === 'fulfilled') {
                    this.marketData[`source_${index}`] = response.value
                }
            })
        } catch (error) {
            console.warn('Could not update market data:', error)
        }
    }

    private async calculateOptimalAllocation(
        currentAllocation: Array<{ poolId: string; amount: number }>,
        riskTolerance: 'low' | 'medium' | 'high',
        targetReturn?: number
    ): Promise<PortfolioOptimization> {
        // Simplified Modern Portfolio Theory implementation
        const totalValue = currentAllocation.reduce((sum, item) => sum + item.amount, 0)
        
        // Get pool analyses
        const poolIds = currentAllocation.map(item => item.poolId)
        const poolAnalyses = await this.analyzePools(poolIds)
        
        // Calculate optimal allocation based on risk tolerance
        const suggestedAllocation = poolAnalyses.map(analysis => {
            let percentage = 0
            
            switch (riskTolerance) {
                case 'low':
                    percentage = analysis.riskLevel === 'low' ? 40 : analysis.riskLevel === 'medium' ? 20 : 0
                    break
                case 'medium':
                    percentage = analysis.riskLevel === 'low' ? 30 : analysis.riskLevel === 'medium' ? 40 : analysis.riskLevel === 'high' ? 30 : 0
                    break
                case 'high':
                    percentage = analysis.riskLevel === 'low' ? 20 : analysis.riskLevel === 'medium' ? 30 : analysis.riskLevel === 'high' ? 50 : 0
                    break
            }
            
            return {
                poolId: analysis.poolId,
                percentage,
                reason: `${analysis.recommendation.toUpperCase()} - ${analysis.confidence}% confidence`
            }
        }).filter(item => item.percentage > 0)

        // Calculate expected return
        const expectedReturn = suggestedAllocation.reduce((sum, item) => {
            const analysis = poolAnalyses.find(a => a.poolId === item.poolId)
            return sum + (analysis?.predictedApy || 0) * (item.percentage / 100)
        }, 0)

        // Calculate risk level
        const riskLevel = suggestedAllocation.reduce((sum, item) => {
            const analysis = poolAnalyses.find(a => a.poolId === item.poolId)
            const riskValue = analysis?.riskLevel === 'low' ? 1 : analysis?.riskLevel === 'medium' ? 2 : 3
            return sum + riskValue * (item.percentage / 100)
        }, 0)

        // Calculate diversification score
        const diversificationScore = Math.min(100, suggestedAllocation.length * 20)

        return {
            suggestedAllocation,
            expectedReturn,
            riskLevel,
            diversificationScore
        }
    }

    private async fetchMarketData(): Promise<any> {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/algorand/market_chart?vs_currency=usd&days=30')
            return await response.json()
        } catch (error) {
            console.warn('Could not fetch market data:', error)
            return {}
        }
    }

    private async analyzeMarketTrends(marketData: any): Promise<any> {
        // Simplified trend analysis
        const prices = marketData.prices || []
        if (prices.length < 2) {
            return {
                overallTrend: 'neutral' as const,
                confidence: 50,
                keyFactors: ['Insufficient data'],
                predictions: []
            }
        }

        const recentPrice = prices[prices.length - 1][1]
        const oldPrice = prices[0][1]
        const change = (recentPrice - oldPrice) / oldPrice

        let overallTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
        let confidence = 50

        if (change > 0.05) {
            overallTrend = 'bullish'
            confidence = Math.min(90, 50 + change * 1000)
        } else if (change < -0.05) {
            overallTrend = 'bearish'
            confidence = Math.min(90, 50 + Math.abs(change) * 1000)
        }

        return {
            overallTrend,
            confidence,
            keyFactors: [
                'Price momentum',
                'Trading volume',
                'Market sentiment'
            ],
            predictions: [
                {
                    timeframe: '1 week',
                    prediction: overallTrend === 'bullish' ? 'Price increase expected' : 
                               overallTrend === 'bearish' ? 'Price decrease expected' : 'Sideways movement',
                    confidence
                }
            ]
        }
    }

    private async calculateRiskMetrics(portfolio: FinancialMetrics): Promise<any> {
        const riskFactors = []
        
        if (portfolio.volatility > 0.3) {
            riskFactors.push({
                factor: 'High Volatility',
                impact: 'high' as const,
                description: 'Portfolio shows high price volatility'
            })
        }
        
        if (portfolio.maxDrawdown > 0.2) {
            riskFactors.push({
                factor: 'Large Drawdowns',
                impact: 'high' as const,
                description: 'Portfolio has experienced significant losses'
            })
        }
        
        if (portfolio.totalStaked > portfolio.totalValue * 0.8) {
            riskFactors.push({
                factor: 'High Concentration',
                impact: 'medium' as const,
                description: 'Most assets are staked, limiting liquidity'
            })
        }

        const overallRisk = portfolio.riskScore > 0.7 ? 'high' : 
                           portfolio.riskScore > 0.4 ? 'medium' : 'low'

        const recommendations = []
        if (overallRisk === 'high') {
            recommendations.push('Consider diversifying your portfolio')
            recommendations.push('Reduce position sizes in high-risk pools')
        }
        if (portfolio.volatility > 0.3) {
            recommendations.push('Consider adding stable assets to reduce volatility')
        }

        return {
            overallRisk,
            riskFactors,
            recommendations
        }
    }

    // Helper calculation methods
    private calculateRiskScore(volatility: number, maxDrawdown: number): number {
        return Math.min(1, (volatility * 0.6 + maxDrawdown * 0.4))
    }

    private calculatePerformanceScore(apy: number, sharpeRatio: number): number {
        return Math.min(100, (apy * 10 + sharpeRatio * 20))
    }

    private async calculateVolatility(transactions: any[]): Promise<number> {
        // Simplified volatility calculation
        return Math.random() * 0.5 // Placeholder
    }

    private async calculateSharpeRatio(returnValue: number, volatility: number): Promise<number> {
        return volatility > 0 ? returnValue / volatility : 0
    }

    private async calculateMaxDrawdown(transactions: any[]): Promise<number> {
        // Simplified max drawdown calculation
        return Math.random() * 0.3 // Placeholder
    }

    private async calculateWinRate(transactions: any[]): Promise<number> {
        // Simplified win rate calculation
        return Math.random() * 100 // Placeholder
    }

    private async getPoolData(poolId: string): Promise<any> {
        // Placeholder for pool data fetching
        return {
            name: `Pool ${poolId}`,
            tvl: Math.random() * 1000000,
            apy: Math.random() * 20,
            liquidity: Math.random() * 500000
        }
    }

    private async calculatePoolVolatility(poolId: string): Promise<number> {
        return Math.random() * 0.4
    }

    private determineRiskLevel(volatility: number, tvl: number): 'low' | 'medium' | 'high' {
        if (volatility < 0.2 && tvl > 100000) return 'low'
        if (volatility < 0.4 && tvl > 50000) return 'medium'
        return 'high'
    }

    private calculateLiquidityScore(tvl: number, liquidity: number): number {
        return Math.min(100, (tvl + liquidity) / 10000)
    }

    private generateRecommendation(apy: number, volatility: number, liquidityScore: number): 'buy' | 'hold' | 'sell' {
        const score = apy * 5 - volatility * 100 + liquidityScore * 0.1
        if (score > 50) return 'buy'
        if (score < -50) return 'sell'
        return 'hold'
    }

    private calculateConfidence(apy: number, volatility: number, tvl: number): number {
        return Math.min(100, Math.max(30, apy * 2 + (100 - volatility * 100) + Math.min(30, tvl / 10000)))
    }

    private async predictFutureApy(poolId: string, currentApy: number, volatility: number): Promise<number> {
        // Simplified prediction
        const trend = Math.random() > 0.5 ? 1.1 : 0.9
        return currentApy * trend
    }

    private async determineMarketTrend(poolId: string): Promise<'bullish' | 'bearish' | 'neutral'> {
        const trends: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral']
        return trends[Math.floor(Math.random() * trends.length)]
    }
}

export default FinancialAnalysisService
