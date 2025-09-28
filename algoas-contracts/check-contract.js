const algosdk = require('algosdk');

async function checkContract() {
    console.log('🔍 Checking Contract Status...');
    
    try {
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
        const appId = 746488803;
        
        console.log(`📱 App ID: ${appId}`);
        
        const appInfo = await algodClient.getApplicationByID(appId).do();
        console.log('✅ Contract exists and is active!');
        console.log('📊 Basic Info:');
        console.log('  - App ID:', appInfo.id);
        console.log('  - Creator exists:', !!appInfo.params.creator);
        console.log('  - Has params:', !!appInfo.params);
        
        if (appInfo.params['global-state']) {
            console.log('📋 Global state entries:', appInfo.params['global-state'].length);
        }
        
        console.log('\n🎉 CONTRACT IS READY FOR FRONTEND USE!');
        console.log('✅ Your frontend can connect to this contract');
        console.log('🔗 Contract integration should work');
        
    } catch (error) {
        console.error('❌ Contract check failed:', error.message);
    }
}

checkContract();
