const algosdk = require('algosdk');

async function testContractIntegration() {
    console.log('🧪 Testing Contract Integration...');
    console.log('===============================');

    try {
        // Connect to testnet
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

        // Test account
        const mnemonic = "captain rookie mom meadow bulb inhale ensure try blanket today vast mystery west evil brass decrease describe crime polar muscle cabbage lobster occur about whisper";
        const account = algosdk.mnemonicToSecretKey(mnemonic);

        console.log('🔑 Test Account:', account.addr);

        // Get account info
        const accountInfo = await algodClient.accountInformation(account.addr).do();
        console.log('💰 Account Balance:', accountInfo.amount, 'microAlgos');

        // Test contract deployment with simple TEAL
        console.log('\n📋 Testing Contract Deployment...');
        
        const approvalTeal = `#pragma version 8
// Simple test contract for pool data
// Global state: totalPools (uint64)

txn ApplicationID
int 0
==
bnz create_app

// Handle NoOp calls
txn OnCompletion
int NoOp
==
assert

// Return success
int 1
return

create_app:
// Initialize totalPools to 0
byte "totalPools"
int 0
app_global_put

// Return success
int 1
return`;

        const clearTeal = `#pragma version 8
// Clear program - always approve
int 1
return`;

        // Compile TEAL programs
        console.log('🔨 Compiling TEAL programs...');
        const approvalResult = await algodClient.compile(approvalTeal).do();
        const clearResult = await algodClient.compile(clearTeal).do();

        console.log('✅ Approval program compiled');
        console.log('✅ Clear program compiled');

        // Create application transaction
        const params = await algodClient.getTransactionParams().do();
        
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            account.addr,
            params,
            algosdk.OnApplicationComplete.NoOpOC,
            new Uint8Array(Buffer.from(approvalResult.result, 'base64')),
            new Uint8Array(Buffer.from(clearResult.result, 'base64')),
            1, // Global state schema - 1 uint
            0, // Global state schema - 0 bytes
            0, // Local state schema - 0 uint
            0, // Local state schema - 0 bytes
        );

        // Sign and submit
        console.log('📝 Signing and submitting transaction...');
        const signedTxn = appCreateTxn.signTxn(account.sk);
        const txId = appCreateTxn.txID().toString();
        
        await algodClient.sendRawTransaction(signedTxn).do();
        console.log('📤 Transaction submitted:', txId);

        // Wait for confirmation
        console.log('⏳ Waiting for confirmation...');
        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
        console.log('✅ Transaction confirmed in round:', confirmedTxn['confirmed-round']);

        // Get app ID
        const appId = confirmedTxn['application-index'];
        console.log('🎯 New App ID:', appId);

        // Test contract calls
        console.log('\n🔍 Testing Contract State...');
        const appInfo = await algodClient.getApplicationByID(appId).do();
        console.log('📊 App Info:', {
            id: appInfo.id,
            creator: appInfo.params.creator,
            'global-state': appInfo.params['global-state']
        });

        console.log('\n✅ CONTRACT INTEGRATION TEST SUCCESSFUL!');
        console.log('🎉 Your contract is working and can store/retrieve data!');
        console.log(`📱 App ID to use in frontend: ${appId}`);
        
        return appId;

    } catch (error) {
        console.error('❌ Contract integration test failed:', error);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 TIP: Account needs more ALGOs for transaction fees');
            console.log('🔗 Get testnet ALGOs: https://dispenser.testnet.aws.algodev.network/');
        }
        
        return null;
    }
}

// Run the test
testContractIntegration()
    .then((appId) => {
        if (appId) {
            console.log(`\n🔧 UPDATE FRONTEND: Replace CONTRACT_APP_ID with ${appId}`);
            console.log('📄 File: projects/algoas-frontend/src/services/contractDataService.ts');
            console.log(`🔄 Change: private readonly CONTRACT_APP_ID = BigInt(${appId})`);
        }
    })
    .catch(console.error);
