const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

async function deployRealPredictiveLiquidityMining() {
    console.log('🚀 Deploying REAL PredictiveLiquidityMining Contract...');
    console.log('✨ Fixed contract with proper Algorand TypeScript types');

    try {
        // Connect to testnet
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

        // Use the working account
        const mnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
        const deployerAccount = algosdk.mnemonicToSecretKey(mnemonic);

        console.log('🔑 Deployer address:', deployerAccount.addr);

        // Convert address to string format
        const deployerAddr = algosdk.encodeAddress(deployerAccount.addr.publicKey);
        console.log('🔑 Address string:', deployerAddr);

        // Check balance
        const accountInfo = await algodClient.accountInformation(deployerAddr).do();
        console.log('💰 Account balance:', Number(accountInfo.amount) / 1000000, 'ALGO');

        // Get transaction parameters
        const params = await algodClient.getTransactionParams().do();

        // Read the compiled TEAL files
        const artifactsPath = path.join(__dirname, 'smart_contracts', 'artifacts', 'predictive_liquidity_mining');
        
        // Read approval program
        const approvalTealPath = path.join(artifactsPath, 'PredictiveLiquidityMining.approval.teal');
        const approvalTeal = fs.readFileSync(approvalTealPath, 'utf8');
        
        // Read clear program
        const clearTealPath = path.join(artifactsPath, 'PredictiveLiquidityMining.clear.teal');
        const clearTeal = fs.readFileSync(clearTealPath, 'utf8');

        console.log('📄 Reading TEAL files...');
        console.log('   Approval program length:', approvalTeal.length, 'characters');
        console.log('   Clear program length:', clearTeal.length, 'characters');

        // Compile programs
        const approvalResult = await algodClient.compile(approvalTeal).do();
        const clearResult = await algodClient.compile(clearTeal).do();

        const approvalProgram = new Uint8Array(Buffer.from(approvalResult.result, 'base64'));
        const clearProgram = new Uint8Array(Buffer.from(clearResult.result, 'base64'));

        console.log('✅ TEAL programs compiled successfully');

        // Create application transaction
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: deployerAddr,
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: approvalProgram,
            clearProgram: clearProgram,
            numGlobalInts: 10,  // totalPools, totalStaked, platformFee, emergencyPaused, totalTransactionCount, totalVolume, dailyTransactionCount, dailyVolume, lastResetTime
            numGlobalByteSlices: 0,
            numLocalInts: 3,     // userStakedAmount, userRewardDebt, lastStakeTime
            numLocalByteSlices: 0,
            note: new Uint8Array(Buffer.from('RealPredictiveLiquidityMining-Fixed')),
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
        console.log('✅ Real PredictiveLiquidityMining Contract Deployed!');
        console.log('🆕 **NEW APP ID:**', appId);
        console.log('🔗 Creator:', deployerAddr);
        console.log('📤 Transaction ID:', txId);
        console.log('');
        console.log('🌐 **CONTRACT EXPLORER:**');
        console.log('   https://testnet.algoexplorer.io/application/' + appId);
        console.log('🌐 **TRANSACTION EXPLORER:**');
        console.log('   https://testnet.algoexplorer.io/tx/' + txId);
        console.log('');
        console.log('🚀 **CONTRACT FEATURES:**');
        console.log('   ✅ createPool() - Havuz oluşturma');
        console.log('   ✅ stakeInPool() - Stake işlemi');
        console.log('   ✅ unstakeFromPool() - Stake çekme');
        console.log('   ✅ getPoolData() - Havuz verilerini okuma');
        console.log('   ✅ getUserStake() - Kullanıcı stake miktarı');
        console.log('   ✅ getPlatformStats() - Platform istatistikleri');
        console.log('   ✅ emergencyPause() - Acil durum durdurma');
        console.log('   ✅ unpause() - Platform yeniden başlatma');
        console.log('   ✅ updatePoolAPY() - APY güncelleme');
        console.log('   ✅ optIn() - Kullanıcı kayıt');
        console.log('   ✅ Transaction tracking ve analytics');
        console.log('============================================');

        return appId;

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment
deployRealPredictiveLiquidityMining()
    .then(appId => {
        console.log('\n🎉 SUCCESS! Real PredictiveLiquidityMining Contract:');
        console.log('📋 NEW APP ID:', appId);
        console.log('\nFrontend\'te bu yeni App ID\'yi kullanın!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });
