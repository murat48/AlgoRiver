// List Available Gemini Models
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyCSH8AMIm3ZSoi_u5gak35scya3J9G3et0'

console.log('🔍 Listing available Gemini models...')

try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // List models
    const models = await genAI.listModels()
    
    console.log('✅ Available models:')
    models.forEach(model => {
        console.log(`📱 Model: ${model.name}`)
        console.log(`   Display Name: ${model.displayName}`)
        console.log(`   Supported Methods: ${model.supportedGenerationMethods}`)
        console.log('---')
    })
    
} catch (error) {
    console.error('❌ ERROR!')
    console.error('📝 Error message:', error.message)
    console.error('📝 Error status:', error.status)
}
