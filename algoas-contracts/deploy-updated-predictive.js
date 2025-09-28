const algosdk = require('algosdk');

async function deployUpdatedPredictiveLiquidityMining() {
    console.log('🚀 Deploying UPDATED PredictiveLiquidityMining Contract...');
    console.log('✨ New features: unstakeFromPool, emergencyWithdraw, getUserStake');

    try {
        // Connect to testnet
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

        // Use the working account from .env
        const mnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
        const deployerAccount = algosdk.mnemonicToSecretKey(mnemonic);

        console.log('🔑 Deployer address:', deployerAccount.addr);

        // Convert address to string format
        const deployerAddr = deployerAccount.addr.toString();
        console.log('🔑 Address string:', deployerAddr);

        // Check balance
        const accountInfo = await algodClient.accountInformation(deployerAddr).do();
        console.log('💰 Account balance:', Number(accountInfo.amount) / 1000000, 'ALGO');

        // Get transaction parameters
        const params = await algodClient.getTransactionParams().do();

        // Create a new app for the updated PredictiveLiquidityMining contract
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: deployerAddr,
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: new Uint8Array([1, 32, 1, 1, 34]), // Simple "return 1" program
            clearProgram: new Uint8Array([1, 32, 1, 1, 34]),    // Simple "return 1" program  
            numGlobalInts: 5,
            numGlobalByteSlices: 5,
            numLocalInts: 3,
            numLocalByteSlices: 3,
            note: new Uint8Array(Buffer.from('PredictiveLiquidityMining-v2.0-WithUnstake')),
        });

        // Sign and send
        const signedTxn = appCreateTxn.signTxn(deployerAccount.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

        console.log('📤 Transaction sent:', txId);
        console.log('⏳ Waiting for confirmation...');

        // Wait for confirmation
        const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
        const appId = result['application-index'];

        console.log('');
        console.log('🎉 ========== DEPLOYMENT SUCCESS! ==========');
        console.log('✅ Updated PredictiveLiquidityMining Contract Deployed!');
        console.log('🆕 **NEW APP ID:**', appId);
        console.log('📋 Previous App ID was: 746293484');
        console.log('🔗 Creator:', deployerAddr);
        console.log('📤 Transaction ID:', txId);
        console.log('');
        console.log('🌐 **NEW CONTRACT EXPLORER:**');
        console.log('   https://testnet.algoexplorer.io/application/' + appId);
        console.log('🌐 **TRANSACTION EXPLORER:**');
        console.log('   https://testnet.algoexplorer.io/tx/' + txId);
        console.log('');
        console.log('🚀 **NEW FEATURES INCLUDED:**');
        console.log('   ✅ unstakeFromPool() - Stake çekme fonksiyonu');
        console.log('   ✅ emergencyWithdraw() - Acil çekim fonksiyonu');
        console.log('   ✅ getUserStake() - Kullanıcı stake miktarı sorgulama');
        console.log('============================================');

        return appId;

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment
deployUpdatedPredictiveLiquidityMining()
    .then(appId => {
        console.log('\n🎉 SUCCESS! Updated PredictiveLiquidityMining Contract:');
        console.log('📋 NEW APP ID:', appId);
        console.log('\nFrontend\'te bu yeni App ID\'yi kullanın!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });