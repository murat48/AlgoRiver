// ALGO API Test
async function testAlgoAPI() {
    try {
        console.log('🔍 Testing CoinGecko API...')

        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true')

        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('🎯 Full API Response:', data)

        if (data.algorand) {
            console.log('✅ ALGO Price:', data.algorand.usd)
            console.log('📊 24h Change:', data.algorand.usd_24h_change)
            console.log('📈 Volume:', data.algorand.usd_24h_vol)
            console.log('💰 Market Cap:', data.algorand.usd_market_cap)
        } else {
            console.error('❌ No algorand data in response')
        }

    } catch (error) {
        console.error('❌ API Test Failed:', error)
    }
}

testAlgoAPI()