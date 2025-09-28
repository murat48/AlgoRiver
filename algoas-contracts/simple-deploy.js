const algosdk = require('algosdk');

async function simpleAppDeploy() {
    console.log('🚀 Creating New TrailingStopLoss Application...');

    // Connect to testnet
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

    // Use existing account
    const mnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
    const account = algosdk.mnemonicToSecretKey(mnemonic);

    console.log('🔑 Deployer:', account.addr);

    // Convert address object to string
    const senderAddress = algosdk.encodeAddress(account.addr.publicKey);
    console.log('🔍 Converted address:', senderAddress);
    console.log('🔍 Address type:', typeof senderAddress);

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

    // Create app transaction
    const txn = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: approvalProgram,
        clearProgram: clearProgram,
        numGlobalInts: 1,
        numGlobalByteSlices: 1,
        numLocalInts: 0,
        numLocalByteSlices: 0
    });

    // Sign and send
    const signedTxn = txn.signTxn(account.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    console.log('📤 Transaction:', txId);
    console.log('⏳ Confirming...');

    // Wait for confirmation
    const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
    const appId = result['application-index'];

    console.log('✅ SUCCESS! New App Created');
    console.log('📋 App ID:', appId);
    console.log('🔗 Creator:', senderAddress);
    console.log('📤 Tx ID:', txId);
    console.log('🌐 Explorer: https://testnet.algoexplorer.io/application/' + appId);

    return appId;
}

simpleAppDeploy()
    .then(appId => {
        console.log('\n🎉 New TrailingStopLoss App ID:', appId);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });