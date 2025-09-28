import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AIChatService, ChatMessage } from '../../services/aiChatService'
import './AIChat.css'

const AIChat: React.FC = () => {
    const { activeAddress } = useWallet()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [aiStatus, setAiStatus] = useState<{configured: boolean, provider: string}>({configured: false, provider: 'Fallback'})
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    // Initialize AI Chat Service
    const [aiChatService] = useState(() => {
        console.log('🚀 Creating AIChatService instance...')
        const service = new AIChatService()
        console.log('✅ AIChatService created')
        return service
    })

    const initializeChat = useCallback(async () => {
        if (activeAddress) {
            // Get user's portfolio and transaction data
            const userStakes = JSON.parse(localStorage.getItem('userStakes') || '[]')
            const userTransactions = JSON.parse(localStorage.getItem('userTransactions') || '[]')
            
            // Filter data for this user
            const userStakeTransactions = userStakes.filter((stake: any) => 
                stake.userAddress === activeAddress
            )
            
            const userTxTransactions = userTransactions.filter((tx: any) => 
                tx.userAddress === activeAddress
            )
            
            // Prepare portfolio data
            const portfolioData = {
                totalStaked: userStakeTransactions.reduce((sum: number, stake: any) => sum + (stake.amount || 0), 0),
                activeStakes: userStakeTransactions.filter((stake: any) => stake.status === 'active').length,
                stakeTransactions: userStakeTransactions,
                allTransactions: userTxTransactions,
                lastActivity: userTxTransactions.length > 0 ? userTxTransactions[userTxTransactions.length - 1] : null
            }
            
            aiChatService.initializeChat(activeAddress, portfolioData)
            setMessages(aiChatService.getChatHistory())
            setIsInitialized(true)
            
            // Get AI API status
            const status = aiChatService.getAIStatus()
            setAiStatus(status)
        }
    }, [activeAddress])

    // Initialize chat when wallet connects
    useEffect(() => {
        if (activeAddress && !isInitialized) {
            initializeChat()
        }
    }, [activeAddress, isInitialized, initializeChat])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const testAPIConnection = async () => {
        console.log('🧪 Testing Gemini API connection...')
        try {
            const success = await aiChatService.geminiApiService.testConnection()
            if (success) {
                alert('✅ Gemini API connection successful!')
            } else {
                alert('❌ Gemini API connection failed! Check console for details.')
            }
        } catch (error) {
            console.error('❌ Test connection error:', error)
            alert('❌ Gemini API connection failed! Check console for details.')
        }
    }

    const showWalletSummary = () => {
        const summary = aiChatService.getWalletSummary()
        const userMsg = aiChatService.addUserMessage('Show wallet summary')
        const aiMsg = aiChatService.addAIMessage(summary)
        setMessages(aiChatService.getChatHistory())
        scrollToBottom()
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return

        const userMessage = inputMessage.trim()
        setInputMessage('')
        setIsLoading(true)

        try {
            const aiResponse = await aiChatService.processMessage(userMessage)
            setMessages(aiChatService.getChatHistory())
        } catch (error) {
            console.error('Chat error:', error)
            // Add error message
            const errorMessage: ChatMessage = {
                id: `error_${Date.now()}`,
                type: 'ai',
                content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin. 🔄',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleClearChat = () => {
        aiChatService.clearChatHistory()
        setMessages([])
        setIsInitialized(false)
        if (activeAddress) {
            initializeChat()
        }
    }

    const formatMessage = (content: string) => {
        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
    }

    const renderMessage = (message: ChatMessage) => {
        const isUser = message.type === 'user'
        const time = message.timestamp.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })

        return (
            <div key={message.id} className={`message ${isUser ? 'user-message' : 'ai-message'}`}>
                <div className="message-content">
                    <div className="message-header">
                        <span className="message-sender">
                            {isUser ? '👤 Siz' : '🤖 AI Asistan'}
                        </span>
                        <span className="message-time">{time}</span>
                    </div>
                    <div 
                        className="message-text"
                        dangerouslySetInnerHTML={{ 
                            __html: formatMessage(message.content) 
                        }}
                    />
                </div>
            </div>
        )
    }

    const renderQuickActions = () => {
        const quickActions = [
            { text: 'What is Algorand?', icon: '🚀' },
            { text: 'How does staking work?', icon: '💰' },
            { text: 'What are DeFi protocols?', icon: '🏦' },
            { text: 'Portfolio analysis', icon: '📊' },
            { text: 'Market trend analysis', icon: '📈' },
            { text: 'Risk assessment', icon: '🎲' },
            { text: 'Investment recommendations', icon: '🎯' }
        ]

        return (
            <div className="quick-actions">
                <div className="quick-actions-title">Quick Questions:</div>
                <div className="quick-actions-buttons">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            className="quick-action-btn"
                            onClick={() => setInputMessage(action.text)}
                            disabled={isLoading}
                        >
                            <span className="action-icon">{action.icon}</span>
                            {action.text}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    if (!activeAddress) {
        return (
            <div className="ai-chat-container">
                <div className="chat-header">
                    <h2>🤖 AI Analysis Assistant</h2>
                    <p>Intelligent assistant analyzing your Algorand blockchain data</p>
                </div>
                <div className="no-wallet-message">
                    <div className="no-wallet-icon">🔗</div>
                    <h3>Cüzdan Bağlantısı Gerekli</h3>
                    <p>AI asistanını kullanmak için önce cüzdanınızı bağlamanız gerekiyor.</p>
                    <p>Lütfen sağ üst köşedeki "Connect Wallet" butonuna tıklayın.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="ai-chat-container">
            <div className="chat-header">
                <div className="header-content">
                    <h2>🤖 AI Analysis Assistant</h2>
                    <p>Intelligent assistant analyzing your Algorand blockchain data</p>
                    <div className="ai-status">
                        <span className={`status-indicator ${aiStatus.configured ? 'active' : 'inactive'}`}>
                            {aiStatus.configured ? '🟢' : '🟡'}
                        </span>
                        <span className="status-text">
                            {aiStatus.configured ? `AI Aktif: ${aiStatus.provider}` : `Fallback Mode: ${aiStatus.provider}`}
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="wallet-summary-btn"
                        onClick={showWalletSummary}
                        title="Show Wallet Summary"
                    >
                        🔗 Wallet Summary
                    </button>
                    <button 
                        className="clear-chat-btn"
                        onClick={testAPIConnection}
                        title="Test OpenAI API Connection"
                    >
                        🧪 Test API
                    </button>
                    <button 
                        className="clear-chat-btn"
                        onClick={handleClearChat}
                        title="Clear Chat"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <div className="welcome-icon">👋</div>
                        <h3>Welcome!</h3>
                        <p>Your AI assistant is ready. You can select one of the quick questions below or write your own question.</p>
                    </div>
                )}
                
                {messages.map(renderMessage)}
                
                {isLoading && (
                    <div className="message ai-message">
                        <div className="message-content">
                            <div className="message-header">
                                <span className="message-sender">🤖 AI Asistan</span>
                            </div>
                            <div className="message-text typing-indicator">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-text">Düşünüyor...</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {messages.length === 0 && renderQuickActions()}

            <div className="chat-input-container">
                <div className="input-wrapper">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask your AI assistant a question... (Press Enter to send)"
                        className="chat-input"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="send-button"
                    >
                        {isLoading ? '⏳' : '📤'}
                    </button>
                </div>
                <div className="input-footer">
                    <span className="input-hint">
                        💡 Portfolyo, piyasa, risk analizi ve yatırım önerileri için soru sorabilirsiniz
                    </span>
                </div>
            </div>
        </div>
    )
}

export default AIChat
