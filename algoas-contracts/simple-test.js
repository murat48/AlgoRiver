const algosdk = require('algosdk');

async function simpleContractTest() {
    console.log('🧪 Simple Contract Test...');
    
    try {
        // Connect to testnet
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

        // Test account
        const mnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
        const account = algosdk.mnemonicToSecretKey(mnemonic);

        console.log('🔑 Account:', algosdk.encodeAddress(account.addr.publicKey));

        // Get account balance  
        const addressString = algosdk.encodeAddress(account.addr.publicKey);
        const accountInfo = await algodClient.accountInformation(addressString).do();
        console.log('💰 Balance:', accountInfo.amount, 'microAlgos');

        // Simple TEAL program
        const approvalTeal = `#pragma version 8
txn ApplicationID
int 0
==
bnz create

int 1
return

create:
int 1
return`;

        const clearTeal = `#pragma version 8
int 1
return`;

        // Compile programs
        console.log('🔨 Compiling...');
        const approvalResult = await algodClient.compile(approvalTeal).do();
        const clearResult = await algodClient.compile(clearTeal).do();

        console.log('✅ Programs compiled');

        // Create transaction
        const params = await algodClient.getTransactionParams().do();
        
        const createTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: addressString,
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: new Uint8Array(Buffer.from(approvalResult.result, 'base64')),
            clearProgram: new Uint8Array(Buffer.from(clearResult.result, 'base64')),
            numGlobalInts: 0,
            numGlobalByteSlices: 0,
            numLocalInts: 0,
            numLocalByteSlices: 0
        });

        // Sign and send
        console.log('📝 Signing transaction...');
        const signedTxn = createTxn.signTxn(account.sk);
        const txId = createTxn.txID().toString();
        
        await algodClient.sendRawTransaction(signedTxn).do();
        console.log('📤 Sent:', txId);

        // Wait for confirmation
        console.log('⏳ Waiting for confirmation...');
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        const appId = confirmedTxn['application-index'];
        console.log('✅ SUCCESS! App ID:', appId);
        
        console.log('\n🎯 Your new contract is deployed!');
        console.log(`📱 App ID: ${appId}`);
        console.log('🔧 Update frontend CONTRACT_APP_ID with this value');
        
        return appId;

    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

simpleContractTest();
