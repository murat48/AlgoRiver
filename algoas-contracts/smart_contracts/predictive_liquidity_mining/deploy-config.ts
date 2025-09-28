import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { RealPredictiveLiquidityMiningFactory } from '../artifacts/predictive_liquidity_mining/RealPredictiveLiquidityMiningClient'

// Deployment configuration for Predictive Liquidity Mining Platform v4.0 DYNAMIC with Transaction Viewing
export async function deploy() {
  console.log('=== Deploying PredictiveLiquidityMining v4.0 DYNAMIC (NEW CONTRACT with Dynamic Transaction Functions) ===')

  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  console.log(`Deploying from account: ${deployer.addr}`)

  try {
    const appFactory = new RealPredictiveLiquidityMiningFactory({
      algorand: algorand,
      defaultSender: deployer.addr
    })

    // Deploy the new V3 contract with transaction functions
    const { appClient } = await appFactory.deploy({
      deployTimeParams: {},
      onUpdate: 'fail'  // Fail if exists - we want a NEW contract with NEW App ID
    })

    const appId = await appClient.appId
    console.log(`✅ PredictiveLiquidityMining v2.0 contract deployed successfully!`)
    console.log(`🆕 NEW APP ID: ${appId}`)
    console.log(`� Previous App ID was: 746293484`)
    console.log(`�🔗 Creator: ${deployer.addr}`)
    console.log(``)
    console.log(`🚀 NEW FEATURES ADDED:`)
    console.log(`   ✅ unstakeFromPool() - Stake withdrawal function`)
    console.log(`   ✅ emergencyWithdraw() - Emergency withdrawal with penalties`)
    console.log(`   ✅ getUserStake() - Query user's staked amount`)
    console.log(``)

    // Contract deployed successfully - ready for testing
    console.log('✅ Contract ready for use!')

    return { deployer, algorand, appId }

  } catch (error) {
    console.error('❌ Deployment failed:', error)
    throw error
  }
}