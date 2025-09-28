import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import PredictiveLiquidityMining from '../PredictiveLiquidityMining/PredictiveLiquidityMining'
import TrailingStop from '../TrailingStop/TrailingStop'
import './LandingPage.css'

const LandingPage: React.FC = () => {
    const { activeAddress, transactionSigner, wallets } = useWallet()
    const [isConnected, setIsConnected] = useState(false)
    const [showWalletModal, setShowWalletModal] = useState(false)
    const [currentProject, setCurrentProject] = useState<'plm' | 'tsl' | null>(null)

    useEffect(() => {
        setIsConnected(!!activeAddress)
    }, [activeAddress])

    const handleConnectWallet = async () => {
        try {
            if (wallets && wallets.length > 0) {
                setShowWalletModal(true)
            } else {
                alert('No wallets detected. Please install Pera Wallet or Defly Wallet.')
            }
        } catch (error) {
            console.error('Error connecting wallet:', error)
        }
    }

    const handleDisconnectWallet = async () => {
        try {
            if (wallets) {
                const activeWallet = wallets.find((w) => w.isActive)
                if (activeWallet) {
                    await activeWallet.disconnect()
                } else {
                    // Required for logout/cleanup of inactive providers
                    localStorage.removeItem('@txnlab/use-wallet:v3')
                    window.location.reload()
                }
            }
        } catch (error) {
            console.error('Error disconnecting wallet:', error)
        }
    }

    const navigateToProject = (project: 'plm' | 'tsl') => {
        setCurrentProject(project)
    }

    const goBackToLanding = () => {
        setCurrentProject(null)
    }

    const renderWalletConnection = () => {
        if (isConnected && activeAddress) {
            return (
                <div className="wallet-connected">
                    <div className="wallet-info">
                        <div className="wallet-icon">🔗</div>
                        <div className="wallet-details">
                            <span className="wallet-address">
                                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                            </span>
                            <span className="wallet-status">Connected</span>
                        </div>
                    </div>
                    <button className="disconnect-btn" onClick={handleDisconnectWallet}>
                        Disconnect
                    </button>
                </div>
            )
        }

        return (
            <button className="connect-wallet-btn" onClick={handleConnectWallet}>
                <span className="wallet-icon">🔗</span>
                Connect Wallet
            </button>
        )
    }

    const renderWalletModal = () => {
        if (!showWalletModal) return null

        return (
            <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
                <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Connect Your Wallet</h3>
                        <button className="close-modal" onClick={() => setShowWalletModal(false)}>
                            ✕
                        </button>
                    </div>
                    <div className="modal-content">
                        <p>Choose your preferred wallet to connect to Algorand TestNet:</p>
                        <div className="wallet-options">
                            {wallets?.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    className="wallet-option"
                                    onClick={async () => {
                                        try {
                                            await wallet.connect()
                                            setShowWalletModal(false)
                                        } catch (error) {
                                            console.error('Error connecting wallet:', error)
                                            alert(`Error connecting ${wallet.id} wallet. Please try again.`)
                                        }
                                    }}
                                >
                                    <div className="wallet-provider-icon">
                                        {wallet.id === 'pera' ? '🟣' : wallet.id === 'defly' ? '🔷' : '🔗'}
                                    </div>
                                    <div className="wallet-provider-info">
                                        <span className="provider-name">{wallet.id === 'pera' ? 'Pera Wallet' : wallet.id === 'defly' ? 'Defly Wallet' : wallet.id}</span>
                                        <span className="provider-description">
                                            {wallet.id === 'pera' ? 'Pera Algo Wallet' : wallet.id === 'defly' ? 'Defly Wallet' : 'Algorand Wallet'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <p className="network-info">
                                🌐 Connected to <strong>Algorand TestNet</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Render specific project if selected
    if (currentProject === 'plm') {
        return (
            <div>
                <div className="project-header">
                    <button className="back-btn" onClick={goBackToLanding}>
                        ← Back to Home
                    </button>
                    <div className="project-title">
                        <span className="project-icon">🔮</span>
                        Predictive Liquidity Mining
                    </div>
                </div>
                <PredictiveLiquidityMining />
            </div>
        )
    }

    if (currentProject === 'tsl') {
        return (
            <div>
                <div className="project-header">
                    <button className="back-btn" onClick={goBackToLanding}>
                        ← Back to Home
                    </button>
                    <div className="project-title">
                        <span className="project-icon">🎯</span>
                        Trailing Stop-Loss
                    </div>
                </div>
                <TrailingStop />
            </div>
        )
    }

    return (
        <div className="landing-page">
            {/* Header with Wallet Connection */}
            <header className="landing-header">
                <div className="header-content">
                    <div className="logo-section">
                        <div className="logo-icon">🌊</div>
                        <h1 className="logo-text">AlgoRiver</h1>
                    </div>
                    <div className="wallet-section">
                        {renderWalletConnection()}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            {/* <section className="hero-section">
                <div className="hero-background">
                    <div className="hero-particles"></div>
                    <div className="hero-gradient"></div>
                </div>
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            Welcome to <span className="highlight">Algorand</span> Advanced Strategies
                        </h1>
                        <p className="hero-subtitle">
                            Experience the future of DeFi with AI-powered liquidity mining and intelligent stop-loss automation
                        </p>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">2</span>
                                <span className="stat-label">Advanced Protocols</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">AI</span>
                                <span className="stat-label">Powered Analytics</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">100%</span>
                                <span className="stat-label">TestNet Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* Projects Section */}
            <section className="projects-section">
                <div className="section-header">
                    <h2>Choose Your Strategy</h2>
                    <p>Select from our advanced Algorand DeFi protocols</p>
                </div>

                <div className="projects-grid">
                    
                    {/* Predictive Liquidity Mining */}
                    <div className="project-card plm-card">
                    <div className="project-header">
                            <div className="project-icon">🔮</div>
                            <div className="project-badge">AI-Powered</div>
                        </div>
                        <div className="project-content">
                            <h3>Predictive Liquidity Mining</h3>
                            <p className="project-description">
                                Advanced AI-driven liquidity mining with predictive analytics, 
                                real-time market insights, and optimized yield strategies.
                            </p>
                            <div className="project-features">
                                <div className="feature-item">
                                    <span className="feature-icon">🤖</span>
                                    <span>AI Market Analysis</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">📊</span>
                                    <span>Real-time Analytics</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">💰</span>
                                    <span>Optimized Yields</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">📱</span>
                                    <span>Telegram Alerts</span>
                                </div>
                            </div>
                            <div className="project-stats">
                                <div className="stat">
                                    <span className="stat-value">$1.8M</span>
                                    <span className="stat-label">Total TVL</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">87.3%</span>
                                    <span className="stat-label">AI Accuracy</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">28.5%</span>
                                    <span className="stat-label">Avg APY</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">📱</span>
                                    <span className="stat-label">Telegram Active</span>
                                </div>
                            </div>
                            <button 
                                className="project-btn plm-btn"
                                onClick={() => navigateToProject('plm')}
                            >
                                <span className="btn-icon">🚀</span>
                                Launch Predictive Mining
                            </button>
                        </div>
                    </div>

                    {/* Trailing Stop-Loss */}
                    <div className="project-card tsl-card">
                        <div className="project-header">
                            <div className="project-icon">🎯</div>
                            <div className="project-badge">Automated</div>
                        </div>
                        <div className="project-content">
                            <h3>Trailing Stop-Loss</h3>
                            <p className="project-description">
                                Intelligent automated trading with dynamic stop-loss management, 
                                price monitoring, and risk optimization for Algorand assets.
                            </p>
                            <div className="project-features">
                                <div className="feature-item">
                                    <span className="feature-icon">⚡</span>
                                    <span>Real-time Monitoring</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">🛡️</span>
                                    <span>Risk Management</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">📈</span>
                                    <span>Dynamic Adjustments</span>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">🔔</span>
                                    <span>Smart Notifications</span>
                                </div>
                            </div>
                            <div className="project-stats">
                                <div className="stat">
                                    <span className="stat-value">24/7</span>
                                    <span className="stat-label">Monitoring</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">0.1s</span>
                                    <span className="stat-label">Response Time</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">99.9%</span>
                                    <span className="stat-label">Uptime</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">📱</span>
                                    <span className="stat-label">Telegram Active</span>
                                </div>
                            </div>
                            <button 
                                className="project-btn tsl-btn"
                                onClick={() => navigateToProject('tsl')}
                            >
                                <span className="btn-icon">🎯</span>
                                Launch Stop-Loss
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Why Choose AlgoRiver?</h2>
                    <p>Built on Algorand's fast, secure, and sustainable blockchain</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Lightning Fast</h3>
                        <p>4-second finality with instant transactions on Algorand's high-performance blockchain</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure & Reliable</h3>
                        <p>Enterprise-grade security with Pure Proof-of-Stake consensus mechanism</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🌱</div>
                        <h3>Carbon Negative</h3>
                        <p>Sustainable blockchain technology with minimal environmental impact</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI-Powered</h3>
                        <p>Advanced machine learning algorithms for optimal strategy execution</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>AlgoRiver Platform</h4>
                        <p>Advanced DeFi strategies on Algorand</p>
                    </div>
                    <div className="footer-section">
                        <h4>Network</h4>
                        <p>Algorand TestNet</p>
                    </div>
                    <div className="footer-section">
                        <h4>Status</h4>
                        <p>🟢 All Systems Operational</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 AlgoRiver. Built on Algorand blockchain.</p>
                </div>
            </footer>

            {/* Wallet Modal */}
            {renderWalletModal()}
        </div>
    )
}

export default LandingPage
