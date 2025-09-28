import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { TrailingStopLossFactory } from '../artifacts/trailing_stop_loss/TrailingStopLossClient'

// Deploy config for TrailingStopLoss with new App ID
export async function deploy() {
  console.log('=== Deploying TrailingStopLoss Contract ===')
  
  const algorand = AlgorandClient.fromEnvironment()
  const deployer = await algorand.account.fromEnvironment('DEPLOYER')

  console.log(`Deploying from account: ${deployer.addr}`)

  try {
    const appFactory = new TrailingStopLossFactory({
      algorand: algorand,
      defaultSender: deployer.addr
    })

    // Deploy the contract
    const { appClient } = await appFactory.deploy({
      onSchemaBreak: 'replace',
      onUpdate: 'replace'
    })

    const newAppId = appClient.appId.toString()
    
    console.log('✅ TrailingStopLoss Contract Deployed Successfully!')
    console.log('📋 New App ID:', newAppId)
    console.log('🌐 TestNet Explorer: https://testnet.algoexplorer.io/application/' + newAppId)
    console.log('🚀 Ready for frontend integration')

    return {
      appId: newAppId,
      appName: 'TrailingStopLoss',
      version: '1.0.0',
      status: 'deployed'
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error)
    throw error
  }
}
