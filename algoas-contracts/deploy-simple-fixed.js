const algosdk = require('algosdk');

async function deploySimpleFixed() {
    console.log('🚀 Deploying Simple Fixed Contract...');

    try {
        // Connect to testnet
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

        // Use existing account
        const mnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
        const account = algosdk.mnemonicToSecretKey(mnemonic);

        console.log('🔑 Account:', account.addr);

        // Convert address object to string properly
        const senderAddress = account.addr;
        console.log('🔍 Sender address type:', typeof senderAddress);
        console.log('🔍 Sender address:', senderAddress);

        // Get account info to verify
        try {
            const accountInfo = await algodClient.accountInformation(senderAddress).do();
            console.log('💰 Balance:', Number(accountInfo.amount) / 1000000, 'ALGO');
        } catch (e) {
            console.log('❌ Account info error:', e.message);
        }

        // Get transaction params
        const params = await algodClient.getTransactionParams().do();

        // Simple TEAL programs
        const approvalTeal = `#pragma version 8
int 1
return`;

        const clearTeal = `#pragma version 8
int 1
return`;

        // Compile programs
        const approvalResult = await algodClient.compile(approvalTeal).do();
        const clearResult = await algodClient.compile(clearTeal).do();

        const approvalProgram = new Uint8Array(Buffer.from(approvalResult.result, 'base64'));
        const clearProgram = new Uint8Array(Buffer.from(clearResult.result, 'base64'));

        console.log('✅ Programs compiled');

        // Create app transaction
        const txn = algosdk.makeApplicationCreateTxnFromObject({
            from: senderAddress,
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: approvalProgram,
            clearProgram: clearProgram,
            numGlobalInts: 5,
            numGlobalByteSlices: 5,
            numLocalInts: 3,
            numLocalByteSlices: 3,
            note: new Uint8Array(Buffer.from('FixedPredictiveLiquidityMining'))
        });

        // Sign and send
        const signedTxn = txn.signTxn(account.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

        console.log('📤 Transaction:', txId);
        console.log('⏳ Confirming...');

        // Wait for confirmation
        const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
        const appId = result['application-index'];

        console.log('');
        console.log('🎉 ========== SUCCESS! ==========');
        console.log('✅ Fixed Contract Deployed!');
        console.log('📋 APP ID:', appId);
        console.log('🔗 Creator:', senderAddress);
        console.log('📤 Tx ID:', txId);
        console.log('🌐 Explorer: https://testnet.algoexplorer.io/application/' + appId);
        console.log('================================');

        return appId;

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

deploySimpleFixed()
    .then(appId => {
        console.log('\\n🎉 New Fixed Contract App ID:', appId);
        console.log('\\n📝 Update frontend with this App ID!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Deploy failed:', err.message);
        process.exit(1);
    });

