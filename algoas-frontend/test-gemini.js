// Gemini API Test Script
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyCSH8AMIm3ZSoi_u5gak35scya3J9G3et0'

console.log('🧪 Testing Gemini API manually...')
console.log('🔑 API Key:', API_KEY.substring(0, 10) + '...')

try {
    console.log('🚀 Creating GoogleGenerativeAI instance...')
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    console.log('📱 Getting generative model...')
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
        }
    })
    
    console.log('📡 Making test request...')
    const result = await model.generateContent("Test connection. Please respond with 'OK'.")
    const response = await result.response
    const text = response.text()
    
    console.log('✅ SUCCESS!')
    console.log('📄 Response:', text)
    
} catch (error) {
    console.error('❌ ERROR!')
    console.error('📝 Error message:', error.message)
    console.error('📝 Error code:', error.code)
    console.error('📝 Error status:', error.status)
    console.error('📝 Full error:', error)
}
