// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import AppCalls from './components/AppCalls'
import PredictiveLiquidityMining from './components/PredictiveLiquidityMining/PredictiveLiquidityMining'
import TrailingStop from './components/TrailingStop/TrailingStop'

interface HomeProps { }

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [showPLMPlatform, setShowPLMPlatform] = useState<boolean>(false)
  const [showTrailingStopPlatform, setShowTrailingStopPlatform] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleDemoModal = () => {
    setOpenDemoModal(!openDemoModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  const togglePLMPlatform = () => {
    setShowPLMPlatform(!showPLMPlatform)
  }

  const toggleTrailingStopPlatform = () => {
    setShowTrailingStopPlatform(!showTrailingStopPlatform)
  }

  // If Trailing Stop platform is active, show it
  if (showTrailingStopPlatform) {
    return <TrailingStop />
  }

  // If Predictive Liquidity Mining platform is active, show it
  if (showPLMPlatform) {
    return <PredictiveLiquidityMining />
  }

  return (
    <div className="hero min-h-screen bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600">
      <div className="hero-content text-center rounded-xl p-8 max-w-2xl bg-white/90 backdrop-blur-sm mx-auto shadow-2xl">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to AlgoAS
          </h1>
          <p className="py-6 text-lg text-gray-600">
            Advanced Algorand Smart Contract Platform with AI-Powered Predictive Liquidity Mining
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Predictive Liquidity Mining Platform */}
            <div className="card bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
              <div className="card-body p-6">
                <h2 className="card-title text-xl">🔮 Predictive Liquidity Mining</h2>
                <p className="text-sm opacity-90">
                  AI-powered yield optimization with community-driven data insights and DAO governance
                </p>
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-white text-purple-600 hover:bg-purple-50"
                    onClick={togglePLMPlatform}
                  >
                    Launch Platform
                  </button>
                </div>
              </div>
            </div>

            {/* Trailing Stop-Loss Platform */}
            <div className="card bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xl">
              <div className="card-body p-6">
                <h2 className="card-title text-xl">🎯 Trailing Stop-Loss</h2>
                <p className="text-sm opacity-90">
                  Advanced trading orders with automated trailing stop-loss functionality
                </p>
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-white text-indigo-600 hover:bg-indigo-50"
                    onClick={toggleTrailingStopPlatform}
                  >
                    Launch Trading
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Wallet Connection */}
            <div className="card bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-xl">
              <div className="card-body p-6">
                <h2 className="card-title text-xl">💼 Wallet Connection</h2>
                <p className="text-sm opacity-90">
                  Connect your Algorand wallet to start using the platform
                </p>
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-white text-blue-600 hover:bg-blue-50"
                    onClick={toggleWalletModal}
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Demo */}
            {activeAddress && (
              <div className="card bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl">
                <div className="card-body p-6">
                  <h2 className="card-title text-xl">💸 Transaction Demo</h2>
                  <p className="text-sm opacity-90">
                    Test Algorand transactions and explore the platform capabilities
                  </p>
                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-white text-green-600 hover:bg-green-50"
                      onClick={toggleDemoModal}
                    >
                      Try Demo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Contract Interactions */}
            {activeAddress && (
              <div className="card bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl">
                <div className="card-body p-6">
                  <h2 className="card-title text-xl">📋 Smart Contracts</h2>
                  <p className="text-sm opacity-90">
                    Interact with deployed smart contracts and test functionality
                  </p>
                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-white text-orange-600 hover:bg-orange-50"
                      onClick={toggleAppCallsModal}
                    >
                      Contract Demo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="divider mt-8 mb-4"></div>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              data-test-id="getting-started"
              className="btn btn-outline btn-primary"
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/algorandfoundation/algokit-cli"
            >
              📚 AlgoKit Docs
            </a>
            <a
              className="btn btn-outline btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              href="https://developer.algorand.org/"
            >
              🏗️ Algorand Developer Portal
            </a>
          </div>

          {/* Platform Stats */}
          {activeAddress && (
            <div className="stats shadow mt-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="stat">
                <div className="stat-title text-gray-600">Total TVL</div>
                <div className="stat-value text-2xl text-gray-800">$424K</div>
                <div className="stat-desc text-green-600">↗︎ 12.5% (30d)</div>
              </div>
              <div className="stat">
                <div className="stat-title text-gray-600">Active Pools</div>
                <div className="stat-value text-2xl text-gray-800">47</div>
                <div className="stat-desc text-blue-600">3 new pools</div>
              </div>
              <div className="stat">
                <div className="stat-title text-gray-600">Trailing Orders</div>
                <div className="stat-value text-2xl text-gray-800">1,234</div>
                <div className="stat-desc text-indigo-600">$2.5M protected</div>
              </div>
              <div className="stat">
                <div className="stat-title text-gray-600">AI Accuracy</div>
                <div className="stat-value text-2xl text-gray-800">87.3%</div>
                <div className="stat-desc text-purple-600">ML powered</div>
              </div>
            </div>
          )}

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
          <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
