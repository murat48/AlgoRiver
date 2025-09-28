import { PredictiveLiquidityMiningV4DynamicClient } from '../contracts/PredictiveLiquidityMiningV4DynamicClient'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

export interface ContractPoolData {
    id: string
    name: string
    apy: number
    predictedAPY: number
    confidence: number
    tvl: number
    riskLevel: string
    minStake: number
}

export interface ContractPlatformStats {
    totalPools: number
    totalStaked: number
    totalTransactions: number
    totalVolume: number
    platformFee: number
    isPaused: boolean
}

export class ContractDataService {
    private contractClient: PredictiveLiquidityMiningV4DynamicClient
    private readonly CONTRACT_APP_ID = BigInt(746488803) // Mevcut App ID

    constructor() {
        // Initialize Algorand client
        const algodConfig = getAlgodConfigFromViteEnvironment()
        const indexerConfig = getIndexerConfigFromViteEnvironment()
        const algorandClient = AlgorandClient.fromConfig({
            algodConfig,
            indexerConfig,
        })

        // Initialize contract client
        this.contractClient = new PredictiveLiquidityMiningV4DynamicClient({
            algorand: algorandClient,
            appId: this.CONTRACT_APP_ID,
        })
    }

    /**
     * Contract'tan gerçek platform istatistiklerini al
     */
    async getRealPlatformStats(): Promise<ContractPlatformStats> {
        try {
            console.log('📊 Fetching real platform stats from contract...')
            
            // Contract'tan gerçek verileri çek
            const result = await this.contractClient.send.getRealPlatformStats({
                args: []
            })

            const statsJson = JSON.parse(result.return || '{}')
            
            const platformStats: ContractPlatformStats = {
                totalPools: parseInt(statsJson.totalPools || '0'),
                totalStaked: parseInt(statsJson.totalStaked || '0'),
                totalTransactions: parseInt(statsJson.totalTransactions || '0'),
                totalVolume: parseInt(statsJson.totalVolume || '0'),
                platformFee: parseInt(statsJson.platformFee || '300'),
                isPaused: statsJson.isPaused === 'true' || statsJson.isPaused === true
            }

            console.log('✅ Real platform stats:', platformStats)
            return platformStats

        } catch (error) {
            console.error('❌ Error fetching platform stats from contract:', error)
            
            // Fallback değerler
            return {
                totalPools: 0,
                totalStaked: 0,
                totalTransactions: 0,
                totalVolume: 0,
                platformFee: 300,
                isPaused: false
            }
        }
    }

    /**
     * Contract'tan tüm pool ID'leri al
     */
    async getAllPoolIds(): Promise<string[]> {
        try {
            console.log('🏊 Fetching all pool IDs from contract...')
            
            const result = await this.contractClient.send.getAllPoolIds({
                args: []
            })

            const poolIdsString = result.return || ''
            const poolIds = poolIdsString ? poolIdsString.split(',').filter(id => id.trim()) : []
            
            console.log('✅ Pool IDs from contract:', poolIds)
            return poolIds

        } catch (error) {
            console.error('❌ Error fetching pool IDs from contract:', error)
            return []
        }
    }

    /**
     * Contract'tan belirli bir pool'un istatistiklerini al
     */
    async getPoolStats(poolId: string): Promise<ContractPoolData | null> {
        try {
            console.log(`📈 Fetching pool ${poolId} stats from contract...`)
            
            const result = await this.contractClient.send.getPoolStats({
                args: [poolId]
            })

            const statsString = result.return || ''
            
            // Parse the pool stats string
            // Format: "Pool 1: Current APY 15.5%, Predicted APY 18.2% (87% confidence), TVL: 1500000 microAlgos"
            const poolData = this.parsePoolStats(poolId, statsString)
            
            console.log(`✅ Pool ${poolId} stats:`, poolData)
            return poolData

        } catch (error) {
            console.error(`❌ Error fetching pool ${poolId} stats:`, error)
            return null
        }
    }

    /**
     * Pool stats string'ini parse et
     */
    private parsePoolStats(poolId: string, statsString: string): ContractPoolData {
        // Default values
        let apy = 15.5
        let predictedAPY = 18.2
        let confidence = 87
        let tvl = 1500000

        try {
            // Parse APY
            const apyMatch = statsString.match(/Current APY ([\d.]+)%/)
            if (apyMatch) apy = parseFloat(apyMatch[1])

            // Parse Predicted APY
            const predApyMatch = statsString.match(/Predicted APY ([\d.]+)%/)
            if (predApyMatch) predictedAPY = parseFloat(predApyMatch[1])

            // Parse Confidence
            const confMatch = statsString.match(/\((\d+)% confidence\)/)
            if (confMatch) confidence = parseInt(confMatch[1])

            // Parse TVL
            const tvlMatch = statsString.match(/TVL: ([\d,]+)/)
            if (tvlMatch) tvl = parseInt(tvlMatch[1].replace(/,/g, ''))

        } catch (error) {
            console.log('⚠️ Error parsing pool stats, using defaults:', error)
        }

        return {
            id: poolId,
            name: `Pool ${poolId}`,
            apy,
            predictedAPY,
            confidence,
            tvl,
            riskLevel: this.calculateRiskLevel(apy, confidence),
            minStake: 100000 // 0.1 ALGO minimum
        }
    }

    /**
     * Risk level hesapla
     */
    private calculateRiskLevel(apy: number, confidence: number): string {
        if (apy > 20 || confidence < 70) return 'High'
        if (apy > 15 || confidence < 85) return 'Medium'
        return 'Low'
    }

    /**
     * Contract'tan transaction verilerini al
     */
    async getTransactionSummary(): Promise<any> {
        try {
            console.log('📊 Fetching transaction summary from contract...')
            
            const result = await this.contractClient.send.getTransactionSummary({
                args: []
            })

            const summaryJson = JSON.parse(result.return || '{}')
            console.log('✅ Transaction summary:', summaryJson)
            
            return summaryJson

        } catch (error) {
            console.error('❌ Error fetching transaction summary:', error)
            return {
                totalTransactions: '0',
                totalStaked: '0',
                activeTransactions24h: '0'
            }
        }
    }

    /**
     * Contract'a yeni pool oluştur
     */
    async createPool(
        poolName: string,
        initialAPY: string,
        riskLevel: string,
        minStake: string,
        senderAddress: string
    ): Promise<string> {
        try {
            console.log('🏊 Creating new pool in contract...')
            
            const result = await this.contractClient.send.createPool({
                args: [poolName, initialAPY, riskLevel, minStake],
                sender: senderAddress
            })

            console.log('✅ Pool created:', result.return)
            return result.return || 'Pool created successfully'

        } catch (error) {
            console.error('❌ Error creating pool:', error)
            throw error
        }
    }

    /**
     * Contract'ta stake yap
     */
    async stakeInPool(
        poolId: string,
        amount: string,
        userAddress: string,
        senderAddress: string
    ): Promise<string> {
        try {
            console.log(`💰 Staking ${amount} in pool ${poolId}...`)
            
            const result = await this.contractClient.send.stakeInPool({
                args: [poolId, amount, userAddress],
                sender: senderAddress
            })

            console.log('✅ Stake successful:', result.return)
            return result.return || 'Stake successful'

        } catch (error) {
            console.error('❌ Error staking:', error)
            throw error
        }
    }
}
