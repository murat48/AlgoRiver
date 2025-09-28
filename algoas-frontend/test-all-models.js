// Test All Possible Model Names
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyCU7CaofF79Nr0SKmBaGTww6oaqas8v3Ww'

const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro', 
    'gemini-1.0-pro',
    'gemini-pro-vision',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-001',
    'gemini-1.0-pro-001',
    'models/gemini-pro',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-1.0-pro'
]

console.log('🧪 Testing ALL possible model names with new API key...')

for (const modelName of modelsToTest) {
    try {
        console.log(`\n🔍 Testing: ${modelName}`)
        const genAI = new GoogleGenerativeAI(API_KEY)
        const model = genAI.getGenerativeModel({ model: modelName })
        
        const result = await model.generateContent("Hi")
        const response = await result.response
        const text = response.text()
        
        console.log(`✅ SUCCESS! Model: ${modelName}`)
        console.log(`📄 Response: ${text.substring(0, 100)}...`)
        break
        
    } catch (error) {
        const shortError = error.message.split('[')[0].trim()
        console.log(`❌ ${modelName}: ${shortError}`)
    }
}
