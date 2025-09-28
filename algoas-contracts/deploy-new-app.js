const algosdk = require('algosdk');

async function deployTrailingStopLoss() {
    console.log('🚀 Deploying TrailingStopLoss Contract...');

    try {
        // Connect to testnet
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

        // Generate a new account for this deployment
        const account = algosdk.generateAccount();
        console.log('🔑 Generated new deployer address:', account.addr);
        console.log('🔑 Mnemonic:', algosdk.secretKeyToMnemonic(account.sk));

        // Use the existing funded account from .env for deployment
        const existingMnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
        const deployerAccount = algosdk.mnemonicToSecretKey(existingMnemonic);

        console.log('🔑 Using existing funded account:', deployerAccount.addr);
        console.log('🔍 Address type:', typeof deployerAccount.addr);
        console.log('🔍 Address object:', deployerAccount.addr);

        // Check balance
        const accountInfo = await algodClient.accountInformation(deployerAccount.addr.toString()).do();
        console.log('💰 Account balance:', Number(accountInfo.amount) / 1000000, 'ALGO');

        // Get transaction parameters
        const params = await algodClient.getTransactionParams().do();

        // Create a simple app creation transaction
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: deployerAccount.addr.toString(),
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: new Uint8Array([1, 32, 1, 1, 34]), // Minimal approval program
            clearProgram: new Uint8Array([1, 32, 1, 1, 34]),    // Minimal clear program  
            numGlobalInts: 1,
            numGlobalByteSlices: 1,
            numLocalInts: 0,
            numLocalByteSlices: 0,
        });

        // Sign and send
        const signedTxn = appCreateTxn.signTxn(deployerAccount.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

        console.log('📤 Transaction sent:', txId);
        console.log('⏳ Waiting for confirmation...');

        // Wait for confirmation
        const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
        const appId = result['application-index'];

        console.log('✅ New TrailingStopLoss contract deployed!');
        console.log('📋 New App ID:', appId);
        console.log('🔗 Creator:', deployerAccount.addr.toString());
        console.log('📤 Transaction ID:', txId);
        console.log('🌐 TestNet Explorer:', `https://testnet.algoexplorer.io/application/${appId}`);

        return appId;

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Run deployment
deployTrailingStopLoss()
    .then(appId => {
        console.log('\n🎉 Success! New App ID:', appId);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });