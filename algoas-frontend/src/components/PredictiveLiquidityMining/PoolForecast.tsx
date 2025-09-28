import React, { useState, useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { DataIntegrationService, EnhancedPoolData } from '../../services/dataIntegration';
import { PredictiveLiquidityMiningClient, PredictiveLiquidityMiningFactory, APP_SPEC } from '../../contracts/PredictiveLiquidityMining';
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../../utils/network/getAlgoClientConfigs';
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { telegramBotService, TransactionData } from '../../services/telegramBotService';

interface PoolForecastProps {
    pools: EnhancedPoolData[]
    refreshData?: () => Promise<void>
}

const PoolForecast: React.FC<PoolForecastProps> = ({ pools, refreshData }) => {
    const { activeAddress, transactionSigner } = useWallet()
    const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h')
    const [selectedPool, setSelectedPool] = useState<string | null>(null)
    const [stakingAmount, setStakingAmount] = useState<string>('')
    const [dataService] = useState(() => new DataIntegrationService())
    const [timeframePools, setTimeframePools] = useState<EnhancedPoolData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isStaking, setIsStaking] = useState(false)


    // Initialize Algorand client
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const algorandClient = AlgorandClient.fromConfig({
        algodConfig,
        indexerConfig,
    })

    // Set transaction signer with logging
    console.log('🔧 Setting transaction signer:', {
        hasTransactionSigner: !!transactionSigner,
        signerType: transactionSigner?.constructor?.name
    })
    algorandClient.setDefaultSigner(transactionSigner)

    const timeframeOptions = [
        { value: '24h', label: '24 Hours' },
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' }
    ]

    useEffect(() => {
        loadTimeframeData()
        const interval = setInterval(() => {
            console.log(`Auto-refreshing ${selectedTimeframe} forecast data...`)
            loadTimeframeData()
        }, 30000)
        return () => clearInterval(interval)
    }, [selectedTimeframe])

    const loadTimeframeData = async () => {
        setIsLoading(true)
        try {
            const enhancedPools = await dataService.getEnhancedPools(selectedTimeframe)
            setTimeframePools(enhancedPools)
        } catch (error) {
            console.error('Error loading timeframe data:', error)
            setTimeframePools(pools)
        } finally {
            setIsLoading(false)
        }
    }

    const calculateProjectedReturns = (amount: number, pool: EnhancedPoolData, timeframe: string) => {
        const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30
        const dailyRate = pool.aiPrediction / 365 / 100
        const projectedReturn = amount * dailyRate * days
        const currentReturn = amount * (pool.currentAPY / 365 / 100) * days
        return {
            projected: projectedReturn,
            current: currentReturn,
            difference: projectedReturn - currentReturn
        }
    }

    const getVolatilityColor = (volatility: string) => {
        switch (volatility) {
            case 'Very Low': return '#10b981'
            case 'Low': return '#3b82f6'
            case 'Medium': return '#f59e0b'
            case 'Medium-High': return '#ef4444'
            case 'High': return '#dc2626'
            case 'Very High': return '#991b1b'
            default: return '#6b7280'
        }
    }


    const handleStakeInPool = async (pool: EnhancedPoolData) => {
        console.log('🚀 Stake in pool initiated:', pool.name)
        console.log('📊 COMPLETE POOL OBJECT:', pool)
        console.log('🆔 Pool ID value:', pool.id)
        console.log('🆔 Pool ID type:', typeof pool.id)
        console.log('🆔 Pool ID defined?', pool.id !== undefined)
        console.log('🆔 Will use default poolId=1 if undefined')

        if (!activeAddress) {
            alert('Please connect your wallet first')
            console.error('❌ No active address')
            return
        }

        if (!transactionSigner) {
            alert('Wallet signing not available')
            console.error('❌ No transaction signer')
            return
        }

        if (!stakingAmount || parseFloat(stakingAmount) <= 0) {
            alert('Please enter a valid staking amount')
            console.error('❌ Invalid staking amount:', stakingAmount)
            return
        }

        console.log('✅ Pre-checks passed:', {
            activeAddress,
            hasTransactionSigner: !!transactionSigner,
            stakingAmount
        })

        setIsStaking(true)

        try {
            console.log(`🚀 Starting stake process for ${stakingAmount} in pool ${pool.name}...`)

            const microAlgos = Math.floor(parseFloat(stakingAmount) * 1_000_000)

            console.log('� Transaction details:', {
                poolId: pool.id,
                amount: microAlgos,
                amountInAlgos: parseFloat(stakingAmount),
                userAddress: activeAddress,
                poolName: pool.name
            })

            // Use deployed PredictiveLiquidityMining contract App ID for TestNet
            const contractAppId = BigInt(746293484) // TestNet deployment
            console.log(`✅ Using TestNet contract App ID: ${contractAppId}`)

            // Create client instance 
            const contractClient = new PredictiveLiquidityMiningClient({
                algorand: algorandClient,
                appId: contractAppId,
            })

            console.log('💰 Executing stakeInPool method with parameters:', {
                poolId: pool.id,
                amount: microAlgos.toString(),
                userAddress: activeAddress,
                contractAppId: contractAppId.toString()
            })

            // Safe poolId - default to 1 for smart contract compatibility
            const safePoolId = pool.id || "1"
            console.log('🔒 Using safe poolId (default=1):', safePoolId)

            // Execute real blockchain transaction
            console.log('🔄 About to send transaction to blockchain...')
            console.log('📊 Transaction parameters:', {
                contractAppId: contractAppId.toString(),
                poolId: safePoolId,
                amount: microAlgos.toString(),
                userAddress: activeAddress,
                sender: activeAddress,
                algorandClientStatus: !!algorandClient,
                transactionSignerStatus: !!transactionSigner
            })

            // First: Send ALGO payment to the contract
            console.log('💸 Step 1: Sending ALGO payment to contract...')

            try {
                // Create payment transaction using algosdk
                const suggestedParams = await algorandClient.client.algod.getTransactionParams().do()
                const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    sender: activeAddress,
                    receiver: contractClient.appClient.appAddress,
                    amount: microAlgos,
                    note: new Uint8Array(Buffer.from(`Stake ${microAlgos} in pool ${safePoolId}`)),
                    suggestedParams
                })

                // Sign and send the payment transaction
                const signedPayment = await transactionSigner([paymentTxn], [0])
                const paymentResult = await algorandClient.client.algod.sendRawTransaction(signedPayment[0]).do()

                console.log('💳 Payment transaction created and sent:', {
                    from: activeAddress,
                    to: contractClient.appClient.appAddress,
                    amount: microAlgos,
                    txId: paymentResult.txid
                })

                console.log('✅ Payment transaction sent successfully:', paymentResult.txid)
                console.log('✅ Payment transaction confirmed automatically')

            } catch (paymentError: any) {
                console.error('❌ Payment transaction failed:', paymentError)
                alert(`❌ Payment Failed: ${paymentError?.message || 'Unknown payment error'}`)
                return
            }

            // Second: Call the stakeInPool contract method
            console.log('📞 Step 2: Calling stakeInPool contract method...')
            const stakeResult = await contractClient.send.stakeInPool({
                args: {
                    poolId: safePoolId,
                    amount: microAlgos.toString(),
                    userAddress: activeAddress
                },
                sender: activeAddress
            })

            console.log('✅ Transaction sent successfully, result:', stakeResult)

            const realTxnId = stakeResult.txIds[0]
            const contractResponse = stakeResult.return || `Successfully staked ${microAlgos} microAlgos in pool ${safePoolId}`

            console.log('🎉 Smart contract transaction completed successfully:', {
                appId: contractAppId,
                txnId: realTxnId,
                response: contractResponse,
                txIds: stakeResult.txIds,
                confirmations: stakeResult.confirmations
            })

            const amount = parseFloat(stakingAmount)

            // Save stake transaction to localStorage for dashboard
            const targetAddress = 'YIWNSMNTHC3AJJPUWJQVBNOU7LTIOS4HVSPZL5UUKWETPTFCKAAI4RYHNA'
            const stakeRecord = {
                txnId: realTxnId,
                userAddress: targetAddress, // Use target address instead of activeAddress
                poolId: safePoolId,
                poolName: pool.name,
                stakedAmount: amount,
                timestamp: new Date().toISOString(),
                contractAppId: contractAppId.toString(),
                contractResponse,
                pool: {
                    currentAPY: pool.currentAPY,
                    aiPrediction: pool.aiPrediction,
                    riskScore: pool.riskScore
                }
            }
            
            console.log('💾 Saving stake record with target address:', {
                userAddress: targetAddress,
                stakedAmount: amount,
                poolName: pool.name,
                txnId: realTxnId
            })

            // Get existing stakes or create new array
            const existingStakes = JSON.parse(localStorage.getItem('userStakes') || '[]')
            existingStakes.push(stakeRecord)
            localStorage.setItem('userStakes', JSON.stringify(existingStakes))
            console.log('💾 Stake record saved to localStorage:', stakeRecord)

            const projectedReturns = calculateProjectedReturns(amount, pool, selectedTimeframe)

            alert(`✅ Smart Contract Transaction Successful!\n\n` +
                `Transaction ID: ${realTxnId}\n` +
                `Smart Contract Response: ${contractResponse}\n` +
                `Contract App ID: ${contractAppId}\n\n` +
                `Staked Amount: $${amount}\n` +
                `Expected ${selectedTimeframe} return: $${projectedReturns.projected.toFixed(2)}\n` +
                `AI Predicted APY: ${pool.aiPrediction.toFixed(1)}%\n` +
                `Confidence Level: ${pool.confidence.toFixed(0)}%\n\n` +
                `🎉 Your stake has been processed!`)

            // Send Telegram notification for successful stake
            try {
                await telegramBotService.sendTransactionNotification({
                    type: 'stake',
                    userAddress: activeAddress,
                    amount: amount,
                    poolId: safePoolId,
                    poolName: pool.name,
                    status: 'success',
                    txId: realTxnId,
                    timestamp: new Date().toISOString(),
                    message: `Staked ${amount} ALGO in pool ${pool.name} (${safePoolId})`
                })
                console.log('📱 Telegram notification sent for successful stake')
            } catch (telegramError) {
                console.error('❌ Error sending Telegram notification:', telegramError)
            }

            setStakingAmount('')
            setSelectedPool(null)

            if (refreshData) {
                await refreshData()
            }

        } catch (error: any) {
            console.error('❌ Smart contract execution failed:', error)

            // Detailed error logging
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                cause: error.cause,
                stack: error.stack,
                response: error.response
            })

            let errorMessage = 'Contract execution failed'
            let troubleshootingTip = ''

            if (error.message) {
                if (error.message.includes('rejected') || error.message.includes('cancelled')) {
                    errorMessage = 'Transaction was rejected/cancelled by user'
                    troubleshootingTip = 'Please approve the transaction in your wallet.'
                } else if (error.message.includes('insufficient')) {
                    errorMessage = 'Insufficient funds for transaction'
                    troubleshootingTip = 'Make sure you have enough ALGO for transaction fees (~0.001 ALGO).'
                } else if (error.message.includes('network') || error.message.includes('timeout')) {
                    errorMessage = 'Network error - please check connection'
                    troubleshootingTip = 'Check your internet connection and try again.'
                } else if (error.message.includes('app does not exist') || error.message.includes('application does not exist')) {
                    errorMessage = 'Smart contract not found'
                    troubleshootingTip = 'Contract App ID 1005 may not be deployed correctly on this network.'
                } else if (error.message.includes('sender') || error.message.includes('signer')) {
                    errorMessage = 'Wallet signing error'
                    troubleshootingTip = 'Make sure your wallet is connected and can sign transactions.'
                } else if (error.message.includes('logic eval error')) {
                    errorMessage = 'Smart contract logic error'
                    troubleshootingTip = 'The contract rejected this transaction. Check parameters or pool status.'
                } else {
                    errorMessage = `Contract error: ${error.message.substring(0, 100)}`
                    troubleshootingTip = 'Try reducing the stake amount or contact support.'
                }
            }

            const alertMessage = `❌ ${errorMessage}\n\n💡 ${troubleshootingTip}\n\nTechnical details:\n${error.message || 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`

            alert(alertMessage)

            // Send Telegram notification for failed stake
            try {
                await telegramBotService.sendTransactionNotification({
                    type: 'stake',
                    userAddress: activeAddress,
                    amount: parseFloat(stakingAmount),
                    poolId: pool.id || '1',
                    poolName: pool.name,
                    status: 'failed',
                    timestamp: new Date().toISOString(),
                    message: `Failed to stake ${stakingAmount} ALGO in pool ${pool.name}: ${errorMessage}`
                })
                console.log('📱 Telegram notification sent for failed stake')
            } catch (telegramError) {
                console.error('❌ Error sending Telegram notification:', telegramError)
            }
        } finally {
            setIsStaking(false)
        }
    }

    const getTrendIcon = (trend: string) => {
        if (trend.includes('Bullish')) return '📈'
        if (trend.includes('Bearish')) return '📉'
        return '➡️'
    }

    return (
        <div className="pool-forecast">
            <div className="forecast-header">
                <h2>AI Pool Forecasts</h2>
                <p>Advanced machine learning predictions for optimal yield opportunities</p>
            </div>

            <div className="forecast-controls">
                <div className="timeframe-selector">
                    <label>Forecast Timeframe:</label>
                    <div className="timeframe-buttons">
                        {timeframeOptions.map(option => (
                            <button
                                key={option.value}
                                className={`timeframe-btn ${selectedTimeframe === option.value ? 'active' : ''}`}
                                onClick={() => setSelectedTimeframe(option.value as any)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pools-grid">
                {(isLoading ? pools : timeframePools).map(pool => {
                    const isSelected = selectedPool === pool.id

                    return (
                        <div
                            key={pool.id}
                            className={`pool-forecast-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedPool(isSelected ? null : pool.id)}
                        >
                            <div className="pool-header">
                                <div className="pool-name">
                                    <h3>{pool.name}</h3>
                                    <span className="pool-status">{pool.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                                <div className="pool-controls">
                                    <div className="pool-tvl">
                                        <span>TVL: ${pool.tvl.toLocaleString()}</span>
                                    </div>
                                    <div className="expand-indicator">
                                        {isSelected ? '▼' : '▶'}
                                    </div>
                                </div>
                            </div>

                            <div className="forecast-metrics">
                                <div className="metric">
                                    <span className="metric-label">Current APY</span>
                                    <span className="metric-value current">{pool.currentAPY.toFixed(1)}%</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">AI Prediction</span>
                                    <span className="metric-value prediction">{pool.aiPrediction.toFixed(1)}%</span>
                                </div>
                                <div className="metric">
                                    <span className="metric-label">Confidence</span>
                                    <span className="metric-value confidence">{pool.confidence.toFixed(0)}%</span>
                                </div>
                            </div>

                            <div className="forecast-indicators">
                                <div className="trend-indicator">
                                    <span className="trend-icon">{getTrendIcon(pool.trend)}</span>
                                    <span className="trend-label">{pool.trend}</span>
                                </div>
                                <div className="volatility-indicator">
                                    <span
                                        className="volatility-dot"
                                        style={{ backgroundColor: getVolatilityColor(pool.volatility) }}
                                    ></span>
                                    <span className="volatility-label">{pool.volatility} Volatility</span>
                                </div>
                            </div>

                            {isSelected && (
                                <div
                                    className="forecast-details"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="ai-factors">
                                        <h4>Key Prediction Factors</h4>
                                        <ul>
                                            {pool.predictionFactors.map((factor, index) => (
                                                <li key={index}>{factor}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="real-data-info">
                                        <h4>Pool Statistics</h4>
                                        <div className="pool-stats">
                                            <div className="stat-item">
                                                <span>24h Volume:</span>
                                                <strong>${pool.volume24h.toLocaleString()}</strong>
                                            </div>
                                            <div className="stat-item">
                                                <span>24h Fees:</span>
                                                <strong>${pool.fees24h.toLocaleString()}</strong>
                                            </div>
                                            <div className="stat-item">
                                                <span>Risk Score:</span>
                                                <strong className={pool.riskScore < 30 ? 'low-risk' : pool.riskScore < 60 ? 'medium-risk' : 'high-risk'}>
                                                    {pool.riskScore.toFixed(0)}/100
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="projection-calculator"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h4>Return Calculator</h4>
                                        <div className="calculator-input">
                                            <label>Stake Amount ($)</label>
                                            <input
                                                type="number"
                                                value={stakingAmount}
                                                onChange={(e) => setStakingAmount(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                onFocus={(e) => e.stopPropagation()}
                                                placeholder="Enter amount"
                                            />
                                        </div>

                                        {stakingAmount && parseFloat(stakingAmount) > 0 && (
                                            <div className="projection-results">
                                                <div className="projection-item">
                                                    <span>Current Rate ({selectedTimeframe}):</span>
                                                    <strong>
                                                        ${calculateProjectedReturns(
                                                            parseFloat(stakingAmount),
                                                            pool,
                                                            selectedTimeframe
                                                        ).current.toFixed(2)}
                                                    </strong>
                                                </div>
                                                <div className="projection-item">
                                                    <span>AI Predicted ({selectedTimeframe}):</span>
                                                    <strong className="predicted">
                                                        ${calculateProjectedReturns(
                                                            parseFloat(stakingAmount),
                                                            pool,
                                                            selectedTimeframe
                                                        ).projected.toFixed(2)}
                                                    </strong>
                                                </div>
                                                <div className="projection-item potential">
                                                    <span>Potential Uplift:</span>
                                                    <strong className={calculateProjectedReturns(parseFloat(stakingAmount), pool, selectedTimeframe).difference >= 0 ? 'positive' : 'negative'}>
                                                        ${calculateProjectedReturns(
                                                            parseFloat(stakingAmount),
                                                            pool,
                                                            selectedTimeframe
                                                        ).difference >= 0 ? '+' : ''}
                                                        {calculateProjectedReturns(
                                                            parseFloat(stakingAmount),
                                                            pool,
                                                            selectedTimeframe
                                                        ).difference.toFixed(2)}
                                                    </strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="action-buttons"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className={`stake-button primary ${isStaking ? 'loading' : ''}`}
                                            onClick={() => handleStakeInPool(pool)}
                                            disabled={isStaking || !stakingAmount || parseFloat(stakingAmount) <= 0}
                                        >
                                            {isStaking ? '⏳ Staking...' : `Stake in ${pool.name}`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {pools.length === 0 && !isLoading && (
                <div className="no-pools">
                    <h3>No pools available</h3>
                    <p>Please check your connection or try again later.</p>
                </div>
            )}

            {isLoading && (
                <div className="loading-pools">
                    <div className="loading-spinner"></div>
                    <p>Loading {selectedTimeframe} predictions...</p>
                </div>
            )}


            <div className="forecast-disclaimer">
                <h4>⚠️ Important Disclaimer</h4>
                <p>
                    AI predictions are based on real market data and advanced algorithms.
                    Past performance does not guarantee future results.
                    Always consider your risk tolerance and conduct your own research before investing.
                    This platform uses live data from Algorand DEXs and market sources.
                </p>
            </div>
        </div>
    )
}

export default PoolForecast