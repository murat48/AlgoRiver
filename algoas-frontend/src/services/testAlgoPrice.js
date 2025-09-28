/**
 * Test script to verify ALGO price fetching
 * Run this to test the API integration
 */

import { TrailingStopDataService } from './trailingStopDataService.ts'

async function testAlgoPrice() {
    console.log('🧪 Testing ALGO price fetching...')

    const service = new TrailingStopDataService()

    try {
        // Wait a moment for initial price fetch
        await new Promise(resolve => setTimeout(resolve, 2000))

        const prices = service.getCurrentPrices()
        const algoPrice = prices.get('0')

        if (algoPrice) {
            console.log('✅ ALGO Price Data:')
            console.log(`   Price: $${algoPrice.price.toFixed(4)}`)
            console.log(`   24h Change: ${algoPrice.priceChange24h.toFixed(2)}%`)
            console.log(`   Volume: $${algoPrice.volume24h.toLocaleString()}`)
            console.log(`   Last Updated: ${algoPrice.lastUpdated}`)
            console.log(`   Market Cap: ${algoPrice.marketCap ? '$' + algoPrice.marketCap.toLocaleString() : 'N/A'}`)
        } else {
            console.log('❌ No ALGO price data found')
        }

        service.destroy()
    } catch (error) {
        console.error('❌ Test failed:', error)
        service.destroy()
    }
}

// Run test if called directly
if (typeof window === 'undefined') {
    testAlgoPrice()
}

export { testAlgoPrice }