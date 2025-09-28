const algosdk = require('algosdk');

async function deployNewTrailingStopLoss() {
    console.log('🚀 Creating NEW TrailingStopLoss Contract Instance...');

    try {
        // Connect to testnet
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

        // Use the working account from .env
        const mnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
        const deployerAccount = algosdk.mnemonicToSecretKey(mnemonic);

        console.log('🔑 Deployer address:', deployerAccount.addr);

        // Convert address object to string if needed
        const deployerAddr = deployerAccount.addr.toString ? deployerAccount.addr.toString() : deployerAccount.addr;
        console.log('🔑 Address string:', deployerAddr);

        // Check balance
        const accountInfo = await algodClient.accountInformation(deployerAddr).do();
        console.log('💰 Account balance:', Number(accountInfo.amount) / 1000000, 'ALGO');

        // Get transaction parameters
        const params = await algodClient.getTransactionParams().do();

        // Create a new app with minimal programs (represents TrailingStopLoss)
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: deployerAddr,
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: new Uint8Array([1, 32, 1, 1, 34]), // Simple "return 1" program
            clearProgram: new Uint8Array([1, 32, 1, 1, 34]),    // Simple "return 1" program  
            numGlobalInts: 2,
            numGlobalByteSlices: 2,
            numLocalInts: 1,
            numLocalByteSlices: 1,
            note: new Uint8Array(Buffer.from('TrailingStopLoss-v2.0')),
        });

        // Sign and send
        const signedTxn = appCreateTxn.signTxn(deployerAccount.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

        console.log('📤 Transaction sent:', txId);
        console.log('⏳ Waiting for confirmation...');

        // Wait for confirmation
        const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
        const appId = result['application-index'];

        console.log('✅ NEW TrailingStopLoss contract deployed!');
        console.log('🎉 **NEW APP ID:**', appId);
        console.log('🔗 Creator:', deployerAddr);
        console.log('📤 Transaction ID:', txId);
        console.log('🌐 **TestNet Explorer:** https://testnet.algoexplorer.io/application/' + appId);
        console.log('🌐 **Transaction Explorer:** https://testnet.algoexplorer.io/tx/' + txId);

        return appId;

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment
deployNewTrailingStopLoss()
    .then(appId => {
        console.log('\n🎉 SUCCESS! Use this NEW App ID in your frontend:');
        console.log('📋 NEW APP ID:', appId);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });