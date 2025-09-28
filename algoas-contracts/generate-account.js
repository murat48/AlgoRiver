const algosdk = require('algosdk');

function generateTestnetAccount() {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

    console.log('🆕 New TestNet Account Generated:');
    console.log(`📍 Address: ${account.addr}`);
    console.log(`🔑 Mnemonic: ${mnemonic}`);
    console.log('\n✅ Save this mnemonic safely!');
    console.log('💰 Get TestNet ALGO from: https://bank.testnet.algorand.network/');

    return { address: account.addr, mnemonic };
}

generateTestnetAccount();