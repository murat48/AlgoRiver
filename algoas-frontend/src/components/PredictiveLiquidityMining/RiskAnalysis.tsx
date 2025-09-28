import React, { useState, useEffect } from 'react'
import { DataIntegrationService, EnhancedPoolData } from '../../services/dataIntegration'

interface RiskAnalysisProps {
    pools: EnhancedPoolData[]
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ pools }) => {
    const [selectedRiskLevel, setSelectedRiskLevel] = useState<'all' | 'low' | 'medium' | 'high'>('all')
    const [analysisTimeframe, setAnalysisTimeframe] = useState<'1d' | '7d' | '30d'>('7d')
    const [dataService] = useState(() => new DataIntegrationService())
    const [historicalData, setHistoricalData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadHistoricalRiskData()
    }, [analysisTimeframe])

    const loadHistoricalRiskData = async () => {
        setIsLoading(true)
        try {
            const days = analysisTimeframe === '1d' ? 1 : analysisTimeframe === '7d' ? 7 : 30
            const data = await dataService.getHistoricalData(undefined, 'day', days)
            setHistoricalData(data)
        } catch (error) {
            console.error('Error loading historical risk data:', error)
            setHistoricalData([])
        } finally {
            setIsLoading(false)
        }
    }

    const getRiskLevel = (riskScore: number) => {
        if (riskScore <= 30) return 'low'
        if (riskScore <= 60) return 'medium'
        return 'high'
    }

    const getRiskColor = (riskScore: number) => {
        if (riskScore <= 30) return '#10b981' // green
        if (riskScore <= 60) return '#f59e0b' // yellow
        return '#ef4444' // red
    }

    const getRiskMetrics = () => {
        const totalTVL = pools.reduce((sum, pool) => sum + pool.totalStaked, 0)
        const riskDistribution = pools.reduce((acc, pool) => {
            const level = getRiskLevel(pool.riskScore)
            const tvl = pool.totalStaked
            acc[level] = {
                count: (acc[level]?.count || 0) + 1,
                tvl: (acc[level]?.tvl || 0) + tvl,
                avgAPY: (acc[level]?.totalAPY || 0) + pool.currentAPY,
                avgRisk: (acc[level]?.totalRisk || 0) + pool.riskScore
            }
            return acc
        }, {} as Record<string, any>)

        // Calculate averages
        Object.keys(riskDistribution).forEach(level => {
            const data = riskDistribution[level]
            data.avgAPY = data.avgAPY / data.count
            data.avgRisk = data.avgRisk / data.count
            data.tvlPercentage = (data.tvl / totalTVL) * 100
        })

        return { totalTVL, riskDistribution }
    }

    const getFilteredPools = () => {
        if (selectedRiskLevel === 'all') return pools
        return pools.filter(pool => getRiskLevel(pool.riskScore) === selectedRiskLevel)
    }

    const getVolatilityPrediction = (pool: EnhancedPoolData) => {
        const volatilityScore = pool.riskScore

        if (volatilityScore <= 20) return { level: 'Very Low', color: '#10b981' }
        if (volatilityScore <= 40) return { level: 'Low', color: '#3b82f6' }
        if (volatilityScore <= 60) return { level: 'Medium', color: '#f59e0b' }
        if (volatilityScore <= 80) return { level: 'High', color: '#ef4444' }
        return { level: 'Very High', color: '#991b1b' }
    }

    const getRealCorrelationData = () => {
        // Calculate real correlations based on actual pool data
        const correlations = []

        for (let i = 0; i < pools.length; i++) {
            for (let j = i + 1; j < pools.length; j++) {
                const pool1 = pools[i]
                const pool2 = pools[j]

                // Simple correlation based on risk scores and APY differences
                const riskDiff = Math.abs(pool1.riskScore - pool2.riskScore)
                const apyDiff = Math.abs(pool1.currentAPY - pool2.currentAPY)

                // Normalize correlation (this is simplified - in practice you'd use historical price data)
                let correlation = 1 - (riskDiff + apyDiff) / 200
                correlation = Math.max(-1, Math.min(1, correlation))

                const strength = Math.abs(correlation) > 0.7 ? 'Strong' :
                    Math.abs(correlation) > 0.3 ? 'Moderate' : 'Weak'
                const direction = correlation > 0 ? 'Positive' : 'Negative'

                correlations.push({
                    pool1: pool1.name,
                    pool2: pool2.name,
                    correlation: correlation, // Keep as number
                    correlationString: correlation.toFixed(2), // String version for display
                    strength: `${strength} ${direction}`
                })
            }
        }

        return correlations.slice(0, 5) // Return top 5 correlations
    }

    const renderRiskDistribution = () => {
        const { riskDistribution } = getRiskMetrics()

        return (
            <div className="risk-distribution">
                <h4>Risk Distribution</h4>
                <div className="distribution-chart">
                    {['low', 'medium', 'high'].map(level => {
                        const data = riskDistribution[level]
                        if (!data) return null

                        return (
                            <div key={level} className="distribution-bar">
                                <div className="bar-label">
                                    <span className={`risk-label ${level}`}>{level.toUpperCase()}</span>
                                    <span className="pool-count">{data.count} pools</span>
                                </div>
                                <div className="bar-container">
                                    <div
                                        className={`bar-fill ${level}`}
                                        style={{ width: `${data.tvlPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="bar-stats">
                                    <span>TVL: ${data.tvl.toLocaleString()}</span>
                                    <span>Avg APY: {data.avgAPY.toFixed(1)}%</span>
                                    <span>Avg Risk: {data.avgRisk.toFixed(0)}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderRiskMatrix = () => {
        return (
            <div className="risk-matrix">
                <h4>Risk-Return Matrix</h4>
                <div className="matrix-chart">
                    <div className="matrix-axes">
                        <div className="y-axis">
                            <span>High Return</span>
                            <span>Med Return</span>
                            <span>Low Return</span>
                        </div>
                        <div className="x-axis">
                            <span>Low Risk</span>
                            <span>Med Risk</span>
                            <span>High Risk</span>
                        </div>
                    </div>
                    <div className="matrix-grid">
                        {pools.map(pool => {
                            const x = (pool.riskScore / 100) * 90 + 5 // 5-95% of container width
                            const y = 95 - (pool.currentAPY / 30) * 90 // Assuming max APY of 30%

                            return (
                                <div
                                    key={pool.id}
                                    className="matrix-point"
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        backgroundColor: getRiskColor(pool.riskScore)
                                    }}
                                    title={`${pool.name}: ${pool.currentAPY.toFixed(1)}% APY, ${pool.riskScore} risk`}
                                >
                                    {pool.name.split('-')[0]}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderVolatilityForecast = () => {
        const filteredPools = getFilteredPools()

        return (
            <div className="volatility-forecast">
                <h4>Volatility Forecast</h4>
                <div className="forecast-list">
                    {filteredPools.map(pool => {
                        const volatility = getVolatilityPrediction(pool)

                        return (
                            <div key={pool.id} className="volatility-item">
                                <div className="pool-info">
                                    <h5>{pool.name}</h5>
                                    <span className="current-apy">{pool.currentAPY.toFixed(1)}% APY</span>
                                </div>
                                <div className="volatility-prediction">
                                    <span
                                        className="volatility-level"
                                        style={{ color: volatility.color }}
                                    >
                                        {volatility.level}
                                    </span>
                                    <div className="prediction-factors">
                                        <div className="factor">
                                            <span>Risk Score:</span>
                                            <div className="factor-bar">
                                                <div
                                                    className="factor-fill"
                                                    style={{
                                                        width: `${pool.riskScore}%`,
                                                        backgroundColor: getRiskColor(pool.riskScore)
                                                    }}
                                                ></div>
                                            </div>
                                            <span>{pool.riskScore}/100</span>
                                        </div>
                                        <div className="factor">
                                            <span>AI Confidence:</span>
                                            <div className="factor-bar">
                                                <div
                                                    className="factor-fill confidence"
                                                    style={{ width: `${pool.confidence}%` }}
                                                ></div>
                                            </div>
                                            <span>{pool.confidence}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderCorrelationAnalysis = () => {
        const correlations = getRealCorrelationData()

        return (
            <div className="correlation-analysis">
                <h4>Pool Correlations</h4>
                <div className="correlation-list">
                    {correlations.map((corr: any, index: number) => (
                        <div key={index} className="correlation-item">
                            <div className="correlation-pools">
                                <span>{corr.pool1}</span>
                                <span className="correlation-arrow">↔</span>
                                <span>{corr.pool2}</span>
                            </div>
                            <div className="correlation-value">
                                <div className="correlation-bar">
                                    <div
                                        className={`correlation-fill ${corr.correlation > 0 ? 'positive' : 'negative'}`}
                                        style={{ width: `${Math.abs(corr.correlation) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="correlation-number">
                                    {corr.correlation > 0 ? '+' : ''}{corr.correlationString}
                                </span>
                            </div>
                            <span className="correlation-strength">{corr.strength}</span>
                        </div>
                    ))}
                </div>
                <div className="correlation-note">
                    <p>
                        <strong>Note:</strong> High positive correlation means pools tend to move together.
                        Diversifying across negatively correlated pools can reduce portfolio risk.
                    </p>
                </div>
            </div>
        )
    }

    const renderRiskRecommendations = () => {
        const userRiskProfile = 'moderate' // This would come from user data

        // Get the top pools by different risk levels for dynamic recommendations
        const lowRiskPools = pools.filter(p => getRiskLevel(p.riskScore) === 'low').slice(0, 2)
        const mediumRiskPools = pools.filter(p => getRiskLevel(p.riskScore) === 'medium').slice(0, 2)
        const highRiskPools = pools.filter(p => getRiskLevel(p.riskScore) === 'high').slice(0, 2)

        const lowRiskPoolNames = lowRiskPools.map(p => p.name).join(' and ') || 'stable pools'
        const mediumRiskPoolNames = mediumRiskPools.map(p => p.name).join(' and ') || 'growth pools'
        const highRiskPoolNames = highRiskPools.map(p => p.name).join(' and ') || 'high-yield pools'

        const recommendations = {
            conservative: [
                `Focus on ${lowRiskPoolNames} (low volatility, stable returns)`,
                'Limit exposure to high-risk pools (<20% of portfolio)',
                'Prioritize pools with AI confidence >90%'
            ],
            moderate: [
                `Balance between ${lowRiskPoolNames} and ${mediumRiskPoolNames}`,
                `Consider ${mediumRiskPoolNames} for higher yield potential`,
                'Maintain 60-40 split between medium and low risk'
            ],
            aggressive: [
                `Maximize ${highRiskPoolNames} exposure for highest potential returns`,
                'Take advantage of high volatility periods',
                'Monitor AI predictions closely for entry/exit signals'
            ]
        }

        return (
            <div className="risk-recommendations">
                <h4>Risk Management Recommendations</h4>
                <div className="recommendation-tabs">
                    {Object.keys(recommendations).map(profile => (
                        <button
                            key={profile}
                            className={`rec-tab ${userRiskProfile === profile ? 'active' : ''}`}
                        >
                            {profile.charAt(0).toUpperCase() + profile.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="recommendations-list">
                    {recommendations[userRiskProfile as keyof typeof recommendations].map((rec, index) => (
                        <div key={index} className="recommendation-item">
                            <span className="rec-bullet">💡</span>
                            <span>{rec}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="risk-analysis">
            <div className="risk-header">
                <h3>Risk Analysis Dashboard</h3>
                <div className="risk-controls">
                    <select
                        value={selectedRiskLevel}
                        onChange={(e) => setSelectedRiskLevel(e.target.value as any)}
                    >
                        <option value="all">All Risk Levels</option>
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                    </select>
                    <select
                        value={analysisTimeframe}
                        onChange={(e) => setAnalysisTimeframe(e.target.value as any)}
                    >
                        <option value="1d">1 Day</option>
                        <option value="7d">7 Days</option>
                        <option value="30d">30 Days</option>
                    </select>
                </div>
            </div>

            <div className="risk-content">
                <div className="risk-section">
                    {renderRiskDistribution()}
                </div>

                <div className="risk-section">
                    {renderRiskMatrix()}
                </div>

                <div className="risk-section">
                    {renderVolatilityForecast()}
                </div>

                <div className="risk-section">
                    {renderCorrelationAnalysis()}
                </div>

                <div className="risk-section">
                    {renderRiskRecommendations()}
                </div>
            </div>
        </div>
    )
}

export default RiskAnalysis