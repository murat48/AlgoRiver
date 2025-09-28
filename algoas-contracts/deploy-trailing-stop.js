const { AlgorandClient } = require('@algorandfoundation/algokit-utils');
const { readFileSync } = require('fs');
const { generateAccount, waitForConfirmation } = require('algosdk');

async function deployContract() {
    console.log('=== Deploying New TrailingStopLoss Contract ===');

    try {
        // Create Algorand client for testnet
        const algodToken = '';
        const algodServer = 'https://testnet-api.algonode.cloud';
        const algodPort = 443;

        const algosdk = require('algosdk');
        const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

        // Generate a new account for deployment
        const account = generateAccount();
        console.log('🔑 Generated deployer address:', account.addr);
        console.log('🔑 Mnemonic (save this):', algosdk.secretKeyToMnemonic(account.sk));

        // You need to fund this account manually with testnet ALGOs
        console.log('⚠️  Please fund this account with testnet ALGOs from: https://testnet.algoexplorer.io/dispenser');
        console.log('⚠️  Then press Enter to continue...');

        // Wait for user to fund the account
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });

        // Check account balance
        const accountInfo = await algodClient.accountInformation(account.addr).do();
        const balance = Number(accountInfo.amount);
        console.log('💰 Account balance:', balance / 1000000, 'ALGO');

        if (balance < 1000000) {
            throw new Error('Insufficient balance. Please fund the account with at least 1 ALGO.');
        }

        // Read compiled contract files
        const approvalProgram = readFileSync('./smart_contracts/artifacts/trailing_stop_loss/TrailingStopLoss.approval.teal', 'utf8');
        const clearProgram = readFileSync('./smart_contracts/artifacts/trailing_stop_loss/TrailingStopLoss.clear.teal', 'utf8');

        // Compile programs
        const compiledApproval = await algodClient.compile(approvalProgram).do();
        const compiledClear = await algodClient.compile(clearProgram).do();

        // Create application transaction
        const params = await algodClient.getTransactionParams().do();

        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: account.addr,
            suggestedParams: params,
            approvalProgram: new Uint8Array(Buffer.from(compiledApproval.result, 'base64')),
            clearProgram: new Uint8Array(Buffer.from(compiledClear.result, 'base64')),
            numGlobalInts: 0,
            numGlobalByteSlices: 0,
            numLocalInts: 0,
            numLocalByteSlices: 0,
        });

        // Sign and send transaction
        const signedTxn = appCreateTxn.signTxn(account.sk);
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

        console.log('📤 Deployment transaction sent:', txId);
        console.log('⏳ Waiting for confirmation...');

        // Wait for confirmation
        const result = await waitForConfirmation(algodClient, txId, 4);
        const appId = result['application-index'];

        console.log('✅ TrailingStopLoss contract deployed successfully!');
        console.log('📋 New App ID:', appId);
        console.log('🔗 Creator:', account.addr);
        console.log('📤 Transaction ID:', txId);
        console.log('🌐 TestNet Explorer:', `https://testnet.algoexplorer.io/application/${appId}`);
        console.log('🌐 Transaction Explorer:', `https://testnet.algoexplorer.io/tx/${txId}`);

        return {
            appId: appId,
            creator: account.addr,
            txId: txId
        };

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

// Run deployment
deployContract()
    .then(result => {
        console.log('\n🎉 Deployment completed successfully!');
        console.log('New App ID:', result.appId);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Deployment failed:', error.message);
        process.exit(1);
    });