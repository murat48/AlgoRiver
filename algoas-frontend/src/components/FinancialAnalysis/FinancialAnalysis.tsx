import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import FinancialAnalysisService, { FinancialMetrics, PoolAnalysis, PortfolioOptimization } from '../../services/financialAnalysisService'
import './FinancialAnalysis.css'

const FinancialAnalysis: React.FC = () => {
    const { activeAddress } = useWallet()
    const [analysisService] = useState(() => new FinancialAnalysisService())
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'portfolio' | 'pools' | 'optimization' | 'trends' | 'risk'>('portfolio')
    
    // State for different analyses
    const [portfolioMetrics, setPortfolioMetrics] = useState<FinancialMetrics | null>(null)
    const [poolAnalyses, setPoolAnalyses] = useState<PoolAnalysis[]>([])
    const [optimization, setOptimization] = useState<PortfolioOptimization | null>(null)
    const [marketTrends, setMarketTrends] = useState<any>(null)
    const [riskAssessment, setRiskAssessment] = useState<any>(null)
    
    // Error state
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (activeAddress) {
            loadPortfolioAnalysis()
        }
    }, [activeAddress])

    const loadPortfolioAnalysis = async () => {
        if (!activeAddress) {
            setError('Please connect your wallet first')
            return
        }
        
        setLoading(true)
        setError(null)
        
        try {
            console.log('🚀 Starting portfolio analysis...')
            const metrics = await analysisService.analyzePortfolio(activeAddress)
            setPortfolioMetrics(metrics)
            console.log('✅ Portfolio analysis loaded successfully')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load portfolio analysis'
            setError(errorMessage)
            console.error('❌ Portfolio analysis error:', err)
            
            // Set mock data as fallback
            setPortfolioMetrics({
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
            })
        } finally {
            setLoading(false)
        }
    }

    const loadPoolAnalysis = async () => {
        setLoading(true)
        setError(null)
        
        try {
            // Example pool IDs - replace with actual pool IDs from your system
            const poolIds = ['1', '2', '3', '4', '5']
            const analyses = await analysisService.analyzePools(poolIds)
            setPoolAnalyses(analyses)
        } catch (err) {
            setError('Failed to load pool analysis')
            console.error('Pool analysis error:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadOptimization = async () => {
        if (!activeAddress) return
        
        setLoading(true)
        setError(null)
        
        try {
            // Example current allocation - replace with actual data
            const currentAllocation = [
                { poolId: '1', amount: 1000 },
                { poolId: '2', amount: 2000 },
                { poolId: '3', amount: 1500 }
            ]
            
            const optimization = await analysisService.optimizePortfolio(
                currentAllocation,
                'medium',
                15 // 15% target return
            )
            setOptimization(optimization)
        } catch (err) {
            setError('Failed to load portfolio optimization')
            console.error('Optimization error:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadMarketTrends = async () => {
        setLoading(true)
        setError(null)
        
        try {
            const trends = await analysisService.getMarketTrends()
            setMarketTrends(trends)
        } catch (err) {
            setError('Failed to load market trends')
            console.error('Market trends error:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadRiskAssessment = async () => {
        if (!activeAddress) return
        
        setLoading(true)
        setError(null)
        
        try {
            const assessment = await analysisService.assessRisk(activeAddress)
            setRiskAssessment(assessment)
        } catch (err) {
            setError('Failed to load risk assessment')
            console.error('Risk assessment error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleTabClick = (tab: typeof activeTab) => {
        setActiveTab(tab)
        
        // Load data when switching tabs
        switch (tab) {
            case 'portfolio':
                loadPortfolioAnalysis()
                break
            case 'pools':
                loadPoolAnalysis()
                break
            case 'optimization':
                loadOptimization()
                break
            case 'trends':
                loadMarketTrends()
                break
            case 'risk':
                loadRiskAssessment()
                break
        }
    }

    const renderPortfolioMetrics = () => {
        if (!portfolioMetrics) return <div className="no-data">No portfolio data available</div>
        
        return (
            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>Total Value</h3>
                    <p className="metric-value">${portfolioMetrics.totalValue.toLocaleString()}</p>
                </div>
                <div className="metric-card">
                    <h3>Total Staked</h3>
                    <p className="metric-value">${portfolioMetrics.totalStaked.toLocaleString()}</p>
                </div>
                <div className="metric-card">
                    <h3>Total Rewards</h3>
                    <p className="metric-value">${portfolioMetrics.totalRewards.toLocaleString()}</p>
                </div>
                <div className="metric-card">
                    <h3>Current APY</h3>
                    <p className="metric-value">{portfolioMetrics.apy.toFixed(2)}%</p>
                </div>
                <div className="metric-card">
                    <h3>Risk Score</h3>
                    <p className="metric-value">{portfolioMetrics.riskScore.toFixed(2)}</p>
                </div>
                <div className="metric-card">
                    <h3>Performance Score</h3>
                    <p className="metric-value">{portfolioMetrics.performanceScore.toFixed(0)}/100</p>
                </div>
                <div className="metric-card">
                    <h3>Volatility</h3>
                    <p className="metric-value">{(portfolioMetrics.volatility * 100).toFixed(1)}%</p>
                </div>
                <div className="metric-card">
                    <h3>Sharpe Ratio</h3>
                    <p className="metric-value">{portfolioMetrics.sharpeRatio.toFixed(2)}</p>
                </div>
            </div>
        )
    }

    const renderPoolAnalysis = () => {
        if (poolAnalyses.length === 0) return <div className="no-data">No pool analysis available</div>
        
        return (
            <div className="pool-analysis-grid">
                {poolAnalyses.map((analysis) => (
                    <div key={analysis.poolId} className="pool-analysis-card">
                        <div className="pool-header">
                            <h3>{analysis.poolName}</h3>
                            <span className={`risk-badge ${analysis.riskLevel}`}>
                                {analysis.riskLevel.toUpperCase()}
                            </span>
                        </div>
                        
                        <div className="pool-metrics">
                            <div className="metric">
                                <span className="label">TVL:</span>
                                <span className="value">${analysis.tvl.toLocaleString()}</span>
                            </div>
                            <div className="metric">
                                <span className="label">Current APY:</span>
                                <span className="value">{analysis.apy.toFixed(2)}%</span>
                            </div>
                            <div className="metric">
                                <span className="label">Predicted APY:</span>
                                <span className="value">{analysis.predictedApy.toFixed(2)}%</span>
                            </div>
                            <div className="metric">
                                <span className="label">Volatility:</span>
                                <span className="value">{(analysis.volatility * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        
                        <div className="pool-recommendation">
                            <div className={`recommendation ${analysis.recommendation}`}>
                                {analysis.recommendation.toUpperCase()}
                            </div>
                            <div className="confidence">
                                Confidence: {analysis.confidence.toFixed(0)}%
                            </div>
                            <div className={`market-trend ${analysis.marketTrend}`}>
                                Market: {analysis.marketTrend.toUpperCase()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const renderOptimization = () => {
        if (!optimization) return <div className="no-data">No optimization data available</div>
        
        return (
            <div className="optimization-container">
                <div className="optimization-summary">
                    <h3>Portfolio Optimization Summary</h3>
                    <div className="summary-metrics">
                        <div className="summary-metric">
                            <span className="label">Expected Return:</span>
                            <span className="value">{optimization.expectedReturn.toFixed(2)}%</span>
                        </div>
                        <div className="summary-metric">
                            <span className="label">Risk Level:</span>
                            <span className="value">{optimization.riskLevel.toFixed(2)}</span>
                        </div>
                        <div className="summary-metric">
                            <span className="label">Diversification Score:</span>
                            <span className="value">{optimization.diversificationScore.toFixed(0)}/100</span>
                        </div>
                    </div>
                </div>
                
                <div className="allocation-suggestions">
                    <h3>Suggested Allocation</h3>
                    {optimization.suggestedAllocation.map((allocation, index) => (
                        <div key={index} className="allocation-item">
                            <div className="allocation-pool">
                                Pool {allocation.poolId}
                            </div>
                            <div className="allocation-percentage">
                                {allocation.percentage.toFixed(1)}%
                            </div>
                            <div className="allocation-reason">
                                {allocation.reason}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderMarketTrends = () => {
        if (!marketTrends) return <div className="no-data">No market trends available</div>
        
        return (
            <div className="market-trends-container">
                <div className="trend-summary">
                    <h3>Market Overview</h3>
                    <div className={`trend-indicator ${marketTrends.overallTrend}`}>
                        {marketTrends.overallTrend.toUpperCase()}
                    </div>
                    <div className="confidence">
                        Confidence: {marketTrends.confidence.toFixed(0)}%
                    </div>
                </div>
                
                <div className="key-factors">
                    <h3>Key Factors</h3>
                    <ul>
                        {marketTrends.keyFactors.map((factor: string, index: number) => (
                            <li key={index}>{factor}</li>
                        ))}
                    </ul>
                </div>
                
                <div className="predictions">
                    <h3>Predictions</h3>
                    {marketTrends.predictions.map((prediction: any, index: number) => (
                        <div key={index} className="prediction-item">
                            <div className="timeframe">{prediction.timeframe}</div>
                            <div className="prediction-text">{prediction.prediction}</div>
                            <div className="prediction-confidence">
                                {prediction.confidence.toFixed(0)}% confidence
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderRiskAssessment = () => {
        if (!riskAssessment) return <div className="no-data">No risk assessment available</div>
        
        return (
            <div className="risk-assessment-container">
                <div className="risk-overview">
                    <h3>Risk Overview</h3>
                    <div className={`risk-level ${riskAssessment.overallRisk}`}>
                        {riskAssessment.overallRisk.toUpperCase()} RISK
                    </div>
                </div>
                
                <div className="risk-factors">
                    <h3>Risk Factors</h3>
                    {riskAssessment.riskFactors.map((factor: any, index: number) => (
                        <div key={index} className="risk-factor">
                            <div className="factor-name">{factor.factor}</div>
                            <div className={`factor-impact ${factor.impact}`}>
                                {factor.impact.toUpperCase()} IMPACT
                            </div>
                            <div className="factor-description">{factor.description}</div>
                        </div>
                    ))}
                </div>
                
                <div className="recommendations">
                    <h3>Recommendations</h3>
                    <ul>
                        {riskAssessment.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                </div>
            </div>
        )
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'portfolio':
                return renderPortfolioMetrics()
            case 'pools':
                return renderPoolAnalysis()
            case 'optimization':
                return renderOptimization()
            case 'trends':
                return renderMarketTrends()
            case 'risk':
                return renderRiskAssessment()
            default:
                return null
        }
    }

    if (!activeAddress) {
        return (
            <div className="financial-analysis">
                <div className="connect-wallet-prompt">
                    <h2>Connect Your Wallet</h2>
                    <p>Please connect your wallet to access financial analysis features.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="financial-analysis">
            <div className="analysis-header">
                <h2>🤖 AI Financial Analysis</h2>
                <p>Advanced portfolio analysis powered by Algorand blockchain data</p>
            </div>

            <nav className="analysis-nav">
                <div className="nav-tabs">
                    {[
                        { key: 'portfolio', label: 'Portfolio Metrics', icon: '📊' },
                        { key: 'pools', label: 'Pool Analysis', icon: '🔮' },
                        { key: 'optimization', label: 'Optimization', icon: '⚡' },
                        { key: 'trends', label: 'Market Trends', icon: '📈' },
                        { key: 'risk', label: 'Risk Assessment', icon: '⚠️' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => handleTabClick(tab.key as any)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="analysis-content">
                {loading && (
                    <div className="loading-indicator">
                        <div className="spinner"></div>
                        <p>Analyzing data...</p>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <p>⚠️ {error}</p>
                        <p className="error-note">Using demo data for demonstration purposes</p>
                        <button onClick={() => handleTabClick(activeTab)}>Retry Analysis</button>
                    </div>
                )}

                {!loading && !error && renderTabContent()}
            </div>
        </div>
    )
}

export default FinancialAnalysis
