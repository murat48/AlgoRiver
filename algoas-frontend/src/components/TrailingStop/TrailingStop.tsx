import React, { useState, useEffect } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import trailingStopDataService from '../../services/trailingStopDataService.simple'
import { telegramBotService, TransactionData } from '../../services/telegramBotService'
import './TrailingStop.css'

interface FormData {
    assetId: string
    amount: string
    trailDistance: string
    trailDistanceType: 'percentage' | 'price'
    orderType: 'trailing' | 'bracket'
    targetPrice: string
    takeProfitPrice: string
}

const TrailingStop: React.FC = () => {
    const { activeAddress, wallets, transactionSigner } = useWallet()

    const [formData, setFormData] = useState<FormData>({
        assetId: '0',
        amount: '',
        trailDistance: '10',
        trailDistanceType: 'percentage',
        orderType: 'trailing',
        targetPrice: '',
        takeProfitPrice: ''
    })

    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [currentPrice, setCurrentPrice] = useState<number>(0)
    const [priceLoading, setPriceLoading] = useState<boolean>(true)
    const [userOrders, setUserOrders] = useState<any[]>([])
    const [platformStats, setPlatformStats] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'create' | 'orders' | 'stats'>('create')
    const [accountBalance, setAccountBalance] = useState<number>(0)
    const [isExecutionRunning, setIsExecutionRunning] = useState<boolean>(false)

    useEffect(() => {
        trailingStopDataService.startPriceTracking()

        const handlePriceUpdate = (price: number) => {
            setCurrentPrice(price)
            setPriceLoading(false)
            trailingStopDataService.updateOrderPrices()
        }

        const priceData = trailingStopDataService.getCurrentPrice()
        if (priceData > 0) {
            setCurrentPrice(priceData)
        }

        trailingStopDataService.onPriceUpdate(handlePriceUpdate)

        // Load user orders and platform stats
        const loadData = async () => {
            if (activeAddress) {
                const orders = await trailingStopDataService.getUserOrders(activeAddress)
                setUserOrders(orders)
                
                // Load account balance
                try {
                    const balance = await trailingStopDataService.getAccountBalance(activeAddress)
                    setAccountBalance(balance)
                } catch (error) {
                    console.error('Error loading account balance:', error)
                }
            }
            
            const stats = await trailingStopDataService.getPlatformStats()
            setPlatformStats(stats)
        }

        loadData()


        return () => {
            trailingStopDataService.stopPriceTracking()
        }
    }, [activeAddress])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const calculateStopPrice = (): string => {
        if (!currentPrice || !formData.amount) return '0.0000'

        if (formData.trailDistanceType === 'percentage') {
            const trailPercent = parseFloat(formData.trailDistance) / 100
            const stopPrice = currentPrice * (1 - trailPercent)
            return stopPrice.toFixed(4)
        } else {
            const trailAmount = parseFloat(formData.trailDistance)
            const targetPrice = parseFloat(formData.targetPrice)
            if (targetPrice > 0) {
                const stopPrice = targetPrice - trailAmount
                return stopPrice.toFixed(4)
            }
        }

        return '0.0000'
    }

    const sendTelegramNotification = async (data: TransactionData) => {
        try {
            await telegramBotService.sendTransactionNotification(data)
        } catch (error) {
            console.error('❌ Error sending Telegram notification:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!activeAddress) {
            setMessage('❌ Please connect your Pera Wallet first')
            return
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setMessage('❌ Please enter a valid amount')
            return
        }

        if (formData.trailDistanceType === 'price' && !formData.targetPrice) {
            setMessage('❌ Target price is required for price-based trailing')
            return
        }

        if (formData.orderType === 'bracket' && !formData.takeProfitPrice) {
            setMessage('❌ Take profit price is required for bracket orders')
            return
        }

        setIsLoading(true)
        setMessage('')

        try {
            console.log('🚀 Creating trailing stop order...')
            console.log('👤 User Address:', activeAddress)
            console.log('🔐 Transaction Signer available')

            const orderData = {
                assetId: formData.assetId,
                amount: formData.amount,
                trailDistance: formData.trailDistance,
                initialPrice: currentPrice.toString(),
                userAddress: activeAddress
            }

            const result = await trailingStopDataService.createOrder(orderData, transactionSigner)

            console.log('✅ Order created successfully:', result)
            if (result.success) {
                setMessage(`✅ Order created! ID: ${result.orderId}${result.txId ? `\nTransaction ID: ${result.txId}` : ''}`)
                
                // Send Telegram notification
                await sendTelegramNotification({
                    type: 'order_create',
                    userAddress: activeAddress,
                    amount: parseFloat(formData.amount),
                    orderId: result.orderId,
                    price: currentPrice,
                    status: 'success',
                    txId: result.txId,
                    timestamp: new Date().toISOString(),
                    message: `Trailing stop order created with ${formData.trailDistance}% trail`
                })
                
                // Refresh orders and switch to orders tab
                const orders = await trailingStopDataService.getUserOrders(activeAddress)
                setUserOrders(orders)
                setActiveTab('orders')
            } else {
                setMessage(`❌ ${result.message}`)
                
                // Send Telegram notification for failed order
                await sendTelegramNotification({
                    type: 'order_create',
                    userAddress: activeAddress,
                    amount: parseFloat(formData.amount),
                    price: currentPrice,
                    status: 'failed',
                    timestamp: new Date().toISOString(),
                    message: result.message
                })
            }

            setFormData({
                assetId: '0',
                amount: '',
                trailDistance: '10',
                trailDistanceType: 'percentage',
                orderType: 'trailing',
                targetPrice: '',
                takeProfitPrice: ''
            })

        } catch (error) {
            console.error('❌ Error creating order:', error)
            setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancelOrder = async (orderId: string) => {
        if (!activeAddress) {
            setMessage('❌ Please connect your wallet first')
            return
        }

        setIsLoading(true)
        setMessage('')

        try {

            const result = await trailingStopDataService.cancelOrder(orderId, activeAddress, transactionSigner)
            
            if (result.success) {
                setMessage(`✅ ${result.message}${result.txId ? `\nTransaction ID: ${result.txId}` : ''}`)
                
                // Send Telegram notification
                await sendTelegramNotification({
                    type: 'order_cancel',
                    userAddress: activeAddress,
                    orderId: orderId,
                    status: 'success',
                    txId: result.txId,
                    timestamp: new Date().toISOString(),
                    message: 'Order cancelled successfully'
                })
                
                // Refresh orders
                const orders = await trailingStopDataService.getUserOrders(activeAddress)
                setUserOrders(orders)
            } else {
                setMessage(`❌ ${result.message}`)
                
                // Send Telegram notification for failed cancellation
                await sendTelegramNotification({
                    type: 'order_cancel',
                    userAddress: activeAddress,
                    orderId: orderId,
                    status: 'failed',
                    timestamp: new Date().toISOString(),
                    message: result.message
                })
            }
        } catch (error) {
            console.error('Error cancelling order:', error)
            setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="trailing-stop">
            <nav className="tsl-nav">
                <div className="nav-tabs">
                    <button
                        className={`nav-tab ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <span className="tab-icon">🚀</span>
                        Create Order
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <span className="tab-icon">📋</span>
                        My Orders ({userOrders.length})
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        <span className="tab-icon">📊</span>
                        Platform Stats
                    </button>
                </div>
            </nav>

            <main className="tsl-content">
                <div className="form-container">
                    <h2 className="form-title">🎯 Trailing Stop Orders</h2>


                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: activeAddress ? '#d4edda' : '#f8d7da', borderRadius: '5px' }}>
                    {activeAddress ? (
                        <div>
                            <div>✅ Connected: {activeAddress.slice(0, 8)}...{activeAddress.slice(-8)}</div>
                            <div style={{ marginTop: '5px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div>
                                    <strong>Balance:</strong> {(accountBalance / 1000000).toFixed(4)} ALGO
                                    {accountBalance < 1000 && (
                                        <span style={{ color: '#dc3545', marginLeft: '10px' }}>
                                            ⚠️ Low balance! 
                                            <a 
                                                href="https://testnet.algoexplorer.io/dispenser" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ color: '#007bff', textDecoration: 'underline', marginLeft: '5px' }}
                                            >
                                                Get TestNet ALGO
                                            </a>
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={async () => {
                                        if (activeAddress) {
                                            console.log('🔄 Refreshing balance for:', activeAddress)
                                            try {
                                                const balance = await trailingStopDataService.getAccountBalance(activeAddress)
                                                console.log('🔄 Balance refreshed:', balance, 'microAlgos')
                                                console.log('🔄 Balance in ALGO:', balance / 1000000)
                                                setAccountBalance(balance)
                                            } catch (error) {
                                                console.error('❌ Error refreshing balance:', error)
                                            }
                                        } else {
                                            console.log('❌ No active address')
                                        }
                                    }}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                        </div>
                    ) : (
                        <span>❌ Please connect your wallet</span>
                    )}
                </div>

                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <strong>Current ALGO Price: </strong>
                        {priceLoading ? (
                            <span style={{ color: '#6c757d' }}>Loading...</span>
                        ) : currentPrice > 0 ? (
                            <span style={{ color: '#28a745' }}>${currentPrice.toFixed(4)}</span>
                        ) : (
                            <span style={{ color: '#dc3545' }}>Unable to fetch price</span>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setPriceLoading(true)
                            trailingStopDataService.startPriceTracking()
                        }}
                        style={{
                            padding: '5px 10px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Faucet Section */}
                {accountBalance < 5000 && activeAddress && (
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#721c24' }}>💰 Get TestNet ALGO - URGENT!</h4>
                        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
                            <p style={{ margin: '0', color: '#856404', fontSize: '14px', fontWeight: 'bold' }}>
                                ⚠️ Your wallet has 0 ALGO balance! You need at least 0.005 ALGO (5000 microAlgos) to create orders.
                            </p>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <h5 style={{ margin: '0 0 10px 0', color: '#721c24' }}>📋 Step-by-Step Instructions:</h5>
                            <ol style={{ margin: '0', paddingLeft: '20px', color: '#721c24', fontSize: '14px' }}>
                                <li>Click "📋 Copy Address" button below</li>
                                <li>Go to one of the faucet links</li>
                                <li>Paste your address in the faucet</li>
                                <li>Request ALGO (ask for at least 0.01 ALGO)</li>
                                <li>Wait for transaction confirmation</li>
                                <li>Click "🔄 Refresh Balance" to update</li>
                            </ol>
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                            <a 
                                href="https://testnet.algoexplorer.io/dispenser" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '5px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    border: '2px solid #0056b3'
                                }}
                            >
                                🚰 AlgoExplorer Faucet
                            </a>
                            <a 
                                href="https://bank.testnet.algorand.network/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '5px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    border: '2px solid #1e7e34'
                                }}
                            >
                                🏦 Algorand Bank Faucet
                            </a>
                            <button
                                onClick={() => {
                                    if (activeAddress) {
                                        navigator.clipboard.writeText(activeAddress)
                                        alert(`✅ Address copied to clipboard!\n\n${activeAddress}\n\nNow go to a faucet and paste this address.`)
                                    }
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                📋 Copy Address
                            </button>
                        </div>
                        
                        <div style={{ padding: '10px', backgroundColor: '#e9ecef', borderRadius: '5px', fontSize: '12px', color: '#495057' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Your Wallet Address:</div>
                            <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{activeAddress}</div>
                        </div>
                        
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                            <strong>Current Balance:</strong> {accountBalance} microAlgos ({(accountBalance / 1000000).toFixed(6)} ALGO)
                        </div>
                    </div>
                )}

                {/* Debug Section */}
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🔍 Debug Info</h4>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                        <div><strong>Active Address:</strong> {activeAddress || 'Not connected'}</div>
                        <div><strong>Raw Balance:</strong> {accountBalance} microAlgos</div>
                        <div><strong>Balance in ALGO:</strong> {(accountBalance / 1000000).toFixed(6)} ALGO</div>
                        <div><strong>Service Instance:</strong> {trailingStopDataService ? '✅ Initialized' : '❌ Not initialized'}</div>
                        <div><strong>Status:</strong> {accountBalance < 5000 ? '❌ Insufficient Balance' : '✅ Sufficient Balance'}</div>
                        <div><strong>Auto-Sell:</strong> {isExecutionRunning ? '🚀 Running (30s intervals)' : '🛑 Stopped'}</div>
                        <div><strong>Transaction Signer:</strong> {transactionSigner ? '✅ Available' : '❌ Missing'}</div>
                        <div><strong>Total Orders:</strong> {userOrders.length}</div>
                        <div><strong>Active Orders:</strong> {userOrders.filter(o => o.status === 'active').length}</div>
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={async () => {
                                console.log('🧪 Testing network connection...')
                                try {
                                    const result = await trailingStopDataService.testNetworkConnection()
                                    alert(result.message)
                                    console.log('🧪 Network test result:', result)
                                } catch (error) {
                                    console.error('❌ Network test error:', error)
                                    alert('❌ Network test failed: ' + error)
                                }
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🧪 Test Network
                        </button>
                        <button
                            onClick={() => {
                                if (isExecutionRunning) {
                                    trailingStopDataService.stopAutomaticExecution()
                                    setIsExecutionRunning(false)
                                    alert('🛑 Automatic execution stopped')
                                } else {
                                    trailingStopDataService.startAutomaticExecution()
                                    setIsExecutionRunning(true)
                                    alert('🚀 Automatic execution started! Orders will be monitored every 30 seconds.')
                                }
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: isExecutionRunning ? '#dc3545' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            {isExecutionRunning ? '🛑 Stop Auto-Sell' : '🚀 Start Auto-Sell'}
                        </button>
                        <button
                            onClick={() => {
                                const testPrice = prompt('Enter test price (e.g., 0.25):');
                                if (testPrice && !isNaN(parseFloat(testPrice))) {
                                    trailingStopDataService.setManualPrice(parseFloat(testPrice));
                                    alert(`🧪 Manual price set to $${testPrice}`);
                                } else {
                                    alert('❌ Invalid price. Please enter a valid number.');
                                }
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🧪 Set Test Price
                        </button>
                        <button
                            onClick={() => {
                                console.log('🧪 Simple test button clicked');
                                alert(`Debug Info:\nTotal Orders: ${userOrders.length}\nActive Orders: ${userOrders.filter(o => o.status === 'active').length}\nActive Address: ${activeAddress || 'Not connected'}`);
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#6f42c1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🧪 Debug Orders
                        </button>
                        <button
                            onClick={async () => {
                                if (activeAddress) {
                                    console.log('🧪 Testing multiple API sources...')
                                    const apis = [
                                        { name: 'Algonode', url: `https://testnet-api.algonode.cloud/v2/accounts/${activeAddress}` },
                                        { name: 'PureStake', url: `https://testnet-algorand.api.purestake.io/ps2/v2/accounts/${activeAddress}` },
                                        { name: 'AlgoExplorer', url: `https://testnet.algoexplorer.io/api/v2/accounts/${activeAddress}` }
                                    ]
                                    
                                    for (const api of apis) {
                                        try {
                                            console.log(`🧪 Testing ${api.name}...`)
                                            const response = await fetch(api.url)
                                            const data = await response.json()
                                            console.log(`📊 ${api.name} result:`, data)
                                            
                                            const balance = data.amount || data.account?.amount || 0
                                            if (balance > 0) {
                                                alert(`${api.name} Balance: ${(balance / 1000000).toFixed(6)} ALGO`)
                                                setAccountBalance(balance)
                                                return
                                            }
                                        } catch (error) {
                                            console.error(`❌ ${api.name} failed:`, error)
                                        }
                                    }
                                    alert('All APIs failed or returned 0 balance')
                                }
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#ffc107',
                                color: '#000',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🧪 Test All APIs
                        </button>
                        <button
                            onClick={async () => {
                                if (activeAddress) {
                                    try {
                                        const balance = await trailingStopDataService.getAccountBalance(activeAddress)
                                        setAccountBalance(balance)
                                        console.log('🔄 Balance refreshed:', balance)
                                    } catch (error) {
                                        console.error('❌ Error refreshing balance:', error)
                                    }
                                }
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🔄 Refresh Balance
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'create' && (
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Amount (ALGO):</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder="Enter amount"
                            step="0.0001"
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Trailing Type:</label>
                        <select
                            name="trailDistanceType"
                            value={formData.trailDistanceType}
                            onChange={handleInputChange}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        >
                            <option value="percentage">Percentage</option>
                            <option value="price">Price</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Trail Distance {formData.trailDistanceType === 'percentage' ? '(%)' : '($)'}:</label>
                        <input
                            type="number"
                            name="trailDistance"
                            value={formData.trailDistance}
                            onChange={handleInputChange}
                            step={formData.trailDistanceType === 'percentage' ? '0.1' : '0.0001'}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                            required
                        />
                    </div>

                    {formData.trailDistanceType === 'price' && (
                        <div style={{ marginBottom: '15px' }}>
                            <label>Target Price ($):</label>
                            <input
                                type="number"
                                name="targetPrice"
                                value={formData.targetPrice}
                                onChange={handleInputChange}
                                step="0.0001"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                        <label>Order Type:</label>
                        <select
                            name="orderType"
                            value={formData.orderType}
                            onChange={handleInputChange}
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        >
                            <option value="trailing">Simple Trailing Stop</option>
                            <option value="bracket">Bracket Order</option>
                        </select>
                    </div>

                    {formData.orderType === 'bracket' && (
                        <div style={{ marginBottom: '15px' }}>
                            <label>Take Profit Price ($):</label>
                            <input
                                type="number"
                                name="takeProfitPrice"
                                value={formData.takeProfitPrice}
                                onChange={handleInputChange}
                                step="0.0001"
                                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                        <h4>📋 Preview</h4>
                        <p>Amount: {formData.amount || '0'} ALGO</p>
                        <p>Stop Price: ${calculateStopPrice()}</p>
                        <p>Trail: {formData.trailDistance}{formData.trailDistanceType === 'percentage' ? '%' : '$'}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={!activeAddress || isLoading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: (activeAddress && !isLoading) ? '#007bff' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: (activeAddress && !isLoading) ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {isLoading ? '⏳ Creating...' : '🚀 Create Order'}
                    </button>
                </form>
                )}

                {activeTab === 'orders' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>📋 Your Orders</h3>
                            <button
                                onClick={() => {
                                    console.log('🧪 Test Order Execution button clicked');
                                    console.log('📊 Total orders:', userOrders.length);
                                    console.log('📋 All orders:', userOrders);
                                    
                                    const activeOrders = userOrders.filter(order => order.status === 'active');
                                    console.log('✅ Active orders:', activeOrders);
                                    
                                    if (activeOrders.length === 0) {
                                        alert(`❌ No active orders to test\n\nTotal orders: ${userOrders.length}\nOrder statuses: ${userOrders.map(o => o.status).join(', ')}`);
                                        return;
                                    }
                                    
                                    const orderId = prompt(`Enter order ID to test:\n\nActive orders:\n${activeOrders.map(o => `- ${o.id}`).join('\n')}`);
                                    if (!orderId) return;
                                    
                                    const testPrice = prompt('Enter test price (e.g., 0.25):');
                                    if (!testPrice || isNaN(parseFloat(testPrice))) {
                                        alert('❌ Invalid price');
                                        return;
                                    }
                                    
                                    const execute = confirm('Do you want to actually execute the order if triggered? (Otherwise just test)');
                                    
                                    trailingStopDataService.testOrderExecution(orderId, parseFloat(testPrice), execute)
                                        .then(result => {
                                            alert(result.message);
                                            // Refresh orders to show updated values
                                            trailingStopDataService.getUserOrders(activeAddress || '').then(setUserOrders);
                                        })
                                        .catch(error => {
                                            alert('❌ Test failed: ' + error.message);
                                        });
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#ffc107',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                🧪 Test Order Execution
                            </button>
                        </div>
                        {userOrders.length === 0 ? (
                            <p>No orders found. Create your first trailing stop order!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {userOrders.map((order) => (
                                    <div key={order.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong>Order ID:</strong> {order.id}<br/>
                                                <strong>Amount:</strong> {order.amount} ALGO<br/>
                                                <strong>Entry Price:</strong> ${order.entryPrice}<br/>
                                                <strong>Current Price:</strong> ${order.currentPrice}<br/>
                                                <strong>Stop Price:</strong> ${order.stopPrice}<br/>
                                                <strong>Trail:</strong> {order.trailDistance}%<br/>
                                                <strong>Status:</strong> <span style={{ 
                                                    color: order.status === 'active' ? 'green' : 
                                                           order.status === 'triggered' ? 'orange' : 'red'
                                                }}>{order.status.toUpperCase()}</span><br/>
                                                {order.txId && <><strong>TX ID:</strong> {order.txId}<br/></>}
                                            </div>
                                            {order.status === 'active' && (
                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    disabled={isLoading}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: isLoading ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div>
                        <h3>📊 Platform Statistics</h3>
                        <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {platformStats || 'Loading platform statistics...'}
                            </pre>
                        </div>
                    </div>
                )}


                {message && (
                    <div style={{
                        marginTop: '20px',
                        padding: '10px',
                        borderRadius: '5px',
                        backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da'
                    }}>
                        {message}
                    </div>
                )}
                </div>
            </main>
        </div>
    )
}

export default TrailingStop
