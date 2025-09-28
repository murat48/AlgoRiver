import React, { useState, useEffect } from 'react'
import { DataIntegrationService, EnhancedPoolData } from '../../services/dataIntegration'

interface UserStats {
    totalStaked: number
    activeRewards: number
    riskScore: number
    dataContributions: number
    votingPower: number
}

interface DataDonorDAOProps {
    userStats: UserStats | null
}

interface Proposal {
    id: string
    title: string
    description: string
    type: 'Parameter Change' | 'New Pool' | 'Fee Adjustment' | 'Data Validation'
    proposer: string
    votesFor: number
    votesAgainst: number
    totalVotes: number
    deadline: string
    status: 'Active' | 'Passed' | 'Failed' | 'Executed'
    requiredVotes: number
}

interface DataContribution {
    id: string
    type: 'Price Data' | 'Volume Data' | 'Liquidity Data' | 'Market Sentiment' | 'Technical Indicators'
    pool: string
    contributor: string
    timestamp: string
    status: 'Pending' | 'Verified' | 'Rejected'
    reward: number
    votes: number
}

const DataDonorDAO: React.FC<DataDonorDAOProps> = ({ userStats }) => {
    const [activeTab, setActiveTab] = useState<'governance' | 'contribute' | 'validate' | 'rewards'>('governance')
    const [selectedProposal, setSelectedProposal] = useState<string | null>(null)
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [contributions, setContributions] = useState<DataContribution[]>([])
    const [dataService] = useState(() => new DataIntegrationService())
    const [newProposal, setNewProposal] = useState({
        title: '',
        description: '',
        type: 'Parameter Change' as Proposal['type']
    })
    const [dataSubmission, setDataSubmission] = useState({
        type: 'Price Data' as DataContribution['type'],
        pool: '',
        data: '',
        source: ''
    })
    const [availablePools, setAvailablePools] = useState<string[]>([])

    useEffect(() => {
        loadAvailablePools()
        generateGovernanceData()
        generateContributionData()
    }, [])

    const loadAvailablePools = async () => {
        try {
            const pools = await dataService.getEnhancedPools()
            const poolNames = pools.map(pool => pool.name)
            setAvailablePools(poolNames)

            // Set default pool for data submission if available
            if (poolNames.length > 0 && !dataSubmission.pool) {
                setDataSubmission(prev => ({ ...prev, pool: poolNames[0] }))
            }
        } catch (error) {
            console.error('Error loading pools:', error)
            // Fallback to generic pool names
            setAvailablePools(['Pool-1', 'Pool-2', 'Pool-3'])
        }
    }

    const generateGovernanceData = () => {
        // Generate realistic proposals based on current platform state
        const currentDate = new Date()
        const proposalTypes: Proposal['type'][] = ['Parameter Change', 'New Pool', 'Fee Adjustment', 'Data Validation']

        const generatedProposals: Proposal[] = [
            {
                id: 'prop-1',
                title: 'Increase AI Model Update Frequency',
                description: 'Propose to increase AI model updates from daily to every 6 hours to improve prediction accuracy during high volatility periods. This will require additional computational resources but should significantly improve prediction quality.',
                type: 'Parameter Change',
                proposer: `${Math.random().toString(36).substr(2, 8)}...`,
                votesFor: Math.floor(Math.random() * 15000) + 10000,
                votesAgainst: Math.floor(Math.random() * 5000) + 1000,
                totalVotes: 0,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'Active',
                requiredVotes: 20000
            },
            {
                id: 'prop-2',
                title: 'Add Cross-Chain Liquidity Pools',
                description: 'Expand the platform to include Ethereum and Polygon liquidity pools, starting with major stablecoin pairs. This would increase yield opportunities and platform TVL.',
                type: 'New Pool',
                proposer: `${Math.random().toString(36).substr(2, 8)}...`,
                votesFor: Math.floor(Math.random() * 25000) + 15000,
                votesAgainst: Math.floor(Math.random() * 8000) + 2000,
                totalVotes: 0,
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: Math.random() > 0.5 ? 'Active' : 'Passed',
                requiredVotes: 25000
            },
            {
                id: 'prop-3',
                title: 'Implement Dynamic Fee Structure',
                description: 'Introduce variable platform fees based on pool performance and risk levels. High-performing, low-risk pools would have lower fees to incentivize safer investments.',
                type: 'Fee Adjustment',
                proposer: `${Math.random().toString(36).substr(2, 8)}...`,
                votesFor: Math.floor(Math.random() * 12000) + 8000,
                votesAgainst: Math.floor(Math.random() * 18000) + 10000,
                totalVotes: 0,
                deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'Failed',
                requiredVotes: 20000
            }
        ]

        // Calculate total votes for each proposal
        generatedProposals.forEach(proposal => {
            proposal.totalVotes = proposal.votesFor + proposal.votesAgainst
        })

        setProposals(generatedProposals)
    }

    const generateContributionData = () => {
        const contributionTypes: DataContribution['type'][] = [
            'Price Data', 'Volume Data', 'Liquidity Data', 'Market Sentiment', 'Technical Indicators'
        ]

        const generatedContributions: DataContribution[] = []

        for (let i = 0; i < 8; i++) {
            const type = contributionTypes[Math.floor(Math.random() * contributionTypes.length)]
            const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)

            generatedContributions.push({
                id: `contrib-${i + 1}`,
                type,
                pool: availablePools.length > 0 ? availablePools[Math.floor(Math.random() * availablePools.length)] : `Pool-${i + 1}`,
                contributor: `${Math.random().toString(36).substr(2, 8)}...`,
                timestamp: timestamp.toISOString(),
                status: Math.random() > 0.7 ? 'Verified' : Math.random() > 0.3 ? 'Pending' : 'Rejected',
                reward: Math.floor(Math.random() * 100) + 20,
                votes: Math.floor(Math.random() * 50) + 5
            })
        }

        setContributions(generatedContributions.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ))
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return '#3b82f6'
            case 'Passed': return '#10b981'
            case 'Failed': return '#ef4444'
            case 'Executed': return '#8b5cf6'
            case 'Verified': return '#10b981'
            case 'Pending': return '#f59e0b'
            case 'Rejected': return '#ef4444'
            default: return '#6b7280'
        }
    }

    const getVotePercentage = (votesFor: number, totalVotes: number) => {
        return totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0
    }

    const renderGovernance = () => {
        return (
            <div className="governance-section">
                <div className="governance-header">
                    <h3>DAO Governance</h3>
                    <div className="voting-power-display">
                        <span>Your Voting Power: </span>
                        <strong>{userStats?.votingPower.toLocaleString() || 0}</strong>
                    </div>
                </div>

                <div className="create-proposal-form">
                    <h4>Create New Proposal</h4>
                    <div className="form-grid">
                        <input
                            type="text"
                            placeholder="Proposal Title"
                            value={newProposal.title}
                            onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                        />
                        <select
                            value={newProposal.type}
                            onChange={(e) => setNewProposal({ ...newProposal, type: e.target.value as Proposal['type'] })}
                        >
                            <option value="Parameter Change">Parameter Change</option>
                            <option value="New Pool">New Pool</option>
                            <option value="Fee Adjustment">Fee Adjustment</option>
                            <option value="Data Validation">Data Validation</option>
                        </select>
                        <textarea
                            placeholder="Detailed Description"
                            value={newProposal.description}
                            onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                            rows={3}
                        />
                        <button className="create-proposal-btn">
                            Create Proposal (Cost: 1000 Voting Power)
                        </button>
                    </div>
                </div>

                <div className="proposals-list">
                    <h4>Active Proposals</h4>
                    {proposals.map((proposal: any) => (
                        <div key={proposal.id} className="proposal-card">
                            <div className="proposal-header">
                                <div className="proposal-info">
                                    <h5>{proposal.title}</h5>
                                    <div className="proposal-meta">
                                        <span className="proposal-type">{proposal.type}</span>
                                        <span className="proposal-proposer">by {proposal.proposer}</span>
                                        <span
                                            className="proposal-status"
                                            style={{ color: getStatusColor(proposal.status) }}
                                        >
                                            {proposal.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="proposal-deadline">
                                    <span>Deadline: {proposal.deadline}</span>
                                </div>
                            </div>

                            <p className="proposal-description">{proposal.description}</p>

                            <div className="voting-section">
                                <div className="vote-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill for"
                                            style={{ width: `${getVotePercentage(proposal.votesFor, proposal.totalVotes)}%` }}
                                        ></div>
                                    </div>
                                    <div className="vote-stats">
                                        <span className="votes-for">👍 {proposal.votesFor.toLocaleString()}</span>
                                        <span className="votes-against">👎 {proposal.votesAgainst.toLocaleString()}</span>
                                        <span className="total-votes">
                                            {proposal.totalVotes.toLocaleString()} / {proposal.requiredVotes.toLocaleString()} required
                                        </span>
                                    </div>
                                </div>

                                {proposal.status === 'Active' && (
                                    <div className="vote-buttons">
                                        <button className="vote-btn for">Vote For</button>
                                        <button className="vote-btn against">Vote Against</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderContribute = () => {
        return (
            <div className="contribute-section">
                <div className="contribute-header">
                    <h3>Contribute Data</h3>
                    <p>Help improve AI predictions by contributing valuable market data</p>
                </div>

                <div className="contribution-form">
                    <h4>Submit New Data</h4>
                    <div className="form-grid">
                        <select
                            value={dataSubmission.type}
                            onChange={(e) => setDataSubmission({ ...dataSubmission, type: e.target.value as DataContribution['type'] })}
                        >
                            <option value="Price Data">Price Data</option>
                            <option value="Volume Data">Volume Data</option>
                            <option value="Liquidity Data">Liquidity Data</option>
                            <option value="Market Sentiment">Market Sentiment</option>
                            <option value="Technical Indicators">Technical Indicators</option>
                        </select>
                        <select
                            value={dataSubmission.pool}
                            onChange={(e) => setDataSubmission({ ...dataSubmission, pool: e.target.value })}
                        >
                            <option value="">Select Pool</option>
                            {availablePools.map(pool => (
                                <option key={pool} value={pool}>{pool}</option>
                            ))}
                            <option value="Platform Wide">Platform Wide</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Data Source/API"
                            value={dataSubmission.source}
                            onChange={(e) => setDataSubmission({ ...dataSubmission, source: e.target.value })}
                        />
                        <textarea
                            placeholder="Data payload (JSON format)"
                            value={dataSubmission.data}
                            onChange={(e) => setDataSubmission({ ...dataSubmission, data: e.target.value })}
                            rows={4}
                        />
                        <button className="submit-data-btn">
                            Submit Data (Earn up to 25 tokens)
                        </button>
                    </div>
                </div>

                <div className="data-rewards-info">
                    <h4>Data Contribution Rewards</h4>
                    <div className="rewards-grid">
                        <div className="reward-item">
                            <span className="data-type">Price Data</span>
                            <span className="reward-amount">10-15 tokens</span>
                        </div>
                        <div className="reward-item">
                            <span className="data-type">Volume Data</span>
                            <span className="reward-amount">15-20 tokens</span>
                        </div>
                        <div className="reward-item">
                            <span className="data-type">Liquidity Data</span>
                            <span className="reward-amount">20-25 tokens</span>
                        </div>
                        <div className="reward-item">
                            <span className="data-type">Market Sentiment</span>
                            <span className="reward-amount">5-10 tokens</span>
                        </div>
                        <div className="reward-item">
                            <span className="data-type">Technical Indicators</span>
                            <span className="reward-amount">12-18 tokens</span>
                        </div>
                    </div>
                </div>

                <div className="contribution-guidelines">
                    <h4>Contribution Guidelines</h4>
                    <ul>
                        <li>Data must be from reliable and verifiable sources</li>
                        <li>Submissions are reviewed by community validators</li>
                        <li>High-quality data earns maximum rewards and voting power</li>
                        <li>Duplicate or low-quality submissions may be rejected</li>
                        <li>Consistent contributors gain increased reputation and rewards</li>
                    </ul>
                </div>
            </div>
        )
    }

    const renderValidate = () => {
        return (
            <div className="validate-section">
                <div className="validate-header">
                    <h3>Validate Data Contributions</h3>
                    <p>Help maintain data quality by validating community contributions</p>
                </div>

                <div className="validation-rewards">
                    <div className="validation-stat">
                        <span>Your Validation Rewards:</span>
                        <strong>45.50 tokens</strong>
                    </div>
                    <div className="validation-stat">
                        <span>Validations This Month:</span>
                        <strong>23</strong>
                    </div>
                    <div className="validation-stat">
                        <span>Validation Accuracy:</span>
                        <strong>{(85 + Math.random() * 12).toFixed(1)}%</strong>
                    </div>
                </div>

                <div className="pending-validations">
                    <h4>Pending Validations</h4>
                    {contributions
                        .filter((contrib: any) => contrib.status === 'Pending')
                        .map((contribution: any) => (
                            <div key={contribution.id} className="validation-card">
                                <div className="validation-header">
                                    <div className="contrib-info">
                                        <h5>{contribution.type}</h5>
                                        <span>Pool: {contribution.pool}</span>
                                        <span>By: {contribution.contributor}</span>
                                    </div>
                                    <div className="contrib-meta">
                                        <span>Submitted: {contribution.timestamp}</span>
                                        <span>Potential Reward: {contribution.reward} tokens</span>
                                    </div>
                                </div>

                                <div className="validation-data">
                                    <h6>Data Preview:</h6>
                                    <pre className="data-preview">
                                        {JSON.stringify({
                                            timestamp: new Date().toISOString(),
                                            price: (Math.random() * 2).toFixed(3),
                                            volume: Math.floor(Math.random() * 500000) + 50000,
                                            source: 'Real Market API'
                                        }, null, 2)}
                                    </pre>
                                </div>

                                <div className="validation-actions">
                                    <button className="validate-btn approve">
                                        ✓ Approve (Earn 2 tokens)
                                    </button>
                                    <button className="validate-btn reject">
                                        ✗ Reject (Earn 1 token)
                                    </button>
                                    <button className="validate-btn skip">
                                        Skip
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        )
    }

    const renderRewards = () => {
        const daoRewards = {
            dataContributions: 180.50,
            validations: 45.50,
            governance: 25.00,
            total: 251.00
        }

        return (
            <div className="dao-rewards-section">
                <div className="rewards-summary">
                    <h3>DAO Rewards Summary</h3>
                    <div className="rewards-breakdown">
                        <div className="reward-category">
                            <h4>Data Contributions</h4>
                            <p className="reward-amount">${daoRewards.dataContributions}</p>
                            <span>{userStats?.dataContributions || 0} contributions</span>
                        </div>
                        <div className="reward-category">
                            <h4>Validations</h4>
                            <p className="reward-amount">${daoRewards.validations}</p>
                            <span>23 validations</span>
                        </div>
                        <div className="reward-category">
                            <h4>Governance</h4>
                            <p className="reward-amount">${daoRewards.governance}</p>
                            <span>12 votes cast</span>
                        </div>
                        <div className="reward-category total">
                            <h4>Total DAO Rewards</h4>
                            <p className="reward-amount">${daoRewards.total}</p>
                            <button className="claim-dao-rewards-btn">Claim All</button>
                        </div>
                    </div>
                </div>

                <div className="reputation-score">
                    <h4>Reputation & Benefits</h4>
                    <div className="reputation-metrics">
                        <div className="reputation-item">
                            <span>Reputation Score:</span>
                            <strong>{Math.floor(400 + Math.random() * 200)} / 1000</strong>
                            <div className="reputation-bar">
                                <div className="reputation-fill" style={{ width: `${40 + Math.random() * 20}%` }}></div>
                            </div>
                        </div>
                        <div className="benefits-list">
                            <h5>Current Benefits:</h5>
                            <ul>
                                <li>✓ Standard data contribution rewards</li>
                                <li>✓ Validation privileges</li>
                                <li>✓ Governance voting rights</li>
                                <li>⚪ Premium validator status (need 750 reputation)</li>
                                <li>⚪ Proposal creation without cost (need 800 reputation)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="data-donor-dao">
            <div className="dao-header">
                <h2>Data-Donor DAO</h2>
                <p>Decentralized governance and community-powered data ecosystem</p>
            </div>

            <div className="dao-tabs">
                {[
                    { key: 'governance', label: 'Governance', icon: '🗳️' },
                    { key: 'contribute', label: 'Contribute Data', icon: '📊' },
                    { key: 'validate', label: 'Validate Data', icon: '✅' },
                    { key: 'rewards', label: 'DAO Rewards', icon: '🎁' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`dao-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key as any)}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="dao-content">
                {activeTab === 'governance' && renderGovernance()}
                {activeTab === 'contribute' && renderContribute()}
                {activeTab === 'validate' && renderValidate()}
                {activeTab === 'rewards' && renderRewards()}
            </div>
        </div>
    )
}

export default DataDonorDAO