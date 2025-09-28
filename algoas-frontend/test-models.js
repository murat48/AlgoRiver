// Test Different Model Names
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyCSH8AMIm3ZSoi_u5gak35scya3J9G3et0'

const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
    'gemini-pro-vision',
    'models/gemini-pro',
    'models/gemini-1.5-flash'
]

console.log('🧪 Testing different model names...')

for (const modelName of modelsToTest) {
    try {
        console.log(`\n🔍 Testing model: ${modelName}`)
        const genAI = new GoogleGenerativeAI(API_KEY)
        const model = genAI.getGenerativeModel({ model: modelName })
        
        const result = await model.generateContent("Test")
        const response = await result.response
        const text = response.text()
        
        console.log(`✅ SUCCESS with ${modelName}!`)
        console.log(`📄 Response: ${text.substring(0, 50)}...`)
        break
        
    } catch (error) {
        console.log(`❌ FAILED with ${modelName}: ${error.message.split('[')[0]}`)
    }
}
