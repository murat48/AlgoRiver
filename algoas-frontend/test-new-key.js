// Test New Gemini API Key
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyCU7CaofF79Nr0SKmBaGTww6oaqas8v3Ww'

console.log('🧪 Testing NEW Gemini API key...')
console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...')

try {
    console.log('🚀 Creating GoogleGenerativeAI instance...')
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    console.log('📱 Getting generative model...')
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    console.log('📡 Making test request...')
    const result = await model.generateContent("Test connection. Please respond with 'OK'.")
    const response = await result.response
    const text = response.text()
    
    console.log('✅ SUCCESS!')
    console.log('📄 Response:', text)
    
} catch (error) {
    console.error('❌ ERROR!')
    console.error('📝 Error message:', error.message)
    console.error('📝 Error status:', error.status)
}
